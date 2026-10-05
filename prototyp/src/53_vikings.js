/* ====================== WIKINGOWIE: ciemne drewno, darń na dachach, tarcze, smocze łby ======================
   Ściany ze zrębu (log) albo ciemnych desek (plank), dachy darniowe (grass) albo z gontu, nad kalenicą smocze łby, tarcze na ścianach.
   Okna są małe i ciemne (1 na ścianę), tarcze nie nachodzą na drzwi i okna (omijają je według wyniku facade()). */
const VK = { wall: '#52402c', wallL: '#64503a', tar: '#3b2a1a', log: '#7a5632', logD: '#5a3e22', plank: '#7a5a36', dark: '#2a1c10', door: '#3a2816', doorF: '#1f1308', red: '#a8352b', blue: '#2f5aa8', gold: '#d8a830', cream: '#e8d8a0', shingle: '#4a3a2e', shingleD: '#3a2e24', bog: '#7a6540' };
const VK_SH = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830'];
/* smocze zwieńczenie szczytu: skrzyżowane belki z rzeźbionymi łbami. Zasada: łby ZAWSZE patrzą od siebie, na zewnątrz budynku —
   lewy łeb w lewo, prawy w prawo, na przednim i na tylnym końcu kalenicy (d = ±1 odwraca tylko położenie ramion, więc dziób liczymy z faktycznej strony: side = s2·d). */
function dragonEnd(sc, x, y, z, d = 1) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.lineCap = 'round';
  for (const s2 of [1, -1]) {
    const side = s2 * d, hx = px + 14 * side * f, hy = py - 30 * f, X = v => hx + v * side * f;                              // X(v): przesunięcie wzdłuż kierunku, w którym patrzy łeb (v > 0 — przód)
    g.strokeStyle = '#1c1008'; g.lineWidth = 7 * f; g.beginPath(); g.moveTo(px - 3 * side * f, py + 8 * f); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = '#4a301a'; g.lineWidth = 4.6 * f; g.stroke();
    g.fillStyle = '#4a301a'; g.strokeStyle = '#1c1008'; g.lineWidth = 1.3 * f; g.beginPath(); g.moveTo(X(-2), hy + 4 * f); g.quadraticCurveTo(X(-5), hy - 6 * f, X(1), hy - 8 * f); g.lineTo(X(9), hy - 5 * f); g.lineTo(X(6), hy - 2 * f); g.lineTo(X(9), hy + 1 * f); g.lineTo(X(3), hy + 1 * f); g.quadraticCurveTo(X(2), hy + 5 * f, hx, hy + 5 * f); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(X(2.4), hy - 3 * f, 1.1 * f, 0, TAU); g.fill();
  }
}

