#!/usr/bin/env python3
"""
Deterministic sound design for the KG Sorensen vertical film (Mode A).

No audio was provided, so every sound is synthesised here from fixed seeds:
the same script always writes byte-identical files.

    python3 video/scripts/make-sfx.py            # → video/public/sfx/*.wav

whoosh   reveal / explode air move        tick     label pop-ins
pop      ring ping / offer card           riser    tension before the explosion
snap     re-assembly lock                 sweep    laser variant scan
plunge   bur spinning into the foam       hit      final low impact
shimmer  crystalline sparkle              bed      45 s low ambient drone
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'sfx'))


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env_adsr(n, a, d, s, r, sustain_level=0.7):
    """Linear-ish ADSR in seconds, length n samples."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    s_len = max(0, n - a - d - r)
    e = np.concatenate([
        np.linspace(0, 1, max(1, a), endpoint=False) ** 1.5,
        np.linspace(1, sustain_level, max(1, d), endpoint=False),
        np.full(s_len, sustain_level),
        np.linspace(sustain_level, 0, max(1, r)) ** 2,
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def one_pole_lp(x, cutoff):
    """One-pole low-pass with a per-sample (array) or fixed cutoff in Hz."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def svf_bandpass(x, freq, q=0.7):
    """Chamberlin state-variable band-pass with a time-varying centre."""
    freq = np.broadcast_to(np.asarray(freq, dtype=np.float64), x.shape)
    f = 2 * np.sin(np.pi * np.clip(freq, 20, SR / 6) / SR)
    damp = 1.0 / q
    low = band = 0.0
    y = np.empty_like(x)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += f[i] * high
        low += f[i] * band
        y[i] = band
    return y


def pan(mono, p):
    """Equal-power pan, p in [-1, 1] (scalar or array)."""
    p = np.broadcast_to(np.asarray(p, dtype=np.float64), mono.shape)
    ang = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(ang), mono * np.sin(ang)], axis=1)


def normalize(x, peak=0.89):
    m = np.max(np.abs(x))
    return x if m == 0 else x * (peak / m)


def fade_edges(x, fin=0.002, fout=0.02):
    n = len(x)
    a = min(n, int(fin * SR))
    b = min(n, int(fout * SR))
    e = np.ones(n)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b))
    return x * (e[:, None] if x.ndim == 2 else e)


def write(name, stereo, peak=0.89):
    stereo = fade_edges(normalize(stereo, peak))
    if stereo.ndim == 1:
        stereo = np.stack([stereo, stereo], axis=1)
    data = (np.clip(stereo, -1, 1) * 32767).astype('<i2')
    path = os.path.join(OUT, f'{name}.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'{name:8s} {len(stereo) / SR:5.2f}s  {path}')


# ----------------------------------------------------------------------------- sounds

def whoosh(seed=1):
    rng = np.random.default_rng(seed)
    dur = 1.35
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    # swelling band-pass sweeping up then settling: air moving past the lens
    k = t / dur
    centre = 220 + 2600 * np.sin(np.pi * np.clip(k * 1.15, 0, 1)) ** 1.6
    body = svf_bandpass(n, centre, q=1.1)
    amp = np.sin(np.pi * np.clip(k * 1.1, 0, 1)) ** 2.2
    low = np.sin(2 * np.pi * (60 + 30 * k) * t) * amp * 0.25
    mono = body * amp + low
    return pan(mono, -0.6 + 1.2 * k)


def tick(seed=2):
    t = t_axis(0.11)
    e = np.exp(-t * 95)
    s = (np.sin(2 * np.pi * 3150 * t) * 0.6 + np.sin(2 * np.pi * 5230 * t) * 0.3 + np.sin(2 * np.pi * 1280 * t) * 0.35) * e
    click = np.zeros_like(t)
    click[:24] = np.hanning(48)[24:] * 0.9
    return pan(s + click, 0.15)


def pop(seed=3):
    t = t_axis(0.28)
    f = 520 * np.exp(-t * 9) + 260
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 22) + 0.25 * np.sin(2 * ph) * np.exp(-t * 34)
    return pan(s, 0.0)


def riser(seed=4):
    rng = np.random.default_rng(seed)
    dur = 2.2
    t = t_axis(dur)
    k = t / dur
    n = rng.standard_normal(len(t))
    air = svf_bandpass(n, 400 + 5200 * k ** 2.2, q=2.2) * k ** 2.4
    f = 70 * 2 ** (k * 2.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.5 * np.sin(2.01 * ph) + 0.25 * np.sin(3.02 * ph)) * k ** 3
    trem = 1 + 0.25 * np.sin(2 * np.pi * (4 + 14 * k) * t)
    mono = (air * 0.9 + tone * 0.45) * trem
    return pan(mono, 0.25 * np.sin(2 * np.pi * 0.6 * t))


def snap(seed=5):
    rng = np.random.default_rng(seed)
    t = t_axis(0.75)
    # sharp transient
    n = rng.standard_normal(len(t))
    trans = svf_bandpass(n, 3600, q=0.9) * np.exp(-t * 160)
    # metallic ping: inharmonic partials, like a hardened steel part seating
    partials = [(1870, 1.0, 11), (2953, 0.55, 15), (4410, 0.35, 19), (6230, 0.2, 26)]
    ping = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in partials)
    # low thump
    fth = 110 * np.exp(-t * 18) + 48
    thump = np.sin(2 * np.pi * np.cumsum(fth) / SR) * np.exp(-t * 14)
    mono = trans * 1.2 + ping * 0.42 + thump * 0.9
    return pan(mono, 0.0)


def sweep(seed=6):
    rng = np.random.default_rng(seed)
    dur = 0.72
    t = t_axis(dur)
    k = t / dur
    f = 2400 * 2 ** (-k * 2.4) + 180
    ph = 2 * np.pi * np.cumsum(f) / SR
    beam = np.sin(ph) * 0.5 + np.sin(ph * 1.5) * 0.18
    fizz = svf_bandpass(rng.standard_normal(len(t)), f * 2.2, q=4) * 0.6
    amp = np.sin(np.pi * k) ** 0.8 * (1 - 0.35 * k)
    return pan((beam + fizz) * amp, 0.5 - 1.0 * k)


def plunge(seed=7):
    rng = np.random.default_rng(seed)
    dur = 1.3
    t = t_axis(dur)
    k = t / dur
    n = rng.standard_normal(len(t))
    # spinning bur in open-cell foam: modulated brown-ish noise + whirr
    rot = 1 + 0.6 * np.sin(2 * np.pi * (38 + 10 * np.sin(2 * np.pi * 1.2 * t)) * t)
    scrub = one_pole_lp(n, 900 + 600 * np.sin(np.pi * k)) * rot
    whirr_f = 820 + 140 * np.sin(2 * np.pi * 3 * t)
    whirr = np.sin(2 * np.pi * np.cumsum(whirr_f) / SR) * 0.12
    amp = env_adsr(len(t), 0.03, 0.2, 0.0, 0.55, 0.75)
    entry = np.exp(-t * 30) * svf_bandpass(n, 1500, q=0.8) * 0.9
    return pan((scrub * 2.2 + whirr) * amp + entry, -0.1)


def hit(seed=8):
    rng = np.random.default_rng(seed)
    dur = 2.6
    t = t_axis(dur)
    f = 62 * np.exp(-t * 3) + 34
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.9)
    sub = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.2) * 0.4
    n = rng.standard_normal(len(t))
    crack = svf_bandpass(n, 1800, q=0.7) * np.exp(-t * 45) * 0.6
    tail = one_pole_lp(n, 380) * np.exp(-t * 2.2) * 0.9
    shimmer = np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 3.5) * 0.04
    mono = boom + sub + crack + tail + shimmer
    left = mono + 0.08 * np.roll(tail, 331)
    right = mono + 0.08 * np.roll(tail, 587)
    return np.stack([left, right], axis=1)


def shimmer(seed=9):
    rng = np.random.default_rng(seed)
    dur = 2.0
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    # a few glassy partials (diamond sparkle), each with its own pan and decay
    notes = [2637, 3136, 3951, 4699, 5274, 6272]
    for i, f in enumerate(notes):
        start = int(rng.uniform(0, 0.55) * SR)
        tt = t[: len(t) - start]
        s = np.sin(2 * np.pi * f * tt + rng.uniform(0, 6.28)) * np.exp(-tt * rng.uniform(2.6, 4.2))
        s *= 1 - np.exp(-tt * 300)
        out[start:] += pan(s * (0.6 / (1 + i * 0.25)), rng.uniform(-0.8, 0.8))
    air = svf_bandpass(rng.standard_normal(len(t)), 7000, q=1.5) * np.exp(-t * 2.5) * 0.08
    return out + air[:, None]


def bed(seed=10):
    rng = np.random.default_rng(seed)
    dur = 46.0
    t = t_axis(dur)
    # low drone: A1 + E2 + A2 with slow beating, plus filtered air
    tone = (
        np.sin(2 * np.pi * 55.0 * t) * 0.55
        + np.sin(2 * np.pi * 55.18 * t) * 0.35
        + np.sin(2 * np.pi * 82.41 * t) * 0.22
        + np.sin(2 * np.pi * 110.0 * t + 0.4 * np.sin(2 * np.pi * 0.07 * t)) * 0.14
    )
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * t / 11.0 - 1.2)
    n = rng.standard_normal(len(t))
    air = one_pole_lp(n, 260 + 140 * np.sin(2 * np.pi * t / 17.0)) * 1.4
    hi = svf_bandpass(n, 2400, q=3) * 0.025
    mono = tone * swell + air * 0.5 + hi
    left = mono + 0.05 * np.sin(2 * np.pi * 0.13 * t) * air
    right = mono - 0.05 * np.sin(2 * np.pi * 0.13 * t) * air
    st = np.stack([left, right], axis=1)
    fade = np.minimum(1, np.minimum(t / 3.0, (dur - t) / 3.0))
    return st * fade[:, None]


def main():
    os.makedirs(OUT, exist_ok=True)
    write('whoosh', whoosh())
    write('tick', tick(), peak=0.7)
    write('pop', pop(), peak=0.75)
    write('riser', riser())
    write('snap', snap(), peak=0.95)
    write('sweep', sweep(), peak=0.75)
    write('plunge', plunge(), peak=0.8)
    write('hit', hit(), peak=0.95)
    write('shimmer', shimmer(), peak=0.6)
    write('bed', bed(), peak=0.7)


if __name__ == '__main__':
    main()
