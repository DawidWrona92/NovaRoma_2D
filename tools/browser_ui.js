// Test przepływów UI w przeglądarce: budowa kliknięciem, karta budynku, haracz, przełączniki, doradca.
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const file = 'file://' + path.resolve('Nova_Roma.html');
const names = { slavs: 'Słowianie', franks: 'Frankowie', vikings: 'Wikingowie', saracens: 'Saraceni' };
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✔ ' : '  ✘ ') + msg); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch();
  for (const fac of Object.keys(names)) {
    console.log(names[fac]);
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 820 } })).newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(file);
    await page.locator('.factionCard h2', { hasText: names[fac] }).click();
    await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 }); // wypiek sprite'ów nacji
    // 1) budowa kliknięciem: wybierz pierwszą pozycję z zakładki „Mieszkania", kliknij na wolne pole obok Dworu
    await page.locator('#buildTabs button', { hasText: 'Mieszkania' }).click();
    await page.locator('.buildItem').first().click();
    const spot = await page.evaluate(() => {
      const s = World.state(), k = s.keep;
      for (let r = 3; r < 8; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (World.canPlace('hut', k.x + dx, k.y + dy).ok) { const sc = Camera.worldToScreen(k.x + dx + 0.5, k.y + dy + 0.5); return { x: sc.x, y: sc.y }; }
      }
    });
    await page.mouse.move(spot.x, spot.y); await page.mouse.click(spot.x, spot.y);
    ok(await page.evaluate(() => World.state().sites.length) === 1, 'klik na mapie otwiera plac budowy');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => BuildMode.isSelected()) === null, 'ESC kończy tryb budowy');
    // 2) pasek budowy: wszystkie zakładki i pozycje mają nazwy/koszty, tooltip działa
    const tabs = await page.locator('#buildTabs button').count();
    let items = 0, roadItems = 0;
    for (let i = 0; i < tabs; i++) {
      const btn = page.locator('#buildTabs button').nth(i), isRoads = (await btn.innerText()).trim() === 'Drogi';   // zakładka Drogi to narzędzia (Droga, Rozbierz drogę), nie budynki
      await btn.click(); const n = await page.locator('.buildItem').count(); if (isRoads) roadItems = n; else items += n;
    }
    const total = await page.evaluate(() => Object.keys(Data.BUILDINGS).filter(id => id !== 'keep' && (!Data.BUILDINGS[id].factions || Data.BUILDINGS[id].factions.includes(World.state().factionId))).length);
    ok(items === total, 'pasek budowy pokazuje wszystkie ' + total + ' budynków nacji (znaleziono ' + items + ')');
    ok(roadItems === 2, 'zakładka Drogi: narzędzia Droga i Rozbierz drogę (znaleziono ' + roadItems + ')');
    await page.locator('.buildItem').first().hover();
    ok((await page.locator('#tooltip').innerText()).includes('Koszt'), 'tooltip pozycji budowy pokazuje koszt');
    // 3) karta budynku: klik na Dwór przypina, klik w puste pole zamyka
    const kp = await page.evaluate(() => { const k = World.state().keep, sc = Camera.worldToScreen(k.x + 1, k.y + 1); return { x: sc.x, y: sc.y - 10 }; });
    await page.mouse.move(kp.x, kp.y); await page.mouse.click(kp.x, kp.y);
    ok((await page.locator('#bInfo').innerText()).includes('Dwór') || (await page.locator('#bInfo').innerText()).includes('Serce osady'), 'klik na Dwór pokazuje kartę budynku');
    await page.mouse.move(150, 300); await page.mouse.click(150, 300);
    ok(await page.locator('#bInfo').isHidden(), 'klik w puste pole zamyka kartę');
    // 4) haracz: select (preset i własny poziom)
    await page.selectOption('#btnTribute', 'master');
    const lvl = await page.evaluate(() => World.state().tribute.level);
    ok(lvl === ({ franks: 10, saracens: 7, vikings: 12, slavs: 11 })[fac], 'Mistrz = poziom ' + lvl + ' dla tej nacji');
    await page.selectOption('#btnTribute', 'L9');
    ok(await page.evaluate(() => World.state().tribute.level) === 9 && await page.evaluate(() => World.state().tribute.preset) === 'custom', 'własny poziom 9');
    await page.selectOption('#btnTribute', 'off');
    ok(await page.evaluate(() => World.state().tribute) === null, 'haracz wyłączony');
    // 5) przełączniki
    await page.click('#btnRations'); await page.click('#btnTax'); await page.click('#btnBuilders'); await page.click('#btnSpeed');
    const st = await page.evaluate(() => { const s = World.state(); return { r: s.controls.rations, t: s.controls.tax, b: s.builders, sp: s.speed }; });
    ok(st.r === 1.5 && st.t === 2 && st.b === 4 && st.sp === 2, 'racje/podatek/budowniczowie/prędkość reagują (' + JSON.stringify(st) + ')');
    if (fac === 'vikings') {
      await page.click('#btnVoyages'); await page.click('#btnGuard');
      ok(await page.evaluate(() => World.state().voyageMode === 'mixed' && World.state().settings.voyageGuard === false), 'Wikingowie: tryb wypraw i zapas załogi');
    } else ok(await page.locator('#btnVoyages').isHidden() && await page.locator('#btnGuard').isHidden(), 'przyciski wypraw ukryte poza Wikingami');
    if (fac === 'saracens') { await page.click('#btnRaids'); ok(await page.evaluate(() => World.state().settings.raids === false), 'Saraceni: przełącznik napadów'); }
    else ok(await page.locator('#btnRaids').isHidden(), 'przycisk napadów ukryty poza Saracenami');
    await page.click('#btnCrisis');
    ok(await page.evaluate(() => World.state().crisis !== null), 'kryzysy wg harmonogramu włączone');
    // 6) doradca
    await page.click('#btnAdvisor');
    ok((await page.locator('#advisor').innerText()).includes('Ostrzeżenia'), 'panel Doradcy się otwiera');
    await page.click('#advClose');
    ok(await page.locator('#advisor').isHidden(), 'panel Doradcy się zamyka');
    // 7) kilka sekund żywej pętli gry bez błędów
    await page.evaluate(() => { World.state().speed = 4; });
    await page.waitForTimeout(2500);
    ok(await page.evaluate(() => World.state().time) > 0.5, 'pętla gry biegnie (czas ' + (await page.evaluate(() => World.state().time)).toFixed(1) + ' min)');
    ok(errors.length === 0, 'brak błędów JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await page.close();
  }
  await browser.close();
  console.log(fails ? '\nNIEPOWODZENIA: ' + fails : '\nWszystkie testy UI przeszły');
  process.exit(fails ? 1 : 0);
})();
