import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, TYPE } from '../config';
import type { Projected } from '../stage/StageContext';
import { EASE, life, prog } from './anim';
import { monoStyle } from './Type';

/**
 * Engineering dimension between two projected points, offset sideways,
 * with end ticks and a label running along it. Draws itself on.
 */
export const Dimension: React.FC<{
  a: Projected | undefined;
  b: Projected | undefined;
  offset: number;
  label: string;
  start: number;
  end: number;
  extension?: boolean;
  labelSide?: 1 | -1;
}> = ({ a, b, offset, label, start, end, extension = true, labelSide = 1 }) => {
  const f = useCurrentFrame();
  if (!a || !b) return null;
  const vis = life(f, start, end, 10, 10);
  if (vis <= 0) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  // perpendicular (to the right of a→b)
  const px = -uy;
  const py = ux;
  const A = { x: a.x + px * offset, y: a.y + py * offset };
  const B = { x: b.x + px * offset, y: b.y + py * offset };
  const k = prog(f, start + 4, 22, EASE.inOut);
  const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const half = (L / 2) * k;
  const A2 = { x: mid.x - ux * half, y: mid.y - uy * half };
  const B2 = { x: mid.x + ux * half, y: mid.y + uy * half };
  const t = 12;
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  // keep the label upright-ish
  const rot = ang > 90 || ang < -90 ? ang + 180 : ang;
  const textK = prog(f, start + 14, 14);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: vis }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {extension ? (
          <g stroke="rgba(236,238,240,0.32)" strokeWidth={1} strokeDasharray="3 5">
            <line x1={a.x + px * 10} y1={a.y + py * 10} x2={A.x + px * 14 * k} y2={A.y + py * 14 * k} />
            <line x1={b.x + px * 10} y1={b.y + py * 10} x2={B.x + px * 14 * k} y2={B.y + py * 14 * k} />
          </g>
        ) : null}
        <line x1={A2.x} y1={A2.y} x2={B2.x} y2={B2.y} stroke={COLORS.paper} strokeOpacity={0.8} strokeWidth={1.3} />
        <g stroke={COLORS.lime} strokeWidth={2} opacity={k}>
          <line x1={A.x - px * t} y1={A.y - py * t} x2={A.x + px * t} y2={A.y + py * t} />
          <line x1={B.x - px * t} y1={B.y - py * t} x2={B.x + px * t} y2={B.y + py * t} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: mid.x + px * 30 * labelSide,
          top: mid.y + py * 30 * labelSide,
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
          opacity: textK,
          ...monoStyle(TYPE.monoSmall, COLORS.paper),
          padding: '4px 10px',
          background: 'rgba(5,5,6,0.55)',
        }}
      >
        {label}
      </div>
    </div>
  );
};
