import odontoprevVertical from '../assets/brand/odontoprev-vertical.jpg';
import odontoprevHorizontal from '../assets/brand/odontoprev-horizontal.jpg';
import dentalPartner from '../assets/brand/dental-partner.jpg';

type Props = { size?: 'sm' | 'md' | 'lg'; className?: string };

/**
 * As duas marcas lado a lado, cada uma na versão fornecida e sobre o próprio
 * fundo original (sem filtros, sem redesenho e sem logotipo combinado).
 * Alturas ajustadas para equilíbrio óptico entre proporções diferentes.
 */
export function BrandTiles({ size = 'md', className }: Props) {
  return (
    <div className={`brand-tiles brand-tiles--${size} ${className ?? ''}`}>
      <img className="brand-tile brand-tile--odp" src={odontoprevVertical} alt="Odontoprev" />
      <img className="brand-tile brand-tile--dp" src={dentalPartner} alt="Dental Partner" />
    </div>
  );
}

/** Odontoprev horizontal, para superfícies claras. */
export function OdontoprevHorizontal({ className }: { className?: string }) {
  return <img className={`brand-horizontal ${className ?? ''}`} src={odontoprevHorizontal} alt="Odontoprev" />;
}

export { dentalPartner as dentalPartnerLogo };
