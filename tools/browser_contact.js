// Kontaktówka: rysuje wszystkie sprite'y budynków nacji obok siebie (z podpisami) w powiększeniu.
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const SHOTS = process.env.SHOTS || '/tmp';
const file = 'file://' + path.resolve('Nova_Roma.html');
const fac = process.argv[2] || 'slavs';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const Z = +(process.argv[4] || 2.2), COLS = +(process.argv[5] || 5);

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(file);
  const n = await page.evaluate(({ fac, only, Z, COLS }) => {
    document.getElementById('factionPick').style.display = 'none';
    const f = Data.FACTIONS[fac], p = f.palette;
    let ids = Object.keys(Data.BUILDINGS).filter(id => (!Data.BUILDINGS[id].factions || Data.BUILDINGS[id].factions.includes(fac)));
    if (only) ids = only;
    const cw = 250, ch = 190, rows = Math.ceil(ids.length / COLS);
    const cv = document.createElement('canvas'); cv.width = cw * COLS; cv.height = ch * rows;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:999';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = p.terrain === 'sand' ? '#cbb684' : p.terrain === 'tundra' ? '#63724a' : '#4f7c3a';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ids.forEach((id, i) => {
      const x = (i % COLS) * cw, y = Math.floor(i / COLS) * ch;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      const def = Data.BUILDINGS[id];
      const art = Gfx.ART[def.art];
      if (art) art(ctx, x + cw / 2, y + ch - 40, Z, p, 1.3);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
      ctx.fillText(Data.nameOf(id, fac) + ' (' + id + ')', x + cw / 2, y + ch - 12);
      ctx.shadowBlur = 0;
    });
    return ids.length;
  }, { fac, only, Z, COLS });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, `contact_${fac}.png`), clip: { x: 0, y: 0, width: Math.min(1400, 250 * COLS), height: Math.min(1000, 190 * Math.ceil(n / COLS)) } });
  console.log(fac, n, 'sprite\'ów', errors.length ? errors : 'bez błędów');
  await browser.close();
})();
