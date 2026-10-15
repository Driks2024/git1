import { useCurrentFrame } from 'remotion';
import { SCENES, type SceneId } from '../config';
import { useStage } from '../stage/StageContext';

/**
 * Scene-local frame (inside its <Sequence>) plus the absolute frame and the
 * stage report for this exact frame (null until the 3D layer has drawn it).
 */
export function useScene(id: SceneId) {
  const f = useCurrentFrame();
  const F = SCENES[id].from + f;
  const stage = useStage();
  const live = stage.ready && stage.frame === F ? stage : null;
  return { f, F, stage: live };
}
