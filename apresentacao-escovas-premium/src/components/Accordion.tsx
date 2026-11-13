import { useId, useState, type ReactNode } from 'react';

export type AccordionItem = { id: string; title: ReactNode; meta?: ReactNode; body: ReactNode };

type Props = { items: AccordionItem[]; variant?: 'circle' | 'minimal'; defaultOpen?: string };

/** Acordeão acessível; no estilo "circle" o contorno do ícone se desenha ao abrir. */
export function Accordion({ items, variant = 'circle', defaultOpen }: Props) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const uid = useId();
  return (
    <div className={`acc acc--${variant}`}>
      {items.map((it) => {
        const isOpen = open === it.id;
        const btnId = `${uid}-${it.id}-b`;
        const panelId = `${uid}-${it.id}-p`;
        return (
          <div className={`acc__item ${isOpen ? 'is-open' : ''}`} key={it.id}>
            <h3 className="acc__heading">
              <button
                id={btnId}
                type="button"
                className="acc__btn"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : it.id)}
              >
                <svg className="acc__icon" viewBox="0 0 40 40" aria-hidden="true">
                  <circle className="acc__ring" cx="20" cy="20" r="18" />
                  <circle className="acc__ring-draw" cx="20" cy="20" r="18" />
                  <path className="acc__plus acc__plus--v" d="M20 14v12" />
                  <path className="acc__plus acc__plus--h" d="M14 20h12" />
                </svg>
                <span className="acc__title">{it.title}</span>
                {it.meta ? <span className="acc__meta">{it.meta}</span> : null}
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className="acc__panel" inert={!isOpen}>
              <div className="acc__panel-inner">
                <div className="acc__body">{it.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
