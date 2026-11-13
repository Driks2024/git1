import type { ReactNode } from 'react';
import { FitText } from './FitText';
import { Reveal } from './Reveal';
import { LineDraw } from './ScrollBits';

export type Row = { left: ReactNode; right: ReactNode; active?: boolean };

type Props = {
  giant: string;
  giantLabel: string;
  heading: string;
  body: ReactNode;
  rows: Row[];
  note?: ReactNode;
  headingId?: string;
};

/**
 * Bloco do modelo de referência: número gigante vazado e fixo à esquerda,
 * título em caixa alta, texto e lista de linhas que se desenham à direita.
 * Aqui o número gigante carrega o dado-chave do capítulo.
 */
export function DetailBlock({ giant, giantLabel, heading, body, rows, note, headingId }: Props) {
  return (
    <div className="detail wrap">
      <div className="detail__giant">
        <div className="detail__sticky">
          <FitText text={giant} className="detail__number" ariaHidden max={420} />
          <p className="detail__giant-label">{giantLabel}</p>
        </div>
      </div>
      <div className="detail__body">
        <Reveal as="h3" className="t-h2" text={heading} />
        {headingId ? <span id={headingId} hidden /> : null}
        <div className="t-body detail__text">{body}</div>
        <ul className="rows">
          {rows.map((r, i) => (
            <li className={`row ${r.active ? 'is-active' : ''}`} key={i}>
              <span className="row__left">{r.left}</span>
              <span className="row__right">{r.right}</span>
              <LineDraw className="row__line" />
            </li>
          ))}
        </ul>
        {note ? <p className="t-note">{note}</p> : null}
      </div>
    </div>
  );
}
