#!/usr/bin/env python3
"""
KG SORENSEN · Limpa Pontas KG · Ref. 1810.7021
Extração de camadas a partir da MASTER VISUAL (referência absoluta).

Nada aqui é redesenhado: todo pixel de produto, embalagem, logo e tipografia
vem da arte original. O script apenas separa a arte em camadas animáveis:

  plates/  bg_empty  -> blueprint vazio (grid da própria master, sem estruturas)
           bg_struct -> blueprint com plataforma, círculo e linhas técnicas
           bg_full   -> idem + sombras/reflexos de contato dos produtos
  sprites/ embalagem, bloco traseiro, bloco frontal (recortes da master, 2x)
           tipografia e logo (chroma-key linear da master, alta resolução)

Saída: assets/layers/*.webp|png + assets/layers/manifest.json
Uso:   python3 tools/prep_layers.py
"""
from pathlib import Path
import json

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "master" / "master_visual.webp"
OUT = ROOT / "assets" / "layers"
DEBUG = ROOT / "assets" / "debug"
OUT.mkdir(parents=True, exist_ok=True)
DEBUG.mkdir(parents=True, exist_ok=True)

PAD = 240          # padding (px master) em volta dos plates, para a câmera respirar
PLATE_SCALE = 2    # plates em 2x para os push-ins

im = np.asarray(Image.open(MASTER).convert("RGB")).astype(np.float32)
H, W = im.shape[:2]
R, G, B = im[..., 0], im[..., 1], im[..., 2]
LUM = 0.299 * R + 0.587 * G + 0.114 * B
CHROMA = B - (R + G) / 2.0  # fundo blueprint = azul saturado; arte = neutra


def gblur(a, s):
    if s <= 24:
        return cv2.GaussianBlur(a, (0, 0), s, borderType=cv2.BORDER_REFLECT)
    # sigmas grandes: reduz, borra, amplia (mesmo resultado, muito mais rápido)
    f = s / 8.0
    h, w = a.shape[:2]
    sm = cv2.resize(a, (max(2, int(w / f)), max(2, int(h / f))), interpolation=cv2.INTER_AREA)
    sm = cv2.GaussianBlur(sm, (0, 0), 8.0, borderType=cv2.BORDER_REFLECT)
    return cv2.resize(sm, (w, h), interpolation=cv2.INTER_CUBIC)


def norm_fill(img, valid, sigmas=(3, 6, 12, 24, 48, 96, 192, 320)):
    """Preenchimento por convolução normalizada multi-escala (low-frequency)."""
    img = img.astype(np.float32)
    out = img.copy()
    filled = valid.astype(bool).copy()
    w = filled.astype(np.float32)
    for s in sigmas:
        if filled.all():
            break
        num = gblur(out * w[..., None] if out.ndim == 3 else out * w, s)
        den = gblur(w, s)
        last = s == sigmas[-1]
        ok = ((den > 0.25) | (last & (den > 1e-8))) & ~filled
        if out.ndim == 3:
            out[ok] = num[ok] / den[ok][:, None]
        else:
            out[ok] = num[ok] / den[ok]
        filled |= ok
        w = filled.astype(np.float32)
    return out


def box(mask, x0, y0, x1, y1):
    m = np.zeros_like(mask, dtype=bool)
    m[int(y0):int(y1), int(x0):int(x1)] = True
    return mask & m


def poly_mask(pts, shape=(H, W), aa=True):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.round(np.array(pts) * 16).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=4)
    return m.astype(np.float32) / 255.0


