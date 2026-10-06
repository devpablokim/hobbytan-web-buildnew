import { chromium } from 'playwright';
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [W,H] of [[1440,900],[390,844]]) {
  const p = await b.newPage({ viewport:{ width:W, height:H } });
  await p.goto(url); await p.waitForTimeout(7000);
  await p.evaluate(() => { const el=document.querySelector('#clients'); window.scrollTo(0, el.getBoundingClientRect().top+scrollY + el.offsetHeight*0.35 - innerHeight/2); });
  await p.waitForTimeout(2500);
  const broken = await p.evaluate(() => [...document.querySelectorAll('.crow img')].filter(i => !i.complete || i.naturalWidth === 0).length);
  const total = await p.evaluate(() => document.querySelectorAll('.crow img').length);
  console.log(W, 'logo imgs', total, 'broken', broken);
  await p.screenshot({ path: `${out}/clients-${W}.png` });
  await p.close();
}
await b.close();
