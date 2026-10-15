import * as THREE from 'three';
import {
  BUR_PIVOT_Y,
  DIM,
  GRITS,
  SHAPES,
  headCore,
  headOuter,
  neckProfile,
  shankProfile,
  type P2,
  type ShapeId,
  type Variant,
} from './profiles';
import {
  buildSlices,
  buildTiles,
  crystalShapes,
  lathe,
  ringProfile,
  scatterCrystals,
  type Crystal,
  type Tile,
} from './geometry';
import { createBurMaterials, cloneForSlot, type BurMaterials } from './materials';
import { createFxUniforms, type FxUniforms } from './fx';
import type { ImageSource } from './textures';
import { clamp, easeInOutCubic, easeOutCubic } from '../util/ease';
import { hash, rng } from '../util/rng';

type HeadAssets = {
  outer: P2[];
  neck: THREE.BufferGeometry;
  core: THREE.BufferGeometry;
  shell: THREE.BufferGeometry;
  tiles: Tile[];
  topY: number;
  midY: number;
};

type CrystalAssets = { crystals: Crystal[]; estimate: number; byShape: number[][] };

const SLICE_COUNT = 12;

class Slot {
  readonly group = new THREE.Group();
  readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e4);
  readonly localPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e4);
  readonly mats: ReturnType<typeof cloneForSlot>;
  variant: Variant | null = null;
  neck!: THREE.Mesh;
  core!: THREE.Mesh;
  shell!: THREE.Mesh;
  tiles = new THREE.Group();
  tileMeshes: THREE.Mesh[] = [];
  crystals: THREE.InstancedMesh[] = [];
  ring: THREE.Mesh;
  head = new THREE.Group();
  assets!: HeadAssets;
  cassets!: CrystalAssets;

  constructor(base: BurMaterials, fx: FxUniforms, ringGeo: THREE.BufferGeometry, name: string) {
    this.group.name = name;
    this.mats = cloneForSlot(base, fx, this.plane);
    this.ring = new THREE.Mesh(ringGeo, this.mats.ring);
    this.ring.name = 'ring';
    this.group.add(this.ring, this.head);
  }
}

/**
 * The hero: a KG Sorensen FG diamond bur, built entirely from code.
 * root (pose) → inner (pivot offset) → parts in bur space (mm, +Y).
 */
export class Bur {
  readonly root = new THREE.Group();
  readonly inner = new THREE.Group();
  readonly fx: FxUniforms;
  readonly materials: BurMaterials;
  readonly shank: THREE.Mesh;
  readonly slices: THREE.Mesh[] = [];
  readonly slicesGroup = new THREE.Group();
  readonly a: Slot;
  readonly scan = new THREE.Group();
  readonly b: Slot;
  private headCache = new Map<ShapeId, HeadAssets>();
  private crystalCache = new Map<string, CrystalAssets>();
  private crystalGeos = crystalShapes();
  private explode = -1;
  private dirty = true;
  private crystalCap: number;
  private tmpM = new THREE.Matrix4();
  private tmpQ = new THREE.Quaternion();
  private tmpV = new THREE.Vector3();
  private tmpS = new THREE.Vector3();

