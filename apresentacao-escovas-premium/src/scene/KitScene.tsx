import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { COLORWAYS, KitBrush, type Colorway } from './Brush';
import { StudioLights } from './StudioLights';
import type { ProgressRef } from './types';
import { useResponsiveCamera } from './useResponsiveCamera';
import { kitExplodeAt } from './stages';
import { CARD, makeCardBackTexture, makeCardTexture, makeGoiabadaTopTexture, makePrintTexture } from './kitTextures';
import odontoprevWordmark from '../assets/brand/odontoprev-horizontal.jpg';
import dentalPartnerTile from '../assets/brand/dental-partner.jpg';
import goiabadaLabel from '../assets/tex/goiabada-rotulo.webp';

const ss = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/* ---------------------------------------------------------------------------
 * Expositor original (fotos fornecidas): acrílico em L, base apoiada no balcão
 * e painel inclinado para trás, faixa frontal com as marcas, apoio inferior e
 * dois trilhos de presilhas que seguram quatro escovas no blister.
 * ------------------------------------------------------------------------- */
const PANEL = { w: 3.2, h: 4.3, t: 0.05, lean: 0.36, band: 0.68 };
const BASE = { w: 3.3, t: 0.05, d: 2.3, front: 0.2 };
const PACK_GAP = 0.75; // distância entre centros dos blisters
const CARD_Y = PANEL.band + 0.04 + CARD.h / 2; // centro do cartão no painel
const RAILS = [CARD_Y - 1.0, CARD_Y + 0.42]; // pescoço e meio do cabo
const BRUSH_Y = -CARD.h / 2 + 0.14; // base da escova no cartão
const BRUSH_Z = 0.075;
const BRUSH_SCALE = 0.5;

/** Placa arredondada para as bolhas do blister (geometria única por medida). */
const slabCache = new Map<string, THREE.BufferGeometry>();
function slab(w: number, h: number, d: number, r: number) {
  const key = `${w}|${h}|${d}|${r}`;
  const hit = slabCache.get(key);
  if (hit) return hit;
  const s = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const iw = w - 2 * r;
  const ih = h - 2 * r;
  s.moveTo(x, y - r);
  s.lineTo(x + iw, y - r);
  s.quadraticCurveTo(x + iw + r, y - r, x + iw + r, y);
  s.lineTo(x + iw + r, y + ih);
  s.quadraticCurveTo(x + iw + r, y + ih + r, x + iw, y + ih + r);
  s.lineTo(x, y + ih + r);
  s.quadraticCurveTo(x - r, y + ih + r, x - r, y + ih);
  s.lineTo(x - r, y);
  s.quadraticCurveTo(x - r, y - r, x, y - r);
  const bevel = Math.min(r, d / 2) * 0.9;
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 4,
    curveSegments: 10,
  });
  g.translate(0, 0, -(d - 2 * bevel) / 2);
  slabCache.set(key, g);
  return g;
}

type Mats = ReturnType<typeof useKitMaterials>;

function useKitMaterials() {
  const tex = useTexture({ odp: odontoprevWordmark, dp: dentalPartnerTile, label: goiabadaLabel });
  return useMemo(() => {
    tex.dp.colorSpace = THREE.SRGBColorSpace;
    tex.label.colorSpace = THREE.SRGBColorSpace;
    tex.label.anisotropy = 8;
    const dpImg = tex.dp.image as HTMLImageElement;
    const odpImg = tex.odp.image as HTMLImageElement;
    return {
      acrylic: new THREE.MeshPhysicalMaterial({
        color: '#f4fbff',
        transparent: true,
        opacity: 0.13,
        roughness: 0.04,
        clearcoat: 1,
        envMapIntensity: 2.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      acrylicSolid: new THREE.MeshPhysicalMaterial({
        color: '#eaf7ff',
        transparent: true,
        opacity: 0.32,
        roughness: 0.05,
        clearcoat: 1,
        envMapIntensity: 2.6,
        depthWrite: false,
      }),
      edge: new THREE.LineBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.7 }),
      bubble: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.16,
        roughness: 0.06,
        clearcoat: 1,
        envMapIntensity: 2.8,
        depthWrite: false,
      }),
      card: new THREE.MeshStandardMaterial({ map: makeCardTexture(dpImg), alphaTest: 0.5, roughness: 0.55 }),
      cardBack: new THREE.MeshStandardMaterial({ map: makeCardBackTexture(), alphaTest: 0.5, roughness: 0.7 }),
      odpPrint: new THREE.MeshBasicMaterial({ map: makePrintTexture(odpImg), transparent: true, toneMapped: false, depthWrite: false }),
      dpSticker: new THREE.MeshBasicMaterial({ map: tex.dp, toneMapped: false }),
      frost: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.42,
        roughness: 0.6,
        depthWrite: false,
      }),
      feet: new THREE.MeshPhysicalMaterial({ color: '#dfe6ea', roughness: 0.25, metalness: 0.2, clearcoat: 1 }),
      box: new THREE.MeshStandardMaterial({ color: '#f2f0f5', roughness: 0.82 }),
      boxInner: new THREE.MeshStandardMaterial({ color: '#d9d4e2', roughness: 0.9 }),
      label: new THREE.MeshPhysicalMaterial({ map: tex.label, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
      gold: new THREE.MeshStandardMaterial({ color: '#cfa957', metalness: 1, roughness: 0.32 }),
      tin: new THREE.MeshStandardMaterial({ color: '#b9b2a6', metalness: 1, roughness: 0.38 }),
      lid: new THREE.MeshPhysicalMaterial({
        color: '#eef3f6',
        transparent: true,
        opacity: 0.5,
        roughness: 0.28,
        clearcoat: 0.6,
        depthWrite: false,
      }),
      sweet: new THREE.MeshStandardMaterial({ map: makeGoiabadaTopTexture(), roughness: 0.42 }),
    };
  }, [tex]);
}

