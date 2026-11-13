import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: 'light' | 'dark' | 'ghost';
  ariaLabel?: string;
};

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M16.004 9.414 7.397 18.02l-1.414-1.414L14.59 8H7.004V6h11v11h-2V9.414Z" />
    </svg>
  );
}

/** Botão em pílula com seta circular: a seta sai na diagonal e outra entra por baixo. */
export function ArrowButton({ children, onClick, href, tone = 'light', ariaLabel }: Props) {
  const inner = (
    <>
      <span className="abtn__text">{children}</span>
      <span className="abtn__circle" aria-hidden="true">
        <span className="abtn__arrow abtn__arrow--a">
          <Arrow />
        </span>
        <span className="abtn__arrow abtn__arrow--b">
          <Arrow />
        </span>
      </span>
    </>
  );
  const cls = `abtn abtn--${tone}`;
  if (href)
    return (
      <a className={cls} href={href} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
