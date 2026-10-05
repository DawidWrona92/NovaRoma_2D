/* ====================== SARACENI: piaskowiec, kopuły, mozaika, markizy ====================== */

/* pasek mozaiki na ścianie (nakładka tuż przed płaszczyzną) */
function mosaicBand(sc, O, U, V, z0, hgt, side = 'S', pal) {
  const n = side === 'S' ? [0, 0.004, 0] : [0.004, 0, 0], lu = Math.hypot(...U), dir = [U[0] / lu, U[1] / lu, U[2] / lu];
  sc.face([O[0] + n[0], O[1] + n[1], z0], [dir[0] * lu, dir[1] * lu, 0], [0, 0, -hgt], 'mosaic', { shade: side === 'S' ? LIGHT.south : LIGHT.east, pal: pal || '#2a8a9a|#f2ead6|#d8a830', wear: 0.4, edge: 0.3 });
}

/* DOM 2×2: dom z tarasem, piętrem z kopułką, mashrabiją i markizą */
BAKED.saracenHouse = function () {
  const sc = sceneFor(2, 2, 2.6), x0 = -0.85, x1 = 0.85, y0 = -0.8, y1 = 0.8, zg = 1.05, zu = 1.78, pz = zg + 0.13;
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 21, pal: '#b79a62', alpha: 0.75 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, pz], [x1, y0, pz], [x1, y1, pz], [x0, y1, pz], [-0.5, -0.5, zu + 0.5], [0.0, 0.0, zu + 0.5]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0, y0, 0, x1, y1, zg, 'sandstone', { ao: 0.3, pal: '#dcc490', topPal: '#e2cd9c', eave: 0.3 });
  const S = wallS(x0, x1, y1, zg, 0), E = wallE(y0, y1, x1, zg, 0);
  mosaicBand(sc, S.O, S.U, S.V, zg - 0.16, 0.09, 'S'); mosaicBand(sc, E.O, E.U, E.V, zg - 0.16, 0.09, 'E');
  door(sc, S.O, S.U, S.V, 0.66, 0.4, 0.82, { vb: zg, arch: true, frame: '#1f6f78', pal: '#5a3d22' });
  for (const u of [0.14, 1.22]) archWin(sc, S.O, S.U, S.V, u, 0.28, 0.22, 0.36, { frame: '#1f6f78', grille: true });
  for (const u of [0.15, 0.7, 1.25]) archWin(sc, E.O, E.U, E.V, u, 0.28, 0.22, 0.36, { frame: '#8a5a2a', grille: true });
  for (const [O, U, n] of [[S.O, S.U, 7], [E.O, E.U, 7]]) sc.local(O, U, S.V, (gg, lu) => { gg.fillStyle = '#4a3018'; for (let i = 0; i < n; i++) gg.fillRect(0.06 + i * (lu - 0.12) / (n - 1) - 0.016, 0.0, 0.032, 0.04); });
  awning(sc, -0.26, y1, 0.98, 0.52, 0.22, 0.1);
  stairs(sc, -0.3, 0.3, y1, 2, 0.12, 'sandstone');
  // attyka
  const pt = 0.07;
  sc.box(x0 - 0.01, y0 - 0.01, zg, x1 + 0.01, y0 + pt, pz, 'sandstone', { ao: 0, pal: '#e0c996', top: true }); sc.box(x0 - 0.01, y0 - 0.01, zg, x0 + pt, y1 + 0.01, pz, 'sandstone', { ao: 0, pal: '#e0c996' });
  // piętro w tylnej części + kopułka + mashrabija
  const ux0 = -0.85, ux1 = 0.18, uy0 = -0.8, uy1 = 0.12;
  sc.box(ux0, uy0, zg, ux1, uy1, zu, 'sandstone', { ao: 0.25, pal: '#e6d1a0', topPal: '#ead7a8' });
  const US = wallS(ux0, ux1, uy1, zu, zg);
  archWin(sc, US.O, US.U, US.V, 0.12, 0.14, 0.14, 0.24, { frame: '#1f6f78', lit: '#f6c866', lit2: '#c98a30' }); archWin(sc, US.O, US.U, US.V, 0.82, 0.14, 0.14, 0.24, { frame: '#1f6f78' });
  sc.box(-0.62, uy1, zg + 0.18, -0.12, uy1 + 0.2, zg + 0.62, { east: 'plank', south: 'plank', top: 'plank' }, { ao: 0.25, pal: '#7a4a22', wear: 0.5 });
  const B = wallS(-0.62, -0.12, uy1 + 0.2, zg + 0.62, zg + 0.18);
  sc.local(B.O, B.U, B.V, (g, lu, lv) => { g.strokeStyle = 'rgba(20,10,4,0.75)'; g.lineWidth = 0.012; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(i * lu / 10, 0.02); g.lineTo(i * lu / 10, lv - 0.02); g.stroke(); } for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(0.02, j * lv / 6); g.lineTo(lu - 0.02, j * lv / 6); g.stroke(); } g.fillStyle = 'rgba(255,200,100,0.18)'; g.fillRect(0.04, 0.04, lu - 0.08, lv - 0.08); });
  dome(sc, (ux0 + ux1) / 2, (uy0 + uy1) / 2, zu, 0.34, { cols: ['#f6e8b8', '#d6bb7a', '#a98b4e', '#6e5428'] });
  // pergola z liści palmowych na tarasie, dzbany, dywan
  for (const [px, py] of [[0.35, -0.55], [0.75, -0.55], [0.35, -0.1], [0.75, -0.1]]) sc.box(px - 0.03, py - 0.03, zg, px + 0.03, py + 0.03, zg + 0.5, 'plank', { ao: 0.1, pal: '#6a4a2c' });
  sc.face([0.3, -0.6, zg + 0.5], [0.52, 0, 0], [0, 0.55, 0], 'thatch', { shade: 1, pal: '#9a8a4a', wear: 0.4, edge: 0.4 });
  sc.cyl(0.7, 0.6, zg, zg + 0.22, 0.07, { color: [176, 112, 62], ao: 0 }); sc.cyl(0.55, 0.65, zg, zg + 0.18, 0.06, { color: [150, 90, 50], ao: 0 });
  sc.local(S.O, S.U, S.V, (g) => { g.fillStyle = '#a8352b'; g.fillRect(1.1, -0.02, 0.4, 0.3); g.fillStyle = '#e8d8a0'; for (let i = 0; i < 4; i++) g.fillRect(1.14 + i * 0.09, 0.03, 0.04, 0.22); g.strokeStyle = 'rgba(30,10,4,0.6)'; g.lineWidth = 0.01; g.strokeRect(1.1, -0.02, 0.4, 0.3); });
  sack(sc, 0.62, y1 + 0.22); sack(sc, 0.78, y1 + 0.16, '#c9b27a', 0.9); barrel(sc, -0.62, y1 + 0.2); crate(sc, 1.05, 0.3, 0.2, 0.2);
  return sc.finish();
};

