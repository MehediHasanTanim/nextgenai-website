# nextgenai website

Static marketing + portfolio site for nextgenai. The deployed site has **no build step and no dependencies** —
just deploy this folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3…).

```
index.html            home page (generated)
products/<slug>.html  one detail page per product (generated)
css/styles.css        design tokens, light/dark themes, layout
js/main.js            theme toggle, nav + Portfolio dropdown, filters, screenshot gallery + lightbox, contact form
assets/
  icons/              app icons (<slug>.png if provided, else the placeholder <slug>.svg)
  screens/<slug>/     app screenshots (.webp)
  marketing/          <slug>-cover.webp (home cards) · <slug>-hero.jpg (share image)
  og.jpg              home-page share image
tools/                dev-only generators (see below)
```

## Deploy

`bash tools/package-site.sh` rebuilds the pages and creates `dist/` (site files only) and `nextgenai-site.zip`. Upload either to Cloudflare Pages / Netlify.

## SEO (one setting to finish)

Once you know the live address, put it in `tools/site.json` (e.g. `{ "url": "https://nextgenai.pages.dev" }`) and run
`bash tools/package-site.sh`. That switches on canonical links, absolute share-image URLs, structured-data URLs and `sitemap.xml`
(search engines and WhatsApp/Facebook need absolute URLs). Everything else (titles, descriptions, `robots.txt`, 404 page, touch icon,
Organization/WebSite/Breadcrumb structured data) is already generated.

## Deploying to Cloudflare (Workers static assets)

Live at https://nextgenai.mobileapps-bd.workers.dev. To publish an update:

```bash
bash tools/package-site.sh     # rebuilds pages and refreshes ./dist
npx wrangler deploy            # uploads ./dist to the "nextgenai" Worker (config: wrangler.jsonc)
```

First time on a machine: `npx wrangler login`. Cloudflare serves `/products/x.html` at `/products/x` (a redirect),
so canonical links and the sitemap use the extensionless form.

## Run locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Everyday edits

All product content (names, taglines, copy, features, screenshot captions, accent colours) lives in one file:
[`tools/products.mjs`](tools/products.mjs). After editing it, regenerate the pages:

```bash
node tools/build.mjs
```

Home-page sections other than the product cards (hero, principles, stack, process, contact) are in
[`tools/templates/index.html`](tools/templates/index.html) — edit that, not the generated `index.html`.

### Contact email
`nextgenai1983@gmail.com` — set in `tools/build.mjs` (`EMAIL`, footer + product CTAs) and `js/main.js` (`CONTACT_EMAIL`, the form).

### Adding a real app icon
Drop a square PNG (256px or larger) at `assets/icons/<slug>.png`, then run `node tools/build.mjs`.
A PNG always wins over the placeholder SVG. Slugs: `hisab`, `hisab-dokan`, `mess-manager`, `barivara`, `jotno`, `chamber`, `shohojsathi`, `ai-tutor`, `bandboost`, `wordbloom`, `sathi`.
Slugs also include `mess-manager`, `barivara`, `shohojsathi`, `wordbloom`.
Currently real: Hisab, Jotno, WordBloom, ShohojSathi. Placeholders: Hisab Dokan, Mess Manager, BariVara, Chamber, AI Tutor, BandBoost, Sathi.
After adding icons, re-render the marketing images (below) so they pick up the new icon.

### The moving showcase (top of the home page)
Products with a `featured: <n>` field in `tools/products.mjs` appear in the moving strip, in that order
(currently BariVara, Mess Manager, ShohojSathi, WordBloom, Hisab, Jotno). Remove or add the field to change it.
The strip pauses on hover/focus, has a Pause button, and is static for visitors who prefer reduced motion.

### Portfolio grid order
Products with a `pin: <n>` field in `tools/products.mjs` come first in the home-page grid (currently BariVara, Mess Manager, ShohojSathi, WordBloom); the rest keep their listed order.

### Adding a product
Add an entry to `tools/products.mjs`, put screenshots in `assets/screens/<slug>/`, add an icon, then run the
marketing + build steps.

## Regenerating images (dev-only)

Needs Node 22+, Python 3 with Pillow, and Google Chrome. One-time: `cd tools && npm install`.

```bash
cd tools
node capture.mjs [slug]     # renders screens from the sibling projects' design mockups / concept files → .cache/raw
python3 optimize.py         # → assets/screens/*.webp  (also crops the Chamber design boards)
python3 make-icons.py       # → assets/icons
node marketing.mjs [slug]   # → assets/marketing/* and assets/og.jpg
node build.mjs              # → index.html + products/*.html
```

The supplied portfolio designs for Mess Manager, ShohojSathi and WordBloom are kept in `tools/sources/` (note: the supplied `wordbloom/progress.png` is truncated, so only its intact top is used).
`node shot.mjs <path> <out.png> [w] [h]` takes a quick headless screenshot of the running site.

`capture.mjs` reads the sibling project folders under `../` (Hisab, Hisab Dokan, Jotno, Chamber…); paths are at the top of the file.
Screens for **AI Tutor, BandBoost and Sathi** are concept previews drawn in `tools/concepts/*.html` until real designs exist —
replace them by dropping real screenshots into `assets/screens/<slug>/` (keep the file names listed in `products.mjs`).
