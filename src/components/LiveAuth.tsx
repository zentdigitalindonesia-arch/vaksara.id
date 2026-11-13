import { useState } from "react";
import { Button, Field, Input, PasswordInput } from "@/components/ui";
import { friendly, resendCode, sendRecovery, signIn, signUp, updatePassword, verifyCode, type AuthSession } from "@/utils/supabase";
import { enterLive } from "@/LiveContext";

type Step = "masuk" | "daftar" | "kode" | "lupa" | "sandi-baru";
const strong = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p);
const normalPhone = (v: string) => v.replace(/[\s().-]/g, "").replace(/^0/, "+62").replace(/^62/, "+62");
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

async function finish(s: AuthSession, role?: string) {
  await enterLive(s);
  location.hash = role === "vendor" ? "#/vendor/profil" : "#/planner";
  location.reload();
}

/** Masuk dan daftar akun VAKSARA sungguhan (Supabase Auth, verifikasi kode email). */
export function LiveAuthForm({ initial = "masuk" }: { initial?: "masuk" | "daftar" }) {
  const [step, setStep] = useState<Step>(initial);
  const [purpose, setPurpose] = useState<"signup" | "recovery">("signup");
  const [f, setF] = useState({ role: "couple" as "couple" | "vendor", name: "", email: "", phone: "", city: "Makassar", password: "", code: "", agree: false });
  const [error, setError] = useState(""), [info, setInfo] = useState(""), [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof f>) => setF(prev => ({ ...prev, ...patch }));
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(""); try { await work(); } catch (e) { setError(friendly(e)); } finally { setBusy(false); } };

  const login = (e: React.FormEvent) => { e.preventDefault(); if (!validEmail(f.email) || !f.password) { setError("Isi email dan kata sandi."); return; } run(async () => { try { await finish(await signIn(f.email, f.password)); } catch (err) { if (/not confirmed/i.test(String(err))) { setPurpose("signup"); setStep("kode"); await resendCode(f.email).catch(() => undefined); setInfo(`Akun belum dikonfirmasi. Kode baru dikirim ke ${f.email}.`); return; } throw err; } }); };
  const register = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalPhone(f.phone);
    if (f.name.trim().length < 3) return setError(f.role === "vendor" ? "Isi nama Anda atau nama sanggar/usaha (min. 3 karakter)." : "Isi nama lengkap (min. 3 karakter).");
    if (!validEmail(f.email)) return setError("Format email tidak valid.");
    if (!/^\+628\d{7,12}$/.test(phone)) return setError("Nomor WhatsApp harus nomor Indonesia, contoh 0812 3456 7890.");
    if (!strong(f.password)) return setError("Kata sandi minimal 8 karakter dan memuat huruf serta angka.");
    if (!f.agree) return setError("Centang persetujuan penyimpanan data untuk melanjutkan.");
    run(async () => {
      const r = await signUp(f.email, f.password, { role: f.role, full_name: f.name.trim(), phone, city: f.city.trim() });
      if (!r.needsCode) { await finish((await signIn(f.email, f.password)), f.role); return; }
      setPurpose("signup"); setStep("kode"); setInfo(`Kode verifikasi dikirim ke ${f.email}. Periksa juga folder Spam/Promosi.`);
    });
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6,10}$/.test(f.code.trim())) return setError("Masukkan kode angka dari email.");
    run(async () => {
      const s = await verifyCode(f.email, f.code, purpose);
      if (purpose === "recovery") { setStep("sandi-baru"); setInfo("Kode benar. Buat kata sandi baru."); set({ code: "", password: "" }); void s; return; }
      await finish(s, f.role);
    });
  };
  const forgot = (e: React.FormEvent) => { e.preventDefault(); if (!validEmail(f.email)) return setError("Isi email akun Anda."); run(async () => { await sendRecovery(f.email); setPurpose("recovery"); setStep("kode"); setInfo(`Jika ${f.email} terdaftar, kode pemulihan sudah dikirim.`); }); };
  const newPassword = (e: React.FormEvent) => { e.preventDefault(); if (!strong(f.password)) return setError("Kata sandi minimal 8 karakter dan memuat huruf serta angka."); run(async () => { await updatePassword(f.password); const s = await signIn(f.email, f.password); await finish(s); }); };

  const msg = <>{info && <p role="status" className="rounded-xl bg-[#EEF7F1] p-2.5 text-[13px] text-[#1E5C38]">{info}</p>}{error && <p role="alert" className="text-sm font-semibold text-[#933A2F]">{error}</p>}</>;
  const link = (label: string, to: Step) => <button type="button" className="font-semibold text-ink underline" onClick={() => { setStep(to); setError(""); setInfo(""); }}>{label}</button>;

  if (step === "kode") return <form onSubmit={verify} className="space-y-3" aria-label="Verifikasi kode email">
    <p className="text-sm text-muted">Masukkan kode angka yang kami kirim ke <b className="text-ink">{f.email}</b>.</p>
    <Field label="Kode verifikasi"><Input aria-label="Kode verifikasi" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={f.code} onChange={e => set({ code: e.target.value.replace(/\D/g, "") })} placeholder="123456" /></Field>
    {msg}
    <Button type="submit" full disabled={busy}>{busy ? "Memeriksa…" : "Verifikasi"}</Button>
    <p className="text-center text-[13px] text-muted">Tidak menerima kode? <button type="button" disabled={busy} className="font-semibold text-ink underline" onClick={() => run(async () => { if (purpose === "signup") await resendCode(f.email); else await sendRecovery(f.email); setInfo("Kode baru sudah dikirim."); })}>Kirim ulang</button> · {link("Kembali", "masuk")}</p>
  </form>;
  if (step === "lupa") return <form onSubmit={forgot} className="space-y-3" aria-label="Lupa kata sandi">
    <p className="text-sm text-muted">Kami kirim kode pemulihan ke email akun Anda.</p>
    <Field label="Email"><Input aria-label="Email akun" type="email" autoComplete="email" value={f.email} onChange={e => set({ email: e.target.value })} /></Field>
    {msg}<Button type="submit" full disabled={busy}>{busy ? "Mengirim…" : "Kirim kode pemulihan"}</Button>
    <p className="text-center text-[13px] text-muted">{link("Kembali ke Masuk", "masuk")}</p>
  </form>;
  if (step === "sandi-baru") return <form onSubmit={newPassword} className="space-y-3" aria-label="Kata sandi baru">
    <Field label="Kata sandi baru" hint="Minimal 8 karakter, berisi huruf dan angka."><PasswordInput aria-label="Kata sandi baru" autoComplete="new-password" value={f.password} onChange={e => set({ password: e.target.value })} /></Field>
    {msg}<Button type="submit" full disabled={busy}>{busy ? "Menyimpan…" : "Simpan dan masuk"}</Button>
  </form>;
  if (step === "daftar") return <form onSubmit={register} className="space-y-3" aria-label="Daftar akun VAKSARA">
    <div role="radiogroup" aria-label="Daftar sebagai" className="grid grid-cols-2 gap-2">{([["couple", "Keluarga / calon pengantin"], ["vendor", "Pelaku budaya / vendor"]] as const).map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={f.role === v} onClick={() => set({ role: v })} className={`min-h-12 rounded-2xl px-3 py-2 text-left text-[13px] font-semibold ring-1 ${f.role === v ? "bg-ink text-cream ring-ink" : "bg-white text-ink ring-line"}`}>{l}</button>)}</div>
    <Field label={f.role === "vendor" ? "Nama Anda / nama sanggar" : "Nama lengkap"}><Input aria-label="Nama lengkap" autoComplete="name" maxLength={120} value={f.name} onChange={e => set({ name: e.target.value })} /></Field>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Email"><Input aria-label="Email daftar" type="email" autoComplete="email" value={f.email} onChange={e => set({ email: e.target.value })} /></Field>
      <Field label="Nomor WhatsApp"><Input aria-label="Nomor WhatsApp" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="0812 3456 7890" /></Field>
      <Field label="Kota / kabupaten"><Input aria-label="Kota" maxLength={80} value={f.city} onChange={e => set({ city: e.target.value })} /></Field>
      <Field label="Kata sandi" hint="Min. 8 karakter, huruf dan angka."><PasswordInput aria-label="Kata sandi daftar" autoComplete="new-password" value={f.password} onChange={e => set({ password: e.target.value })} /></Field>
    </div>
    <label className="flex items-start gap-2 text-[13px] text-ink-soft"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#123a33]" checked={f.agree} onChange={e => set({ agree: e.target.checked })} /><span>Saya setuju data akun (nama, email, WhatsApp, kota) disimpan VAKSARA untuk menjalankan layanan. Nomor WhatsApp tidak ditampilkan ke publik tanpa izin.</span></label>
    {msg}<Button type="submit" full disabled={busy}>{busy ? "Mendaftarkan…" : "Daftar dan kirim kode verifikasi"}</Button>
    <p className="text-center text-[13px] text-muted">Sudah punya akun? {link("Masuk", "masuk")}</p>
  </form>;
  return <form onSubmit={login} className="space-y-3" aria-label="Masuk akun VAKSARA">
    <Field label="Email"><Input aria-label="Email masuk" type="email" autoComplete="email" value={f.email} onChange={e => set({ email: e.target.value })} placeholder="nama@email.com" /></Field>
    <Field label="Kata sandi"><PasswordInput aria-label="Kata sandi akun" autoComplete="current-password" value={f.password} onChange={e => set({ password: e.target.value })} /></Field>
    {msg}<Button type="submit" full disabled={busy}>{busy ? "Masuk…" : "Masuk"}</Button>
    <p className="text-center text-[13px] text-muted">{link("Lupa kata sandi?", "lupa")} · Belum punya akun? {link("Daftar", "daftar")}</p>
  </form>;
}
