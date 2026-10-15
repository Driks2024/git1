import type { Variant } from '../bur/profiles';

export type Vec3 = [number, number, number];

/**
 * Everything the renderer needs to draw one frame. Both delivery modes
 * produce a FilmState (scroll progress → state, or Remotion frame → state)
 * and hand it to FilmRenderer.render(). Pure data, no side effects.
 */
export type FilmState = {
  time: number;
  // camera
  cam: Vec3;
  target: Vec3;
  fov: number;
  roll: number;
  /** 0..1 — how much to pull back on narrow viewports to keep the hero in frame */
  fit: number;
  // hero pose
  burPos: Vec3;
  burRot: Vec3;
  burSpin: number;
  burScale: number;
  burVisible: boolean;
  // hero look
  explode: number;
  dissolve: number;
  rim: number;
  rimPow: number;
  ringGlow: number;
  variant: Variant;
  sweepTo: Variant | null;
  sweep: number;
  // light
  envIntensity: number;
  envRot: number;
  exposure: number;
  keyLight: number;
  kicker: Vec3;
  kickerIntensity: number;
  // backdrop
  pool: Vec3; // x, y (0..1 screen), intensity
  beam: number;
  lift: number;
  tint: string;
  tintAmt: number;
  grid: number;
  gridPos: Vec3;
  gridRot: Vec3;
  title: {
    text: string;
    weight: number;
    tracking: number;
    opacity: number;
    reveal: number;
    blur: number;
    pos: Vec3;
    height: number;
    /** face the camera instead of the world -Z */
    billboard: boolean;
  };
  // post
  dof: number;
  focus: Vec3 | null;
  aperture: number;
  maxBlur: number;
  bloom: number;
  bloomThreshold: number;
  grain: number;
  vignette: number;
  fade: number;
  flash: number;
  // extras
  particles: number;
  particlesExpand: number;
  core: number;
  coreScale: number;
  coreRot: number;
  corePos: Vec3;
  foam: number;
  foamPos: Vec3;
  foamRot: Vec3;
  debris: number;
  debrisT: number;
};

export function defaultState(): FilmState {
  return {
    time: 0,
    cam: [0, 0, 42],
    target: [0, 0, 0],
    fov: 30,
    roll: 0,
    fit: 1,
    burPos: [0, 0, 0],
    burRot: [0.2, 0, 0.62],
    burSpin: 0,
    burScale: 1,
    burVisible: true,
    explode: 0,
    dissolve: 0,
    rim: 0,
    rimPow: 3.2,
    ringGlow: 0,
    variant: { shape: 'esferica', grit: 'grossa' },
    sweepTo: null,
    sweep: 0,
    envIntensity: 1,
    envRot: 0,
    exposure: 1,
    keyLight: 1,
    kicker: [0, 0, 10],
    kickerIntensity: 0,
    pool: [0.5, 0.52, 0.55],
    beam: 0.1,
    lift: 0,
    tint: '#ffffff',
    tintAmt: 0,
    grid: 0,
    gridPos: [0, 0, -14],
    gridRot: [0, 0, 0],
    title: {
      text: '',
      weight: 100,
      tracking: -0.02,
      opacity: 0,
      reveal: 1,
      blur: 0,
      pos: [0, 0, -16],
      height: 14,
      billboard: true,
    },
    dof: 0,
    focus: null,
    aperture: 0.004,
    maxBlur: 0.01,
    bloom: 0.22,
    bloomThreshold: 1.7,
    grain: 0.045,
    vignette: 0.55,
    fade: 0,
    flash: 0,
    particles: 0,
    particlesExpand: 0,
    core: 0,
    coreScale: 1,
    coreRot: 0,
    corePos: [0, 0, 0],
    foam: 0,
    foamPos: [0, -20, 0],
    foamRot: [0, 0, 0],
    debris: 0,
    debrisT: 0,
  };
}
