/* ====================== SCENA: RZUT, ŚCIANY, POŁACIE, CIENIE ======================
   Sprite budynku jest wypiekany raz (supersampling S×) z brył 3D: każda ściana i połać to równoległobok
   z teksturą nałożoną afinicznie (w rzucie ortogonalnym to dokładne odwzorowanie), oświetlony z lewej góry.
   Układ współrzędnych: środek kafla = (0,0), x rośnie w prawo-dół ekranu, y w lewo-dół, z w górę. */
const S = 2;                       // supersampling
const AX = 32 * S, AY = 16 * S;    // piksele na jednostkę świata: sx = (x−y)·AX, sy = (x+y)·AY
const VH = 39 * S;                 // piksele na jednostkę wysokości (rzut dimetryczny 2:1)
const LIGHT = { top: 1.0, south: 0.86, east: 0.6, roofS: 1.02, roofN: 0.78, roofE: 0.8, roofW: 1.0 };
const SHADOW_DIR = [0.62, 0.1];    // długość cienia (x,y) na jednostkę wysokości — pada w prawo-dół

function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}

class Scene {
  constructor(w, h, ax, ay) {
    this.w = w; this.h = h; this.ax = ax; this.ay = ay;
    this.pcv = newCanvas(w, h); this.pg = this.pcv.getContext('2d');       // warstwa 1: plac / decale terenu
    this.ucv = newCanvas(w, h); this.gu = this.ucv.getContext('2d');       // warstwa 2: cień rzucony, mrok przy podstawie
    this.c = newCanvas(w, h); this.g = this.c.getContext('2d');            // warstwa 3: obiekty
    this.pats = {};
  }
  P(x, y, z = 0) { return [(x - y) * AX + this.ax, (x + y) * AY - z * VH + this.ay]; }
  pat(name, pal, ctx) {
    const k = name + '|' + (pal || '') + '|' + (ctx === this.gu ? 'u' : 'o');
    if (!this.pats[k]) { const t = tex(name, pal); this.pats[k] = { pat: (ctx || this.g).createPattern(t.c, 'repeat'), ppu: t.ppu }; }
    return this.pats[k];
  }

  /* równoległobok O + s·U + t·V pokryty teksturą (jednostki: tekstura ma stałą gęstość ppu) */
  face(O, U, V, mat, o = {}) {
    const g = this.g, m = this.pat(mat, o.pal), lu = Math.hypot(...U), lv = Math.hypot(...V), K = o.ppu || m.ppu;
    const p0 = this.P(...O), pu = this.P(O[0] + U[0], O[1] + U[1], O[2] + U[2]), pv = this.P(O[0] + V[0], O[1] + V[1], O[2] + V[2]);
    const a = (pu[0] - p0[0]) / (lu * K), b = (pu[1] - p0[1]) / (lu * K), c = (pv[0] - p0[0]) / (lv * K), d = (pv[1] - p0[1]) / (lv * K);
    const sc = Math.hypot(a, b) || 1;
    g.save();
    g.setTransform(a, b, c, d, p0[0], p0[1]);
    g.beginPath();
    if (o.clip) o.clip.forEach(([s, t], i) => g[i ? 'lineTo' : 'moveTo'](s * lu * K, t * lv * K)); else g.rect(0, 0, lu * K, lv * K);
    g.closePath();
    g.fillStyle = m.pat; g.fill();
    g.strokeStyle = m.pat; g.lineWidth = 1.1 / sc; g.stroke();        // zakładka — brak szwów między ścianami
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
    const g = this.g, lu = Math.hypot(...U), lv = Math.hypot(...V);
    const p0 = this.P(...O), pu = this.P(O[0] + U[0], O[1] + U[1], O[2] + U[2]), pv = this.P(O[0] + V[0], O[1] + V[1], O[2] + V[2]);
    g.save();
    g.setTransform((pu[0] - p0[0]) / lu, (pu[1] - p0[1]) / lu, (pv[0] - p0[0]) / lv, (pv[1] - p0[1]) / lv, p0[0], p0[1]);
    fn(g, lu, lv);
    g.restore();
  }

