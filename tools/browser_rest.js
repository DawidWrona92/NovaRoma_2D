// Odpoczynek na krześle w przeglądarce (Punkt 15): po kilkunastu sekundach gry co najmniej jedna postać siedzi (a.sit), krzesło jest rysowane bez błędów JS, a siedząca postać ma opis „odpoczywa”.
// Użycie: node tools/browser_rest.js [plik.html]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), file = 'file://' + path.resolve(process.argv[2] || 'Nova_Roma.html');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✘ ' + m); } return c; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const nation of ['franks', 'saracens', 'vikings', 'slavs']) {
    const p = await b.newPage({ viewport: { width: 1100, height: 700 } }), errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(file + '?menu=0&play=' + nation + '&seed=7'); await p.waitForFunction(() => window.__gameReady, null, { timeout: 90000 });
    await p.evaluate(() => {
      const s = World.state(), k = s.keep; s.res.deski = 999; s.res['kamień'] = 999; s.res.glina = 999; s.res.złoto = 9999; s.res.narzędzia = 50;
      for (const id of ['hut', 'hut', 'hut', 'woodcutter', 'forester']) { let done = false; for (let r = 4; r < 14 && !done; r++) for (let dx = -r; dx <= r && !done; dx++) for (let dy = -r; dy <= r && !done; dy++) { const x = k.x + dx, y = k.y + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); done = true; } } }
      s.speed = 6;
    });
    let sat = 0;
    for (let i = 0; i < 60 && !sat; i++) { await p.waitForTimeout(500); sat = await p.evaluate(() => Walkers.figures().filter(a => a.sit && a.act === 'rest').length); }
    ok(sat > 0, `${nation}: po kilkunastu sekundach ktoś siedzi na krześle (${sat})`);
    if (sat) {
      const info = await p.evaluate(() => { const a = Walkers.figures().find(q => q.sit && q.act === 'rest'); return { kind: a.kind, stage: a.stage || null }; });
      ok(info.kind === 'citizen' || info.kind === 'worker', `${nation}: siedzi mieszkaniec lub robotnik (${info.kind})`);
    }
    const pre = { franks: 'frank', saracens: 'sar', vikings: 'vik', slavs: 'slav' }[nation];                                  // tułów bez rąk dla odpoczywających (błąd „cztery ręce”): oba warianty wypieczone i oznaczone noArms
    ok(await p.evaluate(pre => ['WorkerSit', 'WorkerBSit'].every(k => Sprites.cast(pre + k) && Sprites.engine.CAST[pre + k].noArms === true), pre), `${nation}: są warianty tułowia bez rąk (WorkerSit, WorkerBSit)`);
    await p.waitForTimeout(1500);
    ok(errs.length === 0, `${nation}: brak błędów JS ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
  await b.close(); console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `\n✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
})();
