/* Teste de fumaça no navegador (Playwright).
 * Uso: npm run build && npm run preview  (em outro terminal)  e depois  npm run test:e2e
 * Requer o Playwright instalado na máquina (npx playwright install chromium).
 */
const { chromium } = require('playwright');

const URL = process.env.SMOKE_URL || 'http://localhost:4173/';
const results = [];
const check = (name, ok, info = '') => {
  results.push({ name, ok, info });
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${info ? ` — ${info}` : ''}`);
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

  // 1) Desktop: erros, capítulos, navegação por teclado, diálogos.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const ids = await page.$$eval('main > section[id]', (els) => els.map((e) => e.id));
    check('10 capítulos com id', ids.length === 10, ids.join(', '));

    const text = await page.evaluate(() => document.body.innerText);
    check('nenhuma afirmação de "100% de margem"', !/100\s*%\s*de\s*margem/i.test(text));
    check('margem e markup corretos visíveis', text.includes('122,5%') && text.includes('55,1%'));
    check('logos das duas marcas presentes', (await page.$$('img[alt="Odontoprev"]')).length > 0 && (await page.$$('img[alt="Dental Partner"]')).length > 0);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1800);
    const ch1 = await page.textContent('.site-header__chapter');
    check('ArrowRight leva ao capítulo 02', /02/.test(ch1 || ''), ch1 || '');
    await page.keyboard.press('End');
    // A rolagem passa por cenas 3D pesadas: espera até 8 s pelo capítulo final.
    await page
      .waitForFunction(() => /10 \/ 10/.test(document.querySelector('.site-header__chapter')?.textContent || ''), null, { timeout: 8000 })
      .catch(() => undefined);
    const chEnd = await page.textContent('.site-header__chapter');
    check('End leva ao capítulo 10', /10 \/ 10/.test(chEnd || ''), chEnd || '');
    await page.keyboard.press('Home');
    await page.waitForTimeout(2500);

    await page.click('.menu-btn');
    await page.waitForTimeout(400);
    check('índice abre', await page.$eval('dialog.index', (d) => d.open));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check('Esc fecha o índice', !(await page.$eval('dialog.index', (d) => d.open)));

    await page.evaluate(() => document.getElementById('condicoes').scrollIntoView());
    await page.waitForTimeout(800);
    await page.click('#condicoes .abtn');
    await page.waitForTimeout(400);
    const rows = await page.$$eval('.premises__table tbody tr', (r) => r.length);
    check('premissas listam os números com status', rows >= 20, `${rows} linhas`);
    await page.keyboard.press('Escape');

    await page.evaluate(() => document.getElementById('economia').scrollIntoView());
    await page.waitForTimeout(600);
    await page.click('.seg >> nth=0');
    const gross = await page.textContent('.ledger__row:nth-child(3) .ledger__v');
    check('simulação a R$ 17,80 recalcula a diferença bruta', (gross || '').includes('8,90'), gross || '');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('sem rolagem horizontal em 1440', overflow <= 0, `${overflow}px`);
    check('sem erros no console', errors.length === 0, errors.slice(0, 3).join(' | '));
    await page.close();
  }

  // 2) Tablet e celular: sem rolagem horizontal.
  for (const [w, h] of [
    [1024, 768],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`sem rolagem horizontal em ${w}×${h}`, overflow <= 0, `${overflow}px`);
    await page.close();
  }

  // 3) Movimento reduzido: conteúdo visível sem depender de animação.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => document.getElementById('economia').scrollIntoView());
    await page.waitForTimeout(500);
    const op = await page.$eval('#economia .t-h2 .rv-i', (el) => getComputedStyle(el).opacity);
    check('títulos visíveis com movimento reduzido', op === '1', `opacity ${op}`);
    const pinned = await page.$$eval('.scrub.is-pinned', (els) => els.length);
    check('sem trilhos fixados com movimento reduzido', pinned === 0);
    await ctx.close();
  }

  // 4) Modo leve: cenas 3D viram imagens estáticas.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem('escovas-premium:lite', '1'));
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('produto').scrollIntoView());
    await page.waitForTimeout(1500);
    const canvases = await page.$$eval('.scene-host canvas', (c) => c.length);
    const posters = await page.$$eval('.scene-poster', (p) => p.length);
    check('modo leve usa pôster no lugar do 3D', canvases === 0 && posters >= 1, `${canvases} canvas, ${posters} pôsteres`);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} verificações passaram.`);
  process.exit(failed ? 1 : 0);
})();
