// Dev-time: renders app screens from the sibling projects' design mockups into tools/.cache/raw.
// Run `node capture.mjs [slug]` then `python3 optimize.py` to produce assets/screens/*.webp.
import fs from 'node:fs';
import { launch, serve, shotMock } from './lib.mjs';

const ROOT = '/Users/tanim/Workspace/Personnal/VibeCoding';
const RAW = new URL('./.cache/raw/', import.meta.url).pathname;
const only = process.argv[2];

const DOKAN = `${ROOT}/hisab-dokan/docs/ux`;
const JOTNO = `${ROOT}/Jotno-FHC/docs/ux-designs/mockups`;

const mocks = {
  'hisab-dokan': { dir: DOKAN, topInset: 46, screens: [
    ['Main', 'dashboard'], ['AIDraft', 'ai-entry'], ['AskHisab', 'ask-hisab'], ['CustomerLedger', 'customer-ledger'],
    ['DailySummary', 'daily-summary'], ['DueReminders', 'due-reminders'], ['Inventory', 'inventory'], ['MoneyAccounts', 'money-accounts'] ] },
  jotno: { dir: JOTNO, topInset: 0, screens: [
    ['Onboarding', 'onboarding'], ['Main', 'family-home'], ['Member', 'member'], ['Timeline', 'timeline'],
    ['Measurements', 'measurements'], ['Vaccinations', 'vaccinations'], ['Emergency', 'emergency'], ['BackupSync', 'backup'] ] },
};

// Concept screens (products without designs yet) are drawn in tools/concepts/*.html and rendered the same way.
const concepts = {
  'ai-tutor': { file: 'ai-tutor', names: ['home', 'tutor-chat', 'learn', 'quiz', 'result', 'progress'] },
  bandboost: { file: 'bandboost', names: ['todays-session', 'speaking', 'feedback', 'listening', 'review', 'vocabulary'] },
  sathi: { file: 'sathi', names: ['voice-home', 'confirm', 'reminders', 'calling', 'weather', 'emergency'] },
  // 01-splash (real) + 02/03 (design mockups) come from the supplied portfolio; these four are concept screens.
  shohojsathi: { file: 'shohojsathi', start: 4, names: ['todays-plan', 'communication', 'first-then', 'progress'] },
};

const HISAB = ['Dashboard', 'Transactions', 'Budget', 'Accounts', 'Goals', 'Reports', 'Cash-flow calendar', 'Backup & Sync'];

const srv = await serve(ROOT);
const url = (p) => srv.origin + '/' + p.split('/').map(encodeURIComponent).join('/');
const b = await launch();

for (const [slug, cfg] of Object.entries(mocks)) {
  if (only && only !== slug) continue;
  fs.mkdirSync(`${RAW}${slug}`, { recursive: true });
  let i = 1;
  for (const [file, name] of cfg.screens) {
    const out = `${RAW}${slug}/${String(i++).padStart(2, '0')}-${name}.png`;
    await shotMock(b, url(`${cfg.dir.replace(ROOT + '/', '')}/${file}.dc.html`), out, { topInset: cfg.topInset });
    console.log('ok', out.replace(RAW, ''));
  }
}

for (const [slug, cfg] of Object.entries(concepts)) {
  if (only && only !== slug) continue;
  fs.mkdirSync(`${RAW}${slug}`, { recursive: true });
  for (const [i, name] of cfg.names.entries()) {
    const out = `${RAW}${slug}/${String(i + (cfg.start || 1)).padStart(2, '0')}-${name}.png`;
    await shotMock(b, `${srv.origin}/nextgenai/tools/concepts/${cfg.file}.html#s${i + 1}`, out, { rootSel: '.screen:target' });
    console.log('ok', out.replace(RAW, ''));
  }
}

// Elements captured straight out of the supplied portfolio designs (tools/sources/).
const TRANSPARENT = '*{animation:none!important;transition:none!important}html,body,section,.board,.wrap{background:transparent!important}';
async function grab(file, picks, slug, base = 1) {
  fs.mkdirSync(`${RAW}${slug}`, { recursive: true });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 3 });
  await page.goto(`${srv.origin}/nextgenai/tools/sources/${file}`, { waitUntil: 'networkidle2' });
  await page.addStyleTag({ content: TRANSPARENT + '.reveal{opacity:1!important;transform:none!important}' });
  await new Promise(r => setTimeout(r, 800));
  let i = base;
  for (const [sel, name, hide] of picks) {
    const el = await page.$(sel);
    if (!el) { console.log('MISSING', sel); continue; }
    // show only this element (no neighbours / decorative backgrounds) and undo any tilt or float animation
    const iso = await page.addStyleTag({ content: `.phone{transform:none!important;animation:none!important;translate:none!important;rotate:none!important}body *{visibility:hidden!important}${sel},${sel} *{visibility:visible!important}` });
    await el.scrollIntoView();
    const out = `${RAW}${slug}/${String(i++).padStart(2, '0')}-${name}.png`;
    await el.screenshot({ path: out, omitBackground: true });
    await page.evaluate(n => n.remove(), iso);
    console.log('ok', out.replace(RAW, ''));
  }
  await page.close();
}
if (!only || only === 'mess-manager') {
  await grab('mess-manager.html', [
    ['.phone.p1 .screen', 'home', '.phone.p2'], ['.phone.p2 .screen', 'balances', '.phone.p1'],
    ['.board .mini:nth-child(1)', 'daily-meals'], ['.board .mini:nth-child(2)', 'settlement'],
  ], 'mess-manager');
}
if (!only || only === 'barivara') {
  await grab('barivara.html', [
    ['.phone.one .screen', 'dashboard'], ['.phone.two .screen', 'receipt'], ['.showcard:not(.light) .receipt', 'receipt-share'],
  ], 'barivara');
}
if (!only || only === 'shohojsathi') {
  await grab('shohojsathi/portfolio.html', [['.mode.parent', 'parent-mode'], ['.mode.child', 'child-mode']], 'shohojsathi', 2);
}

if (!only || only === 'hisab') {
  fs.mkdirSync(`${RAW}hisab`, { recursive: true });
  const page = await b.newPage();
  await page.setViewport({ width: 1700, height: 1200, deviceScaleFactor: 2 });
  await page.goto(url('Design/Hisab-Mobile app design planning/Hisab - Personal Finance.dc.html'), { waitUntil: 'networkidle2' });
  await page.addStyleTag({ content: 'html,body,x-dc,x-dc>div{background:transparent!important}' });
  await new Promise(r => setTimeout(r, 1200));
  let i = 1;
  for (const label of HISAB) {
    const hit = await page.evaluate((l) => {
      const el = [...document.querySelectorAll('div,button')].find(e => e.children.length === 0 && e.textContent.trim() === l && getComputedStyle(e).cursor === 'pointer');
      if (el) el.click();
      return !!el;
    }, label);
    if (!hit) { console.log('MISSING chip', label); continue; }
    await new Promise(r => setTimeout(r, 900));
    const name = label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    const out = `${RAW}hisab/${String(i++).padStart(2, '0')}-${name}.png`;
    // The prototype draws an iOS device frame at a fixed spot (428,43) once its jsx imports load over HTTP.
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 428, y: 43, width: 402, height: 876 } });
    console.log('ok', out.replace(RAW, ''));
  }
}
await b.close();
srv.close();
