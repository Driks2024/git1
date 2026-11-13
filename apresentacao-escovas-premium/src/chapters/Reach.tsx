import { useEffect, useRef, useState } from 'react';
import { DrenchPanel } from '../components/DrenchPanel';
import { DitherCanvas } from '../components/DitherCanvas';
import { DriftBand } from '../components/ScrollBits';
import { InlineStatement } from '../components/InlineStatement';
import { formatInt } from '../domain/money';
import { DENTISTS, DEPENDENTS_PER_PATIENT, PATIENTS_PER_DENTIST_MONTH, reach } from '../domain/reach';
import { IMG } from '../content/images';

const R = reach();

const STEPS = [
  {
    kicker: 'Contatos diretos potenciais',
    value: formatInt(R.direct),
    formula: `${formatInt(DENTISTS)} dentistas × ${PATIENTS_PER_DENTIST_MONTH} pacientes por mês`,
    text: 'Pacientes atendidos no mês, considerando a rede integralmente ativada.',
    img: IMG.alc250,
    alt: 'Ilustração de uma dentista conversando com um paciente na cadeira odontológica',
  },
  {
    kicker: 'Contatos indiretos potenciais',
    value: formatInt(R.indirect),
    formula: `${formatInt(R.direct)} × ${DEPENDENTS_PER_PATIENT} dependentes considerados`,
    text: 'Dentro de casa: a família de cada paciente entra na conta como contato indireto potencial.',
    img: IMG.alc750,
    alt: 'Ilustração de uma família, pai, mãe e duas crianças, olhando para cima',
  },
  {
    kicker: 'Exposições potenciais por mês',
    value: formatInt(R.total),
    formula: `${formatInt(R.direct)} + ${formatInt(R.indirect)}`,
    text: 'Potencial de exposição mensal em todo o Brasil, com a rede completa.',
    img: IMG.alc1mi,
    alt: 'Ilustração de uma multidão em azul com uma pessoa em destaque',
  },
];

const BANDS = [
  { n: formatInt(R.direct), t: 'contatos diretos potenciais por mês' },
  { n: formatInt(R.indirect), t: 'contatos indiretos potenciais dentro de casa' },
  { n: formatInt(R.total), t: 'exposições potenciais por mês' },
  { n: '5 meses', t: 'para levar o kit à rede considerada' },
];

export function Reach() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: '-40% 0px -40% 0px' },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section id="alcance" className="chapter" aria-labelledby="t-alcance">
      <div className="curtain">
        <DrenchPanel
          tone="blue"
          word="1.000.000"
          image={IMG.panorama}
          imageMode="cover"
          imageAlt="Ilustração panorâmica de dentistas, pacientes e famílias ligados por fios de luz"
          kicker="// 08 · Alcance potencial"
          title="ALCANCE POTENCIAL"
        />
        <div className="over sec-dark" data-header="dark">
          <h2 id="t-alcance" className="sr-only">
            Alcance potencial
          </h2>
          <div className="wrap formula">
            <div className="formula__visual">
              <div className="formula__sticky">
                {STEPS.map((s, i) => (
                  <img key={s.value} src={s.img} alt={s.alt} className={active === i ? 'is-on' : ''} loading="lazy" />
                ))}
                <span className="formula__chain" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span key={s.value} className={active >= i ? 'is-on' : ''}>
                      {s.value}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <ol className="formula__steps">
              {STEPS.map((s, i) => (
                <li key={s.value} data-i={i} ref={(el) => void (refs.current[i] = el)} className={active === i ? 'is-active' : ''}>
                  <p className="t-label">{s.kicker}</p>
                  <p className="formula__value num">{s.value}</p>
                  <p className="formula__eq num">{s.formula}</p>
                  <p className="t-body">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="bands" data-header="dark">
        {BANDS.map((b, i) => (
          <div className="band" key={b.t}>
            <DitherCanvas ink="#001A55" pixel={4} density={0.9} />
            <DriftBand direction={i % 2 ? 1 : -1} className="band__inner">
              <span className="band__n num">{b.n}</span>
              <span className="band__t">{b.t}</span>
            </DriftBand>
          </div>
        ))}
      </div>

      <div className="sec-dark reach-notes" data-header="dark">
        <div className="wrap">
          <p className="t-note reach-notes__text">
            Estimativa, não medição de pessoas únicas. Considera a rede integralmente ativada e pode haver sobreposição
            de pessoas e famílias. Três dependentes por paciente é premissa do briefing. Exposição não equivale a compra,
            aquisição de cliente ou benefício clínico, e o total não se aplica desde o primeiro mês da implantação.
          </p>
        </div>
        <div className="wrap statement-wrap">
          <InlineStatement
            label="Do balcão do consultório para a pia de casa, com um doce de goiaba de Minas no caminho."
            segments={[
              { text: 'Do balcão do consultório' },
              { img: IMG.kitEstudio, alt: '' },
              { text: 'para a pia de casa,' },
              { img: IMG.paiFilha, alt: '' },
              { text: 'com um doce de goiaba' },
              { img: IMG.brinde, alt: '' },
              { text: 'de Minas no caminho.' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
