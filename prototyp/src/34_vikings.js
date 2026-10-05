/* ====================== WIKINGOWIE: ciemne drewno, darń na dachach, tarcze, smocze łby ====================== */

/* smocze zwieńczenie szczytu: skrzyżowane belki z rzeźbionymi łbami */
function dragonEnd(sc, x, y, z, d = 1) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.lineCap = 'round';
  for (const s2 of [1, -1]) {
    g.strokeStyle = '#1c1008'; g.lineWidth = 7 * f; g.beginPath(); g.moveTo(px - 3 * s2 * f * d, py + 8 * f); g.lineTo(px + 14 * s2 * f * d, py - 30 * f); g.stroke();
    g.strokeStyle = '#4a301a'; g.lineWidth = 4.6 * f; g.stroke();
    const hx = px + 14 * s2 * f * d, hy = py - 30 * f;
    g.fillStyle = '#4a301a'; g.strokeStyle = '#1c1008'; g.lineWidth = 1.3 * f; g.beginPath(); g.moveTo(hx - 2 * f, hy + 4 * f); g.quadraticCurveTo(hx - 5 * f, hy - 6 * f, hx + 1 * f * s2, hy - 8 * f); g.lineTo(hx + 9 * f * s2, hy - 5 * f); g.lineTo(hx + 6 * f * s2, hy - 2 * f); g.lineTo(hx + 9 * f * s2, hy + 1 * f); g.lineTo(hx + 3 * f * s2, hy + 1 * f); g.quadraticCurveTo(hx + 2 * f * s2, hy + 5 * f, hx, hy + 5 * f); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(hx + 2.4 * f * s2, hy - 3 * f, 1.1 * f, 0, TAU); g.fill();
  }
}
/* suszarnia ryb: ramka z poprzeczką i rybami */
function fishRack(sc, x, y, n = 6) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, 0);
  g.strokeStyle = '#2a1c0c'; g.lineWidth = 3 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 24 * f, py + 2 * f); g.lineTo(px - 24 * f, py - 34 * f); g.moveTo(px + 24 * f, py + 2 * f); g.lineTo(px + 24 * f, py - 34 * f); g.moveTo(px - 26 * f, py - 30 * f); g.lineTo(px + 26 * f, py - 30 * f); g.stroke();
  for (let i = 0; i < n; i++) { const fx = px - 20 * f + i * 8 * f; g.fillStyle = i % 2 ? '#b8a890' : '#9a9a9c'; g.strokeStyle = 'rgba(20,14,8,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(fx, py - 20 * f, 2.6 * f, 8 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#d8d0c0'; g.beginPath(); g.moveTo(fx, py - 12 * f); g.lineTo(fx - 3 * f, py - 8 * f); g.lineTo(fx + 3 * f, py - 8 * f); g.closePath(); g.fill(); }
}

