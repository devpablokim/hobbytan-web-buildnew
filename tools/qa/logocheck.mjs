import { chromium } from 'playwright';
import fs from 'fs';
const B=new URL('../../public/assets/brand', import.meta.url).pathname;
const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:2000, height:302 } });
for (const [name,bg] of [['black','#fff'],['white','#000']]) {
  const svg = fs.readFileSync(`${B}/hobbytan-logo-${name}.svg`,'utf8');
  // place the SVG at the same pixel box as the source (viewBox origin 28,28 size 1943x246)
  await p.setContent(`<body style="margin:0;background:${bg}"><div style="position:absolute;left:28px;top:28px;width:1943px;height:246px">${svg.replace('<svg ','<svg width="1943" height="246" ')}</div></body>`);
  await p.screenshot({ path: `${process.argv[2]}/logo_render_${name}.png` });
}
await b.close();
