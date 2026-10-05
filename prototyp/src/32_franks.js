/* ====================== FRANKOWIE: kamień, ryglówka, dachówka, łupek ====================== */

/* DOM 2×2: parter z kamienia, piętro z ryglówki z nawisem, dach dachówkowy szczytem do ulicy, komin, szyld */
BAKED.frankHouse = function () {
  const sc = sceneFor(2, 2, 2.95), x0 = -0.82, x1 = 0.82, y0 = -0.8, y1 = 0.8, zp = 0.1, z1 = 0.95, z2 = 1.75, J = 0.1, rise = 0.85;
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 8, alpha: 0.7 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - J - 0.1, y1 + J, z2], [x1 + J + 0.1, y1 + J, z2], [x1 + J + 0.1, y0 - J, z2], [x0 - J - 0.1, y0 - J, z2], [0, y0 - 0.1, z2 + rise], [0, y1 + 0.1, z2 + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'stone', { ao: 0.4 });
  sc.box(x0, y0, zp, x1, y1, z1, 'stone', { ao: 0.3, eave: 0.55 });
  const S1 = wallS(x0, x1, y1, z1, zp), E1 = wallE(y0, y1, x1, z1, zp);
  door(sc, S1.O, S1.U, S1.V, 0.63, 0.38, 0.68, { vb: z1 - zp, arch: true, frame: '#241a10', pal: '#5a3e22' });
  for (const u of [0.14, 1.28]) windowAt(sc, S1.O, S1.U, S1.V, u, 0.22, 0.2, 0.28, { shutters: '#7a2f22', frame: '#3b2616', sill: '#8d897d' });
  for (const u of [0.3, 1.1]) windowAt(sc, E1.O, E1.U, E1.V, u, 0.22, 0.2, 0.28, { shutters: '#7a2f22', frame: '#3b2616', sill: '#8d897d' });
  stairs(sc, -0.4, 0.4, y1, 3, 0.17, 'stone', 0.14);
  sc.box(x0 - J, y0 - J, z1, x1 + J, y1 + J, z2, 'plaster', { ao: 0.15, eave: 0.3, pal: '#eadfc2' });
  const S2 = wallS(x0 - J, x1 + J, y1 + J, z2, z1), E2 = wallE(y0 - J, y1 + J, x1 + J, z2, z1);
  halfTimber(sc, S2.O, S2.U, S2.V, { nu: 4 }); halfTimber(sc, E2.O, E2.U, E2.V, { nu: 4 });
  [0.13, 0.59, 1.05, 1.51].forEach((u, i) => { windowAt(sc, S2.O, S2.U, S2.V, u, 0.2, 0.2, 0.34, { shutters: i % 2 ? '#2f6a50' : '#7a2f22', frame: '#3b2616' }); if (i % 2 === 0) flowerBox(sc, S2.O, S2.U, S2.V, u, 0.57, 0.2); });
  [0.125, 0.575, 1.025, 1.475].forEach((u, i) => windowAt(sc, E2.O, E2.U, E2.V, u, 0.2, 0.2, 0.34, { shutters: i % 2 ? '#2f6a50' : '#7a2f22', frame: '#3b2616' }));
  for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.36; sc.local(S2.O, S2.U, S2.V, g => { g.fillStyle = '#3b2616'; g.beginPath(); g.moveTo(u, 0.86); g.lineTo(u + 0.05, 0.86); g.lineTo(u + 0.025, 0.95); g.closePath(); g.fill(); }); }   // konsole nawisu
  const R = gableRoof(sc, { x0: x0 - J, x1: x1 + J, y0: y0 - J, y1: y1 + J, z: z2, rise, ov: 0.12, ovE: 0.1, mat: 'tiles', pal: '#b5532e', gableMat: 'plaster', gablePal: '#eadfc2', ridge: 'y' });
  const G = { O: [x0 - J, y1 + J, z2 + rise], U: [x1 - x0 + 2 * J, 0, 0], V: [0, 0, -rise] };
  sc.local(G.O, G.U, G.V, (g, lu, lv) => {
    g.save(); g.beginPath(); g.moveTo(lu / 2, 0); g.lineTo(lu, lv); g.lineTo(0, lv); g.closePath(); g.clip();
    g.fillStyle = '#3b2616'; g.fillRect(lu / 2 - 0.016, 0, 0.032, lv); g.fillRect(0, lv * 0.62, lu, 0.03);
    g.strokeStyle = '#3b2616'; g.lineWidth = 0.03; g.beginPath(); g.moveTo(lu * 0.5, lv * 0.62); g.lineTo(lu * 0.12, lv); g.moveTo(lu * 0.5, lv * 0.62); g.lineTo(lu * 0.88, lv); g.stroke(); g.restore();
  });
  windowAt(sc, G.O, G.U, G.V, lu2(G.U) / 2 - 0.1, 0.22, 0.2, 0.26, { frame: '#3b2616', shutters: '#7a2f22' });
  chimney(sc, 0.4, -0.3, 2.1, 2.9, 0.28); soot(sc, 0.4, -0.3, 2.15, 0.2, 0.45);
  signBoard(sc, x0 - J + 0.05, y1 + J + 0.02, z1 + 0.42, 'loaf'); lantern(sc, 0.52, y1 + 0.05, 0.66);
  barrel(sc, 0.66, y1 + 0.24); crate(sc, -0.66, y1 + 0.2, 0.2, 0.2); crate(sc, -0.62, y1 + 0.2, 0.14, 0.34 - 0.2 + 0.2); logPile(sc, x1 + 0.26, 0.15);
  return sc.finish();
};
const lu2 = U => Math.hypot(...U);

