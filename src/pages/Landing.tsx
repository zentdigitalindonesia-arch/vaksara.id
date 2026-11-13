import { liveEnabled } from "@/utils/supabase";
import { Motif, SectionHeading } from "@/components/brand";
import { PractitionerCard } from "@/components/PractitionerCard";
import { Badge, Button, Card, LinkArrow, Progress } from "@/components/ui";
import { categories, formatIDR, images, practitioners } from "@/data";
import { useApp } from "@/store";
import { startPlanTarget, useLive } from "@/LiveContext";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  Hand,
  Heart,
  Lock,
  MapPin,
  Music2,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useState } from "react";

const categoryIcons: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-[18px] w-[18px]" />,
  music: <Music2 className="h-[18px] w-[18px]" />,
  shirt: <Shirt className="h-[18px] w-[18px]" />,
  hand: <Hand className="h-[18px] w-[18px]" />,
  utensils: <Utensils className="h-[18px] w-[18px]" />,
  book: <BookOpen className="h-[18px] w-[18px]" />,
};

export default function Landing() {
  const { navigate, setAuthMode } = useApp();
  const { live, profile } = useLive();
  // Saat akun nyata aktif, tamu yang menekan "Mulai" diarahkan ke pendaftaran; demo tetap lewat "Coba demo".
  const startPlan = () => { if (live) navigate(profile?.role === "vendor" ? "vendor/ringkasan" : "planner"); else if (startPlanTarget() === "daftar") setAuthMode("daftar"); else navigate("planner"); };
  const [faq, setFaq] = useState(0);
  const [cat, setCat] = useState("Semua layanan");
  const [loc, setLoc] = useState("Makassar & sekitarnya");
  const [date, setDate] = useState("");

  const goSearch = () => {
    const params = new URLSearchParams();
    if (cat !== "Semua layanan") params.set("kategori", cat);
    if (loc !== "Makassar & sekitarnya") params.set("lokasi", loc);
    if (date) params.set("tanggal", date);
    navigate(`jelajahi${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="pointer-events-none absolute -right-24 top-0 h-[560px] w-[560px] rounded-full bg-[#EFE5D1]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-[#E5EDE6]/60 blur-3xl" />
        <Motif type="diamond" className="-left-24 -top-24 h-[420px] w-[420px] text-sand" opacity={0.18} />
        <div className="relative mx-auto grid max-w-[1240px] gap-10 px-4 pb-10 pt-9 sm:px-6 sm:pt-14 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:gap-12 lg:pb-14">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sand/60 bg-white/60 px-3 py-1.5 text-[14px] font-semibold text-ink-soft backdrop-blur-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sand/25 text-sand-deep"><Sparkles className="h-2.5 w-2.5" /></span>
              Ekosistem budaya & pernikahan — dimulai dari Bugis-Makassar
            </div>
            <h1 className="mt-5 text-balance font-display text-[2.55rem] font-semibold leading-[1.04] text-ink sm:text-[3.3rem] lg:text-[3.5rem]">
              Rencanakan Pernikahan,
              <br className="hidden sm:block" /> Jaga Kepercayaan,
              <br className="hidden sm:block" /> Hidupkan <span className="italic text-sand-deep">Tradisi.</span>
            </h1>
            <p className="mt-5 max-w-[500px] text-[16px] leading-[1.75] text-ink-soft sm:text-[14px]">
              Temukan pelaku budaya, kelola persiapan pernikahan, dan bangun kerja sama yang lebih transparan dalam satu platform.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button size="lg" onClick={startPlan} trailing={<ArrowRight className="h-4 w-4" />} className="justify-center">
                Mulai Rencanakan Pernikahan
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("jelajahi")}>
                Jelajahi Pelaku Budaya
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-ink-soft">
              {["Pelaku budaya tersaring", "Perjanjian tercatat", "BAST transparan"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><Check className="h-2 w-2" strokeWidth={3} /></span>
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[images.hijabPortrait, images.gamelan, images.artisan, images.womanPortrait].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-7 w-7 rounded-full border-2 border-cream object-cover" loading="lazy" />
                ))}
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink">{liveEnabled ? "Vendor dikurasi langsung oleh tim" : "Profil di demo adalah contoh"}</p>
                <p className="text-[13px] text-muted">{liveEnabled ? "Ulasan hanya dari kerja sama yang selesai BAST" : "Ulasan kelak hanya dari kerja sama yang selesai BAST"}</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto mb-4 w-full max-w-[520px] lg:mb-0 lg:max-w-none">
            <div className="absolute -right-4 top-8 h-[86%] w-[92%] rounded-[30px] border border-sand/50" />
            <div className="relative overflow-hidden rounded-[26px] border-[5px] border-white bg-sand-light shadow-[0_30px_70px_-40px_rgba(22,51,46,.55)]">
              <img src={images.heroCeremony} alt="Keluarga Bugis dalam prosesi pernikahan adat" className="aspect-[4/4.25] w-full object-cover sm:aspect-[4/4.1]" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-forest/5 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                <div className="rounded-xl border border-white/20 bg-forest/45 p-3 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-sand">
                    <span className="h-1 w-1 rounded-full bg-sand" /> Dari Sulawesi Selatan
                  </div>
                  <p className="mt-1 font-display text-[15px] leading-snug text-cream">Setiap keluarga punya cerita adatnya sendiri.</p>
                  <p className="mt-0.5 text-[13px] text-cream/65">VAKSARA membantu merangkainya dengan hormat.</p>
                </div>
              </div>
            </div>
            <div className="absolute -left-1 top-4 hidden w-[188px] rounded-xl border border-line bg-white/95 p-2.5 shadow-lg backdrop-blur min-[420px]:block sm:-left-7 sm:top-7 sm:w-[215px] sm:p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink"><ShieldCheck className="h-3.5 w-3.5 text-sand-deep" /> Screening berlapis</span>
                <span className="text-[12px] font-bold text-[#2B5949]">3 lapis</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {["Identitas & kontak", "Kurasi portofolio", "Validasi pengetahuan"].map((x) => (
                  <div key={x} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#EDF4EF] text-[#2B5949]"><Check className="h-1.5 w-1.5" strokeWidth={3} /></span>{x}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 right-1 w-[208px] rounded-xl border border-line bg-white p-3 shadow-xl sm:-right-4 sm:bottom-8 sm:w-[236px]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Perjanjian terpantau</span>
                <Badge tone="green" dot className="px-1.5 py-0.5 text-[11px]">Aktif</Badge>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-[12px] font-bold text-cream">TB</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-ink">{liveEnabled ? "Sanggar Batara" : "Sanggar Demo Batara"}</p>
                  <p className="text-[12px] text-muted">Prosesi Mappacci · VKS-0184</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted">Persiapan layanan</span>
                <span className="font-bold text-ink">78%</span>
              </div>
              <Progress value={78} tone="sand" className="mt-1 bg-[#F0EBDF]" height="h-1" />
            </div>
            <div className="absolute -bottom-7 left-3 hidden h-[62px] w-[62px] -rotate-6 items-center justify-center rounded-full border border-sand bg-[#F3EAD9] text-center min-[420px]:flex sm:-left-5 sm:h-[68px] sm:w-[68px]">
              <div>
                <ShieldCheck className="mx-auto h-3.5 w-3.5 text-sand-deep" />
                <div className="mt-0.5 text-[11px] font-bold uppercase leading-tight tracking-wider text-ink">VAKSARA<br />Trust</div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative mx-auto max-w-[1240px] px-4 pb-7 sm:px-6">
          <div className="rounded-2xl border border-line bg-white p-2.5 shadow-[0_18px_50px_-35px_rgba(22,51,46,.45)] sm:p-3">
            <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_.9fr_auto] md:items-end">
              <SearchField label="Layanan budaya" icon={<Sparkles className="h-3.5 w-3.5" />}>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full appearance-none bg-transparent text-[15px] font-semibold text-ink outline-none">
                  <option>Semua layanan</option>
                  {categories.map((c) => <option key={c.id}>{c.short}</option>)}
                </select>
              </SearchField>
              <SearchField label="Lokasi acara" icon={<MapPin className="h-3.5 w-3.5" />}>
                <select value={loc} onChange={(e) => setLoc(e.target.value)} className="w-full appearance-none bg-transparent text-[15px] font-semibold text-ink outline-none">
                  <option>Makassar & sekitarnya</option>
                  <option>Gowa</option>
                  <option>Maros</option>
                  <option>Wajo — Sengkang</option>
                  <option>Sulawesi Selatan (semua)</option>
                </select>
              </SearchField>
              <SearchField label="Tanggal acara" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-[15px] font-semibold text-ink outline-none" aria-label="Tanggal acara" />
              </SearchField>
              <Button size="lg" onClick={goSearch} leading={<Search className="h-4 w-4" />} className="w-full md:w-auto">
                Cari layanan
              </Button>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 text-[13px] font-semibold text-muted">Sering dicari:</span>
            {["Prosesi adat", "Pakkacaping", "Perajin tenun", "Katering tradisional"].map((x) => (
              <button key={x} onClick={() => navigate("jelajahi")} className="shrink-0 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[13px] font-medium text-ink-soft transition-colors hover:border-sand hover:bg-white">
                {x}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MULAI DARI MANA */}
      <section className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6" aria-labelledby="mulai-dari-mana">
        <h2 id="mulai-dari-mana" className="font-display text-[26px] text-ink md:text-[30px]">Mulai dari mana?</h2>
        <p className="mt-1 text-[15px] text-muted">Pilih yang paling sesuai. Semua bisa dicoba tanpa akun nyata.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { icon: <Heart className="h-5 w-5" />, t: "Saya keluarga / calon pengantin", d: "Buat acara, cari pelaku budaya, dan catat kesepakatan dengan jelas.", cta: "Buat acara", to: "planner/mulai" },
            { icon: <Hand className="h-5 w-5" />, t: "Saya pelaku budaya", d: "Daftarkan layanan, terima permintaan, kirim penawaran, dan ajukan BAST.", cta: "Daftar sebagai pelaku", to: "vendor/daftar" },
            liveEnabled ? { icon: <Sparkles className="h-5 w-5" />, t: "Saya mencari vendor sekarang", d: "Buka direktori vendor pernikahan Makassar lengkap dengan kontak WhatsApp, tanpa perlu akun.", cta: "Buka direktori", to: "direktori-makassar" } : { icon: <Sparkles className="h-5 w-5" />, t: "Saya ingin melihat cara kerjanya", d: "Ikuti satu kerja sama dari permintaan sampai Dana Amanah cair, langkah demi langkah.", cta: "Coba demo terpandu", to: "demo" },
          ].map((c, i) => (
            <button key={c.t} onClick={() => navigate(c.to)} className={cn("group rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md", i === 2 ? "border-ink bg-ink text-cream" : "border-line bg-white")}>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", i === 2 ? "bg-sand text-ink" : "bg-sand-light text-sand-deep")}>{c.icon}</span>
              <h3 className="mt-3 text-[18px] font-bold">{c.t}</h3>
              <p className={cn("mt-1 text-[15px] leading-relaxed", i === 2 ? "text-cream/80" : "text-muted")}>{c.d}</p>
              <span className={cn("mt-3 inline-flex items-center gap-1 text-[15px] font-semibold", i === 2 ? "text-sand" : "text-ink")}>{c.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ECOSYSTEM STRIP */}
      <section className="border-b border-line/70 bg-[#FBF9F4]">
        <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">
          <div className="grid grid-cols-2 gap-y-5 md:grid-cols-4">
            {[
              liveEnabled ? { v: "28", l: "usaha di direktori vendor Makassar", s: "kurasi dan verifikasi berjalan" } : { v: String(practitioners.length), l: "profil contoh di demo", s: "bukan pelaku nyata" },
              { v: String(categories.length), l: "kategori budaya & layanan", s: "prosesi hingga kriya" },
              { v: "2 pihak", l: "menyetujui tiap versi perjanjian", s: "revisi = persetujuan ulang" },
              { v: "Rp0", l: "penemuan & alur kerja sama dasar", s: "gratis untuk keluarga dan pelaku" },
            ].map((s) => (
              <div key={s.l} className="border-l border-line pl-3 first:border-l-0 first:pl-0 sm:pl-5">
                <div className="font-display text-[1.55rem] font-semibold leading-none text-ink">{s.v}</div>
                <div className="mt-1.5 text-[14px] font-semibold leading-tight text-ink-soft">{s.l}</div>
                <div className="mt-0.5 text-[13px] text-muted">{s.s}</div>
              </div>
            ))}
          </div>
          {!liveEnabled && <div className="mt-5 flex flex-col gap-2 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:gap-5">
            <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.16em] text-muted">Contoh ekosistem prototipe</span>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {["Sanggar Demo Batara", "Rumah Tenun Lipa' Sabbe", "Dapur Cita Nusantara", "Rumah Dekor Sulapa", "Lensa Pesisir"].map((x) => (
                <span key={x} className="font-display text-[14px] text-ink-soft/75">{x}</span>
              ))}
            </div>
          </div>}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-line/60 py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Jelajahi ekosistem"
            title={<>Temukan pelaku budaya yang tepat,<br className="hidden sm:block" /> dengan konteks yang jelas.</>}
            description="Setiap profil membedakan verifikasi identitas, peninjauan portofolio, dan validasi pengetahuan budaya. Anda tahu apa yang sudah diperiksa."
            action={<Button variant="secondary" onClick={() => navigate("jelajahi")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Lihat semua pelaku budaya</Button>}
          />
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-9 sm:gap-3 lg:grid-cols-3">
            {categories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate("jelajahi")}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sand hover:shadow-[0_14px_30px_-24px_rgba(22,51,46,.4)] sm:p-5",
                  i === 0 && "bg-ink text-cream hover:border-sand"
                )}
              >
                {i === 0 && <Motif type="arch" className="-bottom-8 -right-6 h-40 w-40 text-sand" opacity={0.2} />}
                <div className="relative flex items-start justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", i === 0 ? "border-white/15 bg-white/10 text-sand" : "border-line bg-[#F7F4ED] text-sand-deep")}>
                    {categoryIcons[c.icon]}
                  </span>
                  <span className={cn("text-[12px] font-bold uppercase tracking-wider", i === 0 ? "text-cream/45" : "text-muted")}>{liveEnabled ? "" : `${c.count} profil`}</span>
                </div>
                <h3 className={cn("relative mt-3 text-[15px] font-bold leading-snug", i === 0 ? "text-cream" : "text-ink")}>{c.name}</h3>
                <p className={cn("relative mt-1 line-clamp-2 text-[14px] leading-relaxed", i === 0 ? "text-cream/55" : "text-muted")}>{c.description}</p>
                <span className={cn("relative mt-3 inline-flex items-center gap-1 text-[13px] font-bold", i === 0 ? "text-sand" : "text-ink-soft")}>
                  Jelajahi <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRACTITIONERS */}
      <section className="border-b border-line/60 bg-[#F3F0E7]/55 py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pilihan VAKSARA"
            title="Pelaku budaya dengan rekam jejak yang dapat dibaca."
            description={liveEnabled ? "Setiap vendor dikunjungi dan diperiksa sebelum tampil sebagai terverifikasi. Selama kurasi berjalan, direktori vendor Makassar tetap terbuka untuk semua." : "Profil di bawah menampilkan status verifikasi secara terbuka. Portofolio diperiksa untuk relevansi dan atribusi sumber — bukan untuk menilai estetika satu-satunya."}
            action={<LinkArrow onClick={() => navigate("jelajahi")}>Jelajahi direktori lengkap</LinkArrow>}
          />
          {liveEnabled ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-5"><div className="text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep">Tersedia sekarang</div><h3 className="mt-1.5 font-display text-[1.25rem] font-semibold text-ink">Direktori vendor Makassar</h3><p className="mt-1.5 text-[14px] leading-relaxed text-muted">Sanggar seni, perias, katering, fotografer, dan gedung lengkap dengan kontak WhatsApp dan sumber datanya. Bisa dibuka tanpa akun.</p><button onClick={() => navigate("direktori-makassar")} className="mt-3 text-[14px] font-semibold text-ink underline decoration-sand underline-offset-2">Buka direktori</button></div>
              <div className="rounded-xl border border-line bg-white p-5"><div className="text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep">Sedang berjalan</div><h3 className="mt-1.5 font-display text-[1.25rem] font-semibold text-ink">Kurasi vendor terverifikasi</h3><p className="mt-1.5 text-[14px] leading-relaxed text-muted">Tim VAKSARA mengunjungi, memeriksa, dan membuat perjanjian kerja sama dengan setiap vendor. Profil terverifikasi tampil di sini setelah lolos peninjauan tiga lapis.</p><button onClick={() => navigate("vendor/daftar")} className="mt-3 text-[14px] font-semibold text-ink underline decoration-sand underline-offset-2">Daftarkan usaha Anda</button></div>
            </div>
          ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {practitioners.slice(0, 4).map((p) => <PractitionerCard key={p.id} p={p} compact />)}
          </div>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-sand/40 bg-sand-light/50 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sand-deep" />
            <p className="text-[14px] leading-relaxed text-ink-soft">
              <strong className="font-bold text-ink">Apa artinya "terverifikasi"?</strong> Identitas, portofolio, dan pengetahuan budaya diperiksa secara terpisah. Status bisa berbeda per lapis dan tidak menjamin hasil layanan. <button onClick={() => navigate("tentang")} className="font-semibold text-ink underline decoration-sand underline-offset-2">Pelajari metodologi</button>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-ink py-12 text-cream sm:py-16">
        <Motif type="weave" className="-right-20 -top-20 h-[460px] w-[460px] text-sand" opacity={0.2} />
        <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-sand"><span className="h-px w-6 bg-sand" />Cara VAKSARA bekerja</div>
            <h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight sm:text-[2.5rem]">Dari perkenalan pertama sampai serah terima, tetap ada yang mencatat.</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cream/60">Keluarga memimpin keputusan. VAKSARA menyediakan ruang untuk menemukan, menyepakati, dan meninjau bersama.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Temukan dengan konteks", d: "Saring berdasarkan kategori, lokasi, ketersediaan, dan status screening yang transparan.", icon: <Search className="h-4 w-4" /> },
              { n: "02", t: "Kenali & bertanya", d: "Baca profil, portofolio, dan sumber pengetahuan. Kirim pertanyaan tanpa tekanan untuk memesan.", icon: <Users className="h-4 w-4" /> },
              { n: "03", t: "Rencanakan & sepakati", d: "Simpan pilihan, bandingkan penawaran, lalu tuangkan ruang lingkup dan termin dalam perjanjian.", icon: <FileSignature className="h-4 w-4" /> },
              { n: "04", t: "Laksanakan & tinjau", d: "Pantau layanan, catat pembayaran, dan selesaikan BAST dengan bukti yang bisa dibaca kedua pihak.", icon: <ClipboardCheck className="h-4 w-4" /> },
            ].map((s, i) => (
              <div key={s.n} className="relative rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1.75rem] leading-none text-sand/80">{s.n}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cream/70">{s.icon}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold text-cream">{s.t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-cream/55">{s.d}</p>
                {i < 3 && <span className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sand/20 text-sand lg:flex"><ChevronRight className="h-3 w-3" /></span>}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-cream/60">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sand" />
              VAKSARA membantu mencatat kesepakatan dan memfasilitasi komunikasi. Kami bukan pengadilan, tidak menjamin pengembalian dana, dan tidak menyimpan dana Anda.
            </p>
            <Button size="sm" variant="gold" onClick={() => navigate("tentang")} className="shrink-0">Tentang kepercayaan kami</Button>
          </div>
        </div>
      </section>

      {/* WEDDING PLANNER SHOWCASE */}
      <section className="border-b border-line/60 py-12 sm:py-16">
        <div className="mx-auto grid max-w-[1240px] gap-9 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-sand-deep">Rencana Acara</div>
            <h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.4rem]">Satu ruang untuk tanggal, anggaran, dan orang-orang yang Anda percaya.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Dari hitungan mundur hingga rundown hari acara. Semua angka dalam Rupiah, semua perubahan punya jejak.</p>
            <div className="mt-5 space-y-3">
              {[
                { icon: <Wallet className="h-4 w-4" />, t: "Anggaran yang mengikuti keputusan", d: "Rencanakan per kategori, catat komitmen, dan lihat sisa yang benar-benar tersedia." },
                { icon: <CalendarDays className="h-4 w-4" />, t: "Jadwal, tugas, dan pengingat", d: "Checklist dengan penanggung jawab dan tenggat. Termin pembayaran tidak terlewat." },
                { icon: <Users className="h-4 w-4" />, t: "Tamu & rundown bersama", d: "Kelola RSVP dan susun alur acara yang dapat dibagikan ke vendor terkait." },
              ].map((x) => (
                <div key={x.t} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-sand-deep">{x.icon}</span>
                  <div>
                    <h3 className="text-[15px] font-bold text-ink">{x.t}</h3>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={startPlan} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Mulai Rencana Acara</Button>
              {!liveEnabled && <Button variant="secondary" onClick={() => navigate("planner")}>Lihat demo planner</Button>}
            </div>
          </div>
          <PlannerMock />
        </div>
      </section>

      {/* TRUST SHOWCASE */}
      <section className="border-b border-line/60 bg-[#EFEADF] py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="VAKSARA Trust"
            title="Kesepakatan yang bisa dibaca, bukan hanya diingat."
            description="Perjanjian layanan, termin pembayaran, pengajuan BAST, dan pengaduan dalam satu jejak dokumen. Setiap perubahan versi tercatat."
            action={<Button variant="secondary" onClick={() => navigate("trust")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Buka VAKSARA Trust</Button>}
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-[1.08fr_.92fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-[#FBFAF6] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-cream"><FileSignature className="h-3.5 w-3.5" /></span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">Perjanjian Layanan Budaya</p>
                    <p className="text-[12px] text-muted">VKS-PJK-2027-0184 · v1.2</p>
                  </div>
                </div>
                <Badge tone="green" dot>Disepakati</Badge>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-white p-3">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Pihak pertama</div>
                  <p className="mt-1 text-[14px] font-bold text-ink">Nurul Amalia</p>
                  <p className="text-[13px] text-muted">Calon pengantin · Makassar</p>
                </div>
                <div className="rounded-lg border border-line bg-white p-3">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Pihak kedua</div>
                  <p className="mt-1 text-[14px] font-bold text-ink">{liveEnabled ? "Sanggar Batara" : "Sanggar Demo Batara"}</p>
                  <p className="text-[13px] text-muted">{liveEnabled ? "Pelaku budaya" : "Pelaku budaya (contoh)"}</p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted">Nilai layanan</span>
                    <span className="font-bold text-ink">{formatIDR(18500000)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[13px]">
                    <span className="text-muted">Ruang lingkup</span>
                    <span className="font-semibold text-ink">Mappacci & pendampingan 3 hari</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {["Draf", "Disepakati", "BAST"].map((step, i) => (
                      <div key={step}>
                        <Progress value={i === 0 ? 100 : i === 1 ? 100 : 45} tone={i < 2 ? "green" : "warn"} height="h-1" />
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted"><span className={cn("h-1 w-1 rounded-full", i < 2 ? "bg-[#4C8068]" : "bg-[#C08D3B]")} />{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#FBFAF6] px-4 py-2.5">
                <span className="flex items-center gap-1 text-[13px] text-muted"><Lock className="h-3 w-3 text-sand-deep" /> {liveEnabled ? "Disetujui kedua pihak di VAKSARA" : "Tanda tangan elektronik: simulasi prototipe"}</span>
                <span className="text-[13px] font-semibold text-ink">Riwayat versi ▸</span>
              </div>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { icon: <FileSignature className="h-4 w-4" />, t: "Perjanjian dengan persetujuan dua pihak", d: "Versi yang disetujui dikunci. Perubahan harus melalui pengajuan baru." },
                { icon: <Wallet className="h-4 w-4" />, t: "Dana Amanah yang cair dengan dua persetujuan", d: "Bila dipilih, dana ditahan mitra pembayaran berizin. Satu pihak mengusulkan pencairan, pihak lain menyetujui." },
                { icon: <ClipboardCheck className="h-4 w-4" />, t: "BAST yang tidak bisa dianggap selesai sendiri", d: "Penerimaan menunggu keputusan pengantin dan konfirmasi pelaku budaya." },
                { icon: <ShieldCheck className="h-4 w-4" />, t: "Pengaduan dengan jalur yang netral", d: "Pengantin dan vendor dapat menanggapi. Trust Officer memfasilitasi, tidak memutus." },
              ].map((x) => (
                <div key={x.t} className="flex gap-3 rounded-xl border border-line bg-white/80 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sand">{x.icon}</span>
                  <div>
                    <h3 className="text-[15px] font-bold leading-snug text-ink">{x.t}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {liveEnabled ? "Setiap versi perjanjian dan pembayaran tercatat di akun kedua pihak, dan hanya berlaku setelah disetujui bersama." : "Prototipe: dokumen belum memiliki sertifikasi hukum. Pembayaran yang ditandai gateway merupakan simulasi dan tidak memproses uang nyata."}
          </p>
        </div>
      </section>

      {/* IMPACT */}
      <section className="border-b border-line/60 py-12 sm:py-16">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="relative">
            <div className="overflow-hidden rounded-[24px] border-[5px] border-white shadow-[0_25px_60px_-35px_rgba(22,51,46,.45)]">
              <img src={images.weaving} alt="Penenun mengerjakan kain tradisional dengan alat tenun" className="aspect-[5/4] w-full object-cover" loading="lazy" />
            </div>
            {!liveEnabled && <div className="absolute -bottom-5 right-3 w-[240px] rounded-xl border border-line bg-white p-3.5 shadow-xl sm:right-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><Heart className="h-4 w-4" /></span>
                <div>
                  <div className="text-[16px] font-bold text-ink">Rp48,6 jt</div>
                  <div className="text-[12px] text-muted">ilustrasi pendapatan komunitas*</div>
                </div>
              </div>
              <Progress value={68} tone="green" className="mt-2.5" height="h-1" />
              <p className="mt-2 text-[12px] leading-relaxed text-muted">*Angka demonstrasi prototipe, bukan realisasi transaksi.</p>
            </div>}
            <div className="absolute -left-2 top-4 rounded-lg border border-sand/50 bg-cream/95 px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-wider text-ink-soft backdrop-blur">
              Tenun Sengkang · Wajo
            </div>
          </div>
          <div>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-sand-deep">Budaya & ekonomi</div>
            <h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.4rem]">Pernikahan Anda dapat menjadi fondasi ekonomi yang hidup untuk tradisi.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">VAKSARA menghubungkan keluarga dengan pelaku budaya yang bekerja secara profesional. Bukan untuk membekukan tradisi dalam kaca museum, tetapi memberi ruang bagi praktik yang terus dirawat komunitasnya.</p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { v: "Pilot", l: "Makassar–Gowa", s: "rencana 2027" },
                { v: String(categories.length), l: "kategori layanan", s: "dari prosesi hingga kriya" },
                { v: "1:1", l: "atribusi sumber", s: "pada artikel budaya" },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border border-line bg-[#FBF9F4] p-3">
                  <div className="font-display text-[1.4rem] font-semibold leading-none text-ink">{x.v}</div>
                  <div className="mt-1 text-[13px] font-semibold leading-tight text-ink-soft">{x.l}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{x.s}</div>
                </div>
              ))}
            </div>
            {!liveEnabled && <blockquote className="mt-5 rounded-xl border border-sand/40 bg-sand-light/40 p-4">
              <p className="font-display text-[15px] leading-relaxed text-ink">"Tradisi kami bukan satu naskah yang sama untuk semua keluarga. Yang penting adalah kami duduk bersama dan saling mendengar."</p>
              <footer className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-ink-soft">Hj. Andi Nurhaeni · pemandu prosesi adat</span>
                <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">Ilustrasi</span>
              </footer>
            </blockquote>}
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate("pengetahuan")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>
              Jelajahi pengetahuan budaya
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-b border-line/60 bg-[#FBF9F4] py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pilihan paket"
            title="Gratis untuk menemukan. Berbayar saat Anda butuh lebih."
            description={liveEnabled ? "VAKSARA tidak mengambil komisi tersembunyi dari harga pelaku budaya. Paket berbayar dibuka bersamaan dengan peluncuran vendor terverifikasi." : "Model bisnis prototipe: VAKSARA tidak mengambil komisi tersembunyi dari harga pelaku budaya. Setiap paket akan diumumkan sebelum ditagihkan."}
            align="center"
          />
          <div className="mx-auto mt-7 grid max-w-5xl gap-3 md:grid-cols-3">
            {[
              { name: "Dasar", price: "Gratis", unit: "untuk keluarga & pelaku", desc: "Menemukan pelaku budaya dan mencatat kesepakatan dengan jelas.", features: ["Direktori & kontak WhatsApp", "Permintaan, penawaran & perjanjian", "Dana Amanah, DP, BAST & penutupan", "Artikel budaya (draf bersumber)"], cta: "Mulai gratis", dark: false },
              { name: "Premium Keluarga", price: formatIDR(99000), unit: (liveEnabled ? "/ acara" : "/ acara · simulasi"), desc: "Untuk keluarga besar yang mengelola persiapan bersama.", features: ["Kolaborasi keluarga hingga 5 orang", "Pengingat termin & jadwal", "Rundown & daftar tamu lanjutan", "Laporan anggaran siap cetak"], cta: "Coba rencana acara", dark: true },
              { name: "Vendor Pro", price: formatIDR(49000), unit: (liveEnabled ? "/ bulan" : "/ bulan · simulasi"), desc: "Untuk pelaku budaya yang ingin mengelola usaha lebih rapi.", features: ["Profil & portofolio diperluas", "Kalender ketersediaan", "Template penawaran", "Laporan pendapatan · tidak membeli peringkat atau verifikasi"], cta: "Lihat ruang vendor", dark: false },
            ].map((plan) => (
              <div key={plan.name} className={cn("relative flex flex-col rounded-2xl border p-5", plan.dark ? "border-ink bg-ink text-cream shadow-lg" : "border-line bg-white")}>
                {plan.dark && <span className="absolute -top-2.5 left-5 rounded-full bg-sand px-2 py-1 text-[12px] font-bold uppercase tracking-wider text-forest">Paling relevan</span>}
                <div className={cn("text-[12px] font-bold uppercase tracking-wider", plan.dark ? "text-sand" : "text-sand-deep")}>{plan.name}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="font-display text-[1.65rem] font-semibold leading-none">{plan.price}</span>
                  <span className={cn("pb-0.5 text-[13px]", plan.dark ? "text-cream/50" : "text-muted")}>{plan.unit}</span>
                </div>
                <p className={cn("mt-2 text-[14px] leading-relaxed", plan.dark ? "text-cream/60" : "text-muted")}>{plan.desc}</p>
                <ul className="mt-3 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[14px]">
                      <Check className={cn("mt-0.5 h-3 w-3 shrink-0", plan.dark ? "text-sand" : "text-[#4C8068]")} />
                      <span className={plan.dark ? "text-cream/75" : "text-ink-soft"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.dark ? "gold" : "secondary"} size="sm" className="mt-4" onClick={() => (plan.name === "Vendor Pro" ? navigate("harga") : setAuthMode("daftar"))}>{plan.cta}</Button>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[13px] leading-relaxed text-muted">
            Manajemen perjanjian lanjutan direncanakan sebagai layanan premium tambahan. {liveEnabled ? "Paket berbayar dibuka bersamaan dengan peluncuran vendor terverifikasi. " : "Checkout akan diarahkan ke Xendit pada tahap produksi — prototipe ini tidak memproses pembayaran. "}Tidak semua tradisi atau layanan budaya cocok dimonetisasi; VAKSARA meninjau listing secara etis.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-line/60 py-12 sm:py-16">
        <div className="mx-auto grid max-w-[1240px] gap-7 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
          <div>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-sand-deep">Pertanyaan umum</div>
            <h2 className="text-balance font-display text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.3rem]">Hal yang perlu Anda tahu sebelum mulai.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Tidak menemukan jawabannya? Pusat Bantuan menyediakan panduan dan jalur komunikasi yang tercatat.</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate("bantuan")}>Buka Pusat Bantuan</Button>
          </div>
          <div className="space-y-2">
            {[
              { q: "Apakah VAKSARA hanya untuk pernikahan adat Bugis-Makassar?", a: "VAKSARA dimulai dari praktik Bugis-Makassar karena fokus awal kami di Sulawesi Selatan. Kami tidak menganggap semua keluarga memiliki praktik yang sama. Direktori memungkinkan pelaku budaya menjelaskan konteks dan variasi praktiknya, dan kami berencana memperluas wilayah secara bertahap dengan peninjauan lokal." },
              { q: "Bagaimana VAKSARA memverifikasi pelaku budaya?", a: "Screening terdiri dari tiga lapis terpisah: (1) verifikasi identitas dan kontak, (2) peninjauan portofolio untuk relevansi dan atribusi, serta (3) validasi pengetahuan budaya bersama peninjau. Status setiap lapis ditampilkan pada profil. Verifikasi bukan jaminan hasil dan dapat ditinjau ulang bila ada laporan." },
              { q: "Apakah uang pembayaran saya ditahan oleh VAKSARA?", a: "Tidak di rekening VAKSARA. Kedua pihak memilih cara pembayaran di perjanjian: Dana Amanah atau transfer langsung. Dana Amanah ditampung di rekening penampung mitra pembayaran berizin dan hanya cair ke pelaku budaya bila satu pihak mengusulkan dan pihak lain menyetujui; selama sengketa dana dibekukan. Di prototipe ini semua setoran adalah simulasi." },
              { q: "Apa yang terjadi jika layanan tidak sesuai kesepakatan?", a: "Anda dapat mengajukan keberatan melalui BAST atau membuka pengaduan pada VAKSARA Trust. Kedua pihak dapat mengunggah bukti, memberikan klarifikasi, dan mengusulkan penyelesaian. Trust Officer memfasilitasi komunikasi dan mencatat hasilnya. VAKSARA tidak memberikan putusan hukum atau menjamin pengembalian dana secara otomatis." },
              { q: "Apakah perjanjian di sini sudah memiliki kekuatan hukum?", a: "Belum. Perjanjian dalam prototipe ini adalah simulasi dokumen. Tanda tangan elektronik yang ditampilkan bukan layanan tersertifikasi. Pada tahap implementasi, VAKSARA akan bekerja dengan penyedia tanda tangan elektronik bersertifikat dan menampilkan status dengan jelas." },
              { q: "Dapatkah saya berdiskusi sebelum memesan?", a: "Bisa. Setiap profil memiliki jalur pertanyaan tanpa komitmen. Anda dapat menyimpan profil, mengirim pertanyaan, dan membandingkan hingga tiga pelaku budaya sebelum memutuskan." },
            ].map((item, i) => (
              <div key={item.q} className={cn("overflow-hidden rounded-xl border transition-colors", faq === i ? "border-sand/70 bg-white" : "border-line bg-white/60")}>
                <button onClick={() => setFaq(faq === i ? -1 : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={faq === i}>
                  <span className="text-[15px] font-bold leading-snug text-ink">{item.q}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-sand-deep transition-transform", faq === i && "rotate-180")} />
                </button>
                {faq === i && <div className="border-t border-line/70 px-4 py-3 text-[14px] leading-relaxed text-muted">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink py-12 text-cream sm:py-16">
        <Motif type="diamond" className="-right-16 -top-24 h-[440px] w-[440px] text-sand" opacity={0.18} />
        <Motif type="weave" className="-bottom-24 -left-24 h-[340px] w-[340px] text-cream" opacity={0.05} />
        <div className="relative mx-auto flex max-w-[1240px] flex-col items-start gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-sand"><span className="h-px w-6 bg-sand" />Mulai dari satu percakapan</div>
            <h2 className="text-balance font-display text-[1.95rem] font-semibold leading-tight sm:text-[2.6rem]">Momen penting Anda layak direncanakan dengan hormat dan kejelasan.</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cream/60">Buat proyek pernikahan gratis, jelajahi pelaku budaya, dan lihat bagaimana VAKSARA menjaga setiap kesepakatan tetap terbaca.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <Button size="lg" variant="gold" onClick={startPlan} trailing={<ArrowRight className="h-4 w-4" />}>Mulai Rencanakan Pernikahan</Button>
            <Button size="lg" variant="outline" className="border-white/25 text-cream hover:border-white hover:bg-white/10" onClick={() => navigate("jelajahi")}>Jelajahi Pelaku Budaya</Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SearchField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line/80 bg-[#FBFAF6] px-3 py-2 transition-colors focus-within:border-sand-deep focus-within:bg-white">
      <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted">
        <span className="text-sand-deep">{icon}</span>{label}
      </div>
      {children}
    </div>
  );
}

function PlannerMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[26px] bg-[#EFE6D4]/70" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_25px_60px_-35px_rgba(22,51,46,.4)]">
        <div className="flex items-center justify-between border-b border-line bg-[#FBFAF6] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D7BCA9]" /><span className="h-2 w-2 rounded-full bg-[#DCD5C5]" /><span className="h-2 w-2 rounded-full bg-[#CAD9CD]" />
          </div>
          <div className="rounded bg-white px-3 py-0.5 text-[11px] text-muted ring-1 ring-line">vaksara.id/planner</div>
          <div className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-sand-light" /><span className="h-1 w-4 rounded bg-line" /></div>
        </div>
        <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[92px_1fr]">
          <div className="border-r border-line bg-ink p-2">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-sand text-[6px] font-bold text-forest">V</span>
              <span className="text-[6.5px] font-bold tracking-wider text-cream">VAKSARA</span>
            </div>
            {["Ringkasan", "Planner", "Anggaran", "Vendor", "Jadwal", "Pembayaran", "Perjanjian"].map((x, i) => (
              <div key={x} className={cn("mb-0.5 flex items-center gap-1 rounded px-1 py-1 text-[6px] sm:text-[6.5px]", i === 1 ? "bg-white/10 text-sand" : "text-cream/45")}>
                <span className="h-1 w-1 rounded-full bg-current" />{x}
              </div>
            ))}
          </div>
          <div className="p-2 sm:p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-[5.5px] uppercase tracking-wider text-muted">Rencana Acara</div>
                <div className="font-display text-[14px] font-semibold text-ink">Nurul & Aditya</div>
              </div>
              <span className="rounded bg-sage px-1.5 py-0.5 text-[5.5px] font-bold text-[#2B5949]">12 Jun 2027</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-line bg-ink p-2 text-cream">
                <div className="text-[5px] uppercase tracking-wider text-cream/50">Hitungan mundur</div>
                <div className="mt-0.5 font-display text-[18px] leading-none">187<span className="ml-1 font-sans text-[6px] font-normal text-cream/60">hari</span></div>
                <div className="mt-1.5 h-0.5 w-full rounded bg-white/15"><div className="h-full w-[42%] rounded bg-sand" /></div>
              </div>
              <div className="rounded-lg border border-line bg-[#FBFAF6] p-2">
                <div className="text-[5px] uppercase tracking-wider text-muted">Checklist</div>
                <div className="mt-0.5 text-[14px] font-bold text-ink">5 / 12</div>
                <div className="mt-1.5 h-0.5 w-full rounded bg-[#E7E1D5]"><div className="h-full w-[42%] rounded bg-[#4C8068]" /></div>
                <div className="mt-1 text-[5px] text-muted">Tugas selesai</div>
              </div>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {[{ l: "Anggaran", v: "Rp127,5 jt" }, { l: "Terpakai", v: "Rp42,5 jt" }, { l: "Sisa", v: "Rp85,0 jt" }].map((x) => (
                <div key={x.l} className="rounded-md border border-line bg-white p-1.5">
                  <div className="text-[4.5px] uppercase tracking-wide text-muted">{x.l}</div>
                  <div className="mt-0.5 text-[6.5px] font-bold text-ink">{x.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 rounded-lg border border-line p-2">
              <div className="flex items-center justify-between">
                <span className="text-[5.5px] font-bold text-ink">Termin mendatang</span>
                <span className="text-[4.5px] text-muted">Juni 2027</span>
              </div>
              {[
                { n: liveEnabled ? "Sanggar Batara" : "Sanggar Demo Batara", a: "Rp5.550.000", d: "12 Jun", c: "bg-[#4C8068]" },
                { n: "Lensa Pesisir Studio", a: "Rp5.700.000", d: "18 Jun", c: "bg-[#C08D3B]" },
              ].map((r) => (
                <div key={r.n} className="mt-1 flex items-center gap-1.5">
                  <span className={cn("h-1 w-1 rounded-full", r.c)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[5px] font-semibold text-ink">{r.n}</div>
                    <div className="text-[4.5px] text-muted">Jatuh tempo {r.d}</div>
                  </div>
                  <span className="text-[5px] font-bold text-ink">{r.a}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-lg border border-sand/40 bg-sand-light/40 px-2 py-1">
              <div className="flex items-center gap-1"><Check className="h-2 w-2 text-[#2B5949]" /><span className="text-[5px] font-semibold text-ink">BAST 1 menunggu keputusan Anda</span></div>
              <ArrowRight className="h-2 w-2 text-sand-deep" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-3 flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-lg">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage"><Check className="h-2.5 w-2.5 text-[#2B5949]" /></span>
        <span className="text-[11px] font-semibold text-ink">{liveEnabled ? "Tersimpan di akun Anda" : "Data tersimpan pada prototipe"}</span>
      </div>
    </div>
  );
}
