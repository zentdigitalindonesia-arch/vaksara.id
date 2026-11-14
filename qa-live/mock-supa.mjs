// Tiruan Supabase (Auth + subset PostgREST) di atas Postgres lokal dengan RLS asli dari schema.sql.
import http from "node:http";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const ANON = "anon-test";
const PSQL = ["-h", "/tmp/pgt", "-p", "5499", "-U", "postgres", "-d", "live", "-At", "-v", "ON_ERROR_STOP=1", "-q"];
const users = new Map(); // email -> {id,password,confirmed}
const tokens = new Map(); // token -> uid
const refresh = new Map();
const CODE = "123456";
const log = [];

function sql(text) {
  try { return execFileSync("psql", [...PSQL, "-c", text], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { const msg = String(e.stderr || e.message).replace(/^.*ERROR:\s*/s, "").split("\n")[0]; const err = new Error(msg); err.pg = true; throw err; }
}
const lit = v => v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`;
const ident = v => { if (!/^[a-z_][a-z0-9_]*$/.test(v)) throw new Error("bad ident " + v); return v; };
const jlit = v => { const s = JSON.stringify(v); if (s.includes("$j$")) throw new Error("bad json"); return `$j$${s}$j$`; };
function runAs(uid, query) {
  // psql -c tidak menerima \g; gunakan beberapa -c sebagai satu transaksi melalui CTE tunggal.
  const role = uid ? "authenticated" : "anon";
  const text = `begin;\nset local role ${role};\nselect set_config('request.jwt.sub', ${lit(uid ?? "")}, true) is null;\n${query};\ncommit;`;
  const out = sql(text).trim().split("\n");
  // baris pertama = hasil set_config (f/t), sisanya = JSON (json_agg dapat memuat baris baru)
  return JSON.parse(out.slice(1).join("\n") || "null");
}
const PK = { profiles: ["id"], vendor_listings: ["id"], user_state: ["user_id", "key"], cooperations: ["id"], open_requests: ["id"], open_request_responses: ["id"], notifications: ["id"] };
const EMBED = { open_request_responses: { parent: "open_requests", fk: "request_id" } };

function parseSelect(sel, table) {
  const parts = []; let depth = 0, cur = "";
  for (const ch of sel ?? "*") { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch; }
  if (cur) parts.push(cur);
  return parts.map(p => {
    const m = p.match(/^([a-z_]+)\((.*)\)$/);
    if (m) { const child = m[1], cols = m[2] === "*" ? "*" : m[2].split(",").map(ident).join(","); const e = EMBED[child]; return `(select coalesce(json_agg(x), '[]'::json) from (select ${cols} from public.${child} c where c.${e.fk} = t.id) x) as ${child}`; }
    return p === "*" ? "t.*" : "t." + ident(p);
  }).join(", ");
}
function where(params) {
  const conds = [];
  for (const [k, v] of params) {
    if (["select", "order", "on_conflict", "limit"].includes(k)) continue;
    const [op, ...rest] = v.split("."); const val = rest.join(".");
    if (op === "eq") conds.push(`t.${ident(k)} = ${lit(val)}`);
    else if (op === "is") conds.push(`t.${ident(k)} is ${val === "true" ? "true" : val === "false" ? "false" : "null"}`);
    else throw new Error("op " + op);
  }
  return conds.length ? " where " + conds.join(" and ") : "";
}
function order(params) {
  const o = params.get("order"); if (!o) return "";
  return " order by " + o.split(",").map(p => { const [c, d] = p.split("."); return `t.${ident(c)} ${d === "desc" ? "desc" : "asc"}`; }).join(", ");
}
function limit(params) { const n = Number(params.get("limit")); return Number.isSafeInteger(n) && n > 0 ? ` limit ${n}` : ""; }

function handleRest(req, url, body, uid) {
  const table = ident(url.pathname.replace("/rest/v1/", ""));
  const params = url.searchParams; const prefer = req.headers.prefer ?? "";
  const ret = prefer.includes("return=representation");
  if (req.method === "GET") return runAs(uid, `select coalesce(json_agg(r), '[]'::json) from (select ${parseSelect(params.get("select"), table)} from public.${table} t${where(params)}${order(params)}${limit(params)}) r`);
  if (req.method === "POST") {
    const rows = Array.isArray(body) ? body : [body]; const keys = Object.keys(rows[0]).map(ident);
    const conflict = params.get("on_conflict") ? params.get("on_conflict").split(",").map(ident) : PK[table];
    const upsert = prefer.includes("merge-duplicates") ? ` on conflict (${conflict.join(",")}) do update set ${keys.map(k => `${k} = excluded.${k}`).join(", ")}` : "";
    const out = runAs(uid, `with r as (insert into public.${table} (${keys.join(",")}) select ${keys.join(",")} from json_populate_recordset(null::public.${table}, ${jlit(rows)})${upsert} returning *) select coalesce(json_agg(r), '[]'::json) from r`);
    return ret ? out : null;
  }
  if (req.method === "PATCH") {
    const keys = Object.keys(body).map(ident);
    return runAs(uid, `with r as (update public.${table} t set ${keys.map(k => `${k} = (json_populate_record(null::public.${table}, ${jlit(body)})).${k}`).join(", ")}${where(params)} returning t.*) select coalesce(json_agg(r), '[]'::json) from r`);
  }
  throw new Error("method");
}

function session(uid, email) {
  const access = "tok-" + crypto.randomUUID(), ref = "ref-" + crypto.randomUUID();
  tokens.set(access, uid); refresh.set(ref, { uid, email });
  return { access_token: access, refresh_token: ref, expires_in: 3600, token_type: "bearer", user: { id: uid, email } };
}
function handleAuth(req, url, body) {
  const path = url.pathname.replace("/auth/v1/", ""), grant = url.searchParams.get("grant_type");
  if (path === "signup") {
    const email = body.email; if (users.has(email)) return [200, { id: crypto.randomUUID(), email, identities: [] }];
    if (!body.password || body.password.length < 6) return [422, { error_code: "weak_password", msg: "Password should be at least 6 characters" }];
    const id = crypto.randomUUID();
    sql(`insert into auth.users (id, email, raw_user_meta_data) values (${lit(id)}, ${lit(email)}, ${lit(JSON.stringify(body.data ?? {}))}::jsonb)`);
    users.set(email, { id, password: body.password, confirmed: false }); log.push(["signup", email]);
    return [200, { id, email, identities: [{ id }] }];
  }
  if (path === "verify") { const u = users.get(body.email); if (!u || body.token !== CODE) return [403, { error_code: "otp_expired", msg: "Token has expired or is invalid" }]; u.confirmed = true; return [200, session(u.id, body.email)]; }
  if (path === "resend" || path === "recover") { log.push([path, body.email]); return [200, {}]; }
  if (path === "token" && grant === "password") { const u = users.get(body.email); if (!u || u.password !== body.password) return [400, { error: "invalid_grant", error_description: "Invalid login credentials" }]; if (!u.confirmed) return [400, { error_code: "email_not_confirmed", msg: "Email not confirmed" }]; return [200, session(u.id, body.email)]; }
  if (path === "token" && grant === "refresh_token") { const r = refresh.get(body.refresh_token); if (!r) return [400, { error_description: "Invalid Refresh Token: Refresh Token Not Found" }]; return [200, session(r.uid, r.email)]; }
  if (path === "logout") return [204, null];
  if (path === "user" && req.method === "PUT") { const uid = tokens.get((req.headers.authorization ?? "").slice(7)); const u = [...users.values()].find(x => x.id === uid); if (!u) return [401, { msg: "not logged in" }]; u.password = body.password; return [200, { id: uid }]; }
  return [404, { msg: "not found " + path }];
}

http.createServer((req, res) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, authorization, content-type, prefer", "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }
  let raw = ""; req.on("data", c => raw += c); req.on("end", () => {
    const url = new URL(req.url, "http://x"); let body = null; try { body = raw ? JSON.parse(raw) : null; } catch { }
    const send = (code, data) => { res.writeHead(code, { ...cors, "Content-Type": "application/json" }); res.end(data === null || data === undefined ? "" : JSON.stringify(data)); };
    try {
      if (url.pathname === "/__log") return send(200, log);
      if (req.headers.apikey !== ANON) return send(401, { message: "No API key" });
      if (url.pathname.startsWith("/auth/v1/")) { const [c, d] = handleAuth(req, url, body); return send(c, d); }
      if (url.pathname.startsWith("/rest/v1/")) {
        const tok = (req.headers.authorization ?? "").slice(7); const uid = tok === ANON ? null : tokens.get(tok);
        if (tok !== ANON && !uid) return send(401, { message: "JWT expired" });
        const out = handleRest(req, url, body, uid);
        log.push([req.method, url.pathname + url.search, uid ? uid.slice(0, 8) : "anon"]);
        return send(req.method === "POST" && !(req.headers.prefer ?? "").includes("representation") ? 201 : 200, out);
      }
      send(404, {});
    } catch (e) { log.push(["ERR", req.method, url.pathname + url.search, e.message]); send(e.pg ? (/row-level security/.test(e.message) ? 403 : 400) : 500, { message: e.message, code: /row-level/.test(e.message) ? "42501" : "PGRST" }); }
  });
}).listen(54321, "127.0.0.1", () => console.log("mock supabase on 54321"));
