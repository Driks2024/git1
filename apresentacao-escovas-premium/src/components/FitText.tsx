import { useLayoutEffect, useRef, type ElementType } from 'react';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Limite superior em px para não gritar em telas muito largas. */
  max?: number;
  ariaHidden?: boolean;
};

/**
 * Ajusta o tamanho da fonte para o texto ocupar exatamente a largura do
 * contêiner, em uma linha (como os números gigantes do modelo de referência).
 */
export function FitText({ text, as: Tag = 'span', className, max = 520, ariaHidden }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      el.style.fontSize = '100px';
      const natural = el.scrollWidth;
      const avail = parent.clientWidth;
      if (!natural || !avail) return;
      el.style.fontSize = `${Math.min(max, (100 * avail) / natural) - 0.5}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    document.fonts?.ready.then(fit).catch(() => undefined);
    return () => ro.disconnect();
  }, [text, max]);

  return (
    <Tag ref={ref} className={`fit-text ${className ?? ''}`} aria-hidden={ariaHidden || undefined}>
      {text}
    </Tag>
  );
}
