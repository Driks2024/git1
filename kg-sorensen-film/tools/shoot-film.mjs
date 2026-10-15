// Screenshots of the scroll film at given progress values.
// node tools/shoot-film.mjs outDir w h p1 p2 ...   (or a JSON list via --list file)
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const [outDir, w, h] = args;
let ps = args.slice(3);
if (ps[0] === '--list') ps = JSON.parse(readFileSync(ps[1], 'utf8'));
mkdirSync(outDir, { recursive: true });
const url = process.env.FILM_URL ?? 'http://127.0.0.1:5173/index.html';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180000);
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    const t = m.text();
    if (!t.includes('Optimize Dep') && !t.includes('KHR_parallel')) console.log(`[${m.type()}]`, t.slice(0, 300));
  }
});
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${url}?snap=1&shot=1&dpr=1&time=${process.env.TIME ?? 4}`);
await page.waitForFunction(() => window.__film?.ready, null, { timeout: 300000 });
for (const p of ps) {
  const t0 = Date.now();
  await page.evaluate((v) => window.__film.seek(Number(v)), p);
  const f0 = await page.evaluate(() => window.__film.frames);
  await page.waitForFunction((f) => window.__film.frames >= f + 3, f0, { timeout: 120000 });
  const name = String(p).padEnd(5, '0');
  await page.screenshot({ path: `${outDir}/p${name}.png`, timeout: 180000 });
  console.log(name, `${Date.now() - t0}ms`);
}
await browser.close();
