import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { live, targetPose, POSES } from "./pose.js";

const MINT = "#8BFF9E";
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

const headVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// Translucent glowing shell with a scale/hex lattice, brighter on the rim and the tip.
const headFrag = /* glsl */ `
  uniform float uTime; uniform vec3 uColor; uniform float uGlow;
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  float hexd(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
  vec2 hexgv(vec2 uv) {
    vec2 r = vec2(1.0, 1.7320508); vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h; vec2 b = mod(uv - h, r) - h;
    return dot(a, a) < dot(b, b) ? a : b;
  }
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    float ang = atan(vP.z, vP.x);
    vec2 uv = vec2(ang / 6.2831853 * 22.0, vP.y * 7.0);
    float edge = smoothstep(0.40, 0.48, hexd(hexgv(uv)));
    vec3 nn = length(vN) > 1e-5 ? normalize(vN) : vec3(0.0, 0.0, 1.0);
    float fres = pow(clamp(1.0 - abs(dot(nn, normalize(vV))), 0.0, 1.0), 2.2);
    float g = clamp(vP.y / 1.9, 0.0, 1.0);
    vec3 col = mix(vec3(0.012, 0.035, 0.02), uColor * 0.2, smoothstep(0.0, 1.0, g));
    col += uColor * fres * 1.25;
    col += uColor * edge * (0.07 + fres * 0.9);
    col += uColor * pow(g, 7.0) * 0.9;
    float scan = smoothstep(0.0, 0.02, abs(fract(vP.y * 0.6 - uTime * 0.15) - 0.5) - 0.48);
    col += uColor * scan * 0.35;
    float n = hash(floor(vP * 90.0));
    col += vec3(0.85, 1.0, 0.9) * step(0.992, n) * (0.5 + 0.5 * sin(uTime * 4.0 + n * 60.0));
    gl_FragColor = vec4(clamp(col * uGlow, 0.0, 4.0), 1.0);
  }
`;

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Grit({ count }) {
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
      o.position.set(Math.cos(a) * rad, t * HEAD_H, Math.sin(a) * rad).addScaledVector(n, 0.006);
      o.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
      o.scale.setScalar(0.55 + r() * 0.9);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.014, 0]} />
      <meshStandardMaterial color="#a9b4ad" metalness={0.9} roughness={0.32} emissive={MINT} emissiveIntensity={0.4} envMapIntensity={1.4} />
    </instancedMesh>
  );
}

function Circuits() {
  const { lines, nodes } = useMemo(() => {
    const r = rng(7);
    const mat = new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.95 });
    const lines = [];
    const nodes = [];
    for (let k = 0; k < 7; k++) {
      let t = 0.08 + r() * 0.3;
      let a = r() * Math.PI * 2;
      const pts = [];
      const push = () => {
        const rad = headR(t) * 1.012;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, t * HEAD_H, Math.sin(a) * rad));
      };
      push();
      for (let s = 0; s < 4; s++) {
        if (s % 2 === 0) {
          const t0 = t, t1 = Math.min(0.9, t + 0.08 + r() * 0.22);
          for (let j = 1; j <= 14; j++) { t = t0 + ((t1 - t0) * j) / 14; push(); }
        } else {
          const a0 = a, a1 = a + (r() - 0.5) * 1.5;
          for (let j = 1; j <= 18; j++) { a = a0 + ((a1 - a0) * j) / 18; push(); }
        }
      }
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      nodes.push(pts[pts.length - 1], pts[0]);
    }
    return { lines, nodes };
  }, []);
  return (
    <group>
      {lines.map((l, i) => <primitive key={i} object={l} />)}
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 2 ? 0.012 : 0.02, 10, 10]} />
          <meshBasicMaterial color="#d9ffe0" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function useHead() {
  const headGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0.0001, -0.12), new THREE.Vector2(0.12, -0.12), new THREE.Vector2(headR(0) * 0.85, -0.03)];
    for (let i = 0; i <= 72; i++) {
      const t = i / 72;
      pts.push(new THREE.Vector2(Math.max(headR(t), 0.0001), t * HEAD_H));
    }
    return new THREE.LatheGeometry(pts, 120);
  }, []);
  const headMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(MINT) }, uGlow: { value: 1 } },
        vertexShader: headVert,
        fragmentShader: headFrag,
      }),
    []
  );
  return { headGeo, headMat };
}

