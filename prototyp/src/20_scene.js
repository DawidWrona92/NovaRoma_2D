/* ====================== SCENA: RZUT, ŚCIANY, POŁACIE, CIENIE ======================
   Sprite budynku jest wypiekany raz z brył 3D: każda ściana i połać to równoległobok z teksturą nałożoną afinicznie
   (w rzucie ortogonalnym to dokładne odwzorowanie), oświetlony z lewej góry.
   Układ współrzędnych: środek pola = (0,0), x rośnie w prawo-dół ekranu, y w lewo-dół, z w górę (1 jednostka = 1 pole).
   Dwa niezależne mnożniki:
     F   — skala geometrii sprite'a (żeby budynek wypełniał swoje pole; tekstury zachowują stałą gęstość na ekranie),
     RES — rozdzielczość wypieku (px na px logiczny); wszystko rysujemy w px logicznych pod macierzą RES. */
const S = 2;                       // 1 pole = 64·S px logicznych szerokości
const AX = 32 * S, AY = 16 * S;    // sx = (x−y)·AX, sy = (x+y)·AY
const VH = 39 * S;                 // px na jednostkę wysokości (rzut dimetryczny 2:1)
const LIGHT = { top: 1.0, south: 0.86, east: 0.6, roofS: 1.02, roofN: 0.78, roofE: 0.8, roofW: 1.0 };
const SHADOW_DIR = [0.62, 0.1];    // długość cienia (x,y) na jednostkę wysokości — pada w prawo-dół
let RES = 1;                       // ustawiane przy starcie (zależnie od DPR / parametru ?q=)
/* kontrola jakości (?lint=1): każdy sprite rejestruje bryły i elementy ścian; po wypieku powstaje lista ostrzeżeń (window.__lint):
   przenikanie brył, zła kolejność rysowania, okna poza ścianą / nachodzące na siebie / zbyt gęste, sprite obcięty przy krawędzi płótna */
const LINT = /[?&]lint=1/.test(SEARCH), LINT_LOG = []; let LINT_NAME = '';

function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}

/* głębokość zachodzenia dwóch otoczek wypukłych (listy punktów ekranu) w px — 0, gdy się nie stykają (test osi rozdzielających) */
function hullDepth(p, q, tol = 2) {
  let best = 1e9;
  for (const poly of [p, q]) for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], nx = b[1] - a[1], ny = a[0] - b[0], l = Math.hypot(nx, ny) || 1;
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (const t of p) { const d = (t[0] * nx + t[1] * ny) / l; if (d < a0) a0 = d; if (d > a1) a1 = d; }
    for (const t of q) { const d = (t[0] * nx + t[1] * ny) / l; if (d < b0) b0 = d; if (d > b1) b1 = d; }
    const ov = Math.min(a1, b1) - Math.max(a0, b0);
    if (ov <= tol) return 0;
    if (ov < best) best = ov;
  }
  return best;
}
const hullsOverlap = (p, q, tol = 2) => hullDepth(p, q, tol) > 0;