/* przedziały ściany zajęte przez drzwi i okna (wynik facade()) */
const avoidOf = (res, m = 0.07) => res ? [...res.win.map(w => [w.u0 - m, w.u0 + w.w + m]), ...(res.door ? [[res.door.u0 - m - 0.03, res.door.u0 + res.door.w + m + 0.03]] : [])] : [];
/* rząd okrągłych tarcz na ścianie: n tarcz między a i b na wysokości v; omija zajęte przedziały */
function vkShields(sc, W, o = {}) {
  const lu = Math.hypot(...W.U), r = o.r ?? 0.065, a = o.a ?? 0.2, b = o.b ?? lu - 0.2, n = o.n ?? 7, avoid = o.avoid || [], cols = o.cols || VK_SH;
  sc.local(W.O, W.U, W.V, (g) => { for (let i = 0; i < n; i++) { const u = a + (b - a) * (i + 0.5) / n; if (avoid.some(([p, q]) => u + r > p && u - r < q)) continue; shield(g, u, o.v ?? 0.2, r, cols[i % cols.length]); } });
}
/* wystające końce bali na narożniku zrębu */
function logEnds(sc, x, y, z0, z1, pal = ['#6a4a2a', '#7a5632']) {
  const g = sc.g, f = sc.F, n = Math.max(2, Math.round((z1 - z0) / 0.108));
  for (let i = 0; i < n; i++) { const [px, py] = sc.P(x, y, z0 + (i + 0.5) * (z1 - z0) / n); g.fillStyle = pal[i % 2]; g.beginPath(); g.ellipse(px, py, 5 * f, 3.2 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = f; g.stroke(); }
}
/* narożniki zrębu na trzech widocznych narożnikach bryły V */
const logCorners = (sc, V) => { logEnds(sc, V.x1, V.y1, V.z0, V.z1); logEnds(sc, V.x0, V.y1, V.z0, V.z1); logEnds(sc, V.x1, V.y0, V.z0, V.z1); };

/* kalenica z belką, smoczymi łbami na obu końcach i (opcjonalnie) otworem dymnym; roof — wynik cottage().roof */
function vkRoof(B, roof, o = {}) {
  const sc = B.sc, top = roof.z + roof.rise, ovE = roof.ovE ?? 0.1, xm = (roof.x0 + roof.x1) / 2, ym = (roof.y0 + roof.y1) / 2, ry = roof.ridge === 'y';
  const A = ry ? [xm, roof.y1 + ovE] : [roof.x1 + ovE, ym], Z = ry ? [xm, roof.y0 - ovE] : [roof.x0 - ovE, ym];
  if (o.beam !== false) B.part(Math.min(A[0], Z[0]) - 0.05, Math.min(A[1], Z[1]) - 0.05, top, Math.max(A[0], Z[0]) + 0.05, Math.max(A[1], Z[1]) + 0.05, top + 0.08, () => {
    const g = sc.g, f = sc.F, a = sc.P(A[0], A[1], top), b = sc.P(Z[0], Z[1], top); g.lineCap = 'round'; g.strokeStyle = '#1c1008'; g.lineWidth = 7 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#4a301a'; g.lineWidth = 4 * f; g.stroke(); }, { tag: 'kalenica', shadow: false, nest: true });
  if (o.dragons) for (const [e, d] of [[A, 1], [Z, -1]].filter(([, d]) => !o.ends || d === o.ends)) B.part(e[0] - 0.13, e[1] - 0.13, top + 0.04, e[0] + 0.13, e[1] + 0.13, top + 0.55, () => dragonEnd(sc, e[0], e[1], top, d), { tag: 'smok', shadow: false, nest: true });
  if (o.smoke != null) {
    const t = o.smoke, sw = o.smokeW ?? 0.5, cx = ry ? xm : roof.x0 + (roof.x1 - roof.x0) * t, cy = ry ? roof.y0 + (roof.y1 - roof.y0) * t : ym, dx = ry ? 0.17 : sw / 2, dy = ry ? sw / 2 : 0.17;
    B.box(cx - dx, cy - dy, top - 0.25, cx + dx, cy + dy, top + 0.14, 'plank', { ao: 0.2, pal: '#3a2a18', nest: true, tag: 'dymnik' });
    B.pyramid({ x0: cx - dx - 0.03, x1: cx + dx + 0.03, y0: cy - dy - 0.03, y1: cy + dy + 0.03, z: top + 0.14, rise: 0.12, mat: 'shingle', pal: VK.shingleD, ov: 0.01, nest: true });
    B.smoke(cx, cy, top + 0.3);
  }
}
/* dom wikinga: cottage z domyślnym zrębem/deskami, darnią i smoczymi łbami */
function vkHouse(B, o) {
  const r = Object.assign({ mat: 'grass', pal: 'green', rise: 0.7, ov: 0.14, ovE: 0.16, gableMat: 'plank', gablePal: VK.wall, sod: true }, o.roof);
  const h = cottage(B, Object.assign({ h1: 0.85, low: ['plank', VK.wall], plinth: ['rubble', null], ridge: 'x' }, o, { roof: r }));
  vkRoof(B, h.roof, o);
  return h;
}
const vkWin = (o = {}) => ({ n: 1, w: 0.16, h: 0.2, v: 0.18, frame: VK.dark, dark: true, ...o });
const vkDoor = (at, w = 0.3, h = 0.5, o = {}) => ({ at, w, h, lintel: VK.red, frame: VK.doorF, pal: VK.door, ...o });

/* CHATA 2×2: dom ze zrębu z darnią, tarcza nad wejściem, suszarnia ryb i beczka */
BAKED.vikings_hut = function () {
  const sc = sceneFor(2, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.05, 1.3, 1.2, { seed: 36, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -0.8, x1: 0.8, y0: -0.62, y1: 0.4, low: ['log', VK.log], S: { door: vkDoor(0.3, 0.3, 0.5), win: vkWin() }, E: { win: vkWin() }, smoke: 0.35, smokeW: 0.4,
    deco1: (S, E, rS, rE, V) => { logCorners(sc, V); vkShields(sc, S, { v: 0.2, n: 3, a: 0.95, b: 1.55, r: 0.07, avoid: avoidOf(rS) }); } });
  B.rack(-0.92, 0.72, -0.5, 0.72, 'fish', 0.7); B.barrel(0.55, 0.75); B.barrel(0.72, 0.68, 0, 0.9);
  return B.flush();
};

/* CHATA DRWALA 2×2: zrąb z darnią, stosy kłód, pień do rąbania z siekierą i deski */
BAKED.vikings_woodcutter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 37, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -0.75, x1: 0.6, y0: -0.85, y1: 0.0, h1: 0.72, low: ['log', VK.log], S: { door: vkDoor(0.3, 0.28, 0.46), win: vkWin({ w: 0.15 }) }, E: { win: vkWin() }, roof: { rise: 0.6 }, smoke: 0.3, smokeW: 0.36,
    deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  B.logs(-0.58, 0.42); B.logs(-0.58, 0.64); B.logs(-0.2, 0.7); B.stump(0.42, 0.45); B.planks(0.55, 0.78, 0.95, 0.92, 0.24);
  return B.flush();
};

/* LEŚNICZÓWKA 2×2: chatka i ogrodzona grządka z młodymi sosnami */
BAKED.vikings_forester = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 38, pal: VK.bog, alpha: 0.8 });
  sc.decal('dirt', '#3e2c18', [[[-0.86, 0.3], [0.86, 0.3], [0.86, 0.96], [-0.86, 0.96]]], { feather: 5, alpha: 0.92 });
  vkHouse(B, { x0: -0.85, x1: 0.35, y0: -0.85, y1: -0.08, h1: 0.72, low: ['log', VK.log], S: { door: vkDoor(0.3, 0.28, 0.46), win: vkWin({ w: 0.15 }) }, E: { win: vkWin() }, roof: { rise: 0.55 }, smoke: 0.3, smokeW: 0.36,
    deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  B.fenceRect(-0.9, 0.3, 0.9, 0.98, { kind: 'wattle', gap: { S: [-0.2, 0.2] } });
  for (const [x, y, s] of [[-0.6, 0.55, 0.3], [-0.2, 0.62, 0.34], [0.2, 0.55, 0.3], [0.6, 0.62, 0.34], [-0.45, 0.85, 0.32], [0.45, 0.85, 0.3]]) B.tree('pine', 7 + Math.round(x * 9), x, y, s);
  B.bucket(0.55, 0.1); B.logs(0.62, -0.12);
  return B.flush();
};

/* CHATA MYŚLIWEGO 2×2: zrąb z poroży nad drzwiami, skóra niedźwiedzia, suszarka ze skórami */
BAKED.vikings_hunter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 39, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -0.9, x1: 0.4, y0: -0.85, y1: 0.05, h1: 0.72, low: ['log', VK.logD], S: { door: vkDoor(0.4, 0.28, 0.46), win: vkWin({ w: 0.15 }) }, E: { win: vkWin() }, roof: { rise: 0.58 }, smoke: 0.3, smokeW: 0.36,
    deco1: (S, E, rS, rE, V) => { logCorners(sc, V); sc.local(S.O, S.U, S.V, (g) => { const cx = 0.88; g.fillStyle = '#d8cfb8'; g.strokeStyle = '#2a2018'; g.lineWidth = 0.012; g.beginPath(); g.ellipse(cx, 0.15, 0.045, 0.035, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#d8cfb8'; g.lineWidth = 0.02; g.lineCap = 'round'; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(cx + s2 * 0.03, 0.13); g.quadraticCurveTo(cx + s2 * 0.12, 0.05, cx + s2 * 0.13, 0.02); g.moveTo(cx + s2 * 0.08, 0.09); g.lineTo(cx + s2 * 0.13, 0.1); g.stroke(); } }); } });
  B.rack(0.78, -0.6, 0.78, 0.25, 'pelts', 0.78); B.barrel(-0.7, 0.4); B.stump(-0.3, 0.55);
  return B.flush();
};

/* TARTAK 3×2: otwarta wiata na słupach pod gontem, piła ramowa na kobyłkach, stosy kłód i desek */
BAKED.vikings_sawmill = function () {
  const sc = sceneFor(3, 2, 2.4), B = new Build(sc), zr = 1.0;
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 40, pal: VK.bog, alpha: 0.8 });
  B.box(-1.3, -0.75, 0, 0.55, 0.45, 0.08, 'plank', { pal: '#6a4a2c', ao: 0.3, shadow: false });
  B.box(-1.3, -0.75, 0.08, 0.45, -0.67, zr, 'plank', { pal: VK.wall, ao: 0.3 }); B.box(-1.3, -0.67, 0.08, -1.22, 0.35, zr, 'plank', { pal: VK.wall, ao: 0.3 });
  for (const [px, py] of [[-1.3, 0.35], [-0.4, 0.35], [0.45, 0.35], [0.45, -0.75]]) B.box(px, py, 0.08, px + 0.1, py + 0.1, zr - 0.08, 'bark', { pal: '#5a3e22', ao: 0.2 });
  B.box(-1.3, 0.35, zr - 0.08, 0.55, 0.45, zr, 'log', { pal: VK.logD, ao: 0.2 });
  B.gable({ x0: -1.3, x1: 0.55, y0: -0.75, y1: 0.45, z: zr, rise: 0.45, ov: 0.12, ovE: 0.1, mat: 'shingle', pal: VK.shingle, gableMat: 'plank', gablePal: VK.wall, ridge: 'x' });
  B.sawRig(-1.1, -0.15, 0.0);
  B.logs(-1.1, 0.7); B.logs(-0.75, 0.72); B.planks(0.7, -0.3, 1.2, 0.0, 0.34, '#a88a58'); B.planks(0.72, 0.15, 1.15, 0.4, 0.26, '#b89a68');
  return B.flush();
};

/* MLECZARNIA 2×3: długi zrąb z darnią szczytem do ulicy, bańki, stół z serami, siano i płotek */
BAKED.vikings_dairy = function () {
  const sc = sceneFor(2, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.7, { seed: 41, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -0.8, x1: 0.8, y0: -1.4, y1: -0.2, h1: 0.82, ridge: 'y', low: ['log', VK.log], S: { door: vkDoor(0.5, 0.32, 0.54), win: vkWin({ n: 2, w: 0.15 }) }, E: { win: vkWin({ n: 2 }) }, roof: { rise: 0.72 }, smoke: 0.4, smokeW: 0.5,
    deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  B.churn(-0.6, 0.35); B.churn(-0.4, 0.42); B.churn(-0.62, 0.58);
  B.box(0.3, 0.4, 0, 0.8, 0.62, 0.32, 'plank', { pal: '#7a5a36', ao: 0.3, tag: 'stół' });
  B.disc(0.42, 0.5, 0.32, 0.07, 0.05, [236, 206, 120]); B.disc(0.62, 0.5, 0.32, 0.07, 0.05, [230, 196, 104]); B.disc(0.52, 0.5, 0.37, 0.07, 0.05, [240, 212, 130]);
  B.bucket(-0.05, 0.85); B.hay(-0.55, 1.1); B.fence(0.1, 1.3, 0.9, 1.3, { kind: 'rail' });
  return B.flush();
};

/* SAD 3×3: wiklinowy płot, sześć jabłoni, dwa ule, skrzynki z jabłkami */
BAKED.vikings_orchard = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc);
  sc.decal('grass', 'tundra', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.55 });
  B.fenceRect(-1.38, -1.3, 1.38, 1.3, { kind: 'wattle', h: 0.3, gap: { S: [-0.3, 0.3] } });
  [[-0.85, -0.65], [0.0, -0.72], [0.85, -0.65], [-0.8, 0.22], [0.05, 0.15], [0.85, 0.2]].forEach(([x, y], i) => B.tree('apple', 31 + i, x, y, 0.78));
  B.skep(1.1, 0.85); B.skep(1.0, 1.05, 0.9);
  B.crate(-1.0, 0.95, 0.24, 0.2); B.crate(-0.7, 1.0, 0.24, 0.2); B.heap(-1.0, 0.95, 0.13, 0.1, ['#e05a48', '#b02a22', '#6a1812'], 0.2); B.heap(-0.7, 1.0, 0.13, 0.1, ['#e05a48', '#b02a22', '#6a1812'], 0.2);
  return B.flush();
};

/* CHATA NOSIWODY 2×2: kamienna studnia z daszkiem i wiadrem, obok szopa z beczkami */
BAKED.vikings_watercarrier = function () {
  const sc = sceneFor(2, 2, 2.2), B = new Build(sc), wx = -0.38, wy = 0.15;
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 42, pal: VK.bog, alpha: 0.8 });
  B.cyl(wx, wy, 0, 0.42, 0.3, { mat: 'rubble', pal: '#7a766c', topMat: 'rubble', ao: 0.4 });
  B.part(wx - 0.3, wy - 0.3, 0.42, wx + 0.3, wy + 0.3, 0.46, () => { const g = sc.g, [px, py] = sc.P(wx, wy, 0.42), rx = 0.24 * AX * sc.F * 1.4142; const gr = g.createRadialGradient(px - rx * 0.3, py - rx * 0.1, 1, px, py, rx); gr.addColorStop(0, '#5aa0c0'); gr.addColorStop(1, '#123a54'); g.fillStyle = gr; g.strokeStyle = 'rgba(10,8,6,0.7)'; g.lineWidth = sc.F; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, TAU); g.fill(); g.stroke(); }, { tag: 'woda', shadow: false, nest: true });
  for (const px of [wx - 0.42, wx + 0.42]) B.box(px - 0.04, wy - 0.04, 0, px + 0.04, wy + 0.04, 0.95, 'bark', { pal: '#5a3e22', ao: 0.2 });
  B.box(wx - 0.5, wy - 0.04, 0.95, wx + 0.5, wy + 0.04, 1.03, 'log', { pal: '#5a3e22', ao: 0.2 });
  B.gable({ x0: wx - 0.55, x1: wx + 0.55, y0: wy - 0.24, y1: wy + 0.24, z: 1.03, rise: 0.3, ov: 0.08, ovE: 0.06, mat: 'shingle', pal: VK.shingle, gableMat: 'plank', gablePal: VK.wall, ridge: 'x' });
  B.part(wx - 0.05, wy - 0.05, 0.4, wx + 0.05, wy + 0.05, 1.0, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(wx, wy, 0.95), [, pb] = sc.P(wx, wy, 0.58); g.strokeStyle = '#d8c090'; g.lineWidth = 1.3 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, pb); g.stroke(); sc.cyl(wx, wy, 0.46, 0.58, 0.06, { mat: 'plank', pal: '#8a6a3c', topMat: 'plank', ao: 0.1 }); }, { tag: 'wiadro', shadow: false, nest: true });
  vkHouse(B, { x0: 0.3, x1: 0.92, y0: -0.9, y1: -0.2, h1: 0.62, ridge: 'y', plinth: false, low: ['plank', VK.wall], S: { door: vkDoor(0.5, 0.26, 0.42) }, E: { win: vkWin({ w: 0.14, h: 0.16 }) }, roof: { rise: 0.4, ov: 0.1, ovE: 0.1 } });
  B.barrel(0.45, 0.1, 0, 1.1); B.barrel(0.7, 0.2, 0, 1.1); B.barrel(0.62, 0.45, 0, 1.1); B.bucket(0.2, 0.2); B.bucket(0.2, 0.42);
  return B.flush();
};

