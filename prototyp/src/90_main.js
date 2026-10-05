/* ====================== SCENA POKAZOWA (v2) ======================
   Układ na siatce pól (każdy budynek = 1 pole, wszystko w skali jednego pola), teren w kaflach wypiekanych na żądanie,
   LOD przy oddaleniu, kamera z zoomem zależnym od ekranu, pinch / przyciski, przełącznik siatki. */
const QS = new URLSearchParams(location.search), DPR0 = Math.min(window.devicePixelRatio || 1, 3);
RES = parseFloat(QS.get('q')) || (DPR0 >= 1.5 && (navigator.deviceMemory || 4) > 2 ? 2 : 1);   // rozdzielczość wypieku: 1 (zwykły ekran / mało RAM) lub 2 (Retina / telefony)
TEXRES = RES >= 2 ? 2 : 1;
const CH = 512;                                                    // rozmiar kafla terenu (px logiczne)
const GX = 640, GY = 120;                                          // początek świata (0,0) na płaszczyźnie wypieku
const bx = (x, y) => (x - y) * AX + GX, by = (x, y, z = 0) => (x + y) * AY - z * VH + GY;

/* ---------- geometria świata ---------- */
function blob(cx, cy, rx, ry, seed, n = 56, rough = 0.18) {
  const r = rng(seed), ph = [r() * TAU, r() * TAU, r() * TAU], pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, k = 1 + rough * (0.55 * Math.sin(2 * a + ph[0]) + 0.3 * Math.sin(3 * a + ph[1]) + 0.22 * Math.sin(5 * a + ph[2]));
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
function growPoly(pts, d) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; return [x + dx / l * d, y + dy / l * d]; });
}
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function catmull(pts, seg = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]); return out;
}
function ribbon(pts, w, seed) {
  const c = catmull(pts), L = [], R = [];
  c.forEach((p, i) => {
    const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const hw = w * (0.86 + 0.24 * (Math.sin(i * 0.55 + seed) * 0.5 + 0.5)) / 2;
    L.push([p[0] - dy * hw, p[1] + dx * hw]); R.push([p[0] + dy * hw, p[1] - dx * hw]);
  });
  return L.concat(R.reverse());
}
function distToPath(x, y, path) {
  let best = 1e9;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx2, by2] = path[i + 1], dx = bx2 - ax, dy = by2 - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
  }
  return best;
}
const tileRect = (i, j, w, h, e = 0.05) => [[i + e, j + e], [i + w - e, j + e], [i + w - e, j + h - e], [i + e, j + h - e]];

/* ---------- plan świata (współrzędne w polach; środek pola (i,j) = (i+0.5, j+0.5)) ---------- */
const LAKE = [blob(12.3, 2.3, 2.2, 1.5, 3, 56, 0.2), blob(10.9, 3.2, 1.1, 0.9, 5, 40, 0.22), blob(13.7, 3.3, 1.1, 0.9, 8, 40, 0.22)];
const SAND = [blob(12.6, 9.6, 3.7, 2.8, 12, 56, 0.2), blob(14.6, 8.2, 1.8, 1.5, 14, 40, 0.2), blob(12.2, 12.0, 2.4, 1.6, 15, 40, 0.2)];
const FLOOR = [blob(2.4, 2.6, 3.0, 2.4, 20), blob(6.6, 0.9, 2.6, 1.2, 22), blob(0.9, 6.0, 1.4, 1.3, 23)];
const FIELDS = [['wheat', tileRect(5, 10, 3, 2)], ['green', tileRect(5, 12, 3, 2)], ['plow', tileRect(1, 11, 3, 2)]];
const ROADS = [
  [[0.5, 7.5], [3.5, 7.5], [6.5, 7.5], [9.5, 7.5], [10.5, 8.5], [11.5, 9.5], [14.5, 9.5]],
  [[8.0, 7.5], [8.0, 5.3]],
  [[11.5, 9.5], [11.5, 12.5]]
];
const ROADW = [0.9, 1.5, 0.9];
const ROADPATHS = ROADS.map(r => catmull(r, 6));
const FOOT = [];                                                    // ślady budynków: [i, j, szer., wys.] w polach (do podglądu siatki)

