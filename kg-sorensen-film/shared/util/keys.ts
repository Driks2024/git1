import { clamp, linear, type Ease, easeInOutCubic } from './ease';

/**
 * Keyframe tracks. A track is a list of [time, value, ease] where `ease`
 * shapes the segment that ARRIVES at that key. Values can be numbers or
 * fixed-length number arrays (vectors). Evaluation clamps to the ends, so a
 * track can be sampled anywhere on the timeline.
 */
export type KeyValue = number | readonly number[];
export type Key<V extends KeyValue> = readonly [time: number, value: V, ease?: Ease];

export class Track<V extends KeyValue> {
  readonly keys: Key<V>[];
  constructor(keys: Key<V>[], private readonly defaultEase: Ease = easeInOutCubic) {
    this.keys = [...keys].sort((a, b) => a[0] - b[0]);
  }

  at(t: number): V {
    const k = this.keys;
    if (t <= k[0][0]) return k[0][1];
    const last = k[k.length - 1];
    if (t >= last[0]) return last[1];
    let i = 1;
    while (i < k.length && k[i][0] < t) i++;
    const a = k[i - 1];
    const b = k[i];
    const span = b[0] - a[0];
    const raw = span <= 0 ? 1 : clamp((t - a[0]) / span);
    const e = (b[2] ?? this.defaultEase)(raw);
    return mix(a[1], b[1], e) as V;
  }
}

function mix(a: KeyValue, b: KeyValue, t: number): KeyValue {
  if (typeof a === 'number') return a + ((b as number) - a) * t;
  const out = new Array(a.length);
  const bb = b as readonly number[];
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (bb[i] - a[i]) * t;
  return out;
}

export const track = <V extends KeyValue>(keys: Key<V>[], ease?: Ease) => new Track<V>(keys, ease);
export const step = linear;