/* kamień runiczny: pionowa płyta z runami na podstawie */
function runeStone(B, x, y, h = 0.9, w = 0.26) {
  B.box(x - w / 2 - 0.04, y - 0.1, 0, x + w / 2 + 0.04, y + 0.1, 0.07, 'rubble', { pal: '#8a867c', ao: 0.3 });
  return B.box(x - w / 2, y - 0.06, 0.07, x + w / 2, y + 0.06, h, 'rubble', { pal: '#9a968c', ao: 0.25, wear: 0.5, tag: 'runy' }, (S) => sc_runes(B.sc, S, h - 0.07));
}
function sc_runes(sc, S, hgt) {
  sc.local(S.O, S.U, S.V, (g, lu, lv) => { g.strokeStyle = 'rgba(40,34,26,0.85)'; g.lineWidth = 0.014; g.lineCap = 'round'; const n = Math.max(3, Math.floor(hgt / 0.16)), r = rng(Math.round(lu * 1000 + hgt * 100));
    for (let i = 0; i < n; i++) { const v = 0.12 + i * (lv - 0.2) / n, u = lu / 2; g.beginPath(); g.moveTo(u, v); g.lineTo(u, v + 0.09); const k = (r() * 4) | 0; if (k === 0) { g.moveTo(u, v + 0.02); g.lineTo(u + 0.05, v + 0.05); g.lineTo(u, v + 0.08); } else if (k === 1) { g.moveTo(u - 0.04, v + 0.03); g.lineTo(u + 0.04, v + 0.06); } else if (k === 2) { g.moveTo(u - 0.04, v + 0.07); g.lineTo(u, v + 0.02); g.lineTo(u + 0.04, v + 0.07); } else { g.moveTo(u + 0.04, v + 0.01); g.lineTo(u, v + 0.05); g.lineTo(u + 0.04, v + 0.09); } g.stroke(); } });
}

/* TARG 3×3: bruk, trzy stragany z pasiastymi płachtami (ryby, futra, chleb), kamień runiczny pośrodku */
BAKED.vikings_market = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc), pals = ['#a8352b|#e8d8a0', '#2f5aa8|#e8d8a0', '#d8a830|#e8d8a0'];
  sc.paved(-1.45, -1.45, 1.45, 1.45, { mat: 'cobble', jit: 0.1, seed: 12, feather: 4 }); sc.patch(0, 0, 2.2, 2.2, { seed: 43, pal: VK.bog, alpha: 0.4, feather: 16 });
  [-0.95, 0, 0.95].forEach((cx, i) => B.stall(cx, -1.35, { pal: pals[i], kind: ['fish', 'fur', 'bread'][i], counter: '#6a4a2c' }));
  runeStone(B, 0, 0.15, 1.0, 0.3);
  B.crate(-1.15, 0.85, 0.24, 0.24); B.crate(-0.85, 0.95, 0.22, 0.2); B.sack(0.95, 0.9, '#d8c898'); B.sack(1.12, 0.78, '#cdbb88'); B.barrel(1.15, 0.25); B.barrel(-1.2, 0.3, 0, 0.9);
  return B.flush();
};

/* SKŁAD 3×2: długi skład z ciemnych desek pod darnią, szeroka dwuskrzydłowa brama, okienko strychu, worki i beczki */
BAKED.vikings_store = function () {
  const sc = sceneFor(3, 2, 2.8), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 44, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -1.3, x1: 1.3, y0: -0.8, y1: 0.35, h1: 0.85, low: ['plank', VK.wall], S: { door: vkDoor(0.5, 0.56, 0.5, { arch: false }), win: vkWin({ n: 2, w: 0.14, h: 0.16 }) }, E: { win: vkWin({ w: 0.14, h: 0.16 }) },
    roof: { rise: 0.72, gwin: { w: 0.18, h: 0.2, frame: VK.dark } }, deco1: (S, E, rS) => vkShields(sc, S, { v: 0.2, n: 8, a: 0.2, b: 2.4, r: 0.06, avoid: avoidOf(rS, 0.1) }) });
  B.stairs(-0.3, 0.3, 0.37, 2, 0.12, 'rubble', 0.14);
  B.sack(-0.95, 0.62, '#d8c898'); B.sack(-0.75, 0.7, '#cdbb88'); B.sack(-0.9, 0.82, '#d8c898', 0.9); B.crate(0.75, 0.65, 0.22, 0.22); B.crate(0.98, 0.7, 0.2, 0.3); B.barrel(0.55, 0.85);
  return B.flush();
};

/* pojedynczy smoczy łeb w profilu (słup bramy) */
function prow(sc, x, y, z, d = 1) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.save(); g.translate(px, py); g.scale(f * d, f);
  g.fillStyle = '#4a301a'; g.strokeStyle = '#1c1008'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-4, 2); g.quadraticCurveTo(-5, -14, 3, -18); g.lineTo(14, -13); g.lineTo(7, -9); g.lineTo(12, -4); g.lineTo(2, 2); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(5, -12, 1.6, 0, TAU); g.fill(); g.fillStyle = '#b8352b'; g.beginPath(); g.arc(5, -12, 0.7, 0, TAU); g.fill(); g.restore();
}

/* KOŚCIÓŁ SŁUPOWY 3×3 (Świątynia): wysoka nawa pod gontem ze smoczymi łbami, niższe nawy boczne z pulpitowymi dachami,
   prezbiterium, wieża z portalem od wschodu i kamienie runiczne */
