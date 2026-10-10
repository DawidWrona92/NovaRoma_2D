/* ====================== ZWIERZĘTA ======================
   Sprite'y fauny rysowane kodem (surowy canvas jak drzewa i postacie), profil zwrócony w prawo — gra odbija go lustrzanie wg kierunku marszu.
   Trzy konstruktory ciała: czworonóg (sarna, królik, zające, lis, dzik, renifer, łoś, gazela, wielbłąd), ptak (bocian, żuraw, wrona, mewa, sęp)
   i niski korpus (foka, jaszczurka). Rozmiary w px ekranu po wypieku. Kotwica (ax, ay): środek tułowia nad linią gruntu; u ptaków w locie — środek ciała.
   bakeFauna(rodzaj) → { walk:[klatki], idle:[…], dead:[…], fly:[…] }. Cień (warstwa 'u') jest symetryczny, więc odbicie sprite'a go nie psuje. */

const FAUNA = {
  /* ---- zwierzyna łowna i czworonogi ---- */
  roe:        { b: 'quad', pl: 'Sarna', len: 30, dep: 14, leg: 16, legW: 2.4, nk: 11, na: -1.0, hd: 11, hdH: 6.4, ear: [6.5, 3.4], tail: { t: 'short', len: 3.4, col: '#f1e6d2' }, col: '#a9683a', bel: '#e0cdac', dk: '#3a2618', acc: '#f1e6d2', rump: true, antler: 'roe', antlerH: 12, R: 3 },
  rabbit:     { b: 'quad', pl: 'Królik', lago: true, len: 13, dep: 8, leg: 3.2, legW: 1.8, nk: 2, na: -0.6, hd: 6, hdH: 5, ear: [8, 2.7], tail: { t: 'tuft', len: 2.4, col: '#f4efe6' }, col: '#8e7b62', bel: '#d8ccb4', dk: '#3a2c20', hop: true, R: 3 },
  hare:       { b: 'quad', pl: 'Zając polarny', lago: true, len: 17, dep: 10, leg: 4.4, legW: 2.1, nk: 2.4, na: -0.6, hd: 7.4, hdH: 6, ear: [10, 3.1], earTip: '#2a2a30', tail: { t: 'tuft', len: 2.8, col: '#ffffff' }, col: '#eef2f5', bel: '#ffffff', dk: '#2a2a30', hop: true, R: 3 },
  desertRabbit: { b: 'quad', pl: 'Królik pustynny', lago: true, len: 14.5, dep: 8.4, leg: 3.8, legW: 1.9, nk: 2.2, na: -0.6, hd: 6.4, hdH: 5.2, ear: [11, 2.9], tail: { t: 'tuft', len: 2.4, col: '#efe2c4' }, col: '#cdb283', bel: '#efe2c4', dk: '#5a4630', hop: true, R: 3 },
  fox:        { b: 'quad', pl: 'Lis', len: 22, dep: 9.6, leg: 10.4, legW: 1.9, nk: 6, na: -0.7, hd: 10, hdH: 5.4, ear: [5.6, 3.6], tail: { t: 'bush', len: 17, w: 6.6, tip: '#f4f1ea' }, col: '#c0561c', bel: '#efe6d6', dk: '#2a1a12', legCol: '#3a2418', cheek: '#f3ece0', R: 3 },
  arcticFox:  { b: 'quad', pl: 'Lis polarny', len: 20, dep: 9.6, leg: 9.4, legW: 1.9, nk: 5.4, na: -0.7, hd: 8.6, hdH: 5.2, ear: [3.6, 3.2], tail: { t: 'bush', len: 14, w: 6.4 }, col: '#f2f5f8', bel: '#ffffff', dk: '#3a3e46', cheek: '#ffffff', R: 3 },
  boar:       { b: 'quad', pl: 'Dzik', len: 34, dep: 18, leg: 10, legW: 3.4, nk: 5, na: -0.3, hd: 15, hdH: 9.4, ear: [5, 4], tail: { t: 'stub', len: 5 }, col: '#4d3b2d', bel: '#3a2c22', dk: '#1e140e', tusk: true, mane: true, ha: 0.42, R: 3 },
  reindeer:   { b: 'quad', pl: 'Renifer', len: 38, dep: 17, leg: 22, legW: 3, nk: 16, na: -0.85, hd: 14, hdH: 7.6, ear: [6, 3.4], tail: { t: 'short', len: 4, col: '#f2ede2' }, col: '#8d7967', bel: '#e8e2d6', dk: '#3c2e24', acc: '#f0ebe0', neckMane: true, antler: 'rein', antlerH: 30, R: 2 },
  elk:        { b: 'quad', pl: 'Łoś', len: 50, dep: 25, leg: 33, legW: 4.4, nk: 18, na: -0.62, hd: 22, hdH: 11, ear: [8.5, 4.6], tail: { t: 'short', len: 4, col: '#4b3629' }, col: '#4b3629', bel: '#5d4636', dk: '#201610', legCol: '#8f7e68', hump: 4.5, bell: true, antler: 'elk', antlerH: 28, ha: 0.5, R: 2 },
  gazelle:    { b: 'quad', pl: 'Gazela', len: 30, dep: 12.4, leg: 20, legW: 2, nk: 12, na: -0.95, hd: 9.6, hdH: 5.4, ear: [6.5, 3], tail: { t: 'short', len: 3.6, col: '#2a1a10' }, col: '#c9965a', bel: '#f4ead8', dk: '#2a1a10', acc: '#f7efe0', rump: true, stripe: '#6b4a2c', horn: 'lyre', R: 3 },
  camel:      { b: 'quad', pl: 'Wielbłąd', len: 44, dep: 22, leg: 34, legW: 3.8, nk: 24, na: -0.9, nkCurve: 0.45, hd: 12, hdH: 7, ear: [3.2, 2.6], tail: { t: 'short', len: 7, col: '#8a6c3a' }, col: '#c7a565', bel: '#d6b97e', dk: '#4a3820', hump: 10, ha: 0.28, R: 2 },
  /* ---- ptaki ---- */
  stork:      { b: 'bird', pl: 'Bocian', len: 17, dep: 8, leg: 22, legW: 1.4, legCol: '#c8382c', nk: 14, hd: 3.2, beak: [13, '#d8402c'], col: '#f4f2ec', wing: '#202026', bel: '#ffffff', tail: 5, span: 72, trail: true, R: 3 },
  crane:      { b: 'bird', pl: 'Żuraw', len: 17, dep: 8.4, leg: 24, legW: 1.4, legCol: '#3a3a40', nk: 17, hd: 3, beak: [7.5, '#8a9098'], col: '#8c96a0', wing: '#6e7882', neckCol: '#2e323a', cheek: '#f2f2ee', crown: '#c8302a', bel: '#9aa4ae', tail: 7, span: 72, trail: true, R: 3 },
  crow:       { b: 'bird', pl: 'Wrona', len: 12, dep: 6.4, leg: 5.6, legW: 1.1, legCol: '#222226', nk: 3, hd: 3.2, beak: [5.6, '#2a2a2e'], col: '#1c1c22', wing: '#2b2c38', bel: '#26262e', tail: 5, span: 36, R: 3 },
  gull:       { b: 'bird', pl: 'Mewa', len: 14, dep: 6.6, leg: 5.4, legW: 1.2, legCol: '#e08a3a', nk: 3.4, hd: 3.2, beak: [5.6, '#f0c040'], col: '#f4f6f8', wing: '#a9b3bd', wingTip: '#1c1c22', bel: '#ffffff', tail: 4.5, span: 48, R: 3 },
  vulture:    { b: 'bird', pl: 'Sęp', len: 20, dep: 10, leg: 9, legW: 1.8, legCol: '#8a8680', nk: 8, hd: 3.6, beak: [6, '#c9b88a'], hook: true, col: '#4b3a2c', wing: '#5a4636', wingTip: '#2a2018', bald: '#b4948a', ruff: '#d8d0c0', bel: '#4b3a2c', tail: 7, span: 84, R: 2 },
  /* ---- niski korpus ---- */
  seal:       { b: 'low', pl: 'Foka', len: 40, dep: 14, col: '#8b9096', bel: '#c8ccd0', dk: '#4a4e56', R: 3 },
  lizard:     { b: 'low', pl: 'Jaszczurka', len: 14, dep: 4.4, tail: 14, col: '#9a8b4c', bel: '#d6c88a', dk: '#5a4a22', R: 3 }
};
/* zestaw rodzajów wypiekanych dla klimatu (foka tylko na mapach z morzem lub lodem — decyduje o tym gra przez opts.sea) */
const FAUNA_BY_CLIMATE = {
  temperate: ['roe', 'rabbit', 'fox', 'boar', 'stork', 'crow'],
  eastern: ['roe', 'rabbit', 'boar', 'elk', 'crane', 'crow', 'fox'],
  snow: ['reindeer', 'hare', 'arcticFox', 'seal', 'gull', 'crow'],
  desert: ['gazelle', 'desertRabbit', 'camel', 'lizard', 'vulture', 'fox']
};
const faunaKinds = climate => (FAUNA_BY_CLIMATE[climate] || FAUNA_BY_CLIMATE.temperate).slice();

