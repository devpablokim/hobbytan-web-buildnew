import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
const bad=[]; p.on('response', r=>{ if(r.url().includes('.webp')) bad.push(r.status()+' '+r.url().replace(/^https?:\/\/[^/]+/,'')); });
await p.goto(process.argv[2], { waitUntil:'networkidle' });
await p.waitForTimeout(1500);
console.log(bad.join('\n'));
await b.close();
