import { useRef, useState } from "react";
import { CheckCircle2, Circle, Eye, FileUp, ScanFace, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { FaceCheck, FaceCheckIntro, type FaceResult } from "@/components/FaceCheck";
import { addDocument, deleteDocument, docLabels, openDocument, useDocuments, vendorChecklist, type DocKind, type VerificationDoc } from "@/utils/documents";
import { useApp } from "@/store";
import { friendly } from "@/utils/supabase";

const dateOf = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function DocRow({ kind, label, hint, required, max, accept, docs, reload, readOnly }: { kind: DocKind; label: string; hint: string; required?: boolean; max: number; accept: string; docs: VerificationDoc[]; reload: () => Promise<void>; readOnly?: boolean }) {
  const { toast } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const mine = docs.filter(d => d.kind === kind);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - mine.length;
    if (room <= 0) { toast(`Batas ${max} berkas tercapai. Hapus yang lama untuk mengganti.`, "warn"); return; }
    setBusy(true);
    try { for (const f of Array.from(files).slice(0, room)) await addDocument(kind, f); toast(`${label} tersimpan.`, "success"); }
    catch (e) { toast(friendly(e), "error"); }
    finally { setBusy(false); await reload(); if (input.current) input.current.value = ""; }
  };
  const remove = async (d: VerificationDoc) => { setBusy(true); try { await deleteDocument(d); toast("Berkas dihapus.", "success"); } catch (e) { toast(friendly(e), "error"); } finally { setBusy(false); await reload(); } };
  return <div className="border-t border-line py-3 first:border-t-0">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><p className="text-[15px] font-semibold text-ink">{label} {required ? <Badge tone="sand">Wajib</Badge> : <Badge tone="neutral">Opsional</Badge>}</p><p className="text-[13px] text-muted">{hint}</p></div>
      {!readOnly && mine.length < max && <>
        <input ref={input} type="file" accept={accept} multiple={max > 1} className="sr-only" aria-label={`Unggah ${label}`} onChange={e => upload(e.target.files)} />
        <Button size="sm" variant="secondary" disabled={busy} leading={<FileUp className="h-4 w-4" />} onClick={() => input.current?.click()}>{busy ? "Mengunggah…" : mine.length ? "Tambah" : "Unggah"}</Button>
      </>}
    </div>
    {mine.length > 0 && <ul className="mt-2 space-y-1">{mine.map((d, i) => <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-cream px-2.5 py-1.5 text-[13px]">
      <span className="flex-1 text-ink-soft">{docLabels[kind]}{max > 1 ? ` ${i + 1}` : ""} · {dateOf(d.created_at)}</span>
      <button type="button" className="inline-flex items-center gap-1 font-semibold text-ink underline" onClick={() => openDocument(d).catch(e => toast(friendly(e), "error"))}><Eye className="h-3.5 w-3.5" />Lihat</button>
      {!readOnly && <button type="button" disabled={busy} className="inline-flex items-center gap-1 font-semibold text-[#933A2F]" onClick={() => remove(d)} aria-label={`Hapus ${docLabels[kind]} ${i + 1}`}><Trash2 className="h-3.5 w-3.5" />Hapus</button>}
    </li>)}</ul>}
  </div>;
}