BAKED.vikings_temple = function () {
  const sc = sceneFor(3, 3, 4.4), B = new Build(sc), zp = 0.1, nx0 = -1.05, nx1 = 0.55, nz = 1.35, az = 0.7, aw = 0.4, hw = 0.35, lz = 1.0, ld = 0.32, tx1 = 1.2, tz = 1.35, bz = 1.85;
  sc.patch(0, 0.1, 2.0, 1.9, { seed: 62, pal: VK.bog, alpha: 0.7 });
  const nave = cottage(B, { x0: nx0, x1: nx1, y0: -hw, y1: hw, zp, h1: nz - zp, ridge: 'x', low: ['plank', VK.tar], plinth: ['rubble', null],
    S: { marg: 0.2, win: { n: 3, kind: 'arch', w: 0.1, h: 0.14, v: 0.08, frame: VK.dark, lit: '#120c06', lit2: '#0a0704' } },
    roof: { mat: 'shingle', pal: VK.shingleD, rise: 0.7, ov: 0.12, ovE: 0.04, gableMat: 'plank', gablePal: VK.tar } });
  vkRoof(B, nave.roof, { dragons: true, ends: -1 });
  for (const sgn of [1, -1]) {
    const y0 = sgn > 0 ? hw : -hw - aw, y1 = sgn > 0 ? hw + aw : -hw;
    B.box(nx0 - 0.02, y0 - 0.015, 0, nx1 + 0.02, y1 + 0.015, zp, 'rubble', { ao: 0.4 });
    B.box(nx0, y0, zp, nx1, y1, az, 'plank', { ao: 0.3, pal: VK.tar, eave: 0.35 }, sgn > 0 ? (S) => facade(sc, S, { marg: 0.2, win: { n: 3, kind: 'arch', w: 0.1, h: 0.22, v: 0.08, frame: VK.dark, lit: '#120c06', lit2: '#0a0704' } }) : null);
    B.lean(sgn > 0 ? { x0: nx0 - 0.08, x1: nx1 + 0.04, y0: hw, y1: hw + aw + 0.08, z: lz, drop: ld, mat: 'shingle', pal: VK.shingleD } : { x0: nx0 - 0.08, x1: nx1 + 0.04, y0: -hw - aw - 0.08, y1: -hw, z: lz, drop: ld, dir: 'N', mat: 'shingle', pal: VK.shingleD });
    const outer = lz - ld * (aw / (aw + 0.08)), v1 = (lz - outer) / (lz - zp);                                           // trapez ściany szczytowej nawy bocznej (wschód)
    B.part(nx1, Math.min(y0, y1), zp, nx1 + 0.01, Math.max(y0, y1), lz, () => sc.face([nx1, sgn > 0 ? y1 : -hw, lz], [0, -aw, 0], [0, 0, -(lz - zp)], 'plank', { shade: LIGHT.east, pal: VK.tar, clip: sgn > 0 ? [[0, v1], [1, 0], [1, 1], [0, 1]] : [[0, 0], [1, v1], [1, 1], [0, 1]], edge: 0.4 }), { tag: 'czoło nawy bocznej', shadow: false });
  }
  const chancel = cottage(B, { x0: -1.45, x1: nx0, y0: -0.28, y1: 0.28, zp, h1: 0.65, ridge: 'x', low: ['plank', VK.tar], plinth: ['rubble', null], roof: { mat: 'shingle', pal: VK.shingleD, rise: 0.34, ov: 0.08, ovE: 0.04, gableMat: 'plank', gablePal: VK.tar } });
  vkRoof(B, chancel.roof, { dragons: true, ends: -1 });
  // wieża wschodnia: dolna kondygnacja z portalem, dzwonnica z żaluzjami, ostry dach, wiatrowskaz
  B.box(nx1 - 0.02, -hw - 0.02, 0, tx1 + 0.02, hw + 0.02, zp, 'rubble', { ao: 0.4, nest: true });
  B.box(nx1, -hw, zp, tx1, hw, tz, 'plank', { ao: 0.3, pal: VK.tar, eave: 0.3 }, (S, E) => {
    facade(sc, E, { door: { at: 0.5, w: 0.3, h: 0.52, arch: true, frame: VK.gold, pal: VK.door } });
    facade(sc, S, { marg: 0.2, win: { n: 1, w: 0.08, h: 0.2, v: 0.25, frame: VK.dark, dark: true } });
  });
  B.box(nx1 + 0.05, -hw + 0.05, tz, tx1 - 0.05, hw - 0.05, bz, 'plank', { ao: 0.2, pal: VK.wall }, (S, E) => { for (const W of [S, E]) facade(sc, W, { marg: 0.06, win: { n: 1, kind: 'arch', w: 0.12, h: 0.26, v: 0.1, frame: VK.dark, lit: '#120c06', lit2: '#0a0704', louver: true } }); });
  B.pyramid({ x0: nx1 + 0.06, x1: tx1 - 0.02, y0: -hw + 0.02, y1: hw - 0.02, z: bz, rise: 0.8, mat: 'shingle', pal: VK.shingleD, ov: 0.04 });
  B.part((nx1 + tx1) / 2 - 0.03, -0.03, bz + 0.8, (nx1 + tx1) / 2 + 0.03, 0.03, bz + 1.25, () => { const g = sc.g, f = sc.F, [px, py] = sc.P((nx1 + tx1) / 2, 0, bz + 0.8); g.strokeStyle = '#2a1c10'; g.lineWidth = 2.2 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 30 * f); g.stroke(); g.fillStyle = VK.gold; g.beginPath(); g.moveTo(px, py - 30 * f); g.lineTo(px + 15 * f, py - 26 * f); g.lineTo(px, py - 21 * f); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,24,6,0.8)'; g.lineWidth = f; g.stroke(); }, { tag: 'wiatrowskaz', shadow: false, nest: true });
  runeStone(B, -0.55, 1.2, 0.85, 0.26); runeStone(B, 0.25, 1.3, 0.7, 0.24);
  return B.flush();
};

