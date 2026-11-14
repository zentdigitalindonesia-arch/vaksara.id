import { useApp, type ToastTone } from "@/store";
import { cn } from "@/utils/cn";
import { ArrowLeft, BookOpen, Check, Eye, EyeOff, ChevronRight, CircleAlert, CircleCheck, FileText, Image as ImageIcon, Info, Loader2, ShieldCheck, UploadCloud, X } from "lucide-react";
import React, { useEffect } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger" | "soft" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-forest shadow-[0_6px_16px_-8px_rgba(18,58,51,.55)] border border-ink",
  secondary: "bg-white text-ink border border-line shadow-[0_1px_2px_rgba(18,58,51,.05)] hover:border-ink/40 hover:bg-white",
  outline: "bg-transparent text-ink border border-ink/25 hover:border-ink hover:bg-ink/5",
  ghost: "bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink border border-transparent",
  gold: "bg-sand text-[#1D2B26] hover:bg-[#C39340] border border-sand shadow-[0_6px_16px_-8px_rgba(165,118,31,.6)]",
  danger: "bg-[#9C4034] text-white hover:bg-[#86372C] border border-[#9C4034]",
  soft: "bg-sage text-ink border border-transparent hover:bg-[#DCE8DF]",
  link: "bg-transparent text-ink p-0 h-auto underline underline-offset-4 decoration-sand hover:decoration-ink border-0",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[14px] rounded-full gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-full gap-2",
  lg: "h-12 px-7 text-[16px] rounded-full gap-2",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  leading,
  trailing,
  loading,
  full,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  loading?: boolean;
  full?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        full && "w-full",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leading}
      {children}
      {trailing}
    </button>
  );
}

const toneStyles: Record<string, string> = {
  green: "bg-[#EAF1EC] text-[#2B5949] border-[#D2E1D6]",
  sand: "bg-sand-light text-[#7A5A2E] border-[#E6D8BE]",
  red: "bg-[#F9ECE9] text-[#933A2F] border-[#F0D5D0]",
  blue: "bg-[#EAF1F5] text-[#33607A] border-[#D5E3EB]",
  neutral: "bg-[#F1EFE9] text-ink-soft border-[#E6E1D6]",
  dark: "bg-ink text-cream border-ink",
  outline: "bg-transparent text-ink-soft border-line",
  amber: "bg-[#FBF1DE] text-[#855A16] border-[#F0E0C1]",
};

export function Badge({
  children,
  tone = "neutral",
  dot,
  className,
  icon,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneStyles | string;
  dot?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[14px] font-semibold leading-none",
        toneStyles[tone] ?? toneStyles.neutral,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone === "green" ? "bg-[#3E7A5F]" : tone === "red" ? "bg-[#B45245]" : tone === "amber" || tone === "sand" ? "bg-[#A97C2F]" : tone === "blue" ? "bg-[#477C96]" : "bg-muted")} />}
      {icon}
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  const map: Record<string, string> = {
    Aktif: "green",
    Terverifikasi: "green",
    Tersedia: "green",
    Disetujui: "green",
    Selesai: "green",
    Hadir: "green",
    Lunas: "green",
    "Selesai dengan Kesepakatan": "green",
    "Menunggu Persetujuan": "amber",
    "Menunggu BAST": "amber",
    "Menunggu Tanggapan": "amber",
    "Menunggu tinjauan": "amber",
    Menunggu: "amber",
    Terbatas: "amber",
    Draf: "neutral",
    "Draft": "neutral",
    "Belum dikirim": "neutral",
    "Tidak hadir": "red",
    "Tidak Terselesaikan": "red",
    Ditolak: "red",
    Sengketa: "red",
    "Perlu perbaikan": "red",
    Penuh: "red",
    "Jatuh tempo": "red",
    Klarifikasi: "blue",
    "Fasilitasi Penyelesaian": "blue",
    Diajukan: "blue",
    "Dalam tinjauan": "amber",
    "Perlu koreksi": "red",
    Terkirim: "green",
    Tercatat: "blue",
    "Tercatat manual": "blue",
    Tertunda: "amber",
    "Belum ditugaskan": "neutral",
  };
  return map[status] ?? "neutral";
}

