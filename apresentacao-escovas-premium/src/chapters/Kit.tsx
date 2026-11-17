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
import { kitStageOf } from '../scene/stages';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';

const KitScene = lazy(() => import('../scene/KitScene'));

const KIT_TITLES = ['O kit se monta', 'Cada peça no seu lugar', 'O conjunto montado'] as const;

function KitAssembly() {
  const track = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<0 | 1 | 2>(2);
  const { progress, pinned, goTo } = useScrubTrack(
    track,
    (p) => {
      const next = kitStageOf(p);
      setStage((prev) => (prev === next ? prev : next));
    },
    1,
  );
  const open = stage === 1;

  return (
    <div ref={track} className={`scrub scrub--kit ${pinned ? 'is-pinned' : ''}`} data-header="dark">
      <div className="scrub__stage">
        <SceneHost
          poster={IMG.kitEscuro}
          posterAlt="Expositor de acrílico com quatro escovas coloridas"
          camera={{ position: [0.2, 3.0, 14.2], fov: 30 }}
          label="Kit em 3D: expositor acrílico original com 4 escovas no blister, kit com 12 escovas e goiabada cascão em lata"
        >
          <KitScene progress={progress} />
        </SceneHost>
        <aside className="scrub__panel" aria-live="polite">
          <p className="t-label">Composição do kit</p>
          <h3 className="scrub__title">{KIT_TITLES[stage]}</h3>
          <ul className="kit-facts">
            <li>
              <strong>1</strong> expositor de acrílico para o balcão
            </li>
            <li>
              <strong>4</strong> escovas expostas, no blister
            </li>
            <li>
              <strong>12</strong> escovas bonificadas, em kit
            </li>
            <li>
              <strong>1</strong> brinde: goiabada cascão em lata, de Minas Gerais
            </li>
          </ul>
          <p className="kit-price">
            <span className="kit-price__value">R$ 258,00</span>
            <span className="kit-price__label">por kit, com frete incluído conforme a proposta</span>
          </p>
          <div className="stage-btns" role="group" aria-label="Visualização do kit">
            <button type="button" aria-pressed={open} onClick={() => goTo(0.6)}>
              Ver componentes
            </button>
            <button type="button" aria-pressed={!open} onClick={() => goTo(0.99)}>
              Ver conjunto montado
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

const VIEWS = [
  {
    id: 'frente',
    label: 'Frente',
    src: IMG.kitFrente,
    alt: 'Expositor de acrílico visto de frente, com quatro escovas (branca, azul, roxa e verde) presas em dois trilhos e as marcas Odontoprev e Dental Partner na faixa inferior',
  },
  {
    id: 'perfil',
    label: 'Perfil',
    src: IMG.kitPerfil,
    alt: 'Expositor de acrílico visto de lado: base apoiada no balcão e painel inclinado para trás, com a escova presa no blister',
  },
  {
    id: 'verso',
    label: 'Verso',
    src: IMG.kitVerso,
    alt: 'Verso do expositor: os quatro cartões brancos dos blisters, com o furo de gancheira, e as marcas vistas por trás do acrílico',
  },
  {
    id: 'verso-34',
    label: 'Verso 3/4',
    src: IMG.kitVerso34,
    alt: 'Expositor visto de trás, em ângulo, mostrando a base em L, os trilhos de presilhas e os cartões dos blisters',
  },
] as const;

/** Visualizador de ângulos do expositor original: miniaturas trocam a foto principal. */
function AngleViewer() {
  const [cur, setCur] = useState(0);
  const view = VIEWS[cur] ?? VIEWS[0];
  return (
    <div className="angles">
      <div className="angles__stage">
        {VIEWS.map((v, i) => (
          <img
            key={v.id}
            src={v.src}
            alt={i === cur ? v.alt : ''}
            aria-hidden={i === cur ? undefined : true}
            className={i === cur ? 'is-on' : ''}
            loading="lazy"
            decoding="async"
          />
        ))}
        <span className="angles__now" aria-live="polite">
          {view.label}
        </span>
      </div>
      <div className="angles__thumbs" role="group" aria-label="Ângulos do expositor">
        {VIEWS.map((v, i) => (
          <button key={v.id} type="button" aria-pressed={i === cur} onClick={() => setCur(i)}>
            <img src={v.src} alt="" loading="lazy" decoding="async" />
            <span>{v.label}</span>
          </button>
        ))}
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
          <AngleViewer />
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
                title: 'Expositor de acrílico original',
                meta: <span className="pill">1 unidade</span>,
                body: (
                  <p>
                    Acrílico transparente em L: a base apoia no balcão e o painel inclinado traz dois trilhos de
                    presilhas, que seguram as quatro escovas no blister. As marcas Odontoprev e Dental Partner ficam na
                    faixa frontal. Medidas e espessura a confirmar.
                  </p>
                ),
              },
              {
                id: 'expostas',
                title: 'Escovas expostas',
                meta: <span className="pill">4 escovas</span>,
                body: <p>Cada uma no próprio blister, presa ao painel, à vista do paciente durante a espera e o atendimento.</p>,
              },
              {
                id: 'bonificadas',
                title: 'Kit de escovas bonificadas',
                meta: <span className="pill">12 escovas</span>,
                body: <p>Um kit com 12 escovas acompanha o expositor, para reposição. Embalagem do kit a definir.</p>,
              },
              {
                id: 'brinde',
                title: 'Brinde: goiabada cascão em lata',
                meta: <span className="pill">Brinde</span>,
                body: <p>Uma lata de goiabada cascão de Minas Gerais acompanha cada kit. Quantidade por kit e fornecedor a confirmar.</p>,
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
          <img
            src={IMG.brinde}
            alt="Lata de goiabada cascão Zélia, de Ponte Nova (MG), com rótulo vermelho e tampa plástica transparente, ao lado de meia goiaba"
            loading="lazy"
          />
        </Rise>
        <div className="gift__story">
          <Reveal
            as="p"
            className="gift__lead"
            variant="blur"
            text="Todo kit chega com uma lata de goiabada cascão de Minas Gerais. Um gesto simples, de quem sabe receber."
          />
          <div className="t-body gift__text">
            <p>
              Em Minas, receber alguém quase sempre passa pela cozinha. A goiabada cascão, apurada no tacho e
              guardada na lata, é dessas receitas de família que atravessam gerações, e é ela que acompanha o
              expositor até o balcão de cada consultório.
            </p>
            <p>
              O brinde não muda o produto nem as condições comerciais. A intenção é outra: que a chegada do kit tenha
              cara de presente, não de caixa de amostras.
            </p>
          </div>
        </div>
        <Rise>
          <figure className="feature-card feature-card--wide feature-card--duo">
            <div className="duo">
              <ParallaxImage
                src={IMG.kitEscuro}
                alt="Expositor de acrílico com quatro escovas coloridas e as marcas Odontoprev e Dental Partner, sobre pedra escura"
              />
              <ParallaxImage
                src={IMG.brinde}
                alt="Lata de goiabada cascão de Minas Gerais ao lado de meia goiaba, sobre fundo escuro"
              />
            </div>
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
