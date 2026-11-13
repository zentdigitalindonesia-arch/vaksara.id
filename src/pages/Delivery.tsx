import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
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
import { deliveryMilestones, formatIDR, type Dispute } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Download,
  FileSignature,
  FileText,
  MapPin,
  MessageSquareWarning,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  UploadCloud,
  X
} from "lucide-react";
import { useState } from "react";

/* ===================== DELIVERY TRACKER ===================== */
export function DeliveryTracker({ id }: { id: string }) {
  const { agreements, navigate, toast } = useApp();
  const a = agreements.find((x) => x.id === id) ?? agreements[0];
  const [files, setFiles] = useState<{ name: string; size: string }[]>([{ name: "Draf-Rundown-v2.pdf", size: "620 KB" }]);
  const [changeOpen, setChangeOpen] = useState(false);
  const [bastOpen, setBastOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [changeAck, setChangeAck] = useState(false);
  const [bastAck, setBastAck] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);

  const pct = 72;

  const submitChange = () => {
    if (reason.trim().length < 20) return;
    setChangeOpen(false);
    setReason("");
    setChangeAck(false);
    toast("Permintaan perubahan dikirim ke pihak lain. Perubahan belum berlaku sampai disetujui.", "success", "Perubahan diajukan");
  };

  return (
    <>
      <PageHeader
        eyebrow="Pelacakan layanan · VAKSARA Trust"
        title="Prosesi Mappacci & Pendampingan Adat"
        description={`${a.number} · ${a.partner} · ${a.schedule}`}
        back={{ label: "Kembali ke perjanjian", onClick: () => navigate(`perjanjian/${a.id}`) }}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setChangeOpen(true)} leading={<RotateCcw className="h-3.5 w-3.5" />}>Ajukan perubahan</Button>
            <Button size="sm" onClick={() => setBastOpen(true)} leading={<ClipboardCheck className="h-3.5 w-3.5" />}>Ajukan BAST</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Status layanan" value="Persiapan berjalan" helper={`${a.partner} · ${a.schedule}`} icon={<BadgeCheck className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Progres milestone" value={`${pct}%`} helper={`${4 + completed.length} dari 9 tahap`} icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="sand" progress={pct} />
        <StatCard label="Pembayaran tercatat" value={formatIDR(12950000, true)} helper="DP & termin 2" icon={<CreditCard className="h-3.5 w-3.5" />} tone="blue" onClick={() => navigate("planner/pembayaran")} />
        <StatCard label="BAST" value="Belum diajukan" helper="Menunggu layanan dilaksanakan" icon={<FileSignature className="h-3.5 w-3.5" />} tone="neutral" />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div><h2 className="text-[15px] font-bold text-ink">Perjalanan layanan</h2><p className="mt-0.5 text-[13px] text-muted">Urutan status sesuai kesepakatan. Bukti dapat diunggah pada tahap yang berjalan.</p></div>
              <Badge tone="green" dot className="text-[12px]">Aktif</Badge>
            </div>
            <div className="p-4">
              <div className="relative before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-line sm:before:left-[13px]">
                {deliveryMilestones.map((m, i) => {
                  const isDone = m.state === "Selesai" || completed.includes(m.title);
                  const isCurrent = m.state === "Berjalan" && !completed.includes(m.title);
                  return (
                    <div key={m.title} className="relative flex gap-3 pb-3 last:pb-0">
                      <span className={cn("relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold", isDone ? "border-ink bg-ink text-cream" : isCurrent ? "border-sand bg-sand-light text-sand-deep ring-4 ring-sand-light/40" : "border-line bg-white text-muted")}>
                        {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : isCurrent ? <Clock className="h-3 w-3" /> : i + 1}
                      </span>
                      <div className={cn("min-w-0 flex-1 rounded-lg border p-2.5", isCurrent ? "border-sand/70 bg-[#FBF8F0]" : "border-line bg-white")}>
                        <div className="flex flex-wrap items-start justify-between gap-1.5">
                          <div>
                            <h3 className={cn("text-[14px] font-bold", isDone ? "text-ink" : "text-ink-soft")}>{m.title}</h3>
                            {m.date && <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted"><CalendarDays className="h-2.5 w-2.5" />{m.date}</div>}
                          </div>
                          <Badge tone={isDone ? "green" : isCurrent ? "sand" : "neutral"} dot className="shrink-0 text-[11px]">{isDone ? "Selesai" : isCurrent ? "Berjalan" : m.state}</Badge>
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.note}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {m.evidence && <button onClick={() => toast("Berkas bukti hanya tersedia sebagai nama pada prototipe.", "info", m.evidence)} className="inline-flex items-center gap-1 rounded border border-line bg-white px-1.5 py-0.5 text-[12px] font-medium text-ink-soft hover:border-sand"><FileText className="h-2.5 w-2.5 text-sand-deep" />{m.evidence}</button>}
                          {isCurrent && (
                            <>
                              <button onClick={() => { setFiles((prev) => [...prev, { name: `Bukti-${prev.length + 1}.jpg`, size: "312 KB" }]); toast("Bukti contoh diunggah. Pengunggahan nyata belum tersedia.", "success", "Bukti ditambahkan"); }} className="inline-flex items-center gap-1 rounded border border-sand bg-sand-light/50 px-1.5 py-0.5 text-[12px] font-semibold text-[#6E5229] hover:bg-sand-light"><UploadCloud className="h-2.5 w-2.5" />Unggah bukti</button>
                              <button onClick={() => setNoteOpen(true)} className="inline-flex items-center gap-1 rounded border border-line bg-white px-1.5 py-0.5 text-[12px] font-medium text-ink-soft hover:border-sand"><MessageSquareWarning className="h-2.5 w-2.5" />Tambah catatan</button>
                              <button onClick={() => { setCompleted((p) => [...p, m.title]); toast("Milestone ditandai selesai pada sesi prototipe.", "success", "Milestone diperbarui"); }} className="inline-flex items-center gap-1 rounded border border-line bg-white px-1.5 py-0.5 text-[12px] font-semibold text-ink hover:border-sand"><Check className="h-2.5 w-2.5 text-[#4C8068]" />Tandai selesai</button>
                            </>
                          )}
                          {!isDone && !isCurrent && <span className="text-[12px] text-muted">Terkunci sampai tahap sebelumnya selesai</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <SectionCard title="Bukti & catatan layanan" subtitle="Diurutkan dari yang terbaru." action={<Badge tone="neutral" className="text-[12px]">{files.length} berkas</Badge>}>
            <div className="space-y-1.5">
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2">
                  <Paperclip className="h-3 w-3 shrink-0 text-sand-deep" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{f.name}</span>
                  <span className="shrink-0 text-[12px] text-muted">{f.size}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))} className="rounded p-0.5 text-muted hover:text-[#933A2F]" aria-label={`Hapus ${f.name}`}><X className="h-3 w-3" /></button>
                </div>
              ))}
              <UploadBox compact title="Unggah bukti baru" hint="Hanya untuk dokumen terkait layanan. Prototipe tidak menyimpan berkas." onAdd={() => setFiles((prev) => [...prev, { name: `Bukti-tambahan-${prev.length}.pdf`, size: "—" }])} />
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-3">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-[#FBFAF6] px-4 py-2.5"><h3 className="text-[14px] font-bold text-ink">Ringkasan perjanjian</h3></div>
            <div className="space-y-2 p-4">
              {[["Mitra", a.partner], ["Nilai", formatIDR(a.value)], ["Jadwal", a.schedule], ["Lokasi", a.location], ["Status", a.status]].map(([l, v]) => <div key={l} className="flex items-start justify-between gap-2 border-b border-line/60 pb-1.5 text-[13px]"><span className="shrink-0 text-muted">{l}</span><span className="max-w-[64%] text-right font-semibold leading-snug text-ink">{v}</span></div>)}
              <button onClick={() => navigate(`perjanjian/${a.id}`)} className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Buka dokumen <ArrowUpRight className="h-2.5 w-2.5" /></button>
            </div>
          </Card>
          <SectionCard title="Pembayaran terkait" subtitle="Dibedakan sesuai metode konfirmasi." action={<button onClick={() => navigate("planner/pembayaran")} className="text-[12px] font-bold text-ink">Kelola</button>}>
            <div className="space-y-2">
              {[["Termin 1 — DP 30%", 5550000, "manual", "Tercatat manual"], ["Termin 2 — Persiapan", 7400000, "gateway", "Terverifikasi"], ["Termin 3 — Pelunasan", 5550000, "manual", "Menunggu BAST"]].map(([l, v, kind, s]) => (
                <div key={l as string} className="flex items-start justify-between gap-2">
                  <div><div className="text-[13px] font-semibold text-ink">{l as string}</div><div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">{kind === "gateway" ? <ShieldCheck className="h-2.5 w-2.5 text-[#477C96]" /> : <FileText className="h-2.5 w-2.5" />}{s as string}</div></div>
                  <span className="text-[13px] font-bold text-ink">{formatIDR(v as number, true)}</span>
                </div>
              ))}
            </div>
            <Alert tone="warn" className="mt-2.5" title="Bukan escrow">VAKSARA tidak menahan dana. Status gateway adalah simulasi prototipe.</Alert>
          </SectionCard>
          <Button variant="secondary" size="sm" full onClick={() => navigate("sengketa")} leading={<MessageSquareWarning className="h-3.5 w-3.5" />}>Ajukan pengaduan</Button>
        </aside>
      </div>

      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} title="Ajukan perubahan perjanjian" description="Perubahan tidak otomatis berlaku. Kedua pihak harus menyetujui versi perjanjian yang baru." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setChangeOpen(false)}>Batal</Button><Button size="sm" disabled={!changeAck || reason.trim().length < 20} onClick={submitChange}>Kirim pengajuan</Button></>}>
        <div className="space-y-3">
          <Field label="Bagian yang ingin diubah" required><Input placeholder="Contoh: Personel bertambah dari 3 menjadi 4" /></Field>
          <Field label="Alasan dan usulan perubahan" required hint={`${reason.length}/400`}><Textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 400))} placeholder="Jelaskan kebutuhan, dampak pada nilai atau jadwal, dan usulan penyelesaian." /></Field>
          <UploadBox compact title="Lampiran pendukung (opsional)" />
          <Checkbox checked={changeAck} onChange={setChangeAck} label={<span className="text-[13px]">Saya memahami pengajuan ini belum mengubah perjanjian dan dapat ditolak pihak lain.</span>} />
        </div>
      </Modal>

      <Modal open={bastOpen} onClose={() => setBastOpen(false)} title="Ajukan BAST" description="Pastikan layanan telah dilaksanakan dan bukti hasil kerja telah diunggah." size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setBastOpen(false)}>Periksa kembali</Button><Button size="sm" disabled={!bastAck} onClick={() => { setBastOpen(false); setBastAck(false); toast("BAST diajukan. Pengantin dan vendor akan dikonfirmasi sebelum BAST dinyatakan selesai.", "success", "BAST diajukan"); }}>Ajukan BAST</Button></>}>
        <div className="space-y-3">
          <Alert tone="warn" title="BAST belum selesai saat diajukan">Status akan menjadi "Menunggu keputusan pengantin", lalu memerlukan konfirmasi vendor. Jangan menandai selesai sebelum keputusan penerimaan dibuat.</Alert>
          <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
            <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Ringkasan yang akan dilaporkan</div>
            {[["Hasil kerja", "Pendampingan prosesi & rundown"], ["Tanggal pelaksanaan", "12 Juni 2027"], ["Bukti", "3 dokumen"], ["Pembayaran", "Termin 3 menunggu keputusan BAST"]].map(([l, v]) => <div key={l} className="mt-1.5 flex justify-between text-[13px]"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>)}
          </div>
          <Checkbox checked={bastAck} onChange={setBastAck} label={<span className="text-[13px]">Saya memahami BAST bukan pengganti pemeriksaan vendor dan dapat direvisi bila ada item tidak sesuai.</span>} />
        </div>
      </Modal>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Tambah catatan milestone" size="md" footer={<><Button size="sm" variant="secondary" onClick={() => setNoteOpen(false)}>Batal</Button><Button size="sm" onClick={() => { setNoteOpen(false); toast("Catatan ditambahkan pada timberlacak milestone.", "success"); }}>Simpan catatan</Button></>}>
        <Field label="Catatan" required><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Konfirmasi jumlah personel menunggu hasil pertemuan keluarga." /></Field>
        <Alert tone="info" className="mt-2">Catatan tidak mengubah perjanjian dan tercatat sebagai aktivitas pengguna.</Alert>
      </Modal>
    </>
  );
}

