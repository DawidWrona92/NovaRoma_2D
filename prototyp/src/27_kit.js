/* ====================== ZESTAW CZĘŚCI I REKWIZYTÓW (metody Build) ======================
   Każda część to węzeł z bryłą AABB, więc kolejność rysowania i cienie ustala Build.flush(). Rozmiary w polach. */
const KIT = {};
/* drzewa i skały wypiekane raz i rysowane w sprite'ach budynków (sady, kamieniołomy, kopalnie) */
function treeSpr(kind, seed) {
  const key = kind + seed; if (KIT[key]) return KIT[key];
  let s;
  if (kind === 'apple') {                                              // mała jabłoń: korona dębu ×0.6 z czerwonymi owocami
    s = TREES.oak(seed, 0.6); const g = s.c.getContext('2d'), r = rng(seed * 7 + 3); g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()), x = 105 + Math.cos(a) * d * 50, y = 98 + Math.sin(a) * d * 32; g.fillStyle = '#c4302a'; g.beginPath(); g.arc(x, y, 3.4, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,222,200,0.65)'; g.beginPath(); g.arc(x - 1, y - 1.1, 1.1, 0, TAU); g.fill(); }
    g.restore();
  } else if (kind === 'olive') {                                       // oliwka / drzewko owocowe Saracenów: jaśniejsza, szarawa korona
    s = TREES.oak(seed, 0.6); const g = s.c.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(190,200,150,0.30)'; g.fillRect(0, 0, 400, 400); g.restore();
  } else s = TREES[kind](seed, 0.8);
  return (KIT[key] = s);
}
function rockSpr(seed, col) { const key = 'rock' + seed + col; return KIT[key] || (KIT[key] = bakeRock(seed, col, 0.8)); }
function blitSpr(sc, spr, x, y, k = 1, z = 0) {
  const [px, py] = sc.P(x, y, z);
  if (spr.u) sc.gu.drawImage(spr.u, px - spr.ax * k, py - spr.ay * k, spr.w * k, spr.h * k);
  sc.g.drawImage(spr.c, px - spr.ax * k, py - spr.ay * k, spr.w * k, spr.h * k);
}
/* kopiec sypkiego materiału (ruda, węgiel, glina, ziarno…): 2D z gradientem i ziarnistością */
function drawHeap(sc, x, y, r, h, cols, z = 0) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z), R = r * AX * f * 1.4142, H = h * VH * f, rr = rng(Math.round(x * 131 + y * 73 + r * 17) + 5);
  g.save(); g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.8, py - H * 1.15, px, py - H); g.quadraticCurveTo(px + R * 0.8, py - H * 1.15, px + R, py); g.ellipse(px, py, R, R / 2, 0, 0, Math.PI); g.closePath(); g.clip();
  const gr = g.createLinearGradient(px - R, 0, px + R, 0); gr.addColorStop(0, cols[0]); gr.addColorStop(0.5, cols[1]); gr.addColorStop(1, cols[2]);
  g.fillStyle = gr; g.fillRect(px - R, py - H * 1.2, R * 2, H * 1.2 + R);
  for (let i = 0; i < 150; i++) { g.fillStyle = rr() < 0.5 ? 'rgba(255,240,210,0.22)' : 'rgba(10,6,2,0.28)'; g.fillRect(px - R + rr() * R * 2, py - rr() * H * 1.05, (1 + rr() * 1.6) * f, (0.9 + rr() * 1.2) * f); }
  g.restore(); g.strokeStyle = 'rgba(20,12,6,0.55)'; g.lineWidth = 1.1 * f; g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.8, py - H * 1.15, px, py - H); g.quadraticCurveTo(px + R * 0.8, py - H * 1.15, px + R, py); g.ellipse(px, py, R, R / 2, 0, 0, Math.PI); g.stroke();
}
const HEAP = { ore: ['#b4743e', '#7e4a28', '#4a2a18'], coal: ['#585860', '#2c2c32', '#101012'], clay: ['#d8a468', '#b4803e', '#6a4622'], grain: ['#f2d476', '#d2aa44', '#8a6a24'], stone: ['#b8b4a8', '#8e8a80', '#58554c'], sand: ['#ecd8a4', '#d0b676', '#8c7440'], earth: ['#7a5a34', '#52391f', '#2a1c0e'], peat: ['#5a4228', '#3a2a18', '#1c130a'], slag: ['#6a6460', '#3e3a38', '#1c1a1a'] };

