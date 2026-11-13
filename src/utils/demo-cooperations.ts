import { initialFlow, transitionFlow, type Flow, type FlowAction } from "./cooperation";

// Satu cerita demo yang utuh: keluarga Nurul Amalia menyiapkan rangkaian pernikahan adat Bugis–Makassar
// (puncak 12 Juni 2027, Makassar). Setiap tahap kerja sama punya minimal satu contoh agar demo mudah dipahami.
// a1–a4 ditujukan ke akun vendor demo (pemandu adat), b1–b5 ke pelaku lain di direktori contoh.
export const DEMO_EVENT = { name: "Pernikahan Nurul & Fikri", date: "2027-06-12", location: "Makassar", budget: "127500000" };

const others = {
  busana: "Rumah Tenun Lipa' Sabbe",
  rias: "Sanggar Riase Kalase",
  musik: "Sanggar Pa'rasanganta",
  katering: "Dapur Cita Nusantara",
  foto: "Lensa Pesisir Studio",
};

export function demoCooperations(vendor: string): Flow {
  let flow = initialFlow(); let serial = 0;
  const act = (type: string, actor: FlowAction["actor"], data: Record<string, unknown> = {}, caseId?: string, id?: string) => { flow = transitionFlow(flow, { type, actor, data, caseId, id: id ?? `sample-event-${++serial}`, time: "2026-10-27T08:00:00Z" }); };
  const as = (name: string) => { flow = { ...flow, accounts: { ...flow.accounts, vendor: { ...flow.accounts.vendor!, name } } }; };
  act("register", "couple", { name: "Nurul Amalia", email: "pengguna@example.test", phone: "+6281222222222", consent: true, contactDemoPassed: true });
  act("register", "vendor", { name: vendor, email: "vendor@example.test", phone: "+6281211111111", consent: true, contactDemoPassed: true });
  act("review_vendor", "admin", { identity: true, culture: true, consent: true });

  const terms = "DP sebelum persiapan, sisa setelah layanan diterima. Perubahan jadwal dan pembatalan harus disepakati kedua pihak secara tertulis. Contoh demo.";
  type Spec = { id: string; vendor: string; date: string; request: string; reply?: string; price?: number; deposit?: number; days?: [string, string][]; mode?: "direct" | "amanah"; until: string; proof?: string };
  const run = (s: Spec) => {
    as(s.vendor);
    act("lead", "couple", { vendor: s.vendor, date: s.date, request: s.request }, undefined, s.id); act("submit", "couple", {}, s.id);
    if (s.until === "inquiry") return;
    if (s.until === "declined") { act("decline", "vendor", { note: s.reply ?? "Mohon maaf, tim kami sudah terjadwal di tanggal tersebut." }, s.id); return; }
    act("reply", "vendor", { note: s.reply ?? "Terima kasih. Kami tersedia dan siap membahas kebutuhan keluarga." }, s.id);
    act("offer", "vendor", { price: s.price, deposit: s.deposit, scope: s.request, terms, paymentMode: s.mode ?? "direct", days: (s.days ?? [[s.date, "Rumah keluarga, Makassar (contoh)"]]).map(([date, location]) => ({ date, location })) }, s.id);
    if (s.until === "offered") return;
    act("accept_offer", "couple", {}, s.id);
    if (s.until === "contract") return;
    act("approve", "couple", { version: 1, ack: true }, s.id); act("approve", "vendor", { version: 1, ack: true }, s.id);
    const amanah = s.mode === "amanah";
    const pay = (amount: number, key: string) => {
      const paymentId = `sample-${key}-${s.id}`;
      if (amanah) act("payment", "couple", { amount, ack: true }, s.id, paymentId);
      else { act("payment", "couple", { amount, proof: "Referensi transfer contoh, bukan pembayaran nyata." }, s.id, paymentId); act("confirm_payment", "vendor", { paymentId }, s.id); }
    };
    pay(s.deposit!, "dp");
    act("start", "vendor", {}, s.id);
    if (s.until === "running") return;
    act("handover", "vendor", { proof: s.proof ?? "Catatan hasil layanan dan dokumentasi diserahkan kepada keluarga untuk ditinjau." }, s.id);
    if (s.until === "handover") return;
    act("accept_handover", "couple", { ack: true }, s.id);
    pay(s.price! - s.deposit!, "lunas");
    if (amanah) { act("propose_release", "vendor", { amount: s.price, note: "Layanan selesai dan BAST diterima. Mohon pencairan seluruh dana." }, s.id); act("approve_release", "couple", { ack: true }, s.id); }
    act("complete", "couple", {}, s.id);
  };

  // Pemandu adat (akun vendor demo): empat prosesi dalam rangkaian yang sama.
  run({ id: "a3", vendor, date: "2027-03-14", request: "Pendampingan prosesi mappettu ada (lamaran) dan penyusunan kesepakatan dua keluarga.", price: 3500000, deposit: 1000000, days: [["2027-03-14", "Rumah keluarga mempelai perempuan, Makassar (contoh)"]], until: "handover", proof: "Notulen kesepakatan mappettu ada dan daftar seserahan diserahkan kepada keluarga." });
  run({ id: "a1", vendor, date: "2027-06-11", request: "Pendampingan prosesi mappacci dan akad nikah selama dua hari.", price: 6500000, deposit: 1950000, days: [["2027-06-11", "Rumah keluarga, Makassar (contoh)"], ["2027-06-12", "Gedung pertemuan keluarga, Makassar (contoh)"]], until: "running" });
  run({ id: "a2", vendor, date: "2027-06-10", request: "Pemanduan tudang sipulung dan mappasili sehari sebelum mappacci.", price: 2500000, deposit: 750000, days: [["2027-06-10", "Rumah keluarga, Makassar (contoh)"]], until: "contract" });
  run({ id: "a4", vendor, date: "2027-06-13", request: "Pendampingan mapparola (kunjungan balasan ke keluarga mempelai laki-laki).", until: "inquiry" });

  // Pelaku lain di direktori contoh.
  run({ id: "b1", vendor: others.busana, date: "2027-04-17", request: "Konsultasi motif dan penyiapan set busana pengantin baju bodo dan lipa' sabbe.", price: 9000000, deposit: 2700000, mode: "amanah", days: [["2027-04-17", "Galeri Rumah Tenun, Sengkang (contoh)"]], until: "completed", proof: "Set busana dan dua lembar lipa' sabbe diserahkan; foto pemasangan terlampir." });
  run({ id: "b2", vendor: others.rias, date: "2027-06-12", request: "Rias pengantin adat untuk mappacci dan akad, termasuk uji coba rias.", price: 8500000, deposit: 2550000, mode: "amanah", days: [["2027-06-11", "Rumah keluarga, Makassar (contoh)"], ["2027-06-12", "Gedung pertemuan keluarga, Makassar (contoh)"]], until: "running" });
  run({ id: "b3", vendor: others.musik, date: "2027-06-12", request: "Ensambel gandrang dan pui'-pui' untuk penyambutan dan prosesi akad.", price: 7500000, deposit: 2250000, mode: "amanah", days: [["2027-06-12", "Gedung pertemuan keluarga, Makassar (contoh)"]], until: "offered" });
  run({ id: "b4", vendor: others.katering, date: "2027-06-12", request: "Prasmanan menu Bugis–Makassar untuk 300 tamu, termasuk kue tradisional.", until: "inquiry" });
  run({ id: "b5", vendor: others.foto, date: "2027-06-12", request: "Dokumentasi foto dan video dua hari rangkaian.", until: "declined", reply: "Mohon maaf, tim kami sudah terjadwal penuh pada 11–12 Juni 2027." });

  as(vendor);
  return flow;
}