def save_rgba(path, rgb, a, scale=1, sharpen_alpha=False):
    rgb = np.clip(rgb, 0, 255).astype(np.float32)
    a = np.clip(a, 0, 1).astype(np.float32)
    if scale != 1:
        h, w = a.shape
        rgb = cv2.resize(rgb, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
        a = cv2.resize(a, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
        if sharpen_alpha:
            a = cv2.GaussianBlur(a, (0, 0), 0.45 * scale)  # suaviza ruído de compressão do contorno
            # contorno vetorial-like: reconstrói bordas nítidas a partir do matte
            lo, hi = 0.5 - sharpen_alpha, 0.5 + sharpen_alpha
            t = np.clip((a - lo) / (hi - lo), 0, 1)
            a = t * t * (3 - 2 * t)
        a = np.clip(a, 0, 1)
    rgba = np.dstack([np.clip(rgb, 0, 255), a * 255]).round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, lossless=True, quality=100, method=6)


# ---------------------------------------------------------------------------
# 1. Matte linear por croma (arte neutra sobre fundo azul)
# ---------------------------------------------------------------------------
cyan = (G > 140) & (B > 190) & (R < 200) & ((B - R) > 45)
bg_pix = (CHROMA > 46) & ~cyan
cbg = norm_fill(CHROMA, bg_pix)
bg_rgb = norm_fill(im, bg_pix)
C_FG = 4.0
alpha = np.clip((cbg - CHROMA) / np.maximum(cbg - C_FG, 8), 0, 1)
alpha[cyan] = 0
alpha = np.where(alpha < 0.04, 0, alpha)
# cor despremultiplicada
a_safe = np.maximum(alpha, 1e-3)[..., None]
fg_rgb = np.clip((im - (1 - alpha[..., None]) * bg_rgb) / a_safe, 0, 255)
fg_rgb = np.where(alpha[..., None] > 0.97, im, fg_rgb)

# ---------------------------------------------------------------------------
# 2. Elementos de tipografia/logo (bboxes na master, px)
# ---------------------------------------------------------------------------
REGIONS = {
    "logo":    (86, 56, 244, 222),
    "head1":   (86, 236, 648, 377),   # Leve 2.
    "head2":   (89, 381, 662, 556),   # Pague 1.
    "sub":     (92, 570, 432, 624),   # 2 unidades por
    "price":   (86, 624, 552, 744),   # R$ 11,60
    "perunit": (86, 744, 552, 784),   # R$ 5,80 por unidade nesta oferta.
    "cta":     (86, 852, 486, 890),   # Peça ao seu representante.
    "ref":     (1398, 852, 1592, 890),
    "label":   (1308, 74, 1594, 110),  # LIMPA PONTAS KG
}
SPRITE_SCALE = {"head1": 3, "head2": 3, "price": 3, "logo": 2}

manifest = {"master": {"w": W, "h": H}, "pad": PAD, "plateScale": PLATE_SCALE,
            "sprites": {}, "glyphs": {}}

text_mask = np.zeros((H, W), bool)
cyan_d = cyan.copy()
_cz = np.zeros((H, W), bool); _cz[360:560, 58:678] = True; _cz[620:745, 60:92] = True
cyan_d &= _cz
# cortes entre glifos que se tocam (mínimo da projeção vertical do matte)
SPLITS = {"head1": [183, 276, 374.5, 480, 593], "head2": [192, 281, 373, 463, 557, 621],
          "price": [170, 250, 309, 356, 389, 466]}
text_alpha = {}
for name, (x0, y0, x1, y1) in REGIONS.items():
    a = np.zeros_like(alpha)
    if name == "logo":
        a[y0:y1, x0:x1] = alpha[y0:y1, x0:x1]
        text_col = None
    else:
        # matte por projeção na cor real do texto (branco ou branco-azulado) sobre o fundo local
        reg = im[y0:y1, x0:x1].reshape(-1, 3)
        lum = reg @ np.array([0.299, 0.587, 0.114], np.float32)
        text_col = reg[lum >= np.percentile(lum, 99.3)].mean(axis=0)
        d = text_col[None, None, :] - bg_rgb[y0:y1, x0:x1]
        proj = np.sum((im[y0:y1, x0:x1] - bg_rgb[y0:y1, x0:x1]) * d, axis=2) / np.maximum(np.sum(d * d, axis=2), 1)
        a[y0:y1, x0:x1] = np.clip((proj - 0.1) / 0.88, 0, 1)
    a[cyan_d] = 0
    ys, xs = np.where(a > 0.08)
    bx0, by0, bx1, by1 = xs.min() - 3, ys.min() - 3, xs.max() + 4, ys.max() + 4
    text_mask |= a > 0.02
    text_alpha[name] = (a, (bx0, by0, bx1, by1))
    sub_a = a[by0:by1, bx0:bx1]
    if name == "logo":
        sub_rgb = fg_rgb[by0:by1, bx0:bx1]
    else:
        sub_rgb = np.broadcast_to(text_col, sub_a.shape + (3,)).copy()
    sc = SPRITE_SCALE.get(name, 2)
    sharp = 0.22 if sc == 3 else (0.34 if name != "logo" else False)
    save_rgba(OUT / f"t_{name}.png", sub_rgb, sub_a, scale=sc, sharpen_alpha=sharp)
    manifest["sprites"][f"t_{name}"] = {"file": f"t_{name}.png", "x": int(bx0), "y": int(by0),
                                         "w": int(bx1 - bx0), "h": int(by1 - by0), "scale": sc}
    # glifos: faixas em x (coordenadas da master)
    cols = np.where((sub_a > 0.3).any(0))[0] + bx0
    if name in SPLITS:
        edges = [cols.min()] + SPLITS[name] + [cols.max() + 1]
    else:
        # palavras/letras separadas por colunas vazias
        occ = (sub_a > 0.3).any(0)
        edges, inside = [], False
        for i, v in enumerate(occ):
            if v and not inside:
                edges.append(bx0 + i); inside = True
            elif not v and inside:
                edges.append(bx0 + i); inside = False
        if inside:
            edges.append(bx1)
        edges = [edges[0]] + [(edges[i] + edges[i + 1]) / 2 for i in range(1, len(edges) - 1, 2)] + [edges[-1]]
    manifest["glyphs"][f"t_{name}"] = [[float(edges[i]), float(edges[i + 1])] for i in range(len(edges) - 1)]
    print(f"{name:8s} bbox=({bx0},{by0},{bx1},{by1}) glyphs={len(edges) - 1}")

# ---------------------------------------------------------------------------
# 3. Produto: embalagem + bloco traseiro (BB) + bloco frontal (FB)
#    Fronteiras internas medidas na master (gradiente de luminância).
# ---------------------------------------------------------------------------
prod_region = poly_mask([(712, 190), (1250, 190), (1250, 380), (1615, 340), (1615, 800), (712, 800)])
a_prod = alpha * prod_region
# FB: bordas internas (contra a embalagem e contra o BB) + generoso por fora
fb_top_box = [(1190, 489.5), (1180, 487.5), (1170, 485.5), (1160, 483.5), (1150, 483.0), (1140, 480.5),
              (1135, 478.5), (1130, 477.3), (1125, 476.6), (1120, 477.3), (1114, 479.5), (1110, 481.5),
              (1105, 485.0), (1100, 489.0), (1095, 493.0), (1090, 497.0), (1085, 500.5), (1080, 504.0),
              (1076.5, 508.0), (1074.5, 512.0), (1073.3, 516.0)]
fb_top_bb = [(1192 + t * (1497 - 1192), 489.6 + t * (550.9 - 489.6)) for t in np.linspace(0, 1, 12)]
fb_poly = (fb_top_bb
           + [(1502, 552.5), (1506, 555.5), (1508.3, 559.5), (1508.5, 600), (1530, 640), (1530, 810),
              (1050, 810), (1050, 640), (1060, 600), (1073.3, 562)]
           + fb_top_box[::-1])
m_fb = poly_mask(fb_poly)
bb_poly = [(1191.6, 489.6), (1191.5, 421), (1193.5, 418.3), (1195.5, 416.6), (1199, 414.6), (1203, 413.2),
           (1208, 412.6), (1214, 411.6), (1222.5, 410.5), (1223, 340), (1620, 340), (1620, 640), (1508.5, 640),
           (1508.5, 559.5), (1506, 555.5), (1502, 552.5), (1497, 550.9)] + \
    [(1497 + t * (1192 - 1497), 550.9 + t * (489.6 - 550.9)) for t in np.linspace(0, 1, 12)][1:]
m_bb = np.clip(poly_mask(bb_poly) - m_fb, 0, 1)
m_box = np.clip(1 - m_fb - m_bb, 0, 1) * poly_mask([(712, 190), (1240, 190), (1240, 620), (712, 620)])
# silhueta da embalagem: arestas retas medidas na master
BOX_V = {"BLT": (731.2, 265.6), "FLT": (775.0, 283.0), "FRT": (1223.6, 227.2), "BRT": (1166.7, 211.2),
         "BLB": (737.0, 580.0), "FLB": (778.0, 598.0), "FRB": (1219.5, 541.0), "BRB": (1167.0, 525.0)}
box_sil = [BOX_V[k] for k in ("BLT", "BRT", "FRT", "FRB", "FLB", "BLB")]
manifest["box"] = BOX_V


def solid(a, m, poly=None, thr=0.6):
    """objetos convexos: casco convexo do matte -> sem furos de reflexo azul."""
    if poly is not None:
        hull = poly_mask(poly)
        core = cv2.erode(hull, np.ones((5, 5), np.uint8))
        return np.clip(np.maximum(a, core) * hull, 0, 1) * m
    b = ((a * m) > thr).astype(np.uint8)
    b = cv2.morphologyEx(b, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    lab, n = ndi.label(b)
    sizes = ndi.sum(b, lab, range(1, n + 1))
    b = (lab == (1 + int(np.argmax(sizes)))).astype(np.uint8)
    pts = cv2.findNonZero(b)
    hull = np.zeros((H, W), np.uint8)
    cv2.fillPoly(hull, [cv2.convexHull(pts)], 255, lineType=cv2.LINE_AA)
    hull = hull.astype(np.float32) / 255
    core = cv2.erode(hull, np.ones((3, 3), np.uint8))
    return np.clip(np.maximum(a, core) * hull, 0, 1) * m


objs = {"box": solid(a_prod, m_box, box_sil), "bb": solid(a_prod, m_bb, thr=0.3), "fb": solid(a_prod, m_fb)}
prod_union = np.clip(sum(objs.values()), 0, 1)
for name, a in objs.items():
    ys, xs = np.where(a > 0.02)
    bx0, by0, bx1, by1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    # cor: pixel original onde o objeto é sólido; despremultiplicado só na borda real (matte confiável)
    a_m = alpha[by0:by1, bx0:bx1]
    rgb = np.where(((a[by0:by1, bx0:bx1] > 0.985) | (a_m < 0.3))[..., None], im[by0:by1, bx0:bx1], fg_rgb[by0:by1, bx0:bx1])
    save_rgba(OUT / f"p_{name}.webp", rgb, a[by0:by1, bx0:bx1], scale=2)
    manifest["sprites"][f"p_{name}"] = {"file": f"p_{name}.webp", "x": int(bx0), "y": int(by0),
                                         "w": int(bx1 - bx0), "h": int(by1 - by0), "scale": 2}
    # passe "textura técnica": luminância da própria foto em rampa azul-ciano
    sub = im[by0:by1, bx0:bx1]
    y = (0.299 * sub[..., 0] + 0.587 * sub[..., 1] + 0.114 * sub[..., 2])
    t = np.clip((y - 12) / 205, 0, 1) ** 0.85
    lo, hi = np.array([8, 34, 84], np.float32), np.array([200, 238, 255], np.float32)
    tex = lo + (hi - lo) * t[..., None]
    save_rgba(OUT / f"p_{name}_tex.webp", tex, a[by0:by1, bx0:bx1], scale=2)
    manifest["sprites"][f"p_{name}_tex"] = {"file": f"p_{name}_tex.webp", "x": int(bx0), "y": int(by0),
                                             "w": int(bx1 - bx0), "h": int(by1 - by0), "scale": 2}
    print(f"p_{name} bbox=({bx0},{by0},{bx1},{by1})")

manifest["contours"] = {}
for name, a in objs.items():
    b = (a > 0.5).astype(np.uint8)
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, 1.2, True).reshape(-1, 2)
    manifest["contours"][name] = [[int(x), int(y)] for x, y in ap]
# silhueta completa do bloco traseiro (parte oculta pelo frontal estimada por casco)
manifest["fb_poly"] = [[round(x, 1), round(y, 1)] for x, y in fb_poly]

# ---------------------------------------------------------------------------
# 4. Line art que será "desenhada" na animação (permanece no plate final)
# ---------------------------------------------------------------------------
LINEART = {
    "bracket": (60, 362, 676, 560),
    "bar": (64, 626, 88, 740),
    "footer": (86, 840, 1632, 852),
    "label_frame": (1072, 46, 1614, 132),
    "cross_tl": (14, 18, 90, 86), "cross_tr": (1590, 18, 1660, 86),
    "cross_bl": (14, 850, 90, 918), "cross_br": (1590, 850, 1660, 918),
}
HF = LUM - gblur(LUM, 3)
line_mask = np.zeros((H, W), bool)
for k, (x0, y0, x1, y1) in LINEART.items():
    if k in ("bracket", "bar"):
        m = cyan | (box(HF > 4, 0, 0, W, H) & ~(alpha > 0.05))
    else:
        m = (HF > 3.5) & ~cv2.dilate(text_mask.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    m = box(m, x0, y0, x1, y1)
    k = 9 if k in ("bracket", "bar", "footer") else 5
    line_mask |= cv2.dilate(m.astype(np.uint8), np.ones((k, k), np.uint8)).astype(bool)

# ---------------------------------------------------------------------------
# 5. Clean plates
# ---------------------------------------------------------------------------
fg_mask = (alpha > 0.015) & ((prod_region > 0) | text_mask)
fg_mask |= prod_union > 0.01
fg_hard = cv2.dilate(fg_mask.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
# halo de sombra da tipografia (a master tem drop-shadow sutil)
txt_halo = cv2.dilate(text_mask.astype(np.uint8), np.ones((33, 33), np.uint8)).astype(bool) & ~(prod_region > 0)

# zonas de sombra/reflexo de contato de cada objeto
def shadow_zone(a, grow=20, drop=26):
    m = (a > 0.02).astype(np.uint8)
    d = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    k = np.zeros((2 * drop + 1, 9), np.uint8); k[drop:, :] = 1
    d = np.maximum(d, cv2.dilate(m, k))
    return d.astype(bool) & ~(prod_union > 0.5)

zones = {k: shadow_zone(v) for k, v in objs.items()}
zone_union = np.zeros((H, W), bool)
for z in zones.values():
    zone_union |= z

# região de estruturas (plataforma, círculo, linhas de construção) — vazia em bg_empty
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
struct = np.clip((xx - 588) / 40, 0, 1) * np.clip((yy - 92) / 40, 0, 1)
circ_top = np.zeros((H, W), np.float32); circ_top[60:140, 820:1300] = 1
struct = np.maximum(struct, gblur(circ_top, 8))
struct = np.maximum(struct, 0)
label_zone = np.zeros((H, W), np.float32); label_zone[40:136, 1060:1620] = 1
struct = struct * (1 - gblur(label_zone, 6))

# grid sintético separável (perfil de colunas/linhas da própria master)
clean = ~(fg_hard | txt_halo | line_mask | zone_union) & (struct < 0.02)
lowp = gblur(im, 2.2)
im_noline = cv2.medianBlur(np.clip(im, 0, 255).astype(np.uint8), 7).astype(np.float32)
lowp_smooth = gblur(im_noline, 3)
not_valid_extra = cv2.dilate((line_mask | (HF > 6)).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
hf_rgb = im - lowp
med_all = np.median(hf_rgb[clean], axis=0)
Pc = np.zeros((W, 3), np.float32); Pr = np.zeros((H, 3), np.float32)
for x in range(W):
    c = clean[:, x]
    Pc[x] = np.median(hf_rgb[c, x], axis=0) if c.sum() > 12 else med_all
for y in range(H):
    c = clean[y, :]
    Pr[y] = np.median(hf_rgb[y, c], axis=0) if c.sum() > 12 else med_all
hf_synth = Pc[None, :, :] + Pr[:, None, :] - med_all
# ganho local do contraste do grid acompanha a luminância do fundo
lf_lum_clean = norm_fill(gblur(LUM, 6), clean)
gain = np.clip(lf_lum_clean / max(np.median(lf_lum_clean[clean]), 1), 0.6, 1.6)[..., None]

lf_bias = np.mean((lowp - lowp_smooth)[clean], axis=0)


def plate(remove):
    lp = norm_fill(lowp_smooth, ~(remove | not_valid_extra), sigmas=(10, 20, 40, 80, 160, 320))
    fill = lp + lf_bias + hf_synth * gain
    # costura suave na borda da máscara
    rm = remove.astype(np.float32)
    e = np.maximum(gblur(rm, 2.0), cv2.erode(rm, np.ones((5, 5), np.uint8)))[..., None]
    out = im * (1 - e) + fill * e
    return np.clip(out, 0, 255), e

remove_full = fg_hard | txt_halo
bg_full, _ = plate(remove_full)
remove_struct = remove_full | zone_union
bg_struct, _ = plate(remove_struct)
# bg_empty parte de bg_struct: fora das linhas/estruturas os dois plates são idênticos
remove_e = line_mask | (struct > 0.02)
base_lp = gblur(cv2.medianBlur(np.clip(bg_struct, 0, 255).astype(np.uint8), 7).astype(np.float32), 3)
nv_e = cv2.dilate((line_mask | ((0.299 * bg_struct[..., 0] + 0.587 * bg_struct[..., 1] + 0.114 * bg_struct[..., 2])
                   - gblur(0.299 * bg_struct[..., 0] + 0.587 * bg_struct[..., 1] + 0.114 * bg_struct[..., 2], 3) > 6)).astype(np.uint8),
                  np.ones((9, 9), np.uint8)).astype(bool)
lp_e = norm_fill(base_lp, ~(remove_e | nv_e), sigmas=(10, 20, 40, 80, 160, 320, 640))
fill_e = lp_e + lf_bias + hf_synth * gain
rm = remove_e.astype(np.float32)
e = np.maximum(gblur(rm, 2.0), cv2.erode(rm, np.ones((5, 5), np.uint8)))[..., None]
bg_empty = bg_struct * (1 - e) + fill_e * e
s3 = struct[..., None]
bg_empty = bg_empty * (1 - s3) + fill_e * s3


def pad_scale(img):
    p = cv2.copyMakeBorder(img.astype(np.float32), PAD, PAD, PAD, PAD, cv2.BORDER_REFLECT)
    p = cv2.resize(p, (p.shape[1] * PLATE_SCALE, p.shape[0] * PLATE_SCALE), interpolation=cv2.INTER_LANCZOS4)
    return np.clip(p, 0, 255).round().astype(np.uint8)


for name, img in (("bg_empty", bg_empty), ("bg_struct", bg_struct), ("bg_full", bg_full)):
    Image.fromarray(pad_scale(img)).save(OUT / f"{name}.webp", quality=95, method=6)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(DEBUG / f"{name}.png")
    manifest["sprites"][name] = {"file": f"{name}.webp", "x": -PAD, "y": -PAD,
                                 "w": W + 2 * PAD, "h": H + 2 * PAD, "scale": PLATE_SCALE}

# sombra/halo escuro da tipografia (a master tem um drop-shadow suave)
LUM_full = 0.299 * bg_full[..., 0] + 0.587 * bg_full[..., 1] + 0.114 * bg_full[..., 2]
# cada pixel de halo pertence ao bloco de texto mais próximo (evita "eco" do texto vizinho)
dist = {k: cv2.distanceTransform((~(v[0] > 0.02)).astype(np.uint8), cv2.DIST_L2, 5) for k, v in text_alpha.items()}
for name, (a, (bx0, by0, bx1, by1)) in text_alpha.items():
    if name == "logo":
        continue
    others = np.min(np.stack([d for k, d in dist.items() if k != name]), axis=0)
    own = (dist[name] <= others)
    m = 18
    sx0, sy0, sx1, sy1 = max(bx0 - m, 0), max(by0 - m, 0), min(bx1 + m, W), min(by1 + m, H)
    lp, lm = LUM_full[sy0:sy1, sx0:sx1], LUM[sy0:sy1, sx0:sx1]
    at = a[sy0:sy1, sx0:sx1]
    sa = np.clip((lp - lm) / np.maximum(lp - 4, 6), 0, 0.85) * (at < 0.02) * own[sy0:sy1, sx0:sx1]
    sa = gblur(sa, 1.0)
    save_rgba(OUT / f"h_{name}.webp", np.broadcast_to(np.array([1, 6, 20], np.float32), sa.shape + (3,)), sa, scale=2)
    manifest["sprites"][f"h_{name}"] = {"file": f"h_{name}.webp", "x": int(sx0), "y": int(sy0),
                                         "w": int(sx1 - sx0), "h": int(sy1 - sy0), "scale": 2}

# camadas de sombra de contato (bg_full recortado nas zonas), por objeto
for k, z in zones.items():
    zf = gblur(z.astype(np.float32), 3) * z
    ys, xs = np.where(z)
    bx0, by0, bx1, by1 = xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5
    save_rgba(OUT / f"s_{k}.webp", bg_full[by0:by1, bx0:bx1], zf[by0:by1, bx0:bx1], scale=2)
    manifest["sprites"][f"s_{k}"] = {"file": f"s_{k}.webp", "x": int(bx0), "y": int(by0),
                                      "w": int(bx1 - bx0), "h": int(by1 - by0), "scale": 2}

# camada de brilho das linhas técnicas (acende quando o scanner passa)
Ls = 0.299 * bg_struct[..., 0] + 0.587 * bg_struct[..., 1] + 0.114 * bg_struct[..., 2]
hf_s = Ls - gblur(Ls, 2.5)
la = np.clip((hf_s - 10) / 14, 0, 1)
la *= np.clip(struct * 1.5, 0, 1)
la = np.maximum(la, gblur(la, 1.6) * 0.6)
save_rgba(OUT / "l_lines.webp", np.broadcast_to(np.array([150, 225, 255], np.float32), la.shape + (3,)), la, scale=1)
manifest["sprites"]["l_lines"] = {"file": "l_lines.webp", "x": 0, "y": 0, "w": W, "h": H, "scale": 1}

# ---------------------------------------------------------------------------
# 6. Debug
# ---------------------------------------------------------------------------
Image.fromarray((alpha * 255).astype(np.uint8)).save(DEBUG / "alpha.png")
dbg = (im * 0.45).astype(np.uint8)
cols = {"box": (255, 80, 80), "bb": (80, 255, 80), "fb": (80, 160, 255)}
for k, a in objs.items():
    dbg = np.where((a > 0.5)[..., None], (dbg * 0.4 + np.array(cols[k]) * 0.6).astype(np.uint8), dbg)
Image.fromarray(dbg).save(DEBUG / "objects.png")
Image.fromarray((line_mask * 255).astype(np.uint8)).save(DEBUG / "line_mask.png")

json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
print("ok", OUT)
