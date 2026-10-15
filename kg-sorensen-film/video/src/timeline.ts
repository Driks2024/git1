/**
 * Mode A timeline: Remotion frame → FilmState, for a 1080×1920 frame.
 *
 * Organised per scene. Every scene contributes keyframes (absolute frames) to
 * the shared channels — camera, pose, explode, light… — and the channels are
 * merged into ONE track each, so transitions across scene borders are
 * continuous by construction. Effects that only exist inside a scene (the 3D
 * titles, the diamond core, the foam block, the snap flash…) live in that
 * scene's `fx` function.
 *
 * Pure: the same frame always gives the same state (no clocks, no randomness).
 */
import * as THREE from 'three';
import { Track, type Key } from '../../shared/util/keys';
import {
  bump,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeInOutQuart,
  easeInOutSine,
  easeOutCubic,
  easeOutExpo,
  linear,
  range,
  smooth,
  windowed,
  type Ease,
} from '../../shared/util/ease';
import { defaultState, type FilmState, type Vec3 } from '../../shared/stage/state';
import { GRITS, SHAPES, burLength, headOuter, type ShapeId, type Variant } from '../../shared/bur/profiles';
import { BEATS, COPY, SCENES, VIDEO, at, type SceneId } from './config';
import type { ExtraTitle } from './stage/TitleRig';

/** A bur-space point (mm, y from the butt) the overlay wants on screen. */
export type Probe = { id: string; p: Vec3 };
export type VideoState = FilmState & { extras: ExtraTitle[]; probes: Probe[] };

// ---------------------------------------------------------------- poses (rad)
const PI = Math.PI;
export const POSE = {
  /** poster diagonal, steeper than Mode B so it lives in a portrait frame */
  heroIn: [0.22, -0.62, 0.44] as Vec3,
  hero: [0.18, 0.04, 0.44] as Vec3,
  vertical: [0, 0, 0] as Vec3,
  exploded: [0.15, 0.4, 0] as Vec3,
  care: [0, 0, PI] as Vec3,
  promo: [0.16, -0.08, -0.5] as Vec3,
};
const PIVOT = 9.6;

/** Bur-space point (mm, y from the butt) → world, for a pose. */
export function burToWorld(rot: Vec3, pos: Vec3, p: Vec3): Vec3 {
  const v = new THREE.Vector3(p[0], p[1] - PIVOT, p[2]);
  v.applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(...pos));
  return [v.x, v.y, v.z];
}

// ---------------------------------------------------------------- channels
type Channels = {
  cam: Key<Vec3>[];
  target: Key<Vec3>[];
  fov: Key<number>[];
  roll: Key<number>[];
  burRot: Key<Vec3>[];
  burPos: Key<Vec3>[];
  burSpin: Key<number>[];
  explode: Key<number>[];
  dissolve: Key<number>[];
  env: Key<number>[];
  envRot: Key<number>[];
  rim: Key<number>[];
  pool: Key<Vec3>[];
  beam: Key<number>[];
  dof: Key<number>[];
  grid: Key<number>[];
  kicker: Key<Vec3>[];
  kickerI: Key<number>[];
};
type ChannelName = keyof Channels;

export type SceneTimeline = {
  id: SceneId;
  keys: Partial<Channels>;
  /** local effects, called for every frame (each scene windows itself) */
  fx?: (s: VideoState, f: number) => void;
};

// ---------------------------------------------------------------- 01 dark
const KICK_FROM = burToWorld(POSE.heroIn, [0, 0, 0], [0.9, 1.0, 1.6]);
const KICK_TO = burToWorld(POSE.heroIn, [0, 0, 0], [-0.9, 18.6, 2.4]);

