import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { DIM, arcLengths, latheArea, type P2 } from './profiles';
import { rng, type Rng } from '../util/rng';

/** Angle convention: u = 0.5 faces +Z (the camera side of the hero pose). */
const angleOf = (u: number) => u * Math.PI * 2 + Math.PI;

function profileNormals(p: P2[]) {
  const n = p.length;
  const same = (a: P2, b: P2) => Math.abs(a.r - b.r) < 1e-7 && Math.abs(a.y - b.y) < 1e-7;
  return p.map((pt, i) => {
    let a = p[Math.max(0, i - 1)];
    let b = p[Math.min(n - 1, i + 1)];
    // duplicated points mark hard edges: use one-sided differences
    if (i > 0 && same(p[i - 1], pt)) a = pt;
    if (i < n - 1 && same(p[i + 1], pt)) b = pt;
    const dr = b.r - a.r;
    const dy = b.y - a.y;
    const l = Math.hypot(dr, dy) || 1;
    return { nr: dy / l, ny: -dr / l };
  });
}

export type LatheOpts = {
  segments: number;
  u0?: number;
  u1?: number;
  v?: 'y' | 'arc';
  vScale?: number;
  vOffset?: number;
};

/** Lathe with analytic normals and controllable UVs. */
export function lathe(profile: P2[], o: LatheOpts) {
  const { segments, u0 = 0, u1 = 1, v = 'y', vScale = 1, vOffset = 0 } = o;
  const normals = profileNormals(profile);
  const arc = arcLengths(profile);
  const cols = segments + 1;
  const rowsN = profile.length;
  const pos = new Float32Array(cols * rowsN * 3);
  const nor = new Float32Array(cols * rowsN * 3);
  const uv = new Float32Array(cols * rowsN * 2);
  let k = 0;
  for (let j = 0; j < rowsN; j++) {
    const p = profile[j];
    const nn = normals[j];
    const vv = ((v === 'y' ? p.y : arc[j]) - vOffset) / vScale;
    for (let i = 0; i < cols; i++) {
      const u = u0 + ((u1 - u0) * i) / segments;
      const a = angleOf(u);
      const s = Math.sin(a);
      const c = Math.cos(a);
      pos[k * 3] = p.r * s;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.r * c;
      nor[k * 3] = nn.nr * s;
      nor[k * 3 + 1] = nn.ny;
      nor[k * 3 + 2] = nn.nr * c;
      uv[k * 2] = u;
      uv[k * 2 + 1] = vv;
      k++;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < rowsN - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Flat disc (cap) at height y; facing +Y or -Y. */
export function disc(radius: number, y: number, up: boolean, segments = 96) {
  const g = new THREE.CircleGeometry(radius, segments);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** Cut a profile to [y0, y1] (profile must be monotonic in y over the range). */
export function clipProfile(p: P2[], y0: number, y1: number): P2[] {
  const out: P2[] = [];
  const rAt = (y: number) => {
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1];
      const b = p[i];
      if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) {
        const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
        return a.r + (b.r - a.r) * t;
      }
    }
    return p[p.length - 1].r;
  };
  out.push({ r: rAt(y0), y: y0 });
  for (const pt of p) if (pt.y > y0 + 1e-6 && pt.y < y1 - 1e-6 && pt.r > 0) out.push(pt);
  out.push({ r: rAt(y1), y: y1 });
  return out;
}

// --------------------------------------------------------------------------
// Matrix tiles (the diamond coating split into pieces for the exploded view)

export type Tile = {
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3;
  dir: THREE.Vector3;
  axis: THREE.Vector3;
  delay: number;
  row: number;
  col: number;
};

function wall(a: THREE.Vector3[], b: THREE.Vector3[]) {
  // quad strip between two polylines, flat shaded
  const pos: number[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    const p = [a[i], a[i + 1], b[i + 1], a[i], b[i + 1], b[i]];
    for (const v of p) pos.push(v.x, v.y, v.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

const ptAt = (p: P2, u: number) => {
  const a = angleOf(u);
  return new THREE.Vector3(p.r * Math.sin(a), p.y, p.r * Math.cos(a));
};

export function buildTiles(outer: P2[], inner: P2[], cols: number, r: Rng, uvScale: number): Tile[] {
  const arc = arcLengths(outer);
  const total = arc[arc.length - 1];
  const rowsN = Math.max(4, Math.min(18, Math.round(total / 0.46)));
  // split profile indices by arc length
  const cuts: number[] = [0];
  for (let k = 1; k < rowsN; k++) {
    const target = (total * k) / rowsN;
    let i = 1;
    while (i < arc.length - 1 && arc[i] < target) i++;
    if (i > cuts[cuts.length - 1]) cuts.push(i);
  }
  cuts.push(outer.length - 1);
  const midY = (outer[0].y + outer[outer.length - 1].y) / 2;
  const tiles: Tile[] = [];
  const segPerTile = 6;
  for (let row = 0; row < cuts.length - 1; row++) {
    const j0 = cuts[row];
    const j1 = cuts[row + 1];
    const o = outer.slice(j0, j1 + 1);
    const n = inner.slice(j0, j1 + 1);
    // tiles near the tip: fewer columns so they don't become slivers
    const rMax = Math.max(...o.map((q) => q.r));
    const colsHere = rMax < 0.2 ? Math.max(3, Math.round(cols / 3)) : rMax < 0.42 ? Math.round(cols / 1.5) : cols;
    const jitter = r.range(0, 1 / colsHere);
    for (let col = 0; col < colsHere; col++) {
      const u0 = jitter + col / colsHere;
      const u1 = jitter + (col + 1) / colsHere;
      const outerG = lathe(o, { segments: segPerTile, u0, u1, v: 'arc', vScale: uvScale, vOffset: -arc[j0] });
      const innerG = lathe(n, { segments: segPerTile, u0, u1, v: 'arc', vScale: uvScale });
      // flip inner surface
      const ni = innerG.getAttribute('normal') as THREE.BufferAttribute;
      for (let i = 0; i < ni.count; i++) ni.setXYZ(i, -ni.getX(i), -ni.getY(i), -ni.getZ(i));
      const idx = innerG.getIndex()!;
      for (let i = 0; i < idx.count; i += 3) {
        const t = idx.getX(i + 1);
        idx.setX(i + 1, idx.getX(i + 2));
        idx.setX(i + 2, t);
      }
      const side0o = o.map((q) => ptAt(q, u0));
      const side0i = n.map((q) => ptAt(q, u0));
      const side1o = o.map((q) => ptAt(q, u1));
      const side1i = n.map((q) => ptAt(q, u1));
      const ring = (prof: P2, k: number) => {
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= k; s++) pts.push(ptAt(prof, u0 + ((u1 - u0) * s) / k));
        return pts;
      };
      const walls = [
        wall(side0i, side0o),
        wall(side1o, side1i),
        wall(ring(o[0], segPerTile), ring(n[0], segPerTile)),
        wall(ring(n[n.length - 1], segPerTile), ring(o[o.length - 1], segPerTile)),
      ];
      const g = mergeGeometries([outerG.toNonIndexed(), innerG.toNonIndexed(), ...walls], false)!;
      const mid = o[Math.floor(o.length / 2)];
      const center = ptAt(mid, (u0 + u1) / 2);
      const dir = new THREE.Vector3(center.x, (center.y - midY) * 0.9, center.z);
      if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
      dir.normalize();
      const axis = new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize();
      tiles.push({ geometry: g, center, dir, axis, delay: r.range(0, 0.22), row, col });
      outerG.dispose();
      innerG.dispose();
    }
  }
  return tiles;
}

// --------------------------------------------------------------------------
// Diamond crystals

export function crystalShapes(seed = 101, count = 6): THREE.BufferGeometry[] {
  const r = rng(seed);
  const shapes: THREE.BufferGeometry[] = [];
  const truncOct: THREE.Vector3[] = [];
  const perm = (a: number, b: number, c: number) => [
    [a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a],
  ];
  for (const [x, y, z] of perm(0, 1, 2)) {
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) truncOct.push(new THREE.Vector3(x, y * sy, z * sz));
  }
  const cubOct: THREE.Vector3[] = [];
  for (const [x, y, z] of perm(1, 1, 0)) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) cubOct.push(new THREE.Vector3(x * sx, y * sy, z));
  }
  for (let k = 0; k < count; k++) {
    const base = k % 3 === 2 ? cubOct : truncOct;
    const sx = r.range(0.8, 1.25);
    const sy = r.range(0.75, 1.2);
    const sz = r.range(0.8, 1.2);
    const pts = base.map((v) =>
      new THREE.Vector3(
        v.x * sx + r.range(-0.12, 0.12),
        v.y * sy + r.range(-0.12, 0.12),
        v.z * sz + r.range(-0.12, 0.12),
      ),
    );
    const g = new ConvexGeometry(pts);
    g.computeBoundingSphere();
    const s = 0.5 / (g.boundingSphere!.radius || 1);
    g.scale(s * 1.15, s * 1.15, s * 1.15);
    g.deleteAttribute('uv');
    shapes.push(g);
  }
  return shapes;
}

