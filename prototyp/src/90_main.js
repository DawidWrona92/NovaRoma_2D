/* ====================== SCENA POKAZOWA ====================== */
const GW = 1800, GH = 1000, WCX = 7.6, WCY = 7.4;                 // płótno terenu (px wypieku) i punkt świata w jego środku
const GX = GW / 2 - (WCX - WCY) * AX, GY = GH / 2 - (WCX + WCY) * AY;

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
    const hw = w * (0.78 + 0.34 * (Math.sin(i * 0.55 + seed) * 0.5 + 0.5)) / 2;
    L.push([p[0] - dy * hw, p[1] + dx * hw]); R.push([p[0] + dy * hw, p[1] - dx * hw]);
  });
  return L.concat(R.reverse());
}
function distToPath(x, y, path) {
  let best = 1e9;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
  }
  return best;
}

const LAKE = [blob(11.7, 2.4, 2.3, 1.55, 3, 56, 0.2), blob(9.9, 3.3, 1.3, 1.0, 5, 40, 0.22), blob(13.3, 3.5, 1.2, 1.0, 8, 40, 0.22)];
const SAND = [blob(12.2, 8.6, 3.6, 2.7, 12, 56, 0.2), blob(14.4, 7.4, 1.8, 1.5, 14, 40, 0.2), blob(12.0, 11.0, 2.4, 1.6, 15, 40, 0.2)];
const FLOOR = [blob(2.4, 2.9, 3.0, 2.4, 20), blob(6.4, 1.2, 2.6, 1.2, 22), blob(1.3, 6.0, 1.6, 1.3, 23)];
const quad = (cx, cy, w, h, j = 0.06) => { const r = rng(Math.round(cx * 31 + cy * 17)); return [[cx - w / 2 + (r() - 0.5) * j, cy - h / 2 + (r() - 0.5) * j], [cx + w / 2 + (r() - 0.5) * j, cy - h / 2 + (r() - 0.5) * j], [cx + w / 2 + (r() - 0.5) * j, cy + h / 2 + (r() - 0.5) * j], [cx - w / 2 + (r() - 0.5) * j, cy + h / 2 + (r() - 0.5) * j]]; };
const FIELDS = [['wheat', quad(5.6, 10.7, 2.7, 1.6)], ['green', quad(8.4, 11.0, 2.4, 1.6)], ['plow', quad(3.4, 11.8, 2.2, 1.5)], ['wheat', quad(7.0, 12.8, 2.6, 1.3)]];
const ROADS = [
  [[1.2, 7.7], [2.8, 7.5], [4.4, 7.3], [6.0, 7.1], [7.6, 7.0], [9.2, 7.9], [10.9, 8.9], [12.6, 9.5], [14.6, 10.0]],
  [[7.6, 7.0], [7.8, 5.8], [7.6, 4.6]],
  [[4.4, 7.3], [4.2, 8.6], [3.6, 9.8]],
  [[10.9, 8.9], [11.4, 10.2], [11.8, 11.4]]
];
const ROADPATHS = ROADS.map(r => catmull(r, 6));
const LAKE_FAR = LAKE.map(b => growPoly(b, 0.9));

