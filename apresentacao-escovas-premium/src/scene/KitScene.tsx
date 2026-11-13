import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Html, RoundedBox, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { COLORWAYS, KitBrush } from './Brush';
import { StudioLights } from './StudioLights';
import type { ProgressRef } from './types';
import odontoprevTile from '../assets/brand/odontoprev-vertical.jpg';
import dentalPartnerTile from '../assets/brand/dental-partner.jpg';

const ss = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);
const W = 3.0; // largura do expositor
const FRONT_H = 1.15;
const BACK_H = 3.3;
const D = 1.4;

function useAcrylic() {
  return useMemo(
    () => ({
      face: new THREE.MeshPhysicalMaterial({
        color: '#f4fbff',
        transparent: true,
        opacity: 0.14,
        roughness: 0.04,
        metalness: 0,
        clearcoat: 1,
        envMapIntensity: 2.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      edge: new THREE.LineBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.75 }),
    }),
    [],
  );
}

/** Placa de acrílico com bordas percebidas (linhas) e reflexo controlado. */
function Plate({ geo, position, rotation }: { geo: THREE.BufferGeometry; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const m = useAcrylic();
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 25), [geo]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo} material={m.face} renderOrder={2} />
      <lineSegments geometry={edges} material={m.edge} renderOrder={3} />
    </group>
  );
}

function Display() {
  const { odp, dp } = useTexture({ odp: odontoprevTile, dp: dentalPartnerTile });
  odp.colorSpace = THREE.SRGBColorSpace;
  dp.colorSpace = THREE.SRGBColorSpace;
  const geos = useMemo(() => {
    const t = 0.04;
    const side = new THREE.Shape();
    side.moveTo(D / 2, 0);
    side.lineTo(-D / 2, 0);
    side.lineTo(-D / 2, BACK_H);
    side.lineTo(-D / 2 + 0.2, BACK_H);
    side.quadraticCurveTo(-D / 2 + 0.5, BACK_H - 0.05, -D / 2 + 0.55, BACK_H - 0.4);
    side.lineTo(D / 2, 0.12);
    side.lineTo(D / 2, 0);
    const sideGeo = new THREE.ExtrudeGeometry(side, { depth: t, bevelEnabled: false });
    sideGeo.rotateY(Math.PI / 2);
    return {
      base: new THREE.BoxGeometry(W + 0.08, t, D + 0.08),
      back: new THREE.BoxGeometry(W, BACK_H, t),
      front: new THREE.BoxGeometry(W, FRONT_H, t),
      inner: new THREE.BoxGeometry(W, FRONT_H, t),
      top: new THREE.BoxGeometry(W, t, 0.75),
      side: sideGeo,
    };
  }, []);
  return (
    <group>
      <Plate geo={geos.base} position={[0, 0.02, 0]} />
      <Plate geo={geos.back} position={[0, BACK_H / 2, -D / 2]} />
      <Plate geo={geos.front} position={[0, FRONT_H / 2, D / 2]} />
      <Plate geo={geos.inner} position={[0, FRONT_H / 2, D / 2 - 0.75]} />
      <Plate geo={geos.top} position={[0, FRONT_H, D / 2 - 0.375]} />
      <Plate geo={geos.side} position={[-W / 2 - 0.02, 0, 0]} />
      <Plate geo={geos.side} position={[W / 2 - 0.02, 0, 0]} />
      {/* Marcas fornecidas aplicadas como adesivos, sem alteração de desenho ou cor. */}
      <mesh position={[-0.95, 0.32, D / 2 + 0.025]}>
        <planeGeometry args={[0.56, 0.42]} />
        <meshBasicMaterial map={odp} toneMapped={false} />
      </mesh>
      <mesh position={[0.95, 0.32, D / 2 + 0.025]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial map={dp} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Goiabada() {
  const wrap = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.85, transparent: true, opacity: 0.32, transmission: 0.2 }),
    [],
  );
  return (
    <group>
      <RoundedBox args={[0.92, 0.34, 0.56]} radius={0.05} smoothness={4} position={[0, 0.17, 0]}>
        <meshPhysicalMaterial color="#7a1a18" roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[1.02, 0.42, 0.66]} radius={0.06} smoothness={3} position={[0, 0.2, 0]} material={wrap} />
    </group>
  );
}