const scene01: SceneTimeline = {
  id: 'dark',
  keys: {
    cam: [
      [0, [1.9, 1.6, 60]],
      [89, [1.2, 0.9, 51], easeInOutSine],
    ],
    target: [[0, [0, 0.2, 0]]],
    fov: [[0, 30]],
    roll: [[0, 0]],
    burRot: [[0, POSE.heroIn]],
    burPos: [[0, [0, 0, 0]]],
    burSpin: [
      [0, -1.45],
      [89, -1.12, linear],
    ],
    explode: [[0, 0]],
    dissolve: [[0, 0]],
    env: [
      [0, 0.012],
      [60, 0.03],
      [89, 0.08, easeInOutSine],
    ],
    envRot: [[0, -1.3]],
    rim: [[0, 0]],
    pool: [
      [0, [0.5, 0.5, 0]],
      [89, [0.5, 0.5, 0.08]],
    ],
    beam: [[0, 0]],
    dof: [[0, 0]],
    grid: [[0, 0]],
    kicker: [
      [6, [KICK_FROM[0] + 2.2, KICK_FROM[1], KICK_FROM[2] + 2.4]],
      [70, [KICK_TO[0] - 1.6, KICK_TO[1], KICK_TO[2] + 3.6], easeInOutSine],
    ],
    kickerI: [
      [0, 0],
      [8, 18],
      [66, 18],
      [84, 0],
    ],
  },
  fx: (s, f) => {
    s.ringGlow += bump(f, BEATS.ringPing, 5) * 2.4;
    // the faintest lime edge in the dark, so the silhouette reads on a phone
    s.rim += windowed(f, 10, 100, 30, 20) * 0.12;
  },
};

// ---------------------------------------------------------------- 02 reveal
const scene02: SceneTimeline = {
  id: 'reveal',
  keys: {
    cam: [[at('reveal', 108), [-0.7, 0.5, 42.5], easeInOutSine]],
    target: [[at('reveal', 108), [0, 0.6, 0], easeInOutSine]],
    burRot: [[at('reveal', 106), POSE.hero, easeInOutSine]],
    burSpin: [[at('reveal', 106), 0, easeOutCubic]],
    env: [
      [at('reveal', 30), 0.55, easeInOutSine],
      [at('reveal', 62), 1.0, easeInOutSine],
    ],
    envRot: [[at('reveal', 120), 0.35, easeInOutSine]],
    rim: [
      [at('reveal', 22), 0.04],
      [at('reveal', 36), 0.95, easeOutCubic],
      [at('reveal', 82), 0.24, easeInOutSine],
    ],
    pool: [[at('reveal', 60), [0.5, 0.48, 0.58]]],
    beam: [
      [at('reveal', 10), 0],
      [at('reveal', 62), 0.14],
    ],
  },
  fx: (s, f) => {
    const t = windowed(f, at('reveal', 6), at('macro', 14), 14, 16);
    if (t > 0) {
      s.title = {
        ...s.title,
        text: COPY.reveal.title3d,
        weight: 100,
        tracking: -0.01,
        opacity: t * 0.94,
        reveal: easeOutExpo(range(f, at('reveal', 10), at('reveal', 58))),
        blur: 0,
        pos: [0, 4.2, -15],
        height: 4.1,
        billboard: true,
      };
    }
  },
};

// ---------------------------------------------------------------- 03 macro
export type MacroStop = { id: string; target: Vec3; cam: Vec3; roll: number };
export const MACRO_STOPS: MacroStop[] = [
  { id: 'crystals', target: [0, 7.72, 0.62], cam: [1.9, 8.8, 5.6], roll: 0.34 },
  { id: 'matrix', target: [0, 6.7, 0.42], cam: [-1.7, 6.2, 4.6], roll: -0.3 },
  { id: 'ring', target: [0, 2.3, 0.8], cam: [1.3, 2.75, 4.9], roll: 0.36 },
  { id: 'logo', target: [0, -1.05, 0.8], cam: [-0.5, -0.85, 5.6], roll: -0.22 },
  { id: 'butt', target: [0, -9.45, 0.48], cam: [1.75, -10.85, 3.5], roll: 0.3 },
];
export const macroArrive = (i: number) => BEATS.macro0 + i * BEATS.macroStep + 12;
export const macroLeave = (i: number) => BEATS.macro0 + (i + 1) * BEATS.macroStep;

