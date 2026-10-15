import * as THREE from 'three';
import { track, type Key } from '../util/keys';
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
} from '../util/ease';
import { defaultState, type FilmState, type Vec3 } from '../stage/state';
import { GRITS, type Variant } from '../bur/profiles';

/**
 * Mode B timeline: scroll progress p ∈ [0,1] → FilmState.
 * Tracks are organised per property so every transition is continuous.
 */

export type Beat = { id: string; label: string; start: number; end: number };
export const BEATS: Beat[] = [
  { id: 'escuridao', label: 'ESCURIDÃO', start: 0.0, end: 0.07 },
  { id: 'reveal', label: 'REVELAÇÃO', start: 0.07, end: 0.17 },
  { id: 'macro', label: 'MACRO', start: 0.17, end: 0.37 },
  { id: 'explodida', label: 'VISTA EXPLODIDA', start: 0.37, end: 0.53 },
  { id: 'travessia', label: 'TRAVESSIA', start: 0.53, end: 0.615 },
  { id: 'nucleo', label: 'O NÚCLEO', start: 0.615, end: 0.7 },
  { id: 'remontagem', label: 'REMONTAGEM', start: 0.7, end: 0.78 },
  { id: 'variacoes', label: 'VARIAÇÕES', start: 0.78, end: 0.87 },
  { id: 'cuidado', label: 'CUIDADO', start: 0.87, end: 0.92 },
  { id: 'particulas', label: 'PARTÍCULAS', start: 0.92, end: 0.962 },
  { id: 'final', label: 'KG SORENSEN', start: 0.962, end: 1.0 },
];

export const beatAt = (p: number) => BEATS.find((b) => p >= b.start && p < b.end) ?? BEATS[BEATS.length - 1];

// ----------------------------------------------------------------- poses
const PI = Math.PI;
export const POSE = {
  heroIn: [0.2, -0.55, 0.62] as Vec3,
  hero: [0.2, 0.05, 0.62] as Vec3,
  vertical: [0, 0, 0] as Vec3,
  exploded: [0.18, -0.45, -PI / 2] as Vec3,
  care: [0, 0, PI] as Vec3,
};

/** Bur-space point (mm, y from the butt) → world, for a given pose. */
export function burToWorld(rot: Vec3, pos: Vec3, p: Vec3, pivot = 9.6): Vec3 {
  const v = new THREE.Vector3(p[0], p[1] - pivot, p[2]);
  v.applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(...pos));
  return [v.x, v.y, v.z];
}

// ----------------------------------------------------------------- macro stops
export type MacroStop = { id: string; at: number; target: Vec3; cam: Vec3 };
const M0 = 0.197;
const MS = 0.0222;
export const MACRO_STOPS: MacroStop[] = [
  { id: 'crystals', target: [0, 7.72, 0.62], cam: [1.75, 8.55, 4.3] },
  { id: 'matrix', target: [0, 6.62, 0.38], cam: [-1.55, 6.25, 3.35] },
  { id: 'neck', target: [0, 4.75, 0.42], cam: [1.25, 5.0, 3.7] },
  { id: 'ring', target: [0, 2.25, 0.8], cam: [-1.05, 2.55, 3.95] },
  { id: 'logo', target: [0, -0.83, 0.8], cam: [0.14, -0.8, 4.7] },
  { id: 'lot', target: [0, -5.45, 0.8], cam: [1.1, -5.35, 7.8] },
  { id: 'steel', target: [0, -8.1, 0.8], cam: [-1.85, -7.55, 3.5] },
  { id: 'butt', target: [0, -9.5, 0.5], cam: [1.65, -10.95, 3.3] },
].map((s, i) => ({ ...s, at: M0 + i * MS }) as MacroStop);

// ----------------------------------------------------------------- variations
export const VARIANT_SEQ: Variant[] = [
  { shape: 'esferica', grit: 'grossa' },
  { shape: 'chama', grit: 'fina' },
  { shape: 'cilindrica', grit: 'media' },
  { shape: 'troncoconica', grit: 'extrafina' },
  { shape: 'esferica', grit: 'grossa' },
];
const V0 = 0.783;
const VSWEEP = 0.0135;
const VSTEP = 0.0205;
export const SWEEPS = VARIANT_SEQ.slice(1).map((to, i) => ({
  from: VARIANT_SEQ[i],
  to,
  start: V0 + i * VSTEP,
  end: V0 + i * VSTEP + VSWEEP,
}));

