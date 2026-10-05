/* ====================== FRANKOWIE: kamień, ryglówka, dachówka, łupek ======================
   Zasady: okna układa facade() (równe odstępy, max 2–3 na ścianę), kolejność rysowania ustala Build, rekwizyty mieszczą się w obrysie. */
const FR = { stone: '#b8b2a2', stoneD: '#9d9a90', plaster: '#eadfc2', plasterD: '#e2d6b8', timber: '#3b2616', tiles: '#b5532e', tilesD: '#9a4a2a', shingle: '#6a5240', slate: '#5e6a78', door: '#5a3e22', doorF: '#241a10', shutR: '#7a2f22', shutG: '#2f6a50', blue: '#2f5aa8', gold: '#e0c060', sill: '#8d897d' };

/* DOM 2×2 (Chata): parter z kamienia, piętro z ryglówki z nawisem, dach dachówkowy szczytem do ulicy; przed domem schody */
BAKED.franks_hut = function () {
  const sc = sceneFor(2, 2, 3.2), B = new Build(sc), x0 = -0.8, x1 = 0.8, y0 = -0.84, y1 = 0.5, zp = 0.1, z1 = 0.95, z2 = 1.72, J = 0.1, rise = 0.82;
  sc.patch(0, 0.1, 1.3, 1.2, { seed: 8, alpha: 0.7 });
  B.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, 'stone', { ao: 0.4 });
  B.box(x0, y0, zp, x1, y1, z1, 'stone', { ao: 0.3, eave: 0.55 }, (S, E) => {
    facade(sc, S, { door: { at: 0.5, w: 0.38, h: 0.54, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 2, w: 0.15, h: 0.25, v: 0.2, frame: FR.timber, sill: FR.sill } });
    facade(sc, E, { marg: 0.2, win: { n: 2, w: 0.16, h: 0.26, v: 0.2, frame: FR.timber, sill: FR.sill, glow: i => i === 1 } });
  });
  B.stairs(-0.4, 0.4, y1 + 0.02, 3, 0.17, 'stone', 0.13);
  B.box(x0 - J, y0 - J, z1, x1 + J, y1 + J, z2, 'plaster', { ao: 0.15, eave: 0.3, pal: FR.plaster }, (S, E) => {
    halfTimber(sc, S.O, S.U, S.V, { nu: 2 });
    facade(sc, S, { marg: 0, win: { n: 2, w: 0.2, h: 0.34, v: 0.2, shut: FR.shutR, frame: FR.timber, each: (w, i) => { if (i === 0) flowerBox(sc, S.O, S.U, S.V, w.u0, w.v0 + w.h + 0.02, w.w); } } });
    halfTimber(sc, E.O, E.U, E.V, { nu: 2 });
    facade(sc, E, { marg: 0, win: { n: 2, w: 0.2, h: 0.34, v: 0.2, frame: FR.timber } });
    sc.local(S.O, S.U, S.V, g => { for (const u of [0.08, 0.5, 0.92, 1.34, 1.76]) { g.fillStyle = FR.timber; g.beginPath(); g.moveTo(u - 0.03, 0.8); g.lineTo(u + 0.03, 0.8); g.lineTo(u, 0.88); g.closePath(); g.fill(); } });   // konsole nawisu
    signBoard(sc, x0 - J + 0.04, y1 + J + 0.01, z1 + 0.4, 'loaf');
  });
  const roof = { x0: x0 - J, x1: x1 + J, y0: y0 - J, y1: y1 + J, z: z2, rise, ov: 0.1, ovE: 0.1, mat: 'tiles', pal: FR.tiles, gableMat: 'plaster', gablePal: FR.plaster, ridge: 'y' };
  B.gable(roof, () => {
    const G = { O: [x0 - J, y1 + J, z2 + rise], U: [x1 - x0 + 2 * J, 0, 0], V: [0, 0, -rise] };
    sc.local(G.O, G.U, G.V, (g, lu, lv) => { g.save(); g.beginPath(); g.moveTo(lu / 2, 0); g.lineTo(lu, lv); g.lineTo(0, lv); g.closePath(); g.clip(); g.fillStyle = FR.timber; g.fillRect(lu / 2 - 0.016, 0, 0.032, lv); g.fillRect(0, lv * 0.7, lu, 0.03); g.restore(); });
    windowAt(sc, G.O, G.U, G.V, Math.hypot(...G.U) / 2 - 0.09, 0.3, 0.18, 0.24, { frame: FR.timber, shutters: FR.shutR });
  });
  B.chim(roof, 0.38, -0.35, 0.8, 0.28);
  B.barrel(0.68, 0.82); B.crate(-0.7, 0.84, 0.2, 0.2);
  return B.flush();
};

/* KOŚCIÓŁ 4×2 (Świątynia): nawa z trzema witrażami i przyporami, wieża z dzwonnicą i smukłą iglicą */
BAKED.franks_temple = function () {
  const sc = sceneFor(4, 2, 5.6), B = new Build(sc), zp = 0.1, zw = 1.5, nx0 = -1.9, nx1 = 0.9, ny0 = -0.58, ny1 = 0.58, tx0 = 0.9, tx1 = 1.94, ty0 = -0.52, ty1 = 0.52, zt = 2.7, zb = 3.4;
  const glass = ['#3c62a8', '#4a7ac0', '#d8a830', '#2f5a98'], trim = '#8d897d';
  sc.patch(0, 0.1, 2.3, 1.2, { seed: 61, alpha: 0.6 });
  B.box(nx0 - 0.03, ny0 - 0.03, 0, nx1, ny1 + 0.03, zp, 'stone', { ao: 0.4 });
  B.box(nx0, ny0, zp, nx1, ny1, zw, 'stone', { ao: 0.3, pal: FR.stone, eave: 0.4 }, (S) => { facade(sc, S, { marg: 0, win: { n: 3, kind: 'glass', w: 0.22, h: 0.78, v: 0.32, frame: trim, glass } }); });
  const bw = (nx1 - nx0) / 3;
  for (let i = 0; i <= 3; i++) { const xb = nx0 + i * bw + (i === 0 ? 0.07 : i === 3 ? -0.07 : 0); B.box(xb - 0.07, ny1, zp, xb + 0.07, ny1 + 0.15, zw - 0.2, 'stone', { ao: 0.25, pal: '#b0aa9a' }); B.box(xb - 0.05, ny1, zw - 0.2, xb + 0.05, ny1 + 0.09, zw - 0.06, 'stone', { ao: 0.1, pal: '#b0aa9a' }); }
  B.gable({ x0: nx0, x1: nx1, y0: ny0, y1: ny1, z: zw, rise: 0.8, ov: 0.13, ovE: 0.07, mat: 'slate', pal: FR.slate, gableMat: 'stone', gablePal: '#b0aa9a', ridge: 'x', nest: true });
  B.box(tx0, ty0 - 0.03, 0, tx1 + 0.03, ty1 + 0.03, 0.2, 'stone', { ao: 0.4, pal: '#a8a292' });
  B.box(tx0, ty0, 0.2, tx1, ty1, zt, 'stone', { ao: 0.3, pal: '#aea898', eave: 0.2 }, (S, E) => {
    facade(sc, E, { door: { at: 0.5, w: 0.4, h: 0.82, arch: true, frame: trim, pal: '#4a3420' }, win: { n: 1, over: true, kind: 'glass', w: 0.2, h: 0.5, v: 0.75, frame: trim, glass } });
    facade(sc, S, { win: { n: 1, kind: 'glass', w: 0.2, h: 0.5, v: 0.75, frame: trim, glass } });
    for (const W of [S, E]) sc.local(W.O, W.U, W.V, (g, lu, lv) => { g.fillStyle = 'rgba(70,64,54,0.5)'; g.fillRect(0, lv * 0.46, lu, 0.035); g.fillStyle = 'rgba(250,244,226,0.12)'; g.fillRect(0, lv * 0.46 - 0.012, lu, 0.012); });
  });
  B.box(tx0 + 0.07, ty0 + 0.07, zt, tx1 - 0.07, ty1 - 0.07, zb, 'stone', { ao: 0.2, pal: '#b6b0a0' }, (S, E) => {
    for (const W of [S, E]) facade(sc, W, { win: { n: 1, kind: 'arch', w: 0.26, h: 0.5, v: 0.14, frame: trim, lit: '#17120d', lit2: '#0c0906', louver: true } });
  });
  B.pyramid({ x0: tx0 + 0.04, x1: tx1 - 0.04, y0: ty0 + 0.04, y1: ty1 - 0.04, z: zb, rise: 1.5, mat: 'slate', pal: '#586470', ov: 0.05 });
  B.part((tx0 + tx1) / 2 - 0.04, -0.04, zb + 1.5, (tx0 + tx1) / 2 + 0.04, 0.04, zb + 1.95, () => { const g = sc.g, [cx, cy] = sc.P((tx0 + tx1) / 2, 0, zb + 1.5), f = sc.F; g.strokeStyle = '#d8b44a'; g.lineWidth = 2.6 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 22 * f); g.moveTo(cx - 6 * f, cy - 15 * f); g.lineTo(cx + 6 * f, cy - 15 * f); g.stroke(); }, { tag: 'krzyż', shadow: false, nest: true });
  return B.flush();
};

