// Shared helpers for the dev-time image pipeline (not used by the deployed site).
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

/** Tiny static server so mockups can fetch their sibling scripts (file:// blocks that). */
export function serve(root) {
  const srv = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'access-control-allow-origin': '*' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ origin: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() })));
}

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export function launch() {
  return puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
}

const STATUS_BAR = `
<div id="__sb" style="position:absolute;left:0;top:0;width:390px;height:48px;z-index:99999;pointer-events:none;font-family:-apple-system,'Noto Sans',system-ui,sans-serif">
  <div style="position:absolute;left:34px;top:15px;font-size:16px;font-weight:600;color:#111;letter-spacing:-.2px">9:41</div>
  <div style="position:absolute;right:26px;top:17px;display:flex;gap:6px;align-items:center">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="#111"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 6.9a6 6 0 0 1 8 0M6.4 9.5a2.6 2.6 0 0 1 3.2 0"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".6" y=".6" width="21.8" height="10.8" rx="3.2" fill="none" stroke="#111" opacity=".45"/><rect x="2" y="2" width="19" height="8" rx="2" fill="#111"/><rect x="23.4" y="4" width="1.8" height="4" rx=".9" fill="#111" opacity=".45"/></svg>
  </div>
</div>
<div style="position:absolute;left:132px;top:11px;width:126px;height:36px;border-radius:20px;background:#000;z-index:99999;pointer-events:none"></div>
<div id="__hi" style="position:absolute;left:125px;bottom:8px;width:140px;height:5px;border-radius:3px;background:#111;opacity:.85;z-index:99999;pointer-events:none"></div>`;

/** Render a 390x844 design mockup (.dc.html, given as a URL) to a PNG, adding a status bar + home indicator. */
export async function shotMock(browser, file, out, { dpr = 2, chrome = true, wait = 700, topInset = 0, rootSel = 'x-dc > div', dark = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: dpr });
  await page.goto(file, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise(r => setTimeout(r, wait));
  const box = await page.evaluate((sel) => {
    const root = document.querySelector(sel) || document.body.firstElementChild;
    const r = root.getBoundingClientRect();
    root.style.position = 'relative';
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, rootSel);
  if (topInset) await page.evaluate((n, sel) => {
    const root = document.querySelector(sel) || document.body.firstElementChild;
    root.style.boxSizing = 'border-box'; root.style.paddingTop = n + 'px';
  }, topInset, rootSel);
  if (chrome) await page.evaluate((html, sel) => {
    const root = document.querySelector(sel) || document.body.firstElementChild;
    root.insertAdjacentHTML('beforeend', html);
  }, dark ? STATUS_BAR.replaceAll('#111', '#fff').replace('background:#000', 'background:#000') : STATUS_BAR, rootSel);
  await page.screenshot({ path: out, clip: { x: box.x, y: box.y, width: Math.round(box.w), height: Math.round(box.h) } });
  await page.close();
  return box;
}