/* DWÓR JARLA 4×4: niska palisada z bramą ze smoczymi słupami, wielka hala ze smoczymi łbami i tarczami, dom gościnny, spichlerz na palach, drzewce z proporcem */
BAKED.vikings_keep = function () {
  const sc = sceneFor(4, 4, 4.0), B = new Build(sc), w = 1.82;
  sc.patch(0, 0.1, 2.6, 2.4, { seed: 63, pal: VK.bog, alpha: 0.75, feather: 20 });
  sc.decal('dirt', '#6a5230', [[[-w + 0.1, -w + 0.1], [w - 0.1, -w + 0.1], [w - 0.1, w - 0.1], [-w + 0.1, w - 0.1]]], { feather: 12, alpha: 0.5 });
  B.palisade(-w, -w, w, -w, 0.75); B.palisade(-w, -w, -w, w, 0.75); B.palisade(w, -w, w, w, 0.4); B.palisade(-w, w, -0.8, w, 0.4); B.palisade(0.8, w, w, w, 0.4);
  for (const sx of [-1, 1]) { const gx = sx * 0.6; B.box(gx - 0.07, w - 0.07, 0, gx + 0.07, w + 0.07, 1.0, 'bark', { pal: '#4a301a', ao: 0.2, tag: 'brama' }); B.part(gx - 0.12, w - 0.1, 1.0, gx + 0.12, w + 0.1, 1.4, () => prow(sc, gx, w, 1.0, sx), { tag: 'smok', shadow: false, nest: true }); }
  B.box(-0.53, w - 0.05, 0.84, 0.53, w + 0.05, 0.94, 'log', { pal: '#3a2a18', ao: 0.2, tag: 'brama' });
  // hala
  vkHouse(B, { x0: -1.6, x1: 0.6, y0: -1.5, y1: -0.5, h1: 0.95, low: ['plank', VK.wall], S: { door: vkDoor(0.62, 0.4, 0.7, { arch: false }), win: vkWin({ n: 2, h: 0.22 }) }, E: { win: vkWin({ n: 1, h: 0.22 }) }, roof: { rise: 0.78, ov: 0.18, ovE: 0.18 }, dragons: true, smoke: 0.4, smokeW: 0.6,
    deco1: (S, E, rS, rE) => { vkShields(sc, S, { v: 0.3, n: 9, a: 0.2, b: 2.0, avoid: avoidOf(rS, 0.1) }); vkShields(sc, E, { v: 0.3, n: 3, a: 0.2, b: 0.8, avoid: avoidOf(rE, 0.1) }); } });
  // dom gościnny
  vkHouse(B, { x0: -1.6, x1: -0.8, y0: 0.2, y1: 0.9, h1: 0.7, ridge: 'y', low: ['log', VK.log], S: { door: vkDoor(0.5, 0.26, 0.44) }, E: { win: vkWin({ w: 0.14 }) }, roof: { rise: 0.55, ov: 0.1, ovE: 0.1 }, deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  // spichlerz na palach
  for (const [px, py] of [[0.82, 0.32], [1.38, 0.32], [0.82, 0.88], [1.38, 0.88]]) B.box(px, py, 0, px + 0.12, py + 0.12, 0.3, 'bark', { pal: '#4a301a', ao: 0.2 });
  vkHouse(B, { x0: 0.8, x1: 1.5, y0: 0.3, y1: 1.0, zp: 0.3, h1: 0.6, ridge: 'y', plinth: false, low: ['plank', VK.wall], S: { door: vkDoor(0.5, 0.24, 0.4) }, E: { win: vkWin({ w: 0.12, h: 0.16 }) }, roof: { rise: 0.5, ov: 0.1, ovE: 0.1, mat: 'shingle', pal: VK.shingle, sod: false } });
  B.stairs(1.0, 1.25, 1.02, 2, 0.28, 'plank', 0.14, '#6a4a2c');
  // dziedziniec
  B.part(-0.06, 0.62, 0, 0.3, 0.78, 1.7, () => pennant(sc, 0, 0.7, 0, 120, '#a8352b'), { tag: 'proporzec', shadow: false });
  B.weaponRack(-0.55, 0.6, -0.15, 0.6, 'spears'); B.shieldRack(0.3, 0.0, 0.65, 0.0, ['#b8352b', '#2f5aa8', '#d8a830']);
  runeStone(B, -1.3, 1.35, 0.8, 0.26); B.barrel(0.55, 1.2); B.barrel(0.75, 1.3, 0, 0.9); B.crate(1.55, 1.4, 0.22, 0.22); B.logs(-0.4, 1.4);
  return B.flush({ shadow: { alpha: 0.5, blur: 12 } });
};

/* nieregularna plama wody (wielokąt 18-kątny z szumem promienia), do dekali pod pomostem i okrętem */
function waterBlob(cx, cy, rx, ry, seed = 1) {
  const r = rng(seed), pts = []; for (let i = 0; i < 18; i++) { const a = i * TAU / 18, k = 0.9 + r() * 0.12; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return [pts];
}
/* okręt wikingów rysowany w płaszczyźnie sceny: kadłub klepkowy, tarcze na burcie, żagiel w pasy, smocza głowa na dziobie.
   (ox, oy) — środek na ziemi, k — skala (1 = kadłub 1.84 pola) wzdłuż osi x; o.sail / o.shields / o.heads / o.plain — wersje uproszczone (łódź rybacka) */
function drawLongship(sc, ox, oy, k, o = {}) {
  const g = sc.g, sf = sc.F, f = sf * Math.max(k, 0.55), P = (x, y, z) => sc.P(ox + x * k, oy + y * k, z * k), H = 0.92, W = 0.2, N = 30;
  g.lineWidth = 0.75 * sf; g.lineJoin = 'round';
  const hw = x => W * (1 - Math.pow(Math.abs(x) / H, 2.6)) + 0.012, zt = x => 0.19 + 0.22 * Math.pow(Math.abs(x) / H, 3.2), zb = x => 0.0 + 0.1 * Math.pow(Math.abs(x) / H, 1.4);
  const xs = Array.from({ length: N + 1 }, (_, i) => -H + 2 * H * i / N), rev = xs.slice().reverse();
  const poly = pts => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); };
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = P(x, hw(x) + 0.06, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = P(x, -hw(x) - 0.06, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(238,252,255,0.6)', 9 * sf);
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = P(x + 0.22, hw(x) + 0.1, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = P(x + 0.22, -hw(x) + 0.1, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(6,34,52,0.42)', 10 * sf);
  poly([...xs.map(x => P(x, -hw(x), zt(x))), ...rev.map(x => P(x, -hw(x) * 0.78, zt(x) - 0.13))]); g.fillStyle = '#4a3220'; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.7)'; g.stroke();
  poly([...xs.map(x => P(x, -hw(x) * 0.8, zt(x) - 0.1)), ...rev.map(x => P(x, hw(x) * 0.8, zt(x) - 0.1))]);
  const dg = g.createLinearGradient(...P(0, -0.2, 0.1), ...P(0, 0.2, 0.1)); dg.addColorStop(0, '#7a5a34'); dg.addColorStop(1, '#a98450'); g.fillStyle = dg; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,24,10,0.55)'; g.lineWidth = 0.75 * sf; for (let i = -7; i <= 7; i++) { const x = i * 0.11; g.beginPath(); g.moveTo(...P(x, -hw(x) * 0.78, zt(x) - 0.1)); g.lineTo(...P(x, hw(x) * 0.78, zt(x) - 0.1)); g.stroke(); }
  if (o.sail !== false) {
  g.lineCap = 'round'; g.strokeStyle = '#4a301a'; g.lineWidth = 4 * f; g.beginPath(); g.moveTo(...P(0, 0, zt(0) - 0.1)); g.lineTo(...P(0, 0, 1.0)); g.stroke();
  const sails = 8, sy0 = 0.93, sy1 = 0.36, swd = 0.34;
  for (let i = 0; i < sails; i++) {
    const a = -swd + 2 * swd * i / sails, b = -swd + 2 * swd * (i + 1) / sails, bulge = t => 0.04 * Math.sin(Math.PI * (t + 1) / 2);
    poly([P(bulge(a / swd), a, sy0), P(bulge(b / swd), b, sy0), P(bulge(b / swd) * 0.7, b, sy1), P(bulge(a / swd) * 0.7, a, sy1)]);
    g.fillStyle = i % 2 ? '#efe4c6' : '#b8352b'; g.fill(); g.strokeStyle = 'rgba(40,20,10,0.4)'; g.lineWidth = 0.6 * sf; g.stroke();
  }
  const shade = g.createLinearGradient(...P(0, -swd, 0.9), ...P(0, swd, 0.4)); shade.addColorStop(0, 'rgba(255,240,200,0.16)'); shade.addColorStop(1, 'rgba(0,0,30,0.3)');
  poly([P(0, -swd, sy0), P(0, swd, sy0), P(0, swd, sy1), P(0, -swd, sy1)]); g.fillStyle = shade; g.fill();
  g.strokeStyle = '#3a2614'; g.lineWidth = 3.4 * f; g.beginPath(); g.moveTo(...P(0, -swd - 0.03, sy0 + 0.01)); g.lineTo(...P(0, swd + 0.03, sy0 + 0.01)); g.stroke();
  }
  const strakes = 6;
  for (let k = 0; k < strakes; k++) {
    const a = k / strakes, b = (k + 1) / strakes;
    poly([...xs.map(x => P(x, hw(x) * (1 - a * 0.28), lerp(zt(x), zb(x), a))), ...rev.map(x => P(x, hw(x) * (1 - b * 0.28), lerp(zt(x), zb(x), b)))]);
    const gr = g.createLinearGradient(...P(0, 0, zt(0)), ...P(0, 0, zb(0)));
    const base = k === 0 && !o.plain ? [184, 53, 43] : (k % 2 ? [112, 78, 46] : [138, 98, 56]); gr.addColorStop(0, css(scaleC(base, 1.2))); gr.addColorStop(1, css(scaleC(base, 0.72)));
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.75)'; g.lineWidth = 0.75 * sf; g.stroke();
  }
  const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830'];
  if (o.shields !== false) for (let i = 0; i < 11; i++) { const x = -0.62 + i * 0.124, [px, py] = P(x, hw(x), zt(x) - 0.07); g.fillStyle = cols[i % 4]; g.beginPath(); g.ellipse(px, py, 6.6 * f, 6.2 * f, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 0.9 * sf; g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(px, py, 2 * f, 0, TAU); g.fill(); }
  const stem = (x, d, hgt, head) => {
    const a = P(x, 0, zt(x) - 0.04), b = P(x + 0.07 * d, 0, zt(x) + hgt * 0.55), c = P(x + 0.02 * d, 0, zt(x) + hgt);
    g.strokeStyle = '#3a2614'; g.lineWidth = 6 * f; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]); g.stroke();
    g.strokeStyle = '#8a6238'; g.lineWidth = 2.6 * f; g.stroke();
    g.save(); g.translate(c[0], c[1]); g.scale(f, f);
    if (head) { g.fillStyle = '#7a5230'; g.strokeStyle = 'rgba(20,10,4,0.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, 4); g.quadraticCurveTo(-4, -12, 4, -14); g.lineTo(16, -8); g.lineTo(8, -4); g.lineTo(12, 2); g.lineTo(2, 4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f0e8c8'; g.beginPath(); g.arc(5, -7, 1.8, 0, TAU); g.fill(); g.fillStyle = '#b8352b'; g.beginPath(); g.arc(5, -7, 0.8, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#3a2614'; g.lineWidth = 3; g.beginPath(); g.arc(-3, -1, 4, 0, Math.PI * 1.5); g.stroke(); }
    g.restore();
  };
  stem(-H, -1, 0.28, false); stem(H, 1, 0.34, o.heads !== false);
}

/* stos torfu do suszenia: kratownica z ciemnych cegieł (poziomy naprzemiennie przesunięte) */
Build.prototype.peatStack = function (x, y, nx, ny, lv) {
  const w = 0.2, d = 0.1, h = 0.07, gx = 0.26, gy = 0.14;
  return this.part(x, y, 0, x + (nx - 1) * gx + w + 0.03, y + (ny - 1) * gy + d, lv * h + 0.01, () => { const sc = this.sc; for (let l = 0; l < lv; l++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const ox = x + i * gx + (l % 2 ? 0.03 : 0), oy = y + j * gy; sc.box(ox, oy, l * h, ox + w, oy + d, l * h + h - 0.005, 'dirt', { pal: '#4a3220', ao: 0.25, wear: 0.4 }); } }, { tag: 'torf', shadow: true });
};
/* łopata wbita w ziemię */
Build.prototype.spade = function (x, y) {
  return this.part(x - 0.05, y - 0.05, 0, x + 0.05, y + 0.05, 0.62, () => { const g = this.sc.g, f = this.sc.F, [px, py] = this.sc.P(x, y, 0); g.lineCap = 'round'; g.strokeStyle = '#5a3e22'; g.lineWidth = 2.4 * f; g.beginPath(); g.moveTo(px, py - 4 * f); g.lineTo(px, py - 46 * f); g.stroke(); g.fillStyle = '#b8bec6'; g.strokeStyle = 'rgba(14,12,10,0.8)'; g.lineWidth = f; g.beginPath(); g.moveTo(px - 4.5 * f, py - 1 * f); g.lineTo(px + 4.5 * f, py - 1 * f); g.lineTo(px + 3.5 * f, py - 11 * f); g.lineTo(px - 3.5 * f, py - 11 * f); g.closePath(); g.fill(); g.stroke(); }, { tag: 'łopata', shadow: false });
};

/* CHATA RYBAKA 2×2: zrąb z darnią, suszarnia ryb, sieć na palach, łódź wyciągnięta na brzeg */
BAKED.vikings_fisherhut = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.3, 1.2, { seed: 45, pal: '#8a7a54', alpha: 0.85 });
  vkHouse(B, { x0: -0.85, x1: 0.3, y0: -0.9, y1: -0.15, h1: 0.72, low: ['log', VK.log], S: { door: vkDoor(0.3, 0.28, 0.46), win: vkWin({ w: 0.15 }) }, E: { win: vkWin() }, roof: { rise: 0.58 }, smoke: 0.3, smokeW: 0.34,
    deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  B.part(0.35, 0.58, 0, 1.0, 0.82, 0.3, () => drawLongship(sc, 0.68, 0.7, 0.36, { sail: false, shields: false, heads: false, plain: true }), { tag: 'łódź', shadow: false });
  B.rack(-0.9, 0.35, -0.3, 0.35, 'fish', 0.75); B.rack(0.62, -0.7, 0.62, -0.2, 'fish', 0.75); B.barrel(-0.1, 0.6); B.barrel(0.05, 0.75, 0, 0.9);
  return B.flush();
};

/* KOPALNIA DARNIOWA 3×3: torfowisko z wyciętymi rowami i wodą, stosy torfu do suszenia, wózek, łopaty i szałas z darni */
BAKED.vikings_peatmine = function () {
  const sc = sceneFor(3, 3, 2.2, { pRes: RES }), B = new Build(sc);
  sc.decal('dirt', '#33261a', [[[-1.45, -1.0], [1.45, -1.0], [1.45, 1.45], [-1.45, 1.45]]], { feather: 18, alpha: 0.95 });
  for (const [x0, y0, x1, y1] of [[-1.1, -0.7, 0.2, -0.2], [-1.1, 0.0, 0.2, 0.5]]) { sc.decal('dirt', '#1c140c', [[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]], { feather: 3, alpha: 0.95 }); sc.decal('water', null, [[[x0 + 0.1, y0 + 0.08], [x1 - 0.1, y0 + 0.08], [x1 - 0.1, y1 - 0.08], [x0 + 0.1, y1 - 0.08]]], { feather: 2.5 }); }
  vkHouse(B, { x0: 0.75, x1: 1.4, y0: -1.35, y1: -0.7, h1: 0.62, ridge: 'y', plinth: false, low: ['dirt', '#5a4428'], S: { door: vkDoor(0.5, 0.24, 0.4) }, E: {}, roof: { rise: 0.42, ov: 0.1, ovE: 0.1 } });
  B.peatStack(0.45, 0.2, 4, 3, 5); B.peatStack(-1.3, 0.85, 3, 2, 4); B.peatStack(0.0, 1.0, 3, 2, 3);
  B.heap(1.05, 0.15, 0.32, 0.26, 'peat'); B.cart(1.1, 0.85, 'peat'); B.spade(-0.7, 0.62); B.spade(-0.4, -0.05);
  return B.flush();
};

/* WYPALARKA WĘGLA 3×3: dymiąca mielerz pod ziemną pokrywą, drabina, żar przy podstawie, stosy drewna, worki z węglem i szałas */
BAKED.vikings_charburner = function () {
  const sc = sceneFor(3, 3, 3.0), B = new Build(sc), cx = 0.0, cy = 0.15;
  sc.patch(0, 0.1, 2.0, 1.9, { seed: 46, pal: '#3a2c1c', alpha: 0.9 });
  sc.decal('dirt', '#1e1610', [[[-1.0, -0.7], [1.1, -0.7], [1.1, 1.1], [-1.0, 1.1]]], { feather: 12, alpha: 0.85 });
  vkHouse(B, { x0: 0.9, x1: 1.45, y0: -1.4, y1: -0.8, h1: 0.6, ridge: 'y', plinth: false, low: ['log', VK.logD], S: { door: vkDoor(0.5, 0.24, 0.4) }, E: {}, roof: { rise: 0.4, ov: 0.1, ovE: 0.1 } });
  B.part(cx - 0.85, cy - 0.85, 0, cx + 0.85, cy + 0.85, 1.9, () => {
    const g = sc.g, f = sc.F; drawHeap(sc, cx, cy, 0.82, 0.78, HEAP.earth);
    const [tx, ty] = sc.P(cx, cy, 0.78); g.fillStyle = '#120c06'; g.beginPath(); g.ellipse(tx, ty + 1 * f, 7 * f, 3.4 * f, 0, 0, TAU); g.fill();
    for (const [a, b] of [[-0.55, 0.36], [0.05, 0.62], [0.55, 0.3], [-0.2, 0.55], [0.4, 0.5]]) { const [px, py] = sc.P(cx + a, cy + b, 0.05), gl = g.createRadialGradient(px, py, 0, px, py, 7 * f); gl.addColorStop(0, 'rgba(255,200,90,0.95)'); gl.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(px, py, 7 * f, 4 * f, 0, 0, TAU); g.fill(); }
  }, { tag: 'mielerz', shadow: true, pts: (() => { const pp = []; for (let k = 0; k < 8; k++) pp.push([cx + Math.cos(k * TAU / 8) * 0.82, cy + Math.sin(k * TAU / 8) * 0.82, 0]); pp.push([cx, cy, 0.8]); return pp; })() });
  B.smoke(cx, cy, 0.85);
  B.part(cx - 0.3, cy + 0.72, 0, cx + 0.05, cy + 0.9, 0.7, () => { const g = sc.g, f = sc.F, a = sc.P(cx - 0.2, cy + 0.82, 0), b = sc.P(cx - 0.12, cy + 0.5, 0.6); g.strokeStyle = '#6a4a2c'; g.lineWidth = 2 * f; g.lineCap = 'round'; for (const d of [-4, 4]) { g.beginPath(); g.moveTo(a[0] + d * f, a[1]); g.lineTo(b[0] + d * f, b[1]); g.stroke(); } g.lineWidth = 1.4 * f; for (let i = 1; i < 6; i++) { const t = i / 6; g.beginPath(); g.moveTo(lerp(a[0], b[0], t) - 4 * f, lerp(a[1], b[1], t)); g.lineTo(lerp(a[0], b[0], t) + 4 * f, lerp(a[1], b[1], t)); g.stroke(); } }, { tag: 'drabina', shadow: false, nest: true });
  B.logs(-1.2, 0.35); B.logs(-1.2, 0.58); B.logs(-1.2, 0.81); B.logs(-0.8, 1.2); B.logs(-0.45, 1.25);
  B.sack(1.05, 0.85, '#2a2a2e'); B.sack(1.22, 0.78, '#25252a', 0.95); B.sack(1.1, 1.02, '#2a2a2e'); B.barrel(0.7, 1.25); B.stump(1.2, 0.2);
  return B.flush();
};

/* MIODOSYTNIA 2×3: warzelnia z szopą pod gontem ze smoczym łbem, kadzie, beczki i kocioł na ogniu */
BAKED.vikings_mead = function () {
  const sc = sceneFor(2, 3, 2.6), B = new Build(sc);
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 55, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -0.92, x1: 0.92, y0: -1.42, y1: -0.3, h1: 0.88, low: ['plank', VK.wall], S: { door: vkDoor(0.7, 0.3, 0.52, { lintel: VK.gold }), win: vkWin({ n: 1 }) }, E: { win: vkWin() }, roof: { mat: 'shingle', pal: VK.shingle, rise: 0.62, sod: false }, dragons: true, ends: 1, smoke: 0.55, smokeW: 0.4,
    deco1: (S, E, rS, rE) => vkShields(sc, E, { v: 0.22, n: 3, a: 0.2, b: 0.9, r: 0.07, cols: [VK.gold, '#b8352b', VK.cream], avoid: avoidOf(rE) }) });
  const vat = (x, y, r, h) => { B.cyl(x, y, 0.04, h, r, { mat: 'plank', pal: '#7a5632', topMat: 'plank', topPal: '#6a4626', ao: 0.4 }); B.part(x - r, y - r, 0.04, x + r, y + r, h + 0.02, () => { const g = sc.g, f = sc.F, rx = r * AX * f * 1.4142; for (const zz of [0.04 + h * 0.25, 0.04 + h * 0.75]) { const [px, py] = sc.P(x, y, zz); g.strokeStyle = '#2a2420'; g.lineWidth = 2.4 * f; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, Math.PI); g.stroke(); } }, { tag: 'obręcze', shadow: false, nest: true }); };
  vat(-0.55, 0.15, 0.28, 0.6); vat(0.05, 0.4, 0.25, 0.52); vat(0.6, 0.1, 0.28, 0.6);
  B.barrel(-0.7, 1.1, 0, 1.2); B.barrel(-0.4, 1.2, 0, 1.2); B.barrel(0.35, 1.15, 0, 1.2);
  B.cyl(0.65, 0.85, 0.04, 0.34, 0.2, { color: [190, 112, 56], ao: 0.3 });
  B.part(0.43, 0.63, 0.34, 0.87, 1.07, 0.7, () => { const g = sc.g, f = sc.F, [kx, ky] = sc.P(0.65, 0.85, 0.34); g.fillStyle = '#d98a3a'; g.beginPath(); g.ellipse(kx, ky, 0.18 * AX * f * 1.4142, 0.18 * AY * f * 1.4142, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,200,0.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(kx + (i - 1.5) * 6 * f, ky - (8 + i * 6) * f, (5 + i * 2) * f, 4 * f, 0, 0, TAU); g.fill(); } }, { tag: 'kocioł', shadow: false, nest: true });
  return B.flush();
};

