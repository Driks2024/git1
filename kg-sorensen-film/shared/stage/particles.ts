import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { rng } from '../util/rng';

/**
 * The bur as thousands of particles. Points are sampled on the real surface
 * (so they hold the silhouette), then expand — some flying past the camera —
 * and converge back. Lives in bur space so it inherits the pose.
 */
export class SurfaceParticles {
  readonly points: THREE.Points;
  readonly uniforms = {
    uExpand: { value: 0 },
    uFly: { value: 26 },
    uSize: { value: 2.2 },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uCam: { value: new THREE.Vector3() },
    uPixel: { value: 1 },
    uColor: { value: new THREE.Color('#e7e9ec') },
    uAccent: { value: new THREE.Color('#D4F82E') },
  };

  constructor(meshes: THREE.Mesh[], count = 26000, seed = 77) {
    const r = rng(seed);
    const pos = new Float32Array(count * 3);
    const dir = new Float32Array(count * 3);
    const seedA = new Float32Array(count * 4);
    // area-weighted split across meshes
    const areas = meshes.map((m) => {
      const g = m.geometry;
      const p = g.getAttribute('position');
      const idx = g.getIndex();
      let a = 0;
      const A = new THREE.Vector3();
      const B = new THREE.Vector3();
      const C = new THREE.Vector3();
      const n = idx ? idx.count : p.count;
      for (let i = 0; i < n; i += 3) {
        const ia = idx ? idx.getX(i) : i;
        const ib = idx ? idx.getX(i + 1) : i + 1;
        const ic = idx ? idx.getX(i + 2) : i + 2;
        A.fromBufferAttribute(p, ia);
        B.fromBufferAttribute(p, ib);
        C.fromBufferAttribute(p, ic);
        a += B.sub(A).cross(C.sub(A)).length() / 2;
      }
      return a;
    });
    const total = areas.reduce((s, a) => s + a, 0);
    const P = new THREE.Vector3();
    const N = new THREE.Vector3();
    let k = 0;
    meshes.forEach((m, mi) => {
      const n = mi === meshes.length - 1 ? count - k : Math.round((areas[mi] / total) * count);
      const sampler = new MeshSurfaceSampler(m);
      (sampler as unknown as { setRandomGenerator(f: () => number): void }).setRandomGenerator(r);
      sampler.build();
      for (let i = 0; i < n && k < count; i++, k++) {
        sampler.sample(P, N);
        pos.set([P.x, P.y, P.z], k * 3);
        const d = new THREE.Vector3(r.gauss(), r.gauss(), r.gauss()).normalize().multiplyScalar(0.55).add(N).normalize();
        dir.set([d.x, d.y, d.z], k * 3);
        seedA.set([r(), r(), r(), r()], k * 4);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aDir;
        attribute vec4 aSeed;
        uniform float uExpand, uFly, uSize, uTime, uPixel;
        uniform vec3 uCam;
        varying float vA;
        varying float vLime;
        void main() {
          vec3 p = position;
          float s = aSeed.x;
          float k = smoothstep(s * 0.4, s * 0.4 + 0.6, uExpand);
          float ph = s * 6.2831 + p.y * 0.35;
          vec3 swirl = vec3(sin(ph + uExpand * 2.4), cos(ph * 1.3) * 0.4, cos(ph + uExpand * 2.4)) * 1.8 * k;
          vec3 toCam = normalize(uCam - p);
          p += aDir * k * (1.2 + aSeed.y * 7.5) + swirl;
          p += toCam * (k * k) * aSeed.z * uFly * step(0.55, aSeed.w);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float twinkle = 0.75 + 0.25 * sin(uTime * 3.0 + s * 40.0);
          gl_PointSize = uSize * uPixel * (0.6 + aSeed.y * 0.9) * (30.0 / max(1.0, -mv.z));
          gl_PointSize = clamp(gl_PointSize, 0.0, 64.0 * uPixel);
          vA = twinkle * (1.0 - 0.35 * k);
          vLime = step(aSeed.w, 0.06);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uColor, uAccent;
        varying float vA;
        varying float vLime;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          a *= a;
          vec3 col = mix(uColor, uAccent, vLime);
          gl_FragColor = vec4(col * a * vA * uOpacity, 1.0);
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.name = 'particles';
    this.points.frustumCulled = false;
    this.points.visible = false;
  }

  set(opacity: number, expand: number, time: number) {
    this.points.visible = opacity > 0.001;
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uExpand.value = expand;
    this.uniforms.uTime.value = time;
  }
}

/** Debris shaken out of the coating by the cleaning block. World space. */
export class Debris {
  readonly points: THREE.Points;
  readonly uniforms = {
    uT: { value: 0 },
    uOrigin: { value: new THREE.Vector3() },
    uOpacity: { value: 0 },
    uPixel: { value: 1 },
  };
  constructor(count = 900, seed = 91) {
    const r = rng(seed);
    const vel = new Float32Array(count * 3);
    const off = new Float32Array(count * 3);
    const sd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const sp = 3 + r() * 9;
      vel.set([Math.cos(a) * sp, 4 + r() * 10, Math.sin(a) * sp], i * 3);
      off.set([r.range(-1, 1), r.range(-1.2, 1.2), r.range(-1, 1)], i * 3);
      sd[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(off, 3));
    g.setAttribute('aVel', new THREE.BufferAttribute(vel, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec3 aVel;
        attribute float aSeed;
        uniform float uT, uPixel;
        uniform vec3 uOrigin;
        varying float vS;
        void main() {
          float t = max(0.0, uT - aSeed * 0.25);
          vec3 p = uOrigin + position + aVel * t + vec3(0.0, -18.0, 0.0) * t * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPixel * (1.0 + aSeed * 2.5) * (40.0 / max(1.0, -mv.z));
          vS = aSeed;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vS;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          vec3 c = mix(vec3(0.22), vec3(0.75, 0.74, 0.7), step(0.7, vS));
          gl_FragColor = vec4(c, uOpacity * smoothstep(0.5, 0.2, d));
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.visible = false;
  }
  set(opacity: number, t: number, origin: THREE.Vector3) {
    this.points.visible = opacity > 0.001;
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uT.value = t;
    this.uniforms.uOrigin.value.copy(origin);
  }
}
