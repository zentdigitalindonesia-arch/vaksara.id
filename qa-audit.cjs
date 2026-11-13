const { chromium } = require("playwright");

const BASE = "file://" + process.cwd() + "/dist/index.html#/";
const routes = [
  "beranda", "jelajahi", "praktisi/nurhaeni", "layanan", "pengetahuan", "tentang", "harga", "pusat-bantuan",
  "planner", "planner/planner", "planner/anggaran", "planner/vendor", "planner/jadwal", "planner/pembayaran", "planner/tamu", "planner/rundown",
  "trust", "perjanjian/a1", "perjanjian/baru", "pengiriman/a1", "bast", "bast/a4", "sengketa", "sengketa/d1", "bantuan",
  "vendor/ringkasan", "vendor/profil", "vendor/verifikasi", "vendor/permintaan", "vendor/penawaran", "vendor/kontrak", "vendor/jadwal", "vendor/pembayaran", "vendor/bast", "vendor/pengaduan",
  "admin/overview", "admin/pengguna", "admin/screening", "admin/direktori", "admin/moderasi", "admin/perjanjian", "admin/pengaduan", "admin/audit", "admin/analitik",
];

async function check(browser, width, label, fullScreenshot = false) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("favicon")) errors.push(`${label} console: ${m.text()}`); });
  const report = [];
  for (const r of routes) {
    errors.length && (page.removeAllListeners("pageerror"));
    await page.goto(BASE + r, { waitUntil: "load" });
    await page.waitForTimeout(180);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const text = await page.evaluate(() => document.body.innerText.trim().slice(0, 80).replace(/\n/g, " "));
    const imgs = await page.evaluate(() => Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).length);
    report.push({ route: r, overflow, imgs, text });
    if (fullScreenshot && ["beranda", "jelajahi", "planner", "trust", "perjanjian/a1", "sengketa", "bast/a4", "perjanjian/baru"].includes(r)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/m-${r.replace(/\//g, "-")}.png`, fullPage: false });
    }
  }
  console.log(`\n=== ${label} (${width}px) ===`);
  for (const x of report) {
    if (x.overflow > 2 || x.imgs > 0 || !x.text) console.log(`⚠ ${x.route.padEnd(22)} overflow=${x.overflow} brokenImgs=${x.imgs} "${x.text}"`);
  }
  console.log("Routes:", report.length, "| clean:", report.filter((x) => x.overflow <= 2 && x.imgs === 0 && x.text).length);
  if (errors.length) console.log("ERRORS:", [...new Set(errors)].slice(0, 12));
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  await check(browser, 1440, "desktop");
  await check(browser, 768, "tablet");
  await check(browser, 390, "mobile", true);
  await check(browser, 360, "small-mobile");
  await browser.close();
})();
