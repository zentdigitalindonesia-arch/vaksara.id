import { liveBoot } from "@/LiveContext";
// Di akun nyata, label "demo" pada alur kerja sama dihapus; penanda "(simulasi)" untuk Dana Amanah tetap ada
// karena pembayaran memang masih pencatatan, bukan dana sungguhan.
const live = liveBoot();
const fixed: Record<string, string> = {
  "Contoh: catatan hasil layanan atau referensi bukti transfer demo. Bukan unggah file nyata.": "Contoh: catatan hasil layanan atau nomor referensi transfer. Unggah file menyusul.",
  "Pembayaran langsung ke vendor (catatan manual demo)": "Pembayaran langsung ke vendor (dicatat manual)",
  "Saya mengonfirmasi refund sudah diterima (demo).": "Saya mengonfirmasi refund sudah diterima.",
};
export const T = (s: string): string => !live ? s : fixed[s] ?? s
  .replace(/ \((demo|simulasi lengkap)\)/g, "")
  .replace(/ pada simulasi ini/g, "")
  .replace(/\s*Semua data (di sini )?(adalah )?simulasi\./g, "")
  .replace(/ (demo|Demo)(?=[\s.,)]|$)/g, "");
export const liveText = live;
