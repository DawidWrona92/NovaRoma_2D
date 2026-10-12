/* ====================== WĘZŁY LOGISTYCZNE: Osada, Skład górniczy, Skład drzewny (Faza 9D) ======================
   Skład górniczy i drzewny to Skład 3×2 danej nacji z innymi rekwizytami przed bramą (hubProps) — kształt, wejście i obrys ten sam, więc
   na mapie od razu widać, do czego służy. Osada 4×3 to dwa domy nacji (większy hall z drzwiami od południa i mniejszy dom obok), podwórze, płotek i beczki. */

/* rekwizyty Składów wyspecjalizowanych: 'mining' — hałdy rudy i węgla oraz wózek z rudą; 'timber' — stosy kłód i sztaple desek */
function hubProps(B, kind) {
  if (kind === 'mining') { B.heap(-0.95, 0.72, 0.2, 0.2, 'ore'); B.heap(-0.62, 0.8, 0.15, 0.15, 'coal'); B.heap(-1.12, 0.9, 0.12, 0.1, 'ore'); B.cart(0.85, 0.72, 'ore'); B.crate(1.15, 0.62, 0.2, 0.2); }
  else { B.logs(-0.95, 0.68); B.logs(-0.62, 0.72); B.logs(-0.8, 0.88); B.planks(0.62, 0.52, 1.2, 0.82, 0.3); B.planks(0.7, 0.58, 1.14, 0.78, 0.46, '#d0b07a'); }
}
for (const n of ['franks', 'saracens', 'vikings', 'slavs']) {
  BAKED[n + '_minestore'] = () => BAKED[n + '_store']('mining');
  BAKED[n + '_timberstore'] = () => BAKED[n + '_store']('timber');
}

/* OSADA 4×3 (Frankowie): kamienno-ryglowy hall piętrowy i niższy dom, schody do drzwi, płotek i beczki na podwórzu */
BAKED.franks_settlement = function () {
  const sc = sceneFor(4, 3, 3.0), B = new Build(sc);
  sc.patch(0, 0.1, 2.5, 1.9, { seed: 61, alpha: 0.7 });
  cottage(B, { x0: -1.75, x1: 0.15, y0: -1.2, y1: 0.0, h1: 0.8, floors: 2, h2: 0.7, J: 0.08, ridge: 'x', low: ['stone', FR.stone], up: ['plaster', FR.plaster, FR.timber], nuS2: 4, nuE2: 2,
    S: { door: { at: 0.5, w: 0.56, h: 0.44, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 2, w: 0.14, h: 0.22, v: 0.14, frame: FR.timber, sill: FR.sill } },
    E: { win: { n: 1, w: 0.16, h: 0.24, v: 0.16, frame: FR.timber, sill: FR.sill } },
    S2: { marg: 0.1, win: { n: 3, w: 0.17, h: 0.3, v: 0.18, shut: FR.shutR, frame: FR.timber } }, E2: { win: { n: 1, w: 0.17, h: 0.3, v: 0.18, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.7, ov: 0.1, ovE: 0.1, gableMat: 'plaster', gablePal: FR.plaster }, chim: [-0.6, -0.8, 0.5, 0.26] });
  cottage(B, { x0: 0.6, x1: 1.75, y0: -1.05, y1: -0.15, h1: 0.8, ridge: 'y', low: ['plaster', FR.plasterD, FR.timber], plinth: ['stone', FR.stoneD], nuS: 3, nuE: 3,
    S: { door: { at: 0.5, w: 0.32, h: 0.54, arch: true, frame: FR.doorF, pal: FR.door }, win: { n: 1, w: 0.15, h: 0.24, v: 0.18, frame: FR.timber, shut: FR.shutG } },
    E: { win: { n: 1, w: 0.16, h: 0.26, v: 0.18, frame: FR.timber } },
    roof: { mat: 'tiles', pal: FR.tilesD, rise: 0.7, ov: 0.1, ovE: 0.1, gableMat: 'plaster', gablePal: FR.plasterD }, chim: [1.2, -0.6, 0.5, 0.26] });
  B.stairs(-1.1, -0.5, 0.02, 3, 0.14, 'stone', 0.14);
  B.fence(0.2, 1.25, 1.7, 1.25, { kind: 'rail' }); B.fence(1.7, 0.35, 1.7, 1.25, { kind: 'rail' });
  B.barrel(0.9, 0.55); B.barrel(1.15, 0.6, 0, 0.9); B.sack(0.5, 0.6, '#d8c898'); B.crate(-0.2, 0.6, 0.22, 0.22); B.bucket(0.3, 0.85);
  return B.flush();
};

/* OSADA 4×3 (Saraceni): dwa domy z cegły suszonej, taras z małą kopułą, dzbany i worki na podwórzu */
BAKED.saracens_settlement = function () {
  const sc = sceneFor(4, 3, 2.8), B = new Build(sc);
  sc.patch(0, 0.1, 2.5, 1.9, { seed: 62, pal: '#b79a62', alpha: 0.75 });
  flatHouse(B, { x0: -1.75, x1: 0.15, y0: -1.2, y1: 0.0, h: 1.0, S: { door: sarDoor(0.5, 0.6, 0.5), win: { n: 2, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } } });
  B.box(-1.5, -1.0, 1.12, -0.7, -0.4, 1.5, 'sandstone', { ao: 0.25, pal: SR.sandL }, (S) => facade(sc, S, { win: { n: 1, ...arcWin(0.16, 0.2, 0.08, { lit: '#243a42', lit2: '#101e24' }) } }));
  B.dome(-1.1, -0.7, 1.5, 0.3, { cols: SR.domeSand });
  flatHouse(B, { x0: 0.6, x1: 1.75, y0: -1.05, y1: -0.15, h: 0.8, S: { door: sarDoor(0.5, 0.34, 0.45), win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } }, E: { win: { n: 1, ...arcWin(0.16, 0.26, 0.2, { frame: SR.wood }) } } });
  B.stairs(-1.1, -0.5, 0.02, 2, 0.12, 'sandstone', 0.14);
  B.jar(0.7, 0.55); B.jar(0.9, 0.6, 0.9); B.jar(1.15, 0.52); B.sack(0.45, 0.62, '#d8c898'); B.sack(1.4, 0.65); B.barrel(-0.3, 0.6); B.crate(1.5, 0.45, 0.22, 0.22);
  return B.flush();
};