/* PRZYSTAŃ 4×2: szopa na łodzie na brzegu, pomost na palach nad wodą z polerami, beczkami, żurawikiem i siecią */
BAKED.vikings_dock = function () {
  const sc = sceneFor(4, 2, 2.6), B = new Build(sc), px0 = -0.75, px1 = 1.95, py0 = -0.42, py1 = 0.42, zd = 0.34;
  sc.patch(-1.3, 0, 1.1, 1.3, { seed: 44, pal: '#8a7a54', alpha: 0.85 });
  sc.decal('water', null, waterBlob(0.55, 0.02, 1.45, 0.82, 5), { feather: 20 });
  vkHouse(B, { x0: -1.9, x1: -0.9, y0: -0.8, y1: 0.8, h1: 0.8, ridge: 'y', low: ['plank', VK.wall], S: { door: vkDoor(0.3, 0.26, 0.5) }, E: { door: vkDoor(0.5, 0.7, 0.62, { at: 0.5 }) }, roof: { rise: 0.62, ov: 0.12, ovE: 0.12 }, dragons: true, ends: 1,
    deco1: (S, E, rS) => vkShields(sc, S, { v: 0.22, n: 2, a: 0.62, b: 0.96, r: 0.07, cols: [VK.blue, VK.cream], avoid: avoidOf(rS) }) });
  const posts = []; for (let i = 0; i < 6; i++) for (const y of [py0 + 0.08, py1 - 0.08]) posts.push([px0 + 0.15 + i * (px1 - px0 - 0.3) / 5, y]);
  for (const [x, y] of posts) B.cyl(x, y, 0, zd - 0.05, 0.07, { mat: 'log', pal: '#4a3826', topMat: 'plank', ao: 0.3, shadow: false });
  B.box(px0, py0, zd - 0.05, px1, py1, zd, 'plank', { pal: '#8a6a40', ao: 0.4, eave: 0.4 });
  for (let i = 0; i < 4; i++) B.cyl(px0 + 0.3 + i * 0.75, py1 - 0.06, zd, zd + 0.22, 0.06, { mat: 'log', pal: '#3a2a18', topMat: 'plank', ao: 0.2 });
  B.part(px0 + 0.5, py1 - 0.2, zd, px0 + 0.9, py1 - 0.02, zd + 0.06, () => { const g = sc.g, f = sc.F, [rx, ry] = sc.P(px0 + 0.7, py1 - 0.1, zd + 0.02); g.strokeStyle = '#d8c090'; g.lineWidth = 2.6 * f; g.beginPath(); g.ellipse(rx, ry, 9 * f, 4 * f, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(rx, ry - 1.4 * f, 7 * f, 3 * f, 0, 0, TAU); g.stroke(); }, { tag: 'lina', shadow: false });
  B.barrel(px0 + 1.2, -0.05, zd, 0.8); B.barrel(px0 + 1.4, 0.1, zd, 0.8); B.box(px0 + 1.86, -0.12, zd, px0 + 2.1, 0.12, zd + 0.2, 'plank', { pal: '#7a5a36', ao: 0.3, tag: 'skrzynia' });
  B.box(px1 - 0.2, -0.04, zd, px1 - 0.12, 0.04, zd + 1.1, 'log', { pal: '#4a3826', ao: 0.1, tag: 'żuraw' }); B.box(px1 - 0.55, -0.04, zd + 1.0, px1 - 0.12, 0.04, zd + 1.1, 'log', { pal: '#4a3826', ao: 0.1, tag: 'żuraw', nest: true });
  B.part(px1 - 0.6, -0.06, zd + 0.1, px1 - 0.5, 0.06, zd + 1.0, () => { const g = sc.g, f = sc.F, [cx, cy] = sc.P(px1 - 0.55, 0, zd + 1.0); g.strokeStyle = '#d8c090'; g.lineWidth = 1.6 * f; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + 36 * f); g.stroke(); barrel(sc, px1 - 0.55, 0, zd + 0.1, 0.6); }, { tag: 'lina', shadow: false, nest: true });
  B.part(px1 - 0.2, -0.04, zd + 1.1, px1 - 0.12, 0.04, zd + 1.3, () => lantern(sc, px1 - 0.16, 0, zd + 1.1), { tag: 'latarnia', shadow: false, nest: true });
  B.part(0.35, py1 - 0.1, zd, 1.05, py1, zd + 0.7, () => { const g = sc.g, f = sc.F, [nx, ny] = sc.P(0.7, py1 - 0.02, zd); g.strokeStyle = '#2a1c0c'; g.lineWidth = 2.6 * f; g.beginPath(); g.moveTo(nx - 30 * f, ny); g.lineTo(nx - 30 * f, ny - 40 * f); g.moveTo(nx + 30 * f, ny); g.lineTo(nx + 30 * f, ny - 40 * f); g.moveTo(nx - 32 * f, ny - 38 * f); g.lineTo(nx + 32 * f, ny - 38 * f); g.stroke();
    g.strokeStyle = 'rgba(214,200,160,0.7)'; g.lineWidth = f; for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(nx - 30 * f + i * 6 * f, ny - 38 * f); g.lineTo(nx - 30 * f + i * 6 * f + (i % 2 ? 2 : -2) * f, ny - 6 * f); g.stroke(); } for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(nx - 30 * f, ny - 38 * f + j * 6 * f); g.lineTo(nx + 30 * f, ny - 38 * f + j * 6 * f); g.stroke(); } }, { tag: 'sieć', shadow: false, nest: true });
  return B.flush({ shadow: { alpha: 0.4, blur: 8 } });
};