/* MECZET 3×3: sala modlitewna z kopułą na bębnie i czterema kopułkami, portal-iwan, dziedziniec z fontanną, minaret */
BAKED.saracenMosque = function () {
  const sc = sceneFor(3, 3, 3.4), x0 = -1.1, x1 = 1.1, y0 = -1.25, y1 = 0.3, zw = 1.15;
  sc.paved(-1.45, 0.35, 1.45, 1.45, { mat: 'pavers', pal: '#c8b890', seed: 9, jit: 0.1 });
  sc.patch(0, 0.05, 2.0, 1.9, { seed: 27, pal: '#b79a62', alpha: 0.6, feather: 18 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [0, -0.4, 2.2], [1.3, 0.5, 2.8], [x1, y1, zw + 0.5], [x0, y0, zw + 0.5]]);
  sc.contact(x0, y0, x1, 1.45);
  sc.box(x0 - 0.04, y0 - 0.04, 0, x1 + 0.04, y1 + 0.04, 0.1, 'sandstone', { ao: 0.4, pal: '#c9ad74' });
  sc.box(x0, y0, 0.1, x1, y1, zw, 'sandstone', { ao: 0.3, pal: '#e0c995', topPal: '#e6d2a0', eave: 0.25 });
  const S = wallS(x0, x1, y1, zw, 0.1), E = wallE(y0, y1, x1, zw, 0.1);
  mosaicBand(sc, S.O, S.U, S.V, zw - 0.2, 0.1, 'S'); mosaicBand(sc, E.O, E.U, E.V, zw - 0.2, 0.1, 'E');
  [0.12, 0.42, 1.2, 1.5, 1.82].forEach(u => archWin(sc, S.O, S.U, S.V, u, 0.34, 0.16, 0.46, { frame: '#1f6f78', lit: '#2c4a50', lit2: '#16282c', grille: true }));
  [0.12, 0.5, 0.88, 1.26].forEach(u => archWin(sc, E.O, E.U, E.V, u, 0.34, 0.16, 0.46, { frame: '#1f6f78', lit: '#2c4a50', lit2: '#16282c', grille: true }));
  // portal-iwan z głęboką niszą i mozaiką
  const px0 = -0.4, px1 = 0.4, py1 = 0.72, pz = 1.45;
  sc.box(px0, y1 - 0.02, 0.1, px1, py1, pz, 'sandstone', { ao: 0.25, pal: '#e6d2a0', eave: 0.2 });
  const PS = wallS(px0, px1, py1, pz, 0.1);
  sc.local(PS.O, PS.U, PS.V, (g, lu) => { g.fillStyle = '#1f6f78'; g.beginPath(); g.moveTo(0.06, 1.35); g.lineTo(0.06, 0.55); g.arc(lu / 2, 0.55, lu / 2 - 0.06, Math.PI, 0); g.lineTo(lu - 0.06, 1.35); g.closePath(); g.fill();
    g.fillStyle = '#17120e'; g.beginPath(); g.moveTo(0.14, 1.35); g.lineTo(0.14, 0.58); g.arc(lu / 2, 0.58, lu / 2 - 0.14, Math.PI, 0); g.lineTo(lu - 0.14, 1.35); g.closePath(); g.fill();
    g.fillStyle = '#5a3d22'; g.beginPath(); g.moveTo(0.26, 1.35); g.lineTo(0.26, 0.9); g.arc(lu / 2, 0.9, lu / 2 - 0.26, Math.PI, 0); g.lineTo(lu - 0.26, 1.35); g.closePath(); g.fill();
    g.strokeStyle = '#d8b44a'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(0.06, 1.35); g.lineTo(0.06, 0.55); g.arc(lu / 2, 0.55, lu / 2 - 0.06, Math.PI, 0); g.lineTo(lu - 0.06, 1.35); g.stroke(); });
  for (let i = 0; i < 3; i++) sc.box(px0 + i * 0.06, y1 + 0.2, pz + i * 0.04, px1 - i * 0.06, py1 - 0.02, pz + 0.04 + i * 0.04, 'sandstone', { ao: 0.1, pal: '#d8c08a', wear: 0.4 });
  // kopuły
  for (const [cx, cy] of [[x0 + 0.2, y0 + 0.2], [x1 - 0.2, y0 + 0.2]]) { sc.cyl(cx, cy, zw, zw + 0.25, 0.2, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); dome(sc, cx, cy, zw + 0.25, 0.24); }
  sc.cyl(0, -0.4, zw, zw + 0.38, 0.62, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', topPal: '#e6d2a0', ao: 0.5 });
  for (const [cx, cy] of [[x0 + 0.2, y1 - 0.2], [x1 - 0.2, y1 - 0.2]]) { sc.cyl(cx, cy, zw, zw + 0.25, 0.2, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); dome(sc, cx, cy, zw + 0.25, 0.24); }
  dome(sc, 0, -0.4, zw + 0.38, 0.68);
  // dziedziniec: niski mur z arkadą, fontanna
  sc.box(-1.45, 1.36, 0, 1.45, 1.44, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' });
  const FS = wallS(-1.45, 1.45, 1.44, 0.5, 0); sc.local(FS.O, FS.U, FS.V, (g) => { g.fillStyle = '#1a1510'; for (let i = 0; i < 9; i++) { const u = 0.15 + i * 0.3; if (u > 1.2 && u < 1.7) continue; g.beginPath(); g.moveTo(u, 0.5); g.lineTo(u, 0.24); g.arc(u + 0.07, 0.24, 0.07, Math.PI, 0); g.lineTo(u + 0.14, 0.5); g.closePath(); g.fill(); } });
  sc.box(-1.45, 0.4, 0, -1.37, 1.36, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' }); sc.box(1.37, 0.4, 0, 1.45, 1.36, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' });
  sc.cyl(0, 1.0, 0, 0.22, 0.38, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 });
  const g = sc.g, f = sc.F, [wx, wy] = sc.P(0, 1.0, 0.22); g.fillStyle = '#3a9ab8'; g.beginPath(); g.ellipse(wx, wy, 0.3 * AX * f * 1.4142, 0.3 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(wx - 4 * f, wy - 1 * f, 0.18 * AX * f * 1.4142, 0.1 * AY * f * 1.4142, 0, 0, TAU); g.fill();
  sc.cyl(0, 1.0, 0.22, 0.5, 0.05, { mat: 'sandstone', pal: '#d8c08a', ao: 0.2 }); g.strokeStyle = 'rgba(160,220,240,0.7)'; g.lineWidth = 2 * f; for (const a of [-0.5, 0, 0.5]) { const [tx, ty] = sc.P(0, 1.0, 0.5); g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + a * 14 * f, ty - 12 * f, tx + a * 24 * f, ty + 6 * f); g.stroke(); }
  minaret(sc, 1.3, 0.55, 2.55, 0.12);
  return sc.finish();
};

