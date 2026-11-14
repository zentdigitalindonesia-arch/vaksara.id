import { useEffect, useState } from "react";
import { AtSign, BadgeCheck, Clock3, ExternalLink, MessageCircle, ShieldAlert } from "lucide-react";
import { Alert, Badge, Button, Card, Checkbox, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { LiveAuthForm } from "@/components/LiveAuth";
import { ReviewerDocuments, VendorDocumentsCard } from "@/components/VerificationDocs";
import PublicDirectory from "@/pages/PublicDirectory";
import { DataRequestsAdmin } from "@/pages/Privacy";
import { BankAccountCard, BankReview, PayoutsAdmin } from "@/components/BankAccount";
import { useLive, type Listing, type ListingInput } from "@/LiveContext";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { formatIDR, openRequestCategories } from "@/data";
import { instagramUrl, waNumber } from "@/data-public-vendors";
import { ceremonies, ceremonyLabel } from "@/utils/ceremonies";
import { friendly, q, rest } from "@/utils/supabase";

export const listingCategories = [...openRequestCategories, "Sanggar seni & tari", "Rumah pengantin / WO", "Lainnya"];
const statusInfo: Record<Listing["review_status"], { label: string; tone: "sand" | "green" | "red"; text: string }> = {
  pending: { label: "Menunggu peninjauan", tone: "sand", text: "Lengkapi dokumen verifikasi di bawah (KTP, foto kegiatan, verifikasi wajah). Peninjau VAKSARA memeriksa identitas, konteks budaya, dan persetujuan publikasi; profil tampil di direktori setelah disetujui." },
  approved: { label: "Terverifikasi & tampil", tone: "green", text: "Profil Anda tampil di direktori. Keluarga dapat mengirim permintaan dan Anda dapat menanggapi permintaan terbuka. Bila nama, kategori, wilayah, deskripsi, atau kontak diubah, profil disembunyikan sementara dan ditinjau ulang; kerja sama yang sedang berjalan tetap dapat dilanjutkan." },
  rejected: { label: "Perlu perbaikan", tone: "red", text: "Perbaiki profil sesuai catatan peninjau lalu simpan. Profil otomatis diajukan ulang." },
};

/** Halaman sederhana untuk rute yang hanya tersedia pada akun demo atau peran tertentu. */
export function LiveNotice({ title, text, action }: { title: string; text: string; action?: { label: string; to: string } }) {
  const { navigate } = useApp();
  return <Card className="mx-auto max-w-xl p-6"><h1 className="font-display text-2xl text-ink">{title}</h1><p className="mt-2 text-sm text-muted">{text}</p>{action && <Button className="mt-4" onClick={() => navigate(action.to)}>{action.label}</Button>}</Card>;
}

/** Halaman daftar akun nyata (menggantikan simulasi OTP saat server aktif). */
export function LiveSignupPage({ vendor }: { vendor: boolean }) {
  return <div className="mx-auto max-w-lg px-4 py-10">
    <h1 className="font-display text-3xl text-ink">{vendor ? "Daftar sebagai pelaku budaya" : "Daftar sebagai keluarga"}</h1>
    <p className="mt-2 text-sm text-muted">Gratis. Setelah mendaftar, kami kirim kode verifikasi ke email Anda.</p>
    <Card className="mt-5 p-5"><LiveAuthForm initial="daftar" /></Card>
  </div>;
}

export function LiveVendorProfile() {
  const { profile, listing, saveListing, saveProfile, ready, error: loadError } = useLive();
  const { toast } = useApp();
  const { reload } = useCooperation();
  const empty: ListingInput = { name: "", category: listingCategories[0], area: profile?.city ?? "Makassar", description: "", price_from: null, whatsapp: profile?.phone ?? "", instagram: "", tiktok: "", facebook: "", published: true, ceremonies: [] };
  const [f, setF] = useState<ListingInput>(empty);
  const [price, setPrice] = useState("");
  const [me, setMe] = useState({ full_name: "", phone: "", city: "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (listing) { setF({ name: listing.name, category: listing.category, area: listing.area, description: listing.description, price_from: listing.price_from, whatsapp: listing.whatsapp, instagram: listing.instagram, tiktok: listing.tiktok, facebook: listing.facebook, published: listing.published, ceremonies: listing.ceremonies ?? [] }); setPrice(listing.price_from ? String(listing.price_from) : ""); }
    else if (profile) setF(prev => ({ ...prev, area: prev.area || profile.city, whatsapp: prev.whatsapp || profile.phone }));
    if (profile) setMe({ full_name: profile.full_name, phone: profile.phone, city: profile.city });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, profile]);
  if (!ready) return <Card className="p-6 text-sm text-muted">Memuat profil…</Card>;
  if (profile?.role !== "vendor") return <LiveNotice title="Khusus akun pelaku budaya" text="Akun Anda terdaftar sebagai keluarga. Profil layanan hanya dimiliki pelaku budaya." action={{ label: "Ke ruang keluarga", to: "planner" }} />;
  const set = (p: Partial<ListingInput>) => setF(prev => ({ ...prev, ...p }));
  const save = async () => {
    if (f.name.trim().length < 3) return setError("Isi nama usaha atau sanggar (min. 3 karakter).");
    if (f.description.trim().length < 30) return setError("Tulis deskripsi layanan minimal 30 karakter: prosesi yang dikuasai, pengalaman, wilayah layanan.");
    if (!/^(\+62|62|0)8\d{7,12}$/.test(f.whatsapp.replace(/[\s().-]/g, ""))) return setError("Nomor WhatsApp tidak valid.");
    const p = price.replace(/\D/g, "");
    setBusy(true); setError("");
    try { const saved = await saveListing({ ...f, name: f.name.trim(), description: f.description.trim(), price_from: p ? Number(p) : null, whatsapp: f.whatsapp.replace(/[\s().-]/g, ""), instagram: f.instagram.trim().replace(/^@/, ""), tiktok: f.tiktok.trim().replace(/^@/, ""), facebook: f.facebook.trim() }); toast(!listing ? "Profil layanan tersimpan dan diajukan untuk peninjauan." : listing.review_status === "approved" && saved.review_status === "pending" ? "Perubahan tersimpan. Profil disembunyikan sementara sampai peninjau menyetujui ulang." : "Profil layanan diperbarui.", "success", "Tersimpan"); reload(); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  };
  const status = listing ? statusInfo[listing.review_status] : null;
  return <>
    <PageHeader title="Profil layanan" description="Profil ini yang dilihat keluarga di direktori VAKSARA. Isi dengan jujur; peninjau memeriksa sebelum profil tampil." />
    {loadError && <Alert tone="error" title="Gagal memuat">{loadError}</Alert>}
    {status && <Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2">{listing!.review_status === "approved" ? <BadgeCheck className="h-5 w-5 text-[#2F7A53]" /> : listing!.review_status === "rejected" ? <ShieldAlert className="h-5 w-5 text-[#933A2F]" /> : <Clock3 className="h-5 w-5 text-sand-deep" />}<Badge tone={status.tone}>{status.label}</Badge></div><p className="mt-2 text-sm text-ink-soft">{status.text}</p>{listing!.review_note && <p className="mt-2 rounded-xl bg-cream p-2.5 text-sm"><b>Catatan peninjau:</b> {listing!.review_note}</p>}</Card>}
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="min-w-0 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama usaha / sanggar" className="sm:col-span-2"><Input aria-label="Nama usaha" maxLength={120} value={f.name} onChange={e => set({ name: e.target.value })} placeholder="Contoh: Sanggar Seni Batara" /></Field>
          <Field label="Kategori utama"><Select aria-label="Kategori layanan" value={f.category} onChange={e => set({ category: e.target.value })}>{listingCategories.map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Wilayah layanan"><Input aria-label="Wilayah layanan" maxLength={120} value={f.area} onChange={e => set({ area: e.target.value })} placeholder="Makassar, Gowa, Maros" /></Field>
          <Field label="Deskripsi layanan" className="sm:col-span-2" hint="Prosesi yang dikuasai, pengalaman, isi paket, tradisi Bugis/Makassar yang dilayani."><Textarea aria-label="Deskripsi layanan" maxLength={2000} rows={5} value={f.description} onChange={e => set({ description: e.target.value })} /></Field>
          <fieldset className="sm:col-span-2" aria-label="Prosesi yang dilayani">
            <legend className="text-[14px] font-semibold text-ink">Prosesi adat yang Anda layani</legend>
            <p className="text-[13px] text-muted">Membantu keluarga menemukan Anda sesuai tahapan acaranya. Istilah Bugis dan Makassar dicantumkan berdampingan.</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{ceremonies.map(c => { const on = (f.ceremonies ?? []).includes(c.id); return <label key={c.id} className={`flex cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-[13px] ring-1 ${on ? "bg-sand-light ring-sand" : "bg-white ring-line"}`}><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#123a33]" checked={on} onChange={() => set({ ceremonies: on ? (f.ceremonies ?? []).filter(x => x !== c.id) : [...(f.ceremonies ?? []), c.id] })} aria-label={c.label} /><span><b className="text-ink">{c.label}</b>{c.terms && <span className="block text-muted">{c.terms}</span>}</span></label>; })}</div>
          </fieldset>
          <Field label="Harga mulai (Rp, opsional)"><Input aria-label="Harga mulai" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="3000000" /></Field>
          <Field label="WhatsApp usaha"><Input aria-label="WhatsApp usaha" type="tel" value={f.whatsapp} onChange={e => set({ whatsapp: e.target.value })} /></Field>
          <Field label="Instagram (opsional)"><Input aria-label="Instagram usaha" value={f.instagram} onChange={e => set({ instagram: e.target.value })} placeholder="@namausaha" /></Field>
          <Field label="TikTok (opsional)"><Input aria-label="TikTok usaha" value={f.tiktok} onChange={e => set({ tiktok: e.target.value })} /></Field>
          <Field label="Facebook (opsional)" className="sm:col-span-2"><Input aria-label="Facebook usaha" value={f.facebook} onChange={e => set({ facebook: e.target.value })} /></Field>
        </div>
        <div className="mt-3"><Checkbox checked={f.published} onChange={v => set({ published: v })} label="Tampilkan profil saya di direktori setelah disetujui (dapat dimatikan kapan saja)" /></div>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#933A2F]">{error}</p>}
        <Button className="mt-4" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : listing ? "Simpan perubahan" : "Simpan dan ajukan peninjauan"}</Button>
      </Card>
      <Card className="h-fit p-5">
        <h2 className="font-display text-xl">Data akun</h2>
        <p className="mt-1 text-[13px] text-muted">Tidak ditampilkan ke publik.</p>
        <div className="mt-3 space-y-3">
          <Field label="Nama penanggung jawab"><Input aria-label="Nama penanggung jawab" value={me.full_name} onChange={e => setMe({ ...me, full_name: e.target.value })} /></Field>
          <Field label="WhatsApp pribadi"><Input aria-label="WhatsApp pribadi" value={me.phone} onChange={e => setMe({ ...me, phone: e.target.value })} /></Field>
          <Field label="Kota"><Input aria-label="Kota akun" value={me.city} onChange={e => setMe({ ...me, city: e.target.value })} /></Field>
          <Button size="sm" variant="secondary" onClick={() => saveProfile(me).then(() => toast("Data akun diperbarui.", "success")).catch(e => toast(friendly(e), "error"))}>Simpan data akun</Button>
        </div>
      </Card>
    </div>
    <VendorDocumentsCard />
    <BankAccountCard hasListing={Boolean(listing)} />
  </>;
}

/** Kartu profil pelaku yang terdaftar dan sudah ditinjau (akun nyata). */
export function LiveListingCard({ l, onRequest }: { l: Pick<Listing, "id" | "name" | "category" | "area" | "description" | "price_from" | "whatsapp" | "instagram" | "ceremonies">; onRequest?: () => void }) {
  return <Card className="flex flex-col p-4">
    <div className="flex flex-wrap items-center gap-1.5"><Badge tone="green" dot>Terdaftar di VAKSARA</Badge><Badge tone="sand">{l.category}</Badge></div>
    <h3 className="mt-2 font-display text-xl text-ink">{l.name}</h3>
    <p className="text-[13px] text-muted">{l.area}{l.price_from ? ` · mulai ${formatIDR(l.price_from)}` : ""}</p>
    <p className="mt-2 line-clamp-4 flex-1 text-sm text-ink-soft">{l.description}</p>
    {(l.ceremonies?.length ?? 0) > 0 && <div className="mt-2 flex flex-wrap gap-1" aria-label="Prosesi yang dilayani">{l.ceremonies!.map(c => <span key={c} className="rounded-full bg-cream px-2 py-0.5 text-[12px] font-semibold text-ink-soft ring-1 ring-line">{ceremonyLabel(c)}</span>)}</div>}
    <div className="mt-3 flex flex-wrap gap-2">
      {onRequest && <Button size="sm" onClick={onRequest}>Kirim permintaan</Button>}
      {l.whatsapp && <a className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-semibold text-ink ring-1 ring-line" href={`https://wa.me/${waNumber(l.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
      {l.instagram && <a className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-semibold text-ink ring-1 ring-line" href={instagramUrl(l.instagram)} target="_blank" rel="noreferrer"><AtSign className="h-3.5 w-3.5" />Instagram</a>}
    </div>
  </Card>;
}

/** Daftar pelaku terdaftar untuk direktori (dapat dibaca tanpa login). */
export function useLiveListings() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { let on = true; rest<Listing[]>("vendor_directory?select=id,name,category,area,description,price_from,whatsapp,instagram,tiktok,facebook,ceremonies&order=updated_at.desc", { anon: true }).then(r => { if (on) setItems(r); }).catch(() => undefined).finally(() => { if (on) setLoaded(true); }); return () => { on = false; }; }, []);
  return { items, loaded };
}

type ReviewEntry = { id: number; reviewer_name: string; decision: string; note: string; created_at: string };
/** Jejak peninjauan: dicatat otomatis oleh database (siapa, kapan, keputusan apa). */
function ReviewHistory({ listingId, version }: { listingId: string; version: number }) {
  const [rows, setRows] = useState<ReviewEntry[] | null>(null);
  useEffect(() => { let on = true; rest<ReviewEntry[]>(`listing_reviews?select=id,reviewer_name,decision,note,created_at&listing_id=eq.${q(listingId)}&order=created_at.desc&limit=6`).then(r => { if (on) setRows(r); }).catch(() => { if (on) setRows([]); }); return () => { on = false; }; }, [listingId, version]);
  if (!rows || rows.length === 0) return null;
  return <details className="mt-2 text-[13px]"><summary className="cursor-pointer font-semibold text-ink-soft">Riwayat peninjauan ({rows.length})</summary>
    <ol className="mt-1 space-y-0.5 text-muted">{rows.map(r => <li key={r.id}>{new Date(r.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · <b className="text-ink-soft">{r.decision}</b> oleh {r.reviewer_name || "Sistem"}{r.note ? ` · “${r.note}”` : ""}</li>)}</ol>
  </details>;
}

/** Peninjauan profil pelaku budaya oleh admin (akun dengan is_admin). */
export function LiveScreening() {
  const { profile, ready } = useLive();
  const { toast } = useApp();
  const [rows, setRows] = useState<Listing[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, { identity: boolean; culture: boolean; consent: boolean }>>({});
  const load = () => rest<Listing[]>("vendor_listings?select=*&order=review_status.asc,updated_at.desc").then(setRows).catch(e => toast(friendly(e), "error"));
  useEffect(() => { if (profile?.is_admin) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.is_admin]);
  if (!ready) return <Card className="p-6 text-sm text-muted">Memuat…</Card>;
  if (!profile?.is_admin) return <LiveNotice title="Khusus peninjau VAKSARA" text="Halaman ini hanya untuk akun peninjau yang ditetapkan pengelola." action={{ label: "Kembali", to: "beranda" }} />;
  const c = (l: Listing) => checks[l.id] ?? { identity: l.identity_ok, culture: l.culture_ok, consent: l.consent_ok };
  const decide = async (l: Listing, status: "approved" | "rejected") => {
    const k = c(l), note = (notes[l.id] ?? "").trim();
    if (status === "approved" && !(k.identity && k.culture && k.consent)) { toast("Centang ketiga pemeriksaan sebelum menyetujui.", "warn"); return; }
    if (status === "rejected" && note.length < 10) { toast("Tulis catatan perbaikan (min. 10 karakter) untuk pelaku.", "warn"); return; }
    try { await rest(`vendor_listings?id=eq.${q(l.id)}`, { method: "PATCH", body: { review_status: status, review_note: note, identity_ok: k.identity, culture_ok: k.culture, consent_ok: k.consent }, prefer: "return=minimal" }); toast(status === "approved" ? `${l.name} disetujui dan tampil di direktori.` : `Catatan perbaikan dikirim ke ${l.name}.`, "success"); load(); }
    catch (e) { toast(friendly(e), "error"); }
  };
  return <>
    <PageHeader title="Screening pelaku budaya" description="Periksa identitas (KTP/akun usaha), konteks budaya (prosesi yang diklaim), dan persetujuan publikasi. Hanya profil yang disetujui tampil di direktori." />
    {rows.length === 0 && <Card className="p-6 text-sm text-muted">Belum ada pendaftar.</Card>}
    <div className="space-y-3">{rows.map(l => {
      const k = c(l); return <Card key={l.id} className="p-4">
        <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl text-ink">{l.name}</h2><Badge tone={statusInfo[l.review_status].tone}>{statusInfo[l.review_status].label}</Badge><Badge tone="sand">{l.category}</Badge></div>
        <p className="text-[13px] text-muted">{l.area} · WA {l.whatsapp}{l.instagram ? ` · IG @${l.instagram}` : ""} · {l.published ? "ingin tampil" : "disembunyikan pemilik"}</p>
        <p className="mt-2 text-sm text-ink-soft">{l.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">{l.whatsapp && <a className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink underline" href={`https://wa.me/${waNumber(l.whatsapp)}`} target="_blank" rel="noreferrer">Hubungi via WhatsApp <ExternalLink className="h-3 w-3" /></a>}</div>
        <ReviewHistory listingId={l.id} version={rows.length + (l.updated_at ? Date.parse(l.updated_at) : 0)} />
        <ReviewerDocuments userId={l.id} />
        <BankReview vendorId={l.id} listingName={l.name} />
        <div className="mt-3 grid gap-1 sm:grid-cols-3">
          <Checkbox checked={k.identity} onChange={v => setChecks({ ...checks, [l.id]: { ...k, identity: v } })} label="Identitas diperiksa" />
          <Checkbox checked={k.culture} onChange={v => setChecks({ ...checks, [l.id]: { ...k, culture: v } })} label="Konteks budaya sesuai" />
          <Checkbox checked={k.consent} onChange={v => setChecks({ ...checks, [l.id]: { ...k, consent: v } })} label="Setuju dipublikasikan" />
        </div>
        <Field label="Catatan untuk pelaku"><Input aria-label={`Catatan ${l.name}`} value={notes[l.id] ?? l.review_note} onChange={e => setNotes({ ...notes, [l.id]: e.target.value })} /></Field>
        <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => decide(l, "approved")}>Setujui & tampilkan</Button><Button size="sm" variant="secondary" onClick={() => decide(l, "rejected")}>Minta perbaikan</Button></div>
      </Card>;
    })}</div>
    <PayoutsAdmin />
    <DataRequestsAdmin />
  </>;
}

/** Cari pelaku budaya di dalam ruang kerja: pelaku terdaftar (dapat dikirimi permintaan) + direktori usaha Makassar. */
export function LiveVendorSearch() {
  const { route, navigate } = useApp();
  const { live, profile } = useLive();
  const params = new URLSearchParams(route.split("?")[1] ?? "");
  const [q, setQ] = useState(params.get("q") ?? params.get("kategori") ?? "");
  const { items, loaded } = useLiveListings();
  const needle = q.trim().toLowerCase();
  const [rite, setRite] = useState("");
  const registered = items.filter(l => (!rite || (l.ceremonies ?? []).includes(rite)) && (!needle || `${l.name} ${l.category} ${l.area} ${l.description} ${(l.ceremonies ?? []).map(ceremonyLabel).join(" ")}`.toLowerCase().includes(needle)));
  const canRequest = !live || profile?.role === "couple";
  return <>
    <PageHeader title="Cari pelaku budaya" description="Pelaku yang terdaftar dan lolos peninjauan dapat langsung dikirimi permintaan. Usaha di direktori Makassar dapat dihubungi lewat WhatsApp atau media sosial mereka." />
    <label className="relative mb-4 block"><span className="sr-only">Cari pelaku terdaftar</span><Input aria-label="Cari pelaku terdaftar" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, layanan, atau wilayah, mis. mappacci, katering, Gowa" /></label>
    <section aria-label="Pelaku terdaftar" className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-display text-2xl text-ink">Terdaftar di VAKSARA</h2><p className="mt-1 text-sm text-muted">Identitas, konteks budaya, dan persetujuan publikasi sudah ditinjau.</p></div><Button size="sm" variant="secondary" onClick={() => navigate("planner/permintaan-terbuka")}>Pasang permintaan terbuka</Button></div>
      <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Saring menurut prosesi">{[{ id: "", label: "Semua prosesi" }, ...ceremonies].map(c => <button key={c.id || "semua"} type="button" onClick={() => setRite(c.id)} aria-pressed={rite === c.id} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${rite === c.id ? "bg-ink text-cream" : "bg-white text-ink-soft ring-1 ring-line"}`}>{c.label}</button>)}</div>
      {!loaded && <Card className="mt-3 p-5 text-sm text-muted">Memuat…</Card>}
      {loaded && registered.length === 0 && <Card className="mt-3 p-5"><p className="text-sm text-ink-soft">{items.length === 0 ? "Belum ada pelaku budaya yang lolos peninjauan. Pasang permintaan terbuka agar pelaku yang mendaftar dapat menawarkan layanan kepada Anda." : "Tidak ada pelaku terdaftar yang cocok dengan pencarian ini."}</p></Card>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{registered.map(l => <LiveListingCard key={l.id} l={l} onRequest={canRequest ? () => navigate("planner/alur?vendor=" + encodeURIComponent(l.name)) : undefined} />)}</div>
    </section>
    <section aria-label="Direktori vendor Makassar">
      <h2 className="font-display text-2xl text-ink">Direktori vendor Makassar</h2>
      <p className="mb-2 mt-1 text-sm text-muted">Usaha pernikahan yang informasinya terbuka di internet dan belum terdaftar di VAKSARA.</p>
      <PublicDirectory embedded initialQuery="" />
    </section>
  </>;
}