/* ---------- pomocnicze ---------- */
const faHash = s => { let a = 7; for (const ch of s) a = (a * 31 + ch.charCodeAt(0)) % 100003; return a; };
function faCurve(p0, p1, p2, n = 8) {                                  // punkty krzywej kwadratowej (szyja, ogon)
  const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); }
  return o;
}
/* wstęga o zmiennej szerokości wokół polilinii: w = liczba, [w0, w1] albo tablica szerokości punktów; obrys tylko po bokach (koniec przy tułowiu zlewa się z ciałem) */
function faRib(g, pts, w, fill, edge) {
  const n = pts.length, L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    const ww = (Array.isArray(w) ? (w.length === n ? w[i] : lerp(w[0], w[w.length - 1], i / (n - 1))) : w) / 2;
    L.push([p[0] + nx * ww, p[1] + ny * ww]); Rr.push([p[0] - nx * ww, p[1] - ny * ww]);
  }
  g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); for (let i = n - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
  g.fillStyle = fill; g.fill();
  if (edge) { g.strokeStyle = edge; g.lineWidth = 1; g.lineJoin = 'round'; for (const s of [L, Rr]) { g.beginPath(); s.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } }
}
function faLeaf(g, x, y, ang, len, w, fill, edge) {                    // liść / ucho / pióro: podstawa w (x, y), czubek w kierunku ang
  const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
  g.beginPath(); g.moveTo(x + nx * w / 2, y + ny * w / 2);
  g.quadraticCurveTo(x + c * len * 0.55 + nx * w * 0.66, y + s * len * 0.55 + ny * w * 0.66, x + c * len, y + s * len);
  g.quadraticCurveTo(x + c * len * 0.55 - nx * w * 0.66, y + s * len * 0.55 - ny * w * 0.66, x - nx * w / 2, y - ny * w / 2); g.closePath();
  g.fillStyle = fill; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = 0.9; g.lineJoin = 'round'; g.stroke(); }
}
function faBone(g, pts, w, col, k = 1) {                               // poroże / róg: ciemny obrys, rdzeń i połysk
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.strokeStyle = 'rgba(16,10,6,0.9)'; g.lineWidth = w * k + 1.5; path(); g.stroke();
  g.strokeStyle = css(col); g.lineWidth = w * k; path(); g.stroke();
  g.strokeStyle = css(scaleC(col, 1.3), 0.7); g.lineWidth = Math.max(0.5, w * k * 0.3); path(); g.stroke();
}
/* futro / pióra: krótkie pociągnięcia nałożone tylko na już narysowane piksele (source-atop); ziarno stałe dla gatunku, więc klatki nie migoczą */
function faFur(g, seed, x0, y0, x1, y1, n, o = {}) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'source-atop'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), a = (o.ang ?? 0.35) + (r() - 0.5) * 1.0, l = (o.len ?? 2.6) * (0.6 + r() * 0.8);
    const lit = ((x0 + x1) / 2 - x) * 0.35 + ((y0 + y1) / 2 - y) * 0.9 + (r() - 0.5) * (y1 - y0) * 0.7 > 0;
    g.strokeStyle = lit ? `rgba(${o.lit ?? '255,240,205'},${0.08 + r() * 0.17})` : `rgba(${o.dark ?? '22,12,6'},${0.1 + r() * 0.19})`;
    g.lineWidth = 0.55 + r() * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}
function animalBase(W, H, cx, ay, F, R) {
  const Ru = Math.min(R, 1), c = newCanvas(Math.ceil(W * F * R), Math.ceil(H * F * R)), g = c.getContext('2d'), u = newCanvas(Math.ceil(W * F * Ru), Math.ceil(H * F * Ru)), ug = u.getContext('2d');
  g.setTransform(R * F, 0, 0, R * F, 0, 0); ug.setTransform(Ru * F, 0, 0, Ru * F, 0, 0);
  return { c, g, u, ug, cx, ay, W, H, F, R, Ru, out: () => ({ c, u, ax: cx * F, ay: ay * F, w: W * F, h: H * F, R, Ru }) };
}
const faShadow = (T, rx, ry, a = 0.5, dx = 1.5, dy = 1.5) => softFill(T.ug, gg => gg.ellipse(T.cx + dx, T.ay + dy, rx, ry, 0, 0, TAU), `rgba(14,22,8,${a})`, Math.max(1.6, Math.min(4, rx * 0.16)));

