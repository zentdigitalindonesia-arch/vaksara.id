import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { Alert, Badge, Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { bankName, banks, payoutKind } from "@/components/BankAccount";
import { formatIDR } from "@/data";
import { useApp } from "@/store";
import { useCooperation } from "@/CooperationContext";
import { amanahOf, amanahShare, confirmedTotal, heldPart, reservedTotal, type Actor, type Cooperation } from "@/utils/cooperation";
import { callFunction, friendly, q, rest } from "@/utils/supabase";

// Panel pembayaran Dana Amanah sungguhan (Xendit) untuk akun nyata: dari siapa, untuk siapa, berapa ditahan,
// berapa diteruskan, ke rekening mana, dan status setiap transfer. Semua angka dibaca dari server.
type Summary = { bank_code: string; holder_name: string; last4: string; status: string };
type Payment = { id: string; amount: number; fee: number; held: number; status: string; invoice_url: string | null; method: string; expires_at: string | null; paid_at: string | null; created_at: string };
type Payout = { id: string; kind: string; recipient: string; gross: number; fee: number; bank_code: string | null; account_number: string | null; holder_name: string | null; status: string; failure: string; created_at: string };
const OPEN = ["active", "running", "handover", "revision", "accepted"];
const payoutStatus: Record<string, [string, string]> = {
  awaiting_account: ["Menunggu rekening", "sand"], awaiting_admin: ["Diperiksa peninjau", "sand"], queued: ["Antre", "sand"],
  processing: ["Sedang dikirim", "blue"], succeeded: ["Terkirim", "green"], failed: ["Tertunda, diperiksa peninjau", "red"],
};
const when = (iso: string | null) => iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export function EscrowPanel({ item, actor, act }: { item: Cooperation; actor: Actor; act: (type: string, data?: Record<string, unknown>) => void }) {
  const { toast } = useApp();
  const { reload } = useCooperation();
  const [info, setInfo] = useState<{ vendorId: string; couple: string } | null>(null);
  const [acc, setAcc] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]), [payouts, setPayouts] = useState<Payout[]>([]);
  const a = amanahOf(item), share = amanahShare(item.offer), price = item.offer?.price ?? 0;
  const pendingInvoices = payments.filter(p => p.status === "pending" && (!p.expires_at || Date.parse(p.expires_at) > Date.now()));
  const remaining = Math.max(0, price - reservedTotal(item) - pendingInvoices.reduce((s, p) => s + p.amount, 0));
  const [amount, setAmount] = useState(""), [busy, setBusy] = useState(false), [ack, setAck] = useState(false);
  const [releaseAmount, setReleaseAmount] = useState(""), [note, setNote] = useState("");
  const load = useCallback(async () => {
    try {
      const [row] = await rest<{ vendor_id: string; couple_name: string }[]>(`cooperations?select=vendor_id,couple_name&id=eq.${q(item.id)}`);
      if (row) {
        setInfo({ vendorId: row.vendor_id, couple: row.couple_name || "Keluarga" });
        const [s] = await rest<Summary[]>("rpc/payout_account_summary", { method: "POST", body: { p_vendor: row.vendor_id } }).catch(() => []);
        setAcc(s ?? null);
      }
      setPayments(await rest<Payment[]>(`escrow_payments?select=*&case_id=eq.${q(item.id)}&order=created_at.desc`));
      setPayouts(await rest<Payout[]>(`escrow_payouts?select=*&case_id=eq.${q(item.id)}&order=created_at.desc`));
    } catch { /* tampilkan yang ada */ }
  }, [item.id]);
  useEffect(() => { load(); }, [load, item.history.length]);
  // Menunggu kabar Xendit (pembayaran atau transfer): periksa ulang berkala.
  const waiting = pendingInvoices.length > 0 || payouts.some(p => ["queued", "processing"].includes(p.status));
  useEffect(() => { if (!waiting) return; const t = window.setInterval(() => { load(); reload(); }, 15000); return () => window.clearInterval(t); }, [waiting, load, reload]);
  useEffect(() => { setAmount(String(Math.max(0, confirmedTotal(item) < (item.offer?.deposit ?? 0) ? (item.offer?.deposit ?? 0) - reservedTotal(item) : remaining))); }, [item.id, remaining]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setReleaseAmount(String(a.held)); }, [a.held]);

  const pay = async () => {
    const n = Number(amount);
    if (!Number.isSafeInteger(n) || n <= 0) { toast("Tulis nominal rupiah bulat.", "warn"); return; }
    if (!ack) { toast("Centang persetujuan Dana Amanah terlebih dahulu.", "warn"); return; }
    const win = window.open("", "_blank");
    setBusy(true);
    try {
      const res = await callFunction<{ payment: Payment }>("cooperation-action", { caseId: item.id, action: { type: "pay_invoice", id: crypto.randomUUID(), data: { amount: n } } });
      await load();
      if (res.payment?.invoice_url) { if (win) win.location.href = res.payment.invoice_url; else window.location.href = res.payment.invoice_url; }
      else win?.close();
      toast("Tagihan dibuat. Selesaikan pembayaran di halaman Xendit; status diperbarui otomatis.", "success");
    } catch (e) { win?.close(); toast(friendly(e), "error"); } finally { setBusy(false); setAck(false); }
  };
  const saveRefundAccount = async (p: Payout, f: { bank: string; number: string; holder: string }) => {
    try { await callFunction("cooperation-action", { caseId: item.id, action: { type: "refund_account", id: crypto.randomUUID(), data: { payoutId: p.id, bankCode: f.bank, accountNumber: f.number, holderName: f.holder } } }); toast("Rekening refund tersimpan. Peninjau memeriksa lalu mengirim refund.", "success"); load(); }
    catch (e) { toast(friendly(e), "error"); }
  };

  const open = OPEN.includes(item.phase);
  const n = Number(amount) || 0;
  return <div className="rounded-lg border border-[#2E7D4F]/40 bg-[#F3FAF5] p-3" aria-label="Dana Amanah">
    <div className="flex flex-wrap items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#2E7D4F]" /><h3 className="font-semibold">Dana Amanah {share < 100 ? `${share}%` : "penuh"}</h3><Badge tone="green">Lewat Xendit</Badge></div>

    <div className="mt-2 rounded-md bg-white p-3 text-sm" aria-label="Alur dana">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">Alur dana setiap pembayaran</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5"><b>{info?.couple ?? "Keluarga"}</b><ArrowRight className="h-4 w-4 text-muted" /><span>tagihan Xendit (virtual account)</span></div>
      <ul className="mt-1.5 space-y-1 text-ink-soft">
        <li>• <b>{share}%</b> ditahan di Dana Amanah VAKSARA (disimpan di akun VAKSARA pada Xendit), cair hanya bila satu pihak mengusulkan dan pihak lain menyetujui. Tidak ada batas waktu penahanan.</li>
        {share < 100 && <li>• <b>{100 - share}%</b> langsung diteruskan ke rekening pelaku.</li>}
        <li className="flex flex-wrap items-center gap-1">• Rekening pelaku: {acc ? <><Landmark className="h-3.5 w-3.5" /><b>{acc.holder_name}</b> · {bankName(acc.bank_code)} ••{acc.last4} {acc.status !== "approved" && <Badge tone="sand">belum disetujui; pencairan ditahan</Badge>}</> : <span className="text-[#933A2F]">belum diisi pelaku</span>}</li>
        <li>• Biaya bayar ditambahkan ke tagihan keluarga. Biaya transfer keluar dipotong dari jumlah yang diterima.</li>
      </ul>
    </div>

    <div className="mt-2 grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
      {([["Dibayar keluarga", confirmedTotal(item)], ["Ditahan", a.held], ["Ke pelaku", a.released], ["Kembali ke keluarga", a.refunded]] as [string, number][]).map(([l, v]) => <div key={l} className="min-w-0 rounded-md bg-white p-2"><p className="text-muted">{l}</p><p className="font-bold">{formatIDR(v)}</p></div>)}
    </div>
    <p className="mt-2 text-sm">Nilai perjanjian {formatIDR(price)} · belum ditagih {formatIDR(remaining)}</p>

    {actor === "couple" && open && remaining > 0 && <div className="mt-3 border-t border-line pt-3">
      <Field label={`Bayar sekarang (maks. ${formatIDR(remaining)})`}><Input aria-label="Nominal pembayaran Dana Amanah" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
      {n > 0 && <p className="mt-1 text-[13px] text-muted">Dari {formatIDR(n)}: {formatIDR(heldPart(item.offer, n))} ditahan{share < 100 ? `, ${formatIDR(n - heldPart(item.offer, n))} diteruskan ke rekening pelaku` : ""}. Biaya bayar ditambahkan dan terlihat di halaman Xendit.</p>}
      <Checkbox checked={ack} onChange={setAck} label="Saya memahami alur dana di atas: bagian Dana Amanah ditahan dan hanya cair dengan persetujuan kedua pihak." />
      <Button className="mt-2" size="sm" disabled={busy} leading={<ExternalLink className="h-4 w-4" />} onClick={pay}>{busy ? "Membuat tagihan…" : "Buat tagihan & bayar"}</Button>
    </div>}
    {pendingInvoices.length > 0 && <div className="mt-3 space-y-1">{pendingInvoices.map(p => <p key={p.id} className="flex flex-wrap items-center gap-2 text-sm"><Badge tone="sand">Menunggu dibayar</Badge>{formatIDR(p.amount + p.fee)} (termasuk biaya {formatIDR(p.fee)}) · berlaku sampai {when(p.expires_at)}{actor === "couple" && p.invoice_url && <a className="font-semibold text-ink underline" href={p.invoice_url} target="_blank" rel="noopener noreferrer">Lanjutkan bayar</a>}</p>)}</div>}

    {a.release && <Alert tone="warn" title={`Usulan pencairan ${formatIDR(a.release.amount)} dari ${a.release.by === "vendor" ? "pelaku" : "keluarga"}`}>{a.release.note}</Alert>}
    {a.release && a.release.by !== actor && actor !== "admin" && open && <div className="mt-2">
      <Checkbox checked={ack} onChange={setAck} label={actor === "couple" ? `Saya menyetujui pencairan ${formatIDR(a.release.amount)} ke rekening ${acc?.holder_name ?? "pelaku"}${acc ? ` (${bankName(acc.bank_code)} ••${acc.last4})` : ""}.` : `Saya menyetujui pencairan ${formatIDR(a.release.amount)} ke rekening saya.`} />
      <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" onClick={() => { act("approve_release", { ack }); setAck(false); }}>Setujui pencairan</Button></div>
      <Field label="Alasan bila menolak"><Textarea aria-label="Alasan menolak pencairan" value={note} onChange={e => setNote(e.target.value)} /></Field>
      <Button size="sm" variant="secondary" onClick={() => act("reject_release", { note })}>Tolak usulan pencairan</Button>
    </div>}
    {!a.release && a.held > 0 && actor !== "admin" && open && <details className="mt-3" open={actor === "vendor" && item.phase === "accepted"}>
      <summary className="cursor-pointer text-sm font-semibold">{actor === "vendor" ? "Ajukan pencairan ke rekening Anda" : "Lepaskan dana lebih awal ke pelaku (opsional)"}</summary>
      <Field label={`Nominal (maks. ${formatIDR(a.held)})`}><Input aria-label="Nominal pencairan" inputMode="numeric" value={releaseAmount} onChange={e => setReleaseAmount(e.target.value)} /></Field>
      <Field label="Alasan / tahap yang selesai"><Textarea aria-label="Catatan pencairan" value={note} onChange={e => setNote(e.target.value)} /></Field>
      <Button size="sm" onClick={() => act("propose_release", { amount: Number(releaseAmount), note })}>{actor === "vendor" ? "Kirim usulan pencairan" : "Lepaskan dana ke pelaku"}</Button>
    </details>}
    {item.phase === "disputed" && <p className="mt-2 text-sm font-semibold text-[#933A2F]">Sengketa: Dana Amanah dibekukan sampai mediasi selesai.</p>}

    {(payments.some(p => p.status !== "pending") || payouts.length > 0) && <details className="mt-3" open>
      <summary className="cursor-pointer text-sm font-semibold">Riwayat dana ({payments.filter(p => p.status === "paid").length} pembayaran, {payouts.length} transfer keluar)</summary>
      <ul className="mt-2 space-y-1.5 text-[13px]">
        {payments.filter(p => p.status !== "pending").map(p => <li key={p.id} className="rounded-md bg-white p-2"><b>Masuk</b> dari {info?.couple ?? "keluarga"}: {formatIDR(p.amount)} · {p.status === "paid" ? `dibayar ${when(p.paid_at)}${p.method ? ` (${p.method})` : ""} · ditahan ${formatIDR(p.held)}` : p.status === "expired" ? "kedaluwarsa, tidak dibayar" : "gagal dibuat"}</li>)}
        {payouts.map(p => {
          const [label, tone] = payoutStatus[p.status] ?? [p.status, "neutral"]; return <li key={p.id} className="rounded-md bg-white p-2">
            <div className="flex flex-wrap items-center gap-2"><b>Keluar</b> · {payoutKind[p.kind] ?? p.kind} · {formatIDR(p.gross)} <span className="text-muted">(biaya transfer {formatIDR(p.fee)}, diterima {formatIDR(Math.max(0, p.gross - p.fee))})</span><Badge tone={tone}>{label}</Badge></div>
            <p className="text-muted">Untuk: {p.recipient === "vendor" ? "pelaku" : "keluarga"}{p.holder_name ? ` · ${p.holder_name} · ${bankName(p.bank_code)} ••${(p.account_number ?? "").slice(-4)}` : ""}</p>
            {p.recipient === "couple" && actor === "couple" && ["awaiting_account", "failed"].includes(p.status) && <RefundAccountForm onSave={f => saveRefundAccount(p, f)} />}
          </li>;
        })}
      </ul>
    </details>}
  </div>;
}

function RefundAccountForm({ onSave }: { onSave: (f: { bank: string; number: string; holder: string }) => void }) {
  const [f, setF] = useState({ bank: "ID_BCA", number: "", holder: "" });
  return <div className="mt-2 grid gap-2 sm:grid-cols-3" aria-label="Rekening refund">
    <p className="text-[13px] text-ink sm:col-span-3"><b>Isi rekening tujuan refund.</b> Gunakan rekening atas nama Anda sesuai KTP; peninjau mencocokkannya sebelum mengirim.</p>
    <Select aria-label="Bank refund" value={f.bank} onChange={e => setF({ ...f, bank: e.target.value })}>{banks.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</Select>
    <Input aria-label="Nomor rekening refund" inputMode="numeric" placeholder="Nomor rekening" value={f.number} onChange={e => setF({ ...f, number: e.target.value })} />
    <Input aria-label="Atas nama rekening refund" placeholder="Atas nama" value={f.holder} onChange={e => setF({ ...f, holder: e.target.value })} />
    <div className="sm:col-span-3"><Button size="sm" onClick={() => onSave(f)}>Simpan rekening refund</Button></div>
  </div>;
}
