import * as THREE from 'three';
import { withFx, type FxUniforms } from './fx';
import { MARK_RECT, matrixTextures, sectionTexture, shankTextures, type ImageSource, type ShankTextures } from './textures';
import { DIM } from './profiles';
import { rng } from '../util/rng';

export type BurMaterials = {
  shank: THREE.MeshPhysicalMaterial;
  steel: THREE.MeshPhysicalMaterial; // neck + core, no marking
  section: THREE.MeshPhysicalMaterial;
  matrix: THREE.MeshStandardMaterial;
  crystal: THREE.MeshPhysicalMaterial;
  ring: THREE.MeshPhysicalMaterial;
  textures: ShankTextures;
};

/** Small repeating "turned steel" rows for parts without the marking. */
function turnedRows(seed: number) {
  const H = 1024;
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const nc = document.createElement('canvas');
  nc.width = 4;
  nc.height = H;
  const nctx = nc.getContext('2d')!;
  let drift = 0;
  const rows: number[] = [];
  for (let y = 0; y < H; y++) {
    drift = drift * 0.9 + (r() - 0.5) * 0.6;
    rows.push(Math.sin(y * 1.3) * 0.25 + drift);
  }
  for (let y = 0; y < H; y++) {
    const g = Math.max(0, Math.min(255, 58 + rows[y] * 18));
    ctx.fillStyle = `rgb(255,${g | 0},255)`;
    ctx.fillRect(0, y, 4, 1);
    const d = (rows[(y + 1) % H] - rows[(y + H - 1) % H]) * 0.9;
    const ny = Math.round((d / Math.hypot(d, 1)) * 127 + 128);
    nctx.fillStyle = `rgb(128,${ny},${Math.round((1 / Math.hypot(d, 1)) * 127 + 128)})`;
    nctx.fillRect(0, y, 4, 1);
  }
  const mk = (cv: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { orm: mk(c), normal: mk(nc) };
}

/** Laser marking: high-res mask sampled inside its UV rectangle only. */
function withMark<M extends THREE.MeshPhysicalMaterial>(material: M, mark: THREE.Texture): M {
  const rect = new THREE.Vector4(MARK_RECT.u0, MARK_RECT.u1, MARK_RECT.y0 / DIM.shankTop, MARK_RECT.y1 / DIM.shankTop);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMark = { value: mark };
    shader.uniforms.uMarkRect = { value: rect };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uMark;\nuniform vec4 uMarkRect;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec2 mUv = vec2((vMapUv.x - uMarkRect.x) / (uMarkRect.y - uMarkRect.x), (vMapUv.y - uMarkRect.z) / (uMarkRect.w - uMarkRect.z));
        float mk = 0.0;
        if (mUv.x > 0.0 && mUv.x < 1.0 && mUv.y > 0.0 && mUv.y < 1.0) mk = texture2D(uMark, mUv).a;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.024, 0.023), mk);`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.72, mk);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.12, mk);');
  };
  material.customProgramCacheKey = () => 'mark';
  return material;
}

export function createBurMaterials(logo: ImageSource, fx: FxUniforms): BurMaterials {
  const textures = shankTextures(logo);

  const shank = withFx(
    withMark(new THREE.MeshPhysicalMaterial({
      color: 0xe4e7eb,
      map: textures.map,
      metalness: 1,
      metalnessMap: textures.orm,
      roughness: 1,
      roughnessMap: textures.orm,
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      anisotropy: 0.4,
      anisotropyRotation: Math.PI / 2,
      envMapIntensity: 1.0,
      specularIntensity: 1,
    }), textures.mark),
    fx,
  );

  const rows = turnedRows(5);
  rows.orm.repeat.set(1, 3);
  rows.normal.repeat.set(1, 3);
  const steel = withFx(
    new THREE.MeshPhysicalMaterial({
      color: 0xe1e4e8,
      metalness: 1,
      roughness: 1,
      roughnessMap: rows.orm,
      normalMap: rows.normal,
      normalScale: new THREE.Vector2(0.3, 0.3),
      anisotropy: 0.5,
      anisotropyRotation: Math.PI / 2,
      envMapIntensity: 1.0,
    }),
    fx,
  );

  const sec = sectionTexture();
  const section = withFx(
    new THREE.MeshPhysicalMaterial({
      color: 0xd6d9dd,
      metalness: 1,
      roughness: 1,
      roughnessMap: sec,
      envMapIntensity: 1.0,
    }),
    fx,
  );

  const mt = matrixTextures();
  mt.normal.repeat.set(14, 14);
  mt.orm.repeat.set(14, 14);
  const matrixMat = new THREE.MeshStandardMaterial({
      color: 0x9da1a7,
      metalness: 1,
      roughness: 0.62,
      roughnessMap: mt.orm,
      normalMap: mt.normal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      envMapIntensity: 0.9,
    });
  matrixMat.userData.rimScale = 0.1;
  const matrix = withFx(matrixMat, fx);

  const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x50545a,
      metalness: 0.0,
      roughness: 0.03,
      ior: 2.42,
      specularIntensity: 1,
      specularColor: new THREE.Color(1, 1, 1),
      envMapIntensity: 3.4,
      iridescence: 0.15,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [180, 520],
      flatShading: true,
    });
  crystalMat.userData.rimScale = 0.1;
  const crystal = withFx(crystalMat, fx);

  const ring = withFx(
    new THREE.MeshPhysicalMaterial({
      color: 0xb2e92c,
      metalness: 0,
      roughness: 0.34,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: 0xb2e92c,
      emissiveIntensity: 0.0,
      envMapIntensity: 0.8,
    }),
    fx,
  );

  return { shank, steel, section, matrix, crystal, ring, textures };
}

/** Per-variant-slot copies so each slot can carry its own clipping plane. */
export function cloneForSlot(m: BurMaterials, fx: FxUniforms, plane: THREE.Plane) {
  const core = withFx(m.steel.clone(), fx, 'fx-slot');
  core.roughnessMap = null;
  core.roughness = 0.55;
  core.envMapIntensity = 0.55;
  core.color.set(0xaeb2b7);
  core.clippingPlanes = [plane];
  const c = <T extends THREE.Material>(mat: T, key: string) => {
    const k = withFx(mat.clone() as T, fx, key);
    k.clippingPlanes = [plane];
    return k;
  };
  return {
    core,
    steel: c(m.steel, 'fx-slot'),
    matrix: c(m.matrix, 'fx-slot'),
    crystal: c(m.crystal, 'fx-slot'),
    ring: c(m.ring, 'fx-slot'),
  };
}
