#!/usr/bin/env python3
"""Dev-time: builds assets/icons/.

- Real app icons (Hisab, Jotno) are copied from the sibling projects as rounded 256px PNGs.
- Everything else gets a placeholder SVG. To use a real icon later, drop assets/icons/<slug>.png
  (square, >= 256px) and run `node build.mjs` - a PNG always wins over the placeholder SVG.
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)
VIBE = '/Users/tanim/Workspace/Personnal/VibeCoding'

REAL = {
    'hisab': f'{VIBE}/Design/Hisab-Mobile app design planning/assets/_master/icon-1024.png',
    'jotno': f'{VIBE}/Jotno-FHC/assets/icon/icon.png',
    'wordbloom': os.path.join(HERE, 'sources/wordbloom/icon.png'),
    'shohojsathi': os.path.join(HERE, 'sources/shohojsathi/icon.png'),
}
for slug, src in REAL.items():
    im = Image.open(src).convert('RGBA').resize((512, 512), Image.LANCZOS)
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 511, 511), radius=115, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), mask)
    out.save(os.path.join(OUT, slug + '.png'), optimize=True)
    print('real', slug)

# placeholder glyphs (24x24 grid, stroke style)
GLYPH = {
    'hisab-dokan': '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-6h4v6"/>',
    'chamber': '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="12" r="2"/>',
    'ai-tutor': '<path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
    'bandboost': '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z"/><path d="M12 19v2"/>',
    'mess-manager': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/><path d="M21 15v7"/>',
    'barivara': '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'sathi': '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
}
GRAD = {
    'hisab-dokan': ('#d4a63c', '#9a6f12'), 'chamber': ('#14b8a6', '#0e7490'), 'ai-tutor': ('#8b6bff', '#5b34e8'),
    'bandboost': ('#ff6b81', '#e0334f'), 'mess-manager': ('#22c06b', '#08783f'), 'barivara': ('#1fb673', '#0a6b43'), 'sathi': ('#ff8a3d', '#e04e06'),
}
for slug, g in GLYPH.items():
    a, b = GRAD[slug]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="{slug} placeholder icon">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>
  <rect width="256" height="256" rx="58" fill="url(#g)"/>
  <g transform="translate(64 64) scale(5.33)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{GLYPH[slug]}</g>
</svg>
'''
    open(os.path.join(OUT, slug + '.svg'), 'w').write(svg)
    print('placeholder', slug)