function variantAt(p: number): { variant: Variant; sweepTo: Variant | null; sweep: number } {
  for (const s of SWEEPS) {
    if (p < s.start) return { variant: s.from, sweepTo: null, sweep: 0 };
    if (p <= s.end) return { variant: s.from, sweepTo: s.to, sweep: easeInOutSine(range(p, s.start, s.end)) };
  }
  return { variant: VARIANT_SEQ[VARIANT_SEQ.length - 1], sweepTo: null, sweep: 0 };
}

// ----------------------------------------------------------------- tracks
type V3 = Key<Vec3>;

const camKeys: V3[] = [
  [0.0, [1.6, 1.2, 52]],
  [0.07, [1.0, 0.7, 47], easeInOutSine],
  [0.155, [0, 0.2, 39], easeInOutSine],
];
const tgtKeys: V3[] = [
  [0.0, [0, 0, 0]],
  [0.155, [0, 0.4, 0]],
];
// macro: glide → hold (with slight drift) → glide
for (const s of MACRO_STOPS) {
  const drift: Vec3 = [s.cam[0] * 0.04, s.cam[1] - 0.12, s.cam[2] * 0.97];
  camKeys.push([s.at - 0.004, s.cam, easeInOutQuart], [s.at + 0.007, drift, linear]);
  tgtKeys.push([s.at - 0.004, s.target, easeInOutQuart], [s.at + 0.007, [s.target[0], s.target[1] - 0.1, s.target[2]], linear]);
}
// macro → exploded: keep the hero in frame while it turns
camKeys.push([0.383, [-5.5, 3.5, 25], easeInOutCubic]);
tgtKeys.push([0.383, [0.5, 1.2, 0], easeInOutCubic]);
// exploded wide
camKeys.push([0.41, [-6, 6.5, 37], easeInOutCubic], [0.53, [4, 8.4, 31], easeInOutSine]);
tgtKeys.push([0.41, [1.5, 2.4, 0], easeInOutCubic], [0.53, [1.5, 2.4, 0], easeInOutSine]);

// fly-through (spline) is handled separately between FLY0 and FLY1
const FLY0 = 0.53;
const FLY1 = 0.628;
const flyCam = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(4, 8.4, 31),
    new THREE.Vector3(7.5, 3.4, 16),
    new THREE.Vector3(12.4, 1.6, 8.6),
    new THREE.Vector3(10.8, 2.8, 1.6),
    new THREE.Vector3(4.2, 1.4, 5.0),
    new THREE.Vector3(-0.7, 0.55, 7.0),
  ],
  false,
  'centripetal',
);
const flyTgt = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(1.5, 2.4, 0),
    new THREE.Vector3(9.2, -0.8, 4.4),
    new THREE.Vector3(8.6, -1.0, 2.6),
    new THREE.Vector3(6.5, -0.6, 2.0),
    new THREE.Vector3(0.4, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ],
  false,
  'centripetal',
);
// core orbit, re-assembly, variations, care, particles, final
camKeys.push(
  [FLY1, [-0.7, 0.55, 7.0], linear],
  [0.7, [1.7, 0.95, 6.5], easeInOutSine],
  [0.726, [7, 3.2, 33], easeInOutCubic],
  [0.765, [0, 0.6, 38.5], easeInOutCubic],
  [0.782, [0, 0.4, 44], easeOutCubic],
);
tgtKeys.push(
  [FLY1, [0, 0, 0], linear],
  [0.7, [0, 0, 0]],
  [0.726, [0, 0, 0]],
  [0.765, [0, 0.4, 0]],
  [0.782, [0, 0.4, 0]],
);
// variations: wide during each sweep, push to the head while holding
for (const [i, s] of SWEEPS.entries()) {
  const side = i % 2 ? -1 : 1;
  camKeys.push([s.end, [0, 0.4, 44], easeInOutCubic], [s.end + 0.0055, [2.6 * side, 8.4, 11.5], easeInOutCubic]);
  tgtKeys.push([s.end, [0, 0.4, 0], easeInOutCubic], [s.end + 0.0055, [0, 7.3, 0], easeInOutCubic]);
  const next = SWEEPS[i + 1];
  if (next) {
    camKeys.push([next.start + 0.004, [0, 0.4, 44], easeInOutCubic]);
    tgtKeys.push([next.start + 0.004, [0, 0.4, 0], easeInOutCubic]);
  }
}
camKeys.push(
  [0.872, [1.8, 8.5, 13], linear],
  [0.884, [0, 10, 96], easeInOutCubic],
  [0.912, [-5, 8, 92], easeInOutSine],
  [0.924, [0, 0.4, 40], easeInOutCubic],
  [0.958, [0, 0.4, 36], easeInOutSine],
  [0.975, [0, -0.8, 57], easeInOutCubic],
  [1.0, [0, -0.8, 56], linear],
);
tgtKeys.push(
  [0.872, [0, 7.3, 0], linear],
  [0.884, [0, 0, 0], easeInOutCubic],
  [0.912, [0, 0, 0]],
  [0.924, [0, 0.2, 0], easeInOutCubic],
  [0.958, [0, 0.2, 0]],
  [0.975, [0, -4.1, 0], easeInOutCubic],
);
const cam = track(camKeys);
const tgt = track(tgtKeys);

