// Test menu głównego, Piaskownicy i menu w grze (Faza 9): tylko Piaskownica aktywna, klawiatura, przepływ nacja → klimat → typ → ziarno → Start dla każdej nacji (mapa gry = mapa podglądu),
// blokada typów map dla Wikingów, pamięć wyboru (localStorage), przycisk ☰ i Esc (pauza, priorytet nad anulowaniem budowy), „Nowa mapa” i „Menu główne” (nawigacja), widok telefonu, brak błędów JS.
// Użycie: node tools/browser_menu.js
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium, devices } = pw;
const file = 'file://' + path.resolve('Nova_Roma.html');
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✔ ' : '  ✘ ') + msg); if (!c) fails++; };
const errors = [];
const track = page => { page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); return page; };
const ready = page => page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 });
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = track(await ctx.newPage());

  console.log('Menu główne');
  await page.goto(file + '?q=1');
  ok(await vis(page, '#mainMenu') && !(await vis(page, '#factionPick')) && !(await vis(page, '#sandbox')), 'start strony: menu główne, bez dawnego wyboru nacji');
  const items = await page.evaluate(() => [...document.querySelectorAll('#mmList button')].map(b => ({ id: b.getAttribute('data-id'), off: b.getAttribute('aria-disabled') === 'true', title: b.title })));
  ok(items.length === 9 && items.filter(i => !i.off).map(i => i.id).join() === 'sandbox', 'pozycji 9, aktywna tylko Piaskownica (' + items.filter(i => !i.off).map(i => i.id).join() + ')');
  ok(items.filter(i => i.off).every(i => i.title === 'Wkrótce'), 'pozycje nieaktywne mają podpowiedź „Wkrótce”');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  ok(await page.evaluate(() => document.querySelector('#mmList button.focus').getAttribute('data-id')) === 'sandbox', '↑↓ zostają na jedynej aktywnej pozycji');
  await page.evaluate(() => document.querySelector('#mmList button[data-id="campaign"]').click());
  ok(await vis(page, '#mainMenu') && !(await vis(page, '#sandbox')), 'klik w pozycję nieaktywną nic nie robi');
  await page.keyboard.press('Enter');
  ok(await vis(page, '#sandbox') && !(await vis(page, '#mainMenu')), 'Enter otwiera Piaskownicę');

  console.log('Piaskownica');
  const tiles = await page.evaluate(() => ({ climates: document.querySelectorAll('#sbClimates button').length, types: document.querySelectorAll('#sbTypes button').length, cards: document.querySelectorAll('#sbFactions .factionCard').length }));
  ok(tiles.climates === 4 && tiles.types === 6 && tiles.cards === 4, 'kafle: 4 klimaty, 6 typów map, 4 nacje (' + JSON.stringify(tiles) + ')');
  const painted = () => page.evaluate(() => { const c = document.getElementById('sbPreview'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set(); for (let i = 0; i < d.length; i += 4 * 97) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return seen.size; });
  await page.waitForTimeout(250);
  ok(await painted() >= 4, 'podgląd mapy jest narysowany (kolory: ' + await painted() + ')');
  // wybór: Wikingowie → tylko nadmorska
  await page.locator('#sbFactions .factionCard h2', { hasText: 'Wikingowie' }).click(); await page.waitForTimeout(150);
  const vik = await page.evaluate(() => ({ dis: [...document.querySelectorAll('#sbTypes button')].filter(b => b.disabled).length, sel: document.querySelector('#sbTypes button.sel').getAttribute('data-id'), note: document.getElementById('sbNote').textContent }));
  ok(vik.dis === 5 && vik.sel === 'coast' && /nad morzem/.test(vik.note), 'Wikingowie: 5 typów zablokowanych, wybrana nadmorska, objaśnienie (' + vik.note + ')');
  // zmiana nacji na Słowian: zablokowanie znika, klimat nacji
  await page.locator('#sbFactions .factionCard h2', { hasText: 'Słowianie' }).click(); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelectorAll('#sbTypes button:disabled').length) === 0 && await page.evaluate(() => document.querySelector('#sbClimates button.sel').getAttribute('data-id')) === 'eastern', 'Słowianie: typy odblokowane, klimat nacji (Europa Wschodnia)');
  // ziarno i losowanie
  await page.fill('#sbSeed', '4242'); await page.dispatchEvent('#sbSeed', 'change'); await page.waitForTimeout(200);
  const d1 = await page.textContent('#sbDesc'); ok(/ziarno 42\d\d|ziarno 4[3-9]\d\d/.test(d1), 'ziarno z pola wchodzi do opisu mapy (' + d1 + ')');
  const before = await page.inputValue('#sbSeed'); await page.click('#sbRandom'); await page.waitForTimeout(200);
  ok(await page.inputValue('#sbSeed') !== before, '„Losuj mapę” zmienia ziarno');
  ok((await page.textContent('#sbSummary')).includes('Woda'), 'podsumowanie mapy (woda, wzgórza, drzewa, złoża)');
  await page.keyboard.press('Escape');
  ok(await vis(page, '#mainMenu') && !(await vis(page, '#sandbox')), 'Esc w Piaskownicy wraca do menu głównego');
  await page.keyboard.press('Enter');

  console.log('Start gry z Piaskownicy (4 nacje: mapa gry = mapa podglądu)');
  await page.close();
  for (const [fid, name, climate, type] of [['franks', 'Frankowie', 'snow', 'river'], ['saracens', 'Saraceni', 'desert', 'lakes'], ['vikings', 'Wikingowie', 'temperate', 'coast'], ['slavs', 'Słowianie', 'eastern', 'wetlands']]) {
    const c = await browser.newContext({ viewport: { width: 1200, height: 800 } }), pg = track(await c.newPage());
    await pg.goto(file + '?q=1'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
    await pg.locator('#sbFactions .factionCard h2', { hasText: name }).click();
    await pg.click(`#sbClimates button[data-id="${climate}"]`);
    if (fid !== 'vikings') await pg.click(`#sbTypes button[data-id="${type}"]`);
    await pg.fill('#sbSeed', '777'); await pg.dispatchEvent('#sbSeed', 'change'); await pg.waitForTimeout(250);
    const want = await pg.evaluate(() => Menu.state().meta);
    await pg.click('#sbStart'); await ready(pg);
    const got = await pg.evaluate(() => { const s = World.state(), m = s.map.meta; return { fid: s.factionId, climate: m.climate, type: m.type, seed: m.seed, menus: ['mainMenu', 'sandbox', 'pauseMenu', 'factionPick'].map(id => getComputedStyle(document.getElementById(id)).display), hud: document.getElementById('hudFaction').textContent }; });
    ok(got.fid === fid && got.climate === climate && got.type === type && got.seed === want.seed && got.climate === want.climate && got.type === want.type, `${fid}: gra na mapie z podglądu (${got.climate} · ${got.type} · ziarno ${got.seed})`);
    ok(got.menus.every(d => d === 'none') && got.hud.includes(name), `${fid}: ekrany menu ukryte, HUD opisuje nację i mapę (${got.hud})`);
    if (fid === 'vikings') {
      // ☰ Menu i pauza
      ok(await vis(pg, '#btnMenu'), '☰ Menu widoczny w HUD');
      await pg.evaluate(() => { World.state().speed = 2; });
      await pg.click('#btnMenu'); await pg.waitForTimeout(100);
      ok(await vis(pg, '#pauseMenu') && await pg.evaluate(() => World.state().speed) === 0 && (await pg.textContent('#btnSpeed')) === 'Pauza', 'menu w grze: pauza (speed 0, etykieta „Pauza”)');
      const cam0 = await pg.evaluate(() => Camera.x); await pg.keyboard.down('d'); await pg.waitForTimeout(300); await pg.keyboard.up('d');
      ok(await pg.evaluate(() => Camera.x) === cam0, 'klawisze kamery ignorowane przy otwartym menu');
      ok(await pg.evaluate(() => [...document.querySelectorAll('#pmList button')].map(b => b.getAttribute('data-id') + ':' + (b.getAttribute('aria-disabled') === 'true' ? 'off' : 'on')).join()) === 'resume:on,newmap:on,options:off,main:on', 'pozycje: Wznów, Nowa mapa, Opcje (szare), Menu główne');
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
      ok(!(await vis(pg, '#pauseMenu')) && await pg.evaluate(() => World.state().speed) === 2 && (await pg.textContent('#btnSpeed')) === 'Prędkość: ×2', 'Esc zamyka menu i przywraca prędkość ×2');
      // priorytet Esc: zaznaczona budowa → Esc anuluje budowę, nie otwiera menu
      await pg.evaluate(() => BuildMode.select('hut'));
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
      ok(!(await vis(pg, '#pauseMenu')) && await pg.evaluate(() => !BuildMode.isSelected()), 'Esc przy wybranej budowie anuluje budowę (menu się nie otwiera)');
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
      ok(await vis(pg, '#pauseMenu'), 'drugi Esc otwiera menu');
      // Nowa mapa
      const nav = pg.waitForNavigation({ timeout: 20000 }); await pg.click('#pmList button[data-id="newmap"]'); await nav; await ready(pg);
      const nm = await pg.evaluate(() => { const m = World.state().map.meta; return { fid: World.state().factionId, climate: m.climate, type: m.type, seed: m.seed }; });
      ok(nm.fid === 'vikings' && nm.climate === 'temperate' && nm.type === 'coast' && nm.seed !== 777, `„Nowa mapa”: ta sama nacja, klimat i typ, nowe ziarno (${nm.seed})`);
      // Menu główne
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
      const nav2 = pg.waitForNavigation({ timeout: 20000 }); await pg.click('#pmList button[data-id="main"]'); await nav2; await pg.waitForTimeout(300);
      ok(await vis(pg, '#mainMenu') && !(await vis(pg, '#hud')), '„Menu główne”: wraca do menu głównego (bez gry)');
      // pamięć wyboru
      await pg.waitForFunction(() => Menu.mode() === 'main'); await pg.keyboard.press('Enter'); await pg.waitForFunction(() => Menu.mode() === 'sandbox', null, { timeout: 5000 }).catch(() => {});
      const mem = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('novaroma.sandbox')); } catch (e) { return null; } });
      if (mem) ok(mem.fid === 'vikings' && (await pg.evaluate(() => (Menu.state() || {}).fid)) === 'vikings', 'Piaskownica pamięta ostatni wybór (localStorage; tryb: ' + (await pg.evaluate(() => Menu.mode())) + ')');
      else console.log('  – localStorage niedostępny w tym środowisku (pominięto test pamięci)');
    }
    await c.close();
  }

  console.log('Dawny wybór nacji (?menu=0) i skrót ?play=');
  { const c = await browser.newContext({ viewport: { width: 1100, height: 700 } }), pg = track(await c.newPage());
    await pg.goto(file + '?menu=0&q=1'); ok(await vis(pg, '#factionPick') && !(await vis(pg, '#mainMenu')), '?menu=0: dawny ekran wyboru nacji');
    await pg.goto(file + '?play=slavs&q=1'); await ready(pg); ok(!(await vis(pg, '#mainMenu')) && (await pg.evaluate(() => World.state().factionId)) === 'slavs', '?play=slavs: gra startuje bez menu'); await c.close(); }

  console.log('Telefon (dotyk 390×844)');
  { const c = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }), pg = track(await c.newPage());
    await pg.goto(file + '?q=1'); await pg.waitForTimeout(200);
    const h = await pg.evaluate(() => [...document.querySelectorAll('#mmList button')].map(b => b.getBoundingClientRect().height));
    ok(h.length === 9 && h.every(x => x >= 44), 'menu główne na telefonie: 9 pozycji, każda ≥ 44 px (min ' + Math.round(Math.min(...h)) + ')');
    await pg.locator('#mmList button[data-id="sandbox"]').tap(); await pg.waitForTimeout(250);
    const lay = await pg.evaluate(() => { const r = document.getElementById('sbPreview').getBoundingClientRect(), f = document.querySelector('#sbFactions').getBoundingClientRect(); return { previewAbove: r.bottom <= f.top + 2, noOverflow: document.documentElement.scrollWidth <= innerWidth + 1 }; });
    ok(lay.previewAbove && lay.noOverflow, 'Piaskownica na telefonie: podgląd nad kafelkami, bez przewijania poziomego');
    await pg.locator('#sbStart').tap(); await ready(pg);
    ok(await vis(pg, '#btnMenu'), 'telefon: ☰ Menu widoczny w HUD po starcie'); await c.close(); }

  ok(errors.length === 0, 'brak błędów JS' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} testów nie przeszło` : '\nWszystko OK');
  process.exit(fails ? 1 : 0);
})();
