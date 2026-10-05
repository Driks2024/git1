#!/usr/bin/env python3
"""
KG SORENSEN · Limpa Pontas KG — sound design sintetizado (48 kHz, estéreo).

Sem bibliotecas de samples: tudo é gerado aqui, sincronizado com os marcos da
timeline de src/engine.js. Linguagem: engenharia de precisão — sub discreto,
pulsos digitais, cliques mecânicos, calibração, scanner, servo, impactos secos.
Nada épico: o impacto principal é LEVE 2. PAGUE 1. (9.86 s); o secundário é
R$ 11,60 (12.25 s).

Uso: python3 tools/sound_design.py  → output/kg_sound_design.wav
"""
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "kg_sound_design.wav"
SR = 48000
DUR = 18.8
N = int(SR * DUR)
rng = np.random.default_rng(1810_7021)

dry = np.zeros((2, N))
send = np.zeros((2, N))


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(sig, t, pan=0.0, gain=1.0, rev=0.0):
    """posiciona um sinal mono/estéreo no instante t (s), pan -1..1 (equal power)"""
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        th = (pan + 1) * np.pi / 4
        sig = np.vstack([sig[0] * np.cos(th), sig[0] * np.sin(th)])
    i0 = int(t * SR)
    if i0 >= N:
        return
    n = min(sig.shape[1], N - i0)
    if i0 < 0:
        sig = sig[:, -i0:]; n = min(sig.shape[1], N); i0 = 0
    dry[:, i0:i0 + n] += sig[:, :n] * gain
    send[:, i0:i0 + n] += sig[:, :n] * gain * rev