export function Card({ children, className, hover, id }: { children: React.ReactNode; className?: string; hover?: boolean; id?: string }) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-[20px] border border-line/80 bg-surface shadow-[0_1px_2px_rgba(18,58,51,0.04),0_12px_30px_-22px_rgba(18,58,51,0.28)]",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:border-sand/50 hover:shadow-[0_16px_40px_-24px_rgba(22,51,46,.3)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <Card className={cn("min-w-0", className)} id={id}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 px-4 py-3.5 sm:px-5">
          <div>
            {title && <h3 className="font-sans text-[16px] font-bold tracking-tight text-ink">{title}</h3>}
            {subtitle && <p className="mt-1 text-[14px] leading-snug text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("min-w-0 p-4 sm:p-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { label: string; onClick: () => void };
}) {
  const { navigate } = useApp();
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <button
            onClick={() => (back.onClick ? back.onClick() : navigate("trust"))}
            className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {back.label}
          </button>
        )}
        {eyebrow && <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-sand-deep">{eyebrow}</div>}
        <h1 className="text-balance font-display text-[1.6rem] font-semibold leading-tight text-ink sm:text-[1.9rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
  onClick,
  progress,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "green" | "sand" | "red" | "blue";
  onClick?: () => void;
  progress?: number;
  trend?: string;
  className?: string;
}) {
  const iconBg: Record<string, string> = {
    neutral: "bg-[#F1EFE9] text-ink-soft",
    green: "bg-[#EAF1EC] text-[#2B5949]",
    sand: "bg-sand-light text-[#8A6831]",
    red: "bg-[#F9ECE9] text-[#933A2F]",
    blue: "bg-[#EAF1F5] text-[#33607A]",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-line/90 bg-surface p-3.5 text-left shadow-[0_1px_2px_rgba(22,51,46,0.03)]",
        onClick && "transition-all hover:-translate-y-0.5 hover:border-sand/60 hover:shadow-[0_12px_30px_-22px_rgba(22,51,46,.4)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-semibold leading-tight text-muted">{label}</span>
        {icon && <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconBg[tone])}>{icon}</span>}
      </div>
      <div className="mt-2 text-[1.15rem] font-bold leading-none tracking-tight text-ink sm:text-[1.28rem]">{value}</div>
      {helper && <div className="mt-1.5 text-[14px] leading-snug text-muted">{helper}</div>}
      {typeof progress === "number" && <Progress value={progress} className="mt-2.5" tone={tone === "neutral" ? "dark" : tone} />}
      {trend && <div className="mt-1.5 text-[14px] font-semibold text-[#2B5949]">{trend}</div>}
    </Tag>
  );
}

