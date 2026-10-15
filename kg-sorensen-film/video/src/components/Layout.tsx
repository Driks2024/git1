import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS, SAFE, VIDEO } from '../config';
import { monoStyle } from './Type';

/** Absolutely positioned block in composition pixels. */
export const At: React.FC<{
  x?: number;
  y?: number;
  right?: number;
  bottom?: number;
  w?: number;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, right, bottom, w, align = 'left', opacity = 1, style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      right: right !== undefined ? VIDEO.width - right : undefined,
      bottom: bottom !== undefined ? VIDEO.height - bottom : undefined,
      width: w,
      textAlign: align,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Full-width centred column inside the safe area. */
export const Centered: React.FC<{ y: number; opacity?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  y,
  opacity = 1,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: SAFE.left,
      width: SAFE.right - SAFE.left,
      top: y,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Review overlay: the Reels/TikTok safe area (toggle DEBUG.safeArea). */
export const SafeAreaGuide: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        top: SAFE.top,
        width: SAFE.right - SAFE.left,
        height: SAFE.bottom - SAFE.top,
        outline: `2px dashed ${COLORS.lime}`,
        opacity: 0.6,
      }}
    />
    <div style={{ ...monoStyle(18, COLORS.lime), position: 'absolute', left: SAFE.left, top: SAFE.top - 30 }}>SAFE AREA</div>
  </AbsoluteFill>
);

/**
 * Soft cinematic gradients at the top / bottom so copy stays readable over
 * bright steel. Pure luminance falloff — never a box or a card.
 */
export const Scrim: React.FC<{ top?: number; bottom?: number; left?: number; opacity?: number; height?: number }> = ({
  top = 0,
  bottom = 0,
  left = 0,
  opacity = 1,
  height = 620,
}) => (
  <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
    {top > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height,
          background: `linear-gradient(180deg, rgba(5,5,6,${top}) 0%, rgba(5,5,6,${top * 0.72}) 38%, rgba(5,5,6,0) 100%)`,
        }}
      />
    ) : null}
    {bottom > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height,
          background: `linear-gradient(0deg, rgba(5,5,6,${bottom}) 0%, rgba(5,5,6,${bottom * 0.72}) 38%, rgba(5,5,6,0) 100%)`,
        }}
      />
    ) : null}
    {left > 0 ? (
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 720,
          background: `linear-gradient(90deg, rgba(5,5,6,${left}) 0%, rgba(5,5,6,${left * 0.6}) 45%, rgba(5,5,6,0) 100%)`,
        }}
      />
    ) : null}
  </AbsoluteFill>
);
