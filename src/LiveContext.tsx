import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { friendly, liveEnabled, q, rest, session, signOut, storedSession, type AuthSession } from "@/utils/supabase";

// Mode akun nyata: aktif bila server Supabase dikonfigurasi dan pengguna masuk dengan akun VAKSARA.
// Akun demo tetap memakai data contoh di browser.
export type Profile = { id: string; role: "couple" | "vendor"; full_name: string; phone: string; city: string; is_admin: boolean; created_at?: string };
export type Listing = { id: string; name: string; category: string; area: string; description: string; price_from: number | null; whatsapp: string; instagram: string; tiktok: string; facebook: string; published: boolean; review_status: "pending" | "approved" | "rejected"; review_note: string; identity_ok: boolean; culture_ok: boolean; consent_ok: boolean; created_at?: string; updated_at?: string };
export type ListingInput = Pick<Listing, "name" | "category" | "area" | "description" | "price_from" | "whatsapp" | "instagram" | "tiktok" | "facebook" | "published">;

const LIVE_USER = "vx-live-user";
const BASELINE = "vx-synced";
// Data perencanaan pribadi yang disimpan per akun di tabel user_state.
export const SYNC_KEYS = ["vaksara-event-plan-v1", "vaksara-planner-checklist-v1", "vaksara-planner-guests-v1", "vaksara-planner-expenses-v1"] as const;
const BLANK: Record<string, string> = {
  "vaksara-event-plan-v1": JSON.stringify({ schema: 1, name: "", date: "", location: "", budget: "", needs: [], step: 0, complete: false }),
  "vaksara-planner-checklist-v1": "[]",
  "vaksara-planner-guests-v1": "[]",
  "vaksara-planner-expenses-v1": "[]",
};

/** Dipakai saat render pertama: true bila browser ini sedang memakai akun nyata. */
export function liveBoot(): boolean {
  if (!liveEnabled) return false;
  const s = storedSession();
  try { return Boolean(s && localStorage.getItem(LIVE_USER) === s.user.id); } catch { return false; }
}
export function liveUserId(): string { return storedSession()?.user.id ?? ""; }

function clearAppData() {
  try { Object.keys(localStorage).filter(k => k.startsWith("vaksara-") && !k.startsWith("vaksara-owner")).forEach(k => localStorage.removeItem(k)); } catch { /* abaikan */ }
}

/** Memuat data pribadi akun ke browser lalu menandai mode akun nyata. Panggil location.reload() sesudahnya. */
export async function enterLive(s: AuthSession) {
  const rows = await rest<{ key: string; value: unknown }[]>(`user_state?select=key,value&user_id=eq.${q(s.user.id)}`);
  clearAppData();
  const baseline: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    const row = rows.find(r => r.key === key);
    const value = row ? JSON.stringify(row.value) : BLANK[key];
    localStorage.setItem(key, value); baseline[key] = row ? value : "";
  }
  localStorage.setItem(BASELINE, JSON.stringify(baseline));
  localStorage.setItem(LIVE_USER, s.user.id);
}
export async function leaveLive() {
  await flushState(true).catch(() => undefined);
  await signOut();
  clearAppData();
  try { localStorage.removeItem(LIVE_USER); localStorage.removeItem(BASELINE); } catch { /* abaikan */ }
}

let flushing: Promise<void> | null = null;
async function flushState(keepalive = false): Promise<void> {
  if (!liveBoot()) return;
  if (flushing) return flushing;
  flushing = (async () => {
    const uid = liveUserId();
    const baseline: Record<string, string> = JSON.parse(localStorage.getItem(BASELINE) ?? "{}");
    const changed = SYNC_KEYS.map(key => [key, localStorage.getItem(key)] as const).filter(([key, v]) => v !== null && v !== baseline[key]);
    if (!changed.length) return;
    const body = changed.map(([key, v]) => ({ user_id: uid, key, value: JSON.parse(v!), updated_at: new Date().toISOString() }));
    await rest("user_state", { method: "POST", body, prefer: "resolution=merge-duplicates,return=minimal", keepalive });
    changed.forEach(([key, v]) => { baseline[key] = v!; });
    localStorage.setItem(BASELINE, JSON.stringify(baseline));
  })().finally(() => { flushing = null; });
  return flushing;
}

