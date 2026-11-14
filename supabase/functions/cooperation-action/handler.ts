// Fungsi server "cooperation-action": satu-satunya jalan mengubah tabel cooperations.
// Pihak yang bertindak ditentukan dari akun yang masuk (bukan dari isian browser), lalu langkah diperiksa dengan
// mesin aturan yang sama dengan aplikasi (src/utils/cooperation.ts). Berkas ini sumbernya; index.ts dibuat oleh
// scripts/build-edge-functions.mjs agar dapat ditempel utuh di editor Supabase.
import { transitionFlow, type Account, type Actor, type Cooperation, type Flow, type FlowAction } from "../../../src/utils/cooperation.ts";

type Env = (key: string) => string;
type Row = { id: string; couple_id: string; vendor_id: string; couple_name: string; vendor_name: string; phase: string; data: Cooperation; updated_at: string };
type Profile = { id: string; role: "couple" | "vendor"; full_name: string; is_admin: boolean };
type Listing = { id: string; name: string; review_status: string; published: boolean; identity_ok: boolean; culture_ok: boolean; consent_ok: boolean };
type Body = { caseId?: string; vendorId?: string; actor?: Actor; action?: { type?: string; id?: string; data?: Record<string, unknown> } };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class Fail extends Error { constructor(readonly status: number, message: string) { super(message); } }
const account = (name: string): Account => ({ name, email: "", phone: "", demoOnly: true });
const enc = encodeURIComponent;

function database(base: string, key: string) {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
  return async <T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> => {
    const res = await fetch(`${base}/rest/v1/${path}`, { method: init.method ?? "GET", headers: { ...headers, ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    const text = await res.text();
    let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) { const d = (data ?? {}) as Record<string, unknown>; throw new Fail(res.status >= 500 ? 502 : 400, String(d.message ?? d.hint ?? `HTTP ${res.status}`)); }
    return data as T;
  };
}

export async function handle(req: Request, env: Env): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { message: "Metode tidak didukung." });
  try {
    const base = env("SUPABASE_URL").replace(/\/+$/, ""), service = env("SUPABASE_SERVICE_ROLE_KEY");
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new Fail(401, "Sesi berakhir. Silakan masuk lagi.");
    // Akun diperiksa langsung ke Supabase Auth; token palsu atau kedaluwarsa ditolak.
    const who = await fetch(`${base}/auth/v1/user`, { headers: { apikey: req.headers.get("apikey") || env("SUPABASE_ANON_KEY") || service, Authorization: `Bearer ${token}` } });
    if (!who.ok) throw new Fail(401, "Sesi berakhir. Silakan masuk lagi.");
    const user = await who.json() as { id?: string };
    if (!user.id) throw new Fail(401, "Sesi berakhir. Silakan masuk lagi.");

    const body = await req.json().catch(() => ({})) as Body;
    const type = String(body.action?.type ?? ""), id = String(body.action?.id ?? ""), data = body.action?.data ?? {};
    if (!/^[a-z_]{2,40}$/.test(type)) throw new Fail(400, "Tindakan tidak dikenal.");
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) throw new Fail(400, "Kode tindakan tidak valid.");
    if (typeof data !== "object" || Array.isArray(data)) throw new Fail(400, "Isian tindakan tidak valid.");
    // Dana Amanah masih simulasi: tidak dibuka untuk akun nyata sampai mitra pembayaran berizin aktif.
    if (type === "offer" && data.paymentMode === "amanah") throw new Fail(400, "Dana Amanah belum tersedia di akun nyata. Gunakan transfer langsung.");

    const db = database(base, service);
    const [me] = await db<Profile[]>(`profiles?select=id,role,full_name,is_admin&id=eq.${enc(user.id)}`);
    if (!me) throw new Fail(403, "Profil akun tidak ditemukan.");
    const time = new Date().toISOString();

    if (type === "lead") {
      if (me.role !== "couple") throw new Fail(403, "Hanya akun keluarga yang dapat membuat permintaan.");
      const [listing] = await db<Listing[]>(`vendor_listings?select=id,name,review_status,published&id=eq.${enc(String(body.vendorId ?? ""))}`);
      if (!listing || !listing.published || listing.review_status !== "approved") throw new Fail(400, "Pelaku ini belum terdaftar dan ditinjau di VAKSARA sehingga belum dapat menerima permintaan.");
      const flow: Flow = { schema: 1, accounts: { couple: account(me.full_name || "Keluarga"), vendor: null }, vendorReview: { identity: false, culture: false, consent: false }, cases: [], catalog: [listing.name] };
      const event: FlowAction = { type, actor: "couple", id, time, data: { ...data, vendor: listing.name } };
      const item = transitionFlow(flow, event).cases[0];
      const [row] = await db<Row[]>("cooperations", { method: "POST", body: { id: item.id, couple_id: me.id, vendor_id: listing.id, phase: item.phase, data: item }, prefer: "return=representation" });
      return json(200, { row });
    }

    const caseId = String(body.caseId ?? "");
    for (let attempt = 0; attempt < 2; attempt++) {
      const [row] = await db<Row[]>(`cooperations?select=*&id=eq.${enc(caseId)}`);
      if (!row) throw new Fail(404, "Kerja sama tidak ditemukan.");
      const actor: Actor | null = row.couple_id === me.id ? "couple" : row.vendor_id === me.id ? "vendor" : me.is_admin ? "admin" : null;
      if (!actor) throw new Fail(403, "Anda bukan pihak dalam kerja sama ini.");
      if (body.actor && body.actor !== actor) throw new Fail(403, "Tindakan ini milik pihak lain.");
      if (type === "payment" && row.data.offer?.paymentMode === "amanah") throw new Fail(400, "Dana Amanah belum tersedia di akun nyata. Minta pelaku mengirim penawaran baru dengan transfer langsung.");
      const [listing] = await db<Listing[]>(`vendor_listings?select=id,name,review_status,published,identity_ok,culture_ok,consent_ok&id=eq.${enc(row.vendor_id)}`);
      const approved = Boolean(listing?.published && listing.review_status === "approved");
      // Profil yang ditinjau ulang setelah diubah tetap dapat melanjutkan kerja sama berjalan bila pemeriksaan terakhir lengkap;
      // permintaan baru (submit) mensyaratkan profil sedang disetujui.
      const checked = type === "submit" ? approved : Boolean(listing && ["approved", "pending"].includes(listing.review_status) && listing.identity_ok && listing.culture_ok && listing.consent_ok);
      const flow: Flow = {
        schema: 1,
        accounts: { couple: account(row.couple_name || "Keluarga"), vendor: account(row.vendor_name) },
        vendorReview: { identity: checked, culture: checked, consent: checked },
        cases: [{ ...row.data, id: row.id, vendor: row.vendor_name }],
        catalog: approved ? [row.vendor_name] : [],
      };
      const item = transitionFlow(flow, { type, actor, caseId: row.id, id, time, data }).cases[0];
      const saved = await db<Row[]>(`cooperations?id=eq.${enc(row.id)}&updated_at=eq.${enc(row.updated_at)}`, { method: "PATCH", body: { phase: item.phase, data: item }, prefer: "return=representation" });
      if (saved.length) return json(200, { row: saved[0] });
    }
    throw new Fail(409, "Kerja sama ini baru saja diperbarui pihak lain. Data terbaru sudah dimuat; silakan periksa lalu ulangi langkah Anda.");
  } catch (e) {
    if (e instanceof Fail) return json(e.status, { message: e.message });
    return json(400, { message: e instanceof Error ? e.message : "Tindakan ditolak." });
  }
}
