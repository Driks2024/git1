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
  const maxDpr = Number(params.get('dpr')) || Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 1.75);
  let dpr = maxDpr;
  const film = new FilmRenderer({
    canvas,
    logo,
    width: innerWidth,
    height: innerHeight,
    dpr,
    samples: innerWidth < 760 ? 2 : 4,
    crystalCap: innerWidth < 760 ? 1600 : 3200,
    preserveDrawingBuffer: params.has('shot'),
  });
  setLoad(0.55);
  await tick();
  await film.warmup();
  setLoad(0.9);
  await tick();

  const scroll = new SmoothProgress(document.getElementById('spacer')!, 15);
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
    t0: 0,
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
      if (live.to) live.current = live.to;
      if (v.shape === live.current.shape && v.grit === live.current.grit) return;
      live.from = { ...live.current };
      live.to = { ...v };
      live.t0 = now;
    },
  });
  overlay.reduceMotion = reduce;
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
    seek: (p: number) => scroll.seek(clamp(p)),
    progress: () => scroll.value,
    ready: false,
    get frames() {
      return frames;
    },
    state: () => lastState,
  } as Window['__film'];
  if (params.has('debug')) overlay.toggleHud();

  addEventListener('resize', () => {
    film.resize(innerWidth, innerHeight, dpr);
  });

  // adaptive resolution: protect 60 fps
  let acc = 0;
  let accN = 0;

  const t = params.get('t');
  if (t !== null) scroll.seek(clamp(Number(t)));

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
      s.burSpin += (live.spin + now * 0.22 * motion) * k;
      s.envRot += now * 0.16 * motion * k;
      // live variant switch with a laser sweep
      if (live.to) {
        const u = motion ? clamp((now - live.t0) / 1.1) : 1;
        s.variant = live.from;
        s.sweepTo = live.to;
        s.sweep = easeInOutSine(u);
        if (u >= 1) {
          live.current = live.to;
          live.to = null;
        }
      } else s.variant = live.current;
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

    // adaptive DPR after warm-up
    frames++;
    if (frames > 30 && frames < 400 && !params.has('dpr') && !params.has('shot')) {
      acc += dt;
      accN++;
      if (accN === 60) {
        const avg = acc / accN;
        if (avg > 0.024 && dpr > 1) {
          dpr = Math.max(1, dpr - 0.35);
          film.resize(innerWidth, innerHeight, dpr);
        }
        acc = 0;
        accN = 0;
      }
    }
    if (frames === 3) window.__film!.ready = true;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot().catch((e) => {
  console.error(e);
  loaderEl.querySelector('.loader-pct')!.textContent = 'WebGL indisponível neste navegador.';
});