export type Crystal = {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: number;
  shape: number;
  tile: number;
  extra: number;
  spin: THREE.Vector3;
};

/**
 * Even (Poisson-disk) distribution of crystals on the coated head.
 * Count is derived from the grain size and the coated area (≈ 50% coverage),
 * capped for the real-time budget.
 */
export function scatterCrystals(
  outer: P2[],
  grainMm: number,
  tiles: Tile[],
  seed: number,
  cap = 3200,
): { crystals: Crystal[]; estimate: number } {
  const r = rng(seed);
  const visual = Math.max(grainMm, 0.042);
  const area = latheArea(outer);
  const estimate = Math.round((0.72 * area) / (grainMm * grainMm));
  const target = Math.min(cap, Math.round((0.95 * area) / (visual * visual)));
  const normals = profileNormals(outer);
  // cumulative band areas
  const cum: number[] = [0];
  for (let i = 1; i < outer.length; i++) {
    const l = Math.hypot(outer[i].r - outer[i - 1].r, outer[i].y - outer[i - 1].y);
    cum.push(cum[i - 1] + 2 * Math.PI * ((outer[i].r + outer[i - 1].r) / 2) * l);
  }
  const totalA = cum[cum.length - 1];
  const minD = visual * 0.62;
  const cell = minD;
  const grid = new Map<string, THREE.Vector3[]>();
  const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const crystals: Crystal[] = [];
  const y0 = outer[0].y;
  // tile lookup by nearest centre
  const nearestTile = (p: THREE.Vector3) => {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < tiles.length; i++) {
      const d = tiles[i].center.distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  };
  let attempts = 0;
  while (crystals.length < target && attempts < target * 24) {
    attempts++;
    const a = r() * totalA;
    let i = 1;
    let lo = 1;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < a) lo = mid + 1;
      else hi = mid;
    }
    i = lo;
    const t = (a - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    const p0 = outer[i - 1];
    const p1 = outer[i];
    const pr = p0.r + (p1.r - p0.r) * t;
    const py = p0.y + (p1.y - p0.y) * t;
    // coating thins out right at the neck joint
    if (py - y0 < 0.12 && r() > (py - y0) / 0.12) continue;
    const u = r();
    const ang = angleOf(u);
    const pos = new THREE.Vector3(pr * Math.sin(ang), py, pr * Math.cos(ang));
    const n0 = normals[i - 1];
    const n1 = normals[i];
    const nr = n0.nr + (n1.nr - n0.nr) * t;
    const ny = n0.ny + (n1.ny - n0.ny) * t;
    const normal = new THREE.Vector3(nr * Math.sin(ang), ny, nr * Math.cos(ang)).normalize();
    // poisson rejection
    const gx = Math.floor(pos.x / cell);
    const gy = Math.floor(pos.y / cell);
    const gz = Math.floor(pos.z / cell);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dy = -1; dy <= 1 && ok; dy++)
        for (let dz = -1; dz <= 1 && ok; dz++) {
          const list = grid.get(`${gx + dx},${gy + dy},${gz + dz}`);
          if (!list) continue;
          for (const q of list) if (q.distanceToSquared(pos) < minD * minD) { ok = false; break; }
        }
    if (!ok) continue;
    const k = key(pos.x, pos.y, pos.z);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k)!.push(pos);
    const scale = visual * r.range(0.72, 1.28);
    const sink = scale * r.range(0.0, 0.16);
    const quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2),
    );
    crystals.push({
      pos: pos.clone().addScaledVector(normal, sink),
      normal,
      quat,
      scale,
      shape: r.int(0, 6),
      tile: tiles.length ? nearestTile(pos) : 0,
      extra: r.range(0.5, 2.8),
      spin: new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize(),
    });
  }
  return { crystals, estimate };
}

