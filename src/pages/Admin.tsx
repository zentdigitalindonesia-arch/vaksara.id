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
  statusTone
} from "@/components/ui";
import { adminUsers, agreements, auditLogs, contentModeration, formatIDR, screeningQueue } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Ban,
  BookMarked,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileStack,
  FileText,
  FolderTree,
  KeyRound,
  Lock,
  MessageSquareWarning,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";
import { useState } from "react";

export default function AdminWorkspace({ page }: { page: string }) {
  if (page === "pengguna") return <AdminUsers />;
  if (page === "screening") return <AdminScreening />;
  if (page === "direktori") return <AdminDirectory />;
  if (page === "moderasi") return <AdminModeration />;
  if (page === "perjanjian") return <AdminAgreements />;
  if (page === "pengaduan") return <AdminComplaints />;
  if (page === "audit") return <AdminAudit />;
  if (page === "analitik") return <AdminAnalytics />;
  return <AdminOverview />;
}

function AdminRestricted({ note = "Anda masuk sebagai Trust Officer dengan akses terbatas. Tindakan tidak dapat menghapus bukti, mengubah dokumen yang telah disepakati, atau mewakili salah satu pihak." }: { note?: string }) {
  return <Alert tone="trust" className="mb-3" title="Akses berbasis penugasan & tercatat" icon={<Lock className="h-4 w-4" />}>{note}</Alert>;
}

function AdminOverview() {
  const { navigate } = useApp();
  return (
    <>
      <PageHeader eyebrow="Trust Center" title="Overview operasi" description="Pantau antrean verifikasi, perjanjian, pengaduan, dan kesehatan ekosistem." actions={<Button size="sm" variant="secondary" onClick={() => navigate("admin/audit")} leading={<FileText className="h-3.5 w-3.5" />}>Audit trail</Button>} />
      <AdminRestricted />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <StatCard label="Pengguna aktif" value="1.248" helper="+7,4% bulan ini" icon={<Users className="h-3.5 w-3.5" />} tone="green" onClick={() => navigate("admin/pengguna")} />
        <StatCard label="Antrean screening" value="5" helper="2 perlu perbaikan" icon={<BadgeCheck className="h-3.5 w-3.5" />} tone="sand" onClick={() => navigate("admin/screening")} />
        <StatCard label="Perjanjian aktif" value="42" helper="Nilai tercatat prototipe" icon={<FileSignature className="h-3.5 w-3.5" />} tone="blue" onClick={() => navigate("admin/perjanjian")} />
        <StatCard label="Pengaduan terbuka" value="2" helper="1 belum ditugaskan" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} tone="red" onClick={() => navigate("admin/pengaduan")} />
        <StatCard className="col-span-2 lg:col-span-1" label="BAST selesai" value="31" helper="Dari 38 layanan" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="green" />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-3">
          <SectionCard title="Antrean screening pelaku budaya" subtitle="Urut berdasarkan batas waktu peninjauan." action={<button onClick={() => navigate("admin/screening")} className="text-[12px] font-bold text-ink">Buka antrean <ArrowRight className="ml-0.5 inline h-2.5 w-2.5" /></button>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead className="border-b border-line text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-2 py-2 font-bold">Pemohon</th><th className="px-2 py-2 font-bold">Kategori</th><th className="px-2 py-2 font-bold">Kelengkapan</th><th className="px-2 py-2 font-bold">Status</th><th className="px-2 py-2" /></tr></thead>
                <tbody className="divide-y divide-line/60">{screeningQueue.slice(0, 4).map((s) => <tr key={s.id} className="text-[13px] hover:bg-cream/40"><td className="px-2 py-2.5"><div className="font-semibold text-ink">{s.name}</div><div className="text-[12px] text-muted">{s.city} · {s.submitted}</div></td><td className="px-2 py-2.5 text-ink-soft">{s.type}</td><td className="px-2 py-2.5"><div className="flex items-center gap-1.5"><Progress value={s.completeness} tone={s.completeness > 90 ? "green" : "sand"} height="h-1" className="w-14" /><span className="text-[12px] text-muted">{s.completeness}%</span></div></td><td className="px-2 py-2.5"><Badge tone={statusTone(s.state)} className="text-[12px]">{s.state}</Badge>{s.flags > 0 && <span className="ml-1 text-[12px] text-[#933A2F]">{s.flags} flag</span>}</td><td className="px-2 py-2.5"><button onClick={() => navigate("admin/screening")} className="rounded p-0.5 text-muted hover:text-ink" aria-label={`Tinjau ${s.name}`}><ChevronRight className="h-3 w-3" /></button></td></tr>)}</tbody>
              </table>
            </div>
          </SectionCard>
          <div className="grid gap-3 md:grid-cols-2">
            <SectionCard title="Perjanjian terbaru" subtitle="Registry dokumen." action={<button onClick={() => navigate("admin/perjanjian")} className="text-[12px] font-bold text-ink">Semua</button>}>
              <div className="space-y-2">{agreements.slice(0, 4).map((a) => <div key={a.id} className="flex items-center justify-between gap-2 text-[13px]"><div className="min-w-0"><div className="truncate font-semibold text-ink">{a.number}</div><div className="truncate text-[12px] text-muted">{a.partner}</div></div><Badge tone={statusTone(a.status)} className="shrink-0 px-1 py-0.5 text-[12px]">{a.status}</Badge></div>)}</div>
            </SectionCard>
            <SectionCard title="Pengaduan" subtitle="Kasus aktif dan penugasan." action={<button onClick={() => navigate("admin/pengaduan")} className="text-[12px] font-bold text-ink">Buka</button>}>
              <div className="space-y-2">{disputesPreview.map((d) => <div key={d.id} className="rounded-lg border border-line p-2"><div className="flex justify-between gap-2"><span className="text-[12px] font-bold text-sand-deep">{d.id}</span><Badge tone={d.tone} className="px-1 py-0 text-[12px]">{d.status}</Badge></div><div className="mt-0.5 text-[12px] font-medium leading-snug text-ink">{d.title}</div><div className="mt-0.5 text-[12px] text-muted">{d.officer}</div></div>)}</div>
            </SectionCard>
          </div>
        </div>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="text-[14px] font-bold text-ink">Kesehatan trust</h3><div className="mt-2 space-y-2">{[["Profil dengan screening lengkap", 87, "green"], ["Kontrak dengan persetujuan dua pihak", 94, "blue"], ["BAST ditinjau < 7 hari", 72, "sand"], ["Pengaduan selesai dengan kesepakatan", 64, "green"]].map(([l, v, t]) => <div key={l as string}><div className="flex justify-between text-[12px]"><span className="text-muted">{l as string}</span><span className="font-semibold text-ink">{v as number}%</span></div><Progress value={v as number} tone={t as "green"} height="h-1" className="mt-0.5" /></div>)}</div></Card>
          <Card className="overflow-hidden"><div className="border-b border-line px-4 py-2.5"><h3 className="text-[14px] font-bold text-ink">Aktivitas terbaru</h3></div><div className="divide-y divide-line/60">{auditLogs.slice(0, 4).map((a) => <div key={a.time + a.action} className="px-3 py-2"><div className="text-[12px] font-medium leading-snug text-ink">{a.action}</div><div className="mt-0.5 text-[12px] text-muted">{a.actor} · {a.time}</div></div>)}</div><button onClick={() => navigate("admin/audit")} className="w-full border-t border-line py-2 text-[12px] font-semibold text-ink hover:bg-cream">Lihat semua aktivitas</button></Card>
          <SectionCard title="Izin bergantung peran" action={<ShieldAlert className="h-3.5 w-3.5 text-[#855A16]" />}><div className="space-y-1.5">{[["Trust Officer", "Kasus ditugaskan"], ["Admin Direktori", "Publikasi listing"], ["Auditor", "Hanya baca"]].map(([r, s]) => <div key={r} className="flex justify-between gap-2 text-[12px]"><span className="font-medium text-ink">{r}</span><span className="text-right text-muted">{s}</span></div>)}</div></SectionCard>
        </aside>
      </div>
    </>
  );
}

