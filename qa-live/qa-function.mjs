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

// --- Poin 11: memilih pelaku dari permintaan terbuka dalam satu langkah server ---
await api("/rest/v1/open_requests", { method: "POST", token: C.token, body: { id: "req-uji-terbuka", title: "Pemandu adat untuk mappacci", category: "Prosesi adat", event_date: "2027-09-12", detail: "Dua malam di Gowa." } });
await api("/rest/v1/open_request_responses", { method: "POST", token: V.token, body: { id: "resp-uji-1", request_id: "req-uji-terbuka", note: "Kami siap membantu mappacci.", price: 6500000 } });
const vName = psql(`select vendor_name from open_request_responses where id='resp-uji-1'`);
check("nama pelaku pada minat diisi server", vName === "Sanggar Uji", vName);
const choose = (u, vendorName = vName) => act(u, { requestId: "req-uji-terbuka", vendorName, action: { type: "choose_open", id: crypto.randomUUID(), data: { date: "2027-09-12", request: "Pemandu adat mappacci (dari permintaan terbuka)" } } });
check("akun lain tidak dapat memilih untuk permintaan orang lain", (await choose(C2)).status === 404);
check("pelaku tanpa minat tidak dapat dipilih", (await choose(C, "Sanggar Dua")).status === 400);
const chosen = await choose(C);
check("keluarga memilih pelaku: kerja sama terkirim", chosen.status === 200 && chosen.data?.row?.phase === "inquiry", JSON.stringify(chosen.data));
check("permintaan terbuka ditutup dan tercatat", psql(`select status || '|' || chosen || '|' || (case_id = '${chosen.data?.row?.id}') from open_requests where id='req-uji-terbuka'`) === "closed|Sanggar Uji|true");
const again = await choose(C);
check("memilih dua kali ditolak (tanpa kerja sama ganda)", again.status === 400 && Number(psql(`select count(*) from cooperations where data->>'request' like '%dari permintaan terbuka%'`)) === 1, JSON.stringify(again));

// --- Poin 14: prosesi yang dilayani ---
const cer = await api(`/rest/v1/vendor_listings?id=eq.${V.id}`, { method: "PATCH", token: V.token, body: { ceremonies: ["mappacci", "akad"] }, prefer: "return=representation" });
check("mengubah prosesi memicu tinjau ulang", cer.data?.[0]?.review_status === "pending", JSON.stringify(cer.data));
await api(`/rest/v1/vendor_listings?id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { review_status: "approved", identity_ok: true, culture_ok: true, consent_ok: true } });
const dir = await api(`/rest/v1/vendor_directory?select=name,ceremonies&name=eq.Sanggar%20Uji`);
check("direktori publik menampilkan prosesi", JSON.stringify(dir.data?.[0]?.ceremonies) === '["mappacci","akad"]', JSON.stringify(dir.data));
const tooMany = await api(`/rest/v1/vendor_listings?id=eq.${V.id}`, { method: "PATCH", token: V.token, body: { ceremonies: Array.from({ length: 13 }, (_, i) => "p" + i) } });
check("lebih dari 12 prosesi ditolak", tooMany.status >= 400);

// --- Poin 8: jejak peninjau ---
const trail = psql(`select string_agg(decision || ':' || coalesce(reviewer_name,''), ',' order by created_at) from listing_reviews where listing_id='${V.id}'`);
check("jejak peninjauan mencatat keputusan dan peninjau", trail.includes("disetujui:Admin Uji") && trail.includes("ditinjau ulang"), trail);
check("pelaku tidak dapat membaca jejak peninjau", (await api(`/rest/v1/listing_reviews?select=*`, { token: V.token })).data?.length === 0);

// --- Poin 15: permintaan data pribadi ---
const anonReq = await api("/rest/v1/data_requests", { method: "POST", body: { kind: "directory_remove", subject: "Usaha Contoh Makassar", contact: "0812 0000 0000", message: "Saya pemiliknya." }, prefer: "return=minimal" });
check("pengunjung tanpa akun dapat mengajukan penghapusan", anonReq.status === 201, JSON.stringify(anonReq));
const anonRead = await api("/rest/v1/data_requests?select=*");
check("pengunjung tidak dapat membaca permintaan", anonRead.status >= 400 || anonRead.data?.length === 0, JSON.stringify(anonRead));
check("peninjau mendapat pemberitahuan permintaan data", Number(psql(`select count(*) from notifications where user_id='${A.id}' and link='admin/screening'`)) >= 1);
const reqs = await api("/rest/v1/data_requests?select=*", { token: A.token });
check("peninjau membaca permintaan", reqs.data?.length === 1);
check("pelaku tidak dapat menandai selesai", ((await api(`/rest/v1/data_requests?id=eq.${reqs.data?.[0]?.id}`, { method: "PATCH", token: V.token, body: { status: "done" }, prefer: "return=representation" })).data ?? []).length === 0);
const done = await api(`/rest/v1/data_requests?id=eq.${reqs.data?.[0]?.id}`, { method: "PATCH", token: A.token, body: { status: "done", handled_note: "Dihapus dari daftar.", handled_at: new Date().toISOString() }, prefer: "return=representation" });
check("peninjau menandai selesai", done.data?.[0]?.status === "done", JSON.stringify(done.data));
check("jenis tidak dikenal ditolak", (await api("/rest/v1/data_requests", { method: "POST", body: { kind: "spam", subject: "x y", contact: "0812 1", message: "" } })).status >= 400);

// --- Poin 9: data rencana tidak saling menimpa antarperangkat ---
const key = "vaksara-planner-guests-v1";
const first = await api("/rest/v1/user_state?on_conflict=user_id,key", { method: "POST", token: C.token, body: { user_id: C.id, key, value: [{ n: "A" }], updated_at: "2026-11-14T01:00:00.000Z" }, prefer: "resolution=ignore-duplicates,return=representation" });
const at = first.data?.[0]?.updated_at;
check("kunci baru tersimpan", Boolean(at), JSON.stringify(first));
const dupNew = await api("/rest/v1/user_state?on_conflict=user_id,key", { method: "POST", token: C.token, body: { user_id: C.id, key, value: [{ n: "B" }], updated_at: "2026-11-14T01:00:01.000Z" }, prefer: "resolution=ignore-duplicates,return=representation" });
check("perangkat kedua tidak menimpa kunci baru", dupNew.data?.length === 0);
const devA = await api(`/rest/v1/user_state?user_id=eq.${C.id}&key=eq.${key}&updated_at=eq.${encodeURIComponent(at)}`, { method: "PATCH", token: C.token, body: { value: [{ n: "A2" }], updated_at: "2026-11-14T01:00:02.000Z" }, prefer: "return=representation" });
check("perangkat A menyimpan dengan versi terkini", devA.data?.length === 1);
const devB = await api(`/rest/v1/user_state?user_id=eq.${C.id}&key=eq.${key}&updated_at=eq.${encodeURIComponent(at)}`, { method: "PATCH", token: C.token, body: { value: [{ n: "B2" }], updated_at: "2026-11-14T01:00:03.000Z" }, prefer: "return=representation" });
check("perangkat B dengan versi lama tidak menimpa", devB.data?.length === 0 && psql(`select value->0->>'n' from user_state where user_id='${C.id}' and key='${key}'`) === "A2");
console.log(`=== ${pass} lulus, ${fail} gagal ===`);
process.exit(fail ? 1 : 0);
