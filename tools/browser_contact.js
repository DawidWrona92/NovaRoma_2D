// Kontaktówka: wszystkie sprite'y budynków nacji obok siebie (z obrysem w polach i podpisem).
// Użycie: node tools/browser_contact.js nacja [id,id…] [skala px/px (domyślnie 0.3)] [kolumny]   (CLASSIC=1 — dawne procedury Gfx.ART)
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const SHOTS = process.env.SHOTS || '/tmp';
const file = 'file://' + path.resolve('Nova_Roma.html');
const fac = process.argv[2] || 'slavs';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const K = +(process.argv[4] || 0.3), COLS = +(process.argv[5] || 5), classic = process.env.CLASSIC === '1';

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(file + '?menu=0');
  const n = await page.evaluate(async ({ fac, only, K, COLS, classic }) => {
    document.getElementById('factionPick').style.display = 'none';
    const f = Data.FACTIONS[fac], p = f.palette;
    let ids = Object.keys(Data.BUILDINGS).filter(id => (!Data.BUILDINGS[id].factions || Data.BUILDINGS[id].factions.includes(fac)));
    if (only) ids = only;
    if (!classic) { Sprites.setQuality(1); await Sprites.bake(fac, null, { deposits: [] }); }
    const cw = 250, ch = 230, rows = Math.ceil(ids.length / COLS);
    const cv = document.createElement('canvas'); cv.width = cw * COLS; cv.height = ch * rows;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:999';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'low';
    ctx.fillStyle = p.terrain === 'sand' ? '#cbb684' : p.terrain === 'tundra' ? '#63724a' : '#4f7c3a';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ids.forEach((id, i) => {
      const x = (i % COLS) * cw, y = Math.floor(i / COLS) * ch, ax = x + cw / 2, ay = y + ch - 70;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      const def = Data.BUILDINGS[id], [fw, fh] = Data.footprint(id, fac), spr = classic ? null : Sprites.get(fac, id);
      let cap = Data.nameOf(id, fac) + ' (' + id + ')';
      if (spr) {
        const hx = Sprites.AX * K, hy = Sprites.AY * K; // połowa przekątnych pola
        const c = [[fw / 2, fh / 2], [fw / 2, -fh / 2], [-fw / 2, -fh / 2], [-fw / 2, fh / 2]].map(([a, b]) => [ax + (a - b) * hx, ay + (a + b) * hy]);
        for (const l of ['p', 'u']) Sprites.draw(ctx, spr, l, ax, ay, K, 1);
        ctx.beginPath(); c.forEach(([a, b], j) => j ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
        ctx.fillStyle = 'rgba(255,214,70,0.13)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,214,70,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
        Sprites.draw(ctx, spr, 'c', ax, ay, K, 1);
        cap += ' · ' + fw + '×' + fh;
      } else { const art = Gfx.ART[def.art]; if (art) art(ctx, ax, ay, K * 7, p, 1.3); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
      ctx.fillText(cap, x + cw / 2, y + ch - 12);
      ctx.shadowBlur = 0;
    });
    return ids.length;
  }, { fac, only, K, COLS, classic });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, `contact_${fac}.png`), clip: { x: 0, y: 0, width: Math.min(1400, 250 * COLS), height: Math.min(1000, 230 * Math.ceil(n / COLS)) } });
  console.log(fac, n, 'sprite\'ów', errors.length ? errors : 'bez błędów');
  await browser.close();
})();
