// Deterministic business-flow model for the offline demo. Never use as server authorization.
export type Actor = "couple" | "vendor" | "admin";
export type Phase = "draft" | "inquiry" | "replied" | "offered" | "contract" | "active" | "running" | "handover" | "revision" | "accepted" | "completed" | "disputed" | "cancel_pending" | "refund_due" | "refund_sent" | "cancelled" | "declined";
export const phaseLabels: Record<Phase, string> = { draft: "Draf kebutuhan", inquiry: "Permintaan terkirim (demo)", replied: "Diskusi kebutuhan", offered: "Penawaran tersedia", contract: "Persetujuan versi perjanjian", active: "Perjanjian disepakati", running: "Pelaksanaan", handover: "Menunggu tinjauan BAST", revision: "Perbaikan diminta", accepted: "BAST diterima; periksa keuangan", completed: "Kerja sama ditutup", disputed: "Sengketa; menunggu mediasi", cancel_pending: "Usulan pembatalan", refund_due: "Pengembalian dana perlu dicatat", refund_sent: "Menunggu konfirmasi penerimaan refund", cancelled: "Dibatalkan", declined: "Permintaan ditolak" };
export type Account = { name: string; email: string; phone: string; demoOnly: true };
// paymentMode adalah bagian dari versi perjanjian, sehingga cara pembayaran ikut disetujui kedua pihak.
// "amanah": dana disetor ke rekening penampung mitra pembayaran berizin dan hanya cair dengan persetujuan dua pihak.
export type PaymentMode = "direct" | "amanah";
export type Offer = { version: number; price: number; deposit: number; scope: string; terms: string; days: { date: string; location: string }[]; paymentMode?: PaymentMode };
export type Payment = { id: string; amount: number; proof: string; status: "pending" | "confirmed" | "rejected"; via?: PaymentMode };
export type Amanah = { held: number; released: number; refunded: number; release?: { amount: number; by: "couple" | "vendor"; note: string } };
export type Cooperation = { id: string; vendor: string; request: string; eventDate: string; phase: Phase; offer: Offer | null; offerVersions?: Offer[]; approvals: { couple: boolean; vendor: boolean }; payments: Payment[]; amanah?: Amanah; reply: string; evidence: string; reviewNote: string; resume?: Phase; cancellation?: { refund: number; couple: boolean; vendor: boolean; proof: string; fromDispute?: boolean }; history: { id: string; actor: Actor; action: string; time: string; version: number | null }[] };
// catalog: nama pelaku contoh yang sudah dipublikasikan di direktori demo; permintaan boleh dikirim kepada mereka,
// tetapi hanya identitas vendor yang terdaftar di browser ini yang dapat merespons.
export type Flow = { schema: 1; accounts: { couple: Account | null; vendor: Account | null }; vendorReview: { identity: boolean; culture: boolean; consent: boolean }; cases: Cooperation[]; catalog?: string[] };
export type FlowAction = { type: string; actor: Actor; caseId?: string; id: string; time: string; data?: Record<string, unknown> };
export const initialFlow = (): Flow => ({ schema: 1, accounts: { couple: null, vendor: null }, vendorReview: { identity: false, culture: false, consent: false }, cases: [] });
const need = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const text = (value: unknown, min = 1): string => { need(typeof value === "string" && value.trim().length >= min && value.length <= 2000, `Lengkapi teks minimal ${min} karakter (maksimal 2000).`); return (value as string).trim(); };
const integer = (value: unknown): number => { need(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000, "Nominal harus rupiah bulat antara 0 dan 1 miliar."); return value as number; };
export const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
export const confirmedTotal = (item: Cooperation): number => item.payments.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.amount, 0);
// Hari tindakan (UTC) sebagai batas bawah tanggal acara; bila waktu tindakan tidak berformat ISO, batas diabaikan.
const dayOf = (time: string): string => (/^\d{4}-\d{2}-\d{2}/.test(time) ? time.slice(0, 10) : "0000-00-00");
export const isAmanah = (item: Cooperation): boolean => item.offer?.paymentMode === "amanah";
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
      item.offer = { version: (item.offer?.version ?? 0) + 1, price, deposit, scope: text(d.scope, 10), terms: text(d.terms, 10), days, paymentMode: d.paymentMode === "amanah" ? "amanah" : "direct" };
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
        // Simulasi: setoran lewat virtual account mitra pembayaran langsung terkonfirmasi sistem dan DITAHAN, belum milik vendor.
        need(d.ack === true, "Setujui syarat Dana Amanah sebelum menyetor.");
        need(item.phase !== "disputed", "Setoran dihentikan selama sengketa.");
        const amanah = amanahOf(item);
        item.payments.push({ id: action.id, amount, proof: `AMN-${action.id} (virtual account simulasi)`, status: "confirmed", via: "amanah" });
        item.amanah = { ...amanah, held: amanah.held + amount };
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
    return f.cases.every(c => typeof c.id === "string" && typeof c.vendor === "string" && typeof c.request === "string" && typeof c.reply === "string" && typeof c.evidence === "string" && typeof c.reviewNote === "string" && validDate(c.eventDate) && c.phase in phaseLabels && typeof c.approvals.couple === "boolean" && typeof c.approvals.vendor === "boolean" && Array.isArray(c.history) && c.history.every(h => typeof h.id === "string" && typeof h.time === "string" && typeof h.action === "string" && ["couple", "vendor", "admin"].includes(h.actor)) && (!c.cancellation || (Number.isSafeInteger(c.cancellation.refund) && c.cancellation.refund >= 0 && typeof c.cancellation.proof === "string")) && Array.isArray(c.payments) && c.payments.every(p => Number.isSafeInteger(p.amount) && p.amount > 0 && ["pending", "confirmed", "rejected"].includes(p.status) && typeof p.proof === "string" && (p.via === undefined || p.via === "direct" || p.via === "amanah")) && (!c.amanah || ([c.amanah.held, c.amanah.released, c.amanah.refunded].every(n => Number.isSafeInteger(n) && n >= 0) && (!c.amanah.release || (Number.isSafeInteger(c.amanah.release.amount) && c.amanah.release.amount > 0 && ["couple", "vendor"].includes(c.amanah.release.by))))) && (!c.offer || (Number.isSafeInteger(c.offer.price) && c.offer.price > 0 && c.offer.deposit >= 0 && c.offer.deposit <= c.offer.price && (c.offer.paymentMode === undefined || c.offer.paymentMode === "direct" || c.offer.paymentMode === "amanah") && Array.isArray(c.offer.days) && c.offer.days.every(d => validDate(d.date) && typeof d.location === "string"))));
  } catch { return false; }
}
