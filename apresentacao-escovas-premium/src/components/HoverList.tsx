import { useEffect, useRef, useState } from 'react';
import { motionAllowed } from '../lib/motion';

export type HoverItem = {
  id: string;
  value: string;
  label: string;
  detail: string;
  image: string;
  imageAlt: string;
};

/**
 * Lista com linhas largas: ao passar o mouse, a linha se preenche de cor de
 * baixo para cima e uma imagem acompanha o cursor, abrindo de dentro para fora.
 * Em toque e teclado, o conteúdo fica completo sem depender do hover.
 */
export function HoverList({ items }: { items: HoverItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const follower = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  useEffect(() => {
    if (!motionAllowed()) return;
    let raf = 0;
    const loop = () => {
      const p = pos.current;
      p.cx += (p.x - p.cx) * 0.16;
      p.cy += (p.y - p.cy) * 0.16;
      if (follower.current) follower.current.style.transform = `translate3d(${p.cx}px, ${p.cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const move = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', move);
    };
  }, []);

  return (
    <div className="hlist" onMouseLeave={() => setActive(null)}>
      <ul className="hlist__rows">
        {items.map((it) => (
          <li key={it.id} className={`hlist__row ${active === it.id ? 'is-active' : ''}`} onMouseEnter={() => setActive(it.id)}>
            <span className="hlist__fill" aria-hidden="true" />
            <span className="hlist__value">{it.value}</span>
            <span className="hlist__label">{it.label}</span>
            <span className="hlist__detail">{it.detail}</span>
          </li>
        ))}
      </ul>
      <div ref={follower} className={`hlist__follower ${active ? 'is-on' : ''}`} aria-hidden="true">
        {items.map((it) => (
          <img key={it.id} src={it.image} alt="" className={active === it.id ? 'is-current' : ''} loading="lazy" />
        ))}
      </div>
    </div>
  );
}
