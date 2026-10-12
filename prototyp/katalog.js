'use strict';
/* Eksportuje katalog budynków (id → sprite, obrys, wejście, dym) do katalog_budynkow.json: node katalog.js [wyjście.json]
   Wymaga Node + Playwright + Chromium (jak shot.js / sheet.js). Wypieka wszystkie sprite'y w rozdzielczości 1× (kilkadziesiąt sekund). */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'katalog_budynkow.json');
  const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto('file://' + path.join(__dirname, 'grafika_prototyp.html') + '?q=1&all=1#sheet-r');
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 900000 });
  const cat = await page.evaluate(() => window.__catalog());
  fs.writeFileSync(out, JSON.stringify(cat, null, 1));
  const n = Object.values(cat.nacje).reduce((a, x) => a + Object.keys(x.budynki).length, 0);
  console.log('OK', out, '—', n, 'budynków');
  await browser.close();
})();