const macroKeys = (): Partial<Channels> => {
  const cam: Key<Vec3>[] = [];
  const target: Key<Vec3>[] = [];
  const roll: Key<number>[] = [];
  MACRO_STOPS.forEach((m, i) => {
    const a = macroArrive(i);
    const l = macroLeave(i);
    const ease: Ease = i === 0 ? easeInOutCubic : easeInOutQuart;
    // glide in, then a slow push + drift while holding
    const drift: Vec3 = [m.cam[0] * 0.9, m.cam[1] - 0.14, m.target[2] + (m.cam[2] - m.target[2]) * 0.86];
    cam.push([a, m.cam, ease], [l, drift, linear]);
    target.push([a, m.target, ease], [l, [m.target[0], m.target[1] - 0.1, m.target[2]], linear]);
    roll.push([a, m.roll, ease], [l, m.roll * 1.08, linear]);
  });
  return { cam, target, roll };
};

const scene03: SceneTimeline = {
  id: 'macro',
  keys: {
    ...macroKeys(),
    fov: [
      [at('reveal', 112), 30],
      [macroArrive(0), 26],
      [macroLeave(4), 26],
    ],
    burRot: [[macroArrive(0) - 2, POSE.vertical, easeInOutCubic]],
    env: [
      [at('macro', 4), 0.78],
      [at('macro', 208), 0.78],
    ],
    envRot: [[at('macro', 210), 1.15, linear]],
    rim: [
      [at('macro', 16), 0.07],
      [at('macro', 208), 0.07],
    ],
    pool: [
      [at('macro', 16), [0.5, 0.52, 0.34]],
      [at('macro', 208), [0.5, 0.52, 0.34]],
    ],
    beam: [
      [at('macro', 10), 0.04],
      [at('macro', 208), 0.04],
    ],
    dof: [
      [at('macro', 0), 0],
      [at('macro', 10), 1],
      [at('macro', 206), 1],
    ],
  },
  fx: (s, f) => {
    if (f >= at('macro', 0) && f < at('exploded', 0)) {
      s.aperture = 0.011;
      s.maxBlur = 0.014;
    }
  },
};

// ---------------------------------------------------------------- 04 exploded
const scene04: SceneTimeline = {
  id: 'exploded',
  keys: {
    cam: [
      [at('exploded', 26), [-4.6, 2.6, 40], easeInOutCubic],
      [at('exploded', 124), [-8.5, 1.4, 66], easeInOutSine],
      [at('exploded', 180), [-6.2, 3.2, 58], linear],
    ],
    target: [
      [at('exploded', 26), [0, 1.2, 0], easeInOutCubic],
      [at('exploded', 124), [0, -1.8, 0], easeInOutSine],
      [at('exploded', 180), [0, -0.6, 0], linear],
    ],
    roll: [[at('exploded', 26), 0, easeInOutCubic]],
    fov: [[at('exploded', 30), 30]],
    burRot: [
      [at('exploded', 10), POSE.vertical],
      [at('exploded', 60), POSE.exploded, easeInOutCubic],
    ],
    burSpin: [
      [at('exploded', 10), 0],
      [at('exploded', 180), -0.55, easeInOutSine],
    ],
    explode: [
      [BEATS.explodeStart, 0],
      [BEATS.explodeEnd, 1, easeInOutSine],
    ],
    env: [[at('exploded', 30), 1.0]],
    envRot: [[at('exploded', 180), 1.95, linear]],
    rim: [
      [at('exploded', 40), 0.16],
      [at('exploded', 180), 0.16],
    ],
    pool: [
      [at('exploded', 40), [0.48, 0.5, 0.5]],
      [at('exploded', 180), [0.5, 0.5, 0.56]],
    ],
    dof: [
      [at('exploded', 0), 1],
      [at('exploded', 18), 0],
    ],
    grid: [
      [at('exploded', 20), 0],
      [at('exploded', 70), 0.5],
      [at('exploded', 180), 0.5],
    ],
  },
  fx: (s, f) => {
    if (f >= at('exploded', 0) && f < at('core', 40)) {
      s.gridPos = [0, -1, -14];
    }
  },
};

