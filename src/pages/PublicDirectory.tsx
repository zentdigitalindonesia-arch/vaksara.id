import { useState } from "react";
import { ExternalLink, Info, MapPin, MessageCircle, Phone, Search } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { PublicContainer } from "@/layouts/PublicLayout";
import { facebookUrl, handleLabel, instagramUrl, publicVendorCategories, publicVendors, tiktokUrl, waNumber } from "@/data-public-vendors";
import { useApp } from "@/store";

/** Direktori publik usaha pernikahan Makassar–Gowa yang belum bermitra; dipakai untuk menunjukkan pasar nyata dan target ajakan bergabung. */
export default function PublicDirectory({ embedded = false, initialQuery = "" }: { embedded?: boolean; initialQuery?: string }) {
  const { navigate } = useApp();
  const [cat, setCat] = useState("Semua");
  const [q, setQ] = useState(initialQuery);
  const Wrap = embedded ? EmbeddedWrap : PublicContainer;
  const list = publicVendors.filter(v => (cat === "Semua" || v.category === cat) && (q.trim() === "" || `${v.name} ${v.address} ${v.note} ${v.category}`.toLowerCase().includes(q.trim().toLowerCase())));
  return <Wrap className={embedded ? "" : "py-8 sm:py-10"}>
    {!embedded && <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-sand-deep">Direktori publik</p>}
    {!embedded && <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Usaha pernikahan di Makassar & Gowa</h1>}
    {!embedded && <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">Fotografer, sanggar seni, katering, perias, dan rumah pengantin yang informasinya terbuka di internet. Gunakan tautan ke Instagram atau situs mereka untuk menghubungi langsung.</p>}
    {embedded ? <p className="mt-1 flex items-start gap-2 text-[13px] text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep" />Belum terdaftar di VAKSARA: data dari sumber publik, tanpa rating, harga, atau verifikasi. Pemilik usaha dapat meminta koreksi atau penghapusan.</p> : <div className="mt-4 flex gap-3 rounded-2xl border border-sand bg-sand-light p-4 text-[14px] leading-relaxed text-ink"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sand-deep" /><p><b>Belum terdaftar di VAKSARA.</b> Daftar ini hanya berisi nama, kategori, alamat, kontak, dan akun media sosial dari sumber publik. Tidak ada rating, harga, atau status verifikasi, dan VAKSARA tidak menjamin layanan mereka. Pemilik usaha dapat meminta koreksi atau penghapusan kapan saja.</p></div>}
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input aria-label="Cari di direktori publik" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, wilayah, atau layanan" className="h-11 w-full rounded-full border border-line bg-white pl-9 pr-4 text-[15px] outline-none focus:border-ink" /></label>
      <span className="text-[13px] text-muted">{list.length} dari {publicVendors.length} usaha</span>
    </div>
    <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">{["Semua", ...publicVendorCategories].map(c => <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold ${cat === c ? "bg-ink text-cream" : "bg-white text-ink-soft ring-1 ring-line"}`}>{c} <span className="opacity-70">{c === "Semua" ? publicVendors.length : publicVendors.filter(v => v.category === c).length}</span></button>)}</div>
    <ul aria-label="Daftar vendor" className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">{list.map(v => <li key={v.id} id={`public-${v.id}`} className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="text-[16px] font-bold text-ink">{v.name}</h2><Badge tone="sand">{v.category}</Badge></div>
        {v.address && <p className="mt-0.5 flex items-start gap-1 text-[13px] text-muted"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{v.address}</p>}
        {v.note && <p className="mt-1 line-clamp-2 text-[14px] text-ink-soft">{v.note}</p>}
        {(v.instagram || v.tiktok || v.facebook || v.website || v.source) && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          {v.instagram && <a href={instagramUrl(v.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">Instagram {handleLabel(v.instagram)}<ExternalLink className="h-3 w-3" /></a>}
          {v.tiktok && <a href={tiktokUrl(v.tiktok)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">TikTok {handleLabel(v.tiktok)}<ExternalLink className="h-3 w-3" /></a>}
          {v.facebook && <a href={facebookUrl(v.facebook)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">Facebook<ExternalLink className="h-3 w-3" /></a>}
          {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">Situs<ExternalLink className="h-3 w-3" /></a>}
          {v.source && <span className="text-[12px] text-muted">Sumber: {/^https?:\/\//.test(v.source) ? <a href={v.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{new URL(v.source).hostname.replace(/^www\./, "")}</a> : v.source}</span>}
        </div>}
      </div>
      {v.phone ? <div className="flex flex-wrap gap-2 lg:justify-end"><a href={`https://wa.me/${waNumber(v.phone)}?text=${encodeURIComponent(`Halo ${v.name}, saya menemukan usaha Anda di direktori VAKSARA dan ingin bertanya tentang layanan pernikahan.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1F7A4A] px-3.5 text-[14px] font-semibold text-white hover:bg-[#186A3F]"><MessageCircle className="h-4 w-4" />WhatsApp</a><a href={`tel:${v.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[14px] font-semibold text-ink hover:border-ink"><Phone className="h-4 w-4" />{v.phone}</a></div> : !(v.instagram || v.tiktok || v.facebook || v.website) ? <span className="text-[13px] text-muted lg:text-right">Kontak belum tersedia</span> : null}
    </li>)}</ul>
    {list.length === 0 && <p className="mt-6 text-sm text-muted">Tidak ada usaha yang cocok dengan pencarian ini.</p>}
    {!embedded && <div className="mt-8 flex flex-col gap-3 rounded-[20px] bg-ink p-5 text-cream sm:flex-row sm:items-center sm:justify-between"><p className="text-[15px]">Pemilik usaha di daftar ini? Daftarkan profil Anda agar dapat menerima permintaan, membuat penawaran, dan memakai Dana Amanah.</p><Button variant="gold" onClick={() => navigate("vendor/daftar")}>Daftar sebagai pelaku</Button></div>}
  </Wrap>;
}

function EmbeddedWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
