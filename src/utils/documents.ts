import { useCallback, useEffect, useState } from "react";
import { liveUserId } from "@/LiveContext";
import { q, removeFile, rest, signedUrl, uploadFile } from "@/utils/supabase";

// Dokumen verifikasi akun nyata. Berkas di bucket privat "verifikasi" (<id akun>/<berkas>), catatannya di tabel documents.
// Hanya pemilik dan peninjau yang dapat membuka; lihat supabase/schema.sql bagian DOKUMEN VERIFIKASI.
export const BUCKET = "verifikasi";
export type DocKind = "ktp" | "portfolio" | "nib" | "recommendation" | "face";
export type VerificationDoc = { id: string; user_id: string; kind: DocKind; path: string; note: string; meta: Record<string, unknown>; created_at: string };

export const docLabels: Record<DocKind, string> = {
  ktp: "KTP",
  portfolio: "Foto kegiatan",
  nib: "NIB / izin usaha",
  recommendation: "Surat rekomendasi",
  face: "Verifikasi wajah",
};
export const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Foto diperkecil (sisi terpanjang 1600 px, JPEG) agar unggahan dari ponsel ringan; PDF dikirim apa adanya. */
export async function prepareFile(file: Blob): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Jenis berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.");
  if (file.type === "application/pdf") { if (file.size > MAX_BYTES) throw new Error("Berkas terlalu besar. Maksimal 5 MB."); return file; }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) { if (file.size > MAX_BYTES) throw new Error("Berkas terlalu besar. Maksimal 5 MB."); return file; }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const out = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!out) throw new Error("Foto tidak dapat diproses. Coba foto lain.");
  if (out.size > MAX_BYTES) throw new Error("Berkas terlalu besar. Maksimal 5 MB.");
  return out;
}

export async function addDocument(kind: DocKind, file: Blob, meta: Record<string, unknown> = {}): Promise<void> {
  const uid = liveUserId(); if (!uid) throw new Error("Sesi berakhir. Silakan masuk lagi.");
  const blob = await prepareFile(file);
  const ext = blob.type === "application/pdf" ? "pdf" : "jpg";
  const path = `${uid}/${kind}-${crypto.randomUUID()}.${ext}`;
  await uploadFile(BUCKET, path, blob);
  try { await rest("documents", { method: "POST", body: { kind, path, meta }, prefer: "return=minimal" }); }
  catch (e) { await removeFile(BUCKET, path).catch(() => undefined); throw e; }
}

export async function deleteDocument(doc: VerificationDoc): Promise<void> {
  await rest(`documents?id=eq.${q(doc.id)}`, { method: "DELETE", prefer: "return=minimal" });
  await removeFile(BUCKET, doc.path).catch(() => undefined);
}

export async function openDocument(doc: Pick<VerificationDoc, "path">): Promise<void> {
  // Jendela dibuka dulu agar tidak diblokir browser, lalu diarahkan ke tautan sementara.
  const win = window.open("", "_blank");
  try { const url = await signedUrl(BUCKET, doc.path); if (win) win.location.href = url; else window.location.href = url; }
  catch (e) { win?.close(); throw e; }
}

/** Dokumen milik akun yang sedang masuk, atau milik akun lain bila dibuka peninjau. */
export function useDocuments(userId?: string) {
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const owner = userId ?? liveUserId();
  const reload = useCallback(async () => {
    if (!owner) return;
    try { setDocs(await rest<VerificationDoc[]>(`documents?select=id,user_id,kind,path,note,meta,created_at&user_id=eq.${q(owner)}&order=created_at`)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoaded(true); }
  }, [owner]);
  useEffect(() => { reload(); }, [reload]);
  return { docs, loaded, error, reload };
}

/** Kelengkapan dokumen wajib pelaku budaya; aturan yang sama ditegakkan database saat peninjau menyetujui. */
export function vendorChecklist(docs: VerificationDoc[]) {
  const count = (k: DocKind) => docs.filter(d => d.kind === k).length;
  const items = [
    { kind: "ktp" as const, label: "KTP penanggung jawab", ok: count("ktp") >= 1 },
    { kind: "portfolio" as const, label: "Minimal 2 foto kegiatan", ok: count("portfolio") >= 2 },
    { kind: "face" as const, label: "Verifikasi wajah", ok: count("face") >= 1 },
  ];
  return { items, done: items.filter(i => i.ok).length, complete: items.every(i => i.ok) };
}
