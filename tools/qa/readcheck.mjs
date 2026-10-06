// Usage: node readcheck.mjs <url> <outprefix> [stops as comma list of 0..1] [w] [h]
import { chromium } from 'playwright';
const [url, out, stopsArg, W='1440', H='900'] = process.argv.slice(2);
const stops = (stopsArg || '0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1').split(',').map(Number);
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{ width:+W, height:+H } });
const errs=[]; p.on('pageerror', e=>errs.push(e.message));
await p.goto(url, { waitUntil:'load' }); await p.waitForTimeout(5500);
const Hs = await p.evaluate(()=>document.documentElement.scrollHeight);
const lows = new Map();
let i=0;
for (const s of stops) {
  await p.evaluate(y=>window.scrollTo(0,y), Math.round(s*(Hs-+H))); await p.waitForTimeout(1600);
  await p.screenshot({ path: `${out}_${String(i++).padStart(2,'0')}.png` });
  const found = await p.evaluate(() => {
    const lum = c => { const m=c.match(/[\d.]+/g); if(!m) return null; const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return {L:0.2126*r+0.7152*g+0.0722*b, a:m[3]===undefined?1:+m[3]}; };
    const bgOf = el => { for (let e=el; e; e=e.parentElement) { const cs=getComputedStyle(e); if (e.tagName==='CANVAS') return 0.004; const bg=lum(cs.backgroundColor); if (bg && bg.a>0.5) return bg.L; if (cs.backgroundImage && cs.backgroundImage!=='none' && !cs.backgroundImage.startsWith('linear')) return 0.02; } return lum(getComputedStyle(document.body).backgroundColor).L; };
    const res=[];
    const walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t=walker.currentNode; const txt=t.textContent.trim(); if(!txt) continue;
      const el=t.parentElement; const r=el.getBoundingClientRect();
      if (r.width<2||r.height<2||r.bottom<0||r.top>innerHeight) continue;
      const cs=getComputedStyle(el); if (cs.visibility==='hidden') continue;
      let op=1; for (let e=el;e;e=e.parentElement) op*=+getComputedStyle(e).opacity; if (op<0.05) continue;
      const fg=lum(cs.color); if(!fg) continue;
      const stroke = cs.webkitTextStrokeWidth && parseFloat(cs.webkitTextStrokeWidth)>0 && fg.a===0;
      const fgL = stroke ? lum(cs.webkitTextStrokeColor).L : fg.L;
      const bL=bgOf(el); const ratio=(Math.max(fgL,bL)+0.05)/(Math.min(fgL,bL)+0.05);
      // under a hero canvas we also flag near-black text
      if (ratio*Math.max(op,0.001) < 3) res.push(`${ratio.toFixed(2)} op${op.toFixed(2)} ${cs.color} ${parseFloat(cs.fontSize)}px "${txt.slice(0,40)}"`);
    }
    return res;
  });
  for (const f of found) lows.set(f.replace(/^[\d.]+ op[\d.]+ /,''), f);
}
console.log('errors', JSON.stringify(errs.slice(0,5)));
console.log('low-contrast', lows.size); for (const v of [...lows.values()].slice(0,40)) console.log('  ', v);
await b.close();
