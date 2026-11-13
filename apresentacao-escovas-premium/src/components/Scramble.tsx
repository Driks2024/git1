import { useCallback, useEffect, useRef, type ElementType } from 'react';
import { motionAllowed } from '../lib/motion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';

type Props = { text: string; as?: ElementType; className?: string; duration?: number };

/**
 * Texto que se embaralha e se resolve da esquerda para a direita ao passar o
 * mouse ou receber foco. Leitores de tela recebem sempre o texto original.
 */
export function Scramble({ text, as: Tag = 'span', className, duration = 1100 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const busy = useRef(false);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el || busy.current || !motionAllowed()) return;
    busy.current = true;
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const fixed = Math.floor(p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i] ?? '';
        out += i < fixed || ch === ' ' ? ch : (CHARS[Math.floor(Math.random() * CHARS.length)] ?? ch);
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else {
        el.textContent = text;
        window.setTimeout(() => (busy.current = false), 250);
      }
    };
    requestAnimationFrame(frame);
  }, [duration, text]);

  // Em telas de toque não existe hover: o efeito roda uma vez ao entrar na tela.
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [run]);

  return (
    <Tag ref={ref} className={className} aria-label={text} onMouseEnter={run} onFocus={run}>
      {text}
    </Tag>
  );
}
