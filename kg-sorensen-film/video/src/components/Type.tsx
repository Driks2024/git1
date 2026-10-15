import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, FONTS, TYPE } from '../config';
import { EASE, formatBR, lerp, prog } from './anim';

/**
 * Typographic building blocks of the brand system. Every animation reads the
 * Sequence-local frame; nothing depends on time outside Remotion.
 */

/** Legibility over bright steel: soft ink halos, no visible boxes. */
export const SHADOW_MONO = '0 1px 2px rgba(5,5,6,0.9), 0 0 14px rgba(5,5,6,0.85), 0 0 34px rgba(5,5,6,0.6)';
export const SHADOW_TEXT = '0 2px 4px rgba(5,5,6,0.45), 0 0 30px rgba(5,5,6,0.55)';

export const monoStyle = (size: number = TYPE.mono, color: string = COLORS.steel): React.CSSProperties => ({
  fontFamily: FONTS.mono,
  fontSize: size,
  fontWeight: 500,
  letterSpacing: TYPE.tracking,
  textTransform: 'uppercase',
  color,
  lineHeight: 1.35,
  whiteSpace: 'nowrap',
  textShadow: SHADOW_MONO,
});

export const displayStyle = (size: number, weight = 200, color: string = COLORS.paper): React.CSSProperties => ({
  fontFamily: FONTS.sans,
  fontSize: size,
  fontWeight: weight,
  fontOpticalSizing: 'auto',
  letterSpacing: weight >= 700 ? '-0.035em' : '-0.03em',
  lineHeight: weight >= 700 ? 0.94 : 1.0,
  color,
  textShadow: SHADOW_TEXT,
});

export const bodyStyle = (size: number = TYPE.body, weight = 300, color: string = COLORS.paper): React.CSSProperties => ({
  fontFamily: FONTS.sans,
  fontSize: size,
  fontWeight: weight,
  fontOpticalSizing: 'auto',
  letterSpacing: '-0.012em',
  lineHeight: 1.18,
  color,
  textShadow: SHADOW_TEXT,
});

/** Mono kicker: a short lime tick, then tracked uppercase text that types on. */
export const Kicker: React.FC<{
  text: string;
  start?: number;
  size?: number;
  color?: string;
  tick?: boolean;
  type?: boolean;
  style?: React.CSSProperties;
}> = ({ text, start = 0, size = TYPE.mono, color = COLORS.steel, tick = true, type = true, style }) => {
  const f = useCurrentFrame();
  const k = prog(f, start, 16);
  const chars = type ? Math.round(lerp(0, text.length, prog(f, start + 3, Math.max(10, text.length * 0.9), EASE.soft))) : text.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: k, ...style }}>
      {tick ? (
        <span
          style={{
            display: 'inline-block',
            width: lerp(0, 34, k),
            height: 2,
            background: COLORS.lime,
            boxShadow: `0 0 12px ${COLORS.lime}88`,
          }}
        />
      ) : null}
      <span style={monoStyle(size, color)}>
        {text.slice(0, chars)}
        <span style={{ opacity: 0 }}>{text.slice(chars)}</span>
      </span>
    </div>
  );
};

/**
 * Word-by-word reveal: each word rises out of a mask with a short stagger.
 * `accent` words are painted lime (keywords only — never a colour per word).
 */
export const Words: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  dur?: number;
  style: React.CSSProperties;
  accent?: string[];
  accentColor?: string;
  rise?: number;
}> = ({ text, start = 0, stagger = 3, dur = 18, style, accent = [], accentColor = COLORS.lime, rise = 0.9 }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{ ...style, display: 'flex', flexWrap: 'wrap', columnGap: '0.24em' }}>
      {words.map((w, i) => {
        const k = prog(f, start + i * stagger, dur);
        const clean = w.replace(/[.,!?]/g, '');
        const isAccent = accent.includes(clean) || accent.includes(w);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - k) * rise * 100}%)`,
                opacity: Math.min(1, k * 1.6),
                color: isAccent ? accentColor : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Whole-line mask reveal (line slides up from behind a hard mask). */
export const MaskLine: React.FC<{
  children: React.ReactNode;
  start?: number;
  dur?: number;
  style?: React.CSSProperties;
  from?: 'below' | 'above';
}> = ({ children, start = 0, dur = 20, style, from = 'below' }) => {
  const f = useCurrentFrame();
  const k = prog(f, start, dur);
  const dir = from === 'below' ? 1 : -1;
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em', ...style }}>
      <div style={{ transform: `translateY(${dir * (1 - k) * 105}%)` }}>{children}</div>
    </div>
  );
};

/** Animated number (pt-BR formatting). */
export const Counter: React.FC<{
  to: number;
  from?: number;
  start?: number;
  dur?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ to, from = 0, start = 0, dur = 30, decimals = 0, prefix = '', suffix = '', style }) => {
  const f = useCurrentFrame();
  const k = prog(f, start, dur, EASE.out);
  const v = lerp(from, to, k);
  const shown = decimals > 0 ? v : Math.round(v);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formatBR(shown, decimals)}
      {suffix}
    </span>
  );
};

/** 1 px hairline that draws itself from one end. */
export const Hairline: React.FC<{
  start?: number;
  dur?: number;
  length: number;
  vertical?: boolean;
  color?: string;
  thickness?: number;
  origin?: 'start' | 'end' | 'center';
  style?: React.CSSProperties;
}> = ({ start = 0, dur = 22, length, vertical = false, color = COLORS.hairStrong, thickness = 1, origin = 'start', style }) => {
  const f = useCurrentFrame();
  const k = prog(f, start, dur, EASE.inOut);
  const o = origin === 'start' ? '0% 0%' : origin === 'end' ? '100% 100%' : '50% 50%';
  return (
    <div
      style={{
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        background: color,
        transform: vertical ? `scaleY(${k})` : `scaleX(${k})`,
        transformOrigin: o,
        ...style,
      }}
    />
  );
};

/** Small technical crosshair. */
export const Crosshair: React.FC<{ x: number; y: number; size?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  size = 26,
  opacity = 1,
  color = COLORS.paper,
}) => (
  <svg
    width={size * 2}
    height={size * 2}
    style={{ position: 'absolute', left: x - size, top: y - size, opacity, overflow: 'visible' }}
    viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
  >
    <circle r={size * 0.42} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={1} />
    <path
      d={`M ${-size} 0 H ${-size * 0.6} M ${size * 0.6} 0 H ${size} M 0 ${-size} V ${-size * 0.6} M 0 ${size * 0.6} V ${size}`}
      stroke={color}
      strokeWidth={1.2}
    />
    <circle r={2} fill={COLORS.lime} />
  </svg>
);
