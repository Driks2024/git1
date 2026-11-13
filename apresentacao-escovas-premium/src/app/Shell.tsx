import { useEffect, useRef, useState } from 'react';
import { chapters } from '../content/chapters';
import { STATUS_LABEL, claims } from '../content/claims';
import { BrandTiles } from '../components/BrandMarks';
import { scrollToId } from '../lib/smoothScroll';

type HeaderProps = {
  current: number;
  presenting: boolean;
  onPresent: () => void;
  onMenu: () => void;
};

/** Cabeçalho fixo que troca de cor conforme a seção abaixo dele. */
export function Header({ current, presenting, onPresent, onMenu }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const probe = document.elementsFromPoint(window.innerWidth / 2, 40);
      const sec = probe.map((el) => el.closest<HTMLElement>('[data-header]')).find(Boolean);
      setTheme(sec?.dataset.header === 'light' ? 'light' : 'dark');
      const y = window.scrollY;
      setHidden(y > last && y > 400 && !presenting);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [presenting]);

  const ch = chapters[current];
  return (
    <header className={`site-header is-${theme} ${hidden ? 'is-hidden' : ''}`}>
      <div className="site-header__inner">
        <a href="#abertura" className="site-header__brand" onClick={(e) => (e.preventDefault(), scrollToId('abertura'))}>
          <BrandTiles size="sm" />
          <span className="sr-only">Voltar à abertura</span>
        </a>
        {ch ? (
          <p className="site-header__chapter" aria-live="polite">
            <span className="num">{ch.number}</span> / 10 · {ch.short}
          </p>
        ) : null}
        <div className="site-header__actions">
          <button type="button" className="pill-btn" onClick={onPresent}>
            <span className="pill-btn__text" data-text={presenting ? 'Sair da apresentação' : 'Iniciar apresentação'}>
              {presenting ? 'Sair da apresentação' : 'Iniciar apresentação'}
            </span>
          </button>
          <button type="button" className="menu-btn" onClick={onMenu} aria-label="Abrir índice de capítulos">
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

type IndexProps = {
  open: boolean;
  current: number;
  lite: boolean;
  onClose: () => void;
  onGo: (i: number) => void;
  onLite: (v: boolean) => void;
  onPremises: () => void;
};

/** Índice de capítulos em painel lateral (dialog nativo, fecha com Esc). */
export function ChapterIndex({ open, current, lite, onClose, onGo, onLite, onPremises }: IndexProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="index" onClose={onClose} aria-labelledby="index-title" onClick={(e) => e.target === ref.current && onClose()}>
      <div className="index__panel">
        <div className="index__top">
          <h2 id="index-title" className="t-label">
            Capítulos
          </h2>
          <button type="button" className="index__close" onClick={onClose} aria-label="Fechar índice">
            ×
          </button>
        </div>
        <ol className="index__list">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button type="button" className={i === current ? 'is-current' : ''} onClick={() => onGo(i)} aria-current={i === current ? 'step' : undefined}>
                <span className="num">{c.number}</span>
                {c.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="index__foot">
          <label className="switch">
            <input type="checkbox" checked={lite} onChange={(e) => onLite(e.target.checked)} />
            <span>Modo leve (sem 3D e sem efeitos de movimento)</span>
          </label>
          <button type="button" className="text-link" onClick={onPremises}>
            Abrir premissas e fontes
          </button>
          <p className="index__keys">Teclado: ← → ou PageUp/PageDown trocam de capítulo · Home/End vão ao início e ao fim.</p>
        </div>
      </div>
    </dialog>
  );
}

/** Lista de premissas com o status de cada número (fornecido, calculado, estimativa, a validar). */
export function PremisesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="premises" onClose={onClose} aria-labelledby="premises-title" onClick={(e) => e.target === ref.current && onClose()}>
      <div className="premises__panel">
        <div className="index__top">
          <h2 id="premises-title" className="premises__title">
            Premissas e fontes
          </h2>
          <button type="button" className="index__close" onClick={onClose} aria-label="Fechar premissas">
            ×
          </button>
        </div>
        <p className="t-note">
          Proposta para discussão. Nenhum número abaixo foi aprovado ou auditado; o status indica a origem de cada valor.
        </p>
        <table className="premises__table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Valor</th>
              <th scope="col">Status</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.label}</th>
                <td className="num">
                  {c.value ?? '—'}
                  {c.unit ? <small> {c.unit}</small> : null}
                </td>
                <td>
                  <span className={`status status--${c.status}`}>{STATUS_LABEL[c.status]}</span>
                </td>
                <td>
                  {c.formula ? <span className="premises__formula">{c.formula}. </span> : null}
                  {c.note ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </dialog>
  );
}

type ControlsProps = { current: number; onPrev: () => void; onNext: () => void; onExit: () => void };

/** Controles do modo apresentação. */
export function PresentControls({ current, onPrev, onNext, onExit }: ControlsProps) {
  const ch = chapters[current];
  return (
    <nav className="present" aria-label="Controles da apresentação">
      <button type="button" onClick={onPrev} disabled={current === 0} aria-label="Capítulo anterior">
        ←
      </button>
      <p>
        <span className="num">{ch?.number}</span> {ch?.title}
      </p>
      <button type="button" onClick={onNext} disabled={current === chapters.length - 1} aria-label="Próximo capítulo">
        →
      </button>
      <button type="button" className="present__exit" onClick={onExit}>
        Sair
      </button>
    </nav>
  );
}