/** Shank sliced into discs (section view) — each slice side + its two caps. */
export function buildSlices(profile: P2[], count: number) {
  const L = DIM.shankTop;
  const slices: { geometry: THREE.BufferGeometry; y0: number; y1: number; index: number }[] = [];
  for (let i = 0; i < count; i++) {
    const y0 = (L * i) / count;
    const y1 = (L * (i + 1)) / count;
    const parts: THREE.BufferGeometry[] = [];
    let side: THREE.BufferGeometry;
    if (i === 0) {
      side = lathe(profile.filter((p) => p.y <= y1 + 1e-6).concat([{ r: DIM.shankR, y: y1 }]), {
        segments: 128,
        v: 'y',
        vScale: L,
      });
    } else {
      side = lathe(
        [
          { r: DIM.shankR, y: y0 },
          { r: DIM.shankR, y: y1 },
        ],
        { segments: 128, v: 'y', vScale: L },
      );
    }
    parts.push(side.toNonIndexed());
    const top = disc(DIM.shankR, y1, true).toNonIndexed();
    parts.push(top);
    if (i > 0) parts.push(disc(DIM.shankR, y0, false).toNonIndexed());
    const g = mergeGeometries(parts, true)!;
    // group 0 = skin, groups 1.. = section caps → collapse caps into material 1
    g.groups.forEach((gr, gi) => (gr.materialIndex = gi === 0 ? 0 : 1));
    slices.push({ geometry: g, y0, y1, index: i });
  }
  return slices;
}

export function ringProfile(): P2[] {
  const { ringY0, ringY1, ringR } = DIM;
  const rin = DIM.shankR - 0.012;
  const e = 0.018;
  return [
    { r: rin, y: ringY0 },
    { r: rin, y: ringY0 },
    { r: ringR - 0.002, y: ringY0 + e * 0.3 },
    { r: ringR, y: ringY0 + e },
    { r: ringR, y: ringY1 - e },
    { r: ringR - 0.002, y: ringY1 - e * 0.3 },
    { r: rin, y: ringY1 },
    { r: rin, y: ringY1 },
    { r: rin, y: ringY0 },
  ];
}
