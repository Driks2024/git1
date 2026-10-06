import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { live, targetPose, POSES } from "./pose.js";

const HEAD_H = 1.9;

// Flame-shaped diamond head: radius along its height (t: 0 base → 1 tip).
const headR = (t) => 0.5 * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.75);

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rimVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 p = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 mv = modelViewMatrix * p;
    vN = normalize(normalMatrix * n);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// Black silhouette lit only from behind: a stochastic (grain) rim whose colour runs
// mint → off-white → blue up the screen, like the Unframe key visual.
const rimFrag = /* glsl */ `
  uniform float uTime; uniform float uGlow; uniform float uMul; uniform vec2 uRes; uniform vec3 uLight;
  uniform vec3 cA; uniform vec3 cB; uniform vec3 cC;
  varying vec3 vN; varying vec3 vV;
  float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
  void main() {
    vec3 n = length(vN) > 1e-5 ? normalize(vN) : vec3(0.0, 0.0, 1.0);
    float fres = 1.0 - clamp(abs(dot(n, normalize(vV))), 0.0, 1.0);
    float side = clamp(dot(n, normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
    float rim = smoothstep(0.25, 0.97, fres) * mix(0.12, 1.0, side * side);
    float grain = hash(floor(gl_FragCoord.xy) + floor(uTime * 10.0) * 17.0);
    float on = step(grain, pow(rim, 1.25) * 2.6 * uGlow * uMul);
    float t = clamp(gl_FragCoord.y / uRes.y, 0.0, 1.0);
    vec3 col = t < 0.5 ? mix(cA, cB, t * 2.0) : mix(cB, cC, (t - 0.5) * 2.0);
    gl_FragColor = vec4(col * on, 1.0);
  }
`;

