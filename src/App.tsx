import { EventPlanProvider, useEventPlan } from "@/EventPlanContext";
import EventStart, { EventHome, EventTools } from "@/pages/EventStart";
import { CoupleOpenRequests, VendorOpportunities } from "@/pages/OpenRequests";
import PublicDirectory from "@/pages/PublicDirectory";
import OwnerConsole, { isOwnerPath } from "@/pages/OwnerConsole";
import Registration from "@/pages/Registration";
import CooperationOperations from "@/pages/CooperationOperations";
import CooperationWorkspace from "@/pages/CooperationWorkspace";
import CooperationSchedule from "@/pages/CooperationSchedule";
import type { WorkspaceView } from "@/utils/workspace";
import { CooperationProvider } from "@/CooperationContext";
import CooperationPage from "@/pages/CooperationPage";
import ContactVerification, { ContactDemoProvider } from "@/pages/ContactVerification";
import { practitioners } from "@/data";
import { liveEnabled } from "@/utils/supabase";
import { Button, ToastStack } from "@/components/ui";
import { AppLayout } from "@/layouts/AppLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import AdminWorkspace from "@/pages/Admin";
import Knowledge from "@/pages/Knowledge";
import Landing from "@/pages/Landing";
import Marketplace from "@/pages/Marketplace";
import { AboutPage, HelpCenter, PricingPage } from "@/pages/Misc";
import GuidedDemo from "@/pages/GuidedDemo";
import PlannerSubpage from "@/pages/PlannerSubpages";
import PractitionerPage from "@/pages/Practitioner";
import VendorWorkspace from "@/pages/Vendor";
import { AppProvider, roleForRoute, useApp } from "@/store";
import { useEffect } from "react";
import { LiveProvider, useLive } from "@/LiveContext";
import { LiveNotice, LiveScreening, LiveSignupPage, LiveVendorProfile } from "@/pages/LiveAccount";

function NotFound() {
  const { navigate } = useApp();
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="font-display text-[3rem] font-semibold leading-none text-sand">404</div>
      <h1 className="mt-2 font-display text-[1.5rem] font-semibold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">Tautan pada prototipe mungkin menunjuk halaman yang belum tersedia. Kembali ke Beranda atau ruang kerja Anda.</p>
      <div className="mt-4 flex justify-center gap-2"><Button size="sm" onClick={() => navigate("beranda")}>Kembali ke Beranda</Button><Button size="sm" variant="secondary" onClick={() => navigate("planner")}>Ruang pengantin</Button></div>
    </div>
  );
}

