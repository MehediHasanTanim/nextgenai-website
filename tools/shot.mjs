// Dev helper: node shot.mjs <url-path> <out.png> [width] [height] [scrollY] [fullPage]
import { launch } from './lib.mjs';
const [, , path, out, w = 1440, h = 900, sy = 0, full = ''] = process.argv;
const b = await launch(); const page = await b.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: +w < 500 });
await page.goto('http://127.0.0.1:4173' + path, { waitUntil: 'networkidle2' });
await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important}' });
if (+sy) await page.evaluate(y => window.scrollTo(0, y), +sy);
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: out, fullPage: !!full });
await b.close();
