/* ====================== SARACENI: piaskowiec, kopuły, mozaika, markizy ======================
   Dachy płaskie z attyką, jedna kopuła na budynek, łukowe okna, jeden pas mozaiki, jedna markiza — resztę ustala facade() i Build. */
const SR = { sand: '#dcc490', sandL: '#e6d1a0', sandD: '#c9ad74', wall2: '#e0c995', mud: '#cfb27c', teal: '#1f6f78', tealL: '#2a8a9a', wood: '#7a4a22', door: '#5a3d22', gold: '#d8b44a', domeSand: ['#f6e8b8', '#d6bb7a', '#a98b4e', '#6e5428'], dark: '#17120e' };

/* pasek mozaiki tuż przed płaszczyzną ściany */
function mosaicBand(sc, O, U, V, z0, hgt, side = 'S', pal) {
  const n = side === 'S' ? [0, 0.004, 0] : [0.004, 0, 0], lu = Math.hypot(...U), dir = [U[0] / lu, U[1] / lu, U[2] / lu];
  sc.face([O[0] + n[0], O[1] + n[1], z0], [dir[0] * lu, dir[1] * lu, 0], [0, 0, -hgt], 'mosaic', { shade: side === 'S' ? LIGHT.south : LIGHT.east, pal: pal || '#2a8a9a|#f2ead6|#d8a830', wear: 0.4, edge: 0.3 });
}
/* dom z płaskim dachem: ściany z piaskowca, pas mozaiki, elewacje przez facade(), attyka */
function flatHouse(B, o) {
  const sc = B.sc, h = o.h, z0 = o.z0 ?? 0;
  B.box(o.x0, o.y0, z0, o.x1, o.y1, h, 'sandstone', { ao: 0.3, pal: o.pal || SR.sand, topPal: SR.sandL, eave: 0.3, wear: o.wear }, (S, E) => {
    if (o.band !== false) { mosaicBand(sc, S.O, S.U, S.V, h - 0.17, 0.08, 'S'); mosaicBand(sc, E.O, E.U, E.V, h - 0.17, 0.08, 'E'); }
    if (o.S) facade(sc, S, o.S); if (o.E) facade(sc, E, o.E); if (o.deco) o.deco(S, E);
  });
  if (o.parapet !== false) B.parapet(o.x0 - 0.01, o.y0 - 0.01, o.x1 + 0.01, o.y1 + 0.01, h, 0.12, 0.07);
}
const arcWin = (w = 0.2, h = 0.34, v = 0.26, o = {}) => ({ kind: 'arch', w, h, v, frame: SR.teal, grille: true, ...o });
const sarDoor = (at, w = 0.36, h = 0.6, o = {}) => ({ at, w, h, arch: true, frame: SR.teal, pal: SR.door, ...o });

/* DWÓR (PAŁAC) 4×4: mur z baszatami i kopułami, brama-pishtak, pałac z wielką turkusową kopułą i minaretem, dziedziniec z fontanną */
BAKED.saracens_keep = function () {
  const sc = sceneFor(4, 4, 4.4), B = new Build(sc), w = 1.7, t = 0.35, zb = 1.0, zf = 0.78;
  sc.paved(-1.3, -1.3, 1.3, 1.3, { mat: 'pavers', pal: '#c8b890', seed: 5, jit: 0.1, feather: 4 });
  sc.patch(0, 0.1, 2.5, 2.3, { seed: 52, pal: '#b79a62', alpha: 0.55, feather: 20 });
  B.part(-w + t, -w + t, 0, w - t, w - t, 0.002, () => sc.face([-w + t, -w + t, 0.002], [2 * w - 2 * t, 0, 0], [0, 2 * w - 2 * t, 0], 'pavers', { shade: 1, pal: '#c0b088', wear: 0.5, edge: 0 }), { tag: 'dziedziniec', kind: 'flat', shadow: false });
  const tower = (cx, cy, hgt = 1.4) => { B.cyl(cx, cy, 0, hgt, 0.3, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.45, nest: true }); B.dome(cx, cy, hgt, 0.34, { cols: SR.domeSand, nest: true }); };
  const merlons = (x0, y0, x1, y1, z, n) => B.part(Math.min(x0, x1) - 0.05, Math.min(y0, y1) - 0.05, z, Math.max(x0, x1) + 0.05, Math.max(y0, y1) + 0.05, z + 0.13, () => merlonLine(sc, x0, y0, x1, y1, z, n, 0.1, 0.13, 'sandstone'), { tag: 'blanki', shadow: false });
  B.box(-w, -w, 0, w, -w + t, zb, 'sandstone', { ao: 0.3, pal: SR.sand }); B.box(-w, -w + t, 0, -w + t, w - t, zb, 'sandstone', { ao: 0.3, pal: SR.sand });
  merlons(-w + 0.4, -w + 0.05, w - 0.4, -w + 0.05, zb, 10); merlons(-w + 0.05, -w + 0.4, -w + 0.05, w - 0.5, zb, 9);
  tower(-w + 0.05, -w + 0.05); tower(w - 0.05, -w + 0.05); tower(-w + 0.05, w - 0.05);
  // pałac
  B.box(-0.95, -1.0, 0, 0.7, 0.2, 1.45, 'sandstone', { ao: 0.3, pal: SR.wall2, eave: 0.25 }, (S, E) => {
    mosaicBand(sc, S.O, S.U, S.V, 1.45 - 0.2, 0.1, 'S'); mosaicBand(sc, E.O, E.U, E.V, 1.45 - 0.2, 0.1, 'E');
    facade(sc, S, { door: sarDoor(0.5, 0.34, 0.5), win: arcWin(0.18, 0.46, 0.34, { over: true, n: 2 }) });
    facade(sc, E, { win: arcWin(0.18, 0.46, 0.34, { n: 2 }) });
  });
  B.parapet(-0.96, -1.01, 0.71, 0.21, 1.45, 0.12, 0.07);
  B.cyl(-0.12, -0.4, 1.45, 1.8, 0.5, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.45 }); B.dome(-0.12, -0.4, 1.8, 0.55);
  B.part(0.78, -0.9, 0, 1.0, -0.6, 3.2, () => minaret(sc, 0.88, -0.75, 2.6, 0.11), { tag: 'minaret', shadow: true });
  // dziedziniec: fontanna i palmy
  B.cyl(0.0, 0.68, 0, 0.22, 0.34, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 });
  B.part(-0.34, 0.34, 0.2, 0.34, 1.02, 0.5, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0, 0.68, 0.22); g.fillStyle = '#3a9ab8'; g.beginPath(); g.ellipse(px, py, 0.28 * AX * f * 1.4142, 0.28 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(px - 4 * f, py - 1 * f, 10 * f, 3 * f, 0, 0, TAU); g.fill(); }, { tag: 'woda', shadow: false, nest: true });
  B.tree('palm', 3, -1.05, 0.8, 0.6); B.tree('palm', 4, 1.0, 0.5, 0.55);
  // mury przednie z bramą-pishtak
  B.box(-w, w - t, 0, -0.5, w, zf, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S) => { mosaicBand(sc, S.O, S.U, S.V, zf - 0.15, 0.07, 'S'); });
  B.box(0.5, w - t, 0, w, w, zf, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S) => { mosaicBand(sc, S.O, S.U, S.V, zf - 0.15, 0.07, 'S'); });
  B.box(w - t, -w + t, 0, w, w - t, zf, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S, E) => { mosaicBand(sc, E.O, E.U, E.V, zf - 0.15, 0.07, 'E'); });
  B.box(-0.5, w - 0.55, 0, 0.5, w + 0.1, 1.7, 'sandstone', { ao: 0.25, pal: SR.sandL, eave: 0.3 }, (S) => sc.local(S.O, S.U, S.V, (g, lu) => {
    const vb = 1.7, ww = 0.62, u0 = (lu - ww) / 2; g.fillStyle = SR.teal; g.beginPath(); g.moveTo(u0 - 0.06, vb); g.lineTo(u0 - 0.06, 0.7); g.arc(lu / 2, 0.7, ww / 2 + 0.06, Math.PI, 0); g.lineTo(u0 + ww + 0.06, vb); g.closePath(); g.fill();
    g.fillStyle = SR.dark; g.beginPath(); g.moveTo(u0, vb); g.lineTo(u0, 0.72); g.arc(lu / 2, 0.72, ww / 2, Math.PI, 0); g.lineTo(u0 + ww, vb); g.closePath(); g.fill();
    g.fillStyle = SR.door; g.beginPath(); g.moveTo(u0 + 0.1, vb); g.lineTo(u0 + 0.1, 1.0); g.arc(lu / 2, 1.0, ww / 2 - 0.1, Math.PI, 0); g.lineTo(u0 + ww - 0.1, vb); g.closePath(); g.fill();
    g.strokeStyle = SR.gold; g.lineWidth = 0.016; g.beginPath(); g.moveTo(u0 - 0.06, vb); g.lineTo(u0 - 0.06, 0.7); g.arc(lu / 2, 0.7, ww / 2 + 0.06, Math.PI, 0); g.lineTo(u0 + ww + 0.06, vb); g.stroke();
    g.fillStyle = SR.tealL; for (let i = 0; i < 5; i++) g.fillRect(0.06 + i * (lu - 0.12) / 5, 0.1, (lu - 0.12) / 5 - 0.02, 0.18); }));
  merlons(-0.45, w + 0.05, 0.45, w + 0.05, 1.7, 5);
  B.box(-0.3, w + 0.1, 0, 0.3, 1.99, 0.06, 'plank', { pal: '#7a5632', ao: 0.3 });
  merlons(-w + 0.4, w - 0.05, -0.55, w - 0.05, zf, 4); merlons(0.55, w - 0.05, w - 0.4, w - 0.05, zf, 4); merlons(w - 0.05, -w + 0.4, w - 0.05, w - 0.45, zf, 10);
  tower(w - 0.05, w - 0.05, 1.5);
  return B.flush({ shadow: { alpha: 0.5, blur: 14 } });
};

