// UI simulation only. This module must never authorize real accounts or agreements.
export type ContactChannel = "email" | "whatsapp";
export type DemoChallenge = { contact: string; code: string; issuedAt: number; expiresAt: number; attempts: number; state: "pending" | "demo_passed" | "locked" | "expired"; passedAt?: number };
export function normalizeContact(channel: ContactChannel, raw: string): string | null {
  const value = raw.trim();
  if (channel === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254 ? value.toLowerCase() : null;
  let phone = value.replace(/[\s()-]/g, "");
  if (phone.startsWith("08")) phone = "+62" + phone.slice(1);
  else if (phone.startsWith("628")) phone = "+" + phone;
  return /^\+628\d{8,11}$/.test(phone) ? phone : null;
}
export function checkDemoCode(challenge: DemoChallenge, input: string, now: number): { challenge: DemoChallenge; message: string } {
  if (challenge.state !== "pending") return { challenge, message: "Kode tidak aktif atau sudah digunakan. Buat kode demo baru." };
  if (now >= challenge.expiresAt) return { challenge: { ...challenge, code: "", state: "expired" }, message: "Kode kedaluwarsa. Buat kode demo baru." };
  if (!/^\d{6}$/.test(input) || challenge.code !== input) {
    const attempts = challenge.attempts + 1;
    return { challenge: { ...challenge, attempts, state: attempts >= 5 ? "locked" : "pending", code: attempts >= 5 ? "" : challenge.code }, message: attempts >= 5 ? "Batas 5 percobaan tercapai. Buat kode demo baru setelah jeda." : "Kode salah. Periksa enam digit kode demo." };
  }
  return { challenge: { ...challenge, code: "", state: "demo_passed", passedAt: now }, message: "Simulasi berhasil. Ini bukan verifikasi kontak nyata." };
}
export function demoContactReady(challenge: DemoChallenge | null, raw: string, channel: ContactChannel, now: number): boolean {
  return !!challenge && challenge.state === "demo_passed" && challenge.contact === normalizeContact(channel, raw) && challenge.passedAt !== undefined && now - challenge.passedAt < 15 * 60_000;
}