/** Peça de acrílico com bordas visíveis. */
function Acrylic({
  geo,
  mats,
  solid = false,
  ...rest
}: {
  geo: THREE.BufferGeometry;
  mats: Mats;
  solid?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 25), [geo]);
  return (
    <group {...rest}>
      <mesh geometry={geo} material={solid ? mats.acrylicSolid : mats.acrylic} renderOrder={2} />
      <lineSegments geometry={edges} material={mats.edge} renderOrder={3} />
    </group>
  );
}

const cardGeo = new THREE.PlaneGeometry(CARD.w, CARD.h);

/** Escova no blister: cartão, escova e as duas bolhas transparentes. */
function Pack({ colorway, mats }: { colorway: Colorway; mats: Mats }) {
  return (
    <group>
      <mesh geometry={cardGeo} material={mats.card} position={[0, 0, 0.001]} />
      <mesh geometry={cardGeo} material={mats.cardBack} position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]} />
      <group position={[0, BRUSH_Y, BRUSH_Z]} scale={BRUSH_SCALE}>
        <KitBrush colorway={colorway} print />
        <mesh geometry={slab(0.62, 4.75, 0.36, 0.14)} material={mats.bubble} position={[0, 2.22, 0.02]} renderOrder={4} />
        <mesh geometry={slab(0.96, 1.9, 0.88, 0.3)} material={mats.bubble} position={[0, 5.18, 0.2]} renderOrder={4} />
      </group>
    </group>
  );
}

