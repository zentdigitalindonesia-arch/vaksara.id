import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  Progress,
  SectionCard,
  Select,
  Tabs,
  Textarea,
  VerificationBadge,
} from "@/components/ui";
import { formatIDR, practitioners } from "@/data";
import { useApp } from "@/store";
import { useEventPlan } from "@/EventPlanContext";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

export default function PractitionerPage({ id }: { id: string }) {
  const { route, navigate, saved, toggleSaved, compare, toggleCompare, sendInquiry, toast, inquiries } = useApp();
  const p = practitioners.find((x) => x.id === id) ?? practitioners[0];
  const [tab, setTab] = useState<"tentang" | "portofolio" | "ulasan">("tentang");
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(p.packages[0]?.name ?? "");
  const { plan } = useEventPlan();
  const [selectedDate, setSelectedDate] = useState(plan.date || "2027-06-12");
  // Kesinambungan VAKSARA 1.0: kontak WhatsApp langsung. Pada demo nomor pelaku belum dipublikasikan,
  // sehingga WhatsApp dibuka dengan pesan siap kirim dan pengguna memilih kontak sendiri.
  const whatsappText = `Halo ${p.name}, saya menemukan profil Anda di VAKSARA. Saya ingin bertanya tentang layanan ${p.category.toLowerCase()} untuk ${plan.name || "acara keluarga kami"}${plan.date ? ` pada ${plan.date}` : ""}${plan.location ? ` di ${plan.location}` : ""}.`;
  const [message, setMessage] = useState("");
  const [guestCount, setGuestCount] = useState("300");
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (route.includes("tanya=1")) setInquiryOpen(true);
  }, [route]);

  useEffect(() => {
    setSelectedPackage(p.packages[0]?.name ?? "");
    setSent(false);
    setTab("tentang");
  }, [p.id]);

  const minDate = new Date().toISOString().slice(0, 10);
  const isSaved = saved.includes(p.id);
  const isCompared = compare.includes(p.id);
  const activePackage = p.packages.find((x) => x.name === selectedPackage) ?? p.packages[0];

  const submitInquiry = () => {
    if (!message.trim() || message.trim().length < 20) {
      setError("Tuliskan kebutuhan Anda minimal 20 karakter agar pelaku budaya dapat menanggapi dengan tepat.");
      return;
    }
    if (!selectedDate || selectedDate < minDate) {
      setError("Pilih tanggal acara hari ini atau sesudahnya.");
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
      const caseId = sendInquiry({
        practitionerId: p.id,
        practitioner: p.name,
        message,
        date: selectedDate,
        packageName: activePackage?.name ?? "Konsultasi",
      });
      setCreatedCaseId(caseId ?? "");
      toast("Permintaan demo dicatat pada sesi ini. Tidak ada pesan yang dikirim ke praktisi.", "success", "Permintaan dicatat (demo)");
    }, 800);
  };

  return (
    <>
      <section className="border-b border-line bg-[#F3F0E7]">
        <div className="mx-auto max-w-[1240px] px-4 pb-0 pt-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[13px] font-medium text-muted">
            <button onClick={() => navigate("beranda")} className="shrink-0 hover:text-ink">Beranda</button>
            <ChevronRight className="h-2.5 w-2.5 shrink-0" />
            <button onClick={() => navigate("jelajahi")} className="shrink-0 hover:text-ink">Jelajahi pelaku budaya</button>
            <ChevronRight className="h-2.5 w-2.5 shrink-0" />
            <span className="shrink-0 font-semibold text-ink">{p.name}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pb-3">
            <button onClick={() => navigate("jelajahi")} className="flex items-center gap-1 text-[14px] font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke direktori</button>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { toggleSaved(p.id); toast(isSaved ? "Profil dihapus dari simpanan." : "Profil disimpan untuk dibandingkan nanti.", "info"); }} className={cn("flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[14px] font-semibold transition-colors", isSaved ? "border-sand text-[#7A5A2E]" : "border-line text-ink-soft hover:border-sand")}>
                <Bookmark className={cn("h-3 w-3", isSaved && "fill-[#7A5A2E]")} /> {isSaved ? "Tersimpan" : "Simpan"}
              </button>
              <button onClick={() => toggleCompare(p.id)} className={cn("flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[14px] font-semibold transition-colors", isCompared ? "border-ink bg-ink text-cream" : "border-line text-ink-soft hover:border-sand")}>
                <ArrowRight className="h-3 w-3" /> {isCompared ? "Dalam banding" : "Bandingkan"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_330px] xl:gap-6">
          <div className="min-w-0">
            {/* Profile header */}
            <Card className="overflow-hidden">
              <div className="relative h-32 sm:h-40">
                <img src={p.cover} alt={`Dokumentasi layanan ${p.name}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-forest/55 via-forest/20 to-transparent" />
                <Badge tone="dark" className="absolute left-3 top-3 border-white/20 bg-forest/60 text-[13px] backdrop-blur-sm">{p.category}</Badge>
              </div>
              <div className="relative px-4 pb-4 sm:px-5">
                <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-end gap-3">
                    <img src={p.image} alt={`Foto profil ${p.name}`} className="h-[76px] w-[76px] rounded-xl border-[3px] border-white object-cover shadow-md sm:h-[88px] sm:w-[88px]" />
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="amber" className="text-[12px]">Profil contoh</Badge>
                        <Badge tone="green" icon={<ShieldCheck className="h-2.5 w-2.5" />} className="text-[12px]">Identitas (simulasi)</Badge>
                        <Badge tone="sand" className="text-[12px]">Respons {p.responseTime}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <div className="flex items-center gap-1 text-[14px] font-bold text-ink"><Star className="h-3.5 w-3.5 fill-sand text-sand" /> {p.rating}<span className="font-normal text-muted">({p.reviews} ulasan contoh)</span></div>
                    <span className="h-3 w-px bg-line" />
                    <span className="text-[14px] text-muted">{p.projects}+ layanan (contoh)</span>
                  </div>
                </div>
                <div className="mt-3">
                  <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-[2.1rem]">{p.name}</h1>
                  <p className="mt-1 text-[15px] font-medium text-ink-soft">{p.role}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-muted">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-sand-deep" /> {p.area}, {p.city}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-sand-deep" /> Aktif merespons · {p.responseTime}</span>
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-sand-deep" /> {p.languages.join(", ")}</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
                  {[
                    { v: `${p.experience} th`, l: "Pengalaman" },
                    { v: `${p.projects}+`, l: "Layanan" },
                    { v: p.available.split("—")[0].trim(), l: "Ketersediaan" },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="text-[15px] font-bold text-ink">{s.v}</div>
                      <div className="text-[13px] text-muted">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="mt-4">
              <Tabs items={[{ id: "tentang", label: "Tentang & keahlian" }, { id: "portofolio", label: "Portofolio", count: p.portfolio.length }, { id: "ulasan", label: "Ulasan", count: p.reviewsList.length }]} active={tab} onChange={setTab} />
            </div>

            {tab === "tentang" && (
              <div className="mt-4 space-y-4">
                <Card className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-light text-sand-deep"><Users className="h-4 w-4" /></span>
                    <div>
                      <h2 className="text-[15px] font-bold text-ink">Tentang dan pendekatan kerja</h2>
                      <p className="mt-2 text-[15px] leading-[1.8] text-ink-soft">{p.summary}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-line bg-[#FBFAF6] p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-sand-deep"><Sparkles className="h-3 w-3" /> Konteks budaya</div>
                    <p className="text-[15px] italic leading-relaxed text-ink-soft">"{p.context}"</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted"><BookOpen className="h-3 w-3" /> Disampaikan oleh pelaku budaya dan ditinjau saat screening.</div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">Keahlian</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {p.expertise.map((e) => <span key={e} className="rounded-md border border-line bg-white px-2 py-1 text-[14px] font-medium text-ink-soft">{e}</span>)}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">Cakupan layanan</h3>
                      <p className="flex items-start gap-1.5 text-[14px] leading-relaxed text-ink-soft"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-sand-deep" /> {p.city} dan sekitarnya. Biaya perjalanan di luar area dibicarakan sebelum perjanjian.</p>
                    </div>
                  </div>
                </Card>

                <SectionCard title="Portofolio terpilih" subtitle="Karya dan dokumentasi dengan konteks. Foto digunakan atas izin pihak terkait." action={<button onClick={() => setTab("portofolio")} className="text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Lihat semua</button>}>
                  <div className="grid grid-cols-3 gap-2">
                    {p.portfolio.map((item, i) => (
                      <button key={item.title} onClick={() => setLightbox(i)} className="group relative overflow-hidden rounded-lg border border-line">
                        <img src={item.image} alt={item.title} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 to-transparent p-1.5 pt-4 text-left text-[12px] font-semibold text-cream">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Pemeriksaan profil" subtitle="Tiga lapis yang diperiksa secara terpisah. Status dapat berubah bila ada peninjauan ulang." action={<Badge tone="outline" className="text-[12px]">Diperbarui Mei 2026</Badge>}>
                  <div className="space-y-2">
                    {[
                      { kind: "identity" as const, state: p.verifiedIdentity, title: "Identitas dan kontak", detail: "Nama, kontak, dan dokumen identitas dicocokkan dengan pemilik akun." },
                      { kind: "portfolio" as const, state: p.verifiedPortfolio, title: "Portofolio dan pengalaman", detail: "Contoh karya diperiksa untuk relevansi, izin penggunaan, dan atribusi." },
                      { kind: "knowledge" as const, state: p.verifiedKnowledge, title: "Pengetahuan budaya", detail: "Wawancara bersama peninjau budaya untuk memahami konteks praktik dan batasan." },
                    ].map((row) => (
                      <div key={row.kind} className="flex flex-col gap-1.5 rounded-lg border border-line bg-white p-3 sm:flex-row sm:items-center">
                        <VerificationBadge kind={row.kind} state={row.state} />
                        <div className="min-w-0 flex-1 sm:pl-2">
                          <div className="text-[14px] font-semibold text-ink">{row.title}</div>
                          <div className="mt-0.5 text-[13px] leading-relaxed text-muted">{row.detail}</div>
                        </div>
                        <span className={cn("shrink-0 self-start rounded px-1.5 py-0.5 text-[12px] font-bold sm:self-auto", row.state === "verified" ? "bg-[#EDF4EF] text-[#2B5949]" : "bg-[#FBF3E3] text-[#855A16]")}>
                          {row.state === "verified" ? "Selesai" : "Dalam tinjauan"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Alert tone="trust" className="mt-3" title="Batas verifikasi">VAKSARA memeriksa informasi yang ditampilkan dan proses screening, tetapi tidak menjamin setiap hasil layanan. Keputusan akhir tetap pada keluarga. <button onClick={() => navigate("tentang")} className="font-bold underline decoration-sand underline-offset-2">Baca metodologi</button></Alert>
                </SectionCard>

                <SectionCard title="Sumber & atribusi pengetahuan" subtitle="VAKSARA tidak menganggap satu praktik mewakili seluruh tradisi." bodyClassName="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage text-[#2B5949]"><BookOpen className="h-4 w-4" /></span>
                    <div>
                      <p className="text-[14px] leading-relaxed text-ink-soft">{p.sourceNote}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone="green" icon={<Check className="h-2.5 w-2.5" />} className="text-[12px]">Sumber dicantumkan</Badge>
                        <span className="text-[13px] text-muted">Terakhir diperiksa 12 Mei 2026</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === "portofolio" && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {p.portfolio.map((item, i) => (
                    <Card key={item.title} hover className="overflow-hidden">
                      <button onClick={() => setLightbox(i)} className="block w-full text-left">
                        <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                        <div className="p-3">
                          <h3 className="text-[15px] font-bold text-ink">{item.title}</h3>
                          <p className="mt-0.5 text-[13px] text-muted">{item.caption}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-sand-deep">Lihat detail <ExternalLink className="h-2.5 w-2.5" /></span>
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
                <Alert tone="warn" title="Penggunaan karya & budaya">Dokumentasi pada portofolio tidak boleh digunakan ulang tanpa izin. Beberapa elemen adat mungkin tidak dapat direproduksi untuk kebutuhan komersial. Diskusikan dengan pelaku budaya.</Alert>
              </div>
            )}

            {tab === "ulasan" && (
              <div className="mt-4 space-y-3">
                <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="font-display text-[2.4rem] font-semibold leading-none text-ink">{p.rating}</div>
                    <div>
                      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("h-3 w-3", i <= Math.round(p.rating) ? "fill-sand text-sand" : "text-line")} />)}</div>
                      <p className="mt-1 text-[13px] text-muted">dari {p.reviews} ulasan contoh · kelak hanya dari kerja sama yang selesai BAST</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 sm:ml-6">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <div key={n} className="flex items-center gap-2">
                        <span className="w-2 text-[12px] text-muted">{n}</span>
                        <Progress value={n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 6 : 0} tone="sand" height="h-1" />
                        <span className="w-5 text-right text-[12px] text-muted">{n === 5 ? "78%" : n === 4 ? "16%" : n === 3 ? "6%" : "0%"}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                {p.reviewsList.map((r) => (
                  <Card key={r.name} className="p-4">
                    <div className="flex items-start gap-2.5">
                      <Avatar name={r.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[14px] font-bold text-ink">{r.name}</div>
                          <div className="flex items-center gap-1 text-[12px] text-muted"><CalendarDays className="h-2.5 w-2.5" />{r.date}</div>
                        </div>
                        <div className="mt-1 flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("h-2.5 w-2.5", i <= r.rating ? "fill-sand text-sand" : "text-line")} />)}</div>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{r.text}</p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded bg-[#EDF4EF] px-1.5 py-0.5 text-[12px] font-semibold text-[#2B5949]"><ShieldCheck className="h-2 w-2" /> Ulasan contoh</span>
                      </div>
                    </div>
                  </Card>
                ))}
                <p className="text-[13px] leading-relaxed text-muted">Ulasan pada prototipe ini bersifat ilustratif. Ulasan hanya dapat ditulis setelah perjanjian dan BAST terkait tercatat.</p>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-[76px] lg:self-start">
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-[#FBFAF6] px-4 py-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Mulai dari</div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-display text-[1.5rem] font-semibold leading-none text-ink">{formatIDR(p.priceFrom)}</span>
                  <span className="text-[13px] text-muted">/ layanan</span>
                </div>
                <div className="mt-1 text-[13px] text-muted">Harga dapat menyesuaikan ruang lingkup.</div>
              </div>
              <div className="p-4">
                <div className="mb-1.5 flex items-center justify-between text-[14px] font-bold text-ink">
                  <span>Pilih paket</span>
                  <span className="text-[12px] font-normal text-muted">{p.packages.length} pilihan</span>
                </div>
                <div className="space-y-1.5">
                  {p.packages.map((pkg) => (
                    <button key={pkg.name} onClick={() => setSelectedPackage(pkg.name)} className={cn("w-full rounded-lg border p-2.5 text-left transition-colors", selectedPackage === pkg.name ? "border-ink bg-sage/70" : "border-line bg-white hover:border-sand")}>
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-bold text-ink">{pkg.name}</span>
                        <span className="shrink-0 text-[14px] font-bold text-ink">{formatIDR(pkg.price, true)}</span>
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{pkg.description}</span>
                      {selectedPackage === pkg.name && (
                        <span className="mt-1.5 block space-y-0.5">
                          {pkg.includes.slice(0, 3).map((x) => <span key={x} className="flex items-start gap-1 text-[12px] text-ink-soft"><Check className="mt-0.5 h-2 w-2 shrink-0 text-[#4C8068]" />{x}</span>)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[14px] font-bold text-ink">Ketersediaan</span>
                    <span className="text-[12px] text-muted">Juni 2027</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {p.availability.map((a) => (
                      <button
                        key={a.date}
                        onClick={() => setSelectedDate(a.date)}
                        disabled={a.state === "Penuh"}
                        className={cn(
                          "rounded-md border px-1 py-1.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          selectedDate === a.date ? "border-ink bg-ink text-cream" : a.state === "Terbatas" ? "border-[#EAD7AF] bg-[#FCF6E9] text-[#855A16]" : "border-line bg-white text-ink-soft hover:border-sand"
                        )}
                      >
                        <span className="block text-[11px] uppercase">{new Date(a.date).toLocaleDateString("id-ID", { weekday: "short" })}</span>
                        <span className="block text-[14px] font-bold">{new Date(a.date).getDate()}</span>
                        <span className={cn("block text-[10px]", selectedDate === a.date ? "text-cream/65" : "text-muted")}>{a.state === "Tersedia" ? "buka" : a.state === "Terbatas" ? "terbatas" : "penuh"}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Pilih tanggal untuk dibawa ke formulir pertanyaan. Ketersediaan belum menjadi pemesanan.</p>
                </div>

                <Button full className="mt-3" onClick={() => { setInquiryOpen(true); setSent(false); }} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Kirim pertanyaan</Button>
                <Button full variant="secondary" size="sm" className="mt-1.5" onClick={() => { setInquiryOpen(true); setSent(false); }} leading={<MessageSquare className="h-3.5 w-3.5" />}>Minta penawaran khusus</Button>
                <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#2E7D4F] bg-[#E9F5EE] px-3 py-2 text-[15px] font-semibold text-[#1E5C38] hover:bg-[#DCEFE3]">Hubungi via WhatsApp</a>
                <p className="mt-1 text-[14px] leading-snug text-muted">Demo: nomor pelaku tampil setelah pelaku menyetujui publikasi kontak. Catat juga sebagai permintaan agar kesepakatan tetap tercatat.</p>
                <div className="mt-3 flex items-center justify-center gap-3 border-t border-line pt-2.5 text-[13px] text-muted">
                  <button onClick={() => { toggleSaved(p.id); toast(isSaved ? "Simpanan dihapus." : "Profil disimpan.", "info"); }} className="flex items-center gap-1 hover:text-ink"><Heart className={cn("h-3 w-3", isSaved && "fill-[#A4453B] text-[#A4453B]")} /> {isSaved ? "Tersimpan" : "Simpan"}</button>
                  <span className="h-2.5 w-px bg-line" />
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-sand-deep" /> Tanpa biaya bertanya</span>
                </div>
              </div>
            </Card>

            <div className="mt-3 rounded-xl border border-sand/40 bg-sand-light/45 p-3">
              <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><FileText className="h-3 w-3 text-sand-deep" /> Bekerja dengan ruang aman</div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">Gunakan perjanjian layanan untuk mencatat lingkup, termin, dan hasil kerja. BAST membantu kedua pihak menutup layanan dengan jelas.</p>
              <button onClick={() => navigate("perjanjian/baru")} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Buat draf perjanjian <ArrowRight className="h-2.5 w-2.5" /></button>
            </div>

            {inquiries.length > 0 && (
              <div className="mt-3 rounded-xl border border-line bg-white p-3">
                <div className="flex items-center justify-between"><span className="text-[14px] font-bold text-ink">Pertanyaan Anda</span><span className="text-[12px] text-muted">sesi ini</span></div>
                <div className="mt-1.5 space-y-1.5">
                  {inquiries.slice(0, 2).map((i) => (
                    <div key={i.id} className="flex items-center gap-1.5 text-[13px]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[#2B5949]"><Check className="h-2 w-2" /></span>
                      <span className="min-w-0 flex-1 truncate text-ink-soft">{i.practitioner}</span>
                      <span className="shrink-0 text-muted">{i.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* INQUIRY MODAL */}
      <Modal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        title={sent ? "Kebutuhan Anda tercatat" : `Hubungi ${p.name}`}
        description={sent ? undefined : "Pertanyaan ini tidak mengikat. Anda dapat mendiskusikan kebutuhan sebelum membuat perjanjian."}
        size="lg"
        eyebrow="Pertanyaan layanan"
        footer={
          sent ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setInquiryOpen(false)}>Tutup</Button>
              <Button size="sm" onClick={() => { setInquiryOpen(false); navigate(createdCaseId ? `planner/vendor?case=${encodeURIComponent(createdCaseId)}` : "planner/vendor"); }} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Lanjutkan alur kerja sama</Button>
            </>
          ) : (
            <>
              <div className="mr-auto hidden items-center gap-1 text-[13px] text-muted sm:flex"><ShieldCheck className="h-3 w-3 text-sand-deep" /> Data Anda tidak dibagikan ke pihak lain.</div>
              <Button variant="secondary" size="sm" onClick={() => setInquiryOpen(false)}>Batal</Button>
              <Button size="sm" loading={loading} onClick={submitInquiry} leading={<Send className="h-3.5 w-3.5" />}>Kirim pertanyaan</Button>
            </>
          )
        }
      >
        {sent ? (
          <div className="py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><CheckCircle2 className="h-7 w-7" /></div>
            <p className="mt-3 text-center text-[15px] leading-relaxed text-ink-soft">
              Pertanyaan Anda untuk <strong className="text-ink">{p.name}</strong> tercatat. Pelaku budaya biasanya menanggapi dalam {p.responseTime.toLowerCase()}. Lengkapi pendaftaran dan kirim draf melalui Alur kerja sama.
            </p>
            <div className="mx-auto mt-3 max-w-md rounded-xl border border-line bg-[#FBFAF6] p-3">
              <div className="flex items-center justify-between text-[14px]"><span className="text-muted">Paket diminati</span><span className="font-semibold text-ink">{activePackage?.name}</span></div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]"><span className="text-muted">Tanggal</span><span className="font-semibold text-ink">{new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]"><span className="text-muted">Perkiraan tamu</span><span className="font-semibold text-ink">{guestCount} tamu</span></div>
            </div>
            <div className="mt-3 rounded-lg border border-sand/40 bg-sand-light/50 px-3 py-2 text-[13px] leading-relaxed text-ink-soft">Prototipe: pertanyaan hanya tersimpan pada sesi peramban ini dan tidak dikirim ke pelaku budaya nyata.</div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_240px]">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama Anda" required>
                  <Input defaultValue="Nurul Amalia" readOnly className="bg-[#F7F5EF]" />
                </Field>
                <Field label="Tanggal acara" required>
                  <Input type="date" min={minDate} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Jenis layanan">
                  <Select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)}>
                    {p.packages.map((pkg) => <option key={pkg.name}>{pkg.name}</option>)}
                  </Select>
                </Field>
                <Field label="Perkiraan jumlah tamu">
                  <Input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} min={1} />
                </Field>
              </div>
              <Field label="Ceritakan kebutuhan Anda" required hint={`${message.length}/600`}>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 600))}
                  placeholder="Contoh: Kami merencanakan prosesi mappacci di rumah keluarga. Kedua keluarga berasal dari Gowa dan Wajo. Kami ingin berdiskusi mengenai susunan acara dan variasi yang mungkin dihormati bersama."
                  className="min-h-[110px]"
                />
              </Field>
              <Checkbox checked={true} onChange={() => { }} label={<span className="text-[13px] text-muted">Saya memahami bahwa pertanyaan ini bukan pemesanan dan tidak membuat kewajiban pembayaran.</span>} />
              {error && <Alert tone="error" title="Belum dapat dikirim">{error}</Alert>}
            </div>
            <div>
              <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={p.name} src={p.image} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-ink">{p.name}</div>
                    <div className="text-[12px] text-muted">{p.category} · {p.city}</div>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                  {[["Paket", activePackage?.name ?? "Konsultasi"], ["Mulai dari", formatIDR(activePackage?.price ?? p.priceFrom)], ["Respons", p.responseTime], ["Screening", "3 lapis diperiksa"]].map(([l, v]) => (
                    <div key={l} className="flex items-start justify-between gap-2 text-[13px]">
                      <span className="text-muted">{l}</span><span className="text-right font-semibold text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Alert tone="info" className="mt-2" title="Tips komunikasi">
                Sebutkan konteks keluarga dan pertanyaan spesifik. Hindari mengirim dokumen pribadi sebelum sepakat pada ruang lingkup.
              </Alert>
            </div>
          </div>
        )}
      </Modal>

      {/* LIGHTBOX */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-forest/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button className="absolute inset-0" onClick={() => setLightbox(null)} aria-label="Tutup foto" />
          <div className="relative w-full max-w-3xl">
            <img src={p.portfolio[lightbox].image} alt={p.portfolio[lightbox].title} className="max-h-[75vh] w-full rounded-xl object-contain" />
            <div className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-forest/50 px-3 py-2 text-cream">
              <div>
                <p className="text-[15px] font-semibold">{p.portfolio[lightbox].title}</p>
                <p className="text-[13px] text-cream/60">{p.portfolio[lightbox].caption}</p>
              </div>
              <button onClick={() => setLightbox(null)} className="rounded p-1 text-cream/70 hover:bg-white/10" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