/* HUTA 3×3: zrąb z darnią i kamiennym kominem, szybowy piec dymarski z żarem, miech, hałdy rudy, węgla i żużlu, sztabki */
BAKED.vikings_smelter = function () {
  const sc = sceneFor(3, 3, 3.4), B = new Build(sc);
  sc.patch(0, 0.2, 1.5, 1.4, { seed: 64, pal: '#4a3a28', alpha: 0.8 });
  sc.flat([[[0.45, 0.0], [1.45, 0.0], [1.45, 0.95], [0.45, 0.95]]], 'rgba(255,150,60,0.2)', 16);
  vkHouse(B, { x0: -1.3, x1: 0.5, y0: -1.3, y1: -0.2, h1: 0.9, low: ['log', VK.logD], S: { door: vkDoor(0.3, 0.4, 0.55), win: vkWin({ w: 0.15 }) }, E: { win: vkWin({ glow: true, dark: false, lit: '#ffd078' }) }, roof: { rise: 0.55 }, chim: [-0.55, -0.75, 1.05, 0.42, 'stone', '#8a867c'],
    deco1: (S, E, rS, rE, V) => logCorners(sc, V) });
  B.cyl(0.95, 0.3, 0, 0.9, 0.3, { mat: 'sandstone', pal: '#a07850', topMat: 'sandstone', ao: 0.45 }); B.smoke(0.95, 0.3, 1.05);
  B.part(0.6, 0.6, 0.15, 1.3, 0.62, 0.7, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.95, 0.58, 0.32), gl = g.createRadialGradient(px, py, 0, px, py, 15 * f); g.fillStyle = '#17100a'; g.beginPath(); g.ellipse(px, py, 8 * f, 10 * f, 0, 0, TAU); g.fill(); gl.addColorStop(0, 'rgba(255,235,150,0.95)'); gl.addColorStop(0.5, 'rgba(255,130,30,0.8)'); gl.addColorStop(1, 'rgba(160,30,0,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(px, py, 15 * f, 17 * f, 0, 0, TAU); g.fill(); }, { tag: 'żar', shadow: false, nest: true });
  B.part(0.3, 0.1, 0, 0.62, 0.55, 0.4, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.46, 0.34, 0.12); g.fillStyle = '#7a5a36'; g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = f; g.beginPath(); g.moveTo(px - 12 * f, py - 4 * f); g.lineTo(px + 6 * f, py - 14 * f); g.lineTo(px + 14 * f, py + 1 * f); g.lineTo(px - 3 * f, py + 8 * f); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#4a3220'; g.beginPath(); g.moveTo(px - 12 * f, py - 4 * f); g.lineTo(px - 3 * f, py + 8 * f); g.lineTo(px - 3 * f, py + 14 * f); g.lineTo(px - 12 * f, py + 4 * f); g.closePath(); g.fill(); g.stroke(); }, { tag: 'miech', shadow: false });
  B.heap(-1.1, 0.5, 0.4, 0.34, 'ore'); B.heap(-0.4, 0.95, 0.34, 0.28, 'coal'); B.heap(1.2, -0.75, 0.28, 0.24, 'slag');
  B.part(-0.2, 0.35, 0, 0.3, 0.6, 0.2, () => { let i = 0; for (let l = 0; l < 3; l++) for (let k = 0; k < 3 - l; k++) { const x = -0.1 + k * 0.17 + l * 0.085; sc.box(x - 0.08, 0.4, l * 0.07, x + 0.08, 0.5, l * 0.07 + 0.065, 'stone', { pal: '#8a8e94', ao: 0.1, wear: 0 }); i++; } }, { tag: 'sztabki', shadow: false });
  B.barrel(1.15, 1.2); B.crate(-0.8, 1.2, 0.22, 0.2);
  return B.flush();
};

/* KUŹNIA NARZĘDZI 2×3: zrąb z darnią, otwarta kuźnia pod pulpitowym daszkiem z paleniskiem, kowadłem, korytem i szlifierką */
BAKED.vikings_toolforge = function () {
  const sc = sceneFor(2, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 65, pal: '#4a3a28', alpha: 0.8 });
  sc.flat([[[0.1, 0.2], [0.9, 0.2], [0.9, 1.0], [0.1, 1.0]]], 'rgba(255,150,60,0.22)', 16);
  vkHouse(B, { x0: -0.92, x1: 0.92, y0: -1.4, y1: 0.0, h1: 0.95, low: ['log', VK.logD], E: { win: vkWin({ n: 2, glow: true, dark: false, lit: '#ffd078' }) }, roof: { rise: 0.6 }, chim: [0.55, -0.7, 0.85, 0.36, 'stone', '#8a867c'],
    deco1: (S, E, rS, rE, V) => { logCorners(sc, V); sc.local(S.O, S.U, S.V, (g, lu, lv) => { g.fillStyle = 'rgba(16,10,6,0.45)'; g.fillRect(0.05, 0.05, lu - 0.1, lv - 0.1); g.strokeStyle = '#2a2018'; g.lineWidth = 0.014; for (const [u, v, k] of [[0.3, 0.3, 0], [0.55, 0.34, 1], [0.8, 0.3, 2], [1.1, 0.34, 0], [1.4, 0.3, 1]]) { g.beginPath(); g.moveTo(u, v - 0.1); g.lineTo(u, v + 0.1); g.stroke(); g.fillStyle = '#9aa0a6'; if (k === 0) g.fillRect(u - 0.05, v - 0.12, 0.1, 0.05); else if (k === 1) { g.beginPath(); g.moveTo(u, v - 0.1); g.lineTo(u + 0.06, v - 0.18); g.lineTo(u + 0.08, v - 0.1); g.fill(); } else { g.beginPath(); g.arc(u, v + 0.1, 0.03, 0, TAU); g.stroke(); } } }); } });
  B.lean({ x0: -0.98, x1: 0.98, y0: 0.02, y1: 1.02, z: 1.12, drop: 0.26, mat: 'shingle', pal: VK.shingle });
  for (const px of [-0.87, -0.3, 0.3, 0.87]) B.box(px - 0.05, 0.96, 0, px + 0.05, 1.06, 0.86, 'bark', { ao: 0.2, pal: '#4a301a' });
  B.box(0.2, 0.2, 0.1, 0.88, 0.7, 0.55, 'rubble', { ao: 0.3, pal: '#7a766c' });
  B.part(0.3, 0.3, 0.55, 0.8, 0.62, 0.62, () => { const g = sc.g, f = sc.F, [fx, fy] = sc.P(0.54, 0.45, 0.55), gl = g.createRadialGradient(fx, fy, 0, fx, fy, 30 * f); gl.addColorStop(0, 'rgba(255,230,140,0.95)'); gl.addColorStop(0.35, 'rgba(255,140,40,0.75)'); gl.addColorStop(1, 'rgba(180,40,0,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(fx, fy, 30 * f, 15 * f, 0, 0, TAU); g.fill(); }, { tag: 'żar', shadow: false, nest: true });
  B.anvil(-0.35, 0.55); B.barrel(-0.75, 0.82); B.barrel(0.72, 1.25, 0, 0.85); B.logs(0.3, 1.32); B.bucket(-0.1, 0.9);
  return B.flush();
};

/* ZBROJOWNIA 3×2: długi warsztat z desek pod darnią ze smoczymi łbami, rzędy tarcz na ścianie, stojaki z włóczniami i tarczami, kowadło */
BAKED.vikings_armory = function () {
  const sc = sceneFor(3, 2, 2.9), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 66, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -1.35, x1: 0.6, y0: -0.9, y1: -0.05, h1: 0.88, low: ['plank', VK.wall], S: { door: vkDoor(0.45, 0.42, 0.56), win: vkWin({ n: 1 }) }, E: { win: vkWin() }, roof: { rise: 0.62, ov: 0.14, ovE: 0.16 }, dragons: true, smoke: 0.7, smokeW: 0.4, chim: null,
    deco1: (S, E, rS, rE) => { vkShields(sc, S, { v: 0.22, n: 8, a: 0.15, b: 1.9, r: 0.065, avoid: avoidOf(rS, 0.1) }); vkShields(sc, E, { v: 0.22, n: 2, a: 0.2, b: 0.7, r: 0.065, avoid: avoidOf(rE, 0.1) }); } });
  B.weaponRack(-1.25, 0.55, -0.8, 0.55, 'spears'); B.shieldRack(0.4, 0.3, 1.0, 0.3, ['#b8352b', '#2f5aa8', '#e8d8a0']); B.anvil(1.2, 0.7); B.barrel(-0.3, 0.7); B.crate(0.1, 0.8, 0.22, 0.2);
  return B.flush();
};

/* OKRĘT: smoczy okręt przy brzegu — kadłub klepkowy, tarcze na burtach, żagiel w pasy, głowa smoka na dziobie */
BAKED.vikings_ship = function () {
  const sc = sceneFor(4, 2, 3.4), B = new Build(sc);
  sc.decal('water', null, waterBlob(0, 0, 1.95, 0.9, 7), { feather: 22 });
  B.part(-1.95, -0.7, 0, 1.95, 0.7, 2.0, () => drawLongship(sc, 0, 0, 1.95), { tag: 'okręt', shadow: false });
  return B.flush({ shadow: false, finish: { grain: 0.5 } });
};
