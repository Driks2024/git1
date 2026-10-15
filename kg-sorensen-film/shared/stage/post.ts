import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Backdrop } from './backdrop';

/** Depth of field that ignores overlays (title, grid, particles) when measuring depth. */
class DofPass extends BokehPass {
  hide: THREE.Object3D[] = [];
  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean,
  ) {
    const was = this.hide.map((o) => o.visible);
    this.hide.forEach((o) => (o.visible = false));
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    this.hide.forEach((o, i) => (o.visible = was[i]));
  }
}

/**
 * Backdrop + scene into ONE multisampled target (one resolve per frame), then
 * a plain copy into the composer's single-sample chain. Only this pass pays
 * for MSAA; bloom, depth of field and grading run on cheap targets.
 */
class ScenePass extends Pass {
  readonly msaa: THREE.WebGLRenderTarget;
  private quad: FullScreenQuad;
  private copy: THREE.ShaderMaterial;
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    samples: number,
  ) {
    super();
    this.needsSwap = false;
    this.msaa = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples, depthBuffer: true });
    this.msaa.resolveDepthBuffer = false;
    this.copy = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null as THREE.Texture | null } },
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec2 vUv; uniform sampler2D tDiffuse; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }`,
    });
    this.quad = new FullScreenQuad(this.copy);
  }
  setSize(w: number, h: number) {
    this.msaa.setSize(w, h);
  }
  render(renderer: THREE.WebGLRenderer, _write: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.msaa);
    renderer.clear(true, true, false);
    renderer.render(this.scene, this.camera);
    this.copy.uniforms.tDiffuse.value = this.msaa.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.quad.render(renderer);
  }
  dispose() {
    this.msaa.dispose();
    this.quad.dispose();
    this.copy.dispose();
  }
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uSeed: { value: 0 },
    uGrain: { value: 0.045 },
    uVignette: { value: 0.55 },
    uFade: { value: 0 },
    uFlash: { value: 0 },
    uFlashColor: { value: new THREE.Color('#D4F82E') },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uSeed, uGrain, uVignette, uFade, uFlash;
    uniform vec3 uFlashColor;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed * 0.618) * 43758.5453); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 q = vUv - 0.5;
      q.x *= uRes.x / uRes.y;
      float v = smoothstep(1.25, 0.15, length(q) * (0.9 + uVignette * 0.6));
      c *= mix(1.0, v, uVignette);
      // film grain, stronger in the mids, invisible in pure black
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      float g = (h(vUv * uRes) - 0.5) * uGrain * (0.35 + 0.65 * smoothstep(0.0, 0.5, l));
      c += g;
      // snap flash: a very short lime-tinted lift
      c += uFlashColor * uFlash * 0.06 * v;
      c *= (1.0 - uFade);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class Post {
  readonly composer: EffectComposer;
  readonly backdrop = new Backdrop();
  readonly render: ScenePass;
  readonly dof: DofPass;
  readonly bloom: UnrealBloomPass;
  readonly output = new OutputPass();
  readonly grade = new ShaderPass(GradeShader);

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number,
    samples = 4,
  ) {
    scene.add(this.backdrop.mesh);
    // single-sample, depth-less chain: depth of field renders its own depth
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new ScenePass(scene, camera, samples);
    this.dof = new DofPass(scene, camera, { focus: 40, aperture: 0.0002, maxblur: 0.008 });
    this.dof.enabled = false;
    this.dof.hide.push(this.backdrop.mesh);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.22, 0.32, 1.1);
    this.composer.addPass(this.render);
    this.composer.addPass(this.dof);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.output);
    this.composer.addPass(this.grade);
  }

  setSize(w: number, h: number, dpr: number) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.backdrop.setSize(w * dpr, h * dpr);
    (this.grade.uniforms as typeof GradeShader.uniforms).uRes.value.set(w * dpr, h * dpr);
  }

  get gradeUniforms() {
    return this.grade.uniforms as typeof GradeShader.uniforms;
  }
}
