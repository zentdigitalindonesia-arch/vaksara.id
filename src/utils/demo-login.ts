// Akun demo untuk kompetisi: kata sandi sengaja ditampilkan karena semua data adalah contoh dan tersimpan di browser.
export type DemoRole = "couple" | "vendor" | "admin";
export const demoAccounts: { role: DemoRole; label: string; username: string; email: string; password: string; name: string; home: string }[] = [
  { role: "couple", label: "Keluarga / calon pengantin", username: "keluarga", email: "keluarga@demo.vaksara.id", password: "vaksara2026", name: "Nurul Amalia", home: "planner" },
  { role: "vendor", label: "Pelaku budaya / vendor", username: "pelaku", email: "pelaku@demo.vaksara.id", password: "vaksara2026", name: "Hj. Andi Nurhaeni", home: "vendor/ringkasan" },
  { role: "admin", label: "Peninjau VAKSARA", username: "peninjau", email: "peninjau@demo.vaksara.id", password: "vaksara2026", name: "Rani Saputri", home: "admin/overview" },
];
export const SESSION_KEY = "vaksara-session-v1";
export function demoLogin(id: string, password: string) {
  const key = id.trim().toLowerCase();
  const account = demoAccounts.find(a => a.username === key || a.email === key);
  if (!account || account.password !== password) return null;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ role: account.role, name: account.name, at: new Date().toISOString() })); } catch { /* penyimpanan tidak tersedia */ }
  return account;
}
export function demoSession(): { role: DemoRole; name: string } | null {
  try { const raw = localStorage.getItem(SESSION_KEY); const s = raw ? JSON.parse(raw) : null; return s && ["couple", "vendor", "admin"].includes(s.role) ? s : null; } catch { return null; }
}
export function demoLogout() { try { localStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ } }
