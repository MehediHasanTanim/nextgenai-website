// Generates the static site from products.mjs:  index.html  +  products/<slug>.html
// Usage: node build.mjs      (no dependencies; images are produced separately by capture/optimize/marketing)
import fs from 'node:fs';
import path from 'node:path';
import { products, CATEGORIES, featured, gridOrder } from './products.mjs';

const SITE = path.resolve(new URL('..', import.meta.url).pathname);
const EMAIL = 'nextgenai1983@gmail.com';

// Public address of the deployed site, e.g. https://nextgenai.pages.dev (no trailing slash).
// Set it in tools/site.json or with SITE_URL=... node build.mjs. Canonical links, absolute share-image URLs,
// structured-data URLs and sitemap.xml are only emitted once it is set (search engines need absolute URLs).
const SITE_URL = (process.env.SITE_URL || JSON.parse(fs.readFileSync(path.join(SITE, 'tools/site.json'), 'utf8')).url || '').trim().replace(/\/+$/, '');
const absUrl = (rel) => SITE_URL + '/' + rel.replace(/^(\.\.\/)+/, '');
const trimDesc = (s, max = 158) => {
  if (s.length <= max) return s;
  // prefer ending on a clause boundary (" — ") so the snippet reads as a complete sentence
  const clause = s.lastIndexOf(' — ', max + 2);
  if (clause >= 90 && clause <= max + 2) return s.slice(0, clause).replace(/[,;:]\s*$/, '') + '.';
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]\s*$/, '') + '…';
};
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>\n`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const catLabel = (id) => CATEGORIES.find(c => c.id === id).label;
const icon = (slug) => fs.existsSync(path.join(SITE, 'assets/icons', slug + '.png')) ? `assets/icons/${slug}.png` : `assets/icons/${slug}.svg`;
const mailto = (subject) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

const CHEVRON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const LOGO_MARK = '<svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lg)"/><path d="M19 46V18l26 28V18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Shared top navigation. `base` is '' on the home page and '../' inside /products. */
function header(base, current) {
  const home = base + 'index.html';
  const dd = products.map(p => `<a role="menuitem" href="${base}products/${p.slug}.html"${current === p.slug ? ' aria-current="page"' : ''}>
          <img src="${base}${icon(p.slug)}" alt="" width="36" height="36"><span><b>${esc(p.name)}</b><small>${esc(p.tagline)}</small></span></a>`).join('\n        ');
  return `<header class="nav" id="top">
  <div class="wrap nav__in">
    <a class="logo" href="${home}" aria-label="nextgenai home">${LOGO_MARK}<span>nextgen<b>ai</b></span></a>
    <nav class="nav__links" id="menu" aria-label="Primary">
      <div class="dd${current ? ' is-current' : ''}">
        <a class="dd__link" href="${home}#work">Portfolio</a>
        <button class="dd__btn" type="button" aria-expanded="false" aria-controls="ddmenu" aria-label="Show all products">${CHEVRON}</button>
        <div class="dd__menu" id="ddmenu" role="menu" aria-label="Products">
        ${dd}
        <a class="dd__all" role="menuitem" href="${home}#work">View all products →</a>
        </div>
      </div>
      <a href="${home}#principles">Principles</a>
      <a href="${home}#stack">Stack</a>
      <a href="${home}#process">Process</a>
      <a class="btn btn--sm" href="${home}#contact">Get in touch</a>
    </nav>
    <button class="icon-btn" id="theme" type="button" aria-label="Toggle colour theme">
      <svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
    <button class="icon-btn burger" id="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>`;
}

function card(p) {
  return `      <a class="card reveal" href="products/${p.slug}.html" data-cat="${p.category}" style="--a:${p.accent}" aria-label="${esc(p.name)} — view details">
        <div class="card__media"><img src="assets/marketing/${p.slug}-cover.webp" alt="${esc(p.name)} app screens" width="1200" height="750" loading="lazy"></div>
        <div class="card__body">
          <div class="card__head">
            <img class="appicon" src="${icon(p.slug)}" alt="" width="56" height="56">
            <div><h3>${esc(p.name)}${p.bn ? ` <small lang="bn">${esc(p.bn)}</small>` : ''}</h3><p class="tag">${esc(p.tagline)}</p></div>
          </div>
          <p>${esc(p.summary)}</p>
          <ul class="feat">${p.highlights.slice(0, 3).map(h => `<li>${esc(h[0])}</li>`).join('')}</ul>
          <div class="meta">${p.tech.slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}<span>${esc(p.platforms)}</span></div>
          <span class="more">View details <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </a>`;
}

function footer(base) {
  return `<footer class="foot">
  <div class="wrap foot__in">
    <a class="logo" href="${base}index.html#top"><span>nextgen<b>ai</b></span></a>
    <p>© <span id="year">2026</span> nextgenai. Made in Bangladesh. · <a class="foot__mail" href="mailto:${EMAIL}">${EMAIL}</a></p>
    <a href="#top" class="foot__up">Back to top ↑</a>
  </div>
</footer>`;
}

const head = (title, desc, base, ogImage, { pagePath = '', extra = '', noindex = false } = {}) => {
  desc = trimDesc(desc);
  const url = SITE_URL ? `${SITE_URL}/${pagePath.replace(/\.html$/, '')}` : '';
  const img = SITE_URL ? absUrl(ogImage) : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta name="theme-color" content="#0b0d14">
${url ? `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n` : ''}<meta property="og:site_name" content="nextgenai">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
${img ? `<meta property="og:image" content="${img}">\n<meta name="twitter:image" content="${img}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap">
<link rel="stylesheet" href="${base}css/styles.css">
${extra}<script>try{var t=localStorage.getItem('nga-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>`;
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** Moving strip of featured products at the top of the home page (set repeated once for a seamless loop). */
function showcase() {
  const item = (p, dup) => `<a class="sc" href="products/${p.slug}.html" style="--a:${p.accent}"${dup ? ' tabindex="-1"' : ''}>
          <img class="sc__cover" src="assets/marketing/${p.slug}-cover.webp" alt="${dup ? '' : esc(p.name) + ' app screens'}" width="1200" height="750"${dup ? ' loading="lazy"' : ''}>
          <span class="sc__meta"><img class="appicon" src="${icon(p.slug)}" alt="" width="44" height="44"><span class="sc__txt"><b>${esc(p.name)}</b><small>${esc(p.tagline)}</small></span><svg class="sc__go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </a>`;
  return `  <div class="showcase" id="showcase" aria-label="Featured products">
    <div class="wrap showcase__bar">
      <p class="eyebrow">Now featuring</p>
      <button class="showcase__pause" id="scPause" type="button" aria-pressed="false" aria-label="Pause the moving showcase"><svg class="i-pause" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg><svg class="i-play" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Pause</span></button>
    </div>
    <div class="showcase__view">
      <div class="showcase__track">
        <div class="showcase__set">
        ${featured.map(p => item(p, false)).join('\n        ')}
        </div>
        <div class="showcase__set" aria-hidden="true">
        ${featured.map(p => item(p, true)).join('\n        ')}
        </div>
      </div>
    </div>
  </div>`;
}

const filters = [{ id: 'all', label: 'All' }, ...CATEGORIES.filter(c => products.some(p => p.category === c.id))]
  .map((c, i) => `      <button class="chip${i ? '' : ' is-on'}" data-filter="${c.id}" type="button" aria-pressed="${i ? 'false' : 'true'}">${esc(c.label)}</button>`).join('\n');
const domainCount = new Set(products.map(p => p.category)).size;

/* ---------- home page ---------- */
let idx = fs.readFileSync(path.join(SITE, 'tools/templates/index.html'), 'utf8');
const homeLd = jsonLd({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'nextgenai', ...(SITE_URL ? { url: SITE_URL + '/', logo: absUrl('assets/apple-touch-icon.png') } : {}), email: EMAIL, areaServed: 'BD',
      description: 'An AI-driven tech venture building Bangla-first, offline-first apps for finance, health, education and everyday life.' },
    { '@type': 'WebSite', name: 'nextgenai', ...(SITE_URL ? { url: SITE_URL + '/' } : {}), inLanguage: 'en' },
  ],
});
idx = idx.replace('<!--@HEAD-->', head('nextgenai — AI products built for Bangladesh', 'nextgenai is an AI-driven tech venture building Bangla-first, offline-first, privacy-respecting apps for finance, health, education and everyday life.', '', 'assets/og.jpg', { pagePath: '', extra: homeLd }))
  .replace('<!--@HEADER-->', header('', null)).replace('<!--@CARDS-->', gridOrder.map(card).join('\n'))
  .replace('<!--@SHOWCASE-->', showcase()).replace('<!--@FILTERS-->', filters)
  .replaceAll('{{COUNT}}', products.length).replaceAll('{{COUNT_WORD}}', cap(WORDS[products.length]))
  .replaceAll('{{DOMAINS}}', domainCount).replaceAll('{{DOMAINS_WORD}}', WORDS[domainCount]);
// the template's <head> still carries the old inline theme script; keep it, but make sure the footer matches
idx = idx.replace(/<footer class="foot">[\s\S]*?<\/footer>/, footer(''));
fs.writeFileSync(path.join(SITE, 'index.html'), idx);

