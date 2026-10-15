import React, { createContext, useContext, useState } from 'react';
import type { AnchorName } from '../../../shared/bur/Bur';
import type { FilmState } from '../../../shared/stage/state';

export type Projected = { x: number; y: number; z: number; behind: boolean };

export type ModelCounts = {
  slices: number;
  tiles: number;
  crystals: number;
  pieces: number;
};

/**
 * What the 3D layer reports back to the 2D overlay for the frame it just
 * drew: the state it rendered and the screen position of every rig anchor
 * (composition pixels), measured after `film.render(state)`.
 */
export type StageInfo = {
  ready: boolean;
  frame: number;
  state: FilmState | null;
  anchors: Partial<Record<AnchorName, Projected>>;
  /** bur-space probes requested by the timeline (state.probes), projected */
  points: Record<string, Projected>;
  counts: ModelCounts | null;
};

export const EMPTY_STAGE: StageInfo = { ready: false, frame: -1, state: null, anchors: {}, points: {}, counts: null };

const StageCtx = createContext<StageInfo>(EMPTY_STAGE);
const StageSetCtx = createContext<(s: StageInfo) => void>(() => undefined);

export const StageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [info, setInfo] = useState<StageInfo>(EMPTY_STAGE);
  return (
    <StageSetCtx.Provider value={setInfo}>
      <StageCtx.Provider value={info}>{children}</StageCtx.Provider>
    </StageSetCtx.Provider>
  );
};

export const useStage = () => useContext(StageCtx);
export const useStageSetter = () => useContext(StageSetCtx);

/** Anchor position for the current frame, or null while the stage is not ready. */
export function useAnchor(name: AnchorName, absoluteFrame: number): Projected | null {
  const s = useStage();
  if (!s.ready || s.frame !== absoluteFrame) return null;
  return s.anchors[name] ?? null;
}
