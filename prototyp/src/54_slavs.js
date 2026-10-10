/* ====================== SŁOWIANIE: zrąb, strzecha, plecionka, drewniane bożki ======================
   Ściany z bali (log), dachy ze strzechy z grubą krawędzią (kalenica z samym wałkiem — bez żadnych głów ani rzeźbionych zwieńczeń), okna z okiennicami (1–2 na ścianę), ganki i spichlerze na palach. */
const SL = { log: '#8a6238', logD: '#6a4a2c', logL: '#a07040', thatch: '#c9a64c', thatchD: '#b99c48', thatchE: '#a98b3e', door: '#6a4a2c', doorF: '#2b1c10', red: '#a8352b', blue: '#2f5aa8', shut: '#5d3f22', plank: '#8a6a40' };

/* sznur cebuli / czosnku / ziół zawieszony pod okapem (rysowany na ekranie) */
function hangString(sc, x, y, z, n = 5, col = '#d8b060') {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.strokeStyle = '#5a4020'; g.lineWidth = 1.2 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py + n * 7 * f); g.stroke();
  for (let i = 0; i < n; i++) { g.fillStyle = col; g.strokeStyle = 'rgba(60,36,10,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(px + (i % 2 ? 2 : -2) * f, py + (i + 1) * 7 * f, 3.4 * f, 3 * f, 0, 0, TAU); g.fill(); g.stroke(); }
}
/* rzeźbiony słup z twarzą (bożek): twarz na ścianach południowej i wschodniej, nad nią strzecha */
function idolPost(sc, cx, cy, w, h, o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - w / 2, y1 = cy + w / 2, z0 = o.z0 ?? 0.06;
  sc.box(x0, y0, z0, x1, y1, z0 + h, 'plank', { ao: 0.25, pal: o.pal || '#7a4a26', wear: 0.8 });
  const S = wallS(x0, x1, y1, z0 + h, z0), E = wallE(y0, y1, x1, z0 + h, z0), face = (W) => sc.local(W.O, W.U, W.V, (g, lu, lv) => {
    const m = lu / 2, top = lv * 0.12, hh = lv * 0.32;
    g.fillStyle = o.skin || '#d8b078'; g.beginPath(); g.ellipse(m, top + hh * 0.55, lu * 0.36, hh * 0.52, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = lu * 0.035; g.stroke();
    g.fillStyle = '#1c1008'; g.beginPath(); g.ellipse(m - lu * 0.14, top + hh * 0.42, lu * 0.06, lu * 0.04, 0, 0, TAU); g.ellipse(m + lu * 0.14, top + hh * 0.42, lu * 0.06, lu * 0.04, 0, 0, TAU); g.fill();
    g.strokeStyle = '#1c1008'; g.lineWidth = lu * 0.04; g.beginPath(); g.moveTo(m - lu * 0.2, top + hh * 0.3); g.lineTo(m - lu * 0.06, top + hh * 0.33); g.moveTo(m + lu * 0.2, top + hh * 0.3); g.lineTo(m + lu * 0.06, top + hh * 0.33); g.moveTo(m, top + hh * 0.45); g.lineTo(m - lu * 0.03, top + hh * 0.65); g.lineTo(m + lu * 0.04, top + hh * 0.65); g.stroke();
    g.fillStyle = '#2a1608'; g.beginPath(); g.moveTo(m - lu * 0.2, top + hh * 0.78); g.quadraticCurveTo(m, top + hh * 0.7, m + lu * 0.2, top + hh * 0.78); g.quadraticCurveTo(m, top + hh * 0.9, m - lu * 0.2, top + hh * 0.78); g.fill();
    g.fillStyle = o.band || '#a8352b'; g.fillRect(0, lv * 0.5, lu, lv * 0.07); g.fillRect(0, lv * 0.7, lu, lv * 0.05);
    g.fillStyle = '#e8d8a0'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(m - lu * 0.3 + i * lu * 0.2, lv * 0.82); g.lineTo(m - lu * 0.2 + i * lu * 0.2, lv * 0.9); g.lineTo(m - lu * 0.3 + i * lu * 0.2 + lu * 0.2, lv * 0.82); g.fill(); }
  });
  face(S); face(E);
  pyramidRoof(sc, { x0: x0 - 0.02, x1: x1 + 0.02, y0: y0 - 0.02, y1: y1 + 0.02, z: z0 + h, rise: w * 0.9, mat: 'thatch', pal: '#b89a48', ov: 0.01, ppu: 150 });
}
Build.prototype.idol = function (cx, cy, w, h, o = {}) {
  const z0 = o.z0 ?? 0.06;
  return this.part(cx - w / 2 - 0.03, cy - w / 2 - 0.03, z0, cx + w / 2 + 0.03, cy + w / 2 + 0.03, z0 + h + w * 0.9, () => idolPost(this.sc, cx, cy, w, h, o), { tag: 'bożek' });
};

/* grzbiet strzechy: gruby wałek na kalenicy, (opcjonalnie) okap dymny; roof — wynik cottage().roof */
function slRoof(B, roof, o = {}) {
  const sc = B.sc, top = roof.z + roof.rise, ovE = roof.ovE ?? 0.1, xm = (roof.x0 + roof.x1) / 2, ym = (roof.y0 + roof.y1) / 2, ry = roof.ridge === 'y';
  const A = ry ? [xm, roof.y1 + ovE] : [roof.x1 + ovE, ym], Z = ry ? [xm, roof.y0 - ovE] : [roof.x0 - ovE, ym];
  if (o.beam !== false) B.part(Math.min(A[0], Z[0]) - 0.05, Math.min(A[1], Z[1]) - 0.05, top, Math.max(A[0], Z[0]) + 0.05, Math.max(A[1], Z[1]) + 0.05, top + 0.08, () => {
    const g = sc.g, f = sc.F, a = sc.P(A[0], A[1], top), b = sc.P(Z[0], Z[1], top); g.lineCap = 'round'; g.strokeStyle = '#7d5f28'; g.lineWidth = 9 * f; g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke(); g.strokeStyle = '#d9bf6a'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(a[0], a[1] - 1.5); g.lineTo(b[0], b[1] - 1.5); g.stroke(); }, { tag: 'kalenica', shadow: false, nest: true });
  if (o.smoke != null) {
    const t = o.smoke, sw = o.smokeW ?? 0.4, cx = ry ? xm : roof.x0 + (roof.x1 - roof.x0) * t, cy = ry ? roof.y0 + (roof.y1 - roof.y0) * t : ym, dx = ry ? 0.15 : sw / 2, dy = ry ? sw / 2 : 0.15;
    B.box(cx - dx, cy - dy, top - 0.25, cx + dx, cy + dy, top + 0.14, 'plank', { ao: 0.2, pal: SL.logD, nest: true, tag: 'dymnik' });
    B.pyramid({ x0: cx - dx - 0.03, x1: cx + dx + 0.03, y0: cy - dy - 0.03, y1: cy + dy + 0.03, z: top + 0.14, rise: 0.13, mat: 'thatch', pal: SL.thatchD, ov: 0.01, nest: true });
    B.smoke(cx, cy, top + 0.3);
  }
}
/* chata słowiańska: cottage z bali, strzechą z grubą krawędzią i narożniki zrębu */
function slHouse(B, o) {
  const r = Object.assign({ mat: 'thatch', pal: SL.thatch, rise: 0.72, ov: 0.12, ovE: 0.14, gableMat: 'log', gablePal: SL.log, sod: true, sodMat: 'thatch', sodPal: SL.thatchE, sodShade: 0.62 }, o.roof);
  const user = o.deco1, h = cottage(B, Object.assign({ h1: 0.9, low: ['log', SL.log], plinth: ['rubble', null], ridge: 'x' }, o, { roof: r, deco1: (S, E, rS, rE, V) => { if (o.corners !== false) logCorners(B.sc, V); if (user) user(S, E, rS, rE, V); } }));
  slRoof(B, h.roof, o);
  return h;
}
const slWin = (o = {}) => ({ n: 1, w: 0.17, h: 0.22, v: 0.2, frame: '#3a2818', shut: SL.shut, ...o });
const slDoor = (at, w = 0.3, h = 0.5, o = {}) => ({ at, w, h, lintel: SL.red, frame: SL.doorF, pal: SL.door, ...o });