// ---------------------------------------------------------------- 05 core
/** head centre of the exploded pose = where the single crystal is born */
export const CORE_POS: Vec3 = burToWorld(POSE.exploded, [0, 0, 0], [0, 16.15 + 1.02 + 2.7, 0]);
const FLY0 = at('core', 0);
const FLY1 = at('core', 82);
const flyCam = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-6.2, 3.2, 58),
    new THREE.Vector3(-3.4, 8.2, 30),
    new THREE.Vector3(3.6, 11.6, 14.5),
    new THREE.Vector3(2.4, 10.9, CORE_POS[2] + 9.6),
    new THREE.Vector3(0.9, CORE_POS[1] + 0.35, CORE_POS[2] + 8.6),
  ],
  false,
  'centripetal',
);
const flyTgt = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, -0.6, 0),
    new THREE.Vector3(0, 6.5, 0.6),
    new THREE.Vector3(0.6, 10.4, 1.4),
    new THREE.Vector3(...CORE_POS),
    new THREE.Vector3(...CORE_POS),
  ],
  false,
  'centripetal',
);

const scene05: SceneTimeline = {
  id: 'core',
  keys: {
    // after the fly-through (handled in evaluate), a slow orbit around the stone
    cam: [
      [FLY1, [0.9, CORE_POS[1] + 0.35, CORE_POS[2] + 8.6]],
      [at('core', 120), [-1.0, CORE_POS[1] + 0.6, CORE_POS[2] + 8.2], easeInOutSine],
    ],
    target: [
      [FLY1, CORE_POS],
      [at('core', 120), CORE_POS],
    ],
    roll: [
      [FLY0, 0],
      [at('core', 40), -0.2, easeInOutSine],
      [FLY1, 0.06, easeInOutSine],
      [at('core', 120), 0, easeInOutSine],
    ],
    fov: [
      [FLY0, 30],
      [FLY1, 32],
    ],
    dissolve: [
      [at('core', 10), 0],
      [at('core', 52), 1, easeInOutSine],
    ],
    env: [
      [at('core', 30), 1.0],
      [at('core', 60), 1.25],
    ],
    envRot: [[at('core', 120), 2.6, linear]],
    rim: [
      [at('core', 20), 0.16],
      [at('core', 50), 0],
    ],
    pool: [[at('core', 60), [0.5, 0.5, 0.62]]],
    beam: [
      [at('core', 30), 0.04],
      [at('core', 70), 0.3],
    ],
    dof: [
      [at('core', 50), 0],
      [at('core', 70), 0.55],
      [at('core', 118), 0.55],
    ],
    grid: [
      [at('core', 0), 0.5],
      [at('core', 36), 0],
    ],
  },
  fx: (s, f) => {
    const inn = easeOutCubic(range(f, BEATS.coreIn, BEATS.coreIn + 40));
    const out = 1 - easeInCubic(range(f, at('snap', 0), at('snap', 18)));
    s.core = Math.min(inn, out);
    s.coreScale = 0.15 + 0.85 * s.core;
    s.coreRot = (f - BEATS.coreIn) * 0.024;
    s.corePos = CORE_POS;
    if (f > at('core', 56) && f < at('snap', 1)) s.burVisible = false;
    if (f >= at('core', 50) && f < at('snap', 30)) {
      s.focus = CORE_POS;
      s.aperture = 0.006;
      s.maxBlur = 0.012;
      s.bloom += 0.12;
    }
  },
};

