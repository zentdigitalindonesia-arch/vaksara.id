import { useState } from "react";
import { ArrowLeftRight, CalendarDays, MapPin, Megaphone, Plus, Wallet } from "lucide-react";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { useEventPlan } from "@/EventPlanContext";
import { formatIDR, openRequestCategories, practitioners, type OpenRequest } from "@/data";
import { caseRoute } from "@/utils/workspace";
import { callFunction, friendly, FunctionMissingError } from "@/utils/supabase";
import { longDate } from "@/components/EventCalendar";

/** Penjelasan singkat dua arah: keluarga mencari pelaku, atau pelaku menanggapi permintaan keluarga. */
export function TwoWayNote({ actor }: { actor: "couple" | "vendor" }) {
  return <div className="mb-5 grid gap-3 sm:grid-cols-2">
    <div className="rounded-[20px] border border-line bg-white p-4"><p className="text-[12px] font-bold uppercase tracking-[0.14em] text-sand-deep">Arah 1</p><p className="mt-1 font-semibold text-ink">{actor === "couple" ? "Anda mencari pelaku budaya" : "Keluarga menemukan profil Anda"}</p><p className="mt-1 text-sm text-muted">{actor === "couple" ? "Jelajahi direktori, bandingkan profil, lalu kirim permintaan ke pelaku pilihan." : "Keluarga mencari di direktori lalu mengirim permintaan langsung ke Anda."}</p></div>
    <div className="rounded-[20px] border border-[#2F7A53]/30 bg-[#EEF7F1] p-4"><p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#2F7A53]"><ArrowLeftRight className="h-3.5 w-3.5" />Arah 2</p><p className="mt-1 font-semibold text-ink">{actor === "couple" ? "Pelaku budaya yang datang ke Anda" : "Anda menanggapi permintaan terbuka"}</p><p className="mt-1 text-sm text-muted">{actor === "couple" ? "Pasang permintaan terbuka. Pelaku terverifikasi yang cocok mengajukan minat dan perkiraan harga; Anda yang memilih." : "Lihat kebutuhan yang dipasang keluarga, ajukan minat dan perkiraan harga. Bila dipilih, lanjut ke kerja sama."}</p></div>
  </div>;
}

function RequestFacts({ r }: { r: OpenRequest }) {
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{longDate(r.date)}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span><span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{r.budget}</span></div>;
}

