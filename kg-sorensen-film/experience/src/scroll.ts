/**
 * The page never scrolls visibly: native scroll (wheel, trackpad, keys, touch)
 * only drives a progress value, smoothed by a critically damped spring so the
 * film has weight — it glides on, and settles.
 */
export class SmoothProgress {
  target = 0;
  value = 0;
  private vel = 0;
  private spacer: HTMLElement;
  snap = false;

  constructor(spacer: HTMLElement, private screens = 15) {
    this.spacer = spacer;
    this.layout();
    addEventListener('resize', () => this.layout());
    addEventListener('scroll', () => this.read(), { passive: true });
    this.read();
    this.value = this.target;
  }

  layout() {
    this.spacer.style.height = `${Math.round(innerHeight * this.screens)}px`;
    this.read();
  }

  private max() {
    return Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }

  read() {
    this.target = Math.min(1, Math.max(0, scrollY / this.max()));
  }

  /** Jump (scroll position and smoothed value) to p. */
  seek(p: number, instant = true) {
    const y = p * this.max();
    scrollTo({ top: y, behavior: instant ? 'instant' : 'smooth' } as ScrollToOptions);
    this.target = p;
    if (instant) {
      this.value = p;
      this.vel = 0;
    }
  }

  update(dt: number) {
    if (this.snap) {
      this.value = this.target;
      this.vel = 0;
      return this.value;
    }
    const k = 34; // stiffness
    const c = 2 * Math.sqrt(k); // critical damping
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = k * (this.target - this.value) - c * this.vel;
      this.vel += a * h;
      this.value += this.vel * h;
    }
    if (Math.abs(this.target - this.value) < 1e-6 && Math.abs(this.vel) < 1e-6) this.value = this.target;
    this.value = Math.min(1, Math.max(0, this.value));
    return this.value;
  }
}