// ---------------------------------------------------------------- 06 snap
const scene06: SceneTimeline = {
  id: 'snap',
  keys: {
    cam: [
      [at('snap', 30), [-4.8, 3.6, 48], easeInOutCubic],
      [BEATS.snap, [0, 0.6, 43.5], easeInCubic],
      [at('snap', 90), [0, 0.5, 45.5], easeOutCubic],
    ],
    target: [
      [at('snap', 30), [0, 0.6, 0], easeInOutCubic],
      [BEATS.snap, [0, 0.3, 0], easeInCubic],
      [at('snap', 90), [0, 0.3, 0]],
    ],
    roll: [[at('snap', 24), 0, easeInOutSine]],
    fov: [[at('snap', 26), 30]],
    burRot: [
      [at('snap', 0), POSE.exploded],
      [BEATS.snap, POSE.vertical, easeInCubic],
    ],
    burSpin: [
      [at('snap', 0), -0.55],
      [BEATS.snap, 0.25, easeInCubic],
      [at('snap', 90), 0.45, easeOutCubic],
    ],
    explode: [
      [at('snap', 26), 1],
      [BEATS.snap, 0, easeInCubic],
    ],
    dissolve: [
      [at('snap', 0), 1],
      [at('snap', 28), 0, easeOutCubic],
    ],
    env: [
      [at('snap', 10), 1.25],
      [at('snap', 36), 1.0],
    ],
    envRot: [[at('snap', 90), 3.2, easeOutCubic]],
    rim: [
      [at('snap', 40), 0],
      [at('snap', 70), 0.2],
    ],
    pool: [[at('snap', 40), [0.5, 0.5, 0.5]]],
    beam: [
      [at('snap', 10), 0.3],
      [at('snap', 40), 0.06],
    ],
    dof: [
      [at('snap', 0), 0.55],
      [at('snap', 18), 0],
    ],
  },
  fx: (s, f) => {
    const snap = bump(f, BEATS.snap, 3.2);
    const after = bump(f, BEATS.snap + 4, 9);
    s.rim += snap * 1.4 + after * 0.35;
    s.ringGlow += snap * 1.6 + after * 0.4;
    s.bloom += snap * 0.5;
    s.flash = Math.max(s.flash, snap);
    // dimension line after the snap: butt → tip, and the shank diameter
    if (f >= BEATS.snap - 4 && f < at('variations', 20)) {
      const len = burLength(SHAPES.esferica);
      s.probes.push(
        { id: 'dimA', p: [0, 0, 0] },
        { id: 'dimB', p: [0, len, 0] },
        { id: 'shank0', p: [0, 5.2, 0] },
        { id: 'shank1', p: [0, 6.2, 0] },
      );
    }
  },
};

// ---------------------------------------------------------------- 07 variations
export const VARIANT_SEQ: Variant[] = [
  { shape: 'esferica', grit: 'grossa' },
  { shape: 'chama', grit: 'fina' },
  { shape: 'cilindrica', grit: 'media' },
  { shape: 'troncoconica', grit: 'extrafina' },
  { shape: 'esferica', grit: 'grossa' },
];
export const SWEEPS = VARIANT_SEQ.slice(1).map((to, i) => {
  const start = BEATS.sweep0 + i * BEATS.sweepStep;
  return { from: VARIANT_SEQ[i], to, start, end: start + BEATS.sweepLen };
});

const topY = (shape: ShapeId) => {
  const o = headOuter(SHAPES[shape]);
  return o[o.length - 1].y;
};
/** Height of the laser scan line in bur space (mirrors Bur.setSweep). */
export function scanHeight(a: ShapeId, b: ShapeId, k: number) {
  const top = Math.max(topY(a), topY(b)) + 0.25;
  return top - clamp(k) * (top + 0.4);
}

export function variantAt(f: number): { variant: Variant; sweepTo: Variant | null; sweep: number; shown: Variant } {
  for (const s of SWEEPS) {
    if (f < s.start) return { variant: s.from, sweepTo: null, sweep: 0, shown: s.from };
    if (f <= s.end) {
      const k = easeInOutSine(range(f, s.start, s.end));
      return { variant: s.from, sweepTo: s.to, sweep: k, shown: k > 0.5 ? s.to : s.from };
    }
  }
  const last = VARIANT_SEQ[VARIANT_SEQ.length - 1];
  return { variant: last, sweepTo: null, sweep: 0, shown: last };
}

