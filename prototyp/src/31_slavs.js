/* ====================== SŁOWIANIE: zrąb, strzecha, plecionka, drewniane bożki ====================== */

/* „koniki" — skrzyżowane deski z końskimi łbami na końcu kalenicy */
function konik(sc, x, y, z, d = 1) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.lineCap = 'round';
  for (const s2 of [1, -1]) {
    g.strokeStyle = '#2b1c10'; g.lineWidth = 6.4 * f; g.beginPath(); g.moveTo(px - 4 * s2 * f * d, py + 10 * f); g.lineTo(px + 12 * s2 * f * d, py - 26 * f); g.stroke();
    g.strokeStyle = '#a07040'; g.lineWidth = 4 * f; g.stroke();
    const hx = px + 12 * s2 * f * d, hy = py - 26 * f;
    g.fillStyle = '#a07040'; g.strokeStyle = '#2b1c10'; g.lineWidth = 1.3 * f; g.beginPath(); g.moveTo(hx - 3 * f, hy + 3 * f); g.quadraticCurveTo(hx - 5 * f, hy - 6 * f, hx + 1 * f * s2, hy - 7 * f); g.lineTo(hx + 7 * f * s2, hy - 4 * f); g.lineTo(hx + 4 * f * s2, hy - 1 * f); g.quadraticCurveTo(hx + 3 * f * s2, hy + 3 * f, hx, hy + 4 * f); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c0392b'; g.beginPath(); g.arc(hx + 2.4 * f * s2, hy - 3 * f, 0.9 * f, 0, TAU); g.fill();
  }
}
/* sznur cebuli / czosnku / ziół zawieszony pod okapem (rysowany na ekranie) */
function hangString(sc, x, y, z, n = 5, col = '#d8b060') {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.strokeStyle = '#5a4020'; g.lineWidth = 1.2 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py + n * 7 * f); g.stroke();
  for (let i = 0; i < n; i++) { g.fillStyle = col; g.strokeStyle = 'rgba(60,36,10,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(px + (i % 2 ? 2 : -2) * f, py + (i + 1) * 7 * f, 3.4 * f, 3 * f, 0, 0, TAU); g.fill(); g.stroke(); }
}
/* rzeźbiony słup z twarzą (bożek): twarz rysowana na ścianach południowej i wschodniej */
function idolPost(sc, cx, cy, w, h, o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - w / 2, y1 = cy + w / 2, z0 = o.z0 ?? 0.06;
  sc.box(x0, y0, z0, x1, y1, z0 + h, 'plank', { ao: 0.25, pal: o.pal || '#7a4a26', wear: 0.8 });
  const S = wallS(x0, x1, y1, z0 + h, z0), E = wallE(y0, y1, x1, z0 + h, z0), face = (W, side) => sc.local(W.O, W.U, W.V, (g, lu, lv) => {
    const m = lu / 2, top = lv * 0.12, hh = lv * 0.32;
    g.fillStyle = o.skin || '#d8b078'; g.beginPath(); g.ellipse(m, top + hh * 0.55, lu * 0.36, hh * 0.52, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = lu * 0.035; g.stroke();
    g.fillStyle = '#1c1008'; g.beginPath(); g.ellipse(m - lu * 0.14, top + hh * 0.42, lu * 0.06, lu * 0.04, 0, 0, TAU); g.ellipse(m + lu * 0.14, top + hh * 0.42, lu * 0.06, lu * 0.04, 0, 0, TAU); g.fill();
    g.strokeStyle = '#1c1008'; g.lineWidth = lu * 0.04; g.beginPath(); g.moveTo(m - lu * 0.2, top + hh * 0.3); g.lineTo(m - lu * 0.06, top + hh * 0.33); g.moveTo(m + lu * 0.2, top + hh * 0.3); g.lineTo(m + lu * 0.06, top + hh * 0.33); g.moveTo(m, top + hh * 0.45); g.lineTo(m - lu * 0.03, top + hh * 0.66); g.stroke();
    g.fillStyle = '#2a1608'; g.beginPath(); g.moveTo(m - lu * 0.2, top + hh * 0.78); g.quadraticCurveTo(m, top + hh * 0.7, m + lu * 0.2, top + hh * 0.78); g.quadraticCurveTo(m, top + hh * 0.9, m - lu * 0.2, top + hh * 0.78); g.fill();
    g.fillStyle = o.band || '#a8352b'; g.fillRect(0, lv * 0.5, lu, lv * 0.07); g.fillRect(0, lv * 0.7, lu, lv * 0.05);
    g.fillStyle = '#e8d8a0'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(m - lu * 0.3 + i * lu * 0.2, lv * 0.82); g.lineTo(m - lu * 0.2 + i * lu * 0.2, lv * 0.9); g.lineTo(m - lu * 0.3 + i * lu * 0.2 + lu * 0.2, lv * 0.82); g.fill(); }
  });
  face(S); face(E);
  pyramidRoof(sc, { x0: x0 - 0.02, x1: x1 + 0.02, y0: y0 - 0.02, y1: y1 + 0.02, z: z0 + h, rise: w * 0.9, mat: 'thatch', pal: '#b89a48', ov: 0.01, ppu: 150 });
}

