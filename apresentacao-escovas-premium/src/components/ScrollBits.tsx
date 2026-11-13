import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';

/** Linha divisória que se desenha da esquerda para a direita ao entrar na tela. */
export function LineDraw({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || !motionAllowed()) return;
    gsap.from(ref.current, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
    });
  });
  return <div ref={ref} className={`line ${className ?? ''}`} aria-hidden="true" />;
}

/** Bloco que sobe levemente ao entrar (conteúdo visível por padrão). */
export function Rise({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || !motionAllowed()) return;
    gsap.from(ref.current, {
      y: 36,
      opacity: 0,
      duration: 1.1,
      delay,
      ease: 'expo.out',
      scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
    });
  });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Faixa que desliza na horizontal conforme a rolagem (direção alternada). */
export function DriftBand({ children, direction = 1, className }: { children: ReactNode; direction?: 1 | -1; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || !motionAllowed()) return;
    gsap.fromTo(
      ref.current,
      { xPercent: -4 * direction },
      {
        xPercent: 4 * direction,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      },
    );
  });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Imagem com leve parallax interno (a imagem se move dentro da moldura). */
export function ParallaxImage({ src, alt, className, strength = 12 }: { src: string; alt: string; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const img = ref.current?.querySelector('img');
    if (!ref.current || !img || !motionAllowed()) return;
    gsap.fromTo(
      img,
      { yPercent: -strength / 2, scale: 1.12 },
      {
        yPercent: strength / 2,
        scale: 1.04,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
  return (
    <div ref={ref} className={`pimg ${className ?? ''}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}
