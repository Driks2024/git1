import React from 'react';
import { AbsoluteFill } from 'remotion';
import { GRITS, GRIT_ORDER, SHAPES } from '../../../shared/bur/profiles';
import { COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { EASE, life, prog } from '../components/anim';
import { At, Scrim } from '../components/Layout';
import { Hairline, Kicker, MaskLine, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';
import { SWEEPS, VARIANT_SEQ } from '../timeline';

const COL_W = 560;

/**
 * 00:27–00:32 — VARIAÇÕES. A laser line scans the bur from the tip down and
 * swaps shape + grit: CHAMA·FINA → CILÍNDRICA·MÉDIA → TRONCO-CÔNICA·EXTRAFINA
 * → back to the hero ESFÉRICA·GROSSA. The ring colour is the grit code.
 */
export const Scene07Variations: React.FC = () => {
  const { f, stage } = useScene('variations');
  const len = SCENES.variations.to - SCENES.variations.from;
  const vis = life(f, 4, len - 2, 12, 12);
  const mids = SWEEPS.map((s) => (s.start + s.end) / 2 - SCENES.variations.from);
  const shownIndex = mids.filter((m) => f >= m).length;
  const shown = VARIANT_SEQ[shownIndex];

  // laser scan line, perpendicular to the projected bur axis
  const c = stage?.points.scanC;
  const u = stage?.points.scanU;
  let laser: React.ReactNode = null;
  if (c && u) {
    const mm = Math.hypot(u.x - c.x, u.y - c.y) || 1;
    const ax = (u.x - c.x) / mm;
    const ay = (u.y - c.y) / mm;
    const half = mm * 2.0;
    const x1 = c.x + -ay * half;
    const y1 = c.y + ax * half;
    const x2 = c.x - -ay * half;
    const y2 = c.y - ax * half;
    laser = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.lime} strokeWidth={12} strokeOpacity={0.16} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.limeSoft} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={x1} cy={y1} r={3.5} fill={COLORS.lime} />
        <circle cx={x2} cy={y2} r={3.5} fill={COLORS.lime} />
      </svg>
    );
  }

  return (
    <AbsoluteFill>
      <Scrim left={0.55} opacity={vis} />
      {laser}
      <At x={SAFE.left} y={SAFE.top + 18} w={COL_W} opacity={vis}>
        <Kicker text={COPY.variations.kicker} start={4} />
        <div style={{ height: 18 }} />
        <MaskLine start={10} dur={20}>
          <div style={bodyStyle(TYPE.body, 300, COLORS.paper)}>{COPY.variations.body}</div>
        </MaskLine>
      </At>

      {/* current variant: shape, grain size, grit + ring colour */}
      {VARIANT_SEQ.map((v, i) => {
        const a = i === 0 ? -20 : mids[i - 1];
        const b = i < mids.length ? mids[i] : len + 20;
        const k = life(f, a, b, 10, 6);
        if (k <= 0) return null;
        const g = GRITS[v.grit];
        return (
          <At key={i} x={SAFE.left} y={700} w={COL_W} opacity={k}>
            <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.kgGray), opacity: prog(f, a + 2, 10) }}>
              FORMATO {String(i === 4 ? 1 : i + 1).padStart(2, '0')}
            </div>
            <div style={{ height: 12 }} />
            <MaskLine start={Math.max(0, a)} dur={12}>
              <div style={{ ...displayStyle(70, 200), letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{SHAPES[v.shape].label}</div>
            </MaskLine>
            <div style={{ height: 18 }} />
            <div style={{ opacity: prog(f, a + 4, 12) }}>
              <div style={{ ...displayStyle(58, 300), fontVariantNumeric: 'tabular-nums' }}>
                ≈ <span style={{ color: COLORS.lime }}>{g.microns}</span> µm
              </div>
              <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.steel), marginTop: 14 }}>
                GRANULAÇÃO {g.label}
                <br />
                ANEL{' '}
                <span style={{ color: g.color }}>■</span> {g.ring}
              </div>
            </div>
          </At>
        );
      })}

      {/* grit code legend */}
      <At x={SAFE.left} y={1214} w={COL_W - 80} opacity={vis}>
        <div style={{ ...monoStyle(TYPE.monoSmall - 3, COLORS.kgGray), marginBottom: 14, opacity: prog(f, 16, 20, EASE.soft) }}>
          {COPY.variations.legend}
        </div>
        <Hairline start={14} dur={20} length={COL_W - 80} />
        {GRIT_ORDER.map((id, r) => {
          const g = GRITS[id];
          const on = shown.grit === id;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: `1px solid ${COLORS.hair}`,
                opacity: (on ? 1 : 0.5) * prog(f, 18 + r * 3, 12),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: g.color,
                    boxShadow: on ? `0 0 0 4px rgba(5,5,6,1), 0 0 0 5.5px ${g.color}` : 'none',
                  }}
                />
                <span style={monoStyle(TYPE.monoSmall, on ? COLORS.paper : COLORS.steel)}>{g.label}</span>
              </div>
              <span style={monoStyle(TYPE.monoSmall, on ? COLORS.paper : COLORS.steel)}>≈ {g.microns} µm</span>
            </div>
          );
        })}
      </At>
    </AbsoluteFill>
  );
};
