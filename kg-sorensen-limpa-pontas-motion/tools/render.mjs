#!/usr/bin/env node
/**
 * Render offline do motion (determinístico, quadro a quadro) via Chromium headless.
 *
 *   node tools/render.mjs                       → output/frames/00000.png … (todos os quadros)
 *   node tools/render.mjs --stills 3.2,9.9,18   → output/stills/t_03.20.png …
 *   node tools/render.mjs --from 120 --to 180   → apenas um intervalo de quadros
 *   node tools/render.mjs --workers 3           → páginas em paralelo
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/src/index.html?render=1`;

const browser = await chromium.launch({ args: ['--disable-web-security', '--force-color-profile=srgb', '--disable-lcd-text'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return page;
}
const clip = { x: 0, y: 0, width: 1920, height: 1080 };

if (args.stills) {
  const out = path.join(ROOT, 'output', args.out || 'stills');
  fs.mkdirSync(out, { recursive: true });
  const page = await openPage();
  for (const s of String(args.stills).split(',')) {
    const t = parseFloat(s);
    await page.evaluate(n => window.renderFrame(n), Math.round(t * 30));
    const f = path.join(out, `t_${t.toFixed(2).padStart(5, '0')}.png`);
    await page.screenshot({ path: f, clip, type: 'png' });
    console.log('still', f);
  }
} else {
  const out = path.join(ROOT, 'output', 'frames');
  fs.mkdirSync(out, { recursive: true });
  const probe = await openPage();
  const total = Math.round(await probe.evaluate(() => window.DUR * window.FPS)) + 1;
  await probe.close();
  const from = +(args.from ?? 0), to = Math.min(+(args.to ?? total - 1), total - 1);
  const workers = +(args.workers ?? 3);
  const queue = []; for (let n = from; n <= to; n++) queue.push(n);
  let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage();
    while (queue.length) {
      const n = queue.shift();
      const S = await page.evaluate(k => window.renderFrame(k), n);
      await page.screenshot({ path: path.join(out, `${String(n).padStart(5, '0')}.png`), clip, type: 'png' });
      done++;
      if (done % 30 === 0 || S > 1) process.stdout.write(`\rframes ${done}/${to - from + 1}  (último ${n}, ${S} sub)  ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
    }
    await page.close();
  }));
  console.log(`\nok: ${to - from + 1} quadros em ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
}
await browser.close();
server.close();
