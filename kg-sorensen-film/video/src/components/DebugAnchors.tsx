import React from 'react';
import { AbsoluteFill, getInputProps } from 'remotion';
import { COLORS } from '../config';
import { useStage } from '../stage/StageContext';
import { monoStyle } from './Type';

/** Review aid (inputProps.debug): every rig anchor and probe on screen + key state values. */
export const DebugAnchors: React.FC = () => {
  const s = useStage();
  if (!(getInputProps() as { debug?: boolean }).debug || !s.ready || !s.state) return null;
  const pts = { ...s.anchors, ...s.points };
  const st = s.state;
  return (
    <AbsoluteFill>
      {Object.entries(pts).map(([k, p]) =>
        p ? (
          <div key={k} style={{ position: 'absolute', left: p.x - 5, top: p.y - 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.lime }} />
            <div style={{ ...monoStyle(16, COLORS.lime), position: 'absolute', left: 14, top: -6 }}>{k}</div>
          </div>
        ) : null,
      )}
      <div style={{ ...monoStyle(16, COLORS.lime), position: 'absolute', left: 20, top: 20, whiteSpace: 'pre' }}>
        {`F ${s.frame}  cam ${st.cam.map((v) => v.toFixed(2)).join(',')}  tgt ${st.target.map((v) => v.toFixed(2)).join(',')}  fov ${st.fov.toFixed(1)} roll ${st.roll.toFixed(3)}\nrot ${st.burRot.map((v) => v.toFixed(3)).join(',')}  pos ${st.burPos.map((v) => v.toFixed(2)).join(',')}  explode ${st.explode.toFixed(2)}  dissolve ${st.dissolve.toFixed(2)}`}
      </div>
    </AbsoluteFill>
  );
};
