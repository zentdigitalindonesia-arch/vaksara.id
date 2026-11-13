import { PlannerQuickNav, budgetCategoryOptions, computeBudget, usePaymentTotals } from "@/components/planner-shared";
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
  UploadBox
} from "@/components/ui";
import { formatIDR, practitioners, taskStatus, type TaskStatus } from "@/data";
import { liveText } from "@/utils/live-text";
import { useEventPlan } from "@/EventPlanContext";
import { useCooperation } from "@/CooperationContext";
import { useApp, type RundownItem } from "@/store";
import { cn } from "@/utils/cn";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileSignature,
  Gift,
  ListOrdered,
  Music2,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Store,
  Users,
  Utensils,
  Wallet
} from "lucide-react";
import { useMemo, useState } from "react";
import EventCalendar, { toIso, todayIso, useCalendarEvents } from "@/components/EventCalendar";

const budgetIcons: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-3.5 w-3.5" />,
  utensils: <Utensils className="h-3.5 w-3.5" />,
  building: <Building2 className="h-3.5 w-3.5" />,
  shirt: <Shirt className="h-3.5 w-3.5" />,
  camera: <Camera className="h-3.5 w-3.5" />,
  music: <Music2 className="h-3.5 w-3.5" />,
  gift: <Gift className="h-3.5 w-3.5" />,
  wallet: <Wallet className="h-3.5 w-3.5" />,
};

export default function PlannerSubpage({ page }: { page: "anggaran" | "vendor" | "jadwal" | "pembayaran" | "tamu" | "rundown" }) {
  const titles = {
    anggaran: ["Anggaran", "Rencanakan, catat komitmen, dan pantau sisa dana dalam Rupiah.", "planner/anggaran"],
    vendor: ["Vendor Saya", "Pelaku budaya dan vendor yang Anda pertimbangkan, pilih, dan kelola.", "planner/vendor"],
    jadwal: ["Jadwal & Checklist", "Semua tanggal penting dalam satu kalender: hari H, rangkaian acara, jadwal pelaku budaya, dan tenggat tugas. Klik tanggal untuk melihat rinciannya.", "planner/jadwal"],
    pembayaran: ["Pembayaran", "Termin layanan, bukti pembayaran, dan perbedaan antara catatan manual dan gateway.", "planner/pembayaran"],
    tamu: ["Daftar Tamu", "Kelola undangan, RSVP, dan pengelompokan meja tamu.", "planner/tamu"],
    rundown: ["Rundown", "Rangkaian acara lintas hari sesuai kesepakatan keluarga dan praktisi.", "planner/rundown"],
  }[page];
  return (
    <>
      <PageHeader eyebrow="Rencana Acara" title={titles[0]} description={titles[1]} />
      <PlannerQuickNav active={titles[2]} />
      {page === "anggaran" && <BudgetPage />}
      {page === "vendor" && <VendorPage />}
      {page === "jadwal" && <SchedulePage />}
      {page === "pembayaran" && <PaymentPage />}
      {page === "tamu" && <GuestPage />}
      {page === "rundown" && <RundownPage />}
    </>
  );
}

