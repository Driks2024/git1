import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { AnchorName } from '../../../shared/bur/Bur';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { LeaderLabel } from '../components/LeaderLabel';
import { Counter, Kicker, Words, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';
import type { Projected } from '../stage/StageContext';

/** Right edge of the legend column (labels live left of the exploded column). */
const LEGEND_X = 470;
const MIN_GAP = 86;

/**
 * Legend rows (listed top → bottom in config) follow their anchors' heights,
 * clamped into [top, bottom] and kept at least MIN_GAP apart (forward pass,
 * then a backward pass from the bottom). The order is fixed, so rows never
 * swap while the camera drifts.
 */
function stack(anchors: (Projected | null)[], top: number, bottom: number): number[] {
  const order = anchors.map((a, i) => ({ i, y: Math.min(bottom, Math.max(top, a ? a.y : top)) }));
  for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + MIN_GAP);
  if (order[order.length - 1].y > bottom) {
    order[order.length - 1].y = bottom;
    for (let k = order.length - 2; k >= 0; k--) order[k].y = Math.min(order[k].y, order[k + 1].y - MIN_GAP);
  }
  const ys: number[] = new Array(anchors.length).fill(top);
  for (const o of order) ys[o.i] = o.y;
  return ys;
}

/**
 * 00:14–00:20 — VISTA EXPLODIDA, the hero moment. The bur separates slowly
 * over a technical grid: drawing on the right, legend 01–06 on the left,
 * crystal counter of the 3D model.
 */
export const Scene04Exploded: React.FC = () => {
  const { f, stage } = useScene('exploded');
  const len = SCENES.exploded.to - SCENES.exploded.from;
  const vis = life(f, 26, len + 8, 12, 1);
  const e0 = BEATS.explodeStart - SCENES.exploded.from;
  const e1 = BEATS.explodeEnd - SCENES.exploded.from;
  const crystals = stage?.counts?.crystals ?? 0;
  const anchors = COPY.exploded.labels.map((l) => stage?.anchors[l.anchor as AnchorName] ?? null);
  const ys = stack(anchors, 600, SAFE.bottom - 210);
  return (
    <AbsoluteFill>
      <At x={SAFE.left} y={SAFE.top + 18} w={SAFE.right - SAFE.left} opacity={vis}>
        <Kicker text={COPY.exploded.kicker} start={30} />
        <div style={{ height: 24 }} />
        <Words text={COPY.exploded.title[0]} start={40} stagger={4} style={displayStyle(TYPE.title - 22, 200)} />
        <Words
          text={COPY.exploded.title[1]}
          start={58}
          stagger={4}
          style={displayStyle(TYPE.title - 22, 200, COLORS.paper)}
          accent={['ponta']}
        />
      </At>
      {/* crystal counter: a count of the 3D model, labelled as such */}
      <At x={SAFE.left} y={SAFE.bottom - 128} opacity={life(f, e0 + 6, len + 8, 12, 1)}>
        <div style={{ ...displayStyle(92, 200, COLORS.paper), fontVariantNumeric: 'tabular-nums' }}>
          {crystals > 0 ? <Counter to={crystals} start={e0 + 6} dur={e1 - e0} /> : '—'}
        </div>
        <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.steel), marginTop: 10 }}>{COPY.exploded.counterLabel}</div>
      </At>
      {COPY.exploded.labels.map((l, i) => {
        const a = anchors[i];
        const s = e1 - 8 + i * 6;
        return (
          <LeaderLabel
            key={l.index}
            anchor={a}
            to={{ x: LEGEND_X, y: ys[i] }}
            start={s}
            end={len + 30}
            title={l.title}
            sub={l.sub}
            index={l.index}
            size={TYPE.monoSmall}
          />
        );
      })}
      <At right={SAFE.right} y={SAFE.top + 22} opacity={prog(f, e0, 20) * vis}>
        <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.kgGray), textAlign: 'right' }}>
          EXPLOSÃO <span style={{ color: COLORS.lime }}>{String(Math.round((stage?.state?.explode ?? 0) * 100)).padStart(3, ' ')}%</span>
        </div>
      </At>
    </AbsoluteFill>
  );
};