/* DŁUGI DOM 4×2: ciemne deski z tarczami, darniowy dach, smocze szczyty, otwór dymny */
BAKED.vikingHall = function () {
  const sc = sceneFor(4, 2, 2.7), x0 = -1.9, x1 = 1.9, y0 = -0.7, y1 = 0.7, zp = 0.1, zw = 1.3, rise = 0.82;
  sc.patch(0, 0.05, 2.5, 1.2, { seed: 33, pal: '#7a6540', alpha: 0.8 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - 0.22, y0 - 0.2, zw], [x1 + 0.22, y0 - 0.2, zw], [x1 + 0.22, y1 + 0.2, zw], [x0 - 0.22, y1 + 0.2, zw], [x0 - 0.22, 0, zw + rise], [x1 + 0.22, 0, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zp, x1, y1, zw, 'plank', { pal: '#52402c', ao: 0.3, eave: 0.45 });
  const S = wallS(x0, x1, y1, zw, zp), E = wallE(y0, y1, x1, zw, zp);
  door(sc, S.O, S.U, S.V, 1.65, 0.5, 0.8, { vb: zw - zp, arch: true, frame: '#1f1308', pal: '#3a2816', lintel: '#a8352b' });
  sc.local(S.O, S.U, S.V, (g) => { const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830']; for (let i = 0; i < 12; i++) { const u = 0.2 + i * 0.3 + (i >= 6 ? 0.5 : 0); if (Math.abs(u - 1.9) < 0.45) continue; shield(g, u, 0.28, 0.07, cols[i % 4]); } g.fillStyle = '#c9a85a'; g.fillRect(1.52, 0.04, 0.03, 0.9); g.fillRect(2.15, 0.04, 0.03, 0.9); });
  sc.local(E.O, E.U, E.V, (g) => { const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830']; for (let i = 0; i < 4; i++) shield(g, 0.2 + i * 0.3, 0.28, 0.07, cols[i % 4]); });
  for (const px of [1.55, 2.2]) sc.box(x0 + px - 0.05, y1, zp, x0 + px + 0.05, y1 + 0.1, zw, 'plank', { pal: '#6a3a1c', ao: 0.1, wear: 0.4 });
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov: 0.16, ovE: 0.2, mat: 'grass', pal: 'green', gableMat: 'plank', gablePal: '#52402c', ridge: 'x' });
  sc.face([x0 - 0.2, R.ySo, R.eaveZ], [x1 - x0 + 0.4, 0, 0], [0, 0, -0.1], 'dirt', { shade: 0.7, pal: '#4a3a22', edge: 0.45 });
  const g = sc.g, f = sc.F, a = sc.P(x0 - 0.2, 0, zw + rise), b = sc.P(x1 + 0.2, 0, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#1c1008'; g.lineWidth = 8 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#4a301a'; g.lineWidth = 4.6 * f; g.stroke();
  dragonEnd(sc, x1 + 0.2, 0, zw + rise, 1); dragonEnd(sc, x0 - 0.2, 0, zw + rise, -1);
  sc.box(-0.3, -0.18, zw + rise - 0.06, 0.3, 0.18, zw + rise + 0.24, 'plank', { ao: 0.2, pal: '#3a2a18' }); pyramidRoof(sc, { x0: -0.36, x1: 0.36, y0: -0.24, y1: 0.24, z: zw + rise + 0.24, rise: 0.2, mat: 'shingle', pal: '#3a2e24', ov: 0.01 });
  soot(sc, 0, 0.15, zw + rise - 0.15, 0.22, 0.45);
  logPile(sc, x1 + 0.3, 0.1); logPile(sc, x1 + 0.3, 0.3); logPile(sc, x1 + 0.3, -0.1); barrel(sc, -1.5, y1 + 0.2); barrel(sc, -1.3, y1 + 0.26, 0, 0.9); fishRack(sc, -0.5, y1 + 0.25, 7);
  const [rx, ry] = sc.P(0.5, y1 + 0.28, 0); g.strokeStyle = '#3a2814'; g.lineWidth = 2.6 * f; for (const dx of [-12, 0, 12]) { g.beginPath(); g.moveTo(rx + dx * f, ry); g.lineTo(rx + dx * f + 4 * f, ry - 40 * f); g.stroke(); g.fillStyle = '#cfd4d8'; g.beginPath(); g.moveTo(rx + dx * f + 4 * f, ry - 50 * f); g.lineTo(rx + dx * f + 8 * f, ry - 39 * f); g.lineTo(rx + dx * f, ry - 39 * f); g.closePath(); g.fill(); }
  return sc.finish();
};

/* CHATA 2×2: mały dom ze zrębu z darnią, suszarnią ryb i skórami */
BAKED.vikingHut = function () {
  const sc = sceneFor(2, 2, 2.5), x0 = -0.8, x1 = 0.8, y0 = -0.62, y1 = 0.5, zp = 0.1, zw = 1.2, rise = 0.78;
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 36, pal: '#7a6540', alpha: 0.8 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - 0.18, y0 - 0.1, zw], [x1 + 0.18, y0 - 0.1, zw], [x1 + 0.18, y1 + 0.1, zw], [x0 - 0.18, y1 + 0.1, zw], [x0 - 0.18, 0, zw + rise], [x1 + 0.18, 0, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zp, x1, y1, zw, 'log', { pal: '#7a5632', ao: 0.3, eave: 0.45 });
  const S = wallS(x0, x1, y1, zw, zp), E = wallE(y0, y1, x1, zw, zp);
  door(sc, S.O, S.U, S.V, 0.6, 0.42, 0.8, { vb: zw - zp, arch: false, frame: '#1f1308', pal: '#3a2816', lintel: '#a8352b' });
  windowAt(sc, S.O, S.U, S.V, 0.18, 0.34, 0.2, 0.22, { shutters: '#3a2816', dark: true }); windowAt(sc, E.O, E.U, E.V, 0.35, 0.3, 0.2, 0.22, { shutters: '#3a2816', dark: true });
  sc.local(S.O, S.U, S.V, (g) => { shield(g, 1.3, 0.2, 0.08, '#b8352b'); });
  const g = sc.g, f = sc.F;
  for (const [cx, cy] of [[x1, y1], [x0, y1]]) for (let i = 0; i < 8; i++) { const z = zp + 0.06 + i * 0.108, [px, py] = sc.P(cx, cy, z); g.fillStyle = i % 2 ? '#6a4a2a' : '#7a5632'; g.beginPath(); g.ellipse(px, py, 5 * f, 3.2 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = 1; g.stroke(); }
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov: 0.16, ovE: 0.18, mat: 'grass', pal: 'green', gableMat: 'log', gablePal: '#7a5632', ridge: 'x' });
  sc.face([x0 - 0.18, R.ySo, R.eaveZ], [x1 - x0 + 0.36, 0, 0], [0, 0, -0.09], 'dirt', { shade: 0.7, pal: '#4a3a22', edge: 0.45 });
  const a = sc.P(x0 - 0.18, 0, zw + rise), b = sc.P(x1 + 0.18, 0, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#1c1008'; g.lineWidth = 7.5 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#4a301a'; g.lineWidth = 4 * f; g.stroke();
  dragonEnd(sc, x1 + 0.18, 0, zw + rise, 1); dragonEnd(sc, x0 - 0.18, 0, zw + rise, -1);
  sc.box(0.1, -0.12, zw + rise - 0.05, 0.4, 0.12, zw + rise + 0.2, 'plank', { ao: 0.2, pal: '#3a2a18' }); soot(sc, 0.25, 0.1, zw + rise - 0.1, 0.16, 0.4);
  fishRack(sc, 0.5, y1 + 0.3, 6);
  const [hx, hy] = sc.P(-0.55, y1 + 0.3, 0); g.strokeStyle = '#2a1c0c'; g.lineWidth = 3 * f; g.beginPath(); g.moveTo(hx - 14 * f, hy); g.lineTo(hx - 14 * f, hy - 34 * f); g.moveTo(hx + 14 * f, hy); g.lineTo(hx + 14 * f, hy - 34 * f); g.moveTo(hx - 16 * f, hy - 32 * f); g.lineTo(hx + 16 * f, hy - 32 * f); g.moveTo(hx - 16 * f, hy - 6 * f); g.lineTo(hx + 16 * f, hy - 6 * f); g.stroke();
  g.fillStyle = '#c8a878'; g.strokeStyle = 'rgba(40,24,10,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(hx - 12 * f, hy - 30 * f); g.lineTo(hx + 12 * f, hy - 30 * f); g.lineTo(hx + 10 * f, hy - 8 * f); g.lineTo(hx - 10 * f, hy - 8 * f); g.closePath(); g.fill(); g.stroke();
  logPile(sc, x1 + 0.3, 0.0); logPile(sc, x1 + 0.3, 0.2); barrel(sc, -0.1, y1 + 0.22);
  return sc.finish();
};

/* PRZYSTAŃ 4×2: pomost na palach z szopą na łodzie, polerami, sieciami i żurawikiem */
BAKED.vikingDock = function () {
  const sc = sceneFor(4, 2, 2.2), px0 = -0.75, px1 = 1.95, py0 = -0.42, py1 = 0.42, zd = 0.34;
  sc.shadow([[px0, py0, 0], [px1, py0, 0], [px1, py1, 0], [px0, py1, 0], [px1, 0, 1.2]], { alpha: 0.35, blur: 8 });
  // szopa na łodzie na brzegu (zachodni koniec)
  const bx0 = -1.9, bx1 = -0.85, by0 = -0.8, by1 = 0.8, zp = 0.1, zw = 0.9, rise = 0.7;
  sc.patch(-1.3, 0, 1.1, 1.3, { seed: 44, pal: '#7a6540', alpha: 0.8 });
  sc.shadow([[bx0, by0, 0], [bx1, by0, 0], [bx1, by1, 0], [bx0, by1, 0], [bx0 - 0.1, by0 - 0.1, zw + 0.4], [bx1 + 0.2, by1 + 0.1, zw + 0.4], [bx0 - 0.1, 0, zw + rise]]);
  sc.box(bx0, by0, zp, bx1, by1, zw, 'plank', { pal: '#52402c', ao: 0.3, eave: 0.4 });
  const BS = wallS(bx0, bx1, by1, zw, zp), BE = wallE(by0, by1, bx1, zw, zp);
  door(sc, BE.O, BE.U, BE.V, 0.3, 1.0, 0.72, { vb: zw - zp, arch: false, frame: '#1f1308', pal: '#3a2816', lintel: '#a8352b' });
  door(sc, BS.O, BS.U, BS.V, 0.25, 0.5, 0.62, { vb: zw - zp, arch: false, frame: '#1f1308', pal: '#3a2816' });
  sc.local(BS.O, BS.U, BS.V, (g) => { shield(g, 0.9, 0.2, 0.07, '#2f5aa8'); });
  const R = gableRoof(sc, { x0: bx0, x1: bx1, y0: by0, y1: by1, z: zw, rise, ov: 0.14, ovE: 0.14, mat: 'grass', pal: 'green', gableMat: 'plank', gablePal: '#52402c', ridge: 'y' });
  dragonEnd(sc, (bx0 + bx1) / 2, by1 + 0.14, zw + rise, 1);
  // pomost: pale, deski, poręcz z polerów
  const posts = []; for (let i = 0; i < 6; i++) for (const y of [py0 + 0.08, py1 - 0.08]) posts.push([px0 + 0.15 + i * (px1 - px0 - 0.3) / 5, y]);
  posts.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [x, y] of posts) sc.cyl(x, y, -0.2, zd + 0.02, 0.07, { mat: 'log', pal: '#4a3826', topMat: 'plank', ao: 0.3 });
  sc.box(px0, py0, zd - 0.05, px1, py1, zd, 'plank', { pal: '#8a6a40', ao: 0.4, eave: 0.4 });
  const g = sc.g, f = sc.F;
  for (let i = 0; i < 4; i++) sc.cyl(px0 + 0.3 + i * 0.85, py1 - 0.06, zd, zd + 0.22, 0.06, { mat: 'log', pal: '#3a2a18', topMat: 'plank', ao: 0.2 });
  const [rx, ry] = sc.P(px0 + 0.7, py1 - 0.1, zd + 0.02); g.strokeStyle = '#d8c090'; g.lineWidth = 2.6 * f; g.beginPath(); g.ellipse(rx, ry, 9 * f, 4 * f, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(rx, ry - 1.4 * f, 7 * f, 3 * f, 0, 0, TAU); g.stroke();
  barrel(sc, px0 + 1.2, -0.05, zd, 0.8); barrel(sc, px0 + 1.4, 0.1, zd, 0.8); crate(sc, px0 + 1.9, -0.1, 0.22, 0.22); sc.box(px0 + 1.86, -0.12, zd + 0.22, px0 + 2.1, 0.12, zd + 0.38, 'plank', { pal: '#7a5a36', ao: 0.2 });
  // żurawik z liną i beczką, latarnia
  sc.box(px1 - 0.2, -0.04, zd, px1 - 0.12, 0.04, zd + 1.15, 'log', { pal: '#4a3826', ao: 0.1 }); sc.box(px1 - 0.55, -0.04, zd + 1.05, px1 - 0.12, 0.04, zd + 1.15, 'log', { pal: '#4a3826', ao: 0.1 });
  const [cx, cy] = sc.P(px1 - 0.55, 0, zd + 1.05); g.strokeStyle = '#d8c090'; g.lineWidth = 1.6 * f; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + 40 * f); g.stroke();
  barrel(sc, px1 - 0.55, 0, zd + 0.1, 0.6); lantern(sc, px1 - 0.16, 0, zd + 1.1);
  // sieć rozpięta na ramie
  const [nx, ny] = sc.P(0.7, py1 - 0.02, zd); g.strokeStyle = '#2a1c0c'; g.lineWidth = 2.6 * f; g.beginPath(); g.moveTo(nx - 30 * f, ny); g.lineTo(nx - 30 * f, ny - 40 * f); g.moveTo(nx + 30 * f, ny); g.lineTo(nx + 30 * f, ny - 40 * f); g.moveTo(nx - 32 * f, ny - 38 * f); g.lineTo(nx + 32 * f, ny - 38 * f); g.stroke();
  g.strokeStyle = 'rgba(214,200,160,0.7)'; g.lineWidth = f; for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(nx - 30 * f + i * 6 * f, ny - 38 * f); g.lineTo(nx - 30 * f + i * 6 * f + (i % 2 ? 2 : -2) * f, ny - 6 * f); g.stroke(); } for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(nx - 30 * f, ny - 38 * f + j * 6 * f); g.lineTo(nx + 30 * f, ny - 38 * f + j * 6 * f); g.stroke(); }
  return sc.finish();
};

