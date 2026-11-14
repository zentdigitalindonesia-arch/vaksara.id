// Uji ujung-ke-ujung fungsi server cooperation-action lewat tiruan Supabase (Postgres asli + RLS asli).
// Jalankan: Postgres lokal (supabase-stub.sql lalu schema.sql, database kosong) + node qa-live/mock-supa.mjs, lalu node qa-live/qa-function.mjs
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
const B = "http://127.0.0.1:54321", ANON = "anon-test";
const psql = q => execFileSync("psql", ["-h", "/tmp/pgt", "-p", "5499", "-U", "postgres", "-d", "live", "-At", "-c", q], { encoding: "utf8" }).trim();
let pass = 0, fail = 0; const check = (name, cond, extra = "") => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name, extra); } };
async function api(path, { method = "GET", token = ANON, body, prefer } = {}) {
  const r = await fetch(B + path, { method, headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; } return { status: r.status, data: d };
}
async function user(email, role, name) {
  await api("/auth/v1/signup", { method: "POST", body: { email, password: "rahasia123", data: { role, full_name: name } } });
  const r = await api("/auth/v1/verify", { method: "POST", body: { type: "signup", email, token: "123456" } });
  return { token: r.data.access_token, id: r.data.user.id };
}
const act = (u, body) => api("/functions/v1/cooperation-action", { method: "POST", token: u.token, body });
const step = (u, caseId, type, data = {}, actor) => act(u, { caseId, actor, action: { type, id: crypto.randomUUID(), data } });
const docs = (u, kinds) => psql(`select set_config('request.jwt.sub','${u.id}',true); insert into documents (user_id,kind,path) select '${u.id}', k, '${u.id}/' || k || n || '.jpg' from (values ${kinds.map((k, i) => `('${k}',${i})`).join(",")}) v(k,n)`);
const phase = id => psql(`select phase from cooperations where id='${id}'`);

const A = await user("admin@uji.id", "couple", "Admin Uji"); psql(`update profiles set is_admin=true where id='${A.id}'`);
const V = await user("pelaku@uji.id", "vendor", "Daeng Uji"), V2 = await user("pelaku2@uji.id", "vendor", "Pelaku Dua");
const C = await user("keluarga@uji.id", "couple", "Andi Rahma"), C2 = await user("keluarga2@uji.id", "couple", "Keluarga Lain");
await api("/rest/v1/vendor_listings", { method: "POST", token: V.token, body: { id: V.id, name: "Sanggar Uji", category: "Prosesi adat", area: "Gowa", description: "Pemandu adat mappacci dan akad nikah di Gowa.", whatsapp: "081234567890" } });
docs(V, ["ktp", "face", "portfolio", "portfolio"]);
const appr = await api(`/rest/v1/vendor_listings?id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { review_status: "approved", identity_ok: true, culture_ok: true, consent_ok: true }, prefer: "return=representation" });
check("peninjau menyetujui pelaku berdokumen", appr.data?.[0]?.review_status === "approved", JSON.stringify(appr.data));

// --- Pemalsuan langsung ke tabel ---
const forge = await api("/rest/v1/cooperations", { method: "POST", token: C.token, body: { id: "case-palsu-001", couple_id: C.id, vendor_id: V.id, phase: "completed", data: {} } });
check("menulis langsung ke tabel kerja sama ditolak", forge.status >= 400 && /permission denied/.test(JSON.stringify(forge.data)), JSON.stringify(forge));

// --- Alur lewat fungsi server ---
const lead = await act(C, { vendorId: V.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2027-08-20", request: "Pemandu adat dua hari untuk mappacci dan akad.", vendor: "Nama Palsu" } } });
const id = lead.data?.row?.id;
check("keluarga membuat draf kebutuhan lewat fungsi server", lead.status === 200 && lead.data.row.phase === "draft", JSON.stringify(lead));
check("nama pihak dari profil, bukan isian", lead.data?.row?.couple_name === "Andi Rahma" && lead.data?.row?.vendor_name === "Sanggar Uji" && lead.data?.row?.data?.vendor === "Sanggar Uji");
const vLead = await act(V2, { vendorId: V.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2027-08-20", request: "Permintaan oleh akun pelaku" } } });
check("akun pelaku tidak dapat membuat permintaan", vLead.status === 403, JSON.stringify(vLead));
const toUnlisted = await act(C, { vendorId: V2.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2027-08-20", request: "Permintaan ke pelaku belum disetujui" } } });
check("permintaan ke pelaku belum disetujui ditolak", toUnlisted.status === 400, JSON.stringify(toUnlisted));
check("tanggal lampau ditolak server", (await act(C, { vendorId: V.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2020-01-01", request: "Acara tanggal lampau sekali." } } })).status === 400);

check("keluarga mengirim permintaan", (await step(C, id, "submit")).status === 200 && phase(id) === "inquiry");
const outsider = await step(V2, id, "reply", { note: "Saya bukan pelaku tujuan permintaan ini." });
check("pelaku lain tidak dapat bertindak", outsider.status === 403, JSON.stringify(outsider));
const asVendor = await step(C, id, "reply", { note: "Keluarga mencoba membalas sebagai pelaku." });
check("keluarga tidak dapat melakukan langkah pelaku", asVendor.status === 400 && /pihak lain/.test(asVendor.data.message), JSON.stringify(asVendor));
const claim = await step(V, id, "reply", { note: "Kami tersedia untuk dua hari acara." }, "couple");
check("mengaku sebagai pihak lain ditolak", claim.status === 403, JSON.stringify(claim));
check("pelaku membalas", (await step(V, id, "reply", { note: "Kami tersedia untuk dua hari acara." })).status === 200 && phase(id) === "replied");
const offer = { price: 12000000, deposit: 3000000, scope: "Pemandu prosesi mappacci dan akad nikah.", terms: "DP 25 persen, sisa setelah acara. Pembatalan perlu kesepakatan.", days: [{ date: "2027-08-19", location: "Rumah keluarga" }, { date: "2027-08-20", location: "Masjid" }] };
const amanah = await step(V, id, "offer", { ...offer, paymentMode: "amanah" });
check("Dana Amanah ditolak di server", amanah.status === 400 && /Dana Amanah/.test(amanah.data.message), JSON.stringify(amanah));
check("pelaku mengirim penawaran transfer langsung", (await step(V, id, "offer", { ...offer, paymentMode: "direct" })).status === 200 && phase(id) === "offered");
check("keluarga menerima penawaran", (await step(C, id, "accept_offer")).status === 200 && phase(id) === "contract");
const noKtp = await step(C, id, "approve", { version: 1, ack: true });
check("persetujuan keluarga tanpa KTP ditolak", noKtp.status === 400 && /KTP/.test(noKtp.data.message), JSON.stringify(noKtp));
docs(C, ["ktp"]);
check("keluarga menyetujui setelah KTP", (await step(C, id, "approve", { version: 1, ack: true })).status === 200);
const forgeApprove = await api(`/rest/v1/cooperations?id=eq.${id}`, { method: "PATCH", token: C.token, body: { phase: "active" } });
check("keluarga tidak dapat memalsukan persetujuan pelaku lewat tabel", forgeApprove.status >= 400 && phase(id) === "contract", JSON.stringify(forgeApprove));
check("pelaku menyetujui; perjanjian aktif", (await step(V, id, "approve", { version: 1, ack: true })).status === 200 && phase(id) === "active");
const pay = await step(C, id, "payment", { amount: 3000000, proof: "Transfer BRI ref 12345" });
check("keluarga mencatat DP", pay.status === 200);
const payId = pay.data?.row?.data?.payments?.[0]?.id;
const selfConfirm = await step(C, id, "confirm_payment", { paymentId: payId });
check("keluarga tidak dapat mengonfirmasi pembayarannya sendiri", selfConfirm.status === 400, JSON.stringify(selfConfirm));
check("pelaku mengonfirmasi DP", (await step(V, id, "confirm_payment", { paymentId: payId })).status === 200);
check("pelaku memulai pelaksanaan", (await step(V, id, "start")).status === 200 && phase(id) === "running");
check("keluarga mengajukan sengketa", (await step(C, id, "dispute", { note: "Jadwal hari kedua belum sesuai." })).status === 200 && phase(id) === "disputed");
const c2Resume = await step(C2, id, "resume", { note: "Keluarga lain mencoba mencatat mediasi." });
check("akun lain tidak dapat mencatat mediasi", c2Resume.status === 403, JSON.stringify(c2Resume));
check("peninjau mencatat mediasi", (await step(A, id, "resume", { note: "Mediasi: jadwal hari kedua dimajukan satu jam." })).status === 200 && phase(id) === "running");
const dupId = crypto.randomUUID();
await act(V, { caseId: id, action: { type: "handover", id: dupId, data: { proof: "Foto dan video acara terlampir di tautan." } } });
const dup = await act(V, { caseId: id, action: { type: "handover", id: dupId, data: { proof: "Foto dan video acara terlampir di tautan." } } });
check("tindakan ganda ditolak", dup.status === 400, JSON.stringify(dup));
const hist = JSON.parse(psql(`select data->'history' from cooperations where id='${id}'`));
check("riwayat mencatat pelaku tindakan dari server", hist.every(h => ["couple", "vendor", "admin"].includes(h.actor)) && hist.find(h => h.action === "resume")?.actor === "admin");
check("waktu tindakan dari server (bukan isian browser)", hist.every(h => /^\d{4}-\d{2}-\d{2}T/.test(h.time)));
check("pemberitahuan tetap terkirim", Number(psql(`select count(*) from notifications where user_id='${V.id}' and title like 'Permintaan baru dari%'`)) === 1);
const noAuth = await fetch(B + "/functions/v1/cooperation-action", { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: "{}" });
check("tanpa sesi ditolak", noAuth.status === 401);
const badTok = await act({ token: "tok-palsu" }, { caseId: id, action: { type: "complete", id: crypto.randomUUID() } });
check("token palsu ditolak", badTok.status === 401);
const pre = await fetch(B + "/functions/v1/cooperation-action", { method: "OPTIONS" });
check("CORS preflight dijawab", pre.status === 204);
console.log(`=== ${pass} lulus, ${fail} gagal ===`);
process.exit(fail ? 1 : 0);
