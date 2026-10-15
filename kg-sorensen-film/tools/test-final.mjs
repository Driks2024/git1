// Interaction smoke test of the final scene: selector, sweep hand-over, drag, CTA.
import { chromium } from 'playwright';
const out = process.argv[2];
const url = process.env.FILM_URL ?? 'http://127.0.0.1:4173/index.html';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.setDefaultTimeout(240000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${url}?dpr=1&t=1`);
await page.waitForFunction(() => window.__film?.ready);
const frames = async (n) => {
  const f0 = await page.evaluate(() => window.__film.frames);
  await page.waitForFunction((f) => window.__film.frames >= f, f0 + n);
};
await frames(3);
await page.screenshot({ path: `${out}/a-final.png` });
await page.getByRole('button', { name: 'CHAMA' }).click();
await page.getByRole('button', { name: /FINA/ }).first().click();
await frames(4);
await page.waitForTimeout(1500);
await frames(3);
const st1 = await page.evaluate(() => window.__film.state());
await page.screenshot({ path: `${out}/b-chama-fina.png` });
// drag on empty canvas
await page.mouse.move(800, 450);
await page.mouse.down();
await page.mouse.move(1100, 470, { steps: 4 });
await frames(2);
await page.screenshot({ path: `${out}/c-drag.png` });
await page.mouse.up();
const cta = page.getByRole('button', { name: /Fale com nosso time comercial/i });
await cta.click();
const expanded = await cta.getAttribute('aria-expanded');
await frames(2);
await page.screenshot({ path: `${out}/d-cta.png` });
console.log(JSON.stringify({ variant: st1?.variant, expanded, errors }, null, 1));
await browser.close();
