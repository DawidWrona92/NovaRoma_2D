'use strict';
/* Zrzut ekranu prototypu w Chromium (Playwright); SETZOOM=0.6 ustawia zoom po załadowaniu:
   node shot.js wyjście.(png|jpg) [zapytanie] [dpr] [szer] [wys] [x,y,w,h]
   zapytanie np. "grid=1", "q=2", "z=2.4"; PERF=1 wypisuje czas wypieku i koszt klatki */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shot.png', query = process.argv[3] || '', dpr = parseFloat(process.argv[4] || '1');
  const W = parseInt(process.argv[5] || '1280', 10), H = parseInt(process.argv[6] || '720', 10);
  const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, 'grafika_prototyp.html') + (query ? '?' + query : ''));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(1500);
  if (process.env.SETZOOM) await page.evaluate(z => window.__setZoom(z), parseFloat(process.env.SETZOOM));   // zoom bezwzględny (np. 0.6 = najdalej na pulpicie)
  await page.waitForFunction(() => window.__pending === 0, null, { timeout: 180000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => ({ bake: window.__bakeMs, fps: document.getElementById('fps').textContent, zl: document.getElementById('zl') && document.getElementById('zl').textContent }));
  const clip = process.argv[7] ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(process.argv[7].split(',').map(Number)) : undefined;
  const shotOpt = { path: out, clip }; if (/\.jpe?g$/i.test(out)) shotOpt.quality = 90;
  await page.screenshot(shotOpt);
  console.log('wypiek ms:', info.bake && info.bake.toFixed(0), '| fps:', info.fps, '| zoom:', info.zl, '| zrzut:', out);
  if (process.env.PERF) console.log('perf:', JSON.stringify(await page.evaluate(() => { const n = 10, t0 = performance.now(); for (let i = 0; i < n; i++) drawFrame(10 + i * 0.016, 0.016); ctx.getImageData(0, 0, 1, 1); return { drawFrameMs: +((performance.now() - t0) / n).toFixed(1), obiekty: WORLD.objs.length, kafle: chunks.size }; })));
  if (errs.length) console.log('BŁĘDY:\n' + errs.join('\n'));
  await browser.close();
})();