/* DOM 2×2 (Chata): taras z attyką, mała nadbudówka z kopułką, markiza nad drzwiami */
BAKED.saracens_hut = function () {
  const sc = sceneFor(2, 2, 2.6), B = new Build(sc), x0 = -0.8, x1 = 0.8, y0 = -0.85, y1 = 0.5, zg = 1.0;
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 21, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0, x1, y0, y1, h: zg, S: { door: sarDoor(0.32), win: { n: 1, ...arcWin() } }, E: { win: { n: 2, ...arcWin(0.2, 0.34, 0.26, { frame: SR.wood }) } } });
  B.box(x0 + 0.1, y0 + 0.1, zg + 0.12, x0 + 0.95, y0 + 0.75, zg + 0.7, 'sandstone', { ao: 0.25, pal: SR.sandL }, (S) => facade(sc, S, { win: { n: 1, ...arcWin(0.16, 0.28, 0.14, { lit: '#f6c866', lit2: '#c98a30' }) } }));
  B.dome(x0 + 0.525, y0 + 0.425, zg + 0.7, 0.32, { cols: SR.domeSand });
  B.part(-0.6, y1, 0.82, 0.04, y1 + 0.3, 0.98, () => awning(sc, -0.6, y1 + 0.01, 0.96, 0.64, 0.24, 0.1), { tag: 'markiza', kind: 'roof' });
  B.stairs(-0.46, -0.1, y1 + 0.02, 2, 0.12, 'sandstone', 0.13);
  B.jar(0.5, 0.72); B.jar(0.66, 0.64, 0.9); B.sack(0.25, 0.82, '#d8c898'); B.barrel(-0.7, 0.8);
  return B.flush();
};

/* CHATA DRWALA 2×2: lepianka z szopą z liści palmowych, kłody, pień do rąbania */
BAKED.saracens_woodcutter = function () {
  const sc = sceneFor(2, 2, 2.2), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 22, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.85, x1: 0.35, y0: -0.85, y1: 0.0, h: 0.75, pal: SR.mud, band: false, S: { door: sarDoor(0.3, 0.3, 0.45), win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } } });
  B.pergola(0.45, 0.1, 0.95, 0.75, 0.62); B.logs(0.7, 0.55); B.logs(0.7, 0.35);
  B.logs(-0.6, 0.35); B.logs(-0.6, 0.58); B.stump(-0.15, 0.45);
  return B.flush();
};

/* LEŚNICZÓWKA 2×2: lepianka i grządka z sadzonkami palm, kanał nawadniający */
BAKED.saracens_forester = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 23, pal: '#b79a62', alpha: 0.75 });
  sc.decal('dirt', '#4a3822', [[[-0.86, 0.28], [0.86, 0.28], [0.86, 0.9], [-0.86, 0.9]]], { feather: 5, alpha: 0.92 });
  flatHouse(B, { x0: -0.85, x1: 0.35, y0: -0.85, y1: -0.08, h: 0.75, pal: SR.mud, band: false, S: { door: sarDoor(0.3, 0.3, 0.45), win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } } });
  B.mudWall(-0.9, 0.25, 0.9, 0.25, 0.2); B.mudWall(-0.9, 0.25, -0.9, 0.95, 0.2); B.mudWall(0.9, 0.25, 0.9, 0.95, 0.2);
  B.channel(-0.8, 0.9, 0.8, 0.97);
  for (const x of [-0.6, -0.2, 0.2, 0.6]) B.tree('palm', 31 + Math.round(x * 5), x, 0.62, 0.26);
  B.bucket(0.55, 0.0); B.jar(0.7, 0.1);
  return B.flush();
};

