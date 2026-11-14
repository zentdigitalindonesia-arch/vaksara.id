// Menyusun supabase/functions/cooperation-action/index.ts dari src/utils/cooperation.ts + handler.ts
// menjadi satu berkas, agar dapat ditempel utuh di editor Edge Functions Supabase.
// Jalankan: node scripts/build-edge-functions.mjs   (cek saja: --check)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = fs.readFileSync(path.join(root, "src/utils/cooperation.ts"), "utf8");
const handler = fs.readFileSync(path.join(root, "supabase/functions/cooperation-action/handler.ts"), "utf8")
  .replace(/^import .*from "\.\.\/\.\.\/\.\.\/src\/utils\/cooperation\.ts";\n/m, "");
const out = `// BERKAS HASIL SUSUNAN — jangan diubah langsung. Sumber: src/utils/cooperation.ts dan
// supabase/functions/cooperation-action/handler.ts. Susun ulang: node scripts/build-edge-functions.mjs
// Tempel seluruh isi berkas ini di Supabase → Edge Functions → cooperation-action.

// ===== Mesin aturan kerja sama (src/utils/cooperation.ts) =====
${engine.trim()}

// ===== Fungsi server (supabase/functions/cooperation-action/handler.ts) =====
${handler.trim()}

Deno.serve(req => handle(req, key => Deno.env.get(key) ?? ""));
`;
const target = path.join(root, "supabase/functions/cooperation-action/index.ts");
if (process.argv.includes("--check")) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (current !== out) { console.error("index.ts fungsi cooperation-action belum disusun ulang. Jalankan: node scripts/build-edge-functions.mjs"); process.exit(1); }
  console.log("Fungsi server sudah sesuai sumber.");
} else { fs.writeFileSync(target, out); console.log("Tersusun:", path.relative(root, target)); }
