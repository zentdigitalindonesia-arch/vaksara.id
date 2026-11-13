import { useEffect, useMemo, useState } from "react";
import { Download, FileUp, LockKeyhole, LogOut } from "lucide-react";
import { Badge, Button, Card, Field, Input, PasswordInput } from "@/components/ui";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { formatIDR, practitioners } from "@/data";
import { parseCsv, publicVendors } from "@/data-public-vendors";
import { confirmedTotal, phaseLabels } from "@/utils/cooperation";
import { demoAccounts } from "@/utils/demo-login";
import { enterLive, liveBoot, useLive, type Listing } from "@/LiveContext";
import { friendly, liveEnabled, rest, signIn } from "@/utils/supabase";
import type { Cooperation } from "@/utils/cooperation";

// Halaman pemilik (superadmin). Tidak ditautkan dari menu mana pun; hanya dapat dibuka lewat slug di bawah.
// PERINGATAN: pada prototipe statis ini pengecekan sandi terjadi di browser (gerbang tampilan, bukan keamanan server).
// Sandi tidak disimpan sebagai teks; yang disimpan hanya hash SHA-256 bergaram. Ganti dengan Supabase Auth + RLS sebelum produksi.
// Slug tidak ditulis apa adanya; yang disimpan hanya hash-nya agar tidak mudah ditemukan dari kode sumber.
const SLUG_HASH = "25ajopl4l3g";
const cyrb53 = (str: string) => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
// Dengan server aktif, akses ditentukan status admin di database, sehingga tautan sederhana /pemilik aman dipakai.
// Tanpa server (mode demo), tautan tersembunyi lama tetap berlaku.
export const isOwnerPath = (path: string) => (liveEnabled && path === "pemilik") || (path.length > 8 && path.length < 40 && !path.includes("/") && cyrb53(`vaksara-slug:${path}`) === SLUG_HASH);
const OWNER_EMAIL = "pemilik@vaksara.id";
const OWNER_HASH = "7fde703eae90c0746427308a047ff06e11e3b462ad50768a3885a9b7c8f265ab";
const OWNER_KEY = "vaksara-owner-session";
const LOCK_KEY = "vaksara-owner-lock";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const cell = (v: unknown) => { const s = String(v ?? ""); return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** CSV dengan pemisah titik koma dan BOM agar langsung rapi saat dibuka di Excel versi Indonesia. */
export function toCsv(header: string[], rows: unknown[][]) { return "﻿" + [header, ...rows].map(r => r.map(cell).join(";")).join("\r\n") + "\r\n"; }
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const vendorHeader = ["nama", "kategori", "alamat", "kontak", "instagram", "tiktok", "facebook", "website", "keterangan", "sumber"];

function OwnerLogin({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lock = Number(sessionStorage.getItem(LOCK_KEY) ?? "0");
    if (lock > Date.now()) { setError(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((lock - Date.now()) / 1000)} detik.`); return; }
    setBusy(true);
    const ok = email.trim().toLowerCase() === OWNER_EMAIL && (await sha256(`vaksara-owner-v1:${OWNER_EMAIL}:${pw}`)) === OWNER_HASH;
    setBusy(false);
    if (!ok) {
      const fails = Number(sessionStorage.getItem(LOCK_KEY + "-n") ?? "0") + 1;
      sessionStorage.setItem(LOCK_KEY + "-n", String(fails));
      if (fails >= 5) { sessionStorage.setItem(LOCK_KEY, String(Date.now() + 60_000)); sessionStorage.setItem(LOCK_KEY + "-n", "0"); }
      setError("Email atau sandi salah."); setPw(""); return;
    }
    sessionStorage.setItem(OWNER_KEY, String(Date.now() + 2 * 60 * 60 * 1000));
    sessionStorage.removeItem(LOCK_KEY + "-n"); onOk();
  };
  return <div className="flex min-h-screen items-center justify-center bg-cream px-4"><Card className="w-full max-w-sm p-6">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-sand"><LockKeyhole className="h-5 w-5" /></span>
    <h1 className="mt-4 font-display text-2xl text-ink">Masuk pemilik</h1>
    <p className="mt-1 text-sm text-muted">Halaman khusus pemilik VAKSARA.</p>
    <form onSubmit={submit} className="mt-5 space-y-3">
      <Field label="Email"><Input aria-label="Email pemilik" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <Field label="Sandi"><PasswordInput aria-label="Sandi pemilik" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></Field>
      {error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{error}</p>}
      <Button type="submit" full disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</Button>
    </form>
  </Card></div>;
}

/** Masuk pemilik dengan akun Supabase yang ditandai is_admin di database. */
function LiveOwnerLogin() {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try { const s = await signIn(email, pw); await enterLive(s); location.reload(); }
    catch (err) { setError(friendly(err)); setPw(""); } finally { setBusy(false); }
  };
  return <div className="flex min-h-screen items-center justify-center bg-cream px-4"><Card className="w-full max-w-sm p-6">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-sand"><LockKeyhole className="h-5 w-5" /></span>
    <h1 className="mt-4 font-display text-2xl text-ink">Masuk pemilik</h1>
    <p className="mt-1 text-sm text-muted">Gunakan akun VAKSARA yang ditetapkan sebagai admin.</p>
    <form onSubmit={submit} className="mt-5 space-y-3">
      <Field label="Email"><Input aria-label="Email pemilik" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <Field label="Sandi"><PasswordInput aria-label="Sandi pemilik" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></Field>
      {error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{error}</p>}
      <Button type="submit" full disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</Button>
    </form>
  </Card></div>;
}
type LiveProfile = { id: string; role: string; full_name: string; email: string; phone: string; city: string; is_admin: boolean; created_at: string };
type LiveCoop = { id: string; couple_name: string; vendor_name: string; phase: string; data: Cooperation; created_at: string };
type LiveReq = { id: string; family: string; category: string; title: string; event_date: string; location: string; budget: string; status: string; chosen: string | null; created_at: string; open_request_responses: { id: string }[] };
type LiveData = { profiles: LiveProfile[]; listings: Listing[]; coops: LiveCoop[]; requests: LiveReq[] };

type Tab = "ringkasan" | "pengguna" | "vendor" | "direktori" | "kerjasama" | "permintaan";
const tabs: [Tab, string][] = [["ringkasan", "Ringkasan"], ["pengguna", "Pengguna"], ["vendor", "Vendor terdaftar"], ["direktori", "Daftar vendor publik"], ["kerjasama", "Kerja sama"], ["permintaan", "Permintaan terbuka"]];

function Table({ header, rows }: { header: string[]; rows: unknown[][] }) {
  return <div className="mt-3 overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[640px] text-left text-[13px]"><thead className="bg-cream text-[12px] uppercase tracking-wide text-muted"><tr>{header.map(h => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="max-w-[260px] truncate px-3 py-2 text-ink">{String(c ?? "")}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={header.length} className="px-3 py-6 text-center text-muted">Belum ada data.</td></tr>}</tbody></table></div>;
}

export default function OwnerConsole() {
  const { navigate, openRequests, toast } = useApp();
  const { flow } = useCooperation();
  const [authed, setAuthed] = useState(() => Number(sessionStorage.getItem(OWNER_KEY) ?? "0") > Date.now());
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [imported, setImported] = useState<{ name: string; rows: string[][]; problems: string[] } | null>(null);
  // Mode server: data langsung dari database; hanya akun admin yang dapat membaca semua baris (RLS).
  const { profile, ready, logout: liveLogout, email: liveEmail } = useLive();
  const liveAdmin = liveEnabled && liveBoot() && ready && profile?.is_admin === true;
  const [data, setData] = useState<LiveData | null>(null);
  const [loadError, setLoadError] = useState("");
  const loadLive = () => Promise.all([
    rest<LiveProfile[]>("profiles?select=*&order=created_at.desc"),
    rest<Listing[]>("vendor_listings?select=*&order=created_at.desc"),
    rest<LiveCoop[]>("cooperations?select=id,couple_name,vendor_name,phase,data,created_at&order=created_at.desc"),
    rest<LiveReq[]>("open_requests?select=*,open_request_responses(id)&order=created_at.desc"),
  ]).then(([profiles, listings, coops, requests]) => { setData({ profiles, listings, coops, requests }); setLoadError(""); }).catch(e => setLoadError(friendly(e)));
  useEffect(() => { if (liveAdmin) loadLive(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [liveAdmin]);
  useEffect(() => { document.title = "Pemilik — VAKSARA"; const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex,nofollow"; document.head.appendChild(m); return () => m.remove(); }, []);

  const users = useMemo(() => data ? data.profiles.map(p => [p.is_admin ? "Admin" : p.role === "vendor" ? "Pelaku budaya" : "Keluarga", p.full_name, p.email, p.phone, `${p.city} · daftar ${p.created_at.slice(0, 10)}`]) : [
    ...(["couple", "vendor"] as const).flatMap(r => flow.accounts[r] ? [[r === "couple" ? "Keluarga" : "Pelaku budaya", flow.accounts[r]!.name, flow.accounts[r]!.email, flow.accounts[r]!.phone, "Pendaftaran di browser ini"]] : []),
    ...demoAccounts.map(a => [a.label, a.name, a.email, "-", "Akun demo bawaan"]),
  ], [flow, data]);
  const liveVendorHeader = ["nama", "kategori", "wilayah", "whatsapp", "instagram", "status_tinjauan", "tampil", "harga_mulai", "daftar"];
  const liveVendorRows = (data?.listings ?? []).map(l => [l.name, l.category, l.area, l.whatsapp, l.instagram, l.review_status === "approved" ? "Disetujui" : l.review_status === "rejected" ? "Perlu perbaikan" : "Menunggu", l.published ? "ya" : "tidak", l.price_from ?? "", (l.created_at ?? "").slice(0, 10)]);
  const cases: Cooperation[] = data ? data.coops.map(c => c.data) : flow.cases;
  const vendorRows = practitioners.map(p => [p.name, p.category, p.role, p.city, p.area, p.verifiedIdentity, p.verifiedPortfolio, p.verifiedKnowledge, p.priceFrom]);
  const dirRows = publicVendors.map(v => [v.name, v.category, v.address, v.phone, v.instagram, v.tiktok, v.facebook, v.website, v.note, v.source]);
  const caseRows = data ? data.coops.map(c => [c.id, c.couple_name, c.vendor_name, phaseLabels[c.phase as keyof typeof phaseLabels] ?? c.phase, c.data.eventDate, c.data.offer?.price ?? "", confirmedTotal(c.data), c.data.offer?.paymentMode === "amanah" ? "Dana Amanah" : c.data.offer ? "Langsung" : "", c.data.request]) : flow.cases.map(c => [c.id, flow.accounts.couple?.name ?? "", c.vendor, phaseLabels[c.phase], c.eventDate, c.offer?.price ?? "", confirmedTotal(c), c.offer?.paymentMode === "amanah" ? "Dana Amanah" : c.offer ? "Langsung" : "", c.request]);
  const reqRows = data ? data.requests.map(r => [r.id, r.family, r.category, r.title, r.event_date, r.location, r.budget, r.status === "open" ? "Terbuka" : `Dipilih: ${r.chosen ?? ""}`, r.open_request_responses?.length ?? 0, r.created_at.slice(0, 10)]) : openRequests.map(r => [r.id, r.family, r.category, r.title, r.date, r.location, r.budget, r.status === "open" ? "Terbuka" : `Dipilih: ${r.chosen}`, r.responses.length, r.createdAt]);

  if (liveEnabled) {
    if (!liveBoot()) return <LiveOwnerLogin />;
    if (!ready) return <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-muted">Memuat…</div>;
    if (!profile?.is_admin) return <div className="flex min-h-screen items-center justify-center bg-cream px-4"><Card className="max-w-sm p-6"><h1 className="font-display text-2xl text-ink">Bukan akun pemilik</h1><p className="mt-2 text-sm text-muted">Akun <b className="text-ink">{liveEmail || "ini"}</b> tidak memiliki akses admin. Keluar lalu masuk dengan akun pemilik.</p><Button className="mt-4" onClick={() => liveLogout()}>Keluar</Button></Card></div>;
  } else if (!authed) return <OwnerLogin onOk={() => setAuthed(true)} />;
  const logout = () => { if (liveEnabled) { liveLogout(); return; } sessionStorage.removeItem(OWNER_KEY); setAuthed(false); };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    const [head, ...body] = rows;
    const problems: string[] = [];
    if (!head || !head.some(h => h.trim().toLowerCase() === "nama")) problems.push("Baris pertama harus berisi judul kolom, minimal kolom 'nama'.");
    const pos = (k: string) => head ? head.findIndex(h => h.trim().toLowerCase() === k) : -1;
    const normalized = body.map(r => vendorHeader.map(k => (pos(k) >= 0 ? (r[pos(k)] ?? "").trim() : "")));
    normalized.forEach((r, i) => { if (!r[0]) problems.push(`Baris ${i + 2}: nama kosong (baris akan dilewati).`); });
    const missing = vendorHeader.filter(k => pos(k) < 0);
    if (head && missing.length) problems.push(`Kolom tidak ditemukan dan dibiarkan kosong: ${missing.join(", ")}.`);
    setImported({ name: file.name, rows: normalized.filter(r => r[0]), problems });
  };

  const stat = (label: string, value: string | number) => <div className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-bold text-ink">{value}</p></div>;
  const exportBtn = (label: string, file: string, header: string[], rows: unknown[][]) => <Button size="sm" variant="secondary" leading={<Download className="h-4 w-4" />} onClick={() => { download(`${file}-${stamp()}.csv`, toCsv(header, rows)); toast(`${rows.length} baris diekspor.`, "success", "CSV diunduh"); }}>{label}</Button>;

  return <div className="min-h-screen bg-cream">
    <header className="border-b border-line bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
      <div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep">Pemilik</p><h1 className="font-display text-xl text-ink">Konsol VAKSARA</h1></div>
      <div className="flex flex-wrap items-center gap-2">{liveEnabled && <span className="rounded-full bg-cream px-3 py-1.5 text-[13px] text-ink-soft ring-1 ring-line">Masuk sebagai <b className="text-ink">{liveEmail}</b> · admin</span>}<Button size="sm" variant="ghost" onClick={() => navigate("beranda")}>Lihat situs</Button><Button size="sm" variant="secondary" leading={<LogOut className="h-4 w-4" />} onClick={logout}>Keluar</Button></div>
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-5">
      {liveEnabled ? <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white p-3 text-[13px] text-ink"><span><b>Data server:</b> langsung dari database VAKSARA (semua perangkat).{loadError && <span className="ml-1 text-[#933A2F]">{loadError}</span>}</span><Button size="sm" variant="secondary" onClick={() => loadLive()}>Muat ulang</Button></div> : <div className="mb-4 rounded-2xl border border-sand bg-sand-light p-3 text-[13px] text-ink"><b>Mode prototipe:</b> data yang tampil berasal dari browser ini dan file daftar vendor di aplikasi. Data pengguna dari perangkat lain baru terkumpul setelah backend (Supabase) dipasang.</div>}
      <nav aria-label="Bagian konsol" className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">{tabs.map(([t, l]) => <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold ${tab === t ? "bg-ink text-cream" : "bg-white text-ink-soft ring-1 ring-line"}`}>{l}</button>)}</nav>

      {tab === "ringkasan" && <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{stat("Pengguna & akun", users.length)}{stat(data ? "Pelaku mendaftar" : "Vendor terdaftar (katalog)", data ? data.listings.length : practitioners.length)}{stat("Daftar vendor publik", publicVendors.length)}{stat("Kerja sama", cases.length)}{stat("Nilai disepakati", formatIDR(cases.reduce((s, c) => s + (c.offer && !["draft", "inquiry", "replied", "offered", "declined", "cancelled"].includes(c.phase) ? c.offer.price : 0), 0)))}{stat("Permintaan terbuka", data ? data.requests.filter(r => r.status === "open").length : openRequests.filter(r => r.status === "open").length)}</div>}

      {tab === "pengguna" && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Pengguna</h2>{exportBtn("Ekspor CSV", "pengguna", ["peran", "nama", "email", "telepon", "keterangan"], users)}</div><Table header={["Peran", "Nama", "Email", "Telepon", "Keterangan"]} rows={users} /></Card>}

      {tab === "vendor" && data && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Pelaku budaya mendaftar ({data.listings.length})</h2><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => navigate("admin/screening")}>Tinjau pendaftar</Button>{exportBtn("Ekspor CSV", "pelaku-terdaftar", liveVendorHeader, liveVendorRows)}</div></div><Table header={["Nama", "Kategori", "Wilayah", "WhatsApp", "Instagram", "Status", "Tampil", "Harga mulai", "Daftar"]} rows={liveVendorRows} /></Card>}
      {tab === "vendor" && !data && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Vendor terdaftar (profil contoh)</h2>{exportBtn("Ekspor CSV", "vendor-terdaftar", ["nama", "kategori", "peran", "kota", "area", "identitas", "portofolio", "pengetahuan", "harga_mulai"], vendorRows)}</div><Table header={["Nama", "Kategori", "Peran", "Kota", "Area", "Identitas", "Portofolio", "Pengetahuan", "Harga mulai"]} rows={vendorRows} /></Card>}

      {tab === "direktori" && <div className="space-y-4">
        <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Daftar vendor publik ({publicVendors.length})</h2>{exportBtn("Ekspor CSV", "daftar-vendor", vendorHeader, dirRows)}</div><p className="mt-1 text-sm text-muted">Usaha yang belum terdaftar di VAKSARA. Ditampilkan kepada pengguna di halaman Direktori publik.</p><Table header={["Nama", "Kategori", "Alamat", "Kontak", "Instagram", "TikTok", "Facebook", "Website", "Keterangan", "Sumber"]} rows={dirRows} /></Card>
        <Card className="p-4"><h2 className="font-display text-xl">Impor CSV daftar vendor</h2>
          <p className="mt-1 text-sm text-muted">Pilih file CSV dari Excel (pemisah titik koma atau koma). Kolom: {vendorHeader.join(", ")}. Halaman ini memeriksa isinya lalu membuat file <code>daftar-vendor.csv</code> yang rapi.</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-cream"><FileUp className="h-4 w-4" />Pilih file CSV<input aria-label="Impor CSV daftar vendor" type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
          {imported && <div className="mt-4">
            <p className="text-sm"><b>{imported.name}</b>: {imported.rows.length} usaha siap dipakai.</p>
            {imported.problems.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[13px] text-[#855A16]">{imported.problems.slice(0, 8).map((p, i) => <li key={i}>{p}</li>)}{imported.problems.length > 8 && <li>…dan {imported.problems.length - 8} catatan lain.</li>}</ul>}
            <Table header={["Nama", "Kategori", "Alamat", "Kontak", "Instagram", "TikTok", "Facebook"]} rows={imported.rows.slice(0, 10).map(r => r.slice(0, 7))} />
            {imported.rows.length > 10 && <p className="mt-1 text-[12px] text-muted">Menampilkan 10 dari {imported.rows.length} baris.</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2"><Button leading={<Download className="h-4 w-4" />} onClick={() => download("daftar-vendor.csv", toCsv(vendorHeader, imported.rows))}>Unduh daftar-vendor.csv</Button><Badge tone="neutral">Lalu ganti file di folder src dan klik KIRIM-KE-VERCEL</Badge></div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-muted"><li>Salin file unduhan ke <code>vaksara-wedding-platform-uiux\src\daftar-vendor.csv</code> (timpa file lama).</li><li>Klik dua kali <b>KIRIM-KE-VERCEL.cmd</b>. Dalam 1–2 menit daftar baru tampil untuk semua pengguna.</li></ol>
          </div>}
        </Card>
      </div>}

      {tab === "kerjasama" && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Kerja sama</h2>{exportBtn("Ekspor CSV", "kerja-sama", ["id", "keluarga", "vendor", "tahap", "tanggal", "nilai", "dibayar", "cara_bayar", "kebutuhan"], caseRows)}</div><Table header={["ID", "Keluarga", "Vendor", "Tahap", "Tanggal", "Nilai", "Dibayar", "Cara bayar", "Kebutuhan"]} rows={caseRows} /></Card>}

      {tab === "permintaan" && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">Permintaan terbuka</h2>{exportBtn("Ekspor CSV", "permintaan-terbuka", ["id", "keluarga", "kategori", "judul", "tanggal", "lokasi", "anggaran", "status", "jumlah_minat", "dibuat"], reqRows)}</div><Table header={["ID", "Keluarga", "Kategori", "Judul", "Tanggal", "Lokasi", "Anggaran", "Status", "Minat", "Dibuat"]} rows={reqRows} /></Card>}
    </main>
  </div>;
}