/* CHATA 2×2: wysoka chata z bali pod strzechą, ganek pod pulpitowym daszkiem, sznury cebuli i ziół */
BAKED.slavs_hut = function () {
  const sc = sceneFor(2, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 3 });
  slHouse(B, { x0: -0.8, x1: 0.8, y0: -0.62, y1: 0.4, h1: 1.0, S: { door: slDoor(0.62, 0.38, 0.7), win: slWin({ w: 0.2, h: 0.26 }) }, E: { win: slWin({ w: 0.2, h: 0.26 }) }, roof: { rise: 0.74 }, smoke: 0.3, smokeW: 0.36 });
  B.box(-0.18, 0.4, 0, 0.58, 0.86, 0.07, 'plank', { ao: 0.3, pal: SL.plank });
  for (const px of [-0.14, 0.52]) B.box(px, 0.78, 0.07, px + 0.08, 0.86, 0.9, 'log', { ao: 0.2, pal: SL.plank });
  B.lean({ x0: -0.25, x1: 0.65, y0: 0.4, y1: 0.92, z: 1.0, drop: 0.22, mat: 'thatch', pal: SL.thatchD });
  B.part(-0.1, 0.72, 0.5, 0.5, 0.8, 0.9, () => { hangString(sc, 0.0, 0.8, 0.88, 4, '#e0b868'); hangString(sc, 0.2, 0.8, 0.88, 3, '#c8452e'); hangString(sc, 0.4, 0.8, 0.88, 5, '#d8c890'); }, { tag: 'sznury', shadow: false, nest: true });
  B.box(-0.66, 0.5, 0.07, -0.3, 0.64, 0.3, 'plank', { ao: 0.2, pal: SL.plank, tag: 'ława' }); B.jar(-0.5, 0.82, 1, 0, [170, 100, 60]); B.barrel(0.78, 0.85, 0, 0.9);
  B.logs(0.8, 0.58); B.stump(-0.75, 0.85);
  return B.flush();
};

/* CHATA DRWALA 2×2: zrąb pod strzechą, stosy kłód, pień z siekierą, kobyłka i deski */
BAKED.slavs_woodcutter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 13 });
  slHouse(B, { x0: -0.75, x1: 0.6, y0: -0.85, y1: 0.0, h1: 0.78, S: { door: slDoor(0.3, 0.28, 0.46), win: slWin({ w: 0.15, h: 0.2 }) }, E: { win: slWin({ w: 0.15, h: 0.2 }) }, roof: { rise: 0.6 }, smoke: 0.3, smokeW: 0.3 });
  B.logs(-0.58, 0.42); B.logs(-0.58, 0.64); B.logs(-0.2, 0.7); B.stump(0.42, 0.45); B.planks(0.55, 0.78, 0.95, 0.92, 0.24, '#b89a68');
  return B.flush();
};

/* LEŚNICZÓWKA 2×2: chatka z bali i ogrodzony wiklinowym płotem szkółkowy zagon młodych świerków */
BAKED.slavs_forester = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 14 });
  sc.decal('dirt', '#3e2c18', [[[-0.86, 0.3], [0.86, 0.3], [0.86, 0.96], [-0.86, 0.96]]], { feather: 5, alpha: 0.92 });
  slHouse(B, { x0: -0.85, x1: 0.35, y0: -0.85, y1: -0.08, h1: 0.78, S: { door: slDoor(0.3, 0.28, 0.46), win: slWin({ w: 0.15, h: 0.2 }) }, E: { win: slWin({ w: 0.15, h: 0.2 }) }, roof: { rise: 0.58 }, smoke: 0.3, smokeW: 0.3 });
  B.fenceRect(-0.9, 0.3, 0.9, 0.98, { kind: 'wattle', gap: { S: [-0.2, 0.2] } });
  for (const [x, y, s] of [[-0.6, 0.55, 0.3], [-0.2, 0.62, 0.34], [0.2, 0.55, 0.3], [0.6, 0.62, 0.34], [-0.45, 0.85, 0.32], [0.45, 0.85, 0.3]]) B.tree('pine', 17 + Math.round(x * 9), x, y, s);
  B.bucket(0.55, 0.1); B.logs(0.62, -0.12);
  return B.flush();
};

