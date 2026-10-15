import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { CamReadout } from '../components/CamReadout';
import { Counter, Hairline, Kicker, Words, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

/**
 * 00:20–00:24 — FLY THROUGH + O NÚCLEO. The camera crosses the exploded
 * crystals while the bur dissolves; one cubo-octahedral diamond remains.
 */
export const Scene05Core: React.FC = () => {
  const { f } = useScene('core');
  const len = SCENES.core.to - SCENES.core.from;
  const c0 = BEATS.coreIn - SCENES.core.from;
  const vis = life(f, c0 + 14, len + 14, 12, 16);
  return (
    <AbsoluteFill>
      <At x={SAFE.left} y={SAFE.top + 18} w={SAFE.right - SAFE.left} opacity={vis}>
        <Kicker text={COPY.core.kicker} start={c0 + 14} />
        <div style={{ height: 24 }} />
        <Words text={COPY.core.title[0]} start={c0 + 20} stagger={4} style={displayStyle(TYPE.title - 22, 200)} />
        <Words text={COPY.core.title[1]} start={c0 + 28} stagger={4} style={displayStyle(TYPE.title - 22, 200)} />
        <div style={{ height: 22 }} />
        <Words
          text={COPY.core.body}
          start={c0 + 36}
          stagger={2}
          dur={14}
          style={{ ...bodyStyle(TYPE.body - 6, 300, COLORS.steel), maxWidth: 640 }}
        />
      </At>
      <At x={SAFE.left} y={SAFE.bottom - 286} w={SAFE.right - SAFE.left} opacity={vis}>
        {COPY.core.specs.map((s, i) => {
          const st = c0 + 26 + i * 9;
          const k = prog(f, st, 16);
          return (
            <div key={s.small} style={{ opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>
              <Hairline start={st} dur={18} length={SAFE.right - SAFE.left} />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 0 16px' }}>
                <div style={{ ...displayStyle(58, 300, i === 1 ? COLORS.lime : COLORS.paper), fontVariantNumeric: 'tabular-nums' }}>
                  {'count' in s && s.count ? (
                    <Counter to={s.count} start={st} dur={22} prefix={'prefix' in s && s.prefix ? s.prefix : ''} />
                  ) : (
                    s.big
                  )}
                </div>
                <div style={monoStyle(TYPE.monoSmall, COLORS.steel)}>{s.small}</div>
              </div>
            </div>
          );
        })}
      </At>
      <CamReadout scene="core" start={0} end={c0 + 10} corner="top-right" label="VOO" />
    </AbsoluteFill>
  );
};
