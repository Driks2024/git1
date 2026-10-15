#!/usr/bin/env node
/**
 * Still validation for Mode A (never renders the video file).
 *
 *   npm run stills -- 0 45 150 772            # frames
 *   npm run stills -- 210-419:42              # range with step
 *   npm run stills -- --out /tmp/x --scale 0.5 --gl swangle 120
 *
 * Bundles once, opens ONE headless browser (Playwright's Chromium headless
 * shell, SwiftShader WebGL — no GPU here) and renders every requested frame.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COMPOSITION = 'KGSorensenFG';
const DEFAULT_BROWSERS = [
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
];

const argv = process.argv.slice(2);
const opts = {
  out: path.join(ROOT, 'video/out/stills'),
  scale: 1,
  gl: process.env.REMOTION_GL ?? 'swangle',
  browser: process.env.REMOTION_BROWSER ?? DEFAULT_BROWSERS.find((p) => fs.existsSync(p)) ?? null,
  prefix: 'f',
  fastWarmup: true,
};
const frames = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out') opts.out = path.resolve(argv[++i]);
  else if (a === '--scale') opts.scale = Number(argv[++i]);
  else if (a === '--gl') opts.gl = argv[++i];
  else if (a === '--browser') opts.browser = argv[++i];
  else if (a === '--prefix') opts.prefix = argv[++i];
  else if (a === '--full-warmup') opts.fastWarmup = false;
  else if (/^\d+-\d+(:\d+)?$/.test(a)) {
    const [r, st] = a.split(':');
    const [lo, hi] = r.split('-').map(Number);
    for (let f = lo; f <= hi; f += Number(st ?? 1)) frames.push(f);
  } else if (/^\d+$/.test(a)) frames.push(Number(a));
  else throw new Error(`unknown argument: ${a}`);
}
if (!frames.length) frames.push(0, 60, 150, 236, 320, 400, 470, 560, 690, 772, 850, 1000, 1080, 1170, 1320);
if (!opts.browser) throw new Error('no local Chromium found — set REMOTION_BROWSER (Remotion must not download one)');
fs.mkdirSync(opts.out, { recursive: true });

const t0 = Date.now();
const log = (...m) => console.log(`[stills ${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...m);

log('bundling…');
let lastPct = -1;
const serveUrl = await bundle({
  entryPoint: path.join(ROOT, 'video/src/index.ts'),
  rootDir: ROOT,
  publicDir: path.join(ROOT, 'video/public'),
  onProgress: (p) => {
    const q = Math.floor(p / 25) * 25;
    if (q !== lastPct) {
      lastPct = q;
      log(`bundle ${q}%`);
    }
  },
});

const chromiumOptions = { gl: opts.gl, headless: true };
log(`browser ${opts.browser} (gl=${opts.gl})`);
const browser = await openBrowser('chrome', {
  browserExecutable: opts.browser,
  chromiumOptions,
  chromeMode: 'headless-shell',
  logLevel: 'warn',
});

const inputProps = { fastWarmup: opts.fastWarmup };
const onBrowserLog = (l) => {
  if (l.type === 'error' || l.type === 'warning') {
    const t = l.text ?? '';
    if (!/GPU stall|KHR_parallel|Automatic fallback to software WebGL|GroupMarkerNotSet/.test(t)) console.log(`  [browser ${l.type}]`, t.slice(0, 300));
  }
};

const composition = await selectComposition({
  serveUrl,
  id: COMPOSITION,
  inputProps,
  puppeteerInstance: browser,
  browserExecutable: opts.browser,
  chromiumOptions,
  timeoutInMilliseconds: 600_000,
  logLevel: 'warn',
});
log(`${composition.id} ${composition.width}x${composition.height} @${composition.fps} · ${composition.durationInFrames} frames`);

const written = [];
for (const frame of frames) {
  const t = Date.now();
  const output = path.join(opts.out, `${opts.prefix}${String(frame).padStart(4, '0')}.png`);
  await renderStill({
    composition,
    serveUrl,
    frame,
    output,
    inputProps,
    imageFormat: 'png',
    scale: opts.scale,
    overwrite: true,
    puppeteerInstance: browser,
    browserExecutable: opts.browser,
    chromiumOptions,
    timeoutInMilliseconds: 600_000,
    onBrowserLog,
    logLevel: 'warn',
  });
  written.push(output);
  log(`frame ${frame} → ${output} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
await browser.close({ silent: true });
log(`done: ${written.length} stills`);
