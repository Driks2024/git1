import type { CSSProperties } from 'react';
import { Reveal } from '../components/Reveal';
import { Scramble } from '../components/Scramble';
import { HoverList, type HoverItem } from '../components/HoverList';
import { ParallaxImage, Rise } from '../components/ScrollBits';
import { IMG } from '../content/images';

const ITEMS: HoverItem[] = [
  {
    id: 'vidas',
    value: '9.000.000',
    label: 'vidas cobertas',
    detail: 'Total de beneficiários da rede informado na proposta',
    image: IMG.redeMultidao,
    imageAlt: '',
  },
  {
    id: 'dentistas',
    value: '25.000',
    label: 'dentistas credenciados',
    detail: 'Profissionais habilitados a receber o expositor',
    image: IMG.alc250,
    imageAlt: '',
  },
  {
    id: 'secretarias',
    value: '50.000',
    label: 'secretárias atuantes',
    detail: 'Equipes de recepção que recebem os pacientes',
    image: IMG.recepcao,
    imageAlt: '',
  },
];

export function Network() {
  return (
    <section id="rede" className="chapter sec-dark" data-header="dark" aria-labelledby="t-rede">
      <div className="wrap sec-head">
        <div className="sec-head__label">
          <p className="t-label">A rede considerada</p>
          <Scramble as="p" className="t-tag" text="BASE INFORMADA NA PROPOSTA" />
        </div>
        <Reveal as="h2" className="t-h2" text="Três públicos. Uma mesma rede." />
      </div>

      <div className="wrap">
        <Rise>
          <figure className="feature-card" style={{ '--pos': '60% 50%', '--pos-t': '66% 50%', '--pos-m': '69% 62%' } as CSSProperties}>
            <ParallaxImage
              src={IMG.redeConsultorio}
              alt="Ilustração de uma dentista apresentando escovas a uma família, ligada por fios de luz a outros consultórios e famílias"
            />
            <figcaption className="feature-card__cap">
              <span className="feature-card__title">Do kit no consultório à escala da rede</span>
              <span className="feature-card__tag">Representação conceitual</span>
            </figcaption>
          </figure>
        </Rise>
      </div>

      <div className="wrap rede-list">
        <HoverList items={ITEMS} />
        <p className="t-note">
          Públicos distintos, que não devem ser somados entre si. Números da base informada na proposta, sem auditoria
          atual; 25.000 dentistas não equivale necessariamente a 25.000 consultórios cadastrados.
        </p>
      </div>
    </section>
  );
}