/* CHATA DRWALA 2×2: lekka ryglówka pod gontem, stos kłód, pień do rąbania i deski */
BAKED.franks_woodcutter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 11, alpha: 0.7 });
  cottage(B, { x0: -0.7, x1: 0.7, y0: -0.85, y1: 0.1, h1: 0.7, ridge: 'x', low: ['plaster', FR.plasterD, FR.timber], nuS: 3, nuE: 2,
    S: { door: { at: 0.3, w: 0.3, h: 0.5, lintel: FR.timber }, win: { n: 1, w: 0.18, h: 0.24, v: 0.16, frame: FR.timber, shut: FR.shutG } },
    E: { win: { n: 1, w: 0.18, h: 0.24, v: 0.16, frame: FR.timber } },
    roof: { mat: 'shingle', pal: FR.shingle, rise: 0.55, ov: 0.1, ovE: 0.08, gableMat: 'plaster', gablePal: FR.plasterD }, chim: [-0.4, -0.375, 0.45, 0.24] });
  B.logs(-0.58, 0.42); B.logs(-0.58, 0.64); B.stump(0.36, 0.5); B.planks(0.4, 0.78, 0.84, 0.92, 0.24);
  return B.flush();
};

/* LEŚNICZÓWKA 2×2: chatka i ogrodzona grządka z sadzonkami */
BAKED.franks_forester = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 12, alpha: 0.6 });
  sc.decal('dirt', '#3e2c18', [[[-0.86, 0.3], [0.86, 0.3], [0.86, 0.96], [-0.86, 0.96]]], { feather: 5, alpha: 0.92 });
  cottage(B, { x0: -0.85, x1: 0.35, y0: -0.85, y1: -0.08, h1: 0.7, ridge: 'x', low: ['plaster', FR.plasterD, FR.timber], nuS: 2, nuE: 2,
    S: { door: { at: 0.3, w: 0.3, h: 0.5, lintel: FR.timber }, win: { n: 1, w: 0.17, h: 0.24, v: 0.16, frame: FR.timber, shut: FR.shutG } },
    E: { win: { n: 1, w: 0.18, h: 0.24, v: 0.16, frame: FR.timber } },
    roof: { mat: 'shingle', pal: FR.shingle, rise: 0.5, ov: 0.1, ovE: 0.08, gableMat: 'plaster', gablePal: FR.plasterD }, chim: [-0.6, -0.465, 0.42, 0.22] });
  B.fenceRect(-0.9, 0.3, 0.9, 0.98, { kind: 'rail', gap: { S: [-0.2, 0.2] } });
  for (const y of [0.5, 0.8]) for (const x of [-0.6, -0.2, 0.2, 0.6]) B.sapling(x, y);
  B.bucket(0.55, 0.12); B.logs(0.62, -0.1);
  return B.flush();
};

/* CHATA MYŚLIWEGO 2×2: ciemny gont, poroże nad drzwiami, suszarka ze skórami */
BAKED.franks_hunter = function () {
  const sc = sceneFor(2, 2, 2.4), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 13, alpha: 0.7 });
  cottage(B, { x0: -0.9, x1: 0.4, y0: -0.85, y1: 0.05, h1: 0.7, ridge: 'x', low: ['stone', FR.stoneD], plinth: false,
    S: { door: { at: 0.4, w: 0.3, h: 0.5, lintel: FR.timber }, win: { n: 1, w: 0.17, h: 0.22, v: 0.16, frame: FR.timber } },
    E: { win: { n: 1, w: 0.18, h: 0.24, v: 0.16, frame: FR.timber } },
    deco1: (S) => sc.local(S.O, S.U, S.V, (g) => { const cx = 0.52; g.fillStyle = '#d8cfb8'; g.strokeStyle = '#2a2018'; g.lineWidth = 0.012; g.beginPath(); g.ellipse(cx, 0.115, 0.045, 0.035, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#d8cfb8'; g.lineWidth = 0.02; g.lineCap = 'round'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.03, 0.1); g.quadraticCurveTo(cx + s * 0.12, 0.02, cx + s * 0.13, -0.0); g.moveTo(cx + s * 0.08, 0.06); g.lineTo(cx + s * 0.13, 0.07); g.stroke(); } }),
    roof: { mat: 'shingle', pal: '#4a3a30', rise: 0.5, ov: 0.1, ovE: 0.08, gableMat: 'stone', gablePal: FR.stoneD }, chim: [-0.6, -0.4, 0.4, 0.22] });
  B.rack(0.78, -0.55, 0.78, 0.3, 'pelts', 0.78); B.barrel(-0.7, 0.4); B.stump(-0.3, 0.55);
  return B.flush();
};

/* TARTAK 3×2: otwarta wiata z piłą ramową, belką na kobyłkach, stosami kłód i desek */
BAKED.franks_sawmill = function () {
  const sc = sceneFor(3, 2, 2.4), B = new Build(sc), zr = 1.0;
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 14, alpha: 0.7, pal: '#6a5a3c' });
  B.box(-1.3, -0.75, 0, 0.55, 0.45, 0.08, 'plank', { pal: '#8a6a40', ao: 0.3, shadow: false });
  B.box(-1.3, -0.75, 0.08, 0.45, -0.67, zr, 'plank', { pal: '#7a5a36', ao: 0.3 });
  B.box(-1.3, -0.67, 0.08, -1.22, 0.35, zr, 'plank', { pal: '#7a5a36', ao: 0.3 });
  for (const [px, py] of [[-1.3, 0.35], [-0.4, 0.35], [0.45, 0.35], [0.45, -0.75]]) B.box(px, py, 0.08, px + 0.1, py + 0.1, zr - 0.08, 'bark', { pal: '#6a4a2c', ao: 0.2 });
  B.box(-1.3, 0.35, zr - 0.08, 0.55, 0.45, zr, 'log', { pal: '#6a4a2c', ao: 0.2 });
  B.gable({ x0: -1.3, x1: 0.55, y0: -0.75, y1: 0.45, z: zr, rise: 0.45, ov: 0.12, ovE: 0.1, mat: 'shingle', pal: FR.shingle, gableMat: 'plank', gablePal: '#7a5a36', ridge: 'x' });
  for (const x of [-1.0, -0.15]) B.box(x, -0.08, 0.08, x + 0.1, 0.1, 0.3, 'log', { pal: '#6a4a2c', ao: 0.2 });
  B.box(-1.15, -0.06, 0.3, 0.0, 0.08, 0.42, 'log', { pal: '#8a6a40', ao: 0.2 });
  B.part(-0.72, -0.12, 0.3, -0.5, 0.14, 0.95, () => { sc.local([-0.72, 0.14, 0.95], [0.22, 0, 0], [0, 0, -0.65], (g) => { g.strokeStyle = '#5a3e22'; g.lineWidth = 0.035; g.strokeRect(0.01, 0.01, 0.2, 0.63); g.strokeStyle = 'rgba(190,196,204,0.9)'; g.lineWidth = 0.012; for (const u of [0.07, 0.11, 0.15]) { g.beginPath(); g.moveTo(u, 0.05); g.lineTo(u, 0.6); g.stroke(); } }); }, { tag: 'piła', shadow: false });
  B.logs(-1.1, 0.7); B.logs(-0.75, 0.72); B.planks(0.7, -0.3, 1.2, 0.0, 0.34); B.planks(0.72, 0.15, 1.15, 0.4, 0.26, '#d0b07a');
  return B.flush();
};

