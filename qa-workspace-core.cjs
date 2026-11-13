const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');const cache={};
function load(name){if(cache[name])return cache[name];const source=fs.readFileSync(path.join(__dirname,'src/utils/'+name+'.ts'),'utf8');const box={exports:{},structuredClone,require:ref=>load(ref.replace('./',''))};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);return cache[name]=box.exports;}
const {demoCooperations}=load('demo-cooperations'),{validFlow,transitionFlow,confirmedTotal}=load('cooperation'),{caseRoute,casesForView,visibleCases,nextView}=load('workspace');
test('contoh data dibentuk melalui transisi yang sah',()=>{const f=demoCooperations('Vendor A');assert.equal(validFlow(f),true);assert.equal(f.cases.length,9);assert.equal(f.cases.find(c=>c.id==='a4').phase,'inquiry');assert.equal(f.cases.find(c=>c.id==='a3').phase,'handover');});
test('menu pengguna dan vendor mempertahankan ID kasus',()=>{assert.equal(caseRoute('couple','agreements','a2'),'trust?case=a2');assert.equal(caseRoute('vendor','agreements','a2'),'vendor/kontrak?case=a2');});
test('kotak masuk tidak menampilkan draf atau permintaan vendor lain',()=>{let f=demoCooperations('Vendor A');f=transitionFlow(f,{type:'lead',actor:'couple',id:'draft',time:'demo',data:{vendor:'Vendor A',date:'2027-09-10',request:'Kebutuhan baru belum dikirim'}});assert.equal(visibleCases(f,'vendor').length,4);f.accounts.vendor.name='Vendor B';assert.equal(visibleCases(f,'vendor').length,0);});
test('konfirmasi pembayaran mengubah ringkasan sumber yang sama',()=>{let f=demoCooperations('Vendor A');const before=confirmedTotal(f.cases.find(c=>c.id==='a1'));f=transitionFlow(f,{type:'payment',actor:'couple',caseId:'a1',id:'manual',time:'demo',data:{amount:4550000,proof:'Bukti demo tambahan'}});assert.equal(confirmedTotal(f.cases.find(c=>c.id==='a1')),before);f=transitionFlow(f,{type:'confirm_payment',actor:'vendor',caseId:'a1',id:'confirm',time:'demo',data:{paymentId:'manual'}});assert.equal(confirmedTotal(f.cases.find(c=>c.id==='a1')),6500000);assert.equal(casesForView(f.cases,'payments').find(c=>c.id==='a1').payments.length,2);});
test('halaman BAST dan keuangan memilih kasus sesuai tahap',()=>{const f=demoCooperations('Vendor A');assert.equal(casesForView(f.cases,'handover').length,2);assert.equal(casesForView(f.cases,'payments').length,4);assert.equal(nextView(f.cases.find(c=>c.id==='a2')),'agreements');});
test('perubahan satu kasus tidak memodifikasi kasus lainnya',()=>{const f=demoCooperations('Vendor A'),original=JSON.stringify(f.cases.find(c=>c.id==='a1'));const next=transitionFlow(f,{type:'reply',actor:'vendor',caseId:'a4',id:'respond',time:'demo',data:{note:'Respons khusus untuk permintaan Agustus.'}});assert.equal(JSON.stringify(next.cases.find(c=>c.id==='a1')),original);assert.equal(f.cases.find(c=>c.id==='a4').phase,'inquiry');});
test('langkah berikutnya menunjuk pihak yang tepat',()=>{
  const {nextStep}=load('next-step');
  const base={id:'x',vendor:'V',eventDate:'2027-06-12',request:'r',phase:'inquiry',offer:null,approvals:{couple:false,vendor:false},payments:[],reply:'',reviewNote:'',evidence:'',history:[]};
  assert.equal(nextStep(base).actor,'vendor');
  assert.equal(nextStep({...base,phase:'offered'}).actor,'couple');
  assert.equal(nextStep({...base,phase:'contract',approvals:{couple:true,vendor:false}}).actor,'vendor');
  const offer={version:1,price:100,deposit:30,scope:'s',terms:'t',days:[],paymentMode:'amanah'};
  assert.equal(nextStep({...base,phase:'active',offer}).title,'Setor DP ke Dana Amanah');
  assert.equal(nextStep({...base,phase:'running',offer,amanah:{held:30,released:0,refunded:0,release:{amount:30,by:'vendor',note:'n'}}}).actor,'couple');
  assert.equal(nextStep({...base,phase:'completed'}).actor,null);
});
