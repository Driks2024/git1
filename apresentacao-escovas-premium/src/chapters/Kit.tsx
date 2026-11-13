import { lazy, useRef, useState } from 'react';
import { DrenchPanel } from '../components/DrenchPanel';
import { SceneHost } from '../scene/SceneHost';
import { useScrubTrack } from '../lib/useScrubTrack';
import { Accordion } from '../components/Accordion';
import { Reveal } from '../components/Reveal';
import { Scramble } from '../components/Scramble';
import { DitherCanvas } from '../components/DitherCanvas';
import { FitText } from '../components/FitText';
import { ParallaxImage, Rise } from '../components/ScrollBits';
import { OdontoprevHorizontal, dentalPartnerLogo } from '../components/BrandMarks';
import { IMG } from '../content/images';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';

const KitScene = lazy(() => import('../scene/KitScene'));

function KitAssembly() {
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { progress, pinned, goTo } = useScrubTrack(track, (p) => {
    const isOpen = p > 0.2 && p < 0.8;
    setOpen((prev) => (prev === isOpen ? prev : isOpen));
  });

  return (
    <div ref={track} className={`scrub scrub--kit ${pinned ? 'is-pinned' : ''}`} data-header="dark">
      <div className="scrub__stage">
        <SceneHost
          poster={IMG.kitEscuro}
          posterAlt="Expositor de acrílico com quatro escovas coloridas"
          camera={{ position: [0.4, 3.1, 11.6], fov: 30 }}
          label="Kit em 3D: expositor acrílico, 4 escovas expostas, 12 bonificadas e doce de goiaba"
        >
          <KitScene progress={progress} />
        </SceneHost>
        <aside className="scrub__panel" aria-live="polite">
          <p className="t-label">Composição do kit</p>
          <h3 className="scrub__title">{open ? 'Cada peça no seu lugar' : 'O conjunto montado'}</h3>
          <ul className="kit-facts">
            <li>
              <strong>1</strong> expositor acrílico de balcão
            </li>
            <li>
              <strong>4</strong> escovas expostas
            </li>
            <li>
              <strong>12</strong> escovas bonificadas
            </li>
            <li>
              <strong>1</strong> brinde: doce de goiaba de Minas Gerais
            </li>
          </ul>
          <p className="kit-price">
            <span className="kit-price__value">R$ 258,00</span>
            <span className="kit-price__label">por kit, com frete incluído conforme a proposta</span>
          </p>
          <div className="stage-btns" role="group" aria-label="Visualização do kit">
            <button type="button" aria-pressed={open} onClick={() => goTo(0.55)}>
              Ver componentes
            </button>
            <button type="button" aria-pressed={!open} onClick={() => goTo(0.98)}>
              Ver conjunto montado
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function KitComposition() {
  return (
    <div className="sec-light composition" data-header="light">
      <div className="wrap sec-head">
        <div className="sec-head__label">
          <p className="t-label">O que chega ao consultório</p>
          <Scramble as="p" className="t-tag" text="16 ESCOVAS · 1 EXPOSITOR · 1 BRINDE" />
        </div>
        <Reveal as="h3" className="t-h2" text="Um kit pensado para o balcão, com as duas marcas à vista" />
      </div>
      <div className="wrap composition__grid">
        <Rise className="composition__media">
          <img className="composition__photo" src={IMG.kitEstudio} alt="Expositor de acrílico em estúdio claro com quatro escovas: branca, azul, roxa e verde" loading="lazy" />
          <div className="composition__brands">
            <OdontoprevHorizontal />
            <img className="brand-tile brand-tile--dp" src={dentalPartnerLogo} alt="Dental Partner" />
          </div>
        </Rise>
        <div className="composition__list">
          <Accordion
            variant="minimal"
            defaultOpen="expositor"
            items={[
              {
                id: 'expositor',
                title: 'Expositor acrílico de balcão',
                meta: <span className="pill">1 unidade</span>,
                body: (
                  <p>
                    Display transparente para a recepção, com aplicação das marcas Odontoprev e Dental Partner. Medidas,
                    espessura e método de gravação ainda serão definidos.
                  </p>
                ),
              },
              {
                id: 'expostas',
                title: 'Escovas expostas',
                meta: <span className="pill">4 escovas</span>,
                body: <p>Ficam no expositor, à vista do paciente durante a espera e o atendimento.</p>,
              },
              {
                id: 'bonificadas',
                title: 'Escovas bonificadas',
                meta: <span className="pill">12 escovas</span>,
                body: <p>Acompanham o kit para reposição do expositor. Embalagem a definir.</p>,
              },
              {
                id: 'brinde',
                title: 'Brinde: doce de goiaba de Minas Gerais',
                meta: <span className="pill">Brinde</span>,
                body: <p>Um doce de goiaba tradicional de Minas Gerais acompanha cada kit. Quantidade e embalagem a definir.</p>,
              },
              {
                id: 'valor',
                title: 'Valor por kit',
                meta: <span className="pill pill--strong">R$ 258,00</span>,
                body: <p>Valor unitário do kit com frete incluído, conforme a proposta.</p>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function GiftStory() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!motionAllowed()) return;
      gsap.to('.gift__giant', {
        yPercent: 60,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: '45% top', scrub: true },
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="gift" data-header="dark">
      <DitherCanvas ink="#B0233A" pixel={3} className="gift__dither" density={0.95} />
      <div className="gift__shade" aria-hidden="true" />
      <div className="wrap gift__inner">
        <div className="gift__giant-wrap">
          <FitText text="DE MINAS GERAIS" className="gift__giant" ariaHidden max={210} />
        </div>
        <Rise className="gift__photo">
          <img src={IMG.brinde} alt="Doce de goiaba embrulhado em papel de seda, ao lado de uma goiaba cortada ao meio" loading="lazy" />
        </Rise>
        <div className="gift__story">
          <Reveal
            as="p"
            className="gift__lead"
            variant="blur"
            text="Todo kit chega com um doce de goiaba tradicional de Minas Gerais. Um gesto simples, de quem sabe receber."
          />
          <div className="t-body gift__text">
            <p>
              Em Minas, receber alguém quase sempre passa pela cozinha. O doce de goiaba embrulhado em papel faz parte
              dessa hospitalidade, e é ele que acompanha o expositor até o balcão de cada consultório.
            </p>
            <p>
              O brinde não muda o produto nem as condições comerciais. A intenção é outra: que a chegada do kit tenha
              cara de presente, não de caixa de amostras.
            </p>
          </div>
        </div>
        <Rise>
          <figure className="feature-card feature-card--wide">
            <ParallaxImage
              src={IMG.kitCaixa}
              alt="Mão abrindo uma caixa preta com o doce de goiaba, ao lado do expositor com quatro escovas"
            />
            <figcaption className="feature-card__cap">
              <span className="feature-card__title">O kit e o brinde, lado a lado</span>
              <span className="feature-card__tag">Representação conceitual</span>
            </figcaption>
          </figure>
        </Rise>
      </div>
    </div>
  );
}

export function Kit() {
  return (
    <section id="kit" className="chapter" aria-labelledby="t-kit">
      <div className="curtain">
        <DrenchPanel
          tone="blue"
          word="KIT EXPOSITOR"
          image={IMG.kitEscuro}
          imageAlt="Expositor de acrílico com quatro escovas coloridas sobre pedra escura"
          kicker="// 04 · O kit expositor"
          title="O KIT"
        />
        <div className="over sec-dark">
          <h2 id="t-kit" className="sr-only">
            O kit expositor
          </h2>
          <KitAssembly />
        </div>
      </div>
      <KitComposition />
      <GiftStory />
    </section>
  );
}