/* KOŚCIÓŁ 4×2: nawa z przyporami i witrażami, wieża z dzwonnicą i smukłą iglicą */
BAKED.frankChurch = function () {
  const sc = sceneFor(4, 2, 5.5), nx0 = -1.9, nx1 = 0.9, ny0 = -0.58, ny1 = 0.58, zp = 0.1, zw = 1.5;
  sc.patch(0, 0.1, 2.3, 1.2, { seed: 61, alpha: 0.6 });
  sc.shadow([[nx0, ny0, 0], [1.95, ny0, 0], [1.95, 0.55, 0], [nx0, ny1, 0], [nx0 - 0.1, ny0 - 0.1, zw + 0.8], [nx1, ny1 + 0.1, zw + 0.8], [1.5, 0, 4.9], [1.0, 0.5, 3.4], [1.9, 0.5, 3.4]]);
  sc.contact(nx0, ny0, 1.95, ny1);
  sc.box(nx0 - 0.03, ny0 - 0.03, 0, nx1 + 0.03, ny1 + 0.03, zp, 'stone', { ao: 0.4 });
  sc.box(nx0, ny0, zp, nx1, ny1, zw, 'stone', { ao: 0.3, pal: '#b8b2a2', eave: 0.4 });
  const S = wallS(nx0, nx1, ny1, zw, zp), len = nx1 - nx0, bays = 4, bw = len / bays;
  for (let i = 0; i <= bays; i++) { const xb = nx0 + i * bw; sc.box(xb - 0.07, ny1, zp, xb + 0.07, ny1 + 0.17, zw - 0.14, 'stone', { ao: 0.25, pal: '#b0aa9a' }); sc.box(xb - 0.05, ny1, zw - 0.14, xb + 0.05, ny1 + 0.11, zw - 0.04, 'stone', { ao: 0.1, pal: '#b0aa9a' }); }
  for (let i = 0; i < bays; i++) glassWin(sc, S.O, S.U, S.V, i * bw + bw / 2 - 0.12, 0.3, 0.24, 0.78, { frame: '#8d897d', glass: i % 2 ? ['#3c62a8', '#2f7a58', '#d8a830', '#4a7ac0'] : ['#a8342c', '#3c62a8', '#d8a830', '#7a3a8a'] });
  gableRoof(sc, { x0: nx0, x1: nx1, y0: ny0, y1: ny1, z: zw, rise: 0.82, ov: 0.13, ovE: 0.07, mat: 'slate', pal: '#5e6a78', gableMat: 'stone', gablePal: '#b0aa9a', ridge: 'x' });
  // wieża
  const tx0 = 0.9, tx1 = 1.95, ty0 = -0.52, ty1 = 0.52, zt = 2.75, zb = 3.5;
  sc.box(tx0, ty0, zp - 0.05, tx1 + 0.03, ty1 + 0.03, 0.2, 'stone', { ao: 0.4, pal: '#a8a292' });
  sc.box(tx0 + 0.02, ty0 + 0.02, 0.2, tx1, ty1, zt, 'stone', { ao: 0.3, pal: '#aea898', eave: 0.2 });
  sc.box(tx0 - 0.02, ty0 - 0.02, 1.6, tx1 + 0.03, ty1 + 0.03, 1.66, 'stone', { ao: 0, pal: '#9a9486' });          // gzyms
  sc.box(tx0 - 0.02, ty0 - 0.02, zt - 0.06, tx1 + 0.04, ty1 + 0.04, zt + 0.03, 'stone', { ao: 0, pal: '#9a9486' });
  const TS = wallS(tx0 + 0.02, tx1, ty1, zt, 0.2), TE = wallE(ty0 + 0.02, ty1, tx1, zt, 0.2);
  door(sc, TE.O, TE.U, TE.V, 0.31, 0.4, 0.86, { vb: zt - 0.2, arch: true, frame: '#8d897d', pal: '#4a3420' });
  sc.local(TE.O, TE.U, TE.V, (g) => { const cx = 0.5, cy = 1.05; g.fillStyle = '#8d897d'; g.beginPath(); g.arc(cx, cy, 0.2, 0, TAU); g.fill(); const cols = ['#a8342c', '#3c62a8', '#d8a830', '#2f7a58']; for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 0.165, i * TAU / 8, (i + 1) * TAU / 8); g.closePath(); g.fill(); } g.strokeStyle = 'rgba(14,14,20,0.8)'; g.lineWidth = 0.01; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(i * TAU / 8) * 0.165, cy + Math.sin(i * TAU / 8) * 0.165); g.stroke(); } g.beginPath(); g.arc(cx, cy, 0.165, 0, TAU); g.stroke(); });
  for (const v0 of [0.55, 1.45]) glassWin(sc, TS.O, TS.U, TS.V, 0.4, v0, 0.2, 0.55, { frame: '#8d897d' });
  sc.local(TS.O, TS.U, TS.V, (g) => { g.fillStyle = '#d8c890'; g.strokeStyle = '#2a2418'; g.lineWidth = 0.012; g.beginPath(); g.arc(0.82, 0.42, 0.12, 0, TAU); g.fill(); g.stroke(); g.lineWidth = 0.014; g.beginPath(); g.moveTo(0.82, 0.42); g.lineTo(0.82, 0.34); g.moveTo(0.82, 0.42); g.lineTo(0.88, 0.44); g.stroke(); });   // zegar
  sc.box(tx0 + 0.07, ty0 + 0.07, zt, tx1 - 0.07, ty1 - 0.07, zb, 'stone', { ao: 0.2, pal: '#b6b0a0' });                // dzwonnica
  const BS = wallS(tx0 + 0.07, tx1 - 0.07, ty1 - 0.07, zb, zt), BE = wallE(ty0 + 0.07, ty1 - 0.07, tx1 - 0.07, zb, zt);
  for (const u of [0.1, 0.5]) { archWin(sc, BS.O, BS.U, BS.V, u, 0.12, 0.26, 0.52, { frame: '#8d897d', lit: '#17120d', lit2: '#0c0906' }); }
  for (const u of [0.12, 0.5]) { archWin(sc, BE.O, BE.U, BE.V, u, 0.12, 0.26, 0.52, { frame: '#8d897d', lit: '#17120d', lit2: '#0c0906' }); }
  for (const W of [BS, BE]) sc.local(W.O, W.U, W.V, (g) => { g.strokeStyle = 'rgba(120,96,64,0.8)'; g.lineWidth = 0.012; for (const u of W === BS ? [0.1, 0.5] : [0.12, 0.5]) for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(u + 0.02, 0.22 + j * 0.095); g.lineTo(u + 0.24, 0.22 + j * 0.095 - 0.03); g.stroke(); } });
  for (const [px, py] of [[tx0 + 0.04, ty0 + 0.04], [tx1 - 0.04, ty0 + 0.04], [tx0 + 0.04, ty1 - 0.04], [tx1 - 0.04, ty1 - 0.04]]) { sc.box(px - 0.05, py - 0.05, zb - 0.02, px + 0.05, py + 0.05, zb + 0.25, 'stone', { ao: 0.1 }); pyramidRoof(sc, { x0: px - 0.05, x1: px + 0.05, y0: py - 0.05, y1: py + 0.05, z: zb + 0.25, rise: 0.22, mat: 'slate', pal: '#5e6a78', ov: 0.01 }); }
  pyramidRoof(sc, { x0: tx0 + 0.04, x1: tx1 - 0.04, y0: ty0 + 0.04, y1: ty1 - 0.04, z: zb, rise: 1.5, mat: 'slate', pal: '#586470', ov: 0.05 });
  const g = sc.g, [cx, cy] = sc.P((tx0 + tx1) / 2, 0, zb + 1.5), f = sc.F;
  g.strokeStyle = '#d8b44a'; g.lineWidth = 2.6 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 22 * f); g.moveTo(cx - 6 * f, cy - 15 * f); g.lineTo(cx + 6 * f, cy - 15 * f); g.stroke();
  // dziedziniec z nagrobkami i niski mur
  sc.box(-1.95, 0.9, 0, -0.35, 0.97, 0.26, 'stone', { ao: 0.25 }); sc.box(-0.05, 0.9, 0, 0.8, 0.97, 0.26, 'stone', { ao: 0.25 });
  [[-1.5, 0.76], [-1.1, 0.8], [-0.7, 0.76], [-0.35, 0.8], [0.3, 0.78]].forEach(([x, y], i) => { sc.box(x - 0.05, y - 0.02, 0, x + 0.05, y + 0.02, 0.2 + (i % 2) * 0.06, 'stone', { ao: 0.2, pal: '#a8a292' }); });
  return sc.finish();
};

