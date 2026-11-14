import { Alert, Badge, Button, Card, EmptyState, PageHeader, SectionCard, StatCard, statusTone } from "@/components/ui";
import { formatIDR } from "@/data";
import { useApp } from "@/store";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  Download,
  FileSignature,
  FileStack,
  Lock,
  MessageSquareWarning,
  Plus,
  ScrollText,
  Search,
  ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";

export default function TrustDashboard() {
  const { agreements, navigate, disputes, toast } = useApp();
  const [tab, setTab] = useState("Semua");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => agreements.filter((a) => {
    const inTab = tab === "Semua" ? true : tab === "Aktif" ? a.status === "Aktif" : tab === "Menunggu" ? a.status === "Menunggu Persetujuan" : tab === "BAST" ? a.status === "Menunggu BAST" : a.status === "Sengketa";
    return inTab && `${a.number} ${a.partner} ${a.service}`.toLowerCase().includes(query.toLowerCase());
  }), [agreements, tab, query]);

  const counts = {
    aktif: agreements.filter((a) => a.status === "Aktif").length,
    pending: agreements.filter((a) => a.status === "Menunggu Persetujuan").length,
    termin: agreements.reduce((s, a) => s + a.terms.filter((t) => t.status === "Jatuh tempo" || t.status === "Menunggu").length, 0),
    bast: agreements.filter((a) => a.status === "Menunggu BAST").length,
    disputes: disputes.filter((d) => d.status !== "Selesai dengan Kesepakatan" && d.status !== "Tidak Terselesaikan").length,
    value: agreements.reduce((s, a) => s + a.value, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Amanah & dokumen"
        title="VAKSARA Trust"
        description="Kelola perjanjian layanan, persetujuan kedua pihak, termin pembayaran, dan serah terima dalam satu jejak dokumen."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate("bantuan")} leading={<ScrollText className="h-3.5 w-3.5" />}>Panduan</Button>
            <Button size="sm" onClick={() => navigate("perjanjian/baru")} leading={<Plus className="h-3.5 w-3.5" />}>Buat Perjanjian</Button>
          </>
        }
      />

      <Alert tone="trust" title="Prototipe dokumen & tanda tangan" className="mb-3">
        Versi perjanjian di bawah adalah data demonstrasi. Belum ada integrasi penyedia tanda tangan elektronik bersertifikat, sehingga dokumen <strong>tidak memiliki sertifikasi hukum</strong>. VAKSARA tidak menjamin pengembalian dana.
      </Alert>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Perjanjian aktif" value={counts.aktif} helper="Berjalan sesuai lingkup" icon={<FileSignature className="h-3.5 w-3.5" />} tone="green" onClick={() => setTab("Aktif")} />
        <StatCard label="Menunggu persetujuan" value={counts.pending} helper="Perlu tanggapan pihak" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" onClick={() => setTab("Menunggu")} />
        <StatCard label="Termin pembayaran" value={counts.termin} helper="Jatuh tempo / menunggu" icon={<CreditCard className="h-3.5 w-3.5" />} tone="blue" onClick={() => navigate("planner/pembayaran")} />
        <StatCard label="Menunggu BAST" value={counts.bast} helper="Perlu keputusan pengantin" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="sand" onClick={() => navigate("bast")} />
        <StatCard className="col-span-2 sm:col-span-1" label="Pengaduan aktif" value={counts.disputes} helper="Difasilitasi Trust Officer" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} tone="red" onClick={() => navigate("sengketa")} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_278px]">
        <div className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-ink">Daftar perjanjian</h2>
                <p className="mt-0.5 text-[13px] text-muted">{filtered.length} dari {agreements.length} dokumen · nilai total {formatIDR(counts.value)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nomor, mitra, layanan" className="h-7 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[13px] outline-none focus:border-sand-deep sm:w-[190px]" />
                </div>
                <Button size="sm" variant="secondary" onClick={() => toast("Ekspor daftar perjanjian akan tersedia pada implementasi produksi.", "info", "Ekspor prototipe")} leading={<Download className="h-3 w-3" />}><span className="hidden sm:inline">Ekspor</span></Button>
              </div>
            </div>
            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-line bg-[#FBFAF6] px-3 py-2">
              {["Semua", "Aktif", "Menunggu", "BAST", "Sengketa"].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-md border px-2.5 py-1 text-[13px] font-semibold ${tab === t ? "border-ink bg-ink text-cream" : "border-line bg-white text-muted hover:border-sand"}`}>
                  {t}{t === "Semua" ? ` (${agreements.length})` : t === "Sengketa" ? ` (${agreements.filter((a) => a.status === "Sengketa").length})` : ""}
                </button>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-line bg-white text-[12px] uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-2.5 font-bold">No. perjanjian</th><th className="px-2 py-2.5 font-bold">Mitra</th><th className="px-2 py-2.5 font-bold">Layanan</th><th className="px-2 py-2.5 text-right font-bold">Nilai</th><th className="px-2 py-2.5 font-bold">Status</th><th className="px-3 py-2.5 font-bold">Tindakan berikutnya</th><th className="px-2 py-2.5" /></tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filtered.map((a) => (
                    <tr key={a.id} className="group text-[14px] transition-colors hover:bg-cream/50">
                      <td className="px-4 py-2.5"><button onClick={() => navigate(`perjanjian/${a.id}`)} className="font-bold text-ink hover:underline decoration-sand underline-offset-2">{a.number}</button><div className="text-[12px] text-muted">{a.date}</div></td>
                      <td className="px-2 py-2.5"><div className="flex items-center gap-1.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sand-light text-[12px] font-bold text-[#7A5A2E]">{a.partnerInitials}</span><span className="max-w-[110px] truncate font-medium text-ink">{a.partner}</span></div></td>
                      <td className="px-2 py-2.5"><div className="max-w-[130px] truncate text-ink-soft">{a.service}</div><div className="text-[12px] text-muted">{a.category}</div></td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold text-ink">{formatIDR(a.value)}</td>
                      <td className="px-2 py-2.5"><Badge tone={statusTone(a.status)} dot className="text-[12px]">{a.status}</Badge></td>
                      <td className="px-3 py-2.5"><span className={`inline-flex rounded px-1.5 py-0.5 text-[12px] font-semibold ${a.nextTone === "green" ? "bg-[#EDF4EF] text-[#2B5949]" : a.nextTone === "warn" ? "bg-[#FBF3E3] text-[#855A16]" : a.nextTone === "blue" ? "bg-[#EAF1F5] text-[#33607A]" : a.nextTone === "red" ? "bg-[#F9ECE9] text-[#933A2F]" : "bg-[#F1EFE9] text-muted"}`}>{a.nextAction}</span></td>
                      <td className="px-2 py-2.5"><button onClick={() => navigate(`perjanjian/${a.id}`)} className="rounded p-1 text-muted transition-colors hover:bg-ink hover:text-cream" aria-label={`Buka ${a.number}`}><ArrowUpRight className="h-3 w-3" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-line/60 md:hidden">
              {filtered.map((a) => (
                <button key={a.id} onClick={() => navigate(`perjanjian/${a.id}`)} className="block w-full px-4 py-3 text-left hover:bg-cream/40">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="text-[14px] font-bold text-ink">{a.number}</div><div className="mt-0.5 text-[13px] text-muted">{a.partner}</div></div>
                    <Badge tone={statusTone(a.status)} dot className="shrink-0 text-[12px]">{a.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <div className="text-[13px] text-ink-soft">{a.service}</div>
                    <div className="shrink-0 text-[14px] font-bold text-ink">{formatIDR(a.value, true)}</div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-sand-deep"><Clock className="h-2.5 w-2.5" />{a.nextAction}<ArrowRight className="ml-auto h-3 w-3 text-muted" /></div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && <div className="p-6"><EmptyState compact title="Tidak ada perjanjian" description="Ubah saringan atau buat perjanjian baru untuk memulai." action={<Button size="sm" onClick={() => navigate("perjanjian/baru")}>Buat Perjanjian</Button>} /></div>}
            <div className="border-t border-line bg-[#FBFAF6] px-4 py-2.5 text-[12px] text-muted">Dokumen pada prototipe tidak memiliki sertifikasi hukum. Status dan nilai bersifat ilustratif.</div>
          </Card>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SectionCard title="Kesiapan dokumen" subtitle="Langkah sebelum layanan dimulai." action={<Badge tone="sand" className="text-[12px]">4 dari 5</Badge>}>
              <div className="space-y-2">
                {[
                  ["Ruang lingkup disepakati", "Selesai"],
                  ["Para pihak terverifikasi", "Selesai"],
                  ["Termin pembayaran jelas", "Selesai"],
                  ["Persetujuan kedua pihak", "Menunggu vendor"],
                  ["Rencana serah terima (BAST)", "Siap"],
                ].map(([l, s], i) => (
                  <div key={l} className="flex items-center gap-2 text-[14px]">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[12px] ${s === "Selesai" ? "bg-[#EDF4EF] text-[#2B5949]" : s === "Siap" ? "bg-sage text-[#2B5949]" : "border border-[#F0E0C1] bg-[#FBF3E3] text-[#855A16]"}`}>{s === "Selesai" ? <CheckIcon /> : i + 1}</span>
                    <span className="flex-1 text-ink-soft">{l}</span>
                    <span className={`text-[12px] font-semibold ${s === "Menunggu vendor" ? "text-[#855A16]" : "text-muted"}`}>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-sand/40 bg-sand-light/40 p-2.5 text-[13px] leading-relaxed text-ink-soft">
                <Lock className="mr-1 inline h-2.5 w-2.5 text-sand-deep" /> Versi yang telah disetujui tidak dapat diubah diam-diam. Perubahan harus diajukan sebagai versi baru.
              </div>
            </SectionCard>

            <SectionCard title="Butuh tindakan Anda" subtitle="Hal yang paling dekat dengan tenggat." action={<Badge tone="red" dot className="text-[12px]">3 item</Badge>}>
              <div className="space-y-2">
                <button onClick={() => navigate("bast/a4")} className="flex w-full items-start gap-2 rounded-lg border border-[#F0E0C1] bg-[#FCF9F1] p-2.5 text-left hover:border-sand">
                  <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#855A16]" />
                  <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">Tinjau BAST Dapur Cita Nusantara</div><div className="mt-0.5 text-[12px] text-muted">Diajukan 3 hari lalu · 10 item</div></div>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted" />
                </button>
                <button onClick={() => navigate("perjanjian/a2")} className="flex w-full items-start gap-2 rounded-lg border border-line p-2.5 text-left hover:border-sand">
                  <FileSignature className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep" />
                  <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">Persetujuan perjanjian musik</div><div className="mt-0.5 text-[12px] text-muted">Menunggu Anugrah Sanggar Musik</div></div>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted" />
                </button>
                <button onClick={() => navigate("sengketa/d1")} className="flex w-full items-start gap-2 rounded-lg border border-[#F0D5D0] bg-[#FCF4F1] p-2.5 text-left hover:border-[#DFAFA6]">
                  <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#933A2F]" />
                  <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">Fasilitasi pengaduan dokumentasi</div><div className="mt-0.5 text-[12px] text-muted">DSP-2027-0031 · 18 Juli 2027</div></div>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted" />
                </button>
              </div>
            </SectionCard>
          </div>
        </div>

        <aside className="space-y-3">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-ink px-4 py-3 text-cream">
              <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-sand"><ShieldCheck className="h-3 w-3" /> Prinsip Trust</div>
              <p className="mt-1.5 font-display text-[15px] leading-snug">Kepercayaan dibangun dari dokumen yang bisa dibaca semua pihak.</p>
            </div>
            <div className="space-y-2.5 p-4">
              {[
                { icon: <Lock className="h-3.5 w-3.5" />, t: "Versi terkunci", d: "Dokumen yang disetujui tidak berubah tanpa versi baru." },
                { icon: <BadgeCheck className="h-3.5 w-3.5" />, t: "Persetujuan dua pihak", d: "Setiap pihak menyetujui versi yang sama." },
                { icon: <FileStack className="h-3.5 w-3.5" />, t: "Jejak dokumen", d: "Riwayat perubahan dan lampiran tersimpan." },
              ].map((x) => (
                <div key={x.t} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sage text-[#2B5949]">{x.icon}</span>
                  <div><div className="text-[14px] font-bold text-ink">{x.t}</div><div className="mt-0.5 text-[12px] leading-relaxed text-muted">{x.d}</div></div>
                </div>
              ))}
              <button onClick={() => navigate("tentang")} className="mt-1 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Baca batas layanan</button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold text-ink">Aktivitas terbaru</h3><button onClick={() => navigate("sengketa")} className="text-[12px] font-semibold text-muted underline decoration-sand underline-offset-2">Lihat</button></div>
            <div className="mt-2.5 space-y-2.5">
              {[
                { t: "BAST diajukan", d: "Dapur Cita Nusantara · 3 hari lalu", tone: "warn" },
                { t: "Klarifikasi vendor", d: "DSP-2027-0031 · kemarin", tone: "blue" },
                { t: "Versi v1.2 disetujui", d: "Sanggar Demo Batara · 12 Mei", tone: "green" },
                { t: "DP dicatat manual", d: "Rp5.550.000 · 15 Mei", tone: "neutral" },
              ].map((x) => (
                <div key={x.t} className="flex gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${x.tone === "warn" ? "bg-[#C08D3B]" : x.tone === "blue" ? "bg-[#5B87A0]" : x.tone === "green" ? "bg-[#4C8068]" : "bg-[#B9B0A0]"}`} />
                  <div><div className="text-[13px] font-semibold text-ink">{x.t}</div><div className="text-[12px] text-muted">{x.d}</div></div>
                </div>
              ))}
            </div>
          </Card>

          <Button full variant="secondary" size="sm" onClick={() => navigate("perjanjian/baru")} leading={<Plus className="h-3.5 w-3.5" />}>Buat Perjanjian Baru</Button>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-[#F4F0E6] p-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep" />
            <p className="text-[12px] leading-relaxed text-muted">Hanya Anda, pihak vendor terkait, dan Trust Officer yang ditugaskan dapat mengakses berkas kasus. Setiap akses tercatat.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m2.5 6 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
