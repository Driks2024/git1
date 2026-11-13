import * as THREE from 'three';

/**
 * Escova conceitual de autoria própria (não é o modelo industrial).
 * Unidades: comprimento total 6, eixo +Y do cabo para a ponta da cabeça,
 * face das cerdas voltada para +Z.
 */
export const BRUSH = {
  length: 6,
  depth: 0.16,
  bevel: 0.05,
  headCenterY: 5.27,
  headHalfW: 0.25,
  headHalfL: 0.6,
  get faceZ() {
    return this.depth / 2 + this.bevel;
  },
};

// Borda direita do contorno visto de cima (x, y), do fim do cabo à ponta.
const RIGHT: [number, number][] = [
  [0.0, 0.0],
  [0.13, 0.03],
  [0.19, 0.25],
  [0.215, 1.2],
  [0.23, 2.4],
  [0.215, 3.25],
  [0.16, 3.85],
  [0.115, 4.2],
  [0.15, 4.45],
  [0.27, 4.66],
  [0.315, 4.95],
  [0.32, 5.45],
  [0.3, 5.78],
  [0.2, 5.95],
  [0.0, 6.0],
];

export function createBrushShape(): THREE.Shape {
  const right = RIGHT.map(([x, y]) => new THREE.Vector2(x, y));
  const left = RIGHT.slice(1, -1)
    .reverse()
    .map(([x, y]) => new THREE.Vector2(-x, y));
  const pts = [...right, ...left];
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.splineThru([...pts.slice(1), new THREE.Vector2(0, 0)]);
  return shape;
}

export function createBrushBodyGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(createBrushShape(), {
    depth: BRUSH.depth,
    bevelEnabled: true,
    bevelThickness: BRUSH.bevel,
    bevelSize: 0.045,
    bevelSegments: 5,
    curveSegments: 96,
    steps: 1,
  });
  geo.translate(0, 0, -BRUSH.depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distância normalizada à borda da área de cerdas (superelipse); <= 1 está dentro. */
function headMetric(x: number, y: number, inset = 0.035): number {
  const a = BRUSH.headHalfW - inset;
  const b = BRUSH.headHalfL - inset;
  const dy = y - BRUSH.headCenterY;
  return Math.pow(Math.abs(x / a), 4) + Math.pow(Math.abs(dy / b), 4);
}

function hexPack(spacing: number): { x: number; y: number; m: number }[] {
  const pts: { x: number; y: number; m: number }[] = [];
  const rowH = spacing * Math.sqrt(3) * 0.5;
  const y0 = BRUSH.headCenterY - BRUSH.headHalfL;
  const y1 = BRUSH.headCenterY + BRUSH.headHalfL;
  let row = 0;
  for (let y = y0; y <= y1; y += rowH, row++) {
    const off = row % 2 ? spacing / 2 : 0;
    for (let x = -BRUSH.headHalfW + off; x <= BRUSH.headHalfW; x += spacing) {
      const m = headMetric(x, y);
      if (m <= 1) pts.push({ x, y, m });
    }
  }
  return pts;
}

/**
 * Posições de exatamente `count` filamentos em empacotamento hexagonal dentro
 * do contorno da cabeça. O espaçamento é ajustado por busca binária até caber
 * pelo menos `count` pontos; os excedentes mais próximos da borda são removidos.
 * Nenhum slot fica sem inicializar.
 */
export function bristlePositions(count: number): Float32Array {
  let lo = 0.004;
  let hi = 0.05;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (hexPack(mid).length >= count) lo = mid;
    else hi = mid;
  }
  const pts = hexPack(lo)
    .sort((p, q) => p.m - q.m)
    .slice(0, count);
  if (pts.length !== count) throw new Error(`esperado ${count} filamentos, gerado ${pts.length}`);
  const out = new Float32Array(count * 2);
  pts.forEach((p, i) => {
    out[i * 2] = p.x;
    out[i * 2 + 1] = p.y;
  });
  return out;
}

/** Tufos para a versão leve usada no kit (40 tufos, como nas imagens de referência). */
export function tuftPositions(cols = 4, rows = 10): [number, number][] {
  const out: [number, number][] = [];
  const w = (BRUSH.headHalfW - 0.07) * 2;
  const l = (BRUSH.headHalfL - 0.07) * 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + (w * c) / (cols - 1) + (r % 2 ? 0.02 : -0.02);
      const y = BRUSH.headCenterY - l / 2 + (l * r) / (rows - 1);
      out.push([x, y]);
    }
  }
  return out;
}