const fov = track([
  [0, 30],
  [0.17, 30],
  [0.195, 26],
  [0.355, 26],
  [0.4, 30],
  [0.6, 30],
  [0.63, 32],
  [0.7, 32],
  [0.73, 30],
]);

const roll = track([
  [0, 0],
  [0.53, 0],
  [0.575, -0.22, easeInOutSine],
  [0.61, 0.08, easeInOutSine],
  [0.63, 0, easeInOutSine],
]);

const burRot = track<Vec3>([
  [0.0, POSE.heroIn],
  [0.16, POSE.hero, easeInOutSine],
  [0.19, POSE.vertical, easeInOutCubic],
  [0.355, POSE.vertical],
  [0.4, POSE.exploded, easeInOutCubic],
  [0.72, POSE.exploded],
  [0.765, POSE.vertical, easeInOutCubic],
  [0.872, POSE.vertical],
  [0.884, POSE.care, easeInOutCubic],
  [0.912, POSE.care],
  [0.926, POSE.hero, easeInOutCubic],
  [0.94, POSE.hero],
  [0.955, POSE.vertical, easeInOutCubic],
]);

const burPos = track<Vec3>([
  [0, [0, 0, 0]],
  [0.872, [0, 0, 0]],
  [0.884, [0, 15, 0], easeInOutCubic],
  [0.893, [0, 15, 0]],
  [0.9, [0, 7.0, 0], easeInOutCubic],
  [0.904, [0, 7.0, 0]],
  [0.911, [0, 15, 0], easeInOutCubic],
  [0.926, [0, 0, 0], easeInOutCubic],
]);

const burSpin = track([
  [0.0, -1.3],
  [0.16, 0, easeOutCubic],
  [0.37, 0],
  [0.53, -0.5, easeInOutSine],
  [0.765, 0],
  [0.87, 0.6, linear],
  [0.884, 1.2],
  [0.912, 30, linear],
  [0.926, 30.4 - 0.0, easeOutCubic],
  [0.962, 31.4 - 0.0, linear],
]);

const explode = track([
  [0, 0],
  [0.392, 0],
  [0.49, 1, easeInOutSine],
  [0.72, 1],
  [0.765, 0, easeInCubic],
]);

const dissolve = track([
  [0, 0],
  [0.566, 0],
  [0.612, 1, easeInOutSine],
  [0.7, 1],
  [0.722, 0, easeOutCubic],
  [0.926, 0],
  [0.937, 1, easeInOutSine],
  [0.951, 1],
  [0.961, 0, easeOutCubic],
]);

const env = track([
  [0, 0.018],
  [0.06, 0.03],
  [0.1, 0.55, easeInOutSine],
  [0.135, 1.0, easeInOutSine],
  [0.17, 1.0],
  [0.195, 0.72],
  [0.355, 0.72],
  [0.4, 0.85],
  [0.6, 0.85],
  [0.63, 1.25],
  [0.7, 1.25],
  [0.73, 1.0],
]);

const envRot = track([
  [0, -1.2],
  [0.17, 0.35, easeInOutSine],
  [0.37, 1.1, linear],
  [0.53, 1.9, linear],
  [0.7, 2.6, linear],
  [0.78, 3.2],
  [0.87, 3.9, linear],
  [1.0, 4.3, linear],
]);

