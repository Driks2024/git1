import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { rng } from '../util/rng';

/**
 * "O núcleo": a single synthetic-diamond crystal with the cubo-octahedral habit
 * typical of diamond grit, shown alone and huge. A faceted shader fakes the
 * internal bounces of a high-index gem — each facet refracts, bounces and
 * disperses the studio cube map — so the stone throws real "fire".
 * Orbit rings visualise rotation (what the bur does at turbine speed).
 */
export class DiamondCore {
  readonly group = new THREE.Group();
  readonly crystal: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  private rings: THREE.LineLoop[] = [];
  private ticks: THREE.LineSegments;
  private halo: THREE.Mesh;

  constructor() {
    this.group.name = 'diamond-core';
    const r = rng(404);
    const pts: THREE.Vector3[] = [];
    const perm = (a: number, b: number, c: number) => [
      [a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a],
    ];
    const seen = new Set<string>();
    for (const [x, y, z] of perm(1, 0.72, 0)) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        const v = new THREE.Vector3(x * sx || 0, y * sy || 0, z * sz || 0);
        const k = `${v.x},${v.y},${v.z}`;
        if (!seen.has(k)) {
          seen.add(k);
          pts.push(v);
        }
      }
    }
    const geoPts = pts.map(
      (v) => new THREE.Vector3(v.x * 1.04 + r.range(-0.03, 0.03), v.y * 0.97 + r.range(-0.03, 0.03), v.z + r.range(-0.03, 0.03)),
    );
    const g = new ConvexGeometry(geoPts);
    g.computeBoundingSphere();
    const s = 1 / g.boundingSphere!.radius;
    g.scale(s, s, s);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uEnv: { value: null as THREE.CubeTexture | null },
        uOpacity: { value: 1 },
        uSpin: { value: 0 },
        uLime: { value: new THREE.Color('#D4F82E') },
      },
      transparent: true,
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        varying vec3 vN;
        varying vec3 vLocal;
        void main() {
          vLocal = position;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */ `
        uniform samplerCube uEnv;
        uniform float uOpacity;
        uniform float uSpin;
        uniform vec3 uLime;
        varying vec3 vWorldPos;
        varying vec3 vN;
        varying vec3 vLocal;
        vec3 h3(vec3 p) {
          p = fract(p * vec3(0.1031, 0.1030, 0.0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
        }
        mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
        vec3 env(vec3 d) { return textureCube(uEnv, rotY(uSpin) * d).rgb; }
        void main() {
          vec3 N = normalize(vN);
          vec3 V = normalize(vWorldPos - cameraPosition);
          if (dot(N, V) > 0.0) N = -N;
          float cosT = clamp(dot(-V, N), 0.0, 1.0);
          float F = 0.17 + 0.83 * pow(1.0 - cosT, 5.0);
          vec3 refl = env(reflect(V, N));
          // two pseudo internal bounces per facet, per wavelength (dispersion)
          // the jitter varies across each facet too: a mosaic of internal reflections
          vec3 j1 = normalize(-N + 0.85 * h3(floor(N * 7.0) + floor(vLocal * 3.5) + 1.7));
          vec3 j2 = normalize(N + 0.9 * h3(floor(N * 11.0) + floor(vLocal * 5.0) + 9.1));
          vec3 iors = vec3(2.385, 2.42, 2.465);
          vec3 fire;
          for (int i = 0; i < 3; i++) {
            vec3 t = refract(V, N, 1.0 / iors[i]);
            vec3 b = reflect(reflect(t, j1), j2);
            fire[i] = env(b)[i];
          }
          vec3 col = refl * F + fire * (1.0 - F) * 1.15;
          // faint lime caught on the rims, like the KG poster glow
          col += uLime * pow(1.0 - cosT, 3.0) * 0.08;
          // one dispersive facet must not bloom across the frame
          col = min(col, vec3(1.4));
          gl_FragColor = vec4(col, uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.crystal = new THREE.Mesh(g, this.material);
    this.group.add(this.crystal);

    // soft halo card behind the stone
    this.halo = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uO: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `varying vec2 vUv; uniform float uO;
          void main(){ float d = length(vUv - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.16 * uO; gl_FragColor = vec4(vec3(0.82, 0.86, 0.8) * a, a); }`,
      }),
    );
    this.halo.position.z = -3.5;
    this.group.add(this.halo);

    // orbit rings
    const ringMat = (c: string, o: number) =>
      new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });
    const circle = (rad: number, n = 256) => {
      const p: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        p.push(new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad));
      }
      return new THREE.BufferGeometry().setFromPoints(p);
    };
    const rs: [number, string, number, number][] = [
      [1.75, '#e9ebee', 0.3, 0.18],
      [2.25, '#D4F82E', 0.6, -0.32],
      [2.9, '#e9ebee', 0.14, 0.5],
    ];
    for (const [rad, c, o, tilt] of rs) {
      const l = new THREE.LineLoop(circle(rad), ringMat(c, o));
      l.rotation.x = Math.PI / 2 - 1.2 + tilt;
      l.rotation.z = tilt * 0.6;
      l.userData.baseOpacity = o;
      this.rings.push(l);
      this.group.add(l);
    }
    const tp: number[] = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r0 = 2.25;
      const r1 = i % 10 === 0 ? 2.42 : 2.32;
      tp.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
    this.ticks = new THREE.LineSegments(tg, ringMat('#D4F82E', 0.5));
    this.ticks.rotation.copy(this.rings[1].rotation);
    this.ticks.userData.baseOpacity = 0.5;
    this.group.add(this.ticks);
    this.group.visible = false;
  }

  setEnvironment(cube: THREE.CubeTexture) {
    this.material.uniforms.uEnv.value = cube;
  }

  /** v = visibility 0..1, t = seconds (ring spin), rot = crystal turn (rad). */
  set(v: number, t: number, rot: number, scale: number) {
    this.group.visible = v > 0.001;
    if (!this.group.visible) return;
    const s = Math.max(0.0001, scale);
    this.crystal.scale.setScalar(s);
    this.crystal.rotation.set(0.35 + rot * 0.15, rot, 0.12);
    this.material.uniforms.uOpacity.value = Math.min(1, v * 1.5);
    this.material.uniforms.uSpin.value = rot * 0.35;
    (this.halo.material as THREE.ShaderMaterial).uniforms.uO.value = v;
    this.rings.forEach((l, i) => {
      (l.material as THREE.LineBasicMaterial).opacity = l.userData.baseOpacity * v;
      l.rotation.y = t * (0.25 + i * 0.13) * (i % 2 ? -1 : 1);
      l.scale.setScalar(0.85 + 0.15 * v);
    });
    (this.ticks.material as THREE.LineBasicMaterial).opacity = this.ticks.userData.baseOpacity * v;
    this.ticks.rotation.y = t * -0.4;
    this.ticks.scale.setScalar(0.85 + 0.15 * v);
  }
}
