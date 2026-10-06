/* ====================== PODŁOŻE MAPY GRY: chunki terenu ======================
   Zamiast rysować 2304 kafle co klatkę, teren jest wypiekany w chunkach: kwadraty GCH × GCH px logicznych planu sprite'ów (1 pole = 2·AX × 2·AY = 128 × 64 px,
   pole (x, y) leży w punkcie ((x−y)·AX, (x+y)·AY)). Chunk = płótno gruntu („base”) + płótno nakładki („over”: place i cienie obiektów statycznych —
   budynków, drzew, złóż, dekorów); nakładka odświeża się po zmianie sygnatury pól (wycięte drzewo, nowy budynek) bez ponownego wypieku gruntu.
   Grunt powstaje z danych kafli (h, e, wk, k): tekstura klimatu na całości, a rodzaje gruntu (bagno, wydma, skała…) i woda nakładane są przez maski
   z rozmytych wielokątów pól z progiem (kontur organiczny zamiast schodków rombów): plaża → mokry piasek → piana → woda → głębia, bród = żwir + płytka woda,
   lód, ogrodzenie mapy rombem. Na koniec cieniowanie wzgórz (mapa świateł z wysokości e, światło z lewej góry jak w sprite'ach).
   LOD: ta sama treść w trzech rozdzielczościach (1, ½, ¼); najgrubszy poziom wypiekany jest dla całej mapy z góry, więc nigdy nie ma dziur.
   Silnik nie zna reguł gry — wszystko, co gra chce dodać do nakładki, podaje przez wywołania zwrotne `statics` i `sigOf`. */
const GCH = 512, GPAD = 8, GS = 8;                   // bok chunka, zapas na krawędzi (px logiczne), px mapy cieniowania na pole
const GKIND = { sea: 10, lake: 11, river: 12, ford: 13, ice: 14 }, GKIND_K = { bog: 1, dune: 2, quick: 3, drift: 4, oasis: 5, cliff: 6 };
const GWATER = k => k >= 10;

/* materiały gruntu wg klimatu: base — grunt [tekstura, paleta]; vary — wielkoskalowe plamy jaśniejsze/ciemniejsze (zrywają powtarzalność);
   beach/wet — plaża i mokry brzeg; water — paleta wody wg rodzaju; rock — paleta skały pod klifami */
const GMAT = {
  temperate: { base: ['grass', 'green'], vary: 'green', varyA: 0.34, beach: ['grass', 'sand'], wet: 'rgba(92,70,40,0.36)', water: { sea: 'sea', lake: 'lake', river: 'river' }, rock: 'rock', depth: 'rgba(8,52,84,0.5)' },
  eastern: { base: ['grass', 'eastern'], vary: 'eastern', varyA: 0.32, beach: ['dirt', '#6a5a38'], wet: 'rgba(40,30,14,0.4)', water: { sea: 'lake', lake: 'lake', river: 'river' }, rock: 'rock', depth: 'rgba(10,44,60,0.5)' },
  snow: { base: ['grass', 'snow'], vary: 'snow', varyA: 0.3, beach: ['gravel', 'gray'], wet: 'rgba(36,42,52,0.34)', water: { sea: 'cold', lake: 'ice', river: 'river' }, rock: 'snow', depth: 'rgba(6,30,52,0.55)' },
  desert: { base: ['grass', 'sand'], vary: 'sand', varyA: 0.4, beach: ['grass', 'sand'], wet: 'rgba(110,80,40,0.38)', water: { sea: 'sea', lake: 'oasis', river: 'river' }, rock: 'sand', depth: 'rgba(8,60,70,0.45)' }
};