const variationKeys = (): Partial<Channels> => {
  const cam: Key<Vec3>[] = [[at('variations', 12), [2.2, 4.8, 23], easeInOutCubic]];
  const target: Key<Vec3>[] = [[at('variations', 12), [0, 4.5, 0], easeInOutCubic]];
  SWEEPS.forEach((s, i) => {
    const side = i % 2 ? -1 : 1;
    const holdEnd = s.start + BEATS.sweepStep - 4;
    // during the sweep: mid shot; after it: push in toward the new head
    cam.push([s.end, [1.6 * side, 4.9, 22], easeInOutSine], [s.end + 14, [2.4 * side, 6.3, 15.5], easeInOutCubic]);
    target.push([s.end, [0, 4.6, 0], easeInOutSine], [s.end + 14, [0, 5.7, 0], easeInOutCubic]);
    if (i < SWEEPS.length - 1) {
      cam.push([holdEnd, [2.2 * side, 6.1, 16.5], linear], [SWEEPS[i + 1].start, [1.6 * -side, 4.9, 22], easeInOutCubic]);
      target.push([holdEnd, [0, 5.6, 0], linear], [SWEEPS[i + 1].start, [0, 4.6, 0], easeInOutCubic]);
    }
  });
  return { cam, target };
};

const scene07: SceneTimeline = {
  id: 'variations',
  keys: {
    ...variationKeys(),
    burSpin: [
      [at('variations', 0), 0.45],
      [at('variations', 150), 1.6, linear],
    ],
    envRot: [[at('variations', 150), 3.9, linear]],
    rim: [
      [at('variations', 10), 0.18],
      [at('variations', 140), 0.18],
    ],
  },
  fx: (s, f) => {
    if (f >= at('variations', 0) && f < at('care', 0)) {
      const v = variantAt(f);
      s.variant = v.variant;
      s.sweepTo = v.sweepTo;
      s.sweep = v.sweep;
      s.tint = GRITS[v.shown.grit].color;
      s.tintAmt = windowed(f, at('variations', 2), at('variations', 150), 12, 14) * 0.1;
      if (v.sweepTo) {
        const y = scanHeight(v.variant.shape, v.sweepTo.shape, v.sweep);
        s.probes.push({ id: 'scanC', p: [0, y, 0] }, { id: 'scanU', p: [0, y + 1, 0] });
      }
    }
  },
};

// ---------------------------------------------------------------- 08 care
export const FOAM_POS: Vec3 = [0, -14, 0];
const PLUNGE_DEPTH_Y = 4.6; // burPos.y with the head inside the foam
const scene08: SceneTimeline = {
  id: 'care',
  keys: {
    cam: [
      [at('care', 24), [9, 11, 52], easeInOutCubic],
      [BEATS.plunge + 12, [7.5, 6.5, 44], easeInOutSine],
      [BEATS.offer - 6, [6.5, 5.8, 42], linear],
      [BEATS.offer + 20, [0, 15.5, 218], easeInOutCubic],
      [at('care', 150), [-3, 15.5, 214], linear],
    ],
    target: [
      [at('care', 24), [0, 1.5, 0], easeInOutCubic],
      [BEATS.plunge + 12, [0, -1.2, 0], easeInOutSine],
      [BEATS.offer - 6, [0, -1.2, 0]],
      [BEATS.offer + 20, [0, 5.5, 0], easeInOutCubic],
      [at('care', 150), [0, 5.5, 0]],
    ],
    fov: [
      [at('care', 30), 30],
      [BEATS.offer - 6, 30],
      [BEATS.offer + 20, 26, easeInOutCubic],
    ],
    burRot: [
      [at('variations', 142), POSE.vertical],
      [at('care', 22), POSE.care, easeInOutCubic],
    ],
    burPos: [
      [at('variations', 142), [0, 0, 0]],
      [at('care', 22), [0, 19, 0], easeInOutCubic],
      [BEATS.plunge, [0, 19, 0]],
      [BEATS.plunge + 12, [0, PLUNGE_DEPTH_Y, 0], easeInCubic],
      [BEATS.plunge + 30, [0, PLUNGE_DEPTH_Y, 0]],
      [BEATS.plunge + 46, [0, 11, 0], easeInOutCubic],
      [at('care', 150), [0, 11.6, 0], linear],
    ],
    burSpin: [
      [at('care', 0), 1.6],
      [BEATS.plunge, 2.4, linear],
      [BEATS.plunge + 30, 26, linear],
      [BEATS.plunge + 50, 28.4, easeOutCubic],
      [at('care', 150), 29.4, linear],
    ],
    envRot: [[at('care', 150), 4.2, linear]],
    rim: [
      [at('care', 10), 0.12],
      [at('care', 150), 0.16],
    ],
    pool: [
      [at('care', 20), [0.5, 0.56, 0.42]],
      [BEATS.offer + 20, [0.5, 0.36, 0.56]],
    ],
    beam: [[at('care', 20), 0.08]],
  },
  fx: (s, f) => {
    const inn = easeOutCubic(range(f, at('care', 6), at('care', 34)));
    const out = easeInCubic(range(f, at('final', -8), at('final', 16)));
    if (inn > 0 && out < 1) {
      s.foam = 1;
      s.foamPos = [FOAM_POS[0], FOAM_POS[1] - 80 * (1 - inn) - 110 * out, FOAM_POS[2]];
      s.foamRot = [0.08, -0.44 + 0.14 * inn, 0];
    }
    s.debris = windowed(f, BEATS.plunge + 9, BEATS.plunge + 42, 2, 10);
    s.debrisT = range(f, BEATS.plunge + 9, BEATS.plunge + 40) * 1.1;
  },
};