/* SKŁAD 3×2: kamienny parter, ryglowe piętro, szeroka brama, wciągarka i worki */
BAKED.franks_store = function () {
  const sc = sceneFor(3, 2, 3.0), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 15, alpha: 0.7 });
  const h = cottage(B, { x0: -1.3, x1: 1.3, y0: -0.8, y1: 0.35, h1: 0.8, floors: 2, h2: 0.7, J: 0.08, ridge: 'x', low: ['stone', FR.stone], up: ['plaster', FR.plaster, FR.timber], nuS2: 4, nuE2: 2,
    S: { door: { at: 0.5, w: 0.56, h: 0.44, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 2, w: 0.14, h: 0.22, v: 0.14, frame: FR.timber, sill: FR.sill } },
    E: { win: { n: 1, w: 0.16, h: 0.24, v: 0.16, frame: FR.timber, sill: FR.sill } },
    S2: { marg: 0.1, win: { n: 3, w: 0.17, h: 0.3, v: 0.18, shut: FR.shutR, frame: FR.timber } }, E2: { win: { n: 1, w: 0.17, h: 0.3, v: 0.18, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.7, ov: 0.1, ovE: 0.1, gableMat: 'plaster', gablePal: FR.plaster }, chim: [0.8, -0.45, 0.5, 0.26] });
  B.stairs(-0.3, 0.3, 0.37, 2, 0.12, 'stone', 0.14);
  B.sack(-0.75, 0.62, '#d8c898'); B.sack(-0.55, 0.7, '#cdbb88'); B.sack(-0.7, 0.8, '#d8c898', 0.9); B.crate(0.75, 0.65, 0.22, 0.22); B.crate(0.98, 0.7, 0.2, 0.3); B.barrel(0.55, 0.85);
  return B.flush();
};

/* MLECZARNIA 2×3: kamienno-ryglowy dom z szerokim dachem, bańki, stół z serami, wiadro i stóg */
BAKED.franks_dairy = function () {
  const sc = sceneFor(2, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.7, { seed: 16, alpha: 0.7 });
  cottage(B, { x0: -0.8, x1: 0.8, y0: -1.4, y1: -0.2, h1: 0.8, ridge: 'y', low: ['plaster', FR.plasterD, FR.timber], plinth: ['stone', FR.stoneD], nuS: 3, nuE: 3,
    S: { door: { at: 0.5, w: 0.34, h: 0.56, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 2, w: 0.15, h: 0.24, v: 0.18, frame: FR.timber, shut: FR.shutG } },
    E: { win: { n: 2, w: 0.16, h: 0.26, v: 0.18, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.75, ov: 0.1, ovE: 0.1, gableMat: 'plaster', gablePal: FR.plasterD, gwin: { w: 0.16, h: 0.2, frame: FR.timber } }, chim: [0.4, -0.8, 0.5, 0.26] });
  B.churn(-0.6, 0.35); B.churn(-0.4, 0.42); B.churn(-0.62, 0.58);
  B.box(0.3, 0.4, 0, 0.8, 0.62, 0.32, 'plank', { pal: '#8a6a40', ao: 0.3, tag: 'stół' });
  B.disc(0.42, 0.5, 0.32, 0.07, 0.05, [236, 206, 120]); B.disc(0.62, 0.5, 0.32, 0.07, 0.05, [230, 196, 104]); B.disc(0.52, 0.5, 0.37, 0.07, 0.05, [240, 212, 130]);
  B.bucket(-0.05, 0.85); B.hay(-0.55, 1.1); B.fence(0.1, 1.3, 0.9, 1.3, { kind: 'rail' });
  return B.flush();
};

/* SAD 3×3: ogrodzony sad — sześć jabłoni w dwóch rzędach, skrzynki z jabłkami, brama od frontu */
BAKED.franks_orchard = function () {
  const sc = sceneFor(3, 3, 2.4), B = new Build(sc);
  sc.decal('grass', 'tundra', [[[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]], { feather: 12, alpha: 0.55 });
  B.fenceRect(-1.38, -1.3, 1.38, 1.3, { kind: 'rail', gap: { S: [-0.3, 0.3] } });
  [[-0.85, -0.65], [0.0, -0.72], [0.85, -0.65], [-0.8, 0.22], [0.05, 0.15], [0.85, 0.2]].forEach(([x, y], i) => B.tree('apple', 11 + i, x, y, 0.78));
  B.crate(-1.0, 0.95, 0.24, 0.2); B.crate(-0.7, 1.0, 0.24, 0.2); B.heap(-1.0, 0.95, 0.13, 0.1, ['#e05a48', '#b02a22', '#6a1812'], 0.2); B.heap(-0.7, 1.0, 0.13, 0.1, ['#e05a48', '#b02a22', '#6a1812'], 0.2);
  B.part(0.8, 0.9, 0, 1.05, 1.1, 0.16, () => { const g = sc.g, f = sc.F; for (const [x, y] of [[0.88, 0.95], [1.0, 1.0]]) { const [px, py] = sc.P(x, y, 0); g.fillStyle = '#9a6e34'; g.strokeStyle = 'rgba(30,18,6,0.8)'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py - 4 * f, 8 * f, 5 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c4302a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(px - 4 * f + i * 2.8 * f, py - 7 * f, 2.2 * f, 0, TAU); g.fill(); } } }, { tag: 'kosze', shadow: false });
  return B.flush();
};

/* CHATA NOSIWODY 2×2: kamienna studnia z daszkiem i korbą, obok szopka z beczkami i wiadrami */
BAKED.franks_watercarrier = function () {
  const sc = sceneFor(2, 2, 2.2), B = new Build(sc), wx = -0.38, wy = 0.15;
  sc.patch(0, 0.1, 1.2, 1.2, { seed: 17, alpha: 0.7 });
  B.cyl(wx, wy, 0, 0.42, 0.3, { mat: 'stone', pal: FR.stoneD, topMat: 'stone', ao: 0.4 });
  B.part(wx - 0.3, wy - 0.3, 0.42, wx + 0.3, wy + 0.3, 0.46, () => { const g = sc.g, [px, py] = sc.P(wx, wy, 0.42), rx = 0.24 * AX * sc.F * 1.4142; const gr = g.createRadialGradient(px - rx * 0.3, py - rx * 0.1, 1, px, py, rx); gr.addColorStop(0, '#5aa0c0'); gr.addColorStop(1, '#123a54'); g.fillStyle = gr; g.strokeStyle = 'rgba(10,8,6,0.7)'; g.lineWidth = sc.F; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, TAU); g.fill(); g.stroke(); }, { tag: 'woda', shadow: false, nest: true });
  for (const px of [wx - 0.42, wx + 0.42]) B.box(px - 0.04, wy - 0.04, 0, px + 0.04, wy + 0.04, 0.95, 'bark', { pal: '#6a4a2c', ao: 0.2 });
  B.box(wx - 0.5, wy - 0.04, 0.95, wx + 0.5, wy + 0.04, 1.03, 'log', { pal: '#6a4a2c', ao: 0.2 });
  B.gable({ x0: wx - 0.55, x1: wx + 0.55, y0: wy - 0.24, y1: wy + 0.24, z: 1.03, rise: 0.3, ov: 0.08, ovE: 0.06, mat: 'shingle', pal: FR.shingle, gableMat: 'plank', gablePal: '#7a5a36', ridge: 'x' });
  B.part(wx - 0.05, wy - 0.05, 0.4, wx + 0.05, wy + 0.05, 1.0, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(wx, wy, 0.95), [, pb] = sc.P(wx, wy, 0.58); g.strokeStyle = '#d8c090'; g.lineWidth = 1.3 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, pb); g.stroke(); sc.cyl(wx, wy, 0.46, 0.58, 0.06, { mat: 'plank', pal: '#8a6a3c', topMat: 'plank', ao: 0.1 }); }, { tag: 'wiadro', shadow: false, nest: true });
  cottage(B, { x0: 0.3, x1: 0.92, y0: -0.9, y1: -0.2, h1: 0.62, ridge: 'y', plinth: false, low: ['plank', '#8a6a40'],
    S: { door: { at: 0.5, w: 0.3, h: 0.46, lintel: FR.timber } }, E: { win: { n: 1, w: 0.16, h: 0.2, v: 0.14, frame: FR.timber } },
    roof: { mat: 'shingle', pal: FR.shingle, rise: 0.4, ov: 0.08, ovE: 0.08, gableMat: 'plank', gablePal: '#7a5a36' } });
  B.barrel(0.45, 0.1, 0, 1.1); B.barrel(0.7, 0.2, 0, 1.1); B.barrel(0.62, 0.45, 0, 1.1); B.bucket(0.2, 0.2); B.bucket(0.2, 0.42);
  return B.flush();
};