/* TARTAK 3×2: otwarta wiata z dachem z liści, piła ramowa na belce, stosy kłód i desek */
BAKED.saracens_sawmill = function () {
  const sc = sceneFor(3, 2, 2.2), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 24, pal: '#b79a62', alpha: 0.75 });
  B.box(-1.3, -0.75, 0, 0.55, 0.45, 0.06, 'plank', { pal: '#8a6a40', ao: 0.3, shadow: false });
  B.box(-1.3, -0.75, 0.06, 0.45, -0.67, 0.95, 'sandstone', { pal: SR.mud, ao: 0.3, wear: 0.8 }); B.box(-1.3, -0.67, 0.06, -1.22, 0.35, 0.95, 'sandstone', { pal: SR.mud, ao: 0.3, wear: 0.8 });
  for (const [px, py] of [[-1.3, 0.35], [-0.4, 0.35], [0.45, 0.35], [0.45, -0.75]]) B.box(px, py, 0.06, px + 0.1, py + 0.1, 0.95, 'bark', { pal: '#6a4a2c', ao: 0.2 });
  B.part(-1.32, -0.77, 0.95, 0.57, 0.47, 0.99, () => sc.face([-1.32, -0.77, 0.97], [1.89, 0, 0], [0, 1.24, 0], 'thatch', { shade: 1, pal: '#9a8a4a', wear: 0.4, edge: 0.4 }), { tag: 'daszek', kind: 'roof' });
  B.sawRig(-1.1, 0.0, 0.0);
  B.logs(-1.1, 0.7); B.logs(-0.75, 0.72); B.planks(0.7, -0.3, 1.2, 0.0, 0.34); B.planks(0.72, 0.15, 1.15, 0.4, 0.26, '#d0b07a');
  return B.flush();
};

/* CHATA MYŚLIWEGO 2×2: lepianka, suszarka ze skórami, łuk i kołczan na ścianie */
BAKED.saracens_hunter = function () {
  const sc = sceneFor(2, 2, 2.2), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 25, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.9, x1: 0.4, y0: -0.85, y1: 0.05, h: 0.78, pal: SR.mud, band: false, S: { door: sarDoor(0.4, 0.3, 0.46), win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } },
    deco: (S) => sc.local(S.O, S.U, S.V, (g) => { g.strokeStyle = '#5a3a1c'; g.lineWidth = 0.02; g.lineCap = 'round'; g.beginPath(); g.moveTo(1.0, 0.1); g.quadraticCurveTo(0.92, 0.3, 1.0, 0.5); g.stroke(); g.lineWidth = 0.008; g.strokeStyle = '#e8e0c8'; g.beginPath(); g.moveTo(1.0, 0.1); g.lineTo(1.0, 0.5); g.stroke(); g.fillStyle = '#7a4a22'; g.fillRect(1.08, 0.14, 0.05, 0.3); }) });
  B.rack(0.78, -0.55, 0.78, 0.3, 'pelts', 0.78); B.barrel(-0.7, 0.4); B.stump(-0.3, 0.55);
  return B.flush();
};

/* MLECZARNIA 2×3: dom z zagrodą z cegły mułowej, dzbany, stół z serami */
BAKED.saracens_dairy = function () {
  const sc = sceneFor(2, 3, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.7, { seed: 26, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.8, x1: 0.8, y0: -1.4, y1: -0.2, h: 0.9, S: { door: sarDoor(0.5, 0.34, 0.52), win: { n: 2, ...arcWin(0.18, 0.3, 0.22) } }, E: { win: { n: 2, ...arcWin(0.18, 0.3, 0.22, { frame: SR.wood }) } } });
  B.mudWall(-0.9, 1.3, -0.1, 1.3, 0.22); B.mudWall(0.1, 1.3, 0.9, 1.3, 0.22); B.mudWall(-0.9, 0.6, -0.9, 1.3, 0.22); B.mudWall(0.9, 0.6, 0.9, 1.3, 0.22);
  B.jar(-0.6, 0.35); B.jar(-0.4, 0.42); B.jar(-0.62, 0.58, 0.9);
  B.box(0.3, 0.3, 0, 0.8, 0.52, 0.32, 'plank', { pal: '#8a6a40', ao: 0.3, tag: 'stół' });
  B.disc(0.42, 0.4, 0.32, 0.07, 0.05, [236, 206, 120]); B.disc(0.62, 0.4, 0.32, 0.07, 0.05, [230, 196, 104]); B.churn(0.0, 0.75);
  return B.flush();
};

/* SAD 3×3: drzewa owocowe (figi, granaty) w murowanym ogrodzie z kanałem nawadniającym i koszami */
BAKED.saracens_orchard = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc);
  sc.decal('grass', 'sand', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.5 });
  B.mudWall(-1.38, -1.3, 1.38, -1.3, 0.22); B.mudWall(-1.38, -1.3, -1.38, 1.3, 0.22); B.mudWall(1.38, -1.3, 1.38, 1.3, 0.22);
  B.mudWall(-1.38, 1.3, -0.3, 1.3, 0.22); B.mudWall(0.3, 1.3, 1.38, 1.3, 0.22);
  B.channel(-1.2, 0.58, 1.2, 0.66);
  [[-0.85, -0.65], [0.0, -0.72], [0.85, -0.65], [-0.8, 0.2], [0.05, 0.12], [0.85, 0.2]].forEach(([x, y], i) => B.tree('olive', 21 + i, x, y, 0.78));
  B.crate(-1.0, 1.0, 0.24, 0.2); B.heap(-1.0, 1.0, 0.13, 0.1, ['#f0a040', '#d07020', '#7a3a10'], 0.2); B.jar(0.9, 1.0); B.jar(1.08, 0.92, 0.9);
  return B.flush();
};

/* CHATA NOSIWODY 2×2: sabil — kioskowy dom z kopułą i otworami z kratą, poidło z wodą, dzbany */
BAKED.saracens_watercarrier = function () {
  const sc = sceneFor(2, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 27, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.55, x1: 0.45, y0: -0.75, y1: 0.2, h: 0.95, S: { win: { n: 2, ...arcWin(0.22, 0.46, 0.28, { lit: '#243a42', lit2: '#101e24' }) } }, E: { win: { n: 2, ...arcWin(0.2, 0.46, 0.28, { lit: '#243a42', lit2: '#101e24' }) } } });
  B.cyl(-0.05, -0.28, 0.95, 1.12, 0.36, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); B.dome(-0.05, -0.28, 1.12, 0.38);
  B.box(-0.55, 0.3, 0, 0.35, 0.62, 0.24, { east: 'sandstone', south: 'sandstone', top: 'water' }, { pal: '#d8c08a', ao: 0.3, tag: 'poidło' });
  B.jar(-0.6, 0.82); B.jar(-0.42, 0.88, 0.9); B.jar(0.6, 0.4); B.jar(0.7, 0.55, 0.9); B.jar(0.62, 0.7);
  return B.flush();
};

