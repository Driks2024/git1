import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { AnchorName } from '../../../shared/bur/Bur';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { LeaderLabel } from '../components/LeaderLabel';
import { Counter, Kicker, Words, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

/** Label side + offset per exploded part (px from the anchor). */
const PLACE: { dx: number; dy: number }[] = [
  { dx: 250, dy: -150 }, // crystals
  { dx: -260, dy: -60 }, // tiles
  { dx: 250, dy: 70 }, // core
  { dx: -250, dy: 40 }, // neck
  { dx: 250, dy: 60 }, // ring
  { dx: -250, dy: 80 }, // shank slices
];

/**
 * 00:14–00:20 — VISTA EXPLODIDA, the hero moment. The bur separates slowly
 * over a technical grid; pieces counter; labels 01–06 tied to the parts.
 */
export const Scene04Exploded: React.FC = () => {
  const { f, stage } = useScene('exploded');
  const len = SCENES.exploded.to - SCENES.exploded.from;
  const vis = life(f, 26, len + 8, 12, 1);
  const e0 = BEATS.explodeStart - SCENES.exploded.from;
  const e1 = BEATS.explodeEnd - SCENES.exploded.from;
  const crystals = stage?.counts?.crystals ?? 0;
  return (
    <AbsoluteFill>
      <At x={SAFE.left} y={SAFE.top + 18} w={SAFE.right - SAFE.left} opacity={vis}>
        <Kicker text={COPY.exploded.kicker} start={30} />
        <div style={{ height: 26 }} />
        <Words text={COPY.exploded.title[0]} start={40} stagger={4} style={displayStyle(TYPE.title - 16, 200)} />
        <Words
          text={COPY.exploded.title[1]}
          start={58}
          stagger={4}
          style={displayStyle(TYPE.title - 16, 200, COLORS.paper)}
          accent={['ponta']}
        />
      </At>
      {/* crystal counter: a count of the 3D model, labelled as such */}
      <At x={SAFE.left} y={SAFE.bottom - 120} opacity={life(f, e0 + 6, len + 8, 12, 1)}>
        <div style={{ ...displayStyle(84, 200, COLORS.paper), fontVariantNumeric: 'tabular-nums' }}>
          {crystals > 0 ? <Counter to={crystals} start={e0 + 6} dur={e1 - e0} style={{ fontWeight: 200 }} /> : '—'}
        </div>
        <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.steel), marginTop: 10 }}>{COPY.exploded.counterLabel}</div>
      </At>
      {COPY.exploded.labels.map((l, i) => {
        const a = stage?.anchors[l.anchor as AnchorName] ?? null;
        const p = PLACE[i];
        const s = e1 - 6 + i * 7;
        return (
          <LeaderLabel
            key={l.index}
            anchor={a}
            to={a ? { x: a.x + p.dx, y: a.y + p.dy } : { x: 0, y: 0 }}
            start={s}
            end={len + 30}
            title={l.title}
            sub={l.sub}
            index={l.index}
            size={TYPE.monoSmall + 1}
          />
        );
      })}
      <At right={SAFE.right} y={SAFE.bottom - 58} opacity={prog(f, e0, 20) * vis}>
        <div style={monoStyle(TYPE.monoSmall, COLORS.kgGray)}>
          EXPLOSÃO <span style={{ color: COLORS.lime }}>{Math.round((stage?.state?.explode ?? 0) * 100)}%</span>
        </div>
      </At>
    </AbsoluteFill>
  );
};
