const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8099/index.html#/';
const marks = /Nurul|Fikri|Amalia|Sulapa|Pa'rasanganta|Riase|Lipa' Sabbe|Dapur Cita|Lensa Pesisir|Nurhaeni|Ibrahim Saleh|Daeng Ngai|\bdemo\b|simulasi|prototipe|ilustra|\bcontoh\b|\bNaN\b|\bundefined\b/gi;
const couple = ['planner','planner/rencana','planner/pelaku','jelajahi','planner/rencana','planner/anggaran','planner/jadwal','planner/pembayaran','planner/tamu','planner/rundown','planner/vendor','planner/kerjasama','planner/permintaan-terbuka','planner/alur','planner/penawaran','planner/pelaksanaan','planner/planner','bantuan'];
const vendor = ['vendor/ringkasan','vendor/profil','vendor/peluang','vendor/jadwal','vendor/permintaan','vendor/penawaran','vendor/kontrak','vendor/pelaksanaan','vendor/bast','vendor/pembayaran','vendor/pengaduan','vendor/verifikasi','vendor/alur'];
async function signup(p, role, email) {
  await p.goto(base + 'akun/daftar'); await p.waitForLoadState('networkidle');
  if (role === 'vendor') await p.getByRole('radio', { name: 'Pelaku budaya / vendor' }).click();
  await p.getByLabel('Nama lengkap', { exact: true }).fill(role === 'vendor' ? 'Daeng Baru' : 'Rama Baru');
  await p.getByLabel('Email daftar', { exact: true }).fill(email);
  await p.getByLabel('Nomor WhatsApp', { exact: true }).fill('081234567890');
  await p.getByLabel('Kata sandi daftar', { exact: true }).fill('rahasia123');
  await p.locator('label', { hasText: 'Saya setuju data akun' }).click();
  await p.getByRole('button', { name: 'Daftar dan kirim kode verifikasi' }).click();
  await p.getByLabel('Kode verifikasi', { exact: true }).fill('123456');
  await p.getByRole('button', { name: 'Verifikasi', exact: true }).click();
  await p.waitForTimeout(2500); await p.waitForLoadState('networkidle');
}
(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  for (const [role, routes] of [['couple', couple], ['vendor', vendor]]) {
    const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); p.setDefaultTimeout(12000);
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await signup(p, role, role + Date.now() + '@uji.id');
    if (role === 'couple') { await p.locator('#event-name').fill('Pernikahan Uji'); await p.getByRole('button', { name: 'Lanjut susun kebutuhan' }).click(); await p.getByRole('button', { name: 'Lihat rencana saya' }).click(); await p.getByRole('button', { name: /Mulai|Buka|Simpan/ }).first().click().catch(() => {}); await p.waitForTimeout(800); }
    for (const r of routes) {
      await p.evaluate(x => { location.hash = '#/' + x; }, r); await p.waitForTimeout(700);
      const text = await p.evaluate(() => document.body.innerText);
      const found = {}; for (const m of text.matchAll(marks)) { const i = m.index; found[m[0].toLowerCase()] ??= text.slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, ' '); }
      const keys = Object.keys(found);
      console.log(`\n[${role}] ${r}: ${keys.length ? keys.join(', ') : 'BERSIH'}`);
      for (const k of keys) console.log('   ·', k, '→', found[k]);
    }
    if (errs.length) console.log('ERR', errs);
    await p.close();
  }
  await b.close();
})();
