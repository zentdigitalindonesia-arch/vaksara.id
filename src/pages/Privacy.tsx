import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useApp } from "@/store";
import { useLive } from "@/LiveContext";
import { friendly, liveEnabled, q, rest } from "@/utils/supabase";

// Kebijakan privasi VAKSARA (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi) dan formulir permintaan data.
const UPDATED = "14 November 2026";
type Kind = "directory_remove" | "directory_fix" | "account_delete" | "data_access" | "consent_withdraw" | "other";
const kinds: [Kind, string][] = [
  ["directory_remove", "Hapus usaha saya dari direktori publik"],
  ["directory_fix", "Koreksi data usaha saya di direktori publik"],
  ["account_delete", "Hapus akun dan data saya"],
  ["data_access", "Minta salinan data saya"],
  ["consent_withdraw", "Tarik persetujuan (mis. foto wajah)"],
  ["other", "Lainnya"],
];
const kindLabel = (k: string) => kinds.find(([v]) => v === k)?.[1] ?? k;

const sections: [string, string[]][] = [
  ["Siapa kami", ["VAKSARA adalah platform akses pasar dan kepercayaan bagi pelaku budaya pernikahan adat Bugis–Makassar, dikelola tim VAKSARA di Kabupaten Gowa, Sulawesi Selatan. VAKSARA bertindak sebagai pengendali data pribadi untuk data yang dikumpulkan lewat vaksara.id."]],
  ["Data yang kami kumpulkan", [
    "Data akun: nama, email, nomor WhatsApp, kota, dan peran (keluarga atau pelaku budaya).",
    "Profil layanan pelaku budaya: nama usaha, kategori, wilayah, deskripsi, prosesi yang dilayani, harga mulai, dan kontak usaha yang Anda pilih untuk ditampilkan.",
    "Dokumen verifikasi pelaku budaya: KTP penanggung jawab, foto kegiatan, NIB atau izin usaha (bila ada), dan surat rekomendasi (bila ada).",
    "Data biometrik pelaku budaya: satu foto wajah dan hasil verifikasi wajah. Gerakan wajah diproses di perangkat Anda; yang dikirim ke VAKSARA hanya satu foto dan urutan langkah yang diselesaikan. Ini data pribadi yang bersifat spesifik dan hanya diambil dengan persetujuan tegas Anda.",
    "KTP keluarga: diminta saat keluarga menyetujui perjanjian kerja sama.",
    "Data kerja sama: permintaan, penawaran, versi perjanjian, catatan pembayaran, BAST, sengketa, dan riwayat tindakan.",
    "Data perencanaan acara: rencana, daftar tugas, tamu, anggaran, dan rundown yang Anda simpan.",
    "Direktori publik: nama, kategori, alamat, kontak, dan akun media sosial usaha pernikahan yang dikumpulkan dari sumber yang terbuka di internet, dengan sumbernya dicantumkan.",
  ]],
  ["Untuk apa data dipakai", [
    "Menjalankan akun dan layanan: pendaftaran, masuk, perencanaan acara, dan alur kerja sama.",
    "Memverifikasi pelaku budaya sebelum tampil di direktori (identitas, konteks budaya, dan persetujuan publikasi).",
    "Mencatat kesepakatan kedua pihak dan membantu mediasi bila terjadi sengketa.",
    "Mengirim pemberitahuan di aplikasi dan email tentang kerja sama dan akun Anda. Email dapat dimatikan lewat ikon lonceng.",
    "Kami tidak menjual data pribadi dan tidak memakainya untuk iklan.",
  ]],
  ["Dasar pemrosesan", ["Persetujuan Anda (termasuk persetujuan tegas untuk foto wajah), pelaksanaan perjanjian kerja sama yang Anda buat, dan kepentingan yang sah untuk menjaga keamanan platform. Direktori publik memakai informasi usaha yang telah dipublikasikan pemiliknya; pemilik dapat meminta penghapusan kapan saja."]],
  ["Siapa yang dapat melihat", [
    "Profil layanan yang disetujui dapat dilihat publik. Nomor WhatsApp pribadi dan data akun lainnya tidak ditampilkan.",
    "Dokumen verifikasi, KTP, dan foto wajah hanya dapat dibuka oleh pemiliknya dan peninjau VAKSARA, lewat tautan sementara. Pelaku budaya tidak dapat melihat KTP keluarga.",
    "Data kerja sama hanya dapat dilihat kedua pihak dan peninjau VAKSARA.",
  ]],
  ["Penyedia layanan dan lokasi data", ["Data disimpan dan diproses oleh penyedia infrastruktur kami: Supabase (basis data, akun, dan penyimpanan berkas), Vercel (situs web), dan Resend (pengiriman email). Model pengenal wajah dimuat dari server Google, tetapi wajah Anda diproses di perangkat Anda sendiri. Server penyedia ini dapat berada di luar Indonesia; kami memilih penyedia yang menerapkan enkripsi dan kontrol akses."]],
  ["Berapa lama disimpan", [
    "Data akun dan profil: selama akun aktif.",
    "KTP, dokumen verifikasi, dan foto wajah: selama akun aktif, dan dihapus paling lambat 30 hari setelah akun dihapus atau pendaftaran pelaku dibatalkan.",
    "Data kerja sama: selama diperlukan sebagai bukti kesepakatan dan penyelesaian sengketa.",
  ]],
  ["Hak Anda", ["Anda berhak mengakses, memperbaiki, menghapus data, meminta salinan, serta menarik persetujuan (termasuk untuk foto wajah). Ajukan lewat formulir di bawah. Kami menanggapi paling lambat 3 x 24 jam kerja dan menyelesaikannya sesuai ketentuan UU No. 27 Tahun 2022."]],
  ["Keamanan", ["Akses data dibatasi aturan di tingkat basis data, berkas verifikasi disimpan di penyimpanan privat, dan setiap langkah kerja sama diperiksa di server. Bila terjadi kegagalan pelindungan data, kami akan memberi tahu pengguna yang terdampak sesuai ketentuan yang berlaku."]],
  ["Usia pengguna", ["Akun VAKSARA ditujukan bagi pengguna berusia minimal 17 tahun."]],
];

