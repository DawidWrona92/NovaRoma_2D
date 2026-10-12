// Karta postaci (Faza 9E-2): kliknięcie robotnika / budowniczego / mieszkańca pokazuje imię, rolę i miejsce pracy lub zamieszkania, a przycisk „Idź do budynku” przenosi widok do budynku.
// Użycie: node tools/browser_figure.js [plik.html]
const pw = require('/opt/node22/lib/node_modules/playwright'); const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2] || 'Nova_Roma.html'); let fails = 0, checks = 0; const ok = (c, m) => { checks++; console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; return c; };
  const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const pg = await b.newPage({ viewport: { width: 1200, height: 780 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + file + '?play=franks&climate=temperate&map=plain&seed=11'); await pg.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 });
  await pg.evaluate(() => {
    const s = World.state(); s.res.deski = 999; s.res.narzędzia = 50; const put = id => { for (let r = 4; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace(id, 24 + dx, 24 + dy).ok) { World.placeBuilding(id, 24 + dx, 24 + dy, true); return s.buildings[s.buildings.length - 1]; } };
    for (const id of ['woodcutter', 'hut', 'forester']) { const bb = put(id); if (bb && bb.id !== 'hut') s.staffed[bb.uid] = true; }
    for (let t = 0; t < 3; t += 0.1) World.tick(0.1);
  });
  await pg.waitForTimeout(1500);
  for (const kind of ['worker', 'citizen']) {
    const info = await pg.evaluate(k => {
      const f = Walkers.figures().find(a => a.kind === k); if (!f) return null; Camera.zoom = 1.6; Camera.focus(f.x, f.y);
      return { x: f.x, y: f.y };
    }, kind);
    if (!ok(info, `jest postać typu ${kind}`)) continue;
    await pg.waitForTimeout(150);
    const pos = await pg.evaluate(k => { const f = Walkers.figures().find(a => a.kind === k); const p = Camera.worldToScreen(f.x, f.y), r = document.getElementById('c') ? null : null; const cv = document.querySelector('canvas').getBoundingClientRect(); return { x: cv.left + p.x, y: cv.top + p.y - 26 * Camera.zoom }; }, kind);
    await pg.mouse.move(pos.x, pos.y); await pg.mouse.click(pos.x, pos.y); await pg.waitForTimeout(250);
    const card = await pg.evaluate(() => { const e = document.getElementById('fCard'); return { shown: e.style.display === 'block', text: e.textContent }; });
    ok(card.shown && /Teraz:|Pracuje w|Mieszka w/.test(card.text), `${kind}: karta postaci pokazana (${card.text.replace(/\s+/g, ' ').slice(0, 90)})`);
    ok(kind !== 'worker' || /Pracuje w: /.test(card.text), `${kind}: podaje budynek pracy`);
    ok(kind !== 'citizen' || /Mieszka w: /.test(card.text), `${kind}: podaje miejsce zamieszkania`);
    // przycisk „Idź do budynku”
    await pg.evaluate(() => { Camera.x += 900; Camera.y += 600; });
    await pg.click('#fCard button[data-a="go"]'); await pg.waitForTimeout(250);
    const r = await pg.evaluate(() => { const s = World.state(), cx = (-Camera.x / (32 * Camera.zoom) - 0) , cy = -Camera.y / (16 * Camera.zoom); const wx = (cy + cx) / 2, wy = (cy - cx) / 2; const bi = document.getElementById('bInfo'); return { wx, wy, info: bi.style.display === 'block' ? bi.textContent.slice(0, 40) : '' }; });
    ok(r.wx > 0 && r.wx < 48 && Math.hypot(r.wx - 24, r.wy - 24) < 20, `${kind}: „Idź do budynku” ustawia widok na budynku (${r.wx.toFixed(1)}, ${r.wy.toFixed(1)}), karta budynku: ${r.info}`);
    await pg.click('#fCard button[data-a="close"]').catch(() => {});
  }
  ok(!errs.length, 'brak błędów JS ' + errs.join(' | '));
  console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`); await b.close(); process.exit(fails ? 1 : 0);
})();
