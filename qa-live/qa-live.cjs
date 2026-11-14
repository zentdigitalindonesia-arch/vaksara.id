// Uji mode akun nyata terhadap tiruan Supabase (RLS asli). Tiga perangkat: pelaku, admin, keluarga.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// Jalankan: Postgres lokal (psql -f qa-live/supabase-stub.sql lalu supabase/schema.sql) + node qa-live/mock-supa.mjs + build dengan VITE_SUPABASE_URL=http://127.0.0.1:54321, VITE_SUPABASE_ANON_KEY=anon-test, disajikan di :8099.
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
    if (await p.getByLabel('Kata sandi daftar', { exact: true }).getAttribute('type') !== 'password') throw new Error('sandi tidak tersembunyi');
    await p.getByRole('button', { name: 'Lihat sandi' }).first().click();
    if (await p.getByLabel('Kata sandi daftar', { exact: true }).getAttribute('type') !== 'text') throw new Error('ikon mata tidak menampilkan sandi');
    await p.getByRole('button', { name: 'Sembunyikan sandi' }).first().click();
    await p.getByLabel('Ulangi kata sandi daftar', { exact: true }).fill('rahasia124');
    await click(p, 'Daftar dan kirim kode verifikasi');
    await p.getByText(/Ulangi kata sandi belum sama/).waitFor(); // sandi diketik dua kali dan harus sama
    await p.getByLabel('Ulangi kata sandi daftar', { exact: true }).fill('rahasia123');
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
    // ---------- Tamu menekan Mulai rencana ----------
    const g = await device(1366);
    await g.goto(base + 'beranda'); await g.waitForLoadState('networkidle');
    await g.getByRole('button', { name: 'Mulai rencana' }).first().click();
    await g.getByRole('form', { name: 'Daftar akun VAKSARA' }).waitFor();
    if (await g.getByRole('tab', { name: 'Coba akun demo' }).count()) throw new Error('tab demo masih tampil di pendaftaran');
    if (/planner/.test(g.url())) throw new Error('Mulai rencana membuka ruang demo');
    ok('tamu menekan Mulai rencana: form daftar akun tanpa tab demo');
    await g.keyboard.press('Escape');
    await g.getByRole('button', { name: /^Masuk$/ }).first().click();
    await g.getByRole('tab', { name: 'Coba akun demo' }).waitFor();
    ok('form Masuk tetap menyediakan akun demo untuk juri');

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
    await v.getByRole('heading', { name: 'Dokumen verifikasi' }).waitFor();
    await v.getByText('0 dari 3 wajib lengkap').waitFor();
    ok('pelaku melihat daftar dokumen verifikasi wajib');
    // Unggah berkas dan kamera tidak dapat diuji di tiruan; catatan dokumen dimasukkan langsung sebagai pelaku.
    const docsFor = (email, kinds) => psql(`select set_config('request.jwt.sub', (select id::text from profiles where email='${email}'), true); insert into documents (user_id, kind, path) select p.id, k.kind, p.id || '/' || k.kind || '-' || k.n || '.jpg' from profiles p, (values ${kinds.map((k, i) => `('${k}', ${i})`).join(', ')}) k(kind, n) where p.email = '${email}'`);
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
    ok('ikon mata menampilkan dan menyembunyikan kata sandi');
    // Wizard rencana: kebutuhan lainnya bisa diketik
    await c.locator('#event-name').fill('Pernikahan Andi & Rahma');
    await click(c, 'Lanjut susun kebutuhan');
    await c.locator('label', { hasText: 'Pemandu prosesi adat' }).click();
    await c.locator('#event-other-needs').fill('Pemain kecapi, MC berbahasa Bugis');
    await click(c, 'Lihat rencana saya');
    await c.getByText('Pemain kecapi, MC berbahasa Bugis').first().waitFor();
    await c.waitForTimeout(3500);
    if (!/kecapi/.test(psql("select value::text from user_state where key='vaksara-event-plan-v1' and user_id=(select id from profiles where email='keluarga@uji.id')"))) throw new Error('kebutuhan lainnya tidak tersimpan di server');
    ok('kebutuhan lainnya dapat diketik dan tersimpan di server');
    await hard(c, 'planner/rundown');
    await c.getByText(/Belum ada mata acara/).waitFor();
    if (/Nurhaeni|Sulapa|Lensa Pesisir/.test(await c.evaluate(() => document.body.innerText))) throw new Error('rundown contoh muncul');
    await hard(c, 'planner/anggaran');
    if (/127\.500\.000|62\.050\.000/.test(await c.evaluate(() => document.body.innerText))) throw new Error('angka anggaran contoh muncul');
    ok('rundown dan anggaran akun baru kosong, tanpa data contoh');
    await hard(c, 'jelajahi');
    await c.waitForFunction(() => /planner\/pelaku/.test(location.hash));
    await c.getByRole('heading', { name: 'Direktori vendor Makassar' }).waitFor();
    if (!(await c.locator('aside, nav').first().count())) throw new Error('bukan di dalam ruang kerja');
    ok('cari pelaku budaya tetap di dalam ruang kerja dan menampilkan direktori vendor Makassar');
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
    await a.getByText(/Belum dapat disetujui/).first().waitFor();
    for (const l of ['Identitas diperiksa', 'Konteks budaya sesuai', 'Setuju dipublikasikan']) await a.locator('label', { hasText: l }).first().click();
    await click(a, 'Setujui & tampilkan');
    await a.getByText(/Dokumen belum lengkap: KTP/).first().waitFor();
    if (psql("select review_status from vendor_listings where name='Sanggar Uji Batara'") !== 'pending') throw new Error('disetujui tanpa dokumen');
    ok('peninjau tidak dapat menyetujui pelaku tanpa dokumen wajib');
    docsFor('pelaku@uji.id', ['ktp', 'face', 'portfolio', 'portfolio']);
    await hard(a, 'admin/screening');
    await a.getByText('Wajib lengkap').first().waitFor();
    await click(a, 'Setujui & tampilkan');
    await a.getByText('Centang ketiga pemeriksaan sebelum menyetujui.').waitFor();
    for (const l of ['Identitas diperiksa', 'Konteks budaya sesuai', 'Setuju dipublikasikan']) await a.locator('label', { hasText: l }).first().click();
    await click(a, 'Setujui & tampilkan');
    await a.getByText('Terverifikasi & tampil', { exact: true }).waitFor();
    ok('admin meninjau dan menyetujui pelaku');

    await hard(c, 'planner/pelaku');
    await c.locator('section[aria-label="Pelaku terdaftar"]').getByText('Sanggar Uji Batara').waitFor();
    ok('pelaku yang disetujui tampil di pencarian dalam ruang kerja');
    // keluarga non-admin tidak bisa membuka screening
    await c.evaluate(() => { location.hash = '#/admin/screening'; });
    await c.getByText('Khusus peninjau VAKSARA').waitFor();
    ok('akun bukan admin ditolak dari halaman peninjau');

    // ---------- Permintaan langsung ----------
    await hard(c, 'planner/pelaku');
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
    // Dana Amanah masih simulasi: akun nyata hanya menawarkan transfer langsung.
    if (await v.getByLabel('Cara pembayaran alur', { exact: true }).count()) throw new Error('pilihan Dana Amanah masih tampil di akun nyata');
    await v.getByText('Transfer langsung ke pelaku budaya.').waitFor();
    await click(v, 'Kirim penawaran versi baru');
    await phase(v, 'Penawaran tersedia');
    await v.waitForTimeout(800);
    if (psql(`select phase from cooperations where id='${caseId}'`) !== 'offered') throw new Error('penawaran tidak tersimpan');
    if (psql(`select data->'offer'->>'paymentMode' from cooperations where id='${caseId}'`) !== 'direct') throw new Error('penawaran akun nyata tidak memakai transfer langsung');
    ok('pelaku membalas dan mengirim penawaran dari perangkatnya sendiri');
    ok('akun nyata tidak menawarkan Dana Amanah simulasi; penawaran memakai transfer langsung');

    // ---------- Keluarga menyetujui (KTP wajib sebelum persetujuan) ----------
    docsFor('keluarga@uji.id', ['ktp']);
    await hard(c, 'planner/alur?case=' + encodeURIComponent(caseId));
    await phase(c, 'Penawaran tersedia');
    await click(c, 'Lanjut tinjau perjanjian');
    await phase(c, 'Persetujuan versi perjanjian');
    await c.getByText(/KTP keluarga sudah tersimpan/).waitFor();
    await c.locator('label', { hasText: /menyetujui versi 1/ }).first().click();
    await click(c, 'Setujui sebagai pengguna');
    await c.waitForTimeout(800);
    { const alerts = await c.getByRole('alert').allInnerTexts(); const ap = psql(`select data->'approvals' from cooperations where id='${caseId}'`); if (!/"couple": true/.test(ap)) throw new Error('persetujuan keluarga tidak tersimpan: ' + ap + ' alerts=' + JSON.stringify(alerts) + ' url=' + c.url() + ' text=' + (await c.locator('main').innerText()).slice(0, 1200)); }
    ok('keluarga melihat penawaran dan menyetujui');

    // ---------- Perubahan bersamaan: server menerapkan langkah pada data terbaru ----------
    await hard(v, 'vendor/alur?case=' + encodeURIComponent(caseId));
    await phase(v, 'Persetujuan versi perjanjian');
    psql(`update cooperations set updated_at = now() where id='${caseId}'`); // pihak lain mengubah setelah pelaku memuat halaman
    await v.locator('label', { hasText: /menyetujui versi 1/ }).first().click();
    await click(v, 'Setujui sebagai vendor');
    await v.waitForTimeout(1200);
    const ph = psql(`select phase from cooperations where id='${caseId}'`);
    if (!['active', 'running'].includes(ph)) throw new Error('fase setelah dua persetujuan: ' + ph);
    if (!/"actor": "vendor", "action": "approve"/.test(psql(`select data->'history' from cooperations where id='${caseId}'`))) throw new Error('persetujuan pelaku tidak dicatat server');
    ok('langkah dikirim ke fungsi server dan diterapkan pada data terbaru');
    ok('kedua pihak menyetujui dari perangkat masing-masing (fase ' + ph + ')');

    // ---------- Sengketa dan mediasi oleh peninjau ----------
    await hard(c, 'planner/alur?case=' + encodeURIComponent(caseId));
    await c.getByText('Masalah, mediasi, atau pembatalan').click();
    await c.getByLabel('Catatan alur', { exact: true }).fill('Jadwal hari kedua belum sesuai kesepakatan keluarga.');
    await click(c, 'Ajukan sengketa');
    await c.waitForTimeout(1000);
    if (psql(`select phase from cooperations where id='${caseId}'`) !== 'disputed') throw new Error('sengketa tidak tersimpan');
    ok('keluarga mengajukan sengketa; tersimpan di server');
    await hard(a, 'admin/alur?case=' + encodeURIComponent(caseId));
    await phase(a, 'Sengketa; menunggu mediasi');
    await a.getByLabel('Catatan alur', { exact: true }).fill('Mediasi: kedua pihak sepakat jadwal hari kedua dimajukan satu jam.');
    await click(a, 'Catat mediasi dan lanjutkan tahap sebelumnya');
    await a.waitForTimeout(1000);
    if (await a.getByText(/baru saja diperbarui pihak lain/).count()) throw new Error('mediasi peninjau ditolak server');
    if (psql(`select phase from cooperations where id='${caseId}'`) !== ph) throw new Error('mediasi tidak mengembalikan tahap sebelum sengketa');
    ok('peninjau mencatat mediasi dari perangkatnya; kerja sama kembali ke tahap ' + ph);

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

    // ---------- Pemberitahuan (pemicu database + lonceng) ----------
    { const count = (email, like) => psql(`select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = '${email}' and n.title like '${like}'`);
      if (count('pelaku@uji.id', 'Permintaan baru dari%') === '0') throw new Error('pelaku tidak diberi tahu permintaan baru');
      if (count('pelaku@uji.id', 'Profil Anda disetujui') === '0') throw new Error('pelaku tidak diberi tahu profil disetujui');
      if (count('keluarga@uji.id', 'Penawaran dari%') === '0') throw new Error('keluarga tidak diberi tahu penawaran');
      if (count('admin@uji.id', 'Sengketa menunggu mediasi%') === '0') throw new Error('peninjau tidak diberi tahu sengketa');
      if (count('keluarga@uji.id', 'Permintaan baru dari%') !== '0') throw new Error('pelaku tindakan ikut diberi tahu tindakannya sendiri');
      ok('pemicu database mencatat pemberitahuan untuk pihak yang tepat'); }
    await hard(v, 'vendor/ringkasan');
    await v.getByRole('button', { name: 'Notifikasi', exact: true }).click();
    await v.getByText(/Permintaan baru dari/).first().waitFor();
    await v.waitForTimeout(800);
    if (psql("select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = 'pelaku@uji.id' and n.read_at is null") !== '0') throw new Error('membuka lonceng tidak menandai dibaca');
    ok('lonceng menampilkan pemberitahuan server dan menandainya dibaca');

    // ---------- Profil yang diubah setelah disetujui ditinjau ulang ----------
    await hard(v, 'vendor/profil');
    await v.getByText('Terverifikasi & tampil', { exact: true }).waitFor();
    await v.getByLabel('Deskripsi layanan', { exact: true }).fill('Pemandu adat dan perias untuk mappacci, akad, dan resepsi Bugis-Makassar di Makassar dan Gowa. Kini juga melayani Maros.');
    await click(v, 'Simpan perubahan');
    await v.getByText(/disembunyikan sementara sampai peninjau menyetujui ulang/).first().waitFor();
    if (psql("select review_status from vendor_listings where name='Sanggar Uji Batara'") !== 'pending') throw new Error('profil yang diubah tetap berstatus disetujui');
    if (psql("select identity_ok and culture_ok and consent_ok from vendor_listings where name='Sanggar Uji Batara'") !== 't') throw new Error('hasil pemeriksaan lama hilang');
    ok('profil yang diubah setelah disetujui kembali menunggu peninjauan; hasil pemeriksaan lama tersimpan');
    { const anon = await device(); await anon.goto(base + 'jelajahi'); await anon.reload(); await anon.waitForLoadState('networkidle'); await anon.waitForTimeout(1200);
      if (await anon.getByText('Sanggar Uji Batara').count()) throw new Error('profil yang menunggu peninjauan ulang masih tampil publik');
      if (await anon.getByText('Profil contoh', { exact: true }).count()) throw new Error('profil contoh tampil kepada pengunjung umum di server nyata');
      ok('pengunjung umum tidak melihat profil yang ditinjau ulang maupun profil contoh'); }

    // ---------- Halaman pemilik menolak akun bukan admin ----------
    { const o = await device(1280);
      await o.goto(base + 'pemilik'); await o.reload(); await o.waitForLoadState('networkidle');
      await o.getByLabel('Email pemilik', { exact: true }).fill('keluarga@uji.id');
      await o.getByLabel('Sandi pemilik', { exact: true }).fill('rahasia123');
      await o.getByRole('button', { name: 'Masuk', exact: true }).click();
      await o.getByText(/bukan akun pemilik VAKSARA/).waitFor();
      if (await o.evaluate(() => localStorage.getItem('vx-auth-v1'))) throw new Error('akun bukan admin tetap masuk lewat halaman pemilik');
      ok('halaman pemilik menolak akun bukan admin dan tidak meninggalkan sesi'); }

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
