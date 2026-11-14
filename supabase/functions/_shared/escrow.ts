// Bagian bersama fungsi server: akses basis data (service role), klien Xendit, dan pengiriman dana keluar.
// Disusun ke dalam index.ts tiap fungsi oleh scripts/build-edge-functions.mjs.
import { transitionFlow, type Account, type Cooperation, type Flow, type FlowAction } from "../../../src/utils/cooperation.ts";

export type Env = (key: string) => string;
export type Row = { id: string; couple_id: string; vendor_id: string; couple_name: string; vendor_name: string; phase: string; data: Cooperation; updated_at: string };
export type Db = <T>(path: string, init?: { method?: string; body?: unknown; prefer?: string }) => Promise<T>;
export type Payout = { id: string; case_id: string; couple_id: string; vendor_id: string; kind: "direct" | "release" | "remainder" | "refund"; recipient: "vendor" | "couple"; gross: number; fee: number; bank_code: string | null; account_number: string | null; holder_name: string | null; status: string; attempts: number; xendit_id: string | null; failure: string; note: string };
export type BankAccount = { vendor_id: string; bank_code: string; account_number: string; holder_name: string; status: string };

export const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
export class Fail extends Error { constructor(readonly status: number, message: string) { super(message); } }
export const account = (name: string): Account => ({ name, email: "", phone: "", demoOnly: true });
export const enc = encodeURIComponent;