  constructor(opts: { logo: ImageSource; crystalCap?: number; fx?: FxUniforms }) {
    this.crystalCap = opts.crystalCap ?? 3200;
    this.fx = opts.fx ?? createFxUniforms();
    this.materials = createBurMaterials(opts.logo, this.fx);
    this.root.name = 'bur';
    this.inner.position.y = -BUR_PIVOT_Y;
    this.root.add(this.inner);

    const sp = shankProfile();
    this.shank = new THREE.Mesh(
      lathe(sp, { segments: 160, v: 'y', vScale: DIM.shankTop }),
      this.materials.shank,
    );
    this.shank.name = 'shank';
    this.inner.add(this.shank);

    for (const s of buildSlices(sp, SLICE_COUNT)) {
      const m = new THREE.Mesh(s.geometry, [this.materials.shank, this.materials.section]);
      m.name = `slice-${s.index}`;
      m.userData = { y0: s.y0, y1: s.y1, index: s.index };
      this.slices.push(m);
      this.slicesGroup.add(m);
    }
    this.slicesGroup.visible = false;
    this.inner.add(this.slicesGroup);

    const ringGeo = lathe(ringProfile(), { segments: 128, v: 'y', vScale: 1 });
    this.a = new Slot(this.materials, this.fx, ringGeo, 'slotA');
    this.b = new Slot(this.materials, this.fx, ringGeo, 'slotB');
    this.b.group.visible = false;
    this.inner.add(this.a.group, this.b.group);

    // laser scan line used by the variant sweep: a hairline ring + a soft halo disc
    const lime = new THREE.Color('#D4F82E');
    // thin open band: reads as a bright line even when seen edge-on
    const ringLine = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.035, 160, 1, true).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: lime.clone().multiplyScalar(2.6), side: THREE.DoubleSide }),
    );
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1, 2.6, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: lime } },
        vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `varying vec2 vP; uniform vec3 uColor;
          void main(){ float r = length(vP); float a = exp(-(r - 1.0) * 3.2) * 0.22; gl_FragColor = vec4(uColor * a, a); }`,
      }),
    );
    this.scan.add(ringLine, halo);
    this.scan.rotation.x = -Math.PI / 2;
    this.scan.visible = false;
    this.inner.add(this.scan);
    this.setVariant({ shape: 'esferica', grit: 'grossa' });
  }

  // ------------------------------------------------------------------ assets

  head(shape: ShapeId): HeadAssets {
    let h = this.headCache.get(shape);
    if (h) return h;
    const spec = SHAPES[shape];
    const outer = headOuter(spec);
    const inner = headCore(spec);
    const r = rng(hash(`tiles-${shape}`));
    const neck = lathe(neckProfile(spec), { segments: 128, v: 'arc', vScale: 1.4 });
    const core = lathe(inner, { segments: 128, v: 'arc', vScale: 1.4 });
    const shell = lathe(outer, { segments: 160, v: 'arc', vScale: 1.0 });
    const tiles = buildTiles(outer, inner, 12, r, 1.0);
    h = {
      outer,
      neck,
      core,
      shell,
      tiles,
      topY: outer[outer.length - 1].y,
      midY: (outer[0].y + outer[outer.length - 1].y) / 2,
    };
    this.headCache.set(shape, h);
    return h;
  }

  crystalsFor(v: Variant): CrystalAssets {
    const k = `${v.shape}/${v.grit}`;
    let c = this.crystalCache.get(k);
    if (c) return c;
    const h = this.head(v.shape);
    const { crystals, estimate } = scatterCrystals(
      h.outer,
      GRITS[v.grit].microns / 1000,
      h.tiles,
      hash(k),
      this.crystalCap,
    );
    const byShape: number[][] = this.crystalGeos.map(() => []);
    crystals.forEach((cr, i) => byShape[cr.shape].push(i));
    c = { crystals, estimate, byShape };
    this.crystalCache.set(k, c);
    return c;
  }

  /** Build everything a variant needs up front (avoids hitches mid-film). */
  prewarm(variants: Variant[]) {
    for (const v of variants) this.crystalsFor(v);
  }

  // ---------------------------------------------------------------- variants

  private fill(slot: Slot, v: Variant) {
    if (slot.variant && slot.variant.shape === v.shape && slot.variant.grit === v.grit) return;
    const prevShape = slot.variant?.shape;
    slot.variant = { ...v };
    const h = this.head(v.shape);
    slot.assets = h;
    if (prevShape !== v.shape || !slot.neck) {
      slot.head.clear();
      slot.neck = new THREE.Mesh(h.neck, slot.mats.steel);
      slot.neck.name = 'neck';
      slot.core = new THREE.Mesh(h.core, slot.mats.core);
      slot.core.name = 'core';
      slot.shell = new THREE.Mesh(h.shell, slot.mats.matrix);
      slot.shell.name = 'shell';
      slot.tiles = new THREE.Group();
      slot.tileMeshes = h.tiles.map((t, i) => {
        const m = new THREE.Mesh(t.geometry, slot.mats.matrix);
        m.name = `tile-${i}`;
        slot.tiles.add(m);
        return m;
      });
      slot.tiles.visible = false;
      slot.core.visible = false;
      slot.head.add(slot.neck, slot.core, slot.shell, slot.tiles);
    }
    for (const m of slot.crystals) {
      slot.head.remove(m);
      m.dispose();
    }
    const c = this.crystalsFor(v);
    slot.cassets = c;
    slot.crystals = this.crystalGeos.map((g, si) => {
      const im = new THREE.InstancedMesh(g, slot.mats.crystal, Math.max(1, c.byShape[si].length));
      im.count = c.byShape[si].length;
      im.name = `crystals-${si}`;
      im.frustumCulled = false;
      slot.head.add(im);
      return im;
    });
    (slot.mats.ring as THREE.MeshPhysicalMaterial).color.set(GRITS[v.grit].color);
    (slot.mats.ring as THREE.MeshPhysicalMaterial).emissive.set(GRITS[v.grit].color);
    this.dirty = true;
  }

  get variant(): Variant {
    return { ...this.a.variant! };
  }

  setVariant(v: Variant) {
    this.fill(this.a, v);
    this.b.group.visible = false;
    this.scan.visible = false;
    this.a.localPlane.set(new THREE.Vector3(0, 1, 0), 1e4);
  }

  /**
   * Laser-sweep transition: `to` appears above a scan line that travels from
   * the tip (s = 0) to the butt (s = 1). Returns the scan height in bur space.
   */
  setSweep(from: Variant, to: Variant, s: number) {
    this.fill(this.a, from);
    this.fill(this.b, to);
    const top = Math.max(this.a.assets.topY, this.b.assets.topY) + 0.25;
    const y = top - clamp(s) * (top + 0.4);
    const wasVisible = this.b.group.visible;
    this.b.group.visible = s > 0;
    // slot B needs its matrices the first frame it shows (fill() marks new meshes)
    if (!wasVisible && this.b.group.visible) this.dirty = true;
    // A keeps y < scan, B keeps y > scan (local), mapped to world each frame
    this.a.localPlane.set(new THREE.Vector3(0, -1, 0), y);
    this.b.localPlane.set(new THREE.Vector3(0, 1, 0), -y);
    this.scan.visible = s > 0.001 && s < 0.999;
    this.scan.position.y = y;
    this.scan.scale.setScalar(Math.max(this.radiusAt(this.a, y), this.radiusAt(this.b, y)) + 0.16);
    return y;
  }

  /** Outer radius of a slot's silhouette at bur-space height y. */
  private radiusAt(slot: Slot, y: number) {
    if (y <= DIM.shankTop) return DIM.shankR;
    const spec = SHAPES[slot.variant!.shape];
    const prof = y < spec.neckEnd ? neckProfile(spec) : slot.assets.outer;
    for (let i = 1; i < prof.length; i++) {
      if (prof[i].y >= y) {
        const a = prof[i - 1];
        const b = prof[i];
        const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
        return a.r + (b.r - a.r) * t;
      }
    }
    return 0.05;
  }

  setRingGlow(v: number) {
    this.a.mats.ring.emissiveIntensity = v;
    this.b.mats.ring.emissiveIntensity = v;
  }

  setRim(strength: number, power = 3.2) {
    this.fx.uRimStrength.value = strength;
    this.fx.uRimPow.value = power;
  }

  setDissolve(v: number) {
    this.fx.uDissolve.value = v;
  }

  // ----------------------------------------------------------------- explode

  setExplode(e: number) {
    e = clamp(e);
    if (e === this.explode && !this.dirty) return;
    this.explode = e;
    this.dirty = false;
    this.applyExplode(this.a, e, true);
    if (this.b.group.visible && this.b.variant) this.applyExplode(this.b, 0, false);
  }

  get explodeAmount() {
    return Math.max(0, this.explode);
  }

  /** Per-piece eased progress with a stagger delay. */
  private piece(e: number, delay: number) {
    return easeInOutCubic(clamp((e - delay) / (1 - 0.3)));
  }

  private applyExplode(slot: Slot, e: number, shared: boolean) {
    const exploded = e > 0.0005;
    if (shared) {
      this.shank.visible = !exploded;
      this.slicesGroup.visible = exploded;
    }
    slot.shell.visible = !exploded;
    slot.tiles.visible = exploded;
    slot.core.visible = exploded;

    // shank slices spread downward, alternating gentle turns
    const n = this.slices.length;
    if (shared) for (const m of this.slices) {
      const i = m.userData.index as number;
      const k = this.piece(e, ((n - 1 - i) / n) * 0.18);
      m.position.set(0, -(n - i) * 0.62 * k, 0);
      m.rotation.set(0, (i % 2 ? 1 : -1) * 0.5 * k, 0);
    }
    // ring floats free, tilts and opens up
    const kr = this.piece(e, 0.06);
    slot.ring.position.set(0, 0.55 * kr, 0);
    slot.ring.rotation.set(0.42 * kr, 0, -0.18 * kr);
    const rs = 1 + 0.55 * kr;
    slot.ring.scale.set(rs, 1 + 0.2 * kr, rs);
    // neck and head travel up the axis
    const kn = this.piece(e, 0.1);
    slot.neck.position.set(0, 1.3 * kn, 0);
    const kh = this.piece(e, 0.12);
    const headLift = 2.7 * kh;
    slot.core.position.set(0, headLift, 0);
    slot.core.rotation.set(0, 0.6 * kh, 0);
    const tiles = slot.assets.tiles;
    slot.tileMeshes.forEach((m, i) => {
      const t = tiles[i];
      const k = this.piece(e, 0.12 + t.delay);
      m.position.copy(t.dir).multiplyScalar(1.5 * k);
      m.position.y += headLift;
      m.quaternion.setFromAxisAngle(t.axis, 0.55 * k);
    });
    // crystals: ride with their tile, then drift further out
    const c = slot.cassets;
    slot.crystals.forEach((im, si) => {
      const ids = c.byShape[si];
      for (let j = 0; j < ids.length; j++) {
        const cr = c.crystals[ids[j]];
        const t = tiles[cr.tile];
        const k = t ? this.piece(e, 0.12 + t.delay) : 0;
        const kc = easeOutCubic(clamp((e - 0.2 - cr.extra * 0.04) / 0.8));
        this.crystalWorld(cr, t, k, kc, headLift, this.tmpV);
        this.tmpQ.setFromAxisAngle(cr.spin, 1.6 * kc).multiply(cr.quat);
        this.tmpS.setScalar(cr.scale);
        this.tmpM.compose(this.tmpV, this.tmpQ, this.tmpS);
        im.setMatrixAt(j, this.tmpM);
      }
      im.instanceMatrix.needsUpdate = true;
    });
  }

  private crystalWorld(cr: Crystal, t: Tile | undefined, k: number, kc: number, lift: number, out: THREE.Vector3) {
    out.copy(cr.pos);
    if (t) out.addScaledVector(t.dir, 1.5 * k);
    out.addScaledVector(cr.normal, cr.extra * 1.25 * kc);
    out.y += lift;
    return out;
  }

  // ----------------------------------------------------------------- queries

  /** Model counts (used by the exploded-view counter). */
  counts() {
    const c = this.a.cassets;
    return {
      slices: this.slices.length,
      tiles: this.a.tileMeshes.length,
      crystals: c.crystals.length,
      crystalEstimate: c.estimate,
      pieces: this.slices.length + 1 + 1 + 1 + this.a.tileMeshes.length + c.crystals.length,
    };
  }

  /** Named anchor points in world space (they follow the exploded pieces). */
  anchor(name: AnchorName, out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.a;
    const h = s.assets;
    const front = (r: number, y: number) => out.set(0, y, r);
    switch (name) {
      case 'crystals': {
        const p = h.outer[Math.floor(h.outer.length * 0.62)];
        front(p.r + 0.04, p.y);
        return s.head.localToWorld(out);
      }
      case 'matrix': {
        const p = h.outer[Math.floor(h.outer.length * 0.12)];
        front(p.r, p.y);
        return s.head.localToWorld(out);
      }
      case 'neck': {
        const np = neckProfile(SHAPES[s.variant!.shape]);
        const p = np[Math.floor(np.length * 0.55)];
        front(p.r, p.y);
        return s.neck.localToWorld(out);
      }
      case 'ring':
        front(DIM.ringR, (DIM.ringY0 + DIM.ringY1) / 2);
        return s.ring.localToWorld(out);
      case 'logo':
        front(DIM.shankR, 7.95);
        return this.sliceAt(7.95).localToWorld(out);
      case 'lot':
        front(DIM.shankR, 4.2);
        return this.sliceAt(4.2).localToWorld(out);
      case 'steel':
        front(DIM.shankR, 10.4);
        return this.sliceAt(10.4).localToWorld(out);
      case 'butt':
        out.set(0, 0.06, DIM.butR + 0.05);
        return this.sliceAt(0.05).localToWorld(out);
      case 'core':
        out.set(0, h.midY, 0);
        return s.core.localToWorld(out);
      case 'tile': {
        const i = Math.floor(s.tileMeshes.length * 0.55);
        out.copy(h.tiles[i].center);
        return s.tileMeshes[i].localToWorld(out);
      }
      case 'crystalFar': {
        const c = s.cassets.crystals;
        let best = 0;
        let bz = -Infinity;
        for (let i = 0; i < c.length; i++) {
          const score = c[i].normal.z + c[i].normal.y * 0.4 + c[i].extra * 0.1;
          if (score > bz) {
            bz = score;
            best = i;
          }
        }
        const cr = c[best];
        const t = h.tiles[cr.tile];
        const e = this.explodeAmount;
        const k = t ? this.piece(e, 0.12 + t.delay) : 0;
        const kc = easeOutCubic(clamp((e - 0.2 - cr.extra * 0.04) / 0.8));
        this.crystalWorld(cr, t, k, kc, 2.7 * this.piece(e, 0.12), out);
        return this.inner.localToWorld(out);
      }
      case 'head':
        out.set(0, h.midY, 0);
        return s.head.localToWorld(out);
      case 'tip':
        out.set(0, h.topY, 0);
        return s.head.localToWorld(out);
      case 'center':
        out.set(0, BUR_PIVOT_Y, 0);
        return this.inner.localToWorld(out);
    }
  }

  private sliceAt(y: number) {
    const i = Math.min(this.slices.length - 1, Math.floor((y / DIM.shankTop) * this.slices.length));
    return this.slices[i];
  }

  /** Must run after the pose is set and before rendering. */
  update() {
    this.root.updateMatrixWorld(true);
    for (const s of [this.a, this.b]) {
      s.plane.copy(s.localPlane).applyMatrix4(this.inner.matrixWorld);
    }
  }

  /** Every mesh that should feed the particle sampler for the current variant. */
  surfaceMeshes(): THREE.Mesh[] {
    return [this.shank, this.a.neck, this.a.shell, this.a.ring];
  }
}

export type AnchorName =
  | 'crystals'
  | 'matrix'
  | 'neck'
  | 'ring'
  | 'logo'
  | 'lot'
  | 'steel'
  | 'butt'
  | 'core'
  | 'tile'
  | 'crystalFar'
  | 'head'
  | 'tip'
  | 'center';