/* ---------- product pages ---------- */
function gallery(p) {
  const shots = p.screens.map(([f, c], i) => `<figure class="shot" style="--a:${p.accent}"><button type="button" class="shot__btn" data-lb="${i}" aria-label="Open screen: ${esc(c)}"><img src="../assets/screens/${p.slug}/${f}.webp" alt="${esc(p.name)} — ${esc(c)}" loading="lazy" decoding="async"></button><figcaption>${esc(c)}</figcaption></figure>`).join('\n          ');
  const webShots = (p.web || []).map(([f, c], i) => `<figure class="wshot"><button type="button" class="shot__btn" data-lb="${p.screens.length + i}" aria-label="Open screen: ${esc(c)}"><img src="../assets/screens/${p.slug}/${f}.webp" alt="${esc(p.name)} — ${esc(c)}" loading="lazy" decoding="async"></button><figcaption>${esc(c)}</figcaption></figure>`).join('\n          ');
  const note = p.shotNote ? p.shotNote : p.shots === 'concept'
    ? 'These are concept previews drawn from the product specification to show the planned experience. The final app may differ.'
    : 'These screens come from our product design prototypes and may differ from the released app.';
  return `<section class="section section--alt" id="screens">
    <div class="wrap">
      <div class="section__head reveal"><p class="eyebrow">Screens</p><h2>See ${esc(p.name)} in action</h2><p class="sub">${note}</p></div>
      <div class="shots-wrap reveal">
        <button class="arrow arrow--l" type="button" aria-label="Scroll screens left" data-scroll="-1">${CHEVRON}</button>
        <div class="shots" id="shots" tabindex="0" aria-label="${esc(p.name)} screenshots">
          ${shots}
        </div>
        <button class="arrow arrow--r" type="button" aria-label="Scroll screens right" data-scroll="1">${CHEVRON}</button>
      </div>
      ${p.web ? `<div class="wshots reveal"><h3 class="mini">On the web</h3><div class="wgrid">${webShots}</div></div>` : ''}
    </div>
  </section>`;
}

