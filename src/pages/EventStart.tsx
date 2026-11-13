import { liveBoot } from "@/LiveContext";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { Button, Card, Input } from "@/components/ui";
import { formatIDR } from "@/data";
import { blankPlan, needs, planError, useEventPlan } from "@/EventPlanContext";
import { useCooperation } from "@/CooperationContext";
import { practitioners } from "@/data";
import { confirmedTotal, phaseLabels } from "@/utils/cooperation";
import { nextStep } from "@/utils/next-step";
import { caseRoute, actionView, visibleCases } from "@/utils/workspace";
import { computeBudget } from "@/components/planner-shared";
import JourneyStrip from "@/components/JourneyStrip";
import { longDate, todayIso, toIso, UpcomingList, useCalendarEvents } from "@/components/EventCalendar";
import { useApp } from "@/store";

export function eventDate(date: string) {
  return date ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" }).format(new Date(date + "T12:00:00+08:00")) : "Tanggal belum ditentukan";
}
export default function EventStart() {
  const { plan, save, warning } = useEventPlan();
  const { navigate } = useApp();
  const [draft, setDraft] = useState(plan);
  const [step, setStep] = useState(plan.complete ? 0 : plan.step);
  const [error, setError] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, [step]);
  const advance = (next: number, skip = false) => {
    const message = planError(draft);
    if (message) { setError(message); return; }
    setError("");
    const updated = { ...draft, demo: false, name: draft.name.trim(), location: draft.location.trim(), needs: skip ? [] : draft.needs, step: next, complete: draft.complete };
    if (save(updated)) { setDraft(updated); setStep(next); setError(""); }
  };
  const finish = () => {
    const message = planError(draft);
    if (message) { setError(message); return; }
    if (save({ ...draft, demo: false, complete: true, step: 2 })) navigate("planner");
  };
  const fieldClass = "min-h-12 text-base";
  return <div className="min-h-screen bg-cream text-ink">
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5"><Logo /><button className="min-h-11 text-sm underline" onClick={() => navigate(plan.complete ? "planner" : "beranda")}>{plan.complete ? "Kembali ke rencana" : "Kembali ke beranda"}</button></header>
    <main className="mx-auto max-w-2xl px-5 pb-12 pt-5">
      <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm leading-relaxed">Demo lokal · Gunakan data contoh. Rencana disimpan di browser ini, belum tersinkron ke perangkat lain.</p>
      <ol aria-label="Langkah membuat rencana" className="mb-8 grid grid-cols-3 gap-2 text-sm">{["Buat acara", "Kebutuhan", "Lihat rencana"].map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={`rounded-xl border px-3 py-3 ${step === i ? "border-ink bg-ink text-white" : "border-line"}`}><span className="block text-xs opacity-70">Langkah {i + 1}</span>{label}</li>)}</ol>
      <h1 ref={title} tabIndex={-1} className="font-display text-3xl outline-none sm:text-4xl">{["Mari buat acara Anda", "Apa yang Anda butuhkan?", "Rencana awal Anda siap"][step]}</h1>
      <p className="mb-6 mt-3 text-base leading-relaxed text-muted">{["Cukup mulai dengan nama acara. Tanggal, lokasi, dan anggaran boleh ditentukan nanti.", "Pilih layanan yang ingin dicari. Pilihan bisa diubah nanti dan belum memesan apa pun.", "Periksa sebentar, lalu mulai mencari layanan untuk acara Anda."][step]}</p>
      {(warning || error) && <p role="alert" className="mb-4 rounded-xl border border-[#F0D5D0] bg-white p-4 text-sm">{error || warning}</p>}
      {step === 0 && <form noValidate onSubmit={e => { e.preventDefault(); advance(1); }} className="space-y-5">
        <label className="block text-base font-semibold" htmlFor="event-name">Nama pasangan atau acara <span className="font-normal text-muted">(wajib)</span><Input id="event-name" className={`mt-2 ${fieldClass}`} value={draft.name} maxLength={120} placeholder="Contoh: Pernikahan Ayu & Arif" onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label className="block text-base font-semibold" htmlFor="event-date">Tanggal acara <span className="font-normal text-muted">(opsional)</span><Input id="event-date" className={`mt-2 ${fieldClass}`} type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /><span className="mt-2 block text-sm font-normal text-muted">Belum pasti? Biarkan kosong. Rangkaian lintas hari dapat disusun di jadwal nanti.</span></label>
        <label className="block text-base font-semibold" htmlFor="event-location">Kota atau lokasi acara <span className="font-normal text-muted">(opsional)</span><Input id="event-location" className={`mt-2 ${fieldClass}`} value={draft.location} maxLength={150} placeholder="Contoh: Makassar" onChange={e => setDraft({ ...draft, location: e.target.value })} /></label>
        <label className="block text-base font-semibold" htmlFor="event-budget">Perkiraan anggaran (Rp) <span className="font-normal text-muted">(opsional)</span><Input id="event-budget" className={`mt-2 ${fieldClass}`} inputMode="numeric" value={draft.budget} placeholder="Contoh: 50000000" onChange={e => setDraft({ ...draft, budget: e.target.value })} /><span className="mt-2 block text-sm font-normal text-muted">Isi angka tanpa titik atau koma. Ini target awal, belum merupakan pengeluaran.</span></label>
        <Button type="submit" size="lg" full>Lanjut susun kebutuhan</Button>
      </form>}
      {step === 1 && <div>
        <fieldset className="grid gap-3"><legend className="sr-only">Pilih kebutuhan layanan</legend>{needs.map(n => <label key={n.id} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-4 text-base ${draft.needs.includes(n.id) ? "border-ink bg-sage" : "border-line bg-white"}`}><input type="checkbox" className="h-5 w-5 accent-[#16332e]" checked={draft.needs.includes(n.id)} onChange={e => setDraft({ ...draft, needs: e.target.checked ? [...draft.needs, n.id] : draft.needs.filter(id => id !== n.id) })} />{n.label}</label>)}</fieldset>
        <p className="my-4 text-sm text-muted">Tidak perlu memilih prosesi adat jika belum sesuai kebutuhan keluarga Anda.</p>
        <Button size="lg" full onClick={() => advance(2)}>Lihat rencana saya</Button>
        <Button size="lg" full variant="ghost" className="mt-2" onClick={() => advance(2, true)}>Lewati, tentukan nanti</Button>
        <button className="mt-4 min-h-11 text-sm underline" onClick={() => advance(0)}>Kembali ke data acara</button>
      </div>}
      {step === 2 && <div className="space-y-5"><Card className="space-y-4 p-5 sm:p-6"><h2 className="font-display text-2xl">{draft.name}</h2><p>{eventDate(draft.date)}</p><p>{draft.location || "Lokasi belum ditentukan"}</p><p>Target anggaran: {draft.budget ? formatIDR(Number(draft.budget)) : "Belum ditentukan"}</p><div><h3 className="font-semibold">Kebutuhan layanan</h3><p className="mt-2 leading-relaxed">{needs.filter(n => draft.needs.includes(n.id)).map(n => n.label).join(", ") || "Bisa dipilih nanti"}</p></div></Card><Button size="lg" full onClick={finish}>Mulai merencanakan</Button><button className="min-h-11 text-sm underline" onClick={() => advance(1)}>Kembali ubah kebutuhan</button></div>}
    </main>
  </div>;
}

const needVendors: Record<string, (category: string, name: string) => boolean> = {
  prosesi: c => c === "Prosesi Adat",
  busana: c => c === "Busana Adat" || c === "Perajin",
  musik: c => c === "Musik Tradisional",
  katering: (_, n) => n === "Dapur Cita Nusantara",
  dokumentasi: (_, n) => n === "Lensa Pesisir Studio",
};
const daysUntil = (date: string) => Math.round((Date.parse(date + "T00:00:00Z") - Date.parse(todayIso() + "T00:00:00Z")) / 86400000);

// Menghapus semua data demo di browser ini lalu memuat ulang, sehingga contoh lengkap tampil kembali.
export function ResetDemoButton({ className }: { className?: string }) {
  if (liveBoot()) return null;
  return <button className={className ?? "min-h-11 text-sm font-semibold text-muted underline"} onClick={() => { if (!confirm("Kembalikan semua data demo ke contoh awal? Perubahan yang Anda buat di browser ini akan dihapus.")) return; try { Object.keys(localStorage).filter(k => k.startsWith("vaksara-")).forEach(k => localStorage.removeItem(k)); } catch { /* penyimpanan tidak tersedia */ } location.hash = "#/planner"; location.reload(); }}>Kembalikan data demo awal</button>;
}

export function DemoPlanBanner() {
  const { plan, save } = useEventPlan();
  const { navigate } = useApp();
  if (!plan.demo) return null;
  return <div className="flex flex-col gap-3 rounded-xl border border-sand bg-sand-light p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-[15px] leading-relaxed text-ink"><b>Anda sedang melihat acara contoh.</b> Semua bagian sudah terisi data demo agar mudah dicoba. Tidak ada transaksi nyata.</p>
    <div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => navigate("demo")}>Ikuti demo terpandu</Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Mulai acara Anda sendiri? Rencana contoh diganti; data kerja sama contoh tetap tersedia.")) { save(blankPlan()); navigate("planner/mulai"); } }}>Buat acara sendiri</Button></div>
  </div>;
}

export function EventHome() {
  const { plan } = useEventPlan();
  const { navigate, checklist, guests } = useApp();
  const { flow } = useCooperation();
  const events = useCalendarEvents();
  if (!plan.complete) return <EventStart />;
  const cases = visibleCases(flow, "couple");
  const open = cases.filter(c => !["completed", "cancelled", "declined"].includes(c.phase));
  const myTurn = open.filter(c => nextStep(c).actor === "couple");
  const done = checklist.filter(t => t.done).length;
  const paid = cases.reduce((sum, c) => sum + confirmedTotal(c), 0);
  const agreed = cases.filter(c => c.offer && !["draft", "inquiry", "replied", "offered", "declined", "cancelled"].includes(c.phase)).reduce((sum, c) => sum + c.offer!.price, 0);
  const invited = guests.reduce((s, g) => s + g.party, 0), attending = guests.filter(g => g.rsvp === "Hadir").reduce((s, g) => s + g.party, 0);
  const openTasks = checklist.filter(t => !t.done).map(t => ({ ...t, iso: toIso(t.due) })).sort((a, b) => a.iso.localeCompare(b.iso)).slice(0, 3);
  const countdown = plan.date ? daysUntil(plan.date) : null;
  const tile = "rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink";
  return <div className="space-y-5 text-base">
    <DemoPlanBanner />
    <section className="flex flex-col gap-4 rounded-2xl bg-ink p-5 text-cream sm:flex-row sm:items-end sm:justify-between sm:p-7">
      <div><p className="text-sm text-cream/70">Rencana acara Anda</p><h1 className="mt-1 font-display text-3xl sm:text-4xl">{plan.name}</h1><p className="mt-2 text-cream/80">{eventDate(plan.date)} · {plan.location || "Lokasi belum ditentukan"}</p><button className="mt-2 min-h-11 text-sm font-semibold text-cream underline" onClick={() => navigate("planner/mulai")}>Ubah acara dan kebutuhan</button></div>
      {countdown !== null && <div className="self-start rounded-xl bg-white/10 px-5 py-3 text-center sm:self-auto"><p className="font-display text-4xl leading-none">{countdown > 0 ? countdown : countdown === 0 ? "Hari ini" : "Selesai"}</p>{countdown > 0 && <p className="mt-1 text-sm text-cream/80">hari lagi</p>}</div>}
    </section>
    <JourneyStrip actor="couple" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
      <button className={tile} onClick={() => navigate("planner/jadwal")}><p className="text-sm text-muted">Persiapan</p><p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{done}/{checklist.length}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream"><div className="h-full bg-[#3E7A5F]" style={{ width: `${Math.round(done / Math.max(1, checklist.length) * 100)}%` }} /></div><p className="mt-2 text-[13px] text-muted">tugas checklist selesai</p></button>
      <button className={tile} onClick={() => navigate("planner/kerjasama")}><p className="text-sm text-muted">Kerja sama</p><p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{open.length} berjalan</p><p className="mt-2 text-[13px] text-muted">{myTurn.length ? <span className="font-semibold text-[#1E5C38]">{myTurn.length} menunggu tindakan Anda</span> : "Tidak ada yang menunggu Anda"}</p></button>
      <button className={tile} onClick={() => navigate("planner/anggaran")}><p className="text-sm text-muted">Anggaran</p><p className="mt-1 break-words text-lg font-bold text-ink sm:text-2xl">{plan.budget ? formatIDR(Number(plan.budget)) : "—"}</p><p className="mt-2 text-[13px] text-muted">Disepakati {formatIDR(agreed)} · dibayar {formatIDR(paid)}</p></button>
      <button className={tile} onClick={() => navigate("planner/tamu")}><p className="text-sm text-muted">Tamu</p><p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{invited} undangan</p><p className="mt-2 text-[13px] text-muted">{attending} konfirmasi hadir</p></button>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section aria-label="Perlu Anda lakukan" className="min-w-0 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-2xl">Perlu Anda lakukan</h2>
        <ul className="mt-3 space-y-2">
          {myTurn.map(c => { const n = nextStep(c); return <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#F3FAF5] p-3"><span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{n.title}</span><span className="block truncate text-[13px] text-muted">{c.vendor}</span></span><Button size="sm" onClick={() => navigate(caseRoute("couple", actionView(c), c.id))}>Buka</Button></li>; })}
          {openTasks.map(t => <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream p-3"><span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{t.title}</span><span className="block text-[13px] text-muted">Tenggat {t.due} · {t.category}</span></span><Button size="sm" variant="secondary" onClick={() => navigate("planner/jadwal")}>Lihat</Button></li>)}
          {myTurn.length === 0 && openTasks.length === 0 && <li className="text-sm text-muted">Semua beres untuk saat ini.</li>}
        </ul>
      </section>
      <section aria-label="Agenda terdekat" className="min-w-0 rounded-xl border border-line bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-display text-2xl">Agenda terdekat</h2><button className="min-h-10 text-sm font-semibold underline" onClick={() => navigate("planner/jadwal")}>Buka kalender</button></div>
        <UpcomingList events={events} limit={4} />
      </section>
    </div>
    <section aria-label="Kebutuhan acara" className="rounded-xl border border-line bg-white p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-display text-2xl">Kebutuhan layanan</h2><p className="mt-1 text-sm text-muted">Status tiap kebutuhan diambil dari kerja sama Anda.</p></div><Button size="sm" variant="secondary" onClick={() => navigate("jelajahi")}>Cari layanan</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{needs.map(n => {
        const match = cases.filter(c => { const p = practitioners.find(x => x.name === c.vendor); return p && needVendors[n.id]?.(p.category, p.name) && !["cancelled", "declined"].includes(c.phase); });
        const best = match[0];
        const chosen = plan.needs.includes(n.id);
        return <div key={n.id} className="flex flex-col justify-between gap-3 rounded-lg border border-line p-4"><div><p className="font-semibold text-ink">{n.label}</p><p className="mt-1 text-sm text-muted">{best ? `${best.vendor} · ${phaseLabels[best.phase]}${match.length > 1 ? ` (+${match.length - 1} kerja sama)` : ""}` : chosen ? "Belum ada pelaku yang dihubungi" : "Tidak dipilih"}</p></div><div className="flex flex-wrap gap-2">{best && <Button size="sm" variant="secondary" onClick={() => navigate(caseRoute("couple", actionView(best), best.id))}>Lihat kerja sama</Button>}<Button size="sm" variant={best ? "ghost" : "primary"} onClick={() => navigate(`${n.route}?kategori=${encodeURIComponent(n.query)}`)}>Cari {n.label.toLowerCase()}</Button>{!best && <Button size="sm" variant="secondary" onClick={() => navigate("planner/permintaan-terbuka")}>Pasang permintaan terbuka</Button>}</div></div>;
      })}</div>
    </section>
    <ResetDemoButton />
  </div>;
}

export function EventTools() {
  const { navigate, checklist, guests, expenses } = useApp();
  const { plan } = useEventPlan();
  const events = useCalendarEvents();
  const budget = computeBudget(expenses);
  const done = checklist.filter(t => t.done).length;
  const next = checklist.filter(t => !t.done).map(t => ({ ...t, iso: toIso(t.due) })).sort((a, b) => a.iso.localeCompare(b.iso))[0];
  const acara = events.filter(e => e.kind === "acara"), days = new Set(acara.map(e => e.date)).size;
  const invited = guests.reduce((s, g) => s + g.party, 0), attending = guests.filter(g => g.rsvp === "Hadir").reduce((s, g) => s + g.party, 0);
  const cards: [string, string, string, string, string][] = [
    ["Jadwal & checklist", `${done}/${checklist.length} tugas selesai`, next ? `Berikutnya: ${next.title} (${next.due})` : "Semua tugas selesai", "jadwal", "Buka kalender"],
    ["Anggaran", `${formatIDR(budget.paid)} terpakai`, `dari rencana ${formatIDR(budget.planned)} · sisa ${formatIDR(budget.remaining)}`, "anggaran", "Kelola anggaran"],
    ["Rundown", `${acara.length} kegiatan · ${days} hari`, acara[0] ? `Dimulai ${longDate(acara[0].date)}` : "Belum ada kegiatan", "rundown", "Susun rundown"],
    ["Daftar tamu", `${invited} undangan`, `${attending} konfirmasi hadir · ${guests.length} keluarga/kelompok`, "tamu", "Kelola tamu"],
  ];
  return <div className="space-y-5">
    <DemoPlanBanner />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-3xl">Rencana acara</h1><p className="mt-1 text-muted"><b className="text-ink">{plan.name}</b> · {eventDate(plan.date)} · {plan.location || "Lokasi belum ditentukan"}</p></div><Button variant="secondary" onClick={() => navigate("planner/mulai")}>Ubah acara dan kebutuhan</Button></div>
    <div className="grid gap-3 sm:grid-cols-2">{cards.map(([label, value, detail, route, cta]) => <button key={route} className="flex min-h-36 flex-col justify-between rounded-xl border border-line bg-white p-5 text-left transition-colors hover:border-ink" onClick={() => navigate(`planner/${route}`)}><span><span className="block text-sm font-semibold text-muted">{label}</span><strong className="mt-1 block text-2xl text-ink">{value}</strong><span className="mt-1 block text-sm text-muted">{detail}</span></span><span className="mt-3 text-sm font-semibold text-ink underline">{cta} →</span></button>)}</div>
    <section aria-label="Agenda terdekat" className="rounded-xl border border-line bg-white p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl">Agenda terdekat</h2><button className="min-h-10 text-sm font-semibold underline" onClick={() => navigate("planner/jadwal")}>Lihat semua</button></div><UpcomingList events={events} limit={5} /></section>
    <ResetDemoButton />
  </div>;
}