class Scene {
  /* w,h,ax,ay — wymiary i punkt zaczepienia w px logicznych przy F=1; o.F — skala geometrii; o.R — rozdzielczość; o.ground — tylko warstwa terenu */
  constructor(w, h, ax, ay, o = {}) {
    const F = this.F = o.F ?? 1, R = this.R = o.R ?? RES;
    this.Rp = o.pRes ?? (o.ground ? R : Math.min(R, 1)); this.Ru = Math.min(R, 1);                              // plac i cień są miękkie — wystarczy rozdzielczość 1
    this.w = Math.ceil(w * F); this.h = Math.ceil(h * F); this.ax = ax * F; this.ay = ay * F;       // wymiary logiczne
    this.pw = Math.ceil(this.w * R); this.ph = Math.ceil(this.h * R); this.fw = o.fw; this.fh = o.fh; this.smokes = []; this.doors = [];                // kotwice dymu: [x, y, z] w polach względem środka obrysu
    const mk = res => { const c = newCanvas(Math.ceil(this.w * res), Math.ceil(this.h * res)), g = c.getContext('2d'); g.setTransform(res, 0, 0, res, 0, 0); return [c, g]; };
    [this.pcv, this.pg] = mk(this.Rp);                                                               // warstwa 1: plac / decale terenu
    if (!o.ground) { [this.ucv, this.gu] = mk(this.Ru); [this.c, this.g] = mk(R); }                  // warstwa 2: cień rzucony; warstwa 3: obiekty
    this.pats = {}; this.wear = /[?&]nowear=1/.test(SEARCH) ? 0 : (o.wear ?? 1); this._wn = 0;                                           // natężenie zużycia (0 = czysto)
    this.vols = []; this.walls = new Map();                                                          // rejestry kontroli jakości (tylko przy ?lint=1)
  }
  /* ---------- kontrola jakości ---------- */
  regVol(kind, x0, y0, z0, x1, y1, z1, tag, nest) { if (LINT) this.vols.push({ kind, x0, y0, z0, x1, y1, z1, tag: tag || this.grpTag || '', nest: !!nest, i: this.vols.length, grp: this.grp ?? -1 }); }
  regRect(O, U, V, kind, u0, u1, v0, v1) {
    if (!LINT) return;
    const key = [...O, ...U, ...V].map(n => n.toFixed(3)).join(','); let w = this.walls.get(key);
    if (!w) { w = { O, lu: Math.hypot(...U), lv: Math.hypot(...V), it: [] }; this.walls.set(key, w); }
    w.it.push({ kind, u0, u1, v0, v1 });
  }
  lint(name, out) {
    const push = (kind, msg) => LINT_LOG.push({ b: name, kind, msg }), f = x => +x.toFixed(2), v = this.vols;
    const lbl = a => `${a.kind}#${a.i}${a.tag ? '[' + a.tag + ']' : ''}(${f(a.x0)},${f(a.y0)},${f(a.z0)}→${f(a.x1)},${f(a.y1)},${f(a.z1)})`;
    const hull = a => convexHull([a.x0, a.x1].flatMap(x => [a.y0, a.y1].flatMap(y => [a.z0, a.z1].map(z => this.P(x, y, z)))));
    v.forEach(a => { a.h = hull(a); });
    const allowed = (a, b) => { const k = [a.kind, b.kind].sort().join('+'); return k === 'box+roof' && (a.tag === 'komin' || b.tag === 'komin') || a.tag === 'ok' || b.tag === 'ok'; };
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
      const a = v[i], b = v[j]; if (a.nest || b.nest || (a.grp >= 0 && a.grp === b.grp)) continue;                  // części jednego węzła (słupki płotu, ramy) — budowa wewnętrzna
      const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0), eps = 0.015, thick = 0.045;                                                                 // przenikanie < 4,5 cm = złącze, nie błąd
      if (a.tag === b.tag && (a.tag === 'płot' || a.tag === 'palisada' || a.tag === 'mur')) continue;
      if (ox > thick && oy > thick && oz > thick) { if (!allowed(a, b)) push('przenikanie', `${lbl(a)} × ${lbl(b)} (${f(ox)}×${f(oy)}×${f(oz)})`); continue; }
      if (ox > eps && oy > eps && oz > eps) continue;                                                              // cienkie zachodzenie (złącze) — bez kontroli kolejności
      const front = (p, q) => p.x0 >= q.x1 - eps || p.y0 >= q.y1 - eps || p.z0 >= q.z1 - eps;                    // p bliżej widza niż q
      if (front(a, b) && !front(b, a) && hullsOverlap(a.h, b.h)) push('kolejność', `${lbl(a)} narysowane PRZED ${lbl(b)}, a stoi bliżej widza`);
    }
    if (this.fw && this.fh) for (const a of v) {                                                  // bryły poza obrysem budynku (kolidowałyby z sąsiadami)
      const hx = this.fw / 2, hy = this.fh / 2, t = a.kind === 'roof' ? 0.12 : 0.06;
      if (a.x0 < -hx - t || a.x1 > hx + t || a.y0 < -hy - t || a.y1 > hy + t) push('obrys', `${lbl(a)} wystaje poza obrys ${this.fw}×${this.fh}`);
    }
    for (const w of this.walls.values()) {
      const wins = w.it.filter(t => t.kind === 'okno'), tag = `ściana(${w.O.map(f).join(',')}; ${f(w.lu)}×${f(w.lv)})`;
      for (const t of w.it) if (t.u0 < -0.01 || t.u1 > w.lu + 0.01 || t.v0 < -0.01 || t.v1 > w.lv + 0.01) push('okna', `${tag}: ${t.kind} poza ścianą u ${f(t.u0)}…${f(t.u1)} v ${f(t.v0)}…${f(t.v1)}`);
      for (let i = 0; i < w.it.length; i++) for (let j = i + 1; j < w.it.length; j++) {
        const a = w.it[i], b = w.it[j]; if ((a.kind === 'kwiaty' && b.kind === 'okno') || (b.kind === 'kwiaty' && a.kind === 'okno')) continue;
        const ou = Math.min(a.u1, b.u1) - Math.max(a.u0, b.u0), ov = Math.min(a.v1, b.v1) - Math.max(a.v0, b.v0);
        if (ou > 0.01 && ov > 0.01) push('okna', `${tag}: ${a.kind} nachodzi na ${b.kind} (u ${f(Math.max(a.u0, b.u0))}…${f(Math.min(a.u1, b.u1))})`);
      }
      const occ = wins.reduce((s, t) => s + (t.u1 - t.u0), 0) / w.lu;
      if (wins.length > Math.max(2, Math.floor(w.lu / 0.5)) || occ > 0.5) push('gęstość', `${tag}: ${wins.length} okien, zajmują ${Math.round(occ * 100)}% szerokości ściany`);
    }
    if (out) {
      const g = out.getContext('2d'), W = out.width, H = out.height;
      for (const [nm, x, y, w, h] of [['góra', 0, 0, W, 2], ['dół', 0, H - 2, W, 2], ['lewa', 0, 0, 2, H], ['prawa', W - 2, 0, 2, H]]) { const d = g.getImageData(x, y, w, h).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 24) { push('obcięcie', `sprite dotyka krawędzi płótna: ${nm}`); break; } }
    }
  }
  P(x, y, z = 0) { const F = this.F; return [(x - y) * AX * F + this.ax, (x + y) * AY * F - z * VH * F + this.ay]; }
  pat(name, pal, ctx) {
    const k = name + '|' + (pal || '') + '|' + (ctx === this.gu ? 'u' : 'o');
    if (!this.pats[k]) { const t = tex(name, pal); this.pats[k] = { pat: (ctx || this.g).createPattern(t.c, 'repeat'), ppu: t.ppu }; }
    return this.pats[k];
  }

  /* równoległobok O + s·U + t·V pokryty teksturą; gęstość tekstury na ekranie jest stała niezależnie od F (K·F) */
  face(O, U, V, mat, o = {}) {
    const g = this.g, R = this.R, m = this.pat(mat, o.pal), lu = Math.hypot(...U), lv = Math.hypot(...V), K = (o.ppu || m.ppu) * this.F;
    const p0 = this.P(...O), pu = this.P(O[0] + U[0], O[1] + U[1], O[2] + U[2]), pv = this.P(O[0] + V[0], O[1] + V[1], O[2] + V[2]);
    const a = (pu[0] - p0[0]) / (lu * K), b = (pu[1] - p0[1]) / (lu * K), c = (pv[0] - p0[0]) / (lv * K), d = (pv[1] - p0[1]) / (lv * K);
    const sc = Math.hypot(a, b) || 1;
    g.save();
    g.setTransform(R * a, R * b, R * c, R * d, R * p0[0], R * p0[1]);
    const path = () => { g.beginPath(); if (o.clip) o.clip.forEach(([s, t], i) => g[i ? 'lineTo' : 'moveTo'](s * lu * K, t * lv * K)); else g.rect(0, 0, lu * K, lv * K); g.closePath(); };
    path();
    g.fillStyle = m.pat; g.fill();
    g.strokeStyle = m.pat; g.lineWidth = 1.1 / sc; g.stroke();        // zakładka — brak szwów między ścianami
    if (o.wear !== 0 && this.wear > 0) { wearFace(this, mat, o, lu * K, lv * K, K, sc, (++this._wn) * 7919 + Math.round(O[0] * 173 + O[1] * 379 + O[2] * 571) + 1000); path(); }   // zużycie zmienia bieżącą ścieżkę — odtwarzamy ścianę przed cieniowaniem
    const sh = o.shade ?? 1;
    if (sh < 1) { g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${255 * sh * 0.97 | 0},${255 * sh * 0.98 | 0},${255 * Math.min(1, sh * 1.03) | 0})`; g.fill(); }
    else if (sh > 1) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(1, (sh - 1) * 2.4); g.fillStyle = '#fff1c4'; g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    if (o.vgrad) { // zaciemnienie wzdłuż v (np. przy ziemi lub pod okapem)
      const gr = g.createLinearGradient(0, 0, 0, lv * K); o.vgrad.forEach(([t, al]) => gr.addColorStop(t, `rgba(12,8,4,${al})`));
      g.fillStyle = gr; g.fill();
    }
    if (o.ugrad) {
      const gr = g.createLinearGradient(0, 0, lu * K, 0); o.ugrad.forEach(([t, al]) => gr.addColorStop(t, `rgba(12,8,4,${al})`));
      g.fillStyle = gr; g.fill();
    }
    if (o.edge !== 0) { g.strokeStyle = `rgba(14,8,4,${o.edge ?? 0.3})`; g.lineWidth = 1.0 / sc; g.stroke(); }
    g.restore();
  }

  /* rysowanie 2D w układzie ściany: jednostki = jednostki świata (u wzdłuż U, v wzdłuż V) */
  local(O, U, V, fn) {
    const g = this.g, R = this.R, lu = Math.hypot(...U), lv = Math.hypot(...V);
    const p0 = this.P(...O), pu = this.P(O[0] + U[0], O[1] + U[1], O[2] + U[2]), pv = this.P(O[0] + V[0], O[1] + V[1], O[2] + V[2]);
    g.save();
    g.setTransform(R * (pu[0] - p0[0]) / lu, R * (pu[1] - p0[1]) / lu, R * (pv[0] - p0[0]) / lv, R * (pv[1] - p0[1]) / lv, R * p0[0], R * p0[1]);
    fn(g, lu, lv);
    g.restore();
  }

  /* prostopadłościan: ściana wschodnia (prawa), południowa (lewa) i wierzch */
  box(x0, y0, z0, x1, y1, z1, m, o = {}) {
    if (LINT) this.regVol('box', x0, y0, z0, x1, y1, z1, o.tag, o.nest);
    const h = z1 - z0, me = m.east || m, ms = m.south || m, mt = m.top || m.south || m;
    const ao = o.ao ?? 0.4, vg = [[0, o.eave ?? 0], [0.15, 0], [0.78, 0], [1, ao]];
    this.face([x1, y1, z1], [0, -(y1 - y0), 0], [0, 0, -h], me, { shade: LIGHT.east, vgrad: vg, pal: o.pal, ugrad: [[0, 0.16], [0.2, 0]] });
    this.face([x0, y1, z1], [x1 - x0, 0, 0], [0, 0, -h], ms, { shade: LIGHT.south, vgrad: vg, pal: o.pal, ugrad: [[0.85, 0], [1, 0.12]] });
    if (o.top !== false) this.face([x0, y0, z1], [x1 - x0, 0, 0], [0, y1 - y0, 0], mt, { shade: LIGHT.top, pal: o.topPal || o.pal, edge: 0.35 });
  }

  /* cień rzucony na ziemię: rzut punktów bryły wzdłuż światła + otoczka wypukła, miękki brzeg */
  shadow(pts3, o = {}) {
    const sd = o.dir || SHADOW_DIR;
    const pts = pts3.map(([x, y, z]) => this.P(x + z * sd[0], y + z * sd[1], 0));
    const hull = convexHull(pts);
    softFill(this.gu, g => { hull.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }, `rgba(14,22,8,${o.alpha ?? 0.5})`, (o.blur ?? 9) * this.F);
  }
  shadowBox(x0, y0, x1, y1, h, o) {
    this.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], o);
  }
  /* miękki mrok przy podstawie (ambient occlusion) */
  contact(x0, y0, x1, y1, o = {}) {
    const e = o.grow ?? 0.05, P = (x, y) => this.P(x, y, 0);
    softFill(this.gu, g => { [[x0 - e, y0 - e], [x1 + e, y0 - e], [x1 + e, y1 + e], [x0 - e, y1 + e]].forEach(([x, y], i) => { const p = P(x, y); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); }, `rgba(10,12,4,${o.alpha ?? 0.55})`, (o.blur ?? 6) * this.F);
  }

  /* decal terenu: tekstura rzucona w płaszczyznę świata (izometrycznie), przycięta do wielokątów z miękkim brzegiem */
  decal(mat, pal, polys, o = {}) {
    const R = this.Rp, m = tex(mat, pal), K = m.ppu;
    let x0 = 0, y0 = 0, x1 = this.w, y1 = this.h;                          // obszar roboczy (px logiczne) — dla wielokątów tylko ich obwiednia
    if (polys) {
      let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
      for (const pts of polys) for (const [x, y] of pts) { const p = this.P(x, y, 0); if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; }
      const mg = (o.feather ?? 14) * 2 + 6;
      x0 = Math.max(0, a - mg); y0 = Math.max(0, b - mg); x1 = Math.min(this.w, c + mg); y1 = Math.min(this.h, d + mg);
      if (x1 <= x0 || y1 <= y0) return;
    }
    const ox = Math.floor(x0 * R), oy = Math.floor(y0 * R), tw = Math.ceil(x1 * R) - ox, th = Math.ceil(y1 * R) - oy, lx = ox / R, ly = oy / R;   // przesunięcie w px urządzenia
    const t = newCanvas(tw, th), tg = t.getContext('2d');
    tg.setTransform(R * AX / K, R * AY / K, -R * AX / K, R * AY / K, R * (this.ax - lx), R * (this.ay - ly));
    tg.fillStyle = tg.createPattern(m.c, 'repeat');
    const ext = (this.w + this.h) * K / Math.min(AX, AY);
    tg.fillRect(-ext, -ext, 2 * ext, 2 * ext);
    tg.setTransform(1, 0, 0, 1, 0, 0);
    if (polys) {
      const mk = newCanvas(tw, th), mg = mk.getContext('2d'); mg.setTransform(R, 0, 0, R, -R * lx, -R * ly);
      const path = g => { for (const pts of polys) { pts.forEach(([x, y], i) => { const p = this.P(x, y, 0); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); } };
      if (o.feather === 0) { mg.fillStyle = '#fff'; mg.beginPath(); path(mg); mg.fill(); } else softFill(mg, path, '#fff', o.feather ?? 14);
      tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mk, 0, 0);
    }
    const dst = o.layer || this.pg;
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = o.alpha ?? 1; if (o.blend) dst.globalCompositeOperation = o.blend; dst.drawImage(t, ox, oy); dst.restore();
  }
  /* jednolita, rozmyta plama koloru (mokry piasek, ściółka) */
  flat(polys, color, feather, layer) {
    softFill(layer || this.pg, g => { for (const pts of polys) { pts.forEach(([x, y], i) => { const p = this.P(x, y, 0); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); } }, color, feather);
  }
  /* organiczna plama ubitej ziemi (znak rozpoznawczy „Settlers"); wymiary w POLACH (niezależnie od F) */
  patch(cx, cy, rx, ry, o = {}) {
    const r = rng(o.seed || 9), pts = [], n = 16, f = 1 / this.F;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.82 + r() * 0.3; pts.push([(cx + Math.cos(a) * rx * k) * f, (cy + Math.sin(a) * ry * k) * f]); }
    this.decal(o.mat || 'dirt', o.pal, [pts], { feather: o.feather ?? 12, alpha: o.alpha ?? 0.92 });
  }
  /* prostokątny, wybrukowany plac (np. dziedziniec, targowisko); współrzędne w polach */
  paved(x0, y0, x1, y1, o = {}) {
    const f = 1 / this.F, j = o.jit ?? 0.05, r = rng(o.seed || 5), q = () => (r() - 0.5) * j;
    this.decal(o.mat || 'pavers', o.pal, [[[x0 * f + q(), y0 * f + q()], [x1 * f + q(), y0 * f + q()], [x1 * f + q(), y1 * f + q()], [x0 * f + q(), y1 * f + q()]]], { feather: o.feather ?? 3, alpha: o.alpha ?? 1 });
  }

  /* walec pionowy (wieża, minaret, beczka): gradient poziomy, elipsy góry i dołu */
  cyl(cx, cy, z0, z1, r, o = {}) {
    if (LINT) this.regVol('cyl', cx - r, cy - r, z0, cx + r, cy + r, z1, o.tag, o.nest);
    const g = this.g, R = this.R, F = this.F, [px, pyb] = this.P(cx, cy, z0), [, pyt] = this.P(cx, cy, z1), rx = r * AX * F * 1.4142, ry = r * AY * F * 1.4142;
    const col = o.color || [150, 140, 125];
    g.save();
    g.beginPath(); g.moveTo(px - rx, pyt); g.lineTo(px - rx, pyb); g.ellipse(px, pyb, rx, ry, 0, Math.PI, 0, true); g.lineTo(px + rx, pyt); g.ellipse(px, pyt, rx, ry, 0, 0, Math.PI, true); g.closePath();
    g.clip();
    if (o.mat) {
      const m = this.pat(o.mat, o.pal), K = m.ppu, sc = o.texScale || (VH / K);
      g.save(); g.setTransform(R * sc, 0, 0, R * sc, R * (px - rx), R * (pyt - ry)); g.fillStyle = m.pat; g.fillRect(0, 0, (rx * 2) / sc + 2, ((pyb - pyt) + ry * 2) / sc + 2); g.restore();   // podkład (pokrywa też obszar wierzchu)
      if (o.flat !== true) cylTexture(g, R, tex(o.mat, o.pal), F, px, pyt, pyb, rx, ry, r, o.phase ?? Math.round(cx * 53 + cy * 29));   // zakrzywione rzędy cegieł / klepki wokół walca
    } else { g.fillStyle = css(col); g.fillRect(px - rx, pyt - ry, rx * 2, pyb - pyt + ry * 2); }
    const gr = g.createLinearGradient(px - rx, 0, px + rx, 0);   // zaokrąglenie: światło z lewej, cień z prawej
    gr.addColorStop(0, 'rgba(255,240,200,0.16)'); gr.addColorStop(0.28, 'rgba(255,240,200,0.04)'); gr.addColorStop(0.62, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = gr; g.fillRect(px - rx, pyt - ry, rx * 2, pyb - pyt + ry * 2);
    if (o.ao !== 0) { const ga = g.createLinearGradient(0, pyt, 0, pyb); ga.addColorStop(0, 'rgba(0,0,0,0)'); ga.addColorStop(0.8, 'rgba(0,0,0,0)'); ga.addColorStop(1, 'rgba(0,0,0,0.32)'); g.fillStyle = ga; g.fillRect(px - rx, pyt - ry, rx * 2, pyb - pyt + ry * 2); }
    g.restore();
    g.strokeStyle = 'rgba(14,8,4,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(px - rx, pyt); g.lineTo(px - rx, pyb); g.ellipse(px, pyb, rx, ry, 0, Math.PI, 0, true); g.lineTo(px + rx, pyt); g.stroke();
    if (o.top !== false) { // wierzch
      g.beginPath(); g.ellipse(px, pyt, rx, ry, 0, 0, TAU);
      if (o.topMat) { const m = this.pat(o.topMat, o.topPal); g.save(); g.clip(); const K = m.ppu; g.setTransform(R * AX / K, R * AY / K, -R * AX / K, R * AY / K, R * px, R * pyt); g.fillStyle = m.pat; g.fillRect(-2 * K, -2 * K, 4 * K, 4 * K); g.restore(); g.beginPath(); g.ellipse(px, pyt, rx, ry, 0, 0, TAU); }
      else { g.fillStyle = css(scaleC(col, 1.12)); g.fill(); }
      g.strokeStyle = 'rgba(14,8,4,0.4)'; g.stroke();
    }
  }

  /* gotowy sprite: warstwy p (plac), u (cień) oraz c (obiekty z obrysem) — scena rysuje je w osobnych przebiegach */
  finish(o = {}) {
    const R = this.R, out = newCanvas(this.pw, this.ph), g = out.getContext('2d');
    const t = newCanvas(this.pw, this.ph), tg = t.getContext('2d');
    tg.drawImage(this.c, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = `rgba(14,9,5,${o.outline ?? 0.5})`; tg.fillRect(0, 0, this.pw, this.ph);
    const ow = 1.2 * R;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(t, dx * ow, dy * ow);
    g.drawImage(this.c, 0, 0);
    if (o.grain !== 0) addSpriteGrain(g, this.pw, this.ph, R, o.grain ?? 1);
    if (LINT) this.lint(LINT_NAME, out);
    const spr = { p: this.pcv, u: this.ucv, c: out, ax: this.ax, ay: this.ay, w: this.w, h: this.h, R, Rp: this.Rp, Ru: this.Ru, F: this.F, fw: this.fw, fh: this.fh, smoke: this.smokes.map(a => a.slice()), doors: this.doors.map(d => ({ ...d })) };
    return o.crop === false ? spr : cropSprite(spr);
  }
}

/* tekstura walcowa: pionowe paski o szerokości 1 piksela urządzenia; pasek na odległości X od osi leży na kącie φ = asin(X/rx), więc
   tekstura jest próbkowana wzdłuż długości łuku (cegły kurczą się ku krawędziom), a poziome rzędy zataczają dół elipsy (ry·cos φ) —
   dokładnie tak, jak widać okrągłą wieżę z góry pod kątem 2:1. Wzór jest wywoływany po płaskim podkładzie, więc szczeliny nie prześwitują. */
function cylTexture(g, R, t, F, px, pyt, pyb, rx, ry, r, phase = 0) {
  const pat = g.createPattern(t.c, 'repeat'), K = t.ppu, sy = VH / K, sx0 = Math.SQRT2 * AX / K, step = 1 / R, H = pyb - pyt;
  for (let X = -rx; X < rx; X += step) {
    const xc = Math.min(rx - 1e-6, X + step / 2), phi = Math.asin(Math.max(-1, Math.min(1, xc / rx))), cs = Math.cos(phi), dy = ry * cs;
    const sx = sx0 * Math.max(cs, 0.04), u = (r * phi * F + phase * 0.173) * K;
    pat.setTransform(new DOMMatrix([sx, 0, 0, sy, px + xc - sx * u, pyt + dy]));
    g.fillStyle = pat; g.fillRect(px + X - 0.25 / R, pyt + dy - 1.5, step + 0.5 / R, H + 3);
  }
}

/* przycięcie warstw sprite'a do zawartości (oszczędza pamięć i czas rysowania): obwiednia niepustych pikseli wszystkich warstw, w px logicznych */
function cropSprite(s) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [l, res] of [['c', s.R], ['u', s.Ru], ['p', s.Rp]]) {
    const im = s[l]; if (!im) continue;
    const k = 4, sw = Math.max(1, Math.ceil(im.width / k)), sh = Math.max(1, Math.ceil(im.height / k)), t = newCanvas(sw, sh), g = t.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0, sw, sh); const d = g.getImageData(0, 0, sw, sh).data;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (d[(y * sw + x) * 4 + 3] > 3) {
      const X0 = x * k / res, X1 = (x + 1) * k / res, Y0 = y * k / res, Y1 = (y + 1) * k / res;
      if (X0 < x0) x0 = X0; if (X1 > x1) x1 = X1; if (Y0 < y0) y0 = Y0; if (Y1 > y1) y1 = Y1;
    }
  }
  if (x1 < x0) return s;
  x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2); x1 = Math.min(s.w, Math.ceil(x1) + 2); y1 = Math.min(s.h, Math.ceil(y1) + 2);
  const w = x1 - x0, h = y1 - y0, out = { ...s, ax: s.ax - x0, ay: s.ay - y0, w, h };
  for (const [l, res] of [['c', s.R], ['u', s.Ru], ['p', s.Rp]]) {
    const im = s[l]; if (!im) continue;
    const c = newCanvas(Math.ceil(w * res), Math.ceil(h * res)); c.getContext('2d').drawImage(im, Math.round(x0 * res), Math.round(y0 * res), c.width, c.height, 0, 0, c.width, c.height);
    out[l] = c;
  }
  return out;
}

/* ---------- połacie dachowe ---------- */
/* dach dwuspadowy; o.ridge 'x' (kalenica wzdłuż x, szczyty po bokach ±x) albo 'y'.
   o: x0,y0,x1,y1 — obrys ścian, z — wysokość ścian, rise — wzniesienie kalenicy, ov — okap, ovE — wysunięcie szczytu */
function gableRoof(sc, o) {
  if (LINT) { const oe = o.ovE ?? 0.05, ov = o.ov ?? 0.07, ex = o.ridge === 'y' ? ov : oe, ey = o.ridge === 'y' ? oe : ov; sc.regVol('roof', o.x0 - ex, o.y0 - ey, o.z, o.x1 + ex, o.y1 + ey, o.z + o.rise, o.tag, o.nest); }
  const { x0, y0, x1, y1, z, rise } = o, ov = o.ov ?? 0.07, ovE = o.ovE ?? 0.05, mat = o.mat, pal = o.pal, gm = o.gableMat || o.wallMat, gpal = o.gablePal || o.wallPal;
  if ((o.ridge || 'x') === 'x') {
    const ym = (y0 + y1) / 2, hs = (y1 - y0) / 2, dz = rise * ov / hs, zE = z - dz, L = x1 - x0 + 2 * ovE;
    const ySo = y1 + ov, yNo = y0 - ov, top = z + rise;
    sc.face([x0 - ovE, ym, top], [L, 0, 0], [0, yNo - ym, zE - top], mat, { shade: LIGHT.roofN, pal, edge: 0.35, roof: true });                       // połać północna (tylna)
    if (gm) sc.face([x1, y1, top], [0, -(y1 - y0), 0], [0, 0, -rise], gm, { shade: LIGHT.east, pal: gpal, clip: [[0.5, 0], [1, 1], [0, 1]], vgrad: [[0, 0], [0.8, 0], [1, 0.3]] });   // szczyt widoczny (+x)
    sc.face([x0 - ovE, ym, top], [L, 0, 0], [0, ySo - ym, zE - top], mat, { shade: LIGHT.roofS, pal, edge: 0.4, roof: true, vgrad: [[0, 0], [0.86, 0], [1, 0.22]] });   // połać południowa (przednia)
    return { ridgeA: [x0 - ovE, ym, top], ridgeB: [x1 + ovE, ym, top], eaveZ: zE, ySo, yNo };
  }
  const xm = (x0 + x1) / 2, hs = (x1 - x0) / 2, dz = rise * ov / hs, zE = z - dz, L = y1 - y0 + 2 * ovE;
  const xEo = x1 + ov, xWo = x0 - ov, top = z + rise;
  sc.face([xm, y1 + ovE, top], [0, -L, 0], [xWo - xm, 0, zE - top], mat, { shade: LIGHT.roofW, pal, edge: 0.35, roof: true });                  // połać zachodnia (tylna)
  if (gm) sc.face([x0, y1, top], [x1 - x0, 0, 0], [0, 0, -rise], gm, { shade: LIGHT.south, pal: gpal, clip: [[0.5, 0], [1, 1], [0, 1]], vgrad: [[0, 0], [0.8, 0], [1, 0.3]] });   // szczyt (+y)
  sc.face([xm, y1 + ovE, top], [0, -L, 0], [xEo - xm, 0, zE - top], mat, { shade: LIGHT.roofE, pal, edge: 0.4, roof: true, vgrad: [[0, 0], [0.86, 0], [1, 0.25]] });                  // połać wschodnia (przednia)
  return { ridgeA: [xm, y1 + ovE, top], ridgeB: [xm, y0 - ovE, top], eaveZ: zE, xEo, xWo };
}

/* dach czterospadowy / ostrosłup (wieże, kapliczki) */
function pyramidRoof(sc, o) {
  if (LINT) { const ov = o.ov ?? 0.05; sc.regVol('roof', o.x0 - ov, o.y0 - ov, o.z, o.x1 + ov, o.y1 + ov, o.z + o.rise, o.tag, o.nest); }
  const { x0, y0, x1, y1, z, rise, mat, pal } = o, ov = o.ov ?? 0.05, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, top = z + rise;
  const a = [x0 - ov, y0 - ov, z - rise * ov / ((x1 - x0) / 2)], b = [x1 + ov, y0 - ov, a[2]], c = [x1 + ov, y1 + ov, a[2]], d = [x0 - ov, y1 + ov, a[2]];
  const quadTri = (p, q, shade) => {
    const U = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], T = [xm, ym, top], V = [T[0] - p[0], T[1] - p[1], T[2] - p[2]];
    sc.face(p, U, V, mat, { shade, pal, edge: 0.4, roof: true, clip: [[0, 0], [1, 0], [0, 1]], ppu: o.ppu });
  };
  quadTri(a, b, LIGHT.roofN); quadTri(d, a, LIGHT.roofW); quadTri(c, d, LIGHT.roofS); quadTri(b, c, LIGHT.roofE);
}