function Rings() {
  const ref = useRef();
  const objs = useMemo(() => {
    const out = [];
    const mk = (radius, dash, gap, opacity, segs = 256) => {
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = dash
        ? new THREE.LineDashedMaterial({ color: MINT, dashSize: dash, gapSize: gap, transparent: true, opacity })
        : new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity });
      const l = new THREE.Line(g, m);
      if (dash) l.computeLineDistances();
      return l;
    };
    const a = mk(1.55, 0, 0, 0.55); a.rotation.set(1.25, 0, 0.3); out.push(a);
    const b = mk(2.05, 0.06, 0.09, 0.4); b.rotation.set(1.45, 0.4, -0.2); out.push(b);
    const c = mk(2.7, 0, 0, 0.18); c.rotation.set(1.1, -0.5, 0.6); out.push(c);
    // tick ring
    const ticks = [];
    for (let i = 0; i < 96; i++) {
      const ang = (i / 96) * Math.PI * 2;
      const len = i % 8 === 0 ? 0.16 : 0.06;
      ticks.push(new THREE.Vector3(Math.cos(ang) * 1.85, 0, Math.sin(ang) * 1.85), new THREE.Vector3(Math.cos(ang) * (1.85 + len), 0, Math.sin(ang) * (1.85 + len)));
    }
    const tk = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.45 }));
    tk.rotation.set(1.35, 0, 0);
    out.push(tk);
    return out;
  }, []);
  useFrame((_, dt) => {
    if (live.reduced) return;
    objs[0].rotation.z += dt * 0.12;
    objs[1].rotation.z -= dt * 0.08;
    objs[2].rotation.z += dt * 0.04;
    objs[3].rotation.z -= dt * 0.05;
  });
  return <group ref={ref}>{objs.map((o, i) => <primitive key={i} object={o} />)}</group>;
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
    if (!live.reduced) ref.current.rotation.y += dt * 0.012;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#cfffd8" size={0.022} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

function Rig({ small }) {
  const outer = useRef();
  const spinner = useRef();
  const { headGeo, headMat } = useHead();
  const cur = useRef({ ...POSES.hero });
  const tgt = useRef({ ...POSES.hero });
  const { camera } = useThree();

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    targetPose(tgt.current);
    const c = cur.current;
    const k = 1 - Math.exp(-d * 3.2);
    for (const key in tgt.current) c[key] += (tgt.current[key] - c[key]) * k;

    const xs = small ? 0.28 : 1;
    const ss = small ? 0.66 : 1;
    const away = small ? Math.min(window.scrollY / window.innerHeight, 1) : 0;
    outer.current.position.set(c.x * xs, c.y + (small ? 0.55 : 0), c.z - away * 2.5);
    outer.current.rotation.set(c.rx + (live.reduced ? 0 : state.pointer.y * 0.08), 0, c.rz - (live.reduced ? 0 : state.pointer.x * 0.06));
    outer.current.scale.setScalar(c.s * ss);

    const boost = Math.min(Math.abs(live.velocity) * 0.08, 6);
    spinner.current.rotation.y += d * (live.reduced ? 0.1 : c.spin + boost);

    if (!live.reduced) {
      camera.position.x += (state.pointer.x * 0.35 - camera.position.x) * k;
      camera.position.y += (state.pointer.y * 0.2 - camera.position.y) * k;
      camera.lookAt(0, 0, 0);
    }
    headMat.uniforms.uTime.value = state.clock.elapsedTime;
    headMat.uniforms.uGlow.value = c.glow * (1 - away * 0.65);
  });

  return (
    <group ref={outer}>
      <Rings />
      <group ref={spinner}>
        <group position={[0, -0.95, 0]}>
          <mesh geometry={headGeo} material={headMat} />
          <Grit count={small ? 1400 : 2600} />
          <Circuits />
          {/* neck */}
          <mesh position={[0, -0.34, 0]}>
            <cylinderGeometry args={[0.12, 0.165, 0.44, 48]} />
            <meshStandardMaterial color="#c3ccc6" metalness={1} roughness={0.22} envMapIntensity={1.4} />
          </mesh>
          {/* shank */}
          <mesh position={[0, -2.16, 0]}>
            <cylinderGeometry args={[0.165, 0.165, 3.2, 64]} />
            <meshStandardMaterial color="#b9c3bd" metalness={1} roughness={0.24} envMapIntensity={1.3} />
          </mesh>
          {/* engraved band */}
          <mesh position={[0, -1.15, 0]}>
            <cylinderGeometry args={[0.168, 0.168, 0.05, 64]} />
            <meshStandardMaterial color="#1c2420" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, -1.28, 0]}>
            <cylinderGeometry args={[0.168, 0.168, 0.015, 64]} />
            <meshBasicMaterial color={MINT} toneMapped={false} />
          </mesh>
          {/* chamfered end */}
          <mesh position={[0, -3.8, 0]}>
            <cylinderGeometry args={[0.165, 0.12, 0.08, 64]} />
            <meshStandardMaterial color="#b9c3bd" metalness={1} roughness={0.24} />
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
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor("#19191b")}
      fallback={<div className="webgl-fallback" />}
    >
      <Environment />
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 2, 3]} intensity={30} color={MINT} />
      <pointLight position={[-3, -1, 2]} intensity={12} color="#ffffff" />
      <Rig small={small} />
      <Dust count={small ? 260 : 600} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.2} luminanceSmoothing={0.25} radius={0.78} />
        <Vignette offset={0.22} darkness={0.78} />
      </EffectComposer>
    </Canvas>
  );
}