export function DataRequestForm({ initialKind = "directory_remove", initialSubject = "" }: { initialKind?: Kind; initialSubject?: string }) {
  const { toast } = useApp();
  const { live, email } = useLive();
  const [f, setF] = useState({ kind: initialKind, subject: initialSubject, contact: email || "", message: "" });
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.subject.trim().length < 2) return setError("Tulis nama usaha atau akun yang dimaksud.");
    if (f.contact.trim().length < 5) return setError("Tulis email atau nomor WhatsApp agar kami dapat menghubungi Anda.");
    setBusy(true); setError("");
    try { await rest("data_requests", { method: "POST", body: { kind: f.kind, subject: f.subject.trim(), contact: f.contact.trim(), message: f.message.trim() }, prefer: "return=minimal", anon: !live }); setSent(true); toast("Permintaan terkirim. Kami akan menghubungi Anda.", "success"); }
    catch (err) { setError(friendly(err)); } finally { setBusy(false); }
  };
  if (!liveEnabled) return <p className="text-sm text-muted">Formulir tersedia di vaksara.id.</p>;
  if (sent) return <p role="status" className="rounded-xl bg-[#EEF7F1] p-3 text-sm text-[#1E5C38]">Permintaan Anda sudah kami terima. Peninjau VAKSARA akan menghubungi lewat kontak yang Anda berikan.</p>;
  return <form onSubmit={submit} className="space-y-3" aria-label="Permintaan data pribadi">
    <Field label="Jenis permintaan"><Select aria-label="Jenis permintaan" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Kind })}>{kinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
    <Field label="Nama usaha atau akun yang dimaksud"><Input aria-label="Nama usaha atau akun" maxLength={200} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></Field>
    <Field label="Email atau WhatsApp Anda"><Input aria-label="Kontak pemohon" maxLength={200} value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} /></Field>
    <Field label="Keterangan (opsional)"><Textarea aria-label="Keterangan permintaan" maxLength={2000} rows={3} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Mis. data yang perlu dikoreksi, atau bukti bahwa Anda pemilik usaha." /></Field>
    {error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Mengirim…" : "Kirim permintaan"}</Button>
  </form>;
}