type SyncStatus = "saved" | "saving" | "error";
type LiveAPI = {
  live: boolean; ready: boolean; email: string; profile: Profile | null; listing: Listing | null; syncStatus: SyncStatus; error: string;
  refresh: () => Promise<void>; saveProfile: (p: Pick<Profile, "full_name" | "phone" | "city">) => Promise<void>; saveListing: (l: ListingInput) => Promise<Listing>; logout: () => Promise<void>;
};
const Ctx = createContext<LiveAPI | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [live] = useState(liveBoot);
  const [ready, setReady] = useState(!live);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [error, setError] = useState("");
  const uid = useRef(liveUserId());

  const refresh = useCallback(async () => {
    if (!live) return;
    try {
      const s = await session();
      if (!s) { await leaveLive(); location.hash = "#/beranda"; location.reload(); return; }
      const [p] = await rest<Profile[]>(`profiles?select=*&id=eq.${q(s.user.id)}`);
      setProfile(p ?? null);
      if (p?.role === "vendor") { const [l] = await rest<Listing[]>(`vendor_listings?select=*&id=eq.${q(s.user.id)}`); setListing(l ?? null); }
      setError("");
    } catch (e) { setError(friendly(e)); }
    finally { setReady(true); }
  }, [live]);

  useEffect(() => {
    // Sesi tersimpan tetapi data akun belum dimuat ke browser ini (mis. tab baru setelah masuk di tempat lain).
    if (!live && liveEnabled) { const s = storedSession(); if (s) { enterLive(s).then(() => location.reload()).catch(() => undefined); } return; }
    if (!live) return;
    refresh();
    const tick = window.setInterval(() => {
      const before = localStorage.getItem(BASELINE);
      const pending = SYNC_KEYS.some(k => { try { return localStorage.getItem(k) !== JSON.parse(before ?? "{}")[k]; } catch { return false; } });
      if (!pending) return;
      setSyncStatus("saving");
      flushState().then(() => setSyncStatus("saved")).catch(() => setSyncStatus("error"));
    }, 2500);
    const hide = () => { flushState(true).catch(() => undefined); };
    window.addEventListener("pagehide", hide);
    return () => { window.clearInterval(tick); window.removeEventListener("pagehide", hide); };
  }, [live, refresh]);

  const saveProfile: LiveAPI["saveProfile"] = async p => {
    const [row] = await rest<Profile[]>(`profiles?id=eq.${q(uid.current)}`, { method: "PATCH", body: p, prefer: "return=representation" });
    if (row) setProfile(row);
  };
  const saveListing: LiveAPI["saveListing"] = async l => {
    const body = { ...l, id: uid.current };
    const rows = listing
      ? await rest<Listing[]>(`vendor_listings?id=eq.${q(uid.current)}`, { method: "PATCH", body: l, prefer: "return=representation" })
      : await rest<Listing[]>("vendor_listings", { method: "POST", body, prefer: "return=representation" });
    if (!rows[0]) throw new Error("Profil layanan tidak tersimpan.");
    setListing(rows[0]); return rows[0];
  };
  const logout = async () => { await leaveLive(); location.hash = "#/beranda"; location.reload(); };
  return <Ctx.Provider value={{ live, ready, email: storedSession()?.user.email ?? "", profile, listing, syncStatus, error, refresh, saveProfile, saveListing, logout }}>{children}</Ctx.Provider>;
}
/** Tombol "Mulai rencana": saat server aktif, tamu diarahkan ke pendaftaran akun; pengguna yang masuk ke ruangnya. */
export function startPlanTarget(): "daftar" | "planner" | "vendor/ringkasan" {
  if (!liveEnabled) return "planner";
  if (!liveBoot()) return "daftar";
  return "planner";
}

export function useLive(): LiveAPI {
  const v = useContext(Ctx);
  if (!v) throw new Error("LiveProvider missing");
  return v;
}
