import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{ width:1440, height:900 } });
await p.goto(process.argv[2]); await p.waitForTimeout(7500);
await p.mouse.move(700, 450);
for (const [sel, off] of [['#services', -0.18], ['#clients', 0.15], ['#capability', -0.2], ['#contact', 0.22], ['#footer', -0.12], ['#results', 0.5]]) {
  const target = await p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY, sel);
  const start = Math.round(target + off * 900) - 300;
  await p.evaluate((y) => window.scrollTo(0, y), start); await p.waitForTimeout(800);
  // a real wheel gesture that stops near the edge
  for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(40); }
  await p.waitForTimeout(2600);
  const y = await p.evaluate(() => Math.round(scrollY));
  const t2 = await p.evaluate((sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top + scrollY), sel);
  console.log(sel.padEnd(12), 'rested at', y, '| section top', t2, '| diff', y - t2, Math.abs(y - t2) <= 3 ? 'SNAPPED' : (Math.abs(y - t2) > 0.3 * 900 ? '(far from edge: no snap expected)' : 'NOT SNAPPED'));
}
await b.close();
