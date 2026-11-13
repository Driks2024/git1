import { lazy, useRef, useState } from 'react';
import { DrenchPanel } from '../components/DrenchPanel';
import { DetailBlock } from '../components/DetailBlock';
import { SceneHost } from '../scene/SceneHost';
import { useScrubTrack } from '../lib/useScrubTrack';
import { IMG } from '../content/images';
import { productStageOf } from '../scene/stages';

const ProductScene = lazy(() => import('../scene/ProductScene'));

const STAGES = [
  {
    p: 0.27,
    short: 'Montagem',
    title: 'A escova toma forma',
    text: 'O cabo chega à posição, as cerdas crescem a partir da cabeça e a capa protetora encaixa.',
  },
  {
    p: 0.48,
    short: 'Capa protetora',
    title: 'Capa protetora de cerdas',
    text: 'A capa cobre as cerdas até o primeiro uso. É a única peça que se separa da escova.',
  },
  {
    p: 0.97,
    short: '5.460 cerdas',
    title: '5.460 cerdas ultramacias',
    text: 'Nesta cena, os 5.460 filamentos são desenhados um a um, na densidade descrita no briefing.',
  },
];

export function Product() {
  const track = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const { progress, pinned, goTo } = useScrubTrack(track, (p) => {
    const s = productStageOf(p);
    setStage((prev) => (prev === s ? prev : s));
  });
  const current = STAGES[stage]!;

  return (
    <section id="produto" className="chapter" aria-labelledby="t-produto">
      <div className="curtain">
        <DrenchPanel
          tone="purple"
          word="ULTRA GENTLE"
          image={IMG.produtoMacro}
          imageAlt="Cabeça da escova em macro, com tufos de cerdas rosa sobre cabo azul"
          imagePosition="70% 50%"
          kicker="// 03 · O produto em detalhe"
          title="O PRODUTO"
        />
        <div className="over sec-dark" data-header="dark">
          <h2 id="t-produto" className="sr-only">
            O produto em detalhe
          </h2>
          <DetailBlock
            giant="5.460"
            giantLabel="cerdas por escova"
            heading="Uma escova premium, do jeito que o paciente reconhece"
            body={
              <p>
                Ultra Gentle é a escova que cada consultório passa a expor no balcão: 5.460 cerdas ultramacias,
                tecnologia alemã e capa protetora de cerdas.
              </p>
            }
            rows={[
              { left: 'Escova Ultra Gentle', right: 'Linha' },
              { left: '5.460 cerdas', right: 'Densidade' },
              { left: 'Cerdas ultramacias', right: 'Toque' },
              { left: 'Tecnologia alemã', right: 'Origem da tecnologia' },
              { left: 'Capa protetora de cerdas', right: 'Proteção' },
            ]}
            note="Características descritas no briefing; especificação técnica a confirmar. Tecnologia alemã não significa fabricação na Alemanha."
          />
        </div>
      </div>

      <div ref={track} className={`scrub ${pinned ? 'is-pinned' : ''}`} data-header="dark">
        <div className="scrub__stage">
          <SceneHost
            poster={IMG.produtoMacro}
            posterAlt="Cabeça da escova em macro"
            camera={{ position: [0, 0, 10], fov: 30 }}
            label="Escova conceitual em 3D com 5.460 cerdas e capa protetora"
          >
            <ProductScene progress={progress} />
          </SceneHost>
          <aside className="scrub__panel" aria-live="polite">
            <p className="t-label">Inspeção do produto</p>
            <h3 className="scrub__title">{current.title}</h3>
            <p className="t-body">{current.text}</p>
            <div className="stage-btns" role="group" aria-label="Etapas da inspeção">
              {STAGES.map((s, i) => (
                <button key={s.short} type="button" aria-pressed={stage === i} onClick={() => goTo(s.p)}>
                  {s.short}
                </button>
              ))}
            </div>
            <p className="t-note">Representação conceitual, sem medidas ou cores comerciais confirmadas.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
