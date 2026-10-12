/* ====================== SCENA POKAZOWA (v2) ======================
   Układ na siatce pól (każdy budynek = 1 pole, wszystko w skali jednego pola), teren w kaflach wypiekanych na żądanie,
   LOD przy oddaleniu, kamera z zoomem zależnym od ekranu, pinch / przyciski, przełącznik siatki. */
const QS = new URLSearchParams(location.search), DPR0 = Math.min(window.devicePixelRatio || 1, 3);
RES = parseFloat(QS.get('q')) || 2;                                  // rozdzielczość wypieku: domyślnie 2× (ostre duże budynki także po przybliżeniu); ?q=1 = lżej
TEXRES = RES >= 2 ? 2 : 1;
const MAP_W = 34, MAP_H = 30;                                       // rozmiar pokazowej mapy w polach
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
const LAKE = [blob(27.0, 3.6, 3.7, 2.3, 3, 64, 0.2), blob(24.0, 4.6, 1.7, 1.3, 5, 40, 0.22), blob(30.2, 4.8, 1.8, 1.3, 8, 40, 0.22)];
const SAND = [blob(27.0, 21.0, 7.0, 4.6, 12, 64, 0.2), blob(31.5, 18.0, 3.0, 2.6, 14, 40, 0.2), blob(24.0, 26.0, 4.0, 2.4, 15, 40, 0.2)];
const FLOOR = [blob(4.0, 4.0, 4.6, 3.6, 20), blob(13.0, 1.0, 4.0, 1.4, 22), blob(1.2, 14.0, 2.0, 3.4, 23)];
const FIELDS = [];                                                  // pola uprawne to teraz budynki (franks_farm, slavs_field)
const ROADS = [
  [[0.5, 9.5], [10.5, 9.5], [21.5, 9.5], [33.5, 9.5]],                       // główna ulica (Frankowie → Wikingowie)
  [[10.5, 9.5], [10.5, 17.5], [10.5, 28.5]],                                // na południe, do Słowian
  [[2.5, 17.5], [10.5, 17.5]],                                              // ulica słowiańska
  [[21.5, 9.5], [21.5, 15.5], [21.5, 21.5], [21.5, 28.5]],                  // na południe, do Saracenów
  [[21.5, 21.5], [27.5, 21.5], [33.5, 21.5]],                               // ulica saraceńska
  [[21.5, 9.5], [21.5, 5.5]],                                               // do przystani
  [[13.5, 9.5], [13.5, 13.5], [19.5, 13.5]]                                 // zaułek frankijski
];
const ROADW = [1.4, 1.2, 1.0, 1.2, 1.0, 0.9, 0.9];
const ROADPATHS = ROADS.map(r => catmull(r, 6));
const FOOT = [];                                                    // ślady budynków: [i, j, szer., wys.] w polach (do podglądu siatki)

/* plan budynków: [nazwa sprite'a, i, j] — (i,j) to północny róg obrysu; środek = (i+fw/2, j+fh/2). Brakujące sprite'y są pomijane. */
const PLAN = [
  // Frankowie
  ['franks_keep', 12, 4], ['franks_barracks', 17, 5], ['franks_temple', 5, 6], ['franks_toolforge', 10, 5], ['franks_mill', 17, 1], ['franks_armory', 1, 6],
  ['franks_hut', 12, 11], ['franks_hut', 15, 11], ['franks_hut', 18, 11], ['franks_bakery', 7, 11], ['franks_market', 3, 11],
  // Słowianie
  ['slavs_hut', 2, 15], ['slavs_hut', 4, 15], ['slavs_store', 6, 15], ['slavs_waxery', 2, 19], ['slavs_temple', 5, 19], ['slavs_sauna', 8, 19],
  ['slavs_keep', 3, 23], ['slavs_field', 7, 23], ['slavs_gatherer', 0, 23], ['slavs_bartnik', 7, 26],
  // Wikingowie
  ['vikings_dock', 20, 3], ['vikings_ship', 25, 3, { bob: 1 }], ['vikings_temple', 23, 11], ['vikings_keep', 26, 11], ['vikings_mead', 30, 11],
  // Saraceni
  ['saracens_market', 23, 15], ['saracens_temple', 28, 15], ['saracens_caravanserai', 24, 18], ['saracens_bathhouse', 28, 18], ['saracens_dategrove', 31, 18],
  ['saracens_keep', 23, 23], ['saracens_hut', 28, 23], ['saracens_hut', 30, 23], ['saracens_guardpost', 32, 23]
];

