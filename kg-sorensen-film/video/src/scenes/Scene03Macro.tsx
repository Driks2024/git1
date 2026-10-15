import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { AnchorName } from '../../../shared/bur/Bur';
import { BEATS, COLORS, COPY, SAFE, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At, Scrim } from '../components/Layout';
import { LeaderLabel } from '../components/LeaderLabel';
import { Kicker, MaskLine, bodyStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

/** Label x per pass (the text block hangs in the lower band, y fixed). */
const LABEL_X: Record<string, number> = {
  crystals: SAFE.left,
  matrix: 420,
  ring: SAFE.left,
  logo: 420,
  butt: SAFE.left,
};
const LABEL_Y = 1356;

/**
 * 00:07–00:14 — MACRO. Five glued passes with photographic DOF:
 * crystals → matrix → ring → laser mark → FG shank. Each pass gets a
 * technical label tracked to its 3D point by a hairline.
 */
export const Scene03Macro: React.FC = () => {
  const { f, stage } = useScene('macro');
  const vis = life(f, 4, 206, 12, 10);
  const step = BEATS.macroStep;
  const pass = Math.min(5, Math.floor(f / step) + 1);
  return (
    <AbsoluteFill>
      <Scrim top={0.62} bottom={0.78} height={640} opacity={vis} />
      <At x={SAFE.left} y={SAFE.top + 18} w={640} opacity={vis}>
        <Kicker text={COPY.macro.kicker} start={6} />
        <div style={{ height: 18 }} />
        <MaskLine start={12} dur={20}>
          <div style={bodyStyle(TYPE.body, 300, COLORS.paper)}>{COPY.macro.body}</div>
        </MaskLine>
      </At>
      {COPY.macroStops.map((m, i) => {
        const a = (m.id === 'logo' ? stage?.points.logoC : stage?.anchors[m.anchor as AnchorName]) ?? null;
        const s = i * step + 14;
        return (
          <LeaderLabel
            key={m.id}
            mode="below"
            anchor={a}
            to={{ x: LABEL_X[m.id], y: LABEL_Y }}
            start={s}
            end={s + step - 10}
            title={m.title}
            sub={m.sub}
            index={`0${i + 1}`}
          />
        );
      })}
      {/* pass counter */}
      <At right={SAFE.right} y={SAFE.top + 22} opacity={vis}>
        <div style={{ ...monoStyle(TYPE.monoSmall, COLORS.kgGray), textAlign: 'right' }}>
          <span style={{ color: COLORS.paper }}>{String(pass).padStart(2, '0')}</span> / 05
        </div>
        <div style={{ marginTop: 12, height: 2, width: 150, marginLeft: 'auto', background: COLORS.hair }}>
          <div style={{ height: 2, width: 150 * prog(f, 0, 208, (t) => t), background: COLORS.lime }} />
        </div>
      </At>
    </AbsoluteFill>
  );
};
