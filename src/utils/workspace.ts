import { confirmedTotal, type Actor, type Cooperation, type Flow } from "./cooperation";
export type WorkspaceView = "overview" | "requests" | "offers" | "agreements" | "payments" | "delivery" | "handover" | "issues";
export const workspaceTitles: Record<WorkspaceView, string> = { overview: "Ringkasan kerja sama", requests: "Permintaan layanan", offers: "Penawaran layanan", agreements: "Perjanjian kerja sama", payments: "Pembayaran", delivery: "Pelaksanaan layanan", handover: "Serah terima / BAST", issues: "Pembatalan dan pengaduan" };
export const stageNames: Record<WorkspaceView, string> = { overview: "Semua", requests: "Permintaan", offers: "Penawaran", agreements: "Perjanjian", payments: "Pembayaran", delivery: "Pelaksanaan", handover: "BAST", issues: "Masalah & batal" };
export function caseRoute(actor: Actor, view: WorkspaceView, id?: string): string {
  const routes: Record<Actor, Record<WorkspaceView, string>> = {
    couple: { overview: "planner", requests: "planner/vendor", offers: "planner/penawaran", agreements: "trust", payments: "planner/pembayaran", delivery: "planner/pelaksanaan", handover: "bast", issues: "sengketa" },
    vendor: { overview: "vendor/ringkasan", requests: "vendor/permintaan", offers: "vendor/penawaran", agreements: "vendor/kontrak", payments: "vendor/pembayaran", delivery: "vendor/pelaksanaan", handover: "vendor/bast", issues: "vendor/pengaduan" },
    admin: { overview: "admin/overview", requests: "admin/alur", offers: "admin/alur", agreements: "admin/perjanjian", payments: "admin/alur", delivery: "admin/alur", handover: "admin/alur", issues: "admin/pengaduan" },
  };
  return routes[actor][view] + (id ? `?case=${encodeURIComponent(id)}` : "");
}
export function visibleCases(flow: Flow, actor: Actor): Cooperation[] { return flow.cases.filter(c => actor !== "vendor" || (c.phase !== "draft" && c.vendor === flow.accounts.vendor?.name)); }
export function casesForView(cases: Cooperation[], view: WorkspaceView): Cooperation[] {
  if (view === "offers" || view === "agreements") return cases.filter(c => c.offer !== null || (view === "offers" && c.phase === "replied"));
  if (view === "payments") return cases.filter(c => c.offer && !["draft", "inquiry", "replied", "offered", "contract", "declined"].includes(c.phase));
  if (view === "delivery") return cases.filter(c => ["active", "running", "handover", "revision", "accepted", "completed"].includes(c.phase));
  if (view === "handover") return cases.filter(c => ["handover", "revision", "accepted", "completed"].includes(c.phase));
  if (view === "issues") return cases.filter(c => ["disputed", "cancel_pending", "refund_due", "refund_sent", "cancelled", "declined"].includes(c.phase));
  return cases;
}
export function nextView(item: Cooperation): WorkspaceView {
  switch (item.phase) {
    case "draft": case "inquiry": case "declined": return "requests";
    case "replied": case "offered": return "offers";
    case "contract": return "agreements";
    case "active": return item.offer && confirmedTotal(item) < item.offer.deposit ? "payments" : "delivery";
    case "running": case "revision": return "delivery";
    case "handover": case "completed": return "handover";
    case "accepted": return item.offer && confirmedTotal(item) < item.offer.price ? "payments" : "handover";
    default: return "issues";
  }
}
/** Halaman tahap tempat tombol untuk langkah berikutnya berada (termasuk Dana Amanah dan konfirmasi pembayaran). */
export function actionView(item: Cooperation): WorkspaceView {
  const amanah = item.amanah;
  if (amanah?.release && !["disputed", "cancelled", "completed"].includes(item.phase)) return "payments";
  if (["active", "accepted"].includes(item.phase) && item.payments.some(p => p.status === "pending")) return "payments";
  if (item.phase === "accepted" && amanah && amanah.held > 0) return "payments";
  return nextView(item);
}
export function nextActionLabel(item: Cooperation, actor: Actor): string {
  if (item.phase === "inquiry") return actor === "vendor" ? "Tanggapi permintaan" : "Lihat permintaan";
  if (item.phase === "offered") return actor === "couple" ? "Tinjau penawaran" : "Lihat penawaran";
  if (item.phase === "contract") return actor !== "admin" && !item.approvals[actor] ? "Tinjau dan setujui versi" : "Lihat persetujuan";
  if (item.phase === "handover") return actor === "couple" ? "Periksa hasil layanan" : "Lihat BAST diajukan";
  if (item.phase === "completed" || item.phase === "cancelled" || item.phase === "declined") return "Lihat riwayat";
  if (item.phase === "refund_due") return actor === "vendor" ? "Catat pengembalian" : "Lihat refund disepakati";
  if (item.phase === "refund_sent") return actor === "couple" ? "Konfirmasi penerimaan refund" : "Lihat catatan refund";
  return "Lanjutkan tahap kerja sama";
}