Object.assign(Build.prototype, {
  tree(kind, seed, x, y, k = 1) { const spr = treeSpr(kind, seed), r = 0.24 * k; return this.part(x - r, y - r, 0, x + r, y + r, 1.0 * k, () => blitSpr(this.sc, spr, x, y, k), { tag: 'drzewo', shadow: false }); },
  rock(seed, x, y, k = 1, col = '#8e8c84') { const spr = rockSpr(seed, col), r = 0.3 * k; return this.part(x - r, y - r, 0, x + r, y + r, 0.4 * k, () => blitSpr(this.sc, spr, x, y, k), { tag: 'skała', shadow: false }); },
  heap(x, y, r, h, kind = 'ore', z = 0) { return this.part(x - r, y - r, z, x + r, y + r, z + h, () => drawHeap(this.sc, x, y, r, h, typeof kind === 'string' ? HEAP[kind] : kind, z), { tag: 'kopiec', shadow: false }); },
  /* stos ciosanych bloków kamienia: nx×ny bloków w poziomach (lv), każdy 0.22×0.16×0.14 */
  blocks(x, y, nx, ny, lv, pal = '#cfcabb') {
    return this.part(x, y, 0, x + nx * 0.24, y + ny * 0.18, lv * 0.14, () => { const sc = this.sc; for (let l = 0; l < lv; l++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) sc.box(x + i * 0.24 + 0.01, y + j * 0.18 + 0.01, l * 0.14, x + i * 0.24 + 0.23, y + j * 0.18 + 0.17, l * 0.14 + 0.13, 'stone', { pal, ao: 0.2, wear: 0.3 }); }, { tag: 'bloki', shadow: true });
  },
  /* stos desek: prostopadłościan z poziomym podziałem na deski */
  planks(x0, y0, x1, y1, h, pal = '#c8a870') {
    return this.box(x0, y0, 0.02, x1, y1, h, 'plank', { pal, ao: 0.2, wear: 0.4, tag: 'deski', shadow: false }, (S, E) => { for (const W of [S, E]) this.sc.local(W.O, W.U, W.V, (g, lu, lv) => { g.strokeStyle = 'rgba(46,30,12,0.55)'; g.lineWidth = 0.012; const n = Math.max(2, Math.round(lv / 0.05)); for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(0, lv * i / n); g.lineTo(lu, lv * i / n); g.stroke(); } }); });
  },
  /* niski płot: 'wattle' (plecionka) albo 'rail' (słupki i dwie poprzeczki) wzdłuż x lub y */
  fence(x0, y0, x1, y1, o = {}) {
    const h = o.h ?? 0.32, th = o.th ?? 0.05, kind = o.kind || 'wattle';
    if (kind === 'wattle') return this.box(Math.min(x0, x1) - th / 2, Math.min(y0, y1) - th / 2, 0, Math.max(x0, x1) + th / 2, Math.max(y0, y1) + th / 2, h, { east: 'wattle', south: 'wattle', top: 'plank' }, { ao: 0.25, pal: o.pal || '#8a6a3c', wear: 0.5, tag: 'płot', shadow: false });
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.4)), alongX = Math.abs(x1 - x0) >= Math.abs(y1 - y0), skipA = !!o.skipStart, skipB = !!o.skipEnd;
    return this.part(Math.min(x0, x1) - 0.04, Math.min(y0, y1) - 0.04, 0, Math.max(x0, x1) + 0.04, Math.max(y0, y1) + 0.04, h, () => {
      const sc = this.sc, pts = []; for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
      for (const zr of [h * 0.38, h * 0.78]) sc.box(Math.min(x0, x1) - (alongX ? 0 : 0.015), Math.min(y0, y1) - (alongX ? 0.015 : 0), zr, Math.max(x0, x1) + (alongX ? 0 : 0.015), Math.max(y0, y1) + (alongX ? 0.015 : 0), zr + 0.035, 'plank', { pal: o.pal || '#7a5a36', ao: 0.1, wear: 0.4 });
      pts.forEach(([x, y], i) => { if ((i === 0 && skipA) || (i === n && skipB)) return; sc.box(x - 0.03, y - 0.03, 0, x + 0.03, y + 0.03, h, 'bark', { pal: o.pal || '#6a4a2c', ao: 0.1, wear: 0.4 }); });
    }, { tag: 'płot', shadow: false });
  },
  /* ogrodzenie prostokątne z bramą: o.gap = { S: [xa, xb], N: [...], W: [ya, yb], E: [...] } — przerwy w płocie (zakresy współrzędnej wzdłuż boku) */
  fenceRect(x0, y0, x1, y1, o = {}) {
    const gap = o.gap || {}, seg = (xa, ya, xb, yb, g, alongX, extra) => { const a = alongX ? xa : ya, b = alongX ? xb : yb; if (!g) this.fence(xa, ya, xb, yb, { ...o, ...extra }); else { if (g[0] - a > 0.1) this.fence(xa, ya, alongX ? g[0] : xb, alongX ? yb : g[0], { ...o, ...extra, skipEnd: false }); if (b - g[1] > 0.1) this.fence(alongX ? g[1] : xa, alongX ? ya : g[1], xb, yb, { ...o, ...extra, skipStart: false }); } };
    seg(x0, y0, x1, y0, gap.N, true, {}); seg(x1, y0, x1, y1, gap.E, false, { skipStart: true }); seg(x0, y1, x1, y1, gap.S, true, { skipStart: true }); seg(x0, y0, x0, y1, gap.W, false, { skipStart: true, skipEnd: true });
  },
  /* pień do rąbania z siekierą */
  stump(x, y) {
    return this.part(x - 0.11, y - 0.11, 0, x + 0.11, y + 0.11, 0.3, () => {
      const sc = this.sc, g = sc.g, f = sc.F; sc.cyl(x, y, 0, 0.18, 0.1, { mat: 'bark', pal: '#7a5632', topMat: 'plank', topPal: '#c4a06a', ao: 0.3 });
      const [px, py] = sc.P(x, y, 0.18); g.strokeStyle = '#4a3220'; g.lineWidth = 2.4 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px + 3 * f, py - 1 * f); g.lineTo(px + 11 * f, py - 18 * f); g.stroke();
      g.fillStyle = '#b8bec6'; g.strokeStyle = 'rgba(14,12,10,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(px + 9 * f, py - 19 * f); g.lineTo(px + 17 * f, py - 14 * f); g.lineTo(px + 11 * f, py - 11 * f); g.closePath(); g.fill(); g.stroke();
    }, { tag: 'pień', shadow: false });
  },
  anvil(x, y) {
    return this.part(x - 0.14, y - 0.12, 0, x + 0.14, y + 0.12, 0.42, () => { const sc = this.sc; sc.cyl(x, y, 0, 0.26, 0.11, { mat: 'log', pal: '#7a5632', topMat: 'plank', ao: 0.3 }); sc.box(x - 0.12, y - 0.07, 0.26, x + 0.12, y + 0.07, 0.33, 'stone', { pal: '#3a3a40', ao: 0, wear: 0 }); sc.box(x - 0.07, y - 0.05, 0.33, x + 0.07, y + 0.05, 0.4, 'stone', { pal: '#47474e', ao: 0, wear: 0 }); }, { tag: 'kowadło', shadow: false });
  },
  bucket(x, y) { return this.part(x - 0.07, y - 0.07, 0, x + 0.07, y + 0.07, 0.2, () => { const sc = this.sc, g = sc.g, f = sc.F; sc.cyl(x, y, 0, 0.14, 0.06, { mat: 'plank', pal: '#8a6a3c', topMat: 'plank', ao: 0.1 }); const [px, py] = sc.P(x, y, 0.14); g.strokeStyle = '#2a2018'; g.lineWidth = 1.2 * f; g.beginPath(); g.arc(px, py - 1 * f, 6.5 * f, Math.PI, 0); g.stroke(); }, { tag: 'wiadro', shadow: false }); },
  /* bańka na mleko */
  churn(x, y) { return this.part(x - 0.08, y - 0.08, 0, x + 0.08, y + 0.08, 0.34, () => { const sc = this.sc; sc.cyl(x, y, 0, 0.27, 0.065, { color: [176, 182, 190], ao: 0.1 }); sc.cyl(x, y, 0.27, 0.31, 0.075, { color: [150, 156, 164], ao: 0 }); }, { tag: 'bańka', shadow: false }); },
  /* koło sera / chleba itp. na ziemi lub półce: mały walec */
  disc(x, y, z, r, h, col) { return this.part(x - r, y - r, z, x + r, y + r, z + h, () => this.sc.cyl(x, y, z, z + h, r, { color: col, ao: 0.1 }), { tag: 'krążek', shadow: false }); }
});