const rimBase = track([
  [0, 0],
  [0.105, 0],
  [0.125, 0.95, easeOutCubic],
  [0.16, 0.22, easeInOutSine],
  [0.19, 0.0],
  [0.36, 0.0],
  [0.4, 0.16],
  [0.53, 0.16],
  [0.56, 0],
  [0.74, 0],
  [0.78, 0.18],
  [0.87, 0.18],
  [0.92, 0.12],
  [0.96, 0.32],
  [1.0, 0.36],
]);

const pool = track<Vec3>([
  [0, [0.5, 0.5, 0]],
  [0.07, [0.5, 0.5, 0.05]],
  [0.15, [0.5, 0.52, 0.55]],
  [0.2, [0.5, 0.52, 0.32]],
  [0.37, [0.5, 0.52, 0.32]],
  [0.42, [0.48, 0.5, 0.5]],
  [0.62, [0.5, 0.5, 0.62]],
  [0.7, [0.5, 0.5, 0.62]],
  [0.78, [0.5, 0.5, 0.5]],
  [0.96, [0.5, 0.48, 0.5]],
  [1, [0.5, 0.46, 0.62]],
]);

const beam = track([
  [0, 0],
  [0.1, 0],
  [0.15, 0.12],
  [0.2, 0.04],
  [0.6, 0.04],
  [0.64, 0.3],
  [0.7, 0.3],
  [0.74, 0.06],
  [0.96, 0.06],
  [1, 0.18],
]);

const kickerPos = track<Vec3>([
  [0, [6.8, -6.9, 2.4]],
  [0.066, [-4.2, 8.2, 4.4], easeInOutSine],
]);
const kickerI = track([
  [0, 0],
  [0.008, 16],
  [0.06, 16],
  [0.085, 0],
]);

const dofAmt = track([
  [0, 0],
  [0.18, 0],
  [0.195, 1],
  [0.352, 1],
  [0.37, 0],
  [0.63, 0],
  [0.645, 0.55],
  [0.69, 0.55],
  [0.705, 0],
]);

const grid = track([
  [0, 0],
  [0.4, 0],
  [0.45, 0.5],
  [0.53, 0.5],
  [0.56, 0],
]);

const fit = track([
  [0, 1],
  [0.17, 1],
  [0.19, 0.25],
  [0.355, 0.25],
  [0.4, 1],
  [0.6, 1],
  [0.625, 0.45],
  [0.7, 0.45],
  [0.73, 1],
  [0.765, 0.4],
  [0.872, 0.4],
  [0.884, 1],
  [0.912, 1],
  [0.926, 0.8],
  [0.955, 0.8],
  [0.975, 0.45],
]);

// ----------------------------------------------------------------- evaluate

