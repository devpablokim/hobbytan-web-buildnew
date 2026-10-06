// node ours.mjs <url> <outdir> [w] [h]
import { chromium } from 'playwright';
import fs from 'fs';
const [url, out, W='1440', H='900'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{ width:+W, height:+H } });
const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error' && !/ERR_CERT/.test(m.text())) errs.push(m.text()); });
await p.goto(url, { waitUntil:'load' });
await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/00-preloader.png` });
await p.waitForTimeout(5500); await p.screenshot({ path: `${out}/01-intro.png` });
const visibleText = () => p.evaluate(() => {
  const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; const txt = t.textContent.trim(); if (!txt) continue; const el = t.parentElement;
    if (el.closest('.preloader')) continue; const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); op *= +cs.opacity; if (cs.visibility === 'hidden') op = 0; }
    if (op > 0.05) out.add(txt.slice(0, 24)); }
  return [...out]; });
console.log('INTRO visible text:', JSON.stringify(await visibleText()));
const stops = [
  ['#who',0.02],['#who',0.08],['#who',0.2],['#who',0.4],['#who',0.55],['#who',0.62],['#who',0.8],
  ['#services',0.25],['#services',0.6],['#clients',0.15],['#clients',0.5],['#results',0.08],['#results',0.4],['#results',0.75],
  ['#capability',0.02],['#capability',0.3],['#capability',0.55],['#capability',0.85],['#contact',0.35],['#footer',0.1],['#next',1.0],
];
let n=2;
const lows = new Map();
for (const [sel, f] of stops) {
  await p.evaluate(([sel,f]) => { const el=document.querySelector(sel); const top=el.getBoundingClientRect().top+scrollY; const span=Math.max(0, el.offsetHeight-innerHeight); window.scrollTo(0, top + f*span); }, [sel,f]);
  await p.waitForTimeout(1700);
  await p.screenshot({ path: `${out}/${String(n++).padStart(2,'0')}-${sel.slice(1)}-${f}.png` });
  if (sel==='#who' && f<=0.08) console.log(`WHO@${f} visible text:`, JSON.stringify(await visibleText()));
  if (sel==='#services' && f===0.6) { await p.mouse.move(1000,450); await p.waitForTimeout(400); await p.mouse.click(1000,450); await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/${String(n++).padStart(2,'0')}-services-next.png` }); }
  const found = await p.evaluate(() => {
    const lum = c => { const m=c.match(/[\d.]+/g); if(!m) return null; const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return {L:0.2126*r+0.7152*g+0.0722*b, a:m[3]===undefined?1:+m[3]}; };
    const bgOf = el => { for (let e=el; e; e=e.parentElement) { const cs=getComputedStyle(e); const bg=lum(cs.backgroundColor); if (bg && bg.a>0.5) return bg.L; if (cs.backgroundImage && cs.backgroundImage.startsWith('linear')) return 0.05; } return 0.0; /* fixed WebGL stage is dark */ };
    const res=[]; const walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t=walker.currentNode; const txt=t.textContent.trim(); if(!txt) continue;
      const el=t.parentElement; if (el.closest('.preloader')) continue; const r=el.getBoundingClientRect();
      if (r.width<2||r.height<2||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth) continue;
      const cs=getComputedStyle(el); if (cs.visibility==='hidden') continue;
      let op=1; for (let e=el;e;e=e.parentElement) op*=+getComputedStyle(e).opacity; if (op<0.3) continue;
      const fg=lum(cs.color); if(!fg||fg.a<0.3) continue;
      const bL=bgOf(el); const ratio=(Math.max(fg.L,bL)+0.05)/(Math.min(fg.L,bL)+0.05);
      if (ratio < 4.5 || parseFloat(cs.fontSize) < 11) res.push(`${ratio.toFixed(2)} ${parseFloat(cs.fontSize)}px ${cs.color} "${txt.slice(0,30)}"`);
    }
    return res;
  });
  for (const f2 of found) lows.set(f2.replace(/^[\d.]+ /,''), `${sel}@${f}: ${f2}`);
}
console.log('errors', JSON.stringify(errs.slice(0,6)));
console.log('readability issues', lows.size); for (const v of [...lows.values()].slice(0,30)) console.log('  ', v);
await b.close();