/* ---------- drobne części 2D wpasowane w bryły ---------- */
Object.assign(Build.prototype, {
  /* sadzonka: cienki pień i kilka listków */
  sapling(x, y, k = 1) {
    return this.part(x - 0.06, y - 0.06, 0, x + 0.06, y + 0.06, 0.26 * k, () => {
      const g = this.sc.g, f = this.sc.F * k, [px, py] = this.sc.P(x, y, 0), r = rng(Math.round(x * 97 + y * 53) + 3);
      g.fillStyle = 'rgba(40,24,8,0.35)'; g.beginPath(); g.ellipse(px + 2 * f, py, 6 * f, 2.4 * f, 0, 0, TAU); g.fill();
      g.strokeStyle = '#4a3220'; g.lineWidth = 2 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 0.5 * f, py - 12 * f); g.stroke();
      for (const [dx, dy, rr] of [[-4, -13, 4.6], [4, -14, 4.4], [0, -19, 5], [-1, -10, 3.6], [3, -10, 3.4]]) { const gr = g.createRadialGradient(px + (dx - 1) * f, py + (dy - 1.4) * f, 0.5, px + dx * f, py + dy * f, rr * f); gr.addColorStop(0, '#9bd25a'); gr.addColorStop(1, '#3f7d2b'); g.fillStyle = gr; g.strokeStyle = 'rgba(14,40,14,0.6)'; g.lineWidth = 0.9 * f; g.beginPath(); g.arc(px + dx * f, py + dy * f, rr * f, 0, TAU); g.fill(); g.stroke(); }
    }, { tag: 'sadzonka', shadow: false });
  },
  /* suszarka: dwa słupy i belka wzdłuż x albo y, na niej zwisają skóry ('pelts'), ryby ('fish') albo tkanina ('cloth') */
  rack(x0, y0, x1, y1, kind = 'pelts', h = 0.8) {
    const alongX = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    return this.part(Math.min(x0, x1) - 0.06, Math.min(y0, y1) - 0.06, 0, Math.max(x0, x1) + 0.06, Math.max(y0, y1) + 0.06, h + 0.1, () => {
      const sc = this.sc, g = sc.g, f = sc.F, n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.24)), r = rng(Math.round(x0 * 71 + y0 * 37) + 9);
      sc.box(x0 - 0.04, y0 - 0.04, 0, x0 + 0.04, y0 + 0.04, h, 'bark', { pal: '#6a4a2c', ao: 0.1 });
      sc.box(Math.min(x0, x1) - 0.03, Math.min(y0, y1) - 0.03, h - 0.04, Math.max(x0, x1) + 0.03, Math.max(y0, y1) + 0.03, h + 0.03, 'log', { pal: '#6a4a2c', ao: 0.1 });
      sc.box(x1 - 0.04, y1 - 0.04, 0, x1 + 0.04, y1 + 0.04, h, 'bark', { pal: '#6a4a2c', ao: 0.1 });
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, [px, py] = sc.P(x, y, h - 0.02), s = 0.85 + r() * 0.3;
        if (kind === 'fish') { g.fillStyle = i % 2 ? '#c9ccd0' : '#aab0b8'; g.strokeStyle = 'rgba(20,24,30,0.8)'; g.lineWidth = 0.9 * f; g.beginPath(); g.moveTo(px, py + 2 * f); g.quadraticCurveTo(px + 4.4 * f * s, py + 12 * f, px, py + 24 * f * s); g.quadraticCurveTo(px - 4.4 * f * s, py + 12 * f, px, py + 2 * f); g.fill(); g.stroke(); g.fillStyle = 'rgba(30,40,50,0.6)'; g.beginPath(); g.moveTo(px, py + 24 * f * s); g.lineTo(px + 3 * f, py + 28 * f * s); g.lineTo(px - 3 * f, py + 28 * f * s); g.closePath(); g.fill(); }
        else if (kind === 'cloth') { const cols = ['#b8352b', '#2f6ea8', '#e8d8a0', '#2f7a58']; g.fillStyle = cols[i % cols.length]; g.strokeStyle = 'rgba(20,14,10,0.7)'; g.lineWidth = 0.9 * f; g.fillRect(px - 5.5 * f, py, 11 * f, 24 * f * s); g.strokeRect(px - 5.5 * f, py, 11 * f, 24 * f * s); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(px - 5.5 * f, py + 7 * f, 11 * f, 2 * f); }
        else { const cols = ['#a0764a', '#6a4a30', '#c8b090', '#8a6a48']; g.fillStyle = cols[(i + (r() * 2 | 0)) % cols.length]; g.strokeStyle = 'rgba(20,14,10,0.8)'; g.lineWidth = 1 * f; g.beginPath(); g.moveTo(px - 5 * f, py); g.lineTo(px + 5 * f, py); g.lineTo(px + 6.6 * f, py + 8 * f); g.lineTo(px + 4 * f, py + 16 * f * s); g.lineTo(px + 6 * f, py + 24 * f * s); g.lineTo(px - 1 * f, py + 21 * f * s); g.lineTo(px - 5.6 * f, py + 25 * f * s); g.lineTo(px - 4 * f, py + 14 * f); g.lineTo(px - 6.4 * f, py + 7 * f); g.closePath(); g.fill(); g.stroke(); }
      }
    }, { tag: 'suszarka', shadow: false });
  }
});

