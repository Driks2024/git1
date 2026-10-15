import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { VIDEO } from './config';

/** Mode A — vertical product film (Reels / TikTok / Shorts). */
export const Root: React.FC = () => (
  <Composition
    id={VIDEO.id}
    component={Video}
    width={VIDEO.width}
    height={VIDEO.height}
    fps={VIDEO.fps}
    durationInFrames={VIDEO.durationInFrames}
  />
);