/* MŁYN 3×3: kamienna wieża z czapą i skrzydłami + dom młynarza */
BAKED.frankMill = function () {
  const sc = sceneFor(3, 3, 3.9), cx = 0.4, cy = -0.5;
  sc.patch(0, 0.1, 1.9, 1.7, { seed: 71, alpha: 0.7 });
  sc.shadow([[cx - 0.6, cy - 0.6, 0], [cx + 0.6, cy - 0.6, 0], [cx + 0.6, cy + 0.6, 0], [cx - 0.6, cy + 0.6, 0], [cx - 0.5, cy - 0.5, 2.6], [cx + 0.5, cy + 0.5, 2.6], [cx + 0.5, cy - 0.5, 2.6], [cx - 0.5, cy + 0.5, 2.6]]);
  sc.shadowBox(-1.4, 0.25, -0.2, 1.4, 1.0, { alpha: 0.4 });
  sc.contact(cx - 0.8, cy - 0.8, cx + 0.8, cy + 0.8, { grow: 0.1 });
  // dom młynarza
  const hx0 = -1.4, hx1 = -0.25, hy0 = 0.25, hy1 = 1.4, zp = 0.1, zh = 1.05;
  sc.box(hx0, hy0, 0, hx1, hy1, zp, 'stone', { ao: 0.4 }); sc.box(hx0, hy0, zp, hx1, hy1, zh, 'plaster', { ao: 0.25, eave: 0.4, pal: '#e6dbbf' });
  const HS = wallS(hx0, hx1, hy1, zh, zp), HE = wallE(hy0, hy1, hx1, zh, zp);
  halfTimber(sc, HS.O, HS.U, HS.V, { nu: 3 }); halfTimber(sc, HE.O, HE.U, HE.V, { nu: 3 });
  door(sc, HS.O, HS.U, HS.V, 0.42, 0.3, 0.66, { vb: zh - zp, arch: false, frame: '#2b1c10', pal: '#5a3e22', lintel: '#3b2616' });
  windowAt(sc, HS.O, HS.U, HS.V, 0.85, 0.28, 0.16, 0.24, { shutters: '#7a2f22', frame: '#3b2616' });
  windowAt(sc, HE.O, HE.U, HE.V, 0.4, 0.28, 0.16, 0.24, { shutters: '#2f6a50', frame: '#3b2616' }); windowAt(sc, HE.O, HE.U, HE.V, 0.8, 0.28, 0.16, 0.24, { shutters: '#2f6a50', frame: '#3b2616' });
  gableRoof(sc, { x0: hx0, x1: hx1, y0: hy0, y1: hy1, z: zh, rise: 0.62, ov: 0.1, ovE: 0.08, mat: 'tiles', pal: '#a8502c', gableMat: 'plaster', gablePal: '#e6dbbf', ridge: 'y' });
  chimney(sc, -0.6, 0.55, 1.45, 1.95, 0.22); soot(sc, -0.6, 0.55, 1.5, 0.15, 0.4);
  // wieża
  sc.cyl(cx, cy, 0, 0.2, 0.9, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0.5 });
  sc.cyl(cx, cy, 0.2, 1.85, 0.78, { mat: 'stone', pal: '#bdb7a6', topMat: 'stone', ao: 0.5 });
  sc.cyl(cx, cy, 1.8, 1.92, 0.86, { mat: 'stone', pal: '#9a948a', ao: 0 });
  cone(sc, cx, cy, 1.92, 0.88, 1.0, [112, 78, 48]);
  const g = sc.g, f = sc.F, [fx, fy] = sc.P(cx + 0.55, cy + 0.55, 0);
  g.fillStyle = '#2b1c10'; g.beginPath(); g.moveTo(fx - 12 * f, fy + 3 * f); g.lineTo(fx - 12 * f, fy - 26 * f); g.arc(fx, fy - 26 * f, 12 * f, Math.PI, 0); g.lineTo(fx + 12 * f, fy + 3 * f); g.closePath(); g.fill();
  g.fillStyle = '#6a4a2c'; g.beginPath(); g.moveTo(fx - 9.5 * f, fy + 2 * f); g.lineTo(fx - 9.5 * f, fy - 25 * f); g.arc(fx, fy - 25 * f, 9.5 * f, Math.PI, 0); g.lineTo(fx + 9.5 * f, fy + 2 * f); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.7)'; g.lineWidth = f; for (const dx of [-3, 3]) { g.beginPath(); g.moveTo(fx + dx * f, fy + 2 * f); g.lineTo(fx + dx * f, fy - 34 * f); g.stroke(); }
  for (const [zz, ww] of [[0.95, 8], [1.4, 7]]) { const [wx, wy] = sc.P(cx + 0.5, cy + 0.5, zz); g.fillStyle = '#17120e'; g.beginPath(); g.moveTo(wx - ww * f, wy + 9 * f); g.lineTo(wx - ww * f, wy - 3 * f); g.arc(wx, wy - 3 * f, ww * f, Math.PI, 0); g.lineTo(wx + ww * f, wy + 9 * f); g.closePath(); g.fill(); g.strokeStyle = '#7a766c'; g.lineWidth = 1.4 * f; g.stroke(); }
  // worki, kamień młyński, wóz
  sack(sc, -0.1, 0.55, '#d8c898'); sack(sc, 0.12, 0.62, '#cdbb88'); sack(sc, -0.02, 0.72, '#d8c898'); sack(sc, 0.2, 0.84, '#cdbb88', 0.9);
  const [mx, my] = sc.P(0.75, 0.55, 0); g.fillStyle = '#9d9a90'; g.strokeStyle = 'rgba(14,12,10,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(mx, my - 14 * f, 15 * f, 17 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#3a3630'; g.beginPath(); g.ellipse(mx, my - 14 * f, 4.4 * f, 5.4 * f, 0, 0, TAU); g.fill();
  sc.box(0.9, 0.7, 0.14, 1.45, 1.1, 0.2, 'plank', { pal: '#7a5632', ao: 0.4 });
  for (const [wx, wy] of [[1.0, 1.14], [1.4, 1.14]]) { const [px, py] = sc.P(wx, wy, 0.16); g.fillStyle = '#4a3322'; g.beginPath(); g.ellipse(px, py, 8 * f, 15 * f, 0, 0, TAU); g.fill(); g.fillStyle = '#7a5632'; g.beginPath(); g.ellipse(px, py, 5.6 * f, 12 * f, 0, 0, TAU); g.fill(); g.strokeStyle = '#2b1c10'; g.lineWidth = f; g.stroke(); }
  sack(sc, 1.0, 0.9, '#d8c898', 0.9); sack(sc, 1.26, 0.88, '#cdbb88', 0.9);
  // skrzydła (statyczny wiatrak; w grze — animowana nakładka)
  const [hx, hy] = sc.P(cx + 0.52, cy + 0.52, 1.7), L = 150 * f, a0 = 0.34;
  for (let k = 0; k < 4; k++) {
    g.save(); g.translate(hx, hy); g.rotate(a0 + k * Math.PI / 2);
    g.fillStyle = '#4a3220'; g.strokeStyle = 'rgba(14,8,4,0.8)'; g.lineWidth = f; g.fillRect(0, -2.6 * f, L, 5.2 * f); g.strokeRect(0, -2.6 * f, L, 5.2 * f);
    const w = 0.24 * L; g.fillStyle = 'rgba(238,230,206,0.94)'; g.fillRect(0.2 * L, 2.6 * f, 0.8 * L, w); g.strokeStyle = '#4a3220'; g.lineWidth = 1.6 * f; g.strokeRect(0.2 * L, 2.6 * f, 0.8 * L, w);
    g.lineWidth = 1.1 * f; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0.2 * L + i * 0.1 * L, 2.6 * f); g.lineTo(0.2 * L + i * 0.1 * L, 2.6 * f + w); g.stroke(); }
    g.strokeStyle = 'rgba(90,70,40,0.5)'; g.lineWidth = f; g.beginPath(); g.moveTo(0.2 * L, 2.6 * f + w / 2); g.lineTo(L, 2.6 * f + w / 2); g.stroke(); g.restore();
  }
  g.fillStyle = '#3a2814'; g.strokeStyle = 'rgba(10,6,2,0.8)'; g.lineWidth = f; g.beginPath(); g.arc(hx, hy, 8 * f, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c9a85a'; g.beginPath(); g.arc(hx, hy, 3 * f, 0, TAU); g.fill();
  return sc.finish();
};

