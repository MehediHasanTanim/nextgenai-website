#!/usr/bin/env python3
"""Dev-time: turns tools/.cache/raw/** (+ Chamber design boards) into optimised WebP files in assets/screens/.

Run after `node capture.mjs`. Needs Pillow.
"""
import glob, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '.cache', 'raw')
OUT = os.path.join(HERE, '..', 'assets', 'screens')
CHAMBER = '/Users/tanim/Workspace/Personnal/VibeCoding/Chamber-Management/ux-design'


def rounded(im, radius):
    im = im.convert('RGBA')
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), radius=radius, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    # keep any transparency the source already had
    a = Image.composite(im.getchannel('A'), Image.new('L', im.size, 0), mask)
    out.putalpha(a)
    return out


ONLY = sys.argv[1] if len(sys.argv) > 1 else None  # optional: only (re)build this slug


def save(im, slug, name, q=82):
    if ONLY and slug != ONLY:
        return
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name + '.webp')
    im.save(p, 'WEBP', quality=q, method=4)
    print(f'{slug}/{name}.webp', im.size, os.path.getsize(p) // 1024, 'KB')


# 1) rendered screens (Hisab already has a transparent device frame; flat mockups get rounded corners)
for slug in sorted(os.listdir(RAW)):
    for f in sorted(glob.glob(os.path.join(RAW, slug, '*.png'))):
        im = Image.open(f).convert('RGBA')
        if slug == 'barivara' and os.path.basename(f).startswith('01-'):
            # the supplied dashboard mock is much taller than a phone: keep the top, phone-shaped part
            im = rounded(im.crop((0, 0, im.size[0], int(im.size[0] / 0.4626))), 100)
        # round only flat captures; framed / already-rounded ones come with transparent corners
        if slug != 'hisab' and im.getpixel((0, 0))[3] == 255:
            im = rounded(im, 58)
        save(im, slug, os.path.basename(f)[:-4])

# 2) Chamber: crop individual phones / web screens out of the design boards
CROPS = [
    ('Chamber-UI-Mobile/CoreDailyWorkflow.png', [
        ('01-home', (10, 8, 295, 586)), ('02-patients', (304, 8, 581, 586)), ('03-patient-profile', (590, 8, 898, 586)),
        ('04-appointments', (907, 8, 1214, 586)), ('05-queue', (1222, 8, 1528, 586))]),
    ('Chamber-UI-Mobile/AI-Screens.png', [
        ('06-ai-clinical-chat', (394, 8, 771, 642)), ('07-ai-prescription-draft', (776, 8, 1144, 642))]),
    ('Chamber-UI-Mobile/Prescription.png', [('08-prescription-preview', (612, 556, 917, 976))]),
]
for board, items in CROPS:
    src = Image.open(os.path.join(CHAMBER, board)).convert('RGB')
    for name, box in items:
        c = src.crop(box)
        c = c.resize((c.size[0] * 2, c.size[1] * 2), Image.LANCZOS)  # boards are low-res; 2x keeps edges smooth when scaled down by the browser
        save(rounded(c, 44), 'chamber', name, 86)

WEB = [
    ('Chamber-UI-Web/Web-Dashboard.png', 'web-01-doctor-dashboard', (0, 0, 1536, 538)),
    ('Chamber-UI-Web/WEB-15. AI Clinical Assistance.png', 'web-02-ai-patient-summary', (566, 0, 1056, 512)),
]
for board, name, box in WEB:
    src = Image.open(os.path.join(CHAMBER, board)).convert('RGB').crop(box)
    save(rounded(src, 28), 'chamber', name, 88)

# 3) supplied portfolio assets (tools/sources/)
from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
SRC = os.path.join(HERE, 'sources')

for name, f in [('01-home', 'home'), ('02-lesson', 'lesson'), ('03-ai-tutor', 'ai-tutor'), ('04-review-queue', 'revision'), ('05-scan', 'scan')]:
    save(rounded(Image.open(os.path.join(SRC, 'wordbloom', f + '.png')), 62), 'wordbloom', name)
# progress.png is truncated in the supplied zip (only the top ~57% is intact): keep the intact part, cut on a card boundary
prog = Image.open(os.path.join(SRC, 'wordbloom', 'progress.png')).convert('RGBA').crop((0, 0, 853, 1050))
save(rounded(prog, 62), 'wordbloom', '06-progress')

# ShohojSathi splash: crop the supplied device mock down to the screen itself
splash = Image.open(os.path.join(SRC, 'shohojsathi', 'splash.png')).convert('RGBA')
save(rounded(splash.crop((64, 44, 824, 1716)), 84), 'shohojsathi', '01-splash')
