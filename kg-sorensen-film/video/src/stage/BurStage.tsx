import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { FilmRenderer } from '../../../shared/stage/FilmRenderer';
import type { AnchorName } from '../../../shared/bur/Bur';
import { ASSETS, RENDER } from '../config';
import { evaluateFrame } from '../timeline';
import { loadBrandFonts, loadImage } from './load';
import { useStageSetter, type Projected, type StageInfo } from './StageContext';
import { TitleRig } from './TitleRig';

const ANCHORS: AnchorName[] = [
  'crystals',
  'matrix',
  'neck',
  'ring',
  'logo',
  'lot',
  'steel',
  'butt',
  'core',
  'tile',
  'crystalFar',
  'head',
  'tip',
  'center',
];

type Rig = { film: FilmRenderer; titles: TitleRig };

/**
 * The one persistent 3D layer of the film. Creates a single FilmRenderer
 * (after fonts + logo are ready), warms it up once, then on every frame
 * evaluates the frame → FilmState timeline and renders synchronously.
 * After rendering it measures every rig anchor in screen space and hands
 * the result to the overlay through StageContext.
 */
export const BurStage: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rig, setRig] = useState<Rig | null>(null);
  const setStage = useStageSetter();
  const [handle] = useState(() =>
    delayRender('BurStage: fonts, logo, WebGL warm-up', {
      timeoutInMilliseconds: RENDER.loadTimeoutMs,
      retries: 0,
    }),
  );
  const released = useRef(false);

  // ---- create once
  useEffect(() => {
    let alive = true;
    let created: Rig | null = null;
    (async () => {
      await loadBrandFonts();
      const logo = await loadImage(ASSETS.logoMark);
      if (!alive || !canvas.current) return;
      const film = new FilmRenderer({
        canvas: canvas.current,
        logo,
        width,
        height,
        dpr: RENDER.dpr,
        samples: RENDER.samples,
        crystalCap: RENDER.crystalCap,
        preserveDrawingBuffer: true,
        designAspect: 9 / 16,
      });
      const titles = new TitleRig(film);
      await film.warmup();
      created = { film, titles };
      if (!alive) {
        film.dispose();
        return;
      }
      setRig(created);
    })().catch((err) => {
      // fail loudly instead of hanging until the delayRender timeout
      cancelRender(err instanceof Error ? err : new Error(String(err)));
    });
    return () => {
      alive = false;
      created?.film.dispose();
    };
    // width/height are fixed for the composition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- draw this frame, synchronously, then report anchors
  useLayoutEffect(() => {
    if (!rig) return;
    const { film, titles } = rig;
    try {
      const state = evaluateFrame(frame, fps);
      titles.set(state.extras);
      titles.apply(state);
      film.render(state);
      const v = new THREE.Vector3();
      const anchors: Partial<Record<AnchorName, Projected>> = {};
      for (const name of ANCHORS) {
        film.anchor(name, v);
        const p = film.project(v);
        anchors[name] = { x: p.x, y: p.y, z: p.z, behind: p.behind };
      }
      const points: Record<string, Projected> = {};
      for (const probe of state.probes) {
        v.set(...probe.p);
        film.bur.inner.localToWorld(v);
        const p = film.project(v);
        points[probe.id] = { x: p.x, y: p.y, z: p.z, behind: p.behind };
      }
      const c = film.bur.counts();
      const info: StageInfo = {
        ready: true,
        frame,
        state,
        anchors,
        points,
        counts: { slices: c.slices, tiles: c.tiles, crystals: c.crystals, pieces: c.pieces },
      };
      setStage(info);
    } catch (err) {
      cancelRender(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [rig, frame, fps, setStage, handle]);

  return (
    <AbsoluteFill>
      <canvas ref={canvas} width={width} height={height} style={{ width: '100%', height: '100%', display: 'block' }} />
    </AbsoluteFill>
  );
};