/* KOSZARY 3×3: długa hala z nawisem + skrzydło w kształcie L, dziedziniec ze stojakami na broń i manekinem */
BAKED.frankBarracks = function () {
  const sc = sceneFor(3, 3, 2.9), zp = 0.1, hx0 = -1.4, hx1 = 1.4, hy0 = -1.4, hy1 = -0.4, hz1 = 0.8, hz2 = 1.5, J = 0.08;
  sc.paved(-1.45, -0.4, 0.55, 1.45, { mat: 'cobble', jit: 0.12, seed: 3, feather: 5 });
  sc.patch(0, 0.05, 2.1, 1.9, { seed: 81, alpha: 0.5 });
  sc.shadow([[hx0, hy0, 0], [hx1, hy0, 0], [hx1, 0.95, 0], [0.55, 0.95, 0], [0.55, hy1, 0], [hx0, hy1, 0], [hx0 - 0.1, hy0 - 0.1, hz2 + 0.7], [hx1 + 0.1, hy0 - 0.1, hz2 + 0.7], [hx1 + 0.1, 0.95, 1.5], [hx0 - 0.1, hy1 + 0.1, hz2 + 0.7]]);
  sc.contact(hx0, hy0, hx1, hy1); sc.contact(0.55, hy1, hx1, 0.95);
  // hala główna
  sc.box(hx0, hy0, 0, hx1, hy1, zp, 'stone', { ao: 0.4 });
  sc.box(hx0, hy0, zp, hx1, hy1, hz1, 'stone', { ao: 0.3, eave: 0.5 });
  sc.box(hx0 - J, hy0 - J, hz1, hx1 + J, hy1 + J, hz2, 'plaster', { ao: 0.15, eave: 0.3, pal: '#e2d8bc' });
  const HS = wallS(hx0, hx1, hy1, hz1, zp), HS2 = wallS(hx0 - J, hx1 + J, hy1 + J, hz2, hz1);
  halfTimber(sc, HS2.O, HS2.U, HS2.V, { nu: 8 });
  door(sc, HS.O, HS.U, HS.V, 1.0, 0.6, 0.62, { vb: hz1 - zp, arch: true, frame: '#241a10', pal: '#4a3420' });
  for (const u of [0.3, 0.62, 1.88, 2.2]) windowAt(sc, HS.O, HS.U, HS.V, u, 0.2, 0.15, 0.24, { shutters: '#2f4f8a', frame: '#3b2616' });
  for (const u of [0.26, 0.9, 1.54, 2.18]) windowAt(sc, HS2.O, HS2.U, HS2.V, u, 0.2, 0.2, 0.3, { shutters: '#2f4f8a', frame: '#3b2616' });
  gableRoof(sc, { x0: hx0 - J, x1: hx1 + J, y0: hy0 - J, y1: hy1 + J, z: hz2, rise: 0.78, ov: 0.12, ovE: 0.1, mat: 'tiles', pal: '#9a4a2a', gableMat: 'plaster', gablePal: '#e2d8bc', ridge: 'x' });
  chimney(sc, -0.7, -0.95, 2.0, 2.65, 0.26); chimney(sc, 0.7, -0.95, 2.0, 2.65, 0.26); soot(sc, -0.7, -0.95, 2.05, 0.18); soot(sc, 0.7, -0.95, 2.05, 0.18);
  // skrzydło wschodnie
  const wx0 = 0.55, wx1 = 1.4, wy0 = hy1, wy1 = 0.95, wz = 1.0;
  sc.box(wx0, wy0, 0, wx1, wy1, zp, 'stone', { ao: 0.4 }); sc.box(wx0, wy0, zp, wx1, wy1, wz, 'stone', { ao: 0.3, eave: 0.4 });
  const WS = wallS(wx0, wx1, wy1, wz, zp), WE = wallE(wy0, wy1, wx1, wz, zp);
  door(sc, WS.O, WS.U, WS.V, 0.28, 0.3, 0.6, { vb: wz - zp, arch: false, frame: '#2b1c10', pal: '#5a3e22', lintel: '#8d897d' });
  for (const u of [0.15, 0.55, 0.95]) windowAt(sc, WE.O, WE.U, WE.V, u, 0.22, 0.17, 0.3, { shutters: '#2f4f8a', frame: '#3b2616' });
  gableRoof(sc, { x0: wx0, x1: wx1, y0: wy0, y1: wy1, z: wz, rise: 0.5, ov: 0.1, ovE: 0.09, mat: 'tiles', pal: '#9a4a2a', gableMat: 'stone', gablePal: '#b0aa9a', ridge: 'y' });
  // dziedziniec: palisada, stojak na włócznie, manekin, tarcze, sztandary
  const palisade = (xa, ya, xb, yb) => { const n = Math.round(Math.hypot(xb - xa, yb - ya) / 0.11); for (let i = 0; i <= n; i++) { const t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t; sc.box(x - 0.04, y - 0.04, 0, x + 0.04, y + 0.04, 0.52 + (i % 3) * 0.04, 'log', { ao: 0.2, pal: '#8a6a40' }); } };
  palisade(-1.42, hy1 + 0.05, -1.42, 1.4);
  palisade(-1.42, 1.4, -0.35, 1.4); palisade(0.12, 1.4, 0.55, 1.4);
  sc.box(-0.36, 1.34, 0, -0.30, 1.46, 0.78, 'plank', { pal: '#6a4a2c', ao: 0.1 }); sc.box(0.06, 1.34, 0, 0.12, 1.46, 0.78, 'plank', { pal: '#6a4a2c', ao: 0.1 });
  const g = sc.g, f = sc.F;
  const [rx, ry] = sc.P(-0.95, 0.1, 0);
  g.strokeStyle = '#3a2814'; g.lineWidth = 3 * f; g.beginPath(); g.moveTo(rx - 22 * f, ry); g.lineTo(rx - 22 * f, ry - 26 * f); g.moveTo(rx + 22 * f, ry); g.lineTo(rx + 22 * f, ry - 26 * f); g.moveTo(rx - 24 * f, ry - 22 * f); g.lineTo(rx + 24 * f, ry - 22 * f); g.stroke();
  for (let i = 0; i < 6; i++) { const x = rx - 18 * f + i * 7.2 * f; g.strokeStyle = '#8a6a40'; g.lineWidth = 2 * f; g.beginPath(); g.moveTo(x, ry - 2 * f); g.lineTo(x + 3 * f, ry - 46 * f); g.stroke(); g.fillStyle = '#cfd4d8'; g.beginPath(); g.moveTo(x + 3 * f, ry - 54 * f); g.lineTo(x + 6 * f, ry - 45 * f); g.lineTo(x, ry - 45 * f); g.closePath(); g.fill(); }
  const [dx, dy] = sc.P(-0.15, 0.7, 0);
  g.strokeStyle = '#4a3220'; g.lineWidth = 4 * f; g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx, dy - 48 * f); g.moveTo(dx - 16 * f, dy - 36 * f); g.lineTo(dx + 16 * f, dy - 36 * f); g.stroke();
  g.fillStyle = '#d8c898'; g.strokeStyle = '#4a3220'; g.lineWidth = f; g.beginPath(); g.ellipse(dx, dy - 52 * f, 7 * f, 8 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#2f5aa8'; g.beginPath(); g.moveTo(dx - 5 * f, dy - 34 * f); g.lineTo(dx + 5 * f, dy - 34 * f); g.lineTo(dx + 4 * f, dy - 22 * f); g.lineTo(dx, dy - 18 * f); g.lineTo(dx - 4 * f, dy - 22 * f); g.closePath(); g.fill(); g.stroke();
  barrel(sc, 0.3, -0.1); barrel(sc, 0.34, 0.12); crate(sc, -1.2, 1.1, 0.22, 0.22);
  for (const [bx, by] of [[-1.28, -0.3], [0.38, -0.3]]) { const [px, py] = sc.P(bx, by, 0); g.strokeStyle = '#3a2814'; g.lineWidth = 2.4 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 120 * f); g.stroke(); g.fillStyle = '#2f5aa8'; g.strokeStyle = 'rgba(10,10,30,0.7)'; g.lineWidth = f; g.beginPath(); g.moveTo(px + 1 * f, py - 116 * f); g.lineTo(px + 24 * f, py - 116 * f); g.lineTo(px + 24 * f, py - 72 * f); g.lineTo(px + 12 * f, py - 64 * f); g.lineTo(px + 1 * f, py - 72 * f); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e0c060'; g.fillRect(px + 11 * f, py - 108 * f, 3 * f, 30 * f); g.fillRect(px + 5 * f, py - 98 * f, 15 * f, 3.4 * f); }
  return sc.finish();
};