/* TARG 3×3: bruk, trzy stragany pod pasiastymi markizami, pawilon z fontanną i dywany */
BAKED.saracens_market = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc);
  sc.paved(-1.5, -1.5, 1.5, 1.5, { mat: 'pavers', pal: '#c0b088', seed: 13, jit: 0.1 }); sc.patch(0, 0, 2.2, 2.2, { seed: 31, pal: '#b79a62', alpha: 0.5, feather: 16 });
  B.stall(-0.95, -1.35, { pal: '#b8352b|#f1e6c8', kind: 'fruit' }); B.stall(0, -1.35, { pal: '#2f6ea8|#f1e6c8', kind: 'cloth' }); B.stall(0.95, -1.35, { pal: '#d8a830|#f1e6c8', kind: 'spice' });
  B.rug(-1.2, 0.35, 0.7, 0.45); B.rug(0.55, 0.6, 0.6, 0.4, '#2f6ea8|#f1e6c8');
  B.cyl(0, -0.1, 0, 0.26, 0.34, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 });
  B.part(-0.3, -0.4, 0.26, 0.3, 0.2, 0.3, () => { const g = sc.g, f = sc.F, [wx, wy] = sc.P(0, -0.1, 0.26); g.fillStyle = '#3a9ab8'; g.beginPath(); g.ellipse(wx, wy, 0.27 * AX * f * 1.4142, 0.27 * AY * f * 1.4142, 0, 0, TAU); g.fill(); }, { tag: 'woda', shadow: false, nest: true });
  for (const [px, py] of [[-0.3, -0.4], [0.24, -0.4], [-0.3, 0.14], [0.24, 0.14]]) B.box(px, py, 0.26, px + 0.06, py + 0.06, 1.0, 'bark', { ao: 0.1, pal: '#6a4a2c' });
  B.pyramid({ x0: -0.34, x1: 0.34, y0: -0.44, y1: 0.24, z: 1.0, rise: 0.4, mat: 'thatch', pal: '#9a8a4a', ov: 0.1 });
  B.crate(1.2, 1.2, 0.2, 0.2); B.crate(1.2, 1.0, 0.2, 0.34); B.barrel(-1.3, 1.25); B.sack(0.85, 1.25); B.sack(0.98, 1.36, '#c9b27a', 0.9); B.jar(-1.1, 1.05);
  return B.flush();
};

/* SKŁAD 3×2: magazyn z płaskim dachem i nadbudówką świetlika, wielka brama, amfory i worki */
BAKED.saracens_store = function () {
  const sc = sceneFor(3, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 28, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -1.3, x1: 1.3, y0: -0.7, y1: 0.35, h: 1.0, S: { door: sarDoor(0.5, 0.6, 0.5), win: { n: 2, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } } });
  B.box(-0.5, -0.5, 1.12, 0.5, -0.05, 1.45, 'sandstone', { ao: 0.25, pal: SR.sandL }, (S) => facade(sc, S, { win: { n: 2, ...arcWin(0.16, 0.2, 0.08, { lit: '#243a42', lit2: '#101e24' }) } }));
  B.parapet(-0.51, -0.51, 0.51, -0.04, 1.45, 0.1, 0.06);
  B.stairs(-0.3, 0.3, 0.37, 2, 0.12, 'sandstone', 0.14);
  B.jar(-1.0, 0.65); B.jar(-0.82, 0.7); B.jar(-0.68, 0.62, 0.95); B.jar(-0.9, 0.85, 0.9); B.sack(0.7, 0.65); B.sack(0.9, 0.72); B.sack(0.8, 0.85, '#c9b27a', 0.9); B.crate(1.1, 0.6, 0.22, 0.22);
  return B.flush();
};