function productPage(p, i) {
  const prev = products[(i + products.length - 1) % products.length];
  const next = products[(i + 1) % products.length];
  const lbData = [...p.screens, ...(p.web || [])].map(([f, c]) => ({ src: `../assets/screens/${p.slug}/${f}.webp`, cap: c }));
  const others = products.filter(o => o.slug !== p.slug).map(o => `<a class="other" href="${o.slug}.html" style="--a:${o.accent}"><img src="../${icon(o.slug)}" alt="" width="52" height="52" loading="lazy"><span><b>${esc(o.name)}</b><small>${esc(o.tagline)}</small></span></a>`).join('\n        ');
  const title = p.seoTitle || `${p.name} — ${p.tagline} | nextgenai`;
  const crumbs = SITE_URL ? jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
    { '@type': 'ListItem', position: 2, name: 'Portfolio', item: SITE_URL + '/#work' },
    { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}/products/${p.slug}` } ] }) : '';
  return `${head(title, p.summary, '../', `assets/marketing/${p.slug}-hero.jpg`, { pagePath: `products/${p.slug}.html`, extra: crumbs })}
<body class="pd" style="--a:${p.accent}">
<a class="skip" href="#main">Skip to content</a>

${header('../', p.slug)}

<main id="main">
  <section class="pd-hero" style="--g1:${p.grad[0]};--g2:${p.grad[1]}">
    <div class="wrap pd-hero__in">
      <div class="pd-hero__copy">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../index.html#work">Portfolio</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></nav>
        <div class="pd-id reveal"><img class="appicon appicon--lg" src="../${icon(p.slug)}" alt="${esc(p.name)} app icon" width="96" height="96"><div><span class="pill">${esc(catLabel(p.category))}</span></div></div>
        <h1 class="reveal">${esc(p.name)}${p.bn ? ` <small lang="bn">${esc(p.bn)}</small>` : ''}</h1>
        <p class="pd-tag reveal">${esc(p.tagline)}</p>
        <p class="lead reveal">${esc(p.summary)}</p>
        <div class="pd-chips reveal">${p.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>
        <div class="hero__cta reveal"><a class="btn" href="${mailto('About ' + p.name)}">Talk to us about ${esc(p.name)}</a><a class="btn btn--ghost" href="#screens">See screens</a></div>
      </div>
      <div class="pd-hero__media reveal"><img src="../assets/marketing/${p.slug}-cover.webp" alt="${esc(p.name)} — app screens" width="1200" height="750" fetchpriority="high"></div>
    </div>
  </section>

  <section class="section" id="overview">
    <div class="wrap pd-overview">
      <div class="reveal">
        <p class="eyebrow">Overview</p>
        <h2>What ${esc(p.name)} is</h2>
        ${p.overview.map(t => `<p class="body">${esc(t)}</p>`).join('\n        ')}
      </div>
      <aside class="glance reveal" aria-label="At a glance">
        <h3>At a glance</h3>
        <dl>
          <div><dt>Category</dt><dd>${esc(catLabel(p.category))}</dd></div>
          <div><dt>Platforms</dt><dd>${esc(p.platforms)}</dd></div>
          <div><dt>Who it's for</dt><dd>${esc(p.audience)}</dd></div>
          <div><dt>Built with</dt><dd class="tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join('')}</dd></div>
        </dl>
      </aside>
    </div>
  </section>

  <section class="section section--alt" id="features">
    <div class="wrap">
      <div class="section__head reveal"><p class="eyebrow">Features</p><h2>What it does</h2></div>
      <div class="fgrid">
        ${p.highlights.map(([t, d], n) => `<div class="fcard reveal"><span class="fnum">${String(n + 1).padStart(2, '0')}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>

  ${gallery(p)}

  <section class="section" id="built">
    <div class="wrap">
      <div class="section__head reveal"><p class="eyebrow">Approach</p><h2>How it's built</h2></div>
      <div class="cols cols--3">
        ${p.built.map(([t, d], n) => `<div class="pr reveal"><span class="pr__n">0${n + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n        ')}
      </div>
      ${p.note ? `<p class="note reveal">${esc(p.note)}</p>` : ''}
    </div>
  </section>

  <section class="section section--alt cta-band">
    <div class="wrap cta reveal">
      <div><h2>Interested in ${esc(p.name)}?</h2><p class="sub">Want an early look, a partnership, or something similar built for your market? We'd love to hear from you.</p></div>
      <div class="hero__cta"><a class="btn" href="${mailto('About ' + p.name)}">Email us</a><a class="btn btn--ghost" href="../index.html#contact">Contact form</a></div>
    </div>
  </section>

  <section class="section" id="more">
    <div class="wrap">
      <div class="section__head reveal"><p class="eyebrow">More from nextgenai</p><h2>Other products</h2></div>
      <div class="others reveal">
        ${others}
      </div>
      <div class="pn reveal"><a href="${prev.slug}.html">← ${esc(prev.name)}</a><a href="../index.html#work">All products</a><a href="${next.slug}.html">${esc(next.name)} →</a></div>
    </div>
  </section>
</main>

${footer('../')}

<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Screenshot viewer" hidden>
  <button class="lb__x" type="button" aria-label="Close" data-lb-close>✕</button>
  <button class="lb__n lb__n--l" type="button" aria-label="Previous screen" data-lb-step="-1">‹</button>
  <figure><img id="lbImg" alt=""><figcaption id="lbCap"></figcaption></figure>
  <button class="lb__n lb__n--r" type="button" aria-label="Next screen" data-lb-step="1">›</button>
</div>
<script>window.__SHOTS=${JSON.stringify(lbData)};</script>
<script src="../js/main.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(SITE, 'products'), { recursive: true });
products.forEach((p, i) => fs.writeFileSync(path.join(SITE, 'products', `${p.slug}.html`), productPage(p, i)));
console.log(`built index.html + ${products.length} product pages`);

/* ---------- robots.txt, sitemap.xml, 404.html ---------- */
fs.writeFileSync(path.join(SITE, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
const sitemapPath = path.join(SITE, 'sitemap.xml');
if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['', ...products.map(p => `products/${p.slug}`)];
  fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE_URL}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
} else if (fs.existsSync(sitemapPath)) fs.unlinkSync(sitemapPath);

// Custom 404 uses root-absolute paths because it can be served from any URL depth.
const notFound = head('Page not found | nextgenai', 'The page you were looking for does not exist.', '/', 'assets/og.jpg', { noindex: true })
  + `
<body>
<main class="nf wrap"><p class="eyebrow">404</p><h1>That page doesn’t exist.</h1><p class="lead">It may have moved, or the link may be mistyped. Try the portfolio or head back home.</p>
<div class="hero__cta"><a class="btn" href="/">Back to home</a><a class="btn btn--ghost" href="/#work">See our products</a></div></main>
</body>
</html>
`;
fs.writeFileSync(path.join(SITE, '404.html'), notFound);
console.log(SITE_URL ? `SITE_URL=${SITE_URL}: canonical, structured data and sitemap.xml written` : 'SITE_URL not set (tools/site.json): canonical links, absolute share-image URLs and sitemap.xml skipped');