// ---------------------------------------------------------------- 09 final
const SIGN = BEATS.signoff;
const scene09: SceneTimeline = {
  id: 'final',
  keys: {
    cam: [
      [at('final', 26), [0, 1.2, 50], easeInOutCubic],
      [SIGN - 6, [1.4, 1.0, 46.5], linear],
      [SIGN + 26, [0, 0.4, 50], easeInOutCubic],
      [at('final', 240), [0, 0.4, 47], linear],
    ],
    target: [
      [at('final', 26), [0, -2.6, 0], easeInOutCubic],
      [SIGN - 6, [0, -2.6, 0]],
      [SIGN + 26, [0, 0.8, 0], easeInOutCubic],
      [at('final', 240), [0, 0.8, 0]],
    ],
    fov: [[at('final', 26), 30]],
    burRot: [
      [at('final', 2), POSE.care],
      [at('final', 30), POSE.promo, easeInOutCubic],
      [SIGN, POSE.promo],
      [SIGN + 28, POSE.vertical, easeInOutCubic],
    ],
    burPos: [
      [at('final', 2), [0, 11.6, 0]],
      [at('final', 30), [0.8, -7.4, 0], easeInOutCubic],
      [SIGN, [0.8, -7.6, 0]],
      [SIGN + 28, [0, -1.2, 0], easeInOutCubic],
    ],
    burSpin: [
      [at('final', 30), 31.4, easeOutCubic],
      [SIGN, 31.6, linear],
      [at('final', 240), 33.2, linear],
    ],
    envRot: [
      [at('final', 0), 4.2],
      [at('final', 240), 6.2, linear],
    ],
    rim: [
      [at('final', 10), 0.16],
      [at('final', 30), 0.62, easeOutCubic],
      [SIGN - 4, 0.5],
      [SIGN + 30, 0.36],
    ],
    pool: [
      [at('final', 26), [0.5, 0.62, 0.62]],
      [SIGN + 26, [0.5, 0.46, 0.62]],
    ],
    beam: [
      [at('final', 26), 0.12],
      [at('final', 240), 0.18],
    ],
  },
  fx: (s, f) => {
    s.ringGlow += windowed(f, at('final', 20), at('final', 260), 30, 1) * 0.3;
    s.ringGlow += bump(f, BEATS.promo + 2, 4) * 1.2;
    s.flash = Math.max(s.flash, bump(f, BEATS.promo + 1, 2.5) * 0.6);
    // closing title, behind the vertical hero
    const t = smooth(range(f, SIGN + 10, SIGN + 40));
    if (t > 0) {
      s.title = {
        ...s.title,
        text: 'KG SORENSEN',
        weight: 200,
        tracking: 0.02,
        opacity: t * 0.92,
        reveal: easeOutCubic(range(f, SIGN + 10, SIGN + 56)),
        blur: 0,
        pos: [0, 1.2, -14],
        height: 2.65,
        billboard: true,
      };
    }
  },
};

export const SCENE_TIMELINES: SceneTimeline[] = [scene01, scene02, scene03, scene04, scene05, scene06, scene07, scene08, scene09];

