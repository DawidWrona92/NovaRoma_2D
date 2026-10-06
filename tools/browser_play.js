// Rozgrywka w przeglądarce: bot buduje osadę, zrzuty z panelami UI, sprawdzenie błędów JS dla wszystkich nacji.
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const SHOTS = process.env.SHOTS || '/tmp';
const file = 'file://' + path.resolve('Nova_Roma.html');
const names = { slavs: 'Słowianie', franks: 'Frankowie', vikings: 'Wikingowie', saracens: 'Saraceni' };
const facs = process.argv[2] ? process.argv[2].split(',') : Object.keys(names);
const minutes = +(process.argv[3] || 70);

(async () => {
  const browser = await chromium.launch();
  for (const fac of facs) {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 820 } })).newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(file);
    await page.locator('.factionCard h2', { hasText: names[fac] }).click();
    await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 }); // wypiek sprite'ów nacji
    // wybór poziomu haraczu przez select (jak gracz)
    await page.selectOption('#btnTribute', 'easy');
    const info = await page.evaluate(({ minutes, zoom }) => {
      const s = World.state(), plan = TestBots.RECIPE[s.factionId].slice();
      let pi = 0, nd = 0;
      for (let t = 0; t < minutes; t += 0.1) {
        World.tick(0.1);
        if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
      }
      UI.refreshHUD();
      s.speed = 0;
      if (zoom) Camera.zoom = zoom; // domyślnie zoom ustawiony przy starcie gry (ZOOM=… wymusza inny)
      const k = s.keep, c = Camera.worldToScreen(k.x + k.w / 2, k.y + k.h / 2);
      Camera.x -= c.x - (innerWidth - 190) / 2; Camera.y -= c.y - innerHeight / 2 + 30;
      return { t: Math.round(s.time), pop: Math.floor(s.pop), buildings: s.buildings.length, sites: s.sites.length, tribute: Tribute.labelOf(s.tribute) };
    }, { minutes, zoom: +process.env.ZOOM || 0 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, `play_${fac}.png`) });
    // doradca
    await page.click('#btnAdvisor');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, `advisor_${fac}.png`) });
    await page.click('#advClose');
    // karta budynku: najechanie na pierwszy budynek produkcyjny
    const pos = await page.evaluate(() => {
      const s = World.state();
      const b = s.buildings.find(b => b.id !== 'keep' && b.id !== 'hut' && Data.BUILDINGS[b.id].worker) || s.keep;
      const sc = Camera.worldToScreen(b.x + b.w / 2, b.y + b.h / 2);
      return { x: sc.x, y: sc.y - 10, id: b.id };
    });
    await page.mouse.move(pos.x, pos.y);
    await page.waitForTimeout(250);
    const card = await page.evaluate(() => document.getElementById('bInfo').innerText);
    await page.screenshot({ path: path.join(SHOTS, `hover_${fac}.png`) });
    // zakładki budowy i podpowiedź
    const tabs = await page.locator('#buildTabs button').allTextContents();
    console.log(fac.padEnd(9), JSON.stringify(info), '| zakładki:', tabs.join('/'), '| karta:', pos.id, '→', card.replace(/\n/g, ' · ').slice(0, 110));
    console.log('   błędy:', errors.length ? errors : 'brak');
    await page.close();
  }
  await browser.close();
})();