export function evaluate(p: number, time = 0): FilmState {
  p = clamp(p);
  const s = defaultState();
  s.time = time;

  // camera ---------------------------------------------------------------
  if (p >= FLY0 && p <= FLY1) {
    const u = easeInOutSine(range(p, FLY0, FLY1));
    const c = flyCam.getPointAt(u);
    const t = flyTgt.getPointAt(Math.min(1, u * 1.04));
    s.cam = [c.x, c.y, c.z];
    s.target = [t.x, t.y, t.z];
  } else {
    s.cam = [...cam.at(p)] as Vec3;
    s.target = [...tgt.at(p)] as Vec3;
  }
  // a breath of life when the scroll rests
  const breathe = 0.06 * Math.sin(time * 0.35);
  s.cam = [s.cam[0] + breathe, s.cam[1] + breathe * 0.6, s.cam[2]];
  s.fov = fov.at(p);
  s.roll = roll.at(p);
  s.fit = fit.at(p);

  // hero -----------------------------------------------------------------
  s.burRot = [...burRot.at(p)] as Vec3;
  s.burPos = [...burPos.at(p)] as Vec3;
  s.burSpin = burSpin.at(p);
  s.explode = explode.at(p);
  s.dissolve = dissolve.at(p);
  s.burVisible = !(p > 0.613 && p < 0.699);
  const snap = bump(p, 0.766, 0.0035);
  s.rim = rimBase.at(p) + snap * 1.4;
  s.rimPow = 3.6;
  s.ringGlow = bump(p, 0.048, 0.006) * 2.2 + (1 - smooth(range(p, 0, 0.05))) * bump((time / 5.5) % 1, 0.62, 0.05) * 1.8 + snap * 1.6 + (p > 0.96 ? 0.25 * smooth(range(p, 0.96, 1)) : 0);
  const v = variantAt(p);
  s.variant = v.variant;
  s.sweepTo = v.sweepTo;
  s.sweep = v.sweep;

  // light ----------------------------------------------------------------
  s.envIntensity = env.at(p);
  s.keyLight = clamp(s.envIntensity);
  s.envRot = envRot.at(p) + Math.sin(time * 0.12) * 0.04;
  s.kicker = [...kickerPos.at(p)] as Vec3;
  s.kickerIntensity = kickerI.at(p);
  // at rest on the first screen the thin reflection keeps travelling on its own
  const idle = 1 - smooth(range(p, 0.0, 0.05));
  if (idle > 0) {
    const cyc = (time / 5.5) % 1;
    const u = easeInOutSine(clamp(cyc / 0.8));
    const a = kickerPos.at(0);
    const b = kickerPos.at(1);
    const k: Vec3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    s.kicker = [
      s.kicker[0] + (k[0] - s.kicker[0]) * idle,
      s.kicker[1] + (k[1] - s.kicker[1]) * idle,
      s.kicker[2] + (k[2] - s.kicker[2]) * idle,
    ];
    s.kickerIntensity = Math.max(s.kickerIntensity, 16 * windowed(cyc, 0.0, 0.92, 0.12, 0.2) * idle);
  }
  s.exposure = 1.0;

  // backdrop ---------------------------------------------------------------
  s.pool = [...pool.at(p)] as Vec3;
  s.beam = beam.at(p);
  s.grid = grid.at(p);
  s.gridPos = [0, 0, -14];
  const ringNow = GRITS[(v.sweepTo && v.sweep > 0.5 ? v.sweepTo : v.variant).grit].color;
  s.tint = ringNow;
  s.tintAmt = windowed(p, 0.785, 0.868, 0.006) * 0.1;

  // titles (inside the 3D scene, behind the bur) --------------------------
  const tReveal = windowed(p, 0.078, 0.19, 0.012, 0.02);
  const tFinal = smooth(range(p, 0.962, 0.985));
  if (tFinal > 0) {
    s.title = {
      ...s.title,
      text: 'KG SORENSEN',
      weight: 200,
      tracking: 0.04,
      opacity: tFinal * 0.92,
      reveal: easeOutCubic(range(p, 0.962, 0.99)),
      blur: 0,
      pos: [0, 0.6, -14],
      height: 5.0,
      billboard: true,
    };
  } else if (tReveal > 0) {
    s.title = {
      ...s.title,
      text: 'PRECISÃO',
      weight: 100,
      tracking: -0.01,
      opacity: tReveal * 0.94,
      reveal: easeOutExpo(range(p, 0.082, 0.14)),
      blur: 0,
      pos: [0, 0.9, -15],
      height: 11.5,
      billboard: true,
    };
  }

  // post -------------------------------------------------------------------
  s.dof = dofAmt.at(p);
  s.focus = p < 0.6 ? ([...tgt.at(p)] as Vec3) : [0, 0, 0];
  s.aperture = p < 0.5 ? 0.011 : 0.006;
  s.maxBlur = 0.014;
  s.bloom = 0.22 + snap * 0.5;
  s.flash = snap;
  s.vignette = 0.62;
  s.fade = 0;

  // the core -----------------------------------------------------------------
  const coreIn = easeOutCubic(range(p, 0.585, 0.625));
  const coreOut = 1 - easeInCubic(range(p, 0.7, 0.716));
  s.core = Math.min(coreIn, coreOut);
  s.coreScale = 0.15 + 0.85 * s.core;
  s.coreRot = (p - 0.585) * 14 + time * 0.08;

  // Limpa Pontas -------------------------------------------------------------
  const foamIn = easeOutCubic(range(p, 0.873, 0.888));
  const foamOut = easeInCubic(range(p, 0.911, 0.922));
  s.foam = foamIn > 0 && foamOut < 1 ? 1 : 0;
  s.foamPos = [0, -86 + 76 * foamIn - 80 * foamOut, 0];
  s.foamRot = [0.08, -0.32 + 0.12 * foamIn, 0];
  s.debris = windowed(p, 0.9035, 0.917, 0.001, 0.004);
  s.debrisT = range(p, 0.9035, 0.915) * 1.1;

  // particles ----------------------------------------------------------------
  s.particles = windowed(p, 0.923, 0.963, 0.006, 0.006);
  s.particlesExpand =
    p < 0.948 ? easeInOutCubic(range(p, 0.935, 0.948)) : 1 - easeInOutCubic(range(p, 0.948, 0.958));

  return s;
}
