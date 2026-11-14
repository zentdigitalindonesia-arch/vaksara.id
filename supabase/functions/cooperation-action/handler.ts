// Fungsi server "cooperation-action": satu-satunya jalan mengubah tabel cooperations.
// Pihak yang bertindak ditentukan dari akun yang masuk (bukan dari isian browser), lalu langkah diperiksa dengan
// mesin aturan yang sama dengan aplikasi (src/utils/cooperation.ts). Berkas ini sumbernya; index.ts dibuat oleh
// scripts/build-edge-functions.mjs agar dapat ditempel utuh di editor Supabase.
import { amanahShare, heldPart, isAmanah, reservedTotal, transitionFlow, type Actor, type Flow, type FlowAction } from "../../../src/utils/cooperation.ts";
import { account, CORS, database, enc, Fail, flushVendorPayouts, json, MIN_NET, paymentFee, queuePayout, sendPayout, xendit, type BankAccount, type Env, type Payout, type Row } from "../_shared/escrow.ts";

type Profile = { id: string; role: "couple" | "vendor"; full_name: string; is_admin: boolean };
type Listing = { id: string; name: string; review_status: string; published: boolean; identity_ok: boolean; culture_ok: boolean; consent_ok: boolean };
type Body = { caseId?: string; vendorId?: string; requestId?: string; vendorName?: string; actor?: Actor; action?: { type?: string; id?: string; data?: Record<string, unknown> } };
type EscrowPayment = { id: string; case_id: string; amount: number; fee: number; held: number; status: string; invoice_url: string | null; expires_at: string | null };
const BANK = /^ID_[A-Z0-9_]{2,30}$/, ACCOUNT = /^[0-9]{5,20}$/;
const OPEN_PHASES = ["active", "running", "handover", "revision", "accepted"];

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

    // Memilih pelaku dari permintaan terbuka: buat kerja sama, kirim permintaan, dan tutup permintaan terbuka dalam satu langkah.
    if (type === "choose_open") {
      if (me.role !== "couple") throw new Fail(403, "Hanya akun keluarga yang dapat memilih pelaku.");
      const [request] = await db<{ id: string; owner_id: string; status: string; title: string; detail: string; event_date: string }[]>(`open_requests?select=id,owner_id,status,title,detail,event_date&id=eq.${enc(String(body.requestId ?? ""))}`);
      if (!request || request.owner_id !== me.id) throw new Fail(404, "Permintaan terbuka tidak ditemukan.");
      if (request.status !== "open") throw new Fail(400, "Permintaan terbuka ini sudah ditutup.");
      const [response] = await db<{ vendor_id: string }[]>(`open_request_responses?select=vendor_id&request_id=eq.${enc(request.id)}&vendor_name=eq.${enc(String(body.vendorName ?? ""))}`);
      if (!response) throw new Fail(400, "Pelaku ini belum mengajukan minat pada permintaan Anda.");
      const [listing] = await db<Listing[]>(`vendor_listings?select=id,name,review_status,published&id=eq.${enc(response.vendor_id)}`);
      if (!listing || !listing.published || listing.review_status !== "approved") throw new Fail(400, "Pelaku ini sedang ditinjau ulang sehingga belum dapat dipilih.");
      let flow: Flow = { schema: 1, accounts: { couple: account(me.full_name || "Keluarga"), vendor: null }, vendorReview: { identity: false, culture: false, consent: false }, cases: [], catalog: [listing.name] };
      flow = transitionFlow(flow, { type: "lead", actor: "couple", id, time, data: { vendor: listing.name, date: data.date ?? request.event_date, request: data.request ?? `${request.title}. ${request.detail} (dari permintaan terbuka)` } });
      flow = transitionFlow(flow, { type: "submit", actor: "couple", caseId: id, id: `${id}-kirim`, time, data: {} });
      const item = flow.cases[0];
      const [row] = await db<Row[]>("cooperations", { method: "POST", body: { id: item.id, couple_id: me.id, vendor_id: listing.id, phase: item.phase, data: item }, prefer: "return=representation" });
      const closed = await db<unknown[]>(`open_requests?id=eq.${enc(request.id)}&status=eq.open`, { method: "PATCH", body: { status: "closed", chosen: listing.name, case_id: item.id }, prefer: "return=representation" });
      if (!closed.length) {
        await db(`cooperations?id=eq.${enc(item.id)}`, { method: "DELETE", prefer: "return=minimal" });
        throw new Fail(409, "Permintaan terbuka ini baru saja ditutup dari perangkat lain.");
      }
      return json(200, { row });
    }

    // ---------- Peninjau: kirim / kirim ulang pencairan, setujui rekening lalu kirim yang tertunda ----------
    if (type === "admin_payout") {
      if (!me.is_admin) throw new Fail(403, "Khusus peninjau VAKSARA.");
      const payout = await sendPayout(db, env, String(data.payoutId ?? ""), { admin: true });
      if (!payout) throw new Fail(404, "Pencairan tidak ditemukan atau sedang diproses.");
      return json(200, { payout });
    }
    if (type === "flush_vendor_payouts") {
      if (!me.is_admin) throw new Fail(403, "Khusus peninjau VAKSARA.");
      return json(200, { sent: await flushVendorPayouts(db, env, String(data.vendorId ?? "")) });
    }

    // ---------- Keluarga: isi rekening tujuan refund Dana Amanah (diperiksa peninjau sebelum dikirim) ----------
    if (type === "refund_account") {
      const [p] = await db<Payout[]>(`escrow_payouts?select=*&id=eq.${enc(String(data.payoutId ?? ""))}`);
      if (!p || p.couple_id !== me.id || p.recipient !== "couple") throw new Fail(404, "Refund tidak ditemukan.");
      if (!["awaiting_account", "awaiting_admin", "failed"].includes(p.status)) throw new Fail(400, "Refund ini sudah diproses.");
      const bank = String(data.bankCode ?? ""), number = String(data.accountNumber ?? "").replace(/\s+/g, ""), holder = String(data.holderName ?? "").trim();
      if (!BANK.test(bank) || !ACCOUNT.test(number) || holder.length < 3 || holder.length > 100) throw new Fail(400, "Lengkapi bank, nomor rekening (angka), dan nama pemilik rekening.");
      const [row] = await db<Payout[]>(`escrow_payouts?id=eq.${enc(p.id)}`, { method: "PATCH", body: { bank_code: bank, account_number: number, holder_name: holder, status: "awaiting_admin", failure: "", updated_at: time }, prefer: "return=representation" });
      return json(200, { payout: row });
    }

    const caseId = String(body.caseId ?? "");

    // ---------- Keluarga: bayar lewat tagihan Xendit (Dana Amanah penuh atau sebagian) ----------
    if (type === "pay_invoice") {
      const [row] = await db<Row[]>(`cooperations?select=*&id=eq.${enc(caseId)}`);
      if (!row) throw new Fail(404, "Kerja sama tidak ditemukan.");
      if (row.couple_id !== me.id) throw new Fail(403, "Hanya keluarga dalam kerja sama ini yang dapat membayar.");
      const item = row.data;
      if (!isAmanah(item) || !item.offer) throw new Fail(400, "Perjanjian ini memakai transfer langsung ke pelaku.");
      if (!OPEN_PHASES.includes(row.phase)) throw new Fail(400, "Pembayaran belum dibuka atau sedang dihentikan (mis. selama sengketa).");
      const amount = Number(data.amount);
      if (!Number.isSafeInteger(amount) || amount < MIN_NET) throw new Fail(400, `Nominal minimal ${MIN_NET.toLocaleString("id-ID")} rupiah, bilangan bulat.`);
      // Tagihan lama yang belum dibayar ikut dihitung agar total tidak melebihi nilai perjanjian.
      const pending = await db<EscrowPayment[]>(`escrow_payments?select=id,amount,expires_at,status&case_id=eq.${enc(row.id)}&status=eq.pending`);
      const open = pending.filter(p => !p.expires_at || Date.parse(p.expires_at) > Date.now());
      if (amount + reservedTotal(item) + open.reduce((a, p) => a + p.amount, 0) > item.offer.price) throw new Fail(400, "Nominal melebihi sisa nilai perjanjian (termasuk tagihan yang belum dibayar).");
      const [bank] = await db<BankAccount[]>(`vendor_bank_accounts?select=status&vendor_id=eq.${enc(row.vendor_id)}`);
      if (amanahShare(item.offer) < 100 && bank?.status !== "approved") throw new Fail(400, "Rekening pencairan pelaku belum disetujui peninjau, jadi bagian yang langsung diteruskan belum dapat dikirim. Coba lagi nanti.");
      const fee = paymentFee(env), held = heldPart(item.offer, amount);
      await db("escrow_payments", { method: "POST", body: { id, case_id: row.id, couple_id: row.couple_id, vendor_id: row.vendor_id, amount, fee, held, mode: item.offer.paymentMode }, prefer: "return=minimal" });
      const site = (env("SITE_URL") || "https://vaksara.id").replace(/\/+$/, "");
      const methods = (env("XENDIT_PAYMENT_METHODS") || "BCA,BNI,BRI,MANDIRI,PERMATA,BSI").split(",").map(m => m.trim()).filter(Boolean);
      try {
        const inv = await xendit(env)<{ id: string; invoice_url: string; expiry_date?: string }>("/v2/invoices", { method: "POST", body: {
          external_id: id, amount: amount + fee, currency: "IDR", invoice_duration: 86400,
          description: `VAKSARA · ${row.vendor_name} · ${item.offer.paymentMode === "amanah" ? "Dana Amanah" : `Dana Amanah ${amanahShare(item.offer)}%`}`.slice(0, 250),
          fees: fee > 0 ? [{ type: "Biaya pembayaran", value: fee }] : undefined,
          payment_methods: methods.length ? methods : undefined,
          success_redirect_url: `${site}/#/planner/alur?case=${enc(row.id)}`, failure_redirect_url: `${site}/#/planner/alur?case=${enc(row.id)}`,
        } });
        const [payment] = await db<EscrowPayment[]>(`escrow_payments?id=eq.${enc(id)}`, { method: "PATCH", body: { invoice_id: inv.id, invoice_url: inv.invoice_url, expires_at: inv.expiry_date ?? new Date(Date.now() + 86400e3).toISOString() }, prefer: "return=representation" });
        return json(200, { payment });
      } catch (e) {
        await db(`escrow_payments?id=eq.${enc(id)}`, { method: "PATCH", body: { status: "failed" }, prefer: "return=minimal" });
        throw e;
      }
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const [row] = await db<Row[]>(`cooperations?select=*&id=eq.${enc(caseId)}`);
      if (!row) throw new Fail(404, "Kerja sama tidak ditemukan.");
      const actor: Actor | null = row.couple_id === me.id ? "couple" : row.vendor_id === me.id ? "vendor" : me.is_admin ? "admin" : null;
      if (!actor) throw new Fail(403, "Anda bukan pihak dalam kerja sama ini.");
      if (body.actor && body.actor !== actor) throw new Fail(403, "Tindakan ini milik pihak lain.");
      if (type === "payment" && isAmanah(row.data)) throw new Fail(400, "Perjanjian ini dibayar lewat tagihan VAKSARA (Xendit), bukan catatan transfer manual.");
      if (type === "gateway_paid") throw new Fail(403, "Hanya sistem pembayaran yang dapat mencatat pembayaran gateway.");
      if (type === "offer" && (data.paymentMode === "amanah" || data.paymentMode === "split")) {
        if (!env("XENDIT_SECRET_KEY")) throw new Fail(400, "Dana Amanah belum diaktifkan di VAKSARA. Gunakan transfer langsung.");
        const [bank] = await db<BankAccount[]>(`vendor_bank_accounts?select=status&vendor_id=eq.${enc(row.vendor_id)}`);
        if (bank?.status !== "approved") throw new Fail(400, "Untuk Dana Amanah, lengkapi rekening pencairan dan buku rekening di halaman Profil, lalu tunggu disetujui peninjau.");
      }
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
      if (saved.length) {
        await afterSave(db, env, row, saved[0], type, id);
        return json(200, { row: saved[0] });
      }
    }
    throw new Fail(409, "Kerja sama ini baru saja diperbarui pihak lain. Data terbaru sudah dimuat; silakan periksa lalu ulangi langkah Anda.");
  } catch (e) {
    if (e instanceof Fail) return json(e.status, { message: e.message });
    return json(400, { message: e instanceof Error ? e.message : "Tindakan ditolak." });
  }
}