export function database(base: string, key: string): Db {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
  return async <T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> => {
    const res = await fetch(`${base}/rest/v1/${path}`, { method: init.method ?? "GET", headers: { ...headers, ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    const text = await res.text();
    let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) { const d = (data ?? {}) as Record<string, unknown>; throw new Fail(res.status >= 500 ? 502 : 400, String(d.message ?? d.hint ?? `HTTP ${res.status}`)); }
    return data as T;
  };
}

// ---------- Biaya (rupiah bulat; atur sesuai kontrak Xendit lewat secrets) ----------
const fee = (env: Env, key: string, fallback: number) => { const n = Number(env(key)); return Number.isSafeInteger(n) && n >= 0 ? n : fallback; };
/** Biaya bayar yang ditambahkan ke tagihan keluarga. */
export const paymentFee = (env: Env) => fee(env, "PAYMENT_FEE", 5000);
/** Biaya transfer keluar; dipotong dari jumlah yang diterima penerima. */
export const payoutFee = (env: Env) => fee(env, "PAYOUT_FEE", 5000);
/** Nominal minimum yang diterima setelah biaya, sesuai batas transfer bank. */
export const MIN_NET = 10000;

// ---------- Klien Xendit ----------
export function xendit(env: Env) {
  const secret = env("XENDIT_SECRET_KEY");
  const base = (env("XENDIT_API_BASE") || "https://api.xendit.co").replace(/\/+$/, "");
  return async <T>(path: string, init: { method?: string; body?: unknown; idempotency?: string } = {}): Promise<T> => {
    if (!secret) throw new Fail(503, "Pembayaran lewat VAKSARA belum diaktifkan (kunci Xendit belum dipasang).");
    const res = await fetch(base + path, { method: init.method ?? "GET", headers: { Authorization: "Basic " + btoa(secret + ":"), "Content-Type": "application/json", ...(init.idempotency ? { "Idempotency-key": init.idempotency } : {}) }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    const text = await res.text();
    let data: Record<string, unknown> = {}; try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!res.ok) throw new Fail(502, `Xendit: ${String(data.message ?? data.error_code ?? res.status)}`);
    return data as T;
  };
}

/** Terapkan satu perubahan pada kerja sama dengan pemeriksaan versi (updated_at); diulang sekali bila bentrok. */
export async function applyToCase(db: Db, caseId: string, change: (flow: Flow, row: Row) => Flow): Promise<Row> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [row] = await db<Row[]>(`cooperations?select=*&id=eq.${enc(caseId)}`);
    if (!row) throw new Fail(404, "Kerja sama tidak ditemukan.");
    const flow: Flow = { schema: 1, accounts: { couple: account(row.couple_name || "Keluarga"), vendor: account(row.vendor_name) }, vendorReview: { identity: true, culture: true, consent: true }, cases: [{ ...row.data, id: row.id, vendor: row.vendor_name }], catalog: [row.vendor_name] };
    const item = change(flow, row).cases[0];
    const saved = await db<Row[]>(`cooperations?id=eq.${enc(row.id)}&updated_at=eq.${enc(row.updated_at)}`, { method: "PATCH", body: { phase: item.phase, data: item }, prefer: "return=representation" });
    if (saved.length) return saved[0];
  }
  throw new Fail(409, "Kerja sama sedang diperbarui. Coba lagi.");
}

/** Catat peristiwa gateway pada kerja sama. Peristiwa yang sudah tercatat (id sama) dianggap selesai. */
export async function recordGateway(db: Db, caseId: string, action: FlowAction): Promise<void> {
  try { await applyToCase(db, caseId, flow => transitionFlow(flow, action)); }
  catch (e) { if (!(e instanceof Error && /sudah diproses/.test(e.message))) throw e; }
}

/** Buat baris pencairan (sekali saja per id) lalu coba kirim. */
export async function queuePayout(db: Db, env: Env, p: Pick<Payout, "id" | "case_id" | "couple_id" | "vendor_id" | "kind" | "recipient" | "gross" | "note"> & { status?: string }): Promise<Payout | null> {
  if (p.gross <= 0) return null;
  const status = p.status ?? (p.recipient === "couple" ? "awaiting_account" : "queued");
  await db("escrow_payouts?on_conflict=id", { method: "POST", body: { ...p, status, fee: payoutFee(env) }, prefer: "resolution=ignore-duplicates,return=minimal" });
  return sendPayout(db, env, p.id);
}

/** Kirim dana keluar lewat Xendit Payouts. Ke pelaku hanya ke rekening yang sudah disetujui peninjau. */
export async function sendPayout(db: Db, env: Env, id: string, opts: { admin?: boolean } = {}): Promise<Payout | null> {
  const [p] = await db<Payout[]>(`escrow_payouts?select=*&id=eq.${enc(id)}`);
  if (!p) return null;
  // Otomatis: hanya yang baru atau menunggu rekening. Peninjau: juga yang gagal dan refund yang sudah diperiksa.
  const sendable = ["queued", "awaiting_account"].includes(p.status) || (opts.admin && ["failed", "awaiting_admin"].includes(p.status));
  if (!sendable) return p;
  if (p.recipient === "couple" && !opts.admin) return p; // refund ke keluarga selalu diperiksa peninjau dulu
  let target = { bank_code: p.bank_code, account_number: p.account_number, holder_name: p.holder_name };
  if (p.recipient === "vendor") {
    const [bank] = await db<BankAccount[]>(`vendor_bank_accounts?select=*&vendor_id=eq.${enc(p.vendor_id)}`);
    if (!bank || bank.status !== "approved") return patchPayout(db, p, { status: "awaiting_account" });
    target = { bank_code: bank.bank_code, account_number: bank.account_number, holder_name: bank.holder_name };
  }
  if (!target.bank_code || !target.account_number || !target.holder_name) return patchPayout(db, p, { status: "awaiting_account" });
  const net = p.gross - p.fee;
  if (net < MIN_NET) return patchPayout(db, p, { status: "failed", failure: `Nominal setelah biaya di bawah ${MIN_NET}; selesaikan manual.` });
  // Kunci: tandai sedang diproses lebih dulu agar dua permintaan bersamaan tidak mengirim dua kali.
  const attempts = p.attempts + 1;
  const locked = await db<Payout[]>(`escrow_payouts?id=eq.${enc(p.id)}&status=eq.${enc(p.status)}&attempts=eq.${p.attempts}`, { method: "PATCH", body: { status: "processing", attempts, ...target, failure: "", updated_at: new Date().toISOString() }, prefer: "return=representation" });
  if (!locked.length) return null;
  try {
    const out = await xendit(env)<{ id?: string; status?: string }>("/v2/payouts", { method: "POST", idempotency: `${p.id}-${attempts}`, body: {
      reference_id: p.id, channel_code: target.bank_code, currency: "IDR", amount: net,
      channel_properties: { account_number: target.account_number, account_holder_name: target.holder_name },
      description: `VAKSARA ${p.kind === "refund" ? "refund" : "pencairan"} ${p.case_id}`.slice(0, 100),
    } });
    return patchPayout(db, locked[0], { xendit_id: out.id ?? null, ...(out.status === "SUCCEEDED" ? { status: "succeeded" } : out.status === "FAILED" ? { status: "failed", failure: "Ditolak Xendit" } : {}) });
  } catch (e) {
    return patchPayout(db, locked[0], { status: "failed", failure: e instanceof Error ? e.message.slice(0, 300) : "Gagal mengirim" });
  }
}

async function patchPayout(db: Db, p: Payout, change: Partial<Payout>): Promise<Payout> {
  const [row] = await db<Payout[]>(`escrow_payouts?id=eq.${enc(p.id)}`, { method: "PATCH", body: { ...change, updated_at: new Date().toISOString() }, prefer: "return=representation" });
  return row ?? { ...p, ...change };
}

/** Kirim ulang semua pencairan pelaku yang menunggu rekening (dipanggil setelah rekening disetujui). */
export async function flushVendorPayouts(db: Db, env: Env, vendorId: string): Promise<number> {
  const waiting = await db<Payout[]>(`escrow_payouts?select=id&vendor_id=eq.${enc(vendorId)}&recipient=eq.vendor&status=eq.awaiting_account`);
  for (const w of waiting) await sendPayout(db, env, w.id);
  return waiting.length;
}