const LABELS = [
  { key: 'display', text: 'Expositor acrílico de balcão' },
  { key: 'exposed', text: '4 escovas expostas' },
  { key: 'bonus', text: '12 escovas bonificadas' },
  { key: 'gift', text: 'Doce de goiaba de Minas Gerais' },
] as const;

function Label({ position, text, on }: { position: [number, number, number]; text: string; on: boolean }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`kit-label ${on ? 'is-on' : ''}`} aria-hidden="true">
        {text}
      </div>
    </Html>
  );
}

export default function KitScene({ progress }: { progress: ProgressRef }) {
  const root = useRef<THREE.Group>(null);
  const display = useRef<THREE.Group>(null);
  const exposed = useRef<THREE.Group>(null);
  const bonus = useRef<THREE.Group>(null);
  const gift = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  const s = useRef(0);
  const [exploded, setExploded] = useState(false);
  const camTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    s.current = THREE.MathUtils.damp(s.current, progress.current, 4, dt);
    const p = s.current;
    const e = ss(0.12, 0.42, p) - ss(0.72, 0.95, p);
    const isOn = e > 0.55;
    if (isOn !== exploded) setExploded(isOn);
    const t = state.clock.elapsedTime;
    if (root.current) root.current.rotation.y = -0.42 + Math.sin(t * 0.25) * 0.04 + e * 0.12;
    if (display.current) display.current.position.set(0, 0, -e * 0.9);
    if (exposed.current) {
      exposed.current.position.set(0, e * 2.1, D / 2 - 0.4 + e * 0.4);
      exposed.current.children.forEach((c, i) => {
        c.position.x = (-1.05 + i * 0.7) * (1 + e * 0.45);
        c.rotation.z = (i - 1.5) * -0.08 * e;
      });
    }
    if (bonus.current) bonus.current.position.set(-2.95 - e * 0.3, 0.05, 0.8 + e * 0.45);
    layers.current.forEach((l, i) => {
      if (l) l.position.y = 0.1 + i * (0.16 + e * 0.32);
    });
    if (gift.current) gift.current.position.set(2.45 + e * 0.9, e * 0.55, 1.05 + e * 0.4);
    camTarget.set(0.4, 3.1 + e * 0.6, 13.2 + e * 2.8);
    state.camera.position.lerp(camTarget, 0.08);
    state.camera.lookAt(0, 1.5 + e * 0.5, 0);
  });

  return (
    <>
      <StudioLights />
      <group ref={root} position={[-1.25, -1.2, 0]}>
        <group ref={display}>
          <Display />
          <Label position={[0, 3.75, -0.5]} text={LABELS[0].text} on={exploded} />
        </group>
        <group ref={exposed}>
          {COLORWAYS.map((cw, i) => (
            <group key={i} scale={0.5} position={[-1.05 + i * 0.7, 0.07, 0]} rotation={[0, 0, 0]}>
              <KitBrush colorway={cw} />
            </group>
          ))}
          <Label position={[0, 3.7, 0.4]} text={LABELS[1].text} on={exploded} />
        </group>
        <group ref={bonus}>
          {[0, 1, 2].map((layer) => (
            <group key={layer} ref={(g) => void (layers.current[layer] = g)}>
              {COLORWAYS.map((cw, i) => (
                <group key={i} scale={0.5} position={[1.5, 0, -0.45 + i * 0.3]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                  <KitBrush colorway={cw} />
                </group>
              ))}
            </group>
          ))}
          <Label position={[0, 1.6, 0]} text={LABELS[2].text} on={exploded} />
        </group>
        <group ref={gift}>
          <Goiabada />
          <Label position={[0, 0.95, 0]} text={LABELS[3].text} on={exploded} />
        </group>
        <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={14} blur={2.6} far={4} resolution={512} color="#000814" />
      </group>
    </>
  );
}
