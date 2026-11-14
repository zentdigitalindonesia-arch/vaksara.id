import { PlannerQuickNav, computeBudget, daysToWedding, usePaymentTotals } from "@/components/planner-shared";
import { Alert, Badge, Button, Card, LinkArrow, PageHeader, Progress, SectionCard, StatCard } from "@/components/ui";
import { budgetItems, formatIDR, formatNumber, images, practitioners, rundown, timelineEvents, wedding } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileSignature,
  Gift,
  Heart,
  ListChecks,
  MapPin,
  Music2,
  Plus,
  Shirt,
  Sparkles,
  Store,
  Users,
  Utensils,
  Wallet
} from "lucide-react";
import { useMemo } from "react";

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

export default function PlannerDashboard({ mode = "overview" }: { mode?: "overview" | "planner" }) {
  const { navigate, checklist, toggleChecklist, expenses, guests } = useApp();
  const { planned, paid, remaining, percent, committed } = useMemo(() => computeBudget(expenses), [expenses]);
  const { list: payments, due } = usePaymentTotals();
  const days = daysToWedding();
  const done = checklist.filter((c) => c.done).length;
  const checklistPct = Math.round((done / checklist.length) * 100);
  const plannedVendors = practitioners.slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow={mode === "overview" ? "Ruang pengantin" : "Rencana pernikahan"}
        title={mode === "overview" ? "Selamat datang kembali, Nurul." : "Pernikahan Nurul & Aditya"}
        description={
          mode === "overview"
            ? `${wedding.dateLabel} · ${wedding.venue}. Ini ringkasan persiapan yang paling perlu Anda perhatikan hari ini.`
            : "Satu ruang untuk tanggal, anggaran, vendor, tamu, dan rundown. Perubahan akan terlihat oleh kolaborator keluarga."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate("planner/jadwal")} leading={<CalendarDays className="h-3.5 w-3.5" />}>Lihat jadwal</Button>
            {mode === "overview" ? (
              <Button size="sm" onClick={() => navigate("planner/planner")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Buka Rencana Acara</Button>
            ) : (
              <Button size="sm" onClick={() => navigate("perjanjian/baru")} leading={<Plus className="h-3.5 w-3.5" />}>Buat Perjanjian</Button>
            )}
          </>
        }
      />
      <PlannerQuickNav active={mode === "overview" ? "planner" : "planner/planner"} />

      {/* COUNTDOWN */}
      <section className="relative overflow-hidden rounded-2xl bg-ink text-cream">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-sand/20" />
        <div className="pointer-events-none absolute -bottom-32 right-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-sand"><Heart className="h-3 w-3" /> Menuju hari bahagia</div>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-display text-[3.1rem] font-semibold leading-none tracking-tight sm:text-[3.6rem]">{formatNumber(days)}</span>
              <span className="pb-1 text-[15px] font-semibold text-cream/80">hari lagi</span>
              <span className="mb-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[13px] text-cream/70">Hitung mundur</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-cream/65">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-sand" /> {wedding.dateLabel}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-sand" /> {wedding.venue}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3 text-sand" /> Target {wedding.guestTarget} tamu</span>
            </div>
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-cream/55">Persiapan keseluruhan</span><span className="font-bold text-sand">{checklistPct}%</span>
              </div>
              <Progress value={checklistPct} tone="sand" className="mt-1.5 bg-white/10" height="h-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="flex items-center gap-1.5 text-[13px] text-cream/50"><Wallet className="h-3 w-3" /> Anggaran tersisa</div>
              <div className="mt-1 text-[16px] font-bold text-cream">{formatIDR(remaining, true)}</div>
              <div className="mt-0.5 text-[12px] text-cream/40">{percent}% terserap</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="flex items-center gap-1.5 text-[13px] text-cream/50"><ClipboardCheck className="h-3 w-3" /> Tugas berikutnya</div>
              <div className="mt-1 text-[14px] font-semibold leading-snug text-cream">Finalkan naskah nasihat adat</div>
              <div className="mt-0.5 text-[12px] text-sand">30 Mei 2027</div>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-2 rounded-xl border border-sand/25 bg-sand/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <FileSignature className="h-3.5 w-3.5 text-sand" />
                <span className="text-[13px] leading-snug text-cream/75"><strong className="text-cream">2 perjanjian</strong> menunggu persetujuan atau BAST</span>
              </div>
              <button onClick={() => navigate("trust")} className="shrink-0 rounded p-1 text-sand hover:bg-white/10" aria-label="Buka Perjanjian"><ArrowRight className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
        <StatCard label="Total anggaran" value={formatIDR(planned, true)} helper={`Komitmen ${formatIDR(committed, true)}`} icon={<Wallet className="h-3.5 w-3.5" />} tone="neutral" onClick={() => navigate("planner/anggaran")} progress={100} />
        <StatCard label="Sudah dibayar" value={formatIDR(paid, true)} helper={`${percent}% dari anggaran`} icon={<CreditCard className="h-3.5 w-3.5" />} tone="green" onClick={() => navigate("planner/pembayaran")} progress={percent} />
        <StatCard label="Sisa anggaran" value={formatIDR(remaining, true)} helper="Dana yang belum terpakai" icon={<Wallet className="h-3.5 w-3.5" />} tone="sand" onClick={() => navigate("planner/anggaran")} progress={100 - percent} />
        <StatCard label="Checklist selesai" value={`${done}/${checklist.length}`} helper={`${checklistPct}% persiapan`} icon={<ListChecks className="h-3.5 w-3.5" />} tone="blue" onClick={() => navigate("planner/jadwal")} progress={checklistPct} />
        <StatCard className="col-span-2 lg:col-span-1" label="Vendor terpilih" value={`${plannedVendors.length} vendor`} helper="2 layanan menunggu BAST" icon={<Store className="h-3.5 w-3.5" />} tone="green" onClick={() => navigate("planner/vendor")} />
      </section>

      {mode === "overview" ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <SectionCard
              title="Progres persiapan"
              subtitle="Berdasarkan 12 tugas inti pada checklist Anda. Klik untuk menyelesaikan."
              action={<LinkArrow onClick={() => navigate("planner/jadwal")}>Buka checklist</LinkArrow>}
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Perencanaan", pct: 87 },
                  { label: "Vendor & layanan", pct: 58 },
                  { label: "Hari acara", pct: 24 },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-line bg-[#FBFAF6] p-2.5">
                    <div className="flex items-end justify-between"><span className="text-[13px] font-semibold text-ink-soft">{c.label}</span><span className="text-[15px] font-bold text-ink">{c.pct}%</span></div>
                    <Progress value={c.pct} tone={c.pct > 70 ? "green" : c.pct > 40 ? "sand" : "warn"} className="mt-2" height="h-1" />
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                {checklist.slice(0, 4).map((item) => (
                  <button key={item.id} onClick={() => toggleChecklist(item.id)} className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-left transition-colors hover:border-sand">
                    <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border", item.done ? "border-ink bg-ink text-cream" : "border-[#CFC7B7] bg-white")}>{item.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
                    <span className={cn("min-w-0 flex-1 truncate text-[14px]", item.done ? "text-muted line-through" : "font-medium text-ink")}>{item.title}</span>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[12px] font-semibold", item.priority === "Tinggi" ? "bg-[#F9ECE9] text-[#933A2F]" : "bg-[#F1EFE9] text-muted")}>{item.due}</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Vendor dalam rencana Anda" subtitle="Termasuk yang sudah memiliki perjanjian dan yang masih dalam pertimbangan." action={<LinkArrow onClick={() => navigate("planner/vendor")}>Kelola vendor</LinkArrow>}>
              <div className="grid gap-2 sm:grid-cols-2">
                {plannedVendors.map((p, i) => (
                  <button key={p.id} onClick={() => navigate(i < 2 ? "perjanjian/a1" : `praktisi/${p.id}`)} className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2.5 text-left transition-colors hover:border-sand">
                    <img src={p.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-ink">{p.name}</div>
                      <div className="truncate text-[12px] text-muted">{p.category}</div>
                      <div className="mt-0.5 flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", i < 2 ? "bg-[#4C8068]" : "bg-[#C08D3B]")} /><span className="text-[12px] text-muted">{i === 0 ? "BAST menunggu" : i === 1 ? "Perjanjian disepakati" : i === 2 ? "Penawaran dikirim" : "Dipertimbangkan"}</span></div>
                    </div>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-muted" />
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Termin pembayaran mendatang" subtitle="Dibedakan antara pembayaran gateway terverifikasi dan transfer yang dicatat manual." action={<LinkArrow onClick={() => navigate("planner/pembayaran")}>Semua pembayaran</LinkArrow>}>
              <div className="space-y-1.5">
                {payments.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", p.kind === "gateway" ? "bg-[#EAF1F5] text-[#33607A]" : "bg-[#F1EFE9] text-ink-soft")}><CreditCard className="h-3 w-3" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-ink">{p.label}</div>
                      <div className="text-[12px] text-muted">{p.vendor} · {p.method}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-ink">{formatIDR(p.amount)}</div>
                      <Badge tone={p.kind === "gateway" ? "blue" : "neutral"} className="mt-0.5 px-1 py-0.5 text-[12px]">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-3">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="text-[15px] font-bold text-ink">Timeline pernikahan</h3>
                <Badge tone="sand" className="text-[12px]">6 bulan ke depan</Badge>
              </div>
              <div className="p-4">
                <div className="relative space-y-3 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-line">
                  {timelineEvents.map((e) => (
                    <div key={e.title} className="relative flex gap-3">
                      <span className={cn("relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white ring-1", e.tone === "green" ? "bg-[#4C8068] ring-[#C9DCD0]" : e.tone === "sand" ? "bg-sand ring-[#E5D4B6]" : e.tone === "blue" ? "bg-[#5B87A0] ring-[#D3E0E8]" : "bg-[#C08D3B] ring-[#EEDFBE]")} />
                      <div className="min-w-0 flex-1 pb-0.5">
                        <div className="text-[12px] font-bold uppercase tracking-wider text-sand-deep">{e.date}</div>
                        <div className="mt-0.5 text-[14px] font-semibold leading-snug text-ink">{e.title}</div>
                        <div className="mt-0.5 text-[12px] leading-snug text-muted">{e.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" full className="mt-2" onClick={() => navigate("planner/jadwal")}>Lihat kalender</Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3"><h3 className="text-[15px] font-bold text-ink">Pengingat aktif</h3><Bell className="h-3.5 w-3.5 text-sand-deep" /></div>
              <div className="divide-y divide-line/70">
                {[
                  { t: "Kirim konfirmasi ke Dapur Cita", d: "Besok, 08.00", tone: "warn" },
                  { t: "Sesi foto keluarga inti", d: "6 Juni 2027", tone: "blue" },
                  { t: "Batas tanggapan fasilitasi", d: "18 Juni 2027", tone: "red" },
                ].map((r) => (
                  <div key={r.t} className="flex items-start gap-2 px-4 py-2.5">
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", r.tone === "warn" ? "bg-[#C08D3B]" : r.tone === "blue" ? "bg-[#5B87A0]" : "bg-[#B45245]")} />
                    <div className="min-w-0 flex-1"><div className="text-[14px] font-medium leading-snug text-ink">{r.t}</div><div className="mt-0.5 text-[12px] text-muted">{r.d}</div></div>
                  </div>
                ))}
              </div>
            </Card>

            <Alert tone="warn" title="BAST menunggu keputusan Anda" action={<ChevronRight className="h-3.5 w-3.5 shrink-0" />}>
              <p className="text-[14px] leading-relaxed">BAST untuk <strong>Dapur Cita Nusantara</strong> telah diajukan. Periksa bukti dan item sebelum menyetujui.</p>
              <button onClick={() => navigate("bast/a4")} className="mt-1.5 text-[14px] font-bold underline decoration-sand underline-offset-2">Tinjau BAST</button>
            </Alert>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
            <SectionCard title="Anggaran" subtitle="Perencanaan, komitmen, dan pembayaran per kategori." action={<LinkArrow onClick={() => navigate("planner/anggaran")}>Kelola anggaran</LinkArrow>}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div><div className="text-[13px] text-muted">Total terpakai</div><div className="text-[16px] font-bold text-ink">{formatIDR(paid)}</div></div>
                <div className="text-right"><div className="text-[13px] text-muted">Sisa</div><div className="text-[16px] font-bold text-[#2B5949]">{formatIDR(remaining)}</div></div>
              </div>
              <div className="space-y-2">
                {budgetItems.slice(0, 5).map((b) => (
                  <div key={b.category}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-1.5 text-ink-soft"><span className="text-sand-deep">{budgetIcons[b.icon]}</span>{b.category}</span>
                      <span className="font-semibold text-ink">{formatIDR(b.paid, true)} <span className="font-normal text-muted">/ {formatIDR(b.planned, true)}</span></span>
                    </div>
                    <Progress value={(b.paid / b.planned) * 100} tone={b.paid / b.planned > 0.8 ? "warn" : "sand"} height="h-1" className="mt-1" />
                  </div>
                ))}
              </div>
            </SectionCard>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="p-4">
                <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold text-ink">Checklist</h3><span className="text-[13px] font-bold text-sand-deep">{checklistPct}%</span></div>
                <div className="mt-2.5 flex items-center gap-4">
                  <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#16332E 0 ${checklistPct}%, #EAE5DA ${checklistPct}% 100%)` }}>
                    <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-[15px] font-bold leading-none text-ink">{done}</span><span className="text-[12px] text-muted">dari {checklist.length}</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {checklist.filter((c) => !c.done).slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-start gap-1.5 text-[13px] leading-snug text-ink-soft"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sand" />{c.title}</div>
                    ))}
                    <button onClick={() => navigate("planner/jadwal")} className="text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Lihat semua tugas</button>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold text-ink">Termin mendatang</h3><CreditCard className="h-3.5 w-3.5 text-sand-deep" /></div>
                <div className="mt-2 text-[15px] font-bold text-ink">{formatIDR(due)}</div>
                <div className="text-[12px] text-muted">2 pembayaran dalam 30 hari</div>
                <div className="mt-2 rounded-md bg-[#FCF6E9] px-2 py-1.5 text-[12px] leading-relaxed text-[#79551A]"><AlertTriangle className="mr-1 inline h-2.5 w-2.5" /> Termin berikutnya 24 Jun 2027 — Anugrah Sanggar Musik.</div>
                <Button size="sm" variant="secondary" full className="mt-2" onClick={() => navigate("planner/pembayaran")}>Kelola pembayaran</Button>
              </Card>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard title="Vendor & status layanan" subtitle="Data dari perjanjian dan permintaan yang sedang berjalan." action={<LinkArrow onClick={() => navigate("planner/vendor")}>Vendor saya</LinkArrow>}>
              <div className="space-y-2">
                {plannedVendors.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2.5">
                    <img src={p.image} alt="" className="h-8 w-8 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-ink">{p.name}</div>
                      <div className="truncate text-[12px] text-muted">{p.category}</div>
                    </div>
                    <Badge tone={i === 0 ? "amber" : i === 1 ? "green" : i === 2 ? "blue" : "neutral"} className="text-[12px]">{i === 0 ? "Menunggu BAST" : i === 1 ? "Perjanjian aktif" : i === 2 ? "Penawaran" : "Dipertimbangkan"}</Badge>
                    <button onClick={() => navigate(i === 0 ? "pengiriman/a1" : "planner/vendor")} className="shrink-0 text-muted hover:text-ink" aria-label={`Buka ${p.name}`}><ArrowUpRight className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Hitung mundur & agenda" subtitle="Susunan yang telah dikonfirmasi bersama." action={<Badge tone="sand" className="text-[12px]">{days} hari lagi</Badge>}>
              <div className="grid grid-cols-4 gap-1.5">
                {[["Hari", Math.floor(days)], ["Jam", 12], ["Menit", 30], ["Detik", "—"]].map(([l, v]) => (
                  <div key={l as string} className="rounded-lg border border-line bg-[#FBFAF6] py-2 text-center">
                    <div className="text-[16px] font-bold leading-none text-ink">{v as React.ReactNode}</div>
                    <div className="mt-1 text-[12px] uppercase tracking-wider text-muted">{l as string}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {timelineEvents.slice(0, 4).map((e) => (
                  <div key={e.title} className="flex items-start gap-2">
                    <span className="w-[62px] shrink-0 text-[12px] font-bold uppercase tracking-wide text-sand-deep">{e.date}</span>
                    <div className="min-w-0 border-l border-line pl-2"><div className="text-[14px] font-semibold leading-snug text-ink">{e.title}</div><div className="text-[12px] text-muted">{e.detail}</div></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-[.85fr_1.15fr]">
            <SectionCard title="Tamu" subtitle="RSVP dan undangan" action={<LinkArrow onClick={() => navigate("planner/tamu")}>Kelola tamu</LinkArrow>}>
              <div className="grid grid-cols-3 gap-2">
                {[{ l: "Total tamu", v: guests.reduce((s, g) => s + g.party, 0) + 140, tone: "neutral" }, { l: "Hadir", v: 112, tone: "green" }, { l: "Menunggu", v: 24, tone: "sand" }].map((s) => (
                  <div key={s.l} className="rounded-lg border border-line bg-[#FBFAF6] p-2 text-center"><div className="text-[16px] font-bold text-ink">{s.v}</div><div className="text-[12px] text-muted">{s.l}</div></div>
                ))}
              </div>
              <div className="mt-2.5 flex gap-2">
                {[images.family, images.groom, images.hijabPortrait].map((src, i) => <img key={i} src={src} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm" />)}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sage text-[12px] font-bold text-[#2B5949] shadow-sm">+45</div>
                <div className="ml-auto self-center text-[12px] text-muted">118 undangan aktif</div>
              </div>
              <Progress value={74} tone="green" className="mt-2" height="h-1" />
            </SectionCard>
            <SectionCard title="Rundown hari acara" subtitle="Sabtu, 12 Juni 2027 · Gedung pertemuan keluarga (contoh)" action={<LinkArrow onClick={() => navigate("planner/rundown")}>Rundown lengkap</LinkArrow>}>
              <div className="space-y-1.5">
                {rundown.slice(0, 4).map((r) => (
                  <div key={r.time} className="flex items-start gap-2.5 rounded-lg border border-line bg-white px-2.5 py-2">
                    <span className="w-8 shrink-0 pt-0.5 text-[13px] font-bold text-ink">{r.time}</span>
                    <div className="min-w-0 flex-1 border-l border-line pl-2"><div className="text-[14px] font-medium leading-snug text-ink">{r.title}</div><div className="text-[12px] text-muted">{r.owner}</div></div>
                    <Badge tone={r.type === "Prosesi" ? "sand" : "neutral"} className="shrink-0 px-1.5 py-0.5 text-[12px]">{r.type}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <Alert tone="trust" title="Kolaborasi keluarga">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] leading-relaxed">Rencana ini dibagikan kepada Aditya Pratama (pendamping) dan Ibu Salma (koordinator keluarga). Hanya Anda yang dapat mengubah anggaran.</p>
              <button onClick={() => navigate("planner/planner")} className="rounded border border-line bg-white px-2 py-1 text-[13px] font-semibold text-ink">Kelola akses</button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
}
