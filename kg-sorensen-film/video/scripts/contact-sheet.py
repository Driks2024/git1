#!/usr/bin/env python3
"""Review aid: tile still PNGs into contact sheets (3 x 2 per sheet, half size).

    python3 video/scripts/contact-sheet.py <stills dir> <prefix> <out dir>
"""
import os
import sys

from PIL import Image, ImageDraw

src, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.startswith(prefix) and f.endswith('.png'))
cols, rows, scale = 3, 2, 0.5
per = cols * rows
for s in range(0, len(files), per):
    chunk = files[s:s + per]
    w, h = int(1080 * scale), int(1920 * scale)
    sheet = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), (40, 40, 40))
    for i, f in enumerate(chunk):
        im = Image.open(os.path.join(src, f)).convert('RGB').resize((w, h), Image.LANCZOS)
        x, y = (i % cols) * (w + 8), (i // cols) * (h + 8)
        sheet.paste(im, (x, y))
        d = ImageDraw.Draw(sheet)
        d.rectangle([x, y + h - 26, x + 120, y + h], fill=(0, 0, 0))
        d.text((x + 6, y + h - 22), f, fill=(212, 248, 46))
    name = os.path.join(out, f'sheet-{prefix}-{s // per:02d}.png')
    sheet.save(name)
    print(name)