// Back-face shell slightly larger than the bur: grain that spills past the silhouette and
// fades outward. Pixels that are "off" are discarded so the tiles behind stay visible.
const haloFrag = /* glsl */ `
  uniform float uTime; uniform float uGlow; uniform vec2 uRes; uniform vec3 uLight;
  uniform vec3 cA; uniform vec3 cB; uniform vec3 cC;
  varying vec3 vN; varying vec3 vV;
  float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
  void main() {
    vec3 n = length(vN) > 1e-5 ? normalize(vN) : vec3(0.0, 0.0, 1.0);
    float f = clamp(abs(dot(n, normalize(vV))), 0.0, 1.0);
    float side = clamp(dot(-n, normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
    float I = pow(smoothstep(0.0, 0.42, f), 2.2) * mix(0.1, 1.0, side * side) * 1.25 * uGlow;
    float grain = hash(floor(gl_FragCoord.xy) * 1.31 + floor(uTime * 10.0) * 23.0);
    if (grain > I) discard;
    float t = clamp(gl_FragCoord.y / uRes.y, 0.0, 1.0);
    vec3 col = t < 0.5 ? mix(cA, cB, t * 2.0) : mix(cB, cC, (t - 0.5) * 2.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function useHaloMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uGlow: { value: 1 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uLight: { value: new THREE.Vector3(0.55, 0.75, -0.35) },
          cA: { value: new THREE.Color("#8BFF9E") },
          cB: { value: new THREE.Color("#E6F6EA") },
          cC: { value: new THREE.Color("#9CC4F8") },
        },
        vertexShader: rimVert,
        fragmentShader: haloFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );
}

function useRimMaterial(mul = 1) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uGlow: { value: 1 },
          uMul: { value: mul },
          uRes: { value: new THREE.Vector2(1, 1) },
          uLight: { value: new THREE.Vector3(0.55, 0.75, -0.35) },
          cA: { value: new THREE.Color("#8BFF9E") },
          cB: { value: new THREE.Color("#E6F6EA") },
          cC: { value: new THREE.Color("#9CC4F8") },
        },
        vertexShader: rimVert,
        fragmentShader: rimFrag,
      }),
    [mul]
  );
}

function Grit({ count, material }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const r = rng(11);
    const o = new THREE.Object3D();
    const n = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      let t;
      do t = r(); while (r() * 0.5 > headR(t));
      const a = r() * Math.PI * 2;
      const rad = headR(t);
      const dt = 0.002;
      const dr = (headR(Math.min(t + dt, 1)) - headR(Math.max(t - dt, 0))) / (2 * dt * HEAD_H);
      n.set(Math.cos(a), -dr, Math.sin(a)).normalize();
      o.position.set(Math.cos(a) * rad, t * HEAD_H, Math.sin(a) * rad).addScaledVector(n, 0.004);
      o.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
      o.scale.setScalar(0.6 + r() * 0.9);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, material, count]}>
      <octahedronGeometry args={[0.016, 0]} />
    </instancedMesh>
  );
}

function Dust({ count }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const r = rng(3);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * 16;
      arr[i * 3 + 1] = (r() - 0.5) * 11;
      arr[i * 3 + 2] = (r() - 0.5) * 8 - 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (!live.reduced) ref.current.rotation.y += dt * 0.01;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#dfe9e2" size={0.016} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}

function Rig({ small }) {
  const outer = useRef();
  const spinner = useRef();
  const mat = useRimMaterial(1);
  const gritMat = useRimMaterial(0.4);
  const haloMat = useHaloMaterial();
  const cur = useRef({ ...POSES.hero });
  const tgt = useRef({ ...POSES.hero });
  const { camera, gl } = useThree();
  const size = useMemo(() => new THREE.Vector2(), []);

  const headGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0.0001, -0.12), new THREE.Vector2(0.12, -0.12), new THREE.Vector2(headR(0) * 0.85, -0.03)];
    for (let i = 0; i <= 72; i++) {
      const t = i / 72;
      pts.push(new THREE.Vector2(Math.max(headR(t), 0.0001), t * HEAD_H));
    }
    return new THREE.LatheGeometry(pts, 120);
  }, []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    targetPose(tgt.current);
    const c = cur.current;
    const k = 1 - Math.exp(-d * 3.2);
    for (const key in tgt.current) c[key] += (tgt.current[key] - c[key]) * k;

    const away = small ? Math.min(window.scrollY / window.innerHeight, 1) : 0;
    const xs = small ? 0.3 : 1;
    const ss = small ? 0.7 : 1;
    outer.current.position.set(c.x * xs, c.y + (small ? 0.45 : 0), c.z - away * 2.2);
    outer.current.rotation.set(c.rx + (live.reduced ? 0 : state.pointer.y * 0.06), 0, c.rz - (live.reduced ? 0 : state.pointer.x * 0.05));
    outer.current.scale.setScalar(c.s * ss);

    const boost = Math.min(Math.abs(live.velocity) * 0.06, 5);
    spinner.current.rotation.y += d * (live.reduced ? 0.08 : c.spin + boost);

    if (!live.reduced) {
      camera.position.x += (state.pointer.x * 0.3 - camera.position.x) * k;
      camera.position.y += (state.pointer.y * 0.18 - camera.position.y) * k;
      camera.lookAt(0, 0, 0);
    }
    gl.getDrawingBufferSize(size);
    for (const m of [mat, gritMat, haloMat]) {
      m.uniforms.uRes.value.copy(size);
      m.uniforms.uTime.value = live.reduced ? 0 : state.clock.elapsedTime;
      m.uniforms.uGlow.value = c.glow * (1 - away * 0.4);
    }
  });

  return (
    <group ref={outer}>
      <group ref={spinner}>
        <group position={[0, -0.95, 0]}>
          <mesh geometry={headGeo} material={mat} />
          <mesh geometry={headGeo} material={haloMat} scale={[1.09, 1.05, 1.09]} position={[0, -0.03, 0]} renderOrder={2} />
          <mesh position={[0, -2.16, 0]} material={haloMat} renderOrder={2}>
            <cylinderGeometry args={[0.215, 0.215, 3.24, 48, 1, true]} />
          </mesh>
          <Grit count={small ? 900 : 1600} material={gritMat} />
          <mesh position={[0, -0.34, 0]} material={mat}>
            <cylinderGeometry args={[0.12, 0.165, 0.44, 48]} />
          </mesh>
          <mesh position={[0, -2.16, 0]} material={mat}>
            <cylinderGeometry args={[0.165, 0.165, 3.2, 64]} />
          </mesh>
          <mesh position={[0, -3.8, 0]} material={mat}>
            <cylinderGeometry args={[0.165, 0.12, 0.08, 64]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Scene() {
  const small = typeof window !== "undefined" && window.innerWidth < 760;
  return (
    <Canvas
      className="webgl"
      dpr={[1, small ? 1.5 : 1.75]}
      camera={{ position: [0, 0, 7], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={<div className="webgl-fallback" />}
    >
      <Rig small={small} />
      <Dust count={small ? 220 : 500} />
    </Canvas>
  );
}
