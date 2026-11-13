import Lenis from 'lenis';
import { ScrollTrigger, gsap, motionAllowed, prefersReducedMotion } from './motion';

let lenis: Lenis | null = null;
let tick: ((time: number) => void) | null = null;

/**
 * Rolagem suave com Lenis, dirigida pelo ticker do GSAP (um único loop de
 * animação para os dois). Não é iniciada com movimento reduzido nem no modo leve.
 */
export function startSmoothScroll(): void {
  if (lenis || !motionAllowed()) return;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

export function stopSmoothScroll(): void {
  if (tick) gsap.ticker.remove(tick);
  tick = null;
  lenis?.destroy();
  lenis = null;
}

/** Leva a um elemento ou posição, com ou sem animação conforme as preferências. */
export function scrollToTarget(target: HTMLElement | number, opts: { immediate?: boolean } = {}): void {
  const immediate = opts.immediate || prefersReducedMotion();
  if (lenis) {
    lenis.scrollTo(target, { duration: immediate ? 0 : 1.4, immediate, force: true });
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

export function scrollToId(id: string, opts: { immediate?: boolean } = {}): void {
  const el = document.getElementById(id);
  if (el) scrollToTarget(el, opts);
}