/* ---------- teren ---------- */
function buildGround() {
  const g = new Scene(GW, GH, GX, GY), P = g.pg;
  g.decal('grass', 'green', null);
  g.decal('grassDetail', null, null, { alpha: 0.34 });
  for (const [kind, poly] of FIELDS) { g.decal('dirt', '#6a4e2c', [growPoly(poly, 0.12)], { feather: 6, alpha: 0.9 }); g.decal('field', kind, [poly], { feather: 0 }); }
  g.decal('grass', 'tundra', FLOOR, { feather: 46, alpha: 0.55 });                     // ściółka leśna
  g.decal('grass', 'sand', SAND, { feather: 34 });                                      // przejście łąka → piasek (Saraceni)
  g.decal('grass', 'sand', LAKE.map(b => growPoly(b, 0.62)), { feather: 22 });          // plaża
  g.flat(LAKE.map(b => growPoly(b, 0.2)), 'rgba(92,70,40,0.38)', 10);                  // mokry piasek
  // piana: szeroki obrys pod wodą — woda przykrywa jego wewnętrzną połowę (także linie między zlewającymi się odnogami)
  P.save(); P.lineJoin = 'round';
  for (const poly of LAKE) {
    P.strokeStyle = 'rgba(240,252,253,0.6)'; P.lineWidth = 9; P.shadowColor = 'rgba(230,250,255,0.9)'; P.shadowBlur = 10; P.beginPath();
    poly.forEach(([x, y], i) => { const p = g.P(x, y, 0); i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]); }); P.closePath(); P.stroke();
  }
  P.restore();
  g.decal('water', null, LAKE, { feather: 3 });
  g.flat(LAKE.map(b => growPoly(b, -0.5)), 'rgba(8,52,84,0.5)', 26);                   // głębia
  for (const road of ROADS) g.decal('dirt', '#8a6e40', [ribbon(road, 0.8, road[0][0])], { feather: 8, alpha: 0.96 });
  P.save(); P.strokeStyle = 'rgba(40,26,8,0.55)'; P.lineWidth = 2.2; P.lineJoin = 'round';
  for (const [, poly] of FIELDS) { P.beginPath(); poly.forEach(([x, y], i) => { const p = g.P(x, y, 0); i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]); }); P.closePath(); P.stroke(); }
  P.restore();
  const clip = new Path2D();
  for (const poly of LAKE) { poly.forEach(([x, y], i) => { const p = g.P(x, y, 0); i ? clip.lineTo(p[0], p[1]) : clip.moveTo(p[0], p[1]); }); clip.closePath(); }
  return { g, clip };
}

