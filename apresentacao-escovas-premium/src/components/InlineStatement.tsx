import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';

export type Segment = { text: string } | { img: string; alt: string };

/**
 * Frase grande com imagens embutidas entre as palavras. Conforme a rolagem,
 * as palavras acendem em sequência e as imagens se abrem no meio da linha.
 */
export function InlineStatement({ segments, label }: { segments: Segment[]; label: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !motionAllowed()) return;
      const parts = el.querySelectorAll<HTMLElement>('.st-w, .st-img');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.8 },
      });
      parts.forEach((p, i) => {
        if (p.classList.contains('st-img')) {
          tl.fromTo(p, { width: 0, opacity: 0 }, { width: '1.9em', opacity: 1, ease: 'power2.out', duration: 1.2 }, i * 0.35);
        } else {
          tl.fromTo(p, { opacity: 0.14 }, { opacity: 1, ease: 'none', duration: 0.6 }, i * 0.35);
        }
      });
    },
    { scope: ref },
  );

  return (
    <h2 ref={ref} className="statement" aria-label={label}>
      {segments.map((s, i) =>
        'text' in s ? (
          s.text.split(' ').map((w, j) => (
            <span className="st-w" aria-hidden="true" key={`${i}-${j}`}>
              {w}{' '}
            </span>
          ))
        ) : (
          <span className="st-img" key={i} aria-hidden="true">
            <img src={s.img} alt="" loading="lazy" />
          </span>
        ),
      )}
    </h2>
  );
}
