const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
// Demo terpandu: pengunjung baru dapat menuntaskan satu kerja sama Dana Amanah tanpa berpindah menu.
(async()=>{const browser=await chromium.launch({channel:process.env.QA_BROWSER||'msedge',headless:true});let passed=0;try{
for(const width of [1440,390]){
const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const check=(label,condition)=>{assert.ok(condition,label);console.log('PASS',label);passed++;};
const base=pathToFileURL(path.join(__dirname,'dist/index.html')).href+'#/';
await page.goto(base+'beranda');await page.getByRole('heading',{name:'Mulai dari mana?'}).waitFor();
await page.getByRole('button',{name:/Saya ingin melihat cara kerjanya/}).click();await page.getByRole('button',{name:'Mulai demo',exact:true}).waitFor();check(`${width}: beranda membuka demo terpandu`,true);
await page.getByRole('button',{name:'Mulai demo',exact:true}).click();
for(let i=1;i<=8;i++){await page.getByRole('button',{name:`Jalankan langkah ${i}`,exact:true}).click();}
await page.getByText('Demo selesai',{exact:true}).waitFor();
const flow=await page.evaluate(()=>JSON.parse(localStorage.getItem('vaksara-connected-demo-v1')));const c=flow.cases.find(x=>x.id.startsWith('tur-'));
check(`${width}: delapan langkah menutup kerja sama`,c.phase==='completed');
check(`${width}: Dana Amanah cair penuh dengan dua persetujuan`,c.amanah.released===6500000&&c.amanah.held===0);
check(`${width}: tidak melebar keluar layar`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await page.getByRole('button',{name:'Buka sebagai pelaku budaya',exact:true}).click();await page.getByLabel('Langkah berikutnya').waitFor();
check(`${width}: halaman kerja sama menampilkan langkah berikutnya`,(await page.getByLabel('Langkah berikutnya').innerText()).includes('Kerja sama selesai'));
check(`${width}: tanpa error runtime`,errors.length===0);
if(width===390){fs.mkdirSync(path.join(__dirname,'qa-results'),{recursive:true});await page.screenshot({path:path.join(__dirname,'qa-results/demo-mobile.png'),fullPage:true});}
await page.close();}
console.log('TOTAL DEMO TERPANDU',passed,'passed');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
