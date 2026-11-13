import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger, gsap, isDesktop, motionAllowed } from '../lib/motion';
import { formatBRL, formatInt } from '../domain/money';
import {
  KIT_PRICE_CENTS,
  KITS_PER_MONTH,
  batchValueCents,
  brushesInInitialKits,
  cumulativeKits,
  totalKits,
  totalProjectedValueCents,
} from '../domain/rollout';
import { Reveal } from '../components/Reveal';

const MONTHS = cumulativeKits();
const DOTS = 250; // cada ponto representa 100 kits

/** Matriz de pontos: 250 pontos = 25.000 kits; o mês atual acende 50 novos. */
function KitMatrix({ month }: { month: number }) {
  const per = DOTS / MONTHS.length;
  return (
    <div className="matrix" aria-hidden="true">
      {Array.from({ length: DOTS }, (_, i) => {
        const m = Math.floor(i / per);
        const cls = m < month ? 'is-past' : m === month ? 'is-now' : '';
        return <span key={i} className={`matrix__dot ${cls}`} />;
      })}
    </div>
  );
}

export function Rollout() {
  const track = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [month, setMonth] = useState(-1);

  useEffect(() => {
    const evaluate = () => setHorizontal(isDesktop() && motionAllowed());
    evaluate();
    const mq = window.matchMedia('(min-width: 1000px)');
    mq.addEventListener('change', evaluate);
    return () => mq.removeEventListener('change', evaluate);
  }, []);

  useEffect(() => {
    const t = track.current;
    const s = strip.current;
    if (!t || !s || !horizontal) {
      if (s) gsap.set(s, { clearProps: 'transform' });
      return;
    }
    const st = ScrollTrigger.create({
      trigger: t,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const max = s.scrollWidth - window.innerWidth;
        gsap.set(s, { x: -max * self.progress });
        const idx = Math.min(MONTHS.length - 1, Math.floor((self.progress - 0.08) / (0.82 / MONTHS.length)));
        setMonth((prev) => (prev === idx ? prev : idx));
      },
    });
    return () => st.kill();
  }, [horizontal]);

  return (
    <section id="implantacao" className="chapter sec-dark rollout" data-header="dark" aria-labelledby="t-implantacao">
      <div ref={track} className={`htrack ${horizontal ? 'is-horizontal' : ''}`}>
        <div className="htrack__stage">
          <div className="rollout__progress" aria-hidden="true">
            {MONTHS.map((_, i) => (
              <span key={i} className={`rollout__tick ${i <= month ? 'is-on' : ''}`}>
                Mês {i + 1}
              </span>
            ))}
          </div>
          <div ref={strip} className="htrack__strip">
            <article className="hpanel hpanel--intro">
              <p className="t-label">Implantação</p>
              <Reveal as="h2" className="t-h2 hpanel__title" text="25.000 kits em 5 meses" />
              <span id="t-implantacao" hidden>
                Implantação em 5 meses
              </span>
              <p className="t-body">
                {formatInt(KITS_PER_MONTH)} kits por mês, em lotes iguais, até cobrir a meta projetada de distribuição
                para a rede considerada.
              </p>
              <p className="hpanel__hint" aria-hidden="true">
                Role para avançar →
              </p>
            </article>
            {MONTHS.map((acc, i) => (
              <article className={`hpanel hpanel--month ${month === i ? 'is-current' : ''}`} key={i}>
                <p className="hpanel__month">Mês {i + 1}</p>
                <p className="hpanel__big num">{formatInt(KITS_PER_MONTH)}</p>
                <p className="hpanel__unit">kits distribuídos no mês</p>
                <KitMatrix month={i} />
                <dl className="hpanel__facts">
                  <div>
                    <dt>Acumulado</dt>
                    <dd className="num">{formatInt(acc)} kits</dd>
                  </div>
                  <div>
                    <dt>Lote do mês</dt>
                    <dd className="num">{formatBRL(batchValueCents(KITS_PER_MONTH))}</dd>
                  </div>
                </dl>
              </article>
            ))}
            <article className="hpanel hpanel--total">
              <p className="t-label">Valor total projetado</p>
              <p className="hpanel__total num">{formatBRL(totalProjectedValueCents())}</p>
              <p className="t-body">
                {formatInt(totalKits())} kits × {formatBRL(KIT_PRICE_CENTS)} por kit. Nos kits iniciais, são{' '}
                {formatInt(brushesInInitialKits())} escovas a distribuir.
              </p>
              <p className="t-note">
                Distribuição projetada, não curva de receita. Expedição, recebimento, adesão e instalação são etapas
                diferentes; o cronograma de instalação ainda não foi definido. A proposta não indica quem financia o
                valor total nem a forma de pagamento.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
