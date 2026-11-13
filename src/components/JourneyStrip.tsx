import { Check } from "lucide-react";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { useEventPlan } from "@/EventPlanContext";
import { nextStep } from "@/utils/next-step";
import { caseRoute, visibleCases, type WorkspaceView } from "@/utils/workspace";
import type { Actor } from "@/utils/cooperation";
import { cn } from "@/utils/cn";

type Step = { label: string; hint: string; phases?: string[]; route: string; done?: boolean };

/** Peta alur VAKSARA dari awal sampai akhir: menunjukkan posisi setiap kerja sama dan giliran pengguna. */
export default function JourneyStrip({ actor }: { actor: Actor }) {
  const { navigate } = useApp();
  const { flow } = useCooperation();
  const { plan } = useEventPlan();
  const cases = visibleCases(flow, actor);
  const view = (v: WorkspaceView) => caseRoute(actor, v);
  const steps: Step[] = actor === "vendor"
    ? [
      { label: "Permintaan masuk", hint: "Balas atau tolak", phases: ["inquiry", "replied"], route: view("requests") },
      { label: "Penawaran & perjanjian", hint: "Kirim harga, sepakati", phases: ["offered", "contract"], route: view("offers") },
      { label: "Pembayaran DP", hint: "Langsung atau Dana Amanah", phases: ["active"], route: view("payments") },
      { label: "Pelaksanaan & BAST", hint: "Layani, serahkan hasil", phases: ["running", "handover", "revision", "accepted"], route: view("delivery") },
      { label: "Selesai", hint: "Dana cair, kerja sama ditutup", phases: ["completed"], route: view("handover") },
    ]
    : [
      { label: "Susun rencana", hint: "Tanggal, anggaran, kebutuhan", route: "planner/rencana", done: plan.complete },
      { label: "Cari & hubungi pelaku", hint: "Cari sendiri atau pasang permintaan terbuka", phases: ["draft", "inquiry", "replied"], route: view("requests") },
      { label: "Sepakati harga", hint: "Penawaran & perjanjian", phases: ["offered", "contract"], route: view("offers") },
      { label: "Bayar aman", hint: "DP lewat Dana Amanah", phases: ["active"], route: view("payments") },
      { label: "Acara & BAST", hint: "Periksa, terima hasil", phases: ["running", "handover", "revision", "accepted"], route: view("delivery") },
      { label: "Selesai", hint: "Dana cair ke pelaku", phases: ["completed"], route: view("handover") },
    ];
  return <nav aria-label="Alur VAKSARA" className="rounded-[20px] border border-line/80 bg-white p-3 shadow-[0_12px_30px_-22px_rgba(18,58,51,0.28)] sm:p-4">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1"><h2 className="font-display text-xl text-ink">Alur kerja sama</h2><p className="text-[13px] text-muted"><span className="lg:hidden">Geser untuk melihat semua langkah · </span>Klik langkah untuk membukanya</p></div>
    <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0">
      {steps.map((s, i) => {
        const here = s.phases ? cases.filter(c => s.phases!.includes(c.phase)) : [];
        const mine = here.some(c => nextStep(c).actor === actor);
        const done = s.done ?? false;
        return <li key={s.label} className="relative w-[150px] shrink-0 lg:w-auto lg:min-w-0 lg:flex-1 lg:shrink">
          {i > 0 && <span aria-hidden className="absolute -left-0 top-6 hidden h-0.5 w-full -translate-x-1/2 bg-line lg:block" />}
          <button onClick={() => navigate(s.route)} className={cn("relative flex h-full w-full flex-col items-start gap-1 rounded-2xl px-3 py-2.5 text-left transition-colors lg:items-center lg:text-center", mine ? "bg-[#E9F6EE] hover:bg-[#DDF0E4]" : "bg-cream/60 hover:bg-cream lg:bg-transparent")}>
            <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[14px] font-bold", done ? "border-[#2F7A53] bg-[#2F7A53] text-white" : mine ? "border-[#2F7A53] bg-white text-[#2F7A53]" : here.length ? "border-sand bg-sand-light text-[#7A5A22]" : "border-line bg-white text-muted")}>{done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}</span>
            <span className="text-[14px] font-bold leading-tight text-ink">{s.label}</span>
            <span className="text-[12px] leading-tight text-muted">{s.hint}</span>
            {s.phases && <span className={cn("mt-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold", mine ? "bg-[#2F7A53] text-white" : here.length ? "bg-sand-light text-[#7A5A22]" : "bg-cream text-muted")}>{here.length ? `${here.length} kerja sama${mine ? " · giliran Anda" : ""}` : "kosong"}</span>}
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}
