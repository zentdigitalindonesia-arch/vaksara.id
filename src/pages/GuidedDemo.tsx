import { useEffect, useState } from "react";
import { ArrowRight, Check, Play, RotateCcw } from "lucide-react";
import { Alert, Badge, Button } from "@/components/ui";
import { useCooperation } from "@/CooperationContext";
import { useEventPlan } from "@/EventPlanContext";
import { useApp } from "@/store";
import { formatIDR, practitioners } from "@/data";
import { amanahOf, phaseLabels, type Actor, type Flow } from "@/utils/cooperation";
import { actorNames, nextStep } from "@/utils/next-step";
import { caseRoute, actionView } from "@/utils/workspace";

const TOUR_KEY = "vaksara-guided-demo-case";
const PRICE = 6500000, DEPOSIT = 1950000;

type Step = { who: Actor[]; title: string; explain: string; run: (ctx: Runner) => boolean };
type Runner = { go: (type: string, actor: Actor, data?: Record<string, unknown>) => Flow | null; caseId: string; flow: () => Flow; date: string };

const dayBefore = (value: string) => { const d = new Date(value + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

const steps: Step[] = [
  {
    who: ["couple"], title: "Keluarga mengirim permintaan",
    explain: "Keluarga memilih pelaku budaya dari direktori dan menulis kebutuhan acaranya: pendampingan prosesi adat dua hari.",
    run: ({ go }) => !!go("submit", "couple"),
  },
  {
    who: ["vendor"], title: "Pelaku budaya membalas dan mengirim penawaran",
    explain: "Pelaku budaya membalas, lalu menulis penawaran: lingkup, jadwal dua hari, harga Rp6.500.000, DP Rp1.950.000, dan memilih cara bayar Dana Amanah.",
    run: ({ go, date }) => !!go("reply", "vendor", { note: "Terima kasih, kami tersedia pada tanggal tersebut." }) && !!go("offer", "vendor", {
      price: PRICE, deposit: DEPOSIT, paymentMode: "amanah",
      scope: "Pendampingan prosesi mappacci dan akad, termasuk tata rias dan pemandu adat.",
      terms: "DP sebelum persiapan; pelunasan setelah BAST diterima. Perubahan jadwal dan pembatalan harus disepakati kedua pihak.",
      days: [{ date: dayBefore(date), location: "Rumah keluarga (contoh)" }, { date, location: "Rumah keluarga (contoh)" }],
    }),
  },
  {
    who: ["couple"], title: "Keluarga menerima penawaran",
    explain: "Keluarga membaca penawaran. Bila ada yang kurang pas, keluarga bisa minta revisi; di sini penawaran diterima.",
    run: ({ go }) => !!go("accept_offer", "couple"),
  },
  {
    who: ["couple", "vendor"], title: "Kedua pihak menyetujui perjanjian",
    explain: "Perjanjian baru berlaku setelah keluarga dan pelaku budaya menyetujui versi yang sama. Setiap revisi membuat versi baru.",
    run: ({ go }) => !!go("approve", "couple", { version: 1, ack: true }) && !!go("approve", "vendor", { version: 1, ack: true }),
  },
  {
    who: ["couple"], title: "Keluarga menyetor DP ke Dana Amanah",
    explain: "DP Rp1.950.000 disetor lewat virtual account (simulasi). Uang ditahan dan belum menjadi milik pelaku budaya.",
    run: ({ go }) => !!go("payment", "couple", { amount: DEPOSIT, ack: true }),
  },
  {
    who: ["vendor"], title: "Pelaku budaya melaksanakan dan mengajukan BAST",
    explain: "Layanan dimulai karena DP sudah tersedia. Setelah acara, pelaku budaya mengajukan berita acara serah terima (BAST).",
    run: ({ go }) => !!go("start", "vendor") && !!go("handover", "vendor", { proof: "Prosesi mappacci dan akad terlaksana sesuai rundown dua hari." }),
  },
  {
    who: ["couple"], title: "Keluarga menerima BAST dan melunasi",
    explain: "Keluarga memeriksa hasil, menerima BAST, lalu menyetor pelunasan Rp4.550.000 ke Dana Amanah.",
    run: ({ go }) => !!go("accept_handover", "couple", { ack: true }) && !!go("payment", "couple", { amount: PRICE - DEPOSIT, ack: true }),
  },
  {
    who: ["vendor", "couple"], title: "Dana cair dengan dua persetujuan, kerja sama ditutup",
    explain: "Pelaku budaya mengusulkan pencairan seluruh dana; keluarga menyetujui. Setelah itu kerja sama ditutup dan tercatat sebagai rekam jejak.",
    run: ({ go, flow, caseId }) => {
      const held = amanahOf(flow().cases.find((c) => c.id === caseId)!).held;
      return !!go("propose_release", "vendor", { amount: held, note: "Layanan selesai dan BAST diterima keluarga." }) && !!go("approve_release", "couple", { ack: true }) && !!go("complete", "couple");
    },
  },
];

function readTour(): { caseId: string; done: number } | null {
  try { const raw = localStorage.getItem(TOUR_KEY); const v = raw ? JSON.parse(raw) : null; return v && typeof v.caseId === "string" && Number.isInteger(v.done) ? v : null; } catch { return null; }
}
function saveTour(v: { caseId: string; done: number } | null) {
  try { if (v) localStorage.setItem(TOUR_KEY, JSON.stringify(v)); else localStorage.removeItem(TOUR_KEY); } catch { /* demo tetap berjalan di memori */ }
}

export default function GuidedDemo() {
  const { flow, dispatch, error } = useCooperation();
  const { plan } = useEventPlan();
  const { navigate } = useApp();
  const [tour, setTour] = useState(() => { const t = readTour(); return t && flow.cases.some((c) => c.id === t.caseId) ? t : null; });
  const [failed, setFailed] = useState("");
  let latest = flow;
  const date = plan.date && plan.date >= new Date().toISOString().slice(0, 10) ? plan.date : "2027-06-12";
  const item = tour ? flow.cases.find((c) => c.id === tour.caseId) : undefined;
  const update = (v: { caseId: string; done: number } | null) => { setTour(v); saveTour(v); };
  useEffect(() => { if (tour && tour.done > 0) document.getElementById(`demo-step-${Math.min(tour.done, steps.length - 1)}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [tour?.done]);

  const begin = () => {
    setFailed("");
    const reg = { consent: true, contactDemoPassed: true };
    const vendorName = latest.accounts.vendor?.name ?? practitioners[0].name;
    if (!latest.accounts.couple) { const r = dispatch({ type: "register", actor: "couple", data: { ...reg, name: plan.name || "Keluarga Nurul & Aditya", email: "keluarga@contoh.test", phone: "+6281200000001" } }); if (!r) return setFailed("Akun keluarga demo gagal dibuat."); latest = r; }
    if (!latest.accounts.vendor) { const r = dispatch({ type: "register", actor: "vendor", data: { ...reg, name: vendorName, email: "pelaku@contoh.test", phone: "+6281200000002" } }); if (!r) return setFailed("Akun pelaku budaya demo gagal dibuat."); latest = r; }
    if (!Object.values(latest.vendorReview).every(Boolean)) { const r = dispatch({ type: "review_vendor", actor: "admin", data: { identity: true, culture: true, consent: true } }); if (r) latest = r; }
    const id = `tur-${Date.now().toString(36)}`;
    const r = dispatch({ type: "lead", actor: "couple", id, data: { vendor: latest.accounts.vendor!.name, date, request: "Pendampingan prosesi mappacci dan akad selama dua hari (demo terpandu)." } });
    if (!r) return setFailed("Permintaan demo gagal dibuat.");
    latest = r;
    update({ caseId: id, done: 0 });
  };

  const runNext = () => {
    if (!tour) return;
    setFailed("");
    const step = steps[tour.done];
    const ok = step.run({ caseId: tour.caseId, date, flow: () => latest, go: (type, actor, data = {}) => { const r = dispatch({ type, actor, caseId: tour.caseId, data }); if (r) latest = r; return r; } });
    if (!ok) { setFailed(`Langkah "${step.title}" belum bisa dijalankan.`); return; }
    update({ caseId: tour.caseId, done: tour.done + 1 });
  };

  const finished = tour && tour.done >= steps.length;
  const viewAs = (actor: Actor) => item && navigate(caseRoute(actor, actionView(item), item.id));
  const a = item ? amanahOf(item) : null;
  const ns = item ? nextStep(item) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <Badge tone="sand">Demo terpandu · ±3 menit</Badge>
      <h1 className="mt-3 font-display text-[32px] leading-tight text-ink md:text-[42px]">Coba satu kerja sama dari awal sampai selesai</h1>
      <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">
        Anda tidak perlu mendaftar atau berpindah menu. Tekan tombol di setiap langkah; VAKSARA menjalankan tindakan keluarga atau pelaku budaya secara bergantian.
        Setiap saat Anda dapat membuka halaman aslinya dari sudut pandang pihak tersebut. Semua data dan setoran adalah simulasi di browser ini.
      </p>

      {!tour && (
        <div className="mt-8 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-[22px] text-ink">Skenario</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Keluarga memesan pendampingan prosesi mappacci dan akad dari seorang pelaku budaya, dengan pembayaran melalui Dana Amanah.</p>
          <ol className="mt-4 grid gap-2 text-[15px] md:grid-cols-2">
            {steps.map((s, i) => <li key={s.title} className="flex gap-2"><span className="font-bold text-sand-deep">{i + 1}.</span>{s.title}</li>)}
          </ol>
          <Button className="mt-6" size="lg" onClick={begin} leading={<Play className="h-4 w-4" />}>Mulai demo</Button>
        </div>
      )}

      {failed && <Alert className="mt-6" tone="error" title={failed}>{error}</Alert>}

      {tour && item && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <ol className="space-y-3">
            {steps.map((s, i) => {
              const done = i < tour.done, active = i === tour.done;
              return (
                <li key={s.title} id={`demo-step-${i}`} className={`scroll-mt-28 rounded-2xl border p-5 ${active ? "border-ink bg-white shadow-sm" : done ? "border-line bg-[#F3FAF5]" : "border-line bg-white/60 opacity-70"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-bold ${done ? "bg-[#2E7D4F] text-white" : active ? "bg-ink text-cream" : "bg-line text-muted"}`}>{done ? <Check className="h-4 w-4" /> : i + 1}</span>
                    {s.who.map((w) => <Badge key={w} tone={w === "vendor" ? "sand" : "green"}>{actorNames[w]}</Badge>)}
                  </div>
                  <h3 className="mt-2 text-[18px] font-bold text-ink">{s.title}</h3>
                  {(active || done) && <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.explain}</p>}
                  {active && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={runNext} trailing={<ArrowRight className="h-4 w-4" />}>Jalankan langkah {i + 1}</Button>
                      <Button variant="secondary" onClick={() => viewAs(s.who[0])}>Lihat halaman {actorNames[s.who[0]].toLowerCase()}</Button>
                    </div>
                  )}
                </li>
              );
            })}
            {finished && (
              <Alert tone="success" title="Demo selesai">
                Kerja sama ditutup, dana sudah cair ke pelaku budaya dengan persetujuan keluarga, dan semua tercatat. Buka halamannya untuk melihat riwayat lengkap atau mencetak perjanjian dan BAST.
              </Alert>
            )}
          </ol>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-sand-deep">Status kerja sama</p>
            <p className="mt-2 text-[18px] font-bold text-ink">{phaseLabels[item.phase]}</p>
            <p className="mt-1 text-[14px] text-muted">{item.vendor} · {item.eventDate}</p>
            {ns && ns.actor && <p className="mt-3 rounded-lg bg-sand-light px-3 py-2 text-[14px]"><b>Giliran {actorNames[ns.actor].toLowerCase()}:</b> {ns.title}</p>}
            {item.offer && <p className="mt-3 text-[14px]">Perjanjian v{item.offer.version} · {formatIDR(item.offer.price)}</p>}
            {a && item.offer?.paymentMode === "amanah" && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <div className="rounded-lg bg-[#F3FAF5] p-2"><p className="text-muted">Ditahan</p><p className="font-bold">{formatIDR(a.held)}</p></div>
                <div className="rounded-lg bg-[#F3FAF5] p-2"><p className="text-muted">Cair ke pelaku</p><p className="font-bold">{formatIDR(a.released)}</p></div>
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" size="sm" onClick={() => viewAs("couple")}>Buka sebagai keluarga</Button>
              <Button variant="secondary" size="sm" onClick={() => viewAs("vendor")}>Buka sebagai pelaku budaya</Button>
              <Button variant="ghost" size="sm" onClick={() => { update(null); setFailed(""); }} leading={<RotateCcw className="h-3.5 w-3.5" />}>Ulangi dari awal</Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
