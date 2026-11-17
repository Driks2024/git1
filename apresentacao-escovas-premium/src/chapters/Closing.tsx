import type { CSSProperties } from 'react';
import { ArrowButton } from '../components/ArrowButton';
import { BrandTiles } from '../components/BrandMarks';
import { FitText } from '../components/FitText';
import { Reveal } from '../components/Reveal';
import { LineDraw, ParallaxImage, Rise } from '../components/ScrollBits';
import { formatBRL, formatInt } from '../domain/money';
import { KIT_PRICE_CENTS, brushesPerKit, totalKits } from '../domain/rollout';
import { IMG } from '../content/images';

type Props = { onEconomics: () => void; onRollout: () => void; onPremises: () => void };

const FIGURES = [
  { k: 'Por kit', v: `${brushesPerKit()} escovas` },
  { k: 'Valor do kit', v: formatBRL(KIT_PRICE_CENTS) },
  { k: 'Distribuição', v: `${formatInt(totalKits())} kits` },
  { k: 'Prazo projetado', v: '5 meses' },
];

export function Closing({ onEconomics, onRollout, onPremises }: Props) {
  return (
    <section id="encerramento" className="chapter closing" aria-labelledby="t-encerramento">
      <div className="sec-dark closing__kit" data-header="dark">
        <div className="wrap">
          <Rise>
            <figure className="feature-card feature-card--tall" style={{ '--pos': '40% 50%', '--pos-t': '30% 50%', '--pos-m': '20% 50%' } as CSSProperties}>
              <ParallaxImage
                src={IMG.recepcao}
                alt="Expositor de acrílico com quatro escovas no balcão da recepção, com a recepcionista atendendo um paciente ao fundo"
              />
              <figcaption className="feature-card__cap">
                <span className="feature-card__title">O kit no balcão, pronto para a conversa</span>
                <span className="feature-card__tag">Representação conceitual</span>
              </figcaption>
            </figure>
          </Rise>
        </div>
      </div>

      <footer className="closing__footer" data-header="light">
        <div className="wrap">
          <LineDraw className="closing__rule" />
          <div className="closing__row">
            <h2 id="t-encerramento" className="closing__h">
              Resumo da proposta
            </h2>
            <div className="closing__summary">
              <Reveal
                as="p"
                className="closing__lead"
                variant="words"
                text="Um kit expositor com 16 escovas premium e uma goiabada cascão de Minas, com distribuição projetada de 25.000 kits em cinco meses."
              />
              <p className="closing__text">
                Escopo: produto Ultra Gentle, expositor de balcão com as marcas Odontoprev e Dental Partner, modelo
                comercial por escova e implantação projetada de {formatInt(totalKits())} kits. Premissas fornecidas no
                briefing, cálculos verificados e pontos pendentes listados em Condições para execução.
              </p>
            </div>
          </div>
          <LineDraw className="closing__rule" />
          <div className="closing__figures">
            {FIGURES.map((f) => (
              <div className="closing__fig" key={f.k}>
                <span className="closing__dot" aria-hidden="true" />
                <span className="closing__fk">{f.k}</span>
                <span className="closing__fv num">{f.v}</span>
              </div>
            ))}
          </div>
          <div className="closing__actions">
            <ArrowButton tone="dark" onClick={onEconomics}>
              Rever modelo econômico
            </ArrowButton>
            <ArrowButton tone="dark" onClick={onRollout}>
              Rever implantação
            </ArrowButton>
            <ArrowButton tone="ghost" onClick={onPremises}>
              Abrir premissas
            </ArrowButton>
          </div>
          <div className="closing__word">
            <FitText text="ESCOVAS PREMIUM" ariaHidden max={400} />
          </div>
          <div className="closing__bottom">
            <BrandTiles size="md" />
            <p>Proposta para discussão · Imagens e 3D em representação conceitual</p>
            <p>Projeto Escovas Premium</p>
          </div>
        </div>
      </footer>
    </section>
  );
}