function Display({ mats, packs }: { mats: Mats; packs: React.Ref<THREE.Group> }) {
  const geos = useMemo(
    () => ({
      base: new THREE.BoxGeometry(BASE.w, BASE.t, BASE.d),
      plate: new THREE.BoxGeometry(PANEL.w, PANEL.h, PANEL.t),
      ledge: new THREE.BoxGeometry(PANEL.w - 0.04, 0.035, 0.13),
      rail: new THREE.BoxGeometry(PANEL.w - 0.12, 0.04, 0.035),
      clip: new THREE.BoxGeometry(0.13, 0.11, 0.25),
    }),
    [],
  );
  const odpAspect = 867 / 294;
  return (
    <group>
      {/* Base apoiada no balcão, com quatro pés */}
      <Acrylic geo={geos.base} mats={mats} position={[0, 0.045 + BASE.t / 2, BASE.front - BASE.d / 2]} />
      {[-1, 1].flatMap((sx) =>
        [BASE.front - 0.16, BASE.front - BASE.d + 0.16].map((z) => (
          <mesh key={`${sx}${z}`} position={[sx * (BASE.w / 2 - 0.16), 0.0225, z]} material={mats.feet}>
            <cylinderGeometry args={[0.075, 0.075, 0.045, 20]} />
          </mesh>
        )),
      )}
      {/* Painel inclinado: tudo nele usa o sistema de coordenadas do painel */}
      <group position={[0, 0.045 + BASE.t, BASE.front - 0.06]} rotation={[-PANEL.lean, 0, 0]}>
        <Acrylic geo={geos.plate} mats={mats} position={[0, PANEL.h / 2, 0]} />
        <Acrylic geo={geos.ledge} mats={mats} solid position={[0, PANEL.band + 0.02, 0.07]} />
        {/* Faixa frontal levemente fosca, onde as marcas são impressas */}
        <mesh position={[0, PANEL.band / 2, PANEL.t / 2 + 0.001]} material={mats.frost} renderOrder={4}>
          <planeGeometry args={[PANEL.w - 0.02, PANEL.band - 0.02]} />
        </mesh>
        {/* Marcas fornecidas, impressas na faixa frontal sem alteração */}
        <mesh position={[-0.62, PANEL.band / 2, PANEL.t / 2 + 0.003]} material={mats.odpPrint} renderOrder={5}>
          <planeGeometry args={[1.25, 1.25 / odpAspect]} />
        </mesh>
        <mesh position={[0.92, PANEL.band / 2, PANEL.t / 2 + 0.003]} material={mats.dpSticker}>
          <planeGeometry args={[0.5, 0.5]} />
        </mesh>
        {RAILS.map((y) => (
          <group key={y} position={[0, y, 0]}>
            <Acrylic geo={geos.rail} mats={mats} solid position={[0, 0, 0.255]} />
            {[-2, -1, 0, 1, 2].map((k) => (
              <Acrylic key={k} geo={geos.clip} mats={mats} solid position={[k * PACK_GAP, 0, 0.15]} />
            ))}
          </group>
        ))}
        <group ref={packs}>
          {COLORWAYS.map((cw, i) => (
            <group key={i} position={[(i - 1.5) * PACK_GAP, CARD_Y, 0.04]}>
              <Pack colorway={cw} mats={mats} />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/* Kit de 12 escovas: três camadas de quatro blisters deitados numa bandeja aberta. */
const KIT12 = { cols: 4, layers: 3, gap: 0.74, layerH: 0.2, wall: 0.6 };
const TRAY = { w: 3 * KIT12.gap + CARD.w + 0.16, d: CARD.h + 0.16, t: 0.03 };

function KitDoze({ mats, layers }: { mats: Mats; layers: React.MutableRefObject<(THREE.Group | null)[]> }) {
  const { w, d, t } = TRAY;
  const h = KIT12.wall;
  return (
    <group>
      <mesh position={[0, t / 2, 0]} material={mats.box}>
        <boxGeometry args={[w, t, d]} />
      </mesh>
      {[-1, 1].map((sgn) => (
        <group key={sgn}>
          <mesh position={[sgn * (w / 2 - t / 2), h / 2, 0]} material={mats.box}>
            <boxGeometry args={[t, h, d]} />
          </mesh>
          <mesh position={[0, h / 2, sgn * (d / 2 - t / 2)]} material={mats.box}>
            <boxGeometry args={[w, h, t]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, t + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.boxInner}>
        <planeGeometry args={[w - 2 * t, d - 2 * t]} />
      </mesh>
      {/* Selo da marca na lateral frontal */}
      <mesh position={[w / 2 - 0.55, h / 2, d / 2 + 0.002]} material={mats.dpSticker}>
        <planeGeometry args={[0.44, 0.44]} />
      </mesh>
      {Array.from({ length: KIT12.layers }, (_, k) => (
        <group key={k} ref={(g) => void (layers.current[k] = g)} position={[0, 0.06 + k * KIT12.layerH, 0]}>
          {Array.from({ length: KIT12.cols }, (_, i) => (
            <group key={i} position={[(i - 1.5) * KIT12.gap, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <group rotation={[0, 0, Math.PI]}>
                <Pack colorway={COLORWAYS[(i + k) % 4]!} mats={mats} />
              </group>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/* Goiabada cascão em lata, com o rótulo da foto fornecida. */
const CAN = { r: 0.62, label: 0.6, rim: 0.05 };

function Lata({ mats, lid }: { mats: Mats; lid: React.Ref<THREE.Group> }) {
  const bodyH = CAN.label + CAN.rim * 2;
  return (
    <group>
      <mesh position={[0, CAN.rim / 2, 0]} material={mats.gold}>
        <cylinderGeometry args={[CAN.r + 0.012, CAN.r + 0.012, CAN.rim, 64]} />
      </mesh>
      <mesh position={[0, CAN.rim + CAN.label / 2, 0]} material={mats.label}>
        <cylinderGeometry args={[CAN.r, CAN.r, CAN.label, 96, 1, true, Math.PI]} />
      </mesh>
      <mesh position={[0, CAN.rim * 1.5 + CAN.label, 0]} material={mats.tin}>
        <cylinderGeometry args={[CAN.r + 0.008, CAN.r + 0.008, CAN.rim, 64]} />
      </mesh>
      <mesh position={[0, bodyH - 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.sweet}>
        <circleGeometry args={[CAN.r - 0.02, 48]} />
      </mesh>
      <group ref={lid} position={[0, bodyH - 0.06, 0]}>
        <mesh position={[0, 0.075, 0]} material={mats.lid} renderOrder={4}>
          <cylinderGeometry args={[CAN.r + 0.035, CAN.r + 0.04, 0.15, 64, 1, true]} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.lid} renderOrder={4}>
          <circleGeometry args={[CAN.r + 0.035, 64]} />
        </mesh>
        <mesh position={[0, 0.012, 0]} material={mats.lid} renderOrder={4}>
          <cylinderGeometry args={[CAN.r + 0.055, CAN.r + 0.055, 0.025, 64, 1, true]} />
        </mesh>
      </group>
    </group>
  );
}

type V3 = [number, number, number];
type Layout = {
  root: V3;
  scale: number;
  rotY: number;
  display: V3;
  kit: V3;
  kitRotY: number;
  kitLift: number;
  can: V3;
  canOpen: V3;
  packFan: number;
  cam: V3;
  camOpen: V3;
  look: V3;
  lookOpen: V3;
};

/** Composição para tela deitada (desktop, tablet deitado) e em pé (celular, tablet em pé). */
const LAYOUT: Record<'wide' | 'mid' | 'tall', Layout> = {
  wide: {
    root: [-1.45, -1.55, 0],
    scale: 0.92,
    rotY: -0.3,
    display: [0.75, 0, -0.9],
    kit: [-2.55, 0, 1.05],
    kitRotY: 0.38,
    kitLift: 1,
    can: [2.75, 0, 1.25],
    canOpen: [0.25, 0, 0.2],
    packFan: 0.3,
    cam: [0.2, 4.4, 14.6],
    camOpen: [0, 0.2, 0.8],
    look: [-0.3, 1.0, 0],
    lookOpen: [0, 0.75, 0],
  },
  // Tablet deitado e telas quase quadradas: menos largura livre à esquerda do painel.
  mid: {
    root: [-2.05, -1.35, 0],
    scale: 0.84,
    rotY: -0.3,
    display: [0.75, 0, -0.9],
    kit: [-2.35, 0, 1.15],
    kitRotY: 0.45,
    kitLift: 0.9,
    can: [2.55, 0, 1.3],
    canOpen: [0.2, 0, 0.2],
    packFan: 0.22,
    cam: [0.2, 4.0, 11.6],
    camOpen: [0, 0.3, 1.0],
    look: [-0.3, 0.9, 0],
    lookOpen: [0, 0.75, 0],
  },
  tall: {
    root: [0, -0.2, 0],
    scale: 0.9,
    rotY: -0.18,
    display: [0.2, 0, -2.0],
    kit: [-0.25, 0, 1.75],
    kitRotY: 0.58,
    kitLift: 0.5,
    can: [1.6, 0, 2.35],
    canOpen: [0, 0, 0.2],
    packFan: 0.12,
    cam: [0, 6.4, 10.6],
    camOpen: [0, 0.6, 1.6],
    look: [0, -0.7, 0.3],
    lookOpen: [0, 0.9, 0],
  },
};

const LABELS = {
  display: 'Expositor acrílico original',
  exposed: '4 escovas no blister',
  kit: '12 escovas fora do expositor',
  can: 'Goiabada de Ponte Nova (MG)',
};

function Label({ position, text, on }: { position: V3; text: string; on: boolean }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`kit-label ${on ? 'is-on' : ''}`} aria-hidden="true">
        {text}
      </div>
    </Html>
  );
}

export default function KitScene({ progress }: { progress: ProgressRef }) {
  const portrait = useResponsiveCamera(30, 52);
  const aspect = useThree((st) => st.size.width / Math.max(1, st.size.height));
  const layout = portrait ? 'tall' : aspect < 1.5 ? 'mid' : 'wide';
  const mats = useKitMaterials();
  const root = useRef<THREE.Group>(null);
  const display = useRef<THREE.Group>(null);
  const exposed = useRef<THREE.Group>(null);
  const kit = useRef<THREE.Group>(null);
  const kitLayers = useRef<(THREE.Group | null)[]>([]);
  const can = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const s = useRef(progress.current);
  const [exploded, setExploded] = useState(false);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const look = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, dt) => {
    s.current = THREE.MathUtils.damp(s.current, progress.current, 4, Math.min(dt, 0.1));
    const p = s.current;
    const e = kitExplodeAt(p);
    const isOn = e > 0.55;
    if (isOn !== exploded) setExploded(isOn);
    const t = state.clock.elapsedTime;
    const L = LAYOUT[layout];

    if (root.current) {
      root.current.position.set(...L.root);
      root.current.scale.setScalar(L.scale);
      root.current.rotation.y = L.rotY + Math.sin(t * 0.25) * 0.03 + e * 0.1;
    }

    // Montagem: o expositor sobe, as escovas descem pelo painel, o kit se
    // enche de blisters e a lata pousa com a tampa por último.
    const bDisplay = ss(0, 0.06, p);
    if (display.current) {
      display.current.position.set(L.display[0], L.display[1] - (1 - bDisplay) * 0.7, L.display[2] - e * 0.9);
      display.current.rotation.y = (1 - bDisplay) * 0.5;
    }
    exposed.current?.children.forEach((c, i) => {
      const b = ss(0.03 + i * 0.022, 0.1 + i * 0.022, p);
      c.position.set((i - 1.5) * PACK_GAP * (1 + e * L.packFan), CARD_Y + (1 - b) * 4.2 + e * 0.35, 0.04 + (1 - b) * 0.8 + e * 1.25);
      c.rotation.set(-e * 0.12, (i - 1.5) * -0.16 * e, (i - 1.5) * -0.05 * e);
    });

    if (kit.current) {
      const bBox = ss(0, 0.05, p);
      kit.current.position.set(L.kit[0] - e * 0.15, L.kit[1] - (1 - bBox) * 0.6, L.kit[2] - e * 0.5);
      kit.current.rotation.y = L.kitRotY + e * 0.12;
    }
    // Cada camada de 4 blisters cai na bandeja; abertas, sobem e se inclinam para a câmera.
    kitLayers.current.forEach((g, k) => {
      if (!g) return;
      const b = ss(0.04 + k * 0.03, 0.11 + k * 0.03, p);
      g.position.y = 0.06 + k * KIT12.layerH + (1 - b) * (3.4 + k * 0.6) + e * L.kitLift * (0.7 + k * 0.85);
      g.position.z = e * (0.1 - k * 0.32);
      g.rotation.x = e * 0.42;
      g.children.forEach((c, i) => {
        c.position.x = (i - 1.5) * KIT12.gap * (1 + e * 0.1);
      });
    });

    if (can.current) {
      const b = ss(0.08, 0.14, p);
      can.current.position.set(L.can[0] + e * L.canOpen[0], L.can[1] + (1 - b) * 3.2 + e * L.canOpen[1], L.can[2] + e * L.canOpen[2]);
      can.current.rotation.y = -0.15 + (1 - b) * 1.2;
    }
    if (lid.current) {
      const b = ss(0.11, 0.16, p);
      lid.current.position.y = CAN.label + CAN.rim * 2 - 0.06 + (1 - b) * 1.4 + e * 0.75;
      lid.current.position.x = e * 0.35;
      lid.current.rotation.z = -e * 0.42;
    }

    // Câmera amortecida pelo tempo (mesmo ritmo em telas de 60 ou 120 Hz).
    const k = 1 - Math.exp(-4 * Math.min(dt, 0.1));
    camTarget.set(L.cam[0] + e * L.camOpen[0], L.cam[1] + e * L.camOpen[1], L.cam[2] + e * L.camOpen[2]);
    state.camera.position.lerp(camTarget, k);
    lookTarget.set(L.look[0] + e * L.lookOpen[0], L.look[1] + e * L.lookOpen[1], L.look[2] + e * L.lookOpen[2]);
    look.current.lerp(lookTarget, k);
    state.camera.lookAt(look.current);
  });

  return (
    <>
      <StudioLights />
      <group ref={root}>
        <group ref={display}>
          <Display mats={mats} packs={exposed} />
          <Label position={[0, 4.75, -1.6]} text={LABELS.display} on={exploded} />
          <Label position={[0, 0.5, 1.85]} text={LABELS.exposed} on={exploded} />
        </group>
        <group ref={kit}>
          <KitDoze mats={mats} layers={kitLayers} />
          <Label position={[0, 4.3, -0.6]} text={LABELS.kit} on={exploded} />
        </group>
        <group ref={can}>
          <Lata mats={mats} lid={lid} />
          <Label position={[0, 2.0, 0]} text={LABELS.can} on={exploded} />
        </group>
        <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={16} blur={2.6} far={4} resolution={512} color="#000814" />
      </group>
    </>
  );
}