function gHash(x, y, n) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(n | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const gNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const gNextPaint = () => new Promise(r => { let ok = false; const f = () => { if (!ok) { ok = true; r(); } }; if (typeof requestAnimationFrame === 'function') requestAnimationFrame(f); setTimeout(f, 60); });
const gRelease = c => { c.width = c.height = 0; };          // zwolnienie pamięci płótna tymczasowego od razu (iOS nie sprząta ich na bieżąco)

/* maska alfa z wielokątów (współrzędne w polach), rozmyta: σ = blur/2 px logicznych; obszar roboczy = obwiednia wielokątów ∩ scena */
function gMask(sc, polys, blur) {
  const R = sc.Rp;
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const pts of polys) for (const [x, y] of pts) { const p = sc.P(x, y, 0); if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; }
  const mg = blur * 1.7 + 4, x0 = Math.max(0, a - mg), y0 = Math.max(0, b - mg), x1 = Math.min(sc.w, c + mg), y1 = Math.min(sc.h, d + mg);
  if (x1 <= x0 || y1 <= y0) return null;
  const ox = Math.floor(x0 * R), oy = Math.floor(y0 * R), tw = Math.ceil(x1 * R) - ox, th = Math.ceil(y1 * R) - oy;
  const cv = newCanvas(tw, th), g = cv.getContext('2d', { willReadFrequently: true });
  g.setTransform(R, 0, 0, R, -ox, -oy);
  softFill(g, gg => { for (const pts of polys) { pts.forEach(([x, y], i) => { const p = sc.P(x, y, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); gg.closePath(); } }, '#fff', blur);
  return { cv, g, ox, oy, tw, th, R };
}
/* próg na alfie maski: 0 poniżej lo, 1 powyżej hi, gładko pomiędzy (kontur organiczny z rozmytych rombów); zwraca nową maskę */
function gCurve(m, lo, hi) {
  if (!m) return null;
  const im = m.g.getImageData(0, 0, m.tw, m.th), d = im.data, lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) { const a = i / 255, t = a <= lo ? 0 : a >= hi ? 1 : (a - lo) / (hi - lo); lut[i] = Math.round(255 * t * t * (3 - 2 * t)); }
  for (let i = 3; i < d.length; i += 4) d[i] = lut[d[i]];
  const cv = newCanvas(m.tw, m.th), g = cv.getContext('2d', { willReadFrequently: true }); g.putImageData(im, 0, 0);
  return { ...m, cv, g };
}
function gDrop(m) { if (m) gRelease(m.cv); }
function gBlit(sc, m, src, alpha, blend) {
  const dst = sc.pg; dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = alpha; if (blend) dst.globalCompositeOperation = blend; dst.drawImage(src, m.ox, m.oy); dst.restore();
}
/* maska pełna (cała scena) — do gruntu bazowego */
function gFull(sc) {
  const R = sc.Rp, tw = sc.pcv.width, th = sc.pcv.height, cv = newCanvas(tw, th), g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, tw, th);
  return { cv, g, ox: 0, oy: 0, tw, th, R };
}
/* tekstura rzucona w płaszczyznę świata (jak Scene.decal — wzór jest zakotwiczony w świecie, więc chunki łączą się bez szwów), przycięta maską;
   zakres wypełnienia wyliczony z narożników obszaru roboczego, bo początek świata leży daleko od chunka */
function gPaintTex(sc, m, mat, pal, alpha = 1, blend = null, tr = null) {
  if (!m) return;
  const R = m.R, t = tex(mat, pal), K = t.ppu, lx = m.ox / R, ly = m.oy / R, cv = newCanvas(m.tw, m.th), tg = cv.getContext('2d');
  tg.imageSmoothingQuality = 'high';
  tg.setTransform(R * AX / K, R * AY / K, -R * AX / K, R * AY / K, R * (sc.ax - lx), R * (sc.ay - ly));
  const s = tr ? tr.s : 1, c = tr ? Math.cos(tr.rot) : 1, sn = tr ? Math.sin(tr.rot) : 0;
  if (tr) { tg.scale(s, s); tg.rotate(tr.rot); }                                         // wzór obrócony i przeskalowany (druga warstwa gruntu — zrywa powtarzalność kafelka)
  tg.fillStyle = tg.createPattern(t.c, 'repeat');
  let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9;
  for (const [sx, sy] of [[lx, ly], [lx + m.tw / R, ly], [lx + m.tw / R, ly + m.th / R], [lx, ly + m.th / R]]) {
    const px = sx - sc.ax, py = sy - sc.ay, wu = (px / AX + py / AY) / 2 * K, wv = (py / AY - px / AX) / 2 * K;
    const u = (c * wu + sn * wv) / s, v = (-sn * wu + c * wv) / s;                       // z powrotem do układu wzoru (odwrotność skali i obrotu)
    u0 = Math.min(u0, u); v0 = Math.min(v0, v); u1 = Math.max(u1, u); v1 = Math.max(v1, v);
  }
  tg.fillRect(u0 - 4, v0 - 4, u1 - u0 + 8, v1 - v0 + 8);
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(m.cv, 0, 0);
  gBlit(sc, m, cv, alpha, blend); gRelease(cv);
}
function gPaintColor(sc, m, color, alpha = 1) {
  if (!m) return;
  const cv = newCanvas(m.tw, m.th), g = cv.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, m.tw, m.th); g.globalCompositeOperation = 'destination-in'; g.drawImage(m.cv, 0, 0);
  gBlit(sc, m, cv, alpha, null); gRelease(cv);
}

