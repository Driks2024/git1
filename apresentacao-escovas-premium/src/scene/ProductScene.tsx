import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COLORWAYS, HeroBrush } from './Brush';
import { BRUSH } from './brushGeometry';
import { StudioLights } from './StudioLights';
import { useResponsiveCamera } from './useResponsiveCamera';
import type { ProgressRef } from './types';
import { productStageOf } from './stages';

const ss = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

type Pose = { pos: THREE.Vector3; rot: THREE.Euler; scale: number; pivot: THREE.Vector3 };

// A: visão geral (escova montada). B: macro das cerdas. Versões para tela deitada e em pé.
const POSES: Record<'wide' | 'tall', { A: Pose; B: Pose }> = {
  wide: {
    A: { pos: new THREE.Vector3(-1.2, -0.05, 0), rot: new THREE.Euler(-0.3, 0.45, -0.62), scale: 0.82, pivot: new THREE.Vector3(0, 3, 0) },
    B: { pos: new THREE.Vector3(-0.55, -0.1, 5.3), rot: new THREE.Euler(0.95, -0.55, -0.4), scale: 1, pivot: new THREE.Vector3(0, BRUSH.headCenterY, 0.2) },
  },
  tall: {
    A: { pos: new THREE.Vector3(0, 1.35, 0), rot: new THREE.Euler(-0.22, 0.42, -0.2), scale: 0.66, pivot: new THREE.Vector3(0, 3, 0) },
    B: { pos: new THREE.Vector3(0, 1.25, 4.4), rot: new THREE.Euler(0.95, -0.55, -0.25), scale: 1, pivot: new THREE.Vector3(0, BRUSH.headCenterY, 0.2) },
  },
};


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

/**
 * Coreografia por rolagem:
 * 0–0,30  montagem: o cabo sobe e gira até a posição, as 5.460 cerdas crescem
 *         a partir da cabeça e a capa desce e encaixa;
 * 0,34–0,52  a capa se solta e se afasta;
 * 0,56–0,90  a câmera aproxima até a macro das cerdas.
 */
export default function ProductScene({ progress }: { progress: ProgressRef }) {
  const portrait = useResponsiveCamera(30, 50);
  const { A, B } = POSES[portrait ? 'tall' : 'wide'];
  const [stage, setStage] = useState(-1);
  const stageLocal = useRef(-1);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const bristles = useRef<THREE.Group>(null);
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
  const qa = useMemo(() => new THREE.Quaternion().setFromEuler(A.rot), [A]);
  const qb = useMemo(() => new THREE.Quaternion().setFromEuler(B.rot), [B]);

  useFrame((state, dt) => {
    s.current = THREE.MathUtils.damp(s.current, progress.current, 4.5, dt);
    const p = s.current;
    const build = ss(-0.1, 0.2, p); // cabo chegando (já entrando no início)
    const grow = ss(0.08, 0.26, p); // cerdas crescendo
    const capIn = ss(0.2, 0.3, p); // capa encaixando
    const capOut = ss(0.34, 0.52, p); // capa saindo
    const m = ss(0.56, 0.9, p); // macro
    const t = state.clock.elapsedTime;
    const idle = (1 - m) * 0.06;

    if (outer.current && inner.current) {
      outer.current.position.lerpVectors(A.pos, B.pos, m);
      outer.current.position.y += Math.sin(t * 0.8) * idle;
      q.slerpQuaternions(qa, qb, m);
      outer.current.quaternion.copy(q);
      outer.current.rotateY((1 - build) * 1.6);
      outer.current.rotateZ(Math.sin(t * 0.5) * idle * 0.5);
      outer.current.scale.setScalar(THREE.MathUtils.lerp(A.scale, B.scale, m));
      inner.current.position.copy(A.pivot).lerp(B.pivot, m).multiplyScalar(-1);
    }
    if (body.current) {
      body.current.position.y = (1 - build) * -3.2;
      body.current.visible = build > 0.001;
    }
    if (bristles.current) {
      bristles.current.scale.set(1, 1, Math.max(0.001, grow));
      bristles.current.visible = grow > 0.002;
    }
    if (cap.current) {
      const dropY = (1 - capIn) * 3.2;
      cap.current.position.set(capOut * 0.9, BRUSH.headCenterY + dropY + capOut * 1.1, 0.42 + capOut * 1.6);
      cap.current.rotation.set(capOut * 0.5 + (1 - capIn) * 0.6, capOut * -0.4, capOut * 0.3);
      capMat.opacity = Math.min(capIn * 1.2, 1) * (1 - capOut * 0.75) * (1 - m);
      cap.current.visible = capIn > 0.01 && m < 0.98;
    }
    // Etiquetas da visão geral só aparecem com a escova montada.
    const next = p < 0.2 ? -1 : productStageOf(p);
    if (next !== stageLocal.current) {
      stageLocal.current = next;
      setStage(next);
    }
  });

  return (
    <>
      <StudioLights />
      <group ref={outer}>
        <group ref={inner}>
          <group ref={body}>
            <HeroBrush colorway={COLORWAYS[1]!} bristleGroupRef={bristles} />
          </group>
          <group ref={cap}>
            <RoundedBox args={[0.72, 1.42, 0.7]} radius={0.16} smoothness={5} material={capMat} />
          </group>
          <Hotspot position={[0.42, 2.3, 0.14]} label="Cabo" visible={stage === 0} />
          <Hotspot position={[0.45, 4.6, 0.14]} label="Cabeça" visible={stage === 0} />
          <Hotspot position={[0.6, BRUSH.headCenterY + 1.3, 1.6]} label="Capa protetora" visible={stage === 1} />
          <Hotspot position={[0.05, BRUSH.headCenterY + 0.25, 0.68]} label="5.460 cerdas" visible={stage === 2} />
        </group>
      </group>
    </>
  );
}
