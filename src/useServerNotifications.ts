import { useCallback, useEffect, useRef, useState } from "react";
import { liveUserId } from "@/LiveContext";
import { q, rest } from "@/utils/supabase";

// Pemberitahuan akun nyata: dibuat pemicu database (lihat supabase/schema.sql, bagian PEMBERITAHUAN),
// dibaca di sini dan ditandai dibaca oleh pemiliknya. Email dikirim terpisah oleh Edge Function notify-email.
export type ServerNotification = { id: number; kind: string; title: string; body: string; link: string; read_at: string | null; created_at: string };

export function useServerNotifications(live: boolean) {
  const [items, setItems] = useState<ServerNotification[]>([]);
  const latest = useRef(items);
  latest.current = items;

  const load = useCallback(async () => {
    const uid = liveUserId();
    if (!live || !uid) return;
    try { setItems(await rest<ServerNotification[]>(`notifications?select=id,kind,title,body,link,read_at,created_at&user_id=eq.${q(uid)}&order=created_at.desc&limit=20`)); }
    catch { /* daftar terakhir tetap ditampilkan; dicoba lagi pada siklus berikutnya */ }
  }, [live]);

  useEffect(() => {
    if (!live) return;
    load();
    const poll = () => { if (document.visibilityState === "visible") load(); };
    const timer = window.setInterval(poll, 30000);
    window.addEventListener("focus", poll);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", poll); };
  }, [live, load]);

  const markAllRead = useCallback(async () => {
    const uid = liveUserId();
    if (!live || !uid || !latest.current.some(n => !n.read_at)) return;
    const now = new Date().toISOString();
    setItems(list => list.map(n => n.read_at ? n : { ...n, read_at: now }));
    try { await rest(`notifications?user_id=eq.${q(uid)}&read_at=is.null`, { method: "PATCH", body: { read_at: now }, prefer: "return=minimal" }); }
    catch { load(); }
  }, [live, load]);

  return { items, unread: items.filter(n => !n.read_at).length, markAllRead, reload: load };
}

export function notificationTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