  /* prostopadłościan: ściana wschodnia (prawa), południowa (lewa) i wierzch */
  box(x0, y0, z0, x1, y1, z1, m, o = {}) {
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
    softFill(this.gu, g => { hull.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }, `rgba(14,22,8,${o.alpha ?? 0.5})`, o.blur ?? 9);
  }
  shadowBox(x0, y0, x1, y1, h, o) {
    this.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], o);
  }
  /* miękki mrok przy podstawie (ambient occlusion) */
  contact(x0, y0, x1, y1, o = {}) {
    const e = o.grow ?? 0.05, P = (x, y) => this.P(x, y, 0);
    softFill(this.gu, g => { [[x0 - e, y0 - e], [x1 + e, y0 - e], [x1 + e, y1 + e], [x0 - e, y1 + e]].forEach(([x, y], i) => { const p = P(x, y); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); }, `rgba(10,12,4,${o.alpha ?? 0.55})`, o.blur ?? 6);
  }

  /* decal terenu: tekstura rzucona w płaszczyznę świata (izometrycznie), przycięta do wielokątów z miękkim brzegiem */
  decal(mat, pal, polys, o = {}) {
    const m = tex(mat, pal), K = m.ppu, t = newCanvas(this.w, this.h), tg = t.getContext('2d');
    tg.setTransform(AX / K, AY / K, -AX / K, AY / K, this.ax, this.ay);
    tg.fillStyle = tg.createPattern(m.c, 'repeat');
    const R = (this.w + this.h) * K / Math.min(AX, AY);
    tg.fillRect(-R, -R, 2 * R, 2 * R);
    tg.setTransform(1, 0, 0, 1, 0, 0);
    if (polys) {
      const mk = newCanvas(this.w, this.h), mg = mk.getContext('2d');
      const path = g => { for (const pts of polys) { pts.forEach(([x, y], i) => { const p = this.P(x, y, 0); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); } };
      if (o.feather === 0) { mg.fillStyle = '#fff'; mg.beginPath(); path(mg); mg.fill(); } else softFill(mg, path, '#fff', o.feather ?? 14);
      tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mk, 0, 0);
    }
    const dst = o.layer || this.pg;
    dst.save(); dst.globalAlpha = o.alpha ?? 1; if (o.blend) dst.globalCompositeOperation = o.blend; dst.drawImage(t, 0, 0); dst.restore();
  }
  /* jednolita, rozmyta plama koloru (mokry piasek, ściółka) */
  flat(polys, color, feather, layer) {
    softFill(layer || this.pg, g => { for (const pts of polys) { pts.forEach(([x, y], i) => { const p = this.P(x, y, 0); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); } }, color, feather);
  }
  /* organiczna plama ubitej ziemi z miękkim brzegiem (znak rozpoznawczy „Settlers": brązowy plac wokół budynku) */
  patch(cx, cy, rx, ry, o = {}) {
    const r = rng(o.seed || 9), pts = [], n = 16;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.82 + r() * 0.3; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    this.decal('dirt', o.pal, [pts], { feather: o.feather ?? 14, alpha: o.alpha ?? 0.92 });
  }

  /* walec pionowy (wieża, minaret, beczka): gradient poziomy, elipsy góry i dołu */
  cyl(cx, cy, z0, z1, r, o = {}) {
    const g = this.g, [px, pyb] = this.P(cx, cy, z0), [, pyt] = this.P(cx, cy, z1), rx = r * AX * 1.4142, ry = r * AY * 1.4142;
    const col = o.color || [150, 140, 125];
    g.save();
    g.beginPath(); g.moveTo(px - rx, pyt); g.lineTo(px - rx, pyb); g.ellipse(px, pyb, rx, ry, 0, Math.PI, 0, true); g.lineTo(px + rx, pyt); g.ellipse(px, pyt, rx, ry, 0, 0, Math.PI, true); g.closePath();
    g.clip();
    if (o.mat) {
      const m = this.pat(o.mat, o.pal), K = m.ppu, sc = o.texScale || (VH / K);
      g.save(); g.setTransform(sc, 0, 0, sc, px - rx, pyt - ry); g.fillStyle = m.pat; g.fillRect(0, 0, (rx * 2) / sc + 2, ((pyb - pyt) + ry * 2) / sc + 2); g.restore();
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
      if (o.topMat) { const m = this.pat(o.topMat, o.topPal); g.save(); g.clip(); const K = m.ppu; g.setTransform(AX / K, AY / K, -AX / K, AY / K, px, pyt); g.fillStyle = m.pat; g.fillRect(-2 * K, -2 * K, 4 * K, 4 * K); g.restore(); g.beginPath(); g.ellipse(px, pyt, rx, ry, 0, 0, TAU); }
      else { g.fillStyle = css(scaleC(col, 1.12)); g.fill(); }
      g.strokeStyle = 'rgba(14,8,4,0.4)'; g.stroke();
    }
  }

  /* gotowy sprite: warstwy p (plac), u (cień) oraz c (obiekty z obrysem) — scena rysuje je w osobnych przebiegach */
  finish(o = {}) {
    const out = newCanvas(this.w, this.h), g = out.getContext('2d');
    const t = newCanvas(this.w, this.h), tg = t.getContext('2d');
    tg.drawImage(this.c, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = `rgba(14,9,5,${o.outline ?? 0.5})`; tg.fillRect(0, 0, this.w, this.h);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(t, dx * 1.2, dy * 1.2);
    g.drawImage(this.c, 0, 0);
    return { p: this.pcv, u: this.ucv, c: out, ax: this.ax, ay: this.ay };
  }
}

/* ---------- połacie dachowe ---------- */
/* dach dwuspadowy; o.ridge 'x' (kalenica wzdłuż x, szczyty po bokach ±x) albo 'y'.
   o: x0,y0,x1,y1 — obrys ścian, z — wysokość ścian, rise — wzniesienie kalenicy, ov — okap, ovE — wysunięcie szczytu */
function gableRoof(sc, o) {
  const { x0, y0, x1, y1, z, rise } = o, ov = o.ov ?? 0.07, ovE = o.ovE ?? 0.05, mat = o.mat, pal = o.pal, gm = o.gableMat || o.wallMat, gpal = o.gablePal || o.wallPal;
  if ((o.ridge || 'x') === 'x') {
    const ym = (y0 + y1) / 2, hs = (y1 - y0) / 2, dz = rise * ov / hs, zE = z - dz, L = x1 - x0 + 2 * ovE;
    const ySo = y1 + ov, yNo = y0 - ov, top = z + rise;
    sc.face([x0 - ovE, ym, top], [L, 0, 0], [0, yNo - ym, zE - top], mat, { shade: LIGHT.roofN, pal, edge: 0.35 });                       // połać północna (tylna)
    if (gm) sc.face([x1, y1, top], [0, -(y1 - y0), 0], [0, 0, -rise], gm, { shade: LIGHT.east, pal: gpal, clip: [[0.5, 0], [1, 1], [0, 1]], vgrad: [[0, 0], [0.8, 0], [1, 0.3]] });   // szczyt widoczny (+x)
    sc.face([x0 - ovE, ym, top], [L, 0, 0], [0, ySo - ym, zE - top], mat, { shade: LIGHT.roofS, pal, edge: 0.4, vgrad: [[0, 0], [0.86, 0], [1, 0.22]] });   // połać południowa (przednia)
    return { ridgeA: [x0 - ovE, ym, top], ridgeB: [x1 + ovE, ym, top], eaveZ: zE, ySo, yNo };
  }
  const xm = (x0 + x1) / 2, hs = (x1 - x0) / 2, dz = rise * ov / hs, zE = z - dz, L = y1 - y0 + 2 * ovE;
  const xEo = x1 + ov, xWo = x0 - ov, top = z + rise;
  sc.face([xm, y1 + ovE, top], [0, -L, 0], [xWo - xm, 0, zE - top], mat, { shade: LIGHT.roofW, pal, edge: 0.35 });                  // połać zachodnia (tylna)
  if (gm) sc.face([x0, y1, top], [x1 - x0, 0, 0], [0, 0, -rise], gm, { shade: LIGHT.south, pal: gpal, clip: [[0.5, 0], [1, 1], [0, 1]], vgrad: [[0, 0], [0.8, 0], [1, 0.3]] });   // szczyt (+y)
  sc.face([xm, y1 + ovE, top], [0, -L, 0], [xEo - xm, 0, zE - top], mat, { shade: LIGHT.roofE, pal, edge: 0.4, vgrad: [[0, 0], [0.86, 0], [1, 0.25]] });                  // połać wschodnia (przednia)
  return { ridgeA: [xm, y1 + ovE, top], ridgeB: [xm, y0 - ovE, top], eaveZ: zE, xEo, xWo };
}

/* dach czterospadowy / ostrosłup (wieże, kapliczki) */
function pyramidRoof(sc, o) {
  const { x0, y0, x1, y1, z, rise, mat, pal } = o, ov = o.ov ?? 0.05, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, top = z + rise;
  const a = [x0 - ov, y0 - ov, z - rise * ov / ((x1 - x0) / 2)], b = [x1 + ov, y0 - ov, a[2]], c = [x1 + ov, y1 + ov, a[2]], d = [x0 - ov, y1 + ov, a[2]];
  const quadTri = (p, q, shade, e) => {
    // trójkąt (p, q, wierzchołek) jako połać o podstawie p→q
    const U = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], T = [xm, ym, top], V = [T[0] - p[0], T[1] - p[1], T[2] - p[2]];
    sc.face(p, U, V, mat, { shade, pal, edge: 0.4, clip: [[0, 0], [1, 0], [0, 1]], ppu: o.ppu });
  };
  // dwie widoczne połacie: wschodnia (a→... prawa) i południowa (lewa) + dwie tylne dla poprawnych krawędzi
  quadTri(a, b, LIGHT.roofN);   // północna
  quadTri(d, a, LIGHT.roofW);   // zachodnia
  quadTri(c, d, LIGHT.roofS);   // południowa
  quadTri(b, c, LIGHT.roofE);   // wschodnia
}
