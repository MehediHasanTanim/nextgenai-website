// Dev-time: renders marketing images into assets/marketing/ from products.mjs + assets/screens + assets/icons.
//   <slug>-cover.webp  1200x750   (text-free, used on the home-page cards)
//   <slug>-hero.jpg    1600x900   (name + tagline + devices, used on detail pages and as the share image)
//   ../assets/og.jpg   1200x630   (site share image)
// Usage: node marketing.mjs [slug]
import fs from 'node:fs';
import path from 'node:path';
import { launch, serve } from './lib.mjs';
import { products } from './products.mjs';

const SITE = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(SITE, 'assets', 'marketing');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2];

const iconUrl = (slug) => fs.existsSync(path.join(SITE, 'assets/icons', slug + '.png')) ? `assets/icons/${slug}.png` : `assets/icons/${slug}.svg`;
const shot = (p, f) => `assets/screens/${p.slug}/${f}.webp`;

/** Device composition inside a w x h box. */
function scene(p, w, h) {
  const img = (i) => shot(p, p.screens[i][0]);
  const framed = p.slug === 'hisab'; // Hisab captures already include a device frame
  const phone = (src, ph, left, top, rot, z) => {
    const pw = Math.round(ph * 390 / 844);
    return `<div class="phone ${framed ? 'framed' : ''}" style="width:${pw}px;height:${ph}px;left:${Math.round(left - pw / 2)}px;top:${Math.round(top)}px;transform:rotate(${rot}deg);z-index:${z};border-radius:${Math.round(ph * 0.062)}px;border-width:${framed ? 0 : Math.max(5, Math.round(ph * 0.012))}px"><img src="${src}"></div>`;
  };
  const [a, b, c] = p.hero;
  if (p.hero.length === 2) { // products with only two phone-shaped screens
    return phone(img(b), h * 0.74, w * 0.7, h * 0.2, 6, 1) + phone(img(a), h * 0.86, w * 0.36, h * 0.1, -5, 3);
  }
  if (p.webHero) {
    const ww = Math.round(w * 0.86), wh = Math.round(ww * 538 / 1536);
    return `<div class="web" style="width:${ww}px;height:${wh}px;left:${Math.round(w * 0.02)}px;top:${Math.round(h * 0.2)}px;border-radius:${Math.round(h * 0.022)}px"><img src="assets/screens/${p.slug}/${p.web[0][0]}.webp"></div>`
      + phone(img(a), h * 0.82, w * 0.78, h * 0.18, 4, 3) + phone(img(b), h * 0.62, w * 0.5, h * 0.52, -5, 2);
  }
  return phone(img(b), h * 0.7, w * 0.22, h * 0.26, -8, 1) + phone(img(c), h * 0.7, w * 0.78, h * 0.26, 8, 1) + phone(img(a), h * 0.88, w * 0.5, h * 0.1, 0, 3);
}

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','Noto Sans Bengali',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stage{position:relative;overflow:hidden}
.stage::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 70% at 85% 0%,rgba(255,255,255,.28),transparent 62%),radial-gradient(50% 60% at 0% 100%,rgba(0,0,0,.28),transparent 65%)}
.stage::after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 1.2px,transparent 1.4px);background-size:34px 34px;mask-image:linear-gradient(120deg,transparent 30%,#000);opacity:.55}
.scene{position:absolute;overflow:hidden}
.phone{position:absolute;background:#0d0d12;border-style:solid;border-color:#0d0d12;overflow:hidden;box-shadow:0 40px 70px -24px rgba(0,0,0,.6),0 0 0 1.5px rgba(255,255,255,.12)}
.phone.framed{background:transparent;box-shadow:none;filter:drop-shadow(0 34px 38px rgba(0,0,0,.45))}
.phone img{display:block;width:100%;height:100%;object-fit:cover}
.web{position:absolute;overflow:hidden;background:#fff;box-shadow:0 40px 70px -24px rgba(0,0,0,.55),0 0 0 1.5px rgba(255,255,255,.14);transform:rotate(-3deg)}
.web img{display:block;width:100%;height:100%;object-fit:cover}
`;

function coverHtml(p) {
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&family=Noto+Sans+Bengali:wght@500;700&display=swap"><style>${BASE_CSS}
.stage{width:1200px;height:750px;background:linear-gradient(135deg,${p.grad[0]},${p.grad[1]})}
.scene{inset:0}</style>
<div class="stage"><div class="scene" style="width:1200px;height:750px">${scene(p, 1200, 750)}</div></div>`;
}

function heroHtml(p) {
  const dark = !p.light;
  const ink = dark ? p.ink : p.ink;
  const long = p.name.length > 11;
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=Noto+Sans+Bengali:wght@500;700&display=swap"><style>${BASE_CSS}
.stage{width:1600px;height:900px;background:linear-gradient(135deg,${p.grad[0]},${p.grad[1]});color:${ink}}
.copy{position:absolute;left:96px;top:0;bottom:0;width:690px;display:flex;flex-direction:column;justify-content:center;gap:26px;z-index:5}
.ic{width:116px;height:116px;border-radius:28px;box-shadow:0 18px 40px -14px rgba(0,0,0,.5)}
h1{font:700 ${long ? 80 : 104}px/1.02 'Space Grotesk',sans-serif;letter-spacing:-.03em}
.bn{font:700 46px/1.3 'Noto Sans Bengali',sans-serif;opacity:.88}
.tag{font:500 34px/1.35 Inter,sans-serif;opacity:.92;max-width:600px}
.chips{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.chips span{padding:11px 20px;border-radius:99px;font:600 20px Inter,sans-serif;background:${dark ? 'rgba(255,255,255,.16)' : 'rgba(23,51,31,.1)'};border:1.5px solid ${dark ? 'rgba(255,255,255,.28)' : 'rgba(23,51,31,.22)'}}
.brand{position:absolute;left:96px;bottom:52px;font:600 24px 'Space Grotesk',sans-serif;opacity:.8;letter-spacing:-.01em;z-index:5}
.scene{left:810px;top:0;width:790px;height:900px}</style>
<div class="stage">
  <div class="copy"><img class="ic" src="${iconUrl(p.slug)}"><h1>${p.name}</h1>${p.bn ? `<div class="bn">${p.bn}</div>` : ''}<div class="tag">${p.tagline}</div><div class="chips">${p.chips.map(c => `<span>${c}</span>`).join('')}</div></div>
  <div class="scene">${scene(p, 790, 900)}</div>
  <div class="brand">nextgenai</div>
</div>`;
}

function ogHtml() {
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Space+Grotesk:wght@600;700&display=swap"><style>${BASE_CSS}
.stage{width:1200px;height:630px;background:linear-gradient(135deg,#312e81,#0f766e);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 80px;gap:22px}
h1{font:700 84px/1.02 'Space Grotesk',sans-serif;letter-spacing:-.03em;max-width:900px}
p{font:500 30px/1.4 Inter,sans-serif;opacity:.9;max-width:780px}
.row{display:flex;gap:14px;margin-top:18px}.row img{width:78px;height:78px;border-radius:19px;box-shadow:0 14px 30px -10px rgba(0,0,0,.5)}
.w{font:600 30px 'Space Grotesk',sans-serif;opacity:.85}</style>
<div class="stage"><div class="w">nextgenai</div><h1>AI products built for Bangladesh.</h1><p>Bangla-first, offline-first, privacy-respecting apps for finance, health, education and everyday life.</p><div class="row">${products.map(p => `<img src="${iconUrl(p.slug)}">`).join('')}</div></div>`;
}

const srv = await serve(SITE);
const b = await launch();
async function render(html, w, h, file, opts) {
  const page = await b.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(html.replace(/(src=")(assets\/)/g, `$1${srv.origin}/$2`), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: file, ...opts });
  await page.close();
  console.log('ok', path.relative(SITE, file), Math.round(fs.statSync(file).size / 1024) + 'KB');
}
for (const p of products) {
  if (only && only !== p.slug && only !== 'og') continue;
  if (only === 'og') break;
  await render(coverHtml(p), 1200, 750, path.join(OUT, `${p.slug}-cover.webp`), { type: 'webp', quality: 86 });
  await render(heroHtml(p), 1600, 900, path.join(OUT, `${p.slug}-hero.jpg`), { type: 'jpeg', quality: 88 });
}
if (!only || only === 'og') await render(ogHtml(), 1200, 630, path.join(SITE, 'assets', 'og.jpg'), { type: 'jpeg', quality: 88 });
await b.close(); srv.close();
