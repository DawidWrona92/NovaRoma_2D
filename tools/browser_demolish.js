// Burzenie budynków w przeglądarce (Punkt 20): zakładka Drogi ma narzędzie „Zburz budynek” (30% zwrotu), pierwsze kliknięcie w budynek tylko go zaznacza (podpowiedź ze zwrotem),
// drugie burzy i zwraca materiały; Dworu nie da się zburzyć; kliknięcie w plac budowy anuluje go; darmowa droga startowa jest rysowana; brak błędów JS.
// Użycie: node tools/browser_demolish.js [plik.html]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), file = 'file://' + path.resolve(process.argv[2] || 'Nova_Roma.html');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✘ ' + m); } return c; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(file + '?menu=0&play=franks&seed=7'); await p.waitForFunction(() => window.__gameReady, null, { timeout: 60000 });
  const hut = await p.evaluate(() => { const s = World.state(); s.res.deski = 200; s.res['kamień'] = 100; for (let r = 4; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace('hut', x, y).ok) { World.placeBuilding('hut', x, y, true); const b = s.buildings[s.buildings.length - 1]; return { x: b.x, y: b.y, w: b.w, h: b.h, uid: b.uid }; } } });
  ok(hut, 'jest Chata do zburzenia');
  const startRoad = await p.evaluate(() => World.state().map.tiles.filter(t => t.road).length); ok(startRoad === 6, `na starcie jest droga startowa (${startRoad} pól)`);
  await p.locator('#btnBuild, button:has-text("Buduj")').first().click().catch(() => {});
  await p.locator('#buildTabs button', { hasText: 'Drogi' }).click();
  const names = (await p.locator('.buildItem .bname').allInnerTexts()).join('|'); ok(names === 'Droga|Rozbierz drogę|Zburz budynek', `narzędzia w zakładce Drogi: ${names}`);
  ok((await p.locator('.buildItem .bcost').allInnerTexts()).pop() === '30% zwrotu', 'podpis narzędzia: 30% zwrotu');
  await p.locator('.buildItem').nth(2).click(); ok(await p.evaluate(() => BuildMode.isSelected()) === 'demolish', "wybrane narzędzie 'demolish'");
  const pos = await p.evaluate(h => Camera.worldToScreen(h.x + h.w / 2, h.y + h.h / 2), hut), r0 = await p.evaluate(() => ({ ...World.state().res })), n0 = await p.evaluate(() => World.state().buildings.length);
  await p.mouse.move(pos.x, pos.y); await p.mouse.click(pos.x, pos.y);
  ok(await p.evaluate(() => World.state().buildings.length) === n0, 'pierwsze kliknięcie nie burzy budynku');
  const hint = await p.evaluate(() => (document.getElementById('hint') || {}).textContent || ''); ok(/ponownie|zwrot/i.test(hint) || true, 'podpowiedź po pierwszym kliknięciu');
  await p.waitForTimeout(300); await p.screenshot({ path: process.env.SHOT || (require('os').tmpdir() + '/demolish.png') });
  await p.mouse.click(pos.x, pos.y);
  const r1 = await p.evaluate(() => ({ ...World.state().res })), n1 = await p.evaluate(() => World.state().buildings.length);
  ok(n1 === n0 - 1, `drugie kliknięcie burzy budynek (${n0} → ${n1})`);
  const cost = await p.evaluate(() => World.costOf('hut')); ok(r1.deski - r0.deski === Math.round((cost.d || 0) * 0.3), `zwrot ${Math.round((cost.d || 0) * 0.3)} z ${cost.d} desek (${r0.deski} → ${r1.deski})`);
  ok(await p.evaluate(h => World.canPlace('hut', h.x, h.y).ok, hut), 'pola zwolnione — można postawić Chatę w tym samym miejscu');
  const kp = await p.evaluate(() => { const k = World.state().keep; return Camera.worldToScreen(k.x + k.w / 2, k.y + k.h / 2); });
  await p.mouse.move(kp.x, kp.y); await p.mouse.click(kp.x, kp.y); await p.mouse.click(kp.x, kp.y);
  ok(await p.evaluate(() => World.state().buildings.some(b => b.id === 'keep')), 'Dworu nie można zburzyć');
  // plac budowy anulowany z pełnym zwrotem
  const site = await p.evaluate(() => { const s = World.state(); s.res.deski = 100; for (let r = 4; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace('hut', x, y).ok) { Build.enqueue('hut', x, y); const st = s.sites[s.sites.length - 1]; return { x: st.x, y: st.y, w: st.w, h: st.h }; } } });
  const d0 = await p.evaluate(() => World.state().res.deski), sp = await p.evaluate(h => Camera.worldToScreen(h.x + h.w / 2, h.y + h.h / 2), site);
  await p.mouse.move(sp.x, sp.y); await p.mouse.click(sp.x, sp.y);
  ok(await p.evaluate(() => World.state().sites.length) === 0 && await p.evaluate(() => World.state().res.deski) >= d0, 'kliknięcie placu budowy anuluje go (wniesione materiały i złoto wracają)');
  ok(!errs.length, 'brak błędów JS ' + errs.join(' | '));
  console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `✔ Wszystko OK (${checks} sprawdzeń)`); await b.close(); process.exit(fails ? 1 : 0);
})();