/* CHATA MYŚLIWEGO 2×2: zrąb z porożem nad drzwiami, suszarka ze skórami, pień i beczka */
BAKED.slavs_hunter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 15 });
  slHouse(B, { x0: -0.9, x1: 0.4, y0: -0.85, y1: 0.05, h1: 0.78, low: ['log', SL.logD], S: { door: slDoor(0.4, 0.28, 0.46), win: slWin({ w: 0.15, h: 0.2 }) }, E: { win: slWin({ w: 0.15, h: 0.2 }) }, roof: { rise: 0.6 }, smoke: 0.3, smokeW: 0.3,
    deco1: (S) => sc.local(S.O, S.U, S.V, (g) => { const cx = 0.95; g.fillStyle = '#d8cfb8'; g.strokeStyle = '#2a2018'; g.lineWidth = 0.012; g.beginPath(); g.ellipse(cx, 0.15, 0.045, 0.035, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#d8cfb8'; g.lineWidth = 0.02; g.lineCap = 'round'; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(cx + s2 * 0.03, 0.13); g.quadraticCurveTo(cx + s2 * 0.12, 0.05, cx + s2 * 0.13, 0.02); g.moveTo(cx + s2 * 0.08, 0.09); g.lineTo(cx + s2 * 0.13, 0.1); g.stroke(); } }) });
  B.rack(0.78, -0.6, 0.78, 0.25, 'pelts', 0.78); B.barrel(-0.7, 0.4); B.stump(-0.3, 0.55);
  return B.flush();
};

/* TARTAK 3×2: otwarta wiata na słupach pod strzechą, piła ramowa na kobyłkach, stosy kłód i desek */
BAKED.slavs_sawmill = function () {
  const sc = sceneFor(3, 2, 2.4), B = new Build(sc), zr = 1.0;
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 16 });
  B.box(-1.3, -0.75, 0, 0.55, 0.45, 0.08, 'plank', { pal: SL.plank, ao: 0.3, shadow: false });
  B.box(-1.3, -0.75, 0.08, 0.45, -0.67, zr, 'log', { pal: SL.logD, ao: 0.3 }); B.box(-1.3, -0.67, 0.08, -1.22, 0.35, zr, 'log', { pal: SL.logD, ao: 0.3 });
  for (const [px, py] of [[-1.3, 0.35], [-0.4, 0.35], [0.45, 0.35], [0.45, -0.75]]) B.box(px, py, 0.08, px + 0.1, py + 0.1, zr - 0.08, 'bark', { pal: SL.logD, ao: 0.2 });
  B.box(-1.3, 0.35, zr - 0.08, 0.55, 0.45, zr, 'log', { pal: SL.logD, ao: 0.2 });
  B.gable({ x0: -1.3, x1: 0.55, y0: -0.75, y1: 0.45, z: zr, rise: 0.5, ov: 0.14, ovE: 0.12, mat: 'thatch', pal: SL.thatch, gableMat: 'log', gablePal: SL.log, ridge: 'x' });
  B.sawRig(-1.1, -0.15, 0.0);
  B.logs(-1.1, 0.7); B.logs(-0.75, 0.72); B.planks(0.7, -0.3, 1.2, 0.0, 0.34); B.planks(0.72, 0.15, 1.15, 0.4, 0.26, '#d0b07a');
  return B.flush();
};

/* MLECZARNIA 2×3: długa chata szczytem do ulicy, bańki, stół z serami, siano i płotek */
BAKED.slavs_dairy = function () {
  const sc = sceneFor(2, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.7, { seed: 17 });
  slHouse(B, { x0: -0.8, x1: 0.8, y0: -1.4, y1: -0.2, h1: 0.85, ridge: 'y', S: { door: slDoor(0.5, 0.32, 0.54), win: slWin({ n: 2, w: 0.15, h: 0.2 }) }, E: { win: slWin({ n: 1, w: 0.16 }) }, roof: { rise: 0.72 }, smoke: 0.4, smokeW: 0.4 });
  B.churn(-0.6, 0.35); B.churn(-0.4, 0.42); B.churn(-0.62, 0.58);
  B.box(0.3, 0.4, 0, 0.8, 0.62, 0.32, 'plank', { pal: SL.plank, ao: 0.3, tag: 'stół' });
  B.disc(0.42, 0.5, 0.32, 0.07, 0.05, [236, 206, 120]); B.disc(0.62, 0.5, 0.32, 0.07, 0.05, [230, 196, 104]); B.disc(0.52, 0.5, 0.37, 0.07, 0.05, [240, 212, 130]);
  B.bucket(-0.05, 0.85); B.hay(-0.55, 1.1); B.fence(0.1, 1.3, 0.9, 1.3, { kind: 'rail' });
  return B.flush();
};

/* ---------- drobne części słowiańskie ---------- */
Object.assign(Build.prototype, {
  /* kosz z wikliny z owocami / grzybami / jagodami */
  basket(x, y, kind = 'apple', s = 1) {
    return this.part(x - 0.1 * s, y - 0.1 * s, 0, x + 0.1 * s, y + 0.1 * s, 0.2 * s, () => { const g = this.sc.g, f = this.sc.F * s, [px, py] = this.sc.P(x, y, 0), cols = { apple: ['#c4302a', '#e05a48'], mushroom: ['#c89a5a', '#e8d4a8'], berry: ['#3a2a6a', '#5a4a9a'], pear: ['#b8c850', '#d8e07a'] }[kind] || ['#c4302a', '#e05a48'];
      g.fillStyle = 'rgba(14,22,8,0.3)'; g.beginPath(); g.ellipse(px + 2 * f, py + 1 * f, 11 * f, 4.4 * f, 0, 0, TAU); g.fill();
      g.fillStyle = '#a07a40'; g.strokeStyle = 'rgba(40,24,6,0.85)'; g.lineWidth = f; g.beginPath(); g.moveTo(px - 10 * f, py - 8 * f); g.lineTo(px - 8 * f, py); g.quadraticCurveTo(px, py + 5 * f, px + 8 * f, py); g.lineTo(px + 10 * f, py - 8 * f); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(60,36,10,0.6)'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(px - 9 * f + i * 0.4 * f, py - 8 * f + i * 2.2 * f); g.lineTo(px + 9 * f - i * 0.4 * f, py - 8 * f + i * 2.2 * f); g.stroke(); }
      for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 2]; g.strokeStyle = 'rgba(30,10,6,0.7)'; g.beginPath(); g.arc(px - 7 * f + i * 2.8 * f, py - 10 * f - (i % 2) * 2 * f, 3 * f, 0, TAU); g.fill(); g.stroke(); } }, { tag: 'kosz', shadow: false });
  },
  /* strach na wróble z dzbanem na głowie */
  scarecrow(x, y) {
    return this.part(x - 0.15, y - 0.06, 0, x + 0.15, y + 0.06, 0.9, () => { const g = this.sc.g, f = this.sc.F, [px, py] = this.sc.P(x, y, 0); g.strokeStyle = '#4a3220'; g.lineWidth = 2.6 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 56 * f); g.moveTo(px - 17 * f, py - 40 * f); g.lineTo(px + 17 * f, py - 40 * f); g.stroke(); g.fillStyle = '#c8b070'; g.beginPath(); g.moveTo(px - 10 * f, py - 40 * f); g.lineTo(px + 10 * f, py - 40 * f); g.lineTo(px + 8 * f, py - 24 * f); g.lineTo(px - 8 * f, py - 24 * f); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,24,8,0.7)'; g.lineWidth = f; g.stroke(); g.fillStyle = '#d8c898'; g.beginPath(); g.arc(px, py - 60 * f, 5.4 * f, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#9a5a30'; g.beginPath(); g.ellipse(px, py - 67 * f, 5 * f, 6 * f, 0, 0, TAU); g.fill(); g.stroke(); }, { tag: 'strach', shadow: false });
  },
  /* kłoda bartna: wydrążony pień z daszkiem i otworem wlotowym */
  beeLog(x, y, h = 0.9) {
    return this.part(x - 0.13, y - 0.13, 0, x + 0.13, y + 0.13, h + 0.12, () => { const sc = this.sc, g = sc.g, f = sc.F; sc.cyl(x, y, 0, h, 0.1, { mat: 'bark', pal: '#7a5632', topMat: 'plank', ao: 0.3 }); const [px, py] = sc.P(x, y + 0.1, h * 0.55); g.fillStyle = '#17100a'; g.beginPath(); g.ellipse(px, py, 1.6 * f, 4.4 * f, 0, 0, TAU); g.fill(); g.strokeStyle = '#d8a830'; g.lineWidth = 1.2 * f; g.beginPath(); g.ellipse(px, py, 2.8 * f, 5.4 * f, 0, 0, TAU); g.stroke(); const [tx, ty] = sc.P(x, y, h); g.fillStyle = '#b99c48'; g.strokeStyle = 'rgba(40,26,6,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(tx - 12 * f, ty + 2 * f); g.lineTo(tx, ty - 11 * f); g.lineTo(tx + 12 * f, ty + 2 * f); g.quadraticCurveTo(tx, ty + 8 * f, tx - 12 * f, ty + 2 * f); g.closePath(); g.fill(); g.stroke(); }, { tag: 'kłoda bartna', shadow: false });
  },
  /* rama do naciągania skór ze skórą */
  furFrame(x, y, alongX = true) {
    return this.part(x - 0.25, y - 0.25, 0, x + 0.25, y + 0.25, 0.7, () => { const sc = this.sc, g = sc.g, f = sc.F, w = 0.22, [a0, a1] = alongX ? [sc.P(x - w, y, 0), sc.P(x + w, y, 0)] : [sc.P(x, y - w, 0), sc.P(x, y + w, 0)];
      g.strokeStyle = '#4a3220'; g.lineWidth = 2.6 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a0[0], a0[1] - 44 * f); g.lineTo(a1[0], a1[1] - 44 * f); g.lineTo(a1[0], a1[1]); g.stroke(); g.beginPath(); g.moveTo(a0[0], a0[1] - 6 * f); g.lineTo(a1[0], a1[1] - 6 * f); g.stroke();
      g.fillStyle = '#a0764a'; g.strokeStyle = 'rgba(20,14,10,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(a0[0] + 2 * f, a0[1] - 41 * f); g.lineTo(a1[0] - 2 * f, a1[1] - 41 * f); g.lineTo(a1[0] - 3 * f, a1[1] - 9 * f); g.lineTo(a0[0] + 3 * f, a0[1] - 9 * f); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(40,24,10,0.5)'; g.beginPath(); g.moveTo((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 - 38 * f); g.lineTo((a0[0] + a1[0]) / 2 + 2 * f, (a0[1] + a1[1]) / 2 - 12 * f); g.stroke(); }, { tag: 'rama', shadow: false });
  }
});
/* studnia żuraw: cembrowina z bali, słup z kołyską i bucket; (wx, wy) — środek cembrowiny */
function sweepWell(B, wx, wy, o = {}) {
  const sc = B.sc, px = wx + 0.5, py = wy - 0.1;
  B.box(wx - 0.25, wy - 0.25, 0, wx + 0.25, wy + 0.25, 0.34, { east: 'log', south: 'log', top: 'water' }, { pal: SL.logD, ao: 0.4, tag: 'cembrowina' });
  B.box(px - 0.05, py - 0.05, 0, px + 0.05, py + 0.05, 1.1, 'bark', { pal: '#5a3e22', ao: 0.2 });
  return B.part(wx - 0.55, py - 0.04, 0.4, px + 0.3, py + 0.04, 1.4, () => {
    const g = sc.g, f = sc.F, a = sc.P(px + 0.28, py, 0.96), b = sc.P(wx - 0.5, py, 1.34), c = sc.P(wx - 0.5, py, 0.55);
    g.lineCap = 'round'; g.strokeStyle = '#2a1c10'; g.lineWidth = 5.4 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#8a6a40'; g.lineWidth = 3 * f; g.stroke();
    g.strokeStyle = '#d8c090'; g.lineWidth = 1.2 * f; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); g.fillStyle = '#7a5a32'; g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = f; g.beginPath(); g.moveTo(c[0] - 5 * f, c[1]); g.lineTo(c[0] + 5 * f, c[1]); g.lineTo(c[0] + 4 * f, c[1] + 8 * f); g.lineTo(c[0] - 4 * f, c[1] + 8 * f); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#8a867c'; g.strokeStyle = 'rgba(20,18,14,0.85)'; g.beginPath(); g.ellipse(a[0] + 2 * f, a[1] + 5 * f, 6 * f, 7 * f, 0, 0, TAU); g.fill(); g.stroke(); }, { tag: 'żuraw', shadow: false, nest: true });
}

/* SAD 3×3: wiklinowy płot z furtką, sześć drzew owocowych, kosze z owocami i drabina */
BAKED.slavs_orchard = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc);
  sc.decal('grass', 'tundra', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.55 });
  B.fenceRect(-1.38, -1.3, 1.38, 1.3, { kind: 'wattle', h: 0.34, gap: { S: [-0.3, 0.3] } });
  [[-0.85, -0.65], [0.0, -0.72], [0.85, -0.65], [-0.8, 0.22], [0.05, 0.15], [0.85, 0.2]].forEach(([x, y], i) => B.tree('apple', 41 + i, x, y, 0.78));
  B.basket(-1.0, 0.95, 'apple'); B.basket(-0.75, 1.0, 'pear'); B.basket(-0.9, 0.78, 'apple', 0.9); B.heap(1.0, 0.95, 0.2, 0.14, ['#e05a48', '#b02a22', '#6a1812']); B.crate(1.0, 0.95, 0.3, 0.1);
  return B.flush();
};