/* ---------- teren: kafle wypiekane na żądanie ---------- */
const RG = RES, chunks = new Map(), LAKE_CLIP = new Path2D();
for (const poly of LAKE) { poly.forEach(([x, y], i) => LAKE_CLIP[i ? 'lineTo' : 'moveTo'](bx(x, y), by(x, y))); LAKE_CLIP.closePath(); }
function bboxOf(polys) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of polys) for (const [x, y] of p) { const X = bx(x, y), Y = by(x, y); if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } return { x0, y0, x1, y1 }; }
const hitRect = (polys, r, m = 0) => { const b = bboxOf(polys); return b.x1 + m > r.x0 && b.x0 - m < r.x1 && b.y1 + m > r.y0 && b.y0 - m < r.y1; };
const layerR = (spr, l) => l === 'u' ? (spr.Ru ?? spr.R) : l === 'p' ? (spr.Rp ?? spr.R) : spr.R;

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
    for (const poly of LAKE) { P.strokeStyle = 'rgba(240,252,253,0.6)'; P.lineWidth = 9; P.shadowColor = 'rgba(230,250,255,0.9)'; P.shadowBlur = 10 * g.R; P.beginPath(); poly.forEach(([x, y], k) => { const p = g.P(x, y, 0); k ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]); }); P.closePath(); P.stroke(); }
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
    P.drawImage(lodPick(im, layerR(o.spr, l) / (g.R * k)), x0 * g.R, y0 * g.R, dw * g.R, dh * g.R);
    P.restore();
  }
}
function chunkOf(i, j, res = RG) {
  const key = res + '|' + i + ',' + j; let ch = chunks.get(key);
  if (!ch) { const g = new Scene(CH, CH, GX - i * CH, GY - j * CH, { R: res, ground: true }); paintGround(g, i, j); ch = { c: g.pcv, res }; chunks.set(key, ch); }
  return ch;
}

