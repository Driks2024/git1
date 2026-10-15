/**
 * Geometry of a KG Sorensen FG diamond bur, in millimetres, axis +Y.
 * y = 0 is the butt of the shank (the end that goes into the turbine),
 * the working head points to +Y.
 */

export type ShapeId = 'esferica' | 'chama' | 'cilindrica' | 'troncoconica';
export type GritId = 'extrafina' | 'fina' | 'media' | 'grossa';
export type Variant = { shape: ShapeId; grit: GritId };

export type P2 = { r: number; y: number };

export const DIM = {
  shankR: 0.8, // Ø 1.60 mm — FG friction-grip shank
  shankTop: 12.9,
  chamfer: 0.18,
  butR: 0.62,
  ringY0: 11.5,
  ringY1: 12.2,
  ringR: 0.8065,
  coat: 0.07, // thickness of the metal matrix that holds the crystals
  markY0: 2.4,
  markY1: 9.6,
} as const;

export type ShapeSpec = {
  id: ShapeId;
  label: string;
  neckEnd: number;
  neckR: number;
  /** Outer (matrix) profile of the head, from the neck joint to the tip. */
  head: P2[];
};

export type GritSpec = {
  id: GritId;
  label: string;
  ring: string; // ring colour name (PT-BR)
  color: string; // ring paint
  microns: number; // approximate grain size
};

export const GRITS: Record<GritId, GritSpec> = {
  extrafina: { id: 'extrafina', label: 'EXTRAFINA', ring: 'AMARELO', color: '#E9C434', microns: 25 },
  fina: { id: 'fina', label: 'FINA', ring: 'VERMELHO', color: '#D9443A', microns: 46 },
  media: { id: 'media', label: 'MÉDIA', ring: 'AZUL', color: '#3D74D8', microns: 107 },
  grossa: { id: 'grossa', label: 'GROSSA', ring: 'VERDE', color: '#B2E92C', microns: 151 },
};
export const GRIT_ORDER: GritId[] = ['extrafina', 'fina', 'media', 'grossa'];

function sphereHead(R: number, neckR: number, steps = 56): P2[] {
  const th0 = Math.asin(neckR / R);
  const cy = R * Math.cos(th0);
  const pts: P2[] = [];
  for (let i = 0; i <= steps; i++) {
    const th = th0 + ((Math.PI - th0) * i) / steps;
    pts.push({ r: R * Math.sin(th), y: cy - R * Math.cos(th) });
  }
  pts[pts.length - 1].r = 0;
  return pts;
}

/** Centripetal-ish Catmull-Rom resample of a control polyline. */
function smoothProfile(ctrl: P2[], perSeg = 10): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ r: Math.max(0, cr(p0.r, p1.r, p2.r, p3.r)), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push({ ...ctrl[ctrl.length - 1] });
  return out;
}

function roundTip(base: P2[], tipR: number, tipY: number, steps = 14): P2[] {
  const pts = [...base];
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push({ r: tipR * Math.cos(a), y: tipY + tipR * Math.sin(a) });
  }
  pts[pts.length - 1].r = 0;
  return pts;
}

