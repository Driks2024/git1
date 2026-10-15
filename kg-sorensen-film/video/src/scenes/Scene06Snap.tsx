import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE, VIDEO } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { Dimension } from '../components/Dimension';
import { Words, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

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
  // diameter callout: a lime line across the shank (1.6 mm at the projected
  // axis scale) and a short leader to the label on the left
  const s0p = pts.shank0;
  const s1p = pts.shank1;
  let dia: React.ReactNode = null;
  if (s0p && s1p) {
    const mm = Math.hypot(s1p.x - s0p.x, s1p.y - s0p.y) || 1;
    const ux = (s1p.x - s0p.x) / mm;
    const uy = (s1p.y - s0p.y) / mm;
    const r = 0.8 * mm;
    const ax = s0p.x + uy * r; // left edge (perpendicular to the axis)
    const ay = s0p.y - ux * r;
    const bx = s0p.x - uy * r;
    const by = s0p.y + ux * r;
    const k = prog(f, s0 + 12, 14);
    const lead = prog(f, s0 + 18, 14);
    const lx = ax - 26 - 150 * lead;
    dia = (
      <div style={{ position: 'absolute', inset: 0, opacity: vis }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line x1={ax} y1={ay} x2={ax + (bx - ax) * k} y2={ay + (by - ay) * k} stroke={COLORS.lime} strokeWidth={2.4} />
          <line x1={ax} y1={ay - 10} x2={ax} y2={ay + 10} stroke={COLORS.lime} strokeWidth={2} opacity={k} />
          <line x1={bx} y1={by - 10} x2={bx} y2={by + 10} stroke={COLORS.lime} strokeWidth={2} opacity={k} />
          <line x1={ax - 26} y1={ay} x2={lx} y2={ay} stroke="rgba(236,238,240,0.7)" strokeWidth={1.4} />
        </svg>
        <div
          style={{
            ...monoStyle(TYPE.monoSmall + 1, COLORS.paper),
            position: 'absolute',
            right: VIDEO.width - lx + 16,
            top: ay,
            transform: 'translateY(-50%)',
            opacity: prog(f, s0 + 26, 12),
          }}
        >
          Ø 1,60 MM
          <div style={{ ...monoStyle(TYPE.monoSmall - 4, COLORS.steel), textAlign: 'right' }}>HASTE FG</div>
        </div>
      </div>
    );
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
      {dia}
      <At x={SAFE.left} y={1330} w={SAFE.right - SAFE.left} opacity={vis}>
        <Words text={COPY.snap.title} start={s0 + 4} stagger={4} style={displayStyle(TYPE.title, 200)} />
        <div style={{ height: 18 }} />
        <Words text={COPY.snap.body} start={s0 + 12} stagger={3} style={{ ...bodyStyle(TYPE.body, 300, COLORS.steel), maxWidth: 520 }} />
      </At>
    </AbsoluteFill>
  );
};