/* MIODOSYTNIA 2×3: warzelnia z szopą i podwórzem z beczkami, kadziami i kotłem */
BAKED.vikingMead = function () {
  const sc = sceneFor(2, 3, 2.4), x0 = -0.92, x1 = 0.92, y0 = -1.42, y1 = -0.1, zp = 0.1, zw = 0.98, rise = 0.62, ym = (y0 + y1) / 2;
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 55, pal: '#7a6540', alpha: 0.8 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - 0.12, y0 - 0.1, zw], [x1 + 0.12, y1 + 0.1, zw], [x0 - 0.12, ym, zw + rise], [x1 + 0.12, ym, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zp, x1, y1, zw, 'plank', { pal: '#52402c', ao: 0.3, eave: 0.45 });
  const S = wallS(x0, x1, y1, zw, zp), E = wallE(y0, y1, x1, zw, zp);
  door(sc, S.O, S.U, S.V, 0.7, 0.44, 0.74, { vb: zw - zp, arch: false, frame: '#1f1308', pal: '#3a2816', lintel: '#d8a830' });
  windowAt(sc, S.O, S.U, S.V, 0.2, 0.3, 0.2, 0.22, { shutters: '#3a2816', dark: true }); windowAt(sc, S.O, S.U, S.V, 1.4, 0.3, 0.2, 0.22, { shutters: '#3a2816', dark: true });
  sc.local(E.O, E.U, E.V, (g) => { shield(g, 0.3, 0.25, 0.07, '#d8a830'); shield(g, 0.6, 0.25, 0.07, '#b8352b'); shield(g, 0.9, 0.25, 0.07, '#e8d8a0'); });
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov: 0.14, ovE: 0.16, mat: 'shingle', pal: '#4a3a2e', gableMat: 'plank', gablePal: '#52402c', ridge: 'x' });
  const g = sc.g, f = sc.F;
  dragonEnd(sc, x1 + 0.16, ym, zw + rise, 1);
  sc.box(0.2, ym - 0.16, zw + rise - 0.05, 0.6, ym + 0.16, zw + rise + 0.26, 'plank', { ao: 0.2, pal: '#3a2a18' }); pyramidRoof(sc, { x0: 0.14, x1: 0.66, y0: ym - 0.22, y1: ym + 0.22, z: zw + rise + 0.26, rise: 0.2, mat: 'shingle', pal: '#3a2e24', ov: 0.01 }); soot(sc, 0.4, ym + 0.16, zw + rise - 0.1, 0.2, 0.45);
  // kadzie i beczki na podwórzu
  const vat = (x, y, r, h) => { sc.cyl(x, y, 0.04, h, r, { mat: 'plank', pal: '#7a5632', topMat: 'plank', topPal: '#6a4626', ao: 0.4 }); const [px, py] = sc.P(x, y, 0.04 + h * 0.25), [, py2] = sc.P(x, y, 0.04 + h * 0.75), rx = r * AX * f * 1.4142; g.strokeStyle = '#2a2420'; g.lineWidth = 2.4 * f; for (const yy of [py, py2]) { g.beginPath(); g.ellipse(px, yy, rx, rx / 2, 0, 0, Math.PI); g.stroke(); } const [tx, ty] = sc.P(x, y, 0.04 + h); g.fillStyle = 'rgba(214,160,60,0.9)'; g.beginPath(); g.ellipse(tx, ty, rx * 0.8, rx * 0.4, 0, 0, TAU); g.fill(); };
  vat(-0.6, 0.35, 0.3, 0.6); vat(0.05, 0.6, 0.27, 0.52); vat(0.65, 0.35, 0.3, 0.6);
  const cask = (x, y) => { const [px, py] = sc.P(x, y, 0); g.fillStyle = 'rgba(14,22,8,0.3)'; g.beginPath(); g.ellipse(px + 3 * f, py + 1 * f, 16 * f, 5 * f, 0, 0, TAU); g.fill(); g.fillStyle = '#84603a'; g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 1.2 * f; g.beginPath(); g.ellipse(px, py - 10 * f, 14 * f, 10 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#6a4626'; g.beginPath(); g.ellipse(px + 11 * f, py - 10 * f, 3.4 * f, 8.6 * f, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#2a2420'; g.lineWidth = 2 * f; for (const dx of [-5, 3]) { g.beginPath(); g.ellipse(px + dx * f, py - 10 * f, 3 * f, 9.6 * f, 0, 0, TAU); g.stroke(); } };
  cask(-0.7, 1.2); cask(-0.3, 1.3); cask(0.4, 1.25);
  sc.cyl(0.7, 1.0, 0.04, 0.34, 0.2, { color: [190, 112, 56], ao: 0.3 }); const [kx, ky] = sc.P(0.7, 1.0, 0.34); g.fillStyle = '#d98a3a'; g.beginPath(); g.ellipse(kx, ky, 0.18 * AX * f * 1.4142, 0.18 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,200,0.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(kx + (i - 1.5) * 6 * f, ky - (8 + i * 6) * f, (5 + i * 2) * f, 4 * f, 0, 0, TAU); g.fill(); }
  const [fx, fy] = sc.P(0.7, 1.0, 0.04); for (let i = 0; i < 4; i++) { const gr = g.createRadialGradient(fx + (i - 1.5) * 6 * f, fy - 2 * f, 0, fx + (i - 1.5) * 6 * f, fy - 2 * f, 10 * f); gr.addColorStop(0, 'rgba(255,230,120,0.9)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(fx + (i - 1.5) * 6 * f, fy - 4 * f, 6 * f, 10 * f, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 6; i++) sc.cyl(-0.85 + i * 0.1, 1.38, 0, 0.14, 0.04, { color: [196, 150, 70], ao: 0 });
  // szyld z rogiem do picia nad drzwiami
  const [sx, sy] = sc.P(0.9, y1 + 0.04, zw - 0.15); g.strokeStyle = '#2a2018'; g.lineWidth = 2 * f; g.beginPath(); g.moveTo(sx - 14 * f, sy); g.lineTo(sx + 8 * f, sy); g.stroke(); g.fillStyle = '#e8d8a0'; g.strokeStyle = '#2a2018'; g.lineWidth = 1.2 * f; g.beginPath(); g.moveTo(sx - 4 * f, sy + 4 * f); g.quadraticCurveTo(sx + 4 * f, sy + 4 * f, sx + 8 * f, sy + 16 * f); g.lineTo(sx + 4 * f, sy + 16 * f); g.quadraticCurveTo(sx - 2 * f, sy + 10 * f, sx - 4 * f, sy + 4 * f); g.closePath(); g.fill(); g.stroke();
  return sc.finish();
};

/* OKRĘT: smoczy okręt (jednostka, bez obrysu w polach) — kołysze się na wodzie */
BAKED.longship = function () {
  const sc = new Scene(460, 300, 230, 205, { F: 1.3 }), g = sc.g, f = sc.F, H = 0.92, W = 0.2, N = 30;
  const hw = x => W * (1 - Math.pow(Math.abs(x) / H, 2.6)) + 0.012, zt = x => 0.15 + 0.22 * Math.pow(Math.abs(x) / H, 3.2), zb = x => 0.0 + 0.1 * Math.pow(Math.abs(x) / H, 1.4);
  const xs = Array.from({ length: N + 1 }, (_, i) => -H + 2 * H * i / N), rev = xs.slice().reverse();
  const poly = pts => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); };
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = sc.P(x, hw(x) + 0.06, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = sc.P(x, -hw(x) - 0.06, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(238,252,255,0.6)', 9);
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = sc.P(x + 0.22, hw(x) + 0.1, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = sc.P(x + 0.22, -hw(x) + 0.1, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(6,34,52,0.42)', 10);
  poly([...xs.map(x => sc.P(x, -hw(x), zt(x))), ...rev.map(x => sc.P(x, -hw(x) * 0.78, zt(x) - 0.13))]); g.fillStyle = '#4a3220'; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.7)'; g.stroke();
  poly([...xs.map(x => sc.P(x, -hw(x) * 0.8, zt(x) - 0.1)), ...rev.map(x => sc.P(x, hw(x) * 0.8, zt(x) - 0.1))]);
  const dg = g.createLinearGradient(...sc.P(0, -0.2, 0.1), ...sc.P(0, 0.2, 0.1)); dg.addColorStop(0, '#7a5a34'); dg.addColorStop(1, '#a98450'); g.fillStyle = dg; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,24,10,0.55)'; g.lineWidth = 1; for (let i = -7; i <= 7; i++) { const x = i * 0.11; g.beginPath(); g.moveTo(...sc.P(x, -hw(x) * 0.78, zt(x) - 0.1)); g.lineTo(...sc.P(x, hw(x) * 0.78, zt(x) - 0.1)); g.stroke(); }
  g.lineCap = 'round'; g.strokeStyle = '#4a301a'; g.lineWidth = 4 * f; g.beginPath(); g.moveTo(...sc.P(0, 0, zt(0) - 0.1)); g.lineTo(...sc.P(0, 0, 1.0)); g.stroke();
  const sails = 8, sy0 = 0.93, sy1 = 0.36, swd = 0.34;
  for (let i = 0; i < sails; i++) {
    const a = -swd + 2 * swd * i / sails, b = -swd + 2 * swd * (i + 1) / sails, bulge = t => 0.04 * Math.sin(Math.PI * (t + 1) / 2);
    poly([sc.P(bulge(a / swd), a, sy0), sc.P(bulge(b / swd), b, sy0), sc.P(bulge(b / swd) * 0.7, b, sy1), sc.P(bulge(a / swd) * 0.7, a, sy1)]);
    g.fillStyle = i % 2 ? '#efe4c6' : '#b8352b'; g.fill(); g.strokeStyle = 'rgba(40,20,10,0.4)'; g.lineWidth = 0.8; g.stroke();
  }
  const shade = g.createLinearGradient(...sc.P(0, -swd, 0.9), ...sc.P(0, swd, 0.4)); shade.addColorStop(0, 'rgba(255,240,200,0.16)'); shade.addColorStop(1, 'rgba(0,0,30,0.3)');
  poly([sc.P(0, -swd, sy0), sc.P(0, swd, sy0), sc.P(0, swd, sy1), sc.P(0, -swd, sy1)]); g.fillStyle = shade; g.fill();
  g.strokeStyle = '#3a2614'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(...sc.P(0, -swd - 0.03, sy0 + 0.01)); g.lineTo(...sc.P(0, swd + 0.03, sy0 + 0.01)); g.stroke();
  const strakes = 6;
  for (let k = 0; k < strakes; k++) {
    const a = k / strakes, b = (k + 1) / strakes;
    poly([...xs.map(x => sc.P(x, hw(x) * (1 - a * 0.28), lerp(zt(x), zb(x), a))), ...rev.map(x => sc.P(x, hw(x) * (1 - b * 0.28), lerp(zt(x), zb(x), b)))]);
    const gr = g.createLinearGradient(...sc.P(0, 0, zt(0)), ...sc.P(0, 0, zb(0)));
    const base = k === 0 ? [184, 53, 43] : (k % 2 ? [112, 78, 46] : [138, 98, 56]); gr.addColorStop(0, css(scaleC(base, 1.2))); gr.addColorStop(1, css(scaleC(base, 0.72)));
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.75)'; g.lineWidth = 1; g.stroke();
  }
  const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830'];
  for (let i = 0; i < 11; i++) { const x = -0.62 + i * 0.124, [px, py] = sc.P(x, hw(x), zt(x) - 0.045); g.fillStyle = cols[i % 4]; g.beginPath(); g.ellipse(px, py, 8 * f, 7.5 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(px, py, 2.4 * f, 0, TAU); g.fill(); }
  const stem = (x, d, hgt, head) => {
    const a = sc.P(x, 0, zt(x) - 0.04), b = sc.P(x + 0.07 * d, 0, zt(x) + hgt * 0.55), c = sc.P(x + 0.02 * d, 0, zt(x) + hgt);
    g.strokeStyle = '#3a2614'; g.lineWidth = 6 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]); g.stroke();
    g.strokeStyle = '#8a6238'; g.lineWidth = 2.6 * f; g.stroke();
    g.save(); g.translate(c[0], c[1]); g.scale(f, f);
    if (head) { g.fillStyle = '#7a5230'; g.strokeStyle = 'rgba(20,10,4,0.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, 4); g.quadraticCurveTo(-4, -12, 4, -14); g.lineTo(16, -8); g.lineTo(8, -4); g.lineTo(12, 2); g.lineTo(2, 4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f0e8c8'; g.beginPath(); g.arc(5, -7, 1.8, 0, TAU); g.fill(); g.fillStyle = '#b8352b'; g.beginPath(); g.arc(5, -7, 0.8, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#3a2614'; g.lineWidth = 3; g.beginPath(); g.arc(-3, -1, 4, 0, Math.PI * 1.5); g.stroke(); }
    g.restore();
  };
  stem(-H, -1, 0.28, false); stem(H, 1, 0.34, true);
  return sc.finish({ grain: 0.5 });
};
