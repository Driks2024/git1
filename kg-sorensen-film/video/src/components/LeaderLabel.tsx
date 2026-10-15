import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, SAFE, TYPE, VIDEO } from '../config';
import type { Projected } from '../stage/StageContext';
import { EASE, lerp, life, prog } from './anim';
import { monoStyle } from './Type';

/** Rough width of tracked uppercase mono text (JetBrains Mono ≈ 0.6em + tracking). */
export const monoWidth = (text: string, size: number) => text.length * size * 0.76;

/**
 * Technical label tied to a 3D point by a thin leader line:
 * anchor ring → 45° diagonal → horizontal run → text block.
 * The label is pushed back inside the social safe area if needed.
 */
export const LeaderLabel: React.FC<{
  anchor: Projected | null;
  /** where the horizontal run ends (label side), in composition px */
  to: { x: number; y: number };
  start: number;
  end: number;
  title: string;
  sub?: string;
  index?: string;
  size?: number;
  accent?: boolean;
}> = ({ anchor, to, start, end, title, sub, index, size = TYPE.mono, accent = false }) => {
  const f = useCurrentFrame();
  if (!anchor || anchor.behind) return null;
  const vis = life(f, start, end, 8, 8);
  if (vis <= 0) return null;
  const subSize = Math.round(size * 0.84);
  const head = index ? `${index}  ${title}` : title;
  const w = Math.max(monoWidth(head, size), sub ? monoWidth(sub, subSize) : 0);
  const right = to.x >= anchor.x;
  const gap = 16;
  // keep the text block inside the safe area
  let lx = to.x;
  if (right) lx = Math.min(lx, SAFE.right - w - gap);
  else lx = Math.max(lx, SAFE.left + w + gap);
  const ly = Math.min(Math.max(to.y, SAFE.top + 40), SAFE.bottom - 40);
  const ax = anchor.x;
  const ay = anchor.y;
  const dy = ly - ay;
  const dirX = right ? 1 : -1;
  const diag = Math.min(Math.abs(dy), Math.abs(lx - ax) * 0.8);
  const ex = ax + dirX * diag;
  const ey = ly;
  const L1 = Math.hypot(ex - ax, ey - ay);
  const L2 = Math.abs(lx - ex);
  const L = L1 + L2;
  const draw = prog(f, start + 2, 14, EASE.inOut);
  const dot = prog(f, start, 10);
  const text = prog(f, start + 9, 14);
  const lineColor = accent ? COLORS.lime : 'rgba(236,238,240,0.62)';

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: vis }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={ax} cy={ay} r={lerp(26, 11, dot)} fill="none" stroke={COLORS.paper} strokeOpacity={0.75 * dot} strokeWidth={1.4} />
        <circle cx={ax} cy={ay} r={3.6 * dot} fill={COLORS.lime} />
        <path
          d={`M ${ax} ${ay} L ${ex} ${ey} L ${lx} ${ly}`}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.4}
          strokeDasharray={L}
          strokeDashoffset={L * (1 - draw)}
        />
        <circle cx={lx} cy={ly} r={2.6 * draw} fill={COLORS.paper} />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: ly,
          left: right ? lx + gap : undefined,
          right: right ? undefined : VIDEO.width - lx + gap,
          transform: `translateY(-50%) translateX(${(1 - text) * (right ? -14 : 14)}px)`,
          opacity: text,
          textAlign: right ? 'left' : 'right',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={monoStyle(size, COLORS.paper)}>
          {index ? <span style={{ color: COLORS.lime, marginRight: '0.9em' }}>{index}</span> : null}
          {title}
        </div>
        {sub ? <div style={{ ...monoStyle(subSize, COLORS.steel), opacity: 0.85 }}>{sub}</div> : null}
      </div>
    </div>
  );
};
