/**
 * Mode A — editable configuration of the vertical film.
 * Everything a producer may want to tweak lives here: format, scene ranges,
 * copy, colours, type scale, sound levels and SFX cue points.
 *
 * Copy comes from the approved PT-BR copy deck (experience/src/cues.ts) and
 * the client's own pieces (assets/reference/*). DIRECTION.md §0 lists what may
 * be claimed — do not add specs, prices, phones or URLs here.
 */

export const VIDEO = {
  id: 'KGSorensenFG',
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 1350,
} as const;

/** Scene windows in absolute frames (from = first frame, to = last frame + 1). */
export const SCENES = {
  dark: { from: 0, to: 90 },
  reveal: { from: 90, to: 210 },
  macro: { from: 210, to: 420 },
  exploded: { from: 420, to: 600 },
  core: { from: 600, to: 720 },
  snap: { from: 720, to: 810 },
  variations: { from: 810, to: 960 },
  care: { from: 960, to: 1110 },
  final: { from: 1110, to: 1350 },
} as const;
export type SceneId = keyof typeof SCENES;
export const sceneLength = (id: SceneId) => SCENES[id].to - SCENES[id].from;
/** Absolute frame of a frame relative to a scene start. */
export const at = (id: SceneId, rel: number) => SCENES[id].from + rel;

/** Key moments shared by the 3D timeline, the overlay and the sound design. */
export const BEATS = {
  ringPing: at('dark', 58),
  reveal: at('reveal', 0),
  rimIgnite: at('reveal', 34),
  /** five macro passes, each `macroStep` frames long */
  macro0: at('macro', 0),
  macroStep: 42,
  explodeStart: at('exploded', 22),
  explodeEnd: at('exploded', 122),
  coreIn: at('core', 44),
  snap: at('snap', 52),
  /** laser sweeps between variants */
  sweep0: at('variations', 14),
  sweepStep: 34,
  sweepLen: 15,
  plunge: at('care', 30),
  offer: at('care', 74),
  promo: at('final', 0),
  signoff: at('final', 128),
} as const;

/** Social-safe text area (Reels / TikTok / Shorts UI). */
export const SAFE = { left: 72, right: 1008, top: 230, bottom: 1520 } as const;

export const COLORS = {
  ink0: '#050506',
  ink1: '#0B0B0C',
  ink2: '#151517',
  hair: 'rgba(236,238,240,0.16)',
  hairStrong: 'rgba(236,238,240,0.38)',
  steel: '#C9CCD1',
  kgGray: '#87888B',
  paper: '#F1F1EE',
  muted: 'rgba(241,241,238,0.62)',
  lime: '#D4F82E',
  limeSoft: '#E2FB5A',
} as const;

