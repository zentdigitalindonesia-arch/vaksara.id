const { chromium } = require("playwright");
const BASE = "file://" + process.cwd() + "/dist/index.html#/";
(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  for (const route of ["beranda", "admin/overview", "planner"]) {
    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForTimeout(300);
    const out = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const st = getComputedStyle(el);
          if (st.position === "fixed") return;
          bad.push({ tag: el.tagName, cls: (el.className && typeof el.className === "string" ? el.className : "").slice(0, 110), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), text: (el.textContent || "").trim().slice(0, 50).replace(/\s+/g, " ") });
        }
      });
      return { vw, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 18) };
    });
    console.log("\n---", route, `vw=${out.vw} scrollW=${out.scrollW}`);
    out.bad.forEach((b) => console.log(`[${b.tag}] L${b.left} R${b.right} W${b.w} :: ${b.cls} :: "${b.text}"`));
  }
  await browser.close();
})();