/* ---------- świat: sprite'y i obiekty ---------- */
const SPR = {}, SETS = {}, FIG = 0.85;
let WORLD = null;
const PARTS = {}, tmark = (name, t0) => { PARTS[name] = Math.round(performance.now() - t0); };
/* wypiek w kawałkach z paskiem postępu — między krokami oddajemy sterowanie przeglądarce, więc strona nie „wisi" */
let DONE = 0, TOTAL = 60;
const nextPaint = () => new Promise(r => { let ok = false; const f = () => { if (!ok) { ok = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 60); });
async function step(label, fn) {
  const f = Math.min(0.99, DONE / TOTAL), bar = document.querySelector('#lbar i'), txt = document.getElementById('ltxt');
  if (bar) bar.style.width = (f * 100).toFixed(0) + '%'; if (txt) txt.textContent = label + ' · ' + (f * 100).toFixed(0) + '%';
  if (performance.now() - (step.last ?? 0) > 40) { await nextPaint(); step.last = performance.now(); }      // oddajemy sterowanie najwyżej co ~40 ms
  const v = fn(); DONE++; return v;
}
/* które sprite'y wypiekać: do kontroli jakości i arkuszy — wszystkie lub wskazane; do widoku mapy — tylko te z PLAN (w grze: tylko budynki wybranej nacji) */
function wantedSprites() {
  const all = Object.keys(BAKED), h = location.hash;
  if (/^#sheet-a/.test(h)) return [];                                // arkusz zwierząt: bez budynków
  if (LINT || QS.has('all') || /^#sheet-b/.test(h) || h === '#sheet-r' || h === '#sheet') return all;
  if (QS.get('sprite')) return QS.get('sprite').split(',').filter(n => BAKED[n]);
  const m = h.match(/^#sheet-r-([a-z]+)/); if (m && NATIONS[m[1]]) return NATIONS[m[1]].map(id => spriteName(m[1], id)).filter(n => BAKED[n]);
  const need = new Set(PLAN.map(p => p[0])); need.add('hay'); need.add('logs'); return all.filter(n => need.has(n));
}
async function bakeAll() {
  let t0 = performance.now();
  const names = wantedSprites(), many = async (label, n, fn) => { const out = []; for (let i = 1; i <= n; i++) out.push(await step(label, () => fn(i))); return out; };
  TOTAL = names.length + 12 + 11 + Object.keys(CAST).length + 12 + (/^#sheet-a/.test(location.hash) ? Object.keys(FAUNA).length : 0);
  for (const n of names) { LINT_NAME = n; try { SPR[n] = await step('Budynki', BAKED[n]); } catch (e) { e.message = `[${n}] ${e.message}`; throw e; } }
  window.__lint = LINT_LOG;
  tmark('budynki', t0); t0 = performance.now();
  const oaks = await many('Drzewa', 5, i => TREES.oak(100 + i)), pines = await many('Drzewa', 4, i => TREES.pine(200 + i)), palms = await many('Drzewa', 3, i => TREES.palm(300 + i));
  const rocks = await many('Skały', 4, i => bakeRock(400 + i)), tufts = await many('Roślinność', 4, i => bakeTuft(500 + i, 'green')), sandTufts = await many('Roślinność', 3, i => bakeTuft(600 + i, 'sand'));
  tmark('drzewa+skały', t0); t0 = performance.now();
  const cast = {}; for (const key of Object.keys(CAST)) cast[key] = await step('Mieszkańcy', () => bakeCast(key, FIG));
  tmark('postacie', t0); t0 = performance.now();
  const fauna = {}; if (/^#sheet-a/.test(location.hash) || QS.has('fauna')) for (const k of Object.keys(FAUNA)) fauna[k] = await step('Zwierzęta', () => bakeFauna(k, 1));
  tmark('zwierzęta', t0);
  Object.assign(SETS, { oaks, pines, palms, rocks, tufts, sandTufts, cast, fauna });
}

function layoutWorld() {
  const { oaks, pines, palms, rocks, tufts, sandTufts, cast } = SETS;
  const objs = [], R0 = [];                                          // R0: obrysy budynków (do omijania i do sortowania)
  const add = (spr, x, y, o = {}) => { const ob = { spr, x, y, k: o.k ?? 1, sway: o.sway || 0, ph: o.ph ?? 0, bob: o.bob || 0, smoke: o.smoke || spr.smoke, rect: o.rect }; objs.push(ob); return ob; };
  const bld = (name, i, j, o = {}) => {
    const spr = SPR[name]; if (!spr) return null; const fw = spr.fw, fh = spr.fh;
    R0.push({ x0: i, y0: j, x1: i + fw, y1: j + fh }); FOOT.push([i, j, fw, fh]);
    return add(spr, i + fw / 2, j + fh / 2, Object.assign({ rect: { x0: i, y0: j, x1: i + fw, y1: j + fh, big: true } }, o));
  };
  for (const [n, i, j, o] of PLAN) bld(n, i, j, o);
  if (SPR.hay) { add(SPR.hay, 12, 22.5); add(SPR.hay, 13, 23); add(SPR.logs, 1.5, 14.5); add(SPR.hay, 9.5, 25); }

  const lakeNear = (x, y) => LAKE.some(p => inPoly(x, y, growPoly(p, 0.55)));
  const dRect = (x, y, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1));
  // drzewo nie może zasłaniać budynku: ani stać zbyt blisko, ani tuż przed nim (korona sięga ~4 pól głębokości)
  const covers = (x, y) => R0.some(r => { const dd = (x + y) - (r.x1 + r.y1), ds = (x - y) - ((r.x0 + r.x1) / 2 - (r.y0 + r.y1) / 2); return dd > -(r.x1 - r.x0 + r.y1 - r.y0) / 2 && dd < 4.0 && Math.abs(ds) < (r.x1 - r.x0 + r.y1 - r.y0) / 2 + 0.9; });
  const free = (x, y, dB, dR, front = true) => !lakeNear(x, y) && !FIELDS.some(([, q]) => inPoly(x, y, growPoly(q, 0.45))) && R0.every(r => dRect(x, y, r) > dB) && ROADPATHS.every(p => distToPath(x, y, p) > dR) && !(front && covers(x, y));
  const taken = [];
  const spread = (n, cx, cy, rx, ry, seed, pick, o = {}) => {
    const r = rng(seed); let tries = 0, placed = 0;
    while (placed < n && tries++ < n * 80) {
      const a = r() * TAU, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
      if (x < 0.1 || y < 0.1 || x > MAP_W - 0.1 || y > MAP_H - 0.1) continue;
      if (!free(x, y, o.dB ?? 0.9, o.dR ?? 0.9, o.front ?? true)) continue;
      if (taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < (o.dMin ?? 0.7))) continue;
      taken.push([x, y]); const k = pick(r); add(k.spr, x, y, { k: k.k ?? 1, sway: k.sway ?? 0, ph: r() * TAU }); placed++;
    }
  };
  const TT = (arr, a, b, sw = 1) => r => ({ spr: arr[(r() * arr.length) | 0], k: a + r() * (b - a), sway: sw });
  spread(46, 4.0, 4.0, 4.4, 3.6, 31, r => r() < 0.55 ? TT(oaks, 0.92, 1.1)(r) : TT(pines, 0.9, 1.08)(r), { dB: 1.4 });
  spread(24, 12.0, 0.9, 6.0, 1.0, 32, TT(pines, 0.9, 1.08), { dB: 1.4 });
  spread(14, 0.8, 14.0, 1.2, 5.0, 33, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(12, 14.0, 28.5, 8.0, 1.2, 34, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(12, 32.8, 14.0, 1.2, 8.0, 35, TT(oaks, 0.9, 1.08), { dMin: 0.9 });
  spread(10, 26.0, 27.5, 6.0, 1.6, 36, TT(palms, 0.9, 1.05), { dMin: 1.1, dB: 1.6 });
  spread(7, 31.5, 19.0, 1.2, 4.0, 37, TT(palms, 0.9, 1.05), { dMin: 1.1, dB: 1.6 });
  spread(8, 14.0, 24.0, 4.0, 3.0, 38, r => r() < 0.5 ? TT(oaks, 0.8, 1.0)(r) : TT(pines, 0.85, 1.0)(r), { dMin: 0.9, dB: 1.4 });
  spread(10, 18.0, 15.5, 8.0, 1.0, 40, r => ({ spr: rocks[(r() * 4) | 0], k: 0.85 + r() * 0.3 }), { dMin: 0.7, dB: 0.9, front: false });
  spread(260, 17.0, 15.0, 17.0, 14.0, 42, r => ({ spr: tufts[(r() * 4) | 0], k: 0.8 + r() * 0.5 }), { dMin: 0.5, dB: 0.7, dR: 0.7, front: false });
  spread(80, 24.0, 20.5, 6.0, 4.0, 43, r => ({ spr: sandTufts[(r() * 3) | 0], k: 0.8 + r() * 0.5 }), { dMin: 0.55, dB: 0.7, dR: 0.7, front: false });

  // mieszkańcy: ścieżki po środkach pól, role i nacje
  const figs = [];
  const fig = (role, path, speed, s0 = 0) => figs.push({ cast: cast[role], path, speed, t: s0, s: s0 * speed, x: path[0][0], y: path[0][1], view: 'front', mirror: false });
  fig('frankGuard', [[6.5, 9.5], [14.0, 9.5], [20.0, 9.5]], 0.45, 1); fig('frankPeasant', [[10.5, 10.5], [10.5, 14.5]], 0.34, 0); fig('frankGuard', [[14.0, 9.2], [14.0, 11.0]], 0.3, 2);
  fig('slavAxe', [[3.5, 17.5], [8.5, 17.5]], 0.42, 0); fig('slavWoman', [[10.5, 20.5], [10.5, 26.0]], 0.36, 1.5); fig('slavWoman', [[4.0, 22.5], [7.5, 22.8], [9.5, 22.5]], 0.3, 0);
  fig('vikWarrior', [[23.5, 9.5], [30.5, 9.5]], 0.4, 0.5); fig('vikFisher', [[21.5, 6.0], [21.5, 9.0]], 0.3, 0);
  fig('sarMerchant', [[22.5, 21.5], [30.0, 21.5]], 0.38, 0); fig('sarGuard', [[21.5, 14.0], [21.5, 20.0]], 0.3, 2); fig('sarMerchant', [[22.5, 14.8], [25.5, 14.8]], 0.25, 1);
  return { objs, figs };
}

/* ---------- kamera i renderer ---------- */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let dpr = 1, zoom = 2, cam = { x: bx(11.0, 7.6), y: by(11.0, 7.6) }, BAKE_MS = 0, gridOn = QS.get('grid') === '1';
const defaultZoom = () => clamp(innerWidth / 10, 100, 160) / 64;       // ok. 10 pól na szerokość ekranu pulpitu (pole 100–160 px)
let ZDEF = 2, ZMIN = 0.6, ZMAX = 3.6;
const BBOX = { x0: bx(-2, MAP_H + 2), x1: bx(MAP_W + 2, -2), y0: by(-2, -2), y1: by(MAP_W + 2, MAP_H + 2) };
const clampCam = () => { cam.x = clamp(cam.x, BBOX.x0, BBOX.x1); cam.y = clamp(cam.y, BBOX.y0, BBOX.y1); };
const kk = () => zoom / S * dpr;                                      // px ekranu na px logiczny
let VX = 0, VY = 0;                                                   // punkt wypieku (X,Y) → ekran (VX + X·k, VY + Y·k)
const toScr = (x, y, z = 0) => { const k = kk(); return [VX + bx(x, y) * k, VY + by(x, y, z) * k]; };
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  ZDEF = parseFloat(QS.get('z')) || defaultZoom(); ZMAX = ZDEF * 1.8;
  ZMIN = Math.min(ZDEF * 0.3, 0.97 * innerWidth * S / ((MAP_W + MAP_H) * AX));                // oddalanie aż do widoku całej mapy — na wąskim ekranie (telefon) to ratuje czytelność zamiast pomniejszania grafiki
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
  ctx.drawImage(lodPick(im, layerR(spr, layer) / k), sx - spr.ax * k, sy - spr.ay * k, spr.w * k, spr.h * k);
}
const smoke = [];
function drawFrame(t, dt) {
  const k = kk(), W = cv.width, H = cv.height;
  VX = W / 2 - cam.x * k; VY = H / 2 - cam.y * k;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#2d4a22'; ctx.fillRect(0, 0, W, H);
  // teren: widoczne kafle (maks. 3 nowe wypieki na klatkę); przy oddaleniu kafle w rozdzielczości 1× (mniej pamięci i czasu)
  let budget = 3, missing = 0;
  const res = k >= 0.55 ? RG : 1, i0 = Math.floor((-VX / k) / CH), i1 = Math.floor(((W - VX) / k) / CH), j0 = Math.floor((-VY / k) / CH), j1 = Math.floor(((H - VY) / k) / CH);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const key = res + '|' + i + ',' + j; if (!chunks.has(key)) { if (budget-- <= 0) { missing++; continue; } }
    const ch = chunkOf(i, j, res), xa = Math.floor(VX + i * CH * k), ya = Math.floor(VY + j * CH * k), xb = Math.ceil(VX + (i + 1) * CH * k), yb = Math.ceil(VY + (j + 1) * CH * k);
    ctx.drawImage(lodPick(ch.c, res / k), xa, ya, xb - xa, yb - ya);
  }
  window.__pending = missing;
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

  // obiekty posortowane (z odrzucaniem poza ekranem)
  const list = [];
  for (const o of WORLD.objs) {
    const [sx, sy] = toScr(o.x, o.y), ks = o.k * k, s = o.spr, bb = [sx - s.ax * ks, sy - s.ay * ks, sx + (s.w - s.ax) * ks, sy + (s.h - s.ay) * ks];
    if (bb[2] < -30 || bb[0] > W + 30 || bb[3] < -30 || bb[1] > H + 30) continue;
    list.push({ d: o.x + o.y, o, sx, sy, rect: o.rect, bb, x: o.x, y: o.y });
  }
  for (const f of WORLD.figs) { const [sx, sy] = toScr(f.x, f.y), ks = FIG * k; list.push({ d: f.x + f.y, f, sx, sy, bb: [sx - 40 * ks, sy - 100 * ks, sx + 40 * ks, sy + 10 * ks], x: f.x, y: f.y }); }
  sortDrawables(list);
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

  // dym z kominów i otworów dymnych: kotwice zapisane w sprite'ie (spr.smoke), emisja tylko dla widocznych budynków
  for (const it of list) if (it.o && it.o.smoke && it.o.smoke.length) {
    const o = it.o; o.nextPuff = o.nextPuff || o.smoke.map(() => Math.random() * 0.8);
    o.smoke.forEach((a, n) => { o.nextPuff[n] -= dt; if (o.nextPuff[n] < 0) { o.nextPuff[n] += 0.5 + Math.random() * 0.25; smoke.push({ x: o.x + a[0], y: o.y + a[1], z: a[2], a: 0, ph: Math.random() * TAU }); } });
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

/* siatka pól + ślady budynków (przełącznik G / przycisk) — pokazuje obrys każdego budynku w polach (np. 2×3, 4×4) */
function drawGrid(k) {
  const W = cv.width, H = cv.height, inv = (sx, sy) => { const X = (sx - VX) / k, Y = (sy - VY) / k, u = (X - GX) / AX, v = (Y - GY) / AY; return [(u + v) / 2, (v - u) / 2]; };
  const cs = [inv(0, 0), inv(W, 0), inv(0, H), inv(W, H)], xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
  const i0 = Math.floor(Math.min(...xs)), i1 = Math.ceil(Math.max(...xs)), j0 = Math.floor(Math.min(...ys)), j1 = Math.ceil(Math.max(...ys));
  const diamond = (i, j, w, h) => { ctx.beginPath(); for (const [x, y] of [[i, j], [i + w, j], [i + w, j + h], [i, j + h]]) { const [sx, sy] = toScr(x, y); ctx.lineTo(sx, sy); } ctx.closePath(); };
  ctx.save(); ctx.lineWidth = Math.max(1, dpr); ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (i < 0 || j < 0 || i >= MAP_W || j >= MAP_H) continue; diamond(i, j, 1, 1); ctx.stroke(); }
  ctx.lineWidth = Math.max(2, 2 * dpr); ctx.strokeStyle = 'rgba(255,214,70,0.95)'; ctx.fillStyle = 'rgba(255,214,70,0.12)'; ctx.font = `${Math.round(13 * dpr)}px monospace`; ctx.textAlign = 'center';
  for (const [i, j, w, h] of FOOT) { diamond(i, j, w, h); ctx.fill(); ctx.stroke(); const [cx, cy] = toScr(i + w / 2, j + h / 2); ctx.fillStyle = 'rgba(255,240,170,0.95)'; ctx.fillText(w + '×' + h, cx, cy); ctx.fillStyle = 'rgba(255,214,70,0.12)'; }
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

/* arkusze sprite'ów do oględzin: ?sprite=a,b&zs=3 (wybrane budynki), #sheet-b-… (wszystkie budynki), #sheet-n (przyroda), #sheet-f (postacie) */
function sheetFrame() {
  const W = cv.width, H = cv.height, mode = (location.hash.match(/sheet-(\w)/) || [])[1] || 'b', Z = parseFloat((location.hash.match(/-([\d.]+)$/) || [])[1] || '1') * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const bg = new Scene(W, H, W / 2, 20, { R: 1, ground: true }); bg.decal('grass', 'green', null); bg.decal('grassDetail', null, null, { alpha: 0.34 }); ctx.drawImage(bg.pcv, 0, 0, W, H);
  const draw = (spr, cx, cy, z, layers) => { for (const l of layers) if (spr[l]) ctx.drawImage(lodPick(spr[l], layerR(spr, l) / z), cx - spr.ax * z, cy - spr.ay * z, spr.w * z, spr.h * z); };
  if (QS.get('sprite')) {
    const names = QS.get('sprite').split(','), zs = parseFloat(QS.get('zs') || '2') * dpr, cw = W / names.length;
    names.forEach((n, i) => { const spr = SPR[n]; if (spr) draw(spr, (i + 0.5) * cw, H * (parseFloat(QS.get('y') || '0.82')), zs, ['p', 'u', 'c']); });
    return;
  }
  if (mode === 'r') {                                                  // porównanie rozmiarów: budynki nacji (katalog z gry) w jednej skali, z obrysem w polach i podpisem; #sheet-r-franks = jedna nacja
    for (const id of ['cap', 'leg', 'st', 'ui']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const only = (location.hash.match(/sheet-r-([a-z]+)/) || [])[1], COLS = parseInt(QS.get('cols') || '6', 10), GAP = 34, lab = 34 * dpr, rows = [];
    for (const n of only ? [only] : Object.keys(NATIONS)) {
      const items = NATIONS[n].map(id => ({ id, k: spriteName(n, id), s: SPR[spriteName(n, id)], n })).filter(o => o.s);
      for (let i = 0; i < items.length; i += COLS) {
        const it = items.slice(i, i + COLS).map(o => ({ ...o, w: o.s.fw ? (o.s.fw + o.s.fh) * AX + 40 : o.s.w * 0.8, up: o.s.ay - 20, down: o.s.fw ? (o.s.fw + o.s.fh) / 2 * AY + 14 : o.s.h - o.s.ay }));
        rows.push({ title: i === 0 ? NATION_PL[n] : '', it, w: it.reduce((a, o) => a + o.w + GAP, GAP), up: Math.max(...it.map(o => o.up)), down: Math.max(...it.map(o => o.down)) });
      }
    }
    if (!rows.length) return;
    const z = Math.min(Z, (W * 0.98) / Math.max(...rows.map(r => r.w)), (H - rows.length * lab - 12 * dpr) / rows.reduce((a, r) => a + r.up + r.down, 0));
    const text = (t, x, y, px, bold, al = 'center') => { ctx.textAlign = al; ctx.font = `${bold ? 'bold ' : ''}${Math.round(px * dpr)}px Georgia, serif`; ctx.lineJoin = 'round'; ctx.lineWidth = 3.5 * dpr; ctx.strokeStyle = 'rgba(14,20,8,0.92)'; ctx.strokeText(t, x, y); ctx.fillStyle = '#f6ecd0'; ctx.fillText(t, x, y); };
    let y = 8 * dpr + 24 * z;
    for (const r of rows) {
      const base = y + r.up * z; let x = (W - (r.w * z)) / 2 + GAP * z;
      if (r.title) text(r.title, 14 * dpr, y + 20 * dpr, 17, true, 'left');
      for (const o of r.it) {
        const cx = x + o.w * z / 2, s = o.s, fw = s.fw || 0, fh = s.fh || 0;
        for (const l of ['p', 'u']) if (s[l]) ctx.drawImage(lodPick(s[l], layerR(s, l) / z), cx - s.ax * z, base - s.ay * z, s.w * z, s.h * z);
        if (fw) {
          const c = [[fw / 2, fh / 2], [fw / 2, -fh / 2], [-fw / 2, -fh / 2], [-fw / 2, fh / 2]].map(([a, b]) => [cx + (a - b) * AX * z, base + (a + b) * AY * z]);
          ctx.beginPath(); c.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fillStyle = 'rgba(255,214,70,0.13)'; ctx.fill(); ctx.lineWidth = 2 * dpr; ctx.strokeStyle = 'rgba(255,214,70,0.9)'; ctx.stroke();
        }
        if (s.c) ctx.drawImage(lodPick(s.c, layerR(s, 'c') / z), cx - s.ax * z, base - s.ay * z, s.w * z, s.h * z);
        text(nameOfBuilding(o.n, o.id) + (fw ? ' · ' + fw + '×' + fh : ''), cx, base + r.down * z + 22 * dpr, 15, false);
        x += (o.w + GAP) * z;
      }
      y += (r.up + r.down) * z + lab;
    }
    return;
  }
  if (mode === 'b') {
    const items = Object.keys(SPR), cols = Math.ceil(Math.sqrt(items.length * W / H)), rows = Math.ceil(items.length / cols), cw = W / cols, ch = H / rows;
    items.forEach((n, i) => { const spr = SPR[n], z = Math.min(Z * 0.5, cw * 0.95 / spr.w, ch * 0.95 / (spr.h - spr.ay * 0.0)); draw(spr, (i % cols + 0.5) * cw, Math.floor(i / cols) * ch + ch * 0.8, z, ['p', 'u', 'c']); });
  } else if (mode === 'a') {                                          // zwierzęta: każdy rodzaj w poziomym rzędzie klatek (chód, postój, padnięcie, lot), obok osoba i pole 1×1 dla skali; #sheet-a-2 = skala 2×
    for (const id of ['cap', 'leg', 'st', 'ui']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const kinds = Object.keys(SETS.fauna), lab = (t, x, y, px, al = 'left') => { ctx.textAlign = al; ctx.font = `${Math.round(px * dpr)}px Georgia, serif`; ctx.lineJoin = 'round'; ctx.lineWidth = 3 * dpr; ctx.strokeStyle = 'rgba(14,20,8,0.92)'; ctx.strokeText(t, x, y); ctx.fillStyle = '#f6ecd0'; ctx.fillText(t, x, y); };
    const person = SETS.cast[Object.keys(SETS.cast)[0]].front[0], pad = 10 * dpr, z = Z * 0.5 * 2;
    let x = pad, y = 30 * dpr, rowH = 0;
    const blocks = kinds.map(k => { const fs = SETS.fauna[k], fr = [...fs.walk, ...fs.idle, ...(fs.dead || []), ...(fs.fly || [])], w = fr.reduce((a, f) => a + f.w * z + 6 * dpr, 0), up = Math.max(...fr.map(f => f.ay * z)), dn = Math.max(...fr.map(f => (f.h - f.ay) * z)); return { k, fs, fr, w, up, dn }; });
    const refW = 70 * z * 0.6 + 2 * AX * z * 0.5 + pad;
    // wzorzec skali: pole 1×1 (romb 128×64) z osobą
    { const bx = x + AX * z * 0.5 + 6 * dpr, by = y + 60 * z * 0.55; ctx.beginPath(); ctx.moveTo(bx, by - AY * z * 0.5); ctx.lineTo(bx + AX * z * 0.5, by); ctx.lineTo(bx, by + AY * z * 0.5); ctx.lineTo(bx - AX * z * 0.5, by); ctx.closePath(); ctx.fillStyle = 'rgba(255,214,70,0.13)'; ctx.fill(); ctx.lineWidth = 1.5 * dpr; ctx.strokeStyle = 'rgba(255,214,70,0.9)'; ctx.stroke();
      draw(person, bx, by, z, ['u', 'c']); lab('pole 1×1 + osoba', x, by + AY * z * 0.5 + 18 * dpr, 12); x += AX * z + pad * 2; rowH = by + AY * z * 0.5 + 24 * dpr - y; }
    for (const b of blocks) {
      if (x + b.w > W - pad) { x = pad; y += rowH + 30 * dpr; rowH = 0; }
      const base = y + 20 * dpr + b.up + (b.fs.fly ? 36 * z * 0.5 : 0);
      lab(b.fs.pl + ' (' + b.k + ')', x, y + 10 * dpr, 13);
      let cx = x;
      b.fr.forEach(f => { const fl = b.fs.fly && b.fs.fly.includes(f), alt = fl ? 30 * z * 0.5 : 0; cx += f.ax * z; draw(f, cx, base, z, ['u']); draw(f, cx, base - alt, z, ['c']); cx += (f.w - f.ax) * z + 6 * dpr; });
      rowH = Math.max(rowH, base - y + b.dn + 6 * dpr); x += b.w + pad * 2;
    }
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
  await bakeAll();
  const sheet = location.hash.startsWith('#sheet') || QS.has('sprite');
  if (!sheet) {
    WORLD = layoutWorld();
    // wypiek widocznych kafli terenu przed pierwszą klatką
    const tc0 = performance.now(), k = kk(), W = cv.width, H = cv.height, vx = W / 2 - cam.x * k, vy = H / 2 - cam.y * k;
    TOTAL += 0; for (let j = Math.floor((-vy / k) / CH); j <= Math.floor(((H - vy) / k) / CH); j++) for (let i = Math.floor((-vx / k) / CH); i <= Math.floor(((W - vx) / k) / CH); i++) await step('Teren', () => chunkOf(i, j));
    tmark('teren(kafle)', tc0);
  }
  BAKE_MS = performance.now() - t0; window.__bakeMs = BAKE_MS; window.__parts = PARTS;
  document.getElementById('bake').textContent = `Wypiek: ${BAKE_MS.toFixed(0)} ms · rozdzielczość ×${RES} · ${innerWidth}×${innerHeight} @${dpr}`;
  const ld = document.getElementById('load'); if (ld) ld.style.display = 'none';
  if (sheet) { sheetFrame(); window.__catalog = catalogJSON; window.__ready = true; return; }
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
  const home = () => { cam.x = bx(11.0, 7.6); cam.y = by(11.0, 7.6); };
  const act = { zin: () => setZoom(zoom * 1.25), zout: () => setZoom(zoom / 1.25), zreset: () => { setZoom(ZDEF); home(); clampCam(); }, grid: () => { gridOn = !gridOn; updateUI(); } };
  for (const id of Object.keys(act)) { const el = document.getElementById(id); if (el) el.addEventListener('click', act[id]); }
  addEventListener('keydown', e => { if (e.key === '+' || e.key === '=') act.zin(); else if (e.key === '-') act.zout(); else if (e.key === '0') act.zreset(); else if (e.key === 'g' || e.key === 'G') act.grid(); });
  const cx = parseFloat(QS.get('cx')), cy = parseFloat(QS.get('cy')); if (!isNaN(cx) && !isNaN(cy)) { cam.x = bx(cx, cy); cam.y = by(cx, cy); clampCam(); }
  updateUI();
  let last = performance.now(), T = 0, frames = 0, fpsT = 0;
  const loop = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt;
    update(dt); drawFrame(T, dt);
    frames++; fpsT += dt; if (fpsT > 1) { document.getElementById('fps').textContent = Math.round(frames / fpsT) + ' FPS'; frames = 0; fpsT = 0; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__setZoom = z => setZoom(z); window.__catalog = catalogJSON; window.__ready = true;
}
boot().catch(e => { const t = document.getElementById('ltxt'); if (t) t.textContent = 'Błąd: ' + e.message; console.error(e); });
