import React from 'react';
import { AbsoluteFill } from 'remotion';
import { GRITS, GRIT_ORDER, SHAPES } from '../../../shared/bur/profiles';
import { COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { EASE, life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { Kicker, MaskLine, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';
import { SWEEPS, VARIANT_SEQ } from '../timeline';

/**
 * 00:27–00:32 — VARIAÇÕES. A laser line scans the bur from the tip down and
 * swaps shape + grit: CHAMA·FINA → CILÍNDRICA·MÉDIA → TRONCO-CÔNICA·EXTRAFINA
 * → back to the hero ESFÉRICA·GROSSA. The ring colour is the grit code.
 */
export const Scene07Variations: React.FC = () => {
  const { f, F, stage } = useScene('variations');
  const len = SCENES.variations.to - SCENES.variations.from;
  const vis = life(f, 4, len - 2, 12, 12);
  const mids = SWEEPS.map((s) => (s.start + s.end) / 2 - SCENES.variations.from);
  const shownIndex = mids.filter((m) => f >= m).length;
  const shown = VARIANT_SEQ[shownIndex];

  // laser scan line
  const c = stage?.points.scanC;
  const u = stage?.points.scanU;
  let laser: React.ReactNode = null;
  if (c && u) {
    const mm = Math.hypot(u.x - c.x, u.y - c.y) || 1;
    const ax = (u.x - c.x) / mm;
    const ay = (u.y - c.y) / mm;
    const half = mm * 2.1;
    const x1 = c.x + -ay * half;
    const y1 = c.y + ax * half;
    const x2 = c.x - -ay * half;
    const y2 = c.y - ax * half;
    laser = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.lime} strokeWidth={10} strokeOpacity={0.18} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.limeSoft} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={x2} cy={y2} r={4} fill={COLORS.lime} />
      </svg>
    );
  }

  return (
    <AbsoluteFill>
      {laser}
      <At x={SAFE.left} y={SAFE.top + 18} w={640} opacity={vis}>
        <Kicker text={COPY.variations.kicker} start={4} />
        <div style={{ height: 18 }} />
        <MaskLine start={10} dur={20}>
          <div style={bodyStyle(TYPE.body, 300, COLORS.paper)}>{COPY.variations.body}</div>
        </MaskLine>
      </At>

      {/* current variant */}
      {VARIANT_SEQ.map((v, i) => {
        const a = i === 0 ? -20 : mids[i - 1];
        const b = i < mids.length ? mids[i] : len + 20;
        const k = life(f, a, b, 10, 6);
        if (k <= 0) return null;
        const g = GRITS[v.grit];
        return (
          <At key={i} x={SAFE.left} y={1226} w={SAFE.right - SAFE.left} opacity={k}>
            <MaskLine start={Math.max(0, a)} dur={12}>
              <div style={{ ...displayStyle(92, 200), letterSpacing: '0.01em' }}>{SHAPES[v.shape].label}</div>
            </MaskLine>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 14, opacity: prog(f, a + 4, 12) }}>
              <div style={{ ...displayStyle(52, 300), fontVariantNumeric: 'tabular-nums' }}>
                ≈ <span style={{ color: COLORS.lime }}>{g.microns}</span> µm
              </div>
              <div style={monoStyle(TYPE.monoSmall, COLORS.steel)}>
                GRANULAÇÃO {g.label} · ANEL {g.ring}
              </div>
            </div>
          </At>
        );
      })}

      {/* grit code legend */}
      <At x={SAFE.left} y={SAFE.bottom - 76} w={SAFE.right - SAFE.left} opacity={vis}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {GRIT_ORDER.map((id) => {
            const g = GRITS[id];
            const on = shown.grit === id;
            const k = on ? prog(F, 0, 1) : 0;
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: on ? 1 : 0.45 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: g.color,
                    boxShadow: on ? `0 0 0 4px rgba(5,5,6,1), 0 0 0 5.5px ${g.color}` : 'none',
                    transform: `scale(${on ? 1 + 0.15 * k : 1})`,
                  }}
                />
                <span style={monoStyle(TYPE.monoSmall - 1, on ? COLORS.paper : COLORS.steel)}>{g.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ ...monoStyle(TYPE.monoSmall - 4, COLORS.kgGray), marginTop: 14, opacity: prog(f, 20, 20, EASE.soft) }}>
          {COPY.variations.legend}
        </div>
      </At>
    </AbsoluteFill>
  );
};