export function CoupleOpenRequests() {
  const { openRequests, addOpenRequest, chooseOpenRequest, navigate, toast } = useApp();
  const { flow, dispatch, live, loading, reload } = useCooperation();
  const { plan } = useEventPlan();
  const mine = openRequests.filter(r => r.mine);
  const [open, setOpen] = useState(mine.length === 0);
  const [form, setForm] = useState({ category: openRequestCategories[0], title: "", date: plan.date || "2027-06-12", location: plan.location || "Makassar", budget: "", detail: "" });
  const [error, setError] = useState("");
  const submit = () => {
    if (form.title.trim().length < 5 || form.detail.trim().length < 10) { setError("Isi judul (min. 5 karakter) dan rincian kebutuhan (min. 10 karakter)."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { setError("Pilih tanggal acara."); return; }
    addOpenRequest({ ...form, title: form.title.trim(), detail: form.detail.trim(), budget: form.budget.trim() || "Belum ditentukan", family: flow.accounts.couple?.name ?? "Keluarga demo" });
    setForm({ ...form, title: "", detail: "", budget: "" }); setError(""); setOpen(false);
    toast("Permintaan terbuka dipasang. Pelaku budaya yang cocok dapat mengajukan minat.", "success", "Terpasang");
  };
  const choose = async (r: OpenRequest, vendor: string) => {
    const id = `or-case-${Date.now().toString(36)}`;
    const request = `${r.title}. ${r.detail} (dari permintaan terbuka)`;
    if (live && loading) { toast("Data masih dimuat dari server. Tunggu sebentar lalu pilih lagi.", "info"); return; }
    // Akun nyata: kerja sama dibuat, permintaan dikirim, dan permintaan terbuka ditutup dalam satu langkah server.
    if (live) {
      try {
        const res = await callFunction<{ row: { id: string } }>("cooperation-action", { requestId: r.id, vendorName: vendor, action: { type: "choose_open", id: crypto.randomUUID(), data: { date: r.date, request } } });
        chooseOpenRequest(r.id, vendor, res.row.id, true);
        await reload();
        toast(`${vendor} dipilih. Permintaan resmi terkirim; lanjutkan di Kerja sama.`, "success", "Pelaku dipilih");
        navigate(caseRoute("couple", "requests", res.row.id));
        return;
      } catch (e) { if (!(e instanceof FunctionMissingError)) { toast(friendly(e), "error", "Belum dapat dipilih"); return; } }
    }
    if (!dispatch({ type: "lead", actor: "couple", id, data: { vendor, date: r.date, request } })) { if (live) toast("Pelaku belum dapat dipilih. Muat ulang halaman lalu coba lagi.", "error"); return; }
    if (!dispatch({ type: "submit", actor: "couple", caseId: id, data: {} })) return;
    chooseOpenRequest(r.id, vendor, id);
    toast(`${vendor} dipilih. Permintaan resmi terkirim; lanjutkan di Kerja sama.`, "success", "Pelaku dipilih");
    navigate(caseRoute("couple", "requests", id));
  };
  return <>
    <PageHeader title="Permintaan terbuka" description="Tidak perlu mencari satu per satu. Tulis kebutuhan Anda; pelaku budaya terverifikasi yang cocok mengajukan minat dan perkiraan harga. Anda yang memilih." actions={!open ? <Button onClick={() => setOpen(true)} leading={<Plus className="h-4 w-4" />}>Pasang permintaan</Button> : undefined} />
    <TwoWayNote actor="couple" />
    {open && <Card className="mb-5 p-5"><h2 className="font-display text-2xl">Pasang permintaan baru</h2><p className="mt-1 text-sm text-muted">Nomor telepon Anda tidak ditampilkan. Pelaku hanya melihat kebutuhan, tanggal, lokasi, dan kisaran anggaran.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Jenis layanan"><Select aria-label="Jenis layanan" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{openRequestCategories.map(c => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Tanggal acara"><Input aria-label="Tanggal permintaan" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Judul kebutuhan" className="sm:col-span-2"><Input aria-label="Judul permintaan" value={form.title} maxLength={120} placeholder="Contoh: Pemandu adat untuk mappacci" onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Lokasi"><Input aria-label="Lokasi permintaan" value={form.location} maxLength={120} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Kisaran anggaran"><Input aria-label="Kisaran anggaran" value={form.budget} maxLength={60} placeholder="Contoh: Rp5–7 juta" onChange={e => setForm({ ...form, budget: e.target.value })} /></Field>
        <Field label="Rincian kebutuhan" className="sm:col-span-2"><Textarea aria-label="Rincian permintaan" value={form.detail} maxLength={1500} placeholder="Prosesi apa, berapa hari, jumlah tamu, hal yang penting bagi keluarga…" onChange={e => setForm({ ...form, detail: e.target.value })} /></Field>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#933A2F]">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><Button onClick={submit} leading={<Megaphone className="h-4 w-4" />}>Pasang permintaan terbuka</Button>{mine.length > 0 && <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>}</div>
    </Card>}
    <div className="space-y-4">{mine.map(r => <Card key={r.id} id={`open-request-${r.id}`} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><Badge tone="sand">{r.category}</Badge><h2 className="mt-2 font-display text-xl text-ink">{r.title}</h2><RequestFacts r={r} /></div><Badge tone={r.status === "open" ? "green" : "neutral"} dot>{r.status === "open" ? "Terbuka" : `Dipilih: ${r.chosen}`}</Badge></div>
      <p className="mt-3 text-sm text-ink-soft">{r.detail}</p>
      <h3 className="mt-4 text-[15px] font-bold text-ink">{r.responses.length ? `${r.responses.length} pelaku mengajukan minat` : "Belum ada pelaku yang mengajukan minat"}</h3>
      {r.responses.length === 0 && !live && <p className="mt-1 text-sm text-muted">Coba beralih ke peran Pelaku (menu samping) lalu buka "Peluang" untuk melihat sisi pelaku budaya.</p>}
      <ul className="mt-2 space-y-2">{r.responses.map(x => {
        const p = practitioners.find(pp => pp.name === x.vendor); return <li key={x.id} className="flex flex-col gap-3 rounded-2xl bg-cream p-3 sm:flex-row sm:items-center">
          {p && <img src={p.cover} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1"><p className="font-semibold text-ink">{x.vendor} <span className="font-normal text-muted">· {p?.category ?? "Pelaku budaya"}</span></p><p className="text-sm text-ink-soft">{x.note}</p><p className="mt-1 text-sm font-semibold text-ink">Perkiraan {formatIDR(x.price)}</p></div>
          <div className="flex shrink-0 flex-wrap gap-2">{p && <Button size="sm" variant="secondary" onClick={() => navigate(`praktisi/${p.id}`)}>Lihat profil</Button>}{r.status === "open" ? <Button size="sm" onClick={() => choose(r, x.vendor)}>Pilih pelaku ini</Button> : r.chosen === x.vendor && r.caseId ? <Button size="sm" onClick={() => navigate(caseRoute("couple", "requests", r.caseId))}>Buka kerja sama</Button> : null}</div>
        </li>;
      })}</ul>
    </Card>)}</div>
  </>;
}

export function VendorOpportunities() {
  const { openRequests, respondOpenRequest, toast } = useApp();
  const { flow, live } = useCooperation();
  const { navigate } = useApp();
  const me = flow.accounts.vendor?.name ?? practitioners[0].name;
  const reviewed = Object.values(flow.vendorReview).every(Boolean);
  const myCategory = practitioners.find(p => p.name === me)?.category ?? "";
  const [filter, setFilter] = useState("Semua");
  const [drafts, setDrafts] = useState<Record<string, { note: string; price: string; open: boolean; error: string }>>({});
  const list = openRequests.filter(r => filter === "Semua" || r.category === filter);
  const d = (id: string) => drafts[id] ?? { note: "", price: "", open: false, error: "" };
  const set = (id: string, patch: Partial<{ note: string; price: string; open: boolean; error: string }>) => setDrafts(prev => ({ ...prev, [id]: { ...d(id), ...patch } }));
  const send = (r: OpenRequest) => {
    const x = d(r.id), price = Number(x.price.replace(/\D/g, ""));
    if (x.note.trim().length < 10 || !price) { set(r.id, { error: "Tulis pesan (min. 10 karakter) dan perkiraan harga dalam Rupiah." }); return; }
    respondOpenRequest(r.id, { vendor: me, note: x.note.trim(), price });
    set(r.id, { open: false, error: "" });
    toast("Minat terkirim. Keluarga akan melihat pesan dan perkiraan harga Anda.", "success", "Terkirim");
  };
  if (live && (!flow.accounts.vendor || !reviewed)) return <>
    <PageHeader title="Peluang: permintaan terbuka" description="Kebutuhan yang dipasang keluarga akan tampil di sini." />
    <Card className="p-6"><h2 className="font-display text-xl">{flow.accounts.vendor ? "Profil Anda sedang ditinjau" : "Lengkapi profil layanan Anda dulu"}</h2><p className="mt-2 text-sm text-muted">{flow.accounts.vendor ? "Peninjau VAKSARA memeriksa identitas, konteks budaya, dan persetujuan publikasi. Setelah disetujui, permintaan terbuka dari keluarga muncul di halaman ini." : "Isi nama usaha atau sanggar, kategori layanan, wilayah, dan kontak. Setelah ditinjau, profil Anda tampil di direktori dan Anda dapat menanggapi permintaan keluarga."}</p><Button className="mt-4" onClick={() => navigate("vendor/profil")}>{flow.accounts.vendor ? "Lihat profil layanan" : "Isi profil layanan"}</Button></Card>
  </>;
  return <>
    <PageHeader title="Peluang: permintaan terbuka" description={`Kebutuhan yang dipasang keluarga. Ajukan minat dan perkiraan harga; bila keluarga memilih Anda, permintaan resmi masuk ke Kerja sama. Masuk sebagai: ${me}.`} />
    <TwoWayNote actor="vendor" />
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">{["Semua", ...openRequestCategories].map(c => <button key={c} onClick={() => setFilter(c)} className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold ${filter === c ? "bg-ink text-cream" : "bg-white text-ink-soft ring-1 ring-line"}`}>{c}</button>)}</div>
    <div className="grid gap-4 lg:grid-cols-2">{list.map(r => {
      const mine = r.responses.find(x => x.vendor === me), x = d(r.id); return <Card key={r.id} id={`opportunity-${r.id}`} className="flex flex-col p-5">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={r.category.startsWith(myCategory.split(" ")[0]) ? "green" : "sand"}>{r.category}</Badge>{r.status === "closed" && <Badge tone="neutral">Sudah memilih pelaku</Badge>}</div>
        <h2 className="mt-2 font-display text-xl text-ink">{r.title}</h2><p className="text-sm text-muted">{r.family}</p><RequestFacts r={r} />
        <p className="mt-3 flex-1 text-sm text-ink-soft">{r.detail}</p>
        <p className="mt-3 text-[13px] text-muted">{r.responses.length} pelaku sudah mengajukan minat</p>
        {mine ? <div className="mt-3 rounded-2xl bg-[#EEF7F1] p-3 text-sm"><b className="text-[#1E5C38]">{r.status === "closed" ? (r.chosen === me ? "Keluarga memilih Anda. Cek menu Kerja sama." : "Keluarga memilih pelaku lain.") : "Minat Anda terkirim"}</b><p className="mt-1 text-ink-soft">{mine.note} · {formatIDR(mine.price)}</p></div>
          : r.status === "open" && (x.open ? <div className="mt-3 space-y-2 rounded-2xl bg-cream p-3"><Field label="Pesan untuk keluarga"><Textarea aria-label={`Pesan minat ${r.id}`} value={x.note} maxLength={800} placeholder="Pengalaman Anda untuk kebutuhan ini dan apa yang termasuk…" onChange={e => set(r.id, { note: e.target.value })} /></Field><Field label="Perkiraan harga (Rp)"><Input aria-label={`Perkiraan harga ${r.id}`} inputMode="numeric" value={x.price} placeholder="Contoh: 6000000" onChange={e => set(r.id, { price: e.target.value })} /></Field>{x.error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{x.error}</p>}<div className="flex gap-2"><Button size="sm" onClick={() => send(r)}>Kirim minat</Button><Button size="sm" variant="ghost" onClick={() => set(r.id, { open: false })}>Batal</Button></div></div> : <Button className="mt-3 self-start" onClick={() => set(r.id, { open: true })}>Ajukan minat</Button>)}
      </Card>;
    })}</div>
    {list.length === 0 && <Card className="p-6 text-sm text-muted">Belum ada permintaan terbuka pada kategori ini.</Card>}
  </>;
}