class Ground {
  /* map: { size, tiles[{h,e,wk,k}] }; o: { climate, lods, budget, statics(tx0,ty0,tx1,ty1,emit(spr,x,y,k)), sigOf(tx0,ty0,tx1,ty1) → liczba } */
  constructor(map, o = {}) {
    const N = this.N = map.size; this.map = map;
    this.climate = o.climate || (map.meta && map.meta.climate) || 'temperate';
    this.mat = GMAT[this.climate] || GMAT.temperate;
    this.lods = o.lods || [1, 0.5, 0.25];
    this.statics = o.statics || null; this.sigOf = o.sigOf || null;
    this.px0 = N * AX;                                               // plan: x ∈ [−N·AX, N·AX], y ∈ [0, 2·N·AY]
    this.ncx = Math.ceil(2 * N * AX / GCH); this.ncy = Math.ceil(2 * N * AY / GCH);
    this.chunks = new Array(this.ncx * this.ncy).fill(null);
    this.kind = new Uint8Array(N * N); this.elev = new Float32Array(N * N); this.shore = new Uint8Array(N * N); this.deep = new Uint8Array(N * N);
    this.analyze();
    this.shadeCv = null;                                             // mapa cieniowania — tworzona przy pierwszym wypieku (nie przy ładowaniu silnika)
    this.queue = []; this.frame = 0; this.pixels = 0; this.budget = o.budget || 26e6; this.vcx = 0; this.vcy = 0;
    this.stats = { baked: 0, ms: 0, over: 0 };
  }

