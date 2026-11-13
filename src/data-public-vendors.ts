// Direktori publik: daftar usaha pernikahan yang BELUM terdaftar atau bermitra dengan VAKSARA.
// Data diisi di src/daftar-vendor.csv (bisa dibuka & disimpan dari Excel, pemisah titik koma atau koma).
// Kolom: nama;kategori;alamat;kontak;instagram;tiktok;facebook;website;keterangan;sumber
import csv from "./daftar-vendor.csv?raw";

export type PublicVendor = { id: string; name: string; category: string; address: string; phone: string; instagram: string; tiktok: string; facebook: string; website: string; note: string; source: string };

/** Mengurai CSV sederhana (tanda kutip ganda, pemisah ; atau ,) tanpa pustaka tambahan. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const first = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) { if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; continue; }
    if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && clean[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

const handle = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\/@?/i, "").replace(/^@/, "").replace(/\/.*$/, "");
export const instagramUrl = (v: string) => `https://www.instagram.com/${handle(v)}/`;
export const tiktokUrl = (v: string) => `https://www.tiktok.com/@${handle(v)}`;
export const facebookUrl = (v: string) => /^https?:\/\//i.test(v.trim()) ? v.trim() : `https://www.facebook.com/search/top?q=${encodeURIComponent(v.trim())}`;
/** 0812… / +62812… / 62812… → 62812… untuk tautan WhatsApp. */
export const waNumber = (v: string) => { const d = v.replace(/\D/g, ""); return d.startsWith("0") ? "62" + d.slice(1) : d; };
export const handleLabel = (v: string) => "@" + handle(v);

function load(text: string): PublicVendor[] {
  const [head, ...rows] = parseCsv(text);
  if (!head) return [];
  const idx = (k: string) => head.findIndex(h => h.trim().toLowerCase() === k);
  const get = (r: string[], k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");
  return rows.map((r, i) => ({ id: `pv-${i + 1}`, name: get(r, "nama"), category: get(r, "kategori") || "Lainnya", address: get(r, "alamat"), phone: get(r, "kontak"), instagram: get(r, "instagram"), tiktok: get(r, "tiktok"), facebook: get(r, "facebook"), website: get(r, "website"), note: get(r, "keterangan"), source: get(r, "sumber") })).filter(v => v.name);
}

export const publicVendors: PublicVendor[] = load(csv);
export const publicVendorCategories: string[] = [...new Set(publicVendors.map(v => v.category))];
