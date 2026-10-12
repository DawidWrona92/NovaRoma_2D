// Test terenu v2 w przeglądarce: każda kombinacja klimat × typ mapy startuje przez ?play=…&climate=…&map=…&seed=… (ta sama ścieżka co menu Piaskownicy),
// czeka na wypiek sprite'ów i podłoża (chunki), sprawdza brak błędów JS, niepusty obraz, liczbę chunków i pamięć, mierzy FPS i składa arkusz kontaktowy.
// Użycie: node tools/browser_terrain.js [nacja] [--fps] [--sheet=plik.png] [--shots=katalog]
//   nacja — domyślnie franks (Wikingowie zawsze dostają mapę nadmorską); --fps — pomiar klatek na kombinację; --sheet — arkusz 4 klimaty × 6 typów
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const args = process.argv.slice(2), flag = n => args.find(a => a.startsWith('--' + n + '='))?.split('=')[1];
const fid = args.find(a => !a.startsWith('--')) || 'franks', FPS = args.includes('--fps'), SHEET = flag('sheet'), SHOTS = flag('shots');
const file = 'file://' + path.resolve('Nova_Roma.html');
const CLIMATES = ['temperate', 'eastern', 'snow', 'desert'], TYPES = ['coast', 'plain', 'river', 'lakes', 'mountains', 'wetlands'];
const combos = []; for (const ty of TYPES) for (const cl of CLIMATES) if (fid !== 'vikings' || ty === 'coast') combos.push([cl, ty]);
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✔ ' : '  ✘ ') + msg); if (!c) fails++; };
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

async function one(browser, cl, ty) {
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${file}?play=${fid}&climate=${cl}&map=${ty}&seed=7&q=1`);
  await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 120000 });
  await page.evaluate(() => {
    World.state().speed = 0; for (const id of ['resPanel', 'hint']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    Camera.zoom = Camera.clampZoom(0.01);                                                                    // cała mapa
    const c = Camera.worldToScreen(24, 24); Camera.x -= c.x - innerWidth / 2; Camera.y -= c.y - (innerHeight / 2 - 20);
  });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const m = World.state().map.meta, g = Game.groundInfo(), cv = document.getElementById('c') || document.querySelector('canvas');
    const t = document.createElement('canvas'); t.width = 40; t.height = 24; const x = t.getContext('2d'); x.drawImage(cv, 0, 0, t.width, t.height);
    const d = x.getImageData(0, 0, t.width, t.height).data; let lit = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) lit++;
    return { meta: m.climate + '/' + m.type + '/' + m.seed + (m.valid ? '' : ' NIEPOPRAWNA'), valid: m.valid, g, lit: lit / (t.width * t.height), sprites: Sprites.baked() };
  });
  let fps = null;
  if (FPS) {
    await page.evaluate(() => { const c = Camera.worldToScreen(24, 24); Camera.zoom = Camera.defaultZoom(); const d = Camera.worldToScreen(24, 24); Camera.x -= d.x - innerWidth / 2; Camera.y -= d.y - innerHeight / 2; });
    await page.waitForTimeout(800);
    fps = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
    await page.evaluate(() => { Camera.zoom = Camera.clampZoom(0.01); const c = Camera.worldToScreen(24, 24); Camera.x -= c.x - innerWidth / 2; Camera.y -= c.y - (innerHeight / 2 - 20); });
    await page.waitForTimeout(500);
  }
  const png = await page.screenshot({ clip: { x: 0, y: 60, width: 1000, height: 540 } });
  if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${fid}_${cl}_${ty}.png`), png);
  await page.context().close();
  return { cl, ty, info, errors, fps, png };
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const results = [], queue = combos.slice();
  await Promise.all([0, 1, 2].map(async () => { while (queue.length) { const [cl, ty] = queue.shift(); results.push(await one(browser, cl, ty)); } }));
  results.sort((a, b) => combos.findIndex(c => c[0] === a.cl && c[1] === a.ty) - combos.findIndex(c => c[0] === b.cl && c[1] === b.ty));
  console.log(`${fid}: ${results.length} kombinacji klimat × typ`);
  for (const r of results) {
    const g = r.info.g;
    ok(r.errors.length === 0 && r.info.valid && r.info.sprites === fid && g && g.baked >= 20 && r.info.lit > 0.25,
      `${r.cl.padEnd(9)} ${r.ty.padEnd(9)} ${r.info.meta}` + (g ? ` · chunków ${g.baked} · ${g.mpx} Mpx` : ' · BRAK PODŁOŻA') + (r.fps ? ` · ${r.fps.toFixed(1)} FPS` : '') + ` · jasność ${r.info.lit.toFixed(2)}` + (r.errors.length ? ' · BŁĘDY: ' + r.errors.slice(0, 2).join(' | ') : ''));
  }
  if (SHEET) {                                                                                                 // arkusz: kolumny = klimaty, wiersze = typy map
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
    const sheet = await page.evaluate(async ({ shots, cols, rows, labels }) => {
      const W = 400, H = 216, cv = document.createElement('canvas'); cv.width = cols * W; cv.height = rows * H + 24; const g = cv.getContext('2d'); g.fillStyle = '#10140f'; g.fillRect(0, 0, cv.width, cv.height);
      for (const s of shots) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + s.b64; }); g.drawImage(im, s.col * W, 24 + s.row * H, W, H); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(s.col * W + 4, 28 + s.row * H, 150, 18); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(s.label, s.col * W + 8, 41 + s.row * H); }
      return cv.toDataURL('image/png').split(',')[1];
    }, { shots: results.map(r => ({ b64: r.png.toString('base64'), col: CLIMATES.indexOf(r.cl), row: fid === 'vikings' ? 0 : TYPES.indexOf(r.ty), label: r.cl + ' · ' + r.ty })), cols: CLIMATES.length, rows: fid === 'vikings' ? 1 : TYPES.length });
    fs.writeFileSync(SHEET, Buffer.from(sheet, 'base64')); console.log('arkusz kontaktowy:', SHEET);
  }
  await browser.close();
  console.log(fails ? `\n${fails} testów nie przeszło` : '\nWszystko OK');
  process.exit(fails ? 1 : 0);
})();
