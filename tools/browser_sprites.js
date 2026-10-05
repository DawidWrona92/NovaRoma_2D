// Test silnika sprite'ów w przeglądarce: wypiek każdej nacji (Sprites.bake), zgodność obrysów z katalogiem, niepuste warstwy, czas i pamięć.
// Użycie: node tools/browser_sprites.js [jakość 1|2] [nacje przecinkami]
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const file = 'file://' + path.resolve('Nova_Roma.html');
const Q = parseInt(process.argv[2] || '1', 10), nations = (process.argv[3] || 'franks,saracens,vikings,slavs').split(',');
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✔ ' : '  ✘ ') + msg); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 820 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(file);
  ok(await page.evaluate(() => typeof Sprites === 'object' && typeof SPRITE_META === 'object'), 'moduł Sprites i SPRITE_META są załadowane');
  await page.evaluate(q => Sprites.setQuality(q), Q);
  for (const n of nations) {
    console.log(n + ' (jakość ' + Q + ')');
    const r = await page.evaluate(async n => {
      const prog = []; const t0 = performance.now();
      await Sprites.bake(n, (f, label) => { if (!prog.length || f - prog[prog.length - 1][0] > 0.2) prog.push([+f.toFixed(2), label]); });
      const ms = performance.now() - t0, ids = Sprites.ids(n), bad = [], empty = [], mism = [];
      for (const id of ids) {
        const s = Sprites.get(n, id), m = SPRITE_META[n][id];
        if (!s) { bad.push(id); continue; }
        if (s.fw !== m.fp[0] || s.fh !== m.fp[1]) mism.push(`${id}: sprite ${s.fw}×${s.fh} ≠ katalog ${m.fp.join('×')}`);
        const c = document.createElement('canvas'); c.width = 24; c.height = 24; const g = c.getContext('2d'); g.drawImage(s.c, 0, 0, 24, 24);
        const d = g.getImageData(0, 0, 24, 24).data; let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i]; if (a < 24 * 24 * 255 * 0.03) empty.push(id);
      }
      const sets = Object.fromEntries(Object.entries(Sprites.sets).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length]));
      const again = await (async () => { const t = performance.now(); await Sprites.bake(n); return performance.now() - t; })();
      return { ms, ids: ids.length, bad, empty, mism, sets, prog, baked: Sprites.baked(), again, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null };
    }, n);
    ok(r.bad.length === 0, `wszystkie ${r.ids} sprite'ów wypieczone` + (r.bad.length ? ' — brak: ' + r.bad.join(', ') : ''));
    ok(r.mism.length === 0, 'obrysy sprite\'ów = katalog' + (r.mism.length ? ' — ' + r.mism.join('; ') : ''));
    ok(r.empty.length === 0, 'żadna warstwa obiektu nie jest pusta' + (r.empty.length ? ' — ' + r.empty.join(', ') : ''));
    ok(r.baked === n && r.again < 50, `ponowne bake(${n}) nic nie robi (${r.again.toFixed(0)} ms)`);
    ok(r.sets.cast >= 2 && (r.sets.oaks || r.sets.palms) && r.sets.rocks, 'zestawy przyrody i mieszkańców: ' + JSON.stringify(r.sets));
    console.log(`    czas wypieku ${r.ms.toFixed(0)} ms` + (r.mem ? ` · sterta ${r.mem} MB` : '') + ` · postęp: ${r.prog.map(p => p[0]).join(' ')}`);
  }
  ok(errors.length === 0, 'brak błędów JS' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} testów nie przeszło` : '\nWszystko OK');
  process.exit(fails ? 1 : 0);
})();
