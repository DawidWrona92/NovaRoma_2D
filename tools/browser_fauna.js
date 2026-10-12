// Test fauny w przeglądarce (Faza 8): 4 klimaty × nacje startują przez ?play=…, zwierzęta są zaludnione i rysowane, Chata myśliwego wysyła myśliwego z łukiem
// (celowanie → strzała w locie → upolowanie), brak błędów JS, FPS z fauną ≥ 85% FPS bez niej (?fauna=0); zrzuty do oględzin.
// Użycie: node tools/browser_fauna.js [--shots=katalog] [--fps]
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const args = process.argv.slice(2), flag = n => args.find(a => a.startsWith('--' + n + '='))?.split('=')[1], SHOTS = flag('shots'), FPS = args.includes('--fps');
const file = 'file://' + path.resolve('Nova_Roma.html');
const COMBOS = [['franks', 'temperate', 'plain'], ['slavs', 'eastern', 'plain'], ['vikings', 'snow', 'coast'], ['saracens', 'desert', 'plain']];
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✔ ' : '  ✘ ') + msg); if (!c) fails++; };
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

async function start(browser, fid, cl, ty, extra = '') {
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${file}?play=${fid}&climate=${cl}&map=${ty}&seed=7&q=1${extra}`);
  await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 });
  return { page, errors };
}
const fps = page => page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const [fid, cl, ty] of COMBOS) {
    console.log(`${fid} · ${cl} · ${ty}`);
    const { page, errors } = await start(browser, fid, cl, ty);
    const info = await page.evaluate(() => {
      const s = World.state(), st = Fauna.stats(s); s.res.deski = 999; s.res.złoto = 999;
      for (let i = 0; i < 3; i++) TestBots.tryBuild(s, 'hunter');
      const hb = s.sites.filter(x => x.id === 'hunter').concat(s.buildings.filter(b => b.id === 'hunter')), kc = World.centerOf(s.keep);
      const den = s.fauna.dens.slice().sort((a, b) => Math.hypot(a.x - kc.x, a.y - kc.y) - Math.hypot(b.x - kc.x, b.y - kc.y))[0], c = den || kc;   // kadr na najbliższe legowisko
      Camera.zoom = Camera.defaultZoom() * 1.4; const p = Camera.worldToScreen(c.x, c.y); Camera.x -= p.x - innerWidth / 2; Camera.y -= p.y - innerHeight / 2;
      const onScreen = s.animals.filter(a => { const q = Camera.worldToScreen(a.x, a.y); return q.x > 0 && q.x < innerWidth && q.y > 0 && q.y < innerHeight; }).length;
      return { st, onScreen, hunters: hb.length, kinds: Object.keys(st.by).length, setOk: Sprites.faunaKinds(s.map.meta.climate).every(k => !!Sprites.fauna(k)) };
    });
    ok(info.st.total > 40 && info.setOk, `zwierzęta zaludnione (${info.st.total}), sprite'y fauny wypieczone dla klimatu`);
    ok(info.hunters >= 1, `postawiono ${info.hunters} Chat(y) myśliwego`);
    // przyspiesz, aż pojawi się myśliwy w fazie celowania; wtedy zwolnij, by złapać strzałę w locie
    await page.evaluate(() => { World.state().speed = 4; });
    const seen = new Set(); let aimShot = false, arrowShot = false, t0 = Date.now();
    while (Date.now() - t0 < 100000 && !(arrowShot && seen.has('back'))) {
      const r = await page.evaluate(() => { const s = World.state(), hs = Fauna.hunters(s); return { modes: hs.map(h => h.mode), arrow: hs.some(h => h.arrow), kills: s.fauna.kills, speed: s.speed }; });
      for (const m of r.modes) seen.add(m);
      if (!aimShot && r.modes.includes('aim')) { aimShot = true; await page.evaluate(() => { const s = World.state(); s.speed = 0.04; const h = Fauna.hunters(s).find(x => x.mode === 'aim') || Fauna.hunters(s)[0], p = Camera.worldToScreen((h.x + h.aimx) / 2, (h.y + h.aimy) / 2); Camera.zoom = Camera.defaultZoom() * 2.2; const q = Camera.worldToScreen((h.x + h.aimx) / 2, (h.y + h.aimy) / 2); Camera.x -= q.x - innerWidth / 2; Camera.y -= q.y - innerHeight / 2; void p; }); }
      if (aimShot && !arrowShot && r.arrow) { arrowShot = true; await page.evaluate(() => { World.state().speed = 0; }); await page.waitForTimeout(150); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${fid}_${cl}_strzala.png`) }); await page.evaluate(() => { World.state().speed = 4; }); }
      await page.waitForTimeout(40);
    }
    ok(['go', 'aim', 'approach', 'pick', 'back'].every(m => seen.has(m)), `myśliwy przechodzi przez fazy wyprawy (widziano: ${[...seen].join(', ')})`);
    ok(arrowShot, 'strzała leci (złapana w locie)');
    await page.evaluate(() => { World.state().speed = 1; });
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => { const s = World.state(); return { kills: s.fauna.kills, left: Fauna.stats(s).prey }; });
    ok(after.kills >= 1, `upolowano ${after.kills} zwierząt, w łowisku zostało ${after.left} pkt`);
    ok(info.onScreen >= 2, `w kadrze legowiska widać ${info.onScreen} zwierząt`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${fid}_${cl}_lowy.png`) });
    if (FPS) {                                                    // ten sam kadr i stan: FPS z narysowaną i tykającą fauną vs po jej wyłączeniu w locie (settings.fauna = false), dwa razy na przemian
      await page.evaluate(() => { const s = World.state(); s.speed = 1; const den = s.fauna.dens[0]; Camera.zoom = Camera.defaultZoom() * 1.4; const q = Camera.worldToScreen(den.x, den.y); Camera.x -= q.x - innerWidth / 2; Camera.y -= q.y - innerHeight / 2; });
      const on = [], off = [];
      for (let i = 0; i < 2; i++) { await page.evaluate(() => { World.state().settings.fauna = true; }); on.push(await fps(page)); await page.evaluate(() => { World.state().settings.fauna = false; }); off.push(await fps(page)); }
      const a = on.reduce((x, y) => x + y) / on.length, b = off.reduce((x, y) => x + y) / off.length;
      ok(a >= b * 0.85, `FPS z fauną ${a.toFixed(1)} ≥ 85% FPS bez fauny ${b.toFixed(1)}`);
    }
    await page.close();
    ok(errors.length === 0, 'brak błędów JS' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
  }
  await browser.close();
  console.log(fails ? `\n${fails} testów nie przeszło` : '\nWszystko OK');
  process.exit(fails ? 1 : 0);
})();
