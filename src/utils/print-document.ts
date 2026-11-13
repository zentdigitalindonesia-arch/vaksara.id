import { confirmedTotal, phaseLabels, type Cooperation } from "./cooperation";

const esc = (value: string): string => value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
const rupiah = (n: number): string => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;

/** Membuka dokumen perjanjian atau BAST yang dapat dicetak / disimpan sebagai PDF dari browser. */
export function printCooperation(item: Cooperation, kind: "agreement" | "handover", couple: string): boolean {
  if (!item.offer) return false;
  const win = window.open("", "_blank");
  if (!win) return false;
  const o = item.offer;
  const title = kind === "agreement" ? `Perjanjian Kerja Sama v${o.version}` : "Berita Acara Serah Terima (BAST)";
  const days = o.days.map((d) => `<tr><td>${esc(d.date)}</td><td>${esc(d.location)}</td></tr>`).join("");
  const payments = item.payments.map((p) => `<tr><td>${rupiah(p.amount)}</td><td>${p.status === "confirmed" ? "Dikonfirmasi penerima" : p.status === "pending" ? "Menunggu konfirmasi" : "Ditolak"}</td><td>${esc(p.proof)}</td></tr>`).join("") || `<tr><td colspan="3">Belum ada catatan</td></tr>`;
  const body = kind === "agreement"
    ? `<h2>Para pihak</h2><p>Pengguna: <b>${esc(couple)}</b><br>Pelaku budaya / vendor: <b>${esc(item.vendor)}</b></p>
       <h2>Lingkup dan hasil layanan</h2><p>${esc(o.scope)}</p>
       <h2>Jadwal dan lokasi</h2><table><tr><th>Tanggal</th><th>Lokasi</th></tr>${days}</table>
       <h2>Nilai dan pembayaran</h2><p>Nilai layanan ${rupiah(o.price)} · DP disepakati ${rupiah(o.deposit)}. ${o.paymentMode === "amanah" ? "Cara pembayaran: <b>Dana Amanah</b>. Dana disetor ke rekening penampung mitra pembayaran berizin dan hanya dicairkan kepada pelaku budaya dengan persetujuan kedua pihak; refund atas pembatalan bersama dikembalikan dari dana yang masih ditahan." : "Cara pembayaran: transfer langsung kepada pelaku budaya; VAKSARA hanya mencatat."}</p>
       <h2>Termin, pengecualian, dan pembatalan</h2><p>${esc(o.terms)}</p>
       <h2>Persetujuan</h2><p>Pengguna: ${item.approvals.couple ? "menyetujui versi ini" : "belum menyetujui"} · Pelaku budaya: ${item.approvals.vendor ? "menyetujui versi ini" : "belum menyetujui"}</p>`
    : `<h2>Para pihak</h2><p>Pengguna: <b>${esc(couple)}</b><br>Pelaku budaya / vendor: <b>${esc(item.vendor)}</b></p>
       <h2>Hasil layanan yang diserahkan</h2><p>${esc(item.evidence || "Belum diajukan")}</p>
       <h2>Status serah terima</h2><p>${esc(phaseLabels[item.phase])}</p>
       <h2>Catatan pembayaran</h2><table><tr><th>Nominal</th><th>Status</th><th>Referensi</th></tr>${payments}</table>
       <p>Total dikonfirmasi: ${rupiah(confirmedTotal(item))} dari ${rupiah(o.price)}.${item.amanah ? ` Dana Amanah — ditahan ${rupiah(item.amanah.held)}, dicairkan ${rupiah(item.amanah.released)}, dikembalikan ${rupiah(item.amanah.refunded)}.` : ""}</p>`;
  win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font-family:Georgia,serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1a2e27;line-height:1.55;font-size:15px}
    h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 6px;color:#1f3d33}.demo{border:2px dashed #b8893f;padding:8px 12px;font-family:Arial,sans-serif;font-size:13px;margin:16px 0}
    table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}.sign{display:flex;gap:40px;margin-top:48px}.sign div{flex:1;border-top:1px solid #333;padding-top:6px;font-size:13px}
    button{font-size:14px;padding:8px 14px;margin-top:20px}@media print{button{display:none}}</style></head><body>
    <h1>${esc(title)}</h1><p>ID kerja sama ${esc(item.id)} · Tanggal acara ${esc(item.eventDate)}</p>
    <div class="demo">DOKUMEN CONTOH DARI PROTOTIPE VAKSARA. Bukan kontrak sah dan tidak memiliki tanda tangan elektronik.</div>
    ${body}<div class="sign"><div>Pengguna<br>${esc(couple)}</div><div>Pelaku budaya<br>${esc(item.vendor)}</div></div>
    <button onclick="window.print()">Cetak / simpan PDF</button></body></html>`);
  win.document.close();
  return true;
}