/* ---------- elementy wojskowe, górnicze i winiarskie ---------- */
Object.assign(Build.prototype, {
  /* palisada: rząd zaostrzonych pali wzdłuż odcinka */
  palisade(x0, y0, x1, y1, h = 0.55) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.11));
    return this.part(Math.min(x0, x1) - 0.05, Math.min(y0, y1) - 0.05, 0, Math.max(x0, x1) + 0.05, Math.max(y0, y1) + 0.05, h + 0.1, () => { for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; this.sc.box(x - 0.04, y - 0.04, 0, x + 0.04, y + 0.04, h + (i % 3) * 0.04, 'bark', { ao: 0.2, pal: '#8a6a40' }); } }, { tag: 'palisada', shadow: false });
  },
  /* sztandar na wysokim drzewcu (kolor + złoty krzyż) */
  banner(x, y, h = 1.5, col = '#2f5aa8') {
    return this.part(x - 0.04, y - 0.04, 0, x + 0.3, y + 0.04, h + 0.1, () => {
      const g = this.sc.g, f = this.sc.F, [px, py] = this.sc.P(x, y, 0), top = py - h * VH * f;
      g.strokeStyle = '#3a2814'; g.lineWidth = 2.4 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, top); g.stroke();
      g.fillStyle = col; g.strokeStyle = 'rgba(10,10,30,0.7)'; g.lineWidth = f; g.beginPath(); g.moveTo(px + 1 * f, top + 4 * f); g.lineTo(px + 24 * f, top + 4 * f); g.lineTo(px + 24 * f, top + 48 * f); g.lineTo(px + 12 * f, top + 56 * f); g.lineTo(px + 1 * f, top + 48 * f); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e0c060'; g.fillRect(px + 11 * f, top + 12 * f, 3 * f, 30 * f); g.fillRect(px + 5 * f, top + 22 * f, 15 * f, 3.4 * f);
    }, { tag: 'sztandar', shadow: false });
  },
  /* stojak z włóczniami / mieczami (opiera się o ramę) */
  weaponRack(x0, y0, x1, y1, kind = 'spears') {
    return this.part(Math.min(x0, x1) - 0.06, Math.min(y0, y1) - 0.06, 0, Math.max(x0, x1) + 0.06, Math.max(y0, y1) + 0.06, 0.95, () => {
      const sc = this.sc, g = sc.g, f = sc.F, n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.11));
      sc.box(x0 - 0.03, y0 - 0.03, 0, x0 + 0.03, y0 + 0.03, 0.34, 'bark', { pal: '#6a4a2c', ao: 0.1 }); sc.box(x1 - 0.03, y1 - 0.03, 0, x1 + 0.03, y1 + 0.03, 0.34, 'bark', { pal: '#6a4a2c', ao: 0.1 });
      sc.box(Math.min(x0, x1) - 0.03, Math.min(y0, y1) - 0.03, 0.26, Math.max(x0, x1) + 0.03, Math.max(y0, y1) + 0.03, 0.32, 'log', { pal: '#6a4a2c', ao: 0.1 });
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, [px, py] = sc.P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.3);
        if (kind === 'spears') { g.strokeStyle = '#9a7240'; g.lineWidth = 2 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py + 2 * f); g.lineTo(px + 4 * f, py - 58 * f); g.stroke(); g.fillStyle = '#cfd4d8'; g.strokeStyle = 'rgba(20,20,24,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(px + 4 * f, py - 70 * f); g.lineTo(px + 7.4 * f, py - 57 * f); g.lineTo(px + 0.6 * f, py - 57 * f); g.closePath(); g.fill(); g.stroke(); }
        else { g.strokeStyle = '#3a2a1c'; g.lineWidth = 2.6 * f; g.beginPath(); g.moveTo(px, py - 6 * f); g.lineTo(px + 2 * f, py - 14 * f); g.stroke(); g.strokeStyle = '#c8ced4'; g.lineWidth = 2.2 * f; g.beginPath(); g.moveTo(px + 2 * f, py - 14 * f); g.lineTo(px + 6 * f, py - 44 * f); g.stroke(); }
      }
    }, { tag: 'stojak', shadow: false });
  },
  /* stojak z tarczami (okrągłe, w kolorach) */
  shieldRack(x0, y0, x1, y1, cols = ['#2f5aa8', '#b8352b', '#e0c060']) {
    return this.part(Math.min(x0, x1) - 0.06, Math.min(y0, y1) - 0.06, 0, Math.max(x0, x1) + 0.06, Math.max(y0, y1) + 0.06, 0.9, () => {
      const sc = this.sc, g = sc.g, f = sc.F, n = cols.length;
      for (const [x, y] of [[x0, y0], [x1, y1]]) sc.box(x - 0.03, y - 0.03, 0, x + 0.03, y + 0.03, 0.78, 'bark', { pal: '#6a4a2c', ao: 0.1 });
      sc.box(Math.min(x0, x1) - 0.03, Math.min(y0, y1) - 0.03, 0.72, Math.max(x0, x1) + 0.03, Math.max(y0, y1) + 0.03, 0.78, 'log', { pal: '#6a4a2c', ao: 0.1 });
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, [px, py] = sc.P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.5); g.fillStyle = cols[i]; g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 1.3 * f; g.beginPath(); g.arc(px, py, 11 * f, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(px, py, 3.2 * f, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = f; g.beginPath(); g.arc(px, py, 8 * f, Math.PI * 1.1, Math.PI * 1.6); g.stroke(); }
    }, { tag: 'tarcze', shadow: false });
  },
  /* manekin treningowy */
  dummy(x, y) {
    return this.part(x - 0.15, y - 0.06, 0, x + 0.15, y + 0.06, 0.9, () => { const g = this.sc.g, f = this.sc.F, [px, py] = this.sc.P(x, y, 0);
      g.strokeStyle = '#4a3220'; g.lineWidth = 4 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 48 * f); g.moveTo(px - 16 * f, py - 36 * f); g.lineTo(px + 16 * f, py - 36 * f); g.stroke();
      g.fillStyle = '#d8c898'; g.strokeStyle = '#4a3220'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py - 52 * f, 7 * f, 8 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#2f5aa8'; g.beginPath(); g.moveTo(px - 5 * f, py - 34 * f); g.lineTo(px + 5 * f, py - 34 * f); g.lineTo(px + 4 * f, py - 22 * f); g.lineTo(px, py - 18 * f); g.lineTo(px - 4 * f, py - 22 * f); g.closePath(); g.fill(); g.stroke(); }, { tag: 'manekin', shadow: false });
  },
  /* wejście do kopalni: ramy z bali i ciemny otwór w skale; kierunek +y (południe) */
  mineMouth(x, y, w = 0.7, h = 0.78) {
    const hw = w / 2;
    this.box(x - hw - 0.1, y - 0.06, 0, x - hw, y + 0.06, h, 'bark', { pal: '#6a4a2c', ao: 0.2 }); this.box(x + hw, y - 0.06, 0, x + hw + 0.1, y + 0.06, h, 'bark', { pal: '#6a4a2c', ao: 0.2 });
    this.box(x - hw - 0.14, y - 0.06, h - 0.02, x + hw + 0.14, y + 0.06, h + 0.1, 'log', { pal: '#6a4a2c', ao: 0.2, nest: true });
    return this.part(x - hw, y - 0.05, 0, x + hw, y + 0.07, h, () => this.sc.local([x - hw, y + 0.07, h], [w, 0, 0], [0, 0, -h], (g, lu, lv) => {
      const gr = g.createLinearGradient(0, 0, 0, lv); gr.addColorStop(0, '#0c0806'); gr.addColorStop(1, '#241a12'); g.fillStyle = gr; g.fillRect(0, 0, lu, lv);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, lu * 0.14, lv); g.fillRect(lu * 0.86, 0, lu * 0.14, lv);
      g.strokeStyle = '#5a3e22'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(0, lv * 0.3); g.lineTo(lu * 0.2, 0); g.moveTo(lu, lv * 0.3); g.lineTo(lu * 0.8, 0); g.stroke();
    }), { tag: 'otwór', shadow: false, nest: true });
  },
  /* tory z podkładami od (x, y0) do (x, y1) i wózek z ładunkiem */
  rails(x, y0, y1) {
    return this.part(x - 0.2, y0, 0, x + 0.2, y1, 0.02, () => { const sc = this.sc, g = sc.g, f = sc.F; const n = Math.round((y1 - y0) / 0.14);
      for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n, [ax, ay] = sc.P(x - 0.17, y, 0), [bx, by] = sc.P(x + 0.17, y, 0); g.strokeStyle = '#4a3220'; g.lineWidth = 2.2 * f; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
      for (const dx of [-0.12, 0.12]) { const [ax, ay] = sc.P(x + dx, y0, 0), [bx, by] = sc.P(x + dx, y1, 0); g.strokeStyle = '#8a8e94'; g.lineWidth = 1.6 * f; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.strokeStyle = 'rgba(20,20,24,0.8)'; g.lineWidth = 0.7 * f; g.stroke(); } }, { tag: 'tory', kind: 'flat', shadow: false });
  },
  cart(x, y, kind = 'ore') {
    this.box(x - 0.17, y - 0.15, 0.1, x + 0.17, y + 0.15, 0.3, 'plank', { pal: '#6a4a2c', ao: 0.3 });
    this.part(x - 0.2, y - 0.15, 0, x + 0.2, y + 0.15, 0.12, () => { const g = this.sc.g, f = this.sc.F; for (const dx of [-0.17, 0.17]) for (const dy of [-0.08, 0.08]) { const [px, py] = this.sc.P(x + dx, y + dy, 0.07); g.fillStyle = '#2a2420'; g.strokeStyle = '#8a8e94'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py, 4.4 * f, 6 * f, 0, 0, TAU); g.fill(); g.stroke(); } }, { tag: 'koła', shadow: false, nest: true });
    return this.heap(x, y, 0.16, 0.16, kind, 0.3);
  },
  /* rząd winorośli wzdłuż x: słupki, drut i listowie z gronami */
  vineRow(x0, x1, y) {
    return this.part(x0 - 0.05, y - 0.12, 0, x1 + 0.05, y + 0.12, 0.62, () => { const sc = this.sc, g = sc.g, f = sc.F, n = Math.max(2, Math.round((x1 - x0) / 0.4)), r = rng(Math.round(y * 91) + 17);
      const lf = (x) => { const [px, py] = sc.P(x, y, 0.2); for (let k = 0; k < 4; k++) { const dx = (r() - 0.5) * 20 * f, dy = -r() * 22 * f; const gr = g.createRadialGradient(px + dx - 1.2 * f, py + dy - 1.4 * f, 0.5, px + dx, py + dy, 7 * f); gr.addColorStop(0, '#9bd25a'); gr.addColorStop(1, '#2f6a22'); g.fillStyle = gr; g.strokeStyle = 'rgba(14,40,14,0.55)'; g.lineWidth = 0.8 * f; g.beginPath(); g.arc(px + dx, py + dy, (5 + r() * 2.5) * f, 0, TAU); g.fill(); g.stroke(); }
        if (r() < 0.8) { g.fillStyle = '#5a2a6a'; g.strokeStyle = 'rgba(20,6,30,0.8)'; g.lineWidth = 0.8 * f; for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(px - 3 * f + (q % 2) * 4 * f, py - 4 * f + q * 2.6 * f, 2.2 * f, 0, TAU); g.fill(); g.stroke(); } } };
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; sc.box(x - 0.025, y - 0.025, 0, x + 0.025, y + 0.025, 0.55, 'bark', { pal: '#6a4a2c', ao: 0.1, wear: 0.3 }); if (i < n) { lf(x + (x1 - x0) / n / 2); } } }, { tag: 'winorośl', shadow: false });
  }
});

