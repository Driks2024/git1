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
 * Lista com linhas largas. Com mouse: a linha se preenche de cor de baixo
 * para cima e uma imagem acompanha o cursor. Em toque (celular e tablet): a
 * linha no centro da tela fica ativa e a imagem se abre dentro dela.
 */
export function HoverList({ items }: { items: HoverItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const follower = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  useEffect(() => {
    setTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  // Toque: ativa a linha que cruza o centro da tela.
  useEffect(() => {
    if (!touch) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.id ?? null);
        }),
      { rootMargin: '-42% 0px -42% 0px' },
    );
    rows.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, [touch]);

  // Mouse: imagem que segue o cursor com inércia.
  useEffect(() => {
    if (touch || !motionAllowed()) return;
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
  }, [touch]);

  return (
    <div className={`hlist ${touch ? 'is-touch' : ''}`} onMouseLeave={() => !touch && setActive(null)}>
      <ul className="hlist__rows">
        {items.map((it, i) => (
          <li
            key={it.id}
            data-id={it.id}
            ref={(el) => void (rows.current[i] = el)}
            className={`hlist__row ${active === it.id ? 'is-active' : ''}`}
            onMouseEnter={() => !touch && setActive(it.id)}
          >
            <span className="hlist__fill" aria-hidden="true" />
            <span className="hlist__value">{it.value}</span>
            <span className="hlist__label">{it.label}</span>
            <span className="hlist__detail">{it.detail}</span>
            {touch ? (
              <span className="hlist__thumb" aria-hidden="true">
                <span className="hlist__thumb-inner">
                  <img src={it.image} alt="" loading="lazy" />
                </span>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {!touch ? (
        <div ref={follower} className={`hlist__follower ${active ? 'is-on' : ''}`} aria-hidden="true">
          {items.map((it) => (
            <img key={it.id} src={it.image} alt="" className={active === it.id ? 'is-current' : ''} loading="lazy" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
