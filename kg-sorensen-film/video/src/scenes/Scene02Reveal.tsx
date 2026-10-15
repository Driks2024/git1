import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS, COPY, SAFE, TYPE } from '../config';
import { life } from '../components/anim';
import { At } from '../components/Layout';
import { Kicker, Words, bodyStyle } from '../components/Type';
import { useScene } from '../components/useScene';

/**
 * 00:03–00:07 — REVEAL. The bur emerges on the poster diagonal, the lime
 * rim-light ignites, the monumental PRECISÃO lives in 3D behind it.
 */
export const Scene02Reveal: React.FC = () => {
  const { f } = useScene('reveal');
  const vis = life(f, 40, 118, 10, 12);
  return (
    <AbsoluteFill>
      <At x={SAFE.left} y={1318} w={600} opacity={vis}>
        <Kicker text={COPY.reveal.kicker} start={40} />
        <div style={{ height: 22 }} />
        <Words text={COPY.reveal.body} start={48} stagger={3} style={bodyStyle(TYPE.body + 6, 300, COLORS.paper)} accent={['Precisão']} />
      </At>
    </AbsoluteFill>
  );
};
