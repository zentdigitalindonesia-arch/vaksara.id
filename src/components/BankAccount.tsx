import { useCallback, useEffect, useState } from "react";
import { Landmark, Send } from "lucide-react";
import { Alert, Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { DocRow } from "@/components/VerificationDocs";
import { useDocuments } from "@/utils/documents";
import { formatIDR } from "@/data";
import { useApp } from "@/store";
import { liveUserId } from "@/LiveContext";
import { callFunction, friendly, q, rest } from "@/utils/supabase";

// Rekening pencairan Dana Amanah. Aturan yang sama ditegakkan database (vendor_bank_accounts) dan fungsi server.
export const banks: [string, string][] = [
  ["ID_BCA", "BCA"], ["ID_BRI", "BRI"], ["ID_BNI", "BNI"], ["ID_MANDIRI", "Mandiri"], ["ID_BSI", "BSI (Bank Syariah Indonesia)"],
  ["ID_SULSELBAR", "Bank Sulselbar"], ["ID_SULSELBAR_UUS", "Bank Sulselbar Syariah"], ["ID_PERMATA", "Permata"], ["ID_CIMB", "CIMB Niaga"],
  ["ID_BTN", "BTN"], ["ID_DANAMON", "Danamon"], ["ID_BCA_SYR", "BCA Syariah"], ["ID_MUAMALAT", "Muamalat"],
];
export const bankName = (code?: string | null) => banks.find(([c]) => c === code)?.[1] ?? (code ?? "").replace(/^ID_/, "");
export type BankAccount = { vendor_id: string; bank_code: string; account_number: string; holder_name: string; holder_basis: "usaha" | "penanggung_jawab"; status: "pending" | "approved" | "rejected"; review_note: string; reviewed_at: string | null };
const statusInfo = { pending: { label: "Menunggu pemeriksaan", tone: "sand" }, approved: { label: "Disetujui", tone: "green" }, rejected: { label: "Perlu diperbaiki", tone: "red" } } as const;
/** Huruf besar tanpa gelar/tanda baca, untuk membandingkan nama pemilik rekening. */
export const normName = (s: string) => s.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\b(PT|CV|UD|H|HJ)\b/g, " ").replace(/\s+/g, " ").trim();