/* KUŹNIA 2×3: kamienny warsztat z dachówką i otwartym zadaszeniem z paleniskiem, kowadłem i narzędziami */
BAKED.frankSmithy = function () {
  const sc = sceneFor(2, 3, 2.7), x0 = -0.92, x1 = 0.92, y0 = -1.42, y1 = 0.0, zp = 0.1, zw = 1.1;
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 91, alpha: 0.7, pal: '#6a5a3c' });
  sc.flat([[[0.1, 0.2], [0.9, 0.2], [0.9, 1.0], [0.1, 1.0]]], 'rgba(255,150,60,0.22)', 16);
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, 1.4, 0], [x0, 1.4, 0], [x0 - 0.1, y0 - 0.1, zw + 0.7], [x1 + 0.1, 0.2, zw + 0.6], [x0 - 0.1, 0.2, zw + 0.6], [0.5, -0.4, 2.8]]);
  sc.contact(x0, y0, x1, 1.35);
  sc.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'stone', { ao: 0.4 });
  sc.box(x0, y0, zp, x1, y1, zw, 'stone', { ao: 0.25, pal: '#a39d90' });
  const MS = wallS(x0, x1, y1, zw, zp), ME = wallE(y0, y1, x1, zw, zp);
  for (const u of [0.35, 1.2]) windowAt(sc, ME.O, ME.U, ME.V, u, 0.25, 0.2, 0.28, { frame: '#3a2818', sill: '#8d897d', lit: '#ffb860' });
  gableRoof(sc, { x0, x1, y0, y1, z: zw, rise: 0.62, ov: 0.1, ovE: 0.08, mat: 'tiles', pal: '#a24a28', gableMat: 'stone', gablePal: '#a39d90', ridge: 'x' });
  // wnętrze zadaszenia: tylna ściana z narzędziami, palenisko, kowadło, miech
  const g = sc.g, f = sc.F;
  sc.local(MS.O, MS.U, MS.V, (gg) => { gg.fillStyle = 'rgba(16,10,6,0.35)'; gg.fillRect(0, 0, 1.84, 1.0);
    gg.strokeStyle = '#2a2018'; gg.lineWidth = 0.014; for (const [u, v, k] of [[0.3, 0.35, 0], [0.5, 0.4, 1], [0.7, 0.34, 2], [1.0, 0.38, 0], [1.2, 0.35, 1]]) { gg.beginPath(); gg.moveTo(u, v - 0.12); gg.lineTo(u, v + 0.1); gg.stroke(); gg.fillStyle = '#9aa0a6'; if (k === 0) gg.fillRect(u - 0.05, v - 0.14, 0.1, 0.05); else if (k === 1) { gg.beginPath(); gg.moveTo(u, v - 0.12); gg.lineTo(u + 0.06, v - 0.2); gg.lineTo(u + 0.08, v - 0.12); gg.fill(); } else { gg.beginPath(); gg.arc(u, v + 0.1, 0.03, 0, TAU); gg.stroke(); } } });
  sc.box(0.2, 0.2, zp, 0.88, 0.7, 0.55, 'stone', { ao: 0.3, pal: '#8f8a7e' });                              // palenisko
  const [fx, fy] = sc.P(0.54, 0.45, 0.55), gl = g.createRadialGradient(fx, fy, 0, fx, fy, 30 * f); gl.addColorStop(0, 'rgba(255,230,140,0.95)'); gl.addColorStop(0.35, 'rgba(255,140,40,0.75)'); gl.addColorStop(1, 'rgba(180,40,0,0)');
  g.fillStyle = gl; g.beginPath(); g.ellipse(fx, fy, 30 * f, 15 * f, 0, 0, TAU); g.fill();
  sc.cyl(-0.3, 0.55, zp, 0.42, 0.15, { mat: 'log', pal: '#7a5632', topMat: 'plank', ao: 0.3 }); sc.box(-0.42, 0.47, 0.42, -0.18, 0.63, 0.5, 'stone', { pal: '#3a3a40', ao: 0, wear: 0 }); sc.box(-0.37, 0.49, 0.5, -0.23, 0.61, 0.57, 'stone', { pal: '#44444a', ao: 0, wear: 0 });
  // dach zadaszenia (jednospadowy) + słupy
  sc.face([x0 - 0.06, 0.02, 1.12], [x1 - x0 + 0.12, 0, 0], [0, 1.0, -0.24], 'tiles', { shade: 1.0, pal: '#8f4224', edge: 0.4, roof: true, vgrad: [[0, 0], [0.88, 0], [1, 0.25]] });
  for (const px of [x0 + 0.05, -0.3, 0.3, x1 - 0.05]) sc.box(px - 0.05, 0.96, 0, px + 0.05, 1.06, 0.88, 'log', { ao: 0.2, pal: '#7a5632' });
  chimney(sc, 0.55, -0.35, 1.4, 2.45, 0.34); soot(sc, 0.55, -0.35, 1.45, 0.24, 0.5);
  barrel(sc, -0.75, 0.82); barrel(sc, 0.72, 1.25, 0, 0.85); logPile(sc, 0.3, 1.32);
  for (let i = 0; i < 5; i++) { const [px, py] = sc.P(-0.7 + i * 0.07, 0.4 + i * 0.02, zp + 0.03 * i); g.fillStyle = '#9aa0a6'; g.strokeStyle = 'rgba(14,14,18,0.8)'; g.lineWidth = f; g.fillRect(px - 9 * f, py - 3 * f, 18 * f, 3 * f); g.strokeRect(px - 9 * f, py - 3 * f, 18 * f, 3 * f); }
  const [cx2, cy2] = sc.P(0.9, 0.95, 0); g.fillStyle = '#1c1a1c'; g.beginPath(); g.moveTo(cx2 - 16 * f, cy2); g.quadraticCurveTo(cx2 - 8 * f, cy2 - 20 * f, cx2, cy2 - 18 * f); g.quadraticCurveTo(cx2 + 8 * f, cy2 - 20 * f, cx2 + 16 * f, cy2); g.closePath(); g.fill();
  return sc.finish();
};

