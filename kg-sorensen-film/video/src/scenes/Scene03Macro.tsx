import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { AnchorName } from '../../../shared/bur/Bur';
import { BEATS, COLORS, COPY, SAFE, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { LeaderLabel } from '../components/LeaderLabel';
import { Kicker, MaskLine, bodyStyle, monoStyle } from '../components/Type';
import { CamReadout } from '../components/CamReadout';
import { useScene } from '../components/useScene';

/** Where each macro label sits, relative to its anchor (px). */
const PLACE: Record<string, { dx: number; dy: number }> = {
  crystals: { dx: -250, dy: 330 },
  matrix: { dx: 230, dy: 300 },
  ring: { dx: -240, dy: 300 },
  logo: { dx: 220, dy: 300 },
  butt: { dx: -240, dy: -300 },
};

/**
 * 00:07–00:14 — MACRO. Five glued passes with photographic DOF:
 * crystals → matrix → ring → laser mark → FG shank. Each pass gets a
 * technical label tracked to its 3D point by a hairline.
 */
export const Scene03Macro: React.FC = () => {
  const { f, stage } = useScene('macro');
  const vis = life(f, 6, 206, 12, 10);
  const step = BEATS.macroStep;
  return (
    <AbsoluteFill>
      <At x={SAFE.left} y={SAFE.top + 18} w={640} opacity={vis}>
        <Kicker text={COPY.macro.kicker} start={6} />
        <div style={{ height: 18 }} />
        <MaskLine start={12} dur={20}>
          <div style={bodyStyle(TYPE.body, 300, COLORS.paper)}>{COPY.macro.body}</div>
        </MaskLine>
      </At>
      {COPY.macroStops.map((m, i) => {
        const a = stage?.anchors[m.anchor as AnchorName] ?? null;
        const p = PLACE[m.id];
        const s = i * step + 14;
        return (
          <LeaderLabel
            key={m.id}
            anchor={a}
            to={a ? { x: a.x + p.dx, y: a.y + p.dy } : { x: 0, y: 0 }}
            start={s}
            end={s + step - 12}
            title={m.title}
            sub={m.sub}
            index={`0${i + 1}`}
          />
        );
      })}
      {/* pass counter */}
      <At right={SAFE.right} y={SAFE.bottom - 46} opacity={vis}>
        <div style={monoStyle(TYPE.monoSmall, COLORS.kgGray)}>
          <span style={{ color: COLORS.paper }}>{String(Math.min(5, Math.floor(f / step) + 1)).padStart(2, '0')}</span> / 05 · MACRO
        </div>
        <div
          style={{
            marginTop: 10,
            height: 2,
            width: 220,
            marginLeft: 'auto',
            background: COLORS.hair,
          }}
        >
          <div style={{ height: 2, width: 220 * prog(f, 0, 210, (t) => t), background: COLORS.lime }} />
        </div>
      </At>
      <CamReadout scene="macro" start={8} end={206} corner="top-right" />
    </AbsoluteFill>
  );
};
