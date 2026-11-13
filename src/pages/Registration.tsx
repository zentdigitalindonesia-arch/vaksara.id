import { useState } from "react";
import { Alert, Button, Card, Checkbox, Field, Input } from "@/components/ui";
import { ChannelCard, useContactDemo } from "@/pages/ContactVerification";
import { useCooperation } from "@/CooperationContext";
import { useApp } from "@/store";
import { demoContactReady, normalizeContact } from "@/utils/contact-demo";

export default function Registration() {
  const { role, navigate } = useApp();
  const actor = role === "vendor" ? "vendor" : "couple";
  const { flow, dispatch, error } = useCooperation();
  const { contacts, challenges, update, demoReady } = useContactDemo();
  const account = flow.accounts[actor];
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const home = actor === "vendor" ? "vendor/ringkasan" : "planner";
  const advance = () => {
    if (!name.trim()) { setMessage("Isi nama yang akan ditampilkan dalam kerja sama."); return; }
    if (!normalizeContact("email", contacts.email) || !normalizeContact("whatsapp", contacts.whatsapp)) { setMessage("Lengkapi alamat email dan nomor WhatsApp Indonesia yang valid."); return; }
    if (!consent) { setMessage("Persetujuan penggunaan data demo diperlukan untuk melanjutkan."); return; }
    setMessage(""); setStep(1);
  };
  return <div className="mx-auto max-w-xl px-4 py-10">
    <button className="mb-5 text-sm underline" onClick={() => navigate("beranda")}>Kembali ke beranda</button>
    <h1 className="font-display text-3xl">{account ? "Akun demo Anda sudah tersedia" : actor === "vendor" ? "Daftar sebagai vendor" : "Daftar sebagai calon pengantin / keluarga"}</h1>
    <p className="mt-3 text-sm text-muted">{actor === "vendor" ? "Kelola penawaran dan layanan budaya Anda. Pemeriksaan profil vendor dilakukan setelah pendaftaran." : "Temukan layanan dan rencanakan rangkaian acara bersama keluarga."}</p>
    {account ? <Card className="mt-6 space-y-4 p-6"><h2 className="font-display text-xl">{account.name}</h2><p className="text-sm">{account.email}</p><p className="text-sm text-muted">Browser ini sudah memiliki satu akun contoh untuk peran ini. Membuka ruang kerja akan mempertahankan seluruh permintaan dan perjanjian yang ada.</p><Button full onClick={() => navigate(home)}>Buka ruang {actor === "vendor" ? "vendor" : "keluarga"}</Button><Button full variant="secondary" onClick={() => navigate(actor === "vendor" ? "akun/daftar" : "vendor/daftar")}>Ganti peran</Button></Card> : <>
      <ol aria-label="Tahapan pendaftaran" className="my-6 grid grid-cols-3 gap-2 text-sm">{["Identitas", "Email", "WhatsApp"].map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={`rounded-lg border p-3 ${step === i ? "bg-ink text-white" : "border-line"}`}>{i + 1}. {label}</li>)}</ol>
      <Alert tone="info" title="Pendaftaran demo">Gunakan data contoh. Kode OTP dibuat di browser; belum ada pesan sungguhan yang dikirim.</Alert>
      {step === 0 && <Card className="mt-4 space-y-4 p-5">
        <Field label={actor === "vendor" ? "Nama usaha / sanggar" : "Nama lengkap"} required><Input aria-label="Nama pendaftaran" autoComplete="name" value={name} maxLength={150} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Email" required><Input aria-label="Email pendaftaran" type="email" autoComplete="email" value={contacts.email} onChange={e => update("email", e.target.value)} /></Field>
        <Field label="Nomor WhatsApp" required><Input aria-label="WhatsApp pendaftaran" type="tel" autoComplete="tel" placeholder="Contoh: 081234567890" value={contacts.whatsapp} onChange={e => update("whatsapp", e.target.value)} /></Field>
        <Checkbox checked={consent} onChange={setConsent} label="Saya menyetujui penggunaan data contoh untuk simulasi pendaftaran dan komunikasi kerja sama di perangkat ini." />
        {message && <p role="alert" className="text-sm">{message}</p>}
        <Button full onClick={advance}>Lanjut verifikasi email</Button>
        <Button full variant="ghost" onClick={() => navigate(actor === "vendor" ? "akun/daftar" : "vendor/daftar")}>Ganti peran</Button>
      </Card>}
      {step > 0 && <div className="mt-4 space-y-4"><ChannelCard key={step} channel={step === 1 ? "email" : "whatsapp"} />
        {error && <p role="alert" className="text-sm">{error}</p>}
        {step === 1 ? <Button full disabled={flow.accounts[actor] !== null || !contacts.email || !demoContactReady(challenges.email, contacts.email, "email", Date.now())} onClick={() => setStep(2)}>Lanjut verifikasi WhatsApp</Button> : <Button full disabled={!demoReady} onClick={() => { if (dispatch({ type: "register", actor, data: { name, email: normalizeContact("email", contacts.email), phone: normalizeContact("whatsapp", contacts.whatsapp), consent, contactDemoPassed: demoReady } })) navigate(home); }}>Selesaikan pendaftaran demo</Button>}
        <Button full variant="secondary" onClick={() => setStep(step - 1)}>Kembali ke {step === 1 ? "identitas" : "email"}</Button>
      </div>}
    </>}
  </div>;
}
