import { useContactDemo } from "@/pages/ContactVerification";
import { LogoMark } from "@/components/brand";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  PageHeader,
  Progress,
  Select,
  StepDots,
  Textarea,
  statusTone
} from "@/components/ui";
import { formatIDR, practitioners, type Agreement } from "@/data";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  History,
  Info,
  Lock,
  Mail,
  MessageSquareWarning,
  Paperclip,
  PenLine,
  Send,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";
import { useState } from "react";

/* ============================ DETAIL ============================ */
export function AgreementDetail({ id }: { id: string }) {
  const { agreements, updateAgreement, navigate, toast } = useApp();
  const { demoReady } = useContactDemo();
  const a = agreements.find((x) => x.id === id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisiOpen, setRevisiOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllClauses, setShowAllClauses] = useState(false);

  if (!a) {
    return (
      <div>
        <PageHeader title="Perjanjian tidak ditemukan" description="Dokumen mungkin telah diarsipkan atau tautannya tidak valid." back={{ label: "Kembali ke VAKSARA Trust", onClick: () => navigate("trust") }} />
        <Card className="p-8 text-center"><p className="text-[15px] text-muted">Pilih perjanjian lain pada daftar VAKSARA Trust.</p><Button className="mt-3" size="sm" onClick={() => navigate("trust")}>Buka daftar perjanjian</Button></Card>
      </div>
    );
  }

  const pendingApprovals = a.approvals.filter((x) => x.state === "Menunggu").length;
  const canApprove = pendingApprovals > 0 || a.status === "Draf" || a.status === "Menunggu Persetujuan";
  const clauses = showAllClauses ? a.clauses : a.clauses.slice(0, 5);

  const openApproval = () => {
    if (!demoReady) { toast("Selesaikan simulasi OTP email dan WhatsApp sebelum mencoba persetujuan demo.", "info"); navigate("akun/kontak"); return; }
    setApproveOpen(true);
  };
  const approve = () => {
    if (!ack || !demoReady) return;
    setLoading(true);
    window.setTimeout(() => {
      const approvals: Agreement["approvals"] = a.approvals.map((x) => x.party === "Nurul Amalia" && x.state === "Menunggu" ? { ...x, state: "Menyetujui", date: new Date().toLocaleString("id-ID", { timeZone: "Asia/Makassar" }) + " WITA (demo)" } : x);
      const allApproved = approvals.every((x) => x.state === "Menyetujui");
      updateAgreement(a.id, {
        status: allApproved ? "Aktif" : "Menunggu Persetujuan",
        nextAction: allApproved ? "Terkonfirmasi" : "Menunggu pihak lain",
        nextTone: allApproved ? "green" : "warn",
        approvals,
        versions: a.versions.map((v, i) => i === 0 && allApproved ? { ...v, state: "Disepakati" } : v),
      });
      setLoading(false);
      setApproveOpen(false);
      setAck(false);
      toast("Persetujuan demo Anda dicatat. Pihak lain harus menyetujui sendiri.", "success", "Persetujuan tercatat");
    }, 700);
  };

  const submitRevision = () => {
    if (note.trim().length < 15) {
      setError("Jelaskan perubahan minimal 15 karakter agar dapat ditinjau pihak lain.");
      return;
    }
    updateAgreement(a.id, {
      status: "Menunggu Persetujuan",
      nextAction: "Persetujuan versi baru",
      nextTone: "warn",
      versions: [{ version: `v1.${a.versions.length + 1}`, date: "Hari ini", by: "Nurul Amalia", note: note, state: "Draf" }, ...a.versions],
      approvals: a.approvals.map((x) => (x.party === "Nurul Amalia" ? { ...x, state: "Menyetujui", date: "Hari ini" } : x.party === "VAKSARA" ? x : { ...x, state: "Menunggu", date: undefined })),
    });
    setRevisiOpen(false);
    setNote("");
    setError("");
    toast("Pengajuan revisi dibuat sebagai draf. Versi lama tetap tersimpan pada riwayat.", "success", "Revisi diajukan");
  };

  return (
    <>
      <PageHeader
        eyebrow="VAKSARA Trust · Dokumen"
        title={<span className="flex flex-wrap items-center gap-2">{a.number}<Badge tone={statusTone(a.status)} dot className="text-[13px]">{a.status}</Badge></span>}
        description={`${a.partner} · ${a.service} · versi aktif ${a.versions[0]?.version ?? "v1.0"}`}
        back={{ label: "Daftar perjanjian", onClick: () => navigate("trust") }}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => toast("Unduhan PDF adalah simulasi prototipe; tidak ada dokumen bersertifikat yang diunduh.", "info", "Unduh prototipe")} leading={<Download className="h-3.5 w-3.5" />}>Unduh PDF</Button>
            <Button size="sm" variant="secondary" onClick={() => setRevisiOpen(true)} leading={<PenLine className="h-3.5 w-3.5" />}>Ajukan revisi</Button>
            {canApprove && <Button size="sm" onClick={openApproval} leading={<Check className="h-3.5 w-3.5" />}>Setujui versi</Button>}
          </>
        }
      />

      <Alert tone={a.status === "Sengketa" ? "error" : a.status === "Menunggu Persetujuan" ? "warn" : "trust"} className="mb-3" title={a.status === "Sengketa" ? "Pengaduan aktif pada perjanjian ini" : a.status === "Menunggu Persetujuan" ? "Menunggu persetujuan pihak lain" : `Status dokumen: ${a.status}`}>
        {a.status === "Sengketa" ? (
          <span className="flex flex-wrap items-center justify-between gap-2">Dokumen tetap berlaku selama proses fasilitasi. Pembayaran dan layanan tidak otomatis dibekukan. <Button size="sm" variant="secondary" onClick={() => navigate("sengketa/d1")}>Buka pengaduan</Button></span>
        ) : a.status === "Menunggu Persetujuan" ? (
          "Satu pihak belum menyetujui versi ini. Perubahan tidak dapat dikunci sampai kedua pihak menyetujui versi yang sama."
        ) : (
          "Dokumen ini adalah simulasi prototipe. Belum ditandatangani melalui penyedia tanda tangan elektronik bersertifikat dan tidak memiliki sertifikasi hukum."
        )}
      </Alert>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-3">
          {/* Document */}
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rotate-[-26deg] font-display text-[54px] font-bold tracking-[0.2em] text-ink/[0.035] sm:text-[80px]">PROTOTIPE</span>
            </div>
            <div className="relative border-b border-line bg-[#FBFAF6] px-5 py-4 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="h-10 w-10" />
                  <div>
                    <div className="font-display text-[15px] font-semibold leading-none tracking-[0.14em] text-ink">VAKSARA</div>
                    <div className="mt-1 text-[12px] font-bold uppercase tracking-[0.16em] text-muted">Perjanjian Layanan Budaya</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-muted">Nomor dokumen</div>
                  <div className="mt-0.5 text-[14px] font-bold text-ink">{a.number}</div>
                  <div className="mt-0.5 text-[12px] text-muted">Versi {a.versions[0]?.version ?? "v1.0"} · {a.date}</div>
                </div>
              </div>
            </div>
            <div className="relative px-5 py-5 text-ink sm:px-8">
              <h2 className="text-center font-display text-[18px] font-semibold leading-snug sm:text-[21px]">Perjanjian Layanan Budaya & Penyediaan Jasa Pernikahan</h2>
              <p className="mx-auto mt-1.5 max-w-xl text-center text-[13px] leading-relaxed text-muted">Dokumen demonstrasi untuk produk VAKSARA. Dibuat pada {a.date}. Bukan dokumen final dan belum memiliki kekuatan hukum.</p>

              <div className="mt-5 grid gap-3 border-y border-line py-4 sm:grid-cols-2">
                {[
                  { t: "PIHAK PERTAMA — PENGGUNA", n: "Nurul Amalia", sub: "Calon pengantin · Makassar, Sulawesi Selatan", mail: "nurul.amalia@email.id" },
                  { t: "PIHAK KEDUA — PELAKU BUDAYA", n: a.partner, sub: `${a.category} · ${a.location.split(",")[0]}`, mail: `halo@${a.partner.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.id` },
                ].map((party) => (
                  <div key={party.t}>
                    <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-sand-deep">{party.t}</div>
                    <div className="mt-1 font-display text-[14px] font-semibold text-ink">{party.n}</div>
                    <div className="mt-0.5 text-[13px] text-muted">{party.sub}</div>
                    <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-soft"><Mail className="h-2.5 w-2.5 text-sand-deep" /> {party.mail}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#EDF4EF] px-1.5 py-0.5 text-[12px] font-semibold text-[#2B5949]"><BadgeCheck className="h-2.5 w-2.5" /> Identitas diperiksa</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">Ruang lingkup layanan</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{a.scope}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[["Nilai layanan", formatIDR(a.value)], ["Jadwal", a.schedule], ["Lokasi", a.location]].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-line bg-white p-2.5"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">{l}</div><div className="mt-1 text-[13px] font-semibold leading-snug text-ink">{v}</div></div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">Pasal dan ketentuan</h3>
                  <span className="text-[12px] text-muted">{a.clauses.length} pasal · versi {a.versions[0]?.version}</span>
                </div>
                <div className="mt-1.5 space-y-2.5">
                  {clauses.map((c) => (
                    <div key={c.title}>
                      <h4 className="text-[14px] font-bold text-ink">{c.title}</h4>
                      <p className="mt-0.5 text-[13px] leading-[1.7] text-ink-soft">{c.body}</p>
                    </div>
                  ))}
                </div>
                {a.clauses.length > 5 && <button onClick={() => setShowAllClauses((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-ink underline decoration-sand underline-offset-2">{showAllClauses ? "Ringkas pasal" : `Lihat ${a.clauses.length - 5} pasal lainnya`} <ChevronDown className={cn("h-3 w-3 transition-transform", showAllClauses && "rotate-180")} /></button>}
              </div>

              <div className="mt-4">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">Termin pembayaran</h3>
                <div className="mt-1.5 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#FBFAF6] text-muted"><tr><th className="px-2.5 py-1.5 font-bold">Termin</th><th className="px-2 py-1.5 font-bold">Jatuh tempo</th><th className="px-2 py-1.5 text-right font-bold">Nominal</th><th className="px-2.5 py-1.5 font-bold">Status</th></tr></thead>
                    <tbody className="divide-y divide-line/70">
                      {a.terms.map((t) => (
                        <tr key={t.label}><td className="px-2.5 py-1.5 font-medium text-ink">{t.label} ({t.percentage}%)</td><td className="px-2 py-1.5 text-muted">{t.due}</td><td className="px-2 py-1.5 text-right font-semibold text-ink">{formatIDR(t.amount)}</td><td className="px-2.5 py-1.5"><Badge tone={t.status === "Lunas" ? "green" : t.status === "Menunggu" ? "amber" : "blue"} className="px-1 py-0.5 text-[12px]">{t.status}</Badge></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Metode: {a.paymentMethod}. Pembayaran manual dan gateway ditandai berbeda. VAKSARA tidak menahan dana.</p>
              </div>

              <div className="mt-4">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">Lampiran</h3>
                <div className="mt-1.5 space-y-1">
                  {a.attachments.length === 0 ? <p className="text-[13px] text-muted">Belum ada lampiran.</p> : a.attachments.map((f) => (
                    <button key={f.name} onClick={() => toast("Lampiran hanya tersedia sebagai daftar pada prototipe.", "info", "Lampiran prototipe")} className="flex w-full items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-left hover:border-sand">
                      <Paperclip className="h-3 w-3 shrink-0 text-sand-deep" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{f.name}</span>
                      <span className="shrink-0 text-[12px] text-muted">{f.size} · {f.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                {a.approvals.slice(0, 2).map((ap) => (
                  <div key={ap.party} className="rounded-lg border border-dashed border-[#CFC6B4] bg-[#FBFAF6] p-2.5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-muted">{ap.role}</div>
                    <div className="mt-1 font-display text-[15px] italic text-ink">{ap.party}</div>
                    <div className="mt-2 flex items-center gap-1 text-[12px]">
                      {ap.state === "Menyetujui" ? <><CheckCircle2 className="h-3 w-3 text-[#4C8068]" /><span className="font-semibold text-[#2B5949]">Disetujui {ap.date}</span></> : <><Clock className="h-3 w-3 text-[#C08D3B]" /><span className="font-semibold text-[#855A16]">Menunggu persetujuan</span></>}
                    </div>
                    <div className="mt-1 text-[12px] text-muted">Tanda tangan elektronik belum tersedia pada prototipe.</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-sand/40 bg-sand-light/40 p-2.5">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-sand-deep" />
                <p className="text-[12px] leading-relaxed text-ink-soft">Dokumen ini dihasilkan oleh prototipe VAKSARA. Tidak ada integrasi penyedia tanda tangan elektronik tersertifikasi, penyimpanan dana, atau jaminan hukum. Untuk keperluan mengikat secara hukum, gunakan penyedia yang sesuai dan tinjau bersama penasihat hukum.</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("pengiriman/" + a.id)} leading={<ArrowUpRight className="h-3.5 w-3.5" />}>Lacak layanan</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("bast/" + a.id)} leading={<ClipboardCheck className="h-3.5 w-3.5" />}>Lihat BAST</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("sengketa")} leading={<MessageSquareWarning className="h-3.5 w-3.5" />}>Buka pengaduan</Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Tautan dokumen disalin (simulasi).", "info")}>Salin tautan</Button>
          </div>
        </div>

        {/* Side */}
        <aside className="space-y-3 xl:sticky xl:top-[76px] xl:self-start">
          <Card className="p-4">
            <h3 className="text-[15px] font-bold text-ink">Status perjalanan dokumen</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { t: "Draf dibuat", s: "Selesai", done: true },
                { t: "Dikirim ke kedua pihak", s: "Selesai", done: true },
                { t: "Persetujuan dua pihak", s: a.status === "Menunggu Persetujuan" ? "Menunggu" : "Selesai", done: a.status !== "Menunggu Persetujuan" && a.status !== "Draf" },
                { t: "Perjanjian disepakati", s: a.status === "Aktif" || a.status === "Menunggu BAST" || a.status === "Selesai" || a.status === "Sengketa" ? "Selesai" : "Menunggu", done: ["Aktif", "Menunggu BAST", "Selesai", "Sengketa"].includes(a.status) },
                { t: "Layanan berjalan", s: "Berjalan", done: false, active: true },
                { t: "BAST & penutupan", s: "Menunggu", done: false },
              ].map((s, i) => (
                <div key={s.t} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[12px]", s.done ? "border-ink bg-ink text-cream" : s.active ? "border-sand bg-sand/20 text-sand-deep" : "border-line bg-white text-muted")}>{s.done ? <Check className="h-2 w-2" strokeWidth={3} /> : i + 1}</span>
                    {i < 5 && <span className={cn("mt-0.5 h-full min-h-[10px] w-px", s.done ? "bg-ink/30" : "bg-line")} />}
                  </div>
                  <div className="pb-1"><div className={cn("text-[13px] font-semibold", s.done ? "text-ink" : "text-muted")}>{s.t}</div><div className="text-[12px] text-muted">{s.s}</div></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5"><h3 className="text-[14px] font-bold text-ink">Persetujuan</h3><Button size="sm" variant="ghost" onClick={() => setSignOpen(true)}>Tanda tangan</Button></div>
            <div className="divide-y divide-line/70">
              {a.approvals.map((ap) => (
                <div key={ap.party} className="flex items-start gap-2 px-4 py-2.5">
                  <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", ap.state === "Menyetujui" ? "bg-[#EDF4EF] text-[#2B5949]" : "border border-[#F0E0C1] bg-[#FBF3E3] text-[#855A16]")}>{ap.state === "Menyetujui" ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <Clock className="h-2.5 w-2.5" />}</span>
                  <div className="min-w-0"><div className="truncate text-[13px] font-semibold text-ink">{ap.party}</div><div className="text-[12px] text-muted">{ap.role} · {ap.state}{ap.date ? ` · ${ap.date}` : ""}</div></div>
                </div>
              ))}
            </div>
            {pendingApprovals > 0 && canApprove && <div className="border-t border-line p-3"><Button size="sm" full onClick={openApproval}>Setujui versi ini</Button></div>}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5"><History className="h-3 w-3 text-sand-deep" /><h3 className="text-[14px] font-bold text-ink">Riwayat versi</h3></div>
            <div className="divide-y divide-line/70">
              {a.versions.map((v, i) => (
                <div key={v.version + i} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-bold text-ink">{v.version}</span><Badge tone={v.state === "Disepakati" ? "green" : v.state === "Draf" ? "neutral" : "amber"} className="px-1 py-0.5 text-[12px]">{v.state}</Badge></div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-muted">{v.note}</div>
                  <div className="mt-0.5 text-[12px] text-muted/80">{v.date} · {v.by}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="rounded-xl border border-sand/40 bg-sand-light/45 p-3">
            <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><Lock className="h-3 w-3 text-sand-deep" /> Ruang akses terbatas</div>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Hanya para pihak dan Trust Officer yang ditugaskan dapat mengakses dokumen ini. Setiap akses tercatat pada audit trail.</p>
          </div>
          <Button variant="secondary" size="sm" full onClick={() => navigate("planner/pembayaran")} leading={<Wallet className="h-3.5 w-3.5" />}>Lihat pembayaran terkait</Button>
        </aside>
      </div>

      <Alert tone="warn" title="Persetujuan demo, bukan perjanjian nyata">OTP pada prototipe tidak membuktikan penguasaan kontak. Perjanjian nyata belum dapat disahkan melalui aplikasi ini. <Button size="sm" variant="secondary" onClick={() => navigate("akun/kontak")}>Periksa kontak</Button></Alert>
      {/* approve */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Setujui versi perjanjian ini?" description={`Anda akan menyetujui ${a.number} versi ${a.versions[0]?.version}.`} size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)}>Periksa kembali</Button><Button size="sm" onClick={approve} loading={loading} disabled={!ack || !demoReady}>Ya, setujui versi</Button></>}>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
            <div className="flex items-center justify-between text-[14px]"><span className="text-muted">Mitra</span><span className="font-semibold text-ink">{a.partner}</span></div>
            <div className="mt-1.5 flex items-center justify-between text-[14px]"><span className="text-muted">Nilai</span><span className="font-semibold text-ink">{formatIDR(a.value)}</span></div>
            <div className="mt-1.5 flex items-center justify-between text-[14px]"><span className="text-muted">Ruang lingkup</span><span className="max-w-[60%] text-right font-semibold text-ink">{a.service}</span></div>
          </div>
          <Alert tone="warn" title="Persetujuan bersifat tercatat">Setelah disetujui, versi ini ditandai sebagai versi disepakati. Perubahan harus diajukan sebagai versi baru dan disetujui ulang oleh kedua pihak.</Alert>
          <Checkbox checked={ack} onChange={setAck} label={<span className="text-[14px]">Saya telah membaca dokumen ini dan memahami bahwa prototipe ini belum memiliki tanda tangan elektronik tersertifikasi atau jaminan hukum.</span>} />
        </div>
      </Modal>

      {/* revise */}
      <Modal open={revisiOpen} onClose={() => setRevisiOpen(false)} title="Ajukan revisi dokumen" description="Revisi tidak mengubah versi yang telah disepakati. Dokumen akan membuat draf versi baru." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setRevisiOpen(false)}>Batal</Button><Button size="sm" onClick={submitRevision}>Ajukan revisi</Button></>}>
        <div className="space-y-3">
          <Alert tone="warn" title="Versi disepakati tetap tersimpan">Anda dan pihak lain akan melihat perbandingan versi. Dokumen yang telah ditandatangani tidak dapat diubah secara diam-diam.</Alert>
          <Field label="Bagian yang ingin diubah" required><Input placeholder="Contoh: Pasal 2 — jadwal persiapan" /></Field>
          <Field label="Penjelasan revisi" required hint={`${note.length}/500`}><Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Jelaskan alasan dan usulan perubahan secara spesifik." /></Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Checkbox checked={true} onChange={() => { }} label={<span className="text-[13px] text-muted">Saya memahami bahwa revisi ini memerlukan persetujuan ulang.</span>} />
        </div>
      </Modal>

      {/* esign */}
      <Modal open={signOpen} onClose={() => setSignOpen(false)} title="Tanda tangan elektronik" description="Integrasi penyedia tanda tangan elektronik bersertifikat direncanakan pada tahap implementasi." size="md" footer={<Button size="sm" variant="secondary" onClick={() => setSignOpen(false)}>Mengerti</Button>}>
        <div className="rounded-xl border border-dashed border-[#CFC6B4] bg-[#FBFAF6] p-5 text-center">
          <PenLine className="mx-auto h-7 w-7 text-sand-deep" />
          <p className="mt-2 text-[14px] font-semibold text-ink">Belum terhubung ke penyedia tanda tangan</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted">Prototipe ini hanya menampilkan status "disetujui" secara internal. Tidak ada tanda tangan elektronik, sertifikat, atau verifikasi identitas pihak yang nyata.</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-sand/50 bg-sand-light px-2 py-1 text-[12px] font-bold text-[#7A5A2E]">Placeholder integrasi · bukan sertifikasi</span>
        </div>
      </Modal>
    </>
  );
}

/* ============================ WIZARD ============================ */
const steps = ["Para pihak", "Ruang lingkup", "Jadwal & lokasi", "Nilai & termin", "Kewajiban", "Pembatalan", "Tinjau dokumen", "Persetujuan"];

export function AgreementWizard() {
  const { addAgreement, navigate, toast, agreements } = useApp();
  const [step, setStep] = useState(0);
  const [invalid, setInvalid] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [form, setForm] = useState({
    partnerId: "nurhaeni",
    partnerRep: "Hj. Andi Nurhaeni",
    partnerEmail: "halo@tolobatara.id",
    partnerPhone: "+62 812 3456 7890",
    couple: "Nurul Amalia",
    coupleEmail: "nurul.amalia@email.id",
    couplePhone: "+62 811 2233 4455",
    category: "Prosesi Adat",
    service: "Pendampingan Prosesi Mappacci & Adat Keluarga",
    scope: "Pendampingan prosesi mappacci, penyusunan rundown adat, dua sesi pertemuan keluarga, dan pendampingan hari acara selama 8 jam. Susunan acara mengikuti kesepakatan pada Lampiran A.",
    includes: ["Konsultasi keluarga (2 sesi)", "Rundown prosesi", "Pendampingan 8 jam", "Koordinasi 2 penanggung jawab keluarga"],
    excludes: "Biaya dekorasi, konsumsi tamu, dan transportasi di luar area Makassar–Gowa.",
    personnel: "3",
    date: "2027-06-12",
    start: "08:00",
    end: "16:00",
    venue: "Gedung pertemuan keluarga (contoh)",
    address: "Jl. Sultan Hasanuddin No. 24, Somba Opu, Gowa",
    timezone: "WITA",
    total: "18500000",
    dp: "30",
    method: "transfer",
    obligationsCouple: "Menyediakan informasi keluarga yang akurat, menanggapi permintaan konfirmasi dalam 3 hari kerja, dan memastikan akses lokasi sesuai jadwal.",
    obligationsVendor: "Hadir sesuai jadwal, menjaga kerahasiaan informasi keluarga, dan menyampaikan laporan pendampingan setelah acara.",
    acceptance: "Pendampingan telah dilakukan sesuai rundown, seluruh personel hadir, dan catatan acara diserahkan.",
    cancellation: "standar",
    notice: "14",
    change: "Perubahan diajukan tertulis dan hanya berlaku setelah disetujui kedua pihak.",
    dispute: "Fasilitasi melalui VAKSARA Trust. Para pihak tetap dapat menggunakan jalur lain sesuai hukum yang berlaku.",
    agreeDoc: false,
    agreeNotFinal: false,
    agreeSign: false,
  });
  const set = (key: string, val: string | boolean | string[]) => setForm((f) => ({ ...f, [key]: val }));
  const partner = practitioners.find((p) => p.id === form.partnerId) ?? practitioners[0];
  const totalNum = Number(form.total.replace(/\D/g, "")) || 0;
  const dpPct = Number(form.dp) || 30;
  const dpAmount = Math.round((totalNum * dpPct) / 100);
  const termAmounts = [dpAmount, Math.round((totalNum * (100 - dpPct) * 0.5) / 100), totalNum - dpAmount - Math.round((totalNum * (100 - dpPct) * 0.5) / 100)];

  const validate = () => {
    if (step === 0 && (!form.partnerRep || !form.partnerEmail || !form.coupleEmail)) return "Lengkapi identitas dan kontak kedua pihak.";
    if (step === 1 && (form.service.trim().length < 5 || form.scope.trim().length < 30 || form.includes.length === 0)) return "Lengkapi nama layanan, ruang lingkup minimal 30 karakter, dan minimal satu hasil kerja.";
    if (step === 2 && (!form.date || !form.venue || !form.address)) return "Lengkapi tanggal, lokasi, dan alamat layanan.";
    if (step === 3 && (totalNum < 100000 || dpPct < 10 || dpPct > 70)) return "Nilai layanan minimal Rp100.000 dan DP antara 10–70%.";
    if (step === 4 && (form.obligationsCouple.length < 20 || form.obligationsVendor.length < 20)) return "Jelaskan kewajiban kedua pihak minimal 20 karakter.";
    if (step === 5 && !form.cancellation) return "Pilih kebijakan pembatalan.";
    if (step === 6 && (!form.agreeDoc || !form.agreeNotFinal)) return "Centang kedua pernyataan sebelum melanjutkan.";
    return "";
  };

  const next = () => {
    const err = validate();
    if (err) { setInvalid(err); return; }
    setInvalid("");
    if (step < 7) setStep(step + 1);
    else setConfirmOpen(true);
  };

  const submit = () => {
    setLoading(true);
    window.setTimeout(() => {
      const number = `VKS-PJK-2027-${(200 + agreements.length).toString().padStart(4, "0")}`;
      const newAg: Agreement = {
        id: `a-${Date.now()}`,
        number,
        partner: partner.name,
        partnerInitials: partner.name.split(" ").slice(0, 2).map((x) => x[0]).join(""),
        service: form.service,
        value: totalNum,
        status: "Menunggu Persetujuan",
        nextAction: "Tunggu persetujuan vendor",
        nextTone: "warn",
        date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
        update: "Baru",
        progress: 14,
        category: form.category,
        paymentMethod: "Transfer bank (manual) & Xendit (prototipe)",
        scope: form.scope,
        location: `${form.venue}, ${form.address}`,
        schedule: `${new Date(form.date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} · ${form.start}–${form.end} ${form.timezone}`,
        clauses: [
          { title: "1. Ruang Lingkup Layanan", body: form.scope },
          { title: "2. Hasil Kerja", body: `Hasil kerja meliputi: ${form.includes.join("; ")}. Tidak termasuk: ${form.excludes}` },
          { title: "3. Jadwal dan Lokasi", body: `Layanan dilaksanakan pada ${form.date} pukul ${form.start}–${form.end} ${form.timezone} di ${form.venue}, ${form.address}.` },
          { title: "4. Nilai dan Termin", body: `Nilai layanan ${formatIDR(totalNum)} dengan DP ${dpPct}% (${formatIDR(dpAmount)}) dan dua termin berikutnya. Pembayaran manual dan gateway ditandai berbeda.` },
          { title: "5. Kewajiban Pengguna", body: form.obligationsCouple },
          { title: "6. Kewajiban Pelaku Budaya", body: form.obligationsVendor },
          { title: "7. Perubahan dan Pembatalan", body: `${form.change} Pembatalan mengikuti kebijakan ${form.cancellation} dengan pemberitahuan ${form.notice} hari.` },
          { title: "8. Penyelesaian Perselisihan", body: `${form.dispute} VAKSARA tidak memberikan putusan hukum atau menjamin pengembalian dana.` },
        ],
        versions: [{ version: "v1.0", date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }), by: "Nurul Amalia", note: "Draf awal yang diajukan untuk persetujuan.", state: "Draf" }],
        attachments: [],
        approvals: [
          { party: "Nurul Amalia", role: "Calon pengantin", state: "Menyetujui", date: "Hari ini" },
          { party: partner.name, role: "Pelaku budaya", state: "Menunggu" },
        ],
        terms: [
          { label: "Termin 1 — DP", percentage: dpPct, amount: dpAmount, due: "Setelah persetujuan", status: "Menunggu" },
          { label: "Termin 2 — Persiapan", percentage: Math.round((100 - dpPct) / 2), amount: termAmounts[1], due: "30 hari sebelum acara", status: "Menunggu" },
          { label: "Termin 3 — Pelunasan", percentage: 100 - dpPct - Math.round((100 - dpPct) / 2), amount: termAmounts[2], due: "Saat BAST disetujui", status: "Menunggu" },
        ],
      };
      addAgreement(newAg);
      setLoading(false);
      setConfirmOpen(false);
      navigate(`perjanjian/${newAg.id}`);
      toast("Draf perjanjian dibuat dan dikirim ke pelaku budaya untuk persetujuan.", "success", `${number} berhasil dibuat`);
    }, 900);
  };

  return (
    <>
      <PageHeader
        eyebrow="VAKSARA Trust"
        title="Buat perjanjian layanan"
        description="Susun kesepakatan yang jelas bersama pelaku budaya. Semua langkah dapat ditinjau sebelum dikirim."
        back={{ label: "Kembali ke Trust", onClick: () => navigate("trust") }}
        actions={<Button variant="secondary" size="sm" onClick={() => { setSavedDraft(true); toast("Draf perjanjian tersimpan pada sesi prototipe.", "success", "Tersimpan sebagai draf"); }} leading={<FileText className="h-3.5 w-3.5" />}>Simpan draf</Button>}
      />
      {savedDraft && <Alert tone="success" className="mb-3" title="Draf tersimpan pada sesi ini">Draf belum dikirim ke pihak mana pun. Anda dapat melanjutkan langkah pengisian.</Alert>}
      <Card className="mb-3 p-3">
        <StepDots steps={steps} current={step} onStep={(s) => { setStep(s); setInvalid(""); }} />
        <div className="mt-2 flex items-center justify-between text-[13px] text-muted"><span>Langkah {step + 1} dari 8 · {steps[step]}</span><span>{Math.round(((step + 1) / 8) * 100)}% formulir</span></div>
        <Progress value={((step + 1) / 8) * 100} tone="sand" height="h-1" className="mt-1" />
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1fr_310px]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-3">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-sand-deep">Langkah {step + 1}</div>
              <h2 className="mt-0.5 font-display text-[1.35rem] font-semibold leading-tight text-ink">{steps[step]}</h2>
            </div>
            <Badge tone="outline" className="text-[12px]">Draf prototipe</Badge>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <Card className="p-3">
                  <div className="flex items-center justify-between"><span className="text-[12px] font-bold uppercase tracking-wider text-muted">Pihak pertama</span><Badge tone="green" className="text-[12px]"><BadgeCheck className="h-2.5 w-2.5" /> Terverifikasi</Badge></div>
                  <Field label="Nama pengguna" className="mt-2"><Input value={form.couple} onChange={(e) => set("couple", e.target.value)} /></Field>
                  <Field label="Surel" className="mt-2"><Input value={form.coupleEmail} onChange={(e) => set("coupleEmail", e.target.value)} /></Field>
                  <Field label="Telepon" className="mt-2"><Input value={form.couplePhone} onChange={(e) => set("couplePhone", e.target.value)} /></Field>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between"><span className="text-[12px] font-bold uppercase tracking-wider text-muted">Pihak kedua</span><Badge tone="sand" className="text-[12px]">Pelaku budaya</Badge></div>
                  <Field label="Pilih pelaku budaya" className="mt-2" required>
                    <Select value={form.partnerId} onChange={(e) => { const p = practitioners.find((x) => x.id === e.target.value)!; setForm((f) => ({ ...f, partnerId: p.id, partnerRep: p.name, partnerEmail: `halo@${p.id.replace(/-/g, "")}.id` })); }}>
                      {practitioners.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.category}</option>)}
                    </Select>
                  </Field>
                  <Field label="Perwakilan" className="mt-2"><Input value={form.partnerRep} onChange={(e) => set("partnerRep", e.target.value)} /></Field>
                  <Field label="Surel" className="mt-2"><Input value={form.partnerEmail} onChange={(e) => set("partnerEmail", e.target.value)} /></Field>
                  <Field label="Telepon" className="mt-2"><Input value={form.partnerPhone} onChange={(e) => set("partnerPhone", e.target.value)} /></Field>
                </Card>
              </div>
              <Alert tone="trust" title="Identitas terverifikasi pada akun">Detail identitas tidak ditampilkan penuh pada dokumen. Pastikan kontak di atas aktif. Verifikasi identitas prototipe bukan verifikasi KYC nyata.</Alert>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Kategori layanan" required><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{["Prosesi Adat", "Musik Tradisional", "Busana Adat", "Perajin & Perlengkapan", "Vendor Pendukung"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
                <Field label="Jumlah personel" hint="termasuk pelaku utama"><Input type="number" value={form.personnel} onChange={(e) => set("personnel", e.target.value)} min={1} /></Field>
              </div>
              <Field label="Nama layanan" required><Input value={form.service} onChange={(e) => set("service", e.target.value)} /></Field>
              <Field label="Ruang lingkup layanan" required hint={`${form.scope.length}/500`}><Textarea value={form.scope} onChange={(e) => set("scope", e.target.value.slice(0, 500))} className="min-h-[100px]" /></Field>
              <div>
                <Field label="Hasil kerja termasuk" required hint="Tekan tambah untuk setiap item"><div className="flex gap-1.5"><Input value={form.includes.join("; ")} readOnly className="bg-[#F7F5EF]" /><Button size="md" variant="secondary" onClick={() => set("includes", [...form.includes, "Item hasil kerja baru"])}>Tambah</Button></div></Field>
                <div className="mt-2 space-y-1">
                  {form.includes.map((inc, i) => (
                    <div key={`${inc}-${i}`} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5"><Check className="h-2.5 w-2.5 shrink-0 text-[#4C8068]" /><span className="min-w-0 flex-1 text-[14px] text-ink-soft">{inc}</span><button onClick={() => set("includes", form.includes.filter((_, idx) => idx !== i))} className="text-muted hover:text-[#933A2F]" aria-label={`Hapus ${inc}`}><X className="h-3 w-3" /></button></div>
                  ))}
                </div>
              </div>
              <Field label="Tidak termasuk dalam layanan"><Textarea value={form.excludes} onChange={(e) => set("excludes", e.target.value)} className="min-h-[70px]" /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Tanggal layanan" required><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
                <Field label="Mulai" required><Input type="time" value={form.start} onChange={(e) => set("start", e.target.value)} /></Field>
                <Field label="Selesai" required><Input type="time" value={form.end} onChange={(e) => set("end", e.target.value)} /></Field>
              </div>
              <Field label="Nama lokasi / venue" required><Input value={form.venue} onChange={(e) => set("venue", e.target.value)} /></Field>
              <Field label="Alamat lengkap" required><Textarea value={form.address} onChange={(e) => set("address", e.target.value)} className="min-h-[70px]" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Zona waktu"><Select value={form.timezone} onChange={(e) => set("timezone", e.target.value)}><option>WITA</option><option>WIB</option><option>WIT</option></Select></Field>
                <Field label="Kontak di lokasi"><Input placeholder="Nama & nomor koordinator keluarga" defaultValue="Ibu Salma · +62 812 0000 1111" /></Field>
              </div>
              <Alert tone="info" title="Cadangan jadwal">Sediakan waktu pemasangan dan bongkar. Perubahan jadwal harus diajukan sebagai perubahan perjanjian, bukan pesan lisan.</Alert>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nilai layanan (Rupiah)" required><Input inputMode="numeric" value={form.total} onChange={(e) => set("total", e.target.value.replace(/[^\d]/g, ""))} /></Field>
                <Field label="Uang muka (DP)" required hint="10–70%"><Select value={form.dp} onChange={(e) => set("dp", e.target.value)}>{["20", "25", "30", "40", "50"].map((p) => <option key={p}>{p}</option>)}</Select></Field>
              </div>
              <div className="rounded-xl border border-line bg-[#FBFAF6] p-3">
                <div className="flex items-center justify-between text-[14px]"><span className="text-muted">Total layanan</span><span className="font-bold text-ink">{formatIDR(totalNum)}</span></div>
                <div className="mt-2 space-y-1.5">
                  {[["Termin 1 — DP", `${dpPct}%`, dpAmount, "Setelah persetujuan"], ["Termin 2 — Persiapan", `${Math.round((100 - dpPct) / 2)}%`, termAmounts[1], "30 hari sebelum acara"], ["Termin 3 — Pelunasan", `${100 - dpPct - Math.round((100 - dpPct) / 2)}%`, termAmounts[2], "Saat BAST disetujui"]].map(([l, pct, amt, due]) => (
                    <div key={l as string} className="flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-1.5"><div><div className="text-[13px] font-semibold text-ink">{l as string} <span className="font-normal text-muted">· {pct as string}</span></div><div className="text-[12px] text-muted">{due as string}</div></div><span className="text-[14px] font-bold text-ink">{formatIDR(amt as number)}</span></div>
                  ))}
                </div>
              </div>
              <Field label="Preferensi metode pembayaran" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[["transfer", "Transfer bank manual", "Catat bukti transfer; tidak diverifikasi gateway."], ["xendit", "Gateway Xendit (direkomendasikan)", "Checkout ditandai terverifikasi setelah konfirmasi penyedia."]].map(([id, title, desc]) => (
                    <button key={id} onClick={() => set("method", id)} className={cn("rounded-lg border p-2.5 text-left", form.method === id ? "border-ink bg-sage/60" : "border-line bg-white hover:border-sand")}>
                      <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink"><span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full border", form.method === id ? "border-ink bg-ink text-cream" : "border-line")}>{form.method === id && <Check className="h-2 w-2" />}</span>{title}</span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-muted">{desc}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Alert tone="warn" title="Bukan escrow">VAKSARA tidak menahan dana. Integrasi checkout Xendit pada prototipe ini belum aktif dan tidak memproses uang nyata.</Alert>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Field label="Kewajiban calon pengantin" required><Textarea value={form.obligationsCouple} onChange={(e) => set("obligationsCouple", e.target.value)} className="min-h-[80px]" /></Field>
              <Field label="Kewajiban pelaku budaya" required><Textarea value={form.obligationsVendor} onChange={(e) => set("obligationsVendor", e.target.value)} className="min-h-[80px]" /></Field>
              <Field label="Kriteria penerimaan hasil kerja" required hint="menjadi dasar BAST"><Textarea value={form.acceptance} onChange={(e) => set("acceptance", e.target.value)} className="min-h-[70px]" /></Field>
              <Alert tone="trust" title="BAST tidak otomatis selesai">BAST baru dianggap diterima setelah pengantin memberi keputusan dan pelaku budaya mengonfirmasi. Revisi tetap dapat diajukan dengan bukti.</Alert>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <Field label="Kebijakan pembatalan" required>
                <div className="space-y-2">
                  {[
                    ["fleksibel", "Fleksibel", "Pembatalan lebih dari 30 hari: biaya yang sudah dikeluarkan dikembalikan setelah peninjauan. Tidak otomatis."],
                    ["standar", "Standar", "DP tidak dikembalikan otomatis; sisa pembayaran disesuaikan dengan biaya yang sudah dikeluarkan."],
                    ["ketat", "Ketat (khusus periode sibuk)", "Pembatalan dalam 30 hari tidak menjamin pengembalian. Fasilitasi dapat diminta."],
                  ].map(([id, t, d]) => (
                    <button key={id} onClick={() => set("cancellation", id)} className={cn("flex w-full items-start gap-2 rounded-lg border p-2.5 text-left", form.cancellation === id ? "border-ink bg-sage/50" : "border-line bg-white hover:border-sand")}>
                      <span className={cn("mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border", form.cancellation === id ? "border-ink bg-ink text-cream" : "border-line")}>{form.cancellation === id && <Check className="h-2 w-2" />}</span>
                      <span><span className="block text-[14px] font-bold text-ink">{t}</span><span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{d}</span></span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Batas pemberitahuan pembatalan" hint="hari"><Input type="number" value={form.notice} onChange={(e) => set("notice", e.target.value)} min={0} /></Field>
              <Field label="Mekanisme perubahan jadwal / ruang lingkup"><Textarea value={form.change} onChange={(e) => set("change", e.target.value)} className="min-h-[60px]" /></Field>
              <Field label="Penyelesaian perselisihan"><Textarea value={form.dispute} onChange={(e) => set("dispute", e.target.value)} className="min-h-[60px]" /></Field>
              <Alert tone="warn" title="Batas peran VAKSARA">Kami tidak menyediakan pengadilan, arbitrase, putusan hukum, atau jaminan pengembalian dana. Fasilitasi bertujuan membantu komunikasi dan pencatatan kesepakatan.</Alert>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <Alert tone="trust" title="Tinjau sebelum mengirim">Periksa nomor, identitas, nilai, dan termin. Setelah dikirim, pelaku budaya akan meninjau versi ini dan dapat mengajukan perubahan.</Alert>
              <Card className="overflow-hidden">
                <div className="border-b border-line bg-[#FBFAF6] px-4 py-3"><div className="flex items-center gap-2"><LogoMark className="h-7 w-7" /><div><div className="font-display text-[15px] font-semibold tracking-wider text-ink">VAKSARA</div><div className="text-[12px] uppercase tracking-wider text-muted">Draf perjanjian layanan · v1.0</div></div></div></div>
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  {[["Pihak pertama", `${form.couple} · ${form.coupleEmail}`], ["Pihak kedua", `${form.partnerRep} · ${form.partnerEmail}`], ["Layanan", form.service], ["Kategori", form.category], ["Lokasi", `${form.venue}, ${form.address}`], ["Jadwal", `${form.date} · ${form.start}–${form.end} ${form.timezone}`]].map(([l, v]) => <div key={l} className="rounded-lg border border-line bg-white p-2.5"><div className="text-[12px] font-bold uppercase tracking-wider text-muted">{l}</div><div className="mt-1 text-[13px] font-medium leading-snug text-ink">{v}</div></div>)}
                </div>
                <div className="border-t border-line px-4 py-2.5"><div className="flex items-center justify-between text-[14px]"><span className="text-muted">Nilai layanan</span><span className="font-bold text-ink">{formatIDR(totalNum)}</span></div><div className="mt-1 flex items-center justify-between text-[13px]"><span className="text-muted">DP {dpPct}%</span><span className="font-semibold text-ink">{formatIDR(dpAmount)}</span></div></div>
              </Card>
              <div className="space-y-2.5">
                <Checkbox checked={form.agreeDoc} onChange={(v) => set("agreeDoc", v)} label="Saya telah membaca seluruh ruang lingkup, jadwal, nilai, dan ketentuan pembatalan pada draf ini." />
                <Checkbox checked={form.agreeNotFinal} onChange={(v) => set("agreeNotFinal", v)} label={<span>Saya memahami bahwa perjanjian prototipe ini <strong>belum memiliki sertifikasi hukum</strong> dan tanda tangan elektronik belum terintegrasi.</span>} />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <Alert tone="success" title="Dokumen siap diajukan untuk persetujuan">
                Pengantin menyatakan siap. Pelaku budaya belum menyetujui versi ini. Kedua pihak harus menyetujui versi yang sama sebelum status menjadi "Disepakati".
              </Alert>
              <div className="grid gap-2 sm:grid-cols-2">
                {[[form.couple, "Calon pengantin", true], [form.partnerRep, "Pelaku budaya", false]].map(([name, role, done]) => (
                  <Card key={name as string} className={cn("p-3", done ? "border-[#CFE0D4]" : "border-line")}>
                    <div className="flex items-center gap-2"><div className={cn("flex h-7 w-7 items-center justify-center rounded-full", done ? "bg-sage text-[#2B5949]" : "bg-[#F1EFE9] text-muted")}>{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}</div><div><div className="text-[14px] font-bold text-ink">{name as string}</div><div className="text-[12px] text-muted">{role as string} · {done ? "Siap menyetujui" : "Menunggu undangan"}</div></div></div>
                  </Card>
                ))}
              </div>
              <Field label="Tanda tangan elektronik"><div className="rounded-xl border border-dashed border-[#CFC6B4] bg-[#FBFAF6] p-4 text-center"><PenLine className="mx-auto h-5 w-5 text-sand-deep" /><p className="mt-1.5 text-[14px] font-semibold text-ink">Belum tersedia pada prototipe</p><p className="mt-0.5 text-[12px] text-muted">Persetujuan hanya mencatat status pada prototipe. Tidak ada sertifikat digital atau identitas tertandatangani secara hukum.</p></div></Field>
              <Checkbox checked={form.agreeSign} onChange={(v) => set("agreeSign", v)} label="Saya memahami bahwa pengajuan ini hanya membuat draf untuk persetujuan pada prototipe, bukan dokumen yang mengikat secara hukum." />
            </div>
          )}

          {invalid && <div className="mt-3"><Alert tone="error" title="Periksa kembali langkah ini">{invalid}</Alert></div>}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} leading={<ArrowLeft className="h-3.5 w-3.5" />}>Sebelumnya</Button>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => { setSavedDraft(true); toast("Draf disimpan pada sesi prototipe.", "success", "Draf tersimpan"); }}>Simpan draf</Button>
              {step < 7 ? <Button size="sm" onClick={next} trailing={<ArrowRight className="h-3.5 w-3.5" />}>Lanjut: {steps[step + 1]}</Button> : <Button size="sm" onClick={() => setConfirmOpen(true)} leading={<Send className="h-3.5 w-3.5" />}>Kirim untuk persetujuan</Button>}
            </div>
          </div>
        </Card>

        <aside className="space-y-3 xl:sticky xl:top-[76px] xl:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-[#FBFAF6] px-4 py-3"><div className="flex items-center justify-between"><h3 className="text-[14px] font-bold text-ink">Pratinjau kesepakatan</h3><Badge tone="neutral" className="text-[12px]">Draf</Badge></div><p className="mt-0.5 text-[12px] text-muted">Diperbarui saat Anda mengisi formulir.</p></div>
            <div className="space-y-2.5 p-4">
              <div className="rounded-lg bg-ink p-3 text-cream">
                <div className="text-[12px] uppercase tracking-wider text-cream/45">Perkiraan total</div>
                <div className="mt-1 font-display text-[1.35rem] font-semibold leading-none">{formatIDR(totalNum)}</div>
                <div className="mt-1 text-[12px] text-cream/55">DP {dpPct}% · {formatIDR(dpAmount)}</div>
              </div>
              {[["Mitra", partner.name], ["Kategori", form.category], ["Tanggal", form.date], ["Lokasi", form.venue], ["Metode", form.method === "xendit" ? "Gateway Xendit (prototipe)" : "Transfer manual"], ["Status", "Draf · belum dikirim"]].map(([l, v]) => <div key={l} className="flex items-start justify-between gap-2 border-b border-line/60 pb-1.5 text-[13px]"><span className="text-muted">{l}</span><span className="max-w-[62%] text-right font-semibold leading-snug text-ink">{v}</span></div>)}
              <div className="flex items-start gap-1.5 rounded-md bg-sand-light/50 p-2 text-[12px] leading-relaxed text-ink-soft"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-sand-deep" /> Perjanjian bukan jaminan hasil. Tinjau ruang lingkup sebelum menyetujui.</div>
            </div>
          </Card>
          <Card className="p-3">
            <h3 className="text-[14px] font-bold text-ink">Bantuan pengisian</h3>
            <div className="mt-2 space-y-1.5">
              {["Tulis hasil kerja yang dapat diperiksa.", "Bedakan pembayaran manual dan gateway.", "Cantumkan siapa yang berwenang menyetujui perubahan."].map((x) => <div key={x} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-muted"><Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#4C8068]" />{x}</div>)}
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={loading}
        title="Kirim draf untuk persetujuan?"
        description={`${form.service} · ${formatIDR(totalNum)}`}
        confirmLabel="Kirim & buat draf"
      >
        <div className="space-y-2 text-[14px]">
          <div className="flex items-center justify-between"><span className="text-muted">Pihak kedua</span><span className="font-semibold text-ink">{partner.name}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted">Tanggal</span><span className="font-semibold text-ink">{form.date}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted">Termin</span><span className="font-semibold text-ink">3 termin · DP {dpPct}%</span></div>
          <div className="flex items-center justify-between"><span className="text-muted">Status setelah dikirim</span><Badge tone="amber">Menunggu Persetujuan</Badge></div>
        </div>
        <Alert tone="warn" className="mt-2">Setelah dikirim, pihak lain akan diminta meninjau. Perubahan harus melalui pengajuan versi baru.</Alert>
      </ConfirmDialog>
    </>
  );
}