/** Dokumen verifikasi di halaman profil pelaku budaya. */
export function VendorDocumentsCard() {
  const { docs, loaded, reload } = useDocuments();
  const { toast } = useApp();
  const [face, setFace] = useState<"idle" | "intro" | "camera">("idle");
  const check = vendorChecklist(docs);
  const faceDoc = docs.find(d => d.kind === "face");
  const saveFace = async ({ photo, meta }: FaceResult) => {
    if (faceDoc) await deleteDocument(faceDoc);
    await addDocument("face", photo, meta);
    await reload();
    toast("Verifikasi wajah tersimpan.", "success");
  };
  return <Card className="mt-4 p-5" aria-label="Dokumen verifikasi">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="font-display text-xl text-ink">Dokumen verifikasi</h2><p className="mt-1 text-[13px] text-muted">Hanya dilihat peninjau VAKSARA, tidak pernah ditampilkan ke publik. Profil disetujui setelah dokumen wajib lengkap.</p></div>
      <Badge tone={check.complete ? "green" : "sand"}>{check.done} dari {check.items.length} wajib lengkap</Badge>
    </div>
    <ul className="mt-3 grid gap-1 sm:grid-cols-3">{check.items.map(i => <li key={i.kind} className="flex items-center gap-1.5 text-[13px] text-ink-soft">{i.ok ? <CheckCircle2 className="h-4 w-4 text-[#2E7D4F]" /> : <Circle className="h-4 w-4 text-muted" />}{i.label}</li>)}</ul>
    {!loaded ? <p className="mt-3 text-sm text-muted">Memuat dokumen…</p> : <div className="mt-2">
      <DocRow kind="ktp" label="KTP penanggung jawab" hint="Foto KTP yang jelas terbaca. JPG, PNG, atau PDF, maks. 5 MB." required max={1} accept="image/*,application/pdf" docs={docs} reload={reload} />
      <DocRow kind="portfolio" label="Foto kegiatan / portofolio" hint="2–5 foto layanan atau prosesi yang pernah Anda kerjakan." required max={5} accept="image/*" docs={docs} reload={reload} />
      <DocRow kind="nib" label="NIB / izin usaha" hint="Bila ada. Tidak wajib bagi pelaku adat perorangan." max={1} accept="image/*,application/pdf" docs={docs} reload={reload} />
      <DocRow kind="recommendation" label="Surat rekomendasi sanggar / komunitas" hint="Bila ada. Memperkuat tinjauan konteks budaya." max={1} accept="image/*,application/pdf" docs={docs} reload={reload} />
      <div className="border-t border-line py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="text-[15px] font-semibold text-ink">Verifikasi wajah <Badge tone="sand">Wajib</Badge></p><p className="text-[13px] text-muted">{faceDoc ? `Selesai ${dateOf(faceDoc.created_at)}. Anda dapat mengulang bila perlu.` : "Rekam wajah langsung lewat kamera untuk memastikan pendaftar adalah orang sungguhan."}</p></div>
          {face === "idle" && <Button size="sm" variant={faceDoc ? "secondary" : "primary"} leading={<ScanFace className="h-4 w-4" />} onClick={() => setFace("intro")}>{faceDoc ? "Ulangi" : "Mulai"}</Button>}
        </div>
        {face === "intro" && <div className="mt-3"><FaceCheckIntro onStart={() => setFace("camera")} /><button type="button" className="mt-2 text-[13px] font-semibold text-muted underline" onClick={() => setFace("idle")}>Nanti saja</button></div>}
        {face === "camera" && <div className="mt-3"><FaceCheck onDone={saveFace} onCancel={() => setFace("idle")} /></div>}
      </div>
    </div>}
  </Card>;
}

/** Panel dokumen untuk peninjau di halaman screening. */
export function ReviewerDocuments({ userId }: { userId: string }) {
  const { docs, loaded, reload } = useDocuments(userId);
  const check = vendorChecklist(docs);
  const faceDoc = docs.find(d => d.kind === "face");
  const steps = (faceDoc?.meta?.steps as string[] | undefined) ?? [];
  if (!loaded) return <p className="mt-2 text-[13px] text-muted">Memuat dokumen…</p>;
  return <div className="mt-3 rounded-xl border border-line bg-white p-3" aria-label="Dokumen pelaku">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-bold text-ink">Dokumen verifikasi</p><Badge tone={check.complete ? "green" : "red"}>{check.complete ? "Wajib lengkap" : `${check.done} dari ${check.items.length} wajib`}</Badge></div>
    {!check.complete && <p className="mt-1 text-[13px] text-[#933A2F]">Belum dapat disetujui: {check.items.filter(i => !i.ok).map(i => i.label.toLowerCase()).join(", ")}.</p>}
    {faceDoc && <p className="mt-1 text-[13px] text-ink-soft">Verifikasi wajah {dateOf(faceDoc.created_at)} · langkah: {steps.join(" → ") || "-"}. Cocokkan foto wajah dengan foto di KTP.</p>}
    <div className="mt-1">{(["ktp", "face", "portfolio", "nib", "recommendation", "bank_book"] as DocKind[]).map(k => docs.some(d => d.kind === k) && <DocRow key={k} kind={k} label={docLabels[k]} hint="" max={k === "portfolio" ? 5 : 1} accept="" docs={docs} reload={reload} readOnly />)}</div>
    {docs.length === 0 && <p className="mt-1 text-[13px] text-muted">Pelaku belum mengunggah dokumen.</p>}
  </div>;
}

/** Unggah KTP keluarga sebelum menyetujui perjanjian. */
export function CoupleKtpGate({ onReady }: { onReady?: () => void }) {
  const { docs, loaded, reload } = useDocuments();
  const has = docs.some(d => d.kind === "ktp");
  if (!loaded) return null;
  if (has) return <p className="flex items-center gap-1.5 text-[13px] text-[#1E5C38]"><CheckCircle2 className="h-4 w-4" />KTP keluarga sudah tersimpan. Hanya peninjau VAKSARA yang dapat membukanya.</p>;
  return <div className="rounded-xl border border-sand bg-sand-light p-3" aria-label="KTP keluarga">
    <p className="text-[14px] font-semibold text-ink">Unggah KTP sebelum menyetujui perjanjian</p>
    <p className="text-[13px] text-ink-soft">KTP salah satu anggota keluarga diperlukan agar perjanjian mengikat pihak yang jelas. KTP tidak diperlihatkan kepada pelaku budaya; hanya peninjau VAKSARA yang dapat membukanya bila terjadi sengketa.</p>
    <DocRow kind="ktp" label="KTP anggota keluarga" hint="Foto KTP yang jelas terbaca, maks. 5 MB." required max={1} accept="image/*,application/pdf" docs={docs} reload={async () => { await reload(); onReady?.(); }} />
  </div>;
}