/* ---------- czworonóg ---------- */
function faQuadDims(S) {
  const tail = S.tail ? S.tail.len : 4, rise = S.leg + S.dep + S.nk * Math.sin(Math.abs(S.na)) + S.hd * 0.6 + (S.antler ? (S.antlerH || 16) : S.horn ? 14 : 0) + (S.ear ? S.ear[0] * 0.6 : 0) + (S.hump || 0);
  return { W: Math.ceil(tail + S.len + (S.nk * Math.cos(S.na) + S.hd) * 1.0 + 16), H: Math.ceil(rise + 10), cx: Math.ceil(tail + S.len / 2 + 8), base: Math.ceil(rise + 6) };
}
function faAntlers(g, kind, cx, cy, ang, k, near) {                    // poroże wyrasta z korony (cx, cy); ang — obrót wraz z głową
  const c = Math.cos(ang), s = Math.sin(ang), P = ([x, y]) => [cx + (x * c - y * s) * k, cy + (x * s + y * c) * k], bone = near ? hex('#d8c9a4') : hex('#a89a78');
  const T = {
    roe: [[[0, 0], [-1.4, -5], [-2.8, -9], [-3.4, -12]], [[-1.5, -5], [1.8, -8]], [[-2.9, -9.4], [0.2, -12]]],
    rein: [[[0, 0], [-3, -8], [-7, -15], [-9.5, -22], [-8, -28]], [[-0.6, -2], [5, -6], [8.4, -5.4]], [[-2, -6], [3, -11], [5.5, -13.6]], [[-7, -15], [-2, -19.5], [0.6, -23]], [[-9.4, -22], [-13, -26]], [[-8, -28], [-4.4, -30.4]]],
    elk: [[[0, 0], [-3, -4], [-7, -6]], [[-9, -7], [-12, -12], [-12, -17]], [[-12, -9], [-17, -12], [-20, -10]], [[-11, -15], [-16, -17]], [[-8, -18], [-10, -23]], [[-5, -19], [-5, -24]], [[-2, -17], [0, -22]]],
    lyre: [[[0, 0], [-0.8, -5], [-3, -10], [-3.8, -15], [-1.6, -19]]]
  }[kind];
  const w = { roe: 1.5, rein: 1.9, elk: 2.4, lyre: 1.9 }[kind];
  for (const pts of T) faBone(g, pts.map(P), w, near ? bone : scaleC(bone, 0.82), k);
  if (kind === 'elk') {                                                // łopata: wypełnienie między bieguną a rozgałęzieniami
    g.beginPath(); [[0, 0], [-4, -3], [-9, -5], [-15, -8], [-19, -11], [-17, -14], [-14, -13], [-14, -18], [-10, -17], [-9, -22], [-6, -19], [-4, -23], [-1, -18], [1, -20], [2, -12], [3, -5]].map(P).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    g.fillStyle = css(near ? bone : scaleC(bone, 0.82)); g.fill(); g.strokeStyle = 'rgba(16,10,6,0.8)'; g.lineWidth = 0.9; g.stroke();
  }
}
function faQuad(T, S, pose) {
  const g = T.g, cx = T.cx, base = T.ay, len = S.len, dep = S.dep, leg = S.leg, kind = pose.kind, f = pose.f | 0;
  const col = hex(S.col), bel = hex(S.bel || S.col), dk = hex(S.dk || '#2a1c12'), legc = hex(S.legCol || S.col), acc = S.acc ? hex(S.acc) : null;
  const OUT = 'rgba(16,10,6,0.88)', dead = kind === 'dead', graze = kind === 'idle', walking = kind === 'walk', ph = walking ? f / 4 : 0;
  const tx0 = cx - len / 2, tx1 = cx + len / 2, ty = dead ? base - dep * 0.48 : base - leg - dep * 0.5 + (S.lago ? 0 : 0), top = ty - dep / 2, bot = ty + dep / 2;
  faShadow(T, len * 0.62 + (S.tail ? S.tail.len * 0.2 : 0), Math.max(2.4, dep * 0.3), 0.5, 1.5, 1.2);

  // --- nogi: dwie pary, przekątny chód; dla zająca/królika: łapy przednie krótkie i duże „uda" z tyłu ---
  const legs = [{ x: tx0 + len * 0.20, far: true, front: false, po: 0.5 }, { x: tx1 - len * 0.17, far: true, front: true, po: 0 }, { x: tx0 + len * 0.16, far: false, front: false, po: 0 }, { x: tx1 - len * 0.21, far: false, front: true, po: 0.5 }];
  const geo = L => {
    const a = TAU * ((ph + L.po) % 1), sw = walking ? Math.sin(a) : 0, lift = walking ? Math.max(0, Math.cos(a)) * (S.lift ?? leg * 0.3) : 0;
    if (dead) { const dx = (L.front ? 1 : -1) * (len * 0.1) + (L.far ? -2 : 2), hx = L.x, hy = ty + dep * 0.3; return [hx, hy, hx + dx * 0.8, hy + 0.5, hx + dx * 1.7 + (L.front ? 3 : -3), base - (L.far ? 3 : 1)]; }
    const hx = L.x + (L.far ? -dep * 0.1 : 0), hy = ty + dep * 0.28, fx = hx + sw * (S.stride ?? len * 0.17), fy = base - lift - (L.far ? 0.8 : 0);
    const bend = (S.bend ?? leg * 0.14) * (L.front ? 1 : -1);
    return [hx, hy, (hx + fx) / 2 + bend, hy + (fy - hy) * 0.5, fx, fy];
  };
  const drawLeg = L => {
    const [hx, hy, kx, ky, fx, fy] = geo(L), sh = L.far ? 0.7 : 1, lc = scaleC(legc, sh), w = S.legW || 2.4;
    if (S.lago && !dead) {                                             // zając / królik: przednia łapa krótka; tylna — kłąb uda i długa stopa
      if (L.front) { limb(g, hx, hy, fx + 0.6, fy, w * 0.9, lc); }
      else {
        const hop = walking ? Math.sin(TAU * ((ph + L.po) % 1)) * len * 0.12 : 0;
        g.fillStyle = css(scaleC(col, sh * 0.96)); g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.ellipse(hx + 0.8, ty + dep * 0.12, len * 0.2, dep * 0.4, -0.2, 0, TAU); g.fill(); g.stroke();
        limb(g, hx + 1, ty + dep * 0.34, hx + hop - len * 0.12, fy - 0.6, w * 0.8, lc);
        limb(g, hx + hop - len * 0.12, fy - 0.6, hx + hop + len * 0.12, fy - 0.2, w * 0.9, lc);
      }
      return;
    }
    faRib(g, [[hx, hy], [kx, ky], [fx, fy - 0.6]], [w * 1.35, w * 0.9, w * 0.72], css(lc), OUT);                  // noga: jedna zwężająca się wstęga (udo → staw → pęcina)
    g.fillStyle = css(scaleC(dk, sh)); g.strokeStyle = OUT; g.lineWidth = 0.7; g.beginPath(); g.ellipse(fx + (L.front ? 0.5 : -0.2), fy - 0.5, w * 0.7, w * 0.46, 0, 0, TAU); g.fill(); g.stroke();
  };
  for (const L of legs) if (L.far) drawLeg(L);

  // --- ogon (za tułowiem) ---
  const tl = S.tail, rx0 = tx0 + len * 0.05, ry0 = top + dep * 0.22;
  if (tl && tl.t === 'bush') {
    const sway = walking ? Math.sin(TAU * ph) * 1.2 : 0, pts = faCurve([rx0, ry0], [rx0 - tl.len * 0.5, ry0 + 1 + sway], [rx0 - tl.len, ry0 + tl.len * 0.3 + sway * 2], 9);
    const bw = pts.map((_, i) => { const t = i / (pts.length - 1); return Math.max(1, lerp(2.4, tl.w, Math.sin(Math.PI * Math.pow(t, 0.75))) * (1 - Math.pow(t, 5) * 0.5)); });
    faRib(g, pts, bw, css(col), OUT);
    if (tl.tip) { const k0 = pts.length - 4; faRib(g, pts.slice(k0), bw.slice(k0).map(v => v * 0.92), tl.tip, null); }
    faFur(g, 33 + faHash(S.pl), rx0 - tl.len, ry0 - tl.w / 2, rx0, ry0 + tl.len * 0.4, 70, { ang: 2.9, len: 2.4 });
  } else if (tl && tl.t === 'stub') { g.strokeStyle = OUT; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx0, ry0); g.quadraticCurveTo(rx0 - tl.len * 0.7, ry0 + 1, rx0 - tl.len, ry0 + tl.len * 0.5); g.stroke(); g.strokeStyle = css(scaleC(col, 0.8)); g.lineWidth = 1.2; g.stroke(); }
  else if (tl && tl.t === 'tuft') { g.fillStyle = css(hex(tl.col)); g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.arc(rx0 - 0.4, ry0 + 0.6, tl.len * 0.62, 0, TAU); g.fill(); g.stroke(); }
  else if (tl) { g.fillStyle = css(hex(tl.col || S.col)); g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.ellipse(rx0 - tl.len * 0.3, ry0 + 0.8, tl.len * 0.62, tl.len * 0.36, 0.5, 0, TAU); g.fill(); g.stroke(); }

  // --- tułów ---
  const hump = S.hump ? { x: S.hump > 6 ? cx : tx1 - len * 0.27, r: S.hump } : null, hTop = top - (hump ? hump.r * 1.45 : 0);   // garb (wielbłąd) lub kłąb (łoś) jest częścią obrysu tułowia
  const torso = () => {
    g.beginPath(); g.moveTo(tx0 + len * 0.07, top + dep * 0.14);
    if (hump) {
      const hx = hump.x, hr = hump.r, ya = top + dep * 0.05;
      g.bezierCurveTo(tx0 + len * 0.2, top + dep * 0.02, hx - hr * 1.7, ya, hx - hr * 1.2, ya - hr * 0.12);
      g.bezierCurveTo(hx - hr * 0.85, top - hr * 1.65, hx + hr * 0.85, top - hr * 1.65, hx + hr * 1.2, ya - hr * 0.12);
      g.bezierCurveTo(hx + hr * 1.8, ya, tx1 - len * 0.2, top - dep * 0.02, tx1 - len * 0.12, top + dep * 0.03);
    } else g.bezierCurveTo(tx0 + len * 0.25, top - dep * 0.02, tx1 - len * 0.34, top - dep * 0.06, tx1 - len * 0.12, top + dep * 0.03);
    g.bezierCurveTo(tx1 + len * 0.03, top + dep * 0.14, tx1 + len * 0.04, bot - dep * 0.24, tx1 - len * 0.1, bot - dep * 0.02);
    g.bezierCurveTo(tx1 - len * 0.28, bot + dep * 0.05, tx0 + len * 0.38, bot - dep * 0.04, tx0 + len * 0.12, bot - dep * 0.14);
    g.bezierCurveTo(tx0 - len * 0.05, bot - dep * 0.26, tx0 - len * 0.05, top + dep * 0.38, tx0 + len * 0.07, top + dep * 0.14); g.closePath();
  };
  torso(); const tg = g.createLinearGradient(0, hTop, 0, bot);
  tg.addColorStop(0, css(scaleC(col, 1.18))); tg.addColorStop(0.5, css(col)); tg.addColorStop(0.78, css(mixc(col, bel, 0.65))); tg.addColorStop(1, css(bel));
  g.fillStyle = tg; g.fill();
  g.save(); torso(); g.clip();
  if (S.stripe) { g.fillStyle = S.stripe; g.globalAlpha = 0.85; g.fillRect(tx0, ty - dep * 0.02, len, dep * 0.2); g.globalAlpha = 1; }
  if (S.rump && acc) { g.fillStyle = css(acc); g.beginPath(); g.ellipse(tx0 + len * 0.09, ty - dep * 0.06, len * 0.12, dep * 0.34, 0.2, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = OUT; g.lineWidth = S.ol ?? 1.1; torso(); g.stroke();
  if (S.mane) { g.fillStyle = css(scaleC(dk, 1.2)); for (let i = 0; i < 9; i++) { const x = tx0 + len * (0.12 + i * 0.09), y = top + dep * (0.12 - Math.sin(i / 8 * Math.PI) * 0.14); g.beginPath(); g.moveTo(x - 1.6, y + 1.5); g.lineTo(x + 0.4, y - 3.2); g.lineTo(x + 2, y + 1.5); g.closePath(); g.fill(); } }
  for (const L of legs) if (!L.far) drawLeg(L);
  faFur(g, 40 + faHash(S.pl || 'x'), tx0, hTop, tx1, bot, Math.round(len * dep * 0.42), { ang: 0.3, len: Math.max(1.5, dep * 0.14) });

  // --- szyja i głowa ---
  const na = dead ? 0.55 : graze ? 0.62 : S.na, nkL = S.nk * (graze && S.nk > 8 ? 0.95 : 1), ha = dead ? 0.1 : graze ? Math.min(1.25, (S.ha ?? 0.22) + 0.8) : (S.ha ?? 0.22);
  const sx = tx1 - len * 0.12, sy = top + dep * 0.30, N = [sx + Math.cos(na) * nkL, (dead ? Math.min(base - S.hdH * 0.6, sy + 5) : sy + Math.sin(na) * nkL)];
  const nctl = [(sx + N[0]) / 2 - Math.sin(na) * nkL * (S.nkCurve || 0.0) * (graze ? 0 : 1), (sy + N[1]) / 2 - Math.cos(na) * nkL * (S.nkCurve || 0.0) * 0.8 * (graze ? 0 : 1)];
  const neckPts = faCurve([sx, sy], S.nkCurve ? [nctl[0] - nkL * 0.1, nctl[1]] : nctl, N, 7);
  const nkg = css(scaleC(col, 1.04));
  if (S.neckMane && !dead) { faRib(g, neckPts, [dep * 0.78, dep * 0.56, dep * 0.4, S.hdH * 0.95], css(mixc(col, hex('#f2ece0'), 0.62)), OUT); faFur(g, 61, Math.min(sx, N[0]) - 3, Math.min(sy, N[1]) - 4, Math.max(sx, N[0]) + 3, Math.max(sy, N[1]) + 4, 55, { ang: 0.9, len: 2.6, dark: '80,66,50' }); }
  else faRib(g, neckPts, [dep * 0.62, dep * 0.5, dep * 0.36, S.hdH * 0.8], nkg, OUT);
  if (S.bell && !dead) { g.fillStyle = css(scaleC(col, 0.78)); g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.ellipse(N[0] - 1.5, N[1] + S.hdH * 0.85, 2.2, 5, 0.1, 0, TAU); g.fill(); g.stroke(); }
  const ax_ = Math.cos(ha), ay_ = Math.sin(ha), upx = Math.sin(ha), upy = -Math.cos(ha), hd = S.hd, hh = S.hdH;
  const headAt = t => [N[0] + ax_ * hd * t, N[1] + ay_ * hd * t];
  const farEar = S.ear && !dead, nearEar = S.ear;
  const earAng = ha - Math.PI / 2 - (S.lago ? 0.35 : 0.55), E = [N[0] + ax_ * hd * 0.1 + upx * hh * 0.4, N[1] + ay_ * hd * 0.1 + upy * hh * 0.4];
  if (farEar) faLeaf(g, E[0] - 1.2, E[1] + 0.4, earAng - 0.2, S.ear[0] * 0.92, S.ear[1], css(scaleC(col, 0.7)), OUT);
  const ak = S.antler === 'rein' ? 0.8 : S.antler === 'elk' ? 1.15 : 1;
  if (S.antler && !dead) faAntlers(g, S.antler, N[0] + ax_ * hd * 0.18 + upx * hh * 0.42 - 1.4, N[1] + ay_ * hd * 0.18 + upy * hh * 0.42, ha * 0.55, ak, false);
  if (S.horn && !dead) faAntlers(g, S.horn, N[0] + ax_ * hd * 0.22 + upx * hh * 0.4 - 1.2, N[1] + ay_ * hd * 0.22 + upy * hh * 0.4, ha * 0.4, 1, false);
  const hw = S.hdW || [0.84, 1.0, 0.8, 0.58, 0.44, 0.4].map(v => v * hh);
  const hpts = [0, 0.2, 0.4, 0.6, 0.8, 1].map(headAt), hg = css(S.cheek ? col : scaleC(col, 1.06));
  faRib(g, hpts, hw, hg, OUT);
  g.fillStyle = css(S.muzzle ? hex(S.muzzle) : scaleC(mixc(col, bel, 0.35), 1.02)); g.beginPath(); const mp = headAt(0.86), mw = hw[4] * 0.9; g.ellipse(mp[0], mp[1] + 0.4, hd * 0.2, mw / 2, ha, 0, TAU); g.fill();
  if (S.cheek) { g.fillStyle = css(hex(S.cheek)); g.beginPath(); const cp = headAt(0.55); g.ellipse(cp[0] - upx * hh * 0.2, cp[1] - upy * hh * 0.2 + 0.6, hd * 0.3, hh * 0.22, ha, 0, TAU); g.fill(); }
  const tip = headAt(1);
  g.fillStyle = css(dk); g.strokeStyle = OUT; g.lineWidth = 0.7; g.beginPath(); g.ellipse(tip[0] + ax_ * 0.2, tip[1] + 0.2, Math.max(1, hh * 0.2), Math.max(0.9, hh * 0.16), ha, 0, TAU); g.fill(); g.stroke();
  if (S.tusk && !dead) { g.strokeStyle = '#efe6cc'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(tip[0] - ax_ * 3, tip[1] + 2.2); g.quadraticCurveTo(tip[0] - ax_ * 1, tip[1] + 3.6, tip[0] + 1, tip[1] + 1.2); g.stroke(); }
  const eye = [N[0] + ax_ * hd * 0.42 + upx * hh * 0.12, N[1] + ay_ * hd * 0.42 + upy * hh * 0.12];
  if (dead) { g.strokeStyle = 'rgba(16,10,6,0.9)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(eye[0] - 1.2, eye[1] - 1.2); g.lineTo(eye[0] + 1.2, eye[1] + 1.2); g.moveTo(eye[0] + 1.2, eye[1] - 1.2); g.lineTo(eye[0] - 1.2, eye[1] + 1.2); g.stroke(); }
  else { g.fillStyle = '#140c08'; g.beginPath(); g.arc(eye[0], eye[1], Math.max(0.9, hh * 0.12), 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(eye[0] - 0.3, eye[1] - 0.4, 0.4, 0, TAU); g.fill(); }
  if (nearEar && !dead) {
    faLeaf(g, E[0], E[1], earAng, S.ear[0], S.ear[1], css(col), OUT);
    faLeaf(g, E[0], E[1] + 0.2, earAng, S.ear[0] * 0.8, S.ear[1] * 0.5, css(S.earTip ? hex(S.earTip) : mixc(col, hex('#d89a8a'), 0.5)), null);
    if (S.earTip) faLeaf(g, E[0] + Math.cos(earAng) * S.ear[0] * 0.7, E[1] + Math.sin(earAng) * S.ear[0] * 0.7, earAng, S.ear[0] * 0.3, S.ear[1] * 0.4, S.earTip, null);
  }
  if (S.antler && !dead) faAntlers(g, S.antler, N[0] + ax_ * hd * 0.1 + upx * hh * 0.46, N[1] + ay_ * hd * 0.1 + upy * hh * 0.46, ha * 0.55 + 0.12, ak, true);
  if (S.horn && !dead) faAntlers(g, S.horn, N[0] + ax_ * hd * 0.16 + upx * hh * 0.44, N[1] + ay_ * hd * 0.16 + upy * hh * 0.44, ha * 0.4 + 0.1, 1, true);
  treeShadeOverlay(g, tx0, hTop, tx1, bot);
}

/* ---------- ptak ---------- */
function faBirdDims(S, fly) {
  if (fly) return { W: Math.ceil(S.span * 0.62 + 22), H: Math.ceil(S.span * 0.78 + 22), cx: Math.ceil(S.span * 0.32 + 8), base: Math.ceil(S.span * 0.39 + 11) };
  const top = S.leg + S.dep + S.nk * 1.0 + S.hd * 2 + 6;
  return { W: Math.ceil(S.len + S.tail + S.nk * 0.9 + S.beak[0] + 18), H: Math.ceil(top + 10), cx: Math.ceil(S.tail + S.len / 2 + 9), base: Math.ceil(top + 6) };
}
function faWing(g, rx, ry, tx, ty, chord, fill, tipFill, edge) {       // skrzydło: nasada (rx, ry) → czubek (tx, ty); tylna krawędź ząbkowana
  const dx = tx - rx, dy = ty - ry, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const lead = [rx + nx * chord * 0.34, ry + ny * chord * 0.34], back = [rx - nx * chord * 0.66, ry - ny * chord * 0.66];
  g.beginPath(); g.moveTo(lead[0], lead[1]);
  g.quadraticCurveTo(rx + dx * 0.55 + nx * chord * 0.5, ry + dy * 0.55 + ny * chord * 0.5, tx, ty);
  for (let i = 1; i <= 5; i++) { const t = 1 - i / 6, px = back[0] + dx * t * 0.92 - ux * 0, py = back[1] + dy * t * 0.92; g.lineTo(lerp(tx, px, i / 6) - nx * chord * 0.06 * (i % 2), lerp(ty, py, i / 6) - ny * chord * 0.06 * (i % 2)); }
  g.lineTo(back[0], back[1]); g.closePath();
  const gr = g.createLinearGradient(rx, ry, tx, ty); gr.addColorStop(0, fill); gr.addColorStop(0.6, fill); gr.addColorStop(1, tipFill || fill);
  g.fillStyle = gr; g.fill(); g.strokeStyle = edge; g.lineWidth = 0.9; g.lineJoin = 'round'; g.stroke();
  g.save(); g.clip(); g.strokeStyle = 'rgba(10,8,6,0.28)'; g.lineWidth = 0.6;
  for (let i = 1; i < 6; i++) { const t = i / 6; g.beginPath(); g.moveTo(rx + dx * t * 0.3 + nx * chord * 0.2, ry + dy * t * 0.3 + ny * chord * 0.2); g.lineTo(rx + dx * (0.55 + t * 0.45) - nx * chord * 0.45, ry + dy * (0.55 + t * 0.45) - ny * chord * 0.45); g.stroke(); }
  g.restore();
}
function faBird(T, S, pose) {
  const g = T.g, cx = T.cx, base = T.ay, len = S.len, dep = S.dep, f = pose.f | 0, fl = pose.kind === 'fly';
  const col = hex(S.col), bel = hex(S.bel || S.col), wing = hex(S.wing || S.col), OUT = 'rgba(16,10,6,0.88)', legc = hex(S.legCol || '#303036');
  const bodyPath = (x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const bodyFill = (x, y, rx, ry, rot) => {
    bodyPath(x, y, rx, ry, rot); const gr = g.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, css(scaleC(col, 1.12))); gr.addColorStop(0.55, css(col)); gr.addColorStop(1, css(mixc(col, bel, 0.5)));
    g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.05; g.stroke();
  };
  const head = (hx, hy, beakAng, bald) => {
    const hc = bald ? hex(S.bald) : (S.neckCol ? hex(S.neckCol) : col);
    g.fillStyle = css(hc); g.strokeStyle = OUT; g.lineWidth = 0.95; g.beginPath(); g.arc(hx, hy, S.hd, 0, TAU); g.fill(); g.stroke();
    if (S.cheek) { g.fillStyle = css(hex(S.cheek)); g.beginPath(); g.ellipse(hx - 0.3, hy + 0.8, S.hd * 0.7, S.hd * 0.5, 0, 0, TAU); g.fill(); }
    if (S.crown) { g.fillStyle = css(hex(S.crown)); g.beginPath(); g.ellipse(hx - 0.8, hy - S.hd * 0.7, S.hd * 0.7, S.hd * 0.34, 0, 0, TAU); g.fill(); }
    const bl = S.beak[0], bc = hex(S.beak[1]), bx = hx + Math.cos(beakAng) * S.hd * 0.7, by = hy + Math.sin(beakAng) * S.hd * 0.7;
    g.fillStyle = css(bc); g.strokeStyle = OUT; g.lineWidth = 0.85; g.beginPath();
    const nx = -Math.sin(beakAng), ny = Math.cos(beakAng), bw = Math.max(1.2, S.hd * 0.62);
    g.moveTo(bx + nx * bw / 2, by + ny * bw / 2); g.lineTo(bx + Math.cos(beakAng) * bl + (S.hook ? 0.6 : 0), by + Math.sin(beakAng) * bl + (S.hook ? 1.6 : 0)); g.lineTo(bx - nx * bw / 2, by - ny * bw / 2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#140c08'; g.beginPath(); g.arc(hx + S.hd * 0.35, hy - S.hd * 0.18, Math.max(0.7, S.hd * 0.22), 0, TAU); g.fill();
    if (S.pl === 'Mewa') { g.fillStyle = '#c8302a'; g.fillRect(bx + Math.cos(beakAng) * bl * 0.6 - 0.5, by + Math.sin(beakAng) * bl * 0.6 + 0.4, 1.2, 1.1); }
  };
  if (fl) {                                                            // w locie: widok z góry-boku — skrzydła rozłożone w górę i w dół ekranu, trzepot = rozpiętość 1,0 / 0,6 / 0,85
    const k = [1.0, 0.6, 0.85][f % 3], hs = S.span * 0.5 * k, chord = Math.max(5, len * 0.8), sx = cx + len * 0.12, sy = base;
    faShadow(T, len * 0.5, len * 0.14, 0.34, 0, 0);
    const wcol = css(wing), tipc = S.wingTip ? css(hex(S.wingTip)) : css(scaleC(wing, 0.78));
    faWing(g, sx, sy - dep * 0.2, sx - hs * 0.42, sy - hs * 0.92, chord, css(scaleC(wing, 0.78)), css(scaleC(S.wingTip ? hex(S.wingTip) : wing, 0.68)), OUT);
    if (S.trail) { limb(g, cx - len * 0.3, sy + 0.5, cx - len * 0.3 - S.leg * 0.85, sy + 1.8, S.legW, legc); limb(g, cx - len * 0.3, sy + 1.4, cx - len * 0.3 - S.leg * 0.8, sy + 3, S.legW, scaleC(legc, 0.8)); }
    faRib(g, [[cx - len * 0.46, sy], [cx - len * 0.46 - S.tail * 0.5, sy + 0.5], [cx - len * 0.46 - S.tail, sy + 0.8]], [dep * 0.7, dep * 0.9, dep * 0.6], css(scaleC(wing, 0.9)), OUT);
    bodyFill(cx, sy, len / 2, dep / 2, 0);
    const nkx = S.nk > 6 ? S.nk * 0.95 : S.nk * 0.8, hx = cx + len / 2 + nkx, hy = sy - (S.nk > 6 ? 0.5 : 1.2);
    faRib(g, [[cx + len * 0.35, sy - 0.5], [(cx + len * 0.35 + hx) / 2, sy - 1.2], [hx, hy]], [dep * 0.7, dep * 0.46, S.hd * 1.4], css(S.neckCol ? hex(S.neckCol) : col), OUT);
    head(hx, hy, 0.12, S.bald);
    if (S.ruff) { g.fillStyle = css(hex(S.ruff)); g.beginPath(); g.ellipse(cx + len / 2 + 0.5, sy + 0.4, 2.4, dep * 0.4, 0, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.7; g.stroke(); }
    faWing(g, sx, sy + dep * 0.1, sx - hs * 0.42, sy + hs * 0.92, chord, wcol, tipc, OUT);
    treeShadeOverlay(g, cx - len, sy - hs, cx + len, sy + hs);
    return;
  }
  // --- postawa stojąca / marsz ---
  const ty = base - S.leg - dep * 0.55, tail = S.tail, walking = pose.kind === 'walk';
  faShadow(T, len * 0.55, Math.max(2, dep * 0.3), 0.5, 1, 1);
  const step = walking ? (f % 2 ? 1 : -1) : 0, lg = (x, off, far) => {
    const hx = x, hy = ty + dep * 0.28, fx = x + off, fy = base - (walking && ((off > 0) === (step > 0)) ? 1.6 : 0), c = far ? scaleC(legc, 0.75) : legc;
    if (S.leg > 12) { const kx = hx + (fx - hx) * 0.55 - 0.8, ky = hy + (fy - hy) * 0.5; limb(g, hx, hy, kx, ky, S.legW, c); limb(g, kx, ky, fx, fy, S.legW * 0.85, c); }
    else limb(g, hx, hy, fx, fy, S.legW, c);
    g.strokeStyle = css(c); g.lineWidth = Math.max(0.8, S.legW * 0.75); g.lineCap = 'round'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + 3, fy + 0.1); g.stroke();
  };
  lg(cx - 1.2, -step * 2.6, true);
  const rot = -0.22;
  faRib(g, [[cx - len * 0.4, ty - 0.5], [cx - len * 0.4 - tail * 0.5, ty + tail * 0.1], [cx - len * 0.4 - tail, ty + tail * 0.28]], [dep * 0.7, dep * 0.8, dep * 0.4], css(scaleC(S.neckCol ? hex(S.bel || S.col) : wing, 0.95)), OUT);
  bodyFill(cx, ty, len / 2, dep / 2, rot);
  lg(cx + 0.8, step * 2.6, false);
  // skrzydło złożone: liść wzdłuż grzbietu, czubek za ogonem
  faLeaf(g, cx + len * 0.22, ty - dep * 0.12, Math.PI + 0.12, len * 0.92, dep * 0.8, css(wing), OUT);
  if (S.wingTip) faLeaf(g, cx - len * 0.5, ty + 0.2, Math.PI + 0.1, len * 0.18, dep * 0.46, css(hex(S.wingTip)), null);
  // szyja i głowa
  const n0 = [cx + len * 0.38, ty - dep * 0.2], up = S.nk > 6, hx = n0[0] + (up ? S.nk * 0.45 : S.nk * 0.8), hy = n0[1] - (up ? S.nk * 0.9 : S.nk * 0.55);
  const ctl = up ? [n0[0] - S.nk * 0.28, n0[1] - S.nk * 0.55] : [n0[0] + S.nk * 0.3, n0[1] - S.nk * 0.1];
  faRib(g, faCurve(n0, ctl, [hx, hy], 8), [dep * 0.78, dep * 0.4, S.hd * 1.5], css(S.neckCol ? hex(S.neckCol) : col), OUT);
  if (S.ruff) { g.fillStyle = css(hex(S.ruff)); g.beginPath(); g.ellipse(n0[0] + 1.5, n0[1] - 0.8, 3.2, dep * 0.34, -0.4, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.7; g.stroke(); }
  head(hx, hy, pose.kind === 'idle' ? 0.25 : 0.18, S.bald);
  faFur(g, 90 + faHash(S.pl), cx - len / 2, ty - dep / 2, cx + len / 2, ty + dep / 2, Math.round(len * dep * 0.25), { ang: 3.0, len: 2 });
  treeShadeOverlay(g, cx - len / 2, ty - dep, cx + len / 2, ty + dep);
}

/* ---------- niski korpus: foka, jaszczurka ---------- */
function faLow(T, S, pose) {
  const g = T.g, cx = T.cx, base = T.ay, f = pose.f | 0, OUT = 'rgba(16,10,6,0.88)', col = hex(S.col), bel = hex(S.bel), dk = hex(S.dk), len = S.len, dep = S.dep, walking = pose.kind === 'walk';
  if (S.pl === 'Foka') {
    faShadow(T, len * 0.58, 4, 0.5, 2, 1);
    const arch = walking ? (f % 2 ? 2.4 : -0.6) : 0, raise = pose.kind === 'idle' ? 3.2 : 0.6;
    const x0 = cx - len * 0.5, x1 = cx + len * 0.5, hy = base - dep * 0.74 - raise;
    const body = () => {
      g.beginPath(); g.moveTo(x0, base - 1.8);
      g.bezierCurveTo(x0 + len * 0.12, base - dep * 0.7 - arch, cx - len * 0.12, base - dep * 1.0 - arch, cx + len * 0.14, base - dep * 0.98 - arch * 0.6);   // grzbiet
      g.bezierCurveTo(cx + len * 0.28, base - dep * 0.98 - raise, cx + len * 0.34, hy - 2.4, x1 - len * 0.1, hy - 1.4);           // kark i czubek głowy
      g.bezierCurveTo(x1 + 1.5, hy - 0.8, x1 + 0.8, hy + 3.6, x1 - len * 0.1, hy + 3.8);                                          // pysk
      g.bezierCurveTo(cx + len * 0.3, base - dep * 0.3, cx + len * 0.1, base + 0.4, cx - len * 0.1, base + 0.4);
      g.bezierCurveTo(x0 + len * 0.2, base + 0.5, x0 + len * 0.05, base - 0.2, x0, base - 1.8); g.closePath();
    };
    for (const [dy, a] of [[-2.4, 0.8], [1.8, 1]]) { g.save(); g.translate(x0 - 1.5, base - 3.4 + dy); g.rotate(dy < 0 ? -0.45 : 0.3); g.fillStyle = css(scaleC(col, a)); g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 4.6, 2, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }   // płetwy ogonowe
    body(); const bg = g.createLinearGradient(0, base - dep, 0, base + 1); bg.addColorStop(0, css(scaleC(col, 1.15))); bg.addColorStop(0.6, css(col)); bg.addColorStop(1, css(bel)); g.fillStyle = bg; g.fill();
    g.save(); body(); g.clip(); const r = rng(77); g.fillStyle = css(dk, 0.5); for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(x0 + r() * len * 0.8, base - dep * (0.15 + r() * 0.75), 1.2 + r() * 1.5, 0.8 + r() * 1.0, r() * 3, 0, TAU); g.fill(); } g.restore();
    g.strokeStyle = OUT; g.lineWidth = 1.1; body(); g.stroke();
    g.save(); g.translate(cx + len * 0.2, base - dep * 0.2); g.rotate(0.5 + (walking ? (f % 2 ? 0.25 : -0.1) : 0)); g.fillStyle = css(scaleC(col, 0.86)); g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 4.4, 1.7, 0, 0, TAU); g.fill(); g.stroke(); g.restore();   // płetwa przednia
    g.fillStyle = '#140c08'; g.beginPath(); g.arc(x1 - len * 0.2, hy, 1.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x1 + 0.4, hy + 0.6, 1.5, 1.1, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(245,245,240,0.8)'; g.lineWidth = 0.55; for (const d of [-1, 0.2, 1.4]) { g.beginPath(); g.moveTo(x1 - 1, hy + 1.4); g.lineTo(x1 + 3.4, hy + 1.4 + d); g.stroke(); }
    treeShadeOverlay(g, x0, base - dep, x1, base + 1);
    return;
  }
  // jaszczurka
  faShadow(T, len * 0.7, 2.6, 0.45, 1, 0.6);
  const wave = walking ? (f % 2 ? 1 : -1) : 0, hy = base - 3.2, bx = cx;
  const spine = [[bx + len * 0.5, hy + 0.2], [bx + len * 0.25, hy - 0.4], [bx, hy - 0.3], [bx - len * 0.3, hy], [bx - len * 0.7, hy + 0.6 + wave * 0.8], [bx - len * 1.1, hy + 1.6 - wave * 1.4], [bx - len * 1.5, hy + 1.4 + wave * 1.2]];
  const legPair = (x, ph) => { for (const [s, far] of [[1, true], [1, false]]) { const sw = (far ? -1 : 1) * ph * 1.6, c = far ? scaleC(col, 0.75) : col; limb(g, x, hy + 0.4, x + 1.4 * s + sw, hy + 2.2, 1.5, c); limb(g, x + 1.4 * s + sw, hy + 2.2, x + 3 * s + sw, base - 0.4, 1.3, c); } };
  legPair(bx + len * 0.28, wave); legPair(bx - len * 0.28, -wave);
  faRib(g, spine, [3.2, 3.6, 4.2, 4.4, 3.2, 1.8, 0.5], css(col), OUT);
  g.save(); g.strokeStyle = css(dk, 0.75); g.lineWidth = 0.9; g.beginPath(); spine.forEach(([x, y], i) => i ? g.lineTo(x, y - 0.4) : g.moveTo(x, y - 0.4)); g.stroke(); g.restore();
  g.fillStyle = css(col); g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.moveTo(bx + len * 0.38, hy - 1.6); g.lineTo(bx + len * 0.62, hy + 0.1); g.lineTo(bx + len * 0.4, hy + 1.8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#140c08'; g.beginPath(); g.arc(bx + len * 0.47, hy - 0.5, 0.6, 0, TAU); g.fill();
  faFur(g, 130, bx - len * 0.6, hy - 2, bx + len * 0.6, hy + 2, 60, { ang: 0, len: 1.2 });
  treeShadeOverlay(g, bx - len, hy - 4, bx + len * 0.6, hy + 4);
}

/* ---------- wypiek rodzaju ---------- */
function bakeFauna(kind, F = 1) {
  const S = FAUNA[kind]; if (!S) throw new Error('Nieznane zwierzę: ' + kind);
  const poses = S.b === 'quad' ? { walk: 4, idle: 1, dead: 1 } : S.b === 'bird' ? { walk: 2, idle: 1, fly: 3 } : { walk: 2, idle: 1 };
  const out = { kind, pl: S.pl, role: S.b };
  for (const [name, n] of Object.entries(poses)) {
    out[name] = Array.from({ length: n }, (_, i) => {
      const d = S.b === 'quad' ? faQuadDims(S) : S.b === 'bird' ? faBirdDims(S, name === 'fly') : { W: Math.ceil(S.len * 1.5 + (S.tail || 0) * 1.1 + 20), H: Math.ceil((S.dep || 4) * 1.6 + 14), cx: Math.ceil(S.len * 0.5 + (S.tail || 0) * 1.1 + 10), base: Math.ceil((S.dep || 4) * 1.6 + 8) };
      const T = animalBase(d.W, d.H, d.cx, d.base, F, S.R || 3), pose = { kind: name, f: i };
      (S.b === 'quad' ? faQuad : S.b === 'bird' ? faBird : faLow)(T, S, pose);
      return T.out();
    });
  }
  return out;
}