/* ---------- wspólne części rzemieślnicze ---------- */
Object.assign(Build.prototype, {
  /* belka na kobyłkach + piła ramowa (wnętrze tartaku); belka wzdłuż x od x0 do x1 na linii y */
  sawRig(x0, x1, y) {
    for (const x of [x0 + 0.1, x1 - 0.2]) this.box(x, y - 0.09, 0.08, x + 0.1, y + 0.09, 0.3, 'log', { pal: '#6a4a2c', ao: 0.2 });
    this.box(x0, y - 0.07, 0.3, x1, y + 0.07, 0.42, 'log', { pal: '#8a6a40', ao: 0.2, nest: false });
    const xm = (x0 + x1) / 2;
    return this.part(xm - 0.12, y - 0.1, 0.3, xm + 0.12, y + 0.12, 0.95, () => this.sc.local([xm - 0.12, y + 0.12, 0.95], [0.24, 0, 0], [0, 0, -0.65], (g) => { g.strokeStyle = '#5a3e22'; g.lineWidth = 0.035; g.strokeRect(0.01, 0.01, 0.22, 0.63); g.strokeStyle = 'rgba(190,196,204,0.9)'; g.lineWidth = 0.012; for (const u of [0.08, 0.12, 0.16]) { g.beginPath(); g.moveTo(u, 0.05); g.lineTo(u, 0.6); g.stroke(); } }), { tag: 'piła', shadow: false });
  },
  /* pergola / zadaszenie z liści palmowych: cztery słupy i płaska połać (z = wysokość połaci) */
  pergola(x0, y0, x1, y1, z, pal = '#9a8a4a') {
    for (const [px, py] of [[x0, y0], [x1 - 0.06, y0], [x0, y1 - 0.06], [x1 - 0.06, y1 - 0.06]]) this.box(px, py, 0, px + 0.06, py + 0.06, z, 'bark', { pal: '#6a4a2c', ao: 0.1 });
    return this.part(x0 - 0.04, y0 - 0.04, z, x1 + 0.04, y1 + 0.04, z + 0.04, () => this.sc.face([x0 - 0.04, y0 - 0.04, z], [x1 - x0 + 0.08, 0, 0], [0, y1 - y0 + 0.08, 0], 'thatch', { shade: 1, pal, wear: 0.4, edge: 0.4 }), { tag: 'daszek', kind: 'roof' });
  },
  /* attyka: niski murek wokół dachu płaskiego (z = poziom dachu) */
  parapet(x0, y0, x1, y1, z, h = 0.13, th = 0.07, pal = '#e6d1a0', mat = 'sandstone', gapS = null) {
    const o = { ao: 0, pal, wear: 0.4 };
    this.box(x0, y0, z, x1, y0 + th, z + h, mat, o); this.box(x0, y0 + th, z, x0 + th, y1 - th, z + h, mat, o);
    if (gapS) { if (gapS[0] - x0 > 0.1) this.box(x0, y1 - th, z, gapS[0], y1, z + h, mat, o); if (x1 - gapS[1] > 0.1) this.box(gapS[1], y1 - th, z, x1, y1, z + h, mat, o); } else this.box(x0, y1 - th, z, x1, y1, z + h, mat, o);
    this.box(x1 - th, y0 + th, z, x1, y1 - th, z + h, mat, o);
  },
  /* dzban / amfora z gliny */
  jar(x, y, s = 1, z = 0, col = [176, 112, 62]) {
    return this.part(x - 0.08 * s, y - 0.08 * s, z, x + 0.08 * s, y + 0.08 * s, z + 0.3 * s, () => { const sc = this.sc; sc.cyl(x, y, z, z + 0.2 * s, 0.075 * s, { color: col, ao: 0 }); sc.cyl(x, y, z + 0.2 * s, z + 0.29 * s, 0.04 * s, { color: scaleC(col, 0.85), ao: 0 }); const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z + 0.1 * s); g.strokeStyle = 'rgba(70,36,14,0.6)'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py, 0.075 * s * AX * f * 1.4142, 0.075 * s * AY * f * 1.4142, 0, 0, Math.PI); g.stroke(); }, { tag: 'dzban', shadow: false });
  },
  /* niski mur z cegły mułowej (zagroda, ogród) */
  mudWall(x0, y0, x1, y1, h = 0.22, th = 0.1) { return this.box(Math.min(x0, x1) - th / 2, Math.min(y0, y1) - th / 2, 0, Math.max(x0, x1) + th / 2, Math.max(y0, y1) + th / 2, h, 'sandstone', { pal: '#cfb27c', ao: 0.2, wear: 0.7, tag: 'mur', shadow: false }); },
  /* kanał nawadniający: pas wody w płaszczyźnie ziemi (dekal) z kamiennymi brzegami */
  channel(x0, y0, x1, y1) { this.sc.decal('water', null, [[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]], { feather: 1.5 }); this.sc.flat([[[x0 - 0.04, y0 - 0.04], [x1 + 0.04, y0 - 0.04], [x1 + 0.04, y1 + 0.04], [x0 - 0.04, y1 + 0.04]]], 'rgba(90,70,40,0.35)', 3); },
  /* kadzielnica z dymkiem na trójnogu */
  censer(x, y) {
    return this.part(x - 0.1, y - 0.1, 0, x + 0.1, y + 0.1, 0.55, () => { const g = this.sc.g, f = this.sc.F, [px, py] = this.sc.P(x, y, 0);
      g.strokeStyle = '#3a2a1c'; g.lineWidth = 2 * f; g.lineCap = 'round'; for (const dx of [-5, 0, 5]) { g.beginPath(); g.moveTo(px + dx * f, py - 12 * f); g.lineTo(px + dx * 1.6 * f, py + 1 * f); g.stroke(); }
      g.fillStyle = '#c89a3a'; g.strokeStyle = 'rgba(40,24,6,0.85)'; g.lineWidth = f; g.beginPath(); g.moveTo(px - 8 * f, py - 14 * f); g.quadraticCurveTo(px, py - 4 * f, px + 8 * f, py - 14 * f); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(230,230,235,0.55)'; g.lineWidth = 2.4 * f; for (const dx of [-3, 2]) { g.beginPath(); g.moveTo(px + dx * f, py - 15 * f); g.bezierCurveTo(px + (dx - 6) * f, py - 26 * f, px + (dx + 7) * f, py - 34 * f, px + (dx - 2) * f, py - 46 * f); g.stroke(); } }, { tag: 'kadzielnica', shadow: false });
  },
  /* dywan na ziemi */
  rug(x, y, w, d, pal = '#a8352b|#d8a830') { return this.part(x, y, 0, x + w, y + d, 0.012, () => this.sc.face([x, y, 0.012], [w, 0, 0], [0, d, 0], 'stripes', { shade: 1, pal, ppu: 190, wear: 0.3, edge: 0.5 }), { tag: 'dywan', kind: 'flat', shadow: false }); }
});