/* ---------- teren: kafle wypiekane na żądanie ---------- */
const RG = RES, chunks = new Map(), LAKE_CLIP = new Path2D();
for (const poly of LAKE) { poly.forEach(([x, y], i) => LAKE_CLIP[i ? 'lineTo' : 'moveTo'](bx(x, y), by(x, y))); LAKE_CLIP.closePath(); }
function bboxOf(polys) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of polys) for (const [x, y] of p) { const X = bx(x, y), Y = by(x, y); if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } return { x0, y0, x1, y1 }; }
const hitRect = (polys, r, m = 0) => { const b = bboxOf(polys); return b.x1 + m > r.x0 && b.x0 - m < r.x1 && b.y1 + m > r.y0 && b.y0 - m < r.y1; };

function paintGround(g, i, j) {
  const rect = { x0: i * CH, y0: j * CH, x1: (i + 1) * CH, y1: (j + 1) * CH }, P = g.pg;
  g.decal('grass', 'green', null);
  g.decal('grassDetail', null, null, { alpha: 0.34 });
  for (const [kind, poly] of FIELDS) if (hitRect([poly], rect, 40)) { g.decal('dirt', '#6a4e2c', [growPoly(poly, 0.12)], { feather: 6, alpha: 0.9 }); g.decal('field', kind, [poly], { feather: 0 }); }
  if (hitRect(FLOOR, rect, 90)) g.decal('grass', 'tundra', FLOOR, { feather: 46, alpha: 0.55 });                          // ściółka leśna
  if (hitRect(SAND, rect, 90)) g.decal('grass', 'sand', SAND, { feather: 34 });                                           // przejście łąka → piasek (Saraceni)
  if (hitRect(LAKE, rect, 90)) {
    g.decal('grass', 'sand', LAKE.map(b => growPoly(b, 0.62)), { feather: 22 });                                          // plaża
    g.flat(LAKE.map(b => growPoly(b, 0.2)), 'rgba(92,70,40,0.38)', 10);                                                  // mokry piasek
    P.save(); P.lineJoin = 'round';                                                                                       // piana: szeroki obrys pod wodą
    for (const poly of LAKE) { P.strokeStyle = 'rgba(240,252,253,0.6)'; P.lineWidth = 9; P.shadowColor = 'rgba(230,250,255,0.9)'; P.shadowBlur = 10 * RG; P.beginPath(); poly.forEach(([x, y], k) => { const p = g.P(x, y, 0); k ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]); }); P.closePath(); P.stroke(); }
    P.restore();
    g.decal('water', null, LAKE, { feather: 3 });
    g.flat(LAKE.map(b => growPoly(b, -0.5)), 'rgba(8,52,84,0.5)', 26);                                                   // głębia
  }
  ROADS.forEach((road, ri) => { const poly = [ribbon(road, ROADW[ri], road[0][0])]; if (hitRect(poly, rect, 30)) g.decal('dirt', '#8a6e40', poly, { feather: 8, alpha: 0.96 }); });
  P.save(); P.strokeStyle = 'rgba(40,26,8,0.55)'; P.lineWidth = 2.2; P.lineJoin = 'round';                                  // obrzeża pól
  for (const [, poly] of FIELDS) if (hitRect([poly], rect, 10)) { P.beginPath(); poly.forEach(([x, y], k) => { const p = g.P(x, y, 0); k ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]); }); P.closePath(); P.stroke(); }
  P.restore();
  // place i cienie nieruchomych obiektów — wypiekane razem z terenem (w grze: odświeżane po zmianie)
  for (const l of ['p', 'u']) for (const o of WORLD.objs) {
    const im = o.spr[l]; if (!im) continue;
    const X = bx(o.x, o.y) - i * CH, Y = by(o.x, o.y) - j * CH, k = o.k, dw = o.spr.w * k, dh = o.spr.h * k, x0 = X - o.spr.ax * k, y0 = Y - o.spr.ay * k;
    if (x0 > CH || y0 > CH || x0 + dw < 0 || y0 + dh < 0) continue;
    P.save(); P.setTransform(1, 0, 0, 1, 0, 0);
    P.drawImage(lodPick(im, o.spr.R / (RG * k)), x0 * RG, y0 * RG, dw * RG, dh * RG);
    P.restore();
  }
}
function chunkOf(i, j) {
  const key = i + ',' + j; let ch = chunks.get(key);
  if (!ch) { const g = new Scene(CH, CH, GX - i * CH, GY - j * CH, { R: RG, ground: true }); paintGround(g, i, j); ch = { c: g.pcv }; chunks.set(key, ch); }
  return ch;
}

