import { PractitionerCard } from "@/components/PractitionerCard";
import { liveEnabled } from "@/utils/supabase";
import { showSampleProfiles } from "@/utils/demo-login";
import { useLive } from "@/LiveContext";
import { LiveListingCard, useLiveListings } from "@/pages/LiveAccount";
import { Alert, Avatar, Button, Card, Checkbox, EmptyState, Select } from "@/components/ui";
import { categories, formatIDR, practitioners, type Practitioner } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { publicVendors } from "@/data-public-vendors";
import { ArrowRight, Check, ChevronDown, Filter, MapPin, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const locations = ["Semua lokasi", "Makassar", "Gowa", "Maros", "Wajo", "Takalar"];
const availabilities = ["Semua ketersediaan", "Tersedia Juni 2027", "Tersedia Juli 2027", "Respons cepat"];
const sorts = ["Paling relevan", "Rating tertinggi", "Harga terendah", "Pengalaman terlama"];

/** Pelaku budaya yang mendaftar sendiri dan sudah ditinjau (data server). */
function RegisteredListings() {
  const { items, loaded } = useLiveListings();
  const { navigate, setAuthMode } = useApp();
  const { live, profile } = useLive();
  if (!loaded || items.length === 0) return null;
  const request = (name: string) => { if (!live) { setAuthMode("masuk"); return; } if (profile?.role !== "couple") return; navigate("planner/alur?vendor=" + encodeURIComponent(name)); };
  return <section className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6" aria-label="Pelaku terdaftar">
    <h2 className="font-display text-2xl text-ink">Pelaku budaya terdaftar</h2>
    <p className="mt-1 text-sm text-muted">Mendaftar sendiri di VAKSARA dan lolos peninjauan identitas, konteks budaya, dan persetujuan publikasi.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(l => <LiveListingCard key={l.id} l={l} onRequest={!live || profile?.role === "couple" ? () => request(l.name) : undefined} />)}</div>
    {showSampleProfiles() && <><h2 className="mt-8 font-display text-2xl text-ink">Profil contoh</h2>
      <p className="mt-1 text-sm text-muted">Profil di bawah ini adalah ilustrasi untuk menunjukkan fitur, bukan pelaku yang dapat dipesan.</p></>}
  </section>;
}

/** Pengganti daftar profil contoh di vaksara.id untuk pengunjung umum dan akun nyata. */
function RealOnlyNotice() {
  const { items, loaded } = useLiveListings();
  const { navigate, setAuthMode } = useApp();
  return <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8" aria-label="Pelaku budaya lainnya">
    <Card className="p-5">
      <h2 className="font-display text-xl text-ink">{loaded && items.length === 0 ? "Belum ada pelaku budaya yang lolos peninjauan" : "Cari lebih banyak pelaku budaya"}</h2>
      <p className="mt-2 text-sm text-ink-soft">Pelaku budaya yang mendaftar tampil di sini setelah identitas, konteks budaya, dan persetujuan publikasinya ditinjau. Sementara itu, usaha pernikahan di Makassar dapat dihubungi lewat direktori publik.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate("direktori-makassar")}>Buka direktori Makassar</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("vendor/daftar")}>Daftar sebagai pelaku budaya</Button>
        <Button size="sm" variant="ghost" onClick={() => setAuthMode("masuk")}>Lihat profil contoh dengan akun demo</Button>
      </div>
    </Card>
  </section>;
}

