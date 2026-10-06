import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const [w,h] = (process.argv[3]||'1440x900').split('x').map(Number);
const p = await b.newPage({ viewport:{ width:w, height:h } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(process.argv[2]); await p.waitForTimeout(8000);
for (const f of (process.argv[4]||'0.2,0.33,0.48').split(',').map(Number)) {
  const y = await p.evaluate((f)=>{const el=document.querySelector('#who');return el.offsetTop+(el.offsetHeight-innerHeight)*f;}, f);
  await p.evaluate((y)=>window.scrollTo(0,y), y); await p.waitForTimeout(3500);
  await p.screenshot({ path:`word_${w}_${f}.png` });
}
console.log('errors', errs);
await b.close();
