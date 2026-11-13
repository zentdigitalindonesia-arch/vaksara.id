import { Badge, Button } from "@/components/ui";
import { formatIDR, type Practitioner } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { ArrowRight, ArrowUpRight, Bookmark, Check, MapPin, Star } from "lucide-react";

export function PractitionerCard({ p, compact }: { p: Practitioner; compact?: boolean }) {
  const { navigate, saved, toggleSaved, compare, toggleCompare } = useApp();
  const isSaved = saved.includes(p.id);
  const isCompared = compare.includes(p.id);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(22,51,46,.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sand/60 hover:shadow-[0_18px_40px_-26px_rgba(22,51,46,.35)]">
      <div className={cn("relative overflow-hidden", compact ? "aspect-[4/3]" : "aspect-[16/11]")}>
        <img src={p.image} alt={`Foto ${p.name}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-black/10" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          <Badge tone="dark" className="border-white/15 bg-forest/70 text-[13px] backdrop-blur-sm">{p.category}</Badge>
          {p.instant && <Badge tone="sand" className="border-white/20 text-[13px]">Respons cepat</Badge>}
        </div>
        <button
          onClick={() => toggleSaved(p.id)}
          className={cn("absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition-colors", isSaved ? "border-sand bg-sand text-ink" : "border-white/30 bg-forest/30 text-white hover:bg-forest/50")}
          aria-label={isSaved ? `Hapus ${p.name} dari simpanan` : `Simpan ${p.name}`}
          aria-pressed={isSaved}
        >
          <Bookmark className={cn("h-3 w-3", isSaved && "fill-ink")} />
        </button>
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
          <span className="rounded-md bg-forest/55 px-1.5 py-1 text-[13px] font-medium text-cream backdrop-blur-sm">Profil contoh</span>
          <span className="flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-1 text-[13px] font-bold text-ink">
            <Star className="h-2.5 w-2.5 fill-sand text-sand" /> {p.rating} <span className="font-normal text-muted">({p.reviews})</span>
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-sans text-[15px] font-bold text-ink">{p.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-[14px] text-muted">{p.role}</p>
          </div>
          <button onClick={() => navigate(`praktisi/${p.id}`)} className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:bg-ink hover:text-cream" aria-label={`Lihat profil ${p.name}`}>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[14px] text-muted">
          <MapPin className="h-3 w-3 shrink-0 text-sand-deep" />
          <span className="truncate">{p.city} · {p.area}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <VerifyChip label="Identitas" state={p.verifiedIdentity} />
          <VerifyChip label="Portofolio" state={p.verifiedPortfolio} />
          <VerifyChip label="Budaya" state={p.verifiedKnowledge} />
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-2.5">
          <div>
            <div className="text-[12px] uppercase tracking-wide text-muted">Mulai dari</div>
            <div className="text-[15px] font-bold text-ink">{formatIDR(p.priceFrom, true)}<span className="text-[13px] font-normal text-muted"> / layanan</span></div>
          </div>
          <button
            onClick={() => toggleCompare(p.id)}
            className={cn("text-[13px] font-semibold underline decoration-dotted underline-offset-2", isCompared ? "text-sand-deep" : "text-muted hover:text-ink")}
          >
            {isCompared ? "Dipilih banding" : "Bandingkan"}
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-1.5">
          <Button size="sm" onClick={() => navigate(`praktisi/${p.id}`)} trailing={<ArrowRight className="h-3 w-3" />}>
            Lihat profil
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate(`praktisi/${p.id}?tanya=1`)} aria-label={`Kirim pertanyaan ke ${p.name}`}>
            Tanya
          </Button>
        </div>
      </div>
    </article>
  );
}

function VerifyChip({ label, state }: { label: string; state: "verified" | "review" | "revision" }) {
  if (state === "verified") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded border border-[#D2E1D6] bg-[#F1F6F2] px-1.5 py-0.5 text-[12px] font-semibold text-[#2B5949]">
        <Check className="h-2 w-2" strokeWidth={3} /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-[#F0E0C1] bg-[#FBF3E3] px-1.5 py-0.5 text-[12px] font-semibold text-[#855A16]">
      {label} · tinjau
    </span>
  );
}