/* ---------- budowa listy obiektów ---------- */
const SPR = {}, TREE_SETS = {};
const BS = 1.7, TS = 0.8;            // skala budynków i drzew względem bazowego wypieku
function buildWorld() {
  const sp = SPR; Object.assign(sp, {
    slavHut: BAKED.slavHut(), frankHouse: BAKED.frankHouse(), tower: BAKED.stoneTower(), saracenHouse: BAKED.saracenHouse(), mosque: BAKED.mosque(),
    hay: BAKED.hay(), logs: BAKED.logs(), well: BAKED.well(), longhouse: BAKED.longhouse(), longship: BAKED.longship()
  });
  const oaks = [1, 2, 3, 4, 5].map(i => TREES.oak(100 + i)), pines = [1, 2, 3, 4].map(i => TREES.pine(200 + i)), palms = [1, 2, 3].map(i => TREES.palm(300 + i));
  const rocks = [1, 2, 3, 4].map(i => bakeRock(400 + i)), tufts = [1, 2, 3, 4].map(i => bakeTuft(500 + i, 'green')), sandTufts = [1, 2, 3].map(i => bakeTuft(600 + i, 'sand'));
  const figs = {
    slav: [0, 1].map(i => bakeFigure({ body: hex('#9a7a48'), trim: hex('#a8382c'), hair: hex('#6a4a24') }, 700 + i, { step: i ? 3 : -3, basket: true })),
    frank: [0, 1].map(i => bakeFigure({ body: hex('#2f5aa8'), trim: hex('#e0b840'), hair: hex('#3a2a1a') }, 710 + i, { step: i ? 3 : -3, hood: true, spear: true })),
    saracen: [0, 1].map(i => bakeFigure({ body: hex('#ece3cc'), trim: hex('#b8352b'), hair: hex('#2a1c10') }, 720 + i, { step: i ? 3 : -3, turban: true }))
  };
  TREE_SETS.oaks = oaks; TREE_SETS.pines = pines; TREE_SETS.palms = palms; TREE_SETS.rocks = rocks; TREE_SETS.figs = figs;
  const objs = [], B = [];
  const add = (spr, x, y, o = {}) => { const ob = { spr, x, y, k: o.k ?? 1, sway: o.sway || 0, ph: o.ph ?? 0, smoke: o.smoke, bob: o.bob || 0 }; objs.push(ob); return ob; };
  const bld = (spr, x, y, o = {}) => { B.push([x, y]); return add(spr, x, y, Object.assign({ k: BS }, o)); };

  // wieś słowiańska
  bld(sp.slavHut, 2.5, 5.9, { smoke: [0.05, 0, 0.84] }); bld(sp.slavHut, 5.0, 5.7, { smoke: [0.05, 0, 0.84] }); bld(sp.slavHut, 2.6, 9.3, { smoke: [0.05, 0, 0.84] });
  add(sp.hay, 5.1, 9.0, { k: BS }); add(sp.hay, 5.7, 9.3, { k: BS }); add(sp.logs, 0.9, 6.7, { k: BS }); add(sp.well, 3.9, 8.05, { k: BS }); add(sp.hay, 1.6, 7.9, { k: BS });
  // Frankowie
  bld(sp.frankHouse, 7.3, 5.2, { smoke: [0.15, -0.1, 0.98] }); bld(sp.frankHouse, 9.7, 5.8, { smoke: [0.15, -0.1, 0.98] }); bld(sp.tower, 6.0, 3.1);
  // Wikingowie
  bld(sp.longhouse, 14.9, 6.2, { smoke: [0.0, 0, 0.9] });
  add(sp.longship, 11.1, 2.6, { k: 1.45, bob: 1 });
  // Saraceni
  bld(sp.saracenHouse, 11.6, 6.8); bld(sp.mosque, 13.9, 8.0); bld(sp.saracenHouse, 11.9, 10.8); bld(sp.saracenHouse, 14.4, 10.9);

  const lakeNear = (x, y) => LAKE.some(p => inPoly(x, y, growPoly(p, 0.55)));
  const free = (x, y, dBld = 1.6, dRoad = 0.7) => !lakeNear(x, y) && !FIELDS.some(([, q]) => inPoly(x, y, growPoly(q, 0.5))) && B.every(([bx, by]) => Math.hypot(bx - x, by - y) > dBld) && ROADPATHS.every(p => distToPath(x, y, p) > dRoad);
  const taken = [];
  const spread = (n, cx, cy, rx, ry, seed, pick, o = {}) => {
    const r = rng(seed); let tries = 0, placed = 0;
    while (placed < n && tries++ < n * 60) {
      const a = r() * TAU, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
      if (x < 0.1 || y < 0.1 || x > 17 || y > 15) continue;
      if (!free(x, y, o.dB ?? 1.6, o.dR ?? 0.7)) continue;
      if (taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < (o.dMin ?? 0.62))) continue;
      taken.push([x, y]); const k = pick(r); add(k.spr, x, y, { k: k.k ?? 1, sway: k.sway ?? 0, ph: r() * TAU }); placed++;
    }
  };
  const T = (arr, kmin, kmax, sway = 1) => r => ({ spr: arr[(r() * arr.length) | 0], k: kmin + r() * (kmax - kmin), sway });
  const TT = (arr, a, b, sw = 1) => r => ({ spr: arr[(r() * arr.length) | 0], k: TS * (a + r() * (b - a)), sway: sw });
  spread(20, 2.4, 2.7, 2.7, 2.2, 31, r => r() < 0.55 ? TT(oaks, 0.85, 1.05)(r) : TT(pines, 0.75, 0.95)(r), { dB: 2.0 });  // las NW
  spread(12, 6.8, 1.0, 3.0, 0.9, 32, TT(pines, 0.75, 0.95), { dB: 1.9 });                                                  // las N
  spread(7, 0.4, 6.4, 0.9, 2.0, 33, TT(oaks, 0.8, 1.0), { dMin: 0.9, dB: 1.8 });
  spread(6, 0.8, 10.8, 1.4, 1.6, 34, TT(oaks, 0.8, 1.0), { dMin: 0.9, dB: 1.8 });
  spread(4, 17.2, 9.0, 0.7, 1.4, 35, TT(oaks, 0.75, 0.95), { dMin: 0.9, dB: 1.9 });
  spread(4, 9.8, 14.2, 2.4, 0.8, 36, TT(oaks, 0.8, 1.0), { dMin: 0.9, dB: 1.8 });
  spread(5, 16.0, 11.8, 1.2, 1.4, 37, TT(palms, 0.8, 0.95), { dMin: 1.1, dB: 1.8 });
  spread(3, 9.2, 9.4, 0.8, 0.8, 38, TT(palms, 0.8, 0.95), { dMin: 1.1, dB: 1.9 });
  spread(3, 15.6, 7.0, 0.5, 1.0, 39, TT(palms, 0.8, 0.95), { dMin: 1.1, dB: 1.8 });
  spread(4, 10.9, 4.9, 1.6, 0.5, 44, TT(oaks, 0.7, 0.85), { dMin: 0.9, dB: 1.8 });
  // skały i kępy trawy
  spread(5, 9.6, 4.6, 3.4, 0.8, 40, r => ({ spr: rocks[(r() * 4) | 0], k: 0.62 + r() * 0.4 }), { dMin: 0.7, dB: 1.3 });
  spread(4, 8.0, 13.6, 4.0, 0.9, 41, r => ({ spr: rocks[(r() * 4) | 0], k: 0.62 + r() * 0.4 }), { dMin: 0.7, dB: 1.3 });
  spread(90, 8.0, 8.4, 8.0, 6.0, 42, r => ({ spr: tufts[(r() * 4) | 0], k: 0.6 + r() * 0.5 }), { dMin: 0.4, dB: 1.1, dR: 0.55 });
  spread(30, 12.6, 9.2, 3.2, 2.6, 43, r => ({ spr: sandTufts[(r() * 3) | 0], k: 0.6 + r() * 0.5 }), { dMin: 0.45, dB: 1.1, dR: 0.55 });

  // mieszkańcy
  const figsL = [];
  const fig = (set, path, speed, t0 = 0) => figsL.push({ set: figs[set], path, speed, t: t0, x: path[0][0], y: path[0][1], dir: 1 });
  fig('slav', [[3.0, 7.3], [4.4, 7.3], [5.4, 7.0]], 0.35, 0); fig('slav', [[2.4, 7.0], [2.9, 8.5], [3.6, 8.8]], 0.3, 2.5);
  fig('frank', [[6.0, 6.7], [7.8, 6.55], [9.0, 6.9]], 0.4, 1); fig('frank', [[7.9, 6.3], [7.7, 5.0]], 0.28, 0);
  fig('saracen', [[10.4, 7.5], [11.4, 8.1], [12.4, 8.5]], 0.32, 0.5); fig('saracen', [[9.7, 7.0], [10.6, 7.6]], 0.25, 3);
  return { objs, figs: figsL, lakeClip: null };
}

