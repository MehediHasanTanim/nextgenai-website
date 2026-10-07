// Dev-time: renders assets/apple-touch-icon.png (180x180, full-bleed; iOS rounds the corners itself).
import { launch } from './lib.mjs';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><path d="M19 46V18l26 28V18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const b = await launch(); const page = await b.newPage();
await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.screenshot({ path: new URL('../assets/apple-touch-icon.png', import.meta.url).pathname });
await b.close(); console.log('ok');