/* TARG 3×3: bruk, trzy stragany z pasiastymi płachtami i krzyż targowy pośrodku */
BAKED.franks_market = function () {
  const sc = sceneFor(3, 3, 2.2), B = new Build(sc), pals = ['#2f5aa8|#f1e6c8', '#b8352b|#f1e6c8', '#2f7a58|#f1e6c8'];
  sc.paved(-1.4, -1.4, 1.4, 1.4, { mat: 'cobble', jit: 0.1, seed: 7, feather: 4 });
  [-0.95, 0, 0.95].forEach((cx, i) => B.stall(cx, -1.3, { pal: pals[i], kind: ['fruit', 'cloth', 'bread'][i] }));
  B.box(-0.42, -0.1, 0, 0.42, 0.62, 0.1, 'stone', { pal: FR.stone, ao: 0.3 }); B.box(-0.3, 0.02, 0.1, 0.3, 0.5, 0.2, 'stone', { pal: FR.stoneD, ao: 0.25 });
  B.box(-0.07, 0.19, 0.2, 0.07, 0.33, 1.0, 'stone', { pal: FR.stone, ao: 0.2 }); B.box(-0.22, 0.2, 0.74, 0.22, 0.32, 0.84, 'stone', { pal: FR.stone, ao: 0.1, nest: true });
  B.crate(-1.1, 0.85, 0.24, 0.24); B.crate(-0.82, 0.95, 0.22, 0.2); B.sack(0.95, 0.9, '#d8c898'); B.sack(1.12, 0.78, '#cdbb88'); B.barrel(1.15, 0.2);
  return B.flush();
};

/* DWÓR / ZAMEK 4×4: mur kurtynowy z dziedzińcem, cztery baszty, brama z kratą, donżon, stajnia, studnia */
BAKED.franks_keep = function () {
  const sc = sceneFor(4, 4, 4.2), B = new Build(sc), w = 1.7, t = 0.4, zp = 0, zc = 1.05, zd = 2.2, banner = '#2f5aa8';
  sc.paved(-1.3, -1.3, 1.3, 1.3, { mat: 'cobble', jit: 0.1, seed: 4, feather: 4 });
  sc.patch(0, 0.1, 2.5, 2.3, { seed: 51, alpha: 0.55, feather: 20 });
  B.part(-w + t, -w + t, zp, w - t, w - t, zp + 0.002, () => sc.face([-w + t, -w + t, zp], [2 * w - 2 * t, 0, 0], [0, 2 * w - 2 * t, 0], 'cobble', { shade: 1, wear: 0.4, edge: 0 }), { tag: 'dziedziniec', kind: 'flat', shadow: false });
  const tower = (cx, cy, hgt = 1.95) => {
    B.cyl(cx, cy, zp, hgt, 0.34, { mat: 'stone', pal: '#9d9a90', topMat: 'stone', ao: 0.45, nest: true });
    B.cyl(cx, cy, hgt - 0.04, hgt + 0.06, 0.4, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0, top: false, nest: true });
    B.cone(cx, cy, hgt + 0.06, 0.4, 0.9, [168, 62, 40], { nest: true });
    B.part(cx - 0.02, cy - 0.02, hgt + 0.9, cx + 0.02, cy + 0.02, hgt + 1.3, () => pennant(sc, cx, cy, hgt + 0.96, 40, '#b8352b'), { tag: 'proporzec', shadow: false, nest: true });
  };
  const merlons = (x0, y0, x1, y1, z, n) => B.part(Math.min(x0, x1) - 0.05, Math.min(y0, y1) - 0.05, z, Math.max(x0, x1) + 0.05, Math.max(y0, y1) + 0.05, z + 0.13, () => merlonLine(sc, x0, y0, x1, y1, z, n, 0.1, 0.13), { tag: 'blanki', shadow: false });
  // mury tylne (północny i zachodni) + baszty
  B.box(-w, -w, zp, w, -w + t, zc, 'stone', { ao: 0.3 }); B.box(-w, -w + t, zp, -w + t, w - t, zc, 'stone', { ao: 0.3 });
  merlons(-w + 0.4, -w + 0.06, w - 0.4, -w + 0.06, zc, 11); merlons(-w + 0.06, -w + 0.4, -w + 0.06, w - 0.5, zc, 10);
  tower(-w + 0.05, -w + 0.05); tower(w - 0.05, -w + 0.05); tower(-w + 0.05, w - 0.05);
  // donżon
  B.box(-0.8, -0.95, zp, 0.55, 0.45, zd, 'stone', { ao: 0.3, pal: '#aaa497', eave: 0.2 }, (S, E) => {
    facade(sc, S, { door: { at: 0.5, w: 0.3, h: 0.5, arch: true, frame: '#8d897d', pal: '#4a3420' }, win: { n: 2, over: true, kind: 'glass', w: 0.2, h: 0.62, v: 0.5, frame: '#8d897d', glass: ['#3c62a8', '#4a7ac0', '#d8a830', '#2f5a98'] } });
    facade(sc, E, { win: { n: 2, kind: 'arch', w: 0.18, h: 0.5, v: 0.55, frame: '#8d897d', lit: '#ffd078', lit2: '#c98a30' } });
  });
  B.box(-0.86, -1.01, zd - 0.06, 0.61, 0.51, zd + 0.03, 'stone', { ao: 0, pal: '#8f8a7e', nest: true });
  merlons(-0.8, -0.95, 0.55, -0.95, zd + 0.03, 8); merlons(-0.8, 0.45, 0.55, 0.45, zd + 0.03, 8); merlons(-0.8, -0.75, -0.8, 0.25, zd + 0.03, 6); merlons(0.55, -0.75, 0.55, 0.25, zd + 0.03, 6);
  B.box(-0.55, -0.7, zd + 0.03, 0.3, 0.2, zd + 0.2, 'stone', { ao: 0.1, pal: '#a39d90' });
  B.part(0.08, -0.22, zd + 0.2, 0.12, -0.18, zd + 0.62, () => pennant(sc, 0.1, -0.2, zd + 0.2, 70, banner), { tag: 'proporzec', shadow: false });
  // stajnia przy murze, studnia, drobiazgi
  B.box(-1.24, 0.5, zp, -0.95, 1.25, 0.75, 'plank', { ao: 0.3, pal: '#6a4a2c' });
  B.gable({ x0: -1.24, x1: -0.95, y0: 0.5, y1: 1.25, z: 0.75, rise: 0.36, ov: 0.04, ovE: 0.05, mat: 'shingle', pal: '#5a4636', ridge: 'y' });
  B.cyl(0.95, 0.85, zp, 0.34, 0.17, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0.4 });
  B.barrel(0.55, 1.05); B.barrel(0.72, 1.17); B.crate(1.1, 0.4, 0.24, 0.24); B.hay(1.05, -0.55);
  // mury przednie (południowy z bramą, wschodni) + baszta SE
  B.box(-w, w - t, zp, -0.55, w, zc, 'stone', { ao: 0.3, eave: 0.3 }, (S) => { sc.local(S.O, S.U, S.V, g => { g.fillStyle = '#15120d'; for (const u of [0.45, 0.85]) g.fillRect(u, 0.22, 0.035, 0.22); }); });
  B.box(0.55, w - t, zp, w, w, zc, 'stone', { ao: 0.3, eave: 0.3 }, (S) => { sc.local(S.O, S.U, S.V, g => { g.fillStyle = '#15120d'; for (const u of [0.3, 0.7]) g.fillRect(u, 0.22, 0.035, 0.22); }); });
  B.box(w - t, -w + t, zp, w, w - t, zc, 'stone', { ao: 0.3, eave: 0.3 }, (S, E) => { sc.local(E.O, E.U, E.V, g => { g.fillStyle = '#15120d'; for (const u of [0.5, 1.2, 1.9, 2.6]) g.fillRect(u, 0.22, 0.035, 0.22); }); });
  const gz = 1.85, gx0 = -0.55, gx1 = 0.55, gy0 = w - 0.5, gy1 = w + 0.1;
  B.box(gx0, gy0, zp, gx1, gy1, gz, 'stone', { ao: 0.25, pal: '#aaa497', eave: 0.3 }, (S) => {
    sc.local(S.O, S.U, S.V, (g) => {
      const u0 = 0.3, ww = 0.5, vb = gz - zp; g.fillStyle = '#17120e'; g.beginPath(); g.moveTo(u0, vb); g.lineTo(u0, vb - 0.62); g.arc(u0 + ww / 2, vb - 0.62, ww / 2, Math.PI, 0); g.lineTo(u0 + ww, vb); g.closePath(); g.fill(); g.strokeStyle = '#8d897d'; g.lineWidth = 0.03; g.stroke();
      g.strokeStyle = 'rgba(60,50,40,0.95)'; g.lineWidth = 0.018; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(u0 + i * ww / 5, vb - 0.62 - 0.2); g.lineTo(u0 + i * ww / 5, vb - 0.05); g.stroke(); } for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(u0, vb - 0.1 - j * 0.14); g.lineTo(u0 + ww, vb - 0.1 - j * 0.14); g.stroke(); }
      for (const u of [0.06, 0.88]) { g.fillStyle = banner; g.fillRect(u, 0.18, 0.16, 0.5); g.fillStyle = '#e0c060'; g.fillRect(u + 0.07, 0.24, 0.025, 0.36); g.fillRect(u + 0.04, 0.32, 0.08, 0.03); }
    });
  });
  merlons(gx0 + 0.05, gy1 - 0.05, gx1 - 0.05, gy1 - 0.05, gz, 7); merlons(gx1 - 0.05, gy0 + 0.05, gx1 - 0.05, gy1 - 0.25, gz, 3);
  B.box(-0.3, w + 0.1, 0, 0.3, 1.99, 0.07, 'plank', { ao: 0.3, pal: '#7a5632' });
  merlons(-w + 0.4, w - 0.06, -0.62, w - 0.06, zc, 5); merlons(0.62, w - 0.06, w - 0.4, w - 0.06, zc, 5); merlons(w - 0.06, -w + 0.4, w - 0.06, w - 0.4, zc, 12);
  tower(w - 0.05, w - 0.05, 2.05);
  return B.flush({ shadow: { alpha: 0.5, blur: 14 } });
};