/* MECZET 3×3: sala modlitewna z kopułą na bębnie, portal-iwan, dziedziniec z fontanną, minaret */
BAKED.saracens_temple = function () {
  const sc = sceneFor(3, 3, 3.6), B = new Build(sc), x0 = -1.1, x1 = 1.1, y0 = -1.25, y1 = 0.3, zw = 1.15;
  sc.paved(-1.45, 0.35, 1.45, 1.45, { mat: 'pavers', pal: '#c8b890', seed: 9, jit: 0.1 });
  sc.patch(0, 0.05, 2.0, 1.9, { seed: 27, pal: '#b79a62', alpha: 0.6, feather: 18 });
  B.box(x0 - 0.04, y0 - 0.04, 0, x1 + 0.04, y1 + 0.04, 0.1, 'sandstone', { ao: 0.4, pal: SR.sandD });
  B.box(x0, y0, 0.1, x1, y1, zw, 'sandstone', { ao: 0.3, pal: SR.wall2, topPal: SR.sandL, eave: 0.25 }, (S, E) => {
    mosaicBand(sc, S.O, S.U, S.V, zw - 0.2, 0.1, 'S'); mosaicBand(sc, E.O, E.U, E.V, zw - 0.2, 0.1, 'E');
    facade(sc, S, { win: arcWin(0.17, 0.46, 0.34, { n: 3, lit: '#2c4a50', lit2: '#16282c' }) }); facade(sc, E, { win: arcWin(0.17, 0.46, 0.34, { n: 2, lit: '#2c4a50', lit2: '#16282c' }) });
  });
  B.parapet(x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01, zw, 0.1, 0.06, '#e6d1a0', 'sandstone', [-0.44, 0.44]);
  // portal-iwan z głęboką niszą i mozaiką
  B.box(-0.4, y1, 0.1, 0.4, 0.72, 1.45, 'sandstone', { ao: 0.25, pal: SR.sandL, eave: 0.2 }, (S) => sc.local(S.O, S.U, S.V, (g, lu) => {
    g.fillStyle = SR.teal; g.beginPath(); g.moveTo(0.06, 1.35); g.lineTo(0.06, 0.55); g.arc(lu / 2, 0.55, lu / 2 - 0.06, Math.PI, 0); g.lineTo(lu - 0.06, 1.35); g.closePath(); g.fill();
    g.fillStyle = SR.dark; g.beginPath(); g.moveTo(0.14, 1.35); g.lineTo(0.14, 0.58); g.arc(lu / 2, 0.58, lu / 2 - 0.14, Math.PI, 0); g.lineTo(lu - 0.14, 1.35); g.closePath(); g.fill();
    g.fillStyle = SR.door; g.beginPath(); g.moveTo(0.26, 1.35); g.lineTo(0.26, 0.9); g.arc(lu / 2, 0.9, lu / 2 - 0.26, Math.PI, 0); g.lineTo(lu - 0.26, 1.35); g.closePath(); g.fill();
    g.strokeStyle = SR.gold; g.lineWidth = 0.014; g.beginPath(); g.moveTo(0.06, 1.35); g.lineTo(0.06, 0.55); g.arc(lu / 2, 0.55, lu / 2 - 0.06, Math.PI, 0); g.lineTo(lu - 0.06, 1.35); g.stroke(); }));
  // kopuły: wielka na bębnie + dwie małe na rogach frontu
  B.cyl(0, -0.4, zw, zw + 0.38, 0.62, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', topPal: SR.sandL, ao: 0.5 }); B.dome(0, -0.4, zw + 0.38, 0.68);
  for (const cx of [-0.85, 0.85]) { B.cyl(cx, y1 - 0.25, zw, zw + 0.25, 0.18, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); B.dome(cx, y1 - 0.25, zw + 0.25, 0.21, { nest: true }); }
  // dziedziniec: niski mur z arkadą i fontanna
  B.box(-1.45, 1.38, 0, 1.45, 1.46, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' }, (S) => sc.local(S.O, S.U, S.V, (g) => { g.fillStyle = '#1a1510'; for (let i = 0; i < 9; i++) { const u = 0.15 + i * 0.3; if (u > 1.2 && u < 1.7) continue; g.beginPath(); g.moveTo(u, 0.5); g.lineTo(u, 0.24); g.arc(u + 0.09, 0.24, 0.09, Math.PI, 0); g.lineTo(u + 0.18, 0.5); g.closePath(); g.fill(); } }));
  B.box(-1.45, 0.4, 0, -1.37, 1.38, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' }); B.box(1.37, 0.4, 0, 1.45, 1.38, 0.5, 'sandstone', { ao: 0.2, pal: '#dcc490' });
  B.cyl(0, 1.05, 0, 0.22, 0.3, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 });
  B.part(-0.3, 0.75, 0.22, 0.3, 1.35, 0.55, () => { const g = sc.g, f = sc.F, [wx, wy] = sc.P(0, 1.05, 0.22); g.fillStyle = '#3a9ab8'; g.beginPath(); g.ellipse(wx, wy, 0.23 * AX * f * 1.4142, 0.23 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(wx - 4 * f, wy - 1 * f, 10 * f, 3 * f, 0, 0, TAU); g.fill(); }, { tag: 'woda', shadow: false, nest: true });
  B.part(1.13, 0.38, 0, 1.37, 0.62, 3.4, () => minaret(sc, 1.25, 0.5, 2.55, 0.12), { tag: 'minaret', shadow: true });
  return B.flush();
};

/* GLINIANKA 3×3: wyrobisko z glinianą skarpą, hałdy gliny, cegły schnące na słońcu i lepianka */
BAKED.saracens_claypit = function () {
  const sc = sceneFor(3, 3, 2.2, { pRes: RES }), B = new Build(sc);
  sc.decal('dirt', '#a8643a', [[[-1.42, -1.25], [1.42, -1.25], [1.42, 1.05], [-1.42, 1.05]]], { feather: 14, alpha: 0.95 });
  sc.decal('dirt', '#7a4426', [[[-1.0, -0.8], [0.7, -0.8], [0.7, 0.45], [-1.0, 0.45]]], { feather: 10, alpha: 0.9 });
  B.box(-1.35, -1.3, 0, 0.5, -0.9, 0.5, { east: 'dirt', south: 'dirt', top: 'dirt' }, { pal: '#a8643a', ao: 0.35, wear: 0.5, tag: 'skarpa' });
  B.box(-1.35, -1.3, 0.5, -0.2, -1.05, 0.8, { east: 'dirt', south: 'dirt', top: 'dirt' }, { pal: '#b0703e', ao: 0.3, wear: 0.5 });
  flatHouse(B, { x0: 0.7, x1: 1.4, y0: -1.3, y1: -0.7, h: 0.72, pal: SR.mud, band: false, S: { door: sarDoor(0.35, 0.26, 0.4), win: { n: 1, ...arcWin(0.14, 0.22, 0.18, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.14, 0.22, 0.18, { frame: SR.wood }) } } });
  B.bricksRow(-1.2, 0.55, 5); B.bricksRow(-1.2, 0.78, 5); B.bricksRow(-1.2, 1.0, 5, '#b87a40');
  B.heap(0.95, 0.35, 0.35, 0.3, 'clay'); B.heap(0.2, 0.2, 0.28, 0.22, 'clay');
  B.barrel(0.7, 1.05); B.jar(0.95, 1.0); B.crate(1.2, 0.85, 0.2, 0.2);
  return B.flush();
};

/* GAJ DAKTYLOWY 3×3: pięć palm daktylowych, kanał nawadniający i kosze z daktylami */
BAKED.saracens_dategrove = function () {
  const sc = sceneFor(3, 3, 3.0), B = new Build(sc);
  sc.decal('grass', 'sand', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.5 });
  B.channel(-1.25, 0.7, 1.25, 0.78);
  [[-0.9, -0.75], [0.05, -0.9], [0.95, -0.7], [-0.5, 0.15], [0.5, 0.1]].forEach(([x, y], i) => B.tree('palm', 51 + i, x, y, 0.92));
  B.part(-1.15, 0.9, 0, -0.5, 1.2, 0.18, () => { const g = sc.g, f = sc.F; for (const [x, y] of [[-1.0, 1.0], [-0.75, 1.08]]) { const [px, py] = sc.P(x, y, 0); g.fillStyle = '#9a6e34'; g.strokeStyle = 'rgba(30,18,6,0.8)'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py - 4 * f, 9 * f, 5.5 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#5a3418'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(px - 6 * f + i * 2.4 * f, py - 7 * f, 2.2 * f, 0, TAU); g.fill(); } } }, { tag: 'kosze', shadow: false });
  B.jar(1.0, 1.0); B.jar(1.18, 0.92, 0.9);
  return B.flush();
};

/* LAS KADZIDLANY 3×3: rzędy niskich drzewek żywicznych, chata zbieracza i dzbany na żywicę */
BAKED.saracens_incensewood = function () {
  const sc = sceneFor(3, 3, 2.2), B = new Build(sc);
  sc.decal('grass', 'sand', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.7 });
  [-0.95, 0, 0.95].forEach((x, i) => [-0.9, -0.3, 0.3].forEach((y, j) => B.tree('olive', 61 + i * 3 + j, x + (j % 2) * 0.12, y, 0.5)));
  flatHouse(B, { x0: 0.6, x1: 1.35, y0: 0.7, y1: 1.3, h: 0.7, pal: SR.mud, band: false, S: { door: sarDoor(0.35, 0.26, 0.4) }, E: { win: { n: 1, ...arcWin(0.14, 0.22, 0.18, { frame: SR.wood }) } } });
  B.jar(-0.9, 1.0); B.jar(-0.72, 1.1, 0.9); B.jar(-0.5, 0.98); B.sack(0.1, 1.05, '#d8c898');
  return B.flush();
};

/* WYTWÓRNIA KADZIDŁA 2×3: dom z kopułą, kadzielnice z dymkiem, dzbany i worki żywicy */
BAKED.saracens_incense = function () {
  const sc = sceneFor(2, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 29, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.8, x1: 0.6, y0: -1.4, y1: -0.3, h: 0.92, S: { door: sarDoor(0.3, 0.36, 0.54), win: { n: 1, ...arcWin(0.2, 0.34, 0.24) } }, E: { win: { n: 2, ...arcWin(0.18, 0.32, 0.24, { frame: SR.wood }) } } });
  B.cyl(-0.1, -0.85, 0.92, 1.1, 0.42, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); B.dome(-0.1, -0.85, 1.1, 0.44, { cols: SR.domeSand });
  B.rug(-0.3, 0.1, 0.8, 0.5, '#a8352b|#d8a830'); B.censer(-0.15, 0.3); B.censer(0.3, 0.4);
  B.jar(-0.7, 0.2); B.jar(-0.55, 0.3, 0.9); B.sack(0.65, 0.2, '#d8c898'); B.sack(0.75, 0.35, '#cdbb88', 0.9);
  return B.flush();
};

/* PLANTACJA BAWEŁNY 3×3: rzędy krzewów z białymi torebkami, bele i chata */
BAKED.saracens_cotton = function () {
  const sc = sceneFor(3, 3, 2.0, { pRes: RES }), B = new Build(sc);
  for (const y of [-0.85, -0.15, 0.55]) sc.decal('dirt', '#6a4a2a', [[[-1.4, y - 0.2], [1.4, y - 0.2], [1.4, y + 0.2], [-1.4, y + 0.2]]], { feather: 8, alpha: 0.85 });
  for (const y of [-0.85, -0.15, 0.55]) B.cottonRow(-1.3, 1.3, y);
  flatHouse(B, { x0: 0.6, x1: 1.35, y0: 0.9, y1: 1.4, h: 0.62, pal: SR.mud, band: false, S: { door: sarDoor(0.4, 0.24, 0.36) } });
  B.sack(-1.0, 1.1, '#f6f2e6', 1.1); B.sack(-0.78, 1.18, '#f6f2e6', 1.1); B.sack(-0.9, 1.0, '#f0ece0', 1.0, 0.2); B.jar(0.0, 1.1);
  return B.flush();
};

/* TKALNIA 2×3: dom z krosnem pod markizą, suszarka z kolorowymi tkaninami i bele */
BAKED.saracens_weaver = function () {
  const sc = sceneFor(2, 3, 2.4), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 30, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.8, x1: 0.6, y0: -1.4, y1: -0.35, h: 0.9, S: { door: sarDoor(0.25, 0.34, 0.52), win: { n: 1, ...arcWin(0.2, 0.34, 0.24) } }, E: { win: { n: 2, ...arcWin(0.18, 0.32, 0.24, { frame: SR.wood }) } } });
  B.loom(-0.45, 0.4, 0.6); B.rack(0.35, 0.3, 0.35, 1.0, 'cloth', 0.85);
  B.sack(-0.7, 0.85, '#f0e8d0'); B.sack(-0.52, 0.95, '#e8e0c8', 0.9); B.jar(0.0, 0.95);
  return B.flush();
};

/* GARNCARNIA 2×3: dom, piec garncarski z kopułą i żarem, stosy dzbanów i koło garncarskie */
BAKED.saracens_pottery = function () {
  const sc = sceneFor(2, 3, 2.6), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 32, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -0.85, x1: 0.35, y0: -1.4, y1: -0.35, h: 0.88, S: { door: sarDoor(0.3, 0.34, 0.52), win: { n: 1, ...arcWin(0.2, 0.34, 0.24) } }, E: { win: { n: 1, ...arcWin(0.18, 0.32, 0.24, { frame: SR.wood }) } } });
  B.box(0.5, -1.0, 0, 0.98, -0.52, 0.25, 'sandstone', { pal: '#b88a52', ao: 0.3 }); B.dome(0.74, -0.76, 0.25, 0.26, { cols: ['#e8c898', '#c8946a', '#9a6a44', '#5a3c24'], finial: false }); B.smoke(0.74, -0.76, 0.62);
  B.part(0.6, -0.55, 0.25, 0.88, -0.45, 0.45, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.74, -0.5, 0.33); g.fillStyle = '#1c120c'; g.beginPath(); g.ellipse(px, py, 8 * f, 6 * f, 0, 0, TAU); g.fill(); const gl = g.createRadialGradient(px, py, 0, px, py, 8 * f); gl.addColorStop(0, 'rgba(255,220,120,0.9)'); gl.addColorStop(1, 'rgba(255,100,20,0.5)'); g.fillStyle = gl; g.beginPath(); g.ellipse(px, py + 1 * f, 5.4 * f, 3.8 * f, 0, 0, TAU); g.fill(); }, { tag: 'otwór pieca', shadow: false, nest: true });
  for (const [x, y, s] of [[-0.7, 0.2, 1], [-0.52, 0.3, 0.9], [-0.7, 0.42, 1.1], [-0.4, 0.5, 0.9], [0.0, 0.2, 1], [0.18, 0.3, 0.9]]) B.jar(x, y, s);
  B.disc(0.4, 0.55, 0, 0.18, 0.06, [196, 140, 90]); B.heap(0.85, 0.5, 0.25, 0.18, 'clay');
  return B.flush();
};

