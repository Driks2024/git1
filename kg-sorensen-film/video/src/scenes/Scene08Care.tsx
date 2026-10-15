import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { life, prog } from '../components/anim';
import { At } from '../components/Layout';
import { Counter, Hairline, Kicker, MaskLine, Words, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

/**
 * 00:32–00:37 — CUIDADO. The Limpa Pontas KG foam block rises, the bur turns
 * head-down and plunges in, spinning; debris shakes loose. Then the offer
 * exactly as in the client's ad: Leve 2. Pague 1. — 2 unidades por R$ 11,60.
 */
export const Scene08Care: React.FC = () => {
  const { f } = useScene('care');
  const len = SCENES.care.to - SCENES.care.from;
  const o0 = BEATS.offer - SCENES.care.from;
  const care = life(f, 8, o0 - 2, 12, 10);
  const offer = life(f, o0, len + 20, 10, 1);
  const o = COPY.care.offer;
  return (
    <AbsoluteFill>
      {/* beat: durability */}
      <At x={SAFE.left} y={SAFE.top + 18} w={SAFE.right - SAFE.left} opacity={care}>
        <Kicker text={COPY.care.kicker} start={8} />
        <div style={{ height: 24 }} />
        <Words text={COPY.care.title[0]} start={14} stagger={4} style={displayStyle(TYPE.title - 8, 200)} />
        <Words text={COPY.care.title[1]} start={20} stagger={4} style={displayStyle(TYPE.title - 8, 200)} />
        <div style={{ height: 26 }} />
        <MaskLine start={30} dur={16}>
          <div style={monoStyle(TYPE.monoSmall, COLORS.steel)}>{COPY.care.note}</div>
        </MaskLine>
      </At>

      {/* beat: offer */}
      <At x={SAFE.left} y={SAFE.top + 10} w={SAFE.right - SAFE.left} opacity={offer}>
        <Kicker text={o.kicker} start={o0} />
        <div style={{ height: 22 }} />
        <MaskLine start={o0 + 2} dur={14}>
          <div style={displayStyle(TYPE.promo + 8, 800)}>{o.line1}</div>
        </MaskLine>
        <MaskLine start={o0 + 6} dur={14}>
          <div style={displayStyle(TYPE.promo + 8, 800, COLORS.lime)}>{o.line2}</div>
        </MaskLine>
        <div style={{ height: 30 }} />
        <div style={{ ...bodyStyle(34, 300, COLORS.paper), letterSpacing: '0.12em', opacity: prog(f, o0 + 12, 12) }}>{o.pre}</div>
        <div
          style={{
            ...displayStyle(118, 800),
            marginTop: 6,
            opacity: prog(f, o0 + 12, 10),
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {o.currency} <Counter to={o.price} start={o0 + 12} dur={22} decimals={2} style={{ color: COLORS.lime }} />
        </div>
        <div style={{ ...bodyStyle(30, 300, COLORS.steel), letterSpacing: '0.06em', marginTop: 12, opacity: prog(f, o0 + 22, 12) }}>
          {o.unit}
        </div>
      </At>
      <At x={SAFE.left} y={SAFE.bottom - 58} w={SAFE.right - SAFE.left} opacity={offer * prog(f, o0 + 26, 12)}>
        <Hairline start={o0 + 24} dur={18} length={SAFE.right - SAFE.left} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={monoStyle(TYPE.monoSmall, COLORS.paper)}>{o.ask}</div>
          <div style={monoStyle(TYPE.monoSmall, COLORS.steel)}>{o.ref}</div>
        </div>
      </At>
    </AbsoluteFill>
  );
};