const disputesPreview = [
  { id: "DSP-2027-0031", title: "Jumlah hasil dokumentasi", status: "Fasilitasi", tone: "blue" as const, officer: "Rani Saputri" },
  { id: "DSP-2027-0028", title: "Perbedaan porsi katering", status: "Menunggu", tone: "amber" as const, officer: "Belum ditugaskan" },
  { id: "DSP-2027-0035", title: "Perubahan durasi musik", status: "Diajukan", tone: "neutral" as const, officer: "Belum ditugaskan" },
];

function AdminUsers() {
  const { toast } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Semua peran");
  const [selected, setSelected] = useState<(typeof adminUsers)[0] | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const filtered = adminUsers.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase()) && (role === "Semua peran" || u.role === role));
  return (
    <>
      <PageHeader eyebrow="Trust Center · Pengguna" title="Manajemen pengguna" description="Kelola akses berdasarkan peran tanpa membuka data pribadi yang tidak diperlukan." actions={<Button size="sm" variant="secondary" onClick={() => toast("Unduhan daftar pengguna dibatasi. Permintaan akses akan dicatat.", "warn", "Akses terbatas")} leading={<Download className="h-3.5 w-3.5" />}>Ekspor</Button>} />
      <AdminRestricted note="Data pengguna dibatasi. Jangan membuka atau membagikan kontak pribadi di luar keperluan penugasan. Setiap akses tercatat." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Total pengguna" value="1.248" helper="Data demonstrasi" icon={<Users className="h-3.5 w-3.5" />} /><StatCard label="Pelaku budaya" value="128" helper="94 terverifikasi" icon={<BadgeCheck className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Dalam screening" value="5" helper="Antrean aktif" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Akses terbatas" value="3" helper="Penugasan aktif" icon={<KeyRound className="h-3.5 w-3.5" />} tone="blue" /></div>
      <Card className="mt-3 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau surel" className="h-8 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[14px] outline-none focus:border-sand-deep sm:w-[220px]" /></div><div className="flex gap-1.5"><select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter peran" className="h-8 rounded-md border border-line bg-white px-2 text-[14px] font-medium text-ink-soft outline-none">{["Semua peran", "Calon pengantin", "Pelaku budaya", "Vendor", "Trust Officer"].map((r) => <option key={r}>{r}</option>)}</select><Badge tone="neutral" className="self-center text-[12px]">{filtered.length} hasil</Badge></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Nama</th><th className="px-2 py-2.5 font-bold">Peran</th><th className="px-2 py-2.5 font-bold">Bergabung</th><th className="px-2 py-2.5 font-bold">Status</th><th className="px-4 py-2.5 font-bold">Aksi</th></tr></thead><tbody className="divide-y divide-line/60">{filtered.map((u) => <tr key={u.email} className="text-[14px] hover:bg-cream/40"><td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar name={u.name} size="xs" /><div><div className="font-semibold text-ink">{u.name}</div><div className="text-[12px] text-muted">{u.email}</div></div></div></td><td className="px-2 py-2.5 text-ink-soft">{u.role}</td><td className="px-2 py-2.5 text-muted">{u.joined}</td><td className="px-2 py-2.5"><Badge tone={u.status === "Terverifikasi" ? "green" : u.status === "Screening" ? "amber" : u.status === "Akses terbatas" ? "blue" : "neutral"} dot className="text-[12px]">{u.status}</Badge>{u.verified && <BadgeCheck className="ml-1 inline h-3 w-3 text-[#4C8068]" />}</td><td className="px-4 py-2.5"><Button size="sm" variant="secondary" onClick={() => setSelected(u)}>Kelola akses</Button></td></tr>)}</tbody></table></div>
        {filtered.length === 0 && <div className="p-6"><EmptyState compact title="Pengguna tidak ditemukan" description="Ubah kata kunci atau filter peran." /></div>}
      </Card>
      <Alert tone="warn" className="mt-3" title="Data pribadi">Jangan mengubah status verifikasi tanpa bukti. Penangguhan akun harus memiliki alasan tertulis dan tercatat pada audit trail.</Alert>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Akses: ${selected.name}` : ""} description="Tinjau peran dan izin. Perubahan akses akan dicatat." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setSelected(null)}>Tutup</Button><Button size="sm" variant="danger" onClick={() => { setSelected(null); setSuspendOpen(true); }}>Batasi akun</Button></>}>
        {selected && <div className="space-y-3"><div className="grid grid-cols-2 gap-2">{[["Peran", selected.role], ["Status", selected.status], ["Surel", selected.email], ["Bergabung", selected.joined]].map(([l, v]) => <div key={l} className="rounded-lg border border-line bg-[#FBFAF6] p-2.5"><div className="text-[12px] text-muted">{l}</div><div className="mt-0.5 text-[13px] font-semibold text-ink">{v}</div></div>)}</div><Alert tone="info" title="Batasan baca">Kontak telepon dan dokumen identitas tidak ditampilkan pada prototipe. Akses ke berkas lengkap memerlukan persetujuan supervisor.</Alert></div>}
      </Modal>
      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Batasi akses akun?" description="Tindakan ini membatasi kemampuan masuk pengguna dan tercatat permanen." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setSuspendOpen(false)}>Batal</Button><Button size="sm" variant="danger" disabled={!ack} onClick={() => { setSuspendOpen(false); setAck(false); toast("Pembatasan akun dicontohkan dan dicatat pada audit trail prototipe.", "warn", "Akses dibatasi"); }}>Ya, batasi akses</Button></>}>
        <div className="space-y-3"><Alert tone="error" title="Tindakan berdampak">Pengguna tidak dapat menerima permintaan atau mengakses dokumen selama pembatasan. Tidak ada penghapusan data.</Alert><Field label="Alasan pembatasan" required><Textarea placeholder="Contoh: indikasi penyalahgunaan akun; menunggu verifikasi." /></Field><Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya meninjau bukti yang relevan dan memahami tindakan ini dicatat.</span>} /></div>
      </Modal>
    </>
  );
}

function AdminScreening() {
  const { toast } = useApp();
  const [selected, setSelected] = useState(screeningQueue[0]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const decision = decisions[selected.id];
  return (
    <>
      <PageHeader eyebrow="Trust Center · Screening" title="Screening pelaku budaya" description="Periksa identitas, portofolio, dan pengetahuan budaya secara terpisah. Jangan menjanjikan hasil sebelum seluruh lapis selesai." actions={<Button size="sm" variant="secondary" onClick={() => toast("Panduan screening dibuka pada implementasi produksi.", "info", "Panduan")}>Panduan internal</Button>} />
      <AdminRestricted note="Trust Officer tidak dapat mempublikasikan profil dengan dokumen yang belum lengkap, meminta bayaran untuk mempercepat verifikasi, atau mengubah portofolio pemohon." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Antrean" value={screeningQueue.length} helper="2 prioritas" icon={<BadgeCheck className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Perlu perbaikan" value="2" helper="Menunggu pemohon" icon={<Pencil className="h-3.5 w-3.5" />} tone="red" /><StatCard label="Siap dipublikasi" value="1" helper="Dokumen lengkap" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Rata-rata tinjauan" value="4,2 hari" helper="Target 5 hari" icon={<Clock className="h-3.5 w-3.5" />} tone="blue" /></div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden"><div className="border-b border-line px-3 py-2.5"><h2 className="text-[15px] font-bold text-ink">Antrean pemohon</h2></div><div className="divide-y divide-line/60">{screeningQueue.map((s) => <button key={s.id} onClick={() => setSelected(s)} className={cn("block w-full px-3 py-2.5 text-left", selected.id === s.id ? "bg-[#F7F3E9]" : "hover:bg-cream")}><div className="flex justify-between gap-2"><span className="text-[13px] font-bold text-ink">{s.name}</span><span className="text-[12px] text-muted">{s.completeness}%</span></div><div className="mt-0.5 text-[12px] text-muted">{s.type} · {s.city}</div><div className="mt-1 flex items-center justify-between"><Badge tone={statusTone(decisions[s.id] ?? s.state)} className="px-1 py-0.5 text-[12px]">{decisions[s.id] ?? s.state}</Badge>{s.flags > 0 && <span className="text-[12px] text-[#933A2F]">{s.flags} flag</span>}</div></button>)}</div></Card>
        <div className="space-y-3">
          <Card className="p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex items-center gap-2.5"><Avatar name={selected.name} size="lg" /><div><h2 className="text-[16px] font-bold text-ink">{selected.name}</h2><p className="text-[13px] text-muted">{selected.type} · {selected.city} · diajukan {selected.submitted}</p><div className="mt-1 flex gap-1"><Badge tone="neutral" className="text-[12px]">ID pemohon disamarkan</Badge>{selected.flags > 0 && <Badge tone="red" className="text-[12px]">{selected.flags} catatan</Badge>}</div></div></div><div className="text-right"><div className="text-[12px] text-muted">Kelengkapan</div><div className="text-[15px] font-bold text-ink">{selected.completeness}%</div><Progress value={selected.completeness} tone="sand" height="h-1" className="mt-1 w-24" /></div></div>
            {decision && <Alert tone={decision === "Siap dipublikasikan" ? "success" : decision === "Perlu perbaikan" ? "warn" : "info"} className="mt-3" title={`Keputusan prototipe: ${decision}`}>{decision === "Perlu perbaikan" ? "Permintaan koreksi dikirim. Profil tetap dalam antrean." : "Keputusan dicatat pada audit trail prototipe. Implementasi produksi memerlukan persetujuan supervisor."}</Alert>}
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {[["Identitas & kontak", "Bukti dokumen sesuai pemilik akun", "green"], ["Portofolio", `${selected.flags ? "2 foto perlu atribusi" : "Atribusi lengkap"}`, selected.flags ? "amber" : "green"], ["Pengetahuan budaya", "Wawancara belum dijadwalkan", "amber"]].map(([t, d, tone]) => <Card key={t as string} className="p-3"><div className="flex items-center justify-between"><h3 className="text-[13px] font-bold text-ink">{t as string}</h3><Badge tone={tone as "green"} className="px-1 py-0.5 text-[12px]">{tone === "amber" ? "Ditinjau" : "Sesuai"}</Badge></div><p className="mt-1 text-[12px] leading-relaxed text-muted">{d as string}</p><button onClick={() => toast("Berkas pemeriksaan dibuka pada implementasi produksi.", "info")} className="mt-1.5 text-[12px] font-bold text-ink underline decoration-sand underline-offset-2">Lihat berkas</button></Card>)}
          </div>
          <SectionCard title="Ringkasan peninjauan" subtitle="Semua tindakan dicatat tanpa mengubah berkas asli." action={<Badge tone="outline" className="text-[12px]">Audit aktif</Badge>}>
            <div className="rounded-lg border border-line bg-[#FBFAF6] p-3 text-[13px] leading-relaxed text-ink-soft">Pemohon memiliki pengalaman 9 tahun dan portofolio yang relevan. Dua foto belum mencantumkan sumber. Wawancara pengetahuan budaya belum dilakukan. Keputusan tidak boleh didasarkan pada jumlah pengikut atau kemampuan membayar.</div>
            <div className="mt-3 flex flex-wrap gap-1.5"><Button size="sm" variant="secondary" onClick={() => { setNote(""); setCorrectionOpen(true); }} leading={<Pencil className="h-3 w-3" />}>Minta perbaikan</Button><Button size="sm" onClick={() => { setAck(false); setApproveOpen(true); }} disabled={selected.completeness < 80} leading={<Check className="h-3 w-3" />}>Siap dipublikasikan</Button><Button size="sm" variant="ghost" onClick={() => { setDecisions((d) => ({ ...d, [selected.id]: "Ditangguhkan" })); toast("Profil ditangguhkan sementara. Pemohon akan diminta melengkapi dokumen.", "warn", "Screening ditangguhkan"); }}>Tangguhkan</Button></div>
          </SectionCard>
        </div>
      </div>
      <Modal open={correctionOpen} onClose={() => setCorrectionOpen(false)} title="Minta perbaikan profil" description="Tuliskan permintaan spesifik dan dapat ditindaklanjuti. Pemohon akan melihat catatan ini." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setCorrectionOpen(false)}>Batal</Button><Button size="sm" disabled={note.trim().length < 15} onClick={() => { setDecisions((d) => ({ ...d, [selected.id]: "Perlu perbaikan" })); setCorrectionOpen(false); toast("Permintaan perbaikan dikirim ke pemohon dan dicatat pada screening.", "success", "Koreksi diminta"); }}>Kirim permintaan</Button></>}>
        <div className="space-y-3"><Field label="Bagian yang perlu diperbaiki"><Select><option>Rujukan budaya</option><option>Atribusi foto portofolio</option><option>Dokumen identitas</option><option>Deskripsi layanan</option></Select></Field><Field label="Catatan untuk pemohon" required hint={`${note.length}/400`}><Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 400))} placeholder="Jelaskan bukti yang dibutuhkan tanpa meminta data pribadi berlebih." /></Field><Alert tone="info" title="Batas waktu">Pemohon memiliki 7 hari untuk menanggapi. Profil tidak dihapus selama masa perbaikan.</Alert></div>
      </Modal>
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Publikasikan profil pelaku budaya?" description="Publikasi berarti profil tampil di direktori dengan status screening yang sesuai. Bukan jaminan mutu." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setApproveOpen(false)}>Batal</Button><Button size="sm" disabled={!ack} onClick={() => { setApproveOpen(false); setAck(false); setDecisions((d) => ({ ...d, [selected.id]: "Siap dipublikasikan" })); toast("Profil disetujui untuk dipublikasikan. Tindakan dicatat pada audit trail.", "success", "Profil dipublikasikan"); }}>Publikasikan profil</Button></>}>
        <div className="space-y-3"><div className="rounded-lg border border-line bg-[#FBFAF6] p-3 text-[13px]">{[["Pemohon", selected.name], ["Kategori", selected.type], ["Kelengkapan", `${selected.completeness}%`], ["Pengetahuan budaya", "Dalam tinjauan"]].map(([l, v]) => <div key={l} className="mt-1 flex justify-between first:mt-0"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>)}</div><Alert tone="warn" title="Label transparansi">Pengetahuan budaya masih dalam tinjauan. Profil akan tampil dengan label tersebut. Jangan menghapus label sebelum validasi selesai.</Alert><Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya memeriksa dokumen dan tidak menemukan konflik kepentingan.</span>} /></div>
      </Modal>
    </>
  );
}

function AdminDirectory() {
  const { toast } = useApp();
  const [items, setItems] = useState([
    { name: "Sanggar Demo Batara", cat: "Prosesi Adat", city: "Gowa", status: "Aktif", views: 1248 },
    { name: "Rumah Tenun Lipa' Sabbe", cat: "Perajin", city: "Wajo", status: "Aktif", views: 982 },
    { name: "Pakkacaping Tallasa", cat: "Musik", city: "Takalar", status: "Ditangguhkan", views: 0 },
    { name: "Sanggar Riase Kalase", cat: "Busana", city: "Gowa", status: "Menunggu", views: 0 },
  ]);
  return (
    <>
      <PageHeader eyebrow="Admin Direktori" title="Manajemen direktori" description="Kurasi tampilan ekosistem tanpa menjual peringkat. Urutan hasil tidak dapat dibeli." actions={<Button size="sm" variant="secondary" onClick={() => toast("Penambahan kategori memerlukan tinjauan dewan budaya.", "info", "Kategori")}>Tambah kategori</Button>} />
      <AdminRestricted note="Direktori tidak memiliki opsi iklan berbayar yang mengubah urutan organik. Perubahan publikasi harus memiliki alasan dan tercatat." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Listing aktif" value="87" helper="contoh demo" icon={<FolderTree className="h-3.5 w-3.5" />} /><StatCard label="Kategori budaya" value="14" helper="Kurasi dewan" icon={<BookMarked className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Menunggu publikasi" value="2" helper="Screening belum selesai" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Ditangguhkan" value="1" helper="Perlu koreksi" icon={<Ban className="h-3.5 w-3.5" />} tone="red" /></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_260px]">
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-[15px] font-bold text-ink">Listing pelaku budaya</h2><Badge tone="neutral" className="text-[12px]">{items.length}</Badge></div><div className="divide-y divide-line/60">{items.map((it) => <div key={it.name} className="flex flex-wrap items-center gap-2 px-4 py-3"><div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">{it.name}</div><div className="mt-0.5 text-[12px] text-muted">{it.cat} · {it.city} · {it.views} tampilan</div></div><Badge tone={it.status === "Aktif" ? "green" : it.status === "Ditangguhkan" ? "red" : "amber"} dot className="text-[12px]">{it.status}</Badge><Button size="sm" variant="secondary" onClick={() => { setItems((prev) => prev.map((x) => x.name === it.name ? { ...x, status: x.status === "Aktif" ? "Ditangguhkan" : "Aktif" } : x)); toast(`Status listing ${it.name} diperbarui pada sesi prototipe.`, "success", "Direktori diperbarui"); }}>{it.status === "Aktif" ? "Tangguhkan" : "Aktifkan"}</Button></div>)}</div></Card>
        <aside className="space-y-3"><SectionCard title="Urutan organik" subtitle="Relevansi ditentukan oleh kriteria yang dipublikasikan."><div className="space-y-1.5 text-[12px]">{[["Kesesuaian kategori", "30%"], ["Kelengkapan & screening", "25%"], ["Lokasi & ketersediaan", "20%"], ["Riwayat tanggapan", "15%"], ["Ulasan terverifikasi", "10%"]].map(([l, v]) => <div key={l} className="flex justify-between"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>)}</div></SectionCard><Alert tone="warn" title="Tanpa peringkat berbayar">VAKSARA tidak menjual posisi pencarian. Bila model bisnis berubah, perubahan harus diumumkan dan ditinjau etika.</Alert></aside>
      </div>
    </>
  );
}

function AdminModeration() {
  const { toast } = useApp();
  const [states, setStates] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<(typeof contentModeration)[0] | null>(null);
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  return (
    <>
      <PageHeader eyebrow="Moderasi" title="Moderasi konten budaya" description="Pastikan klaim budaya memiliki sumber dan penyajian yang menghormati komunitas. Bukan menilai 'keaslian' satu versi." actions={<Button size="sm" variant="secondary" onClick={() => toast("Pedoman moderasi dibuka pada implementasi produksi.", "info", "Pedoman")}>Pedoman</Button>} />
      <AdminRestricted note="Moderasi tidak menghapus perbedaan praktik yang sah. Konten dibatasi hanya jika melanggar privasi, hak cipta, atau menyajikan klaim tanpa dasar yang dapat membahayakan." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Menunggu tinjauan" value="2" helper="Antrean" icon={<BookMarked className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Perlu sumber" value="1" helper="Prioritas" icon={<CircleAlert className="h-3.5 w-3.5" />} tone="red" /><StatCard label="Terverifikasi" value="36" helper="Total konten" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Dibatasi" value="1" helper="Izin terbatas" icon={<Eye className="h-3.5 w-3.5" />} tone="neutral" /></div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">{contentModeration.map((c) => { const state = states[c.title] ?? c.state; return <Card key={c.title} className="p-3.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><Badge tone="neutral" className="text-[12px]">{c.type}</Badge><h3 className="mt-1.5 text-[14px] font-bold leading-snug text-ink">{c.title}</h3><p className="mt-0.5 text-[12px] text-muted">{c.submitter} · {c.date}</p></div><Badge tone={statusTone(state)} dot className="shrink-0 text-[12px]">{state}</Badge></div><div className="mt-2 flex items-center gap-1.5">{c.flags > 0 && <Badge tone="red" className="text-[12px]">{c.flags} flag</Badge>}<button onClick={() => { setSelected(c); setAck(false); setNote(""); }} className="ml-auto text-[12px] font-bold text-ink underline decoration-sand underline-offset-2">Tinjau</button></div></Card>; })}</div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""} description={selected ? `${selected.type} · ${selected.submitter}` : ""} size="lg" footer={<><Button size="sm" variant="secondary" onClick={() => setSelected(null)}>Tutup</Button><Button size="sm" variant="secondary" onClick={() => { if (selected) setStates((s) => ({ ...s, [selected.title]: "Perlu sumber" })); setSelected(null); toast("Permintaan sumber dikirim ke kontributor.", "info", "Sumber diminta"); }}>Minta sumber</Button><Button size="sm" disabled={!ack} onClick={() => { if (selected) setStates((s) => ({ ...s, [selected.title]: "Terverifikasi" })); setSelected(null); toast("Konten diverifikasi dan dicatat pada audit trail prototipe.", "success", "Konten terverifikasi"); }}>Verifikasi</Button></>}>
        {selected && <div className="space-y-3"><div className="rounded-xl border border-line bg-[#FBFAF6] p-3 text-[14px] leading-relaxed text-ink-soft">Konten ini mengangkat praktik budaya lokal. Tinjau apakah sumber dapat ditelusuri, apakah izin foto ada, dan apakah klaim tidak menyeragamkan tradisi. Perbedaan praktik bukan alasan untuk menolak.</div><Field label="Sumber & atribusi"><Input defaultValue={selected.flags ? "Belum lengkap — perlu rujukan tambahan" : "Wawancara komunitas & dokumentasi sanggar"} /></Field><Field label="Catatan moderasi"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk kontributor (opsional)" /></Field><Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya memeriksa privasi, izin media, dan atribusi sumber.</span>} /></div>}
      </Modal>
    </>
  );
}

function AdminAgreements() {
  const { toast } = useApp();
  const [query, setQuery] = useState("");
  const filtered = agreements.filter((a) => `${a.number} ${a.partner} ${a.service}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="Registry" title="Manajemen perjanjian" description="Registry dokumen prototipe. Admin tidak dapat mengubah versi yang telah disepakati atau memalsukan persetujuan." actions={<Button size="sm" variant="secondary" onClick={() => toast("Registry diekspor dengan watermark prototipe.", "info", "Ekspor registry")} leading={<Download className="h-3.5 w-3.5" />}>Ekspor</Button>} />
      <AdminRestricted note="Dokumen yang telah disepakati bersifat terkunci. Admin hanya dapat membaca, menandai penugasan, dan menambahkan catatan audit — bukan mengedit isi atau tanda tangan." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Total perjanjian" value={agreements.length} helper="Prototipe" icon={<FileStack className="h-3.5 w-3.5" />} /><StatCard label="Nilai tercatat" value={formatIDR(agreements.reduce((s, a) => s + a.value, 0), true)} helper="Data ilustratif" icon={<FileSignature className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Menunggu persetujuan" value={agreements.filter((a) => a.status === "Menunggu Persetujuan").length} helper="Kedua pihak" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Sengketa" value={agreements.filter((a) => a.status === "Sengketa").length} helper="Fasilitasi aktif" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} tone="red" /></div>
      <Card className="mt-3 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nomor atau mitra" className="h-8 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[14px] outline-none sm:w-[220px]" /></div><Badge tone="neutral" className="text-[12px]">{filtered.length} dokumen</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Nomor</th><th className="px-2 py-2.5 font-bold">Para pihak</th><th className="px-2 py-2.5 font-bold">Layanan</th><th className="px-2 py-2.5 text-right font-bold">Nilai</th><th className="px-2 py-2.5 font-bold">Status</th><th className="px-4 py-2.5 font-bold">Kontrol</th></tr></thead><tbody className="divide-y divide-line/60">{filtered.map((a) => <tr key={a.id} className="text-[13px] hover:bg-cream/40"><td className="px-4 py-2.5 font-bold text-ink">{a.number}</td><td className="px-2 py-2.5 text-ink-soft">Nurul Amalia · {a.partner}</td><td className="px-2 py-2.5"><div className="max-w-[130px] truncate">{a.service}</div></td><td className="px-2 py-2.5 text-right font-semibold">{formatIDR(a.value, true)}</td><td className="px-2 py-2.5"><Badge tone={statusTone(a.status)} className="text-[12px]">{a.status}</Badge></td><td className="px-4 py-2.5"><Button size="sm" variant="secondary" onClick={() => toast("Dokumen registry dibuka dalam mode baca. Tidak ada perubahan yang diizinkan.", "info", a.number)}>Baca</Button></td></tr>)}</tbody></table></div></Card>
      <Alert tone="warn" className="mt-3" title="Kontrol penyalahgunaan">Tidak ada fitur impersonasi pihak, pengubahan tanda tangan, atau penghapusan versi. Laporan penyalahgunaan admin harus diteruskan ke supervisor.</Alert>
    </>
  );
}

