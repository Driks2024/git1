import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Background painted before the 3D scene: neutral near-black gradient, a soft
 * light pool behind the hero, a faint volumetric beam, dithered against banding.
 */
export class BackdropPass extends Pass {
  readonly uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uTop: { value: new THREE.Color('#0d0d0f') },
    uBottom: { value: new THREE.Color('#040405') },
    uTint: { value: new THREE.Color('#ffffff') },
    uTintAmt: { value: 0 },
    uPool: { value: new THREE.Vector3(0.5, 0.55, 0.0) },
    uPoolSize: { value: new THREE.Vector2(0.55, 0.42) },
    uPoolColor: { value: new THREE.Color('#1d1e21') },
    uBeam: { value: 0 },
    uBeamX: { value: 0.32 },
    uLift: { value: 0 },
  };
  private quad: FullScreenQuad;

  constructor() {
    super();
    this.needsSwap = false;
    this.quad = new FullScreenQuad(
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform vec2 uRes;
          uniform float uTime;
          uniform vec3 uTop, uBottom, uTint, uPoolColor;
          uniform float uTintAmt, uBeam, uBeamX, uLift;
          uniform vec3 uPool;
          uniform vec2 uPoolSize;
          float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          float n2(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
          }
          void main() {
            vec2 uv = vUv;
            float aspect = uRes.x / uRes.y;
            vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, uv.y));
            // light pool
            vec2 d = (uv - uPool.xy);
            d.x *= aspect;
            float pool = exp(-dot(d / (uPoolSize * vec2(aspect, 1.0)), d / (uPoolSize * vec2(aspect, 1.0))) * 1.6);
            col += uPoolColor * pool * uPool.z;
            // volumetric beam from the top, slightly slanted
            float bx = uv.x - uBeamX - (1.0 - uv.y) * 0.18;
            float beam = exp(-bx * bx * 38.0) * smoothstep(-0.1, 1.0, uv.y);
            float dust = n2(vec2(uv.x * 9.0, uv.y * 4.0 - uTime * 0.05)) * 0.6 + 0.4;
            col += vec3(0.11, 0.11, 0.115) * beam * dust * uBeam;
            col += uLift;
            // neutral tint follows the selected variant
            col = mix(col, col * uTint * 1.6 + uTint * 0.012, uTintAmt);
            col += (h(uv * uRes + uTime) - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    );
  }

  setSize(w: number, h: number) {
    this.uniforms.uRes.value.set(w, h);
  }

  render(renderer: THREE.WebGLRenderer, _w: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.clear(true, true, true);
    this.quad.render(renderer);
  }

  dispose() {
    this.quad.dispose();
  }
}

/** Technical grid floating behind the exploded view (parallax for free). */
export function createGrid() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#e8eaee') },
      uAccent: { value: new THREE.Color('#D4F82E') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vP;
      uniform float uOpacity;
      uniform vec3 uColor, uAccent;
      float line(float x, float w) {
        float d = abs(fract(x - 0.5) - 0.5) / fwidth(x);
        return 1.0 - clamp(d - w, 0.0, 1.0);
      }
      void main() {
        if (uOpacity <= 0.001) discard;
        vec2 p = vP;
        float minor = max(line(p.x, 0.0), line(p.y, 0.0)) * 0.12;
        float major = max(line(p.x / 5.0, 0.2), line(p.y / 5.0, 0.2)) * 0.3;
        // crosses on major intersections
        vec2 c = abs(fract(p / 5.0 + 0.5) - 0.5) * 5.0;
        float cross = (step(c.x, 0.03) * step(c.y, 0.45) + step(c.y, 0.03) * step(c.x, 0.45)) * 0.45;
        float axis = (1.0 - clamp(abs(p.y) / fwidth(p.y) - 0.5, 0.0, 1.0));
        float r = length(p) / 46.0;
        float fade = exp(-r * r * 5.0);
        float a = max(max(minor, major), cross) * fade;
        vec3 col = mix(uColor, uAccent, axis * 0.85);
        a = max(a, axis * fade * 0.6);
        gl_FragColor = vec4(col, a * uOpacity);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat);
  mesh.name = 'grid';
  mesh.renderOrder = -2;
  mesh.frustumCulled = false;
  return { mesh, uniforms: mat.uniforms as { uOpacity: { value: number } } };
}

export type TitleStyle = {
  weight?: number;
  family?: string;
  tracking?: number; // em
  color?: string;
};

/**
 * Monumental title living *inside* the 3D scene, so the bur can partially
 * hide it. Rendered once to a canvas; revealed by a soft wipe + focus pull.
 */
export class TitlePlane {
  readonly mesh: THREE.Mesh;
  readonly uniforms = {
    map: { value: null as THREE.Texture | null },
    uOpacity: { value: 0 },
    uReveal: { value: 1 },
    uBlur: { value: 0 },
    uColor: { value: new THREE.Color('#f1f1ee') },
    uSoft: { value: 0.18 },
  };
  private text = '';
  private canvas = document.createElement('canvas');
  aspect = 1;

  constructor() {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D map;
        uniform float uOpacity, uReveal, uBlur, uSoft;
        uniform vec3 uColor;
        void main() {
          float a = texture2D(map, vUv, uBlur * 5.0).a;
          float edge = uReveal * (1.0 + uSoft) - uSoft;
          float wipe = smoothstep(edge + uSoft, edge, vUv.x);
          gl_FragColor = vec4(uColor, a * uOpacity * wipe);
          if (gl_FragColor.a < 0.002) discard;
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.mesh.name = 'title';
    this.mesh.renderOrder = -1;
    this.mesh.frustumCulled = false;
  }

  setText(text: string, style: TitleStyle = {}) {
    const key = text + JSON.stringify(style);
    if (key === this.text) return;
    this.text = key;
    const { weight = 100, family = '"Inter Display", "Inter", sans-serif', tracking = -0.02 } = style;
    const H = 640;
    const ctx = this.canvas.getContext('2d')!;
    const font = `${weight} ${H * 0.82}px ${family}`;
    ctx.font = font;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * H * 0.82}px`;
    const w = Math.ceil(ctx.measureText(text).width + H * 0.3);
    this.canvas.width = Math.min(8192, w);
    this.canvas.height = H;
    ctx.font = font;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * H * 0.82}px`;
    ctx.clearRect(0, 0, this.canvas.width, H);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.canvas.width / 2, H * 0.8);
    this.aspect = this.canvas.width / H;
    const old = this.uniforms.map.value;
    const t = new THREE.CanvasTexture(this.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    this.uniforms.map.value = t;
    old?.dispose();
  }

  /** Size by cap height in world units. */
  setHeight(h: number) {
    this.mesh.scale.set(h * this.aspect, h, 1);
  }
}
