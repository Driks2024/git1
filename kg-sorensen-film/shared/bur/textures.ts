import * as THREE from 'three';
import { DIM } from './profiles';
import { rng } from '../util/rng';

/**
 * Procedural textures, painted once on 2D canvases. Nothing here loads a file
 * except the official KG logo that the host hands in (used for the laser mark
 * and the Limpa Pontas print).
 */

export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  return { c, ctx };
}

function tex(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: boolean; aniso?: number } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = opts.aniso ?? 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Height rows → tangent-space normal map that only varies along v. */
function grooveNormal(heights: Float32Array, strength: number) {
  const h = heights.length;
  const { c, ctx } = canvas(8, h);
  const img = ctx.createImageData(8, h);
  for (let y = 0; y < h; y++) {
    const a = heights[Math.max(0, y - 1)];
    const b = heights[Math.min(h - 1, y + 1)];
    // canvas y grows downwards = -v
    const dv = -(b - a) * 0.5 * strength;
    const nx = 0;
    const ny = -dv;
    const nz = 1;
    const l = Math.hypot(nx, ny, nz);
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      img.data[i] = 128;
      img.data[i + 1] = Math.round(((ny / l) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round(((nz / l) * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export type ShankTextures = {
  map: THREE.Texture; // turning rows (albedo), repeats around
  orm: THREE.Texture; // G = roughness, B = metalness
  normal: THREE.Texture;
  /** high-resolution laser-marking mask (alpha), mapped to MARK_RECT in shank UV */
  mark: THREE.Texture;
};

/** Where the marking lives in shank UV space: u0,u1 (around), y0,y1 (mm). */
export const MARK_RECT = { u0: 0.5 - 0.135, u1: 0.5 + 0.135, y0: DIM.markY0, y1: DIM.markY1 };

/**
 * Shank skin: turned stainless steel (row textures) + a laser-annealed
 * marking drawn at high resolution: the official KG mark (upright when the
 * bur stands head-up), "FG" and the lot code "HL031234" along the axis,
 * as on the poster. UV: u around the shank (front at u = 0.5), v = y / shankTop.
 */
export function shankTextures(logo: ImageSource, seed = 7): ShankTextures {
  const H = 4096;
  const r = rng(seed);
  const rows = new Float32Array(H);
  let drift = 0;
  for (let y = 0; y < H; y++) {
    drift = drift * 0.92 + (r() - 0.5) * 0.6;
    rows[y] = Math.sin(y * 0.9) * 0.25 + drift + (r() - 0.5) * 0.35;
  }
  const A = canvas(4, H);
  const R = canvas(4, H);
  for (let y = 0; y < H; y++) {
    const v = 236 + rows[y] * 7;
    A.ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
    A.ctx.fillRect(0, y, 4, 1);
    const g = Math.max(0, Math.min(255, 54 + rows[y] * 16 + (r() - 0.5) * 10));
    R.ctx.fillStyle = `rgb(0,${g | 0},255)`;
    R.ctx.fillRect(0, y, 4, 1);
  }

  // marking mask -----------------------------------------------------------
  const MW = 1024; // across the circumference
  const MH = 4096; // along the axis
  const { u0, u1, y0, y1 } = MARK_RECT;
  const circ = 2 * Math.PI * DIM.shankR;
  const pxPerMmU = MW / ((u1 - u0) * circ);
  const pxPerMmV = MH / (y1 - y0);
  const M = canvas(MW, MH);
  const m = M.ctx;
  const yPx = (y: number) => (1 - (y - y0) / (y1 - y0)) * MH;
  const cx = MW / 2;
  m.fillStyle = '#fff';
  // the canvas is anisotropic (px/mm differ per axis): draw in mm space
  const mm = (fn: () => void, x: number, y: number, rot = 0) => {
    m.save();
    m.translate(cx + x * pxPerMmU, yPx(y));
    m.scale(pxPerMmU, pxPerMmV);
    m.rotate(rot);
    fn();
    m.restore();
  };
  const textMm = (txt: string, sizeMm: number, weight: number, family: string, tracking = 0) => {
    m.font = `${weight} 100px ${family}`;
    (m as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * 100}px`;
    const k = sizeMm / 100;
    m.scale(k, k);
    m.textBaseline = 'middle';
    m.textAlign = 'left';
    m.fillText(txt, 0, 0);
  };
  // lot code along the axis, reading from the head toward the butt (as on the poster)
  mm(() => textMm('HL031234', 0.52, 600, '"JetBrains Mono", "DejaVu Sans Mono", monospace', 0.04), 0, 5.45, Math.PI / 2);
  // FG
  mm(() => textMm('FG', 0.5, 700, '"Inter", "DejaVu Sans", sans-serif'), 0, 6.85, Math.PI / 2);
  // official KG mark, upright with the head up
  const iw = (logo as HTMLImageElement).width;
  const ih = (logo as HTMLImageElement).height;
  const markW = 1.02; // mm across
  const markH = (markW * ih) / iw; // mm along the axis
  const markTop = 9.35;
  m.save();
  m.translate(cx - (markW / 2) * pxPerMmU, yPx(markTop));
  m.drawImage(logo, 0, 0, markW * pxPerMmU, markH * pxPerMmV);
  m.restore();

  const mark = tex(M.c, { aniso: 16 });
  mark.wrapS = mark.wrapT = THREE.ClampToEdgeWrapping;
  const map = tex(A.c, { srgb: true, repeat: true });
  const orm = tex(R.c, { repeat: true });
  const normal = tex(grooveNormal(rows, 2.2), { repeat: true });
  return { map, orm, normal, mark };
}

/** Concentric machining rings for the section faces of the sliced shank. */
export function sectionTexture(seed = 11) {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = rng(seed);
  const img = ctx.createImageData(S, S);
  const rings: number[] = [];
  for (let i = 0; i < S; i++) rings.push((r() - 0.5) * 0.5 + Math.sin(i * 1.7) * 0.2);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - S / 2 + 0.5;
      const dy = y - S / 2 + 0.5;
      const d = Math.hypot(dx, dy);
      const ring = rings[Math.min(S - 1, Math.floor(d * 1.8))];
      const i = (y * S + x) * 4;
      // G = roughness, B = metalness; R carries an albedo hint
      img.data[i] = 200 + ring * 40;
      img.data[i + 1] = 70 + ring * 50;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return tex(c);
}

/** Electroplated nickel: small nodules, tileable. Returns normal + ORM maps. */
export function matrixTextures(seed = 23) {
  const S = 512;
  const r = rng(seed);
  const h = new Float32Array(S * S);
  // splat nodules
  for (let k = 0; k < 2600; k++) {
    const x0 = r() * S;
    const y0 = r() * S;
    const rad = 2 + r() * 6;
    const amp = 0.4 + r() * 0.6;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const d = Math.hypot(dx, dy) / rad;
        if (d > 1) continue;
        const x = (Math.floor(x0 + dx) + S) % S;
        const y = (Math.floor(y0 + dy) + S) % S;
        h[y * S + x] += amp * Math.sqrt(1 - d * d);
      }
    }
  }
  const N = canvas(S, S);
  const O = canvas(S, S);
  const nimg = N.ctx.createImageData(S, S);
  const oimg = O.ctx.createImageData(S, S);
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.9;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.9;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      nimg.data[i] = (-dx / l) * 127 + 128;
      nimg.data[i + 1] = (dy / l) * 127 + 128;
      nimg.data[i + 2] = (1 / l) * 127 + 128;
      nimg.data[i + 3] = 255;
      const v = at(x, y);
      oimg.data[i] = 255;
      oimg.data[i + 1] = Math.max(60, Math.min(220, 150 - v * 40 + (r() - 0.5) * 30));
      oimg.data[i + 2] = 255;
      oimg.data[i + 3] = 255;
    }
  }
  N.ctx.putImageData(nimg, 0, 0);
  O.ctx.putImageData(oimg, 0, 0);
  return { normal: tex(N.c, { repeat: true }), orm: tex(O.c, { repeat: true }) };
}

/** Open-cell foam of the Limpa Pontas block: pores + fibres, tileable. */
export function foamTextures(seed = 31) {
  const S = 1024;
  const r = rng(seed);
  const h = new Float32Array(S * S).fill(1);
  for (let k = 0; k < 9000; k++) {
    const x0 = r() * S;
    const y0 = r() * S;
    const rad = 1.5 + Math.pow(r(), 2.2) * 9;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const d = Math.hypot(dx, dy) / rad;
        if (d > 1) continue;
        const x = (Math.floor(x0 + dx) + S) % S;
        const y = (Math.floor(y0 + dy) + S) % S;
        h[y * S + x] = Math.min(h[y * S + x], d * d);
      }
    }
  }
  const N = canvas(S, S);
  const nimg = N.ctx.createImageData(S, S);
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.2;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      nimg.data[i] = (-dx / l) * 127 + 128;
      nimg.data[i + 1] = (dy / l) * 127 + 128;
      nimg.data[i + 2] = (1 / l) * 127 + 128;
      nimg.data[i + 3] = 255;
    }
  }
  N.ctx.putImageData(nimg, 0, 0);
  // albedo: pores darker than the rims
  const A = canvas(S, S);
  const aimg = A.ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = 10 + h[i] * 16;
    aimg.data[i * 4] = v;
    aimg.data[i * 4 + 1] = v;
    aimg.data[i * 4 + 2] = v + 1;
    aimg.data[i * 4 + 3] = 255;
  }
  A.ctx.putImageData(aimg, 0, 0);
  return { normal: tex(N.c, { repeat: true }), map: tex(A.c, { repeat: true, srgb: true }) };
}

/** Silver print on the Limpa Pontas block, using the official KG mark. */
export function printTexture(logo: ImageSource) {
  const W = 2048;
  const H = 820;
  const { c, ctx } = canvas(W, H);
  ctx.clearRect(0, 0, W, H);
  const iw = (logo as HTMLImageElement).width;
  const ih = (logo as HTMLImageElement).height;
  const lh = H * 0.86;
  const lw = (lh * iw) / ih;
  ctx.drawImage(logo, 40, (H - lh) / 2, lw, lh);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${H * 0.25}px "Inter", "DejaVu Sans", sans-serif`;
  ctx.fillText('LIMPAPONTAS', lw + 120, H * 0.46);
  ctx.fillText('E BROCAS', lw + 120, H * 0.78);
  return tex(c, { srgb: true, aniso: 16 });
}
