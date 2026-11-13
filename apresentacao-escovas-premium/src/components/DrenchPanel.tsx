import { useEffect, useRef } from 'react';
import { clamp, lerp, motionAllowed, smootherstep } from '../lib/motion';
import { Scramble } from './Scramble';

type Props = {
  tone: 'blue' | 'purple' | 'goiaba';
  /** Palavra gigante ao fundo, em camada própria com parallax. */
  word: string;
  image: string;
  imageAlt: string;
  /** lighten: imagem de fundo escuro sobreposta à cor; cover: cena inteira com degradê. */
  imageMode?: 'lighten' | 'cover';
  imagePosition?: string;
  kicker: string;
  title: string;
  caption?: string;
};

/**
 * Painel de cor chapada que fica fixo enquanto o conteúdo seguinte passa por
 * cima. A palavra de fundo e a imagem se movem em direções opostas conforme a
 * rolagem e o mouse, com inércia (cada camada percorre uma fração da distância
 * por quadro).
 */
export function DrenchPanel({
  tone,
  word,
  image,
  imageAlt,
  imageMode = 'lighten',
  imagePosition = 'center',
  kicker,
  title,
  caption,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el || !motionAllowed()) return;
    const host = el.parentElement ?? el;
    let raf = 0;
    let visible = false;
    let mx = 0.5;
    let my = 0.5;
    const cur = { wx: 0, wy: 0, ix: 0, iy: 0, s: 1.08 };

    const step = () => {
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quando o topo do capítulo entra por baixo, 1 quando o painel sai.
      const p = clamp((vh - r.top) / (vh + el.offsetHeight), 0, 1);
      const center = 1 - Math.abs(p - 0.5) * 2;
      const w = smootherstep(center);
      const e = smootherstep(p);
      const mfx = (mx * 2 - 1) * w;
      const mfy = (my * 2 - 1) * w;
      const tgt = {
        wx: -e * 160 - mfx * 26,
        wy: -mfy * 16,
        ix: e * 120 - mfx * 40,
        iy: -mfy * 24 + (1 - e) * 30,
        s: 1.08 - e * 0.08,
      };
      cur.wx = lerp(cur.wx, tgt.wx, 0.06);
      cur.wy = lerp(cur.wy, tgt.wy, 0.06);
      cur.ix = lerp(cur.ix, tgt.ix, 0.08);
      cur.iy = lerp(cur.iy, tgt.iy, 0.08);
      cur.s = lerp(cur.s, tgt.s, 0.08);
      if (wordRef.current) wordRef.current.style.transform = `translate3d(${cur.wx}px, ${cur.wy}px, 0)`;
      if (imgRef.current)
        imgRef.current.style.transform = `translate3d(${cur.ix * (imageMode === 'cover' ? 0.25 : 1)}px, ${cur.iy}px, 0) scale(${cur.s})`;
      if (visible) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(step);
    });
    io.observe(el);
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [imageMode]);

  return (
    <div ref={panel} className={`drench drench--${tone} drench--${imageMode}`} data-header="dark">
      <div className="drench__word" ref={wordRef} aria-hidden="true">
        {word}
      </div>
      <div className="drench__img" ref={imgRef}>
        <img src={image} alt={imageAlt} style={{ objectPosition: imagePosition }} loading="lazy" decoding="async" />
      </div>
      <div className="drench__shade" aria-hidden="true" />
      <div className="drench__content wrap">
        <p className="drench__kicker">{kicker}</p>
        <Scramble as="h2" className="drench__title" text={title} />
        {caption ? <p className="drench__caption">{caption}</p> : null}
      </div>
    </div>
  );
}
