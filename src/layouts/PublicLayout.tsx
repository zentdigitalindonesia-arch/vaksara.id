import { Logo } from "@/components/brand";
import { Alert, Button, Field, Input, Modal, PasswordInput } from "@/components/ui";
import { demoAccounts, demoLogin } from "@/utils/demo-login";
import { liveEnabled } from "@/utils/supabase";
import { startPlanTarget, useLive } from "@/LiveContext";
import { LiveAuthForm } from "@/components/LiveAuth";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { ArrowRight, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import React, { useState } from "react";

const publicNav = [
  { label: "Beranda", href: "beranda" },
  { label: "Pelaku Budaya", href: "jelajahi" },
  { label: "Layanan", href: "layanan" },
  { label: "Pengetahuan", href: "pengetahuan" },
  { label: "Tentang", href: "tentang" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { route, navigate, setAuthMode, authMode } = useApp();
  const { live, profile } = useLive();
  const home = profile?.role === "vendor" ? "vendor/ringkasan" : "planner";
  const startPlan = () => { if (live) navigate(home); else if (startPlanTarget() === "daftar") setAuthMode("daftar"); else navigate("planner"); };
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = route.split("?")[0];
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className="border-b border-sand/30 bg-ink text-cream">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <p className="flex min-w-0 items-center gap-2 text-[14px] leading-tight sm:text-[14px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-sand/40 bg-sand/10 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-sand">
              <Sparkles className="h-2.5 w-2.5" /> {liveEnabled ? "VAKSARA 2.0" : "Prototipe 2.0"}
            </span>
            <span className="min-w-0 flex-1 truncate text-cream/75">{liveEnabled ? "Akun dan data tersimpan di server. Dana Amanah dan tanda tangan elektronik masih tahap uji." : "Identitas, pembayaran, dan tanda tangan elektronik ditampilkan sebagai simulasi."}</span>
          </p>
          <button onClick={() => navigate("pusat-bantuan")} className="hidden shrink-0 text-[14px] font-semibold text-sand hover:text-cream sm:block">
            Pusat Bantuan
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <button onClick={() => navigate("beranda")} aria-label="VAKSARA — Beranda" className="shrink-0">
            <Logo />
          </button>
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Navigasi utama">
            {publicNav.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  "relative whitespace-nowrap rounded-md px-2 py-2 text-[14px] font-semibold transition-colors",
                  path === item.href ? "text-ink" : "text-ink-soft/80 hover:bg-white/60 hover:text-ink"
                )}
              >
                {item.label}
                {path === item.href && <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-sand" />}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 xl:flex">
            <Button variant="ghost" size="sm" onClick={() => (live ? navigate(home) : setAuthMode("masuk"))}>
              {live ? "Ruang saya" : "Masuk"}
            </Button>
            {!live && <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => navigate("demo")}>
              Coba demo
            </Button>}
            <Button size="sm" className="whitespace-nowrap" onClick={startPlan} trailing={<ArrowRight className="h-3.5 w-3.5" />}>
              Mulai rencana
            </Button>
          </div>
          <div className="flex items-center gap-1.5 xl:hidden">
            <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => (live ? navigate(home) : setAuthMode("masuk"))}>
              {live ? "Ruang saya" : "Masuk"}
            </Button>
            <Button size="sm" onClick={startPlan}>
              Mulai
            </Button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-0.5 rounded-lg border border-line bg-white p-2 text-ink"
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-line bg-cream px-4 pb-4 xl:hidden">
            <nav className="flex flex-col py-1">
              {publicNav.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-3 text-left text-[15px] font-semibold",
                    path === item.href ? "bg-white text-ink" : "text-ink-soft hover:bg-white/70"
                  )}
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 text-sand-deep" />
                </button>
              ))}
            </nav>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Button variant="secondary" onClick={() => { if (live) navigate(home); else setAuthMode("masuk"); setMobileOpen(false); }}>{live ? "Ruang saya" : "Masuk"}</Button>
              <Button onClick={() => { setAuthMode("daftar"); setMobileOpen(false); }}>Daftar</Button>
              {!live && <Button className="col-span-2" variant="gold" onClick={() => { navigate("demo"); setMobileOpen(false); }}>Coba demo terpandu</Button>}
            </div>
          </div>
        )}
      </header>

      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <Footer onAuth={setAuthMode} />
      <AuthModal open={authMode !== null} mode={authMode ?? "masuk"} onClose={() => setAuthMode(null)} />
    </div>
  );
}

