import * as THREE from 'three';
import { rng } from '../util/rng';

/**
 * Procedural product-photography studio, baked into a PMREM environment:
 * a near-black cyclorama, one big overhead softbox, two tall strip lights and
 * a thin back rim strip. Long strips are what give turned steel its
 * signature highlights. Rotating `scene.environmentRotation` makes those
 * highlights travel along the metal ("a luz viaja pelo material").
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          float up = vDir.y * 0.5 + 0.5;
          vec3 c = mix(vec3(0.004), vec3(0.03, 0.03, 0.032), smoothstep(0.35, 1.0, up));
          // faint floor bounce
          c += vec3(0.012) * smoothstep(0.25, 0.0, up);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  env.add(room);

  const panel = (w: number, h: number, intensity: number, tint = new THREE.Color(1, 1, 1)) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: tint.clone().multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    return m;
  };

  // overhead key softbox
  const key = panel(16, 7, 1.0);
  key.position.set(0, 26, 8);
  key.lookAt(0, 0, 0);
  env.add(key);

  // two tall strips, left and right, slightly forward
  const stripL = panel(2.4, 46, 7);
  stripL.position.set(-24, 4, 10);
  stripL.lookAt(0, 0, 0);
  env.add(stripL);
  const stripR = panel(1.6, 46, 5);
  stripR.position.set(22, 2, 16);
  stripR.lookAt(0, 0, 0);
  env.add(stripR);

  // back rim strip and a faint front fill card
  const rim = panel(36, 1.4, 7);
  rim.position.set(0, 9, -28);
  rim.lookAt(0, 0, 0);
  env.add(rim);
  const fill = panel(22, 6, 0.22, new THREE.Color(0.95, 0.97, 1));
  fill.position.set(6, -8, 30);
  fill.lookAt(0, 0, 0);
  env.add(fill);

  // scattered small hot cards: jewellery-style lighting so crystal facets glint
  const r = rng(2024);
  for (let i = 0; i < 26; i++) {
    const th = r() * Math.PI * 2;
    const ph = r.range(0.25, 2.4);
    const d = 34;
    const c = panel(r.range(0.6, 1.6), r.range(0.6, 1.6), r.range(3.5, 7.5));
    c.position.set(Math.sin(ph) * Math.cos(th) * d, Math.cos(ph) * d, Math.sin(ph) * Math.sin(th) * d);
    c.lookAt(0, 0, 0);
    env.add(c);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.0, 0.1, 100);
  pmrem.dispose();
  // jewellery box for the faceted diamond shader: same studio + many more cards
  const gem = new THREE.Scene();
  gem.add(env.clone());
  const r2 = rng(77);
  for (let i = 0; i < 70; i++) {
    const th = r2() * Math.PI * 2;
    const ph = r2.range(0.15, 2.9);
    const d = 30;
    const c = panel(r2.range(1.5, 5), r2.range(1.5, 5), r2.range(1.5, 7));
    c.position.set(Math.sin(ph) * Math.cos(th) * d, Math.cos(ph) * d, Math.sin(ph) * Math.sin(th) * d);
    c.lookAt(0, 0, 0);
    gem.add(c);
  }
  const lime = panel(4, 26, 2.2, new THREE.Color('#D4F82E'));
  lime.position.set(20, 0, -18);
  lime.lookAt(0, 0, 0);
  gem.add(lime);
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT);
  cubeCam.update(renderer, gem);
  env.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (m.material as THREE.Material).dispose();
  });
  return { texture: rt.texture, cube: cubeRT.texture };
}
