import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ASSETS, BEATS, COLORS, COPY, SAFE, SCENES, TYPE } from '../config';
import { EASE, life, mapRange, prog } from '../components/anim';
import { Centered } from '../components/Layout';
import { Hairline, MaskLine, bodyStyle, displayStyle, monoStyle } from '../components/Type';
import { useScene } from '../components/useScene';

const GiftIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={COLORS.lime} strokeWidth={2} strokeLinejoin="round">
    <rect x={7} y={16} width={26} height={17} rx={1.5} />
    <rect x={5} y={11} width={30} height={6} rx={1.5} />
    <path d="M20 11 V33" />
    <path d="M20 11 C 16 4, 9 6, 12 10.5 C 13.5 12, 18 11, 20 11 Z" />
    <path d="M20 11 C 24 4, 31 6, 28 10.5 C 26.5 12, 22 11, 20 11 Z" />
  </svg>
);

const ChatIcon: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" fill="none" stroke={COLORS.paper} strokeWidth={2} strokeLinejoin="round">
    <path d="M17 5 C 9 5, 4 10, 4 16 C 4 19, 5.3 21.6, 7.6 23.5 L 6 29 L 12.2 26.4 C 13.7 26.8, 15.3 27, 17 27 C 25 27, 30 22, 30 16 C 30 10, 25 5, 17 5 Z" />
  </svg>
);

/**
 * 00:37–00:45 — FINAL. Promotion (the client's poster copy) over the
 * diagonal hero with the lime rim; then the sign-off: vertical hero,
 * KG lockup, specs and the call to action.
 */
export const Scene09Final: React.FC = () => {
  const { f } = useScene('final');
  const len = SCENES.final.to - SCENES.final.from;
  const sg = BEATS.signoff - SCENES.final.from;
  const promo = life(f, 2, sg + 6, 10, 14);
  const exitY = mapRange(f, sg - 8, sg + 6, 0, -40, EASE.in);
  const c = COPY.final;
  return (
    <AbsoluteFill>
      {/* ---------------- promo */}
      <div style={{ position: 'absolute', inset: 0, opacity: promo, transform: `translateY(${exitY}px)` }}>
        <Centered y={SAFE.top + 18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, opacity: prog(f, 2, 12) }}>
            <Hairline start={4} dur={16} length={110} color={COLORS.lime} thickness={2} origin="end" />
            <div style={{ ...displayStyle(40, 800, COLORS.lime), letterSpacing: '0.2em', marginRight: '-0.2em' }}>{c.promo}</div>
            <Hairline start={4} dur={16} length={110} color={COLORS.lime} thickness={2} />
          </div>
          <div style={{ height: 30 }} />
          <MaskLine start={6} dur={16}>
            <div style={{ ...displayStyle(TYPE.promo - 12, 800), textTransform: 'uppercase' }}>{c.headline[0]}</div>
          </MaskLine>
          <MaskLine start={10} dur={16}>
            <div style={{ ...displayStyle(TYPE.promo - 12, 300), textTransform: 'uppercase' }}>{c.headline[1]}</div>
          </MaskLine>
          <div style={{ height: 26 }} />
          <Hairline start={18} dur={14} length={120} color={COLORS.lime} thickness={2} origin="center" />
          <div style={{ height: 26 }} />
          <MaskLine start={22} dur={14}>
            <div style={{ ...bodyStyle(46, 300), textTransform: 'uppercase', letterSpacing: '0.02em' }}>{c.sub[0]}</div>
          </MaskLine>
          <MaskLine start={26} dur={14}>
            <div style={{ ...displayStyle(76, 800, COLORS.lime), textTransform: 'uppercase' }}>{c.sub[1]}</div>
          </MaskLine>
          <div style={{ height: 22 }} />
          <div style={{ ...monoStyle(TYPE.mono, COLORS.paper), letterSpacing: '0.34em', marginRight: '-0.34em', opacity: prog(f, 34, 14) }}>
            PONTA DIAMANTADA <span style={{ color: COLORS.lime, fontWeight: 800 }}>FG</span>
          </div>
        </Centered>
        {/* bonus pill */}
        <Centered y={842} opacity={prog(f, 44, 14)}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '20px 34px 20px 22px',
              border: '1.5px solid rgba(241,241,238,0.7)',
              borderRadius: 26,
              background: 'rgba(5,5,6,0.5)',
              transform: `translateY(${(1 - prog(f, 44, 16)) * 20}px)`,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                border: `2px solid ${COLORS.lime}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GiftIcon />
            </div>
            <div style={{ ...bodyStyle(38, 400), textAlign: 'left' }}>
              {c.bonus[0]}
              <br />
              {c.bonus[1]}
            </div>
          </div>
        </Centered>
      </div>

      {/* ---------------- sign-off */}
      <Centered y={1102} opacity={life(f, sg + 24, len + 30, 16, 1)}>
        <Img
          src={staticFile(ASSETS.lockupWhite)}
          style={{ width: 330, transform: `translateY(${(1 - prog(f, sg + 24, 22)) * 24}px)` }}
        />
      </Centered>
      <Centered y={1320} opacity={life(f, sg + 36, len + 30, 16, 1)}>
        <div style={monoStyle(TYPE.monoSmall, COLORS.steel)}>{c.specs}</div>
        <div style={{ height: 26 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '22px 42px',
            borderRadius: 60,
            border: `1.5px solid ${COLORS.paper}`,
            transform: `translateY(${(1 - prog(f, sg + 42, 16)) * 18}px)`,
            opacity: prog(f, sg + 42, 14),
          }}
        >
          <ChatIcon />
          <div style={{ ...displayStyle(32, 700), letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>{c.cta}</div>
        </div>
      </Centered>
    </AbsoluteFill>
  );
};
