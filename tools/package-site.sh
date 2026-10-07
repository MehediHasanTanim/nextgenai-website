#!/usr/bin/env bash
# Builds a deploy-ready copy of the site (no dev tooling) in ../dist and zips it to ../nextgenai-site.zip
# Usage: bash tools/package-site.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build.mjs
rm -rf dist nextgenai-site.zip
mkdir dist
cp -R index.html 404.html robots.txt products css js assets dist/
[ -f sitemap.xml ] && cp sitemap.xml dist/ || true
cat > dist/_headers <<'HEADERS'
# Cloudflare Pages / Netlify headers
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=86400
/css/*
  Cache-Control: public, max-age=3600
/js/*
  Cache-Control: public, max-age=3600
HEADERS
find dist -name '.DS_Store' -delete
(cd dist && zip -qr ../nextgenai-site.zip .)
echo "dist/ ($(du -sh dist | cut -f1)) and nextgenai-site.zip ($(du -h nextgenai-site.zip | cut -f1)) ready"
