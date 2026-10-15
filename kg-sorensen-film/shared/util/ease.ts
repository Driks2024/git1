/** Scalar helpers and easing curves shared by both delivery modes. */

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : (v - a) / (b - a));

/** Map v from [a,b] into a clamped 0..1. */
export const range = (v: number, a: number, b: number) => clamp(invLerp(a, b, v));

/** 0 → 1 → 0 window with soft shoulders: in over [a, a+fade], out over [b-fade, b]. */
export function windowed(v: number, a: number, b: number, fadeIn: number, fadeOut = fadeIn) {
  if (v <= a || v >= b) return 0;
  const i = fadeIn > 0 ? clamp((v - a) / fadeIn) : 1;
  const o = fadeOut > 0 ? clamp((b - v) / fadeOut) : 1;
  return Math.min(smooth(i), smooth(o));
}

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export const easeInQuad = (t: number) => t * t;
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const easeInOutExpo = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

export type Ease = (t: number) => number;
export const linear: Ease = (t) => t;

/** Frame-rate independent exponential smoothing factor. */
export const dampFactor = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

/** Pulse that peaks at `at` with half-width `w` (gaussian-ish bump, 0..1). */
export const bump = (v: number, at: number, w: number) => {
  const x = (v - at) / w;
  return Math.exp(-x * x);
};