function Router() {
  const { route } = useApp();
  const { plan } = useEventPlan();
  const { live, profile, ready } = useLive();
  const path = route.split("?")[0].replace(/\/+$/, "") || "beranda";
  const segments = path.split("/").filter(Boolean);
  const role = roleForRoute(path);
  const isPublic = role === "public";

  useEffect(() => {
    const titles: Record<string, string> = {
      "planner/permintaan-terbuka": "Permintaan terbuka — VAKSARA",
      "vendor/peluang": "Peluang — VAKSARA",
      beranda: "VAKSARA — Rencanakan Pernikahan, Jaga Kepercayaan, Hidupkan Tradisi",
      jelajahi: "Jelajahi Pelaku Budaya — VAKSARA",
      layanan: "Layanan Pernikahan — VAKSARA",
      pengetahuan: "Pengetahuan Budaya — VAKSARA",
      tentang: "Tentang VAKSARA",
      harga: "Paket & Biaya — VAKSARA",
      trust: "VAKSARA Trust — Perjanjian & Kepercayaan",
      planner: "Rencana Acara — VAKSARA",
      "pusat-bantuan": "Pusat Bantuan — VAKSARA",
    };
    document.title = titles[path] ?? "VAKSARA — Ruang Kerja";
  }, [path]);

  const workspaces: Record<string, WorkspaceView> = {
    "planner/kerjasama": "overview", "planner/vendor": "requests", "planner/penawaran": "offers", trust: "agreements", "planner/pembayaran": "payments", "planner/pelaksanaan": "delivery", bast: "handover", sengketa: "issues",
    "vendor/ringkasan": "overview", "vendor/permintaan": "requests", "vendor/penawaran": "offers", "vendor/kontrak": "agreements", "vendor/pembayaran": "payments", "vendor/pelaksanaan": "delivery", "vendor/bast": "handover", "vendor/pengaduan": "issues",
    "admin/overview": "overview", "admin/perjanjian": "agreements", "admin/pengaduan": "issues",
  };
  let content: React.ReactNode;
  // Akun nyata: halaman simulasi diganti alur sungguhan; peran dibatasi sesuai profil akun.
  const liveBlock: React.ReactNode = !live || !ready ? null
    : (path === "demo" || path === "akun/kontak" || path === "vendor/kontak") ? <LiveNotice title="Fitur khusus akun demo" text="Demo terpandu dan simulasi OTP hanya untuk akun demo. Akun VAKSARA Anda sudah terverifikasi lewat email." action={{ label: "Ke ruang saya", to: profile?.role === "vendor" ? "vendor/ringkasan" : "planner" }} />
    : role === "admin" && !profile?.is_admin ? <LiveNotice title="Khusus peninjau VAKSARA" text="Halaman ini hanya untuk akun peninjau yang ditetapkan pengelola." action={{ label: "Kembali", to: profile?.role === "vendor" ? "vendor/ringkasan" : "planner" }} />
    : role === "vendor" && profile?.role !== "vendor" && !profile?.is_admin ? <LiveNotice title="Khusus akun pelaku budaya" text="Akun Anda terdaftar sebagai keluarga. Halaman ini untuk pelaku budaya." action={{ label: "Ke ruang keluarga", to: "planner" }} />
    : path === "vendor/profil" ? <LiveVendorProfile />
    : path === "admin/screening" ? <LiveScreening />
    : null;
  if (liveBlock) content = liveBlock;
  else if (live && ["akun/daftar", "vendor/daftar"].includes(path)) content = <LiveNotice title="Anda sudah masuk" text="Akun VAKSARA Anda sudah aktif." action={{ label: "Ke ruang saya", to: profile?.role === "vendor" ? "vendor/profil" : "planner" }} />;
  else if (liveEnabled && ["akun/daftar", "vendor/daftar"].includes(path)) content = <LiveSignupPage vendor={path === "vendor/daftar"} />;
  else if (["akun/daftar", "vendor/daftar"].includes(path)) content = <Registration key={path} />;
  else if (path === "planner/mulai") content = <EventStart />;
  else if (path === "planner") content = <EventHome />;
  else if (["planner/rencana", "planner/planner"].includes(path)) content = <EventTools />;
  else if (path === "beranda") content = <Landing />;
  else if (path === "jelajahi") content = <Marketplace initialTab="budaya" />;
  else if (path === "layanan") content = <Marketplace initialTab="vendor" />;
  else if (segments[0] === "praktisi" && segments[1]) content = practitioners.some((p) => p.id === segments[1]) ? <PractitionerPage key={segments[1]} id={segments[1]} /> : <NotFound />;
  else if (path === "pengetahuan") content = <Knowledge />;
  else if (path === "tentang") content = <AboutPage />;
  else if (path === "harga") content = <PricingPage />;
  else if (path === "demo") content = <GuidedDemo />;
  else if (path === "direktori-makassar") content = <PublicDirectory />;
  else if (path === "planner/permintaan-terbuka") content = <CoupleOpenRequests />;
  else if (path === "vendor/peluang") content = <VendorOpportunities />;
  else if (path === "pusat-bantuan") content = <HelpCenter />;
  else if (path === "bantuan") content = <HelpCenter dashboard />;
  else if (["planner/alur", "vendor/alur", "admin/alur"].includes(path)) content = <CooperationPage />;
  else if (workspaces[path]) content = <CooperationWorkspace view={workspaces[path]} />;
  else if (path === "admin/audit") content = <CooperationOperations />;
  else if (path === "vendor/verifikasi") content = <CooperationOperations review />;
  else if (path === "admin/screening") content = <CooperationPage />;
  else if (path === "vendor/jadwal") content = <CooperationSchedule />;
  else if (path === "planner/jadwal") content = <PlannerSubpage page="jadwal" />;
  else if (["planner/anggaran", "planner/tamu", "planner/rundown"].includes(path))
    content = <PlannerSubpage page={path.split("/")[1] as "anggaran" | "tamu" | "rundown"} />;
  else if ((path === "akun/kontak" || path === "vendor/kontak")) content = <ContactVerification />;
  else if (path === "perjanjian/baru") content = <CooperationPage />;
  else if (segments[0] === "perjanjian" && segments[1]) content = <CooperationWorkspace view="agreements" caseId={segments[1]} />;
  else if (segments[0] === "pengiriman" && segments[1]) content = <CooperationWorkspace view="delivery" caseId={segments[1]} />;
  else if (segments[0] === "bast" && segments[1]) content = <CooperationWorkspace view="handover" caseId={segments[1]} />;
  else if (segments[0] === "sengketa" && segments[1]) content = <CooperationWorkspace view="issues" caseId={segments[1]} />;
  else if (segments[0] === "vendor" && segments[1]) content = <VendorWorkspace page={segments[1]} />;
  else if (segments[0] === "admin" && segments[1]) content = <AdminWorkspace page={segments[1]} />;
  else content = <NotFound />;

  if (path === "planner/mulai" || (path === "planner" && !plan.complete)) return content;
  if (["akun/daftar", "vendor/daftar"].includes(path)) return <PublicLayout>{content}</PublicLayout>;
  if (isOwnerPath(path)) return <OwnerConsole />;
  return isPublic ? <PublicLayout>{content}</PublicLayout> : <AppLayout>{content}</AppLayout>;
}

export default function App() {
  return (
    <LiveProvider><EventPlanProvider><ContactDemoProvider><CooperationProvider><AppProvider>
      <Router />
      <ToastStack />
    </AppProvider></CooperationProvider></ContactDemoProvider></EventPlanProvider></LiveProvider>
  );
}
