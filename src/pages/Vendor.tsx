import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Progress,
  SectionCard,
  Select,
  StatCard,
  Textarea,
  UploadBox,
  statusTone
} from "@/components/ui";
import { formatIDR, images, earnings as seedEarnings, vendorBusiness, vendorInquiries, vendorSchedule } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  ImagePlus,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Star,
  UploadCloud,
  Wallet,
  X
} from "lucide-react";
import { useState } from "react";

export default function VendorWorkspace({ page }: { page: string }) {
  if (page === "profil") return <VendorProfile />;
  if (page === "verifikasi") return <VendorVerification />;
  if (page === "permintaan") return <VendorInquiries />;
  if (page === "penawaran") return <VendorOffers />;
  if (page === "kontrak") return <VendorContracts />;
  if (page === "jadwal") return <VendorSchedulePage />;
  if (page === "pembayaran") return <VendorPayments />;
  if (page === "bast") return <VendorBast />;
  if (page === "pengaduan") return <VendorComplaints />;
  return <VendorOverview />;
}

function VendorOverview() {
  const { navigate } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="Ruang pelaku budaya"
        title="Selamat datang, Hj. Andi Nurhaeni."
        description="Profil Anda tampil di direktori. Ada 3 permintaan baru dan 1 koreksi screening yang perlu ditanggapi."
        actions={<><Button size="sm" variant="secondary" onClick={() => navigate("vendor/profil")} leading={<Pencil className="h-3.5 w-3.5" />}>Ubah profil</Button><Button size="sm" onClick={() => navigate("vendor/permintaan")} leading={<MessageSquare className="h-3.5 w-3.5" />}>Lihat permintaan</Button></>}
      />
      <Alert tone="warn" className="mb-3" title="Tindakan diperlukan: perbaiki dokumen screening">
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Rujukan budaya perlu diperbarui sebelum validasi pengetahuan dapat diselesaikan. Batas tanggapan: 22 Juni 2027.</span><Button size="sm" variant="secondary" onClick={() => navigate("vendor/verifikasi")}>Perbaiki sekarang</Button></div>
      </Alert>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Pendapatan bulan ini" value={formatIDR(vendorBusiness.earningsThisMonth, true)} helper="2 pembayaran tercatat" icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Menunggu pembayaran" value={formatIDR(vendorBusiness.earningsPending, true)} helper="Tertunda hingga BAST" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Profil dilihat" value="1.248" helper="+12% dari bulan lalu" icon={<Eye className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Rating layanan" value={`${vendorBusiness.rating} / 5`} helper={`${vendorBusiness.reviews} ulasan diperiksa`} icon={<Star className="h-3.5 w-3.5" />} tone="sand" />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative"><img src={images.hijabPortrait} alt="" className="h-14 w-14 rounded-xl object-cover" /><span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#4C8068] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span></div>
                <div><h2 className="text-[16px] font-bold text-ink">{vendorBusiness.name}</h2><p className="mt-0.5 text-[13px] text-muted">{vendorBusiness.category} · {vendorBusiness.location}</p><div className="mt-1.5 flex flex-wrap gap-1"><Badge tone="green" className="text-[11px]"><BadgeCheck className="h-2.5 w-2.5" /> Identitas</Badge><Badge tone="green" className="text-[11px]">Portofolio</Badge><Badge tone="amber" className="text-[11px]">Pengetahuan · tinjau</Badge></div></div>
              </div>
              <div className="w-full sm:w-[190px]">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Kelengkapan profil</span><span className="font-bold text-ink">{vendorBusiness.completeness}%</span></div>
                <Progress value={vendorBusiness.completeness} tone="sand" className="mt-1" />
                <div className="mt-1 flex items-center justify-between"><span className="text-[12px] text-muted">Tingkatkan ke 100%</span><button onClick={() => navigate("vendor/profil")} className="text-[12px] font-bold text-ink underline decoration-sand underline-offset-2">Lengkapi</button></div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard title="Permintaan masuk" subtitle="Tanggapi dalam 24 jam untuk menjaga responsivitas." action={<button onClick={() => navigate("vendor/permintaan")} className="text-[12px] font-bold text-ink">Semua</button>}>
              <div className="space-y-2">
                {vendorInquiries.slice(0, 3).map((i) => (
                  <div key={i.id} className="rounded-lg border border-line p-2.5">
                    <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-1.5"><Avatar name={i.couple} size="xs" /><span className="text-[13px] font-bold text-ink">{i.couple}</span></div><Badge tone={i.status === "Baru" ? "green" : i.status === "Ditolak" ? "red" : "amber"} className="text-[11px]">{i.status}</Badge></div>
                    <div className="mt-1 text-[12px] text-muted">{i.service} · {new Date(i.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="mt-1.5 flex items-center justify-between"><span className="text-[13px] font-bold text-ink">{i.value ? formatIDR(i.value, true) : "Belum ada nilai"}</span><button onClick={() => navigate("vendor/permintaan")} className="flex items-center gap-1 text-[12px] font-semibold text-ink underline decoration-sand underline-offset-2">Tinjau <ChevronRight className="h-2.5 w-2.5" /></button></div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <div className="space-y-3">
              <SectionCard title="Status verifikasi" subtitle="Peninjauan berkala terhadap pengetahuan budaya." action={<Badge tone="amber" dot className="text-[11px]">1 koreksi</Badge>}>
                <div className="space-y-1.5">
                  {vendorBusiness.verification.slice(0, 4).map((v) => (
                    <div key={v.label} className="flex items-center justify-between gap-2 text-[13px]"><span className="text-ink-soft">{v.label}</span><Badge tone={v.tone === "green" ? "green" : v.tone === "red" ? "red" : "amber"} className="px-1.5 py-0.5 text-[11px]">{v.state}</Badge></div>
                  ))}
                </div>
                <Button size="sm" variant="secondary" full className="mt-2" onClick={() => navigate("vendor/verifikasi")}>Buka status verifikasi</Button>
              </SectionCard>
              <SectionCard title="Jadwal berikutnya" subtitle="Juni–Juli 2027" action={<button onClick={() => navigate("vendor/jadwal")} className="text-[12px] font-bold text-ink">Kalender</button>}>
                <div className="space-y-1.5">
                  {vendorSchedule.slice(0, 2).map((s) => <div key={s.title} className="flex items-start gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sand-light text-[12px] font-bold text-[#7A5A2E]">{s.date.split(" ")[0]}</span><div className="min-w-0"><div className="text-[12px] font-semibold leading-snug text-ink">{s.title}</div><div className="text-[11px] text-muted">{s.time} · {s.place}</div></div></div>)}
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard title="Ringkasan pendapatan" subtitle="Hanya mencatat pembayaran. VAKSARA tidak menahan dana atau memproses pencairan." action={<button onClick={() => navigate("vendor/pembayaran")} className="text-[12px] font-bold text-ink">Detail</button>}>
            <div className="grid gap-2 sm:grid-cols-3">
              {[["Terverifikasi gateway", formatIDR(7400000), "blue"], ["Tercatat manual", formatIDR(9800000), "neutral"], ["Tertunda", formatIDR(5550000), "amber"]].map(([l, v, tone]) => <div key={l} className="rounded-lg border border-line bg-[#FBFAF6] p-2.5"><div className="text-[12px] text-muted">{l}</div><div className="mt-1 text-[15px] font-bold text-ink">{v}</div><Badge tone={tone} className="mt-1 px-1 py-0.5 text-[11px]">{tone === "blue" ? "Simulasi" : tone === "neutral" ? "Perlu dicocokkan" : "Menunggu BAST"}</Badge></div>)}
            </div>
          </SectionCard>
        </div>
        <aside className="space-y-3">
          <Card className="overflow-hidden">
            <div className="bg-ink p-4 text-cream"><div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-sand"><ShieldCheck className="h-3 w-3" /> Kinerja layanan</div><div className="mt-1.5 font-display text-[1.5rem] font-semibold leading-none">{vendorBusiness.responseRate}%</div><div className="text-[12px] text-cream/55">permintaan direspons &lt; 24 jam</div><Progress value={vendorBusiness.responseRate} tone="sand" className="mt-2 bg-white/10" height="h-1" /></div>
            <div className="space-y-2 p-4 text-[13px]">{[["Permintaan selesai", "18"], ["BAST diajukan", "3"], ["BAST dikonfirmasi", "2"], ["Pengaduan aktif", "1"]].map(([l, v]) => <div key={l} className="flex justify-between"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>)}</div>
          </Card>
          <Card className="p-4"><h3 className="text-[15px] font-bold text-ink">Tindakan cepat</h3><div className="mt-2 space-y-1.5"><Button size="sm" full onClick={() => navigate("vendor/permintaan")}>Tanggapi permintaan</Button><Button size="sm" variant="secondary" full onClick={() => navigate("vendor/profil")}>Perbarui portofolio</Button><Button size="sm" variant="secondary" full onClick={() => navigate("vendor/bast")}>Konfirmasi BAST</Button></div></Card>
          <div className="rounded-xl border border-sand/40 bg-sand-light/45 p-3"><Lock className="h-3.5 w-3.5 text-sand-deep" /><p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Profil yang terverifikasi tidak menjamin pesanan. VAKSARA tidak menampilkan biaya iklan sebagai hasil organik.</p></div>
        </aside>
      </div>
    </>
  );
}

function VendorProfile() {
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("Pendamping prosesi adat dengan pengalaman 18 tahun. Terbiasa memandu keluarga besar Bugis-Makassar dengan pendekatan yang hangat, runtut, dan menghormati kesepakatan keluarga.");
  const [portfolio, setPortfolio] = useState([images.heroCeremony, images.family, images.brideGold]);
  return (
    <>
      <PageHeader eyebrow="Profil & portofolio" title="Tampilkan karya dan konteks Anda dengan jelas." description="Profil yang baik bukan yang paling lengkap, tetapi yang membantu keluarga memahami cara Anda bekerja." actions={<Button size="sm" onClick={() => setOpen(true)} leading={<Pencil className="h-3.5 w-3.5" />}>Ubah profil</Button>} />
      <div className="grid gap-3 xl:grid-cols-[1fr_290px]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="relative h-32 sm:h-40"><img src={images.heroCeremony} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-forest/80 to-transparent" /><Badge tone="dark" className="absolute left-3 top-3 border-white/20 bg-forest/60 text-[12px]">Foto sampul</Badge><span className="absolute bottom-2.5 right-3 rounded-md bg-white/90 px-2 py-1 text-[12px] font-semibold text-ink"><ImagePlus className="mr-1 inline h-2.5 w-2.5" />Ganti sampul</span></div>
            <div className="relative px-4 pb-4">
              <img src={images.hijabPortrait} alt="" className="-mt-8 h-16 w-16 rounded-xl border-[3px] border-white object-cover shadow" />
              <div className="mt-2 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-[14px] font-bold text-ink">{vendorBusiness.name}</h2><p className="text-[13px] text-muted">{vendorBusiness.category} · {vendorBusiness.location}</p><p className="mt-1 text-[12px] text-muted">Tergabung sejak {vendorBusiness.joined} · Dikelola oleh {vendorBusiness.owner}</p></div><div className="text-right"><Badge tone="green" dot className="text-[12px]">Terdaftar di direktori</Badge><div className="mt-1 text-[13px] text-muted">{vendorBusiness.completeness}% lengkap</div><Progress value={vendorBusiness.completeness} tone="sand" className="mt-1 w-28" height="h-1" /></div></div>
            </div>
          </Card>
          <SectionCard title="Tentang usaha & pendekatan" action={<button onClick={() => setOpen(true)} className="text-[12px] font-bold text-ink">Ubah</button>}>
            <p className="text-[14px] leading-relaxed text-ink-soft">{desc}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{["Mappacci", "Akad nikah adat", "Pappaseng", "Tudang sipulung"].map((s) => <Badge key={s} tone="neutral" className="text-[12px]">{s}</Badge>)}</div>
          </SectionCard>
          <SectionCard title="Portofolio" subtitle="Atribusi dan izin foto diperiksa saat screening." action={<Button size="sm" variant="secondary" onClick={() => { setPortfolio((p) => [...p, images.brideGold]); toast("Foto contoh ditambahkan. Unggahan nyata belum tersedia pada prototipe.", "success", "Portofolio diperbarui"); }} leading={<Plus className="h-3 w-3" />}>Tambah foto</Button>}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {portfolio.map((src, i) => <div key={i} className="group relative overflow-hidden rounded-lg border border-line"><img src={src} alt={`Portofolio ${i + 1}`} className="aspect-[4/3] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-forest/60 px-1.5 py-1 text-[11px] text-cream opacity-0 backdrop-blur group-hover:opacity-100">{["Prosesi adat", "Pertemuan keluarga", "Penyambutan"][i] ?? "Dokumentasi baru"}</div></div>)}
              <button onClick={() => toast("Unggahan portofolio nyata belum aktif pada prototipe.", "info", "Unggah foto")} className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-dashed border-[#CFC6B4] bg-[#FBFAF6] text-[12px] text-muted hover:border-sand"><UploadCloud className="mb-1 h-4 w-4 text-sand-deep" />Unggah foto</button>
            </div>
          </SectionCard>
        </div>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Kelengkapan profil</h3><div className="mt-2 space-y-2">{[["Foto sampul", true], ["Deskripsi usaha", true], ["Rekening pembayaran", true], ["Rujukan budaya", false], ["Sertifikat pendukung", false]].map(([l, done]) => <div key={l as string} className="flex items-center gap-1.5 text-[13px]"><span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full", done ? "bg-[#EDF4EF] text-[#2B5949]" : "border border-line bg-white text-muted")}>{done ? <Check className="h-2 w-2" /> : <X className="h-2 w-2" />}</span><span className="flex-1 text-ink-soft">{l as string}</span>{!done && <button className="text-[12px] font-bold text-ink underline decoration-sand underline-offset-2">Isi</button>}</div>)}</div></Card>
          <SectionCard title="Dokumen akun" action={<Badge tone="green" className="text-[11px]">Aman</Badge>}><div className="space-y-1.5">{[["Identitas pemilik", "Terverifikasi"], ["Dokumen usaha", "Terverifikasi"], ["NPWP / data pajak", "Dalam tinjauan"]].map(([l, s]) => <div key={l} className="flex items-center justify-between gap-2 text-[12px]"><span className="text-muted">{l}</span><Badge tone={s === "Terverifikasi" ? "green" : "amber"} className="px-1 py-0.5 text-[11px]">{s}</Badge></div>)}</div><p className="mt-2 text-[12px] leading-relaxed text-muted">Dokumen prototipe tidak benar-benar diunggah atau diverifikasi.</p></SectionCard>
          <Alert tone="info" title="Foto budaya">Gunakan foto yang Anda miliki haknya atau memiliki izin. Jangan memakai foto keluarga tanpa persetujuan.</Alert>
        </aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Ubah profil" description="Perubahan akan masuk ke proses peninjauan bila menyentuh klaim budaya." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" onClick={() => { setOpen(false); toast("Perubahan profil disimpan sebagai draf untuk ditinjau.", "success", "Perubahan tersimpan"); }}>Simpan perubahan</Button></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Nama sanggar / usaha"><Input defaultValue={vendorBusiness.name} /></Field><Field label="Kategori utama"><Select defaultValue="prosesi">{["Pelaksana prosesi adat", "Musik tradisional", "Busana adat", "Perajin & perlengkapan", "Vendor pendukung"].map((x) => <option key={x}>{x}</option>)}</Select></Field></div>
          <Field label="Deskripsi"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <Field label="Kota / kabupaten"><Input defaultValue="Gowa" /></Field>
          <Alert tone="warn" title="Perubahan yang memerlukan tinjauan">Perubahan pada klaim praktik budaya, kategori, atau portofolio diperiksa kembali sebelum dipublikasikan.</Alert>
        </div>
      </Modal>
    </>
  );
}

function VendorVerification() {
  const { toast } = useApp();
  const [stage, setStage] = useState<"review" | "submitted">("review");
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [doc, setDoc] = useState<{ name: string; size: string }[]>([]);
  return (
    <>
      <PageHeader eyebrow="Pendaftaran pelaku budaya · Screening" title="Status verifikasi" description="Screening tiga lapis memeriksa identitas, portofolio, dan pengetahuan budaya secara terpisah." actions={<Button size="sm" variant="secondary" onClick={() => navigateHelp(toast)}>Panduan screening</Button>} />
      {stage === "submitted" ? <Alert tone="info" className="mb-3" title="Perbaikan dikirim — menunggu tinjauan">Berkas Anda akan ditinjau dalam 3–5 hari kerja pada implementasi produksi. Profil tetap tampil dengan status pengetahuan budaya "dalam tinjauan".</Alert> : <Alert tone="warn" className="mb-3" title="Satu koreksi diperlukan"><div className="flex flex-wrap items-center justify-between gap-2"><span>Rujukan praktik budaya perlu dilengkapi dengan sumber yang dapat ditelusuri. Publikasi tetap berjalan dengan label tinjauan.</span><Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Perbaiki dokumen</Button></div></Alert>}
      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sand"><BadgeCheck className="h-4 w-4" /></span><div><div className="text-[15px] font-bold text-ink">Status akun: Pelaku budaya terdaftar</div><div className="text-[12px] text-muted">Dalam peninjauan berkala · bukan jaminan kualitas layanan</div></div></div><Badge tone="amber" dot className="text-[12px]">Perlu tindakan</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{["Registrasi", "Profil", "Screening", "Koreksi", "Publikasi"].map((s, i) => <div key={s} className="relative"><div className={cn("h-1 w-full rounded", i < 3 ? "bg-ink" : i === 3 ? "bg-sand" : "bg-[#E7E1D5]")} /><div className="mt-1 flex items-center gap-1"><span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full text-[11px]", i < 3 ? "bg-ink text-cream" : i === 3 ? "bg-sand text-forest" : "border border-line text-muted")}>{i < 3 ? <Check className="h-2 w-2" /> : i + 1}</span><span className={cn("text-[12px] font-semibold", i <= 3 ? "text-ink" : "text-muted")}>{s}</span></div></div>)}</div>
          </Card>
          <SectionCard title="Pemeriksaan per lapis" subtitle="Status satu lapis tidak menutupi lapis lainnya.">
            <div className="space-y-2">{vendorBusiness.verification.map((v, i) => (
              <div key={v.label} className="rounded-lg border border-line bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex items-start gap-2"><span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", v.tone === "green" ? "bg-[#EDF4EF] text-[#2B5949]" : v.tone === "red" ? "bg-[#F9ECE9] text-[#933A2F]" : "bg-[#FBF3E3] text-[#855A16]")}>{v.tone === "green" ? <Check className="h-3 w-3" /> : v.tone === "red" ? <CircleAlert className="h-3 w-3" /> : <Clock className="h-3 w-3" />}</span><div><div className="text-[14px] font-bold text-ink">{i + 1}. {v.label}</div><div className="mt-0.5 text-[12px] text-muted">{v.date}</div></div></div><div className="flex items-center gap-1.5"><Badge tone={v.tone === "green" ? "green" : v.tone === "red" ? "red" : "amber"} className="text-[11px]">{v.state}</Badge>{v.state !== "Terverifikasi" && stage === "review" && <Button size="sm" variant="secondary" onClick={() => i === 3 ? setOpen(true) : toast("Dokumen ini sedang ditinjau. Anda akan diberi tahu bila ada tindakan.", "info", "Dalam tinjauan")}>{i === 3 ? "Perbaiki" : "Lihat"}</Button>}</div></div>
                {i === 3 && <div className="mt-1.5 rounded bg-[#FCF4F1] px-2 py-1 text-[12px] text-[#933A2F]">Peninjau meminta rujukan tertulis dan penjelasan batas praktik yang tidak dapat dikomersialkan.</div>}
              </div>
            ))}</div>
          </SectionCard>
          <SectionCard title="Keputusan publikasi" subtitle="Ditentukan setelah seluruh lapis selesai." action={<Badge tone="amber" dot className="text-[12px]">Ditangguhkan sementara</Badge>}>
            <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-[#F0E0C1] bg-[#FCF9F1] p-2.5"><div className="text-[13px] font-bold text-[#79551A]">Profil tetap tayang</div><p className="mt-0.5 text-[12px] leading-relaxed text-[#79551A]/80">Dengan label "pengetahuan budaya dalam tinjauan". Keluarga tetap dapat melihat status ini.</p></div><div className="rounded-lg border border-line bg-white p-2.5"><div className="text-[13px] font-bold text-ink">Publikasi penuh</div><p className="mt-0.5 text-[12px] leading-relaxed text-muted">Menunggu koreksi rujukan. Keputusan tidak dapat dibeli atau dipercepat dengan langganan.</p></div></div>
          </SectionCard>
        </div>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Linimasa peninjauan</h3><div className="mt-2 space-y-2">{[["Berkas diterima", "18 Mei 2026", true], ["Identitas diperiksa", "20 Mei 2026", true], ["Portofolio ditinjau", "02 Jun 2026", true], ["Koreksi diminta", "12 Jun 2027", false], ["Keputusan akhir", "Setelah koreksi", false]].map(([l, d, ok], i) => <div key={l as string} className="flex gap-2"><div className="flex flex-col items-center"><span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full", ok ? "bg-ink text-cream" : "border border-line bg-white text-muted")}>{ok ? <Check className="h-2 w-2" /> : i + 1}</span>{i < 4 && <span className="h-full min-h-[12px] w-px bg-line" />}</div><div className="pb-1"><div className={cn("text-[13px] font-semibold", ok ? "text-ink" : "text-muted")}>{l as string}</div><div className="text-[12px] text-muted">{d as string}</div></div></div>)}</div></Card>
          <Alert tone="warn" title="Hindari janji yang tidak dapat dibuktikan">Jangan mencantumkan gelar atau pengalaman yang tidak dapat Anda tunjukkan. Misrepresentasi dapat menyebabkan penangguhan profil.</Alert>
          <Button full size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={stage === "submitted"}>Kirim perbaikan</Button>
        </aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Perbaiki rujukan budaya" description="Jelaskan sumber dan konteks praktik. Tim peninjau akan membaca, bukan menilai apakah praktik Anda 'asli' atau tidak." size="lg" footer={<><Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" disabled={ref.trim().length < 30} onClick={() => { setOpen(false); setStage("submitted"); toast("Perbaikan dikirim. Status diperbarui menjadi menunggu tinjauan.", "success", "Koreksi terkirim"); }}>Kirim untuk ditinjau</Button></>}>
        <div className="space-y-3">
          <Field label="Praktik / klaim yang dirujuk" required><Input defaultValue="Pendampingan Mappacci dan variasi keluarga" /></Field>
          <Field label="Rujukan & sumber" required hint={`${ref.length}/500`}><Textarea value={ref} onChange={(e) => setRef(e.target.value.slice(0, 500))} placeholder="Sebutkan sumber lisan/tertulis, nama peninjau komunitas (dengan izin), dan batas praktik yang Anda hormati." /></Field>
          <Field label="Penjelasan konteks"><Textarea placeholder="Contoh: Variasi bergantung pada kesepakatan keluarga; kami tidak mengklaim satu versi sebagai patokan semua orang." /></Field>
          <UploadBox title="Dokumen pendukung" files={doc} onAdd={() => setDoc((p) => [...p, { name: "Rujukan-Praktik.pdf", size: "—" }])} onRemove={(n) => setDoc((p) => p.filter((f) => f.name !== n))} />
          <Alert tone="info" title="Privasi narasumber">Jangan mencantumkan kontak atau dokumen pribadi narasumber tanpa persetujuan mereka.</Alert>
        </div>
      </Modal>
    </>
  );
}

function navigateHelp(toast: (m: string, t?: "success" | "error" | "info" | "warn", title?: string) => void) {
  toast("Panduan screening dibuka sebagai dokumen prototipe.", "info", "Panduan screening");
}

function VendorInquiries() {
  const { toast } = useApp();
  const [statuses, setStatuses] = useState<Record<string, string>>(Object.fromEntries(vendorInquiries.map((i) => [i.id, i.status])));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [amount, setAmount] = useState("6500000");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const selected = vendorInquiries.find((i) => i.id === selectedId);
  return (
    <>
      <PageHeader eyebrow="Peluang layanan" title="Permintaan masuk" description="Informasi pengantin dibagikan hanya setelah mereka mengirim permintaan. Jangan menyalin data ke luar platform." actions={<Button size="sm" variant="secondary" onClick={() => toast("Preferensi ketersediaan akan disimpan pada implementasi produksi.", "info")}>Atur ketersediaan</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Permintaan baru" value="1" helper="Perlu tanggapan awal" icon={<MessageSquare className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Penawaran dikirim" value="1" helper="Menunggu keputusan" icon={<Receipt className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Diterima" value="1" helper="Siap dibuatkan perjanjian" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Rata-rata respons" value="3,2 jam" helper="Target < 24 jam" icon={<Clock className="h-3.5 w-3.5" />} tone="neutral" />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_290px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><h2 className="text-[15px] font-bold text-ink">Daftar permintaan</h2><p className="mt-0.5 text-[13px] text-muted">Data pengantin terlihat oleh Anda karena mereka menghubungi Anda.</p></div><Badge tone="neutral" className="text-[12px]">5 total</Badge></div>
          <div className="divide-y divide-line/60">
            {vendorInquiries.map((i) => {
              const s = statuses[i.id];
              return (
                <div key={i.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5"><Avatar name={i.couple} size="sm" /><div><div className="flex flex-wrap items-center gap-1.5"><span className="text-[14px] font-bold text-ink">{i.couple}</span><Badge tone={s === "Baru" ? "green" : s === "Ditolak" ? "red" : s === "Diterima" ? "green" : "amber"} className="text-[11px]">{s}</Badge></div><div className="mt-0.5 text-[12px] text-muted">{i.service} · {new Date(i.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div><p className="mt-1 line-clamp-1 max-w-[400px] text-[13px] text-muted">{i.message}</p></div></div>
                    <div className="text-right"><div className="text-[14px] font-bold text-ink">{i.value ? formatIDR(i.value, true) : "—"}</div><div className="text-[11px] text-muted">{i.received}</div></div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setSelectedId(i.id)}>Lihat detail</Button>
                    {s === "Baru" && <Button size="sm" onClick={() => { setSelectedId(i.id); setOfferOpen(true); }}>Buat penawaran</Button>}
                    {s === "Diterima" && <Button size="sm" onClick={() => { setStatuses((p) => ({ ...p, [i.id]: "Perjanjian dibuat" })); toast("Perjanjian dibuat dari penawaran yang disetujui.", "success", "Draf perjanjian"); }}>Buat perjanjian</Button>}
                    {(s === "Baru" || s === "Menunggu klarifikasi") && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(i.id); setReason(""); setRejectOpen(true); }}>Tolak</Button>}
                    <span className="ml-auto text-[12px] text-muted">{i.responseBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Aksi yang disarankan</h3><div className="mt-2 space-y-2 text-[13px] text-ink-soft"><p className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Tanggapi pertanyaan tanpa memaksa pemesanan.</p><p className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Sebutkan apa yang tidak termasuk dalam penawaran.</p><p className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Gunakan perjanjian untuk nilai dan hasil kerja.</p></div></Card>
          <Alert tone="warn" title="Jangan menerima di luar platform tanpa catatan">Anda boleh berkomunikasi langsung, tetapi hindari meminta pembayaran sebelum ruang lingkup disepakati. VAKSARA tidak dapat memfasilitasi pengaduan tanpa bukti perjanjian.</Alert>
          <div className="rounded-xl border border-line bg-[#F4F0E6] p-3"><ShieldCheck className="h-3.5 w-3.5 text-sand-deep" /><p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Menolak permintaan tidak memengaruhi peringkat secara otomatis. Respons yang dijelaskan dengan sopan lebih membantu.</p></div>
        </aside>
      </div>
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Permintaan dari ${selected.couple}` : ""} description={selected ? `${selected.service} · ${new Date(selected.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""} size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setSelectedId(null)}>Tutup</Button>{selected && statuses[selected.id] === "Baru" && <Button size="sm" onClick={() => setOfferOpen(true)}>Buat penawaran</Button>}</>}>
        {selected && <div className="space-y-3"><div className="rounded-xl border border-line bg-[#FBFAF6] p-3"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">Pesan pengantin</div><p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{selected.message}</p></div><div className="grid grid-cols-2 gap-2">{[["Tanggal acara", new Date(selected.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })], ["Layanan", selected.service], ["Perkiraan nilai", selected.value ? formatIDR(selected.value) : "Belum ditentukan"], ["Diterima", selected.received]].map(([l, v]) => <div key={l} className="rounded-lg border border-line p-2.5"><div className="text-[11px] text-muted">{l}</div><div className="mt-0.5 text-[13px] font-semibold text-ink">{v}</div></div>)}</div><Alert tone="info" title="Data pengantin">Data ini diberikan untuk menanggapi permintaan. Jangan digunakan untuk pemasaran di luar konteks.</Alert></div>}
      </Modal>
      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title="Buat penawaran" description="Penawaran akan dibandingkan pengantin dengan pilihan lain. Tulis ruang lingkup dan pengecualian secara jujur." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setOfferOpen(false)}>Batal</Button><Button size="sm" disabled={message.trim().length < 10} onClick={() => { if (selected) setStatuses((p) => ({ ...p, [selected.id]: "Penawaran dikirim" })); setOfferOpen(false); toast("Penawaran dikirim ke pengantin. Nilai belum menjadi kewajiban sampai perjanjian disetujui.", "success", "Penawaran terkirim"); }}>Kirim penawaran</Button></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Nilai penawaran (Rupiah)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" /></Field><Field label="Berlaku sampai"><Input type="date" defaultValue="2027-06-30" /></Field></div>
          <Field label="Ruang lingkup ringkas" required><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Termasuk konsultasi keluarga, rundown, dan pendampingan 8 jam. Tidak termasuk akomodasi di luar Gowa." /></Field>
          <Field label="Jadwal pertemuan awal"><Select><option>Daring · 60 menit</option><option>Di lokasi · 90 menit</option><option>Tidak diperlukan</option></Select></Field>
          <Alert tone="warn">Penawaran bukan perjanjian. Pengantin harus menyetujui perjanjian yang memuat hasil kerja dan termin sebelum kewajiban berlaku.</Alert>
        </div>
      </Modal>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak permintaan" description="Alasan akan terlihat oleh pengantin. Menolak dengan jelas lebih baik daripada tidak menjawab." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setRejectOpen(false)}>Batal</Button><Button size="sm" variant="danger" disabled={reason.trim().length < 10} onClick={() => { if (selected) setStatuses((p) => ({ ...p, [selected.id]: "Ditolak" })); setRejectOpen(false); toast("Permintaan ditolak dengan catatan alasan.", "info", "Permintaan ditolak"); }}>Tolak permintaan</Button></>}>
        <Field label="Alasan" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Tanggal tidak tersedia karena layanan lain pada hari yang sama." /></Field>
        <Alert tone="warn" className="mt-2">Penolakan dicatat pada riwayat permintaan dan tidak dapat dibatalkan dari sisi pengantin tanpa permintaan baru.</Alert>
      </Modal>
    </>
  );
}

const offers = [
  { id: "o1", couple: "Rahma & Fadel", service: "Konsultasi Prosesi", value: 6500000, date: "12 Jun 2027", validity: "30 Jun 2027", status: "Dikirim" },
  { id: "o2", couple: "Ayu & Dirga", service: "Pendampingan Prosesi Adat", value: 6500000, date: "22 Jun 2027", validity: "28 Jun 2027", status: "Diterima" },
  { id: "o3", couple: "Innah & Ical", service: "Paket Adat Lengkap", value: 12500000, date: "30 Mei 2027", validity: "20 Mei 2027", status: "Kedaluwarsa" },
  { id: "o4", couple: "Sarah & Arman", service: "Konsultasi Prosesi", value: 6500000, date: "12 Jun 2027", validity: "02 Jul 2027", status: "Menunggu" },
];
function VendorOffers() {
  const { toast } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <PageHeader eyebrow="Penawaran" title="Penawaran yang Anda kirim" description="Penawaran bukan kontrak. Dokumen perjanjian dibuat setelah pengantin memilih dan ruang lingkup disepakati." actions={<Button size="sm" onClick={() => setCreateOpen(true)} leading={<Plus className="h-3.5 w-3.5" />}>Buat penawaran</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Penawaran aktif" value="2" helper="Belum dikonversi" icon={<Receipt className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Diterima" value="1" helper="Siap buat perjanjian" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Nilai penawaran" value={formatIDR(32000000, true)} helper="4 penawaran terakhir" icon={<Wallet className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Konversi" value="25%" helper="Ilustrasi prototipe" icon={<ArrowUpRight className="h-3.5 w-3.5" />} tone="neutral" />
      </div>
      <Card className="mt-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Daftar penawaran</h2><Badge tone="neutral" className="text-[12px]">4 dokumen</Badge></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Pengantin</th><th className="px-2 py-2.5 font-bold">Layanan</th><th className="px-2 py-2.5 text-right font-bold">Nilai</th><th className="px-2 py-2.5 font-bold">Acara</th><th className="px-2 py-2.5 font-bold">Status</th><th className="px-4 py-2.5 font-bold">Tindakan</th></tr></thead>
            <tbody className="divide-y divide-line/60">
              {offers.map((o) => <tr key={o.id} className="text-[14px] hover:bg-cream/40"><td className="px-4 py-2.5 font-semibold text-ink">{o.couple}</td><td className="px-2 py-2.5 text-ink-soft">{o.service}</td><td className="px-2 py-2.5 text-right font-bold text-ink">{formatIDR(o.value, true)}</td><td className="px-2 py-2.5 text-muted">{o.date}</td><td className="px-2 py-2.5"><Badge tone={o.status === "Diterima" ? "green" : o.status === "Kedaluwarsa" ? "red" : "amber"} className="text-[11px]">{o.status}</Badge><div className="mt-0.5 text-[11px] text-muted">berlaku s.d. {o.validity}</div></td><td className="px-4 py-2.5"><Button size="sm" variant={o.status === "Diterima" ? "primary" : "secondary"} onClick={() => o.status === "Diterima" ? toast("Penawaran dikonversi menjadi draf perjanjian.", "success", "Draf perjanjian") : toast("Rincian penawaran dibuka pada prototipe.", "info", o.service)}>{o.status === "Diterima" ? "Buat perjanjian" : "Lihat"}</Button></td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
      <Alert tone="trust" className="mt-3" title="Transparansi penawaran">Semua biaya tambahan harus dinyatakan sebelum perjanjian. Jangan menambahkan biaya tak terduga setelah kesepakatan.</Alert>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat penawaran" size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setCreateOpen(false)}>Batal</Button><Button size="sm" onClick={() => { setCreateOpen(false); toast("Penawaran contoh terkirim.", "success", "Penawaran baru"); }}>Kirim penawaran</Button></>}>
        <div className="space-y-3"><Field label="Pilih permintaan"><Select>{vendorInquiries.map((i) => <option key={i.id}>{i.couple} — {i.service}</option>)}</Select></Field><Field label="Nilai penawaran"><Input defaultValue="6500000" /></Field><Field label="Ruang lingkup"><Textarea placeholder="Sebutkan yang termasuk dan tidak termasuk." /></Field></div>
      </Modal>
    </>
  );
}

function VendorContracts() {
  const { agreements, navigate } = useApp();
  return (
    <>
      <PageHeader eyebrow="Kontrak" title="Kontrak & perjanjian layanan" description="Perjanjian yang melibatkan Sanggar Demo Batara sebagai pelaku budaya." actions={<Button size="sm" variant="secondary" onClick={() => navigate("vendor/verifikasi")}>Panduan kontrak</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Kontrak aktif" value="2" helper="Berjalan" icon={<FileSignature className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Menunggu persetujuan" value="1" helper="Perlu tanggapan" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Menunggu BAST" value="1" helper="Diajukan vendor" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="blue" /><StatCard label="Nilai kontrak" value={formatIDR(27000000, true)} helper="Tidak termasuk pajak" icon={<Wallet className="h-3.5 w-3.5" />} /></div>
      <Card className="mt-3 overflow-hidden">
        <div className="border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Dokumen kontrak</h2><p className="mt-0.5 text-[13px] text-muted">Gunakan versi yang telah disepakati saat menyelesaikan BAST.</p></div>
        <div className="divide-y divide-line/60">
          {agreements.slice(0, 4).map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-light text-sand-deep"><FileText className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[14px] font-bold text-ink">{a.number}</span><Badge tone={statusTone(a.status)} dot className="text-[11px]">{a.status}</Badge></div><div className="mt-0.5 text-[12px] text-muted">Nurul & Aditya · {a.service} · {formatIDR(a.value)}</div></div>
              <Button size="sm" variant="secondary" onClick={() => navigate(`perjanjian/${a.id}`)}>Buka kontrak</Button>
            </div>
          ))}
        </div>
      </Card>
      <Alert tone="warn" className="mt-3" title="Versi dokumen">Jangan meminta pengantin menandatangani versi berbeda di luar platform. Draf yang diubah harus disetujui ulang oleh kedua pihak.</Alert>
    </>
  );
}

function VendorSchedulePage() {
  const { toast } = useApp();
  const [blocked, setBlocked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader eyebrow="Jadwal layanan" title="Jadwal layanan Anda" description="Permintaan dan konfirmasi tanggal. Ketersediaan belum menjadi pemesanan sampai perjanjian disepakati." actions={<Button size="sm" onClick={() => setOpen(true)} leading={<Plus className="h-3.5 w-3.5" />}>Tandai tanggal tidak tersedia</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Layanan bulan ini" value="3" helper="1 wajib hadir" icon={<CalendarCheck className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Konsultasi daring" value="2" helper="Juni 2027" icon={<MessageSquare className="h-3.5 w-3.5" />} tone="blue" /><StatCard label="Tanggal diblokir" value={blocked.length} helper="Tidak dapat dipesan" icon={<CalendarDays className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Rata-rata respon" value="3,2 jam" helper="Target 24 jam" icon={<Clock className="h-3.5 w-3.5" />} /></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Agenda terkonfirmasi</h2><p className="mt-0.5 text-[13px] text-muted">Juni 2027 · WITA · lokasi sesuai perjanjian.</p></div>
          <div className="divide-y divide-line/60">
            {vendorSchedule.map((s) => (
              <div key={s.title} className="flex flex-wrap items-start gap-2.5 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-ink text-cream"><span className="text-[14px] font-bold leading-none">{s.date.split(" ")[0]}</span><span className="text-[11px] uppercase text-cream/60">Juni</span></div>
                <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">{s.title}</div><div className="mt-0.5 text-[12px] text-muted">{s.date} · {s.time} · {s.place}</div></div>
                <Badge tone={s.state === "Wajib hadir" ? "red" : s.state === "Perlu konfirmasi" ? "amber" : "green"} className="text-[11px]">{s.state}</Badge>
                <Button size="sm" variant="secondary" onClick={() => toast(s.state === "Perlu konfirmasi" ? "Kehadiran dikonfirmasi pada prototipe." : "Rincian agenda tersedia pada prototipe.", "success")}>{s.state === "Perlu konfirmasi" ? "Konfirmasi" : "Detail"}</Button>
              </div>
            ))}
          </div>
        </Card>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Juni 2027</h3><div className="mt-2 grid grid-cols-7 gap-1 text-center text-[12px]">{(monthGrid()).map((d, i) => <div key={i} className={cn("flex aspect-square items-center justify-center rounded", blocked.includes(String(d)) ? "bg-[#F9ECE9] text-[#933A2F]" : d === 12 || d === 13 || d === 18 ? "bg-ink text-cream" : d ? "text-ink-soft hover:bg-cream" : "")}>{d || ""}</div>)}</div><div className="mt-2 flex gap-2 text-[11px] text-muted"><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ink" />Layanan</span><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#933A2F]" />Diblokir</span></div></Card>
          <Alert tone="info" title="Ketersediaan bukan pemesanan">Tanggal baru dikonfirmasi setelah persetujuan perjanjian. Jangan menjanjikan slot sebelum itu.</Alert>
        </aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Blokir tanggal" description="Tanggal yang diblokir tidak akan menerima permintaan otomatis." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" onClick={() => { setBlocked((b) => [...b, "24"]); setOpen(false); toast("Tanggal contoh diblokir pada kalender prototipe.", "success", "Tanggal diblokir"); }}>Blokir tanggal</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Dari tanggal"><Input type="date" defaultValue="2027-06-24" /></Field><Field label="Sampai tanggal"><Input type="date" defaultValue="2027-06-25" /></Field></div>
        <Field label="Alasan internal" className="mt-3"><Input placeholder="Contoh: persiapan sanggar" /></Field>
      </Modal>
    </>
  );
}
function monthGrid() {
  const arr: (number | null)[] = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  return arr.slice(0, 35);
}

function VendorPayments() {
  const { toast } = useApp();
  const [detail, setDetail] = useState<(typeof seedEarnings)[0] | null>(null);
  return (
    <>
      <PageHeader eyebrow="Pembayaran" title="Pembayaran & pendapatan" description="Catatan pembayaran dari perjanjian. Bukan saldo yang disimpan VAKSARA." actions={<Button size="sm" variant="secondary" onClick={() => toast("Rekap pendapatan diunduh pada implementasi produksi.", "info", "Ekspor prototipe")} leading={<Download className="h-3.5 w-3.5" />}>Ekspor</Button>} />
      <Alert tone="warn" className="mb-3" title="Bukan saldo platform">VAKSARA tidak menyimpan dana Anda. Pembayaran tercatat untuk transparansi dan pencocokan bukti; pencairan bukan bagian dari prototipe ini. Status gateway adalah simulasi.</Alert>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Total diterima" value={formatIDR(17200000, true)} helper="Termasuk manual & gateway" icon={<Wallet className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Pending" value={formatIDR(5550000, true)} helper="Menunggu BAST" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Terverifikasi gateway" value={formatIDR(7400000, true)} helper="Xendit prototipe" icon={<ShieldCheck className="h-3.5 w-3.5" />} tone="blue" /><StatCard label="Manual perlu cocok" value={formatIDR(9800000, true)} helper="Bukti transfer" icon={<FileText className="h-3.5 w-3.5" />} /></div>
      <Card className="mt-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Riwayat pembayaran</h2><Badge tone="neutral" className="text-[12px]">4 transaksi</Badge></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Tanggal</th><th className="px-2 py-2.5 font-bold">Keterangan</th><th className="px-2 py-2.5 font-bold">Metode</th><th className="px-2 py-2.5 text-right font-bold">Nominal</th><th className="px-4 py-2.5 font-bold">Status</th></tr></thead><tbody className="divide-y divide-line/60">{seedEarnings.map((e) => <tr key={e.id} className="text-[14px] hover:bg-cream/40"><td className="px-4 py-2.5 text-muted">{e.date}</td><td className="px-2 py-2.5 font-medium text-ink">{e.label}</td><td className="px-2 py-2.5"><span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-semibold", e.method.includes("Xendit") ? "bg-[#EAF1F5] text-[#33607A]" : "bg-[#F1EFE9] text-ink-soft")}>{e.method.includes("Xendit") ? <ShieldCheck className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}{e.method}</span></td><td className="px-2 py-2.5 text-right font-bold text-ink">{formatIDR(e.amount)}</td><td className="px-4 py-2.5"><button onClick={() => setDetail(e)}><Badge tone={e.status === "Terverifikasi" ? "green" : e.status === "Tertunda" ? "amber" : "blue"} dot className="text-[11px]">{e.status}</Badge></button></td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Rincian pembayaran" description={detail ? detail.label : ""} size="sm" footer={<Button size="sm" variant="secondary" onClick={() => setDetail(null)}>Tutup</Button>}>
        {detail && <div className="space-y-2">{[["Nominal", formatIDR(detail.amount)], ["Metode", detail.method], ["Status", detail.status], ["Dicatat oleh", detail.method.includes("Xendit") ? "Sistem prototipe" : "Vendor / pengantin"]].map(([l, v]) => <div key={l} className="flex justify-between gap-2 text-[14px]"><span className="text-muted">{l}</span><span className="text-right font-semibold text-ink">{v}</span></div>)}<Alert tone={detail.status === "Terverifikasi" ? "success" : "info"} className="mt-2">{detail.status === "Terverifikasi" ? "Konfirmasi gateway simulasi. Tidak ada uang nyata yang diproses." : "Pembayaran manual perlu dicocokkan dengan bukti transfer. Hubungi pengantin bila ada perbedaan."}</Alert></div>}
      </Modal>
    </>
  );
}

function VendorBast() {
  const { toast, navigate } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [state, setState] = useState("Menunggu keputusan pengantin");
  return (
    <>
      <PageHeader eyebrow="BAST" title="Serah terima layanan" description="Ajukan dan konfirmasi hasil kerja. BAST selesai hanya setelah penerimaan pengantin dan konfirmasi vendor terpenuhi." actions={<Button size="sm" variant="secondary" onClick={() => navigate("pengiriman/a1")}>Lihat pelacakan</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Menunggu keputusan" value="1" helper="Dapur Cita · bukan Anda" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Perlu konfirmasi Anda" value={state === "Menunggu keputusan pengantin" ? "0" : "1"} helper="Setelah keputusan pengantin" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Diterima" value="2" helper="Riwayat prototipe" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Revisi terbuka" value="0" helper="Tidak ada" icon={<FileText className="h-3.5 w-3.5" />} /></div>
      <Alert tone="trust" className="mt-3" title="BAST tidak dapat diselesaikan sepihak">Anda dapat mengajukan dan mengonfirmasi, tetapi status selesai memerlukan keputusan penerimaan dari pengantin. Perbedaan dicatat sebagai item tidak lengkap.</Alert>
      <Card className="mt-3 overflow-hidden">
        <div className="border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">BAST terkait layanan Anda</h2></div>
        <div className="divide-y divide-line/60">
          {[{ code: "BAST-VKS-0184", title: "Prosesi Mappacci & Pendampingan Adat", client: "Nurul & Aditya", submitted: "16 Juni 2027", status: state }, { code: "BAST-VKS-0175", title: "Set Busana Pengantin", client: "Nurul & Aditya", submitted: "12 Juni 2027", status: "Diterima" }].map((b) => (
            <div key={b.code} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-light text-sand-deep"><ClipboardCheck className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[14px] font-bold text-ink">{b.code}</span><Badge tone={b.status === "Diterima" ? "green" : "amber"} dot className="text-[11px]">{b.status}</Badge></div><div className="mt-0.5 text-[12px] text-muted">{b.title} · {b.client} · diajukan {b.submitted}</div></div>
              <Button size="sm" variant="secondary" onClick={() => navigate("bast/a1")}>Tinjau dokumen</Button>
              {b.status !== "Diterima" && <Button size="sm" onClick={() => setConfirmOpen(true)}>Konfirmasi BAST</Button>}
            </div>
          ))}
        </div>
      </Card>
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Konfirmasi BAST" description="Konfirmasi ini menyatakan Anda telah menyampaikan hasil kerja. Status selesai tetap menunggu pengantin." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setConfirmOpen(false)}>Batal</Button><Button size="sm" disabled={!ack} onClick={() => { setConfirmOpen(false); setAck(false); setState("Menunggu penerimaan pengantin"); toast("Konfirmasi vendor dicatat. BAST menunggu keputusan akhir pengantin.", "success", "Konfirmasi dikirim"); }}>Konfirmasi</Button></>}>
        <div className="space-y-3"><Alert tone="info" title="Status saat ini">Pengantin belum mengambil keputusan untuk BAST ini. Konfirmasi Anda tidak akan menandai BAST selesai.</Alert><Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya menyatakan laporan hasil kerja dan bukti yang diunggah sudah lengkap.</span>} /></div>
      </Modal>
    </>
  );
}

function VendorComplaints() {
  const { disputes, updateDispute, toast } = useApp();
  const mine = disputes.filter((d) => d.responder !== "Nurul Amalia");
  const [selected, setSelected] = useState(mine[0]?.id);
  const d = mine.find((x) => x.id === selected) ?? mine[0];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <>
      <PageHeader eyebrow="Pengaduan" title="Pengaduan yang melibatkan Anda" description="Anda dapat melihat rincian, mengirim klarifikasi, mengunggah bukti, dan menanggapi usulan penyelesaian." actions={<Button size="sm" variant="secondary" onClick={() => navigateTo(toast)}>Panduan</Button>} />
      {mine.length === 0 ? <EmptyState title="Tidak ada pengaduan aktif" description="Anda akan menerima notifikasi jika ada pengaduan terkait layanan Anda." /> : (
        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-3 py-2.5"><h2 className="text-[15px] font-bold text-ink">Daftar kasus</h2></div>
            <div className="divide-y divide-line/60">{mine.map((x) => <button key={x.id} onClick={() => setSelected(x.id)} className={cn("block w-full px-3 py-2.5 text-left", selected === x.id ? "bg-[#F7F3E9]" : "hover:bg-cream")}><div className="flex items-center justify-between gap-2"><span className="text-[12px] font-bold text-sand-deep">{x.number}</span><Badge tone={statusTone(x.status)} className="px-1 py-0.5 text-[11px]">{x.status}</Badge></div><div className="mt-1 text-[13px] font-semibold leading-snug text-ink">{x.title}</div><div className="mt-0.5 text-[12px] text-muted">{x.opened} · {x.opener}</div></button>)}</div>
          </Card>
          <div className="space-y-3">
            <Card className="overflow-hidden"><div className="border-b border-line bg-[#FBFAF6] px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[12px] font-bold uppercase tracking-wider text-sand-deep">{d.number}</div><h2 className="text-[15px] font-bold text-ink">{d.title}</h2></div><Badge tone={statusTone(d.status)} dot className="text-[12px]">{d.status}</Badge></div></div><div className="p-4"><p className="text-[14px] leading-relaxed text-ink-soft">{d.description}</p><div className="mt-2 rounded-lg border border-sand/40 bg-sand-light/40 p-2.5"><div className="text-[12px] font-bold uppercase tracking-wider text-sand-deep">Usulan penyelesaian</div><p className="mt-0.5 text-[14px] text-ink-soft">{d.proposed}</p></div><div className="mt-3 text-[12px] font-bold uppercase tracking-wider text-muted">Kronologi</div><div className="mt-1.5 space-y-2">{d.messages.map((m, i) => <div key={i} className="rounded-lg border border-line bg-white p-2.5"><div className="flex justify-between gap-2"><span className="text-[13px] font-bold text-ink">{m.by}</span><span className="text-[11px] text-muted">{m.date}</span></div><p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{m.text}</p></div>)}</div></div></Card>
            <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Tanggapan vendor</h3><div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Kirim klarifikasi</Button><Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Unggah bukti</Button><Button size="sm" variant="secondary" onClick={() => { updateDispute(d.id, { status: "Klarifikasi" }); toast("Permintaan klarifikasi dicatat.", "success"); }}>Terima usulan</Button><Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Usulkan alternatif</Button></div><p className="mt-2 text-[12px] leading-relaxed text-muted">Jangan menghapus bukti atau mengubah dokumen yang telah disepakati. VAKSARA tidak memberikan putusan hukum.</p></Card>
          </div>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Kirim tanggapan vendor" description="Tanggapan akan terlihat oleh pengantin dan Trust Officer." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" disabled={text.trim().length < 15} onClick={() => { updateDispute(d.id, { status: "Klarifikasi", messages: [...d.messages, { by: d.responder, role: "Vendor", date: "Hari ini", text, type: "clarification" }] }); setOpen(false); setText(""); toast("Klarifikasi vendor dikirim.", "success", "Tanggapan terkirim"); }}>Kirim</Button></>}>
        <Field label="Klarifikasi / usulan" required><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Sampaikan fakta dan dokumen pendukung. Hindari pernyataan yang tidak bisa dibuktikan." /></Field>
        <UploadBox title="Unggah bukti" compact onAdd={() => toast("Bukti contoh dilampirkan.", "success")} />
      </Modal>
    </>
  );
}
function navigateTo(toast: (m: string, t?: "success" | "error" | "info" | "warn", title?: string) => void) { toast("Panduan pengaduan dibuka pada implementasi produksi.", "info", "Panduan"); }
