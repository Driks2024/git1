import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, motionAllowed } from '../lib/motion';
import { FitText } from '../components/FitText';
import { Reveal } from '../components/Reveal';
import { ArrowButton } from '../components/ArrowButton';
import { BrandTiles } from '../components/BrandMarks';
import { IMG } from '../content/images';

type Props = { onStart: () => void; onSummary: () => void };

export function Opening({ onStart, onSummary }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!motionAllowed()) return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.opening__bg img', { scale: 1.14, filter: 'blur(14px)', duration: 1.6, clearProps: 'filter' })
        .from('.opening__line', { yPercent: 108, duration: 1.3 }, 0.25)
        .from('.opening__fade', { opacity: 0, y: 18, duration: 1.1, stagger: 0.08 }, 0.6);
      gsap.to('.opening__bg img', {
        yPercent: 12,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.opening__inner', {
        yPercent: 18,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    },
    { scope: ref },
  );

  return (
    <section id="abertura" ref={ref} className="chapter opening" data-header="dark" aria-labelledby="t-abertura">
      <div className="opening__bg">
        <img
          src={IMG.aberturaMao}
          alt="Mão segurando a escova conceitual de cabo azul e cerdas rosa, sob luz azul"
          fetchPriority="high"
        />
      </div>
      <div className="opening__shade" aria-hidden="true" />
      <div className="opening__inner wrap">
        <div className="opening__center">
          <Reveal as="p" className="opening__pre" text="Proposta estratégica para Dental Partner e Odontoprev" variant="letters" immediate delay={0.2} />
          <h1 id="t-abertura" className="opening__title">
            <span className="sr-only">Projeto Escovas Premium</span>
            <span className="opening__mask" aria-hidden="true">
              <span className="opening__line opening__line--single">
                <FitText text="ESCOVAS PREMIUM" max={260} />
              </span>
              <span className="opening__line opening__line--stack">
                <span className="opening__stack-row">
                  <FitText text="ESCOVAS" max={200} />
                </span>
                <span className="opening__stack-row">
                  <FitText text="PREMIUM" max={200} />
                </span>
              </span>
            </span>
          </h1>
          <p className="opening__context opening__fade">
            Produto, kit expositor, modelo comercial e implantação na rede considerada.
          </p>
          <div className="opening__actions opening__fade">
            <ArrowButton onClick={onStart}>Iniciar apresentação</ArrowButton>
            <button type="button" className="text-link" onClick={onSummary}>
              Ver resumo
            </button>
          </div>
        </div>
        <div className="opening__bar opening__fade">
          <p>Rede considerada: 25.000 dentistas</p>
          <BrandTiles size="lg" />
          <p>Implantação projetada em 5 meses</p>
        </div>
      </div>
      <p className="opening__draft">Proposta para discussão</p>
    </section>
  );
}
