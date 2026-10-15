import * as THREE from 'three';
import type { FilmRenderer } from '../../../shared/stage/FilmRenderer';
import { FoamBlock } from '../../../shared/stage/foam';
import type { Vec3 } from '../../../shared/stage/state';
import { LOOK } from '../config';

/**
 * Mode A grade and props, applied to THIS film's renderer instance only.
 * The shared rig (shared/) is never edited: everything here sets values on
 * objects the rig already exposes, once, right after construction.
 */

/** Material grade of the vertical film (values in config.ts → LOOK). */
export function applyModeALook(film: FilmRenderer) {
  const bur = film.bur;
  // the head must read as diamond grit on silver: brighter crystals that throw
  // more of the studio, and a nickel matrix that shows silver between the grains
  const crystals = [bur.materials.crystal, bur.a.mats.crystal, bur.b.mats.crystal] as THREE.MeshPhysicalMaterial[];
  for (const m of crystals) {
    m.color.set(LOOK.crystal.color);
    m.envMapIntensity = LOOK.crystal.envMapIntensity;
    m.roughness = LOOK.crystal.roughness;
  }
  const matrices = [bur.materials.matrix, bur.a.mats.matrix, bur.b.mats.matrix] as THREE.MeshStandardMaterial[];
  for (const m of matrices) {
    m.color.set(LOOK.matrix.color);
    m.roughness = LOOK.matrix.roughness;
    m.envMapIntensity = LOOK.matrix.envMapIntensity;
  }
  // dissolve edge: a neutral, faint seam instead of lime outlines
  bur.fx.uEdgeColor.value.set(LOOK.dissolveEdge).multiplyScalar(LOOK.dissolveEdgeGain);
  // the diamond core catches neutral light only (no olive cast)
  const core = film.core.material.uniforms as Record<string, { value: unknown }>;
  if (core.uLime?.value instanceof THREE.Color) core.uLime.value.set(LOOK.coreRim);
  // snap flash = light, not a lime surface
  const grade = film.post.gradeUniforms as unknown as Record<string, { value: unknown }>;
  if (grade.uFlashColor?.value instanceof THREE.Color) grade.uFlashColor.value.set(LOOK.flashColor);
}

/** Pose of the second Limpa Pontas block (offer: "Leve 2."). */
export type FoamExtra = { on: number; pos: Vec3; rot: Vec3 };

/**
 * Extra props for the vertical film: a second Limpa Pontas block for the
 * "Leve 2. Pague 1." offer, and a print texture for both blocks (the full
 * "LIMPAPONTAS / E BROCAS" lockup, fitted with margin, mip-mapped).
 */
export class StageExtras {
  private film: FilmRenderer;
  readonly foam2: FoamBlock;
  private print: THREE.CanvasTexture;

  constructor(film: FilmRenderer, logo: HTMLImageElement) {
    this.film = film;
    this.foam2 = new FoamBlock(logo);
    this.foam2.group.name = 'limpa-pontas-2';
    film.scene.add(this.foam2.group);
    this.print = printTexture(logo);
    for (const block of [film.foam, this.foam2]) {
      const label = labelOf(block);
      if (!label) continue;
      const mat = label.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.map = this.print;
      // the open-cell normal map aliases into a scanline grid on the small print
      mat.normalScale.set(LOOK.printNormal, LOOK.printNormal);
      mat.needsUpdate = true;
    }
  }

  apply(state: { foam2: FoamExtra }) {
    const f = state.foam2;
    const g = this.foam2.group;
    g.visible = f.on > 0.001;
    g.position.set(...f.pos);
    g.rotation.set(...f.rot);
  }

  dispose() {
    this.film.scene.remove(this.foam2.group);
    this.foam2.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.print.dispose();
  }
}

function labelOf(block: FoamBlock): THREE.Mesh | null {
  for (const o of block.group.children) {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry instanceof THREE.PlaneGeometry) return m;
  }
  return null;
}

/** "KG mark | LIMPAPONTAS / E BROCAS", as printed on the real block. */
function printTexture(logo: HTMLImageElement) {
  const W = 2048;
  const H = 820;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  const lh = H * 0.86;
  const lw = (lh * logo.width) / logo.height;
  const ly = (H - lh) / 2;
  ctx.drawImage(logo, 48, ly, lw, lh);
  const x0 = 48 + lw + 96;
  const room = (W - x0 - 72) * 0.94;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let fs = H * 0.26;
  ctx.font = `600 ${fs}px "Inter", "DejaVu Sans", sans-serif`;
  fs *= Math.min(1, room / ctx.measureText('LIMPAPONTAS').width);
  ctx.font = `600 ${fs}px "Inter", "DejaVu Sans", sans-serif`;
  const top = ly + lh * 0.3;
  ctx.fillText('LIMPAPONTAS', x0, top + fs * 0.8);
  ctx.fillText('E BROCAS', x0, top + fs * 0.8 + fs * 1.14);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = LOOK.printAniso;
  t.needsUpdate = true;
  return t;
}