/* MŁYN 3×3: kamienna wieża z czapą i skrzydłami + dom młynarza, worki, kamień młyński, wóz */
BAKED.franks_mill = function () {
  const sc = sceneFor(3, 3, 3.9), B = new Build(sc), cx = 0.4, cy = -0.5;
  sc.patch(0, 0.1, 1.9, 1.7, { seed: 71, alpha: 0.7 });
  B.cyl(cx, cy, 0, 0.2, 0.9, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0.5, nest: true });
  B.cyl(cx, cy, 0.2, 1.85, 0.78, { mat: 'stone', pal: '#bdb7a6', topMat: 'stone', ao: 0.5, nest: true });
  B.cyl(cx, cy, 1.8, 1.92, 0.86, { mat: 'stone', pal: '#9a948a', ao: 0, nest: true });
  B.cone(cx, cy, 1.92, 0.88, 1.0, [112, 78, 48], { nest: true });
  B.part(cx + 0.3, cy + 0.3, 0, cx + 0.8, cy + 0.8, 1.6, () => {
    const g = sc.g, f = sc.F, [fx, fy] = sc.P(cx + 0.55, cy + 0.55, 0);
    g.fillStyle = '#2b1c10'; g.beginPath(); g.moveTo(fx - 12 * f, fy + 3 * f); g.lineTo(fx - 12 * f, fy - 26 * f); g.arc(fx, fy - 26 * f, 12 * f, Math.PI, 0); g.lineTo(fx + 12 * f, fy + 3 * f); g.closePath(); g.fill();
    g.fillStyle = '#6a4a2c'; g.beginPath(); g.moveTo(fx - 9.5 * f, fy + 2 * f); g.lineTo(fx - 9.5 * f, fy - 25 * f); g.arc(fx, fy - 25 * f, 9.5 * f, Math.PI, 0); g.lineTo(fx + 9.5 * f, fy + 2 * f); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.7)'; g.lineWidth = f; for (const dx of [-3, 3]) { g.beginPath(); g.moveTo(fx + dx * f, fy + 2 * f); g.lineTo(fx + dx * f, fy - 34 * f); g.stroke(); }
    for (const [zz, ww] of [[0.95, 8], [1.4, 7]]) { const [wx, wy] = sc.P(cx + 0.5, cy + 0.5, zz); g.fillStyle = '#17120e'; g.beginPath(); g.moveTo(wx - ww * f, wy + 9 * f); g.lineTo(wx - ww * f, wy - 3 * f); g.arc(wx, wy - 3 * f, ww * f, Math.PI, 0); g.lineTo(wx + ww * f, wy + 9 * f); g.closePath(); g.fill(); g.strokeStyle = '#7a766c'; g.lineWidth = 1.4 * f; g.stroke(); }
  }, { tag: 'drzwi wieży', shadow: false, nest: true });
  B.part(cx + 0.3, cy + 0.3, 1.5, cx + 0.8, cy + 0.8, 1.95, () => {
    const g = sc.g, f = sc.F, [hx, hy] = sc.P(cx + 0.52, cy + 0.52, 1.7), L = 150 * f, a0 = 0.34;
    for (let k = 0; k < 4; k++) {
      g.save(); g.translate(hx, hy); g.rotate(a0 + k * Math.PI / 2);
      g.fillStyle = '#4a3220'; g.strokeStyle = 'rgba(14,8,4,0.8)'; g.lineWidth = f; g.fillRect(0, -2.6 * f, L, 5.2 * f); g.strokeRect(0, -2.6 * f, L, 5.2 * f);
      const ww = 0.24 * L; g.fillStyle = 'rgba(238,230,206,0.94)'; g.fillRect(0.2 * L, 2.6 * f, 0.8 * L, ww); g.strokeStyle = '#4a3220'; g.lineWidth = 1.6 * f; g.strokeRect(0.2 * L, 2.6 * f, 0.8 * L, ww);
      g.lineWidth = 1.1 * f; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0.2 * L + i * 0.1 * L, 2.6 * f); g.lineTo(0.2 * L + i * 0.1 * L, 2.6 * f + ww); g.stroke(); }
      g.restore();
    }
    g.fillStyle = '#3a2814'; g.strokeStyle = 'rgba(10,6,2,0.8)'; g.lineWidth = f; g.beginPath(); g.arc(hx, hy, 8 * f, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c9a85a'; g.beginPath(); g.arc(hx, hy, 3 * f, 0, TAU); g.fill();
  }, { tag: 'skrzydła', shadow: false, nest: true });
  cottage(B, { x0: -1.4, x1: -0.25, y0: 0.25, y1: 1.3, h1: 0.95, ridge: 'y', low: ['plaster', '#e6dbbf', FR.timber], plinth: ['stone', FR.stoneD], nuS: 2, nuE: 2,
    S: { door: { at: 0.3, w: 0.3, h: 0.54, lintel: FR.timber }, win: { n: 1, w: 0.16, h: 0.24, v: 0.2, frame: FR.timber, shut: FR.shutG } }, E: { win: { n: 1, w: 0.16, h: 0.26, v: 0.2, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.62, ov: 0.1, ovE: 0.08, gableMat: 'plaster', gablePal: '#e6dbbf' }, chim: [-0.82, 0.7, 0.55, 0.24] });
  B.sack(-0.08, 0.6, '#d8c898'); B.sack(0.12, 0.7, '#cdbb88'); B.sack(-0.02, 0.85, '#d8c898'); B.sack(0.22, 0.95, '#cdbb88', 0.9);
  B.part(0.6, 0.4, 0, 0.9, 0.7, 0.4, () => { const g = sc.g, f = sc.F, [mx, my] = sc.P(0.75, 0.55, 0); g.fillStyle = '#9d9a90'; g.strokeStyle = 'rgba(14,12,10,0.7)'; g.lineWidth = f; g.beginPath(); g.ellipse(mx, my - 14 * f, 15 * f, 17 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#3a3630'; g.beginPath(); g.ellipse(mx, my - 14 * f, 4.4 * f, 5.4 * f, 0, 0, TAU); g.fill(); }, { tag: 'kamień młyński', shadow: false });
  B.box(0.85, 0.75, 0.14, 1.4, 1.15, 0.2, 'plank', { pal: '#7a5632', ao: 0.4 });
  B.part(0.85, 1.05, 0, 1.4, 1.2, 0.3, () => { const g = sc.g, f = sc.F; for (const [wx, wy] of [[0.95, 1.18], [1.3, 1.18]]) { const [px, py] = sc.P(wx, wy, 0.16); g.fillStyle = '#4a3322'; g.beginPath(); g.ellipse(px, py, 8 * f, 15 * f, 0, 0, TAU); g.fill(); g.fillStyle = '#7a5632'; g.beginPath(); g.ellipse(px, py, 5.6 * f, 12 * f, 0, 0, TAU); g.fill(); g.strokeStyle = '#2b1c10'; g.lineWidth = f; g.stroke(); } }, { tag: 'koła wozu', shadow: false });
  B.sack(1.0, 0.95, '#d8c898', 0.9, 0.2); B.sack(1.26, 0.93, '#cdbb88', 0.9, 0.2);
  return B.flush();
};

/* KAMIENIOŁOM 3×3: skalna ściana, wyrobisko z gruzem, stosy ciosów, drewniany żuraw z kamiennym blokiem */
BAKED.franks_quarry = function () {
  const sc = sceneFor(3, 3, 2.8), B = new Build(sc);
  sc.decal('rubble', null, [[[-1.4, -1.4], [1.4, -1.4], [1.4, 0.95], [-1.4, 0.95]]], { feather: 16, alpha: 0.9 });
  B.rock(401, -0.55, -0.95, 2.1); B.rock(402, 0.6, -1.0, 1.8); B.rock(403, -1.1, -0.3, 1.5, '#7e7c76'); B.rock(404, 1.15, -0.4, 1.4); B.rock(405, 0.05, -0.35, 1.2, '#9a9890');
  B.blocks(0.35, 0.2, 3, 2, 2); B.blocks(-1.15, 0.45, 2, 2, 1, '#bdb8aa'); B.blocks(0.5, 0.85, 2, 1, 1, '#c8c3b4');
  const zx = -0.6, zy = 0.5;
  B.box(zx - 0.06, zy - 0.06, 0, zx + 0.06, zy + 0.06, 1.3, 'bark', { pal: '#6a4a2c', ao: 0.2 });
  B.box(zx - 0.04, zy - 0.04, 1.2, zx + 0.75, zy + 0.04, 1.29, 'log', { pal: '#6a4a2c', ao: 0.2, nest: true });
  B.part(zx - 0.1, zy - 0.06, 0.4, zx + 0.2, zy + 0.06, 1.3, () => { const g = sc.g, f = sc.F, [a, b] = sc.P(zx, zy + 0.06, 1.0), [c, d] = sc.P(zx + 0.38, zy + 0.06, 1.2); g.strokeStyle = '#5a3e22'; g.lineWidth = 3 * f; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }, { tag: 'zastrzał', shadow: false, nest: true });
  B.part(zx + 0.55, zy - 0.12, 0.3, zx + 0.75, zy + 0.12, 1.2, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(zx + 0.65, zy, 1.2), [, pb] = sc.P(zx + 0.65, zy, 0.52); g.strokeStyle = '#d8c090'; g.lineWidth = 1.5 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, pb); g.stroke(); sc.box(zx + 0.55, zy - 0.1, 0.3, zx + 0.75, zy + 0.1, 0.5, 'stone', { pal: '#cfcabb', ao: 0.2 }); }, { tag: 'blok', shadow: true });
  B.crate(1.25, 0.85, 0.2, 0.2); B.barrel(-0.25, 0.95);
  return B.flush();
};

/* FARMA 4×3: dom, stodoła, pole pszenicy w ogrodzeniu, stogi i strach na wróble */
BAKED.franks_farm = function () {
  const sc = sceneFor(4, 3, 2.9, { pRes: RES }), B = new Build(sc), fp = [[-1.9, 0.22], [1.9, 0.22], [1.9, 1.38], [-1.9, 1.38]];
  sc.patch(0, -0.5, 2.0, 1.0, { seed: 41, alpha: 0.6 });
  sc.decal('dirt', '#6a4e2c', [[[-1.95, 0.17], [1.95, 0.17], [1.95, 1.43], [-1.95, 1.43]]], { feather: 6, alpha: 0.9 }); sc.decal('field', 'wheat', [fp], { feather: 0 });
  cottage(B, { x0: -1.9, x1: -0.65, y0: -1.4, y1: -0.4, h1: 0.8, ridge: 'x', low: ['plaster', FR.plasterD, FR.timber], plinth: ['stone', FR.stoneD], nuS: 3, nuE: 2,
    S: { door: { at: 0.3, w: 0.3, h: 0.52, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 1, w: 0.17, h: 0.24, v: 0.2, frame: FR.timber, shut: FR.shutR } }, E: { win: { n: 1, w: 0.17, h: 0.24, v: 0.2, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tiles, rise: 0.55, ov: 0.1, ovE: 0.08, gableMat: 'plaster', gablePal: FR.plasterD }, chim: [-1.5, -0.9, 0.5, 0.26] });
  cottage(B, { x0: -0.35, x1: 1.8, y0: -1.4, y1: -0.3, h1: 0.95, ridge: 'x', low: ['plank', '#8a6a40'], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.5, w: 0.76, h: 0.74, frame: FR.doorF, pal: '#6a4a2c', lintel: FR.timber } }, E: { win: { n: 1, w: 0.18, h: 0.2, v: 0.14, frame: FR.timber } },
    roof: { mat: 'shingle', pal: FR.shingle, rise: 0.7, ov: 0.12, ovE: 0.1, gableMat: 'plank', gablePal: '#7a5a36', gwin: { w: 0.2, h: 0.2, frame: FR.timber } } });
  B.fenceRect(-1.95, 0.17, 1.95, 1.43, { kind: 'rail', h: 0.3, gap: { N: [-1.95, 1.95] } });
  B.hay(1.5, -0.1); B.hay(-0.25, 0.0);
  B.part(0.2, 0.7, 0, 0.4, 0.9, 0.9, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.3, 0.8, 0); g.strokeStyle = '#4a3220'; g.lineWidth = 2.6 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 56 * f); g.moveTo(px - 17 * f, py - 40 * f); g.lineTo(px + 17 * f, py - 40 * f); g.stroke(); g.fillStyle = '#c8b070'; g.beginPath(); g.moveTo(px - 10 * f, py - 40 * f); g.lineTo(px + 10 * f, py - 40 * f); g.lineTo(px + 8 * f, py - 24 * f); g.lineTo(px - 8 * f, py - 24 * f); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,24,8,0.7)'; g.lineWidth = f; g.stroke(); g.fillStyle = '#d8c898'; g.beginPath(); g.arc(px, py - 60 * f, 5.4 * f, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#7a5a30'; g.beginPath(); g.ellipse(px, py - 64 * f, 9 * f, 2.6 * f, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(px - 4.5 * f, py - 64 * f); g.lineTo(px, py - 74 * f); g.lineTo(px + 4.5 * f, py - 64 * f); g.closePath(); g.fill(); }, { tag: 'strach', shadow: false });
  return B.flush();
};