/* QANAT 3×2: murowane wylotowe ujęcie z łukowym tunelem, kanał i basen z wodą, dwa szyby z wyciągami */
BAKED.saracens_qanat = function () {
  const sc = sceneFor(3, 2, 2.2, { pRes: RES }), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 33, pal: '#b79a62', alpha: 0.7 });
  B.box(-0.8, -0.9, 0, 0.8, -0.35, 0.8, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S, E) => {
    mosaicBand(sc, S.O, S.U, S.V, 0.8 - 0.16, 0.08, 'S'); mosaicBand(sc, E.O, E.U, E.V, 0.8 - 0.16, 0.08, 'E');
    facade(sc, S, { door: { at: 0.5, w: 0.5, h: 0.36, arch: true, frame: SR.teal, pal: '#0a1216' } });
  });
  B.parapet(-0.81, -0.91, 0.81, -0.34, 0.8, 0.1, 0.06);
  for (const x of [-1.15, 1.15]) { B.cyl(x, -0.62, 0, 0.3, 0.2, { mat: 'sandstone', pal: SR.sandD, topMat: 'sandstone', ao: 0.4 }); B.part(x - 0.15, -0.77, 0.3, x + 0.15, -0.47, 0.34, () => { const g = sc.g, [px, py] = sc.P(x, -0.62, 0.3), rx = 0.14 * AX * sc.F * 1.4142; g.fillStyle = '#0a1216'; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, TAU); g.fill(); }, { tag: 'szyb', shadow: false, nest: true }); }
  B.channel(-0.2, -0.3, 0.2, 0.4);
  const rim = (x0, y0, x1, y1) => B.box(x0, y0, 0, x1, y1, 0.14, 'sandstone', { pal: SR.sandD, ao: 0.2, tag: 'obrzeże' });
  rim(-0.9, 0.38, 0.9, 0.46); rim(-0.9, 0.46, -0.82, 0.82); rim(0.82, 0.46, 0.9, 0.82); rim(-0.9, 0.82, 0.9, 0.9);
  B.channel(-0.8, 0.46, 0.8, 0.82);
  B.jar(1.2, 0.5); B.jar(1.05, 0.6, 0.9); B.jar(-1.15, 0.55);
  return B.flush();
};

