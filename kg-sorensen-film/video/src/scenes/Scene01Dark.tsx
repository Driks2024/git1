import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { Centered } from '../components/Layout';
import { Crosshair, Hairline, monoStyle } from '../components/Type';
import { CamReadout } from '../components/CamReadout';
import { useScene } from '../components/useScene';

/**
 * 00:00–00:03 — ESCURIDÃO. Near black; a thin reflection travels along the
 * shank (3D kicker light), the ring pings once. Microtext only.
 */
export const Scene01Dark: React.FC = () => {
  const { f, F, stage } = useScene('dark');
  const vis = life(f, 6, 84, 18, 12);
  const ring = stage?.anchors.ring;
  const ping = life(F, BEATS.ringPing - 6, BEATS.ringPing + 22, 6, 14);
  return (
    <AbsoluteFill>
      <Centered y={SAFE.top + 70} opacity={vis}>
        <div style={{ ...monoStyle(TYPE.mono, COLORS.paper), letterSpacing: '0.34em', marginRight: '-0.34em' }}>
          {COPY.dark.kicker}
        </div>
        <Hairline start={14} dur={30} length={150} origin="center" style={{ margin: '26px 0 24px' }} />
        <div
          style={{
            ...monoStyle(TYPE.monoSmall, COLORS.lime),
            letterSpacing: '0.3em',
            marginRight: '-0.3em',
            opacity: prog(f, 26, 20),
          }}
        >
          {COPY.dark.note}
        </div>
      </Centered>
      {ring && ping > 0 ? <Crosshair x={ring.x} y={ring.y} size={34} opacity={ping * 0.85} /> : null}
      <CamReadout scene="dark" start={10} end={SCENES.dark.to - SCENES.dark.from + 30} corner="bottom-left" />
    </AbsoluteFill>
  );
};