/* PIEKARNIA 2×3: kamienno-ryglowy dom z wielkim kominem, piec chlebowy na zewnątrz, stół z bochenkami */
BAKED.franks_bakery = function () {
  const sc = sceneFor(2, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.1, 1.2, 1.7, { seed: 18, alpha: 0.7 });
  cottage(B, { x0: -0.9, x1: 0.4, y0: -1.35, y1: -0.2, h1: 0.85, ridge: 'x', low: ['plaster', FR.plaster, FR.timber], plinth: ['stone', FR.stoneD], nuS: 3, nuE: 2,
    S: { door: { at: 0.28, w: 0.32, h: 0.54, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 1, w: 0.18, h: 0.26, v: 0.2, frame: FR.timber, shut: FR.shutR, glow: true } }, E: { win: { n: 1, w: 0.18, h: 0.26, v: 0.2, frame: FR.timber } },
    deco1: () => signBoard(sc, 0.36, -0.18, 0.68, 'loaf'),
    roof: { mat: 'tiles', pal: FR.tiles, rise: 0.62, ov: 0.1, ovE: 0.08, gableMat: 'plaster', gablePal: FR.plaster }, chim: [-0.55, -0.775, 0.8, 0.34] });
  B.box(0.46, -0.81, 0, 0.98, -0.29, 0.2, 'stone', { pal: FR.stoneD, ao: 0.3 });
  B.dome(0.72, -0.55, 0.2, 0.26, { cols: ['#f0d8bc', '#d0a47c', '#a07048', '#5a3c24'], finial: false });
  B.part(0.6, -0.4, 0.2, 0.84, -0.26, 0.5, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.72, -0.3, 0.3); const gl = g.createRadialGradient(px, py, 0, px, py, 12 * f); gl.addColorStop(0, 'rgba(255,220,120,0.95)'); gl.addColorStop(0.5, 'rgba(255,120,30,0.8)'); gl.addColorStop(1, 'rgba(120,20,0,0.5)'); g.fillStyle = '#1c120c'; g.beginPath(); g.ellipse(px, py, 10 * f, 8 * f, 0, 0, TAU); g.fill(); g.fillStyle = gl; g.beginPath(); g.ellipse(px, py + 1 * f, 7 * f, 5 * f, 0, 0, TAU); g.fill(); g.strokeStyle = '#6a4a30'; g.lineWidth = 1.6 * f; g.beginPath(); g.ellipse(px, py, 10 * f, 8 * f, 0, 0, TAU); g.stroke(); }, { tag: 'otwór pieca', shadow: false, nest: true });
  B.logs(-0.62, 0.15);
  B.box(0.1, 0.12, 0, 0.7, 0.42, 0.32, 'plank', { pal: '#8a6a40', ao: 0.3, tag: 'stół' });
  B.part(0.14, 0.15, 0.32, 0.66, 0.4, 0.5, () => { const g = sc.g, f = sc.F; [[0.22, 0.24], [0.36, 0.3], [0.5, 0.24], [0.6, 0.32]].forEach(([x, y], i) => { const [px, py] = sc.P(x, y, 0.32); g.fillStyle = i % 2 ? '#c88a3a' : '#b87a2e'; g.strokeStyle = 'rgba(50,26,6,0.8)'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py - 3 * f, 7 * f, 4 * f, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,230,170,0.5)'; g.beginPath(); g.moveTo(px - 3 * f, py - 4 * f); g.lineTo(px + 1 * f, py - 5.2 * f); g.stroke(); }); }, { tag: 'bochenki', shadow: false });
  B.sack(-0.1, 0.5, '#f0e8d0'); B.sack(-0.28, 0.42, '#e8e0c8', 0.9);
  return B.flush();
};

/* KOPALNIA 3×3 (żelaza / węgla): skalne zbocze z wejściem w ramie z bali, tory, wózek z urobkiem i hałdy */
function frankMine(kind) {
  const sc = sceneFor(3, 3, 2.6), B = new Build(sc), iron = kind === 'ore';
  sc.decal('rubble', null, [[[-1.45, -0.9], [1.45, -0.9], [1.45, 1.25], [-1.45, 1.25]]], { feather: 16, alpha: 0.75 });
  B.rock(411, -0.5, -0.95, 2.0, iron ? '#8e8c84' : '#7c7c80'); B.rock(412, 0.7, -0.95, 1.7, iron ? '#8e8c84' : '#7c7c80'); B.rock(413, -1.15, -0.35, 1.4, '#7e7c76'); B.rock(414, 1.15, -0.35, 1.3, '#85837c'); B.rock(415, 0.1, -0.5, 1.5, '#9a9890');
  B.mineMouth(0.05, 0.0, 0.7, 0.78);
  B.rails(0.05, 0.1, 1.2); B.cart(0.05, 0.6, kind);
  B.heap(0.98, 0.55, 0.38, 0.32, kind); B.heap(-0.95, 0.75, 0.3, 0.24, kind);
  B.crate(-0.55, 1.0, 0.22, 0.2); B.barrel(0.55, 1.1); B.logs(-1.1, 0.1);
  return B.flush();
}
BAKED.franks_ironmine = () => frankMine('ore');
BAKED.franks_coalmine = () => frankMine('coal');

/* HUTA 3×3: kamienna hala z paleniskiem (żar w łukowym otworze), wysoki komin, hałdy rudy, węgla i żużlu, sztabki */
BAKED.franks_smelter = function () {
  const sc = sceneFor(3, 3, 3.6), B = new Build(sc);
  sc.patch(0, 0.2, 1.5, 1.4, { seed: 61, alpha: 0.7, pal: '#5a4a34' });
  sc.flat([[[-0.5, 0.1], [0.5, 0.1], [0.5, 1.0], [-0.5, 1.0]]], 'rgba(255,150,60,0.22)', 16);
  const h = cottage(B, { x0: -1.2, x1: 0.9, y0: -1.2, y1: 0.0, h1: 1.0, ridge: 'x', low: ['stone', '#a8a296'], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.5, w: 0.5, h: 0.5, arch: true, frame: '#6a645a', pal: '#1a1008' } }, E: { win: { n: 1, w: 0.18, h: 0.24, v: 0.2, frame: FR.timber, glow: true } },
    deco1: (S) => sc.local(S.O, S.U, S.V, (g, lu, lv) => { const cx = lu / 2, cy = lv - 0.3, gr = g.createRadialGradient(cx, cy, 0, cx, cy, 0.34); gr.addColorStop(0, 'rgba(255,230,130,0.95)'); gr.addColorStop(0.45, 'rgba(255,130,30,0.7)'); gr.addColorStop(1, 'rgba(160,30,0,0)'); g.fillStyle = gr; g.fillRect(cx - 0.34, cy - 0.34, 0.68, 0.68); }),
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.5, ov: 0.1, ovE: 0.08, gableMat: 'stone', gablePal: '#a8a296' }, chim: [-0.7, -0.6, 1.3, 0.46] });
  B.heap(-1.1, 0.5, 0.4, 0.34, 'ore'); B.heap(1.05, 0.45, 0.38, 0.32, 'coal'); B.heap(1.2, -0.6, 0.28, 0.24, 'slag');
  B.part(-0.3, 0.55, 0, 0.3, 0.85, 0.2, () => { const g = sc.g; let i = 0; for (let l = 0; l < 3; l++) for (let k = 0; k < 3 - l; k++) { const x = -0.2 + k * 0.19 + l * 0.095; sc.box(x - 0.09, 0.62, l * 0.07, x + 0.09, 0.72, l * 0.07 + 0.065, 'stone', { pal: '#b0b6bc', ao: 0.1, wear: 0 }); i++; } }, { tag: 'sztabki', shadow: false });
  B.barrel(-0.6, 0.95); B.crate(0.65, 0.85, 0.22, 0.2);
  return B.flush();
};

