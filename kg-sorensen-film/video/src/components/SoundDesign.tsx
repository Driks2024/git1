import React from 'react';
import { Html5Audio as Audio, Sequence, interpolate, staticFile } from 'remotion';
import { AUDIO, SFX, VIDEO } from '../config';

/**
 * Sound design: synthesized SFX (video/scripts/make-sfx.py) placed on the
 * scene beats, plus a quiet low drone bed that fades in and out.
 * Every level comes from AUDIO / SFX in config.ts.
 */
export const SoundDesign: React.FC = () => {
  if (!AUDIO.enabled) return null;
  const end = VIDEO.durationInFrames;
  return (
    <>
      <Audio
        src={staticFile('sfx/bed.wav')}
        volume={(f) =>
          AUDIO.master *
          AUDIO.bed *
          interpolate(f, [0, AUDIO.bedFadeIn, end - AUDIO.bedFadeOut, end], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      {SFX.map((cue, i) => (
        <Sequence key={`${cue.file}-${i}`} from={Math.max(0, cue.frame)} durationInFrames={cue.length} name={`sfx ${cue.file}`}>
          <Audio src={staticFile(cue.file)} volume={AUDIO.master * AUDIO.sfx * cue.gain} />
        </Sequence>
      ))}
    </>
  );
};
