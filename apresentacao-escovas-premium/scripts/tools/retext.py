"""Reescreve palavras deformadas nas fotos do expositor (Germany, 5460).
Cada edição: preenche a área da palavra antiga por difusão (fundo liso) e
desenha o texto novo com a mesma posição, inclinação e tamanho."""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONTS = {
    'semi': '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf',
    'bold': '/usr/share/fonts/opentype/inter/Inter-Bold.otf',
    'xbold': '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf',
}

def unit(dx, dy):
    n = math.hypot(dx, dy)
    return dx / n, dy / n

def box_poly(cx, cy, u, L, H, pad, padH=None):
    ux, uy = u
    nx, ny = -uy, ux
    a, b = L / 2 + pad, H / 2 + (pad if padH is None else padH)
    return [(cx + sx * a * ux + sy * b * nx, cy + sx * a * uy + sy * b * ny)
            for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]

def harmonic_fill(crop, mask, iters=600):
    a = crop.astype(np.float64)
    m = mask
    ring = ~m
    a[m] = a[ring].mean(axis=0)
    for _ in range(iters):
        p = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode='edge')
        avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
        a[m] = avg[m]
    return a

def render_word(text, font, L, H, angle, color, opacity):
    S = 8
    f = ImageFont.truetype(FONTS[font], 40 * S // 4)
    tmp = Image.new('L', (len(text) * 60 * S // 4 + 40, 80 * S // 4 + 40), 0)
    d = ImageDraw.Draw(tmp)
    d.text((20, 10), text, font=f, fill=255)
    tmp = tmp.crop(tmp.getbbox())
    w, h = max(1, round(L * S)), max(1, round(H * S))
    tmp = tmp.resize((w, h), Image.LANCZOS)
    tmp = tmp.rotate(angle, resample=Image.BICUBIC, expand=True)
    tmp = tmp.resize((max(1, round(tmp.width / S)), max(1, round(tmp.height / S))), Image.LANCZOS)
    alpha = tmp.point(lambda v: int(v * opacity))
    rgb = Image.new('RGB', tmp.size, color)
    return rgb, alpha

def edit(im, e):
    if 'p0' in e:  # pontos de início e fim da palavra (sentido de leitura)
        (x0, y0), (x1, y1) = e['p0'], e['p1']
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        u = unit(x1 - x0, y1 - y0)
        L = math.hypot(x1 - x0, y1 - y0)
    else:
        cx, cy = e['c']
        u = unit(*e.get('dir', (1, 0)))
        L = e['L']
    H = e['H']
    pad = e.get('pad', 1.6)
    poly = box_poly(cx, cy, u, L, H, pad, e.get('padH'))
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    bx0, by0 = int(min(xs)) - 4, int(min(ys)) - 4
    bx1, by1 = int(max(xs)) + 5, int(max(ys)) + 5
    crop = np.asarray(im.crop((bx0, by0, bx1, by1))).copy()
    mimg = Image.new('L', (bx1 - bx0, by1 - by0), 0)
    ImageDraw.Draw(mimg).polygon([(x - bx0, y - by0) for x, y in poly], fill=255)
    mask = np.asarray(mimg) > 0
    # cor do texto antigo: extremo de luminância dentro da área
    lum = crop[..., :3].astype(float) @ [0.299, 0.587, 0.114]
    vals = crop[mask][:, :3]
    lv = lum[mask]
    if e['tone'] == 'light':
        sel = vals[lv >= np.percentile(lv, 90)]
    else:
        sel = vals[lv <= np.percentile(lv, 8)]
    color = tuple(int(c) for c in sel.mean(axis=0)) if 'color' not in e else tuple(e['color'])
    filled = harmonic_fill(crop[..., :3], mask)
    base = Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8))
    angle = math.degrees(math.atan2(-u[1], u[0]))
    Lr = e.get('Lr', L)
    sh = e.get('shift', 0.0)
    rcx, rcy = cx + sh * u[0], cy + sh * u[1]
    rgb, alpha = render_word(e['text'], e['font'], Lr, H, angle, color, e.get('opacity', 0.95))
    px = round(rcx - bx0 - rgb.width / 2)
    py = round(rcy - by0 - rgb.height / 2)
    base.paste(rgb, (px, py), alpha)
    im.paste(base, (bx0, by0))
    return color

if __name__ == '__main__':
    src, spec, out = sys.argv[1], sys.argv[2], sys.argv[3]
    im = Image.open(src).convert('RGB')
    for e in json.load(open(spec)):
        c = edit(im, e)
        print(e['text'], e.get('c', e.get('p0')), 'cor', c)
    im.save(out)
