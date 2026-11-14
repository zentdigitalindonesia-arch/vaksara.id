// Fungsi server "xendit-webhook": menerima pemberitahuan Xendit (tagihan dibayar/kedaluwarsa, pencairan berhasil/gagal).
// Keaslian diperiksa dengan token webhook (x-callback-token). Pembayaran juga dicek ulang langsung ke API Xendit
// sebelum dicatat, sehingga isi pemberitahuan palsu tidak dapat menambah saldo. Setiap pemberitahuan aman diterima berulang.
import { type FlowAction } from "../../../src/utils/cooperation.ts";
import { database, enc, Fail, json, queuePayout, recordGateway, xendit, type Env, type Payout } from "../_shared/escrow.ts";

type EscrowPayment = { id: string; case_id: string; couple_id: string; vendor_id: string; amount: number; fee: number; held: number; mode: string; status: string; invoice_id: string | null; applied: boolean; method: string };
type Invoice = { id: string; external_id: string; status: string; amount: number; paid_amount?: number; payment_method?: string; payment_channel?: string; bank_code?: string };

function sameToken(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function handle(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json(405, { message: "Metode tidak didukung." });
  const expected = env("XENDIT_CALLBACK_TOKEN");
  if (!expected) return json(503, { message: "Token webhook belum dipasang." });
  if (!sameToken(req.headers.get("x-callback-token") ?? "", expected)) return json(401, { message: "Token webhook tidak cocok." });
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const db = database(env("SUPABASE_URL").replace(/\/+$/, ""), env("SUPABASE_SERVICE_ROLE_KEY"));

    // ---------- Pencairan (Payouts v2: event payout.*; Disbursement lama: external_id + COMPLETED/FAILED) ----------
    const event = String(body.event ?? "");
    if (event.startsWith("payout.") || (body.external_id && ["COMPLETED", "FAILED"].includes(String(body.status)) && !body.paid_amount)) {
      const d = (event ? body.data : body) as Record<string, unknown>;
      const ref = String(d?.reference_id ?? d?.external_id ?? "");
      const [p] = await db<Payout[]>(`escrow_payouts?select=*&id=eq.${enc(ref)}`);
      if (!p) return json(200, { ignored: "pencairan tidak dikenal" });
      const ok = event === "payout.succeeded" || String(d.status) === "SUCCEEDED" || String(d.status) === "COMPLETED";
      const failed = event === "payout.failed" || event === "payout.reversed" || String(d.status) === "FAILED" || String(d.status) === "REVERSED";
      if (!ok && !failed) return json(200, { ignored: event || String(d.status) });
      if (p.status === "succeeded" && ok) return json(200, { duplicate: true });
      await db(`escrow_payouts?id=eq.${enc(p.id)}`, { method: "PATCH", body: ok ? { status: "succeeded", failure: "", updated_at: new Date().toISOString() } : { status: "failed", failure: String(d.failure_code ?? "Transfer gagal").slice(0, 300), updated_at: new Date().toISOString() }, prefer: "return=minimal" });
      return json(200, { payout: p.id, status: ok ? "succeeded" : "failed" });
    }

    // ---------- Tagihan (Invoice): PAID / SETTLED / EXPIRED ----------
    const externalId = String(body.external_id ?? ""), invoiceId = String(body.id ?? "");
    if (!externalId || !invoiceId) return json(200, { ignored: "bukan pemberitahuan VAKSARA" });
    const [pay] = await db<EscrowPayment[]>(`escrow_payments?select=*&id=eq.${enc(externalId)}`);
    if (!pay) return json(200, { ignored: "tagihan tidak dikenal" });
    if (pay.invoice_id && pay.invoice_id !== invoiceId) throw new Fail(400, "Nomor tagihan tidak cocok.");

    // Jangan percaya isi pemberitahuan: tanyakan status tagihan langsung ke Xendit.
    const inv = await xendit(env)<Invoice>(`/v2/invoices/${enc(invoiceId)}`);
    if (inv.external_id !== pay.id) throw new Fail(400, "Tagihan Xendit tidak cocok dengan catatan VAKSARA.");
    if (inv.status === "EXPIRED") {
      await db(`escrow_payments?id=eq.${enc(pay.id)}&status=eq.pending`, { method: "PATCH", body: { status: "expired" }, prefer: "return=minimal" });
      return json(200, { payment: pay.id, status: "expired" });
    }
    if (!["PAID", "SETTLED"].includes(inv.status)) return json(200, { ignored: inv.status });
    const paid = Number(inv.paid_amount ?? inv.amount);
    if (paid < pay.amount + pay.fee) throw new Fail(400, "Nominal yang dibayar kurang dari tagihan.");

    const method = [inv.payment_method, inv.bank_code || inv.payment_channel].filter(Boolean).join(" ");
    if (pay.status === "pending" || pay.status === "expired" || pay.status === "failed") {
      await db(`escrow_payments?id=eq.${enc(pay.id)}&status=eq.${enc(pay.status)}`, { method: "PATCH", body: { status: "paid", paid_at: new Date().toISOString(), method }, prefer: "return=minimal" });
    }
    if (!pay.applied) {
      const action: FlowAction = { type: "gateway_paid", actor: "system", caseId: pay.case_id, id: pay.id, time: new Date().toISOString(), data: { amount: pay.amount, held: pay.held, proof: `Xendit ${method || "invoice"} ${invoiceId}`.trim() } };
      await recordGateway(db, pay.case_id, action);
      await db(`escrow_payments?id=eq.${enc(pay.id)}`, { method: "PATCH", body: { applied: true }, prefer: "return=minimal" });
    }
    // Bagian yang tidak ditahan langsung diteruskan ke rekening pelaku (sekali saja per pembayaran).
    await queuePayout(db, env, { id: `${pay.id}-langsung`, case_id: pay.case_id, couple_id: pay.couple_id, vendor_id: pay.vendor_id, kind: "direct", recipient: "vendor", gross: pay.amount - pay.held, note: "Bagian pembayaran yang langsung diteruskan sesuai perjanjian" });
    return json(200, { payment: pay.id, status: "paid" });
  } catch (e) {
    // 5xx agar Xendit mengirim ulang bila basis data/Xendit sedang bermasalah; 4xx untuk data yang memang salah.
    const status = e instanceof Fail ? e.status : 500;
    return json(status, { message: e instanceof Error ? e.message : "Gagal memproses." });
  }
}
