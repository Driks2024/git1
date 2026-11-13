import { useEffect, useRef, useState } from 'react';
import { DrenchPanel } from '../components/DrenchPanel';
import { Reveal } from '../components/Reveal';
import { LineDraw } from '../components/ScrollBits';
import { IMG } from '../content/images';

const STEPS = [
  { title: 'O kit chega ao consultório', text: 'Expositor, 16 escovas e o brinde em uma única entrega.' },
  { title: 'O expositor fica no balcão', text: 'À vista na recepção, com as marcas Odontoprev e Dental Partner.' },
  { title: 'O paciente conhece a escova', text: 'Durante a espera ou o atendimento, sem abordagem de venda.' },
  { title: 'Aquisição, se o paciente quiser', text: 'A escova pode ser adquirida no próprio consultório.' },
];

/** Percurso em quatro etapas; o número gigante acompanha a etapa em leitura. */
export function Activation() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section id="ativacao" className="chapter" aria-labelledby="t-ativacao">
      <div className="curtain">
        <DrenchPanel
          tone="blue"
          word="BALCÃO"
          image={IMG.recepcao}
          imageMode="cover"
          imagePosition="30% 60%"
          imageAlt="Recepção de consultório com o expositor de escovas no balcão, a recepcionista e um paciente conversando"
          kicker="// 05 · Ativação no consultório"
          title="NO BALCÃO"
        />
        <div className="over sec-dark" data-header="dark">
          <div className="detail wrap">
            <div className="detail__giant">
              <div className="detail__sticky">
                <div className="step-counter" aria-hidden="true">
                  <span key={active} className="step-counter__num">
                    {String(active + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="detail__giant-label">etapa {active + 1} de 4</p>
              </div>
            </div>
            <div className="detail__body">
              <Reveal as="h2" className="t-h2" text="Um percurso simples, dentro da rotina do consultório" />
              <span id="t-ativacao" hidden>
                Ativação no consultório
              </span>
              <p className="t-body detail__text">
                O expositor transforma o balcão em ponto de contato com a escova, sem mudar o atendimento.
              </p>
              <ol className="steps">
                {STEPS.map((s, i) => (
                  <li
                    key={s.title}
                    data-i={i}
                    ref={(el) => void (refs.current[i] = el)}
                    className={`step ${active === i ? 'is-active' : ''}`}
                  >
                    <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="step__title">{s.title}</span>
                    <span className="step__text">{s.text}</span>
                    <LineDraw className="row__line" />
                  </li>
                ))}
              </ol>
              <p className="t-note">
                Percurso proposto. A proposta não atribui à equipe da recepção função de venda, metas, comissão ou
                obrigação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
