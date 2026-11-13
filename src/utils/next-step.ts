import { amanahOf, confirmedTotal, isAmanah, reservedTotal, type Actor, type Cooperation } from "./cooperation";

export const actorNames: Record<Actor, string> = { couple: "Keluarga", vendor: "Pelaku budaya", admin: "Peninjau VAKSARA" };

export type NextStep = {
  /** Pihak yang harus bertindak; null bila kerja sama sudah selesai. */
  actor: Actor | null;
  /** Kalimat perintah singkat, mis. "Kirim penawaran". */
  title: string;
  /** Penjelasan satu kalimat dengan bahasa sehari-hari. */
  detail: string;
};

/** Menentukan giliran siapa dan apa langkah berikutnya untuk satu kerja sama. */
export function nextStep(item: Cooperation): NextStep {
  const amanah = amanahOf(item);
  if (isAmanah(item) && amanah.release && !["disputed", "cancelled", "completed"].includes(item.phase)) {
    const other: Actor = amanah.release.by === "vendor" ? "couple" : "vendor";
    return { actor: other, title: "Jawab usulan pencairan Dana Amanah", detail: `${actorNames[amanah.release.by]} mengusulkan pencairan. Setujui atau tolak di bagian Dana Amanah.` };
  }
  const price = item.offer?.price ?? 0, deposit = item.offer?.deposit ?? 0;
  const pending = item.payments.some((p) => p.status === "pending");
  switch (item.phase) {
    case "draft":
      return { actor: "couple", title: "Kirim permintaan", detail: "Permintaan masih draf. Kirim agar pelaku budaya dapat membalas." };
    case "inquiry":
      return { actor: "vendor", title: "Balas permintaan", detail: "Pelaku budaya membaca kebutuhan keluarga lalu membalas atau menolak." };
    case "replied":
      return { actor: "vendor", title: "Kirim penawaran", detail: "Tulis lingkup, jadwal, harga, DP, dan cara pembayaran." };
    case "offered":
      return { actor: "couple", title: "Tinjau penawaran", detail: "Terima penawaran untuk lanjut ke perjanjian, atau minta revisi." };
    case "contract": {
      const waiting: Actor = !item.approvals.couple ? "couple" : "vendor";
      return { actor: waiting, title: "Setujui versi perjanjian", detail: "Perjanjian berlaku setelah kedua pihak menyetujui versi yang sama." };
    }
    case "active":
      if (confirmedTotal(item) < deposit) {
        if (pending) return { actor: "vendor", title: "Konfirmasi pembayaran DP", detail: "Keluarga sudah mencatat transfer. Pelaku budaya mengonfirmasi uang diterima." };
        return { actor: "couple", title: isAmanah(item) ? "Setor DP ke Dana Amanah" : "Catat transfer DP", detail: isAmanah(item) ? "Dana ditahan dan baru cair dengan persetujuan kedua pihak." : "Transfer langsung ke pelaku budaya, lalu catat buktinya." };
      }
      return { actor: "vendor", title: "Mulai pelaksanaan", detail: "DP sudah terpenuhi. Pelaku budaya menandai layanan dimulai." };
    case "running":
    case "revision":
      return { actor: "vendor", title: item.phase === "revision" ? "Perbaiki dan ajukan BAST lagi" : "Ajukan BAST", detail: "Setelah layanan selesai, pelaku budaya mengajukan berita acara serah terima." };
    case "handover":
      return { actor: "couple", title: "Periksa hasil dan terima BAST", detail: "Terima bila sesuai perjanjian, atau minta perbaikan." };
    case "accepted":
      if (reservedTotal(item) < price) return { actor: "couple", title: isAmanah(item) ? "Setor pelunasan ke Dana Amanah" : "Catat pelunasan", detail: "BAST sudah diterima. Sisa pembayaran dilunasi sesuai perjanjian." };
      if (pending) return { actor: "vendor", title: "Konfirmasi pelunasan", detail: "Pelaku budaya mengonfirmasi uang pelunasan diterima." };
      if (isAmanah(item) && amanah.held > 0) return { actor: "vendor", title: "Ajukan pencairan Dana Amanah", detail: "Pelaku budaya mengajukan pencairan dana yang ditahan; keluarga lalu menyetujuinya." };
      return { actor: "couple", title: "Tutup kerja sama", detail: "Semua sudah lunas dan diterima. Tutup agar tercatat sebagai rekam jejak." };
    case "disputed":
      return { actor: "admin", title: "Mediasi sengketa", detail: "Peninjau membaca catatan kedua pihak. Kedua pihak juga dapat menyepakati pembatalan." };
    case "cancel_pending":
      return { actor: item.cancellation?.couple ? "vendor" : "couple", title: "Jawab usulan pembatalan", detail: "Pembatalan dan refund berlaku bila pihak lain menyetujui." };
    case "refund_due":
      return { actor: "vendor", title: "Kirim dan catat refund", detail: "Pelaku budaya mengembalikan dana yang disepakati." };
    case "refund_sent":
      return { actor: "couple", title: "Konfirmasi refund diterima", detail: "Keluarga memastikan dana pengembalian sudah masuk." };
    case "completed":
      return { actor: null, title: "Kerja sama selesai", detail: "Tercatat sebagai rekam jejak pelaku budaya." };
    case "cancelled":
      return { actor: null, title: "Kerja sama dibatalkan", detail: "Pembatalan sudah disepakati dan tercatat." };
    case "declined":
      return { actor: null, title: "Permintaan ditolak", detail: "Keluarga dapat mengirim permintaan ke pelaku budaya lain." };
    default:
      return { actor: null, title: "Lihat riwayat", detail: "" };
  }
}