/* OSADA 4×3 (Wikingowie): długi dom z deskowych ścian z tarczami i drugi mniejszy z zrębu, suszarnia ryb i beczki */
BAKED.vikings_settlement = function () {
  const sc = sceneFor(4, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.1, 2.5, 1.9, { seed: 63, pal: VK.bog, alpha: 0.8 });
  vkHouse(B, { x0: -1.75, x1: 0.15, y0: -1.2, y1: 0.0, h1: 0.85, low: ['plank', VK.wall], S: { door: vkDoor(0.5, 0.56, 0.5, { arch: false }), win: vkWin({ n: 2, w: 0.14, h: 0.16 }) }, E: { win: vkWin({ w: 0.14, h: 0.16 }) },
    roof: { rise: 0.72, gwin: { w: 0.18, h: 0.2, frame: VK.dark } }, smoke: 0.3, smokeW: 0.4, deco1: (S, E, rS) => vkShields(sc, S, { v: 0.2, n: 6, a: 0.2, b: 1.7, r: 0.06, avoid: avoidOf(rS, 0.1) }) });
  vkHouse(B, { x0: 0.6, x1: 1.75, y0: -1.05, y1: -0.15, low: ['log', VK.log], S: { door: vkDoor(0.3, 0.3, 0.5), win: vkWin() }, E: { win: vkWin() }, smoke: 0.35, smokeW: 0.4, deco1: (S, E, rS, rE, V) => { logCorners(sc, V); } });
  B.stairs(-1.1, -0.5, 0.02, 2, 0.12, 'rubble', 0.14);
  B.rack(0.35, 0.8, 0.95, 0.8, 'fish', 0.7); B.barrel(1.2, 0.6); B.barrel(1.4, 0.55, 0, 0.9); B.sack(-0.2, 0.62, '#d8c898'); B.crate(0.1, 0.55, 0.22, 0.22);
  return B.flush();
};

/* OSADA 4×3 (Słowianie): dwie izby pod strzechą na podmurówce, ława i beczki na podwórzu */
BAKED.slavs_settlement = function () {
  const sc = sceneFor(4, 3, 2.9), B = new Build(sc);
  sc.patch(0, 0.1, 2.5, 1.9, { seed: 64, alpha: 0.7 });
  slHouse(B, { x0: -1.75, x1: 0.15, y0: -1.2, y1: 0.0, h1: 1.0, S: { door: slDoor(0.5, 0.5, 0.68), win: slWin({ n: 2, w: 0.2, h: 0.26 }) }, E: { win: slWin({ w: 0.2, h: 0.26 }) }, roof: { rise: 0.78 }, smoke: 0.3, smokeW: 0.36 });
  slHouse(B, { x0: 0.6, x1: 1.75, y0: -1.05, y1: -0.15, h1: 0.9, S: { door: slDoor(0.5, 0.34, 0.62), win: slWin({ w: 0.18, h: 0.24 }) }, E: { win: slWin({ w: 0.18, h: 0.24 }) }, roof: { rise: 0.7 }, smoke: 0.5, smokeW: 0.36 });
  B.box(-1.4, 0.18, 0, -0.5, 0.62, 0.07, 'plank', { ao: 0.3, pal: SL.plank });
  B.box(0.3, 0.55, 0.07, 0.95, 0.7, 0.28, 'plank', { ao: 0.2, pal: SL.plank, tag: 'ława' });
  B.barrel(1.15, 0.6); B.barrel(1.35, 0.55, 0, 0.9); B.sack(0.2, 0.9, '#d8c898'); B.logs(1.3, 0.95); B.stump(0.6, 0.95);
  return B.flush();
};
