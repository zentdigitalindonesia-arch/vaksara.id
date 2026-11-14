// VAKSARA — kirim email untuk setiap pemberitahuan baru (Supabase Edge Function, Deno).
// Dipanggil Database Webhook pada INSERT tabel public.notifications. Panduan: supabase/PANDUAN-NOTIFIKASI.md
//
// Secrets yang dibutuhkan (Edge Functions → Secrets):
//   RESEND_API_KEY  kunci API Resend (boleh sama dengan sandi SMTP Resend untuk kode verifikasi)
//   WEBHOOK_SECRET  teks acak; sama dengan header x-webhook-secret pada Database Webhook
//   NOTIFY_FROM     pengirim, mis. "VAKSARA <notifikasi@vaksara.id>" (domain harus terverifikasi di Resend)
//   SITE_URL        opsional, bawaan https://vaksara.id
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah tersedia otomatis di Edge Function.

type Notification = { id: number; user_id: string; kind: string; title: string; body: string; link: string };

const env = (k: string) => Deno.env.get(k) ?? "";
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function dbHeaders(): Record<string, string> {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  // Kunci rahasia baru (sb_secret_…) bukan JWT: cukup header apikey.
  return { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
}

function render(n: Notification, name: string, url: string) {
  const text = `Halo ${name},\n\n${n.title}\n${n.body ? n.body + "\n" : ""}\nBuka di VAKSARA: ${url}\n\nAnda menerima email ini karena memiliki akun VAKSARA. Matikan email pemberitahuan lewat ikon lonceng di aplikasi.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#16332E">
  <p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#A07A3C;margin:0 0 12px">VAKSARA</p>
  <p style="margin:0 0 12px">Halo ${esc(name)},</p>
  <h1 style="font-size:20px;line-height:1.35;margin:0 0 8px">${esc(n.title)}</h1>
  ${n.body ? `<p style="font-size:15px;line-height:1.6;color:#3d4f4b;margin:0 0 18px">${esc(n.body)}</p>` : ""}
  <a href="${esc(url)}" style="display:inline-block;background:#16332E;color:#FBF6EA;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:bold">Buka di VAKSARA</a>
  <p style="font-size:12px;line-height:1.5;color:#7a8682;margin:24px 0 0">Anda menerima email ini karena memiliki akun VAKSARA. Matikan email pemberitahuan lewat ikon lonceng di aplikasi.</p>
</div>`;
  return { text, html };
}

Deno.serve(async req => {
  if (!env("WEBHOOK_SECRET") || req.headers.get("x-webhook-secret") !== env("WEBHOOK_SECRET")) return new Response("forbidden", { status: 401 });
  let payload: { type?: string; table?: string; record?: Notification };
  try { payload = await req.json(); } catch { return new Response("bad request", { status: 400 }); }
  const n = payload.record;
  if (payload.type !== "INSERT" || payload.table !== "notifications" || !n?.user_id) return new Response("ignored");

  const base = env("SUPABASE_URL");
  const res = await fetch(`${base}/rest/v1/profiles?select=email,full_name,email_notifications&id=eq.${encodeURIComponent(n.user_id)}`, { headers: dbHeaders() });
  if (!res.ok) return new Response("profile lookup failed: " + await res.text(), { status: 502 });
  const [profile] = await res.json() as { email: string; full_name: string; email_notifications: boolean }[];
  if (!profile?.email || profile.email_notifications === false) return new Response("skipped");

  const url = `${(env("SITE_URL") || "https://vaksara.id").replace(/\/+$/, "")}/#/${n.link || ""}`;
  const { text, html } = render(n, profile.full_name || "Pengguna VAKSARA", url);
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("NOTIFY_FROM") || "VAKSARA <notifikasi@vaksara.id>", to: [profile.email], subject: n.title, text, html }),
  });
  if (!sent.ok) return new Response("resend failed: " + await sent.text(), { status: 502 });

  await fetch(`${base}/rest/v1/notifications?id=eq.${n.id}`, { method: "PATCH", headers: { ...dbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ emailed_at: new Date().toISOString() }) });
  return new Response("sent");
});
