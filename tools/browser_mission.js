// Misja w przeglądarce (Punkt 11): ekran celu z wyborem trudności, komunikaty po terminach, przycisk celu, ekran podsumowania (porażka/zwycięstwo), swobodna gra.
// Użycie: node tools/browser_mission.js [plik.html]   (zrzuty: SHOTS=katalog)
const pw = require('/opt/node22/lib/node_modules/playwright'); const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2] || 'Nova_Roma.html'); let fails = 0, checks = 0; const ok = (c, m) => { checks++; console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; return c; };
  const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const errs = [];
  const open = async (q, vp) => { const pg = await b.newPage({ viewport: vp || { width: 1100, height: 760 } }); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); }); await pg.goto('file://' + file + '?' + q); await pg.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 }); await pg.waitForTimeout(400); return pg; };
  const shot = async (pg, n) => { if (process.env.SHOTS) await pg.screenshot({ path: path.join(process.env.SHOTS, n + '.png') }); };
  const box = pg => pg.evaluate(() => { const e = document.getElementById('missionBox'); return { shown: getComputedStyle(e).display !== 'none', text: e.textContent, buttons: [...e.querySelectorAll('button')].map(x => x.textContent) }; });
  // 1. start z menu (mission=ask): ekran celu
  let pg = await open('play=franks&climate=temperate&map=plain&seed=11&mission=ask');
  let r = await box(pg); ok(r.shown && /Cel gry/.test(r.text) && r.buttons.length === 5, `ekran celu pokazany, ${r.buttons.length} przycisków: ${r.buttons.join(' | ')}`);
  ok(/żołnierzy/.test(r.text) && /Wygrywasz/.test(r.text) && /przegrywasz/.test(r.text), 'opis celu: co jest wymagane, jak się wygrywa i przegrywa');
  ok(await pg.evaluate(() => World.state().speed === 0), 'gra czeka (pauza) na wybór celu'); await shot(pg, 'mission_briefing');
  await pg.getByRole('button', { name: /Normalny/ }).click(); await pg.waitForTimeout(300);
  r = await box(pg); const st = await pg.evaluate(() => ({ mission: World.state().mission && World.state().mission.status, goal: World.state().mission && World.state().mission.goal, preset: World.state().tribute && World.state().tribute.preset, speed: World.state().speed, goalBtn: document.getElementById('btnGoal').textContent, ann: document.getElementById('announce').textContent, sel: document.getElementById('btnTribute').value }));
  ok(!r.shown && st.mission === 'active' && st.goal === 8 && st.preset === 'normal' && st.speed >= 1, `Normalny: misja aktywna, cel 8, haracz „${st.preset}”, gra wznowiona`);
  ok(/Terminy 0\/8/.test(st.goalBtn) && st.sel === 'normal' && /Misja rozpoczęta/.test(st.ann), `przycisk celu „${st.goalBtn}”, lista haraczu zsynchronizowana, komunikat startu`);
  await pg.click('#btnGoal'); await pg.waitForTimeout(200); r = await box(pg); ok(r.shown && /Cel misji/.test(r.text) && /Najbliższy termin/.test(r.text), 'przycisk celu otwiera okno celu z postępem'); await shot(pg, 'mission_goal'); await pg.getByRole('button', { name: /Do gry/ }).click();
  // 2. porażka: trzy terminy bez dostaw → podsumowanie
  await pg.evaluate(() => { const s = World.state(); s.res.złoto = 0; for (let t = 0; t < 200 && s.mission.status === 'active'; t += 0.5) World.tick(0.5); });
  await pg.waitForTimeout(300); r = await box(pg); const ann = await pg.evaluate(() => document.getElementById('announce').textContent);
  ok(r.shown && /Porażka/.test(r.text) && /Czas gry/.test(r.text) && /Terminy haraczu/.test(r.text), 'ekran podsumowania po porażce ze statystykami'); ok(r.buttons.length === 3 && /Spróbuj ponownie/.test(r.buttons[0]), 'przyciski: ' + r.buttons.join(' | ')); await shot(pg, 'mission_summary');
  ok(/Porażka|niespełniony/.test(ann), 'komunikat po terminie widoczny: ' + ann.slice(0, 60));
  await pg.getByRole('button', { name: /Buduj dalej swobodnie/ }).click(); await pg.waitForTimeout(250);
  const st2 = await pg.evaluate(() => ({ shown: getComputedStyle(document.getElementById('missionBox')).display !== 'none', status: World.state().mission.status, tribute: World.state().tribute, goalBtn: document.getElementById('btnGoal').textContent, speed: World.state().speed }));
  ok(!st2.shown && st2.status === 'free' && st2.tribute === null && /Swobodna/.test(st2.goalBtn) && st2.speed >= 1, `„Buduj dalej swobodnie”: haracz wyłączony, gra płynie (${st2.goalBtn})`); await pg.close();
  // 3. swobodna gra od razu i brak misji w trybie testowym
  pg = await open('play=franks&climate=temperate&map=plain&seed=11&mission=free'); r = await box(pg); ok(!r.shown && /Swobodna/.test(await pg.textContent('#btnGoal')), 'mission=free: bez okna, przycisk „Swobodna gra”'); await pg.close();
  pg = await open('play=franks&climate=temperate&map=plain&seed=11'); r = await box(pg); ok(!r.shown && await pg.evaluate(() => World.state().mission === null && getComputedStyle(document.getElementById('btnGoal')).display === 'none'), 'bez parametru mission (testy): brak okna, brak przycisku'); await pg.close();
  // 4. telefon: okno mieści się w ekranie
  pg = await open('play=franks&climate=temperate&map=plain&seed=11&mission=ask', { width: 390, height: 780 }); r = await pg.evaluate(() => { const bx = document.querySelector('#missionBox .mbBox').getBoundingClientRect(); return { l: bx.left, r: bx.right, t: bx.top, b: bx.bottom, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth }; });
  ok(r.l >= 0 && r.r <= r.w && r.sw <= r.w, `telefon: okno celu mieści się w ekranie (${Math.round(r.l)}–${Math.round(r.r)} z ${r.w})`); await shot(pg, 'mission_phone'); await pg.close();
  ok(!errs.length, 'brak błędów JS' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`); await b.close(); process.exit(fails ? 1 : 0);
})();