// ---------------------------------------------------------------- merge
function merge<K extends ChannelName>(name: K): Channels[K] {
  const all: Key<never>[] = [];
  for (const sc of SCENE_TIMELINES) {
    const k = sc.keys[name] as Key<never>[] | undefined;
    if (k) all.push(...k);
  }
  return all as unknown as Channels[K];
}
const T = {
  cam: new Track<Vec3>(merge('cam')),
  target: new Track<Vec3>(merge('target')),
  fov: new Track<number>(merge('fov')),
  roll: new Track<number>(merge('roll')),
  burRot: new Track<Vec3>(merge('burRot')),
  burPos: new Track<Vec3>(merge('burPos')),
  burSpin: new Track<number>(merge('burSpin')),
  explode: new Track<number>(merge('explode')),
  dissolve: new Track<number>(merge('dissolve')),
  env: new Track<number>(merge('env')),
  envRot: new Track<number>(merge('envRot')),
  rim: new Track<number>(merge('rim')),
  pool: new Track<Vec3>(merge('pool')),
  beam: new Track<number>(merge('beam')),
  dof: new Track<number>(merge('dof')),
  grid: new Track<number>(merge('grid')),
  kicker: new Track<Vec3>(merge('kicker')),
  kickerI: new Track<number>(merge('kickerI')),
};

const v3 = (v: readonly number[]): Vec3 => [v[0], v[1], v[2]];

// ---------------------------------------------------------------- evaluate
export function evaluateFrame(frame: number, fps: number = VIDEO.fps): VideoState {
  const f = clamp(frame, 0, VIDEO.durationInFrames - 1);
  const s: VideoState = { ...defaultState(), extras: [], probes: [] };
  s.time = f / fps;
  s.fit = 0; // framed for 9:16 by hand

  // camera
  if (f >= FLY0 && f <= FLY1) {
    const u = easeInOutSine(range(f, FLY0, FLY1));
    const c = flyCam.getPointAt(u);
    const t = flyTgt.getPointAt(Math.min(1, u * 1.04));
    s.cam = [c.x, c.y, c.z];
    s.target = [t.x, t.y, t.z];
  } else {
    s.cam = v3(T.cam.at(f));
    s.target = v3(T.target.at(f));
  }
  // a breath of life: a tiny, slow, deterministic drift
  const breathe = 0.05 * Math.sin(s.time * 0.5);
  s.cam = [s.cam[0] + breathe, s.cam[1] + breathe * 0.6, s.cam[2]];
  s.fov = T.fov.at(f);
  s.roll = T.roll.at(f);

  // hero
  s.burRot = v3(T.burRot.at(f));
  s.burPos = v3(T.burPos.at(f));
  s.burSpin = T.burSpin.at(f);
  s.explode = T.explode.at(f);
  s.dissolve = T.dissolve.at(f);
  s.rim = T.rim.at(f);
  s.rimPow = 3.6;
  s.ringGlow = 0;
  s.variant = VARIANT_SEQ[0];

  // light
  s.envIntensity = T.env.at(f);
  s.keyLight = clamp(s.envIntensity);
  s.envRot = T.envRot.at(f) + Math.sin(s.time * 0.2) * 0.04;
  s.kicker = v3(T.kicker.at(f));
  s.kickerIntensity = T.kickerI.at(f);
  s.exposure = 1;

  // backdrop
  s.pool = v3(T.pool.at(f));
  s.beam = T.beam.at(f);
  s.grid = T.grid.at(f);

  // post
  s.dof = T.dof.at(f);
  s.focus = v3(s.target);
  s.aperture = 0.01;
  s.maxBlur = 0.014;
  s.bloom = 0.22;
  s.bloomThreshold = 1.45;
  s.grain = 0.045;
  s.vignette = 0.6;
  s.fade = 0;
  s.flash = 0;

  for (const sc of SCENE_TIMELINES) sc.fx?.(s, f);
  return s;
}

/** Absolute frame of a scene-relative frame (for overlays inside Sequences). */
export const abs = (id: SceneId, rel: number) => SCENES[id].from + rel;
