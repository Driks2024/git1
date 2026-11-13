import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COLORWAYS, HeroBrush } from './Brush';
import { BRUSH } from './brushGeometry';
import { StudioLights } from './StudioLights';
import type { ProgressRef } from './types';

const ss = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

// Pose A: visão geral em diagonal, à direita do texto. Pose B: macro das cerdas.
const A = { pos: new THREE.Vector3(-1.2, -0.05, 0), rot: new THREE.Euler(-0.3, 0.45, -0.62), scale: 0.82, pivot: new THREE.Vector3(0, 3, 0) };
const B = { pos: new THREE.Vector3(-0.55, -0.1, 5.3), rot: new THREE.Euler(0.95, -0.55, -0.4), scale: 1, pivot: new THREE.Vector3(0, BRUSH.headCenterY, 0.2) };

function Hotspot({ position, label, visible }: { position: [number, number, number]; label: string; visible: boolean }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`hotspot ${visible ? 'is-on' : ''}`} aria-hidden="true">
        <span className="hotspot__dot" />
        <span className="hotspot__label">{label}</span>
      </div>
    </Html>
  );
}

export default function ProductScene({ progress, onStage }: { progress: ProgressRef; onStage?: (stage: number) => void }) {
  const [stage, setStage] = useState(0);
  const stageLocal = useRef(0);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const capMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#e9f6ff',
        roughness: 0.18,
        transmission: 0.92,
        thickness: 0.35,
        ior: 1.45,
        transparent: true,
        opacity: 1,
      }),
    [],
  );
  const s = useRef(0);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const qa = useMemo(() => new THREE.Quaternion().setFromEuler(A.rot), []);
  const qb = useMemo(() => new THREE.Quaternion().setFromEuler(B.rot), []);

  useFrame((state, dt) => {
    s.current = THREE.MathUtils.damp(s.current, progress.current, 4.5, dt);
    const p = s.current;
    const m = ss(0.42, 0.86, p);
    const c = ss(0.12, 0.4, p);
    const t = state.clock.elapsedTime;
    const idle = (1 - m) * 0.06;
    if (outer.current && inner.current) {
      outer.current.position.lerpVectors(A.pos, B.pos, m);
      outer.current.position.y += Math.sin(t * 0.8) * idle;
      q.slerpQuaternions(qa, qb, m);
      outer.current.quaternion.copy(q);
      outer.current.rotateZ(Math.sin(t * 0.5) * idle * 0.5);
      outer.current.scale.setScalar(THREE.MathUtils.lerp(A.scale, B.scale, m));
      inner.current.position.copy(A.pivot).lerp(B.pivot, m).multiplyScalar(-1);
    }
    if (cap.current) {
      cap.current.position.set(c * 0.9, BRUSH.headCenterY + c * 1.1, 0.42 + c * 1.6);
      cap.current.rotation.set(c * 0.5, c * -0.4, c * 0.3);
      capMat.opacity = 1 - c * 0.75;
    }
    const next = p < 0.14 ? 0 : p < 0.5 ? 1 : 2;
    if (next !== stageLocal.current) {
      stageLocal.current = next;
      setStage(next);
      onStage?.(next);
    }
  });

  return (
    <>
      <StudioLights />
      <group ref={outer}>
        <group ref={inner}>
          <HeroBrush colorway={COLORWAYS[1]!} />
          <group ref={cap}>
            <RoundedBox args={[0.72, 1.42, 0.7]} radius={0.16} smoothness={5} material={capMat} />
          </group>
          <StageHotspots stage={stage} />
        </group>
      </group>
    </>
  );
}

function StageHotspots({ stage }: { stage: number }) {
  return (
    <>
      <Hotspot position={[0.42, 2.3, 0.14]} label="Cabo" visible={stage === 0} />
      <Hotspot position={[0.45, 4.6, 0.14]} label="Cabeça" visible={stage === 0} />
      <Hotspot position={[0.6, BRUSH.headCenterY + 1.3, 1.6]} label="Capa protetora" visible={stage === 1} />
      <Hotspot position={[0.05, BRUSH.headCenterY + 0.25, 0.68]} label="5.460 cerdas" visible={stage === 2} />
    </>
  );
}