/* CHATA 2×2: wysoka chata ze zrębu z gankiem pod wspólnym dachem, koniki na kalenicy */
BAKED.slavHut = function () {
  const sc = sceneFor(2, 2, 2.5), x0 = -0.8, x1 = 0.8, y0 = -0.62, y1 = 0.42, yp = 0.86, zp = 0.1, zw = 1.15, rise = 0.74, ym = (y0 + yp) / 2;
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 3 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, yp, 0], [x0, yp, 0], [x0 - 0.14, y0 - 0.1, zw], [x1 + 0.14, y0 - 0.1, zw], [x1 + 0.14, yp + 0.1, zw - 0.1], [x0 - 0.14, yp + 0.1, zw - 0.1], [x0 - 0.14, ym, zw + rise], [x1 + 0.14, ym, zw + rise]]);
  sc.contact(x0, y0, x1, yp);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zp, x1, y1, zw, 'log', { ao: 0.3, eave: 0.45 });
  sc.box(x0, y1, 0, x1, yp, 0.07, 'plank', { ao: 0.3, pal: '#7a5a36' });
  const S = wallS(x0, x1, y1, zw, zp), E = wallE(y0, y1, x1, zw, zp);
  door(sc, S.O, S.U, S.V, 0.62, 0.4, 0.8, { vb: zw - zp, arch: false, frame: '#2b1c10', pal: '#6a4a2c', lintel: '#a8352b' });
  windowAt(sc, S.O, S.U, S.V, 0.16, 0.34, 0.22, 0.28, { shutters: '#5d3f22' }); windowAt(sc, S.O, S.U, S.V, 1.2, 0.34, 0.22, 0.28, { shutters: '#5d3f22' });
  windowAt(sc, E.O, E.U, E.V, 0.4, 0.34, 0.2, 0.26, { shutters: '#5d3f22' });
  const g = sc.g, f = sc.F;
  for (const [cx, cy] of [[x1, y1], [x0, y1]]) for (let i = 0; i < 9; i++) { const z = zp + 0.06 + i * 0.115, [px, py] = sc.P(cx, cy, z); g.fillStyle = i % 2 ? '#8a6238' : '#9a6f3e'; g.beginPath(); g.ellipse(px, py, 5.4 * f, 3.4 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = 1; g.stroke(); }
  sc.box(x0 + 0.05, yp - 0.1, 0.07, x0 + 0.14, yp - 0.01, 1.0, 'log', { ao: 0.2, pal: '#8a6a40' }); sc.box(x1 - 0.14, yp - 0.1, 0.07, x1 - 0.05, yp - 0.01, 1.0, 'log', { ao: 0.2, pal: '#8a6a40' });
  sc.box(-0.66, 0.66, 0.07, -0.16, 0.78, 0.3, 'plank', { ao: 0.2, pal: '#7a5a36' });
  const R = gableRoof(sc, { x0, x1, y0, y1: yp, z: zw, rise, ov: 0.1, ovE: 0.14, mat: 'thatch', pal: '#c9a64c', gableMat: 'log', ridge: 'x' });
  sc.face([x0 - 0.14, R.ySo, R.eaveZ], [x1 - x0 + 0.28, 0, 0], [0, 0, -0.1], 'thatch', { shade: 0.62, pal: '#a98b3e', edge: 0.4 });
  const a = sc.P(x0 - 0.14, ym, zw + rise), b = sc.P(x1 + 0.14, ym, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#7d5f28'; g.lineWidth = 9 * f; g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke(); g.strokeStyle = '#d9bf6a'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(a[0], a[1] - 1.5); g.lineTo(b[0], b[1] - 1.5); g.stroke();
  konik(sc, x1 + 0.14, ym, zw + rise, 1); konik(sc, x0 - 0.14, ym, zw + rise, -1);
  sc.box(0.1, ym - 0.1, zw + rise - 0.04, 0.4, ym + 0.1, zw + rise + 0.2, 'plank', { ao: 0.2, pal: '#6a4a2c' }); pyramidRoof(sc, { x0: 0.06, x1: 0.44, y0: ym - 0.14, y1: ym + 0.14, z: zw + rise + 0.2, rise: 0.16, mat: 'thatch', pal: '#b89a48', ov: 0.01 });
  soot(sc, 0.25, ym + 0.12, zw + rise - 0.1, 0.16, 0.4);
  hangString(sc, -0.45, yp + 0.1, zw - 0.2, 5, '#e0b868'); hangString(sc, 0.2, yp + 0.1, zw - 0.2, 4, '#c8452e'); hangString(sc, 0.5, yp + 0.1, zw - 0.2, 6, '#d8c890');
  sc.cyl(0.62, 0.7, 0.07, 0.3, 0.1, { color: [170, 100, 60], ao: 0 }); sc.cyl(0.78, 0.62, 0.07, 0.2, 0.07, { color: [150, 90, 50], ao: 0 });
  logPile(sc, x1 + 0.3, 0.1); logPile(sc, x1 + 0.3, 0.3); logPile(sc, x1 + 0.3, -0.1); sc.cyl(0.95, 0.72, 0, 0.2, 0.1, { mat: 'log', pal: '#8a6a40', topMat: 'plank', ao: 0.3 });
  return sc.finish();
};

/* SKŁAD 3×2: spichlerz na palach z szerokim okapem, schodkami, wciągarką i workami */
BAKED.slavStore = function () {
  const sc = sceneFor(3, 2, 2.7), x0 = -1.3, x1 = 1.3, y0 = -0.7, y1 = 0.7, zf = 0.42, zw = 1.6, rise = 0.78;
  sc.shadowBox(x0, y0, x1, y1, zw + rise * 0.6, { alpha: 0.5, blur: 12 });
  sc.patch(0, 0.1, 1.9, 1.3, { seed: 5, alpha: 0.7 });
  sc.face([x0, y0, 0.02], [x1 - x0, 0, 0], [0, y1 - y0, 0], 'dirt', { pal: '#241c14', shade: 0.45, wear: 0, edge: 0 });
  const posts = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) posts.push([x0 + 0.15 + i * (x1 - x0 - 0.3) / 4, y0 + 0.15 + j * (y1 - y0 - 0.3) / 2]);
  posts.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [px, py] of posts) { sc.cyl(px, py, 0, zf, 0.075, { mat: 'log', pal: '#7a5a36', topMat: 'plank', ao: 0.3 }); sc.cyl(px, py, zf - 0.04, zf, 0.13, { color: [90, 70, 50], ao: 0, topMat: 'plank' }); }
  sc.box(x0, y0, zf - 0.1, x1, y1, zf, 'log', { ao: 0.4, pal: '#6a4a2c', eave: 0.5 });
  sc.box(x0 + 0.02, y0 + 0.02, zf, x1 - 0.02, y1 - 0.02, zw, 'plank', { ao: 0.3, pal: '#8a6a40', eave: 0.4 });
  const S = wallS(x0 + 0.02, x1 - 0.02, y1 - 0.02, zw, zf), E = wallE(y0 + 0.02, y1 - 0.02, x1 - 0.02, zw, zf);
  door(sc, S.O, S.U, S.V, 0.95, 0.7, 0.72, { vb: zw - zf, arch: false, frame: '#2b1c10', pal: '#6a4a2c', lintel: '#a8352b' });
  sc.local(S.O, S.U, S.V, (gg) => { gg.fillStyle = '#17120e'; for (const u of [0.25, 0.5, 1.9, 2.15, 2.4]) gg.fillRect(u, 0.18, 0.04, 0.3); gg.strokeStyle = '#2b1c10'; gg.lineWidth = 0.02; gg.beginPath(); gg.moveTo(1.3, 0.08); gg.lineTo(1.3, 0.86); gg.stroke(); });
  sc.local(E.O, E.U, E.V, (gg) => { gg.fillStyle = '#17120e'; for (const u of [0.35, 0.6, 0.85, 1.1]) gg.fillRect(u, 0.18, 0.04, 0.3); });
  stairs(sc, -0.3, 0.4, y1 - 0.02, 3, zf, 'plank', 0.13, '#7a5a36');
  sack(sc, 0.9, y1 + 0.18); sack(sc, 1.05, y1 + 0.26, '#cdbb88'); sack(sc, 1.15, y1 + 0.14, '#d8c898', 0.9); barrel(sc, -0.9, y1 + 0.22); barrel(sc, -1.08, y1 + 0.16, 0, 0.9); crate(sc, 1.45, 0.2, 0.22, 0.22);
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov: 0.18, ovE: 0.2, mat: 'thatch', pal: '#b99c48', gableMat: 'plank', gablePal: '#8a6a40', ridge: 'x' });
  sc.face([x0 - 0.2, R.ySo, R.eaveZ], [x1 - x0 + 0.4, 0, 0], [0, 0, -0.12], 'thatch', { shade: 0.62, pal: '#a08438', edge: 0.4 });
  const g = sc.g, f = sc.F, a = sc.P(x0 - 0.2, 0, zw + rise), b = sc.P(x1 + 0.2, 0, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#7d5f28'; g.lineWidth = 9 * f; g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke(); g.strokeStyle = '#d9bf6a'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(a[0], a[1] - 1.5); g.lineTo(b[0], b[1] - 1.5); g.stroke();
  konik(sc, x1 + 0.2, 0, zw + rise, 1); konik(sc, x0 - 0.2, 0, zw + rise, -1);
  // wciągarka z blokiem i workiem przy szczycie
  sc.box(x1 + 0.0, -0.03, zw + 0.2, x1 + 0.5, 0.03, zw + 0.27, 'log', { ao: 0.1, pal: '#6a4a2c' });
  const [rx, ry] = sc.P(x1 + 0.46, 0, zw + 0.2); g.strokeStyle = '#3a2814'; g.lineWidth = 1.6 * f; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx, ry + 30 * f); g.stroke(); g.fillStyle = '#3a2814'; g.beginPath(); g.arc(rx, ry, 3 * f, 0, TAU); g.fill();
  const [sx, sy] = sc.P(x1 + 0.46, 0, zw - 0.15); g.fillStyle = '#d8c898'; g.strokeStyle = 'rgba(40,30,14,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(sx, sy, 8 * f, 10 * f, 0, 0, TAU); g.fill(); g.stroke();
  return sc.finish();
};

