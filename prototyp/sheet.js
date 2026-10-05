'use strict';
/* Arkusz wszystkich sprite'ów w skali wypieku: node sheet.js [wyjście.png] [dpr] */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const path = require('path');
(async () => {
  const out = process.argv[2] || 'sheet.png', dpr = parseFloat(process.argv[3] || '1');
  const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: parseInt(process.env.SW || '1400', 10), height: parseInt(process.env.SH || '1100', 10) }, deviceScaleFactor: dpr });
  const errs = []; page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + path.join(__dirname, 'grafika_prototyp.html') + (process.argv[4] || '#sheet'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot(/\.jpe?g$/i.test(out) ? { path: out, quality: 90 } : { path: out });
  console.log('OK', out); if (errs.length) console.log('BŁĘDY:\n' + errs.join('\n'));
  await browser.close();
})();
