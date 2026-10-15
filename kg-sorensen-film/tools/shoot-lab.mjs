// Look-dev screenshots of the 3D rig: node tools/shoot-lab.mjs presets.json outDir [w h]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const [presetsPath, outDir, w = '1600', h = '900'] = process.argv.slice(2);
const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text().slice(0, 400));
});
page.on('pageerror', (e) => { console.log('[pageerror]', e.message, e.stack?.split('\n').slice(0, 5).join(' | ')); process.exit(1); });
await page.goto(process.env.LAB_URL ?? 'http://127.0.0.1:5173/lab.html');
await page.waitForFunction(() => window.__lab?.ready, null, { timeout: 180000 });
console.log('counts', JSON.stringify(await page.evaluate(() => window.__lab.info())));
for (const [name, state] of Object.entries(presets)) {
  const t0 = Date.now();
  await page.evaluate((s) => window.__lab.render(s), state);
  await page.evaluate((s) => window.__lab.render(s), state);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log(name, `${Date.now() - t0}ms`);
}
await browser.close();
