import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { useEventPlan } from "@/EventPlanContext";
import { rundown as seedRundown } from "@/data";
import { phaseLabels, type Actor } from "@/utils/cooperation";
import { caseRoute, visibleCases, actionView } from "@/utils/workspace";
import { cn } from "@/utils/cn";

export type CalendarKind = "hari" | "acara" | "layanan" | "tugas";
export type CalendarEvent = { date: string; title: string; detail: string; kind: CalendarKind; route?: string; done?: boolean; time?: string };

const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
/** "10 Jan 2027" atau "2027-01-10" → "2027-01-10"; selain itu kosong. */
export function toIso(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/.exec(value.trim());
  const month = m ? months[m[2].toLowerCase()] : undefined;
  return m && month ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}
export const kindStyle: Record<CalendarKind, { label: string; chip: string; dot: string }> = {
  hari: { label: "Hari H", chip: "bg-[#B45245] text-white", dot: "bg-[#B45245]" },
  acara: { label: "Rangkaian acara", chip: "bg-[#EAF1EC] text-[#2B5949] border border-[#C9DDD0]", dot: "bg-[#3E7A5F]" },
  layanan: { label: "Jadwal pelaku budaya", chip: "bg-[#E8F0F5] text-[#2F5B73] border border-[#C8DAE5]", dot: "bg-[#477C96]" },
  tugas: { label: "Tenggat tugas", chip: "bg-sand-light text-[#7A5A22] border border-sand/50", dot: "bg-[#C08D3B]" },
};
const order: CalendarKind[] = ["hari", "acara", "layanan", "tugas"];
export const longDate = (iso: string) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
export const shortDate = (iso: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
export const todayIso = () => new Date().toISOString().slice(0, 10);

/** Semua agenda dari satu sumber: rencana acara, rundown, checklist dan jadwal kerja sama. */
export function useCalendarEvents(scope: "couple" | "vendor" = "couple"): CalendarEvent[] {
  const { checklist } = useApp();
  const { flow } = useCooperation();
  const { plan } = useEventPlan();
  return useMemo(() => {
    const actor: Actor = scope;
    const out: CalendarEvent[] = [];
    const cases = visibleCases(flow, actor).filter(c => !["cancelled", "declined"].includes(c.phase));
    for (const c of cases) {
      const days = c.offer?.days.length ? c.offer.days : [{ date: c.eventDate, location: "" }];
      for (const d of days) out.push({ date: d.date, title: scope === "vendor" ? (flow.accounts.couple?.name ?? "Keluarga") : c.vendor, detail: `${phaseLabels[c.phase]}${d.location ? " · " + d.location : ""}`, kind: "layanan", done: c.phase === "completed", route: caseRoute(actor, actionView(c), c.id) });
    }
    if (scope === "couple") {
      if (plan.date) out.push({ date: plan.date, title: "Hari pernikahan", detail: `${plan.name}${plan.location ? " · " + plan.location : ""}`, kind: "hari", route: "planner/rundown" });
      for (const r of seedRundown) out.push({ date: r.date, time: r.time, title: r.title, detail: `${r.time} WITA · ${r.owner}`, kind: "acara", route: "planner/rundown" });
      for (const t of checklist) { const iso = toIso(t.due); if (iso) out.push({ date: iso, title: t.title, detail: `${t.category}${t.done ? " · selesai" : ""}`, kind: "tugas", done: t.done, route: "planner/jadwal" }); }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date) || order.indexOf(a.kind) - order.indexOf(b.kind) || (a.time ?? "").localeCompare(b.time ?? ""));
  }, [checklist, flow, plan, scope]);
}

export function UpcomingList({ events, limit = 5, from }: { events: CalendarEvent[]; limit?: number; from?: string }) {
  const { navigate } = useApp();
  const start = from ?? todayIso();
  const list = events.filter(e => e.date >= start && !e.done).slice(0, limit);
  if (!list.length) return <p className="text-sm text-muted">Belum ada agenda mendatang.</p>;
  return <ol className="space-y-2">{list.map((e, i) => <li key={i}><button onClick={() => e.route && navigate(e.route)} className="flex w-full items-start gap-3 rounded-lg border border-line bg-white p-3 text-left hover:border-ink">
    <span className="w-14 shrink-0 text-center"><span className="block text-[12px] uppercase text-muted">{shortDate(e.date).split(" ")[1]}</span><span className="block font-display text-2xl leading-none text-ink">{Number(e.date.slice(8))}</span></span>
    <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={cn("h-2 w-2 shrink-0 rounded-full", kindStyle[e.kind].dot)} /><span className="truncate text-[15px] font-semibold text-ink">{e.title}</span></span><span className="mt-0.5 block truncate text-[13px] text-muted">{e.detail}</span></span>
  </button></li>)}</ol>;
}