/* ---------- stragany targowe ---------- */
Object.assign(Build.prototype, {
  /* straganik: cztery słupki, lada z towarem 2D i pasiasta markiza; cx — środek, y — tylna krawędź; kind: fruit | spice | cloth | pot | fish | fur | bread */
  stall(cx, y, o = {}) {
    const pal = o.pal || '#b8352b|#f1e6c8', kind = o.kind || 'fruit', sc = this.sc;
    for (const px of [cx - 0.38, cx + 0.38]) { this.box(px - 0.03, y + 0.03, 0, px + 0.03, y + 0.09, 0.9, 'bark', { pal: '#6a4a2c', ao: 0.1 }); this.box(px - 0.03, y + 0.55, 0, px + 0.03, y + 0.61, 0.7, 'bark', { pal: '#6a4a2c', ao: 0.1 }); }
    this.part(cx - 0.44, y, 0.7, cx + 0.44, y + 0.72, 0.92, () => awning(sc, cx - 0.44, y, 0.92, 0.88, 0.68, 0.2, pal), { tag: 'płachta', kind: 'roof' });
    this.box(cx - 0.36, y + 0.35, 0, cx + 0.36, y + 0.5, 0.32, 'plank', { pal: o.counter || '#8a6a40', ao: 0.3 });
    return this.part(cx - 0.3, y + 0.37, 0.32, cx + 0.3, y + 0.46, 0.46, () => {
      const g = sc.g, f = sc.F, r = rng(Math.round(cx * 100 + y * 37) + 3);
      for (let k = 0; k < 6; k++) {
        const [px, py] = sc.P(cx - 0.27 + k * 0.108, y + 0.42, 0.32);
        g.strokeStyle = 'rgba(20,12,6,0.7)'; g.lineWidth = 0.9 * f;
        if (kind === 'fruit') { g.fillStyle = ['#c4302a', '#e8a030', '#8ab04a'][k % 3]; g.beginPath(); g.ellipse(px, py - (3 + r() * 3) * f, 5 * f, 4.4 * f, 0, 0, TAU); g.fill(); g.stroke(); }
        else if (kind === 'spice') { g.fillStyle = ['#c0392b', '#e8b030', '#8a5a2a', '#d8a860', '#6a8a3a'][k % 5]; g.beginPath(); g.moveTo(px - 5 * f, py); g.lineTo(px, py - 11 * f); g.lineTo(px + 5 * f, py); g.closePath(); g.fill(); g.stroke(); }
        else if (kind === 'cloth') { g.fillStyle = ['#2f6ea8', '#a8352b', '#d8a830', '#2f7a58', '#7a3a8a'][k % 5]; g.fillRect(px - 4.5 * f, py - 9 * f, 9 * f, 9 * f); g.strokeRect(px - 4.5 * f, py - 9 * f, 9 * f, 9 * f); }
        else if (kind === 'fish') { g.fillStyle = k % 2 ? '#c9ccd0' : '#aab0b8'; g.beginPath(); g.ellipse(px, py - 3 * f, 6 * f, 2.6 * f, 0, 0, TAU); g.fill(); g.stroke(); }
        else if (kind === 'fur') { g.fillStyle = ['#a0764a', '#6a4a30', '#c8b090', '#8a6a48'][k % 4]; g.beginPath(); g.ellipse(px, py - 3 * f, 6 * f, 3 * f, 0, 0, TAU); g.fill(); g.stroke(); }
        else if (kind === 'bread') { g.fillStyle = k % 2 ? '#c88a3a' : '#b87a2e'; g.beginPath(); g.ellipse(px, py - 3 * f, 6 * f, 3.6 * f, 0, 0, TAU); g.fill(); g.stroke(); }
        else { g.fillStyle = ['#b4693a', '#a85a30', '#c8844a'][k % 3]; g.beginPath(); g.ellipse(px, py - 5 * f, 4.4 * f, 6 * f, 0, 0, TAU); g.fill(); g.stroke(); }
      }
    }, { tag: 'towar', shadow: false });
  }
});

