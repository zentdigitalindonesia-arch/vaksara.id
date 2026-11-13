// Klien Supabase ringan (Auth + REST) tanpa pustaka tambahan.
// Kunci publik (anon/publishable) aman berada di browser: akses data dibatasi Row Level Security di database.
const URL_ = (import.meta.env?.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";
export const liveEnabled = Boolean(URL_ && KEY);
const SESSION = "vx-auth-v1";

export type AuthUser = { id: string; email: string };
export type AuthSession = { access_token: string; refresh_token: string; expires_at: number; user: AuthUser };
export type SignUpMeta = { role: "couple" | "vendor"; full_name: string; phone: string; city: string };

const messages: [RegExp, string][] = [
  [/invalid login credentials/i, "Email atau kata sandi salah."],
  [/email not confirmed/i, "Email belum dikonfirmasi. Masukkan kode yang dikirim ke email Anda."],
  [/already registered|already been registered|user_already_exists/i, "Email ini sudah terdaftar. Silakan masuk atau gunakan Lupa kata sandi."],
  [/expired|invalid.*(token|otp)|otp.*invalid/i, "Kode salah atau sudah kedaluwarsa. Minta kode baru."],
  [/rate limit|too many|over_email_send_rate_limit|security purposes/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
  [/password.*(at least|short|weak)|weak_password/i, "Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan huruf dan angka."],
  [/unable to validate email|invalid.*email/i, "Format email tidak valid."],
  [/failed to fetch|networkerror|load failed/i, "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."],
  [/row-level security|permission denied|42501/i, "Akses ditolak untuk data ini."],
  [/duplicate key|23505/i, "Data dengan nama atau kode ini sudah ada."],
];
export function friendly(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  return messages.find(([re]) => re.test(raw))?.[1] ?? (raw || "Terjadi kesalahan. Coba lagi.");
}

export function storedSession(): AuthSession | null {
  try { const s = JSON.parse(localStorage.getItem(SESSION) ?? "null"); return s && s.access_token && s.user?.id ? s : null; } catch { return null; }
}
function save(s: AuthSession | null) { try { if (s) localStorage.setItem(SESSION, JSON.stringify(s)); else localStorage.removeItem(SESSION); } catch { /* penyimpanan tidak tersedia */ } }
function toSession(data: Record<string, unknown>): AuthSession {
  const user = data.user as { id: string; email?: string } | undefined;
  if (!data.access_token || !user?.id) throw new Error("Sesi tidak valid dari server.");
  const expiresIn = Number(data.expires_in ?? 3600);
  return { access_token: String(data.access_token), refresh_token: String(data.refresh_token ?? ""), expires_at: Math.floor(Date.now() / 1000) + expiresIn, user: { id: user.id, email: user.email ?? "" } };
}

async function auth(path: string, body: unknown, method = "POST", token?: string): Promise<Record<string, unknown>> {
  if (!liveEnabled) throw new Error("Akun belum diaktifkan di server ini.");
  const res = await fetch(`${URL_}/auth/v1/${path}`, { method, headers: { apikey: KEY, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); let data: Record<string, unknown> = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* bukan JSON */ }
  if (!res.ok) throw new Error(String(data.msg ?? data.error_description ?? data.message ?? data.error_code ?? data.error ?? `HTTP ${res.status}`));
  return data;
}

export async function signUp(email: string, password: string, meta: SignUpMeta): Promise<{ needsCode: boolean }> {
  const data = await auth("signup", { email: email.trim().toLowerCase(), password, data: meta });
  if (data.access_token) { save(toSession(data)); return { needsCode: false }; }
  const ids = (data.identities ?? (data.user as Record<string, unknown> | undefined)?.identities) as unknown[] | undefined;
  if (Array.isArray(ids) && ids.length === 0) throw new Error("User already registered");
  return { needsCode: true };
}
export async function verifyCode(email: string, token: string, type: "signup" | "recovery" | "email" = "signup"): Promise<AuthSession> {
  const s = toSession(await auth("verify", { type, email: email.trim().toLowerCase(), token: token.trim() })); save(s); return s;
}
export async function resendCode(email: string) { await auth("resend", { type: "signup", email: email.trim().toLowerCase() }); }
export async function sendRecovery(email: string) { await auth("recover", { email: email.trim().toLowerCase() }); }
export async function signIn(email: string, password: string): Promise<AuthSession> {
  const s = toSession(await auth("token?grant_type=password", { email: email.trim().toLowerCase(), password })); save(s); return s;
}
export async function updatePassword(password: string) { const s = await session(); if (!s) throw new Error("Sesi berakhir. Silakan masuk lagi."); await auth("user", { password }, "PUT", s.access_token); }
export async function signOut() { const s = storedSession(); save(null); if (s) { try { await auth("logout", {}, "POST", s.access_token); } catch { /* sesi lokal tetap dihapus */ } } }

let refreshing: Promise<AuthSession | null> | null = null;
export async function session(): Promise<AuthSession | null> {
  const s = storedSession(); if (!s) return null;
  if (s.expires_at - Date.now() / 1000 > 90) return s;
  refreshing ??= auth("token?grant_type=refresh_token", { refresh_token: s.refresh_token })
    .then(d => { const n = toSession(d); save(n); return n; })
    .catch(e => { if (/invalid|not found|revoked|expired/i.test(String(e))) save(null); return null; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function rest<T = unknown>(path: string, init: { method?: string; body?: unknown; prefer?: string; anon?: boolean; keepalive?: boolean } = {}): Promise<T> {
  if (!liveEnabled) throw new Error("Akun belum diaktifkan di server ini.");
  const s = init.anon ? null : await session();
  const res = await fetch(`${URL_}/rest/v1/${path}`, { method: init.method ?? "GET", keepalive: init.keepalive === true,headers: { apikey: KEY, Authorization: `Bearer ${s?.access_token ?? KEY}`, "Content-Type": "application/json", ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  const text = await res.text(); let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) { const d = (data ?? {}) as Record<string, unknown>; throw new Error(String(d.message ?? d.hint ?? d.code ?? `HTTP ${res.status}`)); }
  return data as T;
}
export const q = (v: string) => encodeURIComponent(v);