/* TARG 3×3: wybrukowany plac ze straganami pod kolorowymi markizami i fontanną */
function stall(sc, x, y, w, d, pal, kind) {
  for (const [px, py] of [[x, y], [x + w, y], [x, y + d], [x + w, y + d]]) sc.box(px - 0.03, py - 0.03, 0, px + 0.03, py + 0.03, px === x ? 0.9 : 0.74, 'plank', { ao: 0.1, pal: '#6a4a2c', wear: 0.5 });
  sc.box(x + 0.02, y + d - 0.16, 0, x + w - 0.02, y + d - 0.04, 0.34, 'plank', { ao: 0.3, pal: '#8a6a40', wear: 0.8 });
  const g = sc.g, f = sc.F, r = rng(Math.round(x * 100 + y * 37));
  for (let i = 0; i < 9; i++) {
    const [px, py] = sc.P(x + 0.08 + (i + r() * 0.6) * (w - 0.16) / 9, y + d - 0.1, 0.36 + (i % 2) * 0.01);
    if (kind === 'fruit') { g.fillStyle = ['#d8433a', '#e8a030', '#8ab04a', '#c8a030'][(r() * 4) | 0]; g.beginPath(); g.arc(px, py - 3 * f, 4.2 * f, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,10,4,0.6)'; g.lineWidth = f; g.stroke(); }
    else if (kind === 'spice') { g.fillStyle = ['#c0392b', '#e8b030', '#8a5a2a', '#d8a860', '#6a8a3a'][i % 5]; g.beginPath(); g.moveTo(px - 5 * f, py); g.lineTo(px, py - 11 * f); g.lineTo(px + 5 * f, py); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,10,4,0.6)'; g.lineWidth = f; g.stroke(); }
    else if (kind === 'cloth') { g.fillStyle = ['#2f6ea8', '#a8352b', '#d8a830', '#2f7a58', '#7a3a8a'][i % 5]; g.fillRect(px - 4 * f, py - 8 * f, 8 * f, 8 * f); g.strokeStyle = 'rgba(20,10,4,0.6)'; g.lineWidth = f; g.strokeRect(px - 4 * f, py - 8 * f, 8 * f, 8 * f); }
    else { g.fillStyle = ['#b4693a', '#a85a30', '#c8844a'][i % 3]; g.beginPath(); g.ellipse(px, py - 5 * f, 4.4 * f, 6 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,10,4,0.6)'; g.lineWidth = f; g.stroke(); }
  }
  sc.face([x - 0.04, y - 0.02, 0.9], [w + 0.08, 0, 0], [0, d + 0.12, -0.2], 'stripes', { shade: 1, edge: 0.45, pal, ppu: 150, wear: 0.3 });
  sc.face([x - 0.04, y + d + 0.1, 0.7], [w + 0.08, 0, 0], [0, 0, -0.08], 'stripes', { shade: 0.8, edge: 0.45, pal, ppu: 150, wear: 0 });
}
BAKED.saracenMarket = function () {
  const sc = sceneFor(3, 3, 1.8);
  sc.paved(-1.5, -1.5, 1.5, 1.5, { mat: 'pavers', pal: '#c0b088', seed: 13, jit: 0.1 });
  sc.patch(0, 0, 2.2, 2.2, { seed: 31, pal: '#b79a62', alpha: 0.5, feather: 16 });
  sc.shadow([[-1.4, -1.4, 0], [1.4, -1.4, 0], [1.4, 1.4, 0], [-1.4, 1.4, 0], [-1.0, -1.0, 0.9], [1.0, 1.0, 0.9]], { alpha: 0.32, blur: 10 });
  const defs = [[-1.3, -1.25, 0.8, 0.5, '#b8352b|#f1e6c8', 'fruit'], [-0.35, -1.3, 0.8, 0.5, '#2f6ea8|#f1e6c8', 'cloth'], [0.6, -1.25, 0.8, 0.5, '#d8a830|#f1e6c8', 'spice'], [-1.35, -0.2, 0.5, 0.8, '#2f7a58|#f1e6c8', 'pot'], [0.85, -0.3, 0.5, 0.8, '#7a3a8a|#f1e6c8', 'fruit'], [-1.0, 0.85, 0.8, 0.5, '#d8a830|#a8352b', 'cloth'], [0.2, 0.9, 0.8, 0.5, '#b8352b|#f1e6c8', 'spice']];
  defs.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const g = sc.g, f = sc.F;
  // dywany na ziemi
  for (const [x, y, w, d, pal] of [[-0.5, 0.2, 0.7, 0.45, '#a8352b|#d8a830'], [0.45, 0.55, 0.6, 0.4, '#2f6ea8|#f1e6c8']]) sc.face([x, y, 0.012], [w, 0, 0], [0, d, 0], 'stripes', { shade: 1, pal, ppu: 190, wear: 0.3, edge: 0.5 });
  let center = false;
  for (const [x, y, w, d, pal, kind] of defs) {
    if (!center && x + y > -0.2) { center = true; sc.cyl(0, -0.1, 0, 0.26, 0.34, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 }); const [wx, wy] = sc.P(0, -0.1, 0.26); g.fillStyle = '#3a9ab8'; g.beginPath(); g.ellipse(wx, wy, 0.27 * AX * f * 1.4142, 0.27 * AY * f * 1.4142, 0, 0, TAU); g.fill();
      for (const [px, py] of [[-0.2, -0.3], [0.2, -0.3], [-0.2, 0.1], [0.2, 0.1]]) sc.box(px - 0.025, py - 0.025, 0.26, px + 0.025, py + 0.025, 1.0, 'plank', { ao: 0.1, pal: '#6a4a2c' }); pyramidRoof(sc, { x0: -0.3, x1: 0.3, y0: -0.4, y1: 0.2, z: 1.0, rise: 0.3, mat: 'tiles', pal: '#2a8a9a', ov: 0.03 }); }
    stall(sc, x, y, w, d, pal, kind);
  }
  crate(sc, 1.2, 1.2, 0.2, 0.2); crate(sc, 1.2, 1.0, 0.2, 0.34); barrel(sc, -1.3, 1.25); sack(sc, 1.0, 1.25); sack(sc, 1.15, 1.3, '#c9b27a', 0.9);
  return sc.finish();
};

/* KARAWANSERAJ 4×3: mur z krenelażem i arkadą, portal-pishtak, kopuły, dziedziniec z towarem */
BAKED.saracenSerai = function () {
  const sc = sceneFor(4, 3, 3.0), w = 1.9, hz = 1.4, t = 0.4, zc = 1.2;
  sc.paved(-1.5, -1.0, 1.5, 1.4, { mat: 'pavers', pal: '#c0b088', seed: 17, jit: 0.1 });
  sc.patch(0, 0.05, 2.7, 2.1, { seed: 41, pal: '#b79a62', alpha: 0.55, feather: 18 });
  sc.shadow([[-w, -hz, 0], [w, -hz, 0], [w, hz, 0], [-w, hz, 0], [-w, -hz, zc + 0.9], [w, -hz, zc + 0.9], [w, hz, zc + 0.5], [-w, hz, zc + 0.5], [0, 1.4, 2.2]], { alpha: 0.5, blur: 12 });
  sc.contact(-w, -hz, w, hz, { grow: 0.08 });
  sc.box(-w - 0.04, -hz - 0.04, 0, w + 0.04, hz + 0.04, 0.1, 'sandstone', { ao: 0.4, pal: '#c9ad74' });
  // mury tylne z arkadą od środka (północny) i zachodni
  sc.box(-w, -hz, 0.1, w, -hz + t, zc, 'sandstone', { ao: 0.3, pal: '#dcc490' }); sc.box(-w, -hz + t, 0.1, -w + t, hz, zc, 'sandstone', { ao: 0.3, pal: '#dcc490' });
  const N = wallS(-w, w, -hz + t, zc, 0.1); sc.local(N.O, N.U, N.V, (g) => { for (let i = 0; i < 9; i++) { const u = 0.22 + i * 0.4; g.fillStyle = '#1a1510'; g.beginPath(); g.moveTo(u, 1.1); g.lineTo(u, 0.5); g.arc(u + 0.12, 0.5, 0.12, Math.PI, 0); g.lineTo(u + 0.24, 1.1); g.closePath(); g.fill(); g.strokeStyle = '#8a5a2a'; g.lineWidth = 0.016; g.stroke(); } });
  merlonLine(sc, -w + 0.05, -hz + 0.05, w - 0.05, -hz + 0.05, zc, 15, 0.1, 0.14, 'sandstone'); merlonLine(sc, -w + 0.05, -hz + 0.05, -w + 0.05, hz - 0.05, zc, 11, 0.1, 0.14, 'sandstone');
  for (const cx of [-1.2, 0, 1.2]) { sc.cyl(cx, -hz + t / 2, zc, zc + 0.3, 0.3, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); dome(sc, cx, -hz + t / 2, zc + 0.3, 0.34, { cols: ['#f6e8b8', '#d6bb7a', '#a98b4e', '#6e5428'] }); }
  // dziedziniec: posadzka, studnia, towar, wielbłądy (uproszczone sylwetki)
  sc.face([-w + t, -hz + t, 0.1], [2 * w - t - 0.4, 0, 0], [0, 2 * hz - t - 0.4, 0], 'pavers', { shade: 1, pal: '#c0b088', wear: 0.5, edge: 0 });
  const g = sc.g, f = sc.F;
  sc.cyl(0.2, 0.0, 0.1, 0.4, 0.2, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 }); const [wx, wy] = sc.P(0.2, 0.0, 0.4); g.fillStyle = '#1a2a30'; g.beginPath(); g.ellipse(wx, wy, 0.15 * AX * f * 1.4142, 0.15 * AY * f * 1.4142, 0, 0, TAU); g.fill();
  const camel = (x, y, flip = 1) => { const [px, py] = sc.P(x, y, 0.1), s = f * 1.2; g.save(); g.translate(px, py); g.scale(flip * s, s);
    g.fillStyle = 'rgba(14,22,8,0.3)'; g.beginPath(); g.ellipse(6, 1, 22, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#b08850'; g.strokeStyle = '#2a1c0c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-18, -22); g.quadraticCurveTo(-12, -34, -4, -26); g.quadraticCurveTo(2, -34, 8, -24); g.quadraticCurveTo(18, -22, 20, -26); g.lineTo(28, -42); g.lineTo(34, -40); g.lineTo(36, -35); g.lineTo(26, -30); g.lineTo(22, -16); g.lineTo(18, -2); g.lineTo(14, -2); g.lineTo(14, -14); g.lineTo(4, -14); g.lineTo(2, -2); g.lineTo(-2, -2); g.lineTo(-4, -14); g.lineTo(-14, -14); g.lineTo(-16, -2); g.lineTo(-20, -2); g.lineTo(-20, -14); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#a8352b'; g.fillRect(-12, -26, 16, 6); g.fillStyle = '#d8a830'; g.fillRect(-12, -22, 16, 2); g.fillStyle = '#1a1006'; g.beginPath(); g.arc(32, -38, 1.2, 0, TAU); g.fill(); g.restore(); };
  camel(-0.9, 0.05, 1); camel(0.75, 0.5, -1); camel(-0.1, 0.85, 1);
  for (const [x, y] of [[-1.3, 0.7], [-1.15, 0.85], [1.2, -0.3], [1.35, -0.1]]) crate(sc, x, y, 0.22, 0.22); sack(sc, -0.6, 0.85); sack(sc, -0.45, 0.9, '#c9b27a', 0.9); barrel(sc, 1.25, 0.3);
  // mury przednie z portalem
  const zf = 0.82;
  sc.box(-w, hz - t, 0.1, -0.55, hz, zf, 'sandstone', { ao: 0.3, pal: '#dcc490', eave: 0.3 }); sc.box(0.55, hz - t, 0.1, w, hz, zf, 'sandstone', { ao: 0.3, pal: '#dcc490', eave: 0.3 }); sc.box(w - t, -hz + t, 0.1, w, hz - t, zf, 'sandstone', { ao: 0.3, pal: '#dcc490', eave: 0.3 });
  const FS = wallS(-w, w, hz, zf, 0.1), FE = wallE(-hz + t, hz - t, w, zf, 0.1);
  mosaicBand(sc, FS.O, FS.U, FS.V, zf - 0.14, 0.08, 'S'); mosaicBand(sc, FE.O, FE.U, FE.V, zf - 0.14, 0.08, 'E');
  [0.35, 0.8, 1.25, 2.55, 3.0, 3.4].forEach(u => archWin(sc, FS.O, FS.U, FS.V, u, 0.26, 0.15, 0.3, { frame: '#8a5a2a', grille: true }));
  [0.25, 0.65, 1.05, 1.45].forEach(u => archWin(sc, FE.O, FE.U, FE.V, u, 0.26, 0.15, 0.3, { frame: '#8a5a2a', grille: true }));
  // portal (pishtak)
  const gx0 = -0.58, gx1 = 0.58, gy0 = hz - 0.55, gy1 = hz + 0.12, gz = 2.15;
  sc.box(gx0, gy0, 0.1, gx1, gy1, gz, 'sandstone', { ao: 0.25, pal: '#e6d2a0', eave: 0.3 });
  const GS = wallS(gx0, gx1, gy1, gz, 0.1);
  sc.local(GS.O, GS.U, GS.V, (g2, lu) => { const vb = gz - 0.1; g2.fillStyle = '#1f6f78'; g2.beginPath(); g2.moveTo(0.07, vb); g2.lineTo(0.07, 0.95); g2.arc(lu / 2, 0.95, lu / 2 - 0.07, Math.PI, 0); g2.lineTo(lu - 0.07, vb); g2.closePath(); g2.fill();
    g2.fillStyle = '#17120e'; g2.beginPath(); g2.moveTo(0.18, vb); g2.lineTo(0.18, 0.98); g2.arc(lu / 2, 0.98, lu / 2 - 0.18, Math.PI, 0); g2.lineTo(lu - 0.18, vb); g2.closePath(); g2.fill();
    g2.fillStyle = '#5a3d22'; g2.beginPath(); g2.moveTo(0.3, vb); g2.lineTo(0.3, 1.3); g2.arc(lu / 2, 1.3, lu / 2 - 0.3, Math.PI, 0); g2.lineTo(lu - 0.3, vb); g2.closePath(); g2.fill();
    g2.strokeStyle = '#d8b44a'; g2.lineWidth = 0.016; g2.beginPath(); g2.moveTo(0.07, vb); g2.lineTo(0.07, 0.95); g2.arc(lu / 2, 0.95, lu / 2 - 0.07, Math.PI, 0); g2.lineTo(lu - 0.07, vb); g2.stroke();
    g2.fillStyle = '#2a8a9a'; for (let i = 0; i < 5; i++) { g2.fillRect(0.12 + i * (lu - 0.24) / 5, 0.12, (lu - 0.24) / 5 - 0.02, 0.2); } });
  for (const [x, y] of [[-w + 0.1, hz - 0.1], [w - 0.1, hz - 0.1]]) { sc.box(x - 0.2, y - 0.2, 0.1, x + 0.2, y + 0.2, 1.75, 'sandstone', { ao: 0.25, pal: '#e0c995' }); dome(sc, x, y, 1.75, 0.26, { cols: ['#f6e8b8', '#d6bb7a', '#a98b4e', '#6e5428'] }); }
  merlonLine(sc, -w + 0.4, hz - 0.05, -0.62, hz - 0.05, zf, 5, 0.1, 0.13, 'sandstone'); merlonLine(sc, 0.62, hz - 0.05, w - 0.4, hz - 0.05, zf, 5, 0.1, 0.13, 'sandstone'); merlonLine(sc, w - 0.05, -hz + 0.4, w - 0.05, hz - 0.4, zf, 11, 0.1, 0.13, 'sandstone');
  sack(sc, 1.2, hz + 0.28); sack(sc, 1.35, hz + 0.22, '#c9b27a', 0.9); barrel(sc, -1.2, hz + 0.25); crate(sc, 1.6, hz + 0.2, 0.22, 0.22);
  return sc.finish();
};
