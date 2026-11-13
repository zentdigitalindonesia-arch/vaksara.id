// Uji mode akun nyata terhadap tiruan Supabase (RLS asli). Tiga perangkat: pelaku, admin, keluarga.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// Jalankan: Postgres lokal + node qa-live/mock-supa.mjs + build dengan VITE_SUPABASE_URL=http://127.0.0.1:54321, VITE_SUPABASE_ANON_KEY=anon-test, disajikan di :8099.
const base = process.env.QA_LIVE_URL || 'http://127.0.0.1:8099/index.html#/';
const psql = q => execFileSync('psql', ['-h', '/tmp/pgt', '-p', '5499', '-U', 'postgres', '-d', 'live', '-At', '-c', q], { encoding: 'utf8' }).trim();
let n = 0; const ok = m => { n++; console.log('PASS', m); };
(async () => {
  const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chromium', headless: true });
  const errors = [];
  const device = async (w = 390) => { const ctx = await browser.newContext({ viewport: { width: w, height: 860 } }); const page = await ctx.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept()); return page; };
  const hard = async (p, route) => { for (let i = 0; i < 5; i++) { try { await p.waitForLoadState('load'); await p.evaluate(r => { location.hash = '#/' + r; }, route); break; } catch { await p.waitForTimeout(500); } } await p.reload(); await p.waitForLoadState('networkidle'); };
  const click = (p, name) => p.getByRole('button', { name, exact: true }).first().click();
  const phase = (p, label) => p.locator('#cooperation-case').getByText(label, { exact: true }).waitFor();
  async function signup(p, { role, name, email, phone }) {
    await p.goto(base + 'beranda'); await p.waitForLoadState('networkidle');
    await p.evaluate(() => { location.hash = '#/' + 'akun/daftar'; });
    await p.getByRole('form', { name: 'Daftar akun VAKSARA' }).waitFor();
    if (role === 'vendor') await p.getByRole('radio', { name: 'Pelaku budaya / vendor' }).click();
    await p.getByLabel('Nama lengkap', { exact: true }).fill(name);
    await p.getByLabel('Email daftar', { exact: true }).fill(email);
    await p.getByLabel('Nomor WhatsApp', { exact: true }).fill(phone);
    await p.getByLabel('Kata sandi daftar', { exact: true }).fill('rahasia123');
    await click(p, 'Daftar dan kirim kode verifikasi');
    await p.getByText(/Centang persetujuan/).waitFor(); // wajib setuju
    await p.locator('label', { hasText: 'Saya setuju data akun' }).click();
    await click(p, 'Daftar dan kirim kode verifikasi');
    await p.getByLabel('Kode verifikasi', { exact: true }).fill('999999');
    await click(p, 'Verifikasi');
    await p.getByText(/Kode salah atau sudah kedaluwarsa/).waitFor();
    await p.getByLabel('Kode verifikasi', { exact: true }).fill('123456');
    await click(p, 'Verifikasi');
    await p.waitForURL(role === 'vendor' ? /vendor\/profil/ : /planner/);
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  }
  try {
    // ---------- Pelaku budaya ----------
    const v = await device();
    await signup(v, { role: 'vendor', name: 'Daeng Uji', email: 'pelaku@uji.id', phone: '0812 1111 2222' });
    await v.getByRole('heading', { name: 'Profil layanan' }).waitFor();
    ok('pelaku mendaftar, verifikasi kode email, masuk ke Profil layanan');
    await v.getByLabel('Nama usaha', { exact: true }).fill('Sanggar Uji Batara');
    await v.getByLabel('Kategori layanan', { exact: true }).selectOption('Prosesi adat');
    await v.getByLabel('Deskripsi layanan', { exact: true }).fill('Pemandu prosesi mappacci dan akad nikah adat Bugis-Makassar, berpengalaman 10 tahun di Makassar dan Gowa.');
    await click(v, 'Simpan dan ajukan peninjauan');
    await v.getByText('Menunggu peninjauan', { exact: true }).waitFor();
    if (psql("select review_status from vendor_listings where name='Sanggar Uji Batara'") !== 'pending') throw new Error('status bukan pending');
    ok('profil layanan tersimpan di server dengan status menunggu peninjauan');
    await v.evaluate(() => { location.hash = '#/vendor/peluang'; });
    await v.getByText('Profil Anda sedang ditinjau').waitFor();
    ok('pelaku belum ditinjau tidak dapat melihat permintaan keluarga');
    if (await v.getByRole('button', { name: 'Sebagai keluarga' }).count()) throw new Error('pemilih peran masih tampil');
    ok('pemilih peran demo tersembunyi untuk akun nyata');

    // ---------- Keluarga ----------
    const c = await device(1280);
    await signup(c, { role: 'couple', name: 'Andi Rahma', email: 'keluarga@uji.id', phone: '081233334444' });
    await c.waitForTimeout(1500); await c.waitForLoadState('networkidle');
    const html = await c.evaluate(() => document.body.innerText);
    if (/Nurul/.test(html)) throw new Error('data demo Nurul muncul di akun nyata');
    ok('keluarga mendaftar; rencana kosong tanpa data contoh');
    await c.evaluate(() => { location.hash = '#/jelajahi'; });
    await c.waitForTimeout(1200);
    if (await c.getByText('Sanggar Uji Batara').count()) throw new Error('pelaku belum disetujui sudah tampil');
    ok('pelaku yang belum ditinjau tidak tampil di direktori');

    // ---------- Admin ----------
    const a = await device(1280);
    await signup(a, { role: 'couple', name: 'Admin Uji', email: 'admin@uji.id', phone: '081255556666' });
    psql("update profiles set is_admin = true where email = 'admin@uji.id'");
    await hard(a, 'admin/screening');
    await a.getByRole('heading', { name: 'Screening pelaku budaya' }).waitFor();
    await click(a, 'Setujui & tampilkan');
    await a.getByText('Centang ketiga pemeriksaan sebelum menyetujui.').waitFor();
    for (const l of ['Identitas diperiksa', 'Konteks budaya sesuai', 'Setuju dipublikasikan']) await a.locator('label', { hasText: l }).first().click();
    await click(a, 'Setujui & tampilkan');
    await a.getByText('Terverifikasi & tampil', { exact: true }).waitFor();
    ok('admin meninjau dan menyetujui pelaku');

    // keluarga non-admin tidak bisa membuka screening
    await c.evaluate(() => { location.hash = '#/admin/screening'; });
    await c.getByText('Khusus peninjau VAKSARA').waitFor();
    ok('akun bukan admin ditolak dari halaman peninjau');

    // ---------- Permintaan langsung ----------
    await hard(c, 'jelajahi');
    await c.getByRole('heading', { name: 'Pelaku budaya terdaftar' }).waitFor();
    await c.locator('section[aria-label="Pelaku terdaftar"]').getByRole('button', { name: 'Kirim permintaan' }).click();
    await c.waitForURL(/planner\/alur\?vendor=/);
    await c.getByLabel('Tanggal utama alur', { exact: true }).fill('2027-08-20');
    await c.getByLabel('Kebutuhan alur', { exact: true }).fill('Pemandu adat untuk mappacci dan akad nikah, dua hari di Makassar.');
    await click(c, 'Buat draf kebutuhan');
    await phase(c, 'Draf kebutuhan');
    const caseId = new URL(c.url().replace('#/', '')).searchParams.get('case') || decodeURIComponent(c.url().split('case=')[1] || '');
    if (!caseId) throw new Error('id kerja sama tidak ada di URL ' + c.url());
    await c.waitForTimeout(800);
    if (psql(`select phase from cooperations where id='${caseId}'`) !== 'draft') throw new Error('draf tidak tersimpan di server');
    await click(c, 'Kirim permintaan');
    await c.waitForTimeout(1000);
    if (psql(`select phase from cooperations where id='${caseId}'`) !== 'inquiry') throw new Error('permintaan tidak terkirim ke server');
    ok('keluarga mengirim permintaan ke pelaku terdaftar; tersimpan di server');

    // ---------- Pelaku merespons dari perangkatnya ----------
    await hard(v, 'vendor/alur?case=' + encodeURIComponent(caseId));
    await phase(v, 'Permintaan terkirim');
    if (/\bdemo\b/i.test(await v.locator('#cooperation-case').innerText())) throw new Error('kata demo masih tampil di kerja sama akun nyata');
    await v.getByLabel('Catatan alur', { exact: true }).fill('Kami tersedia untuk berdiskusi tentang dua hari acara keluarga.');
    await click(v, 'Kirim respons vendor');
    await phase(v, 'Diskusi kebutuhan');
    await v.getByLabel('Cara pembayaran alur', { exact: true }).selectOption('direct');
    await click(v, 'Kirim penawaran versi baru');
    await phase(v, 'Penawaran tersedia');
    await v.waitForTimeout(800);
    if (psql(`select phase from cooperations where id='${caseId}'`) !== 'offered') throw new Error('penawaran tidak tersimpan');
    ok('pelaku membalas dan mengirim penawaran dari perangkatnya sendiri');

    // ---------- Keluarga menyetujui ----------
    await hard(c, 'planner/alur?case=' + encodeURIComponent(caseId));
    await phase(c, 'Penawaran tersedia');
    await click(c, 'Lanjut tinjau perjanjian');
    await phase(c, 'Persetujuan versi perjanjian');
    await c.locator('label', { hasText: /menyetujui versi 1/ }).first().click();
    await click(c, 'Setujui sebagai pengguna');
    await c.waitForTimeout(800);
    { const alerts = await c.getByRole('alert').allInnerTexts(); const ap = psql(`select data->'approvals' from cooperations where id='${caseId}'`); if (!/"couple": true/.test(ap)) throw new Error('persetujuan keluarga tidak tersimpan: ' + ap + ' alerts=' + JSON.stringify(alerts) + ' url=' + c.url() + ' text=' + (await c.locator('main').innerText()).slice(0, 1200)); }
    ok('keluarga melihat penawaran dan menyetujui');

    // ---------- Konflik: data pelaku kedaluwarsa ----------
    await hard(v, 'vendor/alur?case=' + encodeURIComponent(caseId));
    await phase(v, 'Persetujuan versi perjanjian');
    psql(`update cooperations set updated_at = now() where id='${caseId}'`); // pihak lain mengubah setelah pelaku memuat halaman
    await v.locator('label', { hasText: /menyetujui versi 1/ }).first().click();
    await click(v, 'Setujui sebagai vendor');
    await v.getByText(/baru saja diperbarui pihak lain/).waitFor();
    if (psql(`select data->'approvals'->>'vendor' from cooperations where id='${caseId}'`) !== 'false') throw new Error('perubahan dengan data lama ikut tersimpan');
    ok('perubahan dengan data kedaluwarsa ditolak server; data terbaru dimuat ulang');
    await phase(v, 'Persetujuan versi perjanjian');
    await click(v, 'Setujui sebagai vendor'); // centang persetujuan masih aktif; cukup ulangi
    await v.waitForTimeout(1000);
    const ph = psql(`select phase from cooperations where id='${caseId}'`);
    if (!['active', 'running'].includes(ph)) throw new Error('fase setelah dua persetujuan: ' + ph);
    ok('kedua pihak menyetujui dari perangkat masing-masing (fase ' + ph + ')');

    // ---------- RLS: pelaku lain tidak melihat ----------
    if (psql(`select count(*) from cooperations`) !== '1') throw new Error('jumlah kerja sama tak terduga');
    ok('kerja sama tunggal tercatat di database');

    // ---------- Permintaan terbuka dua arah ----------
    await c.evaluate(() => { location.hash = '#/planner/permintaan-terbuka'; });
    await c.getByLabel('Judul permintaan', { exact: true }).fill('Dokumentasi foto dan video dua hari');
    await c.getByLabel('Rincian permintaan', { exact: true }).fill('Foto dan video untuk mappacci dan akad, sekitar 300 tamu.');
    await click(c, 'Pasang permintaan terbuka');
    await c.waitForTimeout(1000);
    const reqId = psql("select id from open_requests limit 1");
    if (!reqId) throw new Error('permintaan terbuka tidak tersimpan');
    await hard(v, 'vendor/peluang');
    await v.getByText('Dokumentasi foto dan video dua hari').waitFor();
    await v.locator('#opportunity-' + reqId).getByRole('button').first().click();
    await v.getByLabel('Pesan minat ' + reqId, { exact: true }).fill('Kami punya tim foto dan video untuk prosesi adat.');
    await v.getByLabel('Perkiraan harga ' + reqId, { exact: true }).fill('9000000');
    await click(v, 'Kirim minat');
    await v.waitForTimeout(1000);
    if (psql(`select count(*) from open_request_responses where request_id='${reqId}'`) !== '1') throw new Error('minat tidak tersimpan');
    await c.reload(); await c.waitForLoadState('networkidle'); await c.getByText('1 pelaku mengajukan minat').waitFor();
    await click(c, 'Pilih pelaku ini');
    await c.waitForFunction(() => /case=/.test(location.hash));
    await c.waitForTimeout(1500);
    if (psql(`select status from open_requests where id='${reqId}'`) !== 'closed') throw new Error('permintaan tidak ditutup');
    if (psql(`select count(*) from cooperations`) !== '2') throw new Error('kerja sama dari permintaan terbuka tidak dibuat');
    ok('permintaan terbuka: keluarga memasang, pelaku menanggapi, keluarga memilih');

    // ---------- Sinkron data rencana antar perangkat ----------
    await c.evaluate(() => { localStorage.setItem('vaksara-planner-guests-v1', JSON.stringify([{ name: 'Keluarga Uji', group: 'Keluarga', party: 4, rsvp: 'Hadir', table: 'A1', invitation: 'Terkirim' }])); });
    await c.waitForTimeout(3500);
    if (!/Keluarga Uji/.test(psql("select value::text from user_state where key='vaksara-planner-guests-v1'"))) throw new Error('daftar tamu tidak tersinkron');
    const c2 = await device();
    await c2.goto(base + 'beranda'); await c2.evaluate(() => { location.hash = '#/beranda'; });
    await c2.getByRole('button', { name: /^Masuk$/ }).first().click();
    await c2.getByLabel('Email masuk', { exact: true }).fill('keluarga@uji.id');
    await c2.getByLabel('Kata sandi akun', { exact: true }).fill('salah123');
    await c2.getByRole('form', { name: 'Masuk akun VAKSARA' }).getByRole('button', { name: 'Masuk', exact: true }).click();
    await c2.getByText('Email atau kata sandi salah.').waitFor();
    await c2.getByLabel('Kata sandi akun', { exact: true }).fill('rahasia123');
    await c2.getByRole('form', { name: 'Masuk akun VAKSARA' }).getByRole('button', { name: 'Masuk', exact: true }).click();
    await c2.waitForFunction(() => /planner/.test(location.hash)); await c2.waitForLoadState('networkidle'); await c2.waitForTimeout(800);
    const guests = await c2.evaluate(() => localStorage.getItem('vaksara-planner-guests-v1'));
    if (!/Keluarga Uji/.test(guests || '')) throw new Error('data tamu tidak terbawa ke perangkat lain');
    ok('data rencana tersimpan per akun dan terbuka di perangkat lain');

    // ---------- Keluar ----------
    await c2.evaluate(() => { location.hash = '#/planner/kerjasama'; });
    await c2.getByRole('button', { name: 'Menu akun' }).click();
    await c2.getByRole('button', { name: 'Keluar', exact: true }).last().click();
    await c2.waitForFunction(() => /beranda/.test(location.hash)); await c2.waitForLoadState('networkidle'); await c2.waitForTimeout(500);
    const left = await c2.evaluate(() => [localStorage.getItem('vx-auth-v1'), localStorage.getItem('vaksara-planner-guests-v1')]);
    if (left[0] || /Keluarga Uji/.test(left[1] || '')) throw new Error('data akun tertinggal setelah keluar');
    ok('keluar menghapus sesi dan data akun dari perangkat');

    // ---------- Konsol pemilik ----------
    if (!process.env.QA_OWNER_SLUG) { console.log('SKIP konsol pemilik (set QA_OWNER_SLUG)'); } else {
    await a.goto(base + process.env.QA_OWNER_SLUG); await a.reload();
    await a.getByRole('heading', { name: 'Konsol VAKSARA' }).waitFor();
    await a.getByText('Data server:').waitFor();
    await a.getByRole('button', { name: 'Pengguna', exact: true }).click();
    await a.getByText('pelaku@uji.id').waitFor();
    ok('konsol pemilik membaca data server untuk admin'); }

    if (errors.length) throw new Error('runtime: ' + errors.join(' | '));
    ok('tanpa error runtime');
    console.log('TOTAL AKUN NYATA', n, 'passed');
  } catch (e) { console.log('FAIL', e.message); console.log('errors', errors.slice(0, 5)); process.exitCode = 1; }
  finally { await browser.close(); }
})();