/* CHATA NOSIWODY 2×2: studnia-żuraw z cembrowiną z bali, obok szopa z beczkami i wiadrami */
BAKED.slavs_watercarrier = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 19 });
  sweepWell(B, -0.4, 0.2);
  slHouse(B, { x0: 0.3, x1: 0.92, y0: -0.9, y1: -0.2, h1: 0.62, ridge: 'y', plinth: false, low: ['log', SL.logD], S: { door: slDoor(0.5, 0.26, 0.42) }, E: { win: slWin({ w: 0.14, h: 0.16, shut: undefined }) }, roof: { rise: 0.42, ov: 0.1, ovE: 0.1 }, smoke: undefined });
  B.barrel(0.45, 0.1, 0, 1.1); B.barrel(0.7, 0.2, 0, 1.1); B.barrel(0.62, 0.45, 0, 1.1); B.bucket(0.2, 0.62); B.bucket(0.0, 0.8);
  return B.flush();
};

/* TARG 3×3: deski na ziemi, trzy stragany z pasiastymi płachtami i rzeźbiony bożek na kamiennej podstawie */
BAKED.slavs_market = function () {
  const sc = sceneFor(3, 3, 2.6), B = new Build(sc), pals = ['#a8352b|#e8d8a0', '#2f5aa8|#e8d8a0', '#3f7a3a|#e8d8a0'];
  sc.patch(0, 0, 2.2, 2.2, { seed: 20, alpha: 0.85, feather: 14 });
  sc.paved(-1.45, -1.45, 1.45, 1.45, { mat: 'plank', pal: '#7a5a36', jit: 0.04, seed: 21, feather: 5 });
  [-0.95, 0, 0.95].forEach((cx, i) => B.stall(cx, -1.35, { pal: pals[i], kind: ['bread', 'pot', 'fur'][i], counter: SL.logD }));
  B.box(-0.3, -0.05, 0, 0.3, 0.45, 0.1, 'rubble', { pal: '#8a867c', ao: 0.3 }); B.idol(0, 0.2, 0.26, 1.0, { z0: 0.1, pal: '#7a4a26', band: '#2f5aa8' });
  B.crate(-1.15, 0.85, 0.24, 0.24); B.crate(-0.85, 0.95, 0.22, 0.2); B.sack(0.95, 0.9, '#d8c898'); B.sack(1.12, 0.78, '#cdbb88'); B.basket(1.15, 0.3, 'apple'); B.barrel(-1.2, 0.3, 0, 0.9);
  return B.flush();
};

