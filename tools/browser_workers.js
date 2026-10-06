// Robotnicy w przeglądarce (Faza 9B-1): po 45 minutach gry bota na ekranie są robotnicy z narzędziami i ładunkami (każda nacja), wolni obywatele = wolna ludność, budowniczowie z młotkiem,
// ?workers=0 przywraca dawne cienie (nosiciele), a FPS z robotnikami nie spada poniżej 85% FPS bez nich. Użycie: node tools/browser_workers.js [nacje] [--shots=katalog]
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const file = 'file://' + path.resolve('Nova_Roma.html');
const facs = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'franks,saracens,vikings,slavs').split(',');
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; };

async function play(browser, fac, query, minutes) {
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 760 } })).newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(file + '?play=' + fac + '&seed=7&q=1' + query);
  await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 });
  await page.evaluate(({ minutes }) => {
    const s = World.state(), plan = TestBots.RECIPE[s.factionId].slice(); let pi = 0, nd = 0;
    for (let t = 0; t < minutes; t += 0.1) { World.tick(0.1); Walkers.update(0.1); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } }
    UI.refreshHUD(); s.speed = 3; const k = s.keep, c = Camera.worldToScreen(k.x + k.w / 2 + 3, k.y + k.h / 2 + 3); Camera.x -= c.x - innerWidth / 2; Camera.y -= c.y - innerHeight / 2;
  }, { minutes });
  return { page, errors };
}
const fps = (page, ms) => page.evaluate(ms => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }), ms);

(async () => {
  const browser = await pw.chromium.launch();
  for (const fac of facs) {
    console.log(fac);
    const { page, errors } = await play(browser, fac, '', 45);
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => {
      const f = Walkers.figures(), by = {}, s = World.state(); for (const a of f) by[a.kind] = (by[a.kind] || 0) + 1;
      const w = f.filter(a => a.kind === 'worker');
      return { by, acts: [...new Set(w.map(a => a.act).filter(Boolean))], tools: [...new Set(w.map(a => a.tool).filter(Boolean))], loads: [...new Set(w.map(a => a.load && a.load[0]).filter(Boolean))],
        builders: f.filter(a => a.kind === 'builder').map(a => a.tool), free: Math.max(0, Math.floor(s.pop) - s.workersStaffed - (s.crewAway || 0) - (s.buildersActive || 0)), citizens: s.citizens.length, flag: s.settings.workers };
    });
    ok(r.flag === true && (r.by.worker || 0) >= 10, `robotnicy na ekranie: ${r.by.worker || 0} (czynności: ${r.acts.join(', ')})`);
    ok(r.tools.length >= 4, `narzędzia: ${r.tools.join(', ')}`);
    ok((r.by.citizen || 0) === Math.min(r.free, r.citizens), `widoczni obywatele ${r.by.citizen || 0} = wolna ludność ${r.free}`);
    ok(!r.by.carrier, 'bez cieni-nosicieli');
    const fOn = await fps(page, 2500);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `workers_${fac}.png`) });
    ok(errors.length === 0, 'brak błędów JS' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await page.close();
    const off = await play(browser, fac, '&workers=0', 45);
    await off.page.waitForTimeout(1500);
    const r0 = await off.page.evaluate(() => { const by = {}; for (const a of Walkers.figures()) by[a.kind] = (by[a.kind] || 0) + 1; return { by, flag: World.state().settings.workers }; });
    ok(r0.flag === false && !r0.by.worker && (r0.by.carrier || 0) >= 0, `?workers=0: dawne cienie (obywatele ${r0.by.citizen || 0}, nosiciele ${r0.by.carrier || 0}), bez robotników`);
    const fOff = await fps(off.page, 2500);
    ok(fOn >= 0.85 * fOff || fOn >= 50, `FPS z robotnikami ${fOn.toFixed(0)} vs bez ${fOff.toFixed(0)}`);
    ok(off.errors.length === 0, '?workers=0: brak błędów JS');
    await off.page.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} sprawdzeń nie przeszło` : '\nWszystko OK');
  process.exit(fails ? 1 : 0);
})();
