import React from 'react';
import { COLORS, SAFE, TYPE, type SceneId } from '../config';
import { life } from './anim';
import { monoStyle } from './Type';
import { useScene } from './useScene';

const sgn = (v: number, w = 5) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2).padStart(w, '0')}`;

/** Micro-coordinates of the camera, in mm — the film's technical heartbeat. */
export const CamReadout: React.FC<{
  scene: SceneId;
  start: number;
  end: number;
  corner?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  label?: string;
}> = ({ scene, start, end, corner = 'top-right', label = 'CAM' }) => {
  const { f, stage } = useScene(scene);
  const st = stage?.state;
  const vis = life(f, start, end, 12, 10);
  if (!st || vis <= 0) return null;
  const [x, y, z] = st.cam;
  const pos: React.CSSProperties =
    corner === 'top-right'
      ? { right: 1080 - SAFE.right, top: SAFE.top + 4, textAlign: 'right' }
      : corner === 'bottom-right'
        ? { right: 1080 - SAFE.right, top: SAFE.bottom - 66, textAlign: 'right' }
        : corner === 'bottom-left'
          ? { left: SAFE.left, top: SAFE.bottom - 66 }
          : { left: SAFE.left, top: SAFE.top + 4 };
  return (
    <div style={{ position: 'absolute', ...pos, opacity: vis * 0.78 }}>
      <div style={monoStyle(TYPE.monoSmall - 2, COLORS.kgGray)}>
        {label} X {sgn(x)} · Y {sgn(y)} · Z {sgn(z, 6)}
      </div>
      <div style={{ ...monoStyle(TYPE.monoSmall - 2, COLORS.kgGray), opacity: 0.8 }}>
        FOV {st.fov.toFixed(1)}° · T {st.time.toFixed(2).padStart(5, "0")} S
      </div>
    </div>
  );
};