/* ŁAŹNIA 3×3: hammam z trzema kopułami z gwiaździstymi świetlikami, wejście, ławy i dzbany w dziedzińcu */
BAKED.saracens_bathhouse = function () {
  const sc = sceneFor(3, 3, 3.0), B = new Build(sc);
  sc.paved(-1.4, 0.35, 1.4, 1.4, { mat: 'pavers', pal: '#c8b890', seed: 11, jit: 0.1 }); sc.patch(0, 0.1, 2.0, 1.9, { seed: 34, pal: '#b79a62', alpha: 0.55, feather: 18 });
  flatHouse(B, { x0: -1.2, x1: 1.0, y0: -1.2, y1: 0.3, h: 0.95, S: { door: sarDoor(0.28, 0.4, 0.5), win: { n: 2, ...arcWin(0.18, 0.28, 0.26) } }, E: { win: { n: 2, ...arcWin(0.18, 0.28, 0.26, { frame: SR.wood }) } } });
  const star = (cx, cy, z, r) => B.part(cx - r, cy - r, z, cx + r, cy + r, z + r * 1.2, () => { const g = sc.g, f = sc.F, [dx, dy] = sc.P(cx, cy, z), R2 = r * AX * f * 1.4142; g.fillStyle = 'rgba(14,30,40,0.85)'; for (const [a, b] of [[0, -0.55], [-0.4, -0.3], [0.4, -0.3], [-0.25, -0.65], [0.25, -0.65]]) { g.beginPath(); g.arc(dx + a * R2, dy + b * R2, R2 * 0.08, 0, TAU); g.fill(); } }, { tag: 'świetlik', shadow: false, nest: true });
  B.cyl(-0.1, -0.45, 0.95, 1.2, 0.46, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); B.dome(-0.1, -0.45, 1.2, 0.5, { cols: SR.domeSand }); star(-0.1, -0.45, 1.3, 0.5);
  for (const cx of [-0.88, 0.7]) { B.cyl(cx, -0.0, 0.95, 1.1, 0.2, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4 }); B.dome(cx, 0.0, 1.1, 0.24, { cols: SR.domeSand, finial: false, nest: true }); }
  B.box(0.55, -1.15, 0.95, 0.85, -0.85, 1.7, 'sandstone', { ao: 0.25, pal: SR.sandL });
  B.box(-0.85, 0.75, 0, -0.35, 0.95, 0.22, 'sandstone', { pal: SR.sandD, ao: 0.3, tag: 'ława' }); B.box(0.35, 0.75, 0, 0.85, 0.95, 0.22, 'sandstone', { pal: SR.sandD, ao: 0.3, tag: 'ława' });
  B.jar(-1.1, 1.0); B.jar(-0.95, 1.1, 0.9); B.jar(1.05, 1.0); B.tree('palm', 71, 1.2, 0.6, 0.5);
  return B.flush();
};

