// Budowa na telefonie (390×780, dotyk): dotknięcie mapy tylko przesuwa duch, budynek stawia przycisk „Postaw”, „Zakończ” wychodzi z budowy; Magazyn jest chwilowym podglądem po „Zasoby”;
// strona nie jest szersza od ekranu (zakładki budowy się przewijają). Użycie: node tools/browser_mobile_build.js
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✘ ' + m); } };
(async () => {
  const browser = await pw.chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('Nova_Roma.html') + '?play=franks&climate=temperate&map=plain&seed=7');
  await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 }); await page.waitForTimeout(600);
  const st = () => page.evaluate(() => ({ sites: World.state().sites.length, sel: BuildMode.isSelected(), bar: document.body.classList.contains('cb'), peek: document.getElementById('resPanel').classList.contains('peek'), okDis: document.getElementById('bcOk').disabled, iw: innerWidth, sw: document.documentElement.scrollWidth, bot: getComputedStyle(document.getElementById('botPanel') || document.body).display }));
  let r = await st(); ok(r.iw === 390 && r.sw <= 390, `strona nie jest szersza od ekranu (innerWidth ${r.iw}, scrollWidth ${r.sw})`); ok(!r.bar && !r.peek, 'na starcie brak paska budowy i podglądu Magazynu');
  const tabs = await page.evaluate(() => { const t = document.getElementById('buildTabs'); return t.scrollWidth > t.clientWidth && getComputedStyle(t).overflowX === 'auto'; }); ok(tabs, 'zakładki budowy przewijają się (wszystkie dostępne)');
  await page.locator('.buildItem').first().tap(); await page.waitForTimeout(400); r = await st(); ok(r.sel && r.bar, 'wybór budynku pokazuje pasek potwierdzenia');
  const tip = () => page.evaluate(() => { const t = document.getElementById('tooltip'), b = document.getElementById('buildConfirm').getBoundingClientRect(), r = t.getBoundingClientRect(); return { shown: t.style.display === 'block', bottom: r.bottom, barTop: b.top, top: r.top, hud: document.getElementById('hud') ? document.getElementById('hud').getBoundingClientRect().bottom : 0 }; });
  let tp = await tip(); ok(!tp.shown, 'po wyborze budynku tooltip z menu nie zostaje pod paskiem');
  await page.locator('#bcInfo').tap(); await page.waitForTimeout(250); tp = await tip(); ok(tp.shown && tp.bottom <= tp.barTop + 1 && tp.top >= tp.hud - 1, `„Opis” pokazuje opis nad paskiem, bez kolizji (dół opisu ${Math.round(tp.bottom)} ≤ góra paska ${Math.round(tp.barTop)})`);
  await page.locator('#bcInfo').tap(); await page.waitForTimeout(200); tp = await tip(); ok(!tp.shown, 'drugi dotyk „Opis” chowa opis');
  await page.touchscreen.tap(95, 330); await page.waitForTimeout(300); r = await st(); ok(r.sites === 0 && !r.okDis, 'dotknięcie mapy tylko przesuwa duch (nic nie stawia), „Postaw” dostępne');
  await page.locator('#bcOk').tap(); await page.waitForTimeout(300); r = await st(); ok(r.sites === 1 && r.sel, '„Postaw” otwiera plac budowy, tryb budowy trwa');
  await page.touchscreen.tap(95, 330); await page.waitForTimeout(300); r = await st(); ok(r.sites === 1 && r.okDis, 'ten sam punkt jest teraz zajęty: „Postaw” wyłączone, brak drugiego placu');
  await page.locator('#bcCancel').tap(); await page.waitForTimeout(300); r = await st(); ok(!r.sel && !r.bar, '„Zakończ” wychodzi z budowy i chowa pasek');
  await page.locator('#btnRes').tap(); await page.waitForTimeout(300); r = await st(); ok(r.peek, '„Zasoby” pokazuje Magazyn jako chwilowy podgląd');
  await page.waitForTimeout(6400); r = await st(); ok(!r.peek, 'podgląd Magazynu zwija się sam po ok. 6 s');
  await page.locator('#btnMore').tap(); await page.waitForTimeout(300); r = await st(); ok(r.bot === 'block', 'panel testowy pokazuje się dopiero pod „Więcej”');
  ok(errs.length === 0, 'brak błędów JS' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close(); console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
})();
