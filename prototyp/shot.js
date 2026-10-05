'use strict';
/* Zrzut ekranu prototypu w Chromium (Playwright): node shot.js [wyjście.png] [zoom] [dpr] [szer] [wys] */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shot.png', zoom = parseFloat(process.argv[3] || '1.6'), dpr = parseFloat(process.argv[4] || '1');
  const W = parseInt(process.argv[5] || '1280', 10), H = parseInt(process.argv[6] || '720', 10);
  const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, 'grafika_prototyp.html'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }).catch(() => {});
  await page.evaluate(z => window.__setZoom && window.__setZoom(z), zoom);
  await page.waitForTimeout(3500);
  const info = await page.evaluate(() => ({ bake: window.__bakeMs, fps: document.getElementById('fps').textContent }));
  const clip = process.argv[7] ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(process.argv[7].split(',').map(Number)) : undefined;
  await page.screenshot({ path: out, clip });
  if (process.env.PERF) console.log('perf:', JSON.stringify(await page.evaluate(() => { window.__perf = true; const n = 12, t0 = performance.now(); for (let i = 0; i < n; i++) drawFrame(10 + i * 0.016, 0.016); const tot = (performance.now() - t0) / n, m = drawFrame.marks, st = {}; for (let i = 1; i < m.length; i++) st[m[i][0]] = +(m[i][1] - m[i - 1][1]).toFixed(1); return { drawFrameMs: +tot.toFixed(1), etapy_ms: st, bakeMs: Math.round(window.__bakeMs), obiekty: WORLD.objs.length, uwaga: 'etapy z wymuszonym flush (getImageData) — tylko do diagnostyki' }; })));
  console.log('bake ms:', info.bake && info.bake.toFixed(0), 'fps:', info.fps, 'zrzut:', out);
  if (errs.length) console.log('BŁĘDY:\n' + errs.join('\n'));
  await browser.close();
})();
