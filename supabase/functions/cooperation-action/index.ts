// BERKAS HASIL SUSUNAN — jangan diubah langsung. Sumber: src/utils/cooperation.ts,
// supabase/functions/_shared/escrow.ts, dan supabase/functions/cooperation-action/handler.ts.
// Susun ulang: node scripts/build-edge-functions.mjs
// Tempel seluruh isi berkas ini di Supabase → Edge Functions → cooperation-action.

// ===== Mesin aturan kerja sama (src/utils/cooperation.ts) =====
// Deterministic business-flow model for the offline demo. Never use as server authorization.
export type Actor = "couple" | "vendor" | "admin";
export type Phase = "draft" | "inquiry" | "replied" | "offered" | "contract" | "active" | "running" | "handover" | "revision" | "accepted" | "completed" | "disputed" | "cancel_pending" | "refund_due" | "refund_sent" | "cancelled" | "declined";
export const phaseLabels: Record<Phase, string> = { draft: "Draf kebutuhan", inquiry: "Permintaan terkirim (demo)", replied: "Diskusi kebutuhan", offered: "Penawaran tersedia", contract: "Persetujuan versi perjanjian", active: "Perjanjian disepakati", running: "Pelaksanaan", handover: "Menunggu tinjauan BAST", revision: "Perbaikan diminta", accepted: "BAST diterima; periksa keuangan", completed: "Kerja sama ditutup", disputed: "Sengketa; menunggu mediasi", cancel_pending: "Usulan pembatalan", refund_due: "Pengembalian dana perlu dicatat", refund_sent: "Menunggu konfirmasi penerimaan refund", cancelled: "Dibatalkan", declined: "Permintaan ditolak" };
export type Account = { name: string; email: string; phone: string; demoOnly: true };
// paymentMode adalah bagian dari versi perjanjian, sehingga cara pembayaran ikut disetujui kedua pihak.
// "direct": keluarga transfer langsung ke pelaku, pelaku mengonfirmasi (uang tidak lewat VAKSARA).
// "amanah": seluruh pembayaran lewat payment gateway dan DITAHAN; cair hanya dengan persetujuan dua pihak.
// "split": pembayaran lewat payment gateway; amanahPercent % ditahan, sisanya langsung diteruskan ke rekening pelaku.
export type PaymentMode = "direct" | "amanah" | "split";
export type Offer = { version: number; price: number; deposit: number; scope: string; terms: string; days: { date: string; location: string }[]; paymentMode?: PaymentMode; amanahPercent?: number };
export type Payment = { id: string; amount: number; proof: string; status: "pending" | "confirmed" | "rejected"; via?: PaymentMode; held?: number };
export type Amanah = { held: number; released: number; refunded: number; release?: { amount: number; by: "couple" | "vendor"; note: string } };
export type Cooperation = { id: string; vendor: string; request: string; eventDate: string; phase: Phase; offer: Offer | null; offerVersions?: Offer[]; approvals: { couple: boolean; vendor: boolean }; payments: Payment[]; amanah?: Amanah; reply: string; evidence: string; reviewNote: string; resume?: Phase; cancellation?: { refund: number; couple: boolean; vendor: boolean; proof: string; fromDispute?: boolean }; history: { id: string; actor: Actor | "system"; action: string; time: string; version: number | null }[] };
// catalog: nama pelaku contoh yang sudah dipublikasikan di direktori demo; permintaan boleh dikirim kepada mereka,
// tetapi hanya identitas vendor yang terdaftar di browser ini yang dapat merespons.
export type Flow = { schema: 1; accounts: { couple: Account | null; vendor: Account | null }; vendorReview: { identity: boolean; culture: boolean; consent: boolean }; cases: Cooperation[]; catalog?: string[] };
// "system": peristiwa dari payment gateway yang sudah diverifikasi server (bukan tindakan salah satu pihak).
export type FlowAction = { type: string; actor: Actor | "system"; caseId?: string; id: string; time: string; data?: Record<string, unknown> };
export const initialFlow = (): Flow => ({ schema: 1, accounts: { couple: null, vendor: null }, vendorReview: { identity: false, culture: false, consent: false }, cases: [] });
const need = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const text = (value: unknown, min = 1): string => { need(typeof value === "string" && value.trim().length >= min && value.length <= 2000, `Lengkapi teks minimal ${min} karakter (maksimal 2000).`); return (value as string).trim(); };
const integer = (value: unknown): number => { need(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000, "Nominal harus rupiah bulat antara 0 dan 1 miliar."); return value as number; };
export const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
export const confirmedTotal = (item: Cooperation): number => item.payments.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.amount, 0);
// Hari tindakan (UTC) sebagai batas bawah tanggal acara; bila waktu tindakan tidak berformat ISO, batas diabaikan.
const dayOf = (time: string): string => (/^\d{4}-\d{2}-\d{2}/.test(time) ? time.slice(0, 10) : "0000-00-00");
/** Persentase pembayaran yang ditahan di Dana Amanah: 0 (langsung), 100 (amanah penuh), atau angka yang disepakati. */
export const amanahShare = (offer: Offer | null | undefined): number => offer?.paymentMode === "amanah" ? 100 : offer?.paymentMode === "split" ? offer.amanahPercent ?? 0 : 0;
/** Bagian yang ditahan dari satu pembayaran (dibulatkan ke rupiah terdekat). */
export const heldPart = (offer: Offer | null | undefined, amount: number): number => Math.round(amount * amanahShare(offer) / 100);
/** Label cara pembayaran untuk tampilan. */
export const paymentLabel = (offer: Offer | null | undefined): string => offer?.paymentMode === "amanah" ? "Dana Amanah penuh" : offer?.paymentMode === "split" ? `Dana Amanah ${offer.amanahPercent ?? 0}%` : "Transfer langsung";
/** true bila pembayaran lewat payment gateway (amanah penuh atau sebagian). */
export const isAmanah = (item: Cooperation): boolean => item.offer?.paymentMode === "amanah" || item.offer?.paymentMode === "split";
export const amanahOf = (item: Cooperation): Amanah => item.amanah ?? { held: 0, released: 0, refunded: 0 };
export const reservedTotal = (item: Cooperation): number => item.payments.filter(p => p.status !== "rejected").reduce((sum, p) => sum + p.amount, 0);
export function transitionFlow(source: Flow, action: FlowAction): Flow {
  const flow = structuredClone(source);
  const d = action.data ?? {};
  const own = (actor: Actor) => need(action.actor === actor, "Tindakan ini milik pihak lain.");
  if (action.type === "register") {
    need(action.actor !== "admin", "Admin bukan pihak perjanjian.");
    need(d.contactDemoPassed === true && d.consent === true, "Selesaikan kedua simulasi OTP dan persetujuan penggunaan data demo.");
    const name = text(d.name), email = text(d.email), phone = text(d.phone);
    need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && /^\+628\d{8,11}$/.test(phone), "Kontak demo tidak valid.");
    need(!flow.accounts[action.actor as "couple" | "vendor"], "Pendaftaran demo sudah tercatat; reset diperlukan untuk mengganti identitas skenario.");
    flow.accounts[action.actor as "couple" | "vendor"] = { name, email, phone, demoOnly: true }; return flow;
  }
  if (action.type === "review_vendor") { own("admin"); need(flow.accounts.vendor, "Vendor perlu menyelesaikan pendaftaran demo."); need(d.identity === true && d.culture === true && d.consent === true, "Catat pemeriksaan identitas, konteks budaya, dan persetujuan publikasi secara terpisah."); flow.vendorReview = { identity: true, culture: true, consent: true }; return flow; }
  if (action.type === "lead") {
    own("couple"); need(!flow.cases.some(c => c.id === action.id), "Permintaan duplikat."); need(validDate(d.date), "Tanggal kebutuhan tidak valid."); need((d.date as string) >= dayOf(action.time), "Tanggal acara sudah lewat. Pilih hari ini atau sesudahnya.");
    flow.cases.unshift({ id: action.id, vendor: text(d.vendor), request: text(d.request, 10), eventDate: d.date as string, phase: "draft", offer: null, approvals: { couple: false, vendor: false }, payments: [], reply: "", evidence: "", reviewNote: "", history: [{ id: action.id, actor: action.actor, action: "lead", time: action.time, version: null }] }); return flow;
  }
  const c = flow.cases.find(c => c.id === action.caseId); need(c, "Kerja sama tidak ditemukan."); const item = c!;
  need(!item.history.some(h => h.id === action.id), "Tindakan yang sama sudah diproses.");
  const at = (...phases: Phase[]) => need(phases.includes(item.phase), "Langkah ini belum tersedia atau sudah selesai.");
  const participant = () => need(action.actor !== "admin", "Admin tidak dapat bertindak sebagai salah satu pihak.");
  const registered = () => { participant(); need(flow.accounts[action.actor as "couple" | "vendor"], "Pihak ini belum menyelesaikan pendaftaran demo."); if (action.actor === "vendor") need(flow.accounts.vendor!.name === item.vendor, "Permintaan ini ditujukan kepada vendor lain."); };
  const listed = () => need((flow.accounts.vendor?.name === item.vendor && Object.values(flow.vendorReview).every(Boolean)) || (flow.catalog ?? []).includes(item.vendor), "Pelaku belum terdaftar dan ditinjau sehingga belum dapat menerima permintaan (demo).");
  const vendorReady = () => need(flow.accounts.vendor && flow.accounts.vendor.name === item.vendor && Object.values(flow.vendorReview).every(Boolean), "Vendor belum selesai didaftarkan dan ditinjau (demo).");
  switch (action.type) {
    case "submit": own("couple"); registered(); listed(); at("draft"); item.phase = "inquiry"; break;
    case "reply": own("vendor"); registered(); at("inquiry"); item.reply = text(d.note, 10); item.phase = "replied"; break;
    case "decline": own("vendor"); registered(); at("inquiry", "replied"); item.reviewNote = text(d.note, 10); item.phase = "declined"; break;
    case "offer": {
      own("vendor"); registered(); vendorReady(); at("replied", "offered", "contract"); need(reservedTotal(item) === 0, "Perubahan nilai setelah pencatatan dana memerlukan amendemen terpisah.");
      const price = integer(d.price), deposit = integer(d.deposit); need(price > 0 && deposit <= price, "Harga harus positif; DP tidak boleh melebihi nilai layanan.");
      need(Array.isArray(d.days) && d.days.length > 0, "Minimal satu tanggal dan lokasi kegiatan diperlukan.");
      const days = (d.days as { date: unknown; location: unknown }[]).map(day => { need(validDate(day.date), "Tanggal rangkaian tidak valid."); need((day.date as string) >= dayOf(action.time), "Tanggal rangkaian sudah lewat."); return { date: day.date as string, location: text(day.location) }; }).sort((a, b) => a.date.localeCompare(b.date));
      const priorVersions = item.offerVersions ?? (item.offer ? [structuredClone(item.offer)] : []);
      const paymentMode: PaymentMode = d.paymentMode === "amanah" || d.paymentMode === "split" ? d.paymentMode : "direct";
      if (paymentMode === "split") need(typeof d.amanahPercent === "number" && Number.isInteger(d.amanahPercent) && d.amanahPercent >= 1 && d.amanahPercent <= 99, "Persentase Dana Amanah harus bilangan bulat 1–99.");
      item.offer = { version: (item.offer?.version ?? 0) + 1, price, deposit, scope: text(d.scope, 10), terms: text(d.terms, 10), days, paymentMode, ...(paymentMode === "split" ? { amanahPercent: d.amanahPercent as number } : {}) };
      item.offerVersions = [...priorVersions, structuredClone(item.offer)];
      item.approvals = { couple: false, vendor: false }; item.phase = "offered"; break;
    }
    case "request_offer_revision": own("couple"); registered(); at("offered", "contract"); item.reviewNote = text(d.note, 10); item.approvals = { couple: false, vendor: false }; item.phase = "replied"; break;
    case "accept_offer": own("couple"); registered(); at("offered"); need(item.offer, "Penawaran belum ada."); item.phase = "contract"; break;
    case "approve": registered(); vendorReady(); at("contract"); need(d.version === item.offer?.version && d.ack === true, "Baca dan setujui versi perjanjian yang sama."); need(!item.approvals[action.actor as "couple" | "vendor"], "Pihak ini sudah menyetujui versi tersebut."); item.approvals[action.actor as "couple" | "vendor"] = true; if (item.approvals.couple && item.approvals.vendor) item.phase = "active"; break;
    case "payment": {
      own("couple"); registered(); at("active", "running", "handover", "revision", "accepted");
      const amount = integer(d.amount); need(amount > 0 && amount + reservedTotal(item) <= item.offer!.price, "Nominal nol, melebihi sisa, atau masih ada catatan yang menunggu konfirmasi.");
      if (isAmanah(item)) {
        // Simulasi: setoran lewat virtual account langsung terkonfirmasi sistem; bagian amanah DITAHAN, sisanya diteruskan ke vendor.
        need(d.ack === true, "Setujui syarat Dana Amanah sebelum menyetor.");
        need(item.phase !== "disputed", "Setoran dihentikan selama sengketa.");
        const amanah = amanahOf(item), held = heldPart(item.offer, amount);
        item.payments.push({ id: action.id, amount, proof: `AMN-${action.id} (virtual account simulasi)`, status: "confirmed", via: item.offer!.paymentMode, held });
        item.amanah = { ...amanah, held: amanah.held + held, released: amanah.released + amount - held };
        break;
      }
      item.payments.push({ id: action.id, amount, proof: text(d.proof, 5), status: "pending", via: "direct" }); break;
    }
    case "confirm_payment": case "reject_payment": {
      own("vendor"); registered(); at("active", "running", "handover", "revision", "accepted");
      const payment = item.payments.find(p => p.id === d.paymentId); need(payment?.status === "pending" && payment.via !== "amanah", "Catatan pembayaran tidak ditemukan atau sudah ditinjau.");
      payment!.status = action.type === "confirm_payment" ? "confirmed" : "rejected"; break;
    }
    case "start": own("vendor"); registered(); at("active"); need(confirmedTotal(item) >= item.offer!.deposit, "DP yang disepakati belum dikonfirmasi diterima vendor."); item.phase = "running"; break;
    case "handover": own("vendor"); registered(); at("running", "revision"); item.evidence = text(d.proof, 10); item.phase = "handover"; break;
    case "request_revision": own("couple"); registered(); at("handover"); item.reviewNote = text(d.note, 10); item.phase = "revision"; break;
    case "accept_handover": own("couple"); registered(); at("handover"); need(d.ack === true, "Periksa hasil layanan sebelum menerima BAST demo."); item.phase = "accepted"; break;
    case "complete": registered(); at("accepted"); need(!isAmanah(item) || (amanahOf(item).held === 0 && !amanahOf(item).release), "Masih ada Dana Amanah yang ditahan. Ajukan pencairan dan minta persetujuan pihak lain."); need(confirmedTotal(item) === item.offer!.price && !item.payments.some(p => p.status === "pending"), "BAST diterima, tetapi keuangan belum selesai."); item.phase = "completed"; break;
    case "propose_release": {
      registered(); need(action.actor !== "admin", "Pencairan hanya dapat diusulkan pengguna atau vendor."); need(isAmanah(item), "Perjanjian ini tidak memakai Dana Amanah.");
      at("active", "running", "handover", "revision", "accepted"); const amanah = amanahOf(item); need(!amanah.release, "Masih ada usulan pencairan yang menunggu jawaban.");
      const amount = integer(d.amount); need(amount > 0 && amount <= amanah.held, "Nominal pencairan harus positif dan tidak melebihi dana yang ditahan.");
      item.amanah = { ...amanah, release: { amount, by: action.actor as "couple" | "vendor", note: text(d.note, 10) } }; break;
    }
    case "approve_release": case "reject_release": {
      registered(); need(action.actor !== "admin", "Admin tidak dapat mencairkan dana sepihak."); const amanah = amanahOf(item);
      need(!!amanah.release && amanah.release.by !== action.actor, "Jawaban harus berasal dari pihak yang menerima usulan pencairan.");
      at("active", "running", "handover", "revision", "accepted");
      if (action.type === "approve_release") { need(d.ack === true, "Konfirmasi persetujuan pencairan diperlukan."); const amount = amanah.release!.amount; item.amanah = { held: amanah.held - amount, released: amanah.released + amount, refunded: amanah.refunded }; }
      else { item.reviewNote = text(d.note, 10); item.amanah = { held: amanah.held, released: amanah.released, refunded: amanah.refunded }; }
      break;
    }
    case "withdraw": own("vendor"); registered(); at("offered", "contract"); need(reservedTotal(item) === 0, "Ada dana yang harus direkonsiliasi."); item.reviewNote = text(d.note, 10); item.approvals = { couple: false, vendor: false }; item.phase = "cancelled"; break;
    case "cancel_early": own("couple"); registered(); at("draft", "inquiry", "replied", "offered", "contract"); need(reservedTotal(item) === 0, "Ada dana yang harus direkonsiliasi."); item.reviewNote = text(d.note, 10); item.phase = "cancelled"; break;
    case "dispute": registered(); at("active", "running", "handover", "revision", "accepted"); item.reviewNote = text(d.note, 10);
      // Sengketa membekukan Dana Amanah: usulan pencairan yang tertunda dibatalkan.
      if (item.amanah?.release) item.amanah = { held: item.amanah.held, released: item.amanah.released, refunded: item.amanah.refunded }; item.resume = item.phase; item.phase = "disputed"; break;
    case "resume": own("admin"); at("disputed"); need(item.resume, "Tahap sebelumnya tidak tersedia."); item.reply = text(d.note, 10); item.phase = item.resume!; delete item.resume; break;
    case "propose_cancel": {
      registered(); at("active", "running", "handover", "revision", "accepted", "disputed"); need(!item.payments.some(p => p.status === "pending"), "Tinjau dahulu pembayaran yang menunggu konfirmasi.");
      const refund = integer(d.refund); need(refund <= confirmedTotal(item), "Refund tidak boleh melebihi dana yang dikonfirmasi vendor.");
      if (isAmanah(item)) { need(refund <= amanahOf(item).held, "Refund dari Dana Amanah tidak boleh melebihi dana yang masih ditahan."); need(!amanahOf(item).release, "Selesaikan dahulu usulan pencairan yang tertunda."); }
      const fromDispute = item.phase === "disputed";
      if (!fromDispute) item.resume = item.phase;
      item.reviewNote = text(d.note, 10); item.cancellation = { refund, couple: action.actor === "couple", vendor: action.actor === "vendor", proof: "", fromDispute }; item.phase = "cancel_pending"; break;
    }
    case "approve_cancel": registered(); at("cancel_pending"); need(d.ack === true && !item.cancellation![action.actor as "couple" | "vendor"], "Persetujuan pihak lain diperlukan."); item.cancellation![action.actor as "couple" | "vendor"] = true;
      if (isAmanah(item)) {
        // Kedua pihak sudah sepakat: refund dikembalikan sistem ke pengguna, sisa dana yang ditahan dicairkan ke vendor.
        const amanah = amanahOf(item), refund = item.cancellation!.refund;
        item.amanah = { held: 0, released: amanah.released + amanah.held - refund, refunded: amanah.refunded + refund };
        item.cancellation!.proof = refund > 0 ? `Refund ${refund} dikembalikan otomatis dari Dana Amanah (simulasi).` : "";
        item.phase = "cancelled"; break;
      }
      item.phase = item.cancellation!.refund > 0 ? "refund_due" : "cancelled"; break;
    case "reject_cancel": registered(); at("cancel_pending"); need(!item.cancellation![action.actor as "couple" | "vendor"], "Penolakan harus berasal dari pihak penerima usulan."); item.reviewNote = text(d.note, 10);
      // Penolakan usulan batal tidak boleh menghapus sengketa: kembali ke mediasi, bukan ke tahap sebelum sengketa.
      if (item.cancellation!.fromDispute) item.phase = "disputed"; else { item.phase = item.resume ?? "active"; delete item.resume; }
      delete item.cancellation; break;
    case "record_refund": own("vendor"); registered(); at("refund_due"); item.cancellation!.proof = text(d.proof, 5); item.phase = "refund_sent"; break;
    case "confirm_refund": own("couple"); registered(); at("refund_sent"); need(d.ack === true, "Konfirmasi penerimaan refund diperlukan."); item.phase = "cancelled"; break;
    case "gateway_paid": {
      // Pembayaran nyata yang sudah dikonfirmasi payment gateway dan diperiksa server. Uang sudah diterima, jadi dicatat apa pun tahapnya.
      need(action.actor === "system", "Hanya sistem pembayaran yang dapat mencatat pembayaran gateway."); need(isAmanah(item), "Perjanjian ini tidak memakai pembayaran lewat VAKSARA.");
      const amount = integer(d.amount), held = integer(d.held); need(amount > 0 && held <= amount, "Nominal pembayaran gateway tidak valid.");
      const amanah = amanahOf(item);
      item.payments.push({ id: action.id, amount, proof: text(d.proof, 3), status: "confirmed", via: item.offer!.paymentMode, held });
      item.amanah = { ...amanah, held: amanah.held + held, released: amanah.released + amount - held };
      break;
    }
    default: throw new Error("Tindakan tidak dikenal.");
  }
  item.history.push({ id: action.id, actor: action.actor, action: action.type, time: action.time, version: item.offer?.version ?? null }); return flow;
}
export function validFlow(value: unknown): value is Flow {
  try {
    const f = value as Flow; if (f.schema !== 1 || !f.accounts || !f.vendorReview || !Array.isArray(f.cases)) return false;
    for (const actor of ["couple", "vendor"] as const) { const a = f.accounts[actor]; if (a !== null && (!a || typeof a.name !== "string" || typeof a.email !== "string" || typeof a.phone !== "string" || a.demoOnly !== true)) return false; }
    if (![f.vendorReview.identity, f.vendorReview.culture, f.vendorReview.consent].every(v => typeof v === "boolean")) return false;
    if (new Set(f.cases.map(c => c.id)).size !== f.cases.length) return false;
    if (f.catalog !== undefined && (!Array.isArray(f.catalog) || !f.catalog.every(n => typeof n === "string"))) return false;
    return f.cases.every(c => typeof c.id === "string" && typeof c.vendor === "string" && typeof c.request === "string" && typeof c.reply === "string" && typeof c.evidence === "string" && typeof c.reviewNote === "string" && validDate(c.eventDate) && c.phase in phaseLabels && typeof c.approvals.couple === "boolean" && typeof c.approvals.vendor === "boolean" && Array.isArray(c.history) && c.history.every(h => typeof h.id === "string" && typeof h.time === "string" && typeof h.action === "string" && ["couple", "vendor", "admin", "system"].includes(h.actor)) && (!c.cancellation || (Number.isSafeInteger(c.cancellation.refund) && c.cancellation.refund >= 0 && typeof c.cancellation.proof === "string")) && Array.isArray(c.payments) && c.payments.every(p => Number.isSafeInteger(p.amount) && p.amount > 0 && ["pending", "confirmed", "rejected"].includes(p.status) && typeof p.proof === "string" && (p.via === undefined || p.via === "direct" || p.via === "amanah" || p.via === "split")) && (!c.amanah || ([c.amanah.held, c.amanah.released, c.amanah.refunded].every(n => Number.isSafeInteger(n) && n >= 0) && (!c.amanah.release || (Number.isSafeInteger(c.amanah.release.amount) && c.amanah.release.amount > 0 && ["couple", "vendor"].includes(c.amanah.release.by))))) && (!c.offer || (Number.isSafeInteger(c.offer.price) && c.offer.price > 0 && c.offer.deposit >= 0 && c.offer.deposit <= c.offer.price && (c.offer.paymentMode === undefined || c.offer.paymentMode === "direct" || c.offer.paymentMode === "amanah" || (c.offer.paymentMode === "split" && Number.isInteger(c.offer.amanahPercent) && c.offer.amanahPercent! >= 1 && c.offer.amanahPercent! <= 99)) && Array.isArray(c.offer.days) && c.offer.days.every(d => validDate(d.date) && typeof d.location === "string"))));
  } catch { return false; }
}

// ===== Bagian bersama: basis data, Xendit, pencairan (supabase/functions/_shared/escrow.ts) =====
// Bagian bersama fungsi server: akses basis data (service role), klien Xendit, dan pengiriman dana keluar.
// Disusun ke dalam index.ts tiap fungsi oleh scripts/build-edge-functions.mjs.

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

// ===== Fungsi server (supabase/functions/cooperation-action/handler.ts) =====
// Fungsi server "cooperation-action": satu-satunya jalan mengubah tabel cooperations.
// Pihak yang bertindak ditentukan dari akun yang masuk (bukan dari isian browser), lalu langkah diperiksa dengan
// mesin aturan yang sama dengan aplikasi (src/utils/cooperation.ts). Berkas ini sumbernya; index.ts dibuat oleh
// scripts/build-edge-functions.mjs agar dapat ditempel utuh di editor Supabase.

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

Deno.serve(req => handle(req, key => Deno.env.get(key) ?? ""));