/** Formulir rekening pencairan di halaman profil pelaku budaya. */
export function BankAccountCard({ hasListing }: { hasListing: boolean }) {
  const { toast } = useApp();
  const uid = liveUserId();
  const { docs, reload } = useDocuments();
  const [acc, setAcc] = useState<BankAccount | null>(null);
  const [f, setF] = useState({ bank_code: "ID_BCA", account_number: "", holder_name: "", holder_basis: "usaha" as BankAccount["holder_basis"] });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!uid) return;
    const [row] = await rest<BankAccount[]>(`vendor_bank_accounts?select=*&vendor_id=eq.${q(uid)}`).catch(() => []);
    setAcc(row ?? null);
    if (row) setF({ bank_code: row.bank_code, account_number: row.account_number, holder_name: row.holder_name, holder_basis: row.holder_basis });
  }, [uid]);
  useEffect(() => { load(); }, [load]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = f.account_number.replace(/\s+/g, "");
    if (!/^[0-9]{5,20}$/.test(number)) return setError("Nomor rekening hanya angka (5–20 digit).");
    if (f.holder_name.trim().length < 3) return setError("Tulis nama pemilik rekening persis seperti di buku rekening.");
    setBusy(true); setError("");
    try {
      const body = { bank_code: f.bank_code, account_number: number, holder_name: f.holder_name.trim(), holder_basis: f.holder_basis };
      if (acc) await rest(`vendor_bank_accounts?vendor_id=eq.${q(uid)}`, { method: "PATCH", body, prefer: "return=minimal" });
      else await rest("vendor_bank_accounts", { method: "POST", body: { ...body, vendor_id: uid }, prefer: "return=minimal" });
      toast("Rekening tersimpan dan menunggu pemeriksaan peninjau.", "success"); await load();
    } catch (err) { setError(friendly(err)); } finally { setBusy(false); }
  };
  const changed = acc && (acc.bank_code !== f.bank_code || acc.account_number !== f.account_number.replace(/\s+/g, "") || acc.holder_name !== f.holder_name.trim() || acc.holder_basis !== f.holder_basis);
  return <Card className="mt-4 p-5" aria-label="Rekening pencairan">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-sand-deep" /><h2 className="font-display text-xl text-ink">Rekening pencairan Dana Amanah</h2></div>
      {acc && <Badge tone={statusInfo[acc.status].tone}>{statusInfo[acc.status].label}</Badge>}
    </div>
    <p className="mt-1 text-[13px] leading-relaxed text-muted">Wajib bila Anda ingin menerima pembayaran lewat Dana Amanah. Rekening harus <b>atas nama usaha (sesuai NIB)</b> atau <b>atas nama penanggung jawab (sesuai KTP)</b>. Dana hanya dicairkan ke rekening ini; setiap perubahan diperiksa ulang dan pencairan ditahan sampai disetujui. Biaya transfer pencairan dipotong dari jumlah yang Anda terima.</p>
    {!hasListing ? <p className="mt-3 text-sm text-muted">Simpan profil layanan terlebih dahulu.</p> : <>
      {acc?.status === "rejected" && acc.review_note && <Alert tone="warn" title="Catatan peninjau">{acc.review_note}</Alert>}
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Bank"><Select aria-label="Bank" value={f.bank_code} onChange={e => setF({ ...f, bank_code: e.target.value })}>{banks.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</Select></Field>
        <Field label="Nomor rekening"><Input aria-label="Nomor rekening" inputMode="numeric" autoComplete="off" value={f.account_number} onChange={e => setF({ ...f, account_number: e.target.value })} /></Field>
        <Field label="Atas nama (persis seperti buku rekening)"><Input aria-label="Atas nama rekening" value={f.holder_name} onChange={e => setF({ ...f, holder_name: e.target.value })} /></Field>
        <Field label="Rekening ini atas nama"><Select aria-label="Dasar atas nama" value={f.holder_basis} onChange={e => setF({ ...f, holder_basis: e.target.value as BankAccount["holder_basis"] })}><option value="usaha">Usaha (sama dengan NIB)</option><option value="penanggung_jawab">Penanggung jawab (sama dengan KTP)</option></Select></Field>
        {error && <p role="alert" className="text-sm font-semibold text-[#933A2F] sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2"><Button type="submit" size="sm" disabled={busy || (acc !== null && !changed)}>{busy ? "Menyimpan…" : acc ? "Simpan perubahan rekening" : "Simpan rekening"}</Button>{acc && changed && <span className="ml-2 text-[13px] text-[#933A2F]">Mengubah rekening menahan pencairan sampai disetujui ulang.</span>}</div>
      </form>
      <div className="mt-3 rounded-xl border border-line px-3"><DocRow kind="bank_book" label="Foto buku rekening" hint="Halaman depan buku tabungan atau tangkapan layar m-banking yang memperlihatkan nama dan nomor rekening." required max={1} accept="image/*,application/pdf" docs={docs} reload={reload} /></div>
      {f.holder_basis === "usaha" && !docs.some(d => d.kind === "nib") && <p className="mt-2 text-[13px] text-[#933A2F]">Rekening atas nama usaha: unggah juga NIB / izin usaha di bagian Dokumen verifikasi.</p>}
    </>}
  </Card>;
}

/** Pemeriksaan rekening oleh peninjau (dalam kartu screening pelaku). */
export function BankReview({ vendorId, listingName, ownerName }: { vendorId: string; listingName: string; ownerName?: string }) {
  const { toast } = useApp();
  const [acc, setAcc] = useState<BankAccount | null>(null);
  const [note, setNote] = useState("");
  const load = useCallback(() => rest<BankAccount[]>(`vendor_bank_accounts?select=*&vendor_id=eq.${q(vendorId)}`).then(r => setAcc(r[0] ?? null)).catch(() => undefined), [vendorId]);
  useEffect(() => { load(); }, [load]);
  if (!acc) return null;
  const holder = normName(acc.holder_name);
  const matches = [listingName, ownerName ?? ""].filter(Boolean).some(n => { const m = normName(n); return m && (m === holder || m.includes(holder) || holder.includes(m)); });
  const decide = async (status: "approved" | "rejected") => {
    try {
      await rest(`vendor_bank_accounts?vendor_id=eq.${q(vendorId)}`, { method: "PATCH", body: { status, review_note: status === "rejected" ? note.trim() : "" }, prefer: "return=minimal" });
      if (status === "approved") { const r = await callFunction<{ sent: number }>("cooperation-action", { action: { type: "flush_vendor_payouts", id: crypto.randomUUID(), data: { vendorId } } }).catch(() => ({ sent: 0 })); toast(r.sent ? `Rekening disetujui; ${r.sent} pencairan tertunda dikirim.` : "Rekening disetujui.", "success"); }
      else toast("Catatan perbaikan rekening dikirim ke pelaku.", "success");
      load();
    } catch (e) { toast(friendly(e), "error"); }
  };
  return <div className="mt-3 rounded-xl border border-line bg-cream/60 p-3" aria-label="Pemeriksaan rekening">
    <div className="flex flex-wrap items-center gap-2"><Landmark className="h-4 w-4 text-sand-deep" /><b className="text-[14px] text-ink">Rekening pencairan</b><Badge tone={statusInfo[acc.status].tone}>{statusInfo[acc.status].label}</Badge></div>
    <p className="mt-1 text-sm text-ink-soft">{bankName(acc.bank_code)} · {acc.account_number} · a.n. <b>{acc.holder_name}</b> ({acc.holder_basis === "usaha" ? "atas nama usaha, cocokkan dengan NIB" : "atas nama penanggung jawab, cocokkan dengan KTP"})</p>
    <p className={`mt-1 text-[13px] ${matches ? "text-[#1E5C38]" : "text-[#933A2F]"}`}>{matches ? "Nama mirip nama usaha/akun. Tetap cocokkan dengan buku rekening dan KTP/NIB." : `Nama berbeda dari nama usaha (${listingName})${ownerName ? ` dan nama akun (${ownerName})` : ""}. Periksa teliti sebelum menyetujui.`}</p>
    {acc.status !== "approved" && <div className="mt-2 flex flex-wrap items-end gap-2"><Button size="sm" onClick={() => decide("approved")}>Setujui rekening</Button><Field label="Alasan bila ditolak" className="min-w-[200px] flex-1"><Input aria-label={`Alasan rekening ${listingName}`} value={note} onChange={e => setNote(e.target.value)} /></Field><Button size="sm" variant="secondary" onClick={() => decide("rejected")}>Minta perbaikan</Button></div>}
  </div>;
}

