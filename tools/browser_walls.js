// Mury w przeglądarce (Punkt 13): zakładka „Mury”, narzędzia Mur i Rozbierz mur (dwa kliknięcia), koszt z surowców, brak błędów JS, mur rysowany w obu trybach grafiki.
// Użycie: node tools/browser_walls.js [plik.html]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), file = 'file://' + path.resolve(process.argv[2] || 'Nova_Roma.html');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✘ ' + m); } return c; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const mode of ['', '&classic=1']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }), errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(file + '?menu=0&play=franks&seed=7' + mode); await p.waitForFunction(() => window.__gameReady, null, { timeout: 60000 });
    const tag = mode ? 'klasyczny' : 'sprite\'y';
    await p.evaluate(() => { const s = World.state(); s['kamień'] = 0; s.res['kamień'] = 400; for (const t of s.map.tiles) { t.trees = 0; t.deposit = null; } });
    await p.locator('#btnBuild, button:has-text("Buduj")').first().click().catch(() => {});
    const tabs = await p.locator('#buildTabs button').allInnerTexts(); ok(tabs.includes('Mury'), `${tag}: jest zakładka Mury`);
    await p.locator('#buildTabs button', { hasText: 'Mury' }).click();
    ok(await p.locator('.buildItem').count() === 3, `${tag}: trzy narzędzia w zakładce Mury`);
    ok((await p.locator('.buildItem .bname').allInnerTexts()).join('|') === 'Mur|Brama|Rozbierz mur', `${tag}: nazwy Mur, Brama, Rozbierz mur`);
    await p.locator('.buildItem').first().click();
    ok(await p.evaluate(() => BuildMode.isSelected()) === 'wall', `${tag}: wybrane narzędzie 'wall'`);
    const pts = await p.evaluate(() => { const k = World.state().keep, ws = (x, y) => Camera.worldToScreen(x, y); const a = ws(k.x - 4 + 0.5, k.y + 6.5), c = ws(k.x + 3 + 0.5, k.y + 6.5); return [a, c]; });
    const r0 = await p.evaluate(() => World.state().res['kamień']);
    await p.mouse.move(pts[0].x, pts[0].y); await p.mouse.click(pts[0].x, pts[0].y); await p.mouse.move(pts[1].x, pts[1].y); await p.mouse.click(pts[1].x, pts[1].y);
    const n = await p.evaluate(() => World.state().map.tiles.filter(t => t.wall).length), r1 = await p.evaluate(() => World.state().res['kamień']);
    ok(n === 8 && r0 - r1 === 8, `${tag}: dwa kliknięcia kładą 8 pól muru za 8 kamienia (pól ${n}, kamień ${r0}→${r1})`);
    await p.waitForTimeout(500);
    await p.screenshot({ path: process.env.SHOT || (require('os').tmpdir() + '/walls' + (mode ? '_classic' : '') + '.png') });
    await p.locator('.buildItem').nth(1).click();
    ok(await p.evaluate(() => BuildMode.isSelected()) === 'gate', `${tag}: wybrane narzędzie 'gate'`);
    const gp = await p.evaluate(() => { const k = World.state().keep; return Camera.worldToScreen(k.x - 4 + 2 + 0.5, k.y + 6.5); });
    await p.mouse.move(gp.x, gp.y); await p.mouse.click(gp.x, gp.y);
    ok(await p.evaluate(() => World.state().map.tiles.filter(t => t.wall > 1).length) === 1, `${tag}: klik na murze stawia bramę (wall > 1)`);
    await p.waitForTimeout(400); await p.screenshot({ path: (process.env.SHOT || require('os').tmpdir() + '/walls') + '_gate' + (mode ? '_classic' : '') + '.png' });
    await p.keyboard.press('Escape');
    await p.locator('#buildTabs button', { hasText: 'Mury' }).click(); await p.locator('.buildItem').nth(2).click();
    const q = await p.evaluate(() => { const k = World.state().keep, t = World.state().map.tiles.findIndex(t => t.wall), N = World.state().map.size; return Camera.worldToScreen(t % N + 0.5, ((t / N) | 0) + 0.5); });
    await p.mouse.move(q.x, q.y); await p.mouse.click(q.x, q.y);
    ok(await p.evaluate(() => World.state().map.tiles.filter(t => t.wall).length) === 7, `${tag}: Rozbierz mur zdejmuje jedno pole`);
    ok(errs.length === 0, `${tag}: brak błędów JS ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
  await b.close(); console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `\n✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
})();