/* ===================== BAST LIST ===================== */
export function BastList() {
  const { agreements, navigate } = useApp();
  const awaiting = agreements.filter((a) => a.status === "Menunggu BAST");
  return (
    <>
      <PageHeader eyebrow="Amanah & dokumen" title="BAST Digital" description="Berita acara serah terima untuk meninjau hasil kerja, bukti, dan penerimaan kedua pihak." actions={<Button size="sm" variant="secondary" onClick={() => navigate("trust")}>Lihat perjanjian</Button>} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Menunggu keputusan" value={awaiting.length} helper="Perlu tindakan Anda" icon={<ClipboardCheck className="h-3.5 w-3.5" />} tone="sand" />
        <StatCard label="Revisi terbuka" value="1" helper="Lensa Pesisir Studio" icon={<RotateCcw className="h-3.5 w-3.5" />} tone="red" />
        <StatCard label="Diterima" value="1" helper="Perjanjian maret" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Dokumen selesai" value="0" helper="Menunggu konfirmasi vendor" icon={<FileSignature className="h-3.5 w-3.5" />} tone="neutral" />
      </div>
      <Alert tone="trust" className="mt-3" title="BAST tidak selesai otomatis">Penerimaan memerlukan keputusan pengantin dan konfirmasi pelaku budaya. Status pada prototipe bersifat simulasi.</Alert>
      <div className="mt-3 space-y-2.5">
        {agreements.filter((a) => ["Menunggu BAST", "Sengketa", "Aktif"].includes(a.status)).map((a) => (
          <Card key={a.id} className="p-4" hover>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand-light text-sand-deep"><ClipboardCheck className="h-4 w-4" /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5"><h3 className="text-[15px] font-bold text-ink">{a.service}</h3><Badge tone={a.status === "Menunggu BAST" ? "amber" : statusTone(a.status)} dot className="text-[11px]">{a.status === "Menunggu BAST" ? "Menunggu keputusan" : a.status}</Badge></div>
                  <p className="mt-0.5 text-[13px] text-muted">{a.number} · {a.partner}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted"><span className="flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" /> {a.schedule}</span><span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {a.location.split(",")[0]}</span><span className="flex items-center gap-1"><Paperclip className="h-2.5 w-2.5" /> {a.attachments.length || 2} bukti</span></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => navigate(`perjanjian/${a.id}`)}>Perjanjian</Button>
                <Button size="sm" onClick={() => navigate(`bast/${a.id}`)}>Tinjau BAST</Button>
              </div>
            </div>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
              {[["Item diterima", "9 dari 10", "green"], ["Item tidak lengkap", "1 item", "red"], ["Keputusan", "Belum diambil", "neutral"]].map(([l, v, tone]) => <div key={l} className="rounded-lg border border-line bg-[#FBFAF6] px-2.5 py-1.5"><div className="text-[12px] text-muted">{l}</div><div className={cn("mt-0.5 text-[14px] font-bold", tone === "green" ? "text-[#2B5949]" : tone === "red" ? "text-[#933A2F]" : "text-ink")}>{v}</div></div>)}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ===================== BAST DETAIL ===================== */
const deliverablesByAgreement: Record<string, { item: string; qty: string; accepted: boolean; note?: string }[]> = {
  a4: [
    { item: "Prasmanan dua sisi sesuai tata letak", qty: "1 set", accepted: true },
    { item: "Hidangan utama — 10 menu", qty: "10 menu", accepted: true },
    { item: "Porsi minimum tamu", qty: "200 porsi", accepted: true },
    { item: "Tim pelayanan di lokasi", qty: "16 orang", accepted: true },
    { item: "Peralatan prasmanan & pemanas", qty: "1 set", accepted: true },
    { item: "Uji rasa keluarga", qty: "1 sesi", accepted: true },
    { item: "Hidangan tambahan 20 porsi", qty: "20 porsi", accepted: false, note: "Belum tercantum dalam perjanjian" },
    { item: "Pembersihan area setelah layanan", qty: "1 sesi", accepted: true },
    { item: "Dokumentasi menu & serah terima", qty: "3 berkas", accepted: true },
    { item: "Konfirmasi jumlah tamu H-7", qty: "1 laporan", accepted: true },
  ],
  a1: [
    { item: "Konsultasi keluarga sesi 1", qty: "1 sesi", accepted: true },
    { item: "Konsultasi keluarga sesi 2", qty: "1 sesi", accepted: true },
    { item: "Penyusunan rundown adat", qty: "1 dokumen", accepted: true },
    { item: "Pendampingan prosesi hari utama", qty: "8 jam", accepted: true },
    { item: "Koordinasi dua penanggung jawab keluarga", qty: "2 orang", accepted: true },
    { item: "Naskah nasihat adat", qty: "1 dokumen", accepted: false, note: "Draf final belum diserahkan" },
  ],
};

export function BastDetail({ id }: { id: string }) {
  const { agreements, navigate, toast, addDispute } = useApp();
  const a = agreements.find((x) => x.id === id) ?? agreements.find((x) => x.status === "Menunggu BAST") ?? agreements[0];
  const deliverables = deliverablesByAgreement[a.id] ?? deliverablesByAgreement.a1;
  const [accepted, setAccepted] = useState(deliverables.map((d) => d.accepted));
  const [decision, setDecision] = useState<"none" | "waiting-vendor" | "accepted" | "revision">("none");
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [comment, setComment] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [history, setHistory] = useState([
    { v: "v1.1", date: "16 Juni 2027", by: a.partner, note: "Penyesuaian daftar item; unggah bukti layanan.", state: "Revisi diajukan" },
    { v: "v1.0", date: "14 Juni 2027", by: a.partner, note: "Pengajuan BAST pertama.", state: "Diajukan" },
  ]);
  const itemsAccepted = accepted.filter(Boolean).length;
  const itemsIncomplete = accepted.length - itemsAccepted;
  const canApprove = itemsIncomplete === 0;

  const approve = () => {
    setApproveOpen(false);
    setDecision("waiting-vendor");
    setHistory((h) => [{ v: "v1.2", date: "Hari ini", by: "Nurul Amalia", note: "Pengantin menyetujui item yang diterima. Menunggu konfirmasi vendor.", state: "Menunggu vendor" }, ...h]);
    toast("Keputusan penerimaan dicatat. BAST belum selesai sampai vendor mengonfirmasi.", "success", "Menunggu konfirmasi vendor");
  };

  const submitRevision = () => {
    if (revisionNote.trim().length < 10) return;
    setDecision("revision");
    setRevisionOpen(false);
    setHistory((h) => [{ v: "v1.2", date: "Hari ini", by: "Nurul Amalia", note: revisionNote, state: "Revisi diminta" }, ...h]);
    toast("Permintaan revisi dikirim ke vendor. Status BAST: Revisi diminta.", "success", "Revisi diajukan");
    setRevisionNote("");
  };

  const report = () => {
    if (reportNote.trim().length < 20) return;
    const newCase: Dispute = {
      id: `d-${Date.now()}`,
      number: `DSP-2027-${100 + Math.floor(Math.random() * 800)}`,
      agreementId: a.id,
      title: `Ketidaksesuaian BAST — ${a.service}`,
      status: "Diajukan",
      opener: "Nurul Amalia",
      responder: a.partner,
      opened: "Hari ini",
      updated: "Hari ini",
      nextAction: "Menunggu triase Trust Officer",
      clauses: ["Pasal 5 — Hasil Kerja dan BAST"],
      description: reportNote,
      proposed: "Mohon peninjauan bukti dan usulan penyelesaian bersama.",
      evidence: files.map((f) => ({ name: f.name, from: "Nurul Amalia", date: "Hari ini", type: "FILE" })),
      messages: [{ by: "Nurul Amalia", role: "Pengantin", date: "Hari ini", text: reportNote, type: "proposal" }],
      officer: "Belum ditugaskan",
    };
    addDispute(newCase);
    setReportOpen(false);
    toast("Laporan ketidaksesuaian dibuat sebagai kasus baru. Trust Officer akan melakukan triase.", "success", "Pengaduan diajukan");
    navigate("sengketa");
  };

  return (
    <>
      <PageHeader
        eyebrow="BAST Digital"
        title={<span className="flex flex-wrap items-center gap-2">BAST {a.number}<Badge tone={decision === "accepted" ? "green" : decision === "waiting-vendor" ? "blue" : decision === "revision" ? "red" : "amber"} dot className="text-[12px]">{decision === "accepted" ? "Diterima" : decision === "waiting-vendor" ? "Menunggu vendor" : decision === "revision" ? "Revisi diminta" : "Menunggu keputusan"}</Badge></span>}
        description={`${a.partner} · ${a.service}`}
        back={{ label: "Daftar BAST", onClick: () => navigate("bast") }}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => toast("BAST akan diunduh sebagai PDF prototipe pada implementasi produksi.", "info", "Unduh prototipe")} leading={<Download className="h-3.5 w-3.5" />}>Unduh</Button>
            <Button size="sm" variant="secondary" onClick={() => setReportOpen(true)} leading={<MessageSquareWarning className="h-3.5 w-3.5" />}>Laporkan ketidaksesuaian</Button>
            <Button size="sm" variant="secondary" onClick={() => setRevisionOpen(true)} leading={<RotateCcw className="h-3.5 w-3.5" />}>Ajukan revisi</Button>
            <Button size="sm" onClick={() => setApproveOpen(true)} disabled={!canApprove || decision !== "none"} leading={<Check className="h-3.5 w-3.5" />}>Setujui BAST</Button>
          </>
        }
      />

      {decision === "waiting-vendor" && <Alert tone="info" className="mb-3" title="BAST belum selesai">Keputusan Anda telah dicatat. BAST menunggu konfirmasi {a.partner}. Status "Selesai" baru muncul setelah konfirmasi tersebut.</Alert>}
      {decision === "revision" && <Alert tone="warn" className="mb-3" title="Revisi BAST diajukan">Vendor dapat memperbarui bukti atau item yang dipermasalahkan. Versi sebelumnya tetap tersimpan pada riwayat revisi.</Alert>}
      {!canApprove && decision === "none" && <Alert tone="error" className="mb-3" title="BAST belum dapat disetujui"><span className="flex flex-wrap items-center gap-2">Terdapat {itemsIncomplete} item tidak lengkap. Setujui item yang sesuai, ajukan revisi, atau laporkan ketidaksesuaian. <button onClick={() => setRevisionOpen(true)} className="font-bold underline decoration-sand underline-offset-2">Ajukan revisi</button></span></Alert>}

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#FBFAF6] px-4 py-3">
              <div><h2 className="text-[15px] font-bold text-ink">Rujukan perjanjian</h2><p className="mt-0.5 text-[13px] text-muted">Dokumen induk dan ringkasan layanan.</p></div>
              <button onClick={() => navigate(`perjanjian/${a.id}`)} className="flex items-center gap-1 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">Buka perjanjian <ArrowUpRight className="h-2.5 w-2.5" /></button>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {[["Nomor perjanjian", a.number], ["Nilai layanan", formatIDR(a.value)], ["Pihak kedua", a.partner], ["Jadwal layanan", a.schedule], ["Lokasi", a.location], ["Tanggal penyelesaian aktual", "12 Juni 2027 · 15.30 WITA"]].map(([l, v]) => <div key={l} className="rounded-lg border border-line bg-white p-2.5"><div className="text-[11px] font-bold uppercase tracking-wider text-muted">{l}</div><div className="mt-1 text-[13px] font-semibold leading-snug text-ink">{v}</div></div>)}
            </div>
          </Card>

          <SectionCard title="Hasil kerja yang dilaporkan" subtitle={`${itemsAccepted} dari ${accepted.length} item diterima · ${itemsIncomplete} tidak lengkap. Tandai hanya item yang benar-benar telah diperiksa.`} action={<Badge tone={itemsIncomplete ? "amber" : "green"} className="text-[12px]">{itemsIncomplete ? "Ada ketidaksesuaian" : "Semua sesuai"}</Badge>}>
            <div className="space-y-1.5">
              {deliverables.map((d, i) => (
                <div key={d.item} className={cn("flex items-start gap-2 rounded-lg border p-2.5", !accepted[i] ? "border-[#F0D5D0] bg-[#FCF5F2]" : "border-line bg-white")}>
                  <button onClick={() => setAccepted((prev) => prev.map((x, idx) => (idx === i ? !x : x)))} className={cn("mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border", accepted[i] ? "border-ink bg-ink text-cream" : "border-[#CFC7B7] bg-white")} aria-label={`${accepted[i] ? "Tandai tidak diterima" : "Terima"} ${d.item}`}>{accepted[i] && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold leading-snug text-ink">{d.item}</div>
                    {d.note && <div className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-[#933A2F]"><AlertTriangle className="h-2.5 w-2.5" />{d.note}</div>}
                  </div>
                  <span className="shrink-0 rounded bg-[#F1EFE9] px-1.5 py-0.5 text-[11px] text-muted">{d.qty}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Field label="Komentar pengantin" hint="opsional"><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Catatan atas item yang diterima atau kualitas layanan." className="min-h-[70px]" /></Field>
            </div>
          </SectionCard>

          <SectionCard title="Bukti & dokumentasi" subtitle="Bukti diunggah oleh pelaku budaya atau vendor. Tidak dapat dihapus setelah BAST disetujui." action={<Button size="sm" variant="secondary" onClick={() => { setFiles((prev) => [...prev, { name: `Bukti-BAST-${prev.length + 1}.jpg`, size: "412 KB" }]); toast("Bukti contoh ditambahkan.", "success"); }} leading={<Plus className="h-3 w-3" />}>Tambah bukti</Button>}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[{ name: "Dokumentasi-prasmanan-01.jpg", by: a.partner, size: "1,2 MB" }, { name: "Daftar-hidangan-final.pdf", by: a.partner, size: "320 KB" }, ...files.map((f) => ({ ...f, by: "Nurul Amalia" }))].map((f) => (
                <div key={f.name} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sand-light text-sand-deep"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-ink">{f.name}</div><div className="text-[11px] text-muted">{f.by} · {f.size}</div></div>
                  <button onClick={() => toast("Pratinjau berkas tidak tersedia pada prototipe.", "info")} className="shrink-0 rounded p-0.5 text-muted hover:text-ink" aria-label={`Lihat ${f.name}`}><ArrowUpRight className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <Alert tone="warn" className="mt-2" title="Bukti tidak boleh dimanipulasi">Bukti pada kasus atau BAST tidak dapat dihapus setelah diterima. Setiap akses dan perubahan tercatat pada audit trail.</Alert>
          </SectionCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard title="Keputusan penerimaan">
              <div className="space-y-2">
                {[["BAST diajukan", true], ["Keputusan pengantin", decision !== "none"], ["Konfirmasi vendor", decision === "accepted"], ["BAST selesai", decision === "accepted"]].map(([l, done], i) => (
                  <div key={l as string} className="flex items-center gap-2">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border text-[11px]", done ? "border-ink bg-ink text-cream" : "border-line bg-white text-muted")}>{done ? <Check className="h-2 w-2" strokeWidth={3} /> : i + 1}</span>
                    <span className={cn("flex-1 text-[13px]", done ? "font-semibold text-ink" : "text-muted")}>{l as string}</span>
                    <span className={cn("text-[12px]", done ? "font-semibold text-[#2B5949]" : "text-muted")}>{done ? "Selesai" : "Menunggu"}</span>
                  </div>
                ))}
              </div>
              {decision === "none" && <Button size="sm" full className="mt-3" disabled={!canApprove} onClick={() => setApproveOpen(true)}>Setujui BAST</Button>}
            </SectionCard>
            <SectionCard title="Konfirmasi vendor">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF3E3] text-[#855A16]"><Clock className="h-4 w-4" /></span>
                <div><div className="text-[14px] font-bold text-ink">{decision === "waiting-vendor" ? "Dikonfirmasi negosiasi" : "Menunggu keputusan pengantin"}</div><div className="text-[12px] text-muted">{decision === "waiting-vendor" ? "Vendor perlu mengonfirmasi keputusan Anda." : "Vendor telah mengajukan BAST dan menunggu tanggapan."}</div></div>
              </div>
              <div className="mt-2 rounded-lg border border-line bg-[#FBFAF6] p-2.5 text-[12px] leading-relaxed text-muted">BAST tidak dapat berstatus selesai ketika ada item tidak lengkap tanpa keputusan eksplisit.</div>
            </SectionCard>
          </div>

          <SectionCard title="Riwayat revisi dokumen" subtitle="Versi lama tetap tersedia untuk ditinjau." action={<Badge tone="neutral" className="text-[12px]">{history.length} versi</Badge>}>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.v + h.date} className="flex items-start gap-2.5 rounded-lg border border-line bg-white p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F1EFE9] text-[12px] font-bold text-ink-soft">{h.v}</span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><span className="text-[13px] font-semibold text-ink">{h.state}</span><span className="text-[12px] text-muted">{h.date}</span></div><p className="mt-0.5 text-[12px] leading-relaxed text-muted">{h.note}</p><div className="text-[11px] text-muted/80">oleh {h.by}</div></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-[76px] xl:self-start">
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Ringkasan BAST</h3>
            <div className="mt-2 space-y-2">
              {[["Item diterima", `${itemsAccepted}/${accepted.length}`], ["Item tidak lengkap", `${itemsIncomplete}`], ["Tanggal aktual", "12 Juni 2027"], ["Pembayaran tertunda", formatIDR(5550000)]].map(([l, v]) => <div key={l} className="flex items-center justify-between text-[13px]"><span className="text-muted">{l}</span><span className="font-semibold text-ink">{v}</span></div>)}
            </div>
            <Alert tone="warn" className="mt-3" title="Pelunasan belum otomatis">Menyetujui BAST tidak memproses pembayaran. Selesaikan termin melalui metode yang disepakati.</Alert>
          </Card>
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Tindakan tersedia</h3>
            <div className="mt-2 space-y-1.5">
              <Button size="sm" full onClick={() => setApproveOpen(true)} disabled={!canApprove || decision !== "none"}>Setujui BAST</Button>
              <Button size="sm" variant="secondary" full onClick={() => setRevisionOpen(true)}>Ajukan revisi</Button>
              <Button size="sm" variant="secondary" full onClick={() => setReportOpen(true)}>Laporkan ketidaksesuaian</Button>
              <Button size="sm" variant="ghost" full onClick={() => toast("BAST akan diunduh sebagai PDF prototipe.", "info")}>Unduh dokumen</Button>
            </div>
          </Card>
          <div className="rounded-xl border border-line bg-[#F4F0E6] p-3"><div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><ShieldCheck className="h-3 w-3 text-sand-deep" /> Catatan prototipe</div><p className="mt-1 text-[12px] leading-relaxed text-ink-soft">BAST ini bukan dokumen yang memiliki kekuatan hukum. Data dan bukti ilustratif.</p></div>
        </aside>
      </div>

      {/* approve modal */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Setujui BAST?" description="Keputusan Anda akan dicatat dan diteruskan ke pihak pelaku budaya." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)}>Periksa lagi</Button><Button size="sm" disabled={!ack} onClick={approve}>Ya, setujui BAST</Button></>}>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
            {[["Perjanjian", a.number], ["Item diterima", `${itemsAccepted} dari ${accepted.length}`], ["Komentar", comment || "Tidak ada"], ["Status setelah ini", "Menunggu konfirmasi vendor"]].map(([l, v]) => <div key={l} className="mt-1.5 flex items-start justify-between gap-2 text-[13px] first:mt-0"><span className="text-muted">{l}</span><span className="max-w-[60%] text-right font-semibold text-ink">{v}</span></div>)}
          </div>
          <Alert tone="warn" title="Bukan penutupan akhir">Persetujuan Anda belum menutup BAST. Status selesai memerlukan konfirmasi vendor. Pelunasan tidak diproses otomatis.</Alert>
          <Checkbox checked={ack} onChange={setAck} label={<span className="text-[13px]">Saya telah memeriksa item, bukti, dan komentar di atas serta memahami proses penerimaan dua pihak.</span>} />
        </div>
      </Modal>

      {/* revision */}
      <Modal open={revisionOpen} onClose={() => setRevisionOpen(false)} title="Ajukan revisi BAST" description="Sampaikan item yang perlu diperbaiki. BAST tidak dianggap selesai sampai pihak pelaku budaya menanggapi." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setRevisionOpen(false)}>Batal</Button><Button size="sm" disabled={revisionNote.trim().length < 10} onClick={submitRevision}>Kirim permintaan revisi</Button></>}>
        <div className="space-y-3">
          <Field label="Item yang perlu diperbaiki" required><Select><option>Pilih item…</option>{deliverables.filter((_, i) => !accepted[i]).map((d) => <option key={d.item}>{d.item}</option>)}{deliverables.filter((d) => d.accepted).map((d) => <option key={d.item}>{d.item}</option>)}</Select></Field>
          <Field label="Penjelasan revisi" required hint={`${revisionNote.length}/300`}><Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value.slice(0, 300))} placeholder="Jelaskan perbedaan antara hasil kerja dan kesepakatan." /></Field>
          <UploadBox compact title="Unggah bukti pendukung" files={files} onAdd={() => setFiles((p) => [...p, { name: "Bukti-revisi.jpg", size: "—" }])} onRemove={(name) => setFiles((p) => p.filter((f) => f.name !== name))} />
        </div>
      </Modal>

      {/* report */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Laporkan ketidaksesuaian" description="Laporan akan membuka kasus pengaduan baru yang ditangani secara netral. VAKSARA bukan pengadilan dan tidak menjamin pengembalian dana." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setReportOpen(false)}>Batal</Button><Button size="sm" variant="danger" disabled={reportNote.trim().length < 20} onClick={report} leading={<Send className="h-3.5 w-3.5" />}>Tandai diajukan</Button></>}>
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-[#FBFAF6] p-2.5 text-[13px]"><div className="flex items-center justify-between"><span className="text-muted">Perjanjian terkait</span><span className="font-semibold text-ink">{a.number}</span></div><div className="mt-1 flex items-center justify-between"><span className="text-muted">Pihak</span><span className="font-semibold text-ink">{a.partner}</span></div></div>
          <Field label="Pasal yang terkait"><Select><option>Pasal 5 — Hasil Kerja dan BAST</option><option>Pasal 3 — Nilai dan Termin</option><option>Pasal 2 — Jadwal</option></Select></Field>
          <Field label="Uraian masalah" required hint={`${reportNote.length}/400`}><Textarea value={reportNote} onChange={(e) => setReportNote(e.target.value.slice(0, 400))} placeholder="Jelaskan ketidaksesuaian, bukti yang Anda miliki, dan dampaknya." /></Field>
          <UploadBox compact title="Bukti pendukung" files={files} onAdd={() => setFiles((p) => [...p, { name: "Bukti-laporan.jpg", size: "—" }])} onRemove={(name) => setFiles((p) => p.filter((f) => f.name !== name))} />
          <Alert tone="info" title="Proses netral">Vendor akan diberi kesempatan klarifikasi. Anda dan vendor dapat mengusulkan penyelesaian; Trust Officer memfasilitasi tanpa memihak.</Alert>
        </div>
      </Modal>
    </>
  );
}

