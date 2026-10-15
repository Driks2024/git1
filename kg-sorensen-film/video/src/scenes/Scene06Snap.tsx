import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { Dimension } from '../components/Dimension';
import { Words, bodyStyle, displayStyle } from '../components/Type';
import { useScene } from '../components/useScene';
import type { Projected } from '../stage/StageContext';

/**
 * 00:24–00:27 — REMONTAGEM. Every piece accelerates home; the snap lands
 * with a lime flash; the reassembled bur gets its engineering dimensions.
 */
export const Scene06Snap: React.FC = () => {
  const { f, stage } = useScene('snap');
  const s0 = BEATS.snap - SCENES.snap.from;
  const len = SCENES.snap.to - SCENES.snap.from;
  const vis = life(f, s0 + 4, len + 16, 8, 12);
  const pts = stage?.points ?? {};
  // diameter: 1.6 mm measured with the projected axis scale
  const s0p = pts.shank0;
  const s1p = pts.shank1;
  let dia: { a?: Projected; b?: Projected } = {};
  if (s0p && s1p) {
    const mm = Math.hypot(s1p.x - s0p.x, s1p.y - s0p.y);
    const ux = (s1p.x - s0p.x) / (mm || 1);
    const uy = (s1p.y - s0p.y) / (mm || 1);
    const r = 0.8 * mm;
    dia = {
      a: { ...s0p, x: s0p.x - -uy * r, y: s0p.y - ux * r },
      b: { ...s0p, x: s0p.x + -uy * r, y: s0p.y + ux * r },
    };
  }
  const flash = Math.max(0, 1 - Math.abs(f - s0) / 6);
  return (
    <AbsoluteFill>
      {/* lime hairline flash across the frame at the snap */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 960,
          height: 2,
          background: COLORS.lime,
          opacity: flash * 0.8,
          transform: `scaleX(${prog(f, s0 - 2, 8)})`,
          boxShadow: `0 0 24px ${COLORS.lime}`,
        }}
      />
      <Dimension a={pts.dimA} b={pts.dimB} offset={120} label="≈ 19 MM" start={s0 + 6} end={len + 18} />
      <Dimension a={dia.b} b={dia.a} offset={-70} label="Ø 1,60 MM" start={s0 + 12} end={len + 18} extension={false} />
      <At x={SAFE.left} y={1330} w={SAFE.right - SAFE.left} opacity={vis}>
        <Words text={COPY.snap.title} start={s0 + 4} stagger={4} style={displayStyle(TYPE.title, 200)} />
        <div style={{ height: 18 }} />
        <Words text={COPY.snap.body} start={s0 + 12} stagger={3} style={{ ...bodyStyle(TYPE.body, 300, COLORS.steel), maxWidth: 520 }} />
      </At>
    </AbsoluteFill>
  );
};
