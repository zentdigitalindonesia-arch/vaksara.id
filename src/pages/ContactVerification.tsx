import { createContext, useContext, useEffect, useState, type ReactNode, type SetStateAction } from "react";
import { Alert, Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { useApp } from "@/store";
import { checkDemoCode, demoContactReady, normalizeContact, type ContactChannel, type DemoChallenge } from "@/utils/contact-demo";

type ContactValue = { contacts: Record<ContactChannel, string>; challenges: Record<ContactChannel, DemoChallenge | null>; update: (channel: ContactChannel, value: string) => void; issue: (channel: ContactChannel) => string; confirm: (channel: ContactChannel, code: string) => string; demoReady: boolean; reset: () => void };
const ContactContext = createContext<ContactValue | null>(null);
export function ContactDemoProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<"couple" | "vendor">(() => window.location.hash.includes("vendor/") ? "vendor" : "couple");
  useEffect(() => { const sync = () => setScope(window.location.hash.includes("vendor/") ? "vendor" : "couple"); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  const [allContacts, setAllContacts] = useState({ couple: { email: "pengguna@example.com", whatsapp: "" }, vendor: { email: "vendor@example.test", whatsapp: "" } });
  const [allChallenges, setAllChallenges] = useState<Record<"couple" | "vendor", Record<ContactChannel, DemoChallenge | null>>>({ couple: { email: null, whatsapp: null }, vendor: { email: null, whatsapp: null } });
  const contacts = allContacts[scope], challenges = allChallenges[scope];
  const setContacts = (value: SetStateAction<typeof contacts>) => setAllContacts(prev => ({ ...prev, [scope]: typeof value === "function" ? value(prev[scope]) : value }));
  const setChallenges = (value: SetStateAction<typeof challenges>) => setAllChallenges(prev => ({ ...prev, [scope]: typeof value === "function" ? value(prev[scope]) : value }));
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const update = (channel: ContactChannel, value: string) => { setContacts((prev) => ({ ...prev, [channel]: value })); setChallenges((prev) => ({ ...prev, [channel]: null })); };
  const issue = (channel: ContactChannel) => {
    const contact = normalizeContact(channel, contacts[channel]);
    if (!contact) return channel === "email" ? "Isi alamat email yang valid." : "Isi nomor seluler Indonesia, misalnya 08… atau +628….";
    const current = challenges[channel];
    const issuedAt = Date.now();
    if (current && issuedAt - current.issuedAt < 60_000) return "Tunggu 60 detik sebelum membuat kode berikutnya.";
    const random = crypto.getRandomValues(new Uint32Array(1))[0];
    setChallenges((prev) => ({ ...prev, [channel]: { contact, code: String(100000 + random % 900000), issuedAt, expiresAt: issuedAt + 5 * 60_000, attempts: 0, state: "pending" } }));
    return "Kode demo dibuat di browser. Tidak ada email atau pesan WhatsApp yang dikirim.";
  };
  const confirm = (channel: ContactChannel, code: string) => {
    const current = challenges[channel];
    if (!current || current.contact !== normalizeContact(channel, contacts[channel])) return "Buat kode demo untuk kontak ini terlebih dahulu.";
    const result = checkDemoCode(current, code, Date.now());
    setChallenges((prev) => ({ ...prev, [channel]: result.challenge }));
    return result.message;
  };
  const demoReady = demoContactReady(challenges.email, contacts.email, "email", now) && demoContactReady(challenges.whatsapp, contacts.whatsapp, "whatsapp", now);
  return <ContactContext.Provider value={{ contacts, challenges, update, issue, confirm, demoReady, reset: () => { setContacts({ email: "pengguna@example.com", whatsapp: "" }); setChallenges({ email: null, whatsapp: null }); } }}>{children}</ContactContext.Provider>;
}
export function useContactDemo() { const ctx = useContext(ContactContext); if (!ctx) throw new Error("ContactDemoProvider missing"); return ctx; }

export function ChannelCard({ channel }: { channel: ContactChannel }) {
  const { contacts, challenges, update, issue, confirm } = useContactDemo();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState(false);
  const challenge = challenges[channel];
  const label = channel === "email" ? "Email / Gmail" : "WhatsApp";
  const cooldown = challenge ? Math.max(0, Math.ceil((challenge.issuedAt + 60_000 - Date.now()) / 1000)) : 0;
  const expired = !!challenge && Date.now() >= challenge.expiresAt && challenge.state === "pending";
  const ready = demoContactReady(challenge, contacts[channel], channel, Date.now());
  return <Card className="p-5" id={`contact-${channel}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl">{label}</h2><Badge tone={ready ? "sand" : "neutral"}>{ready ? "Simulasi berhasil" : "Belum terverifikasi nyata"}</Badge></div>
    <p className="mt-2 text-sm text-muted">{channel === "email" ? "Kode melalui email, tanpa kata sandi Google atau akses kotak masuk." : "Kode melalui WhatsApp untuk memeriksa penguasaan nomor kontak."}</p>
    <Field label={label} required><Input aria-label={`Kontak ${channel}`} type={channel === "email" ? "email" : "tel"} autoComplete="off" maxLength={254} value={contacts[channel]} onChange={(e) => { update(channel, e.target.value); setCode(""); setMessage(""); setRevealed(false); }} placeholder={channel === "email" ? "pengguna@example.com" : "+628…"} /></Field>
    <Button className="mt-3" size="sm" variant="secondary" disabled={cooldown > 0} onClick={() => { setMessage(issue(channel)); setCode(""); setRevealed(false); }}>{cooldown ? `Buat ulang dalam ${cooldown} dtk` : "Buat kode demo"}</Button>
    {challenge && <div className="mt-4 space-y-3 rounded-lg border border-line p-3">
      <p className="text-sm text-muted">Kode berlaku 5 menit · maksimal 5 percobaan · simulasi lokal.</p>
      {challenge.state === "pending" && !expired && <>
        <Button size="sm" variant="ghost" onClick={() => setRevealed((v) => !v)}>Lihat kode demo {label}</Button>
        {revealed && <p className="font-mono text-xl tracking-widest" data-testid={`demo-code-${channel}`}>{challenge.code}</p>}
        <Input aria-label={`Kode OTP ${channel}`} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6 digit kode demo" />
        <Button size="sm" onClick={() => setMessage(confirm(channel, code))}>Periksa kode demo {label}</Button>
      </>}
      {expired && <p className="text-sm text-muted">Kode kedaluwarsa. Buat kode demo baru.</p>}
      {challenge.state === "locked" && <p className="text-sm text-muted">Batas percobaan tercapai. Tunggu jeda, lalu buat kode baru.</p>}
    </div>}
    {message && <p className="mt-3 text-sm text-ink" role="status">{message}</p>}
  </Card>;
}
export default function ContactVerification() {
  const { demoReady, reset } = useContactDemo();
  const { navigate, role, route } = useApp();
  const requestedReturn = new URLSearchParams(route.split("?")[1] ?? "").get("returnTo");
  const safeReturn = requestedReturn && (role === "vendor" ? /^vendor\/kontrak\?case=[a-zA-Z0-9_-]+$/ : /^trust\?case=[a-zA-Z0-9_-]+$/).test(requestedReturn) ? requestedReturn : null;
  return <>
    <PageHeader title="Verifikasi kontak" description={role === "vendor" ? "Email dan WhatsApp untuk akun vendor dan komunikasi kerja sama." : "Email dan WhatsApp untuk komunikasi kerja sama."} back={role === "vendor" ? { label: "Kembali ke ruang vendor", onClick: () => navigate("vendor/ringkasan") } : undefined} />
    <Alert tone="warn" title="Pengiriman OTP belum aktif">Akun layanan email dan WhatsApp belum dikonfigurasi. Gunakan kontak contoh; kode hanya dibuat di browser dan bukan bukti penguasaan email atau nomor.</Alert>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><ChannelCard channel="email" /><ChannelCard channel="whatsapp" /></div>
    <Card className="mt-4 p-5"><h2 className="font-display text-xl">Kesiapan perjanjian</h2><p className="mt-2 text-sm text-muted">{demoReady ? "Kedua alur simulasi selesai. Anda dapat mencoba persetujuan demo selama 15 menit." : "Selesaikan kedua alur kontak untuk mencoba persetujuan demo."}</p><p className="mt-2 text-sm text-muted">Verifikasi kontak bukan pemeriksaan identitas atau tanda tangan elektronik. Perjanjian nyata memerlukan sesi dan otorisasi server, pemeriksaan para pihak, serta bukti persetujuan terhadap versi dokumen.</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={!demoReady} onClick={() => navigate(safeReturn ?? (role === "vendor" ? "vendor/kontrak" : "trust"))}>Lanjut ke perjanjian demo</Button><Button size="sm" variant="secondary" onClick={reset}>Reset simulasi kontak</Button><Button size="sm" variant="secondary" onClick={() => navigate(role === "vendor" ? "vendor/alur" : "planner/alur")}>Kembali ke pendaftaran alur</Button></div></Card>
  </>;
}