export function Footer({ onAuth }: { onAuth?: (m: "masuk" | "daftar") => void }) {
  const { navigate, setAuthMode } = useApp();
  const goAuth = (m: "masuk" | "daftar") => (onAuth ? onAuth(m) : setAuthMode(m));
  return (
    <footer className="border-t border-line bg-[#F1EDE3]">
      <div className="mx-auto max-w-[1240px] px-4 pb-6 pt-12 sm:px-6">
        <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Ekosistem budaya dan pernikahan yang menghubungkan keluarga dengan pelaku budaya, praktik yang dapat dipercaya, dan kerja sama yang transparan.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-cream/70 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sand-deep" />
              <p className="text-[14px] leading-relaxed text-ink-soft">
                <strong className="font-bold">Prinsip kami:</strong> tradisi dihidupkan oleh manusia dan komunitasnya — bukan diseragamkan untuk pasar.
              </p>
            </div>
          </div>
          <FooterCol
            title="Jelajahi"
            links={[
              ["Pelaku budaya", "jelajahi"],
              ["Layanan pernikahan", "layanan"],
              ["Pengetahuan budaya", "pengetahuan"],
              ["Rencana Acara", "planner"],
            ]}
            onClick={navigate}
          />
          <FooterCol
            title="Untuk pelaku budaya"
            links={[
              ["Daftar sebagai vendor", "vendor/daftar"],
              ["Panduan screening", "vendor/verifikasi"],
              ["Vendor Pro", "harga"],
              ["Pengaduan & bantuan", "sengketa"],
            ]}
            onClick={navigate}
          />
          <FooterCol
            title="VAKSARA"
            links={[
              ["Tentang kami", "tentang"],
              ["Paket & biaya", "harga"],
              ["Pusat Bantuan", "pusat-bantuan"],
              ["VAKSARA Trust", "trust"],
            ]}
            onClick={navigate}
          />
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 text-[14px] text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 VAKSARA. Prototipe produk. Makassar, Sulawesi Selatan.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={() => goAuth("masuk")} className="hover:text-ink">Masuk</button>
            <button onClick={() => goAuth("daftar")} className="hover:text-ink">Daftar</button>
            <button onClick={() => navigate("pusat-bantuan")} className="hover:text-ink">Bantuan</button>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span>Bahasa Indonesia</span>
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-line/80 bg-cream/50 px-3 py-2 text-[13px] leading-relaxed text-muted">
          Catatan prototipe: seluruh data keuangan, identitas, dan tanda tangan bersifat ilustratif. VAKSARA tidak menyimpan dana di rekeningnya sendiri dan tidak memberikan putusan hukum. Dana Amanah direncanakan melalui rekening penampung mitra pembayaran berizin dan hanya cair dengan persetujuan dua pihak; integrasi pembayaran dan tanda tangan elektronik bersertifikat menyusul pada tahap berikutnya.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, onClick }: { title: string; links: [string, string][]; onClick: (to: string) => void }) {
  return (
    <div>
      <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-ink">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            <button onClick={() => onClick(to)} className="text-left text-[15px] font-medium text-muted transition-colors hover:text-ink">
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoLogin({ onDone }: { onDone: (home: string) => void }) {
  const { toast } = useApp();
  const [id, setId] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState("");
  const login = (e?: React.FormEvent) => {
    e?.preventDefault();
    const account = demoLogin(id, password);
    if (!account) { setError("Nama pengguna atau kata sandi tidak cocok. Gunakan salah satu akun demo di bawah."); return; }
    setError(""); setPassword(""); toast(`Masuk sebagai ${account.name}.`, "success", "Berhasil masuk"); onDone(account.home);
  };
  return <>
    <form onSubmit={login} className="space-y-3" aria-label="Masuk akun demo">
      <Field label="Nama pengguna demo"><Input aria-label="Nama pengguna" autoComplete="username" value={id} onChange={e => setId(e.target.value)} placeholder="keluarga" /></Field>
      <Field label="Kata sandi demo"><PasswordInput aria-label="Kata sandi" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></Field>
      {error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{error}</p>}
      <Button type="submit" full variant={liveEnabled ? "secondary" : "primary"}>{liveEnabled ? "Masuk akun demo" : "Masuk"}</Button>
    </form>
    <div className="mt-4 rounded-2xl border border-line bg-cream p-3">
      <p className="text-[13px] font-bold text-ink">Akun demo (kata sandi semua: <code className="rounded bg-white px-1">vaksara2026</code>)</p>
      <ul className="mt-2 space-y-1.5">{demoAccounts.map(a => <li key={a.username} className="flex items-center justify-between gap-2 text-[13px]"><span><b className="text-ink">{a.username}</b> <span className="text-muted">· {a.label}</span></span><button type="button" onClick={() => { setId(a.username); setPassword(a.password); setError(""); }} className="shrink-0 rounded-full bg-white px-2.5 py-1 font-semibold text-ink ring-1 ring-line hover:ring-ink">Isi otomatis</button></li>)}</ul>
    </div>
  </>;
}

export function AuthModal({ open, mode, onClose }: { open: boolean; mode: "masuk" | "daftar"; onClose: () => void }) {
  const { navigate } = useApp();
  const [tab, setTab] = useState<"akun" | "demo">("akun");
  const go = (route: string) => { onClose(); navigate(route); };
  if (liveEnabled) return <Modal open={open} onClose={onClose} title={mode === "daftar" ? "Daftar ke VAKSARA" : "Masuk ke VAKSARA"} description={tab === "akun" || mode === "daftar" ? "Akun Anda tersimpan aman di server. Data dapat dibuka dari HP maupun komputer." : "Akun demo berisi data contoh dan hanya tersimpan di browser ini."}>
    {mode === "masuk" && <div role="tablist" aria-label="Jenis akun" className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-cream p-1">{([["akun", "Akun VAKSARA"], ["demo", "Coba akun demo"]] as const).map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cn("min-h-10 rounded-full text-[13px] font-semibold", tab === v ? "bg-ink text-cream" : "text-ink-soft")}>{l}</button>)}</div>}
    {tab === "akun" || mode === "daftar" ? <LiveAuthForm key={mode} initial={mode} /> : <DemoLogin onDone={go} />}
  </Modal>;
  if (mode === "masuk") return <Modal open={open} onClose={onClose} title="Masuk ke VAKSARA" description="Mode demo: gunakan akun contoh di bawah. Tidak ada data pribadi yang dikirim ke server.">
    <DemoLogin onDone={go} />
    <p className="mt-3 text-center text-[13px] text-muted">Belum punya akun? <button type="button" className="font-semibold text-ink underline" onClick={() => go("akun/daftar")}>Daftar sebagai keluarga</button> atau <button type="button" className="font-semibold text-ink underline" onClick={() => go("vendor/daftar")}>sebagai pelaku budaya</button></p>
  </Modal>;
  return <Modal open={open} onClose={onClose} title="Untuk apa Anda menggunakan VAKSARA?" description="Pilih peran agar langkah berikutnya sesuai kebutuhan Anda."><div className="space-y-3">
    <Button full variant="secondary" onClick={() => go("akun/daftar")}>Calon pengantin / keluarga</Button><p className="text-xs text-muted">Cari layanan, susun rangkaian acara, dan kelola kerja sama.</p>
    <Button full variant="secondary" onClick={() => go("vendor/daftar")}>Vendor / pelaku budaya</Button><p className="text-xs text-muted">Terima permintaan, kirim penawaran, dan kelola layanan.</p>
    <Alert tone="info" title="Demo lokal">Pendaftaran menggunakan simulasi OTP email dan WhatsApp. Ingin langsung mencoba? Pilih Masuk dan gunakan akun demo.</Alert>
  </div></Modal>;
}

export function PublicContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6", className)}>{children}</div>;
}
