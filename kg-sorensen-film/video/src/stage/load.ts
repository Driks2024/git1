import { staticFile } from 'remotion';
import { FONTS } from '../config';

/**
 * Asset loading for the vertical film. Fonts are registered through the
 * FontFace API (equivalent to @font-face + staticFile) so the WebGL rig can
 * paint the laser marking and the 3D titles with the brand families.
 * One promise per tab: every consumer awaits the same load.
 */

let fontsPromise: Promise<void> | null = null;

export function loadBrandFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    const faces = FONTS.files.map(
      (f) =>
        new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {
          weight: f.weight,
          style: 'normal',
          unicodeRange: f.range,
          display: 'block',
        }),
    );
    const results = await Promise.allSettled(faces.map((face) => face.load()));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') document.fonts.add(r.value);
      // a missing font must not stall the render: fall back to system faces
      else console.warn(`[kg] font failed: ${FONTS.files[i].file}`, r.reason);
    });
    // make sure every weight used by canvases and the overlay is resolved
    const probes = [
      '100 120px "Inter"',
      '200 120px "Inter"',
      '300 40px "Inter"',
      '400 40px "Inter"',
      '600 40px "Inter"',
      '700 40px "Inter"',
      '800 40px "Inter"',
      '900 40px "Inter"',
      '400 20px "JetBrains Mono"',
      '600 20px "JetBrains Mono"',
    ];
    await Promise.allSettled(probes.map((p) => document.fonts.load(p, 'AÇÃÉÍ≈µ0')));
    await document.fonts.ready;
  })();
  return fontsPromise;
}

const images = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(path: string): Promise<HTMLImageElement> {
  let p = images.get(path);
  if (p) return p;
  p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[kg] could not load ${path}`));
    img.src = staticFile(path);
  });
  images.set(path, p);
  return p;
}
