/**
 * Copy of the film (PT-BR) and when each piece lives on the scroll timeline.
 * Every claim here comes from KG Sorensen's own campaign pieces or is a
 * general technical fact (see DIRECTION.md §0).
 */
import type { AnchorName } from '../../shared/bur/Bur';

export type Caption = {
  id: string;
  in: number;
  out: number;
  fade?: number;
  place: 'center' | 'bottom-left' | 'left' | 'right' | 'bottom-center' | 'top-left' | 'bottom-right';
  kicker?: string; // mono, level 3
  title?: string; // level 1
  body?: string; // level 2
  note?: string; // mono, level 3
  style?: 'words' | 'mask' | 'fade' | 'rise';
};

export const CAPTIONS: Caption[] = [
  {
    id: 'presents',
    in: 0.0,
    out: 0.055,
    fade: 0.02,
    place: 'left',
    kicker: 'KG SORENSEN PRESENTS',
    note: 'CIÊNCIA & PRECISÃO',
    style: 'fade',
  },
  {
    id: 'reveal',
    in: 0.112,
    out: 0.178,
    fade: 0.012,
    place: 'bottom-left',
    kicker: 'PONTA DIAMANTADA FG',
    body: 'Precisão que entrega resultados.',
    style: 'words',
  },
  {
    id: 'macro',
    in: 0.19,
    out: 0.36,
    fade: 0.01,
    place: 'top-left',
    kicker: 'MACRO',
    body: 'Alta precisão em cada detalhe.',
    style: 'mask',
  },
  {
    id: 'exploded',
    in: 0.425,
    out: 0.535,
    fade: 0.012,
    place: 'top-left',
    kicker: 'VISTA EXPLODIDA',
    title: 'Centenas de cristais.\nUma ponta.',
    style: 'words',
  },
  {
    id: 'core',
    in: 0.632,
    out: 0.7,
    fade: 0.01,
    place: 'left',
    kicker: 'O NÚCLEO',
    title: 'A essência\ndo corte.',
    body: 'Cada cristal de diamante é uma aresta de corte.',
    style: 'words',
  },
  {
    id: 'snap',
    in: 0.756,
    out: 0.786,
    fade: 0.005,
    place: 'left',
    title: 'Uma ponta.',
    body: 'Confiança em cada procedimento.',
    style: 'rise',
  },
  {
    id: 'variations',
    in: 0.785,
    out: 0.868,
    fade: 0.008,
    place: 'top-left',
    kicker: 'VARIAÇÕES',
    body: 'Excelência para o seu dia a dia.',
    style: 'mask',
  },
  {
    id: 'care',
    in: 0.884,
    out: 0.918,
    fade: 0.006,
    place: 'top-left',
    kicker: 'CUIDADO',
    title: 'Durabilidade\nque você confia.',
    note: 'LIMPA PONTAS KG · AÇÃO DESINCRUSTANTE',
    style: 'words',
  },
];

export type Label = {
  id: string;
  anchor: AnchorName | { world: [number, number, number] };
  in: number;
  out: number;
  title: string;
  sub: string;
  index?: string;
  /** label offset from the anchor, in px (direction of the leader line) */
  dx: number;
  dy: number;
  /** hidden on narrow screens to avoid clutter */
  wideOnly?: boolean;
};

/** Macro labels are generated from MACRO_STOPS in main.ts using this copy. */
export const MACRO_COPY: Record<string, { title: string; sub: string; dx: number; dy: number }> = {
  crystals: { title: 'CRISTAIS DE DIAMANTE', sub: 'DUREZA 10 · ESCALA MOHS', dx: 170, dy: -120 },
  matrix: { title: 'MATRIZ METÁLICA', sub: 'FIXA CADA CRISTAL AO CORPO', dx: 190, dy: 110 },
  neck: { title: 'PESCOÇO CÔNICO', sub: 'TRANSIÇÃO TORNEADA', dx: -230, dy: -110 },
  ring: { title: 'ANEL DE IDENTIFICAÇÃO', sub: 'CÓDIGO DE GRANULAÇÃO', dx: 200, dy: -110 },
  logo: { title: 'MARCAÇÃO A LASER', sub: 'KG SORENSEN', dx: 210, dy: -150 },
  lot: { title: 'CÓDIGO A LASER', sub: 'HL031234 · GRAVADO NA HASTE', dx: -230, dy: 120 },
  steel: { title: 'AÇO INOXIDÁVEL', sub: 'ACABAMENTO TORNEADO', dx: 200, dy: 110 },
  butt: { title: 'HASTE FG · Ø 1,60 MM', sub: 'FRICTION GRIP · ALTA ROTAÇÃO', dx: -240, dy: -120 },
};

export const EXPLODED_LABELS: Label[] = [
  { id: 'x1', anchor: 'crystalFar', in: 0.452, out: 0.535, index: '01', title: 'CRISTAIS DE DIAMANTE', sub: 'ARESTAS DE CORTE', dx: 150, dy: -150 },
  { id: 'x2', anchor: 'tile', in: 0.458, out: 0.535, index: '02', title: 'MATRIZ METÁLICA', sub: 'CAMADA DE FIXAÇÃO', dx: 170, dy: 150 },
  { id: 'x3', wideOnly: true, anchor: 'core', in: 0.464, out: 0.535, index: '03', title: 'NÚCLEO USINADO', sub: 'AÇO INOXIDÁVEL', dx: -40, dy: -200 },
  { id: 'x4', wideOnly: true, anchor: 'neck', in: 0.47, out: 0.535, index: '04', title: 'PESCOÇO', sub: 'TRANSIÇÃO CÔNICA', dx: -30, dy: -170 },
  { id: 'x5', anchor: 'ring', in: 0.476, out: 0.535, index: '05', title: 'ANEL', sub: 'CÓDIGO DE GRANULAÇÃO', dx: 70, dy: 130 },
  { id: 'x6', wideOnly: true, anchor: 'logo', in: 0.482, out: 0.535, index: '06', title: 'HASTE FG EM SEÇÕES', sub: 'Ø 1,60 MM · MARCAÇÃO A LASER', dx: -40, dy: -150 },
];

export const CORE_SPECS = [
  { big: 'C', small: 'CARBONO' },
  { big: '10', small: 'DUREZA · ESCALA MOHS' },
  { big: '≈ 300.000', small: 'RPM · TURBINA DE ALTA ROTAÇÃO' },
];

export const FINAL = {
  slogan: 'More than a brand. A stamp of warranty.',
  claim: 'Qualidade que valoriza seu trabalho.',
  specs: 'FG · Ø 1,60 MM · AÇO INOXIDÁVEL · DIAMANTE · ≈ 19 MM',
  promo: 'PROMOÇÃO · CONDIÇÕES ESPECIAIS E BONIFICAÇÃO',
  cta: 'Fale com nosso time comercial',
  offer: {
    kicker: 'LIMPA PONTAS KG',
    title: 'Leve 2. Pague 1.',
    qty: '2 unidades por',
    price: 'R$ 11,60',
    priceNote: 'R$ 5,80 por unidade nesta oferta.',
    ask: 'Peça ao seu representante.',
    ref: 'Ref. 1810.7021',
  },
};
