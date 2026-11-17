import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { BRUSH, bristlePositions, createBrushBodyGeometry, seeded, tuftPositions } from './brushGeometry';
import { makeHandlePrintTexture } from './kitTextures';

export type Colorway = { handle: string; bristle: string };

export const COLORWAYS: Colorway[] = [
  { handle: '#F1F1EE', bristle: '#D9244F' },
  { handle: '#1AB6DE', bristle: '#FF4D94' },
  { handle: '#6A1FB0', bristle: '#2338D9' },
  { handle: '#169A57', bristle: '#F2C21B' },
];

let bodyGeo: THREE.BufferGeometry | null = null;
function sharedBody() {
  if (!bodyGeo) bodyGeo = createBrushBodyGeometry();
  return bodyGeo;
}

function handleMaterial(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
    sheen: 0.2,
  });
}

/** Escova principal: 5.460 filamentos em uma única InstancedMesh. */
export function HeroBrush({
  colorway,
  count = 5460,
  bristleGroupRef,
}: {
  colorway: Colorway;
  count?: number;
  /** Grupo das cerdas, com origem na face da cabeça (escala em Z faz as cerdas crescerem). */
  bristleGroupRef?: RefObject<THREE.Group | null>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.0058, 0.0064, 0.5, 6, 1);
    g.translate(0, 0.25, 0);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0 }),
    [],
  );
  const body = useMemo(() => handleMaterial(colorway.handle), [colorway.handle]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const pos = bristlePositions(count);
    const rnd = seeded(5460);
    const dummy = new THREE.Object3D();
    const base = new THREE.Color(colorway.bristle);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = pos[i * 2]!;
      const y = pos[i * 2 + 1]!;
      dummy.position.set(x, y, -0.01);
      // Leve abertura das cerdas na borda e variação natural de altura.
      const edge = Math.min(1, Math.hypot(x / BRUSH.headHalfW, (y - BRUSH.headCenterY) / BRUSH.headHalfL));
      dummy.rotation.set(-(y - BRUSH.headCenterY) * 0.06 * edge + (rnd() - 0.5) * 0.05, x * 0.12 * edge + (rnd() - 0.5) * 0.05, 0);
      dummy.scale.set(1, 1, 0.94 + rnd() * 0.08);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      c.copy(base).offsetHSL(0, 0, (rnd() - 0.5) * 0.08);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [colorway.bristle, count]);

  return (
    <group>
      <mesh geometry={sharedBody()} material={body} castShadow />
      <group ref={bristleGroupRef} position={[0, 0, BRUSH.faceZ]}>
        <instancedMesh ref={mesh} args={[geo, mat, count]} />
      </group>
    </group>
  );
}

let printMat: THREE.Material | null = null;
let printGeo: THREE.BufferGeometry | null = null;
/** Inscrição do cabo, compartilhada por todas as escovas do kit. */
function handlePrint() {
  if (!printMat || !printGeo) {
    printGeo = new THREE.PlaneGeometry(1.7, 0.2125);
    printMat = new THREE.MeshStandardMaterial({
      map: makeHandlePrintTexture(),
      transparent: true,
      roughness: 0.4,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  }
  return { geo: printGeo, mat: printMat };
}

/** Versão leve para o kit: 40 tufos por escova, com a inscrição no cabo. */
export function KitBrush({ colorway, print = false }: { colorway: Colorway; print?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tufts = useMemo(() => tuftPositions(), []);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.052, 0.045, 0.42, 10, 1);
    g.translate(0, 0.21, 0);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colorway.bristle, roughness: 0.75 }),
    [colorway.bristle],
  );
  const body = useMemo(() => handleMaterial(colorway.handle), [colorway.handle]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    tufts.forEach(([x, y], i) => {
      dummy.position.set(x, y, BRUSH.faceZ - 0.01);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [tufts]);

  return (
    <group>
      <mesh geometry={sharedBody()} material={body} />
      <instancedMesh ref={mesh} args={[geo, mat, tufts.length]} />
      {print ? (
        <mesh
          geometry={handlePrint().geo}
          material={handlePrint().mat}
          position={[0, 1.75, BRUSH.faceZ + 0.004]}
          rotation={[0, 0, -Math.PI / 2]}
        />
      ) : null}
    </group>
  );
}