/* SKŁAD 3×2: spichlerz na palach z szerokim okapem, schodkami, wentylacyjnymi szczelinami, wciągarką i workami */
BAKED.slavs_store = function () {
  const sc = sceneFor(3, 2, 2.9), B = new Build(sc), zf = 0.42;
  sc.patch(0, 0.1, 1.9, 1.3, { seed: 22, alpha: 0.7 });
  for (const x of [-1.15, 0, 1.15]) for (const y of [-0.5, 0.5]) B.cyl(x, y, 0, zf - 0.1, 0.08, { mat: 'log', pal: '#7a5a36', topMat: 'plank', ao: 0.3, shadow: false });
  B.box(-1.3, -0.7, zf - 0.1, 1.3, 0.7, zf, 'log', { pal: SL.logD, ao: 0.4, eave: 0.5 });
  slHouse(B, { x0: -1.28, x1: 1.28, y0: -0.68, y1: 0.68, zp: zf, h1: 0.9, plinth: false, low: ['plank', SL.plank], corners: false, S: { door: slDoor(0.5, 0.6, 0.62, { lintel: SL.red }) }, roof: { rise: 0.78, ov: 0.18, ovE: 0.16, gableMat: 'plank', gablePal: SL.plank },
    deco1: (S, E) => { sc.local(S.O, S.U, S.V, (g) => { g.fillStyle = '#17120e'; for (const u of [0.25, 0.5, 1.9, 2.15, 2.4]) g.fillRect(u, 0.18, 0.04, 0.3); }); sc.local(E.O, E.U, E.V, (g) => { g.fillStyle = '#17120e'; for (const u of [0.35, 0.6, 0.85, 1.1]) g.fillRect(u, 0.18, 0.04, 0.3); }); } });
  B.stairs(-0.3, 0.3, 0.7, 2, zf, 'plank', 0.13, SL.plank);
  B.sack(0.9, 0.88, '#d8c898'); B.sack(1.06, 0.86, '#cdbb88'); B.barrel(-0.95, 0.88); B.barrel(-1.12, 0.82, 0, 0.9);
  return B.flush();
};

