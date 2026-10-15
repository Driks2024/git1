import { FilmRenderer } from '../../shared/stage/FilmRenderer';
import { evaluate, VARIANT_SEQ } from '../../shared/timeline/film';
import { GRITS, type Variant } from '../../shared/bur/profiles';
import { clamp, dampFactor, easeInOutSine, range, smooth } from '../../shared/util/ease';
import { loadFonts, loadImage } from './assets';
import { SmoothProgress } from './scroll';
import { Overlay } from './ui';
import markUrl from '../../shared/assets/logo-mark-white.png';

declare global {
  interface Window {
    __film?: {
      seek: (p: number) => void;
      progress: () => number;
      ready: boolean;
      frames: number;
      state: () => unknown;
    };
  }
}

const params = new URLSearchParams(location.search);
const loaderEl = document.getElementById('loader')!;
const setLoad = (k: number) => {
  loaderEl.querySelector<HTMLElement>('.loader-bar i')!.style.setProperty('--k', String(k));
  loaderEl.querySelector('.loader-pct')!.textContent = `${String(Math.round(k * 100)).padStart(2, '0')}%`;
};
const tick = () => new Promise((r) => setTimeout(r, 0));

async function boot() {
  history.scrollRestoration = 'manual';
  setLoad(0.05);
  await loadFonts();
  setLoad(0.18);
  const logo = await loadImage(markUrl);
  setLoad(0.26);
  await tick();

  const canvas = document.getElementById('film') as HTMLCanvasElement;
  // the canvas is 100lvh: its box does not change when a phone's toolbar
  // shows or hides, so neither the drawing buffer nor the scroll mapping does
  const view = () => ({ w: canvas.clientWidth || innerWidth, h: canvas.clientHeight || innerHeight });
  let size = view();
  const maxDpr = Number(params.get('dpr')) || Math.min(window.devicePixelRatio || 1, size.w < 760 ? 1.5 : 1.75);
  let dpr = maxDpr;
  const film = new FilmRenderer({
    canvas,
    logo,
    width: size.w,
    height: size.h,
    dpr,
    samples: innerWidth < 760 ? 2 : 4,
    crystalCap: innerWidth < 760 ? 1600 : 3200,
    preserveDrawingBuffer: params.has('shot'),
  });
  setLoad(0.55);
  await tick();
  await film.warmup();
  setLoad(0.8);
  await tick();
  // a few representative frames behind the loader: post programs, uploads
  if (!params.has('shot')) film.warmFrames([0.25, 0.47, 0.66, 0.79, 0.9, 0.94, 0.99].map((p) => evaluate(p, 0)));
  setLoad(0.95);
  await tick();

  const scroll = new SmoothProgress(document.getElementById('spacer')!, 15, () => size.h);
  // reduced motion: no inertia, the film follows the scroll exactly, no self-running loops
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = reduce ? 0 : 1;
  scroll.snap = params.has('snap') || reduce;

  // ------------------------------------------------------------- final scene interaction
  const hero = VARIANT_SEQ[VARIANT_SEQ.length - 1];
  const live = {
    current: { ...hero } as Variant,
    from: { ...hero } as Variant,
    to: null as Variant | null,
    next: null as Variant | null,
    t0: 0,
    tEnter: 0,
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    dragging: false,
    dragX: 0,
    dragY: 0,
    spin: 0,
    spinV: 0,
    tilt: 0,
    tiltV: 0,
    lastX: 0,
    lastY: 0,
  };
  let now = 0;
  const overlay = new Overlay(document.getElementById('ui')!, markUrl, {
    onVariant: (v) => {
      // a pick during a running sweep waits for it to finish (no half-bur pop)
      if (live.to) {
        live.next = { ...v };
        return;
      }
      startSweep(v);
    },
  });
  overlay.reduceMotion = reduce;
  function startSweep(v: Variant) {
    if (v.shape === live.current.shape && v.grit === live.current.grit) return;
    live.from = { ...live.current };
    live.to = { ...v };
    live.t0 = now;
  }
  const crystals = () => film.bur.counts().crystals;

  // pointer
  addEventListener('pointermove', (e) => {
    live.tx = (e.clientX / innerWidth) * 2 - 1;
    live.ty = (e.clientY / innerHeight) * 2 - 1;
    if (live.dragging) {
      live.spin += (e.clientX - live.lastX) * 0.012;
      live.tilt = clamp(live.tilt + (e.clientY - live.lastY) * 0.006, -0.9, 0.9);
      live.lastX = e.clientX;
      live.lastY = e.clientY;
    }
  });
  canvas.style.touchAction = 'pan-y';
  const canDrag = () => scroll.value > 0.975;
  addEventListener('pointerdown', (e) => {
    if (!canDrag()) return;
    if ((e.target as HTMLElement).closest('.interactive')) return;
    live.dragging = true;
    live.lastX = e.clientX;
    live.lastY = e.clientY;
    cursor.classList.add('drag');
  });
  const release = () => {
    if (live.dragging) {
      // unwind at most half a turn back to the symmetric centre
      live.spin = ((((live.spin + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    }
    live.dragging = false;
    cursor.classList.remove('drag');
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('blur', release);

  // cursor
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.innerHTML = '<span>ARRASTE</span>';
  let cx = innerWidth / 2;
  let cy = innerHeight / 2;
  let mx = cx;
  let my = cy;
  if (matchMedia('(pointer: fine)').matches) {
    document.body.append(cursor);
    document.body.classList.add('has-cursor');
    addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target as HTMLElement;
      cursor.classList.toggle('big', !!t.closest('[data-cursor]'));
    });
  }

  // debug hook ----------------------------------------------------------------
  addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') overlay.toggleHud();
  });
  let frames = 0;
  let lastState: unknown = null;
  window.__film = {
    seek: (p: number) => {
      if (Number.isFinite(p)) scroll.seek(clamp(p));
    },
    progress: () => scroll.value,
    ready: false,
    get frames() {
      return frames;
    },
    state: () => lastState,
  } as Window['__film'];
  if (params.has('debug')) overlay.toggleHud();

  addEventListener('resize', () => {
    const v = view();
    if (v.w === size.w && v.h === size.h) return; // toolbar show/hide: nothing to do
    size = v;
    film.resize(size.w, size.h, dpr);
    scroll.layout();
  });

  // adaptive resolution: rolling window with hysteresis, both directions
  const win: number[] = [];
  let bad = 0;
  let good = 0;
  const adapt = (dt: number) => {
    if (params.has('dpr') || params.has('shot')) return;
    win.push(dt);
    if (win.length < 90) return;
    const avg = win.reduce((a, b) => a + b, 0) / win.length;
    const sd = Math.sqrt(win.reduce((a, b) => a + (b - avg) * (b - avg), 0) / win.length);
    win.length = 0;
    // a steady 30 Hz cadence is a browser/battery cap, not the GPU
    const capped = Math.abs(avg - 1 / 30) < 0.002 && sd < 0.002;
    if (capped) return;
    bad = avg > 0.022 ? bad + 1 : 0;
    good = avg < 0.0145 ? good + 1 : 0;
    if (bad >= 2 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      film.resize(size.w, size.h, dpr);
      bad = 0;
    } else if (good >= 4 && dpr < maxDpr) {
      dpr = Math.min(maxDpr, dpr + 0.25);
      film.resize(size.w, size.h, dpr);
      good = 0;
    }
  };

  const t = Number((params.get('t') ?? '').replace(',', '.'));
  if (params.has('t') && Number.isFinite(t)) scroll.seek(clamp(t));

  setLoad(1);
  loaderEl.classList.add('done');

  let last = performance.now();
  const loop = (ms: number) => {
    const dt = Math.min(0.1, (ms - last) / 1000);
    last = ms;
    now = params.has('shot') ? Number(params.get('time') ?? 4) : ms / 1000;
    const p = scroll.update(dt);
    const s = evaluate(p, now);

    // ---- final scene: scroll hands over to interaction
    const k = smooth(range(p, 0.972, 0.995));
    if (k === 0) live.tEnter = now; // the idle motion starts when the final starts
    const idle = (now - live.tEnter) * motion;
    // live variant: handed over while the bur is dissolved (p ≥ .944), so the
    // switch from the timeline's hero to the visitor's pick is never seen
    if (p >= 0.944) {
      if (live.to) {
        const u = motion ? clamp((now - live.t0) / 1.1) : 1;
        s.variant = live.from;
        s.sweepTo = live.to;
        s.sweep = easeInOutSine(u);
        if (u >= 1) {
          live.current = live.to;
          live.to = null;
          if (live.next) {
            const n = live.next;
            live.next = null;
            startSweep(n);
          }
        }
      } else {
        s.variant = live.current;
        s.sweepTo = null;
      }
    }
    if (k > 0) {
      const f = dampFactor(4, dt);
      live.px += (live.tx - live.px) * f;
      live.py += (live.ty - live.py) * f;
      if (!live.dragging) {
        // springs back to the symmetric centre
        const ks = 22;
        const cs = 2 * Math.sqrt(ks);
        live.spinV += (-ks * live.spin - cs * live.spinV) * dt;
        live.spin += live.spinV * dt;
        live.tiltV += (-ks * live.tilt - cs * live.tiltV) * dt;
        live.tilt += live.tiltV * dt;
      } else {
        live.spinV = 0;
        live.tiltV = 0;
      }
      s.cam = [s.cam[0] + live.px * 2.4 * k, s.cam[1] - live.py * 1.4 * k, s.cam[2]];
      s.burRot = [s.burRot[0] + (live.py * 0.08 + live.tilt) * k, s.burRot[1] + live.px * 0.12 * k, s.burRot[2]];
      s.burSpin += live.spin + ((idle * 0.22) % (2 * Math.PI)) * k;
      s.envRot += Math.sin(idle * 0.25) * 0.7 * k;
      const shown = live.to && s.sweep > 0.5 ? live.to : live.current;
      s.tint = GRITS[shown.grit].color;
      s.tintAmt = 0.1 * k;
      s.ringGlow += 0.25 * k;
    }

    film.render(s);
    overlay.update(p, s, film, crystals());
    lastState = { p, beat: s.explode, cam: s.cam, variant: s.variant };

    // cursor easing
    const cf = dampFactor(18, dt);
    cx += (mx - cx) * cf;
    cy += (my - cy) * cf;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;

    frames++;
    if (frames > 30) adapt(dt);
    if (frames === 3) window.__film!.ready = true;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot().catch((e) => {
  console.error(e);
  loaderEl.querySelector('.loader-pct')!.textContent = 'WebGL indisponível neste navegador.';
});
