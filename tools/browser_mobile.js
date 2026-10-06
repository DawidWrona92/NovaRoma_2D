// Widok mobilny (390×844, dotyk): ekran wyboru nacji i HUD po starcie gry.
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const SHOTS = process.env.SHOTS || '/tmp';
const file = 'file://' + path.resolve('Nova_Roma.html');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(file);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 'm_picker.png') });
  await page.locator('.factionCard h2', { hasText: 'Wikingowie' }).tap();
  await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 }); // wypiek sprite'ów nacji
  await page.evaluate(() => { const s = World.state(), plan = TestBots.RECIPE.vikings.slice(); let pi = 0, nd = 0; for (let t = 0; t < 50; t += 0.1) { World.tick(0.1); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } } UI.refreshHUD(); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, 'm_game.png') });
  await page.tap('#btnAdvisor');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, 'm_advisor.png') });
  console.log('hud wysokość:', await page.evaluate(() => document.getElementById('hud').offsetHeight), 'px | błędy:', errors.length ? errors : 'brak');
  await browser.close();
})();