function AdminComplaints() {
  const { disputes, updateDispute, toast } = useApp();
  const [selectedId, setSelectedId] = useState(disputes[0]?.id);
  const d = disputes.find((x) => x.id === selectedId) ?? disputes[0];
  const [assignOpen, setAssignOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [officer, setOfficer] = useState("Rani Saputri");
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  return (
    <>
      <PageHeader eyebrow="Trust Center" title="Pusat pengaduan" description="Antrean kasus, penugasan officer, peninjauan bukti, dan pencatatan hasil fasilitasi." actions={<Button size="sm" variant="secondary" onClick={() => toast("Panduan eskalasi dan batas peran dibuka pada prototipe.", "info", "Panduan")}>Panduan eskalasi</Button>} />
      <AdminRestricted />
      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-3 py-2.5"><h2 className="text-[15px] font-bold text-ink">Antrean kasus</h2><Badge tone="red" dot className="text-[12px]">2 perlu</Badge></div><div className="divide-y divide-line/60">{disputes.map((x) => <button key={x.id} onClick={() => setSelectedId(x.id)} className={cn("block w-full px-3 py-2.5 text-left", selectedId === x.id ? "bg-[#F7F3E9]" : "hover:bg-cream")}><div className="flex items-center justify-between gap-2"><span className="text-[12px] font-bold text-sand-deep">{x.number}</span><Badge tone={statusTone(x.status)} className="px-1 py-0.5 text-[12px]">{x.status}</Badge></div><div className="mt-1 text-[13px] font-semibold leading-snug text-ink">{x.title}</div><div className="mt-0.5 text-[12px] text-muted">{x.responder} · {x.officer}</div></button>)}</div></Card>
        <div className="space-y-3">
          <Card className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-2 border-b border-line bg-[#FBFAF6] px-4 py-3"><div><div className="flex items-center gap-1.5"><span className="text-[12px] font-bold text-sand-deep">{d.number}</span><Badge tone={statusTone(d.status)} dot className="text-[12px]">{d.status}</Badge></div><h2 className="mt-0.5 font-display text-[1.2rem] font-semibold text-ink">{d.title}</h2><div className="mt-0.5 text-[12px] text-muted">{d.opener} vs {d.responder} · dibuka {d.opened} · Officer {d.officer}</div></div><div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)} leading={<UserCog className="h-3 w-3" />}>Tugaskan</Button><Button size="sm" onClick={() => setScheduleOpen(true)} leading={<Clock className="h-3 w-3" />}>Fasilitasi</Button></div></div><div className="p-4"><div className="rounded-lg border border-line bg-[#FBFAF6] p-3"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">Masalah & usulan</div><p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{d.description}</p><p className="mt-1.5 border-l-2 border-sand pl-2 text-[13px] italic text-ink-soft">{d.proposed}</p></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-line p-2.5"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">Bukti</div><div className="mt-1 space-y-1">{d.evidence.map((f) => <div key={f.name} className="flex items-center gap-1 text-[12px]"><FileText className="h-2.5 w-2.5 text-sand-deep" /><span className="min-w-0 flex-1 truncate text-ink-soft">{f.name}</span><span className="text-muted">{f.from.split(" ")[0]}</span></div>)}</div></div><div className="rounded-lg border border-line p-2.5"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">Pasal terkait</div><div className="mt-1 flex flex-wrap gap-1">{d.clauses.map((c) => <Badge key={c} tone="outline" className="text-[12px]">{c}</Badge>)}</div><select value={officer} onChange={(e) => setOfficer(e.target.value)} aria-label="Trust Officer" className="mt-2 h-6 w-full rounded border border-line bg-white px-1.5 text-[12px] outline-none">{["Rani Saputri", "Bimo Prasetyo", "Laras Aprilia"].map((o) => <option key={o}>{o}</option>)}</select></div></div><div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" variant="secondary" onClick={() => { updateDispute(d.id, { status: "Klarifikasi" }); toast("Permintaan klarifikasi dikirim secara netral.", "success", "Klarifikasi diminta"); }}>Minta klarifikasi</Button><Button size="sm" variant="secondary" onClick={() => setResolveOpen(true)}>Catat hasil</Button><Button size="sm" variant="ghost" onClick={() => toast("Berkas kasus akan diunduh lengkap pada implementasi produksi.", "info", "Unduh kronologi")}>Ekspor kronologi</Button></div></div></Card>
          <div className="grid gap-3 md:grid-cols-2"><SectionCard title="Timeline kasus" subtitle="Kronologi tidak dapat dihapus." action={<Badge tone="outline" className="text-[12px]">Audit</Badge>}><div className="space-y-2">{d.messages.map((m, i) => <div key={i} className="flex gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDF4EF] text-[12px] text-[#2B5949]">{i + 1}</span><div><div className="text-[12px] font-semibold text-ink">{m.by} <span className="font-normal text-muted">· {m.role}</span></div><p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{m.text}</p><div className="text-[12px] text-muted">{m.date}</div></div></div>)}</div></SectionCard><SectionCard title="Kontrol akses" subtitle="Hanya officer yang ditugaskan."><div className="space-y-1.5 text-[12px]">{[["Berkas kasus", "Ditugaskan"], ["Bukti asli", "Hanya baca"], ["Identitas pihak", "Disamarkan"], ["Perubahan dokumen", "Tidak diizinkan"], ["Penghapusan bukti", "Tidak diizinkan"]].map(([l, v]) => <div key={l} className="flex justify-between"><span className="text-muted">{l}</span><span className={cn("font-semibold", v === "Tidak diizinkan" ? "text-[#933A2F]" : "text-ink")}>{v}</span></div>)}</div></SectionCard></div>
        </div>
      </div>
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Tugaskan Trust Officer" description="Hanya satu officer utama per kasus. Perubahan penugasan dicatat." size="sm" footer={<><Button size="sm" variant="secondary" onClick={() => setAssignOpen(false)}>Batal</Button><Button size="sm" onClick={() => { updateDispute(d.id, { officer }); setAssignOpen(false); toast(`Kasus ditugaskan kepada ${officer}.`, "success", "Penugasan dicatat"); }}>Tugaskan</Button></>}><Field label="Trust Officer"><Select value={officer} onChange={(e) => setOfficer(e.target.value)}>{["Rani Saputri", "Bimo Prasetyo", "Laras Aprilia"].map((o) => <option key={o}>{o}</option>)}</Select></Field><Alert tone="info" className="mt-2">Officer tidak boleh memiliki konflik kepentingan dengan salah satu pihak.</Alert></Modal>
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Jadwalkan fasilitasi" size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setScheduleOpen(false)}>Batal</Button><Button size="sm" onClick={() => { updateDispute(d.id, { status: "Fasilitasi Penyelesaian", nextAction: "Fasilitasi 18 Juli 2027 · 14.00 WITA" }); setScheduleOpen(false); toast("Jadwal fasilitasi dicatat dan diusulkan ke kedua pihak.", "success", "Fasilitasi dijadwalkan"); }}>Simpan jadwal</Button></>}><div className="grid gap-3 sm:grid-cols-2"><Field label="Tanggal"><Input type="date" defaultValue="2027-07-18" /></Field><Field label="Waktu"><Input type="time" defaultValue="14:00" /></Field></div><Field label="Agenda" className="mt-3"><Textarea placeholder="Agenda fasilitasi tanpa memihak salah satu pihak." /></Field></Modal>
      <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title="Catat hasil fasilitasi" description="Hasil harus merupakan kesepakatan para pihak, bukan putusan officer." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setResolveOpen(false)}>Batal</Button><Button size="sm" disabled={!ack || note.trim().length < 15} onClick={() => { updateDispute(d.id, { status: "Selesai dengan Kesepakatan", messages: [...d.messages, { by: "VAKSARA Trust Officer", role: "Trust Officer", date: "Hari ini", text: `Hasil fasilitasi: ${note}`, type: "note" }] }); setResolveOpen(false); toast("Hasil fasilitasi dicatat. Kasus diselesaikan dengan kesepakatan.", "success", "Kasus ditutup"); }}>Simpan hasil</Button></>}><div className="space-y-3"><Field label="Kesepakatan yang dicatat" required><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuliskan kesepakatan konkret dan tenggat yang disetujui kedua pihak." /></Field><Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya memastikan kedua pihak menyetujui hasil ini dan tidak menambahkan putusan.</span>} /></div></Modal>
    </>
  );
}

function AdminAudit() {
  const { toast } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Semua peran");
  const logs = auditLogs.filter((l) => `${l.actor} ${l.action} ${l.object} ${l.role}`.toLowerCase().includes(query.toLowerCase()) && (role === "Semua peran" || l.role === role));
  return (
    <>
      <PageHeader eyebrow="Trust Center" title="Audit trail" description="Catatan aktivitas yang tidak dapat diubah dari antarmuka. Akses dan tindakan sensitif dilacak." actions={<><Button size="sm" variant="secondary" onClick={() => toast("Ekspor audit memerlukan persetujuan supervisor.", "warn", "Dibatasi")} leading={<Download className="h-3.5 w-3.5" />}>Ekspor</Button><Button size="sm" onClick={() => toast("Semua log terbaru ditampilkan. Tidak ada log yang dihapus.", "info", "Log aktif")}>Verifikasi log</Button></>} />
      <AdminRestricted note="Log audit tidak dapat diedit atau dihapus dari antarmuka. Setiap penugasan, akses berkas, dan perubahan status mencatat aktor, waktu, objek, serta tingkat akses." />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Entri hari ini" value="84" helper="Semua peristiwa" icon={<Activity className="h-3.5 w-3.5" />} tone="blue" /><StatCard label="Akses berkas" value="31" helper="Ditugaskan" icon={<Eye className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="Perubahan status" value="12" helper="Perjanjian & kasus" icon={<FileSignature className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Anomali" value="0" helper="Tidak terdeteksi" icon={<ShieldCheck className="h-3.5 w-3.5" />} tone="green" /></div>
      <Card className="mt-3 overflow-hidden"><div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari aktor, tindakan, atau objek" className="h-8 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[14px] outline-none sm:w-[240px]" /></div><div className="flex items-center gap-1.5"><select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter peran" className="h-8 rounded-md border border-line bg-white px-2 text-[14px] outline-none">{["Semua peran", "Trust Officer", "Calon pengantin", "Vendor", "Sistem", "Admin"].map((r) => <option key={r}>{r}</option>)}</select><Badge tone="neutral" className="self-center text-[12px]">{logs.length} entri</Badge></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5 font-bold">Waktu</th><th className="px-2 py-2.5 font-bold">Aktor</th><th className="px-2 py-2.5 font-bold">Tindakan</th><th className="px-2 py-2.5 font-bold">Objek</th><th className="px-2 py-2.5 font-bold">Akses</th><th className="px-4 py-2.5 font-bold">IP</th></tr></thead><tbody className="divide-y divide-line/60">{logs.map((l) => <tr key={l.time + l.action} className="text-[13px] hover:bg-cream/40"><td className="whitespace-nowrap px-4 py-2.5 text-muted">{l.time}</td><td className="px-2 py-2.5"><div className="font-semibold text-ink">{l.actor}</div><div className="text-[12px] text-muted">{l.role}</div></td><td className="px-2 py-2.5 text-ink-soft">{l.action}</td><td className="px-2 py-2.5 font-medium text-ink">{l.object}</td><td className="px-2 py-2.5"><Badge tone={l.access === "Penugasan aktif" || l.access === "Kasus ditugaskan" ? "blue" : "neutral"} className="px-1 py-0.5 text-[12px]">{l.access}</Badge></td><td className="px-4 py-2.5 font-mono text-[12px] text-muted">{l.ip}</td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#FBFAF6] px-4 py-2.5 text-[12px] text-muted"><span>Menampilkan entri prototipe · retensi sesuai kebijakan produksi</span><span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Read-only</span></div></Card>
    </>
  );
}

function AdminAnalytics() {
  return (
    <>
      <PageHeader eyebrow="Analitik" title="Analitik ekosistem" description="Ukur kesehatan alur, bukan hanya jumlah pendaftaran. Data prototipe ilustratif." actions={<Button size="sm" variant="secondary" onClick={() => window.print()} leading={<Download className="h-3.5 w-3.5" />}>Cetak laporan</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"><StatCard label="Pengantin aktif" value="486" helper="+7,4% bulan lalu" icon={<Users className="h-3.5 w-3.5" />} tone="green" /><StatCard label="Permintaan layanan" value="328" helper="34% berlanjut ke perjanjian" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} tone="blue" /><StatCard label="Nilai perjanjian" value="Rp1,84 M" helper="Ilustrasi prototipe" icon={<FileSignature className="h-3.5 w-3.5" />} tone="sand" /><StatCard label="BAST selesai" value="81%" helper="Target 85%" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="green" progress={81} /></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SectionCard title="Perjanjian per bulan" subtitle="Dataset demonstrasi · Jan–Jun 2027" action={<Badge tone="neutral" className="text-[12px]">Jan–Jun</Badge>}>
          <div className="flex h-[150px] items-end gap-2 border-b border-line pb-1">{[[42, "Jan"], [58, "Feb"], [51, "Mar"], [76, "Apr"], [84, "Mei"], [96, "Jun"]].map(([v, m]) => <div key={m as string} className="flex flex-1 flex-col items-center gap-1"><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t bg-ink/85 transition-all hover:bg-ink" style={{ height: `${v as number}%` }} /></div><span className="text-[12px] text-muted">{m as string}</span></div>)}</div>
          <div className="mt-2 flex justify-between text-[12px] text-muted"><span>Total 407 perjanjian</span><span className="font-semibold text-ink">+22% semester</span></div>
        </SectionCard>
        <SectionCard title="Funnel perjalanan" subtitle="Dari penemuan hingga BAST.">
          <div className="space-y-2">{[["Membuka pelaku budaya", 100, "1.284"], ["Mengirim pertanyaan", 62, "796"], ["Membuat perjanjian", 34, "437"], ["BAST diterima", 18, "231"]].map(([l, w, n]) => <div key={l as string}><div className="flex justify-between text-[12px]"><span className="text-muted">{l as string}</span><span className="font-semibold text-ink">{n as string}</span></div><div className="mt-0.5 h-2 w-full rounded bg-[#EDE8DD]"><div className="h-full rounded bg-sand" style={{ width: `${w as number}%` }} /></div></div>)}</div>
        </SectionCard>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3"><SectionCard title="Kategori teratas" subtitle="Permintaan layanan"><div className="space-y-2">{[["Prosesi adat", 38], ["Katering", 22], ["Busana", 18], ["Dokumentasi", 12], ["Musik", 10]].map(([l, v]) => <div key={l as string} className="flex items-center gap-2"><span className="w-20 shrink-0 text-[12px] text-muted">{l as string}</span><div className="h-1.5 flex-1 rounded bg-[#EDE8DD]"><div className="h-full rounded bg-ink" style={{ width: `${(v as number) * 2.5}%` }} /></div><span className="w-5 text-right text-[12px] font-semibold text-ink">{v as number}%</span></div>)}</div></SectionCard><SectionCard title="Kesehatan kepercayaan"><div className="space-y-2">{[["Perjanjian dua pihak", 94], ["BAST < 7 hari", 72], ["Pengaduan terselesaikan", 64], ["Profil lengkap", 87]].map(([l, v]) => <div key={l as string}><div className="flex justify-between text-[12px]"><span className="text-muted">{l as string}</span><span className="font-semibold text-ink">{v as number}%</span></div><Progress value={v as number} tone="green" height="h-1" className="mt-0.5" /></div>)}</div></SectionCard><SectionCard title="Catatan metrik"><div className="text-[12px] leading-relaxed text-ink-soft space-y-1.5"><p>Semua angka pada halaman ini adalah data demonstrasi dan tidak mewakili transaksi nyata.</p><p>VAKSARA tidak menampilkan estimasi pengembalian dana karena platform tidak menjamin pengembalian.</p><button className="font-bold text-ink underline decoration-sand underline-offset-2">Unduh definisi metrik</button></div></SectionCard></div>
    </>
  );
}