export function Progress({
  value,
  tone = "dark",
  className,
  height = "h-1.5",
}: {
  value: number;
  tone?: "dark" | "sand" | "green" | "red" | "blue" | "warn";
  className?: string;
  height?: string;
}) {
  const tones: Record<string, string> = {
    dark: "bg-ink",
    sand: "bg-sand",
    green: "bg-[#4C8068]",
    red: "bg-[#B45245]",
    blue: "bg-[#5B87A0]",
    warn: "bg-[#C08D3B]",
  };
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-[#EAE5DA]", height, className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-500", tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[14px] font-semibold text-ink">
        {label}
        {required && <span className="text-[#A4453B]">*</span>}
        {hint && <span className="ml-auto text-[14px] font-normal text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[14px] font-medium text-[#A4453B]">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-[9px] border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-[0_1px_1px_rgba(22,51,46,.02)] outline-none transition-colors placeholder:text-[#A9B0AB] focus:border-sand-deep focus:ring-2 focus:ring-sand/20 disabled:bg-[#F4F1E9] disabled:text-muted";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, className)} />;
}
/** Kolom kata sandi dengan tombol mata untuk menampilkan/menyembunyikan isinya. */
export function PasswordInput({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = React.useState(false);
  return <span className="relative block">
    <input {...props} type={show ? "text" : "password"} className={cn(inputClass, "pr-12", className)} />
    <button type="button" onClick={e => { e.preventDefault(); setShow(v => !v); }} aria-label={show ? "Sembunyikan sandi" : "Lihat sandi"} aria-pressed={show} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </span>;
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[90px] resize-y leading-relaxed", className)} />;
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236C7973%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_10px_center] bg-no-repeat pr-8", className)}>
      {children}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-2.5 text-[15px] leading-relaxed text-ink-soft", className)}>
      <span
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
          checked ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-sand-deep"
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      {label && <span className="text-[15px] font-medium text-ink">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", checked ? "bg-ink" : "bg-[#D6D0C3]")}
      >
        <span className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  eyebrow,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  eyebrow?: string;
  hideClose?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !hideClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, hideClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-[400px]", md: "max-w-[540px]", lg: "max-w-[720px]", xl: "max-w-[920px]" };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-[#0E2521]/55 backdrop-blur-[2px]" onClick={hideClose ? undefined : onClose} aria-label="Tutup dialog" tabIndex={-1} />
      <div className={cn("relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl", sizes[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {eyebrow && <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.18em] text-sand-deep">{eyebrow}</div>}
            <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-ink">{title}</h3>
            {description && <p className="mt-1 text-[15px] leading-relaxed text-muted">{description}</p>}
          </div>
          {!hideClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-cream hover:text-ink" aria-label="Tutup">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-[#FBFAF6] px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "primary",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-sand/40 bg-sand-light/50 p-3">
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6831]" />
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Tindakan ini dicatat pada riwayat aktivitas. Pastikan Anda sudah membaca ringkasan dan konsekuensinya.
          </p>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Modal>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  icon,
  className,
  action,
}: {
  tone?: "info" | "warn" | "error" | "success" | "trust";
  title?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const tones = {
    info: "border-[#D5E3EB] bg-[#F2F7F9] text-[#2F596E]",
    warn: "border-[#F0E0C1] bg-[#FCF6E9] text-[#79551A]",
    error: "border-[#F0D5D0] bg-[#FCF1EE] text-[#8E3A2E]",
    success: "border-[#D2E1D6] bg-[#F1F6F2] text-[#2B5949]",
    trust: "border-line bg-[#F8F6F1] text-ink-soft",
  };
  const defaultIcon =
    tone === "error" ? <CircleAlert className="h-4 w-4" /> : tone === "warn" ? <CircleAlert className="h-4 w-4" /> : tone === "success" ? <CircleCheck className="h-4 w-4" /> : tone === "trust" ? <ShieldCheck className="h-4 w-4" /> : <Info className="h-4 w-4" />;
  return (
    <div className={cn("rounded-xl border p-3 text-[15px] leading-relaxed", tones[tone], className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-px shrink-0">{icon ?? defaultIcon}</span>
        <div className="min-w-0 flex-1">
          {title && <div className="mb-0.5 text-[15px] font-bold">{title}</div>}
          {children}
        </div>
        {action}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-[#FBFAF6] px-5 text-center", compact ? "py-7" : "py-12")}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-sand-deep">{icon ?? <FileText className="h-5 w-5" />}</span>
      <p className="text-[16px] font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[15px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  variant = "underline",
  className,
}: {
  items: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  variant?: "underline" | "pill";
  className?: string;
}) {
  if (variant === "pill") {
    return (
      <div className={cn("scrollbar-thin flex gap-1 overflow-x-auto rounded-xl border border-line bg-[#F2EFE6] p-1", className)}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-semibold transition-colors",
              active === it.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[13px]", active === it.id ? "bg-sand-light text-[#7A5A2E]" : "bg-[#E5E0D4] text-muted")}>{it.count}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("scrollbar-thin flex gap-5 overflow-x-auto border-b border-line", className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 pb-2.5 pt-1 text-[15px] font-semibold transition-colors",
            active === it.id ? "text-ink" : "text-muted hover:text-ink-soft"
          )}
        >
          {it.label}
          {typeof it.count === "number" && <span className="rounded-full bg-sand-light px-1.5 py-0.5 text-[13px] font-bold text-[#7A5A2E]">{it.count}</span>}
          {active === it.id && <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-ink" />}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  const sizes = { xs: "h-6 w-6 text-[12px]", sm: "h-8 w-8 text-[13px]", md: "h-10 w-10 text-[14px]", lg: "h-14 w-14 text-sm", xl: "h-24 w-24 text-xl" };
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-sand-light font-bold text-[#7A5A2E]", sizes[size], className)}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" /> : initials}
    </span>
  );
}

export function VerificationBadge({ kind, state }: { kind: "identity" | "portfolio" | "knowledge"; state: "verified" | "review" | "revision" }) {
  const config = {
    identity: { label: "Identitas", icon: <ShieldCheck className="h-3 w-3" /> },
    portfolio: { label: "Portofolio", icon: <ImageIcon className="h-3 w-3" /> },
    knowledge: { label: "Pengetahuan budaya", icon: <BookOpen className="h-3 w-3" /> },
  }[kind];
  if (state === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#D2E1D6] bg-[#EDF4EF] px-2 py-1 text-[13px] font-semibold text-[#2B5949]">
        {config.icon}
        {config.label}
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#F0E0C1] bg-[#FBF3E3] px-2 py-1 text-[13px] font-semibold text-[#855A16]">
        {config.icon}
        {config.label} · ditinjau
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E3E0D8] bg-[#F4F2EC] px-2 py-1 text-[13px] font-semibold text-muted">
      {config.icon}
      {config.label} · perlu perbaikan
    </span>
  );
}

export function Spinner({ label = "Memuat…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-10 text-[15px] text-muted", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-sand-deep" /> {label}
    </div>
  );
}

export function UploadBox({
  title = "Unggah bukti atau lampiran",
  hint = "PDF, JPG, atau PNG · maksimal 10 MB per berkas",
  files = [],
  onAdd,
  onRemove,
  compact,
}: {
  title?: string;
  hint?: string;
  files?: { name: string; size: string }[];
  onAdd?: () => void;
  onRemove?: (name: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "group flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#CFC6B4] bg-[#FBFAF6] px-4 text-center transition-colors hover:border-sand-deep hover:bg-sand-light/30",
          compact ? "py-4" : "py-6"
        )}
      >
        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-sand-deep transition-transform group-hover:-translate-y-0.5">
          <UploadCloud className="h-4 w-4" />
        </span>
        <span className="text-[15px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 text-[14px] text-muted">{hint}</span>
      </button>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2 text-[14px]">
              <FileText className="h-3.5 w-3.5 shrink-0 text-sand-deep" />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{f.name}</span>
              <span className="shrink-0 text-[13px] text-muted">{f.size}</span>
              {onRemove && (
                <button type="button" onClick={() => onRemove(f.name)} className="rounded p-0.5 text-muted hover:text-[#933A2F]" aria-label={`Hapus ${f.name}`}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StepDots({ steps, current, onStep }: { steps: string[]; current: number; onStep?: (i: number) => void }) {
  return (
    <div className="scrollbar-thin relative flex gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={s}
            onClick={() => onStep?.(i)}
            disabled={!onStep}
            className={cn(
              "group flex min-w-0 flex-1 flex-col gap-1.5 rounded-lg px-1.5 pb-1.5 pt-1 text-left transition-colors md:min-w-[76px]",
              onStep && "hover:bg-cream"
            )}
          >
            <span className={cn("h-[3px] w-full rounded-full transition-colors", done ? "bg-ink" : active ? "bg-sand" : "bg-[#E7E1D5]")} />
            <span className={cn("flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide", active ? "text-ink" : done ? "text-ink-soft" : "text-muted/70")}>
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px]", done ? "bg-ink text-cream" : active ? "bg-sand text-[#1D2B26]" : "border border-line text-muted")}>
                {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="truncate">{s}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ToastStack() {
  const { toasts, dismissToast } = useApp();
  const icons: Record<ToastTone, React.ReactNode> = {
    success: <CircleCheck className="h-4 w-4 text-[#4C8068]" />,
    error: <CircleAlert className="h-4 w-4 text-[#A4453B]" />,
    info: <Info className="h-4 w-4 text-[#477C96]" />,
    warn: <CircleAlert className="h-4 w-4 text-[#A97C2F]" />,
  };
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:items-end">
      {toasts.map((t) => (
        <div key={t.id} className="animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-line bg-white p-3 shadow-[0_18px_50px_-20px_rgba(14,37,33,.4)]">
          <span className="mt-px shrink-0">{icons[t.tone]}</span>
          <div className="min-w-0 flex-1">
            {t.title && <div className="text-[14px] font-bold text-ink">{t.title}</div>}
            <div className="text-[14px] leading-relaxed text-ink-soft">{t.message}</div>
          </div>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 rounded p-0.5 text-muted hover:text-ink" aria-label="Tutup notifikasi">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function LinkArrow({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("group inline-flex items-center gap-1.5 text-[15px] font-bold text-ink transition-colors hover:text-sand-deep", className)}>
      {children}
      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