/* ---------- uprawy i rzemiosło wschodnie ---------- */
Object.assign(Build.prototype, {
  /* rząd krzewów bawełny: zielone kępy z białymi torebkami */
  cottonRow(x0, x1, y) {
    return this.part(x0 - 0.05, y - 0.12, 0, x1 + 0.05, y + 0.12, 0.4, () => { const sc = this.sc, g = sc.g, f = sc.F, n = Math.max(3, Math.round((x1 - x0) / 0.28)), r = rng(Math.round(y * 91) + 41);
      for (let i = 0; i < n; i++) { const [px, py] = sc.P(x0 + (x1 - x0) * (i + 0.5) / n, y, 0);
        g.fillStyle = 'rgba(30,24,8,0.28)'; g.beginPath(); g.ellipse(px + 2 * f, py, 11 * f, 4 * f, 0, 0, TAU); g.fill();
        for (let k = 0; k < 4; k++) { const dx = (r() - 0.5) * 16 * f, dy = -r() * 12 * f - 2 * f, gr = g.createRadialGradient(px + dx - 1 * f, py + dy - 1.4 * f, 0.5, px + dx, py + dy, 7 * f); gr.addColorStop(0, '#8cc060'); gr.addColorStop(1, '#2f6a28'); g.fillStyle = gr; g.strokeStyle = 'rgba(14,40,14,0.5)'; g.lineWidth = 0.8 * f; g.beginPath(); g.arc(px + dx, py + dy, (5 + r() * 2) * f, 0, TAU); g.fill(); g.stroke(); }
        g.fillStyle = '#f6f2e6'; g.strokeStyle = 'rgba(80,70,50,0.7)'; g.lineWidth = 0.7 * f; for (let q = 0; q < 6; q++) { g.beginPath(); g.arc(px + (r() - 0.5) * 18 * f, py - (3 + r() * 14) * f, (1.8 + r() * 1.2) * f, 0, TAU); g.fill(); g.stroke(); } }
    }, { tag: 'bawełna', shadow: false });
  },
  /* krosno tkackie: rama, napięta osnowa w kolorach i gotowa tkanina u dołu */
  loom(x, y, w = 0.6) {
    return this.part(x - 0.04, y - 0.06, 0, x + w + 0.04, y + 0.06, 0.95, () => {
      const sc = this.sc, g = sc.g, f = sc.F;
      sc.box(x - 0.04, y - 0.04, 0, x + 0.02, y + 0.04, 0.9, 'bark', { pal: '#6a4a2c', ao: 0.1 }); sc.box(x + w - 0.02, y - 0.04, 0, x + w + 0.04, y + 0.04, 0.9, 'bark', { pal: '#6a4a2c', ao: 0.1 });
      sc.box(x - 0.04, y - 0.04, 0.84, x + w + 0.04, y + 0.04, 0.92, 'plank', { pal: '#6a4a2c', ao: 0.1 }); sc.box(x - 0.04, y - 0.04, 0.2, x + w + 0.04, y + 0.04, 0.26, 'plank', { pal: '#6a4a2c', ao: 0.1 });
      const cols = ['#a8352b', '#2f6ea8', '#d8a830', '#2f7a58'], n = 14;
      for (let i = 0; i < n; i++) { const [ax, ay] = sc.P(x + 0.04 + (w - 0.08) * i / (n - 1), y + 0.05, 0.84), [bx, by] = sc.P(x + 0.04 + (w - 0.08) * i / (n - 1), y + 0.05, 0.3); g.strokeStyle = i % 5 === 0 ? cols[(i / 5) | 0] : 'rgba(236,228,206,0.75)'; g.lineWidth = f; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
      const [cx0, cy0] = sc.P(x + 0.04, y + 0.05, 0.5), [cx1, cy1] = sc.P(x + w - 0.04, y + 0.05, 0.3); g.fillStyle = 'rgba(168,53,43,0.85)'; g.strokeStyle = 'rgba(30,14,8,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx1, cy1 - 0.2 * VH * f); g.lineTo(cx1, cy1); g.lineTo(cx0, cy0 + 0.2 * VH * f); g.closePath(); g.fill(); g.stroke();
    }, { tag: 'krosno', shadow: false });
  },
  /* rząd cegieł schnących na słońcu */
  bricksRow(x, y, n, col = '#c8844a') { return this.part(x, y, 0, x + n * 0.26, y + 0.16, 0.12, () => { for (let i = 0; i < n; i++) this.sc.box(x + i * 0.26 + 0.01, y, 0, x + i * 0.26 + 0.25, y + 0.15, 0.1, 'sandstone', { pal: col, ao: 0.15, wear: 0.6 }); }, { tag: 'cegły', shadow: false }); }
});
