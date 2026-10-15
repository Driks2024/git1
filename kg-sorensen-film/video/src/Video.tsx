import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { COLORS, DEBUG, SCENES, type SceneId } from './config';
import { BurStage } from './stage/BurStage';
import { StageProvider } from './stage/StageContext';
import { SoundDesign } from './components/SoundDesign';
import { SafeAreaGuide } from './components/Layout';
import { Scene01Dark } from './scenes/Scene01Dark';
import { Scene02Reveal } from './scenes/Scene02Reveal';
import { Scene03Macro } from './scenes/Scene03Macro';
import { Scene04Exploded } from './scenes/Scene04Exploded';
import { Scene05Core } from './scenes/Scene05Core';
import { Scene06Snap } from './scenes/Scene06Snap';
import { Scene07Variations } from './scenes/Scene07Variations';
import { Scene08Care } from './scenes/Scene08Care';
import { Scene09Final } from './scenes/Scene09Final';

const SCENE_COMPONENTS: [SceneId, React.FC, string][] = [
  ['dark', Scene01Dark, 'Scene01Dark'],
  ['reveal', Scene02Reveal, 'Scene02Reveal'],
  ['macro', Scene03Macro, 'Scene03Macro'],
  ['exploded', Scene04Exploded, 'Scene04Exploded'],
  ['core', Scene05Core, 'Scene05Core'],
  ['snap', Scene06Snap, 'Scene06Snap'],
  ['variations', Scene07Variations, 'Scene07Variations'],
  ['care', Scene08Care, 'Scene08Care'],
  ['final', Scene09Final, 'Scene09Final'],
];

/**
 * The film: ONE persistent 3D layer (BurStage) under nine overlay scenes,
 * each in its own Sequence, plus the sound design.
 */
export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.ink0 }}>
    <StageProvider>
      <BurStage />
      {SCENE_COMPONENTS.map(([id, Scene, name]) => (
        <Sequence key={id} from={SCENES[id].from} durationInFrames={SCENES[id].to - SCENES[id].from} name={name}>
          <Scene />
        </Sequence>
      ))}
    </StageProvider>
    <SoundDesign />
    {DEBUG.safeArea ? <SafeAreaGuide /> : null}
  </AbsoluteFill>
);