/* KUŹNIA NARZĘDZI 2×3: kamienny warsztat z dachówką i otwartym zadaszeniem z paleniskiem, kowadłem i narzędziami */
BAKED.franks_toolforge = function () {
  const sc = sceneFor(2, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.2, 1.3, 1.9, { seed: 91, alpha: 0.7, pal: '#6a5a3c' });
  sc.flat([[[0.1, 0.2], [0.9, 0.2], [0.9, 1.0], [0.1, 1.0]]], 'rgba(255,150,60,0.22)', 16);
  cottage(B, { x0: -0.92, x1: 0.92, y0: -1.4, y1: 0.0, h1: 1.0, ridge: 'x', low: ['stone', '#a39d90'], plinth: ['stone', FR.stoneD],
    E: { win: { n: 2, w: 0.18, h: 0.26, v: 0.2, frame: '#3a2818', sill: FR.sill, glow: true } },
    deco1: (S) => sc.local(S.O, S.U, S.V, (g, lu, lv) => { g.fillStyle = 'rgba(16,10,6,0.4)'; g.fillRect(0, 0, lu, lv); g.strokeStyle = '#2a2018'; g.lineWidth = 0.014; for (const [u, v, k] of [[0.3, 0.3, 0], [0.55, 0.34, 1], [0.8, 0.3, 2], [1.1, 0.34, 0], [1.4, 0.3, 1]]) { g.beginPath(); g.moveTo(u, v - 0.1); g.lineTo(u, v + 0.1); g.stroke(); g.fillStyle = '#9aa0a6'; if (k === 0) g.fillRect(u - 0.05, v - 0.12, 0.1, 0.05); else if (k === 1) { g.beginPath(); g.moveTo(u, v - 0.1); g.lineTo(u + 0.06, v - 0.18); g.lineTo(u + 0.08, v - 0.1); g.fill(); } else { g.beginPath(); g.arc(u, v + 0.1, 0.03, 0, TAU); g.stroke(); } } }),
    roof: { mat: 'tiles', pal: '#a24a28', rise: 0.62, ov: 0.1, ovE: 0.08, gableMat: 'stone', gablePal: '#a39d90' }, chim: [0.55, -0.7, 0.9, 0.34] });
  B.lean({ x0: -0.98, x1: 0.98, y0: 0.02, y1: 1.02, z: 1.15, drop: 0.26, mat: 'tiles', pal: '#8f4224' });
  for (const px of [-0.87, -0.3, 0.3, 0.87]) B.box(px - 0.05, 0.96, 0, px + 0.05, 1.06, 0.89, 'bark', { ao: 0.2, pal: '#7a5632' });
  B.box(0.2, 0.2, 0.1, 0.88, 0.7, 0.55, 'stone', { ao: 0.3, pal: '#8f8a7e' });
  B.part(0.3, 0.3, 0.55, 0.8, 0.62, 0.62, () => { const g = sc.g, f = sc.F, [fx, fy] = sc.P(0.54, 0.45, 0.55), gl = g.createRadialGradient(fx, fy, 0, fx, fy, 30 * f); gl.addColorStop(0, 'rgba(255,230,140,0.95)'); gl.addColorStop(0.35, 'rgba(255,140,40,0.75)'); gl.addColorStop(1, 'rgba(180,40,0,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(fx, fy, 30 * f, 15 * f, 0, 0, TAU); g.fill(); }, { tag: 'żar', shadow: false, nest: true });
  B.anvil(-0.35, 0.55); B.barrel(-0.75, 0.82); B.barrel(0.72, 1.25, 0, 0.85); B.logs(0.3, 1.32);
  return B.flush();
};

/* ZBROJOWNIA 3×2: kamienny warsztat z szeroką bramą, sztandary, stojaki na włócznie i tarcze, kowadło i szlifierka */
BAKED.franks_armory = function () {
  const sc = sceneFor(3, 2, 2.6), B = new Build(sc);
  sc.patch(0, 0.1, 1.9, 1.2, { seed: 19, alpha: 0.7 });
  cottage(B, { x0: -1.35, x1: 0.55, y0: -0.85, y1: -0.05, h1: 0.85, ridge: 'x', low: ['stone', FR.stone], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.45, w: 0.5, h: 0.46, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 1, w: 0.16, h: 0.24, v: 0.2, frame: FR.timber, sill: FR.sill } }, E: { win: { n: 1, w: 0.17, h: 0.26, v: 0.2, frame: FR.timber, sill: FR.sill } },
    deco1: (S) => sc.local(S.O, S.U, S.V, (g, lu) => { for (const u of [0.1, lu - 0.3]) { g.fillStyle = FR.timber; g.fillRect(u + 0.07, 0.02, 0.03, 0.06); g.fillStyle = '#2f5aa8'; g.beginPath(); g.moveTo(u, 0.08); g.lineTo(u + 0.18, 0.08); g.lineTo(u + 0.18, 0.4); g.lineTo(u + 0.09, 0.46); g.lineTo(u, 0.4); g.closePath(); g.fill(); g.strokeStyle = 'rgba(10,10,30,0.7)'; g.lineWidth = 0.01; g.stroke(); g.fillStyle = '#e0c060'; g.fillRect(u + 0.08, 0.13, 0.02, 0.22); g.fillRect(u + 0.04, 0.2, 0.1, 0.025); } }),
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.5, ov: 0.1, ovE: 0.08, gableMat: 'stone', gablePal: FR.stone }, chim: [-0.9, -0.45, 0.45, 0.24] });
  B.weaponRack(-1.2, 0.5, -0.75, 0.5, 'spears'); B.shieldRack(0.45, 0.2, 1.05, 0.2); B.anvil(1.25, 0.55); B.barrel(-0.3, 0.75); B.crate(0.2, 0.85, 0.22, 0.2);
  return B.flush();
};