/* ZAMEK 4×4: mur kurtynowy z dziedzińcem, cztery baszty, brama z kratą, donżon */
BAKED.frankKeep = function () {
  const sc = sceneFor(4, 4, 4.2), w = 1.86, t = 0.4, zp = 0.1, zc = 1.05, zd = 2.2;
  sc.paved(-1.2, -1.2, 1.5, 1.5, { mat: 'cobble', jit: 0.1, seed: 4, feather: 4 });
  sc.patch(0, 0.1, 2.5, 2.3, { seed: 51, alpha: 0.55, feather: 20 });
  sc.shadow([[-w, -w, 0], [w, -w, 0], [w, w, 0], [-w, w, 0], [-w, -w, zc + 0.9], [w, -w, zc + 0.9], [w, w, zc + 0.9], [-w, w, zc + 0.9], [-0.7, -0.8, zd + 0.3], [0.5, 0.4, zd + 0.3], [0.5, -0.8, zd + 0.3], [-0.7, 0.4, zd + 0.3]], { alpha: 0.5, blur: 14 });
  sc.contact(-w, -w, w, w, { grow: 0.1, alpha: 0.6, blur: 9 });
  sc.box(-w - 0.04, -w - 0.04, 0, w + 0.04, w + 0.04, zp, 'stone', { ao: 0.4 });
  const tower = (cx, cy, hgt = 1.95) => { sc.cyl(cx, cy, zp, hgt, 0.34, { mat: 'stone', pal: '#9d9a90', topMat: 'stone', ao: 0.45 }); sc.cyl(cx, cy, hgt - 0.04, hgt + 0.06, 0.4, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0, top: false }); cone(sc, cx, cy, hgt + 0.06, 0.4, 0.9, [168, 62, 40]); };
  // mury tylne (północny i zachodni) — widoczne od środka
  sc.box(-w, -w, zp, w, -w + t, zc, 'stone', { ao: 0.3 }); sc.box(-w, -w + t, zp, -w + t, w, zc, 'stone', { ao: 0.3 });
  tower(-w + 0.05, -w + 0.05);
  merlonLine(sc, -w + 0.4, -w + 0.06, w - 0.4, -w + 0.06, zc, 12, 0.1, 0.13); merlonLine(sc, -w + 0.06, -w + 0.4, -w + 0.06, w - 0.4, zc, 12, 0.1, 0.13);
  // dziedziniec
  sc.face([-w + t, -w + t, zp], [2 * w - 2 * t, 0, 0], [0, 2 * w - 2 * t, 0], 'cobble', { shade: 1, wear: 0.4, edge: 0 });
  // zabudowa wewnętrzna: donżon, stajnia przy murze, studnia, skład
  sc.shadowBox(-0.8, -0.95, 0.55, 0.45, zd, { alpha: 0.4 });
  sc.box(-0.8, -0.95, zp, 0.55, 0.45, zd, 'stone', { ao: 0.3, pal: '#aaa497', eave: 0.2 });
  const DS = wallS(-0.8, 0.55, 0.45, zd, zp), DE = wallE(-0.95, 0.45, 0.55, zd, zp);
  glassWin(sc, DS.O, DS.U, DS.V, 0.25, 0.45, 0.2, 0.62, { frame: '#8d897d' }); glassWin(sc, DS.O, DS.U, DS.V, 0.95, 0.45, 0.2, 0.62, { frame: '#8d897d' });
  door(sc, DS.O, DS.U, DS.V, 0.56, 0.3, 0.62, { vb: zd - zp, arch: true, frame: '#8d897d', pal: '#4a3420' });
  for (const u of [0.3, 0.8]) archWin(sc, DE.O, DE.U, DE.V, u, 0.5, 0.18, 0.5, { frame: '#8d897d', lit: '#ffd078', lit2: '#c98a30' });
  sc.box(-0.86, -1.01, zd - 0.06, 0.61, 0.51, zd + 0.03, 'stone', { ao: 0, pal: '#8f8a7e' });
  merlonLine(sc, -0.8, -0.95, 0.55, -0.95, zd + 0.03, 8, 0.1, 0.13); merlonLine(sc, -0.8, -0.95, -0.8, 0.45, zd + 0.03, 8, 0.1, 0.13);
  merlonLine(sc, -0.8, 0.45, 0.55, 0.45, zd + 0.03, 8, 0.1, 0.13); merlonLine(sc, 0.55, -0.95, 0.55, 0.45, zd + 0.03, 8, 0.1, 0.13);
  sc.box(-0.55, -0.7, zd + 0.03, 0.3, 0.2, zd + 0.2, 'stone', { ao: 0.1, pal: '#a39d90' });
  pennant(sc, 0.1, -0.2, zd + 0.2, 70, '#2f5aa8');
  sc.box(-w + t, 0.55, zp, -0.95, 1.4, 0.75, 'plank', { ao: 0.3, pal: '#6a4a2c' });
  gableRoof(sc, { x0: -w + t, x1: -0.95, y0: 0.55, y1: 1.4, z: 0.75, rise: 0.36, ov: 0.06, ovE: 0.05, mat: 'shingle', pal: '#5a4636', ridge: 'y' });
  sc.cyl(0.95, 0.9, zp, 0.34, 0.17, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0.4 }); barrel(sc, 0.55, 1.05); barrel(sc, 0.72, 1.18); crate(sc, 1.2, 0.5, 0.24, 0.24); haystack(sc, 1.2, -0.55);
  tower(w - 0.05, -w + 0.05); tower(-w + 0.05, w - 0.05);
  // mury przednie (południowy z bramą, wschodni)
  sc.box(-w, w - t, zp, -0.55, w, zc, 'stone', { ao: 0.3, eave: 0.3 }); sc.box(0.55, w - t, zp, w, w, zc, 'stone', { ao: 0.3, eave: 0.3 }); sc.box(-0.55, w - t, zc - 0.28, 0.55, w, zc, 'stone', { ao: 0.3, eave: 0.4 });
  sc.box(w - t, -w + t, zp, w, w - t, zc, 'stone', { ao: 0.3, eave: 0.3 });
  // brama: wieża bramna nad przejściem
  const gx0 = -0.62, gx1 = 0.62, gy0 = w - 0.5, gy1 = w + 0.1, gz = 1.85;
  sc.box(gx0, gy0, zc - 0.28, gx1, gy1, gz, 'stone', { ao: 0.25, pal: '#aaa497', eave: 0.3 });
  const GS = wallS(gx0, gx1, gy1, gz, zp);
  sc.local(GS.O, GS.U, GS.V, (g) => { const u0 = 0.37, ww = 0.5, vb = gz - zp; g.fillStyle = '#17120e'; g.beginPath(); g.moveTo(u0, vb); g.lineTo(u0, vb - 0.62); g.arc(u0 + ww / 2, vb - 0.62, ww / 2, Math.PI, 0); g.lineTo(u0 + ww, vb); g.closePath(); g.fill(); g.strokeStyle = '#8d897d'; g.lineWidth = 0.03; g.stroke(); g.strokeStyle = 'rgba(60,50,40,0.95)'; g.lineWidth = 0.018; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(u0 + i * ww / 5, vb - 0.62 - 0.2); g.lineTo(u0 + i * ww / 5, vb - 0.05); g.stroke(); } for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(u0, vb - 0.1 - j * 0.14); g.lineTo(u0 + ww, vb - 0.1 - j * 0.14); g.stroke(); }
    for (const u of [0.1, 1.04]) { g.fillStyle = '#2f5aa8'; g.fillRect(u, 0.18, 0.16, 0.5); g.fillStyle = '#e0c060'; g.fillRect(u + 0.07, 0.24, 0.025, 0.36); g.fillRect(u + 0.04, 0.32, 0.08, 0.03); } g.fillStyle = '#15120d'; for (const u of [0.4, 0.6, 0.8]) g.fillRect(u, 0.12, 0.03, 0.14); });
  merlonLine(sc, gx0 + 0.05, gy1 - 0.05, gx1 - 0.05, gy1 - 0.05, gz, 7, 0.1, 0.14); merlonLine(sc, gx1 - 0.05, gy0 + 0.05, gx1 - 0.05, gy1 - 0.05, gz, 3, 0.1, 0.14);
  sc.box(-0.3, w + 0.1, 0, 0.3, 1.99, 0.07, 'plank', { ao: 0.3, pal: '#7a5632' });                                // pomost
  merlonLine(sc, -w + 0.4, w - 0.06, -0.62, w - 0.06, zc, 5, 0.1, 0.13); merlonLine(sc, 0.62, w - 0.06, w - 0.4, w - 0.06, zc, 5, 0.1, 0.13); merlonLine(sc, w - 0.06, -w + 0.4, w - 0.06, w - 0.4, zc, 12, 0.1, 0.13);
  tower(w - 0.05, w - 0.05, 2.05);
  for (const [x, y] of [[-w + 0.05, -w + 0.05], [w - 0.05, -w + 0.05], [-w + 0.05, w - 0.05], [w - 0.05, w - 0.05]]) pennant(sc, x, y, 2.9, 40, '#b8352b');
  return sc.finish();
};
