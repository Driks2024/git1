import { Easing, interpolate } from 'remotion';

/** Frame-driven animation helpers (always clamped, always deterministic). */

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-ish out: confident, premium
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 0, 0.2, 1),
};

/** 0 → 1 over [start, start + dur]. */
export const prog = (f: number, start: number, dur: number, easing = EASE.out) =>
  interpolate(f, [start, start + Math.max(1, dur)], [0, 1], { ...CLAMP, easing });

/** 1 → 0 over [end - dur, end]. */
export const progOut = (f: number, end: number, dur: number, easing = EASE.in) =>
  interpolate(f, [end - Math.max(1, dur), end], [1, 0], { ...CLAMP, easing });

/** Visibility window: in over `inDur` from `start`, out over `outDur` before `end`. */
export const life = (f: number, start: number, end: number, inDur = 14, outDur = 12) =>
  Math.min(prog(f, start, inDur), progOut(f, end, outDur));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const mapRange = (f: number, a: number, b: number, from: number, to: number, easing = EASE.inOut) =>
  interpolate(f, [a, b], [from, to], { ...CLAMP, easing });

/** pt-BR number formatting, deterministic (no Intl locale dependency). */
export function formatBR(value: number, decimals = 0) {
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}${grouped}${dec ? `,${dec}` : ''}`;
}
