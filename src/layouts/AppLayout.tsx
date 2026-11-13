import { useEventPlan } from "@/EventPlanContext";
import { useCooperation } from "@/CooperationContext";
import { caseRoute, nextView, visibleCases } from "@/utils/workspace";
import { nextStep } from "@/utils/next-step";
import { Logo, LogoMark } from "@/components/brand";
import { Avatar, Badge, Button } from "@/components/ui";
import { roleForRoute, useApp, type Role } from "@/store";
import { demoLogout, demoSession } from "@/utils/demo-login";
import { useLive } from "@/LiveContext";
import { cn } from "@/utils/cn";
import {
  Megaphone,
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  BookMarked,
  Building2,
  CalendarCheck,
  CalendarHeart,
  ChartNoAxesColumn,
  ChevronDown,
  CircleHelp,
  FolderTree,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

type NavItem = { label: string; route: string; icon: React.ReactNode; badge?: number; exact?: boolean; match?: string[] };
type NavGroup = { title: string; items: NavItem[] };

// Menu sengaja ringkas: semua tahap kerja sama (permintaan, penawaran, perjanjian, pembayaran, BAST, masalah)
// dibuka dari satu menu "Kerja sama" dan berpindah lewat tab di halamannya.
const coupleNav: NavGroup[] = [
  {
    title: "Acara saya", items: [
      { label: "Ringkasan", route: "planner", icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      { label: "Rencana acara", route: "planner/rencana", icon: <CalendarHeart className="h-4 w-4" /> },
      { label: "Cari pelaku budaya", route: "jelajahi", icon: <Search className="h-4 w-4" /> },
      { label: "Permintaan terbuka", route: "planner/permintaan-terbuka", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Kerja sama", route: "planner/kerjasama", icon: <HeartHandshake className="h-4 w-4" />, match: ["planner/alur", "planner/vendor", "planner/penawaran", "trust", "planner/pembayaran", "planner/pelaksanaan", "bast", "sengketa", "perjanjian"] },
    ]
  },
  {
    title: "Bantuan", items: [
      { label: "Demo terpandu", route: "demo", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Verifikasi kontak", route: "akun/kontak", icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Pusat bantuan", route: "bantuan", icon: <LifeBuoy className="h-4 w-4" /> },
    ]
  },
];

const vendorNav: NavGroup[] = [
  {
    title: "Usaha saya",
    items: [
      { label: "Kerja sama", route: "vendor/ringkasan", icon: <HeartHandshake className="h-4 w-4" />, match: ["vendor/alur", "vendor/permintaan", "vendor/penawaran", "vendor/kontrak", "vendor/pembayaran", "vendor/pelaksanaan", "vendor/bast", "vendor/pengaduan"] },
      { label: "Peluang", route: "vendor/peluang", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Profil & portofolio", route: "vendor/profil", icon: <Building2 className="h-4 w-4" /> },
      { label: "Jadwal layanan", route: "vendor/jadwal", icon: <CalendarCheck className="h-4 w-4" /> },
      { label: "Status verifikasi", route: "vendor/verifikasi", icon: <BadgeCheck className="h-4 w-4" /> },
    ],
  },
  {
    title: "Bantuan",
    items: [
      { label: "Demo terpandu", route: "demo", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Verifikasi kontak", route: "vendor/kontak", icon: <ShieldCheck className="h-4 w-4" /> },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    title: "Trust Center",
    items: [
      { label: "Kerja sama & pengaduan", route: "admin/overview", icon: <HeartHandshake className="h-4 w-4" />, match: ["admin/alur", "admin/perjanjian", "admin/pengaduan"] },
      { label: "Screening pelaku budaya", route: "admin/screening", icon: <BadgeCheck className="h-4 w-4" /> },
      { label: "Moderasi konten budaya", route: "admin/moderasi", icon: <BookMarked className="h-4 w-4" /> },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { label: "Pengguna", route: "admin/pengguna", icon: <Users className="h-4 w-4" /> },
      { label: "Direktori", route: "admin/direktori", icon: <FolderTree className="h-4 w-4" /> },
      { label: "Audit trail", route: "admin/audit", icon: <ScrollText className="h-4 w-4" /> },
      { label: "Analitik", route: "admin/analitik", icon: <ChartNoAxesColumn className="h-4 w-4" /> },
    ],
  },
];

const isActive = (item: NavItem, path: string) => item.exact ? path === item.route : [item.route, ...(item.match ?? [])].some((r) => path === r || path.startsWith(r + "/"));

const roleMeta: Record<Role, { label: string; sub: string; nav: NavGroup[]; name: string; initials: string; home: string }> = {
  public: { label: "Publik", sub: "VAKSARA", nav: [], name: "Tamu", initials: "VA", home: "beranda" },
  couple: { label: "Ruang Keluarga", sub: "Nurul & Fikri", nav: coupleNav, name: "Nurul Amalia", initials: "NA", home: "planner" },
  vendor: { label: "Ruang Pelaku Budaya", sub: "Sanggar Demo Batara", nav: vendorNav, name: "Hj. Andi Nurhaeni", initials: "NA", home: "vendor/ringkasan" },
  admin: { label: "Trust Center", sub: "Akses terbatas", nav: adminNav, name: "Rani Saputri", initials: "RS", home: "admin/overview" },
};

function findTitle(role: Role, route: string) {
  const base = route.split("?")[0];
  for (const g of roleMeta[role].nav) {
    const found = g.items.find((i) => isActive(i, base));
    if (found) return found.label;
  }
  if (base.startsWith("perjanjian/baru")) return "Buat Perjanjian";
  if (base.startsWith("perjanjian/")) return "Detail Perjanjian";
  if (base.startsWith("pengiriman/")) return "Pelacakan Layanan";
  if (base.startsWith("bast/")) return "BAST Digital";
  if (base.startsWith("sengketa")) return "Pusat Penyelesaian";
  if (base.startsWith("planner/tamu")) return "Daftar Tamu";
  if (base.startsWith("planner/rundown")) return "Rundown";
  if (base.startsWith("harga")) return "Paket & Biaya";
  return roleMeta[role].label;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { route, navigate } = useApp();
  const { plan } = useEventPlan();
  const role = roleForRoute(route);
  const { flow } = useCooperation();
  const actorOf = role === "vendor" ? "vendor" : role === "admin" ? "admin" : "couple";
  const cases = visibleCases(flow, actorOf);
  const notifications = [...cases].sort((a, b) => (b.history[b.history.length - 1]?.time ?? "").localeCompare(a.history[a.history.length - 1]?.time ?? "")).slice(0, 3).map(c => ({ id: c.id, title: c.vendor, detail: c.request, time: c.history[c.history.length - 1]?.time ?? "", tone: "blue", to: caseRoute(role === "vendor" ? "vendor" : role === "admin" ? "admin" : "couple", nextView(c), c.id) }));
  const requestedCase = new URLSearchParams(route.split("?")[1] ?? "").get("case") ?? (["perjanjian", "pengiriman", "bast", "sengketa"].includes(route.split("/")[0]) ? route.split("/")[1]?.split("?")[0] : undefined);
  const contextCase = cases.find(c => c.id === requestedCase);
  const { live, profile, listing, syncStatus, email, logout } = useLive();
  // Akun nyata: pemilih peran disembunyikan dan nama diambil dari profil akun.
  const session = live ? { role: profile?.role ?? "couple", name: profile?.full_name ?? "" } : demoSession();
  const signOut = () => { if (live) { logout(); return; } demoLogout(); navigate("beranda"); };
  const baseMeta = roleMeta[role];
  const demoOnly = ["demo", "akun/kontak", "vendor/kontak"];
  const meta = {
    ...baseMeta, sub: role === "couple" ? plan.name || "Acara Anda" : role === "vendor" && live ? listing?.name ?? "Lengkapi profil layanan" : baseMeta.sub,
    name: live ? profile?.full_name || email || "Akun VAKSARA" : role === "vendor" ? flow.accounts.vendor?.name ?? baseMeta.name : role === "couple" ? flow.accounts.couple?.name ?? baseMeta.name : baseMeta.name,
    nav: baseMeta.nav.map(group => ({ ...group, items: group.items.filter(item => !(live && demoOnly.includes(item.route))).map(item => live && item.route === "jelajahi" ? { ...item, route: "planner/pelaku" } : item).map(item => ({ ...item, badge: item.match ? cases.filter(c => nextStep(c).actor === actorOf).length || undefined : item.badge })) })),
  };
  const path = route.split("?")[0];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { notificationsRead, markNotificationsRead } = useApp();
  const title = findTitle(role, route);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setUserOpen(false);
  }, [route]);

  const sidebarInner = (
    <>
      <div className="flex h-[68px] items-center justify-between border-b border-white/10 px-4">
        <button onClick={() => navigate(meta.home)} aria-label="Ke beranda ruang kerja">
          <Logo tone="light" />
        </button>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-cream/60 hover:bg-white/10 hover:text-cream lg:hidden" aria-label="Tutup menu">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mx-3 mb-3 mt-3 rounded-xl border border-white/10 bg-white/[0.055] p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sand/20 text-sand">
            {role === "couple" ? <HeartHandshake className="h-3.5 w-3.5" /> : role === "vendor" ? <Store className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold text-cream">{meta.label}</div>
            <div className="truncate text-[13px] text-cream/50">{meta.sub}</div>
          </div>
        </div>
        {!session && (
          <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-white/10 pt-2.5" aria-label="Lihat sebagai">
            {([["couple", "planner/kerjasama", "Keluarga"], ["vendor", "vendor/ringkasan", "Pelaku"], ["admin", "admin/overview", "Peninjau"]] as const).map(([r, to, label]) => (
              <button key={r} onClick={() => navigate(to)} className={cn("rounded-md px-1 py-1.5 text-[13px] font-semibold", role === r ? "bg-sand text-ink" : "bg-white/5 text-cream/75 hover:bg-white/10")}>{label}</button>
            ))}
          </div>
        )}
        {role === "couple" && (
          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-[13px] text-cream/50">Kerja sama berjalan</span>
            <span className="rounded-full bg-sand/15 px-1.5 py-0.5 text-[12px] font-bold text-sand">{cases.filter(c => !["completed", "cancelled", "declined"].includes(c.phase)).length} kasus</span>
          </div>
        )}
        {role === "admin" && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/10 pt-2 text-[12px] text-cream/55">
            <ShieldCheck className="h-3 w-3 text-sand" /> Akses berbasis penugasan
          </div>
        )}
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-2.5 pb-4">
        {meta.nav.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="mb-1 px-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-cream/35">{group.title}</div>
            <nav className="space-y-0.5" aria-label={group.title}>
              {group.items.map((item) => {
                const active = isActive(item, path);
                return (
                  <button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[14px] font-medium transition-colors",
                      active ? "bg-white/[0.09] text-cream" : "text-cream/60 hover:bg-white/[0.05] hover:text-cream/90"
                    )}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-sand" />}
                    <span className={cn("shrink-0", active ? "text-sand" : "text-cream/45 group-hover:text-cream/75")}>{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {!!item.badge && (
                      <span className={cn("flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[12px] font-bold", active ? "bg-sand text-forest" : "bg-sand/20 text-sand")}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
        {role === "couple" && (
          <div className="mx-1 mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-sand">
              <Sparkles className="h-3 w-3" /> Rencana Anda
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-cream/70">{plan.name ? `${plan.name}${plan.date ? " · " + plan.date : ""}` : "Belum ada acara."}</p>
            <button onClick={() => navigate(plan.name ? "planner/rencana" : "planner/mulai")} className="mt-2 text-[13px] font-semibold text-sand underline-offset-2 hover:underline">{plan.name ? "Lihat rencana" : "Buat acara"}</button>
          </div>
        )}
      </div>
      <div className="border-t border-white/10 p-2.5">
        <div className="flex items-center gap-2 rounded-lg px-1.5 py-1.5">
          <Avatar name={meta.name} size="sm" className="border-white/20 bg-sand/20 text-sand" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold text-cream">{meta.name}</div>
            <div className="truncate text-[12px] text-cream/45">{live ? (syncStatus === "error" ? "Gagal menyimpan, mencoba lagi…" : syncStatus === "saving" ? "Menyimpan…" : "Akun VAKSARA · tersimpan") : role === "vendor" ? "Akun vendor demo" : role === "admin" ? "Trust Officer" : "Akun pengantin"}</div>
          </div>
          <button onClick={signOut} className="rounded-md p-1 text-cream/40 hover:bg-white/10 hover:text-cream" aria-label="Keluar">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1 rounded-lg bg-black/15 px-2 py-1.5 text-center text-[12px] leading-relaxed text-cream/40">
          {live ? "VAKSARA 2.0 · akun terverifikasi email" : "Prototipe VAKSARA · data ilustratif"}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden flex-col bg-ink text-cream transition-all duration-200 lg:flex", collapsed ? "w-[68px]" : "w-[232px]")}>
        {collapsed ? (
          <>
            <div className="flex h-[68px] items-center justify-center border-b border-white/10">
              <button onClick={() => setCollapsed(false)} aria-label="Buka sidebar"><LogoMark className="h-8 w-8" /></button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
              {meta.nav.flatMap((g) => g.items).map((item) => {
                const active = isActive(item, path);
                return (
                  <button key={item.route} onClick={() => navigate(item.route)} title={item.label} className={cn("mb-1 flex h-9 w-full items-center justify-center rounded-lg", active ? "bg-sand/20 text-sand" : "text-cream/55 hover:bg-white/5")}>
                    {item.icon}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          sidebarInner
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-forest/60 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />
          <aside className="relative flex h-full w-[268px] max-w-[82vw] flex-col bg-ink text-cream shadow-2xl">{sidebarInner}</aside>
        </div>
      )}

      <div className={cn("transition-all duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[232px]")}>
        <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between gap-3 border-b border-line bg-cream/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-line bg-white p-1.5 text-ink lg:hidden" aria-label="Buka menu">
              <Menu className="h-4 w-4" />
            </button>
            <button onClick={() => setCollapsed((v) => !v)} className="hidden rounded-md p-1.5 text-muted transition-colors hover:bg-white hover:text-ink lg:inline-flex" aria-label={collapsed ? "Buka sidebar" : "Ringkas sidebar"}>
              <PanelLeftClose className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
            <div className="hidden items-center gap-1.5 text-[14px] md:flex">
              <span className="font-medium text-muted">{meta.label}</span>
              <span className="text-muted/50">/</span>
              <span className="truncate font-bold text-ink">{title}</span>
            </div>
            <span className="truncate text-[15px] font-bold text-ink md:hidden">{title}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className={cn("relative hidden md:block", role === "couple" && "!hidden")}>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                placeholder="Cari dokumen, vendor, atau kasus…"
                className="h-8 w-[210px] rounded-lg border border-line bg-white pl-8 pr-2 text-[14px] text-ink outline-none placeholder:text-muted/80 focus:border-sand-deep xl:w-[260px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value;
                    if (value.trim()) navigate(role === "admin" ? "admin/pengaduan" : role === "vendor" ? "vendor/kontrak" : "trust");
                  }
                }}
                aria-label="Pencarian global"
              />
            </div>
            <button onClick={() => navigate("bantuan")} className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink sm:flex" aria-label="Bantuan">
              <CircleHelp className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); markNotificationsRead(); }}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink"
                aria-label="Notifikasi"
              >
                <Bell className="h-4 w-4" />
                {!notificationsRead && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#A4453B] ring-2 ring-cream" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 z-50 w-[300px] overflow-hidden rounded-xl border border-line bg-white shadow-xl sm:w-[340px]">
                  <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                    <span className="text-[15px] font-bold text-ink">Notifikasi</span>
                    <span className="text-[13px] text-muted">{notifications.length} terbaru</span>
                  </div>
                  <div className="divide-y divide-line/70">
                    {notifications.map((n) => (
                      <button key={n.id} onClick={() => { navigate(n.to); setNotifOpen(false); }} className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-cream">
                        <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.tone === "warn" ? "bg-[#C08D3B]" : n.tone === "blue" ? "bg-[#5B87A0]" : "bg-[#4C8068]")} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold leading-snug text-ink">{n.title}</span>
                          <span className="mt-0.5 block truncate text-[13px] text-muted">{n.detail}</span>
                          <span className="mt-1 block text-[12px] text-muted/80">{n.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setNotifOpen(false)} className="w-full border-t border-line py-2 text-[14px] font-semibold text-ink-soft hover:bg-cream">Tandai semua dibaca</button>
                </div>
              )}
            </div>
            <div className="mx-0.5 hidden h-5 w-px bg-line sm:block" />
            <div className="relative">
              <button onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }} className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 hover:bg-white" aria-label="Menu akun">
                <Avatar name={meta.name} size="sm" />
                <ChevronDown className="hidden h-3 w-3 text-muted sm:block" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-10 z-50 w-[240px] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                  <div className="border-b border-line px-3.5 py-3">
                    <div className="text-[15px] font-bold text-ink">{meta.name}</div>
                    <div className="mt-0.5 text-[13px] text-muted">{live ? email : `${meta.label} · mode prototipe`}</div>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => navigate("beranda")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-ink-soft hover:bg-cream"><ArrowLeftRight className="h-3.5 w-3.5" /> Situs publik</button>
                    <button onClick={() => navigate("bantuan")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-ink-soft hover:bg-cream"><LifeBuoy className="h-3.5 w-3.5" /> Pusat bantuan</button>
                    <button onClick={() => navigate(role === "admin" ? "admin/audit" : "planner/planner")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-ink-soft hover:bg-cream"><Settings className="h-3.5 w-3.5" /> {role === "admin" ? "Audit trail" : "Pengaturan acara"}</button>
                  </div>
                  {session ? (
                    <div className="border-t border-line px-2 py-2"><button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-cream"><LogOut className="h-3.5 w-3.5" /> {live ? "Keluar" : "Keluar dari akun demo"}</button></div>
                  ) : (
                    <div className="border-t border-line bg-[#FAF8F2] px-2 py-2">
                      <div className="mb-1 px-1 text-[12px] font-bold uppercase tracking-wider text-muted">Lihat sebagai</div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { r: "couple", to: "planner/kerjasama", label: "Keluarga" },
                          { r: "vendor", to: "vendor/ringkasan", label: "Pelaku" },
                          { r: "admin", to: "admin/overview", label: "Peninjau" },
                        ].map((x) => (
                          <button key={x.r} onClick={() => navigate(x.to)} className={cn("rounded-md border px-1 py-1 text-[13px] font-semibold", role === x.r ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink-soft hover:border-sand")}>
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {role === "vendor" && (
              <Button size="sm" className="ml-1 hidden sm:inline-flex" onClick={() => navigate(role === "vendor" ? "vendor/permintaan" : "perjanjian/baru")} leading={<Plus className="h-3.5 w-3.5" />}>
                {role === "vendor" ? "Permintaan" : "Buat Perjanjian"}
              </Button>
            )}
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1280px] overflow-x-clip px-3.5 pb-24 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:py-6">
          {role === "couple" && !["planner", "planner/rencana", "trust"].includes(path) && (
            <div className="mb-4 hidden flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 md:flex">
              <div className="flex items-center gap-2 text-[14px] text-muted">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-cream">{meta.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "VA"}</span>
                <span>{contextCase ? "Kerja sama: " : live ? "Akun: " : "Profil demo: "}<strong className="font-semibold text-ink">{contextCase?.vendor ?? meta.name}</strong>{contextCase ? " · " + contextCase.eventDate : ""}</span>
              </div>
              <Badge tone={live && syncStatus === "error" ? "red" : "green"} dot>{live ? (syncStatus === "saving" ? "Menyimpan…" : syncStatus === "error" ? "Belum tersimpan" : "Tersimpan di server") : "Mode data prototipe"}</Badge>
            </div>
          )}
          {children}
        </main>
        <footer className="mx-auto hidden max-w-[1280px] flex-col gap-2 border-t border-line/70 px-4 py-4 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:flex">
          <span>VAKSARA · Ruang kerja {meta.label.toLowerCase()} · {live ? "2.0" : "Prototipe 2.0"}</span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <button onClick={() => navigate("bantuan")} className="hover:text-ink">Panduan penggunaan</button>
            <span>{live ? "Data tersimpan di server" : "Data ilustratif"}</span>
            <span>Bahasa Indonesia</span>
          </span>
        </footer>
      </div>
      {/* Menu bawah untuk HP: tujuan utama dalam jangkauan jempol */}
      <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {(bottomNav[role] ?? []).map((b) => {
            const active = isActive({ label: b.label, route: b.route, icon: null, exact: b.exact, match: b.match }, path);
            const badge = b.label === "Kerja sama" ? cases.filter(c => nextStep(c).actor === actorOf).length : 0;
            return <li key={b.route}><button onClick={() => navigate(b.route)} aria-current={active ? "page" : undefined} className={cn("relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-ink" : "text-muted")}>
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-sage")}>{b.icon}</span>{b.label}
              {badge > 0 && <span className="absolute right-[18%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C0532E] px-1 text-[10px] text-white">{badge}</span>}
            </button></li>;
          })}
          <li><button onClick={() => setMobileOpen(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted"><span className="flex h-7 w-12 items-center justify-center"><Menu className="h-5 w-5" /></span>Menu</button></li>
        </ul>
      </nav>
    </div>
  );
}

const bottomNav: Partial<Record<Role, { label: string; route: string; icon: React.ReactNode; exact?: boolean; match?: string[] }[]>> = {
  couple: [
    { label: "Ringkasan", route: "planner", icon: <LayoutDashboard className="h-5 w-5" />, exact: true },
    { label: "Rencana", route: "planner/rencana", icon: <CalendarHeart className="h-5 w-5" />, match: ["planner/jadwal", "planner/anggaran", "planner/tamu", "planner/rundown", "planner/mulai"] },
    { label: "Kerja sama", route: "planner/kerjasama", icon: <HeartHandshake className="h-5 w-5" />, match: ["planner/alur", "planner/vendor", "planner/penawaran", "trust", "planner/pembayaran", "planner/pelaksanaan", "bast", "sengketa"] },
    { label: "Permintaan", route: "planner/permintaan-terbuka", icon: <Megaphone className="h-5 w-5" /> },
  ],
  vendor: [
    { label: "Kerja sama", route: "vendor/ringkasan", icon: <HeartHandshake className="h-5 w-5" />, match: ["vendor/alur", "vendor/permintaan", "vendor/penawaran", "vendor/kontrak", "vendor/pembayaran", "vendor/pelaksanaan", "vendor/bast", "vendor/pengaduan"] },
    { label: "Peluang", route: "vendor/peluang", icon: <Megaphone className="h-5 w-5" /> },
    { label: "Jadwal", route: "vendor/jadwal", icon: <CalendarCheck className="h-5 w-5" /> },
    { label: "Profil", route: "vendor/profil", icon: <Building2 className="h-5 w-5" /> },
  ],
};