/* WOSKARNIA 2×3: warsztat ze strzechą i okapem dymnym, ogrodzona pasieka, kocioł nad ogniem */
BAKED.slavWaxery = function () {
  const sc = sceneFor(2, 3, 2.4), x0 = -0.92, x1 = 0.92, y0 = -1.42, y1 = -0.12, zp = 0.1, zw = 1.0, rise = 0.66, ym = (y0 + y1) / 2;
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 7, alpha: 0.75 });
  sc.flat([[[0.15, 0.45], [0.85, 0.45], [0.85, 1.0], [0.15, 1.0]]], 'rgba(255,140,50,0.2)', 14);
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - 0.1, y0 - 0.1, zw], [x1 + 0.1, y0 - 0.1, zw], [x1 + 0.1, y1 + 0.1, zw], [x0 - 0.1, y1 + 0.1, zw], [x0 - 0.1, ym, zw + rise], [x1 + 0.1, ym, zw + rise], [0.4, ym, zw + rise + 0.6]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zp, x1, y1, zw, 'log', { ao: 0.3, eave: 0.4 });
  const S = wallS(x0, x1, y1, zw, zp), E = wallE(y0, y1, x1, zw, zp);
  door(sc, S.O, S.U, S.V, 0.7, 0.4, 0.74, { vb: zw - zp, arch: false, frame: '#2b1c10', pal: '#6a4a2c', lintel: '#d8a830' });
  windowAt(sc, S.O, S.U, S.V, 0.2, 0.3, 0.22, 0.26, { shutters: '#a8352b' }); windowAt(sc, S.O, S.U, S.V, 1.3, 0.3, 0.22, 0.26, { shutters: '#a8352b' });
  windowAt(sc, E.O, E.U, E.V, 0.35, 0.3, 0.2, 0.26, { shutters: '#a8352b' }); windowAt(sc, E.O, E.U, E.V, 0.8, 0.3, 0.2, 0.26, { shutters: '#a8352b' });
  const g = sc.g, f = sc.F;
  for (const [cx, cy] of [[x1, y1], [x0, y1]]) for (let i = 0; i < 8; i++) { const z = zp + 0.06 + i * 0.11, [px, py] = sc.P(cx, cy, z); g.fillStyle = i % 2 ? '#8a6238' : '#9a6f3e'; g.beginPath(); g.ellipse(px, py, 5 * f, 3.2 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = 1; g.stroke(); }
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov: 0.12, ovE: 0.14, mat: 'thatch', pal: '#cdaa50', gableMat: 'log', ridge: 'x' });
  sc.face([x0 - 0.14, R.ySo, R.eaveZ], [x1 - x0 + 0.28, 0, 0], [0, 0, -0.1], 'thatch', { shade: 0.62, pal: '#a98b3e', edge: 0.4 });
  const a = sc.P(x0 - 0.14, ym, zw + rise), b = sc.P(x1 + 0.14, ym, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#7d5f28'; g.lineWidth = 9 * f; g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke(); g.strokeStyle = '#d9bf6a'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(a[0], a[1] - 1.5); g.lineTo(b[0], b[1] - 1.5); g.stroke();
  konik(sc, x1 + 0.14, ym, zw + rise, 1);
  // okap dymny na kalenicy
  sc.box(0.2, ym - 0.2, zw + rise - 0.06, 0.62, ym + 0.2, zw + rise + 0.3, 'plank', { ao: 0.2, pal: '#6a4a2c' }); pyramidRoof(sc, { x0: 0.14, x1: 0.68, y0: ym - 0.26, y1: ym + 0.26, z: zw + rise + 0.3, rise: 0.22, mat: 'thatch', pal: '#b89a48', ov: 0.01 });
  soot(sc, 0.4, ym + 0.2, zw + rise - 0.1, 0.2, 0.45);
  // pasieka: płot z plecionki z furtką i ule
  wattle(sc, x0 + 0.02, 0.1, x0 + 0.02, 1.38, 0.42); wattle(sc, x1 - 0.02, 0.1, x1 - 0.02, 1.38, 0.42);
  wattle(sc, x0 + 0.02, 1.38, -0.28, 1.38, 0.42); wattle(sc, 0.28, 1.38, x1 - 0.02, 1.38, 0.42);
  sc.box(-0.33, 1.32, 0, -0.27, 1.44, 0.6, 'log', { pal: '#7a5632', ao: 0.1 }); sc.box(0.27, 1.32, 0, 0.33, 1.44, 0.6, 'log', { pal: '#7a5632', ao: 0.1 });
  for (const [x, y] of [[-0.66, 0.5], [-0.66, 0.9]]) sc.box(x - 0.2, y - 0.08, 0.02, x + 0.2, y + 0.08, 0.2, 'log', { ao: 0.3, pal: '#7a5632' });
  for (const [x, y] of [[-0.78, 0.5], [-0.55, 0.5], [-0.78, 0.9], [-0.55, 0.9]]) skep(sc, x, y, 1.15);
  for (const [x, y] of [[-0.05, 1.05], [0.15, 0.95], [-0.3, 1.1]]) { sc.cyl(x, y, 0, 0.5, 0.1, { mat: 'log', pal: '#8a6a40', topMat: 'plank', ao: 0.3 }); cone(sc, x, y, 0.5, 0.14, 0.14, [150, 120, 60]); }
  sc.cyl(0.5, 0.7, 0.04, 0.42, 0.22, { color: [196, 120, 60], ao: 0.3, mat: undefined, topMat: undefined });
  const [cx, cy] = sc.P(0.5, 0.7, 0.42); g.fillStyle = '#d98a3a'; g.beginPath(); g.ellipse(cx, cy, 0.2 * AX * f * 1.4142, 0.2 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = '#f0d070'; g.beginPath(); g.ellipse(cx, cy, 0.15 * AX * f * 1.4142, 0.15 * AY * f * 1.4142, 0, 0, TAU); g.fill();
  const [fx, fy] = sc.P(0.5, 0.7, 0.05); for (let i = 0; i < 5; i++) { const gr = g.createRadialGradient(fx + (i - 2) * 6 * f, fy - 2 * f, 0, fx + (i - 2) * 6 * f, fy - 2 * f, 10 * f); gr.addColorStop(0, 'rgba(255,230,120,0.9)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(fx + (i - 2) * 6 * f, fy - 4 * f, 6 * f, 10 * f, 0, 0, TAU); g.fill(); }
  sc.box(0.62, 0.15, 0.05, 0.9, 0.3, 0.12, 'plank', { ao: 0.2, pal: '#d8b050' }); sc.box(0.68, 0.18, 0.12, 0.84, 0.27, 0.2, 'plank', { ao: 0.1, pal: '#e8c870', wear: 0 });
  barrel(sc, 0.78, 0.5, 0, 0.9); logPile(sc, -0.5, 1.6 - 0.18);
  return sc.finish();
};

/* ŚWIĘTY KRĄG 3×3 (kapliczka): kopiec z kręgiem rzeźbionych bożków i ołtarzem z ogniem */
BAKED.slavShrine = function () {
  const sc = sceneFor(3, 3, 2.7);
  sc.patch(0, 0.05, 2.0, 1.9, { seed: 11, alpha: 0.5, pal: '#6a5a3a', feather: 18 });
  sc.shadow([[-1.1, -1.1, 0], [1.1, -1.1, 0], [1.1, 1.1, 0], [-1.1, 1.1, 0], [0, 0, 2.0]], { alpha: 0.45, blur: 12 });
  sc.cyl(0, 0, 0, 0.16, 1.28, { mat: 'rubble', pal: '#8a877c', topMat: 'grass', topPal: 'green', ao: 0.4 });
  sc.cyl(0, 0, 0.16, 0.2, 1.1, { mat: 'dirt', pal: '#6a5a3a', topMat: 'dirt', topPal: '#5a4a2e', ao: 0 });
  const g = sc.g, f = sc.F, ring = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; ring.push([Math.cos(a) * 0.92, Math.sin(a) * 0.92, i]); }
  ring.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const front = [], back = []; for (const r of ring) (r[0] + r[1] < 0 ? back : front).push(r);
  for (const [x, y, i] of back) idolPost(sc, x, y, 0.17, 1.0 + (i % 3) * 0.08, { z0: 0.2, pal: i % 2 ? '#7a4a26' : '#6a3e20', band: i % 2 ? '#a8352b' : '#2f5aa8' });
  // ołtarz z paleniskiem
  sc.box(-0.34, -0.3, 0.2, 0.34, 0.3, 0.38, 'stone', { ao: 0.3, pal: '#8f8a7e' }); sc.cyl(0, 0, 0.38, 0.5, 0.2, { color: [60, 56, 54], ao: 0.3 });
  const [ax2, ay2] = sc.P(0, 0, 0.5);
  for (let i = 0; i < 6; i++) { const gr = g.createRadialGradient(ax2 + (i - 2.5) * 6 * f, ay2 - 6 * f, 0, ax2 + (i - 2.5) * 6 * f, ay2 - 8 * f, 18 * f); gr.addColorStop(0, 'rgba(255,240,150,0.95)'); gr.addColorStop(0.5, 'rgba(255,140,30,0.7)'); gr.addColorStop(1, 'rgba(180,40,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(ax2 + (i - 2.5) * 6 * f, ay2 - 12 * f, 7 * f, 18 * f - Math.abs(i - 2.5) * 3 * f, 0, 0, TAU); g.fill(); }
  // centralny bożek (cztery twarze) i dary
  idolPost(sc, 0.0, -0.45, 0.3, 1.5, { z0: 0.2, pal: '#7a4a26', skin: '#e0c088', band: '#d8a830' });
  barrel(sc, 0.3, 0.6, 0.2, 0.7); sack(sc, 0.5, 0.55, '#d8c898', 0.8); sc.cyl(-0.45, 0.6, 0.2, 0.34, 0.08, { color: [176, 106, 60], ao: 0 }); sc.cyl(-0.3, 0.7, 0.2, 0.3, 0.07, { color: [150, 90, 50], ao: 0 });
  for (const [x, y, i] of front) idolPost(sc, x, y, 0.17, 1.0 + (i % 3) * 0.08, { z0: 0.2, pal: i % 2 ? '#7a4a26' : '#6a3e20', band: i % 2 ? '#a8352b' : '#2f5aa8' });
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = Math.cos(a) * 1.3, y = Math.sin(a) * 1.3; sc.box(x - 0.1, y - 0.08, 0, x + 0.1, y + 0.08, 0.14 + (i % 3) * 0.04, 'rubble', { ao: 0.2, pal: '#8a877c' }); }
  return sc.finish();
};
