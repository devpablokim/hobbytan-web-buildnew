import { chromium } from 'playwright';
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [W,H] of [[720,712],[390,844]]) {
  const p = await b.newPage({ viewport:{ width:W, height:H } });
  await p.goto(url, { waitUntil:'load' }); await p.waitForTimeout(7000);
  await p.screenshot({ path: `${out}/${W}-intro.png` });
  const leak = await p.evaluate(() => [...document.querySelectorAll('.who__title, .who__desc')].map(e => getComputedStyle(e).visibility));
  console.log(W, 'title/desc visibility at intro:', leak.join(','));
  for (const f of [0.3, 0.6, 0.95]) {
    await p.evaluate((f) => { const el=document.querySelector('.cap__cards'); const st=[...window.ScrollTriggerInstances||[]]; const top=el.getBoundingClientRect().top+scrollY; window.scrollTo(0, top + f*innerHeight*1.8); }, f);
    await p.waitForTimeout(2200);
    await p.screenshot({ path: `${out}/${W}-cards-${f}.png` });
    const off = await p.evaluate(() => [...document.querySelectorAll('.pcard')].map(c => { const r=c.getBoundingClientRect(); return (r.left<-2||r.right>innerWidth+2||r.top<-2||r.bottom>innerHeight+2) ? 'OFF' : 'ok'; }).join(','));
    console.log(W, 'cards', f, off);
  }
  await p.close();
}
await b.close();
