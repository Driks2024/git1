// Scroll-driven poses for the 3D bur. Each section declares data-pose="<key>";
// the target pose blends section by section as each one rises into view.

export const POSES = {
  hero:      { x: 0,    y: -0.25, z: 0,    rx: 0.1,  rz: 0,     s: 1.12, spin: 0.35, glow: 1.0 },
  protocolo: { x: 2.35, y: -0.1,  z: -0.6, rx: 0.35, rz: -0.62, s: 0.8,  spin: 1.4,  glow: 0.95 },
  campanha:  { x: -2.6, y: 0.05,  z: -1.2, rx: 0.2,  rz: 0.55,  s: 0.72, spin: 0.9,  glow: 0.85 },
  filme:     { x: 2.7,  y: 0.15,  z: -1.6, rx: -0.2, rz: -1.15, s: 0.72, spin: 2.4,  glow: 0.9 },
  condicoes: { x: 3.4,  y: 0.9,   z: -3.0, rx: 0.5,  rz: 1.2,   s: 0.8,  spin: 0.6,  glow: 0.55 },
  garantia:  { x: -2.5, y: -0.3,  z: -1.1, rx: 0.2,  rz: 0.4,   s: 0.76, spin: 0.6,  glow: 0.8 },
  final:     { x: 2.5,  y: -0.2,  z: -0.4, rx: 0.1,  rz: -0.2,  s: 1.0,  spin: 3.2,  glow: 1.2 },
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