export const SHAPES: Record<ShapeId, ShapeSpec> = {
  esferica: {
    id: 'esferica',
    label: 'ESFÉRICA',
    neckEnd: 16.15,
    neckR: 0.36,
    head: sphereHead(1.08, 0.36),
  },
  chama: {
    id: 'chama',
    label: 'CHAMA',
    neckEnd: 14.7,
    neckR: 0.42,
    head: smoothProfile(
      [
        { r: 0.42, y: 0 },
        { r: 0.6, y: 0.28 },
        { r: 0.76, y: 0.85 },
        { r: 0.8, y: 1.5 },
        { r: 0.75, y: 2.4 },
        { r: 0.62, y: 3.4 },
        { r: 0.45, y: 4.4 },
        { r: 0.27, y: 5.25 },
        { r: 0.11, y: 5.85 },
        { r: 0.0, y: 6.1 },
      ],
      8,
    ),
  },
  cilindrica: {
    id: 'cilindrica',
    label: 'CILÍNDRICA',
    neckEnd: 14.9,
    neckR: 0.46,
    head: [
      ...smoothProfile(
        [
          { r: 0.46, y: 0 },
          { r: 0.6, y: 0.14 },
          { r: 0.64, y: 0.4 },
          { r: 0.64, y: 2.0 },
          { r: 0.64, y: 4.0 },
          { r: 0.64, y: 5.4 },
          { r: 0.63, y: 5.62 },
        ],
        8,
      ),
      { r: 0.6, y: 5.74 },
      { r: 0.54, y: 5.81 },
      { r: 0.42, y: 5.85 },
      { r: 0.2, y: 5.87 },
      { r: 0, y: 5.875 },
    ],
  },
  troncoconica: {
    id: 'troncoconica',
    label: 'TRONCO-CÔNICA',
    neckEnd: 14.6,
    neckR: 0.48,
    head: roundTip(
      smoothProfile(
        [
          { r: 0.48, y: 0 },
          { r: 0.66, y: 0.16 },
          { r: 0.74, y: 0.5 },
          { r: 0.66, y: 2.2 },
          { r: 0.56, y: 4.0 },
          { r: 0.46, y: 5.7 },
          { r: 0.42, y: 6.2 },
        ],
        8,
      ),
      0.42,
      6.2,
    ),
  },
};
export const SHAPE_ORDER: ShapeId[] = ['esferica', 'chama', 'cilindrica', 'troncoconica'];

/** Shank: from the chamfered butt to the start of the neck. */
export function shankProfile(): P2[] {
  const { shankR, chamfer, butR, shankTop } = DIM;
  // duplicated points = hard edges (see geometry.profileNormals)
  return [
    { r: 0, y: 0 },
    { r: butR, y: 0 },
    { r: butR, y: 0 },
    { r: butR + (shankR - butR) * 0.52, y: chamfer * 0.48 },
    { r: shankR, y: chamfer },
    { r: shankR, y: chamfer },
    { r: shankR, y: shankTop },
  ];
}

/** Neck: smooth taper from the shank down to the head joint. */
export function neckProfile(shape: ShapeSpec): P2[] {
  const y0 = DIM.shankTop;
  const y1 = shape.neckEnd;
  const r0 = DIM.shankR;
  const r1 = shape.neckR;
  const len = y1 - y0;
  const pts: P2[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // fast shoulder, long elegant waist, slight flare into the head
    const shoulder = 1 - Math.pow(1 - Math.min(1, t / 0.62), 2.2);
    const flare = Math.max(0, (t - 0.86) / 0.14);
    const waist = r0 + (r1 * 0.9 - r0) * shoulder;
    const r = waist + (r1 - r1 * 0.9) * flare * flare;
    pts.push({ r, y: y0 + len * t });
  }
  pts[pts.length - 1].r = r1;
  return pts;
}

/** Head profile in bur space (y offset by the neck end). */
export function headOuter(shape: ShapeSpec): P2[] {
  return shape.head.map((p) => ({ r: p.r, y: p.y + shape.neckEnd }));
}

/** Inner (steel core) profile: outer profile pushed in along its normal. */
export function headCore(shape: ShapeSpec, thickness = DIM.coat): P2[] {
  const outer = headOuter(shape);
  const n = outer.length;
  return outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(n - 1, i + 1)];
    const dr = b.r - a.r;
    const dy = b.y - a.y;
    const len = Math.hypot(dr, dy) || 1;
    // outward normal of a bottom→top profile is (dy, -dr)
    const nr = dy / len;
    const ny = -dr / len;
    return { r: Math.max(0, p.r - nr * thickness), y: p.y - ny * thickness };
  });
}

export function burLength(shape: ShapeSpec) {
  const h = shape.head;
  return shape.neckEnd + h[h.length - 1].y;
}

/** Cumulative arc length along a profile. */
export function arcLengths(pts: P2[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) {
    out.push(out[i - 1] + Math.hypot(pts[i].r - pts[i - 1].r, pts[i].y - pts[i - 1].y));
  }
  return out;
}

/** Surface area of a lathe profile (Pappus). */
export function latheArea(pts: P2[]): number {
  let a = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].r - pts[i - 1].r, pts[i].y - pts[i - 1].y);
    a += 2 * Math.PI * ((pts[i].r + pts[i - 1].r) / 2) * l;
  }
  return a;
}

/** Visual centre of the hero bur (used to pivot it). */
export const BUR_PIVOT_Y = 9.6;