export default function PrivacyPage() {
  const { route } = useApp();
  const params = new URLSearchParams(route.split("?")[1] ?? "");
  const usaha = params.get("usaha") ?? "";
  useEffect(() => { if (usaha) document.getElementById("permintaan-data")?.scrollIntoView({ behavior: "smooth" }); }, [usaha]);
  return <div className="mx-auto max-w-3xl px-4 py-10">
    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-sand-deep">Kebijakan privasi</p>
    <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Bagaimana VAKSARA menjaga data Anda</h1>
    <p className="mt-2 text-sm text-muted">Berlaku sejak {UPDATED}. Mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>
    <div className="mt-6 space-y-6">{sections.map(([title, items]) => <section key={title}>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {items.length === 1 ? <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{items[0]}</p> : <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft">{items.map(i => <li key={i}>{i}</li>)}</ul>}
    </section>)}</div>
    <Card className="mt-8 p-5" id="permintaan-data">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-sand-deep" /><h2 className="font-display text-xl text-ink">Ajukan permintaan data pribadi</h2></div>
      <p className="mt-1 text-[13px] text-muted">Untuk pemilik usaha di direktori publik dan pemilik akun VAKSARA.</p>
      <div className="mt-3"><DataRequestForm initialKind={usaha ? "directory_remove" : "data_access"} initialSubject={usaha} /></div>
    </Card>
  </div>;
}

type DataRequest = { id: string; kind: string; subject: string; contact: string; message: string; status: "open" | "done" | "rejected"; handled_note: string; created_at: string; handled_at: string | null };
/** Daftar permintaan data pribadi untuk peninjau (is_admin). */
export function DataRequestsAdmin() {
  const { toast } = useApp();
  const [rows, setRows] = useState<DataRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = () => rest<DataRequest[]>("data_requests?select=*&order=created_at.desc&limit=50").then(setRows).catch(() => undefined);
  useEffect(() => { load(); }, []);
  const decide = async (r: DataRequest, status: "done" | "rejected") => {
    const note = (notes[r.id] ?? "").trim();
    if (note.length < 5) { toast("Tulis catatan tindak lanjut (min. 5 karakter).", "warn"); return; }
    try { await rest(`data_requests?id=eq.${q(r.id)}`, { method: "PATCH", body: { status, handled_note: note, handled_at: new Date().toISOString() }, prefer: "return=minimal" }); toast("Permintaan diperbarui.", "success"); load(); }
    catch (e) { toast(friendly(e), "error"); }
  };
  const open = rows.filter(r => r.status === "open");
  return <section className="mt-8" aria-label="Permintaan data pribadi">
    <h2 className="font-display text-2xl text-ink">Permintaan data pribadi {open.length > 0 && <Badge tone="red">{open.length} terbuka</Badge>}</h2>
    <p className="mt-1 text-sm text-muted">Tanggapi paling lambat 3 x 24 jam kerja. Hapus atau koreksi data di sumbernya (mis. src/daftar-vendor.csv untuk direktori publik), lalu tandai selesai.</p>
    {rows.length === 0 && <Card className="mt-3 p-5 text-sm text-muted">Belum ada permintaan.</Card>}
    <div className="mt-3 space-y-2">{rows.map(r => <Card key={r.id} className="p-4">
      <div className="flex flex-wrap items-center gap-2"><Badge tone={r.status === "open" ? "sand" : r.status === "done" ? "green" : "neutral"}>{r.status === "open" ? "Terbuka" : r.status === "done" ? "Selesai" : "Ditolak"}</Badge><b className="text-ink">{kindLabel(r.kind)}</b><span className="text-[13px] text-muted">{new Date(r.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
      <p className="mt-1 text-sm text-ink-soft"><b>{r.subject}</b> · kontak {r.contact}</p>
      {r.message && <p className="mt-1 text-sm text-ink-soft">{r.message}</p>}
      {r.status === "open" ? <div className="mt-2 flex flex-wrap items-end gap-2"><Field label="Catatan tindak lanjut" className="min-w-[220px] flex-1"><Input aria-label={`Catatan ${r.subject}`} value={notes[r.id] ?? ""} onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} /></Field><Button size="sm" onClick={() => decide(r, "done")}>Tandai selesai</Button><Button size="sm" variant="secondary" onClick={() => decide(r, "rejected")}>Tolak</Button></div> : r.handled_note && <p className="mt-1 text-[13px] text-muted">Tindak lanjut: {r.handled_note}</p>}
    </Card>)}</div>
  </section>;
}
