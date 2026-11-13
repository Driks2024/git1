import { Fragment, useRef, type ElementType, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';

type Variant = 'letters' | 'blur' | 'words';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  variant?: Variant;
  delay?: number;
  /** Anima ao carregar, sem esperar a rolagem (usado na abertura). */
  immediate?: boolean;
  children?: ReactNode;
};

/**
 * Título com revelação palavra a palavra ou letra a letra. O texto fica no
 * aria-label do elemento e visível por padrão; a animação só define o estado
 * inicial quando o JavaScript roda e o movimento é permitido.
 */
export function Reveal({ text, as: Tag = 'h2', className, variant = 'blur', delay = 0, immediate = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(' ');

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !motionAllowed()) return;
      const targets =
        variant === 'letters' ? el.querySelectorAll('.rv-c') : el.querySelectorAll('.rv-i');
      const from =
        variant === 'letters'
          ? { yPercent: 115 }
          : variant === 'blur'
            ? { opacity: 0, filter: 'blur(10px)', y: '0.25em' }
            : { opacity: 0, y: '0.6em' };
      gsap.from(targets, {
        ...from,
        duration: variant === 'letters' ? 1.1 : 1.2,
        ease: 'expo.out',
        stagger: variant === 'letters' ? 0.022 : 0.06,
        delay,
        clearProps: 'filter',
        scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 88%', once: true },
      });
    },
    { scope: ref, dependencies: [text, variant] },
  );

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="rv-w" aria-hidden="true">
            {variant === 'letters' ? (
              [...w].map((c, j) => (
                <span className="rv-c" key={j}>
                  {c}
                </span>
              ))
            ) : (
              <span className="rv-i">{w}</span>
            )}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
