// Uji ujung-ke-ujung Dana Amanah lewat Xendit (tiruan) + rekening pelaku, di atas Postgres asli dengan RLS asli.
// Jalankan: database kosong (supabase-stub.sql lalu schema.sql) + node qa-live/mock-supa.mjs, lalu node qa-live/qa-escrow.mjs
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
const B = "http://127.0.0.1:54321", ANON = "anon-test";
const psql = q => execFileSync("psql", ["-h", "/tmp/pgt", "-p", "5499", "-U", "postgres", "-d", "live", "-At", "-c", q], { encoding: "utf8" }).trim();
let pass = 0, fail = 0; const check = (name, cond, extra = "") => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name, extra); } };
async function api(path, { method = "GET", token = ANON, body, prefer, headers = {} } = {}) {
  const r = await fetch(B + path, { method, headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; } return { status: r.status, data: d };
}
async function user(email, role, name) {
  await api("/auth/v1/signup", { method: "POST", body: { email, password: "rahasia123", data: { role, full_name: name } } });
  const r = await api("/auth/v1/verify", { method: "POST", body: { type: "signup", email, token: "123456" } });
  return { token: r.data.access_token, id: r.data.user.id };
}
const act = (u, body) => api("/functions/v1/cooperation-action", { method: "POST", token: u.token, body });
const step = (u, caseId, type, data = {}) => act(u, { caseId, action: { type, id: crypto.randomUUID(), data } });
const docs = (u, kinds) => psql(`select set_config('request.jwt.sub','${u.id}',true); insert into documents (user_id,kind,path) select '${u.id}', k, '${u.id}/' || k || n || '.jpg' from (values ${kinds.map((k, i) => `('${k}',${i})`).join(",")}) v(k,n)`);
const hook = (body, token = "cb-test") => api("/functions/v1/xendit-webhook", { method: "POST", body, headers: { "x-callback-token": token } });
const amanah = id => JSON.parse(psql(`select data->'amanah' from cooperations where id='${id}'`) || "null");
const payout = id => JSON.parse(psql(`select row_to_json(p) from escrow_payouts p where id='${id}'`) || "null");
const xPayouts = async () => (await api("/__xendit/payouts")).data;

const A = await user("admin@uji.id", "couple", "Admin Uji"); psql(`update profiles set is_admin=true where id='${A.id}'`);
const V = await user("pelaku@uji.id", "vendor", "Daeng Uji");
const C = await user("keluarga@uji.id", "couple", "Andi Rahma"), C2 = await user("keluarga2@uji.id", "couple", "Keluarga Lain");
await api("/rest/v1/vendor_listings", { method: "POST", token: V.token, body: { id: V.id, name: "Sanggar Uji", category: "Prosesi adat", area: "Gowa", description: "Pemandu adat mappacci dan akad nikah di Gowa.", whatsapp: "081234567890" } });
docs(V, ["ktp", "face", "portfolio", "portfolio"]);
await api(`/rest/v1/vendor_listings?id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { review_status: "approved", identity_ok: true, culture_ok: true, consent_ok: true } });

// ---------- Rekening pelaku ----------
const bankIns = await api("/rest/v1/vendor_bank_accounts", { method: "POST", token: V.token, body: { vendor_id: V.id, bank_code: "ID_BCA", account_number: "1234567890", holder_name: "Sanggar Uji", holder_basis: "usaha", status: "approved" }, prefer: "return=representation" });
check("pelaku menyimpan rekening; status dipaksa menunggu", bankIns.data?.[0]?.status === "pending", JSON.stringify(bankIns.data));
check("keluarga lain tidak dapat menyimpan rekening", (await api("/rest/v1/vendor_bank_accounts", { method: "POST", token: C.token, body: { vendor_id: C.id, bank_code: "ID_BCA", account_number: "1234567890", holder_name: "Andi", holder_basis: "usaha" } })).status >= 400);
const selfAppr = await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: V.token, body: { status: "approved" }, prefer: "return=representation" });
check("pelaku tidak dapat menyetujui rekening sendiri", selfAppr.data?.[0]?.status === "pending", JSON.stringify(selfAppr.data));
check("nomor rekening bukan angka ditolak", (await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: V.token, body: { account_number: "12-34" } })).status >= 400);
const noBook = await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { status: "approved" } });
check("peninjau tidak dapat menyetujui tanpa buku rekening", noBook.status >= 400 && /Buku rekening/.test(JSON.stringify(noBook.data)), JSON.stringify(noBook));
docs(V, ["bank_book"]);
check("peninjau tidak dapat mengubah isi rekening", (await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { account_number: "9999999999" } })).status >= 400);
check("penolakan rekening wajib beralasan", (await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { status: "rejected", review_note: "x" } })).status >= 400);
check("keluarga tidak dapat membaca rekening pelaku", ((await api("/rest/v1/vendor_bank_accounts?select=*", { token: C.token })).data ?? []).length === 0);

// ---------- Penawaran Dana Amanah sebagian ----------
const lead = await act(C, { vendorId: V.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2027-08-20", request: "Pemandu adat dua hari untuk mappacci dan akad." } } });
const id = lead.data?.row?.id;
await step(C, id, "submit"); await step(V, id, "reply", { note: "Kami tersedia untuk dua hari acara." });
const offer = { price: 10000000, deposit: 3000000, scope: "Pemandu prosesi mappacci dan akad nikah.", terms: "DP 30 persen, sisa setelah acara. Pembatalan perlu kesepakatan.", days: [{ date: "2027-08-19", location: "Rumah keluarga" }, { date: "2027-08-20", location: "Masjid" }], paymentMode: "split", amanahPercent: 30 };
const early = await step(V, id, "offer", offer);
check("Dana Amanah butuh rekening disetujui", early.status === 400 && /rekening/.test(early.data?.message), JSON.stringify(early));
const appr = await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { status: "approved" }, prefer: "return=representation" });
check("peninjau menyetujui rekening (tercatat siapa)", appr.data?.[0]?.status === "approved" && appr.data?.[0]?.reviewed_by === A.id, JSON.stringify(appr.data));
check("pelaku diberi tahu rekening disetujui", Number(psql(`select count(*) from notifications where user_id='${V.id}' and kind='bank_approved'`)) === 1);
check("penawaran Dana Amanah 30% terkirim", (await step(V, id, "offer", offer)).status === 200);
check("persentase tidak valid ditolak", (await step(V, id, "offer", { ...offer, amanahPercent: 150 })).status === 400);
await step(C, id, "accept_offer"); docs(C, ["ktp"]);
await step(C, id, "approve", { version: 1, ack: true });
check("perjanjian aktif", (await step(V, id, "approve", { version: 1, ack: true })).status === 200 && psql(`select phase from cooperations where id='${id}'`) === "active");
const sum = await api("/rest/v1/rpc/payout_account_summary", { method: "POST", token: C.token, body: { p_vendor: V.id } });
check("keluarga mitra melihat ringkasan rekening tanpa nomor lengkap", sum.data?.[0]?.last4 === "7890" && !JSON.stringify(sum.data).includes("1234567890") && sum.data?.[0]?.holder_name === "Sanggar Uji", JSON.stringify(sum.data));
check("keluarga lain tidak melihat ringkasan rekening", ((await api("/rest/v1/rpc/payout_account_summary", { method: "POST", token: C2.token, body: { p_vendor: V.id } })).data ?? []).length === 0);

// ---------- Tagihan Xendit ----------
check("catatan transfer manual ditolak untuk Dana Amanah", (await step(C, id, "payment", { amount: 3000000, proof: "Transfer BCA" })).status === 400);
check("keluarga lain tidak dapat membayar", (await step(C2, id, "pay_invoice", { amount: 3000000 })).status === 403);
check("pelaku tidak dapat membuat tagihan", (await step(V, id, "pay_invoice", { amount: 3000000 })).status === 403);
check("nominal di bawah minimum ditolak", (await step(C, id, "pay_invoice", { amount: 5000 })).status === 400);
check("nominal melebihi nilai perjanjian ditolak", (await step(C, id, "pay_invoice", { amount: 10000001 })).status === 400);
const inv1 = await step(C, id, "pay_invoice", { amount: 3000000 });
const pay1 = inv1.data?.payment;
check("tagihan Xendit dibuat dengan biaya bayar untuk keluarga", inv1.status === 200 && /checkout\.xendit\.test/.test(pay1?.invoice_url) && pay1?.fee === 5000 && pay1?.held === 900000, JSON.stringify(inv1));
check("tagihan menunggu ikut dihitung (tidak bisa melebihi nilai)", (await step(C, id, "pay_invoice", { amount: 7500000 })).status === 400);
check("belum dibayar: saldo amanah belum berubah", amanah(id) === null || amanah(id).held === 0);

// ---------- Webhook ----------
check("webhook tanpa token benar ditolak", (await hook({ id: pay1.invoice_id, external_id: pay1.id, status: "PAID", paid_amount: 3005000 }, "salah")).status === 401);
const forged = await hook({ id: pay1.invoice_id, external_id: pay1.id, status: "PAID", paid_amount: 3005000 });
check("pemberitahuan PAID palsu (Xendit masih PENDING) tidak menambah saldo", forged.status === 200 && psql(`select status from escrow_payments where id='${pay1.id}'`) === "pending", JSON.stringify(forged));
await api("/__xendit/pay", { method: "POST", body: { invoice_id: pay1.invoice_id } });
const paid = await hook({ id: pay1.invoice_id, external_id: pay1.id, status: "PAID", paid_amount: 3005000 });
check("pembayaran tercatat setelah dicek ke Xendit", paid.status === 200 && psql(`select status || applied from escrow_payments where id='${pay1.id}'`) === "paidtrue", JSON.stringify(paid));
const a1 = amanah(id);
check("30% ditahan, 70% diteruskan", a1?.held === 900000 && a1?.released === 2100000, JSON.stringify(a1));
const direct = payout(`${pay1.id}-langsung`);
check("bagian langsung dikirim ke rekening pelaku (biaya dipotong dari pelaku)", direct?.status === "processing" && direct?.gross === 2100000 && direct?.fee === 5000 && direct?.account_number === "1234567890", JSON.stringify(direct));
const xp = await xPayouts();
check("Xendit menerima pencairan bersih ke rekening yang disetujui", xp.length === 1 && xp[0].amount === 2095000 && xp[0].channel_code === "ID_BCA" && xp[0].channel_properties.account_holder_name === "Sanggar Uji", JSON.stringify(xp));
await hook({ id: pay1.invoice_id, external_id: pay1.id, status: "PAID", paid_amount: 3005000 });
check("pemberitahuan ganda tidak menggandakan saldo atau pencairan", amanah(id).held === 900000 && (await xPayouts()).length === 1 && Number(psql(`select count(*) from escrow_payouts where case_id='${id}'`)) === 1);
check("kedua pihak diberi tahu pembayaran", Number(psql(`select count(*) from notifications where kind='escrow_paid'`)) === 2);
await hook({ event: "payout.succeeded", data: { id: xp[0].id, reference_id: `${pay1.id}-langsung`, status: "SUCCEEDED" } });
check("pencairan berhasil tercatat", payout(`${pay1.id}-langsung`).status === "succeeded");
check("pelaku diberi tahu dana terkirim", Number(psql(`select count(*) from notifications where user_id='${V.id}' and kind='payout_ok'`)) === 1);
check("pelaku memulai setelah DP terkonfirmasi gateway", (await step(V, id, "start")).status === 200);

// ---------- Pencairan dua pihak ----------
check("vendor mengusulkan pencairan", (await step(V, id, "propose_release", { amount: 400000, note: "Persiapan busana adat sudah selesai." })).status === 200);
check("keluarga menyetujui pencairan", (await step(C, id, "approve_release", { ack: true })).status === 200);
const rel = JSON.parse(psql(`select row_to_json(p) from escrow_payouts p where case_id='${id}' and kind='release'`));
check("pencairan dikirim lewat Xendit", rel.status === "processing" && rel.gross === 400000 && amanah(id).held === 500000, JSON.stringify(rel));

// Rekening diubah: pencairan berikutnya ditahan sampai disetujui ulang, lalu dikirim ke rekening baru.
await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: V.token, body: { account_number: "5555555555" } });
check("rekening diubah kembali menunggu pemeriksaan", psql(`select status from vendor_bank_accounts where vendor_id='${V.id}'`) === "pending");
await step(V, id, "propose_release", { amount: 200000, note: "Pelaksanaan hari pertama sudah selesai." });
await step(C, id, "approve_release", { ack: true });
const rel2 = JSON.parse(psql(`select row_to_json(p) from escrow_payouts p where case_id='${id}' and kind='release' and gross=200000`));
check("pencairan ditahan saat rekening belum disetujui", rel2.status === "awaiting_account", JSON.stringify(rel2));
check("non-peninjau tidak dapat mengirim pencairan", (await step(V, id, "flush_vendor_payouts", { vendorId: V.id })).status === 403);
await api(`/rest/v1/vendor_bank_accounts?vendor_id=eq.${V.id}`, { method: "PATCH", token: A.token, body: { status: "approved" } });
const flushed = await step(A, id, "flush_vendor_payouts", { vendorId: V.id });
const rel2b = payout(rel2.id);
check("setelah disetujui, pencairan dikirim ke rekening baru", flushed.data?.sent === 1 && rel2b.status === "processing" && rel2b.account_number === "5555555555", JSON.stringify(rel2b));
await hook({ event: "payout.failed", data: { reference_id: rel2.id, status: "FAILED", failure_code: "INVALID_DESTINATION" } });
check("pencairan gagal tercatat dan peninjau diberi tahu", payout(rel2.id).status === "failed" && Number(psql(`select count(*) from notifications where user_id='${A.id}' and kind='payout_failed'`)) === 1);
const retry = await step(A, id, "admin_payout", { payoutId: rel2.id });
check("peninjau mengirim ulang dengan kunci baru", retry.status === 200 && payout(rel2.id).status === "processing" && payout(rel2.id).attempts === 2 && (await xPayouts()).length === 4, JSON.stringify(retry));

// ---------- Pembatalan: refund ke keluarga (diperiksa peninjau) dan sisa ke pelaku ----------
check("sisa dana ditahan sebelum batal", amanah(id).held === 300000);
await step(C, id, "propose_cancel", { refund: 200000, note: "Acara diundur karena keluarga berduka." });
check("pelaku menyetujui pembatalan", (await step(V, id, "approve_cancel", { ack: true })).status === 200 && psql(`select phase from cooperations where id='${id}'`) === "cancelled");
const refund = JSON.parse(psql(`select row_to_json(p) from escrow_payouts p where case_id='${id}' and kind='refund'`));
const rest = JSON.parse(psql(`select row_to_json(p) from escrow_payouts p where case_id='${id}' and kind='remainder'`));
check("refund menunggu rekening keluarga; sisa ke pelaku dikirim", refund.status === "awaiting_account" && refund.gross === 200000 && rest.status === "processing" && rest.gross === 100000, JSON.stringify([refund, rest]));
check("keluarga diberi tahu untuk mengisi rekening refund", Number(psql(`select count(*) from notifications where user_id='${C.id}' and kind='refund_account'`)) === 1);
check("keluarga lain tidak dapat mengisi rekening refund", (await step(C2, id, "refund_account", { payoutId: refund.id, bankCode: "ID_BRI", accountNumber: "123456789012345", holderName: "Orang Lain" })).status === 404);
check("rekening refund wajib valid", (await step(C, id, "refund_account", { payoutId: refund.id, bankCode: "BRI", accountNumber: "abc", holderName: "A" })).status === 400);
check("keluarga mengisi rekening refund", (await step(C, id, "refund_account", { payoutId: refund.id, bankCode: "ID_BRI", accountNumber: "123456789012345", holderName: "Andi Rahma" })).status === 200 && payout(refund.id).status === "awaiting_admin");
check("keluarga tidak dapat mengirim refund sendiri", (await step(C, id, "admin_payout", { payoutId: refund.id })).status === 403);
const sendRefund = await step(A, id, "admin_payout", { payoutId: refund.id });
check("peninjau mengirim refund ke rekening keluarga", sendRefund.status === 200 && payout(refund.id).status === "processing" && (await xPayouts()).at(-1).channel_properties.account_number === "123456789012345", JSON.stringify(sendRefund));

// ---------- Hak baca & tagihan kedaluwarsa ----------
check("keluarga melihat pencairan kerja samanya", ((await api(`/rest/v1/escrow_payouts?select=id&case_id=eq.${id}`, { token: C.token })).data ?? []).length === 5);
check("keluarga lain tidak melihat pembayaran/pencairan", ((await api(`/rest/v1/escrow_payouts?select=id`, { token: C2.token })).data ?? []).length === 0 && ((await api(`/rest/v1/escrow_payments?select=id`, { token: C2.token })).data ?? []).length === 0);
check("browser tidak dapat menulis pembayaran", (await api("/rest/v1/escrow_payments", { method: "POST", token: C.token, body: { id: "palsu-123456", case_id: id, couple_id: C.id, vendor_id: V.id, amount: 1, held: 1, mode: "amanah", status: "paid" } })).status >= 400);
const lead2 = await act(C, { vendorId: V.id, action: { type: "lead", id: crypto.randomUUID(), data: { date: "2027-09-20", request: "Pemandu adat untuk akad nikah keluarga kedua." } } });
const id2 = lead2.data.row.id;
await step(C, id2, "submit"); await step(V, id2, "reply", { note: "Kami tersedia untuk tanggal tersebut." });
await step(V, id2, "offer", { ...offer, paymentMode: "amanah" }); await step(C, id2, "accept_offer");
await step(C, id2, "approve", { version: 1, ack: true }); await step(V, id2, "approve", { version: 1, ack: true });
const inv2 = (await step(C, id2, "pay_invoice", { amount: 1000000 })).data.payment;
check("Dana Amanah penuh: seluruhnya ditahan", inv2?.held === 1000000);
await api("/__xendit/expire", { method: "POST", body: { invoice_id: inv2.invoice_id } });
await hook({ id: inv2.invoice_id, external_id: inv2.id, status: "EXPIRED" });
check("tagihan kedaluwarsa tercatat dan tidak menambah saldo", psql(`select status from escrow_payments where id='${inv2.id}'`) === "expired" && (amanah(id2)?.held ?? 0) === 0);
check("setelah kedaluwarsa, nominal dapat ditagih ulang", (await step(C, id2, "pay_invoice", { amount: 10000000 })).status === 200);
console.log(`=== ${pass} lulus, ${fail} gagal ===`);
process.exit(fail ? 1 : 0);