export default function Marketplace({ initialTab = "budaya" }: { initialTab?: "budaya" | "vendor" }) {
  const { route, navigate, compare, toggleCompare, setAuthMode } = useApp();
  const params = useMemo(() => new URLSearchParams(route.split("?")[1] ?? ""), [route]);

  const [tab, setTab] = useState<"budaya" | "vendor">(initialTab);
  const [query, setQuery] = useState(params.get("kategori")?.length ? params.get("kategori")! : "");
  const [location, setLocation] = useState(locations.includes(params.get("lokasi") ?? "") ? params.get("lokasi")! : "Semua lokasi");
  const [availability, setAvailability] = useState("Semua ketersediaan");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [needsPortfolio, setNeedsPortfolio] = useState(false);
  const [needsKnowledge, setNeedsKnowledge] = useState(false);
  const [sort, setSort] = useState(sorts[0]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [tab, query, location, availability, selectedCats, needsIdentity, needsPortfolio, needsKnowledge, sort]);

  useEffect(() => {
    setLocation(locations.includes(params.get("lokasi") ?? "") ? params.get("lokasi")! : "Semua lokasi");
    setQuery(params.get("kategori") ?? "");
  }, [params]);
  const results = useMemo(() => {
    let list = practitioners.filter((p) => {
      if (tab === "vendor" && p.categoryId !== "vendor") return false;
      if (tab === "budaya" && p.categoryId === "vendor") return false;
      if (location !== "Semua lokasi" && !p.city.includes(location)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!`${p.name} ${p.role} ${p.category} ${p.expertise.join(" ")} ${p.city}`.toLowerCase().includes(q)) return false;
      }
      if (selectedCats.length && !selectedCats.includes(p.categoryId)) return false;
      if (needsIdentity && p.verifiedIdentity !== "verified") return false;
      if (needsPortfolio && p.verifiedPortfolio !== "verified") return false;
      if (needsKnowledge && p.verifiedKnowledge !== "verified") return false;
      if (availability === "Respons cepat" && !p.instant) return false;
      if (availability.includes("Juni") && p.available.includes("Juli")) return false;
      if (availability.includes("Juli") && !p.available.includes("Juli")) return false;
      return true;
    });
    if (sort === "Rating tertinggi") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "Harga terendah") list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "Pengalaman terlama") list = [...list].sort((a, b) => b.experience - a.experience);
    return list;
  }, [tab, location, query, selectedCats, needsIdentity, needsPortfolio, needsKnowledge, availability, sort]);

  const toggleCat = (name: string) =>
    setSelectedCats((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const runSearch = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 450);
  };

  const reset = () => {
    setQuery("");
    setLocation("Semua lokasi");
    setAvailability("Semua ketersediaan");
    setSelectedCats([]);
    setNeedsIdentity(false);
    setNeedsPortfolio(false);
    setNeedsKnowledge(false);
    setSort(sorts[0]);
  };

  const activeFilters = [location !== "Semua lokasi" ? location : "", availability !== "Semua ketersediaan" ? availability : "", ...selectedCats, needsIdentity ? "Identitas terverifikasi" : "", needsPortfolio ? "Portofolio diperiksa" : "", needsKnowledge ? "Pengetahuan tervalidasi" : ""].filter(Boolean);

  const FilterPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-ink"><SlidersHorizontal className="h-3.5 w-3.5 text-sand-deep" /> Saring hasil</h2>
        <button onClick={reset} className="flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink"><RotateCcw className="h-3 w-3" /> Atur ulang</button>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">Kategori budaya</label>
        <div className="space-y-1.5">
          {categories.map((c) => (
            <Checkbox key={c.id} checked={selectedCats.includes(c.id)} onChange={() => toggleCat(c.id)} label={<span className="flex w-full items-center justify-between gap-2"><span>{c.short}</span><span className="text-[13px] text-muted">{c.count}</span></span>} />
          ))}
        </div>
      </div>
      <div className="border-t border-line pt-4">
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">Lokasi</label>
        <Select value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Saring lokasi">
          {locations.map((l) => <option key={l}>{l}</option>)}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">Ketersediaan</label>
        <Select value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Saring ketersediaan">
          {availabilities.map((a) => <option key={a}>{a}</option>)}
        </Select>
      </div>
      <div className="border-t border-line pt-4">
        <label className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-muted"><ShieldCheck className="h-3 w-3 text-sand-deep" /> Status screening</label>
        <div className="space-y-2">
          <Checkbox checked={needsIdentity} onChange={setNeedsIdentity} label="Identitas terverifikasi" />
          <Checkbox checked={needsPortfolio} onChange={setNeedsPortfolio} label="Portofolio diperiksa" />
          <Checkbox checked={needsKnowledge} onChange={setNeedsKnowledge} label="Konteks budaya ditinjau narasumber" />
        </div>
        <p className="mt-2.5 rounded-lg border border-line bg-[#FBFAF6] p-2 text-[13px] leading-relaxed text-muted">Setiap lapis diperiksa terpisah. Tidak semua profil memiliki ketiganya.</p>
      </div>
      <div className="rounded-xl border border-sand/40 bg-sand-light/40 p-3">
        <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><Sparkles className="h-3 w-3 text-sand-deep" /> Butuh bantuan memilih?</div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">Tim VAKSARA dapat membantu memahami perbedaan kategori tanpa mengarahkan pilihan.</p>
        <button onClick={() => setAuthMode("masuk")} className="mt-2 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Konsultasi gratis</button>
      </div>
    </div>
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[#F2EEE4]">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-60" />
        <div className="relative mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <button onClick={() => navigate("beranda")} className="hover:text-ink">Beranda</button>
            <span>/</span>
            <span className="text-ink">{initialTab === "vendor" ? "Layanan Pernikahan" : "Jelajahi Pelaku Budaya"}</span>
          </div>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-sand-deep"><ShieldCheck className="h-3.5 w-3.5" /> Direktori dengan screening berlapis</div>
              <h1 className="text-balance font-display text-[2rem] font-semibold leading-tight text-ink sm:text-[2.5rem]">
                {initialTab === "vendor" ? "Layanan pendukung, dari katering hingga dokumentasi." : "Pelaku budaya untuk setiap babak pernikahan Anda."}
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
                {initialTab === "vendor"
                  ? "Vendor pendukung turut melewati pemeriksaan identitas dan portofolio. Perjanjian dan BAST tetap dapat digunakan untuk menjaga kejelasan layanan."
                  : "Temukan pemandu prosesi, pemusik, perajin, dan penata busana dengan konteks praktik yang dapat dibaca. Anda yang memutuskan, VAKSARA membantu memberi kejelasan."}
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white/70 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sand"><ShieldCheck className="h-4 w-4" /></span>
              <p className="text-[13px] leading-relaxed text-muted"><strong className="text-ink">Screening transparan.</strong> Identitas, portofolio, dan pengetahuan budaya ditandai terpisah pada setiap profil.</p>
            </div>
            <button onClick={() => navigate("direktori-makassar")} className="flex items-center gap-2.5 rounded-xl border border-line bg-white/70 p-3 text-left hover:border-ink">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-ink"><MapPin className="h-4 w-4" /></span>
              <span className="text-[13px] leading-relaxed text-muted"><strong className="text-ink">Direktori publik Makassar →</strong> {publicVendors.length} fotografer, sanggar, katering, perias, dan rumah pengantin yang belum terdaftar di VAKSARA.</span>
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-2 rounded-xl border border-line bg-white p-2 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, layanan, atau keahlian — mis. mappacci, pakkacaping, tenun"
                className="h-10 w-full rounded-lg border-0 bg-transparent pl-9 pr-8 text-[15px] text-ink outline-none placeholder:text-muted/80"
                aria-label="Cari pelaku budaya"
              />
              {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink" aria-label="Hapus pencarian"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <Button variant="secondary" size="md" onClick={() => setFiltersOpen(true)} className="lg:hidden" leading={<Filter className="h-3.5 w-3.5" />}>Saring {activeFilters.length > 0 && `(${activeFilters.length})`}</Button>
            <Button size="md" onClick={runSearch} leading={<Search className="h-3.5 w-3.5" />}>Cari</Button>
          </div>
        </div>
      </section>

      {liveEnabled && initialTab === "budaya" && <RegisteredListings />}
      {showSampleProfiles() ? (
        <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-1">
              <button onClick={() => setTab("budaya")} className={cn("rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors", tab === "budaya" ? "bg-ink text-cream" : "text-muted hover:text-ink")}>
                Pelaku budaya <span className={cn("ml-1 rounded px-1 py-0.5 text-[12px]", tab === "budaya" ? "bg-white/15" : "bg-[#F1EFE9]")}>{practitioners.filter((p) => p.categoryId !== "vendor").length}</span>
              </button>
              <button onClick={() => setTab("vendor")} className={cn("rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors", tab === "vendor" ? "bg-ink text-cream" : "text-muted hover:text-ink")}>
                Vendor pendukung <span className={cn("ml-1 rounded px-1 py-0.5 text-[12px]", tab === "vendor" ? "bg-white/15" : "bg-[#F1EFE9]")}>{practitioners.filter((p) => p.categoryId === "vendor").length}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-[14px] text-muted sm:block">{results.length} profil ditemukan</span>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan hasil" className="h-8 appearance-none rounded-lg border border-line bg-white pl-2.5 pr-7 text-[14px] font-semibold text-ink outline-none">
                  {sorts.map((s) => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[228px_1fr]">
            <aside className="hidden lg:block">
              <Card className="sticky top-[76px] p-4">{FilterPanel}</Card>
            </aside>

            <div>
              {activeFilters.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-muted">Saringan aktif:</span>
                  {activeFilters.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full border border-sand/50 bg-sand-light/60 px-2 py-1 text-[13px] font-semibold text-[#6E5229]">
                      {f}
                      <button onClick={f === location ? () => setLocation("Semua lokasi") : f === availability ? () => setAvailability("Semua ketersediaan") : () => reset()} aria-label={`Hapus saringan ${f}`}><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                  <button onClick={reset} className="text-[13px] font-semibold text-ink underline decoration-sand underline-offset-2">Bersihkan semua</button>
                </div>
              )}
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
                      <div className="skeleton aspect-[16/11] w-full" />
                      <div className="space-y-2 p-3.5">
                        <div className="skeleton h-3 w-2/3 rounded" /><div className="skeleton h-2.5 w-1/2 rounded" /><div className="skeleton h-2 w-full rounded" /><div className="skeleton h-7 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div>
                  <EmptyState
                    icon={<Search className="h-5 w-5" />}
                    title="Belum ada profil yang cocok"
                    description="Coba longgarkan lokasi atau status screening. Anda juga bisa menjelajahi kategori lain — setiap keluarga memiliki kebutuhan yang berbeda."
                    action={<Button size="sm" variant="secondary" onClick={reset}>Atur ulang saringan</Button>}
                  />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Alert tone="info" title="Tips pencarian">Gunakan nama tradisi seperti "pakkacaping" atau "mappacci", atau pilih kategori budaya di panel saringan.</Alert>
                    <Alert tone="warn" title="Privasi & etika">Sebagian praktik bersifat privat. Hubungi pelaku budaya untuk memahami batasan sebelum meminta layanan.</Alert>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[14px] text-muted"><span className="font-bold text-ink">{results.length}</span> profil {tab === "budaya" ? "pelaku budaya" : "vendor pendukung"} · data demonstrasi</p>
                    <div className="hidden items-center gap-1 text-[13px] text-muted sm:flex"><ShieldCheck className="h-3 w-3 text-sand-deep" /> Diperbarui Juni 2027</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((p) => <PractitionerCard key={p.id} p={p} />)}
                  </div>
                  <Card className="mt-4 flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[15px] font-bold text-ink">Tidak menemukan layanan yang Anda butuhkan?</p>
                      <p className="mt-0.5 text-[14px] leading-relaxed text-muted">Ceritakan kebutuhan Anda. Tim kurasi akan membantu menemukan pelaku budaya yang sesuai, tanpa biaya.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setAuthMode("daftar")} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Minta rekomendasi</Button>
                  </Card>
                  <p className="mt-4 flex items-start gap-1.5 text-[13px] leading-relaxed text-muted"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-sand-deep" /> Profil dan ulasan pada prototipe ini bersifat ilustratif. VAKSARA tidak menampilkan biaya iklan sebagai hasil pencarian organik.</p>
                </>
              )}
            </div>
          </div>
        </section>
      ) : <RealOnlyNotice />}

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="absolute inset-0 bg-forest/55 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} aria-label="Tutup saringan" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-cream p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[1.2rem] font-semibold text-ink">Saring direktori</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-lg border border-line bg-white p-1.5" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <Card className="p-4">{FilterPanel}</Card>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={reset}>Atur ulang</Button>
              <Button onClick={() => setFiltersOpen(false)}>Terapkan {results.length} hasil</Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare tray */}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 py-2.5 shadow-[0_-10px_30px_-20px_rgba(22,51,46,.35)] backdrop-blur-md">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold text-ink">Bandingkan ({compare.length}/3)</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {compare.map((id) => {
                const p = practitioners.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full border border-line bg-cream py-1 pl-1 pr-2 text-[13px] font-semibold text-ink">
                    <Avatar name={p.name} src={p.image} size="xs" /> <span className="max-w-[100px] truncate">{p.name}</span>
                    <button onClick={() => toggleCompare(id)} aria-label={`Hapus ${p.name} dari perbandingan`}><X className="h-2.5 w-2.5 text-muted" /></button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => [...compare].forEach((id) => toggleCompare(id))}>Bersihkan</Button>
              <Button size="sm" onClick={() => setCompareOpen(true)} disabled={compare.length < 2}>Bandingkan</Button>
            </div>
          </div>
        </div>
      )}

      {compareOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-forest/55 backdrop-blur-sm" onClick={() => setCompareOpen(false)} aria-label="Tutup perbandingan" />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-line px-4 py-3.5">
              <div>
                <h3 className="font-display text-[1.25rem] font-semibold text-ink">Bandingkan pelaku budaya</h3>
                <p className="mt-0.5 text-[14px] text-muted">Bandingkan ruang lingkup dan status pemeriksaan. Harga adalah titik awal, bukan tawaran akhir.</p>
              </div>
              <button onClick={() => setCompareOpen(false)} className="rounded p-1 hover:bg-cream" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line bg-[#FBFAF6]">
                    <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-muted">Kriteria</th>
                    {compare.map((id) => {
                      const p = practitioners.find((x) => x.id === id)!;
                      return (
                        <th key={id} className="min-w-[150px] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={p.name} src={p.image} size="sm" />
                            <button onClick={() => navigate(`praktisi/${p.id}`)} className="text-left text-[14px] font-bold text-ink hover:underline">{p.name}</button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {[
                    ["Kategori", (p: Practitioner) => p.category],
                    ["Lokasi", (p: Practitioner) => `${p.city} · ${p.area}`],
                    ["Mulai dari", (p: Practitioner) => formatIDR(p.priceFrom)],
                    ["Pengalaman", (p: Practitioner) => `${p.experience} tahun`],
                    ["Rating", (p: Practitioner) => `${p.rating} (${p.reviews} ulasan)`],
                    ["Ketersediaan", (p: Practitioner) => p.available],
                    ["Waktu respons", (p: Practitioner) => p.responseTime],
                  ].map(([label, fn]) => (
                    <tr key={label as string}>
                      <td className="px-3 py-2.5 text-[13px] font-semibold text-muted">{label as string}</td>
                      {compare.map((id) => {
                        const p = practitioners.find((x) => x.id === id)!;
                        return <td key={id} className="px-3 py-2.5 font-medium text-ink">{(fn as (p: Practitioner) => string)(p)}</td>;
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-3 py-2.5 text-[13px] font-semibold text-muted">Screening</td>
                    {compare.map((id) => {
                      const p = practitioners.find((x) => x.id === id)!;
                      return (
                        <td key={id} className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            {[["Identitas", p.verifiedIdentity], ["Portofolio", p.verifiedPortfolio], ["Budaya", p.verifiedKnowledge]].map(([l, s]) => (
                              <span key={l as string} className="flex items-center gap-1 text-[13px]">
                                {s === "verified" ? <Check className="h-2.5 w-2.5 text-[#4C8068]" /> : <span className="h-2.5 w-2.5 rounded-full border border-[#C08D3B]" />}
                                <span className={s === "verified" ? "text-ink-soft" : "text-[#855A16]"}>{l as string} {s !== "verified" && "· tinjau"}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#FBFAF6] px-4 py-3">
              <p className="flex items-center gap-1 text-[13px] text-muted"><MapPin className="h-3 w-3 text-sand-deep" /> Periksa ketersediaan sebelum mengirim permintaan.</p>
              <Button size="sm" onClick={() => setCompareOpen(false)}>Selesai membandingkan</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

