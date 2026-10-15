/**
 * Deterministic random numbers. Every bit of "randomness" in the rig comes from
 * here so that the browser experience and the Remotion render produce the very
 * same object, crystal for crystal.
 */
export type Rng = {
  (): number;
  range(min: number, max: number): number;
  int(min: number, maxExclusive: number): number;
  sign(): number;
  gauss(): number;
  pick<T>(list: readonly T[]): T;
};

export function rng(seed: number): Rng {
  let s = seed >>> 0 || 0x9e3779b9;
  const next = (() => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  next.range = (min, max) => min + (max - min) * next();
  next.int = (min, maxExclusive) => Math.floor(min + (maxExclusive - min) * next());
  next.sign = () => (next() < 0.5 ? -1 : 1);
  next.gauss = () => {
    const u = Math.max(1e-9, next());
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  next.pick = (list) => list[Math.floor(next() * list.length) % list.length];
  return next;
}

/** Stable 32-bit hash for strings, used to derive sub-seeds. */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