/* KARAWANSERAJ 4×3: mur z arkadą i kopułami, dziedziniec ze studnią, wielbłądami i towarem, portal-pishtak od frontu */
BAKED.saracens_caravanserai = function () {
  const sc = sceneFor(4, 3, 3.0), B = new Build(sc), w = 1.9, hz = 1.4, t = 0.4, zc = 1.2, zf = 0.82;
  sc.paved(-1.6, -1.0, 1.6, 1.4, { mat: 'pavers', pal: '#c0b088', seed: 17, jit: 0.1 });
  sc.patch(0, 0.05, 2.7, 2.1, { seed: 41, pal: '#b79a62', alpha: 0.55, feather: 18 });
  B.part(-w + t, -hz + t, 0, w - t, hz - t, 0.002, () => sc.face([-w + t, -hz + t, 0.002], [2 * w - 2 * t, 0, 0], [0, 2 * hz - 2 * t, 0], 'pavers', { shade: 1, pal: '#c0b088', wear: 0.5, edge: 0 }), { tag: 'dziedziniec', kind: 'flat', shadow: false });
  const merlons = (x0, y0, x1, y1, z, n) => B.part(Math.min(x0, x1) - 0.05, Math.min(y0, y1) - 0.05, z, Math.max(x0, x1) + 0.05, Math.max(y0, y1) + 0.05, z + 0.13, () => merlonLine(sc, x0, y0, x1, y1, z, n, 0.1, 0.13, 'sandstone'), { tag: 'blanki', shadow: false });
  B.box(-w, -hz, 0, w, -hz + t, zc, 'sandstone', { ao: 0.3, pal: SR.sand }, (S) => sc.local(S.O, S.U, S.V, (g) => { g.fillStyle = '#1a1510'; for (let i = 0; i < 8; i++) { const u = 0.3 + i * 0.45; g.beginPath(); g.moveTo(u, 1.1); g.lineTo(u, 0.5); g.arc(u + 0.12, 0.5, 0.12, Math.PI, 0); g.lineTo(u + 0.24, 1.1); g.closePath(); g.fill(); } }));
  B.box(-w, -hz + t, 0, -w + t, hz - t, zc, 'sandstone', { ao: 0.3, pal: SR.sand });
  merlons(-w + 0.4, -hz + 0.05, w - 0.4, -hz + 0.05, zc, 13); merlons(-w + 0.05, -hz + t + 0.1, -w + 0.05, hz - t - 0.1, zc, 7);
  for (const cx of [-1.2, 0, 1.2]) { B.cyl(cx, -hz + t / 2, zc, zc + 0.3, 0.26, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.4, nest: true }); B.dome(cx, -hz + t / 2, zc + 0.3, 0.3, { cols: SR.domeSand, nest: true }); }
  B.cyl(0.2, 0.0, 0, 0.4, 0.2, { mat: 'sandstone', pal: '#d8c08a', topMat: 'sandstone', ao: 0.3 });
  B.part(0.0, -0.2, 0.4, 0.4, 0.2, 0.44, () => { const g = sc.g, f = sc.F, [wx, wy] = sc.P(0.2, 0, 0.4); g.fillStyle = '#1a2a30'; g.beginPath(); g.ellipse(wx, wy, 0.15 * AX * f * 1.4142, 0.15 * AY * f * 1.4142, 0, 0, TAU); g.fill(); }, { tag: 'woda', shadow: false, nest: true });
  const camel = (x, y, flip = 1) => B.part(x - 0.32, y - 0.12, 0, x + 0.32, y + 0.12, 0.62, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, 0), s = f * 1.2; g.save(); g.translate(px, py); g.scale(flip * s, s);
    g.fillStyle = 'rgba(14,22,8,0.3)'; g.beginPath(); g.ellipse(6, 1, 22, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#b08850'; g.strokeStyle = '#2a1c0c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-18, -22); g.quadraticCurveTo(-12, -34, -4, -26); g.quadraticCurveTo(2, -34, 8, -24); g.quadraticCurveTo(18, -22, 20, -26); g.lineTo(28, -42); g.lineTo(34, -40); g.lineTo(32, -34); g.lineTo(24, -22); g.lineTo(22, -4); g.lineTo(18, -4); g.lineTo(16, -18); g.lineTo(2, -18); g.lineTo(0, -4); g.lineTo(-4, -4); g.lineTo(-6, -18); g.lineTo(-14, -18); g.lineTo(-16, -4); g.lineTo(-20, -4); g.lineTo(-20, -18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#a8352b'; g.fillRect(-12, -26, 16, 6); g.fillStyle = '#d8a830'; g.fillRect(-12, -22, 16, 2); g.fillStyle = '#1a1006'; g.beginPath(); g.arc(32, -38, 1.2, 0, TAU); g.fill(); g.restore(); }, { tag: 'wielbłąd', shadow: false });
  camel(-0.9, -0.05, 1); camel(0.8, 0.4, -1); camel(-0.2, 0.55, 1);
  B.crate(-1.3, 0.6, 0.22, 0.22); B.crate(-1.1, 0.75, 0.22, 0.22); B.crate(1.3, -0.3, 0.22, 0.22); B.sack(-0.7, 0.72); B.sack(-0.55, 0.78, '#c9b27a', 0.9); B.barrel(1.25, 0.2);
  // mury przednie (z oknami) i portal
  const fwall = (x0, x1, nwin) => B.box(x0, hz - t, 0, x1, hz, zf, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S) => { mosaicBand(sc, S.O, S.U, S.V, zf - 0.14, 0.08, 'S'); facade(sc, S, { win: { n: nwin, ...arcWin(0.15, 0.28, 0.22, { frame: SR.wood }) } }); });
  fwall(-w + t, -0.58, 2); fwall(0.58, w - t, 2);
  B.box(w - t, -hz + t, 0, w, hz - t, zf, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S, E) => { mosaicBand(sc, E.O, E.U, E.V, zf - 0.14, 0.08, 'E'); facade(sc, E, { win: { n: 3, ...arcWin(0.15, 0.28, 0.22, { frame: SR.wood }) } }); });
  const gz = 2.1;
  B.box(-0.58, hz - 0.55, 0, 0.58, hz + 0.1, gz, 'sandstone', { ao: 0.25, pal: SR.sandL, eave: 0.3 }, (S) => sc.local(S.O, S.U, S.V, (g, lu) => {
    const vb = gz, ww = lu - 0.36; g.fillStyle = SR.teal; g.beginPath(); g.moveTo(0.1, vb); g.lineTo(0.1, 0.95); g.arc(lu / 2, 0.95, lu / 2 - 0.1, Math.PI, 0); g.lineTo(lu - 0.1, vb); g.closePath(); g.fill();
    g.fillStyle = SR.dark; g.beginPath(); g.moveTo(0.18, vb); g.lineTo(0.18, 0.98); g.arc(lu / 2, 0.98, lu / 2 - 0.18, Math.PI, 0); g.lineTo(lu - 0.18, vb); g.closePath(); g.fill();
    g.fillStyle = SR.door; g.beginPath(); g.moveTo(0.3, vb); g.lineTo(0.3, 1.3); g.arc(lu / 2, 1.3, lu / 2 - 0.3, Math.PI, 0); g.lineTo(lu - 0.3, vb); g.closePath(); g.fill();
    g.strokeStyle = SR.gold; g.lineWidth = 0.016; g.beginPath(); g.moveTo(0.1, vb); g.lineTo(0.1, 0.95); g.arc(lu / 2, 0.95, lu / 2 - 0.1, Math.PI, 0); g.lineTo(lu - 0.1, vb); g.stroke();
    g.fillStyle = SR.tealL; for (let i = 0; i < 5; i++) g.fillRect(0.12 + i * (lu - 0.24) / 5, 0.12, (lu - 0.24) / 5 - 0.02, 0.2); }));
  for (const sx of [-1, 1]) { const x = sx * (w - t / 2); B.box(x - t / 2, hz - t, 0, x + t / 2, hz, 1.5, 'sandstone', { ao: 0.25, pal: SR.wall2 }); B.dome(x, hz - t / 2, 1.5, 0.26, { cols: SR.domeSand, nest: true }); }
  merlons(-w + t + 0.1, hz - 0.05, -0.62, hz - 0.05, zf, 3); merlons(0.62, hz - 0.05, w - t - 0.1, hz - 0.05, zf, 3); merlons(w - 0.05, -hz + t + 0.1, w - 0.05, hz - t - 0.1, zf, 7);
  return B.flush({ shadow: { alpha: 0.5, blur: 12 } });
};

/* STRAŻNICA 2×2: kamienna wieża z platformą z blankami, łukowe wejście i strzelnice, proporzec, stojak z włóczniami */
BAKED.saracens_guardpost = function () {
  const sc = sceneFor(2, 2, 3.2), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 35, pal: '#b79a62', alpha: 0.75 });
  B.box(-0.55, -0.85, 0, 0.55, 0.25, 0.14, 'sandstone', { ao: 0.4, pal: SR.sandD });
  B.box(-0.45, -0.75, 0.14, 0.45, 0.15, 1.7, 'sandstone', { ao: 0.3, pal: SR.sand, eave: 0.3 }, (S, E) => {
    mosaicBand(sc, S.O, S.U, S.V, 1.7 - 0.3, 0.08, 'S'); mosaicBand(sc, E.O, E.U, E.V, 1.7 - 0.3, 0.08, 'E');
    facade(sc, S, { door: sarDoor(0.5, 0.3, 0.46), win: arcWin(0.14, 0.3, 0.5, { n: 1, over: true, lit: '#243a42', lit2: '#101e24' }) });
    sc.local(E.O, E.U, E.V, (g) => { g.fillStyle = SR.dark; for (const v of [0.55, 1.0]) g.fillRect(0.42, v, 0.05, 0.22); });
  });
  B.box(-0.55, -0.85, 1.7, 0.55, 0.25, 1.82, 'sandstone', { ao: 0.1, pal: SR.sandL, nest: true });
  B.part(-0.6, -0.9, 1.82, 0.6, 0.3, 1.95, () => { merlonLine(sc, -0.5, -0.8, 0.5, -0.8, 1.82, 5, 0.1, 0.13, 'sandstone'); merlonLine(sc, -0.5, 0.2, 0.5, 0.2, 1.82, 5, 0.1, 0.13, 'sandstone'); merlonLine(sc, -0.5, -0.6, -0.5, 0.0, 1.82, 3, 0.1, 0.13, 'sandstone'); merlonLine(sc, 0.5, -0.6, 0.5, 0.0, 1.82, 3, 0.1, 0.13, 'sandstone'); }, { tag: 'blanki', shadow: false });
  B.part(-0.04, -0.34, 1.82, 0.04, -0.26, 2.5, () => pennant(sc, 0, -0.3, 1.82, 62, '#b8352b'), { tag: 'proporzec', shadow: false });
  B.weaponRack(0.7, 0.1, 0.95, 0.1, 'spears'); B.barrel(-0.75, 0.55); B.crate(0.1, 0.75, 0.2, 0.2);
  return B.flush();
};