export const FONTS = {
  sans: "'Inter', 'DejaVu Sans', sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', monospace",
  files: [
    { family: 'Inter', file: 'fonts/inter-latin.woff2', weight: '100 900', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { family: 'Inter', file: 'fonts/inter-latin-ext.woff2', weight: '100 900', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { family: 'Inter', file: 'fonts/inter-symbols.woff2', weight: '100 900', range: 'U+B5, U+2192, U+2248, U+2713, U+2193, U+2191' },
    { family: 'JetBrains Mono', file: 'fonts/jetbrains-mono-latin.woff2', weight: '300 800', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { family: 'JetBrains Mono', file: 'fonts/jetbrains-mono-latin-ext.woff2', weight: '300 800', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { family: 'JetBrains Mono', file: 'fonts/jetbrains-mono-symbols.woff2', weight: '300 800', range: 'U+B5, U+2192, U+2248, U+2193, U+2191' },
  ],
} as const;

/** Type scale in px for a 1080-wide frame. */
export const TYPE = {
  mono: 25, // N3 technical labels
  monoSmall: 21,
  body: 42, // N2 support line
  title: 104, // N1 caption title (weight 200)
  promo: 132, // promo headline (weight 800)
  tracking: '0.16em',
} as const;

export const ASSETS = {
  logoMark: 'logos/logo-mark-white.png',
  lockupWhite: 'logos/logo-lockup-white.png',
  lockupGray: 'logos/logo-lockup-gray.png',
} as const;

/** WebGL quality of the 3D layer. */
export const RENDER = {
  dpr: 1,
  samples: 4,
  crystalCap: 3200,
  /** generous: SwiftShader compiles every program on the CPU */
  loadTimeoutMs: 600_000,
} as const;

// ---------------------------------------------------------------------------- copy (PT-BR)

export const COPY = {
  dark: { kicker: 'KG SORENSEN PRESENTS', note: 'CIÊNCIA & PRECISÃO' },
  reveal: {
    title3d: 'PRECISÃO',
    kicker: '01 — PONTA DIAMANTADA FG',
    body: 'Precisão que entrega resultados.',
  },
  macro: {
    kicker: '02 — MACRO',
    body: 'Alta precisão em cada detalhe.',
  },
  /** five macro passes (anchor = rig anchor the leader line points to) */
  macroStops: [
    { id: 'crystals', anchor: 'crystals', title: 'CRISTAIS DE DIAMANTE', sub: 'DUREZA 10 · ESCALA MOHS' },
    { id: 'matrix', anchor: 'matrix', title: 'MATRIZ METÁLICA', sub: 'FIXA CADA CRISTAL AO CORPO' },
    { id: 'ring', anchor: 'ring', title: 'ANEL DE IDENTIFICAÇÃO', sub: 'CÓDIGO DE GRANULAÇÃO' },
    { id: 'logo', anchor: 'logo', title: 'MARCAÇÃO A LASER', sub: 'KG SORENSEN · LOTE HL031234' },
    { id: 'butt', anchor: 'butt', title: 'HASTE FG · Ø 1,60 MM', sub: 'FRICTION GRIP · ALTA ROTAÇÃO' },
  ],
  exploded: {
    kicker: '03 — VISTA EXPLODIDA',
    title: ['Centenas de cristais.', 'Uma ponta.'],
    counterLabel: 'CRISTAIS NESTE MODELO',
    labels: [
      { anchor: 'crystalFar', index: '01', title: 'CRISTAIS DE DIAMANTE', sub: 'ARESTAS DE CORTE' },
      { anchor: 'tile', index: '02', title: 'MATRIZ METÁLICA', sub: 'CAMADA DE FIXAÇÃO' },
      { anchor: 'core', index: '03', title: 'NÚCLEO USINADO', sub: 'AÇO INOXIDÁVEL' },
      { anchor: 'neck', index: '04', title: 'PESCOÇO', sub: 'TRANSIÇÃO CÔNICA' },
      { anchor: 'ring', index: '05', title: 'ANEL', sub: 'CÓDIGO DE GRANULAÇÃO' },
      { anchor: 'steel', index: '06', title: 'HASTE FG EM SEÇÕES', sub: 'Ø 1,60 MM · MARCAÇÃO A LASER' },
    ],
  },
  core: {
    kicker: '04 — O NÚCLEO',
    title: ['A essência', 'do corte.'],
    body: 'Cada cristal de diamante é uma aresta de corte.',
    specs: [
      { big: 'C', small: 'CARBONO' },
      { big: '10', small: 'DUREZA · ESCALA MOHS', count: 10 },
      { big: '≈300.000', small: 'RPM · TURBINA DE ALTA ROTAÇÃO', count: 300000, prefix: '≈' },
    ],
  },
  snap: { title: 'Uma ponta.', body: 'Confiança em cada procedimento.' },
  variations: {
    kicker: '05 — VARIAÇÕES',
    body: 'Excelência para o seu dia a dia.',
    legend: 'CÓDIGO DE GRANULAÇÃO · ANEL',
  },
  care: {
    kicker: '06 — CUIDADO',
    title: ['Durabilidade', 'que você confia.'],
    note: 'LIMPA PONTAS KG · AÇÃO DESINCRUSTANTE',
    offer: {
      kicker: 'LIMPA PONTAS KG',
      line1: 'Leve 2.',
      line2: 'Pague 1.',
      pre: '2 unidades por',
      currency: 'R$',
      price: 11.6,
      unit: 'R$ 5,80 por unidade nesta oferta.',
      ref: 'Ref. 1810.7021',
      ask: 'Peça ao seu representante.',
    },
  },
  final: {
    promo: 'PROMOÇÃO',
    headline: ['Não deixe', 'para depois'],
    sub: ['Aproveite as', 'melhores condições'],
    product: 'PONTA DIAMANTADA FG',
    bonus: ['Condições especiais', 'e bonificação'],
    cta: 'Fale com nosso time comercial',
    slogan: 'More than a brand. A stamp of warranty.',
    specs: 'FG · Ø 1,60 MM · AÇO INOXIDÁVEL · DIAMANTE · ≈ 19 MM',
    claims: ['Alta precisão em cada detalhe', 'Durabilidade que você confia', 'Qualidade que valoriza seu trabalho'],
  },
} as const;

// ---------------------------------------------------------------------------- sound

/** Linear gains. master multiplies everything; sfx and bed are group gains. */
export const AUDIO = {
  master: 0.9,
  sfx: 0.8,
  bed: 0.32,
  bedFadeIn: 45,
  bedFadeOut: 60,
  enabled: true,
} as const;

export type SfxCue = { frame: number; file: string; gain: number; length: number };
const tick = (frame: number, gain = 0.55): SfxCue => ({ frame, file: 'sfx/tick.wav', gain, length: 8 });

/** SFX placement, synced to BEATS. `length` in frames (≥ the wav duration). */
export const SFX: SfxCue[] = [
  { frame: 6, file: 'sfx/shimmer.wav', gain: 0.35, length: 60 },
  { frame: BEATS.ringPing - 2, file: 'sfx/pop.wav', gain: 0.45, length: 12 },
  { frame: BEATS.reveal - 6, file: 'sfx/whoosh.wav', gain: 0.85, length: 45 },
  { frame: BEATS.rimIgnite - 2, file: 'sfx/shimmer.wav', gain: 0.4, length: 60 },
  ...[0, 1, 2, 3, 4].map((i) => tick(BEATS.macro0 + i * BEATS.macroStep + 16)),
  { frame: BEATS.explodeStart - 64, file: 'sfx/riser.wav', gain: 0.7, length: 66 },
  { frame: BEATS.explodeStart, file: 'sfx/whoosh.wav', gain: 0.5, length: 45 },
  ...[0, 1, 2, 3, 4, 5].map((i) => tick(BEATS.explodeEnd - 8 + i * 6, 0.42)),
  { frame: BEATS.coreIn - 20, file: 'sfx/shimmer.wav', gain: 0.55, length: 60 },
  ...[0, 1, 2].map((i) => tick(BEATS.coreIn + 26 + i * 9, 0.4)),
  { frame: BEATS.snap - 64, file: 'sfx/riser.wav', gain: 0.35, length: 64 },
  { frame: BEATS.snap - 1, file: 'sfx/snap.wav', gain: 1.0, length: 24 },
  ...[0, 1, 2, 3].map((i) => ({
    frame: BEATS.sweep0 + i * BEATS.sweepStep - 1,
    file: 'sfx/sweep.wav',
    gain: 0.55,
    length: 24,
  })),
  { frame: BEATS.plunge - 4, file: 'sfx/plunge.wav', gain: 0.8, length: 40 },
  { frame: BEATS.offer, file: 'sfx/pop.wav', gain: 0.5, length: 12 },
  { frame: BEATS.promo, file: 'sfx/hit.wav', gain: 0.9, length: 75 },
  { frame: BEATS.signoff, file: 'sfx/hit.wav', gain: 0.45, length: 75 },
];

/** Toggle helpers for review. */
export const DEBUG = {
  safeArea: false,
} as const;