/* ---------- świat: sprite'y i obiekty ---------- */
const SPR = {}, SETS = {}, FIG = 0.85;
let WORLD = null;
const PARTS = {}, tmark = (name, t0) => { PARTS[name] = Math.round(performance.now() - t0); };
/* wypiek w kawałkach z paskiem postępu — między krokami oddajemy sterowanie przeglądarce, więc strona nie „wisi" na wolnym telefonie */
let DONE = 0; const TOTAL = 49;
const nextPaint = () => new Promise(r => { let ok = false; const f = () => { if (!ok) { ok = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 60); });
async function step(label, fn) {
  const f = Math.min(0.99, DONE / TOTAL), bar = document.querySelector('#lbar i'), txt = document.getElementById('ltxt');
  if (bar) bar.style.width = (f * 100).toFixed(0) + '%'; if (txt) txt.textContent = label + ' · ' + (f * 100).toFixed(0) + '%';
  if (performance.now() - (step.last ?? 0) > 40) { await nextPaint(); step.last = performance.now(); }      // oddajemy sterowanie najwyżej co ~40 ms
  const v = fn(); DONE++; return v;
}
async function buildWorld() {
  let t0 = performance.now();
  const sp = SPR, many = async (label, n, fn) => { const out = []; for (let i = 1; i <= n; i++) out.push(await step(label, () => fn(i))); return out; };
  const jobs = { slavHut: () => BAKED.slavHut(), frankHouse: () => BAKED.frankHouse(), tower: () => BAKED.stoneTower(), saracenHouse: () => BAKED.saracenHouse(), mosque: () => BAKED.mosque(),
    hay: () => BAKED.hay(), logs: () => BAKED.logs(), well: () => BAKED.well(), longhouse: () => BAKED.longhouse(), longship: () => BAKED.longship(), keep: () => BAKED.keep() };
  for (const n of Object.keys(jobs)) sp[n] = await step('Budynki', jobs[n]);
  tmark('budynki', t0); t0 = performance.now();
  const oaks = await many('Drzewa', 5, i => TREES.oak(100 + i)), pines = await many('Drzewa', 4, i => TREES.pine(200 + i)), palms = await many('Drzewa', 3, i => TREES.palm(300 + i));
  const rocks = await many('Skały', 4, i => bakeRock(400 + i)), tufts = await many('Roślinność', 4, i => bakeTuft(500 + i, 'green')), sandTufts = await many('Roślinność', 3, i => bakeTuft(600 + i, 'sand'));
  tmark('drzewa+skały', t0); t0 = performance.now();
  const cast = {}; for (const key of Object.keys(CAST)) cast[key] = await step('Mieszkańcy', () => bakeCast(key, FIG));
  tmark('postacie', t0);
  Object.assign(SETS, { oaks, pines, palms, rocks, cast });
  const objs = [], B = [];
  const add = (spr, x, y, o = {}) => { const ob = { spr, x, y, k: o.k ?? 1, sway: o.sway || 0, ph: o.ph ?? 0, bob: o.bob || 0, smoke: o.smoke && o.smoke.map(v => v * spr.F) }; objs.push(ob); return ob; };
  const bld = (spr, i, j, o = {}) => { B.push([i + 0.5, j + 0.5]); FOOT.push([i, j, 1, 1]); return add(spr, i + 0.5, j + 0.5, o); };
  const prop = (spr, i, j, o = {}) => add(spr, i + 0.5, j + 0.5, o);

  // Słowianie
  bld(sp.slavHut, 2, 6, { smoke: [0.05, 0, 0.84] }); bld(sp.slavHut, 4, 5, { smoke: [0.05, 0, 0.84] }); bld(sp.slavHut, 1, 9, { smoke: [0.05, 0, 0.84] });
  prop(sp.well, 3, 8); prop(sp.hay, 5, 8); prop(sp.hay, 5, 9); prop(sp.logs, 1, 7);
  // Frankowie
  bld(sp.frankHouse, 6, 6, { smoke: [0.15, -0.1, 0.98] }); bld(sp.frankHouse, 9, 6, { smoke: [0.15, -0.1, 0.98] }); bld(sp.tower, 5, 3);
  B.push([8.0, 4.0]); FOOT.push([7, 3, 2, 2]); add(sp.keep, 8.0, 4.0);                                         // Zamek: jedyny budynek 2×2 pola
  // Wikingowie
  bld(sp.longhouse, 13, 5, { smoke: [0.0, 0, 0.9] }); add(sp.longship, 11.9, 2.7, { bob: 1 });
  // Saraceni
  bld(sp.mosque, 12, 7); bld(sp.saracenHouse, 13, 10); bld(sp.saracenHouse, 10, 10); bld(sp.saracenHouse, 12, 12);

  const lakeNear = (x, y) => LAKE.some(p => inPoly(x, y, growPoly(p, 0.55)));
  // drzewo nie może zasłaniać budynku: ani stać zbyt blisko, ani tuż przed nim (większa głębokość x+y w tej samej kolumnie ekranu)
  const covers = (x, y) => B.some(([bx2, by2]) => { const dd = (x + y) - (bx2 + by2), ds = Math.abs((x - y) - (bx2 - by2)); return dd > 0 && dd < 4.0 && ds < 1.6; });
  const free = (x, y, dB, dR, front = true) => !lakeNear(x, y) && !FIELDS.some(([, q]) => inPoly(x, y, growPoly(q, 0.45))) && B.every(([bx2, by2]) => Math.hypot(bx2 - x, by2 - y) > dB) && ROADPATHS.every(p => distToPath(x, y, p) > dR) && !(front && covers(x, y));
  const taken = [];
  const spread = (n, cx, cy, rx, ry, seed, pick, o = {}) => {
    const r = rng(seed); let tries = 0, placed = 0;
    while (placed < n && tries++ < n * 80) {
      const a = r() * TAU, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
      if (x < 0.1 || y < 0.1 || x > 17 || y > 15) continue;
      if (!free(x, y, o.dB ?? 1.2, o.dR ?? 0.85, o.front ?? true)) continue;
      if (taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < (o.dMin ?? 0.7))) continue;
      taken.push([x, y]); const k = pick(r); add(k.spr, x, y, { k: k.k ?? 1, sway: k.sway ?? 0, ph: r() * TAU }); placed++;
    }
  };
  const TT = (arr, a, b, sw = 1) => r => ({ spr: arr[(r() * arr.length) | 0], k: a + r() * (b - a), sway: sw });
  spread(22, 2.3, 2.5, 2.7, 2.2, 31, r => r() < 0.55 ? TT(oaks, 0.92, 1.1)(r) : TT(pines, 0.9, 1.08)(r), { dB: 1.5 });      // las NW
  spread(10, 6.2, 0.9, 2.6, 0.9, 32, TT(pines, 0.9, 1.08), { dB: 1.5 });                                                    // las N
  spread(6, 0.5, 6.2, 0.7, 1.8, 33, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(6, 0.8, 11.2, 1.2, 1.6, 34, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(5, 4.2, 14.2, 2.4, 0.7, 36, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(5, 15.8, 12.2, 1.0, 1.6, 37, TT(palms, 0.9, 1.05), { dMin: 1.1, dB: 1.9 });
  spread(3, 15.6, 8.4, 0.6, 1.0, 39, TT(palms, 0.9, 1.05), { dMin: 1.1, dB: 1.9 });
  spread(3, 8.6, 13.0, 1.0, 0.8, 38, TT(palms, 0.9, 1.05), { dMin: 1.1, dB: 1.9 });
  spread(3, 10.6, 5.6, 1.2, 0.5, 44, TT(oaks, 0.8, 0.95), { dMin: 1.0, dB: 1.9 });
  spread(3, 16.2, 5.0, 0.6, 1.0, 45, TT(oaks, 0.85, 1.0), { dMin: 1.0, dB: 1.9 });
  spread(5, 9.0, 4.6, 3.0, 0.8, 40, r => ({ spr: rocks[(r() * 4) | 0], k: 0.85 + r() * 0.3 }), { dMin: 0.7, dB: 1.1, front: false });
  spread(4, 7.0, 14.2, 4.0, 0.7, 41, r => ({ spr: rocks[(r() * 4) | 0], k: 0.85 + r() * 0.3 }), { dMin: 0.7, dB: 1.1, front: false });
  spread(90, 8.0, 8.4, 8.0, 6.0, 42, r => ({ spr: tufts[(r() * 4) | 0], k: 0.8 + r() * 0.5 }), { dMin: 0.45, dB: 0.9, dR: 0.75, front: false });
  spread(34, 12.6, 9.8, 3.4, 2.8, 43, r => ({ spr: sandTufts[(r() * 3) | 0], k: 0.8 + r() * 0.5 }), { dMin: 0.5, dB: 0.9, dR: 0.75, front: false });

  // mieszkańcy: ścieżki po środkach pól, role i nacje
  const figs = [];
  const fig = (role, path, speed, s0 = 0) => figs.push({ cast: cast[role], path, speed, t: s0, s: s0 * speed, x: path[0][0], y: path[0][1], view: 'front', mirror: false });
  fig('slavAxe', [[3.5, 7.5], [5.5, 7.5], [5.5, 6.6]], 0.45, 0); fig('slavWoman', [[2.5, 8.6], [3.5, 8.9], [4.5, 8.9], [4.5, 7.6]], 0.4, 2);
  fig('frankGuard', [[6.5, 7.5], [8.5, 7.5], [9.5, 7.6]], 0.42, 1); fig('frankPeasant', [[8.0, 7.4], [8.0, 5.6]], 0.34, 0);
  fig('sarMerchant', [[10.5, 8.5], [11.5, 9.5], [13.0, 9.5]], 0.38, 0.5); fig('sarGuard', [[11.5, 9.6], [11.5, 11.4]], 0.3, 3);
  fig('vikWarrior', [[12.5, 6.8], [13.5, 6.9], [14.6, 7.0]], 0.36, 1.5); fig('vikFisher', [[10.7, 5.2], [11.8, 5.0], [12.6, 5.4]], 0.3, 0);
  return { objs, figs };
}

/* ---------- kamera i renderer ---------- */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let dpr = 1, zoom = 2, cam = { x: bx(8.4, 7.0), y: by(8.4, 7.0) }, BAKE_MS = 0, gridOn = QS.get('grid') === '1';
const defaultZoom = () => clamp(Math.max(72, Math.min(150, innerWidth / 10)) / 64, 1.1, 2.4);   // docelowo ~10 pól na szerokość ekranu (min. 72 px na pole)
let ZDEF = 2, ZMIN = 1, ZMAX = 3.6;
const BBOX = { x0: bx(-1, 16), x1: bx(17, -1), y0: by(-1, -1), y1: by(17, 17) };
const clampCam = () => { cam.x = clamp(cam.x, BBOX.x0, BBOX.x1); cam.y = clamp(cam.y, BBOX.y0, BBOX.y1); };
const kk = () => zoom / S * dpr;                                      // px ekranu na px logiczny
let VX = 0, VY = 0;                                                   // punkt wypieku (X,Y) → ekran (VX + X·k, VY + Y·k)
const toScr = (x, y, z = 0) => { const k = kk(); return [VX + bx(x, y) * k, VY + by(x, y, z) * k]; };
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  ZDEF = parseFloat(QS.get('z')) || defaultZoom(); ZMIN = ZDEF * 0.5; ZMAX = ZDEF * 1.8;
}
function setZoom(z, sx = innerWidth / 2, sy = innerHeight / 2) {
  z = clamp(z, ZMIN, ZMAX); const k0 = kk(), px = sx * dpr, py = sy * dpr;
  const bxp = cam.x + (px - cv.width / 2) / k0, byp = cam.y + (py - cv.height / 2) / k0;
  zoom = z; const k1 = kk(); cam.x = bxp - (px - cv.width / 2) / k1; cam.y = byp - (py - cv.height / 2) / k1; clampCam(); updateUI();
}
function updateUI() { const el = document.getElementById('zl'); if (el) el.textContent = Math.round(zoom / ZDEF * 100) + '%'; const g = document.getElementById("grid"); if (g) g.classList.toggle("on", gridOn); }

function blit(spr, layer, sx, sy, ks) {
  const im = spr[layer]; if (!im) return;
  const k = kk() * ks;
  ctx.drawImage(lodPick(im, spr.R / k), sx - spr.ax * k, sy - spr.ay * k, spr.w * k, spr.h * k);
}
const smoke = [];
function drawFrame(t, dt) {
  const k = kk(), W = cv.width, H = cv.height;
  VX = W / 2 - cam.x * k; VY = H / 2 - cam.y * k;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#2d4a22'; ctx.fillRect(0, 0, W, H);
  // teren: widoczne kafle (maks. 3 nowe wypieki na klatkę)
  let budget = 3;
  const i0 = Math.floor((-VX / k) / CH), i1 = Math.floor(((W - VX) / k) / CH), j0 = Math.floor((-VY / k) / CH), j1 = Math.floor(((H - VY) / k) / CH);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const key = i + ',' + j; if (!chunks.has(key)) { if (budget-- <= 0) continue; }
    const ch = chunkOf(i, j), xa = Math.floor(VX + i * CH * k), ya = Math.floor(VY + j * CH * k), xb = Math.ceil(VX + (i + 1) * CH * k), yb = Math.ceil(VY + (j + 1) * CH * k);
    ctx.drawImage(lodPick(ch.c, RG / k), xa, ya, xb - xa, yb - ya);
  }
  // ruch wody: nałożony drugi, przesuwany wzór fal (przycięty do jeziora)
  const wm = tex('water'), K = wm.ppu;
  if (!drawFrame.wp) drawFrame.wp = ctx.createPattern(wm.c, 'repeat');
  ctx.save();
  ctx.setTransform(k, 0, 0, k, VX, VY); ctx.clip(LAKE_CLIP);
  ctx.setTransform(k * AX / K, k * AY / K, -k * AX / K, k * AY / K, VX + GX * k + (t * 0.05 % 4) * AX * k, VY + GY * k + (t * 0.03 % 4) * AY * k);
  ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = drawFrame.wp;
  const Rr = 40 * K; ctx.fillRect(-Rr, -Rr, 2 * Rr, 2 * Rr);
  ctx.restore();

  if (gridOn) drawGrid(k);

  // cienie ruchomych postaci (cienie reszty są w terenie)
  for (const f of WORLD.figs) { const [sx, sy] = toScr(f.x, f.y); blit(f.cast.front[0], 'u', sx, sy, 1); }

  // obiekty posortowane po głębokości (z odrzucaniem poza ekranem)
  const list = [];
  for (const o of WORLD.objs) { const [sx, sy] = toScr(o.x, o.y), ks = o.k * kk(), s = o.spr; if (sx + (s.w - s.ax) * ks < -30 || sx - s.ax * ks > W + 30 || sy + (s.h - s.ay) * ks < -30 || sy - s.ay * ks > H + 30) continue; list.push({ d: o.x + o.y, o, sx, sy }); }
  for (const f of WORLD.figs) { const [sx, sy] = toScr(f.x, f.y); list.push({ d: f.x + f.y, f, sx, sy }); }
  list.sort((a, b) => a.d - b.d);
  for (const it of list) {
    if (it.o) {
      const o = it.o, { sx, sy } = it, ks = o.k * k, im = lodPick(o.spr.c, o.spr.R / ks), dx = sx - o.spr.ax * ks, dy = sy - o.spr.ay * ks, w = o.spr.w * ks, h = o.spr.h * ks;
      if (o.bob) {
        const by2 = Math.sin(t * 1.4 + o.x) * 1.6 * k, rot = Math.sin(t * 1.1 + 1) * 0.012, c = Math.cos(rot), s = Math.sin(rot);
        ctx.setTransform(c, s, -s, c, sx - c * sx + s * sy, sy - s * sx - c * sy + by2); ctx.drawImage(im, dx, dy, w, h); ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (o.sway) {
        const sw = (Math.sin(t * 1.25 + o.ph) * 0.010 + Math.sin(t * 0.43 + o.ph * 1.7) * 0.008) * o.sway;
        ctx.setTransform(1, 0, -sw, 1, sw * sy, 0); ctx.drawImage(im, dx, dy, w, h); ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else ctx.drawImage(im, dx, dy, w, h);
    } else {
      const f = it.f, spr = f.cast[f.view][Math.floor(f.t * 3.6) % 2], bob = Math.abs(Math.sin(f.t * 3.6 * Math.PI)) * 1.2 * k, ks = k;
      ctx.save(); ctx.translate(it.sx, it.sy - bob); ctx.scale(f.mirror ? -1 : 1, 1);
      ctx.drawImage(lodPick(spr.c, spr.R / ks), -spr.ax * ks, -spr.ay * ks, spr.w * ks, spr.h * ks); ctx.restore();
    }
  }

  // dym z kominów
  for (const o of WORLD.objs) if (o.smoke) {
    o.nextPuff = (o.nextPuff ?? Math.random() * 0.6) - dt;
    if (o.nextPuff < 0) { o.nextPuff += 0.45 + Math.random() * 0.2; smoke.push({ x: o.x + o.smoke[0], y: o.y + o.smoke[1], z: o.smoke[2], a: 0, ph: Math.random() * TAU }); }
  }
  for (let i = smoke.length - 1; i >= 0; i--) {
    const p = smoke[i]; p.a += dt; p.z += dt * 0.3; p.x += dt * 0.12; p.y -= dt * 0.05;
    if (p.a > 4) { smoke.splice(i, 1); continue; }
    const [sx, sy] = toScr(p.x + Math.sin(p.a * 1.6 + p.ph) * 0.03, p.y, p.z), u = p.a / 4, rad = (5 + u * 17) * k * S * 0.6;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad); const al = (1 - u) * 0.62 * Math.min(1, p.a * 3);
    gr.addColorStop(0, `rgba(214,210,204,${al})`); gr.addColorStop(0.55, `rgba(206,202,196,${al * 0.55})`); gr.addColorStop(1, 'rgba(200,196,190,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(sx, sy, rad, 0, TAU); ctx.fill();
  }

  // delikatny „grading": ciepłe światło z lewej-góry, chłodniejszy dół, winieta — jedna warstwa w pamięci podręcznej
  if (!drawFrame.grade || drawFrame.grade.width !== W || drawFrame.grade.height !== H) {
    const gc = newCanvas(W, H), g = gc.getContext('2d');
    let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,214,130,0.12)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(60,80,150,0.10)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78); gr.addColorStop(0, 'rgba(10,16,4,0)'); gr.addColorStop(1, 'rgba(10,16,4,0.42)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    drawFrame.grade = gc;
  }
  ctx.drawImage(drawFrame.grade, 0, 0);
}

/* siatka pól + ślady budynków (przełącznik G / przycisk) — pokazuje, że każdy budynek mieści się w swoim polu */
function drawGrid(k) {
  const W = cv.width, H = cv.height, inv = (sx, sy) => { const X = (sx - VX) / k, Y = (sy - VY) / k, u = (X - GX) / AX, v = (Y - GY) / AY; return [(u + v) / 2, (v - u) / 2]; };
  const cs = [inv(0, 0), inv(W, 0), inv(0, H), inv(W, H)], xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
  const i0 = Math.floor(Math.min(...xs)), i1 = Math.ceil(Math.max(...xs)), j0 = Math.floor(Math.min(...ys)), j1 = Math.ceil(Math.max(...ys));
  const diamond = (i, j, w, h) => { ctx.beginPath(); for (const [x, y] of [[i, j], [i + w, j], [i + w, j + h], [i, j + h]]) { const [sx, sy] = toScr(x, y); ctx.lineTo(sx, sy); } ctx.closePath(); };
  ctx.save(); ctx.lineWidth = Math.max(1, dpr); ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (i < 0 || j < 0 || i > 16 || j > 15) continue; diamond(i, j, 1, 1); ctx.stroke(); }
  ctx.lineWidth = Math.max(2, 2 * dpr); ctx.strokeStyle = 'rgba(255,214,70,0.95)'; ctx.fillStyle = 'rgba(255,214,70,0.12)';
  for (const [i, j, w, h] of FOOT) { diamond(i, j, w, h); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

function update(dt) {
  for (const f of WORLD.figs) {
    f.t += dt;
    const segs = []; let L = 0;
    for (let i = 0; i < f.path.length - 1; i++) { const l = Math.hypot(f.path[i + 1][0] - f.path[i][0], f.path[i + 1][1] - f.path[i][1]); segs.push(l); L += l; }
    f.s += dt * f.speed * (f.back ? -1 : 1);
    if (f.s > L) { f.s = L; f.back = true; } else if (f.s < 0) { f.s = 0; f.back = false; }
    let s = f.s, i = 0; while (i < segs.length - 1 && s > segs[i]) { s -= segs[i]; i++; }
    const a = f.path[i], b = f.path[i + 1], u = clamp(s / segs[i], 0, 1), px = f.x, py = f.y;
    f.x = lerp(a[0], b[0], u); f.y = lerp(a[1], b[1], u);
    const dx = f.x - px, dy = f.y - py, sdx = dx - dy, sdy = dx + dy;                 // ruch w osiach ekranu
    if (Math.abs(sdx) + Math.abs(sdy) > 1e-6) { f.view = sdy < -1e-6 ? 'back' : 'front'; if (Math.abs(sdx) > 1e-6) f.mirror = sdx < 0; }
  }
}

/* arkusze sprite'ów do oględzin z bliska: #sheet-b (budynki), #sheet-n (przyroda), #sheet-f (postacie) — np. #sheet-f-3 */
function sheetFrame() {
  const W = cv.width, H = cv.height, mode = (location.hash.match(/sheet-(\w)/) || [])[1] || 'b', Z = parseFloat((location.hash.match(/-([\d.]+)$/) || [])[1] || '1') * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const bg = new Scene(W, H, W / 2, 20, { R: 1, ground: true }); bg.decal('grass', 'green', null); bg.decal('grassDetail', null, null, { alpha: 0.34 }); ctx.drawImage(bg.pcv, 0, 0, W, H);
  const draw = (spr, cx, cy, z, layers) => { for (const l of layers) if (spr[l]) ctx.drawImage(lodPick(spr[l], spr.R / z), cx - spr.ax * z, cy - spr.ay * z, spr.w * z, spr.h * z); };
  if (mode === 'b') {
    const items = ['slavHut', 'frankHouse', 'tower', 'keep', 'saracenHouse', 'mosque', 'longhouse', 'longship'], cols = 4, cw = W / cols, ch = H / 2;
    items.forEach((n, i) => draw(SPR[n], (i % cols + 0.5) * cw, Math.floor(i / cols) * ch + ch * 0.8, Z * 0.5, ['p', 'u', 'c']));
  } else if (mode === 'n') {
    const rows = [H * 0.3, H * 0.62, H * 0.93], row1 = [SETS.oaks[0], SETS.oaks[1], SETS.pines[0], SETS.pines[1]], row2 = [SETS.palms[0], SETS.palms[1], SETS.rocks[0], SETS.rocks[1]];
    row1.forEach((t, i) => draw(t, (i + 0.5) * W / 4, rows[0], Z * 0.5, ['u', 'c'])); row2.forEach((t, i) => draw(t, (i + 0.5) * W / 4, rows[1], Z * 0.5, ['u', 'c']));
  } else {
    const keys = Object.keys(SETS.cast), n = keys.length, cw = W / n;
    keys.forEach((key, i) => { const cs = SETS.cast[key]; [cs.front[0], cs.front[1], cs.back[0]].forEach((spr, q) => draw(spr, (i + 0.5) * cw, H * (0.3 + q * 0.33), Z, ['u', 'c'])); });
  }
}

async function boot() {
  const t0 = performance.now();
  resize(); zoom = ZDEF; clampCam();
  WORLD = await buildWorld();
  let tc0 = performance.now();
  const sheet = location.hash.startsWith('#sheet');
  if (!sheet) { // wypiek widocznych kafli terenu przed pierwszą klatką
    const k = kk(), W = cv.width, H = cv.height, vx = W / 2 - cam.x * k, vy = H / 2 - cam.y * k;
    for (let j = Math.floor((-vy / k) / CH); j <= Math.floor(((H - vy) / k) / CH); j++) for (let i = Math.floor((-vx / k) / CH); i <= Math.floor(((W - vx) / k) / CH); i++) await step('Teren', () => chunkOf(i, j));
    tmark('teren(kafle)', tc0);
  }
  BAKE_MS = performance.now() - t0; window.__bakeMs = BAKE_MS; window.__parts = PARTS;
  document.getElementById('bake').textContent = `Wypiek: ${BAKE_MS.toFixed(0)} ms · rozdzielczość ×${RES} · ${innerWidth}×${innerHeight} @${dpr}`;
  const ld = document.getElementById('load'); if (ld) ld.style.display = 'none';
  if (sheet) { sheetFrame(); window.__ready = true; return; }
  addEventListener('resize', () => { const r = zoom / ZDEF; resize(); zoom = clamp(ZDEF * r, ZMIN, ZMAX); clampCam(); updateUI(); });
  // sterowanie: przeciąganie, kółko, pinch, przyciski, klawisze
  const ptrs = new Map(); let pinch0 = null;
  cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (err) { /* zdarzenia syntetyczne */ } ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zoom }; } });
  cv.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { cam.x -= dx * dpr / kk(); cam.y -= dy * dpr / kk(); clampCam(); }
    else if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; setZoom(pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d, (a.x + b.x) / 2, (a.y + b.y) / 2); }
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY); }, { passive: false });
  const act = { zin: () => setZoom(zoom * 1.25), zout: () => setZoom(zoom / 1.25), zreset: () => { setZoom(ZDEF); cam.x = bx(8.4, 7.0); cam.y = by(8.4, 7.0); clampCam(); }, grid: () => { gridOn = !gridOn; updateUI(); } };
  for (const id of Object.keys(act)) { const el = document.getElementById(id); if (el) el.addEventListener('click', act[id]); }
  addEventListener('keydown', e => { if (e.key === '+' || e.key === '=') act.zin(); else if (e.key === '-') act.zout(); else if (e.key === '0') act.zreset(); else if (e.key === 'g' || e.key === 'G') act.grid(); });
  updateUI();
  let last = performance.now(), T = 0, frames = 0, fpsT = 0;
  const loop = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt;
    update(dt); drawFrame(T, dt);
    frames++; fpsT += dt; if (fpsT > 1) { document.getElementById('fps').textContent = Math.round(frames / fpsT) + ' FPS'; frames = 0; fpsT = 0; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__setZoom = z => setZoom(z); window.__ready = true;
}
boot().catch(e => { const t = document.getElementById('ltxt'); if (t) t.textContent = 'Błąd: ' + e.message; console.error(e); });