/** Dana keluar setelah langkah tersimpan: pencairan yang disetujui dua pihak, atau pembagian dana saat pembatalan disepakati. */
async function afterSave(db: ReturnType<typeof database>, env: Env, before: Row, after: Row, type: string, id: string): Promise<void> {
  if (!isAmanah(after.data)) return;
  const base = { case_id: after.id, couple_id: after.couple_id, vendor_id: after.vendor_id };
  if (type === "approve_release") {
    const amount = (after.data.amanah?.released ?? 0) - (before.data.amanah?.released ?? 0);
    await queuePayout(db, env, { ...base, id: `${after.id}-rel-${id}`, kind: "release", recipient: "vendor", gross: amount, note: "Pencairan Dana Amanah disetujui dua pihak" });
  }
  if (type === "approve_cancel" && after.phase === "cancelled") {
    const refund = (after.data.amanah?.refunded ?? 0) - (before.data.amanah?.refunded ?? 0);
    const rest = (after.data.amanah?.released ?? 0) - (before.data.amanah?.released ?? 0);
    await queuePayout(db, env, { ...base, id: `${after.id}-refund-${id}`, kind: "refund", recipient: "couple", gross: refund, note: "Refund Dana Amanah sesuai kesepakatan pembatalan" });
    await queuePayout(db, env, { ...base, id: `${after.id}-sisa-${id}`, kind: "remainder", recipient: "vendor", gross: rest, note: "Sisa Dana Amanah setelah pembatalan disepakati" });
  }
}