/* ŚWIĘTY KRĄG 3×3 (Kapliczka): kopiec z kręgiem rzeźbionych bożków, kamienny ołtarz z ogniem, wielki bożek i dary */
BAKED.slavs_temple = function () {
  const sc = sceneFor(3, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.05, 2.0, 1.9, { seed: 11, alpha: 0.5, pal: '#6a5a3a', feather: 18 });
  B.cyl(0, 0, 0, 0.16, 1.28, { mat: 'rubble', pal: '#8a877c', topMat: 'grass', topPal: 'green', ao: 0.4 });
  B.cyl(0, 0, 0.16, 0.2, 1.1, { mat: 'dirt', pal: '#6a5a3a', topMat: 'dirt', topPal: '#5a4a2e', ao: 0 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; B.idol(Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0.17, 1.0 + (i % 3) * 0.08, { z0: 0.2, pal: i % 2 ? '#7a4a26' : '#6a3e20', band: i % 2 ? '#a8352b' : '#2f5aa8' }); }
  B.box(-0.34, -0.3, 0.2, 0.34, 0.3, 0.38, 'stone', { ao: 0.3, pal: '#8f8a7e' }); B.cyl(0, 0, 0.38, 0.5, 0.2, { color: [60, 56, 54], ao: 0.3 });
  B.part(-0.2, -0.2, 0.5, 0.2, 0.2, 0.9, () => { const g = sc.g, f = sc.F, [ax, ay] = sc.P(0, 0, 0.5); for (let i = 0; i < 6; i++) { const gr = g.createRadialGradient(ax + (i - 2.5) * 6 * f, ay - 6 * f, 0, ax + (i - 2.5) * 6 * f, ay - 8 * f, 18 * f); gr.addColorStop(0, 'rgba(255,240,150,0.95)'); gr.addColorStop(0.5, 'rgba(255,130,30,0.7)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(ax + (i - 2.5) * 6 * f, ay - 12 * f, 8 * f, 18 * f - Math.abs(i - 2.5) * 3 * f, 0, 0, TAU); g.fill(); } }, { tag: 'ogień', shadow: false, nest: true });
  B.idol(0.0, -0.58, 0.28, 1.5, { z0: 0.2, pal: '#7a4a26', skin: '#e0c088', band: '#d8a830' });
  B.barrel(0.3, 0.6, 0.2, 0.7); B.sack(0.55, 0.55, '#d8c898', 0.8, 0.2); B.jar(-0.45, 0.6, 0.8, 0.2); B.jar(-0.3, 0.7, 0.7, 0.2, [150, 90, 50]);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = Math.cos(a) * 1.3, y = Math.sin(a) * 1.3; B.box(x - 0.1, y - 0.08, 0, x + 0.1, y + 0.08, 0.14 + (i % 3) * 0.04, 'rubble', { ao: 0.2, pal: '#8a867c', tag: 'kamień', nest: true, shadow: false }); }
  return B.flush({ shadow: { alpha: 0.45, blur: 12 } });
};

/* GRÓD 4×4 (Dwór): wał z bali z częstokołem, niska brama z nadbudówką, dwupiętrowy dwór pod strzechą, dom gościnny, studnia-żuraw i bożek */
BAKED.slavs_keep = function () {
  const sc = sceneFor(4, 4, 4.0), B = new Build(sc), w = 1.82, wt = 0.3, wh = 0.7;
  sc.patch(0, 0.1, 2.6, 2.4, { seed: 18, feather: 20 });
  sc.decal('dirt', '#6a5230', [[[-w + 0.1, -w + 0.1], [w - 0.1, -w + 0.1], [w - 0.1, w - 0.1], [-w + 0.1, w - 0.1]]], { feather: 12, alpha: 0.5 });
  B.box(-w, -w, 0, w, -w + wt, wh, 'log', { pal: SL.logD, ao: 0.3, tag: 'mur' }); B.box(-w, -w + wt, 0, -w + wt, w, wh, 'log', { pal: SL.logD, ao: 0.3, tag: 'mur' });
  B.palisade(-w + 0.05, -w + wt / 2, w - 0.05, -w + wt / 2, 0.32, wh); B.palisade(-w + wt / 2, -w + wt, -w + wt / 2, w - 0.05, 0.32, wh);
  B.palisade(w, -w, w, w, 0.45); B.palisade(-w, w, -0.85, w, 0.45); B.palisade(0.85, w, w, w, 0.45);
  for (const gx of [-0.6, 0.6]) B.box(gx - 0.1, w - 0.1, 0, gx + 0.1, w + 0.1, 0.95, 'log', { pal: SL.logD, ao: 0.3 });
  B.box(-0.75, w - 0.3, 0.95, 0.75, w + 0.15, 1.4, 'log', { pal: SL.log, ao: 0.3, eave: 0.3 }, (S) => facade(sc, S, { win: slWin({ n: 1, w: 0.2, h: 0.2, v: 0.14 }), marg: 0.3 }));
  B.pyramid({ x0: -0.77, x1: 0.77, y0: w - 0.32, y1: w + 0.17, z: 1.4, rise: 0.42, mat: 'thatch', pal: SL.thatch, ov: 0.06 });
  slHouse(B, { x0: -1.5, x1: 0.4, y0: -1.45, y1: -0.5, floors: 2, h1: 0.7, h2: 0.6, J: 0.06, low: ['log', SL.log], up: ['log', SL.logL], S: { door: slDoor(0.62, 0.34, 0.56), win: slWin({ w: 0.15, h: 0.22 }) }, E: { win: slWin({ w: 0.15, h: 0.22 }) }, S2: { win: slWin({ n: 2, w: 0.16, h: 0.24, v: 0.14 }) }, E2: { win: slWin({ w: 0.16, h: 0.24, v: 0.14 }) },
    roof: { rise: 0.78, ov: 0.14, ovE: 0.16 }, smoke: 0.4, smokeW: 0.5 });
  slHouse(B, { x0: 0.8, x1: 1.5, y0: -0.3, y1: 0.4, h1: 0.7, ridge: 'x', low: ['log', SL.log], S: { door: slDoor(0.3, 0.26, 0.44) }, E: { win: slWin({ w: 0.14, h: 0.18, shut: undefined }) }, roof: { rise: 0.5, ov: 0.1, ovE: 0.1 } });
  sweepWell(B, -0.85, 0.45);
  B.idol(0.2, 0.45, 0.26, 1.0, { z0: 0.06, pal: '#7a4a26', band: '#2f5aa8' });
  B.barrel(0.85, 0.95); B.barrel(1.02, 1.05, 0, 0.9); B.crate(1.5, 1.2, 0.22, 0.22); B.logs(-0.55, 1.2); B.basket(-0.2, 1.1, 'apple'); B.stump(0.5, 1.2);
  return B.flush({ shadow: { alpha: 0.5, blur: 12 } });
};

/* smużka dymu / pary: półprzezroczyste obłoki unoszące się nad punktem */
function puffs(sc, x, y, z, n = 6, h = 80, col = '150,150,156') {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  for (let i = 0; i < n; i++) { const t = i / (n - 1), cx = px + Math.sin(t * 3.2) * 8 * f * (0.4 + t), cy = py - 8 * f - t * h * f, rr = (5 + t * 15) * f, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, `rgba(${col},${0.6 - t * 0.35})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill(); }
}

/* CHATA ZBIERACZA 2×2: chata z bali, sznury grzybów i ziół pod okapem, kosze z grzybami i jagodami, krzewy */
BAKED.slavs_gatherer = function () {
  const sc = sceneFor(2, 2, 2.5), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 23 });
  const h = slHouse(B, { x0: -0.85, x1: 0.5, y0: -0.85, y1: 0.0, h1: 0.75, S: { door: slDoor(0.3, 0.28, 0.46), win: slWin({ w: 0.15, h: 0.2 }) }, E: { win: slWin({ w: 0.15, h: 0.2 }) }, roof: { rise: 0.6 }, smoke: 0.3, smokeW: 0.3 });
  B.part(-0.55, 0.0, h.zt - 0.55, 0.45, 0.12, h.zt - 0.02, () => { hangString(sc, -0.45, 0.07, h.zt - 0.05, 4, '#c89a5a'); hangString(sc, -0.15, 0.07, h.zt - 0.05, 5, '#8aa04a'); hangString(sc, 0.15, 0.07, h.zt - 0.05, 4, '#e8d4a8'); hangString(sc, 0.38, 0.07, h.zt - 0.05, 3, '#c8452e'); }, { tag: 'sznury', shadow: false, nest: true });
  B.basket(-0.6, 0.55, 'mushroom'); B.basket(-0.35, 0.65, 'berry'); B.basket(-0.5, 0.82, 'mushroom', 0.9); B.sapling(0.55, 0.6, 1.1); B.sapling(0.8, 0.45, 0.9);
  B.stump(0.3, 0.4); B.bucket(0.05, 0.62);
  return B.flush();
};

/* POLE STAŁE 3×3: zagony zboża i ugoru w wiklinowym płocie, snopki w kopach, strach na wróble */
BAKED.slavs_field = function () {
  const sc = sceneFor(3, 3, 2.0, { pRes: RES }), B = new Build(sc), fp = (y0, y1) => [[-1.4, y0], [1.4, y0], [1.4, y1], [-1.4, y1]];
  sc.decal('dirt', '#6a4e2c', [[[-1.45, -1.45], [1.45, -1.45], [1.45, 1.45], [-1.45, 1.45]]], { feather: 6, alpha: 0.9 });
  sc.decal('field', 'wheat', [fp(-1.4, -0.55)], { feather: 0 }); sc.decal('field', 'wheat', [fp(-0.45, 0.4)], { feather: 0 }); sc.decal('field', 'plow', [fp(0.5, 1.4)], { feather: 0 });
  B.fenceRect(-1.45, -1.45, 1.45, 1.45, { kind: 'wattle', h: 0.28, gap: { S: [-0.3, 0.3] } });
  for (const [x, y] of [[-0.9, -0.25], [-0.3, -0.2], [0.35, -0.25], [0.95, -0.2], [-0.6, -0.95], [0.5, -0.95]]) B.cone(x, y, 0, 0.13, 0.34, [206, 168, 70]);
  B.scarecrow(0.85, 0.75); B.heap(-1.0, 1.1, 0.2, 0.12, 'grain'); B.sack(-0.7, 1.15, '#d8c898'); B.barrel(1.1, 1.15);
  return B.flush();
};

/* KASZARNIA 2×3: chata z bali, stępa — drewniany moździerz z dźwignią-tłuczkiem, worki ziarna, kopiec ziarna i garnek */
BAKED.slavs_kasha = function () {
  const sc = sceneFor(2, 3, 2.7), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 24 });
  slHouse(B, { x0: -0.85, x1: 0.85, y0: -1.4, y1: -0.35, h1: 0.82, S: { door: slDoor(0.28, 0.32, 0.52), win: slWin({ w: 0.16, h: 0.22 }) }, E: { win: slWin({ w: 0.16, h: 0.22 }) }, roof: { rise: 0.66 }, smoke: 0.5, smokeW: 0.36 });
  B.cyl(-0.45, 0.45, 0, 0.32, 0.17, { mat: 'log', pal: SL.logD, topMat: 'plank', topPal: '#3a2a18', ao: 0.4 });
  B.box(0.05, 0.4, 0, 0.17, 0.52, 0.62, 'bark', { pal: '#5a3e22', ao: 0.2 });
  B.part(-0.55, 0.38, 0.34, 0.2, 0.52, 0.9, () => { const g = sc.g, f = sc.F, a = sc.P(0.38, 0.46, 0.34), b = sc.P(-0.45, 0.46, 0.84), c = sc.P(-0.45, 0.46, 0.34); g.lineCap = 'round'; g.strokeStyle = '#2a1c10'; g.lineWidth = 5.2 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#8a6a40'; g.lineWidth = 3 * f; g.stroke(); g.strokeStyle = '#6a4a2c'; g.lineWidth = 5 * f; g.beginPath(); g.moveTo(b[0], b[1] + 4 * f); g.lineTo(c[0], c[1] - 2 * f); g.stroke(); }, { tag: 'tłuczek', shadow: false, nest: true });
  B.heap(0.6, 0.55, 0.3, 0.22, 'grain'); B.sack(0.2, 0.9, '#d8c898'); B.sack(0.38, 0.98, '#cdbb88'); B.sack(-0.7, 0.95, '#d8c898', 0.9); B.jar(-0.35, 1.05, 1, 0, [176, 112, 62]); B.jar(-0.18, 1.12, 0.9);
  return B.flush();
};

/* BARĆ 3×3: leśna polana z sosnami i kłodami bartnymi na stojakach, szałas bartnika, dzbany z miodem, kosze i dymnik */
BAKED.slavs_bartnik = function () {
  const sc = sceneFor(3, 3, 3.0), B = new Build(sc);
  sc.decal('grass', 'tundra', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 14, alpha: 0.6 });
  [[-1.05, -1.0, 0.9], [0.2, -1.15, 1.0], [1.1, -0.75, 0.85], [-1.15, 0.0, 0.8]].forEach(([x, y, k], i) => B.tree('pine', 31 + i, x, y, k));
  [[-0.3, -0.3, 1.0], [0.45, -0.3, 0.9], [0.0, 0.3, 1.1], [0.95, 0.35, 0.95]].forEach(([x, y, h]) => B.beeLog(x, y, h));
  slHouse(B, { x0: -0.2, x1: 0.55, y0: 0.8, y1: 1.4, h1: 0.5, ridge: 'y', plinth: false, low: ['log', SL.logD], S: { door: slDoor(0.5, 0.24, 0.38) }, roof: { rise: 0.45, ov: 0.1, ovE: 0.1 } });
  B.jar(-0.6, 0.9, 1, 0, [210, 150, 50]); B.jar(-0.45, 1.0, 0.9, 0, [200, 140, 46]); B.jar(-0.7, 1.1, 0.8, 0, [210, 150, 50]); B.basket(0.9, 1.0, 'apple', 0.9);
  B.cyl(-0.72, 0.4, 0, 0.14, 0.09, { color: [130, 90, 60], ao: 0.2 }); B.smoke(-0.72, 0.4, 0.3);
  return B.flush();
};

/* WOSKARNIA 2×3: warsztat z bali pod strzechą z okapem dymnym, ogrodzona pasieka z ulami, kocioł nad ogniem i bloki wosku */
BAKED.slavs_waxery = function () {
  const sc = sceneFor(2, 3, 2.6), B = new Build(sc);
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 7, alpha: 0.75 });
  sc.flat([[[0.15, 0.45], [0.85, 0.45], [0.85, 1.0], [0.15, 1.0]]], 'rgba(255,140,50,0.2)', 14);
  slHouse(B, { x0: -0.92, x1: 0.92, y0: -1.42, y1: -0.3, h1: 0.9, S: { door: slDoor(0.7, 0.3, 0.52, { lintel: SL.red }), win: slWin({ w: 0.16, h: 0.22, shut: SL.red }) }, E: { win: slWin({ w: 0.16, h: 0.22, shut: SL.red }) }, roof: { rise: 0.66, ov: 0.12, ovE: 0.14 }, smoke: 0.55, smokeW: 0.44 });
  B.fenceRect(-0.92, 0.05, 0.92, 1.4, { kind: 'wattle', h: 0.42, gap: { S: [-0.28, 0.28] } });
  for (const [x, y] of [[-0.66, 0.42], [-0.66, 0.82]]) B.box(x - 0.22, y - 0.1, 0, x + 0.22, y + 0.1, 0.03, 'log', { pal: SL.logD, ao: 0.3 });
  for (const [x, y] of [[-0.78, 0.42], [-0.55, 0.42], [-0.78, 0.82], [-0.55, 0.82]]) B.skep(x, y, 1.15);
  B.cyl(-0.05, 1.05, 0, 0.5, 0.1, { mat: 'log', pal: '#8a6a40', topMat: 'plank', ao: 0.3 }); B.cone(-0.05, 1.05, 0.5, 0.14, 0.14, [150, 120, 60]);
  B.cyl(0.5, 0.7, 0.04, 0.42, 0.22, { color: [196, 120, 60], ao: 0.3 });
  B.part(0.28, 0.48, 0.42, 0.72, 0.92, 0.8, () => { const g = sc.g, f = sc.F, [cx, cy] = sc.P(0.5, 0.7, 0.42); g.fillStyle = '#d98a3a'; g.beginPath(); g.ellipse(cx, cy, 0.2 * AX * f * 1.4142, 0.2 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = '#f0d070'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(cx + (i - 1) * 6 * f, cy - (8 + i * 6) * f, (5 + i * 2) * f, 4 * f, 0, 0, TAU); g.fillStyle = `rgba(255,240,200,${0.5 - i * 0.1})`; g.fill(); } }, { tag: 'kocioł', shadow: false, nest: true });
  B.box(0.62, 0.15, 0.05, 0.9, 0.3, 0.12, 'plank', { ao: 0.2, pal: '#d8b050' }); B.box(0.68, 0.18, 0.12, 0.84, 0.27, 0.2, 'plank', { ao: 0.1, pal: '#e8c870', wear: 0 });
  B.barrel(0.78, 1.15, 0, 0.9); B.logs(-0.5, 1.25);
  return B.flush();
};

/* CHATA ŁOWCY FUTER 2×2: zrąb z ramami do naciągania skór, pęk skór, pułapka, pień z siekierą */
BAKED.slavs_trapper = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 25 });
  slHouse(B, { x0: -0.9, x1: 0.4, y0: -0.85, y1: 0.0, h1: 0.75, low: ['log', SL.logD], S: { door: slDoor(0.35, 0.28, 0.46), win: slWin({ w: 0.15, h: 0.2 }) }, E: { win: slWin({ w: 0.15, h: 0.2 }) }, roof: { rise: 0.6 }, smoke: 0.3, smokeW: 0.3 });
  B.furFrame(-0.55, 0.55, true); B.furFrame(-0.05, 0.62, true); B.furFrame(0.72, -0.3, false);
  B.heap(0.62, 0.55, 0.22, 0.14, ['#a0764a', '#7a5a38', '#4a3220']); B.stump(0.25, 0.82); B.barrel(-0.85, 0.85);
  return B.flush();
};

/* GARBARNIA 2×3: warsztat z bali, kadzie garbarskie z brunatnym ługiem, ramy ze skórami, kopiec skór i beczki */
BAKED.slavs_tannery = function () {
  const sc = sceneFor(2, 3, 2.6), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 26 });
  slHouse(B, { x0: -0.9, x1: 0.5, y0: -1.4, y1: -0.5, h1: 0.8, low: ['log', SL.logD], S: { door: slDoor(0.3, 0.3, 0.5), win: slWin({ w: 0.16, h: 0.2 }) }, E: { win: slWin({ w: 0.16, h: 0.2 }) }, roof: { rise: 0.64 }, smoke: 0.5, smokeW: 0.3 });
  const vat = (x0, y0, x1, y1) => { B.box(x0, y0, 0, x1, y1, 0.3, 'plank', { pal: '#6a4a2c', ao: 0.4, tag: 'kadź' }); B.part(x0 + 0.03, y0 + 0.03, 0.3, x1 - 0.03, y1 - 0.03, 0.33, () => sc.face([x0 + 0.03, y0 + 0.03, 0.31], [x1 - x0 - 0.06, 0, 0], [0, y1 - y0 - 0.06, 0], 'dirt', { shade: 0.85, pal: '#4a3a1a', edge: 0, wear: 0 }), { tag: 'ług', kind: 'flat', shadow: false, nest: true }); };
  vat(-0.85, 0.0, -0.3, 0.5); vat(-0.2, 0.0, 0.35, 0.5); vat(-0.85, 0.65, -0.3, 1.15);
  B.furFrame(0.7, 0.2, false); B.furFrame(0.7, 0.8, false); B.heap(0.15, 0.95, 0.25, 0.16, ['#a0764a', '#7a5a38', '#4a3220']); B.barrel(-0.1, 1.2); B.barrel(0.1, 1.28, 0, 0.9); B.bucket(0.55, -0.15);
  return B.flush();
};

/* BANIA 2×2: niska łaźnia z bali, kamienny stos pod ścianą, para z drzwi i dym z otworu, miotły z brzozy, beczka z wodą i drewno */
BAKED.slavs_sauna = function () {
  const sc = sceneFor(2, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 27 });
  const h = slHouse(B, { x0: -0.8, x1: 0.5, y0: -0.8, y1: 0.05, h1: 0.7, low: ['log', SL.logD], S: { door: slDoor(0.35, 0.26, 0.4), win: slWin({ w: 0.12, h: 0.14, shut: undefined }) }, E: { win: slWin({ w: 0.12, h: 0.14, shut: undefined }) }, roof: { rise: 0.52 }, smoke: 0.55, smokeW: 0.3 });
  B.part(-0.45, 0.0, 0.2, 0.0, 0.5, 1.0, () => puffs(sc, -0.1, 0.18, 0.5, 5, 40, '236,238,242'), { tag: 'para', shadow: false, nest: true });
  B.part(0.1, 0.05, h.zt - 0.55, 0.65, 0.18, h.zt - 0.02, () => { hangString(sc, 0.2, 0.12, h.zt - 0.05, 3, '#5a8a3a'); hangString(sc, 0.35, 0.12, h.zt - 0.05, 4, '#6a9a44'); hangString(sc, 0.5, 0.12, h.zt - 0.05, 3, '#5a8a3a'); }, { tag: 'miotły', shadow: false, nest: true });
  B.heap(0.72, -0.2, 0.28, 0.24, 'stone'); B.barrel(0.7, 0.45); B.bucket(0.45, 0.62); B.logs(-0.6, 0.62); B.logs(-0.6, 0.84);
  return B.flush();
};
