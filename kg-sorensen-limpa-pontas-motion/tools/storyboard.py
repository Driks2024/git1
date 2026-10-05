#!/usr/bin/env python3
"""Storyboard (4×4) e hero frame a partir dos quadros renderizados em output/frames/."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FR = ROOT / "output" / "frames"
FPS = 30
BOARD = [
    (0.9, "S1", "Calibração · a mesa de luz acende"), (2.1, "S1", "LIMPA PONTAS KG"),
    (3.0, "S2", "Wireframe da embalagem"), (3.45, "S2", "Volume"),
    (3.95, "S2", "Textura → produto real"), (4.8, "S2", "Embalagem real"),
    (6.1, "S3", "UN. 01 materializa"), (7.2, "S3", "QTD. 2"),
    (7.9, "S4", "Chicote: o \u201c2\u201d conduz"), (8.7, "S4", "\u201cLeve\u201d nasce da baseline"),
    (9.7, "S4", "\u201cPague 1.\u201d impresso"), (9.95, "S4", "IMPACTO"),
    (12.3, "S5", "R$ 11,60"), (13.6, "S5", "2 × R$ 5,80 = R$ 11,60"),
    (15.6, "S6", "Composição completa"), (18.0, "S7", "Hero frame = master"),
]


def font(size, bold=False):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else ""),
              "/Library/Fonts/Arial.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    frames = sorted(FR.glob("*.png"))
    last = len(frames) - 1
    tw, th, pad, cap = 480, 270, 18, 44
    cols, rows = 4, 4
    W, H = cols * tw + (cols + 1) * pad, rows * (th + cap) + (rows + 1) * pad + 70
    sheet = Image.new("RGB", (W, H), (3, 12, 30))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 22), "KG SORENSEN · LIMPA PONTAS KG · \u201cLeve 2. Pague 1.\u201d · storyboard (quadros do filme)", fill=(200, 230, 255), font=font(22, True))
    for i, (t, sc, label) in enumerate(BOARD):
        n = min(last, round(t * FPS))
        im = Image.open(FR / f"{n:05d}.png").convert("RGB").resize((tw, th), Image.LANCZOS)
        x = pad + (i % cols) * (tw + pad)
        y = 70 + pad + (i // cols) * (th + cap + pad)
        sheet.paste(im, (x, y))
        d.rectangle([x - 1, y - 1, x + tw, y + th], outline=(40, 90, 150))
        d.text((x, y + th + 8), f"{sc}  {t:05.2f}s", fill=(99, 222, 249), font=font(15, True))
        d.text((x + 118, y + th + 8), label, fill=(210, 225, 245), font=font(15))
    sheet.save(ROOT / "output" / "storyboard.png", optimize=True)
    Image.open(frames[-1]).save(ROOT / "output" / "hero_frame.png", optimize=True)
    print("ok storyboard.png + hero_frame.png")


if __name__ == "__main__":
    main()
