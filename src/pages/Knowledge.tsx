import { Badge, Button, Card, Field, Input, Modal, Select, Textarea, statusTone } from "@/components/ui";
import { images, knowledgeArticles, type KnowledgeArticle } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, CircleAlert, Clock, Filter, Flag, Globe2, Library, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function Knowledge() {
  const { route, navigate, toast, setAuthMode } = useApp();
  const initial = route.split("?")[1] ? new URLSearchParams(route.split("?")[1]).get("artikel") : null;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [article, setArticle] = useState<KnowledgeArticle | null>(initial ? knowledgeArticles.find((a) => a.id === initial) ?? null : null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [correctionSent, setCorrectionSent] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const cats = ["Semua", "Tradisi Bugis-Makassar", "Panduan keluarga", "Kriya & kain", "Seni pertunjukan", "Etika & komunitas"];
  const articles = useMemo(() => knowledgeArticles.filter((a) => (category === "Semua" || a.category === category) && `${a.title} ${a.excerpt} ${a.category}`.toLowerCase().includes(query.toLowerCase())), [query, category]);

  const submitCorrection = () => {
    if (correction.trim().length < 20) return;
    setCorrectionSent(true);
    toast("Permintaan koreksi diteruskan ke tim peninjau. Terima kasih telah membantu keakuratan.", "success", "Koreksi terkirim");
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[#F2EEE4]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-sand/30" />
        <div className="relative mx-auto max-w-[1240px] px-4 py-9 sm:px-6 sm:py-12">
          <div className="flex items-center gap-1.5 text-[13px] text-muted"><button onClick={() => navigate("beranda")} className="hover:text-ink">Beranda</button><span>/</span><span className="text-ink">Pengetahuan Budaya</span></div>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/50 bg-white/70 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep"><Library className="h-3 w-3" /> Pengetahuan dengan sumber</div>
              <h1 className="text-balance font-display text-[2.2rem] font-semibold leading-[1.08] text-ink sm:text-[2.9rem]">Belajar sebelum memilih. Bertanya sebelum menganggap.</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">Catatan tentang praktik Bugis-Makassar, panduan keluarga, dan etika berekonomi bersama budaya. Setiap artikel mencantumkan sumber dan status validasi — termasuk ketika masih perlu koreksi.</p>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-white p-2 shadow-sm sm:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari tradisi, panduan, atau topik" className="h-8 w-full bg-transparent pl-8 pr-2 text-[14px] outline-none" aria-label="Cari pengetahuan" /></div>
                <Button size="sm" variant="secondary" onClick={() => setAuthMode("daftar")}>Ajukan artikel</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted"><span className="flex items-center gap-1"><Flag className="h-2.5 w-2.5 text-[#C08D3B]" /> {knowledgeArticles.length} artikel draf · belum ditinjau narasumber adat</span><span className="flex items-center gap-1"><Globe2 className="h-2.5 w-2.5" /> Sulawesi Selatan, konteks lokal</span></div>
            </div>
            <button onClick={() => setArticle(knowledgeArticles[0])} className="group relative overflow-hidden rounded-2xl border-[4px] border-white text-left shadow-lg">
              <img src={images.brideGold} alt="Detail busana pengantin Bugis-Makassar" className="aspect-[4/2.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/25 to-transparent" />
              <div className="absolute inset-x-3 bottom-3">
                <Badge tone="sand" className="mb-1.5 text-[12px]">Artikel pilihan · 8 menit</Badge>
                <h2 className="font-display text-[16px] font-semibold leading-snug text-cream">Mappacci: makna, variasi, dan hal yang perlu disepakati keluarga</h2>
                <div className="mt-1.5 flex items-center gap-1 text-[12px] text-cream/65"><ShieldCheck className="h-2.5 w-2.5 text-sand" /> Draf — belum ditinjau narasumber<ArrowRight className="ml-auto h-3 w-3" /></div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto">
            {cats.map((c) => <button key={c} onClick={() => setCategory(c)} className={cn("shrink-0 rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-colors", category === c ? "border-ink bg-ink text-cream" : "border-line bg-white text-muted hover:border-sand")}>{c}</button>)}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted"><Filter className="h-3 w-3 text-sand-deep" /> {articles.length} artikel</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Card key={a.id} hover className="overflow-hidden">
              <button onClick={() => setArticle(a)} className="block w-full text-left">
                <div className="relative">
                  <img src={a.image} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
                  <div className="absolute inset-x-2.5 top-2.5 flex justify-between">
                    <Badge tone="dark" className="border-white/20 bg-forest/55 text-[12px] backdrop-blur-sm">{a.category}</Badge>
                    <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[12px] font-semibold text-forest">{a.read}</span>
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="flex items-center gap-1.5"><Badge tone={statusTone(a.status)} dot className="px-1.5 py-0.5 text-[11px]">{a.status}</Badge><span className="text-[12px] text-muted">{a.validator}</span></div>
                  <h3 className="mt-2 text-[15px] font-bold leading-snug text-ink">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-muted">{a.excerpt}</p>
                  <div className="mt-2 flex items-center justify-between"><span className="text-[12px] text-muted">Sumber: {a.source.split("&")[0]}</span><span className="flex items-center gap-1 text-[13px] font-bold text-ink">Baca <ArrowUpRight className="h-2.5 w-2.5" /></span></div>
                </div>
              </button>
            </Card>
          ))}
        </div>
        {articles.length === 0 && <Card className="mt-3 p-8 text-center"><BookOpen className="mx-auto h-6 w-6 text-sand-deep" /><p className="mt-2 text-[15px] font-bold text-ink">Belum ada artikel yang cocok</p><p className="mt-1 text-[14px] text-muted">Coba kata kunci lain atau pilih kategori berbeda.</p><Button size="sm" variant="secondary" className="mt-3" onClick={() => { setQuery(""); setCategory("Semua"); }}>Atur ulang</Button></Card>}
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-sand/40 bg-sand-light/40 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sand-deep"><Sparkles className="h-4 w-4" /></span>
              <div>
                <h3 className="text-[15px] font-bold text-ink">Bantu jaga keakuratan</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">Temukan perbedaan praktik, sumber yang perlu dilengkapi, atau konteks yang belum tepat? Ajukan koreksi dengan sopan. Pelaku budaya dan komunitas dapat menjadi peninjau.</p>
                <Button size="sm" variant="secondary" className="mt-2.5" onClick={() => { setArticle(null); setCorrectionOpen(true); }} leading={<Flag className="h-3 w-3" />}>Ajukan koreksi</Button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><ShieldCheck className="h-3.5 w-3.5 text-sand-deep" /> Cara kami menandai</div>
            <div className="mt-2 space-y-2">
              {[["Terverifikasi", "Ditunjau terhadap sumber & konteks.", "green"], ["Dalam tinjauan", "Sumber atau peninjau belum lengkap.", "amber"], ["Perlu koreksi", "Ditemukan ketidaktepatan; sedang diperbaiki.", "red"]].map(([l, d, t]) => <div key={l} className="flex gap-1.5"><Badge tone={t} className="mt-0.5 h-fit px-1.5 py-0.5 text-[11px]">{l}</Badge><p className="text-[12px] leading-relaxed text-muted">{d}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <Modal open={!!article} onClose={() => setArticle(null)} title={article?.title ?? ""} description={article ? `${article.category} · ${article.read} baca · ${article.status}` : ""} size="xl" eyebrow="Pengetahuan budaya" footer={article ? <><Button variant="ghost" size="sm" onClick={() => setSaved((s) => s.includes(article.id) ? s.filter((x) => x !== article.id) : [...s, article.id])} leading={<Bookmark className="h-3.5 w-3.5" />}>{saved.includes(article.id) ? "Tersimpan" : "Simpan artikel"}</Button><Button variant="secondary" size="sm" onClick={() => { setArticle(null); setCorrectionOpen(true); }} leading={<Flag className="h-3.5 w-3.5" />}>Ajukan koreksi</Button><Button size="sm" onClick={() => setArticle(null)}>Tutup</Button></> : <Button size="sm" onClick={() => setArticle(null)}>Tutup</Button>}>
        {article && (
          <div className="grid gap-5 md:grid-cols-[1fr_210px]">
            <div>
              <img src={article.image} alt="" className="aspect-[16/8] w-full rounded-xl object-cover" />
              <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone={statusTone(article.status)} dot>{article.status}</Badge><Badge tone="neutral">{article.category}</Badge><Badge tone="outline"><Clock className="h-2.5 w-2.5" />{article.read}</Badge></div>
              <p className="mt-3 rounded-lg border-l-2 border-sand bg-[#FBFAF6] px-3 py-2 text-[14px] font-medium italic leading-relaxed text-ink-soft">{article.excerpt}</p>
              <div className="mt-4 space-y-3">
                {article.sections.map((s) => <div key={s.heading}><h4 className="text-[15px] font-bold text-ink">{s.heading}</h4><p className="mt-1 text-[14px] leading-[1.8] text-ink-soft">{s.text}</p></div>)}
              </div>
            </div>
            <aside className="space-y-2.5">
              <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Sumber</div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{article.source}</p>
                <div className="mt-2 border-t border-line pt-2"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">Peninjau</div><p className="mt-0.5 text-[13px] text-ink-soft">{article.validator}</p></div>
              </div>
              <div className="rounded-xl border border-sand/40 bg-sand-light/50 p-3">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-ink"><CircleAlert className="h-3 w-3 text-sand-deep" /> Atribusi & hormat</div>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{article.attribution}</p>
              </div>
              <div className="rounded-xl border border-line p-3 text-[12px] leading-relaxed text-muted">Artikel bersifat edukatif, bukan panduan wajib. Praktik dapat berbeda antarkeluarga dan antardaerah.</div>
              {article.status !== "Terverifikasi" && <Badge tone="amber" className="w-full justify-center py-1.5 text-[12px]">Mohon gunakan dengan konteks</Badge>}
            </aside>
          </div>
        )}
      </Modal>

      <Modal open={correctionOpen} onClose={() => { setCorrectionOpen(false); setCorrectionSent(false); setCorrection(""); }} title={correctionSent ? "Koreksi terkirim" : "Ajukan koreksi pengetahuan"} description={correctionSent ? undefined : "Tim peninjau akan memeriksa usulan. Tidak semua koreksi dapat diterima; konteks lokal dapat berbeda."} size="md" footer={correctionSent ? <Button size="sm" onClick={() => { setCorrectionOpen(false); setCorrectionSent(false); setCorrection(""); }}>Selesai</Button> : <><Button variant="secondary" size="sm" onClick={() => setCorrectionOpen(false)}>Batal</Button><Button size="sm" onClick={submitCorrection} disabled={correction.trim().length < 20}>Kirim koreksi</Button></>}>
        {correctionSent ? (
          <div className="py-2 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-[#3E7A5F]"><Check className="h-6 w-6" /></span><p className="mt-2 text-[14px] leading-relaxed text-ink-soft">Usulan Anda dicatat untuk ditinjau. Pada implementasi produksi, Anda akan menerima notifikasi hasil tinjauan.</p><div className="mt-2 rounded-lg border border-line bg-[#FBFAF6] p-2 text-[13px] text-muted">Referensi prototipe: KOR-{Date.now().toString().slice(-6)}</div></div>
        ) : (
          <div className="space-y-3">
            <Field label="Artikel terkait"><Select>{knowledgeArticles.map((a) => <option key={a.id}>{a.title}</option>)}</Select></Field>
            <Field label="Bagian yang perlu dikoreksi"><Select><option>Pernyataan faktual</option><option>Sumber atau atribusi</option><option>Variasi praktik</option><option>Nada penyajian</option></Select></Field>
            <Field label="Uraian koreksi" required hint={`${correction.length}/500`}><Textarea value={correction} onChange={(e) => setCorrection(e.target.value.slice(0, 500))} placeholder="Sebutkan bagian yang perlu diperbaiki dan usulan sumber atau konteksnya." /></Field>
            <Field label="Nama & keterkaitan"><Input placeholder="Contoh: praktisi/anggota komunitas, keluarga, peneliti" /></Field>
            <div className="rounded-lg border border-sand/40 bg-sand-light/40 p-2.5 text-[13px] leading-relaxed text-ink-soft"><CircleAlert className="mr-1 inline h-2.5 w-2.5 text-sand-deep" /> Data pelaku budaya tidak ditampilkan tanpa persetujuan. Jangan mengunggah dokumen pribadi yang sensitif.</div>
          </div>
        )}
      </Modal>
    </>
  );
}
