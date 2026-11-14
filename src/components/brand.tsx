import { cn } from "@/utils/cn";

export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const ink = tone === "dark" ? "#16332E" : "#F7F4ED";
  const accent = "#C1A06E";
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill={tone === "dark" ? "#16332E" : "#F7F4ED"} />
      <path d="M11 12.5 20 28l9-15.5" fill="none" stroke={tone === "dark" ? "#F7F4ED" : ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.3 12.5 20 20.6l4.7-8.1" fill="none" stroke={accent} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="31.4" r="1.35" fill={accent} />
      <path d="M8.4 8.4h4.1M27.5 8.4h4.1M8.4 31.6v-4M31.6 31.6v-4" stroke={accent} strokeWidth="1" opacity=".65" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark tone={tone} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[1.32rem] font-semibold tracking-[0.16em]",
              tone === "dark" ? "text-ink" : "text-cream"
            )}
          >
            VAKSARA
          </span>
          <span
            className={cn(
              "mt-1.5 hidden text-[9px] font-semibold uppercase tracking-[0.22em] sm:block",
              tone === "dark" ? "text-muted" : "text-cream/60"
            )}
          >
            Budaya · Pernikahan · Amanah
          </span>
        </span>
      )}
    </span>
  );
}

export function Motif({
  className,
  type = "diamond",
  opacity = 0.18,
}: {
  className?: string;
  type?: "diamond" | "weave" | "arch";
  opacity?: number;
}) {
  if (type === "weave") {
    return (
      <svg className={cn("pointer-events-none absolute", className)} viewBox="0 0 320 320" fill="none" aria-hidden="true" style={{ opacity }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <path d={`M${-60 + i * 44} 340 L${110 + i * 44} 20`} stroke="currentColor" strokeWidth="1" />
            <path d={`M${100 + i * 44} 340 L${-70 + i * 44} 20`} stroke="currentColor" strokeWidth="1" />
          </g>
        ))}
      </svg>
    );
  }
  if (type === "arch") {
    return (
      <svg className={cn("pointer-events-none absolute", className)} viewBox="0 0 400 400" fill="none" aria-hidden="true" style={{ opacity }}>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${70 + i * 26} 340 V${200 - i * 12} a${60 + i * 26} ${60 + i * 26} 0 0 1 ${120 + i * 52} 0 V340`}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>
    );
  }
  return (
    <svg className={cn("pointer-events-none absolute", className)} viewBox="0 0 300 300" fill="none" aria-hidden="true" style={{ opacity }}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 12}, ${i * 12})`}>
          <path d="M150 20 280 150 150 280 20 150Z" stroke="currentColor" strokeWidth="1" />
          <path d="M150 55 245 150 150 245 55 150Z" stroke="currentColor" strokeWidth="0.7" />
          <circle cx="150" cy="150" r="8" stroke="currentColor" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <div
            className={cn(
              "mb-3 flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.2em] text-sand-deep",
              align === "center" && "justify-center"
            )}
          >
            <span className="h-px w-6 bg-sand" />
            {eyebrow}
            <span className="h-px w-6 bg-sand" />
          </div>
        )}
        <h2 className="text-balance text-[1.85rem] font-semibold leading-[1.14] text-ink sm:text-[2.45rem]">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted md:text-[16px]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PrototypeNote({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-sand/40 bg-sand-light/50 px-3 py-2 text-[14px] leading-relaxed text-ink-soft", className)}>
      <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 9v5M10 6.4v.2" strokeLinecap="round" />
      </svg>
      <span>{children ?? "Data pada prototipe ini bersifat ilustratif. Integrasi identitas, tanda tangan elektronik, dan pembayaran gateway belum aktif."}</span>
    </div>
  );
}
