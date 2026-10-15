import * as THREE from 'three';
import { Bur, type AnchorName } from '../bur/Bur';
import { SHAPE_ORDER, GRIT_ORDER, type Variant } from '../bur/profiles';
import type { ImageSource } from '../bur/textures';
import { createStudioEnvironment } from './environment';
import { createGrid, TitlePlane } from './backdrop';
import { Post } from './post';
import { DiamondCore } from './diamond';
import { Debris, SurfaceParticles } from './particles';
import { FoamBlock } from './foam';
import type { FilmState } from './state';

export type FilmRendererOptions = {
  canvas: HTMLCanvasElement;
  logo: ImageSource;
  width: number;
  height: number;
  dpr: number;
  samples?: number;
  crystalCap?: number;
  preserveDrawingBuffer?: boolean;
  /** design aspect the timeline was framed for (fit compensation) */
  designAspect?: number;
};

/**
 * Owns the WebGL renderer, the scene and every object of the film.
 * `render(state)` is synchronous and depends only on `state`.
 */
export class FilmRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly post: Post;
  readonly bur: Bur;
  readonly core = new DiamondCore();
  readonly particles: SurfaceParticles;
  readonly debris = new Debris();
  readonly foam: FoamBlock;
  readonly title = new TitlePlane();
  readonly grid = createGrid();
  readonly key = new THREE.DirectionalLight(0xffffff, 0.5);
  readonly kicker = new THREE.PointLight(0xffffff, 0, 0, 2);
  width: number;
  height: number;
  dpr: number;
  private designAspect: number;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private qSpin = new THREE.Quaternion();
  private yAxis = new THREE.Vector3(0, 1, 0);

  constructor(o: FilmRendererOptions) {
    this.width = o.width;
    this.height = o.height;
    this.dpr = o.dpr;
    this.designAspect = o.designAspect ?? 16 / 9;
    this.renderer = new THREE.WebGLRenderer({
      canvas: o.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: o.preserveDrawingBuffer ?? false,
      stencil: false,
    });
    const r = this.renderer;
    r.setPixelRatio(o.dpr);
    r.setSize(o.width, o.height, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;
    r.localClippingEnabled = true;
    r.autoClear = false;

    this.camera = new THREE.PerspectiveCamera(30, o.width / o.height, 0.05, 1200);
    const studio = createStudioEnvironment(r);
    this.scene.environment = studio.texture;
    this.core.setEnvironment(studio.cube);

    this.bur = new Bur({ logo: o.logo, crystalCap: o.crystalCap });
    this.scene.add(this.bur.root);
    this.particles = new SurfaceParticles(this.bur.surfaceMeshes());
    this.bur.inner.add(this.particles.points);
    this.foam = new FoamBlock(o.logo);

    this.key.position.set(-14, 22, 18);
    this.scene.add(this.key, this.kicker);
    this.scene.add(this.core.group, this.debris.points, this.foam.group, this.title.mesh, this.grid.mesh);

    this.post = new Post(r, this.scene, this.camera, o.width, o.height, o.samples ?? 4);
    this.post.dof.hide = [this.title.mesh, this.grid.mesh, this.particles.points, this.debris.points];
    this.resize(o.width, o.height, o.dpr);
  }

  resize(w: number, h: number, dpr: number) {
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h, dpr);
    this.particles.uniforms.uPixel.value = dpr * (h / 900);
    this.debris.uniforms.uPixel.value = dpr * (h / 900);
  }

  /** Compile every program and build every variant before the film starts. */
  async warmup(variants?: Variant[]) {
    const all: Variant[] =
      variants ?? SHAPE_ORDER.flatMap((shape) => GRIT_ORDER.map((grit) => ({ shape, grit })));
    this.bur.prewarm(all);
    // make everything visible once so all programs exist
    const vis: [THREE.Object3D, boolean][] = [];
    this.scene.traverse((o) => {
      vis.push([o, o.visible]);
      o.visible = true;
    });
    this.bur.setExplode(0.5);
    this.bur.setExplode(0);
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      this.renderer.compile(this.scene, this.camera);
    }
    for (const [o, v] of vis) o.visible = v;
  }

  anchor(name: AnchorName, out = new THREE.Vector3()) {
    return this.bur.anchor(name, out);
  }

  /** World point → CSS pixels of the canvas. */
  project(p: THREE.Vector3, out = { x: 0, y: 0, z: 0, behind: false }) {
    this.tmp.copy(p).project(this.camera);
    out.x = (this.tmp.x * 0.5 + 0.5) * this.width;
    out.y = (-this.tmp.y * 0.5 + 0.5) * this.height;
    out.z = this.tmp.z;
    out.behind = this.tmp.z > 1;
    return out;
  }

  render(s: FilmState) {
    const cam = this.camera;
    // ---- camera, with aspect compensation for narrow viewports
    const aspect = this.width / this.height;
    const k = 1 + s.fit * (Math.pow(Math.max(1, this.designAspect / aspect), 0.62) - 1);
    this.tmp.set(...s.target);
    this.tmp2.set(...s.cam).sub(this.tmp).multiplyScalar(k).add(this.tmp);
    cam.position.copy(this.tmp2);
    cam.up.set(Math.sin(s.roll), Math.cos(s.roll), 0);
    cam.lookAt(this.tmp);
    if (cam.fov !== s.fov) {
      cam.fov = s.fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();

    // ---- hero
    const bur = this.bur;
    bur.root.visible = s.burVisible;
    bur.root.position.set(...s.burPos);
    bur.root.rotation.set(...s.burRot);
    this.qSpin.setFromAxisAngle(this.yAxis, s.burSpin);
    bur.root.quaternion.multiply(this.qSpin);
    bur.root.scale.setScalar(s.burScale);
    if (s.sweepTo) bur.setSweep(s.variant, s.sweepTo, s.sweep);
    else bur.setVariant(s.variant);
    bur.setExplode(s.explode);
    bur.setRim(s.rim, s.rimPow);
    bur.setDissolve(s.dissolve);
    bur.setRingGlow(s.ringGlow);
    bur.update();

    // ---- light
    this.scene.environmentIntensity = s.envIntensity;
    this.scene.environmentRotation.set(0, s.envRot, 0);
    this.key.intensity = 0.5 * s.keyLight;
    this.kicker.position.set(...s.kicker);
    this.kicker.intensity = s.kickerIntensity;
    this.kicker.visible = s.kickerIntensity > 0;
    this.renderer.toneMappingExposure = s.exposure;

    // ---- backdrop
    const bu = this.post.backdrop.uniforms;
    bu.uTime.value = s.time;
    bu.uPool.value.set(...s.pool);
    bu.uBeam.value = s.beam;
    bu.uLift.value = s.lift;
    bu.uTint.value.set(s.tint);
    bu.uTintAmt.value = s.tintAmt;
    this.grid.uniforms.uOpacity.value = s.grid;
    this.grid.mesh.visible = s.grid > 0.001;
    this.grid.mesh.position.set(...s.gridPos);
    this.grid.mesh.rotation.set(...s.gridRot);

    const t = s.title;
    this.title.mesh.visible = t.opacity > 0.001 && t.text.length > 0;
    if (this.title.mesh.visible) {
      this.title.setText(t.text, { weight: t.weight, tracking: t.tracking });
      this.title.mesh.position.set(...t.pos);
      // never let the monumental title overflow a narrow viewport
      const dist = Math.max(1, cam.position.distanceTo(this.title.mesh.position));
      const visW = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist * cam.aspect;
      const k = Math.min(1, (0.9 * visW) / (t.height * this.title.aspect));
      this.title.setHeight(t.height * k);
      if (t.billboard) this.title.mesh.quaternion.copy(cam.quaternion);
      else this.title.mesh.rotation.set(0, 0, 0);
      this.title.uniforms.uOpacity.value = t.opacity;
      this.title.uniforms.uReveal.value = t.reveal;
      this.title.uniforms.uBlur.value = t.blur;
    }

    // ---- extras
    this.particles.set(s.particles, s.particlesExpand, s.time);
    if (this.particles.points.visible) {
      bur.inner.updateMatrixWorld();
      this.particles.uniforms.uCam.value.copy(cam.position);
      bur.inner.worldToLocal(this.particles.uniforms.uCam.value);
    }
    this.core.group.position.set(...s.corePos);
    this.core.set(s.core, s.time, s.coreRot, s.coreScale);
    this.foam.group.visible = s.foam > 0.001;
    this.foam.group.position.set(...s.foamPos);
    this.foam.group.rotation.set(...s.foamRot);
    if (s.debris > 0.001) {
      bur.anchor('head', this.tmp);
      this.debris.set(s.debris, s.debrisT, this.tmp);
    } else this.debris.set(0, 0, this.tmp);

    // ---- post
    const p = this.post;
    p.dof.enabled = s.dof > 0.001;
    if (p.dof.enabled) {
      const f = s.focus ? this.tmp.set(...s.focus) : bur.anchor('center', this.tmp);
      const dist = cam.position.distanceTo(f);
      const du = p.dof.uniforms as unknown as Record<string, { value: number }>;
      du.focus.value = dist;
      du.aperture.value = s.aperture * s.dof;
      du.maxblur.value = s.maxBlur * s.dof;
    }
    p.bloom.strength = s.bloom;
    p.bloom.threshold = s.bloomThreshold;
    const g = p.gradeUniforms;
    g.uGrain.value = s.grain;
    g.uVignette.value = s.vignette;
    g.uFade.value = s.fade;
    g.uFlash.value = s.flash;
    g.uSeed.value = Math.floor(s.time * 24) % 1000;

    this.renderer.setRenderTarget(null);
    p.composer.render();
  }

  dispose() {
    this.post.composer.dispose();
    this.renderer.dispose();
  }
}