/* place i cienie obiektów nieruchomych wypiekane raz do warstwy terenu (w grze: do kafli terenu, odświeżanych tylko po zmianie) */
function bakeStaticLayers() {
  const g = GROUND.g, c = g.pg;
  for (const l of ['p', 'u']) for (const o of WORLD.objs) {
    const im = o.spr[l]; if (!im) continue;
    const [X, Y] = g.P(o.x, o.y, 0);
    c.drawImage(im, X - o.spr.ax * o.k, Y - o.spr.ay * o.k, im.width * o.k, im.height * o.k);
  }
}

/* ---------- renderer ---------- */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let dpr = 1, zoom = 1.6, pan = { x: 0, y: 0 }, GROUND, WORLD, BAKE_MS = 0;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
}
const kk = () => zoom / S * dpr;
const bakeToScr = (bx, by) => { const k = kk(); return [cv.width / 2 + (bx - GW / 2) * k + pan.x * dpr, cv.height / 2 + (by - GH / 2) * k + pan.y * dpr]; };
const toScr = (x, y, z = 0) => bakeToScr((x - y) * AX + GX, (x + y) * AY - z * VH + GY);

const smoke = [];
function drawFrame(t, dt) {
  const k = kk(), MK = drawFrame.marks = [], mk = n => { if (window.__perf) ctx.getImageData(0, 0, 1, 1); MK.push([n, performance.now()]); };
  mk('start');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2d4a22'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const [gx, gy] = bakeToScr(0, 0);
  ctx.drawImage(GROUND.g.pcv, gx, gy, GW * k, GH * k);
  mk('teren');
  // ruch wody: nałożony drugi, przesuwany wzór fal
  const wm = tex('water'), K = wm.ppu;
  if (!drawFrame.wp) drawFrame.wp = ctx.createPattern(wm.c, 'repeat');
  ctx.save();
  ctx.setTransform(k, 0, 0, k, gx, gy); ctx.clip(GROUND.clip);
  const ox = gx + GX * k + (t * 0.05 % 4) * K * AX / K * k, oy = gy + GY * k + (t * 0.03 % 4) * K * AY / K * k;
  ctx.setTransform(k * AX / K, k * AY / K, -k * AX / K, k * AY / K, ox, oy);
  ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = drawFrame.wp;
  const R = 30 * K; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  ctx.restore();

  mk('woda');
  // przebieg „ziemia": place, potem cienie
  const place = (spr, x, y, kk2, layer) => {
    const [sx, sy] = toScr(x, y), im = spr[layer]; if (!im) return;
    ctx.drawImage(im, sx - spr.ax * k * kk2, sy - spr.ay * k * kk2, im.width * k * kk2, im.height * k * kk2);
  };
  const FK = 0.78;
  for (const f of WORLD.figs) place(f.set[0], f.x, f.y, FK, 'u');

  mk('place+cienie');
  // przebieg „obiekty" posortowane po głębokości
  const list = WORLD.objs.map(o => ({ d: o.x + o.y, o })).concat(WORLD.figs.map(f => ({ d: f.x + f.y, f })));
  list.sort((a, b) => a.d - b.d);
  for (const it of list) {
    if (it.o) {
      const o = it.o, [sx, sy] = toScr(o.x, o.y), im = o.spr.c, w = im.width * k * o.k, h = im.height * k * o.k;
      if (o.bob) {
        const by = Math.sin(t * 1.4 + o.x) * 1.6 * k, rot = Math.sin(t * 1.1 + 1) * 0.012, ax0 = sx, ay0 = sy;
        ctx.setTransform(Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), ax0 - Math.cos(rot) * ax0 + Math.sin(rot) * ay0, ay0 - Math.sin(rot) * ax0 - Math.cos(rot) * ay0 + by);
        ctx.drawImage(im, sx - o.spr.ax * k * o.k, sy - o.spr.ay * k * o.k, w, h); ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (o.sway) {
        const s = (Math.sin(t * 1.25 + o.ph) * 0.010 + Math.sin(t * 0.43 + o.ph * 1.7) * 0.008) * o.sway;
        ctx.setTransform(1, 0, -s, 1, s * sy, 0);
        ctx.drawImage(im, sx - o.spr.ax * k * o.k, sy - o.spr.ay * k * o.k, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else ctx.drawImage(im, sx - o.spr.ax * k * o.k, sy - o.spr.ay * k * o.k, w, h);
    } else {
      const f = it.f, [sx, sy] = toScr(f.x, f.y), spr = f.set[Math.floor(f.t * 4) % 2], bob = Math.abs(Math.sin(f.t * 4 * Math.PI)) * 1.4 * k;
      ctx.save(); ctx.translate(sx, sy - bob); ctx.scale(f.dir * FK * k, FK * k);
      ctx.drawImage(spr.c, -spr.ax, -spr.ay); ctx.restore();
    }
  }

  mk('obiekty');
  // dym z kominów
  for (const o of WORLD.objs) if (o.smoke) {
    o.nextPuff = (o.nextPuff ?? Math.random() * 0.6) - dt;
    if (o.nextPuff < 0) { o.nextPuff += 0.45 + Math.random() * 0.2; smoke.push({ x: o.x + o.smoke[0] * o.k, y: o.y + o.smoke[1] * o.k, z: o.smoke[2] * o.k, a: 0, ph: Math.random() * TAU }); }
  }
  for (let i = smoke.length - 1; i >= 0; i--) {
    const p = smoke[i]; p.a += dt; p.z += dt * 0.3; p.x += dt * 0.12; p.y -= dt * 0.05;
    if (p.a > 4) { smoke.splice(i, 1); continue; }
    const [sx, sy] = toScr(p.x + Math.sin(p.a * 1.6 + p.ph) * 0.03, p.y, p.z), u = p.a / 4, rad = (5 + u * 17) * k * S * 0.6;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad); const al = (1 - u) * 0.62 * Math.min(1, p.a * 3);
    gr.addColorStop(0, `rgba(214,210,204,${al})`); gr.addColorStop(0.55, `rgba(206,202,196,${al * 0.55})`); gr.addColorStop(1, 'rgba(200,196,190,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(sx, sy, rad, 0, TAU); ctx.fill();
  }

  // delikatny „grading": ciepłe światło z lewej-góry, chłodniejszy dół, winieta — jedna warstwa w pamięci podręcznej (bez mieszania na pełnym ekranie co klatkę)
  const W = cv.width, H = cv.height;
  if (!drawFrame.grade || drawFrame.grade.width !== W || drawFrame.grade.height !== H) {
    const gc = newCanvas(W, H), g = gc.getContext('2d');
    let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,214,130,0.12)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(60,80,150,0.10)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78); gr.addColorStop(0, 'rgba(10,16,4,0)'); gr.addColorStop(1, 'rgba(10,16,4,0.42)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    drawFrame.grade = gc;
  }
  ctx.drawImage(drawFrame.grade, 0, 0);
  mk('dym+grading');
}

function update(dt) {
  for (const f of WORLD.figs) {
    f.t += dt;
    // wędrówka tam i z powrotem po łamanej
    const segs = []; let L = 0;
    for (let i = 0; i < f.path.length - 1; i++) { const l = Math.hypot(f.path[i + 1][0] - f.path[i][0], f.path[i + 1][1] - f.path[i][1]); segs.push(l); L += l; }
    f.s = (f.s ?? 0) + dt * f.speed * (f.back ? -1 : 1);
    if (f.s > L) { f.s = L; f.back = true; } else if (f.s < 0) { f.s = 0; f.back = false; }
    let s = f.s, i = 0; while (i < segs.length - 1 && s > segs[i]) { s -= segs[i]; i++; }
    const a = f.path[i], b = f.path[i + 1], u = clamp(s / segs[i], 0, 1), px = f.x, py = f.y;
    f.x = lerp(a[0], b[0], u); f.y = lerp(a[1], b[1], u);
    const sdx = (f.x - f.y) - (px - py); if (Math.abs(sdx) > 1e-5) f.dir = sdx < 0 ? -1 : 1;
  }
}

function sheetFrame() {
  const W = cv.width, H = cv.height, mode = (location.hash.match(/sheet-(\w)/) || [])[1] || 'b', Z = parseFloat((location.hash.match(/-([\d.]+)$/) || [])[1] || '2.2'), k = Z * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (!sheetFrame.bg) { const sc = new Scene(W, H, W / 2, 20); sc.decal('grass', 'green', null); sc.decal('grassDetail', null, null, { alpha: 0.34 }); sheetFrame.bg = sc.pcv; }
  ctx.drawImage(sheetFrame.bg, 0, 0, W, H);
  const draw = (spr, cx, cy, z, layers) => { for (const l of layers) if (spr[l]) ctx.drawImage(spr[l], cx - spr.ax * z, cy - spr.ay * z, spr[l].width * z, spr[l].height * z); };
  if (mode === 'b') {
    const items = ['slavHut', 'frankHouse', 'tower', 'saracenHouse', 'mosque', 'longhouse', 'longship', 'well'], cols = 4, cw = W / cols, ch = H / 2;
    items.forEach((n, i) => draw(SPR[n], (i % cols + 0.5) * cw, Math.floor(i / cols) * ch + ch * 0.78, k * (i > 6 ? 1.6 : 1), ['p', 'u', 'c']));
  } else {
    const T = TREE_SETS, rows = [H * 0.3, H * 0.62, H * 0.93], row1 = [T.oaks[0], T.oaks[1], T.pines[0], T.pines[1]], row2 = [T.palms[0], T.palms[1], T.rocks[0], T.rocks[1]];
    row1.forEach((t, i) => draw(t, (i + 0.5) * W / 4, rows[0], k * 0.85, ['u', 'c']));
    row2.forEach((t, i) => draw(t, (i + 0.5) * W / 4, rows[1], k * 0.85, ['u', 'c']));
    const fs = [...T.figs.slav, ...T.figs.frank, ...T.figs.saracen];
    fs.forEach((t, i) => draw(t, (i + 0.5) * W / fs.length, rows[2], k * 1.5, ['u', 'c']));
  }
}

function boot() {
  const t0 = performance.now();
  GROUND = buildGround(); WORLD = buildWorld(); bakeStaticLayers();
  BAKE_MS = performance.now() - t0;
  window.__bakeMs = BAKE_MS;
  document.getElementById('bake').textContent = `Wypiek wszystkich sprite'ów i terenu: ${BAKE_MS.toFixed(0)} ms`;
  resize();
  addEventListener('resize', resize);
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX - pan.x, y: e.clientY - pan.y }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag) { pan.x = clamp(e.clientX - drag.x, -120, 120); pan.y = clamp(e.clientY - drag.y, -70, 70); } });
  cv.addEventListener('pointerup', () => { drag = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 1.0, 2.6); }, { passive: false });
  let last = performance.now(), T = 0, frames = 0, fpsT = 0;
  if (location.hash.startsWith('#sheet')) { sheetFrame(); window.__ready = true; return; }
  const loop = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt;
    update(dt); drawFrame(T, dt);
    frames++; fpsT += dt; if (fpsT > 1) { document.getElementById('fps').textContent = Math.round(frames / fpsT) + ' FPS'; frames = 0; fpsT = 0; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__setZoom = z => { zoom = z; }; window.__ready = true;
}
boot();
