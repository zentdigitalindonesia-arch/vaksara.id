const {chromium}=require('playwright'),path=require('path'),assert=require('assert');const {pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({channel:process.env.QA_BROWSER||'msedge'});const page=await b.newPage({viewport:{width:1366,height:900}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=pathToFileURL(path.join(__dirname,'dist/index.html')).href+'#/';let n=0;const ok=(s,c=true)=>{assert.ok(c,s);console.log('PASS',s);n++;};
const click=name=>page.getByRole('button',{name,exact:true}).first().click();
// Arah 2: pelaku mengajukan minat pada permintaan terbuka keluarga
await page.goto(base+'vendor/peluang');await page.locator('#opportunity-or-2').getByRole('button',{name:'Ajukan minat'}).click();
await page.getByLabel('Pesan minat or-2').fill('Kami pernah mendampingi mappacci dan akad dua hari.');await page.getByLabel('Perkiraan harga or-2').fill('9500000');await click('Kirim minat');
await page.locator('#opportunity-or-2').getByText('Minat Anda terkirim').waitFor();ok('pelaku mengajukan minat');
await page.goto(base+'planner/permintaan-terbuka');const card=page.locator('#open-request-or-2');await card.getByText('1 pelaku mengajukan minat').waitFor();ok('keluarga melihat minat pelaku');
await card.getByRole('button',{name:'Pilih pelaku ini'}).click();await page.waitForURL(u=>u.hash.includes('case=or-case-'));ok('memilih pelaku membuat kerja sama');
await page.goto(base+'vendor/permintaan');const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('vaksara-connected-demo-v1')).cases.find(c=>c.id.startsWith('or-case-')).id);
ok('permintaan resmi masuk kotak masuk pelaku',await page.locator('#case-card-'+id).count()===1);
await page.goto(base+'vendor/peluang');await page.locator('#opportunity-or-2').getByText('Keluarga memilih Anda').waitFor();ok('pelaku melihat dirinya dipilih');
// Keluarga memasang permintaan baru
await page.goto(base+'planner/permintaan-terbuka');await click('Pasang permintaan');await page.getByLabel('Judul permintaan').fill('Penari pakarena untuk resepsi');await page.getByLabel('Rincian permintaan').fill('Tiga penari pakarena selama 15 menit saat resepsi.');await click('Pasang permintaan terbuka');
await page.getByText('Penari pakarena untuk resepsi').first().waitFor();await page.goto(base+'vendor/peluang');ok('permintaan baru terlihat pelaku',await page.getByText('Penari pakarena untuk resepsi').count()>0);
// Setor pelunasan Dana Amanah setelah BAST diterima
await page.evaluate(()=>{const f=JSON.parse(localStorage.getItem('vaksara-connected-demo-v1'));const c=f.cases.find(x=>x.id==='b2');c.phase='accepted';c.evidence='Hasil rias diserahkan dan diperiksa.';localStorage.setItem('vaksara-connected-demo-v1',JSON.stringify(f));});
await page.goto(base+'planner/pembayaran?case=b2');await page.reload();await page.getByRole('button',{name:'Setor via virtual account (simulasi)'}).waitFor();ok('tombol setor pelunasan tersedia setelah BAST');
await page.getByLabel('Nominal pembayaran alur').fill('5950000');await page.locator('label',{hasText:'Saya memahami dana ditahan'}).click();await click('Setor via virtual account (simulasi)');
await page.getByText('Setoran Rp5.950.000',{exact:false}).waitFor();ok('pelunasan tercatat di Dana Amanah');
// Kanban
await page.goto(base+'planner/jadwal');await page.getByRole('button',{name:'Pindahkan Kirim undangan gelombang pertama ke Sedang dikerjakan'}).click();
ok('kartu pindah kolom',await page.locator('[data-column="doing"]').getByText('Kirim undangan gelombang pertama').count()===1);
await click('Tambah tugas');await page.getByPlaceholder('Contoh: Konfirmasi jumlah kursi tambahan').fill('Pesan bosara untuk keluarga');await page.getByRole('radio',{name:'Tinggi'}).click();await click('Tambahkan');
const t=page.locator('[data-column="todo"] li',{hasText:'Pesan bosara untuk keluarga'});ok('tugas baru dengan prioritas tinggi',(await t.innerText()).includes('Tinggi'));
await page.reload();ok('tugas tersimpan setelah reload',await page.getByText('Pesan bosara untuk keluarga').count()===1);
ok('tanpa error',errors.length===0);console.log('TOTAL DUA ARAH',n,'passed');await b.close();})().catch(e=>{console.error(e);process.exitCode=1;});
