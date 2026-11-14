// Menyusun index.ts tiap fungsi server dari sumbernya menjadi satu berkas, agar dapat ditempel utuh di editor
// Edge Functions Supabase:  src/utils/cooperation.ts + supabase/functions/_shared/escrow.ts + <fungsi>/handler.ts
// Jalankan: node scripts/build-edge-functions.mjs   (cek saja: --check)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const stripImports = src => src.replace(/^import .*from "(\.\.\/\.\.\/\.\.\/src\/utils\/cooperation|\.\.\/_shared\/escrow)\.ts";\n/gm, "");
const engine = read("src/utils/cooperation.ts").trim();
const shared = stripImports(read("supabase/functions/_shared/escrow.ts")).trim();
const FUNCTIONS = ["cooperation-action", "xendit-webhook"];
let stale = false;
for (const name of FUNCTIONS) {
  const handler = stripImports(read(`supabase/functions/${name}/handler.ts`)).trim();
  const out = `// BERKAS HASIL SUSUNAN — jangan diubah langsung. Sumber: src/utils/cooperation.ts,
// supabase/functions/_shared/escrow.ts, dan supabase/functions/${name}/handler.ts.
// Susun ulang: node scripts/build-edge-functions.mjs
// Tempel seluruh isi berkas ini di Supabase → Edge Functions → ${name}.

// ===== Mesin aturan kerja sama (src/utils/cooperation.ts) =====
${engine}

// ===== Bagian bersama: basis data, Xendit, pencairan (supabase/functions/_shared/escrow.ts) =====
${shared}

// ===== Fungsi server (supabase/functions/${name}/handler.ts) =====
${handler}

Deno.serve(req => handle(req, key => Deno.env.get(key) ?? ""));
`;
  const target = path.join(root, `supabase/functions/${name}/index.ts`);
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== out) { console.error(`index.ts fungsi ${name} belum disusun ulang. Jalankan: node scripts/build-edge-functions.mjs`); stale = true; }
  } else { fs.writeFileSync(target, out); console.log("Tersusun:", path.relative(root, target)); }
}
if (process.argv.includes("--check")) { if (stale) process.exit(1); console.log("Fungsi server sudah sesuai sumber."); }