  analyze() {
    const N = this.N, t = this.map.tiles, K = this.kind;
    for (let i = 0; i < N * N; i++) {
      const q = t[i];
      K[i] = q.h === 0 ? (GKIND[q.wk] ?? 10) : q.h === 2 ? 6 : (GKIND_K[q.k] ?? 0);
      this.elev[i] = q.h === 0 ? 1 : Math.max(1, q.e || 1);
    }
    const wet = k => k >= 10 && k !== 13 && k !== 14, queue = [];
    this.deep.fill(0);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {            // brzeg: woda z lądem (lub brodem) w sąsiedztwie 8; głębia: odległość od brzegu
      const i = y * N + x, k = K[i]; if (!wet(k)) continue;
      let land = false;
      for (let dy = -1; dy <= 1 && !land; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (!wet(K[ny * N + nx])) { land = true; break; } }
      if (land) { this.shore[i] = 1; this.deep[i] = 1; queue.push(i); }
    }
    for (let h = 0; h < queue.length; h++) {
      const i = queue[h], x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const j = ny * N + nx; if (wet(K[j]) && !this.deep[j]) { this.deep[j] = Math.min(9, this.deep[i] + 1); queue.push(j); } }
    }
  }

  /* ---------- geometria ---------- */
  /* narożnik siatki pól z szumem (spójny dla sąsiednich pól → brak dziur) i wypchnięty poza mapę na jej krawędziach (maska romboidu przycina to z powrotem) */
  corner(cx, cy) {
    const N = this.N;
    return [cx === 0 ? -1.5 : cx === N ? N + 1.5 : cx + (gHash(cx, cy, 11) - 0.5) * 0.5, cy === 0 ? -1.5 : cy === N ? N + 1.5 : cy + (gHash(cx, cy, 12) - 0.5) * 0.5];
  }
  poly(i, grow = 0) {
    const N = this.N, x = i % N, y = (i / N) | 0, cx = x + 0.5, cy = y + 0.5;
    return [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([a, b]) => {
      const p = this.corner(a, b), sx = p[0] > cx ? 1 : -1, sy = p[1] > cy ? 1 : -1;
      return [p[0] + sx * grow, p[1] + sy * grow];
    });
  }
  chunk(cx, cy) {
    const id = cy * this.ncx + cx; let ch = this.chunks[id];
    if (ch) return ch;
    const N = this.N, X0 = cx * GCH - this.px0, Y0 = cy * GCH, MG = 170, tiles = [];
    let core = false, tx0 = N, ty0 = N, tx1 = -1, ty1 = -1;
    for (let ty = 0; ty < N; ty++) for (let tx = 0; tx < N; tx++) {
      const bx0 = (tx - ty - 1) * AX, bx1 = (tx - ty + 1) * AX, by0 = (tx + ty) * AY, by1 = (tx + ty + 2) * AY;
      if (bx1 < X0 - MG || bx0 > X0 + GCH + MG || by1 < Y0 - MG || by0 > Y0 + GCH + MG) continue;
      tiles.push(ty * N + tx);
      if (tx < tx0) tx0 = tx; if (tx > tx1) tx1 = tx; if (ty < ty0) ty0 = ty; if (ty > ty1) ty1 = ty;
      if (!(bx1 <= X0 || bx0 >= X0 + GCH || by1 <= Y0 || by0 >= Y0 + GCH)) core = true;
    }
    ch = { id, cx, cy, X0, Y0, tiles, empty: !core, base: [null, null, null], over: [null, null, null], overSig: [NaN, NaN, NaN], sig: 0, sigT: -1e9, used: 0, fx: null, bbox: [tx0, ty0, tx1, ty1] };
    this.chunks[id] = ch; return ch;
  }

  /* ---------- cieniowanie wzgórz ---------- */
  makeShade() {
    const N = this.N, S = GS, W = N * S, e = this.elev, H = new Float32Array(W * W), sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < W; y++) {
      const v = (y + 0.5) / S - 0.5, y0 = Math.floor(v), fy = sm(v - y0), ya = Math.max(0, Math.min(N - 1, y0)), yb = Math.max(0, Math.min(N - 1, y0 + 1));
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5) / S - 0.5, x0 = Math.floor(u), fx = sm(u - x0), xa = Math.max(0, Math.min(N - 1, x0)), xb = Math.max(0, Math.min(N - 1, x0 + 1));
        const a = e[ya * N + xa], b = e[ya * N + xb], c = e[yb * N + xa], d = e[yb * N + xb];
        H[y * W + x] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      }
    }
    const ci = v => v < 0 ? 0 : v > W - 1 ? W - 1 : v;
    const boxBlur = (src, r) => {                                                              // rozmycie pudełkowe (poziomo, potem pionowo), krawędź powielona
      const tmp = new Float32Array(W * W), out = new Float32Array(W * W), n = 2 * r + 1;
      for (let y = 0; y < W; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * W + ci(x)]; for (let x = 0; x < W; x++) { tmp[y * W + x] = s / n; s += src[y * W + ci(x + r + 1)] - src[y * W + ci(x - r)]; } }
      for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[ci(y) * W + x]; for (let y = 0; y < W; y++) { out[y * W + x] = s / n; s += tmp[ci(y + r + 1) * W + x] - tmp[ci(y - r) * W + x]; } }
      return out;
    }, blur = (src, r) => boxBlur(boxBlur(src, r), r);
    const Hs = blur(H, Math.round(S * 0.35)), Hl = blur(H, S * 3);
    const cv = newCanvas(W, W), g = cv.getContext('2d'), im = g.createImageData(W, W), d = im.data;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const xm = Math.max(0, x - 1), xp = Math.min(W - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(W - 1, y + 1);
      const hx = (Hs[y * W + xp] - Hs[y * W + xm]) / (xp - xm) * S, hy = (Hs[yp * W + x] - Hs[ym * W + x]) / (yp - ym) * S;   // poziomy na pole
      const v = 0.6 * (0.62 * hx + 0.1 * hy) + 0.08 * (Hs[y * W + x] - Hl[y * W + x]) + 0.03 * (Hs[y * W + x] - 1), o = (y * W + x) * 4;
      const gl = Math.max(0, Math.min(255, 128 + v * 380));                          // szarość 128 = bez zmian; nakładka 'overlay' zachowuje barwę i fakturę gruntu
      d[o] = gl; d[o + 1] = gl; d[o + 2] = gl * 0.98 + 3; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  }

  /* ---------- wypiek gruntu chunka ---------- */
  bakeBase(ch, li) {
    const R = this.lods[li], N = this.N, M = this.mat, size = GCH + 2 * GPAD, K = this.kind;
    const sc = new Scene(size, size, -(ch.X0 - GPAD), -(ch.Y0 - GPAD), { R, F: 1, ground: true, wear: 0 });
    const by = {}; for (const i of ch.tiles) { (by[K[i]] = by[K[i]] || []).push(i); }
    const polysOf = (list, grow = 0) => list.map(i => this.poly(i, grow));
    const full = gFull(sc);
    gPaintTex(sc, full, M.base[0], M.base[1], 1);
    gPaintTex(sc, full, M.base[0], M.base[1], 0.5, null, { s: 1.37, rot: 0.62 });
    if (M.vary) gPaintTex(sc, full, 'vary', M.vary, M.varyA);
    gDrop(full);
    // rodzaje gruntu lądowego: bagno, wydma, ruchome piaski, zaspa, oaza (zieleń w piasku), skała (klify i pola skalne)
    const land = [[1, 'bog', null, 22, 0.9], [2, 'dune', null, 26, 1], [3, 'quick', null, 18, 1], [4, 'drift', null, 26, 1], [5, 'grass', 'green', 30, 1], [6, 'rock', M.rock, 20, 0.92]];
    for (const [k, mat, pal, blur, al] of land) {
      if (!by[k]) continue;
      const m = gCurve(gMask(sc, polysOf(by[k], k === 6 ? 0.04 : 0.02), blur), k === 6 ? 0.28 : 0.22, k === 6 ? 0.72 : 0.78);
      gPaintTex(sc, m, mat, pal, al); gDrop(m);
    }
    // woda: plaża → mokry brzeg → piana → ciało wody (po rodzaju) → głębia; bród: żwir + płytka woda; lód: tafla z grubym brzegiem
    const wet = [].concat(by[10] || [], by[11] || [], by[12] || []);
    const shoreWet = wet.filter(i => this.shore[i]);
    if (wet.length) {
      if (shoreWet.length) {
        const mb = gCurve(gMask(sc, polysOf(shoreWet, 0.6), 34), 0.16, 0.7);
        gPaintTex(sc, mb, M.beach[0], M.beach[1], 1); gDrop(mb);
        const mw = gCurve(gMask(sc, polysOf(shoreWet, 0.18), 24), 0.2, 0.62);
        gPaintColor(sc, mw, M.wet, 1); gDrop(mw);
      }
      const mf = gCurve(gMask(sc, polysOf(wet, 0.02), 30), 0.12, 0.42);
      gPaintColor(sc, mf, 'rgba(244,252,252,0.8)', 0.7); gDrop(mf);
      for (const k of [10, 11, 12]) {
        if (!by[k]) continue;
        const name = { 10: 'sea', 11: 'lake', 12: 'river' }[k], m = gCurve(gMask(sc, polysOf(by[k], 0.02), 30), 0.4, 0.5);
        gPaintTex(sc, m, 'water', M.water[name], 1); gDrop(m);
      }
      const dp = wet.filter(i => this.deep[i] >= 3);
      if (dp.length) { const md = gMask(sc, polysOf(dp, -0.1), 44); gPaintColor(sc, md, M.depth, 1); gDrop(md); }
    }
    if (by[13]) {                                                     // bród
      const mg = gCurve(gMask(sc, polysOf(by[13], 0.32), 24), 0.28, 0.62);
      gPaintTex(sc, mg, 'gravel', 'tan', 1); gDrop(mg);
      const mw = gCurve(gMask(sc, polysOf(by[13], 0.06), 24), 0.38, 0.52);
      gPaintTex(sc, mw, 'water', 'river', 0.5); gDrop(mw);
    }
    if (by[14]) {                                                     // lód
      const mr = gCurve(gMask(sc, polysOf(by[14], 0.1), 26), 0.14, 0.4);
      gPaintColor(sc, mr, 'rgba(120,152,184,0.55)', 1); gDrop(mr);
      const mi = gCurve(gMask(sc, polysOf(by[14], 0.02), 26), 0.4, 0.5);
      gPaintTex(sc, mi, 'water', 'ice', 1); gDrop(mi);
    }
    // cieniowanie wzgórz: jedna mapa świateł dla całej mapy, rzucona izometrycznie
    if (!this.shadeCv) this.shadeCv = this.makeShade();
    const P = sc.pg, k0 = R * AX / GS, k1 = R * AY / GS;
    P.save(); P.setTransform(k0, k1, -k0, k1, -R * (ch.X0 - GPAD), -R * (ch.Y0 - GPAD)); P.imageSmoothingEnabled = true; P.imageSmoothingQuality = 'high'; P.globalCompositeOperation = 'soft-light'; P.drawImage(this.shadeCv, 0, 0); P.restore();
    // przycięcie do rombu mapy (poza nim — pustka); chunki całkowicie wewnątrz nie wymagają przycinania
    const inside = (px, py) => { const wx = (px / AX + py / AY) / 2, wy = (py / AY - px / AX) / 2; return wx > 0.3 && wy > 0.3 && wx < N - 0.3 && wy < N - 0.3; };
    const x0 = ch.X0 - GPAD, y0 = ch.Y0 - GPAD, x1 = ch.X0 + GCH + GPAD, y1 = ch.Y0 + GCH + GPAD;
    if (!(inside(x0, y0) && inside(x1, y0) && inside(x0, y1) && inside(x1, y1))) {
      const mk = newCanvas(sc.pcv.width, sc.pcv.height), mg = mk.getContext('2d');          // (softFill odpada: wielokąt tak duży, że sztuczka z przesunięciem cienia zaśmiecałaby maskę)
      mg.setTransform(R, 0, 0, R, 0, 0); mg.fillStyle = '#fff'; mg.beginPath();
      [[0, 0], [N, 0], [N, N], [0, N]].forEach(([x, y], i) => { const p = sc.P(x, y, 0); i ? mg.lineTo(p[0], p[1]) : mg.moveTo(p[0], p[1]); }); mg.closePath(); mg.fill();
      P.save(); P.setTransform(1, 0, 0, 1, 0, 0); P.globalCompositeOperation = 'destination-in'; P.drawImage(mk, 0, 0); P.restore(); gRelease(mk);
    }
    return sc.pcv;
  }

  /* ---------- nakładka: place, cienie i niskie dekory obiektów statycznych ---------- */
  bakeOver(ch, li) {
    if (!this.statics) return null;
    const R = this.lods[li], [tx0, ty0, tx1, ty1] = ch.bbox, items = [], size = GCH + 2 * GPAD, ox = ch.X0 - GPAD, oy = ch.Y0 - GPAD;
    this.statics(Math.max(0, tx0 - 2), Math.max(0, ty0 - 2), Math.min(this.N - 1, tx1 + 2), Math.min(this.N - 1, ty1 + 2), (spr, x, y, k = 1, withBody = false) => {   // withBody: także warstwa obiektu 'c' (niskie dekory — nie wymagają sortowania głębi)
      const X = (x - y) * AX, Y = (x + y) * AY, a = X - spr.ax * k, b = Y - spr.ay * k;
      if (a > ox + size || b > oy + size || a + spr.w * k < ox || b + spr.h * k < oy) return;
      items.push({ spr, X, Y, k, body: withBody });
    });
    if (!items.length) return null;
    const cv = newCanvas(Math.ceil(size * R), Math.ceil(size * R)), g = cv.getContext('2d');
    g.setTransform(R, 0, 0, R, -ox * R, -oy * R); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
    for (const l of ['p', 'u', 'c']) for (const it of items) {
      const im = it.spr[l]; if (!im || (l === 'c' && !it.body)) continue;
      const res = l === 'u' ? (it.spr.Ru ?? it.spr.R) : l === 'p' ? (it.spr.Rp ?? it.spr.R) : it.spr.R;
      g.drawImage(lodPick(im, res / (it.k * R)), it.X - it.spr.ax * it.k, it.Y - it.spr.ay * it.k, it.spr.w * it.k, it.spr.h * it.k);
    }
    return cv;
  }

  /* wypiek jednego poziomu chunka: grunt (jeśli brak) i nakładka (jeśli nieaktualna) */
  bake(ch, li) {
    const t0 = gNow();
    if (!ch.base[li]) { ch.base[li] = this.bakeBase(ch, li); this.pixels += ch.base[li].width * ch.base[li].height; this.stats.baked++; }
    if (ch.overSig[li] !== ch.sig) {
      const old = ch.over[li]; if (old) { this.pixels -= old.width * old.height; gRelease(old); }
      const o = this.bakeOver(ch, li); ch.over[li] = o; ch.overSig[li] = ch.sig; if (o) this.pixels += o.width * o.height; this.stats.over++;
    }
    this.stats.ms += gNow() - t0;
  }
  refreshSig(ch, now) {
    if (now - ch.sigT < 250 || !this.sigOf) return;
    ch.sigT = now; const [tx0, ty0, tx1, ty1] = ch.bbox;
    ch.sig = this.sigOf(Math.max(0, tx0 - 2), Math.max(0, ty0 - 2), Math.min(this.N - 1, tx1 + 2), Math.min(this.N - 1, ty1 + 2));
  }

  /* który poziom rozdzielczości pasuje do skali ekranu (px urządzenia na px logiczny) */
  lodFor(need) { return need >= this.lods[0] * 0.72 ? 0 : need >= this.lods[1] * 0.72 ? 1 : 2; }
  want(ch, li) { if (!this.queue.some(q => q.ch === ch && q.li === li)) this.queue.push({ ch, li }); }
  evict(keep) {                                                       // zwolnienie najdawniej używanych chunków po przekroczeniu budżetu pikseli
    if (this.pixels <= this.budget) return;
    const all = this.chunks.filter(c => c && c.used < this.frame - 30 && (c.base[0] || c.base[1] || c.over[0] || c.over[1])).sort((a, b) => a.used - b.used);
    for (const c of all) {
      for (const li of [0, 1]) for (const k of ['base', 'over']) { const im = c[k][li]; if (im) { this.pixels -= im.width * im.height; gRelease(im); c[k][li] = null; } if (k === 'over') c.overSig[li] = NaN; }
      if (this.pixels <= this.budget * 0.8) break;
    }
  }
  /* praca w tle: wypieka kolejkowane chunki w budżecie czasu (najbliższe środka widoku najpierw); co najmniej jeden na wywołanie */
  work(ms = 10) {
    if (!this.queue.length) return 0;
    const t0 = gNow(); let n = 0;
    this.queue.sort((a, b) => (Math.hypot(a.ch.X0 + GCH / 2 - this.vcx, a.ch.Y0 + GCH / 2 - this.vcy) + a.li * 400) - (Math.hypot(b.ch.X0 + GCH / 2 - this.vcx, b.ch.Y0 + GCH / 2 - this.vcy) + b.li * 400));
    while (this.queue.length && (n === 0 || gNow() - t0 < ms)) { const q = this.queue.shift(); this.bake(q.ch, q.li); n++; }
    return n;
  }
  /* najlepszy dostępny poziom: żądany, w razie braku — drobniejszy, potem grubszy */
  bestLod(ch, li) {
    if (ch.base[li]) return li;
    for (let l = li - 1; l >= 0; l--) if (ch.base[l]) return l;
    for (let l = li + 1; l < this.lods.length; l++) if (ch.base[l]) return l;
    return -1;
  }
  visible(ox, oy, k, W, H) {                                          // zakres chunków widocznych na ekranie
    const x0 = (0 - ox) / k, x1 = (W - ox) / k, y0 = (0 - oy) / k, y1 = (H - oy) / k;
    return { cx0: Math.max(0, Math.floor((x0 + this.px0) / GCH)), cx1: Math.min(this.ncx - 1, Math.floor((x1 + this.px0) / GCH)), cy0: Math.max(0, Math.floor(y0 / GCH)), cy1: Math.min(this.ncy - 1, Math.floor(y1 / GCH)), x0, x1, y0, y1 };
  }

  /* Wypiek wstępny (ekran ładowania): najgrubszy poziom dla całej mapy + żądany poziom dla chunków widocznych.
     view: { ox, oy, k, dpr, W, H } — ten sam układ co w draw(); onProgress(0..1) */
  async prebake(view, onProgress) {
    const jobs = [], coarse = this.lods.length - 1, li = view ? this.lodFor(view.k * view.dpr) : coarse;
    for (let cy = 0; cy < this.ncy; cy++) for (let cx = 0; cx < this.ncx; cx++) { const ch = this.chunk(cx, cy); if (!ch.empty) jobs.push([ch, coarse]); }
    if (view) { const v = this.visible(view.ox, view.oy, view.k, view.W, view.H); this.vcx = (v.x0 + v.x1) / 2; this.vcy = (v.y0 + v.y1) / 2;
      for (let cy = Math.max(0, v.cy0 - 1); cy <= Math.min(this.ncy - 1, v.cy1 + 1); cy++) for (let cx = Math.max(0, v.cx0 - 1); cx <= Math.min(this.ncx - 1, v.cx1 + 1); cx++) { const ch = this.chunk(cx, cy); if (!ch.empty && li < coarse) jobs.push([ch, li]); } }
    const now = gNow(); let last = 0;
    for (let i = 0; i < jobs.length; i++) {
      const [ch, l] = jobs[i]; this.refreshSig(ch, now);
      if (onProgress && gNow() - last > 40) { onProgress(i / jobs.length); await gNextPaint(); last = gNow(); }
      this.bake(ch, l);
    }
    if (onProgress) onProgress(1);
  }

  /* rysowanie widocznych chunków: (ox, oy) = położenie początku planu na ekranie (px CSS), k = px CSS na px logiczny planu; ctx ma skalę dpr */
  draw(ctx, ox, oy, k, dpr, W, H, now = gNow()) {
    this.frame++;
    const v = this.visible(ox, oy, k, W, H), li = this.lodFor(k * dpr);
    this.vcx = (v.x0 + v.x1) / 2; this.vcy = (v.y0 + v.y1) / 2;
    const sx = x => Math.round((ox + x * k) * dpr) / dpr, sy = y => Math.round((oy + y * k) * dpr) / dpr;
    ctx.imageSmoothingEnabled = true;
    for (let cy = v.cy0; cy <= v.cy1; cy++) for (let cx = v.cx0; cx <= v.cx1; cx++) {
      const ch = this.chunk(cx, cy); if (ch.empty) continue;
      ch.used = this.frame; this.refreshSig(ch, now);
      const bi = this.bestLod(ch, li);
      if (bi !== li || ch.overSig[li] !== ch.sig) this.want(ch, li);
      if (bi < 0) continue;
      const R = this.lods[bi], x0 = sx(ch.X0), y0 = sy(ch.Y0), x1 = sx(ch.X0 + GCH), y1 = sy(ch.Y0 + GCH), g = GPAD * R, c = GCH * R;
      ctx.drawImage(ch.base[bi], g, g, c, c, x0, y0, x1 - x0, y1 - y0);
      const o = ch.over[bi] || ch.over[li]; if (o) { const Ro = o.width / (GCH + 2 * GPAD); ctx.drawImage(o, GPAD * Ro, GPAD * Ro, GCH * Ro, GCH * Ro, x0, y0, x1 - x0, y1 - y0); }
    }
    this.evict();
  }

  /* ---------- ruch wody: błyski na tafli (rysowane co klatkę na gotowym gruncie) ---------- */
  fxOf(ch) {
    if (ch.fx) return ch.fx;
    const N = this.N, K = this.kind, sp = [];
    for (const i of ch.tiles) {
      const k = K[i]; if (k < 10 || k === 13 || k === 14) continue;
      const x = i % N, y = (i / N) | 0, cxp = (x - y) * AX;
      if (cxp < ch.X0 || cxp >= ch.X0 + GCH || (x + y + 1) * AY < ch.Y0 || (x + y + 1) * AY >= ch.Y0 + GCH) continue;
      for (let n = 0; n < 3; n++) { const a = 0.12 + 0.76 * gHash(x, y, 31 + n), b = 0.12 + 0.76 * gHash(x, y, 41 + n); sp.push(((x + a) - (y + b)) * AX, ((x + a) + (y + b)) * AY, gHash(x, y, 51 + n) * 6.283, 0.5 + gHash(x, y, 61 + n)); }
    }
    return ch.fx = Float32Array.from(sp);
  }
  drawFx(ctx, t, ox, oy, k, W, H) {
    if (k < 0.18) return;
    const v = this.visible(ox, oy, k, W, H), N = this.N;
    for (let cy = v.cy0; cy <= v.cy1; cy++) for (let cx = v.cx0; cx <= v.cx1; cx++) {
      const ch = this.chunks[cy * this.ncx + cx]; if (!ch || ch.empty || (!ch.base[0] && !ch.base[1])) continue;
      const fx = this.fxOf(ch);
      for (let j = 0; j < fx.length; j += 4) {
        const a = Math.sin(t * 1.7 * fx[j + 3] + fx[j + 2]); if (a < 0.55) continue;
        const X = ox + fx[j] * k, Y = oy + fx[j + 1] * k; if (X < -8 || Y < -8 || X > W + 8 || Y > H + 8) continue;
        const w = (7 + 5 * fx[j + 3]) * k * (0.7 + 0.5 * a);
        ctx.fillStyle = 'rgba(255,255,255,' + ((a - 0.55) * 1.5).toFixed(2) + ')'; ctx.fillRect(X - w / 2, Y, w, Math.max(1, 1.6 * k));
      }
    }
  }
  /* unieważnienie gruntu po zmianie terenu (np. wyrównanie pola pod budynek): chunki dotknięte zakresem pól wypiekają się od nowa */
  invalidate(tx0, ty0, tx1, ty1) {
    this.analyze(); this.shadeCv = null;
    for (const ch of this.chunks) if (ch && ch.bbox[2] >= tx0 && ch.bbox[0] <= tx1 && ch.bbox[3] >= ty0 && ch.bbox[1] <= ty1) {
      for (let l = 0; l < 3; l++) { for (const k of ['base', 'over']) { const im = ch[k][l]; if (im) { this.pixels -= im.width * im.height; gRelease(im); ch[k][l] = null; } } ch.overSig[l] = NaN; }
    }
  }
  /* zwolnienie całej pamięci (zmiana mapy / wyjście do menu) */
  dispose() { for (const ch of this.chunks) if (ch) for (let l = 0; l < 3; l++) for (const k of ['base', 'over']) { if (ch[k][l]) gRelease(ch[k][l]); ch[k][l] = null; } this.chunks.fill(null); this.pixels = 0; this.queue.length = 0; }
}