/* ------------------------------- BUDGET ------------------------------- */
function BudgetPage() {
  const { expenses, recordExpense, toast } = useApp();
  const { plan: budgetPlan } = useEventPlan();
  const totals = useMemo(() => computeBudget(expenses, budgetPlan.budget), [expenses, budgetPlan.budget]);
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(budgetCategoryOptions[0]);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2027-05-30");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = () => {
    const normalized = amount.replace(/\s/g, "");
    const value = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(normalized) ? Number(normalized.replace(/\./g, "")) : NaN;
    if (!label.trim()) return setError("Isi keterangan pengeluaran.");
    if (!Number.isSafeInteger(value) || value < 10000) return setError("Nominal minimal Rp10.000.");
    if (totals.planned > 0 && value > totals.remaining) return setError(`Nominal melebihi sisa anggaran ${formatIDR(totals.remaining)}. Tinjau kembali rencana Anda.`);
    recordExpense({ category, label, amount: value, date });
    setError("");
    setSaved(true);
    toast(`${label} sebesar ${formatIDR(value)} dicatat sebagai pengeluaran manual.`, "success", "Pengeluaran dicatat");
  };

  const donut = Math.min(100, totals.percent);

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Total anggaran" value={formatIDR(totals.planned)} helper="Rencana yang disepakati" icon={<Wallet className="h-3.5 w-3.5" />} />
        <StatCard label="Komitmen vendor" value={formatIDR(totals.committed)} helper={totals.planned > 0 ? `${Math.round(pct(totals.committed, totals.planned))}% dari rencana` : "Isi anggaran di rencana acara"} icon={<FileSignature className="h-3.5 w-3.5" />} tone="sand" progress={pct(totals.committed, totals.planned)} />
        <StatCard label="Sudah dibayar" value={formatIDR(totals.paid)} helper={`${expenses.length} pengeluaran tambahan`} icon={<CreditCard className="h-3.5 w-3.5" />} tone="green" progress={totals.percent} />
        <StatCard label="Sisa anggaran" value={formatIDR(totals.remaining)} helper="Belum terpakai" icon={<Sparkles className="h-3.5 w-3.5" />} tone="blue" progress={100 - totals.percent} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_270px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div><h3 className="text-[15px] font-bold text-ink">Rincian anggaran</h3><p className="mt-0.5 text-[13px] text-muted">{liveText ? "Semua nilai dalam Rupiah, dari anggaran rencana acara dan pengeluaran yang Anda catat." : "Semua nilai dalam Rupiah. Data prototipe."}</p></div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => toast("Laporan anggaran akan diunduh sebagai CSV pada implementasi produksi.", "info", "Unduhan prototipe")} leading={<Download className="h-3 w-3" />}>Ekspor</Button>
              <Button size="sm" onClick={() => { setOpen(true); setSaved(false); setError(""); }} leading={<Plus className="h-3 w-3" />}>Catat pengeluaran</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="border-b border-line bg-[#FBFAF6]">
                <tr className="text-[12px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-2 font-bold">Kategori</th>
                  <th className="px-2 py-2 text-right font-bold">Rencana</th>
                  <th className="px-2 py-2 text-right font-bold">Komitmen</th>
                  <th className="px-2 py-2 text-right font-bold">Dibayar</th>
                  <th className="px-4 py-2 font-bold">Progres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {totals.rows.map((b) => (
                  <tr key={b.category} className="text-[14px] hover:bg-cream/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F1EFE9] text-sand-deep">{budgetIcons[b.icon]}</span>
                        <div>
                          <div className="font-semibold text-ink">{b.category}</div>
                          {b.extra > 0 && <div className="text-[12px] text-[#2B5949]">+ {formatIDR(b.extra)} tambahan</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right text-ink-soft">{formatIDR(b.planned, true)}</td>
                    <td className="px-2 py-2.5 text-right text-ink-soft">{formatIDR(b.committed, true)}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-ink">{formatIDR(b.paid, true)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={pct(b.paid, b.planned)} tone={pct(b.paid, b.planned) > 90 ? "warn" : "green"} height="h-1" className="w-20" />
                        <span className="text-[12px] font-semibold text-muted">{b.planned > 0 ? `${Math.round(pct(b.paid, b.planned))}%` : "–"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line bg-[#FBFAF6]">
                <tr className="text-[14px] font-bold text-ink">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-2 py-2.5 text-right">{formatIDR(totals.planned)}</td>
                  <td className="px-2 py-2.5 text-right">{formatIDR(totals.committed)}</td>
                  <td className="px-2 py-2.5 text-right">{formatIDR(totals.paid)}</td>
                  <td className="px-4 py-2.5 text-[13px] text-muted">{totals.percent}% terpakai</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Komposisi anggaran</h3>
            <div className="mx-auto my-3 flex h-[130px] w-[130px] items-center justify-center rounded-full" style={{ background: liveText ? `conic-gradient(#16332E 0 ${donut}%, #EFEBE3 ${donut}% 100%)` : `conic-gradient(#16332E 0 25%, #C1A06E 25% 47%, #7A9688 47% 66%, #D8CBB1 66% 82%, #A9BEB1 82% 100%)` }}>
              <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[12px] text-muted">Terpakai</span>
                <span className="text-[16px] font-bold leading-tight text-ink">{donut}%</span>
                <span className="text-[12px] text-muted">{formatIDR(totals.paid, true)}</span>
              </div>
            </div>
            <div className="space-y-1">
              {[["Prosesi & adat", "#16332E"], ["Katering", "#C1A06E"], ["Venue & dekorasi", "#7A9688"], ["Busana & rias", "#D8CBB1"], ["Lainnya", "#A9BEB1"]].map(([l, c]) => (
                <div key={l} className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</span><span className="font-semibold text-ink-soft">{formatIDR(budgetCategoryOptions.includes(l) ? (liveText ? totals.rows.find((r) => r.category === l)?.paid : totals.rows.find((r) => r.category === l)?.planned) ?? 0 : 0, true)}</span></div>
              ))}
            </div>
          </Card>
          <Alert tone="warn" title="Dana belum dialokasikan">Sisa {formatIDR(totals.remaining, true)} mencakup termin yang belum jatuh tempo. Jangan gunakan seluruhnya untuk pengeluaran baru.</Alert>
          <Alert tone="info" title="Tidak ada escrow">{liveText ? "VAKSARA tidak menahan dana Anda. Catatan pembayaran adalah dokumentasi untuk keluarga dan pelaku." : "VAKSARA tidak menahan dana Anda. Semua catatan pembayaran adalah dokumentasi prototipe."}</Alert>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={saved ? "Pengeluaran berhasil dicatat" : "Catat pengeluaran"}
        description={saved ? undefined : "Catat biaya aktual agar sisa anggaran tetap akurat. Ini bukan transaksi pembayaran."}
        size="md"
        footer={saved ? <Button size="sm" onClick={() => setOpen(false)}>Selesai</Button> : <><Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" onClick={submit}>Simpan pengeluaran</Button></>}
      >
        {saved ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><CheckCircle2 className="h-6 w-6" /></span>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">Pengeluaran sebesar <strong>{formatIDR(Number(amount.replace(/[.\s]/g, "")))}</strong> tercatat pada kategori <strong>{category}</strong>. Sisa anggaran diperbarui menjadi {formatIDR(totals.remaining)}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kategori" required><Select value={category} onChange={(e) => setCategory(e.target.value)}>{budgetCategoryOptions.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
            <Field label="Keterangan" required><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Uang muka dekorasi tambahan" /></Field>
            <Field label="Nominal (Rupiah)" required hint={`Sisa ${formatIDR(totals.remaining)}`}><Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
            {error && <Alert tone="error" title="Tidak dapat menyimpan">{error}</Alert>}
            <Alert tone="info">Pengeluaran manual tidak dianggap sebagai pembayaran ke vendor. Gunakan menu Pembayaran untuk mencatat termin.</Alert>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ------------------------------- VENDORS ------------------------------- */
function VendorPage() {
  const { navigate, inquiries, agreements } = useApp();
  const vendors = practitioners.slice(0, 5);
  const statuses = ["BAST menunggu", "Perjanjian aktif", "Penawaran dikirim", "Aktif", "Dipertimbangkan"];
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Vendor terpilih" value="5" helper="Dari 5 kategori" icon={<Store className="h-3.5 w-3.5" />} />
        <StatCard label="Perjanjian aktif" value="3" helper="2 menunggu tindakan" icon={<FileSignature className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Penawaran berjalan" value="2" helper="Termasuk permintaan baru" icon={<ClipboardList className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Total nilai vendor" value={formatIDR(vendors.reduce((s, p) => s + p.priceFrom, 0) * 2, true)} helper="Perkiraan komitmen" icon={<Wallet className="h-3.5 w-3.5" />} tone="blue" />
      </div>

      <SectionCard className="mt-3" title="Pertanyaan & permintaan saya" subtitle="Balasan pelaku budaya akan muncul di sini dan melalui notifikasi." action={<Badge tone="neutral" className="text-[12px]">{inquiries.length} permintaan</Badge>}>
        {inquiries.length === 0 ? (
          <EmptyState compact icon={<Send className="h-4 w-4" />} title="Belum ada permintaan terkirim" description="Mulai dari direktori. Simpan profil, kirim pertanyaan, atau minta penawaran — tanpa kewajiban memesan." action={<Button size="sm" onClick={() => navigate("jelajahi")}>Jelajahi pelaku budaya</Button>} />
        ) : (
          <div className="space-y-2">
            {inquiries.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-3">
                <Avatar name={i.practitioner} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink">{i.practitioner}</div>
                  <div className="truncate text-[13px] text-muted">{i.packageName} · acara {new Date(i.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <Badge tone="green" dot className="text-[12px]">{i.status}</Badge>
                <Button size="sm" variant="secondary" onClick={() => navigate(`praktisi/${i.practitionerId}`)}>Buka</Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="mt-3 flex items-end justify-between">
        <div><h2 className="text-[16px] font-bold text-ink">Vendor dalam rencana</h2><p className="mt-0.5 text-[14px] text-muted">Status mengikuti perjanjian dan permintaan terbaru.</p></div>
        <Button size="sm" variant="secondary" onClick={() => navigate("jelajahi")} trailing={<ArrowRight className="h-3 w-3" />}>Cari vendor lagi</Button>
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {vendors.map((p, i) => (
          <Card key={p.id} className="overflow-hidden" hover>
            <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
              <img src={p.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold text-ink">{p.name}</div><div className="truncate text-[12px] text-muted">{p.category} · {p.city}</div></div>
              <Badge tone={i === 0 ? "amber" : i === 1 ? "green" : i === 2 ? "blue" : "neutral"} className="shrink-0 text-[11px]">{statuses[i]}</Badge>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between text-[13px]"><span className="text-muted">Nilai layanan</span><span className="font-bold text-ink">{formatIDR(p.priceFrom * (i + 1), true)}</span></div>
              <div className="mt-1 flex items-center justify-between text-[13px]"><span className="text-muted">Pembayaran</span><span className="font-semibold text-ink">{i === 0 ? "DP & termin 2 lunas" : i === 1 ? "DP tercatat manual" : "Belum ada"}</span></div>
              <div className="mt-2 flex items-center gap-1 text-[12px]"><ShieldCheck className="h-3 w-3 text-sand-deep" /> {i < 3 ? "Perjanjian tercatat" : "Pertimbangkan sebelum memesan"}</div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => navigate(`praktisi/${p.id}`)}>Profil</Button>
                <Button size="sm" onClick={() => navigate(i === 0 ? "pengiriman/a1" : i === 1 ? "perjanjian/a1" : "trust")}>{i === 0 ? "Lacak layanan" : i === 1 ? "Lihat perjanjian" : "Kelola"}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Alert tone="trust" className="mt-3" title="Perjanjian dan kontrak vendor lain">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px]">Anda memiliki {agreements.length} perjanjian yang tercatat, termasuk 2 dokumen yang perlu tindakan.</p>
          <Button size="sm" variant="secondary" onClick={() => navigate("trust")}>Buka VAKSARA Trust</Button>
        </div>
      </Alert>
    </>
  );
}

/* ------------------------------- SCHEDULE ------------------------------- */

function SchedulePage() {
  const { checklist, toggleChecklist, setChecklistStatus, addChecklist, toast } = useApp();
  const calendarEvents = useCalendarEvents();
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [taskCat, setTaskCat] = useState("Perencanaan");
  const [taskDue, setTaskDue] = useState("2027-05-30");
  const [taskPriority, setTaskPriority] = useState("Sedang");
  const [taskStatusNew, setTaskStatusNew] = useState<TaskStatus>("todo");
  const [titleError, setTitleError] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);

  const all = checklist;
  const doneCount = all.filter((t) => t.done).length;

  const addTask = () => {
    if (!title.trim()) { setTitleError("Isi nama tugas terlebih dahulu."); return; }
    addChecklist({ title: title.trim(), category: taskCat, due: new Date(taskDue + "T12:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }), priority: taskPriority, status: taskStatusNew });
    setNewOpen(false);
    setTitle(""); setTitleError("");
    toast("Tugas ditambahkan ke papan.", "success", "Tugas baru");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Checklist selesai" value={`${doneCount}/${all.length}`} helper={`${all.length ? Math.round((doneCount / all.length) * 100) : 0}% persiapan`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" progress={all.length ? (doneCount / all.length) * 100 : 0} />
        <StatCard label="Tugas terbuka" value={all.length - doneCount} helper={`${all.filter((t) => !t.done && t.priority === "Tinggi").length} prioritas tinggi`} icon={<ClipboardList className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Jadwal pelaku budaya" value={calendarEvents.filter((e) => e.kind === "layanan").length} helper="Dari penawaran & perjanjian" icon={<CalendarDays className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Rangkaian acara" value={calendarEvents.filter((e) => e.kind === "acara").length} helper="Kegiatan di rundown" icon={<Bell className="h-3.5 w-3.5" />} />
      </div>

      <div className="mt-3"><EventCalendar events={calendarEvents} /></div>

      <section aria-label="Papan tugas" className="mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="font-display text-2xl text-ink">Papan tugas persiapan</h2><p className="mt-1 text-[14px] text-muted">Seret kartu ke kolom lain, atau pakai tombol panah. Perubahan tersimpan di browser ini.</p></div>
          <Button onClick={() => setNewOpen(true)} leading={<Plus className="h-4 w-4" />}>Tambah tugas</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {([["todo", "Belum mulai", "bg-[#F4F1EA]"], ["doing", "Sedang dikerjakan", "bg-[#FBF3E1]"], ["done", "Selesai", "bg-[#EAF4EE]"]] as [TaskStatus, string, string][]).map(([col, label, tint], ci, cols) => {
            const items = all.filter((t) => taskStatus(t) === col).sort((x, y) => (toIso(x.due) || "9").localeCompare(toIso(y.due) || "9"));
            return <div key={col} data-column={col} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragging) setChecklistStatus(dragging, col); setDragging(null); }} className={cn("min-w-0 rounded-[20px] p-3", tint, dragging && "outline-2 outline-dashed outline-sand")}>
              <div className="mb-2 flex items-center justify-between px-1"><h3 className="text-[15px] font-bold text-ink">{label}</h3><span className="rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-ink-soft">{items.length}</span></div>
              <ul className="space-y-2">
                {items.length === 0 && <li className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[13px] text-muted">Belum ada tugas</li>}
                {items.map((task) => (
                  <li key={task.id} draggable onDragStart={() => setDragging(task.id)} onDragEnd={() => setDragging(null)} className="cursor-grab rounded-xl border border-line/80 bg-white p-3 shadow-[0_1px_2px_rgba(18,58,51,.05)] active:cursor-grabbing">
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleChecklist(task.id)} className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border", task.done ? "border-[#2F7A53] bg-[#2F7A53] text-white" : "border-[#CFC7B7] bg-white")} aria-label={task.done ? `Tandai ${task.title} belum selesai` : `Tandai ${task.title} selesai`}>{task.done && <Check className="h-3 w-3" strokeWidth={3} />}</button>
                      <p className={cn("min-w-0 flex-1 text-[14px] font-semibold leading-snug", task.done ? "text-muted line-through" : "text-ink")}>{task.title}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[26px]">
                      <Badge tone={task.priority === "Tinggi" ? "red" : task.priority === "Sedang" ? "amber" : "neutral"} className="px-2 py-0.5 text-[11px]">{task.priority}</Badge>
                      <span className="text-[12px] text-muted">{task.category} · {task.due}</span>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      {ci > 0 && <button onClick={() => setChecklistStatus(task.id, cols[ci - 1][0])} className="rounded-full px-2 py-1 text-[12px] font-semibold text-muted hover:bg-cream hover:text-ink" aria-label={`Pindahkan ${task.title} ke ${cols[ci - 1][1]}`}>← {cols[ci - 1][1]}</button>}
                      {ci < 2 && <button onClick={() => setChecklistStatus(task.id, cols[ci + 1][0])} className="rounded-full px-2 py-1 text-[12px] font-semibold text-ink hover:bg-cream" aria-label={`Pindahkan ${task.title} ke ${cols[ci + 1][1]}`}>{cols[ci + 1][1]} →</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>;
          })}
        </div>
      </section>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Tambah tugas" description="Tugas baru langsung muncul di papan dan kalender." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setNewOpen(false)}>Batal</Button><Button size="sm" onClick={addTask}>Tambahkan</Button></>}>
        <div className="space-y-3">
          <Field label="Nama tugas" required error={titleError || undefined}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Konfirmasi jumlah kursi tambahan" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kategori"><Select value={taskCat} onChange={(e) => setTaskCat(e.target.value)}>{["Perencanaan", "Anggaran", "Venue", "Pelaku Budaya", "Katering", "Prosesi", "Tamu", "Dokumentasi", "Logistik"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Tenggat"><Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></Field>
          </div>
          <div><p className="mb-1.5 text-[14px] font-semibold text-ink">Prioritas</p><div className="flex gap-2" role="radiogroup" aria-label="Prioritas">{["Tinggi", "Sedang", "Rendah"].map((p) => <button key={p} type="button" role="radio" aria-checked={taskPriority === p} onClick={() => setTaskPriority(p)} className={cn("flex-1 rounded-full border px-3 py-2 text-[14px] font-semibold", taskPriority === p ? (p === "Tinggi" ? "border-[#B45245] bg-[#F9ECE9] text-[#933A2F]" : p === "Sedang" ? "border-[#C08D3B] bg-[#FBF1DE] text-[#855A16]" : "border-ink bg-cream text-ink") : "border-line bg-white text-muted")}>{p}</button>)}</div></div>
          <Field label="Mulai di kolom"><Select value={taskStatusNew} onChange={(e) => setTaskStatusNew(e.target.value as TaskStatus)}><option value="todo">Belum mulai</option><option value="doing">Sedang dikerjakan</option><option value="done">Selesai</option></Select></Field>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------- PAYMENTS ------------------------------- */
function PaymentPage() {
  const { addPayment, toast, navigate } = useApp();
  const { list, paid, gateway, manual, due } = usePaymentTotals();
  const [tab, setTab] = useState<"semua" | "gateway" | "manual" | "menunggu">("semua");
  const [detail, setDetail] = useState<(typeof list)[0] | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amount, setAmount] = useState("5550000");
  const [ack, setAck] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const filtered = list.filter((p) => (tab === "semua" ? true : tab === "gateway" ? p.kind === "gateway" : tab === "manual" ? p.kind === "manual" : p.status === "Jatuh tempo" || p.status === "Menunggu BAST"));

  const save = () => {
    if (!ack) return;
    const normalized = amount.replace(/\s/g, "");
    const value = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(normalized) ? Number(normalized.replace(/\./g, "")) : NaN;
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1000000000) {
      toast("Isi nominal rupiah bulat antara Rp1 dan Rp1 miliar.", "error");
      return;
    }
    addPayment({ id: `py-${Date.now()}`, date: "Hari ini", vendor: "Anugrah Sanggar Musik", agreement: "VKS-PJK-2027-0191", label: "Termin 1 — DP 30%", amount: value, method: "Transfer bank", kind: "manual", status: "Tercatat manual" });
    setRecordOpen(false);
    setConfirmOpen(false);
    setAck(false);
    setFiles([]);
    toast("Pembayaran manual dicatat. Status akan ditinjau terhadap bukti transfer.", "success", "Pembayaran dicatat manual");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Total tercatat" value={formatIDR(paid, true)} helper={`${list.length} transaksi`} icon={<CreditCard className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Gateway terverifikasi" value={formatIDR(gateway, true)} helper="Xendit · simulasi prototipe" icon={<ShieldCheck className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Transfer manual" value={formatIDR(manual, true)} helper="Belum diverifikasi gateway" icon={<Pencil className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Perlu dibayar" value={formatIDR(due, true)} helper="2 termin dalam waktu dekat" icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="red" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Alert tone="trust" title="Perbedaan status pembayaran">
          <span><strong>Gateway terverifikasi</strong> hanya muncul jika penyedia pembayaran mengonfirmasi transaksi. <strong>Transfer manual</strong> dicatat berdasarkan bukti yang diunggah dan tidak melalui verifikasi gateway.</span>
        </Alert>
        <Alert tone="warn" title="Bukan escrow">Dana tidak ditahan VAKSARA. Prototipe ini tidak memproses pembayaran dan tidak menjamin pengembalian dana.</Alert>
      </div>

      <Card className="mt-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex overflow-x-auto rounded-lg border border-line bg-[#F2EFE6] p-0.5">
            {([["semua", "Semua"], ["gateway", "Gateway"], ["manual", "Manual"], ["menunggu", "Menunggu"]] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cn("shrink-0 rounded-md px-2.5 py-1.5 text-[14px] font-semibold", tab === id ? "bg-white text-ink shadow-sm" : "text-muted")}>{label}</button>)}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => toast("Rekap pembayaran akan diunduh pada implementasi produksi.", "info", "Ekspor prototipe")} leading={<Download className="h-3 w-3" />}>Ekspor</Button>
            <Button size="sm" onClick={() => setRecordOpen(true)} leading={<Plus className="h-3 w-3" />}>Catat pembayaran</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-2 font-bold">Tanggal</th><th className="px-2 py-2 font-bold">Vendor / perjanjian</th><th className="px-2 py-2 font-bold">Termin</th><th className="px-2 py-2 text-right font-bold">Nominal</th><th className="px-2 py-2 font-bold">Metode</th><th className="px-4 py-2 font-bold">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((p) => (
                <tr key={p.id} className="text-[14px] hover:bg-cream/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{p.date}</td>
                  <td className="px-2 py-2.5"><div className="font-semibold text-ink">{p.vendor}</div><div className="text-[12px] text-muted">{p.agreement}</div></td>
                  <td className="px-2 py-2.5 text-ink-soft">{p.label}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right font-bold text-ink">{formatIDR(p.amount)}</td>
                  <td className="px-2 py-2.5"><span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-semibold", p.kind === "gateway" ? "bg-[#EAF1F5] text-[#33607A]" : "bg-[#F1EFE9] text-ink-soft")}>{p.kind === "gateway" ? <ShieldCheck className="h-2.5 w-2.5" /> : <Pencil className="h-2.5 w-2.5" />}{p.method}</span></td>
                  <td className="px-4 py-2.5"><button onClick={() => setDetail(p)}><Badge tone={p.status === "Terverifikasi" ? "green" : p.status === "Tercatat manual" ? "blue" : p.status === "Jatuh tempo" ? "red" : "amber"} dot className="text-[12px]">{p.status}</Badge></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-[#FBFAF6] px-4 py-2.5 text-[13px] text-muted">Semua nominal dalam Rupiah. Klik status untuk melihat rincian bukti.</div>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">
        <Card className="p-4">
          <h3 className="text-[15px] font-bold text-ink">Termin mendatang</h3>
          <div className="mt-2 space-y-2">
            {list.filter((p) => p.status === "Jatuh tempo" || p.status === "Menunggu BAST" || p.status === "Menunggu").slice(0, 3).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FCF6E9] text-[#855A16]"><Clock className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">{p.label} · {p.vendor}</div><div className="text-[12px] text-muted">{p.agreement} · {p.date}</div></div>
                <div className="text-right"><div className="text-[14px] font-bold text-ink">{formatIDR(p.amount)}</div><div className="text-[12px] text-muted">{p.status}</div></div>
                <Button size="sm" variant="secondary" onClick={() => navigate("perjanjian/a1")}>Tinjau</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-sand"><ShieldCheck className="h-3.5 w-3.5" /></span><h3 className="text-[15px] font-bold text-ink">Pembayaran gateway</h3></div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">Checkout Xendit akan di-host pada implementasi produksi. VAKSARA tidak akan menyimpan data kartu atau menahan dana.</p>
          <div className="mt-2 rounded-lg border border-dashed border-[#CFC6B4] bg-[#FBFAF6] px-2.5 py-2 text-[13px] text-muted">Integrasi belum aktif · prototipe</div>
          <Button size="sm" variant="secondary" full className="mt-2" disabled>Bayar via Xendit (segera)</Button>
        </Card>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Rincian pembayaran" description={detail ? `${detail.agreement} · ${detail.vendor}` : ""} size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setDetail(null)}>Tutup</Button><Button size="sm" onClick={() => { setDetail(null); navigate("perjanjian/a1"); }}>Lihat perjanjian</Button></>}>
        {detail && (
          <div className="space-y-3">
            <div className="rounded-xl bg-ink p-4 text-cream">
              <div className="text-[13px] text-cream/50">Nominal</div><div className="mt-1 font-display text-[1.7rem] font-semibold leading-none">{formatIDR(detail.amount)}</div>
              <div className="mt-2 flex items-center justify-between"><span className="text-[13px] text-cream/60">{detail.label}</span><Badge tone={detail.kind === "gateway" ? "blue" : "neutral"} className="text-[12px]">{detail.kind === "gateway" ? "Gateway" : "Manual"}</Badge></div>
            </div>
            {[["Tanggal", detail.date], ["Metode", detail.method], ["Status", detail.status], ["Dicatat oleh", detail.kind === "gateway" ? "Sistem (prototipe)" : "Nurul Amalia"], ["Bukti", detail.kind === "gateway" ? "Konfirmasi penyedia pembayaran" : "Bukti-transfer.jpg (tidak aktif)"]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between border-b border-line/70 pb-1.5 text-[14px]"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>
            ))}
            <Alert tone={detail.kind === "gateway" ? "success" : "info"} title={detail.kind === "gateway" ? "Terverifikasi gateway" : "Tercatat manual"}>{detail.kind === "gateway" ? "Status demonstrasi berasal dari konfirmasi gateway simulasi. Tidak ada transaksi nyata." : "Pembayaran manual tidak diverifikasi oleh penyedia gateway. Simpan bukti dan cocokkan dengan rekening tujuan."}</Alert>
          </div>
        )}
      </Modal>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Catat pembayaran manual" description="Gunakan formulir ini hanya untuk transfer yang sudah Anda lakukan di luar VAKSARA." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setRecordOpen(false)}>Batal</Button><Button size="sm" disabled={!ack} onClick={() => setConfirmOpen(true)}>Lanjutkan</Button></>}>
        <div className="space-y-3">
          <Field label="Perjanjian"><Select><option>VKS-PJK-2027-0191 — Anugrah Sanggar Musik</option><option>VKS-PJK-2027-0184 — Sanggar Demo Batara</option></Select></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nominal (Rupiah)" required><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" /></Field>
            <Field label="Tanggal transfer"><Input type="date" defaultValue="2027-06-20" /></Field>
          </div>
          <Field label="Catatan"><Textarea placeholder="Contoh: Transfer termin 1 dari rekening Nurul Amalia" className="min-h-[70px]" /></Field>
          <UploadBox title="Unggah bukti transfer" hint="JPG, PNG, atau PDF · prototipe tidak menyimpan berkas" files={files} onAdd={() => { setFiles([{ name: "Bukti-transfer.jpg", size: "248 KB" }]); toast("Berkas contoh dilampirkan pada prototipe.", "info"); }} onRemove={() => setFiles([])} />
          <label className="flex items-start gap-2 rounded-lg border border-[#F0E0C1] bg-[#FCF6E9] p-2.5 text-[14px] leading-relaxed text-[#79551A]">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 accent-[#16332E]" />
            Saya memahami pembayaran ini dicatat manual, tidak diverifikasi gateway, dan tidak ditahan VAKSARA.
          </label>
        </div>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Konfirmasi pencatatan pembayaran" description="Tindakan akan tercatat pada audit aktivitas prototipe." size="sm" footer={<><Button size="sm" variant="secondary" onClick={() => setConfirmOpen(false)}>Periksa lagi</Button><Button size="sm" onClick={save}>Ya, catat manual</Button></>}>
        <div className="rounded-xl border border-line bg-[#FBFAF6] p-3 text-[14px]">
          <div className="flex items-center justify-between"><span className="text-muted">Nominal</span><span className="font-bold text-ink">{formatIDR(Number(amount.replace(/[.\s]/g, "")))}</span></div>
          <div className="mt-1.5 flex items-center justify-between"><span className="text-muted">Status baru</span><Badge tone="blue">Tercatat manual</Badge></div>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">Pastikan bukti transfer sesuai. Anda bertanggung jawab atas keakuratan catatan manual.</p>
      </Modal>
    </>
  );
}

/* ------------------------------- GUESTS ------------------------------- */
function GuestPage() {
  const { guests, addGuest, toast } = useApp();
  const [tab, setTab] = useState<"semua" | "Hadir" | "Menunggu" | "Tidak hadir">("semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Keluarga");
  const [party, setParty] = useState("2");
  const [rsvp, setRsvp] = useState("Menunggu");
  const [table, setTable] = useState("—");
  const [invitation, setInvitation] = useState("Belum dikirim");

  // Akun nyata: tanpa angka dasar contoh; semua dihitung dari daftar tamu.
  const base = liveText ? { total: 0, hadir: 0, menunggu: 0, tidak: 0 } : { total: 140, hadir: 85, menunggu: 9, tidak: 12 };
  const total = base.total + guests.reduce((s, g) => s + g.party, 0);
  const hadir = guests.filter((g) => g.rsvp === "Hadir").reduce((s, g) => s + g.party, 0) + base.hadir;
  const menunggu = guests.filter((g) => g.rsvp === "Menunggu").reduce((s, g) => s + g.party, 0) + base.menunggu;
  const tidakHadir = guests.filter((g) => g.rsvp === "Tidak hadir").reduce((s, g) => s + g.party, 0) + base.tidak;
  const filtered = guests.filter((g) => (tab === "semua" ? true : g.rsvp === tab) && `${g.name} ${g.group} ${g.table}`.toLowerCase().includes(query.toLowerCase()));

  const submit = () => {
    if (!name.trim()) return;
    addGuest({ name, group, party: Number(party) || 1, rsvp, table, invitation });
    setOpen(false);
    setName("");
    toast(liveText ? `${name} ditambahkan ke daftar tamu.` : `${name} ditambahkan ke daftar tamu (prototipe).`, "success", "Tamu baru");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Total undangan" value={total} helper={`${guests.length} entri ditampilkan`} icon={<Users className="h-3.5 w-3.5" />} />
        <StatCard label="Diprediksi hadir" value={hadir} helper={`${Math.round((total ? hadir / total : 0) * 100)}% dari undangan`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" progress={Math.round((total ? hadir / total : 0) * 100)} />
        <StatCard label="Menunggu RSVP" value={menunggu} helper="Kirim pengingat 7 hari lagi" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Kapasitas venue" value="300" helper={`${300 - hadir} kursi tersisa`} icon={<Building2 className="h-3.5 w-3.5" />} tone="blue" progress={Math.round((hadir / 300) * 100)} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div><h3 className="text-[15px] font-bold text-ink">Daftar tamu</h3><p className="mt-0.5 text-[13px] text-muted">{liveText ? "RSVP dan undangan tersimpan di akun Anda." : "RSVP dan undangan tersimpan pada sesi prototipe."}</p></div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => toast("Tautan undangan akan dibuat pada implementasi produksi.", "info", "Undangan prototipe")} leading={<Send className="h-3 w-3" />}>Kirim</Button>
              <Button size="sm" onClick={() => setOpen(true)} leading={<Plus className="h-3 w-3" />}>Tambah tamu</Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex overflow-x-auto rounded-lg border border-line bg-[#F2EFE6] p-0.5">
              {(["semua", "Hadir", "Menunggu", "Tidak hadir"] as const).map((f) => <button key={f} onClick={() => setTab(f)} className={cn("shrink-0 rounded-md px-2.5 py-1 text-[13px] font-semibold", tab === f ? "bg-white text-ink shadow-sm" : "text-muted")}>{f}</button>)}
            </div>
            <div className="relative"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau meja" className="h-7 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[13px] outline-none sm:w-[170px]" /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="border-b border-line bg-[#FBFAF6] text-[12px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-2 font-bold">Tamu</th><th className="px-2 py-2 font-bold">Kelompok</th><th className="px-2 py-2 text-center font-bold">Jumlah</th><th className="px-2 py-2 font-bold">RSVP</th><th className="px-2 py-2 font-bold">Meja</th><th className="px-4 py-2 font-bold">Undangan</th></tr></thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((g) => (
                  <tr key={g.name} className="text-[14px] hover:bg-cream/40">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar name={g.name} size="xs" /><span className="font-semibold text-ink">{g.name}</span></div></td>
                    <td className="px-2 py-2.5 text-ink-soft">{g.group}</td>
                    <td className="px-2 py-2.5 text-center font-semibold">{g.party}</td>
                    <td className="px-2 py-2.5"><Badge tone={g.rsvp === "Hadir" ? "green" : g.rsvp === "Menunggu" ? "amber" : "red"} className="text-[11px]">{g.rsvp}</Badge></td>
                    <td className="px-2 py-2.5 text-muted">{g.table}</td>
                    <td className="px-4 py-2.5"><span className="text-[12px] text-muted">{g.invitation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-6"><EmptyState compact title="Tidak ada tamu pada filter ini" description="Coba saringan lain atau tambahkan tamu baru." /></div>}
          </div>
          <div className="border-t border-line px-4 py-2 text-[12px] text-muted">Menampilkan {filtered.length} dari {guests.length} {liveText ? "tamu" : "entri prototipe"}.</div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Ringkasan RSVP</h3>
            <div className="relative mx-auto my-3 flex h-[112px] w-[112px] items-center justify-center rounded-full" style={{ background: `conic-gradient(#4C8068 0 ${Math.round((total ? hadir / total : 0) * 100)}%, #C08D3B ${Math.round((total ? hadir / total : 0) * 100)}% ${Math.round((total ? (hadir + menunggu) / total : 0) * 100)}%, #E7E1D5 ${Math.round((total ? (hadir + menunggu) / total : 0) * 100)}% 100%)` }}>
              <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full bg-white"><span className="text-[16px] font-bold text-ink">{total}</span><span className="text-[12px] text-muted">undangan</span></div>
            </div>
            {[["Hadir", hadir, "bg-[#4C8068]"], ["Menunggu", menunggu, "bg-[#C08D3B]"], ["Tidak hadir", tidakHadir, "bg-[#E7E1D5]"]].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center justify-between py-0.5 text-[13px]"><span className="flex items-center gap-1.5 text-muted"><span className={cn("h-1.5 w-1.5 rounded-full", c as string)} />{l as string}</span><span className="font-semibold text-ink">{v as number}</span></div>
            ))}
          </Card>
          <Alert tone="info" title="Privasi tamu">Nomor telepon dan alamat tidak ditampilkan pada tabel ini. Undangan hanya dibagikan kepada tamu terkait.</Alert>
          <Card className="p-4">
            <h3 className="text-[14px] font-bold text-ink">Meja & kapasitas</h3>
            <div className="mt-2 space-y-2">
              {(liveText ? Object.entries(guests.reduce<Record<string, number>>((m, g) => { const t = g.table?.trim(); if (t) m[t] = (m[t] ?? 0) + g.party; return m; }, {})).map(([t, n]) => [`Meja ${t}`, n, Math.max(n, 10)]) : [["Meja A", 24, 30], ["Meja B", 18, 20], ["Meja C", 16, 20]]).map(([l, v, cap]) => <div key={l as string}><div className="flex justify-between text-[13px]"><span className="text-muted">{l as string}</span><span className="font-semibold text-ink">{v as number}/{cap as number}</span></div><Progress value={((v as number) / (cap as number)) * 100} tone="sand" height="h-1" className="mt-1" /></div>)}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah tamu" description={liveText ? "Data tamu hanya digunakan untuk perencanaan." : "Data tamu hanya digunakan untuk perencanaan pada prototipe ini."} size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button size="sm" onClick={submit}>Simpan tamu</Button></>}>
        <div className="space-y-3">
          <Field label="Nama tamu / keluarga" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Keluarga Andi Baso" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kelompok"><Select value={group} onChange={(e) => setGroup(e.target.value)}>{["Keluarga", "Sahabat", "Rekan Kerja", "Kampus", "Tetangga"].map((g) => <option key={g}>{g}</option>)}</Select></Field>
            <Field label="Jumlah orang"><Input type="number" value={party} onChange={(e) => setParty(e.target.value)} min={1} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status RSVP"><Select value={rsvp} onChange={(e) => setRsvp(e.target.value)}><option>Menunggu</option><option>Hadir</option><option>Tidak hadir</option></Select></Field>
            <Field label="Meja"><Select value={table} onChange={(e) => setTable(e.target.value)}>{["—", "A1", "A2", "B1", "B2", "C1", "C2"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          </div>
          <Field label="Status undangan"><Select value={invitation} onChange={(e) => setInvitation(e.target.value)}><option>Belum dikirim</option><option>Terkirim</option><option>Dibuka</option></Select></Field>
        </div>
      </Modal >
    </>
  );
}

/* ------------------------------- RUNDOWN ------------------------------- */
function RundownPage() {
  const { toast, navigate, rundownItems: items, setRundownItems: setItems } = useApp();
  const { plan } = useEventPlan();
  const { flow } = useCooperation();
  const [eventDate, setEventDate] = useState(liveText ? plan.date || todayIso() : "2027-06-12");
  const [eventLocation, setEventLocation] = useState(liveText ? plan.location : "Lokasi hari utama (demo)");
  const [dayFilter, setDayFilter] = useState("semua");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const dates = [...new Set(items.map((item) => item.date))].sort();
  const visibleDates = dates.filter((date) => dayFilter === "semua" || date === dayFilter);
  const dateLabel = (date: string) => new Date(date + "T12:00:00+08:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Makassar" });
  const openNew = () => {
    setEditingId(null); setTitle(""); setTime("16.00");
    setEventDate(dayFilter === "semua" ? dates[0] ?? (plan.date || (liveText ? todayIso() : "2027-06-12")) : dayFilter);
    setEventLocation(""); setFormError(""); setAddOpen(true);
  };
  const edit = (item: RundownItem) => {
    setEditingId(item.id); setTitle(item.title); setTime(item.time);
    setEventDate(item.date); setEventLocation(item.location); setOwner(item.owner);
    setType(item.type); setFormError(""); setAddOpen(true);
  };
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [time, setTime] = useState("16.00");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Koordinator keluarga");
  const [type, setType] = useState("Prosesi");
  const [vendors] = useState(() => liveText ? [...new Set(flow.cases.filter(c => !["cancelled", "declined", "draft"].includes(c.phase)).map(c => c.vendor))] : ["Sanggar Demo Batara", "Dapur Cita Nusantara", "Lensa Pesisir Studio"]);
  const [shareWith, setShareWith] = useState<string[]>(vendors);

  const add = () => {
    if (!title.trim() || !eventDate || !eventLocation.trim() || !/^([01]\d|2[0-3])\.[0-5]\d$/.test(time)) {
      setFormError("Isi tanggal, waktu, nama mata acara, dan lokasi dengan lengkap.");
      return;
    }
    const date = new Date(eventDate + "T12:00:00+08:00");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(date.getTime()) || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) !== eventDate) {
      setFormError("Tanggal acara tidak valid."); return;
    }
    const item = { id: editingId ?? crypto.randomUUID(), date: eventDate, location: eventLocation.trim(), time, title: title.trim(), owner, type };
    setItems((prev) => (editingId ? prev.map((old) => old.id === editingId ? item : old) : [...prev, item]));
    setDayFilter("semua"); setAddOpen(false); setTitle("");
    toast(liveText ? "Mata acara tersimpan di rundown akun Anda." : "Mata acara disimpan sesuai tanggal dan waktu pada sesi demo ini.", "success", "Rundown diperbarui");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Hari kegiatan" value={dates.length} helper="Rangkaian dapat berbeda hari" icon={<CalendarDays className="h-3.5 w-3.5" />} />
        <StatCard label="Mata acara" value={items.length} helper="Seluruh rangkaian acara" icon={<ListOrdered className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Hari ditampilkan" value={visibleDates.length} helper="Jam kegiatan dalam WITA" icon={<Clock className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Vendor terhubung" value={shareWith.length} helper="Akan menerima pembaruan" icon={<Share2 className="h-3.5 w-3.5" />} tone="green" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div><h3 className="text-[15px] font-bold text-ink">Rundown rangkaian acara</h3><p className="mt-0.5 text-[13px] text-muted">Tanggal dan lokasi mengikuti masing-masing kegiatan · WITA</p></div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => toast("Dokumen rundown akan diunduh pada implementasi produksi.", "info", "Unduh prototipe")} leading={<Download className="h-3 w-3" />}>Unduh</Button>
              <Button size="sm" variant="secondary" onClick={() => setShareOpen(true)} leading={<Send className="h-3 w-3" />}>Bagikan</Button>
              <Button size="sm" onClick={openNew} leading={<Plus className="h-3 w-3" />}>Tambah</Button>
            </div>
          </div>
          <div className="border-b border-line p-4">
            <Field label="Tampilkan hari"><Select aria-label="Filter hari rundown" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}><option value="semua">Semua hari</option>{dates.map((date) => <option key={date} value={date}>{dateLabel(date)}</option>)}</Select></Field>
            <p className="mt-2 text-[14px] text-muted">{liveText ? (items.length ? "Rangkaian disepakati bersama keluarga dan praktisi; setiap hari dapat memiliki lokasi berbeda." : "Belum ada mata acara. Klik Tambah untuk menyusun rangkaian acara pertama, misalnya mappacci atau akad nikah.") : "Contoh demo, bukan urutan adat baku. Rangkaian disepakati bersama keluarga dan praktisi; setiap hari dapat memiliki lokasi berbeda."}</p>
          </div>
          {visibleDates.map((date) => (
            <section key={date} data-rundown-day={date}>
              <h4 className="border-y border-line bg-sand-light px-4 py-3 text-[15px] font-bold text-ink">{dateLabel(date)}</h4>
              {items.filter((item) => item.date === date).sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)).map((item) => (
                <div key={item.id} data-rundown-item={item.id} className="flex items-start gap-3 border-b border-line/60 px-4 py-3 hover:bg-cream/40">
                  <div className="w-10 shrink-0 text-[14px] font-bold text-ink">{item.time}</div>
                  <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">{item.title}</div><div className="mt-1 text-[14px] text-muted">{item.location} · {item.owner}</div><Badge tone="sand" className="mt-1 text-[12px]">{item.type}</Badge></div>
                  <button onClick={() => edit(item)} className="shrink-0 rounded p-1 text-muted hover:text-ink" aria-label={`Ubah ${item.title}`}><Pencil className="h-3 w-3" /></button>
                </div>
              ))}
            </section>
          ))}
          <div className="border-t border-line bg-[#FBFAF6] px-4 py-2.5 text-[12px] text-muted">Waktu dapat bergeser. Koordinator keluarga bertanggung jawab atas pembaruan terakhir.</div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Catatan koordinasi</h3>
            <div className="mt-2 space-y-2">
              {dates.map((date) => <div key={date} className="rounded-lg border border-line p-2.5"><div className="text-[14px] font-semibold text-ink">{dateLabel(date)}</div><div className="text-[13px] text-muted">{items.filter((item) => item.date === date).length} kegiatan · WITA</div></div>)}
            </div>
          </Card>
          <Alert tone={liveText ? "info" : "warn"} title="Versi rundown">{liveText ? "Rundown tersimpan di akun Anda dan dapat dibuka dari perangkat lain. Pembagian ke vendor dan pengingat otomatis menyusul." : "Perubahan hanya berlaku selama sesi demo ini. Pembagian dan pengingat belum mengirim notifikasi nyata."}</Alert>
          <Button variant="secondary" full size="sm" onClick={() => navigate("bantuan")} leading={<Bell className="h-3.5 w-3.5" />}>Atur pengingat rundown</Button>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editingId ? "Ubah mata acara" : "Tambah mata acara"} description="Tentukan tanggal dan lokasi untuk kegiatan ini. Tanggal boleh berbeda dari hari utama." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Batal</Button><Button size="sm" onClick={add}>{editingId ? "Simpan perubahan" : "Tambahkan"}</Button></>}>
        <div className="space-y-3">
          <Field label="Tanggal kegiatan" required><Input aria-label="Tanggal kegiatan" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></Field>
          <Field label="Lokasi kegiatan" required><Input aria-label="Lokasi kegiatan" value={eventLocation} maxLength={160} onChange={(e) => setEventLocation(e.target.value)} placeholder="Contoh: Rumah keluarga di Gowa" /></Field>
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Waktu (WITA)" required><Input type="time" value={time.replace(".", ":")} onChange={(e) => setTime(e.target.value.replace(":", "."))} /></Field><Field label="Jenis"><Select value={type} onChange={(e) => setType(e.target.value)}>{["Prosesi", "Resepsi", "Dokumentasi", "Logistik", "Persiapan"].map((x) => <option key={x}>{x}</option>)}</Select></Field></div>
          <Field label="Nama mata acara" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Penyambutan tamu undangan" /></Field>
          <Field label="Penanggung jawab"><Select value={owner} onChange={(e) => setOwner(e.target.value)}>{["Koordinator keluarga", "Hj. Andi Nurhaeni", "Dapur Cita Nusantara", "Lensa Pesisir Studio", "Rumah Dekor Sulapa"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Bagikan rundown" description="Simulasi pembagian seluruh tanggal rangkaian acara. Tidak ada notifikasi yang dikirim." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setShareOpen(false)}>Batal</Button><Button size="sm" onClick={() => { setShareOpen(false); toast(`Rundown v2.0 dibagikan kepada ${shareWith.length} vendor (simulasi).`, "success", "Rundown dibagikan"); }}>Bagikan versi ini</Button></>}>
        <div className="space-y-2">
          {vendors.map((v) => (
            <div key={v} className="flex items-center gap-2 rounded-lg border border-line p-2.5">
              <Checkbox checked={shareWith.includes(v)} onChange={(checked) => setShareWith((prev) => (checked ? [...prev, v] : prev.filter((x) => x !== v)))} label={v} />
            </div>
          ))}
          <Alert tone="info" title="Pembaruan tercatat">Pembagian ini hanya simulasi sesi, belum menyimpan audit di server.</Alert>
        </div>
      </Modal>
    </>
  );
}