/* WINNICA 3×3: trzy rzędy winorośli na palikach, mała tłocznia z beczkami i koszami gron */
BAKED.franks_vineyard = function () {
  const sc = sceneFor(3, 3, 2.4, { pRes: RES }), B = new Build(sc);
  for (const y of [-0.85, -0.15, 0.55]) sc.decal('dirt', '#5a4028', [[[-1.4, y - 0.22], [1.4, y - 0.22], [1.4, y + 0.22], [-1.4, y + 0.22]]], { feather: 8, alpha: 0.9 });
  for (const y of [-0.85, -0.15, 0.55]) B.vineRow(-1.3, 1.3, y);
  cottage(B, { x0: 0.45, x1: 1.4, y0: 0.9, y1: 1.4, h1: 0.55, ridge: 'x', low: ['stone', FR.stone], plinth: false,
    S: { door: { at: 0.4, w: 0.24, h: 0.38, lintel: FR.timber } }, E: {}, roof: { mat: 'shingle', pal: FR.shingle, rise: 0.38, ov: 0.08, ovE: 0.06, gableMat: 'stone', gablePal: FR.stone } });
  B.barrel(-1.0, 1.1, 0, 1.2); B.barrel(-0.7, 1.2, 0, 1.2);
  B.part(-0.2, 1.0, 0, 0.2, 1.25, 0.18, () => { const g = sc.g, f = sc.F; for (const x of [-0.08, 0.1]) { const [px, py] = sc.P(x, 1.12, 0); g.fillStyle = '#9a6e34'; g.strokeStyle = 'rgba(30,18,6,0.8)'; g.lineWidth = f; g.beginPath(); g.ellipse(px, py - 4 * f, 8 * f, 5 * f, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#5a2a6a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(px - 5 * f + i * 2.6 * f, py - 7 * f, 2.2 * f, 0, TAU); g.fill(); } } }, { tag: 'kosze', shadow: false });
  return B.flush();
};

/* WINIARZ 2×3: kamienna piwnica z wielką bramą, beczki, prasa do winogron i skrzynka gron */
BAKED.franks_winery = function () {
  const sc = sceneFor(2, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.2, 1.2, 1.7, { seed: 20, alpha: 0.7 });
  cottage(B, { x0: -0.9, x1: 0.5, y0: -1.4, y1: -0.3, h1: 0.9, ridge: 'x', low: ['stone', FR.stone], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.3, w: 0.5, h: 0.48, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 1, w: 0.16, h: 0.24, v: 0.2, frame: FR.timber, sill: FR.sill } }, E: { win: { n: 1, w: 0.17, h: 0.26, v: 0.2, frame: FR.timber, sill: FR.sill } },
    roof: { mat: 'tiles', pal: FR.tiles, rise: 0.6, ov: 0.1, ovE: 0.08, gableMat: 'stone', gablePal: FR.stone }, chim: [0.2, -0.85, 0.5, 0.24] });
  B.barrel(-0.62, 0.2, 0, 1.5); B.barrel(-0.32, 0.3, 0, 1.5); B.barrel(-0.68, 0.55, 0, 1.5);
  B.box(0.35, 0.3, 0, 0.85, 0.75, 0.3, 'plank', { pal: '#8a6a40', ao: 0.3, tag: 'prasa' });
  B.part(0.52, 0.45, 0.3, 0.68, 0.6, 0.85, () => { const g = sc.g, f = sc.F, [px, py] = sc.P(0.6, 0.52, 0.3); g.strokeStyle = '#4a3220'; g.lineWidth = 5 * f; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 40 * f); g.stroke(); g.lineWidth = 4 * f; g.beginPath(); g.moveTo(px - 14 * f, py - 38 * f); g.lineTo(px + 14 * f, py - 36 * f); g.stroke(); }, { tag: 'śruba', shadow: false });
  B.box(-0.1, 0.9, 0, 0.3, 1.2, 0.22, 'plank', { pal: '#7a5a36', ao: 0.3 }); B.heap(0.1, 1.05, 0.15, 0.1, ['#8a4a9a', '#5a2a6a', '#2a1034'], 0.22);
  return B.flush();
};

/* KOSZARY 3×3: długa hala (kamień + ryglówka), skrzydło wschodnie, dziedziniec z palisadą, stojakiem, manekinem i sztandarami */
BAKED.franks_barracks = function () {
  const sc = sceneFor(3, 3, 3.3), B = new Build(sc);
  sc.paved(-1.45, -0.3, 0.4, 1.45, { mat: 'cobble', jit: 0.12, seed: 3, feather: 5 });
  sc.patch(0, 0.05, 2.1, 1.9, { seed: 81, alpha: 0.5 });
  const hall = cottage(B, { x0: -1.4, x1: 1.4, y0: -1.4, y1: -0.45, h1: 0.7, floors: 2, h2: 0.7, J: 0.08, ridge: 'x', low: ['stone', FR.stone], up: ['plaster', '#e2d8bc', FR.timber], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.5, w: 0.56, h: 0.34, arch: true, frame: FR.doorF, pal: '#4a3420' }, win: { n: 2, w: 0.15, h: 0.22, v: 0.14, frame: FR.timber, sill: FR.sill } }, E: { win: { n: 1, w: 0.16, h: 0.22, v: 0.14, frame: FR.timber } },
    S2: { win: { n: 3, w: 0.18, h: 0.3, v: 0.18, shut: '#2f4f8a', frame: FR.timber } }, E2: { win: { n: 1, w: 0.18, h: 0.3, v: 0.18, frame: FR.timber } },
    roof: { mat: 'tiles', pal: '#9a4a2a', rise: 0.7, ov: 0.1, ovE: 0.1, gableMat: 'plaster', gablePal: '#e2d8bc' } });
  B.chim(hall.roof, -0.75, -0.92, 0.5, 0.26); B.chim(hall.roof, 0.75, -0.92, 0.5, 0.26);
  cottage(B, { x0: 0.6, x1: 1.4, y0: -0.3, y1: 0.95, h1: 0.95, ridge: 'y', low: ['stone', FR.stone], plinth: ['stone', FR.stoneD],
    S: { door: { at: 0.5, w: 0.3, h: 0.5, arch: true, frame: FR.doorF, pal: FR.door } }, E: { win: { n: 2, w: 0.16, h: 0.26, v: 0.2, frame: FR.timber } },
    roof: { mat: 'tiles', pal: '#9a4a2a', rise: 0.5, ov: 0.08, ovE: 0.02, gableMat: 'stone', gablePal: FR.stone, nest: true } });
  B.palisade(-1.42, -0.3, -1.42, 1.4); B.palisade(-1.42, 1.4, -0.35, 1.4); B.palisade(0.05, 1.4, 0.5, 1.4);
  B.weaponRack(-1.15, 0.1, -0.6, 0.1, 'spears'); B.dummy(-0.2, 0.55); B.banner(-1.3, 1.2, 1.0); B.banner(0.38, 1.2, 1.0); B.barrel(0.25, 0.1); B.crate(-0.95, 0.95, 0.22, 0.22);
  return B.flush();
};
