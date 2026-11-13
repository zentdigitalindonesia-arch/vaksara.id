import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  StatCard,
  Textarea,
  UploadBox,
  statusTone
} from "@/components/ui";
import { formatIDR, type Dispute, type DisputeStatus } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Handshake,
  Lock,
  MessageSquareWarning,
  Plus,
  Scale,
  Search,
  Send,
  UploadCloud,
  UserCog
} from "lucide-react";
import { useMemo, useState } from "react";

const allStatuses: DisputeStatus[] = ["Diajukan", "Menunggu Tanggapan", "Klarifikasi", "Fasilitasi Penyelesaian", "Menunggu Persetujuan", "Selesai dengan Kesepakatan", "Tidak Terselesaikan"];

export default function DisputeCenter({ id }: { id?: string }) {
  const { disputes, agreements, navigate, updateDispute, addDispute, toast } = useApp();
  const [selectedId, setSelectedId] = useState(id ?? disputes[0]?.id);
  const selected = disputes.find((d) => d.id === selectedId) ?? disputes[0];
  const [view, setView] = useState<"pengantin" | "vendor" | "officer">("pengantin");
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [fileOpen, setFileOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondMode, setRespondMode] = useState<"clarify" | "alternative" | "evidence">("clarify");
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [respondText, setRespondText] = useState("");
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [scheduleDate, setScheduleDate] = useState("2027-07-18");
  const [scheduleTime, setScheduleTime] = useState("14:00");
  const [agree, setAgree] = useState(false);

  const filtered = useMemo(() => disputes.filter((d) => (filter === "Semua" ? true : d.status === filter) && `${d.number} ${d.title} ${d.opener} ${d.responder}`.toLowerCase().includes(query.toLowerCase())), [disputes, filter, query]);

  const sendResponse = () => {
    if (!selected || respondText.trim().length < 10) return;
    const label = respondMode === "clarify" ? "Klarifikasi" : respondMode === "alternative" ? "Usulan alternatif" : "Bukti tambahan";
    updateDispute(selected.id, {
      status: respondMode === "alternative" ? "Menunggu Persetujuan" : "Klarifikasi",
      updated: "Hari ini",
      messages: [...selected.messages, { by: view === "vendor" ? selected.responder : view === "officer" ? "VAKSARA Trust Officer" : selected.opener, role: view === "vendor" ? "Vendor" : view === "officer" ? "Trust Officer" : "Pengantin", date: "Hari ini · baru saja", text: `${label}: ${respondText}`, type: respondMode === "clarify" ? "clarification" : "proposal" }],
    });
    setRespondOpen(false);
    setRespondText("");
    setFiles([]);
    toast(`${label} dikirim dan tercatat pada kronologi kasus.`, "success", "Tanggapan terkirim");
  };

  const acceptProposal = () => {
    if (!selected) return;
    updateDispute(selected.id, {
      status: "Selesai dengan Kesepakatan",
      updated: "Hari ini",
      nextAction: "Kesepakatan dicatat & kasus ditutup",
      messages: [...selected.messages, { by: "VAKSARA Trust Officer", role: "Trust Officer", date: "Hari ini", text: "Kedua pihak menyetujui usulan penyelesaian. Kasus ditutup dengan kesepakatan. Dokumen dan kronologi tetap dapat diakses untuk ditinjau.", type: "note" }],
    });
    setAcceptOpen(false);
    toast("Kesepakatan dicatat. Kasus ditutup tanpa putusan hukum.", "success", "Selesai dengan kesepakatan");
  };

  const schedule = () => {
    if (!selected) return;
    updateDispute(selected.id, { status: "Fasilitasi Penyelesaian", nextAction: `Fasilitasi ${new Date(scheduleDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long" })} · ${scheduleTime} WITA`, updated: "Hari ini" });
    setScheduleOpen(false);
    toast("Jadwal fasilitasi diusulkan kepada kedua pihak dan dicatat pada audit trail.", "success", "Fasilitasi dijadwalkan");
  };

  return (
    <>
      <PageHeader
        eyebrow="Amanah & penyelesaian"
        title="Pusat Penyelesaian"
        description="Ruang netral untuk menyampaikan masalah, mengunggah bukti, menanggapi, dan mencatat kesepakatan. Bukan pengadilan, bukan penjamin pengembalian dana."
        actions={<><Button size="sm" variant="secondary" onClick={() => navigate("perjanjian/a5")} leading={<FileSignature className="h-3.5 w-3.5" />}>Lihat perjanjian</Button><Button size="sm" onClick={() => setFileOpen(true)} leading={<Plus className="h-3.5 w-3.5" />}>Ajukan pengaduan</Button></>}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Kasus aktif" value={disputes.filter((d) => !["Selesai dengan Kesepakatan", "Tidak Terselesaikan"].includes(d.status)).length} helper="2 memerlukan tanggapan" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} tone="red" />
        <StatCard label="Fasilitasi" value="1" helper="18 Juli 2027 · 14.00 WITA" icon={<Handshake className="h-3.5 w-3.5" />} tone="blue" />
        <StatCard label="Menunggu persetujuan" value="1" helper="Usulan penyelesaian dikirim" icon={<Clock className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Selesai dengan kesepakatan" value="1" helper="Didokumentasikan" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" />
      </div>

      <Alert tone="trust" className="mt-3" title="Batas peran VAKSARA">
        VAKSARA memfasilitasi komunikasi dan dokumentasi. Kami tidak menyediakan pengadilan, arbitrase, putusan hukum, escrow, atau jaminan pengembalian dana otomatis. Kesepakatan bergantung pada para pihak. <button onClick={() => navigate("tentang")} className="font-bold underline decoration-sand underline-offset-2">Pelajari batas layanan</button>
      </Alert>

      <div className="mt-3 grid gap-3 lg:grid-cols-[310px_1fr]">
        {/* CASES LIST */}
        <aside>
          <Card className="overflow-hidden">
            <div className="border-b border-line p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-ink">Kasus Anda</h2>
                <Badge tone="neutral" className="text-[12px]">{disputes.length}</Badge>
              </div>
              <div className="relative mt-2"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nomor atau pihak" className="h-7 w-full rounded-md border border-line bg-white pl-7 pr-2 text-[13px] outline-none focus:border-sand-deep" /></div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Saring status kasus" className="mt-1.5 h-7 w-full rounded-md border border-line bg-white px-2 text-[13px] font-medium text-ink-soft outline-none">
                <option>Semua</option>
                {allStatuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="max-h-[520px] divide-y divide-line/60 overflow-y-auto">
              {filtered.map((d) => {
                const active = selected?.id === d.id;
                return (
                  <button key={d.id} onClick={() => { setSelectedId(d.id); navigate(`sengketa/${d.id}`); }} className={cn("block w-full px-3 py-3 text-left transition-colors", active ? "bg-[#F7F3E9]" : "hover:bg-cream/60")}>
                    <div className="flex items-start justify-between gap-2"><span className="text-[12px] font-bold text-sand-deep">{d.number}</span><Badge tone={statusTone(d.status)} dot className="shrink-0 px-1.5 py-0.5 text-[11px]">{d.status}</Badge></div>
                    <div className="mt-1 text-[14px] font-semibold leading-snug text-ink">{d.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-muted"><span className="truncate">{d.responder}</span><span className="shrink-0">{d.updated}</span></div>
                    {active && <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-sand-deep"><span className="h-1 w-1 rounded-full bg-sand" />Sedang dibuka<ArrowRight className="ml-auto h-2.5 w-2.5" /></div>}
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="p-4"><EmptyState compact title="Tidak ada kasus" description="Sesuaikan saringan atau ajukan pengaduan baru." /></div>}
            </div>
          </Card>
          <div className="mt-2 rounded-xl border border-line bg-[#F4F0E6] p-3">
            <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><Lock className="h-3 w-3 text-sand-deep" /> Privasi & akses</div>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Hanya Anda, pihak vendor terkait, dan Trust Officer yang ditugaskan dapat membaca berkas kasus. Bukti tidak dapat dihapus setelah diunggah.</p>
          </div>
        </aside>

        {/* DETAIL */}
        <div className="min-w-0">
          {selected ? (
            <>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line bg-[#FBFAF6] px-4 py-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5"><span className="text-[13px] font-bold text-sand-deep">{selected.number}</span><Badge tone={statusTone(selected.status)} dot className="text-[12px]">{selected.status}</Badge><Badge tone="neutral" className="text-[11px]">Prototipe</Badge></div>
                    <h2 className="mt-1 font-display text-[1.25rem] font-semibold leading-snug text-ink">{selected.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted"><span>Dibuka oleh {selected.opener}</span><span>·</span><span>{selected.opened}</span><span>·</span><span>Trust Officer: {selected.officer}</span></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`perjanjian/${selected.agreementId}`)} leading={<FileSignature className="h-3 w-3" />}>Perjanjian</Button>
                    <Button size="sm" variant="secondary" onClick={() => toast("Kronologi lengkap akan diunduh pada implementasi produksi.", "info", "Unduh kronologi")} leading={<Download className="h-3 w-3" />}><span className="hidden sm:inline">Kronologi</span></Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
                  <div className="flex items-center gap-1 text-[12px] text-muted"><UserCog className="h-3 w-3 text-sand-deep" /> Tampilan demo:</div>
                  <div className="flex rounded-md border border-line bg-[#F2EFE6] p-0.5">
                    {(["pengantin", "vendor", "officer"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cn("rounded px-2 py-1 text-[12px] font-semibold capitalize", view === v ? "bg-white text-ink shadow-sm" : "text-muted")}>{v === "officer" ? "Trust Officer" : v}</button>)}
                  </div>
                </div>
                <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
                  {allStatuses.map((s, i) => {
                    const currentIdx = allStatuses.indexOf(selected.status);
                    const done = i < currentIdx || selected.status === "Selesai dengan Kesepakatan";
                    const active = s === selected.status;
                    return <span key={s} className={cn("flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold", active ? "bg-ink text-cream" : done ? "bg-[#EDF4EF] text-[#2B5949]" : s === "Tidak Terselesaikan" ? "bg-[#F9ECE9] text-[#933A2F]" : "bg-[#F4F2EC] text-muted")}>{done && !active && <Check className="h-2 w-2" />}{s}</span>;
                  })}
                </div>
                <div className="p-4">
                  <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Ringkasan masalah</div>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{selected.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{selected.clauses.map((c) => <Badge key={c} tone="outline" className="text-[12px]">{c}</Badge>)}</div>
                  </div>
                  <div className="mt-2 rounded-xl border border-sand/40 bg-sand-light/40 p-3">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-sand-deep"><Handshake className="h-3 w-3" /> Usulan penyelesaian {selected.opener.split(" ")[0]}</div>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{selected.proposed}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Tanggapan & kronologi</div>
                    <Badge tone="neutral" className="text-[12px]">{selected.messages.length} catatan</Badge>
                  </div>
                  <div className="mt-2 space-y-2">
                    {selected.messages.map((m, i) => (
                      <div key={i} className={cn("rounded-lg border p-2.5", m.role === "Trust Officer" ? "border-[#D5E3EB] bg-[#F4F8FA]" : "border-line bg-white")}>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5"><Avatar name={m.by} size="xs" /><span className="text-[13px] font-bold text-ink">{m.by}</span><Badge tone={m.role === "Vendor" ? "sand" : m.role === "Trust Officer" ? "blue" : "neutral"} className="px-1 py-0 text-[11px]">{m.role}</Badge></div>
                          <span className="text-[11px] text-muted">{m.date}</span>
                        </div>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{m.text}</p>
                      </div>
                    ))}
                    {selected.messages.length === 0 && <EmptyState compact title="Belum ada tanggapan" description="Kasus baru menunggu triase Trust Officer. Anda akan menerima notifikasi untuk setiap tanggapan." />}
                  </div>

                  {/* action row by view */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                    <Button size="sm" variant="secondary" onClick={() => { setRespondMode("clarify"); setRespondOpen(true); }} leading={<MessageSquareWarning className="h-3 w-3" />}>{view === "vendor" ? "Kirim klarifikasi" : "Tambahkan tanggapan"}</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setFiles([]); setRespondMode("evidence"); setRespondOpen(true); }} leading={<UploadCloud className="h-3 w-3" />}>Unggah bukti</Button>
                    {view === "vendor" ? (
                      <>
                        <Button size="sm" onClick={() => setAcceptOpen(true)} leading={<Check className="h-3 w-3" />}>Setujui usulan</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setRespondMode("alternative"); setRespondOpen(true); }}>Usulkan alternatif</Button>
                      </>
                    ) : view === "officer" ? (
                      <>
                        <Button size="sm" onClick={() => setScheduleOpen(true)} leading={<CalendarPlus className="h-3 w-3" />}>Jadwalkan fasilitasi</Button>
                        <Button size="sm" variant="secondary" onClick={() => toast("Catatan fasilitasi ditambahkan pada kronologi.", "success")}>Catat hasil</Button>
                        <span className="text-[12px] text-muted">Officer tidak dapat mengubah dokumen yang telah disepakati.</span>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setAcceptOpen(true)}>Terima usulan penyelesaian</Button>
                    )}
                  </div>
                </div>
              </Card>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <SectionCard title="Bukti & lampiran" subtitle="Berkas tidak dapat dihapus. Akses tercatat." action={<Badge tone="neutral" className="text-[12px]">{selected.evidence.length} berkas</Badge>}>
                  <div className="space-y-1.5">
                    {selected.evidence.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-sand-deep" />
                        <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-ink">{f.name}</div><div className="text-[11px] text-muted">{f.from} · {f.date}</div></div>
                        <button onClick={() => toast("Pratinjau bukti tersedia pada implementasi produksi dengan kontrol akses.", "info")} className="shrink-0 rounded p-0.5 text-muted hover:text-ink" aria-label={`Lihat ${f.name}`}><Eye className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" full className="mt-2" onClick={() => { setRespondMode("evidence"); setRespondOpen(true); }} leading={<Plus className="h-3 w-3" />}>Tambahkan bukti</Button>
                </SectionCard>
                <SectionCard title="Tindakan berikutnya" subtitle="Semua perubahan dicatat dalam audit trail.">
                  <div className="rounded-lg border border-[#F0E0C1] bg-[#FCF9F1] p-2.5 text-[14px] font-semibold text-[#79551A]"><Clock className="mr-1 inline h-3 w-3" /> {selected.nextAction}</div>
                  <div className="mt-2 space-y-1.5 text-[13px]">
                    {[["Pihak pengadu", selected.opener], ["Pihak pelaku budaya", selected.responder], ["Perjanjian", selected.agreementId === "a5" ? "VKS-PJK-2027-0149" : "Terkait"], ["Trust Officer", selected.officer], ["Pembaruan terakhir", selected.updated]].map(([l, v]) => <div key={l} className="flex justify-between gap-2"><span className="text-muted">{l}</span><span className="max-w-[62%] text-right font-semibold text-ink">{v}</span></div>)}
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#F4F8FA] p-2 text-[12px] leading-relaxed text-[#33607A]"><Scale className="mt-0.5 h-3 w-3 shrink-0" /> VAKSARA tidak memberikan putusan atau memaksa salah satu pihak.</div>
                </SectionCard>
              </div>
            </>
          ) : (
            <EmptyState title="Pilih kasus" description="Pilih salah satu kasus pada daftar untuk melihat kronologi." />
          )}
        </div>
      </div>

      {/* FILE COMPLAINT */}
      <FileComplaint open={fileOpen} onClose={() => setFileOpen(false)} agreements={agreements} onCreate={(d) => { addDispute(d); setSelectedId(d.id); setFileOpen(false); navigate(`sengketa/${d.id}`); toast("Pengaduan diajukan. Trust Officer akan melakukan triase awal.", "success", `${d.number} diajukan`); }} />

      {/* RESPONSE */}
      <Modal
        open={respondOpen}
        onClose={() => setRespondOpen(false)}
        title={respondMode === "clarify" ? "Tambahkan tanggapan" : respondMode === "alternative" ? "Usulkan alternatif penyelesaian" : "Unggah bukti tambahan"}
        description="Tanggapan akan terlihat oleh kedua pihak dan Trust Officer yang ditugaskan. Jangan unggah data yang tidak relevan."
        size="md"
        footer={<><Button variant="secondary" size="sm" onClick={() => setRespondOpen(false)}>Batal</Button><Button size="sm" disabled={respondText.trim().length < 10} onClick={sendResponse} leading={<Send className="h-3.5 w-3.5" />}>Kirim tanggapan</Button></>}
      >
        <div className="space-y-3">
          <Field label="Klarifikasi atau usulan" required hint={`${respondText.length}/500`}><Textarea value={respondText} onChange={(e) => setRespondText(e.target.value.slice(0, 500))} placeholder="Tuliskan fakta, tanggapan, atau usulan penyelesaian secara spesifik." className="min-h-[110px]" /></Field>
          <UploadBox title="Lampirkan bukti (opsional)" hint="Bukti tidak dapat dihapus setelah dikirim" files={files} onAdd={() => setFiles((prev) => [...prev, { name: `Bukti-tanggapan-${prev.length + 1}.pdf`, size: "—" }])} onRemove={(name) => setFiles((prev) => prev.filter((f) => f.name !== name))} />
          {respondMode === "alternative" && <Alert tone="info" title="Usulan alternatif">Pihak lain akan menerima pemberitahuan untuk menerima, menolak, atau mengusulkan penyelesaian lain. Tidak ada keputusan otomatis.</Alert>}
        </div>
      </Modal>

      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Setujui usulan penyelesaian?" description="Kesepakatan akan dicatat pada kronologi kasus. Pastikan Anda memahami isinya." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setAcceptOpen(false)}>Periksa lagi</Button><Button size="sm" disabled={!agree} onClick={acceptProposal}>Setujui & catat kesepakatan</Button></>}>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-[#FBFAF6] p-3 text-[14px] leading-relaxed text-ink-soft">{selected?.proposed}</div>
          <Alert tone="warn" title="Bukan putusan hukum">Kesepakatan ini bersifat tercatat pada platform. VAKSARA tidak memproses pengembalian dana otomatis dan tidak menjamin kepatuhan pihak lain.</Alert>
          <Checkbox checked={agree} onChange={setAgree} label={<span className="text-[13px]">Saya memahami kesepakatan ini dicatat tanpa putusan pengadilan atau arbitrase.</span>} />
        </div>
      </Modal>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Jadwalkan fasilitasi" description="Trust Officer memfasilitasi percakapan. Ini bukan sidang atau arbitrase." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setScheduleOpen(false)}>Batal</Button><Button size="sm" onClick={schedule}>Kirim usulan jadwal</Button></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Tanggal" required><Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} /></Field><Field label="Waktu (WITA)" required><Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} /></Field></div>
          <Field label="Agenda fasilitasi"><Textarea placeholder="Contoh: menyepakati jadwal pengiriman hasil kerja dan dampaknya pada pelunasan." className="min-h-[70px]" /></Field>
          <Alert tone="info" title="Undangan netral">Kedua pihak menerima undangan yang sama. Ketidakhadiran tidak menghasilkan putusan otomatis.</Alert>
        </div>
      </Modal>
    </>
  );
}

function FileComplaint({ open, onClose, agreements, onCreate }: { open: boolean; onClose: () => void; agreements: ReturnType<typeof useApp>["agreements"]; onCreate: (d: Dispute) => void }) {
  const [agreementId, setAgreementId] = useState("a5");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clause, setClause] = useState("Pasal 1 — Hasil Kerja");
  const [proposed, setProposed] = useState("");
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const agreement = agreements.find((a) => a.id === agreementId) ?? agreements[0];

  const submit = () => {
    if (!title.trim()) return setError("Isi judul masalah.");
    if (description.trim().length < 30) return setError("Uraikan masalah minimal 30 karakter.");
    if (proposed.trim().length < 15) return setError("Tuliskan usulan penyelesaian yang Anda harapkan.");
    if (!ack) return setError("Konfirmasi bahwa Anda memahami batas peran VAKSARA.");
    const d: Dispute = {
      id: `d-${Date.now()}`,
      number: `DSP-2027-${100 + Math.floor(Math.random() * 899)}`,
      agreementId,
      title,
      status: "Diajukan",
      opener: "Nurul Amalia",
      responder: agreement.partner,
      opened: "Hari ini",
      updated: "Hari ini",
      nextAction: "Menunggu triase awal Trust Officer",
      clauses: [clause],
      description,
      proposed,
      evidence: files.map((f) => ({ name: f.name, from: "Nurul Amalia", date: "Hari ini", type: "FILE" })),
      messages: [{ by: "Nurul Amalia", role: "Pengantin", date: "Hari ini · baru saja", text: description, type: "proposal" }],
      officer: "Belum ditugaskan",
    };
    onCreate(d);
    setTitle(""); setDescription(""); setProposed(""); setFiles([]); setAck(false); setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajukan pengaduan" description="Pilih perjanjian yang terkait dan jelaskan masalah secara faktual. Kedua pihak akan mendapat kesempatan menanggapi." size="lg" eyebrow="Pengaduan baru"
      footer={<><span className="mr-auto hidden items-center gap-1 text-[12px] text-muted sm:flex"><Lock className="h-3 w-3 text-sand-deep" /> Akses terbatas pada pihak & officer</span><Button variant="secondary" size="sm" onClick={onClose}>Batal</Button><Button size="sm" onClick={submit} leading={<Send className="h-3.5 w-3.5" />}>Ajukan pengaduan</Button></>}>
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <Field label="Perjanjian terkait" required><Select value={agreementId} onChange={(e) => setAgreementId(e.target.value)}>{agreements.map((a) => <option key={a.id} value={a.id}>{a.number} — {a.partner}</option>)}</Select></Field>
          <div className="rounded-lg border border-line bg-[#FBFAF6] px-3 py-2 text-[13px]"><div className="flex justify-between"><span className="text-muted">Layanan</span><span className="font-semibold text-ink">{agreement.service}</span></div><div className="mt-1 flex justify-between"><span className="text-muted">Nilai perjanjian</span><span className="font-semibold text-ink">{formatIDR(agreement.value)}</span></div></div>
          <Field label="Judul masalah" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Hasil kerja belum sesuai ruang lingkup" /></Field>
          <Field label="Uraian masalah" required hint={`${description.length}/600`}><Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 600))} placeholder="Jelaskan apa yang terjadi, kapan, dan dampaknya. Hindari tuduhan tanpa bukti." className="min-h-[100px]" /></Field>
          <Field label="Pasal yang terdampak" required><Select value={clause} onChange={(e) => setClause(e.target.value)}>{agreement.clauses.map((c) => <option key={c.title}>{c.title}</option>)}</Select></Field>
          <Field label="Usulan penyelesaian" required><Textarea value={proposed} onChange={(e) => setProposed(e.target.value)} placeholder="Contoh: pengiriman file tersisa paling lambat 20 Juli dan peninjauan ulang BAST." className="min-h-[70px]" /></Field>
          <UploadBox title="Unggah bukti" files={files} onAdd={() => setFiles((p) => [...p, { name: `Bukti-${p.length + 1}.pdf`, size: "—" }])} onRemove={(name) => setFiles((p) => p.filter((f) => f.name !== name))} />
          {error && <Alert tone="error" title="Periksa kembali">{error}</Alert>}
        </div>
        <div className="space-y-2.5">
          <div className="rounded-xl border border-sand/40 bg-sand-light/40 p-3">
            <div className="text-[12px] font-bold uppercase tracking-wider text-sand-deep">Sebelum mengajukan</div>
            <ul className="mt-1.5 space-y-1.5 text-[12px] leading-relaxed text-ink-soft">
              <li className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Pastikan komunikasi langsung telah dicoba, bila aman.</li>
              <li className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Unggah bukti yang relevan dan tidak memuat data pribadi berlebih.</li>
              <li className="flex gap-1.5"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />Sampaikan usulan yang realistis, bukan tuntutan putusan.</li>
            </ul>
          </div>
          <Alert tone="warn" title="Bukan pengadilan">Tidak ada putusan, arbitrase, atau jaminan pengembalian dana. VAKSARA memfasilitasi komunikasi dan pencatatan.</Alert>
          <Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya memahami dan menyatakan uraian ini benar menurut pengetahuan saya.</span>} />
        </div>
      </div>
    </Modal>
  );
}
