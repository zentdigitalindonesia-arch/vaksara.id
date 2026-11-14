import { liveEnabled } from "@/utils/supabase";
import { liveText } from "@/utils/live-text";
import { Motif, SectionHeading } from "@/components/brand";
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { formatIDR, images } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CreditCard,
  FileSignature,
  Globe2,
  Heart,
  HeartHandshake,
  HelpCircle,
  Lock,
  MessageSquare,
  Quote,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet
} from "lucide-react";
import { useState } from "react";

/* =========================== ABOUT =========================== */
export function AboutPage() {
  const { navigate, setAuthMode } = useApp();
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Motif type="arch" className="-right-24 top-0 h-[520px] w-[520px] text-sand" opacity={0.2} />
        <div className="relative mx-auto grid max-w-[1240px] gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/50 bg-white/70 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep"><HeartHandshake className="h-3 w-3" /> Tentang VAKSARA</div>
            <h1 className="text-balance font-display text-[2.3rem] font-semibold leading-[1.06] text-ink sm:text-[3.1rem]">Teknologi yang menjaga tradisi tetap hidup, bukan membekukannya.</h1>
            <p className="mt-4 max-w-xl text-[16px] leading-[1.8] text-ink-soft">VAKSARA menghubungkan keluarga dengan pelaku budaya dan vendor pernikahan yang dapat diperiksa. Kami membangun ruang untuk menemukan, menyepakati, dan meninjau kerja sama — dimulai dari Bugis-Makassar di Sulawesi Selatan.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => navigate("jelajahi")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Jelajahi pelaku budaya</Button><Button variant="secondary" onClick={() => navigate("pengetahuan")}>Pelajari pengetahuan</Button></div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-muted"><span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-[#4C8068]" /> Dimulai di Makassar</span><span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-[#4C8068]" /> Berbasis sumber & atribusi</span><span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-[#4C8068]" /> Ekonomi untuk komunitas</span></div>
          </div>
          <div className="relative">
            <img src={images.heroCeremony} alt="Prosesi pernikahan Bugis" className="aspect-[4/3.1] w-full rounded-2xl border-4 border-white object-cover shadow-lg" />
            <div className="absolute -bottom-4 -left-2 w-[190px] rounded-xl border border-line bg-white p-3 shadow-lg sm:-left-5">
              <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-muted"><Quote className="h-3 w-3 text-sand-deep" /> Prinsip kerja</div>
              <p className="mt-1 font-display text-[15px] leading-snug text-ink">"Bukan menilai mana adat yang paling benar."</p>
            </div>
            <div className="absolute right-2 top-3 rounded-lg border border-white/20 bg-forest/50 px-2 py-1 text-[12px] font-semibold text-cream backdrop-blur">Kendari · ilustrasi dokumentasi</div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-11 sm:py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading eyebrow="Misi" title="Fondasi ekonomi yang kuat untuk tradisi yang hidup." description="Tradisi dirawat oleh orang-orang yang bekerja di dalamnya. Jika pelaku budaya dapat hidup layak dari keahliannya, praktiknya punya kesempatan untuk terus diwariskan." align="center" />
          <div className="mx-auto mt-7 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              { icon: <Heart className="h-4 w-4" />, t: "Budaya dihormati", d: "Praktik tidak diseragamkan atau dijadikan sekadar daya tarik pasar." },
              { icon: <ShieldCheck className="h-4 w-4" />, t: "Kepercayaan dibangun", d: "Identitas, portofolio, dan pengetahuan diperiksa secara transparan." },
              { icon: <Wallet className="h-4 w-4" />, t: "Ekonomi yang adil", d: "Pelaku budaya mendapat ruang untuk menyatakan nilai dan batas kerja." },
            ].map((x) => <Card key={x.t} className="p-4 text-center"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sand-light text-sand-deep">{x.icon}</span><h3 className="mt-2 text-[15px] font-bold text-ink">{x.t}</h3><p className="mt-1 text-[14px] leading-relaxed text-muted">{x.d}</p></Card>)}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-[#FBF9F4] py-11 sm:py-14">
        <div className="mx-auto grid max-w-[1240px] gap-7 px-4 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div className="relative order-2 lg:order-1"><img src={images.family} alt="Keluarga dalam prosesi adat" className="aspect-[5/4] w-full rounded-2xl border-4 border-white object-cover shadow-md" /><div className="absolute -right-2 bottom-3 max-w-[200px] rounded-xl border border-line bg-white p-3 shadow-lg"><div className="flex items-center gap-1.5 text-[13px] font-bold text-ink"><Users className="h-3 w-3 text-sand-deep" /> Keluarga memimpin</div><p className="mt-0.5 text-[12px] leading-relaxed text-muted">Keputusan adat, anggaran, dan pemilihan vendor tetap pada keluarga.</p></div></div>
          <div className="order-1 lg:order-2">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-sand-deep">Dua sisi ekosistem</div>
            <h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.3rem]">Pasar memang dua sisi. Kepercayaan harus dua arah.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Kami memeriksa pelaku budaya, tetapi juga memberi mereka alat untuk memeriksa permintaan, mencatat kesepakatan, dan menanggapi pengaduan. Reviewer tidak dapat memalsukan persetujuan, menghapus bukti, atau mengubah dokumen yang telah disepakati.</p>
            <div className="mt-4 space-y-2.5">
              {[
                { t: "Pelaku budaya", d: "Identitas, portofolio, dan pengetahuan budaya. Dapat menolak permintaan dan menolak perubahan yang tidak adil." },
                { t: "Keluarga", d: "Kontak tidak dibagikan sebelum menghubungi. Dapat melaporkan masalah dan meminta peninjauan BAST." },
                { t: "Trust Officer", d: "Memfasilitasi, mencatat, dan menjaga akses. Tidak memutus perkara atau mewakili salah satu pihak." },
              ].map((x) => <div key={x.t} className="flex gap-2.5"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-sand"><Check className="h-3 w-3" /></span><div><h3 className="text-[14px] font-bold text-ink">{x.t}</h3><p className="mt-0.5 text-[14px] leading-relaxed text-muted">{x.d}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-11 sm:py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading eyebrow="Metodologi" title="Screening tiga lapis, bukan satu stempel." description="Setiap lapis punya statusnya sendiri. Keluarga dapat melihat mana yang sudah selesai dan mana yang masih ditinjau." />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[{ n: "01", t: "Identitas & kontak", d: "Nama dan kontak dicocokkan dengan pemilik akun. Data pribadi dibatasi sesuai kebutuhan.", icon: <ShieldCheck className="h-4 w-4" /> }, { n: "02", t: "Portofolio & pengalaman", d: "Karya diperiksa untuk relevansi, izin, dan atribusi. Bukan penilaian estetika semata.", icon: <BookOpen className="h-4 w-4" /> }, { n: "03", t: "Pengetahuan budaya", d: "Wawancara dan peninjauan konteks bersama praktisi. Belum tentu selesai saat identitas selesai.", icon: <Globe2 className="h-4 w-4" /> }].map((x) => <Card key={x.n} className="p-4"><div className="flex items-center justify-between"><span className="font-display text-[1.5rem] text-sand/80">{x.n}</span><span className="flex h-7 w-7 items-center justify-center rounded-md bg-sage text-[#2B5949]">{x.icon}</span></div><h3 className="mt-2 text-[15px] font-bold text-ink">{x.t}</h3><p className="mt-1 text-[14px] leading-relaxed text-muted">{x.d}</p></Card>)}
          </div>
          <Alert tone="trust" className="mt-3" title="Batas yang kami akui">Verifikasi bukan jaminan hasil layanan. Peninjauan tidak menentukan tradisi mana yang paling 'asli'. Kami dapat menolak listing yang mengeksploitasi praktik privat atau tidak memiliki izin.</Alert>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-11 text-cream sm:py-14">
        <Motif type="weave" className="-right-24 -top-24 h-[400px] w-[400px] text-sand" opacity={0.16} />
        <div className="relative mx-auto grid max-w-[1240px] gap-7 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div><div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-sand">{liveEnabled ? "Batas peran kami" : "Yang belum ada, dan kami akui"}</div><h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight sm:text-[2.3rem]">{liveEnabled ? "VAKSARA mencatat kesepakatan; bukan lembaga hukum atau keuangan." : "Prototipe ini bukan sistem hukum atau lembaga keuangan."}</h2><p className="mt-3 max-w-lg text-[15px] leading-relaxed text-cream/60">{liveEnabled ? "Penawaran, perjanjian, persetujuan, pembayaran, dan serah terima tercatat di akun kedua pihak dan tidak bisa diubah sepihak. VAKSARA tidak menahan uang di rekeningnya sendiri dan tidak memberikan putusan hukum; sengketa difasilitasi lewat jalur tertulis dan mediasi." : "Semua perjanjian, tanda tangan, pembayaran, dan verifikasi di sini adalah simulasi. VAKSARA tidak menahan uang di rekeningnya sendiri; Dana Amanah direncanakan ditampung mitra pembayaran berizin dan hanya cair dengan persetujuan dua pihak. Kami tidak memberikan putusan hukum. Integrasi Xendit serta penyedia tanda tangan tersertifikasi akan diumumkan sebelum diaktifkan."}</p></div>
          <div className="grid gap-2 sm:grid-cols-2">{(liveEnabled ? [["Dana tidak ditahan platform", "Pembayaran tercatat dan dikonfirmasi kedua pihak."], ["Fasilitasi, bukan putusan", "Sengketa lewat jalur tertulis dan mediasi."], ["Refund sesuai kesepakatan", "Mengikuti perjanjian yang disetujui bersama."], ["Verifikasi tidak bisa dibeli", "Status hanya dari peninjauan tiga lapis."]] : [["Tidak ada escrow", "Dana tidak ditahan platform."], ["Tidak ada putusan hukum", "Fasilitasi bukan arbitrase."], ["Tidak ada refund otomatis", "Kesepakatan bergantung para pihak."], ["Tidak ada sertifikasi palsu", "E-sign masih placeholder."]]).map(([t, d]) => <div key={t} className="rounded-xl border border-white/10 bg-white/[0.055] p-3"><p className="flex items-center gap-1.5 text-[14px] font-bold text-cream"><CircleAlert className="h-3 w-3 text-sand" />{t}</p><p className="mt-1 text-[13px] leading-relaxed text-cream/55">{d}</p></div>)}</div>
        </div>
      </section>

      <section className="border-b border-line py-11 sm:py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading eyebrow="Jalan kami" title="Dari satu komunitas, tumbuh dengan hati-hati." description="Kami tidak ingin tumbuh dengan menyeragamkan. Setiap wilayah dan komunitas membutuhkan peninjau lokal." />
          <div className="mt-5 grid gap-3 md:grid-cols-4">{[{ y: "Sebelum 2026", t: "VAKSARA 1.0", d: "Direktori pelaku budaya dan penyedia layanan pernikahan Makassar dengan kontak WhatsApp langsung." }, { y: "2026", t: liveEnabled ? "VAKSARA 2.0" : "Prototipe 2.0", d: liveEnabled ? "Berjalan di vaksara.id: akun, rencana acara, permintaan, penawaran berversi, perjanjian, DP, BAST, dan pengaduan dalam satu alur." : "Rencana acara, permintaan, penawaran berversi, perjanjian, DP, BAST, dan pengaduan dalam satu alur." }, { y: "2027", t: liveEnabled ? "Kurasi Makassar–Gowa" : "Pilot Makassar–Gowa", d: liveEnabled ? "Kunjungan, verifikasi tiga lapis, dan kontrak kerja sama dengan vendor." : "Akun server, peninjau budaya dari komunitas, dan uji harga (rencana)." }, { y: "Berikutnya", t: "Ekspansi berbasis konteks", d: "Wilayah baru hanya dengan mitra peninjau komunitas." }].map((x) => <div key={x.y} className="rounded-xl border border-line bg-[#FBFAF6] p-4"><div className="text-[12px] font-bold uppercase tracking-wider text-sand-deep">{x.y}</div><h3 className="mt-1 text-[15px] font-bold text-ink">{x.t}</h3><p className="mt-1 text-[13px] leading-relaxed text-muted">{x.d}</p></div>)}</div>
          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl bg-[#F1E9DA] p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><img src={images.weaving} alt="" className="h-12 w-12 rounded-lg object-cover" /><div><h3 className="text-[15px] font-bold text-ink">Ingin berkolaborasi atau menjadi peninjau?</h3><p className="mt-0.5 text-[14px] text-muted">Kami bekerja dengan praktisi, komunitas, dan peneliti yang memahami konteks lokal.</p></div></div><Button size="sm" onClick={() => setAuthMode("daftar")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Hubungi tim</Button></div>
        </div>
      </section>
    </>
  );
}

/* =========================== HELP =========================== */
const helpTopics = [
  { icon: <Sparkles className="h-4 w-4" />, t: "Memulai & menemukan", d: "Cara mencari pelaku budaya, menyimpan profil, dan mengirim pertanyaan.", items: 6 },
  { icon: <Wallet className="h-4 w-4" />, t: "Rencana Acara", d: "Anggaran, jadwal, vendor, tamu, dan rundown.", items: 8 },
  { icon: <FileSignature className="h-4 w-4" />, t: "Perjanjian & BAST", d: "Menyusun dokumen, persetujuan, dan serah terima.", items: 7 },
  { icon: <MessageSquare className="h-4 w-4" />, t: "Pengaduan", d: "Cara menyampaikan masalah dan apa yang dapat diharapkan.", items: 5 },
  { icon: <Store className="h-4 w-4" />, t: "Untuk pelaku budaya", d: "Profil, screening, permintaan, dan pembayaran.", items: 9 },
  { icon: <ShieldCheck className="h-4 w-4" />, t: "Keamanan & privasi", d: "Akses data, verifikasi, dan batas platform.", items: 4 },
];

const helpFaqs = [
  { q: "Bagaimana cara mulai merencanakan pernikahan?", a: "Masuk sebagai calon pengantin, tentukan tanggal perkiraan, lalu buka Rencana Acara. Anda dapat mulai dari anggaran atau langsung menjelajah pelaku budaya. Tidak perlu menyelesaikan semua data sekaligus." },
  { q: "Apakah data pembayaran saya aman?", a: "Prototipe ini tidak memproses atau menyimpan data pembayaran nyata. Pada tahap produksi, checkout akan di-host oleh Xendit sehingga data instrumen pembayaran tidak disimpan oleh VAKSARA. Dana Amanah (bila dipilih kedua pihak) ditampung di rekening penampung mitra pembayaran berizin, bukan di rekening VAKSARA." },
  { q: "Saya sudah transfer ke vendor. Bagaimana mencatatnya?", a: "Buka Pembayaran lalu pilih Catat pembayaran manual. Unggah bukti transfer dan konfirmasi bahwa Anda memahami statusnya tidak diverifikasi gateway. Catatan tidak menahan atau memindahkan dana." },
  { q: "Apa yang terjadi jika vendor tidak menanggapi pengaduan?", a: "Trust Officer dapat mengirim permintaan klarifikasi dan menjadwalkan fasilitasi. Jika tidak ada kesepakatan, kasus dapat tercatat sebagai Tidak Terselesaikan. VAKSARA tidak memberikan putusan hukum atau memaksa pembayaran." },
  { q: "Bagaimana cara melaporkan konten budaya yang tidak akurat?", a: "Buka halaman artikel dan pilih Ajukan koreksi. Sertakan bagian yang perlu diperbaiki dan sumber atau konteksnya. Tim peninjau akan menilai. Anda tidak perlu menjadi ahli untuk mengirim masukan yang sopan." },
  { q: "Dapatkah profil vendor dibayar agar muncul di atas?", a: "Tidak. VAKSARA tidak menjual posisi pencarian organik. Paket Vendor Pro direncanakan untuk fitur operasional, bukan untuk membeli peringkat atau lencana verifikasi." },
];

export function HelpCenter({ dashboard = false }: { dashboard?: boolean }) {
  const { navigate, toast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("Perjanjian & BAST");
  const faqs = helpFaqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      {dashboard ? <PageHeader eyebrow="Pusat Bantuan" title="Bagaimana kami dapat membantu?" description="Panduan penggunaan, batas layanan, dan jalur komunikasi yang tercatat." actions={<Button size="sm" variant="secondary" onClick={() => navigate("trust")}>Kembali ke Trust</Button>} /> : (
        <section className="relative overflow-hidden border-b border-line bg-[#F2EEE4]">
          <Motif type="diamond" className="-right-24 -top-24 h-80 w-80 text-sand" opacity={0.2} />
          <div className="relative mx-auto max-w-[900px] px-4 py-10 text-center sm:px-6 sm:py-14">
            <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full border border-sand/50 bg-white/70 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep"><HelpCircle className="h-3 w-3" /> Pusat Bantuan</div>
            <h1 className="text-balance font-display text-[2.1rem] font-semibold leading-tight text-ink sm:text-[2.7rem]">Jawaban yang jelas, termasuk saat jawabannya adalah "belum tersedia".</h1>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">Cari panduan tentang planner, perjanjian, BAST, pengaduan, screening, dan privasi.</p>
            <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-sm"><Search className="ml-2 h-4 w-4 shrink-0 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari bantuan… mis. cara unggah bukti" className="h-8 flex-1 bg-transparent text-[15px] outline-none" aria-label="Cari bantuan" /><Button size="sm" onClick={() => toast("Topik bantuan disaring berdasarkan kata kunci.", "info")}>Cari</Button></div>
          </div>
        </section>
      )}

      <div className={cn("mx-auto max-w-[1240px] px-4 py-6 sm:px-6", dashboard && "max-w-none px-0 sm:px-0")}>
        <div className={cn("grid gap-4", !dashboard && "lg:grid-cols-[1fr_290px]")}>
          <div>
            <div className="grid gap-2.5 sm:grid-cols-2">{helpTopics.filter((t) => `${t.t} ${t.d}`.toLowerCase().includes(query.toLowerCase()) || !query).map((t) => <Card key={t.t} hover className="p-3.5"><div className="flex items-start justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-[#2B5949]">{t.icon}</span><Badge tone="neutral" className="text-[12px]">{t.items} artikel</Badge></div><h3 className="mt-2 text-[15px] font-bold text-ink">{t.t}</h3><p className="mt-0.5 text-[13px] leading-relaxed text-muted">{t.d}</p><button onClick={() => toast(`Membuka kategori ${t.t}. Panduan lengkap tersedia pada implementasi produksi.`, "info", t.t)} className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-bold text-ink">Buka kategori <ArrowRight className="h-2.5 w-2.5" /></button></Card>)}</div>
            <Card className="mt-3 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><h2 className="text-[15px] font-bold text-ink">Pertanyaan yang sering diajukan</h2><p className="mt-0.5 text-[13px] text-muted">{faqs.length} jawaban ditemukan</p></div><HelpCircle className="h-4 w-4 text-sand-deep" /></div>
              <div className="divide-y divide-line/70">{faqs.map((f, i) => <div key={f.q}><button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left" aria-expanded={open === i}><span className="text-[14px] font-semibold leading-snug text-ink">{f.q}</span><ChevronDown className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep transition-transform", open === i && "rotate-180")} /></button>{open === i && <div className="px-4 pb-3 text-[14px] leading-relaxed text-muted">{f.a}</div>}</div>)}</div>
              {faqs.length === 0 && <div className="p-6 text-center"><p className="text-[14px] font-semibold text-ink">Belum ada bantuan yang cocok</p><p className="mt-1 text-[13px] text-muted">Coba kata kunci lain atau hubungi tim melalui formulir.</p></div>}
            </Card>
          </div>
          <aside className="space-y-3">
            <Card className="overflow-hidden"><div className="bg-ink p-4 text-cream"><MessageSquare className="h-4 w-4 text-sand" /><h3 className="mt-2 font-display text-[15px] font-semibold">Hubungi tim VAKSARA</h3><p className="mt-1 text-[13px] leading-relaxed text-cream/60">Kami biasanya membalas dalam 1 hari kerja. Untuk urusan kasus, gunakan jalur pengaduan agar tercatat.</p></div><div className="p-3 space-y-2"><Button size="sm" full onClick={() => { setSent(false); setContactOpen(true); }} leading={<Send className="h-3 w-3" />}>Kirim pertanyaan</Button>{!dashboard && <Button size="sm" variant="secondary" full onClick={() => navigate("sengketa")}>Buka pusat penyelesaian</Button>}<p className="text-center text-[12px] text-muted">{liveText || liveEnabled ? "Untuk respons cepat, hubungi WhatsApp tim VAKSARA 0858-2505-0046." : "Prototipe: formulir tidak mengirim pesan nyata."}</p></div></Card>
            <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Akses cepat</h3><div className="mt-2 space-y-1.5">{[[<HeartHandshake className="h-3 w-3" />, "Mulai Rencana Acara", "planner"], [<FileSignature className="h-3 w-3" />, "Cara membuat perjanjian", "perjanjian/baru"], [<Store className="h-3 w-3" />, "Screening pelaku budaya", "vendor/verifikasi"], [<BookOpen className="h-3 w-3" />, "Pengetahuan budaya", "pengetahuan"]].map(([icon, label, route]) => <button key={label as string} onClick={() => navigate(route as string)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] font-medium text-ink-soft hover:bg-cream">{icon}{label as string}<ArrowUpRight className="ml-auto h-2.5 w-2.5 text-muted" /></button>)}</div></Card>
            {!dashboard && <Alert tone="trust" title="Batas layanan">VAKSARA bukan pengadilan, tidak menahan dana, dan tidak menjamin pengembalian dana. Baca <button onClick={() => navigate("tentang")} className="font-bold underline decoration-sand underline-offset-2">tentang VAKSARA</button>.</Alert>}
          </aside>
        </div>
      </div>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title={sent ? "Pertanyaan tercatat" : "Hubungi tim VAKSARA"} description={sent ? undefined : "Untuk urusan perjanjian atau pengaduan tertentu, sertakan nomor dokumen. Jangan kirim data pribadi sensitif."} size="md" footer={sent ? <Button size="sm" onClick={() => setContactOpen(false)}>Selesai</Button> : <><Button size="sm" variant="secondary" onClick={() => setContactOpen(false)}>Batal</Button><Button size="sm" disabled={subject.trim().length < 5 || message.trim().length < 15} onClick={() => { setSent(true); toast("Formulir bantuan tercatat pada prototipe.", "success", "Pesan tersimpan"); }}>Kirim pertanyaan</Button></>}>
        {sent ? <div className="py-2 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><CheckCircle2 className="h-6 w-6" /></span><p className="mt-2 text-[14px] leading-relaxed text-ink-soft">Terima kasih. Pada prototipe ini tidak ada pesan yang dikirim ke tim nyata. Implementasi produksi akan menampilkan nomor tiket dan estimasi respons.</p><div className="mt-2 rounded-lg border border-line bg-[#FBFAF6] px-2 py-1.5 text-[13px] text-muted">Referensi prototipe: BNT-{Date.now().toString().slice(-6)}</div></div> : <div className="space-y-3"><Field label="Jenis kebutuhan"><Select value={topic} onChange={(e) => setTopic(e.target.value)}>{["Perjanjian & BAST", "Pengaduan", "Screening vendor", "Pembayaran", "Privasi & data", "Lainnya"].map((x) => <option key={x}>{x}</option>)}</Select></Field><Field label="Subjek" required><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ringkas masalah atau pertanyaan" /></Field><Field label="Pesan" required hint={`${message.length}/600`}><Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 600))} placeholder="Jelaskan konteks, nomor dokumen, dan hasil yang Anda harapkan." /></Field><Alert tone="info" title="Jangan kirim data sensitif">Jangan mengirim nomor kartu, kata sandi, atau dokumen identitas melalui formulir ini.</Alert></div>}
      </Modal>
    </>
  );
}

/* =========================== PRICING =========================== */
export function PricingPage() {
  const { setAuthMode } = useApp();
  const [annual, setAnnual] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [plan, setPlan] = useState("Premium Keluarga");
  const [waitlist, setWaitlist] = useState(false);
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[#F5F1E8]">
        <Motif type="diamond" className="-right-24 -top-20 h-80 w-80 text-sand" opacity={0.2} />
        <div className="relative mx-auto max-w-[1000px] px-4 py-10 text-center sm:px-6 sm:py-14">
          <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full border border-sand/50 bg-white/70 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep"><Wallet className="h-3 w-3" /> Paket & biaya</div>
          <h1 className="text-balance font-display text-[2.2rem] font-semibold leading-[1.08] text-ink sm:text-[3rem]">Gratis untuk menemukan. Bayar hanya saat butuh lebih.</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">Menemukan pelaku budaya dan mencatat kesepakatan selalu gratis. Tahap awal tanpa komisi; biaya layanan transaksi hanya dipertimbangkan setelah pembayaran terintegrasi dan disepakati bersama pelaku budaya.</p>
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border border-line bg-white p-1">
            <button onClick={() => setAnnual(false)} className={cn("rounded-md px-3 py-1.5 text-[14px] font-semibold", !annual ? "bg-ink text-cream" : "text-muted")}>Vendor bulanan</button>
            <button onClick={() => setAnnual(true)} className={cn("rounded-md px-3 py-1.5 text-[14px] font-semibold", annual ? "bg-ink text-cream" : "text-muted")}>Vendor tahunan <span className="ml-1 rounded bg-sand-light px-1 py-0.5 text-[12px] text-[#7A5A2E]">hemat 17%</span></button>
          </div>
          <p className="mt-2 text-[13px] text-muted">{liveEnabled ? "Paket berbayar dibuka bersamaan dengan peluncuran vendor terverifikasi" : "Harga simulasi · belum ada penagihan nyata"}</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { name: "Dasar", price: "Gratis", unit: "untuk keluarga & pelaku", desc: "Menemukan pelaku budaya dan mencatat kesepakatan dengan jelas.", features: ["Direktori, pencarian & penyaringan", "Kontak WhatsApp tanpa biaya", "Permintaan, penawaran & perjanjian berversi", "Dana Amanah atau transfer langsung", "Catatan DP, BAST & penutupan", "Artikel budaya (draf bersumber)"], cta: "Mulai gratis", highlight: false, action: () => setAuthMode("daftar") },
            { name: "Premium Keluarga", price: formatIDR(99000), unit: (liveEnabled ? "/ acara" : "/ acara · simulasi"), desc: "Untuk keluarga besar yang mengelola persiapan bersama.", features: ["Semua fitur Dasar", "Kolaborasi keluarga (5 orang)", "Pengingat termin & jadwal", "Rundown & daftar tamu lanjutan", "Laporan anggaran siap cetak"], cta: "Pilih Premium Keluarga", highlight: true, action: () => { setPlan("Premium Keluarga"); setWaitlist(false); setCheckoutOpen(true); } },
            { name: "Vendor Pro", price: annual ? formatIDR(490000) : formatIDR(49000), unit: annual ? (liveEnabled ? "/ tahun" : "/ tahun · simulasi") : (liveEnabled ? "/ bulan" : "/ bulan · simulasi"), desc: "Untuk pelaku budaya dan vendor yang siap tumbuh.", features: ["Profil & portofolio lanjutan", "Kalender ketersediaan", "Template penawaran", "Laporan pendapatan", "Tidak membeli peringkat atau verifikasi"], cta: "Pilih Vendor Pro", highlight: false, action: () => { setPlan("Vendor Pro"); setWaitlist(true); setCheckoutOpen(true); } },
          ].map((p) => (
            <div key={p.name} className={cn("relative flex flex-col rounded-2xl border p-5", p.highlight ? "border-ink bg-ink text-cream shadow-xl" : "border-line bg-white")}>
              {p.highlight && <span className="absolute -top-2.5 left-5 rounded-full bg-sand px-2 py-1 text-[12px] font-bold uppercase tracking-wider text-forest">Untuk keluarga</span>}
              <div className={cn("text-[12px] font-bold uppercase tracking-[0.14em]", p.highlight ? "text-sand" : "text-sand-deep")}>{p.name}</div>
              <div className="mt-2 flex items-end gap-1"><span className="font-display text-[1.75rem] font-semibold leading-none">{p.price}</span><span className={cn("pb-1 text-[12px]", p.highlight ? "text-cream/50" : "text-muted")}>{p.unit}</span></div>
              <p className={cn("mt-2 text-[14px] leading-relaxed", p.highlight ? "text-cream/60" : "text-muted")}>{p.desc}</p>
              <ul className="mt-3 flex-1 space-y-2">{p.features.map((f) => <li key={f} className="flex items-start gap-1.5 text-[14px]"><Check className={cn("mt-0.5 h-3 w-3 shrink-0", p.highlight ? "text-sand" : "text-[#4C8068]")} /><span className={p.highlight ? "text-cream/80" : "text-ink-soft"}>{f}</span></li>)}</ul>
              <Button variant={p.highlight ? "gold" : "secondary"} size="sm" className="mt-4" onClick={p.action}>{p.cta}</Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Alert tone="trust" title="Dokumen sebagai layanan premium (usulan)">Manajemen perjanjian lanjutan direncanakan sebagai paket tambahan. Fitur dasar BAST dan pengajuan pengaduan akan tetap tersedia agar kepercayaan tidak hanya untuk pelanggan berbayar.</Alert>
          {liveEnabled ? <Alert tone="info" title="Paket berbayar">Paket Premium Keluarga dan Vendor Pro dibuka bersamaan dengan peluncuran vendor terverifikasi. Paket Dasar gratis dan bisa dipakai sekarang. Tidak ada tagihan otomatis.</Alert> : <Alert tone="warn" title="Checkout Xendit akan di-host">Pembayaran langganan akan menggunakan checkout Xendit pada tahap produksi. Prototipe ini tidak memproses pembayaran nyata. Tidak ada masa uji yang ditagihkan otomatis.</Alert>}
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Perbandingan fitur</h2><p className="mt-0.5 text-[13px] text-muted">{liveEnabled ? "Fitur bertanda \"usulan\" dibuka bersama paket berbayar." : "Fitur bertanda \"usulan\" belum aktif pada prototipe."}</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-[14px]"><thead className="bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Fitur</th><th className="px-2 py-2.5 text-center font-bold">Dasar</th><th className="px-2 py-2.5 text-center font-bold">Premium Keluarga</th><th className="px-4 py-2.5 text-center font-bold">Vendor Pro</th></tr></thead><tbody className="divide-y divide-line/60">{[["Penemuan pelaku budaya & kontak WhatsApp", true, true, true], ["Permintaan, penawaran, perjanjian & BAST", true, true, true], ["Rencana acara & anggaran dasar", true, true, false], ["Kolaborasi keluarga & pengingat", false, true, false], ["Profil, portofolio & kalender lanjutan", false, false, true], ["Laporan pendapatan vendor", false, false, true], ["Dana Amanah (persetujuan dua pihak)", true, true, true], ["Status verifikasi atau peringkat", "Tidak dijual", "Tidak dijual", "Tidak dijual"]].map(([f, a, b, c]) => <tr key={f as string}><td className="px-4 py-2.5 font-medium text-ink">{f as string}</td>{[a, b, c].map((v, i) => <td key={i} className={cn("px-2 py-2.5 text-center", i === 2 && "px-4")}>{v === true ? <Check className="mx-auto h-3.5 w-3.5 text-[#4C8068]" /> : v === false ? <span className="text-muted/50">—</span> : <span className="text-[12px] font-semibold text-ink-soft">{v as string}</span>}</td>)}</tr>)}</tbody></table></div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-line bg-[#FBFAF6] p-4"><Lock className="h-4 w-4 text-sand-deep" /><h3 className="mt-2 text-[14px] font-bold text-ink">Dana Amanah, bukan dana VAKSARA</h3><p className="mt-1 text-[13px] leading-relaxed text-muted">Bila dipilih dalam perjanjian, dana ditahan mitra pembayaran berizin dan cair hanya dengan persetujuan kedua pihak. Tanpa komisi pada tahap awal; biaya kanal pembayaran mengikuti tarif mitra.</p></div><div className="rounded-xl border border-line bg-[#FBFAF6] p-4"><Heart className="h-4 w-4 text-sand-deep" /><h3 className="mt-2 text-[14px] font-bold text-ink">Budaya tidak selalu untuk dijual</h3><p className="mt-1 text-[13px] leading-relaxed text-muted">Sebagian praktik privat dan tidak dimonetisasi. VAKSARA dapat menolak listing tertentu.</p></div><div className="rounded-xl border border-line bg-[#FBFAF6] p-4"><ShieldCheck className="h-4 w-4 text-sand-deep" /><h3 className="mt-2 text-[14px] font-bold text-ink">Verifikasi tidak diperjualbelikan</h3><p className="mt-1 text-[13px] leading-relaxed text-muted">Paket berbayar tidak mempercepat atau menjamin lencana screening.</p></div></div>
      </section>
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title={waitlist ? "Vendor Pro — daftar tunggu" : "Checkout belum aktif"} description={`${plan}${plan === "Vendor Pro" ? (annual ? " · tahunan" : " · bulanan") : " · per acara"} · prototipe`} size="md" footer={waitlist ? <><Button variant="secondary" size="sm" onClick={() => setCheckoutOpen(false)}>Tutup</Button><Button size="sm" onClick={() => { setCheckoutOpen(false); setAuthMode("daftar"); }}>Daftar sebagai pelaku budaya</Button></> : <><Button variant="secondary" size="sm" onClick={() => setCheckoutOpen(false)}>Tutup</Button><Button size="sm" onClick={() => { setCheckoutOpen(false); setAuthMode("daftar"); }}>Coba demo Planner</Button></>}>
        <div className="space-y-3"><div className="rounded-xl border border-dashed border-[#CFC6B4] bg-[#FBFAF6] p-4 text-center"><CreditCard className="mx-auto h-6 w-6 text-sand-deep" /><p className="mt-2 text-[14px] font-bold text-ink">Xendit-hosted checkout — rencana implementasi</p><p className="mt-1 text-[13px] leading-relaxed text-muted">Tidak ada data pembayaran yang dikumpulkan pada prototipe ini. Pada produksi, Anda akan diarahkan ke halaman pembayaran Xendit untuk langganan yang dipilih.</p><span className="mt-2 inline-block rounded-full border border-sand/50 bg-sand-light px-2 py-0.5 text-[12px] font-bold text-[#7A5A2E]">Tidak memproses uang nyata</span></div><p className="text-[13px] leading-relaxed text-muted">Dengan berlangganan, biaya diumumkan sebelum checkout. Pembatalan tersedia kapan saja dan berlaku pada periode berikutnya. Tidak ada jaminan hasil layanan dari pelaku budaya.</p></div>
      </Modal>
    </>
  );
}