def env(n, a=0.002, r=0.1, curve=4.0):
    """ataque linear + decaimento exponencial (n amostras)"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-5)) * np.exp(-np.maximum(0, t - a) * curve / max(r, 1e-5))
    return e


def adsr(n, a, s_end, r):
    t = np.arange(n) / SR
    e = np.clip(t / max(a, 1e-4), 0, 1)
    e *= np.clip((n / SR - t) / max(r, 1e-4), 0, 1)
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def svf_sweep(x, f0, f1, q=4.0, curve=1.0):
    """filtro passa-faixa de estado variável com frequência varrendo f0→f1"""
    n = len(x)
    f = f0 * (f1 / f0) ** (np.linspace(0, 1, n) ** curve)
    g = np.tan(np.pi * np.minimum(f, SR * 0.45) / SR)
    k = 1 / q
    y = np.zeros(n)
    ic1 = ic2 = 0.0
    for i in range(n):
        gi = g[i]
        a1 = 1 / (1 + gi * (gi + k)); a2 = gi * a1; a3 = gi * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        y[i] = v1
    return y


def sine_glide(f0, f1, d, curve=1.0):
    t = tt(d)
    f = f0 * (f1 / f0) ** ((t / d) ** curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def mx(*xs):
    """soma sinais de durações diferentes (preenche com silêncio)"""
    xs = [np.atleast_1d(x) for x in xs if np.ndim(x) > 0]
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


# ───────────────────────────── vocabulário ─────────────────────────────
def click(bright=1.0):
    """clique mecânico de precisão (chave/relé)"""
    n = int(0.03 * SR)
    nz = hp(rng.standard_normal(n), 2500) * env(n, 0.0004, 0.004, 5)
    ping = np.sin(2 * np.pi * (3600 + 1400 * bright) * tt(0.03)) * env(n, 0.0005, 0.012, 5)
    body = np.sin(2 * np.pi * 900 * tt(0.03)) * env(n, 0.0005, 0.006, 5)
    return 0.55 * nz + 0.35 * ping + 0.25 * body


def tick():
    n = int(0.012 * SR)
    return hp(rng.standard_normal(n), 5000) * env(n, 0.0002, 0.003, 5)


def blip(f, d=0.07):
    return np.sin(2 * np.pi * f * tt(d)) * env(int(d * SR), 0.002, d * 0.6, 4)


def zip_line(d, f0, f1):
    """laser desenhando uma linha técnica"""
    n = int(d * SR)
    tone = sine_glide(f0, f1, d, 0.8) * adsr(n, 0.01, 0, d * 0.7)
    nz = svf_sweep(rng.standard_normal(n), f0 * 1.5, f1 * 1.5, q=6) * adsr(n, 0.01, 0, d * 0.6)
    return 0.22 * tone + 0.5 * nz


def whoosh(d, f0, f1, q=1.4):
    n = int(d * SR)
    x = svf_sweep(rng.standard_normal(n), f0, f1, q=q, curve=1.0)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return x * e


def servo(d, f0, f1):
    n = int(d * SR)
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) * (1 + 0.004 * np.sin(2 * np.pi * 38 * t))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    return lp(saw, 2200) * adsr(n, 0.03, 0, 0.08) * 0.5


def ting(f, d=0.9, idx=2.2):
    t = tt(d)
    m = np.sin(2 * np.pi * f * 1.414 * t) * idx * np.exp(-t / 0.18)
    return np.sin(2 * np.pi * f * t + m) * np.exp(-t / (d * 0.32))


def knock(f=110, d=0.35):
    t = tt(d)
    fr = f * (1 + 1.2 * np.exp(-t / 0.012))
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.07)
    tr = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.006)
    return 0.8 * body + 0.35 * tr


def scanner(d, f=1180):
    n = int(d * SR)
    t = tt(d)
    tone = np.sin(2 * np.pi * f * t) * (0.55 + 0.45 * np.sin(2 * np.pi * 31 * t))
    nz = bp(rng.standard_normal(n), 1800, 5200) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t))
    return (0.16 * tone + 0.28 * nz) * adsr(n, 0.08, 0, 0.18)


def sub_hit(f0=70, f1=36, d=1.6, decay=0.45):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay) * np.minimum(1, t / 0.003)


def metal_ring(base=1120, d=2.2):
    t = tt(d)
    partials = [(1.0, 1.0), (2.07, 0.6), (3.31, 0.38), (4.62, 0.22), (6.1, 0.12)]
    out = sum(a * np.sin(2 * np.pi * base * r * t + rng.random() * 6.28) * np.exp(-t / (0.55 / r ** 0.5)) for r, a in partials)
    return out * np.minimum(1, t / 0.002)


# ───────────────────────────── cama (drone + pad) ─────────────────────────────
t_all = np.arange(N) / SR


def smooth_env(points):
    xs, ys = zip(*points)
    return np.interp(t_all, xs, ys)


# sub drone (E1 + E2), com "sucção" antes do impacto
drone = 0.55 * np.sin(2 * np.pi * 41.2 * t_all) + 0.25 * np.sin(2 * np.pi * 82.4 * t_all + 0.6)
drone *= 1 + 0.08 * np.sin(2 * np.pi * 0.23 * t_all)
dr_env = smooth_env([(0, 0), (1.6, 0.5), (7.4, 0.62), (8.4, 0.8), (9.62, 0.85), (9.84, 0.0), (10.05, 0.0),
                     (10.6, 0.55), (14.0, 0.5), (16.7, 0.62), (18.2, 0.35), (18.8, 0.0)])
place(np.vstack([drone * dr_env, drone * dr_env]), 0, gain=0.11)

# pad harmônico: quinta aberta (A2-E3-B3) que clareia até o clímax e resolve em Lá maior (add9) no hero
def pad_voice(freqs, detune=0.004):
    out = np.zeros(N)
    for f in freqs:
        for dt in (-detune, 0, detune):
            ph = np.cumsum(np.full(N, f * (1 + dt))) / SR + rng.random()
            out += 2 * (ph % 1) - 1
    return out / (len(freqs) * 3)


pad_a = pad_voice([110.0, 164.81, 246.94])
pad_b = pad_voice([110.0, 138.59, 164.81, 246.94, 329.63])
cut = smooth_env([(0, 300), (2.5, 420), (7.4, 900), (9.6, 2600), (9.86, 500), (11, 900), (14, 1100), (16.8, 1900), (18.8, 700)])
# filtro variável aplicado por blocos (rápido o bastante e sem zipper audível)
def block_lp(x, cutoff, block=2048):
    y = np.zeros_like(x); zi = None
    for i in range(0, len(x), block):
        c = float(np.mean(cutoff[i:i + block]))
        sos = signal.butter(2, min(c, SR * 0.45), btype="low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return y


pa = block_lp(pad_a, cut) * smooth_env([(0, 0), (2.4, 0), (4.5, 0.42), (9.55, 0.7), (9.84, 0.0), (18.8, 0.0)])
pb = block_lp(pad_b, cut) * smooth_env([(0, 0), (9.95, 0), (10.8, 0.4), (14.0, 0.42), (16.75, 0.75), (17.6, 0.6), (18.8, 0.0)])
padmix = pa + pb
# leve abertura estéreo
place(np.vstack([padmix, np.roll(padmix, int(0.011 * SR))]), 0, gain=0.10, rev=0.25)

# room tone de laboratório (ar filtrado)
room = lp(hp(rng.standard_normal(N), 120), 900) * smooth_env([(0, 0), (1.2, 1), (16.8, 1), (18.8, 0.3)])
place(np.vstack([room, np.roll(room, 997)]), 0, gain=0.012)

# ───────────────────────────── pulso de calibração (S1–S4) ─────────────────────────────
for k in range(19):
    t0 = 0.36 + 0.5 * k
    if t0 > 9.4:
        break
    accent = (k % 4 == 0)
    place(mx(tick(), 0.25 * blip(1960 if accent else 1470, 0.03)) if k > 1 else tick(), t0, pan=0.15 * (-1) ** k,
          gain=0.11 if accent else 0.07)

# ───────────────────────────── S1 · calibração ─────────────────────────────
place(mx(knock(58, 0.6) * 0.6, 0.3 * sine_glide(180, 620, 0.5) * env(int(0.5 * SR), 0.05, 0.3, 3)), 0.12, gain=0.32, rev=0.2)
place(blip(2400, 0.06), 0.18, gain=0.12, rev=0.3)
place(whoosh(1.0, 700, 3200, q=3), 0.33, pan=-0.2, gain=0.10)                 # datum atravessa
place(zip_line(0.75, 900, 1500), 0.6, pan=0.15, gain=0.18, rev=0.2)          # vertical x1045
place(zip_line(0.7, 800, 1300), 0.85, pan=-0.45, gain=0.15, rev=0.2)          # vertical x702
place(servo(0.5, 820, 1300), 0.75, pan=0.85, gain=0.12)                       # retícula sup. direita
place(zip_line(0.5, 1300, 2100), 1.05, pan=0.7, gain=0.12)                    # moldura do rótulo
place(zip_line(0.5, 1200, 1900), 1.15, pan=0.65, gain=0.10)
place(zip_line(0.6, 1000, 1700), 1.15, pan=0.4, gain=0.12)                    # diagonal tracejada
for i in range(14):                                                            # rótulo LIMPA PONTAS KG
    place(click(0.6 + 0.03 * i), 1.55 + i * 0.045, pan=0.55 + 0.02 * i, gain=0.10)
r = np.random.default_rng(77)
for i in range(16):                                                            # marcas de calibração
    x, y, t0 = 640 + r.random() * 980, 120 + r.random() * 560, 0.4 + r.random() * 1.9
    place(blip(2200 + 900 * r.random(), 0.04), t0 + 0.05, pan=(x - 1012) / 700, gain=0.035, rev=0.3)

# ───────────────────────────── S2 · construção da embalagem ─────────────────────────────
edges = [(2.45, 0.42, 950), (2.5, 0.42, 1000), (2.58, 0.2, 1200), (2.86, 0.18, 1250), (2.66, 0.36, 1100), (2.62, 0.36, 1050),
         (2.9, 0.34, 1150), (2.98, 0.18, 1350), (3.0, 0.36, 1300), (3.06, 0.32, 1500), (3.12, 0.36, 1450), (3.16, 0.24, 1600)]
for i, (t0, d, f) in enumerate(edges):
    place(zip_line(d + 0.05, f, f * 1.35), t0, pan=-0.3 + 0.05 * i, gain=0.085, rev=0.15)
place(scanner(1.45), 2.55, gain=0.55, rev=0.15)                                # varredura da plataforma
place(whoosh(1.4, 300, 1400, q=2.5), 2.55, gain=0.08)
for i in range(6):
    place(click(1.1), 2.72 + i * 0.07, pan=-0.35 + 0.12 * i, gain=0.07)       # vértices
place(lp(rng.standard_normal(int(0.6 * SR)), 600) * np.sin(np.pi * np.linspace(0, 1, int(0.6 * SR))) ** 2, 3.15, gain=0.22)  # volume
place(servo(0.7, 300, 520), 3.48, pan=-0.2, gain=0.20)                         # passe de textura
place(mx(whoosh(0.75, 2500, 9000, q=2) * 0.8, 0.12 * bp(rng.standard_normal(int(0.75 * SR)), 7000, 12000)), 3.8, gain=0.12, rev=0.25)  # passe real
place(ting(3520, 1.1), 4.5, pan=-0.1, gain=0.08, rev=0.5)                      # brilho na aresta

# ───────────────────────────── S3 · os dois Limpa Pontas ─────────────────────────────
place(whoosh(1.6, 220, 900, q=1.2), 4.85, pan=0.3, gain=0.12)                  # tracking lateral
for t0, pan in ((5.25, 0.55), (5.4, 0.2)):                                       # colchetes de rastreio
    place(mx(click(1.3), 0.6 * knock(160, 0.12)), t0, pan=pan, gain=0.17, rev=0.1)
    place(click(0.8), t0 + 0.35, pan=pan, gain=0.07)
for t0, d, pan, f in ((5.55, 0.57, 0.5, 900), (5.8, 0.62, 0.5, 1300), (5.95, 0.57, 0.15, 850), (6.2, 0.62, 0.15, 1250)):
    place(zip_line(d, f, f * 1.6), t0, pan=pan, gain=0.13, rev=0.15)
place(knock(95, 0.4), 6.42, pan=0.5, gain=0.26, rev=0.15)                       # assenta UN. 01
place(knock(88, 0.4), 6.82, pan=0.15, gain=0.30, rev=0.15)                      # assenta UN. 02
place(ting(2960, 0.8), 6.4, pan=0.55, gain=0.05, rev=0.5)
place(ting(3320, 0.8), 6.8, pan=0.15, gain=0.05, rev=0.5)
place(servo(0.38, 700, 1250), 6.62, pan=0.3, gain=0.12)                         # anel da etiqueta
place(mx(blip(1600, 0.06), np.pad(blip(2400, 0.08), (int(0.07 * SR), 0))), 6.98, pan=0.3, gain=0.12)  # trava
place(sine_glide(300, 900, 0.12) * env(int(0.12 * SR), 0.005, 0.08, 3), 6.74, pan=0.3, gain=0.14)  # o "2" aparece

# ───────────────────────────── S4 · LEVE 2. PAGUE 1. ─────────────────────────────
wh = whoosh(1.05, 180, 2600, q=1.1)
place(np.vstack([wh * np.linspace(0.35, 1, len(wh)), wh * np.linspace(1, 0.35, len(wh))]), 7.42, gain=0.30, rev=0.15)  # chicote
place(sub_hit(55, 34, 0.9, 0.25), 7.5, gain=0.18)
place(mx(click(1.0), knock(130, 0.5) * 0.9, 0.25 * metal_ring(1480, 0.8)), 8.42, pan=0.1, gain=0.36, rev=0.35)  # "2" pousa
place(zip_line(0.32, 1700, 900), 8.3, pan=-0.2, gain=0.10)                      # guias
place(zip_line(0.32, 1500, 800), 8.36, pan=-0.2, gain=0.06)
for i, t0 in enumerate((8.43, 8.53, 8.63, 8.73)):                               # L-e-v-e sobem
    place(mx(knock(150 + 18 * i, 0.22) * 0.7, 0.25 * servo(0.18, 380 + 40 * i, 620 + 50 * i)), t0, pan=-0.6 + 0.18 * i, gain=0.20)
place(mx(click(1.4), knock(240, 0.12) * 0.5), 8.92, pan=0.15, gain=0.22)           # ponto final
place(whoosh(0.8, 300, 800, q=1.0), 9.0, gain=0.07)
for t0, pan in ((9.08, -0.75), (9.14, -0.4), (9.2, -0.4), (9.36, 0.25)):         # colchete
    place(zip_line(0.3, 1400, 2300), t0, pan=pan, gain=0.10)
riser_d = 0.42
riser = mx(scanner(riser_d, 1180) * 1.4, 0.35 * sine_glide(440, 1320, riser_d, 1.5) * adsr(int(riser_d * SR), 0.02, 0, 0.03))
place(riser, 9.44, gain=0.55)
# IMPACTO PRINCIPAL — engenharia de precisão, não explosão
imp = mx(1.0 * sub_hit(72, 36, 2.2, 0.55),
         0.55 * knock(120, 0.6),
         0.30 * hp(rng.standard_normal(int(0.08 * SR)), 1800) * env(int(0.08 * SR), 0.0005, 0.02, 5),
         0.20 * metal_ring(1120, 2.2))
place(np.vstack([imp, np.roll(imp, 160)]), 9.86, gain=0.62, rev=0.35)
place(ting(4180, 1.6, 1.4), 9.87, gain=0.06, rev=0.6)

# ───────────────────────────── S5 · preço ─────────────────────────────
place(whoosh(0.9, 260, 900, q=1.1), 11.0, gain=0.09)
for i in range(12):
    place(click(0.7 + 0.02 * i), 11.22 + i * 0.034, pan=-0.55 + 0.04 * i, gain=0.085)
place(zip_line(0.3, 2000, 900), 11.6, pan=-0.75, gain=0.12)                     # barra ciano
place(scanner(0.42, 1320) * 1.1, 11.84, pan=-0.4, gain=0.42)                     # varredura do preço
micro = mx(0.8 * sub_hit(64, 44, 0.7, 0.18), 0.6 * knock(170, 0.3), 0.3 * click(1.4), 0.12 * metal_ring(1660, 0.7))
place(micro, 12.25, pan=-0.25, gain=0.44, rev=0.25)                             # R$ 11,60 trava
place(zip_line(0.24, 1500, 2300), 12.4, pan=0.45, gain=0.09)                    # caixa da calculadora
for i, ch in enumerate("2 × R$ 5,80"):
    if ch != " ":
        place(mx(tick() * 0.8, 0.3 * blip(2600 + 60 * i, 0.025)), 12.62 + i * 0.03, pan=0.45, gain=0.10)
place(zip_line(0.14, 1800, 2400), 12.98, pan=0.45, gain=0.07)
for i, ch in enumerate("= R$ 11,60"):
    if ch != " ":
        place(mx(tick() * 0.8, 0.3 * blip(2900 + 60 * i, 0.025)), 13.08 + i * 0.03, pan=0.45, gain=0.10)
place(mx(blip(1245, 0.12), np.pad(blip(1865, 0.16), (int(0.09 * SR), 0))), 13.4, pan=0.45, gain=0.10, rev=0.3)  # confere
for i in range(29):
    place(tick(), 12.95 + i * 0.016, pan=-0.55 + 0.03 * i, gain=0.06)           # por unidade
place(zip_line(0.25, 1300, 1900), 13.45, pan=0.1, gain=0.06)

# ───────────────────────────── S6 · composição ─────────────────────────────
wh2 = whoosh(2.8, 140, 1100, q=0.9)
place(np.vstack([wh2, np.roll(wh2, 400)]), 14.0, gain=0.13, rev=0.2)           # pull-back
for t0, pan in ((14.35, 0.85), (14.45, 0.2), (14.55, 0.95), (14.62, 0.6), (14.5, -0.05), (14.7, 0.95)):
    place(zip_line(0.6, 900, 1500), t0, pan=pan, gain=0.06, rev=0.2)
    place(blip(2093, 0.09), t0 + 0.6, pan=pan, gain=0.04, rev=0.4)
place(whoosh(1.1, 4000, 11000, q=2.5), 14.95, pan=0.4, gain=0.06, rev=0.3)     # brilho nos contornos
place(servo(0.42, 600, 980), 15.0, pan=-0.85, gain=0.10)                         # logo: contorno
place(mx(knock(72, 0.7) * 0.8, 0.2 * metal_ring(830, 1.0)), 15.66, pan=-0.8, gain=0.30, rev=0.3)  # selo KG SORENSEN
place(zip_line(0.6, 1600, 900), 15.25, pan=-0.3, gain=0.09)                      # linha do CTA
place(servo(0.5, 900, 1400), 15.35, pan=-0.95, gain=0.06)
place(servo(0.5, 900, 1400), 15.5, pan=-0.95, gain=0.06)
for i in range(22):
    place(click(0.65), 15.6 + i * 0.026, pan=-0.8 + 0.03 * i, gain=0.075)        # Peça ao seu representante.
for i in range(13):
    place(click(0.9), 15.95 + i * 0.03, pan=0.85, gain=0.06)                      # Ref. 1810.7021

# ───────────────────────────── S7 · hero ─────────────────────────────
lock = mx(0.55 * sub_hit(55, 41, 2.0, 0.6), 0.25 * metal_ring(880, 2.0))
place(lock, 16.75, gain=0.30, rev=0.45)
place(blip(1760, 0.1) * 0.7, 16.78, gain=0.07, rev=0.5)
place(mx(whoosh(0.9, 5000, 12000, q=3), 0.3 * ting(5280, 0.9, 1.0)), 17.2, pan=-0.4, gain=0.07, rev=0.5)  # brilho no título

# ───────────────────────────── reverb + master ─────────────────────────────
def make_ir(d=2.2, decay=0.55):
    n = int(d * SR); t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t / decay)
    ir = np.vstack([lp(hp(ir[0], 300), 6500), lp(hp(ir[1], 300), 6500)])
    ir[:, :int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


ir = make_ir()
wet = np.vstack([signal.fftconvolve(send[0], ir[0])[:N], signal.fftconvolve(send[1], ir[1])[:N]])
mix = dry + 0.55 * wet
mix = hp(mix, 28)
# limitador suave + normalização (pico -1 dBFS)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fade = np.ones(N); fade[-int(0.25 * SR):] = np.linspace(1, 0, int(0.25 * SR)); fade[:int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
mix *= fade
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
OUT.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT, SR, mix.T.astype(np.float32))
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
print(f"ok {OUT}  {DUR}s  RMS {rms:.1f} dBFS")
