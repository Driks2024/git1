// Scroll-driven poses for the 3D bur. Each section declares data-pose="<key>";
// the target pose blends section by section as each one rises into view.

export const POSES = {
  hero:      { x: 1.9,  y: -0.35, z: 0,    rx: 0.15, rz: -0.32, s: 1.25, spin: 0.3,  glow: 1.0 },
  marca:     { x: -0.2, y: 0.15,  z: -2.2, rx: 0.6,  rz: 1.45,  s: 1.1,  spin: 0.8,  glow: 0.6 },
  condicoes: { x: 3.3,  y: 0.9,   z: -2.8, rx: 0.3,  rz: -0.7,  s: 0.85, spin: 0.6,  glow: 0.7 },
  filme:     { x: 3.4,  y: -0.6,  z: -3.2, rx: 0.2,  rz: -1.0,  s: 0.9,  spin: 1.6,  glow: 0.6 },
  garantia:  { x: 2.9,  y: 0.4,   z: -2.6, rx: 0.3,  rz: -0.6,  s: 0.9,  spin: 0.5,  glow: 0.8 },
  final:     { x: 2.9,  y: -0.3,  z: -1.0, rx: 0.12, rz: -0.25, s: 1.0,  spin: 2.4,  glow: 1.1 },
};

const KEYS = Object.keys(POSES.hero);

// Shared, mutable state written by the DOM side (scroll, Lenis) and read in useFrame.
export const live = {
  velocity: 0,
  anchors: [], // [{ top, pose }]
  reduced: false,
};

export function measureAnchors() {
  const secs = document.querySelectorAll("[data-pose]");
  live.anchors = Array.from(secs).map((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    pose: POSES[el.dataset.pose] || POSES.hero,
  }));
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function targetPose(out) {
  const a = live.anchors;
  const vh = window.innerHeight;
  const y = window.scrollY;
  Object.assign(out, a.length ? a[0].pose : POSES.hero);
  for (let i = 1; i < a.length; i++) {
    const start = a[i].top - vh;
    const end = a[i].top - vh * 0.25;
    const k = Math.min(Math.max((y - start) / (end - start), 0), 1);
    if (k <= 0) break;
    const e = ease(k);
    for (const key of KEYS) out[key] += (a[i].pose[key] - out[key]) * e;
  }
  return out;
}