type AdminPayout = { id: string; case_id: string; kind: string; recipient: string; gross: number; fee: number; bank_code: string | null; account_number: string | null; holder_name: string | null; status: string; failure: string; note: string; created_at: string };
export const payoutKind: Record<string, string> = { direct: "Diteruskan langsung", release: "Pencairan Dana Amanah", remainder: "Sisa dana setelah pembatalan", refund: "Refund ke keluarga" };
/** Daftar pencairan yang perlu tindakan peninjau: refund menunggu pemeriksaan, gagal, atau menunggu rekening. */
export function PayoutsAdmin() {
  const { toast } = useApp();
  const [rows, setRows] = useState<AdminPayout[]>([]);
  const load = () => rest<AdminPayout[]>("escrow_payouts?select=*&order=created_at.desc&limit=100").then(r => setRows(r.filter(p => ["awaiting_admin", "failed", "awaiting_account"].includes(p.status)))).catch(() => undefined);
  useEffect(() => { load(); }, []);
  const send = async (p: AdminPayout) => {
    try { await callFunction("cooperation-action", { action: { type: "admin_payout", id: crypto.randomUUID(), data: { payoutId: p.id } } }); toast("Pencairan dikirim ke Xendit.", "success"); load(); }
    catch (e) { toast(friendly(e), "error"); }
  };
  return <section className="mt-8" aria-label="Pencairan Dana Amanah">
    <h2 className="font-display text-2xl text-ink">Pencairan Dana Amanah {rows.length > 0 && <Badge tone="red">{rows.length} perlu tindakan</Badge>}</h2>
    <p className="mt-1 text-sm text-muted">Refund ke keluarga dikirim setelah Anda mencocokkan atas nama rekening dengan KTP keluarga. Pencairan ke pelaku yang menunggu rekening terkirim otomatis setelah rekeningnya disetujui.</p>
    {rows.length === 0 && <Card className="mt-3 p-5 text-sm text-muted">Tidak ada pencairan yang perlu tindakan.</Card>}
    <div className="mt-3 space-y-2">{rows.map(p => <Card key={p.id} className="p-4">
      <div className="flex flex-wrap items-center gap-2"><Badge tone={p.status === "failed" ? "red" : "sand"}>{p.status === "failed" ? "Gagal" : p.status === "awaiting_admin" ? "Menunggu pemeriksaan" : "Menunggu rekening"}</Badge><b className="text-ink">{payoutKind[p.kind] ?? p.kind}</b><span className="text-sm">{formatIDR(p.gross)} (diterima {formatIDR(Math.max(0, p.gross - p.fee))})</span></div>
      <p className="mt-1 text-[13px] text-muted">Kerja sama {p.case_id.slice(0, 8)} · {p.note}</p>
      {p.holder_name && <p className="mt-1 text-sm text-ink-soft">Ke: {bankName(p.bank_code)} · {p.account_number} · a.n. <b>{p.holder_name}</b></p>}
      {p.failure && <p className="mt-1 text-[13px] text-[#933A2F]">{p.failure}</p>}
      {(p.status === "failed" || (p.status === "awaiting_admin" && p.holder_name)) && <Button className="mt-2" size="sm" leading={<Send className="h-4 w-4" />} onClick={() => send(p)}>{p.status === "failed" ? "Kirim ulang" : "Nama cocok, kirim refund"}</Button>}
    </Card>)}</div>
  </section>;
}
