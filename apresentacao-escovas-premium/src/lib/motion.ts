import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Modo leve: sem 3D, sem WebGL decorativo e sem rolagem suave. */
export function isLiteMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.lite === 'true';
}

export function motionAllowed(): boolean {
  return !prefersReducedMotion() && !isLiteMode();
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1000px)').matches;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smootherstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Curva de saída exponencial usada em toda a apresentação. */
export const EASE_OUT = 'expo.out';
export const EASE_IN_OUT = 'power3.inOut';