export default function EventCalendar({ events, initial }: { events: CalendarEvent[]; initial?: string }) {
  const { navigate } = useApp();
  const start = initial || events.find(e => e.kind === "hari")?.date || events.find(e => e.date >= todayIso())?.date || todayIso();
  const [cursor, setCursor] = useState(() => ({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(start);
  const byDay = useMemo(() => { const map: Record<string, CalendarEvent[]> = {}; for (const e of events) (map[e.date] ??= []).push(e); return map; }, [events]);
  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const daysIn = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const title = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const iso = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const move = (delta: number) => setCursor(c => { const d = new Date(Date.UTC(c.y, c.m + delta, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const jump = (date: string) => { setCursor({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 }); setSelected(date); };
  const monthCount = events.filter(e => e.date.startsWith(iso(1).slice(0, 7))).length;
  const today = todayIso();
  const dayEvents = byDay[selected] ?? [];
  const hari = events.find(e => e.kind === "hari");
  return <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
    <section aria-label="Kalender" className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div><h2 className="font-display text-2xl capitalize text-ink">{title}</h2><p className="text-[13px] text-muted">{monthCount} agenda bulan ini · waktu WITA</p></div>
        <div className="flex items-center gap-2">
          {hari && <button onClick={() => jump(hari.date)} className="min-h-10 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-cream">Ke hari H</button>}
          <button onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-cream" aria-label="Bulan sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-cream" aria-label="Bulan berikutnya"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-[#FBFAF6] text-center text-[12px] font-bold uppercase tracking-wide text-muted">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(d => <div key={d} className="py-2">{d}</div>)}</div>
      <div className="grid grid-cols-7 [&>*]:min-w-0">
        {Array.from({ length: lead }).map((_, i) => <div key={`l${i}`} className="min-h-[56px] border-b border-r border-line/70 bg-[#FBFAF6] sm:min-h-[104px]" />)}
        {Array.from({ length: daysIn }).map((_, i) => {
          const d = i + 1, key = iso(d), list = byDay[key] ?? [], isSel = key === selected, isHari = list.some(e => e.kind === "hari");
          return <button key={key} onClick={() => setSelected(key)} aria-label={`${longDate(key)}, ${list.length} agenda`} aria-pressed={isSel} className={cn("flex min-h-[56px] flex-col items-stretch gap-1 border-b border-r border-line/70 p-1 text-left align-top transition-colors sm:min-h-[104px] sm:p-1.5", isSel ? "bg-[#EEF3EF] ring-2 ring-inset ring-ink" : isHari ? "bg-[#FBEDEA]" : "hover:bg-cream")}>
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[14px]", key === today ? "bg-ink font-bold text-cream" : isHari ? "font-bold text-[#933A2F]" : "text-ink")}>{d}</span>
            <span className="hidden flex-col gap-1 sm:flex">{list.slice(0, 2).map((e, k) => <span key={k} className={cn("truncate rounded px-1.5 py-0.5 text-[12px] font-semibold leading-tight", kindStyle[e.kind].chip, e.done && "line-through opacity-60")}>{e.kind === "acara" && e.time ? e.time + " " : ""}{e.title}</span>)}{list.length > 2 && <span className="px-1 text-[12px] font-semibold text-muted">+{list.length - 2} lainnya</span>}</span>
            {list.length > 0 && <span className="flex flex-wrap gap-0.5 sm:hidden">{list.slice(0, 4).map((e, k) => <span key={k} className={cn("h-1.5 w-1.5 rounded-full", kindStyle[e.kind].dot)} />)}</span>}
          </button>;
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-[13px] text-ink-soft">{order.map(k => <span key={k} className="flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", kindStyle[k].dot)} />{kindStyle[k].label}</span>)}</div>
    </section>
    <aside className="min-w-0 space-y-3">
      <section aria-label="Agenda tanggal terpilih" className="rounded-xl border border-line bg-white p-4">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-sand-deep">Agenda</p>
        <h3 className="mt-1 font-display text-xl capitalize text-ink">{longDate(selected)}</h3>
        {dayEvents.length === 0 ? <div className="mt-3 flex items-center gap-2 rounded-lg bg-cream p-3 text-sm text-muted"><CalendarDays className="h-4 w-4" />Tidak ada agenda di tanggal ini.</div> :
          <ul className="mt-3 max-h-[460px] space-y-1 overflow-y-auto pr-1">{dayEvents.map((e, i) => <li key={i}><button onClick={() => e.route && navigate(e.route)} className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-cream">
            <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", kindStyle[e.kind].dot)} />
            <span className="min-w-0 flex-1"><span className={cn("block text-[15px] font-semibold leading-snug text-ink", e.done && "line-through opacity-60")}>{e.title}</span><span className="block text-[13px] leading-snug text-muted">{e.kind === "acara" ? e.detail : `${kindStyle[e.kind].label} · ${e.detail}`}</span></span>
          </button></li>)}</ul>}
        {dayEvents.length > 0 && <p className="mt-2 text-[12px] text-muted">Klik agenda untuk membuka halaman terkait.</p>}
      </section>
      <section aria-label="Agenda mendatang" className="rounded-xl border border-line bg-white p-4">
        <h3 className="mb-3 text-[15px] font-bold text-ink">Agenda mendatang</h3>
        <UpcomingList events={events} limit={5} />
      </section>
    </aside>
  </div>;
}
