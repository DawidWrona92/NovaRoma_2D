/* ====================== PRZYRODA: teren, drzewa, skały, mieszkańcy ====================== */

/* trawa kafelkowalna rysowana w płaszczyźnie świata (jeden wzór dla całej mapy — brak szwów między kaflami) */
GEN.grass = (pal = 'green') => {
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const sets = {
    green: { stops: [[0, '#2c5520'], [0.35, '#44782a'], [0.65, '#5c9533'], [1, '#8ab648']], blades: ['#22481a', '#336322', '#4a8a2c', '#6aa83c', '#9bc653', '#c3d86a'], dirt: '#7a6232' },
    sand: { stops: [[0, '#b99c62'], [0.4, '#cdb27a'], [0.7, '#dcc48e'], [1, '#e8d6a4']], blades: ['#9c8248', '#b89c60', '#cfb77c', '#e4d3a0', '#a3a06a'], dirt: '#a8884e' },
    tundra: { stops: [[0, '#3a5a34'], [0.4, '#52743e'], [0.7, '#6a8a48'], [1, '#8da358']], blades: ['#2c4a2a', '#406038', '#587a42', '#7a9850', '#a3b46a'], dirt: '#6a5a3a' },
    eastern: { stops: [[0, '#3b5a2a'], [0.35, '#5b7d35'], [0.65, '#7f9540'], [1, '#aab058']], blades: ['#2c4a22', '#47692b', '#6d8a37', '#98a649', '#c0b868', '#8a7c40'], dirt: '#4a3a24' },
    snow: { stops: [[0, '#bccbda'], [0.4, '#d6e2ec'], [0.7, '#e9f1f7'], [1, '#fbfdff']], blades: ['#a6b8c8', '#c0cfdb', '#dde8f0', '#f4f9fc', '#8a9a7a', '#a89870'], dirt: '#807a6c' }
  }[pal];
  const st = sets.stops.map(([p, h]) => [p, hex(h)]);
  const n1 = fbm(N, 3, 4, 7), n2 = fbm(N, 10, 3, 19), n3 = periodicNoise(N, 40, 31);
  const dirt = hex(sets.dirt), lut = lutRamp(st);
  for (let i = 0; i < N * N; i++) {
    const t = n1[i] * 0.55 + n2[i] * 0.3 + n3[i] * 0.15;
    let col = lut[clamp(((t - 0.25) * 1.7 * 255) | 0, 0, 255)];
    const dm = clamp((n1[i] - 0.68) * 5, 0, 0.32) * clamp((n2[i] - 0.4) * 3, 0, 1);     // plamy gołej ziemi (rzadkie i blade — przy dużej powtarzalności wzoru zauważalne jako kratownica)
    if (dm > 0) col = mixc(col, dirt, dm);
    d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(5);
  for (let i = 0; i < 5200; i++) { // źdźbła
    const x = r() * B, y = r() * B, a = r() * TAU, l = 2 + r() * 5;
    g.strokeStyle = sets.blades[(r() * sets.blades.length) | 0]; g.globalAlpha = 0.22 + r() * 0.4; g.lineWidth = 0.8 + r() * 0.8;
    wrapDraw(B, x - 8, y - 8, 16, 16, (ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); });
  }
  g.globalAlpha = 1;
  if (pal !== 'sand' && pal !== 'snow') for (let i = 0; i < (pal === 'eastern' ? 22 : 36); i++) { // kwiatki
    const x = r() * B, y = r() * B, col = ['#f4efe0', '#f0d84a', '#e87a9a', '#c9a0e8'][(r() * 4) | 0];
    g.fillStyle = col; g.globalAlpha = 0.75; g.beginPath(); g.arc(x, y, 1.1 + r() * 0.9, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  return { c, ppu: 64 * T };
};
GEN.grassDetail = () => { // rzadki wzór o dużej skali (okres ~10 pól) — zrywa powtarzalność łąki
  const N = 256, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, n1 = fbm(N, 2, 3, 91), n2 = fbm(N, 5, 3, 97);
  for (let i = 0; i < N * N; i++) {
    const t = n1[i] * 0.65 + n2[i] * 0.35, hi = t > 0.5, a = clamp(Math.abs(t - 0.5) * 3.2, 0, 1);
    d[i * 4] = hi ? 214 : 10; d[i * 4 + 1] = hi ? 226 : 44; d[i * 4 + 2] = hi ? 96 : 22; d[i * 4 + 3] = a * 255;
  }
  g.putImageData(im, 0, 0);
  return { c, ppu: 24 };
};
/* pola uprawne: rzędy w płaszczyźnie świata (wzdłuż osi x) */
GEN.field = (kind = 'wheat') => {
  const T = TEXRES, B = 128, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(81 + kind.length);
  g.scale(T, T);
  const P = { wheat: ['#7a5c22', '#cfa938', '#f2d56c'], green: ['#3c2e16', '#4f8a2c', '#98cf50'], plow: ['#2e2012', '#6a4a2a', '#94703c'] }[kind].map(hex);
  const rows = 16, rh = B / rows;
  g.fillStyle = css(P[0]); g.fillRect(0, 0, B, B);
  for (let i = 0; i < rows; i++) {
    const y = i * rh, k = 0.85 + r() * 0.3, gr = g.createLinearGradient(0, y, 0, y + rh);
    gr.addColorStop(0, css(scaleC(P[1], 0.9 * k))); gr.addColorStop(0.45, css(scaleC(P[2], 0.95 * k))); gr.addColorStop(1, css(scaleC(P[1], 0.55 * k)));
    g.fillStyle = gr; g.fillRect(0, y + 1, B, rh - 2);
    if (kind === 'plow') { g.fillStyle = 'rgba(255,230,180,0.18)'; g.fillRect(0, y + 2, B, 1.2); }
    else for (let x = 0; x < B; x += 2 + r() * 2) { // kłosy / sadzonki
      const hh = kind === 'wheat' ? 2.2 + r() * 2.2 : 1.6 + r() * 1.8;
      g.strokeStyle = kind === 'wheat' ? `rgba(${r() < 0.5 ? '255,236,140' : '176,132,38'},${0.5 + r() * 0.4})` : `rgba(${r() < 0.5 ? '190,240,110' : '40,100,28'},${0.5 + r() * 0.4})`;
      g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + rh * 0.62); g.lineTo(x + (r() - 0.5) * 1.6, y + rh * 0.62 - hh); g.stroke();
    }
  }
  return { c, ppu: 64 * T };
};
TEXNORM.water = p => (['sea', 'lake', 'river', 'oasis', 'cold', 'ice'].includes(p) ? p : 'sea');
GEN.water = (pal = 'sea') => {
  const V = {
    sea: { st: [[0, '#1d6a8c'], [0.5, '#2f8ba6'], [1, '#5cc0c8']], wave: '235,250,255' },
    lake: { st: [[0, '#25606c'], [0.5, '#3a8a8c'], [1, '#78cdbd']], wave: '235,252,246' },
    river: { st: [[0, '#2a6f96'], [0.5, '#4690b2'], [1, '#8ac9de']], wave: '240,252,255' },
    oasis: { st: [[0, '#1f8f95'], [0.5, '#35b6b0'], [1, '#8ee6d4']], wave: '240,255,250' },
    cold: { st: [[0, '#173f58'], [0.5, '#25627c'], [1, '#4a97ac']], wave: '225,242,250' },
    ice: { st: [[0, '#a6c6da'], [0.5, '#d0e5f0'], [1, '#f6fbff']], wave: '255,255,255' }
  }[pal] || null;
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, n1 = fbm(N, 4, 4, 41), n2 = periodicNoise(N, 20, 43);
  const lut = lutRamp(V.st.map(([p0, h]) => [p0, hex(h)]));
  for (let i = 0; i < N * N; i++) { const col = lut[clamp(((n1[i] * 0.8 + n2[i] * 0.3 - 0.1) * 255) | 0, 0, 255)]; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(47 + pal.length);
  for (let i = 0; i < (pal === 'ice' ? 50 : 230); i++) { // zmarszczki: łuki okręgów w płaszczyźnie wody — w rzucie izometrycznym stają się spłaszczonymi łukami poziomymi (na lodzie rzadkie połyski)
    const x = r() * B, y = r() * B, rr = 3.5 + r() * 11, a0 = r() * TAU, span = 0.8 + r() * 1.5, al = 0.1 + r() * 0.2, lw = 0.8 + r() * 0.9, sq = 0.85 + r() * 0.3;
    g.strokeStyle = `rgba(${V.wave},${al})`; g.lineWidth = lw;
    wrapDraw(B, x - rr, y - rr, rr * 2, rr * 2, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * sq, 0, a0, a0 + span); g.stroke(); });
  }
  if (pal === 'ice') for (let i = 0; i < 26; i++) { // pęknięcia lodu
    let x = r() * B, y = r() * B, a = r() * TAU; const pts = [[x, y]];
    for (let k = 0; k < 6; k++) { a += (r() - 0.5) * 1.3; x += Math.cos(a) * (6 + r() * 12); y += Math.sin(a) * (6 + r() * 12); pts.push([x, y]); }
    wrapDraw(B, pts[0][0] - 40, pts[0][1] - 40, 80, 80, (ox, oy) => { g.strokeStyle = 'rgba(70,110,150,0.45)'; g.lineWidth = 1.1; g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy)); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.6; g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px + ox + 0.8, py + oy + 0.8) : g.moveTo(px + ox + 0.8, py + oy + 0.8)); g.stroke(); });
  }
  return { c, ppu: 64 * T };
};

/* ---------- drzewa ---------- */
const TREES = {};
/* płótno drzewa w px logicznych × F, rysowanie w układzie „autorskim"; zwraca też płótno cienia (rysowane w przebiegu „ziemia") */
function treeBase(w, h, cx, base, seed, sh = {}) {
  const F = sh.F ?? 1, R = sh.R ?? RES, Ru = Math.min(R, 1), pw = Math.ceil(w * F * R), ph = Math.ceil(h * F * R);
  const c = newCanvas(pw, ph), g = c.getContext('2d'), u = newCanvas(Math.ceil(w * F * Ru), Math.ceil(h * F * Ru)), ug = u.getContext('2d');
  g.setTransform(R * F, 0, 0, R * F, 0, 0); ug.setTransform(Ru * F, 0, 0, Ru * F, 0, 0);
  softFill(ug, gg => gg.ellipse(cx + (sh.dx ?? 30), base + 3, sh.rx ?? 52, sh.ry ?? 14, 0, 0, TAU), `rgba(14,22,8,${sh.a ?? 0.5})`, 9);
  return { c, g, u, r: rng(seed), out: () => ({ c, u, ax: cx * F, ay: base * F, w: w * F, h: h * F, R, Ru }) };
}
function treeShadeOverlay(g, x0, y0, x1, y1) { // światło z lewej góry, cień z prawej dołu — na całej koronie
  g.save(); g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,240,170,0.16)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,0,0.42)');
  g.fillStyle = gr; g.fillRect(0, 0, 4000, 4000); g.restore();
}
TREES.oak = (seed, F = 0.8) => {
  const W = 210, H = 240, cx = 105, base = 204, T = treeBase(W, H, cx, base, seed, { F }), { g, r } = T;
  const tg = g.createLinearGradient(cx - 12, 0, cx + 12, 0); tg.addColorStop(0, '#86633c'); tg.addColorStop(0.45, '#5f432a'); tg.addColorStop(1, '#2c1e12');
  g.fillStyle = tg; g.beginPath(); g.moveTo(cx - 16, base + 2); g.quadraticCurveTo(cx - 8, base - 12, cx - 8, base - 44); g.lineTo(cx - 6, base - 84); g.lineTo(cx + 6, base - 84); g.lineTo(cx + 9, base - 44); g.quadraticCurveTo(cx + 9, base - 12, cx + 17, base + 2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(25,16,8,0.5)'; g.lineWidth = 1.2; for (let i = 0; i < 7; i++) { const x = cx - 7 + i * 2.3; g.beginPath(); g.moveTo(x, base - 2); g.quadraticCurveTo(x + (r() - 0.5) * 3, base - 40, x + (r() - 0.5) * 2, base - 80); g.stroke(); }
  g.strokeStyle = '#4a3322'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, base - 70); g.lineTo(cx - 30, base - 104); g.moveTo(cx, base - 74); g.lineTo(cx + 30, base - 108); g.stroke();
  const cyc = base - 104, blobs = [];
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()); blobs.push({ x: cx + Math.cos(a) * d * 58, y: cyc + Math.sin(a) * d * 38 - 4, r: 17 + r() * 17 }); }
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) {
    const gr = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.45, b.r * 0.1, b.x, b.y, b.r * 1.1);
    gr.addColorStop(0, '#b9e168'); gr.addColorStop(0.3, '#78b640'); gr.addColorStop(0.72, '#3f7d2b'); gr.addColorStop(1, '#23541c');
    g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 1100; i++) {
    const b = blobs[(r() * blobs.length) | 0], a = r() * TAU, d = Math.sqrt(r()) * b.r * 0.95, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d;
    const lit = (cx - x) * 0.5 + (cyc - y) * 0.6 + (r() - 0.5) * 46 > 0;
    g.fillStyle = lit ? `rgba(206,238,116,${0.2 + r() * 0.3})` : `rgba(14,44,16,${0.2 + r() * 0.3})`;
    g.beginPath(); g.ellipse(x, y, 2 + r() * 2.6, 1.3 + r() * 1.6, r() * 3, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  treeShadeOverlay(g, cx - 70, cyc - 60, cx + 70, cyc + 50);
  return T.out();
};
TREES.pine = (seed, F = 0.8, o = {}) => {
  const W = 170, H = 280, cx = 85, base = 244, T = treeBase(W, H, cx, base, seed, { F }), { g, r } = T;
  g.fillStyle = '#3d2a1a'; g.fillRect(cx - 5, base - 30, 10, 34);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const yB = base - 16 - i * 24, wd = 58 - i * 6.4, hh = 44 - i * 1.5, pts = [[cx - wd, yB]];
    const k = 6; for (let j = 1; j < k; j++) pts.push([cx - wd + (2 * wd) * j / k + (r() - 0.5) * 6, yB + (j % 2 ? -7 : 3) + r() * 3]);
    pts.push([cx + wd, yB]);
    g.beginPath(); g.moveTo(cx, yB - hh); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
    const gr = g.createLinearGradient(cx - wd, 0, cx + wd, 0); gr.addColorStop(0, '#4f9446'); gr.addColorStop(0.42, '#2f7233'); gr.addColorStop(0.7, '#1f5428'); gr.addColorStop(1, '#123a1c');
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(8,30,12,0.55)'; g.lineWidth = 1; g.stroke();
    g.save(); g.clip();
    for (let q = 0; q < 160; q++) { // igły
      const x = cx - wd + r() * wd * 2, y = yB - hh + r() * (hh + 8), lit = x < cx + (r() - 0.5) * 14;
      g.strokeStyle = lit ? `rgba(150,214,110,${0.25 + r() * 0.3})` : `rgba(6,28,12,${0.25 + r() * 0.3})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x < cx ? -3 : 3), y + 4); g.stroke();
    }
    if (o.snow) { // śnieg na górnych krawędziach pięter i na końcach gałęzi
      g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(250,253,255,0.96)'; g.lineWidth = 7 - i * 0.4;
      g.beginPath(); g.moveTo(cx - wd * 0.9, yB - 3); g.lineTo(cx, yB - hh + 4); g.lineTo(cx + wd * 0.9, yB - 3); g.stroke();
      g.fillStyle = 'rgba(244,250,255,0.92)'; for (let q = 0; q < 7; q++) { const px = cx - wd * 0.85 + r() * wd * 1.7, py = yB - hh * (0.15 + r() * 0.5); g.beginPath(); g.ellipse(px, py, 3 + r() * 4, 2 + r() * 2, 0, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(210,225,240,0.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - wd * 0.85, yB - 1); g.lineTo(cx + wd * 0.85, yB - 1); g.stroke();
    }
    g.restore();
  }
  treeShadeOverlay(g, cx - 50, 40, cx + 50, base);
  return T.out();
};
TREES.palm = (seed, F = 0.8) => {
  const W = 250, H = 240, cx = 125, base = 206, T = treeBase(W, H, cx, base, seed, { F, dx: 28, rx: 46, ry: 12 }), { g, r } = T;
  const top = [cx + 16, base - 118];
  const tp = t => [lerp(lerp(cx, cx - 11, t), lerp(cx - 11, top[0], t), t), lerp(base, top[1], t)];
  const L = [], R = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16, [x, y] = tp(t), w = lerp(9.5, 5.2, t); L.push([x - w, y]); R.push([x + w, y]); }
  g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); R.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
  const tg = g.createLinearGradient(cx - 16, 0, cx + 26, 0); tg.addColorStop(0, '#b08a60'); tg.addColorStop(0.5, '#7d5c3a'); tg.addColorStop(1, '#3b2918');
  g.fillStyle = tg; g.fill(); g.strokeStyle = 'rgba(20,12,6,0.75)'; g.lineWidth = 1.4; g.stroke();
  g.lineWidth = 1.3; for (let i = 1; i < 16; i++) { const [x, y] = tp(i / 16), w = lerp(9.5, 5.2, i / 16); g.strokeStyle = 'rgba(28,16,6,0.5)'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y + 3.5, x + w, y); g.stroke(); }
  const fronds = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + r() * 0.35; fronds.push({ a, len: 62 + r() * 26, droop: 18 + r() * 30, front: Math.sin(a) > 0.05 }); }
  fronds.sort((p, q) => (p.front ? 1 : 0) - (q.front ? 1 : 0));
  for (const f of fronds) {
    const ex = top[0] + Math.cos(f.a) * f.len, ey = top[1] + Math.sin(f.a) * f.len * 0.42 + f.droop;
    const mx = top[0] + Math.cos(f.a) * f.len * 0.55, my = top[1] + Math.sin(f.a) * f.len * 0.2 - 24;
    const B = t => [(1 - t) * (1 - t) * top[0] + 2 * (1 - t) * t * mx + t * t * ex, (1 - t) * (1 - t) * top[1] + 2 * (1 - t) * t * my + t * t * ey];
    const Lp = [], Rp = [], n = 22, maxW = 12 + r() * 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, p0 = B(Math.max(0, t - 0.02)), p1 = B(Math.min(1, t + 0.02)); let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = maxW * Math.pow(Math.sin(Math.PI * Math.min(0.97, t * 0.96 + 0.03)), 0.75) * (1 - 0.25 * t) * (i % 2 ? 1 : 0.76), [bx, by] = B(t);
      Lp.push([bx - ty * w, by + tx * w]); Rp.push([bx + ty * w, by - tx * w]);
    }
    g.beginPath(); Lp.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); Rp.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
    const gr = g.createLinearGradient(top[0], top[1] - 20, ex, ey + 10);
    if (f.front) { gr.addColorStop(0, '#6fb540'); gr.addColorStop(0.55, '#3f8f34'); gr.addColorStop(1, '#2c6e2c'); } else { gr.addColorStop(0, '#3a8030'); gr.addColorStop(1, '#1f5a28'); }
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(10,40,16,0.7)'; g.lineWidth = 1; g.stroke();
    g.save(); g.clip(); g.strokeStyle = 'rgba(8,44,16,0.4)'; g.lineWidth = 0.9;
    for (let i = 1; i < n; i++) { const [lx, ly] = Lp[i], [rx2, ry2] = Rp[i], [bx, by] = B(i / n); g.beginPath(); g.moveTo(lx, ly); g.lineTo(bx, by); g.lineTo(rx2, ry2); g.stroke(); }
    g.strokeStyle = f.front ? 'rgba(210,240,140,0.5)' : 'rgba(120,190,100,0.35)'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= n; i++) { const [bx, by] = B(i / n); i ? g.lineTo(bx, by) : g.moveTo(bx, by); } g.stroke();
    g.restore();
  }
  g.fillStyle = '#b8742a'; g.strokeStyle = 'rgba(40,20,6,0.8)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(top[0] - 7 + r() * 14, top[1] + 4 + r() * 9, 3.6, 0, TAU); g.fill(); g.stroke(); }
  treeShadeOverlay(g, cx - 60, 30, cx + 70, base);
  return T.out();
};

/* ---------- skały i kępy trawy ---------- */
function bakeRock(seed, col = '#8e8c84', F = 0.8) {
  const W = 170, H = 110, cx = 70, base = 86, T = treeBase(W, H, cx, base, seed, { F, dx: 22, rx: 40, ry: 11 }), { g, r } = T, b = hex(col);
  const parts = [[0, 0, 1], [-34, 7, 0.5], [30, 9, 0.42]];
  for (const [ox, oy, k] of parts) {
    const n = 9, rx = 36 * k, ry = 20 * k, hgt = (24 + r() * 8) * k, px = cx + ox, py = base + oy - 6 * k;
    const lo = [], hi = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + (r() - 0.5) * 0.3, kk = 0.8 + r() * 0.32, kt = 0.5 + r() * 0.16;
      lo.push([px + Math.cos(a) * rx * kk, py + Math.sin(a) * ry * kk, a]);
      hi.push([px + Math.cos(a) * rx * kk * kt - 3 * k, py - hgt + Math.sin(a) * ry * kk * kt, a]);
    }
    const tint = [mixc(b, [152, 130, 100], 0.14), mixc(b, [118, 130, 142], 0.14)];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, am = (lo[i][2] + (lo[j][2] < lo[i][2] ? lo[j][2] + TAU : lo[j][2])) / 2;
      const light = Math.cos(am - Math.PI * 1.25) * 0.5 + 0.5, f = 0.58 + 0.62 * light + (r() - 0.5) * 0.12;
      g.beginPath(); g.moveTo(lo[i][0], lo[i][1]); g.lineTo(lo[j][0], lo[j][1]); g.lineTo(hi[j][0], hi[j][1]); g.lineTo(hi[i][0], hi[i][1]); g.closePath();
      const gr = g.createLinearGradient(0, hi[i][1], 0, lo[i][1]); gr.addColorStop(0, css(scaleC(tint[i % 2], f * 1.12))); gr.addColorStop(1, css(scaleC(tint[i % 2], f * 0.8)));
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(14,12,10,0.55)'; g.lineWidth = 1.1; g.stroke();
    }
    g.beginPath(); hi.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    const tg = g.createLinearGradient(px - rx * 0.5, py - hgt - ry * 0.5, px + rx * 0.5, py - hgt + ry * 0.5); tg.addColorStop(0, css(scaleC(b, 1.45))); tg.addColorStop(1, css(scaleC(b, 1.05)));
    g.fillStyle = tg; g.fill(); g.strokeStyle = 'rgba(14,12,10,0.6)'; g.lineWidth = 1.1; g.stroke();
    g.save(); g.clip(); g.fillStyle = 'rgba(96,140,56,0.35)'; g.beginPath(); g.ellipse(px + 4 * k, py - hgt + 2 * k, rx * 0.38, ry * 0.3, 0, 0, TAU); g.fill(); g.restore();
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,240,0.1)' : 'rgba(0,0,0,0.13)'; g.fillRect(px - rx + r() * rx * 2, py - hgt - ry + r() * (hgt + ry * 2), 1 + r() * 2, 1 + r() * 2); }
    const mg = g.createLinearGradient(0, py - 6 * k, 0, py + ry); mg.addColorStop(0, 'rgba(96,140,56,0)'); mg.addColorStop(1, 'rgba(96,140,56,0.5)');
    g.fillStyle = mg; g.fillRect(px - rx * 1.2, py - 6 * k, rx * 2.4, ry * 1.6);
    g.restore();
  }
  return T.out();
}
function bakeTuft(seed, pal, F = 0.7) {
  const W = 40, H = 36, R = RES, c = newCanvas(Math.ceil(W * F * R), Math.ceil(H * F * R)), g = c.getContext('2d'), r = rng(seed), cx = 20, base = 30;
  g.setTransform(R * F, 0, 0, R * F, 0, 0);
  const cols = pal === 'sand' ? ['#9c8248', '#b89c60', '#d4bd84'] : pal === 'snow' ? ['#8a7a58', '#a89a70', '#cfc3a0', '#f2f7fa'] : pal === 'steppe' ? ['#6b7a38', '#8c9a48', '#b0b868', '#cfca80'] : ['#2f6a22', '#4f9030', '#7bb544', '#a6cf5a'];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.7, len = 12 + r() * 14, x = cx + (r() - 0.5) * 10;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = 1.6 + r(); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, base + Math.sin(a) * len * 0.7, x + Math.cos(a) * len * 0.9 + (r() - 0.5) * 6, base + Math.sin(a) * len); g.stroke();
  }
  return { c, ax: cx * F, ay: base * F, w: W * F, h: H * F, R };
}

/* ====================== MIESZKAŃCY ======================
   Duże, szczegółowe postacie (ok. 70 px wysokości przy F=1), widok z przodu i z tyłu (lewo/prawo = odbicie lustrzane),
   2 klatki chodu. Strój i rekwizyty zależą od nacji i roli. Wypiekane z mnożnikiem ≥ 3, żeby były ostre po przybliżeniu. */
function limb(g, x0, y0, x1, y1, w, col) {
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(16,10,6,0.9)'; g.lineWidth = w + 1.8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = css(col); g.lineWidth = w; g.stroke();
  g.strokeStyle = css(scaleC(col, 1.3), 0.7); g.lineWidth = w * 0.3; g.beginPath(); g.moveTo(x0 - w * 0.2, y0); g.lineTo(x1 - w * 0.2, y1); g.stroke();
}
function bakeFigure(st, view, frame, F = 1) {
  const W = 72, H = 108, cx = 36, base = 94, R = Math.max(3, RES * 1.5), c = newCanvas(Math.ceil(W * F * R), Math.ceil(H * F * R)), g = c.getContext('2d');
  const Ru = Math.min(R, 1), u = newCanvas(Math.ceil(W * F * Ru), Math.ceil(H * F * Ru)), ug = u.getContext('2d');
  g.setTransform(R * F, 0, 0, R * F, 0, 0); ug.setTransform(Ru * F, 0, 0, Ru * F, 0, 0);
  softFill(ug, gg => gg.ellipse(cx + 7, base + 1, 15, 5, 0, 0, TAU), 'rgba(14,22,8,0.5)', 4);
  const back = view === 'back', sk = hex(st.skin || '#e8c29a'), tun = hex(st.tunic), trim = hex(st.trim), belt = hex(st.belt || '#5a3a1c'), legc = hex(st.legs || '#6a5238'), bootc = hex(st.boots || '#4a3422');
  const hair = hex(st.hair || '#6a4a2a'), sw = frame ? 1 : -1;                       // znak wymachu kończyn
  const sh = base - 52, hem = st.dress ? base - 8 : base - 24, hy = sh - 10, hr = 7.4;  // linia barków, dół tuniki, środek głowy, promień głowy
  const out = 'rgba(16,10,6,0.9)';
  const shade = (col, a, b2) => { const gr = g.createLinearGradient(cx - 12, 0, cx + 12, 0); gr.addColorStop(0, css(scaleC(col, a))); gr.addColorStop(0.55, css(col)); gr.addColorStop(1, css(scaleC(col, b2))); return gr; };
  const has = p => (st.props || []).includes(p);

  // plecy: kosz / worek / tarcza na plecach (za tułowiem)
  if (back && has('basket')) { g.fillStyle = '#9a6e34'; g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx, sh + 8, 11, 13, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(60,36,12,0.55)'; for (let i = -9; i <= 9; i += 3) { g.beginPath(); g.moveTo(cx + i, sh - 3); g.lineTo(cx + i * 1.1, sh + 19); g.stroke(); } for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(cx - 10, sh + j * 4.2); g.lineTo(cx + 10, sh + j * 4.2); g.stroke(); } }

  // kołczan ze strzałami: za tułowiem (z przodu wystaje zza prawego barku, z tyłu leży na plecach)
  if (has('quiver')) {
    g.save(); g.translate(back ? cx + 1 : cx + 9, sh + 6); g.rotate(back ? -0.14 : 0.32); g.fillStyle = '#7a5230'; g.strokeStyle = out; g.lineWidth = 1.1; g.beginPath(); g.rect(-3.4, -4, 6.8, 22); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(60,34,14,0.6)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-3.4, 6); g.lineTo(3.4, 6); g.moveTo(-3.4, 12); g.lineTo(3.4, 12); g.stroke();
    g.fillStyle = '#ece4ce'; g.strokeStyle = 'rgba(16,10,6,0.8)'; g.lineWidth = 0.7; for (const dx of [-2, 0.4, 2.4]) { g.beginPath(); g.moveTo(dx, -4); g.lineTo(dx - 1, -10); g.lineTo(dx + 1, -9.4); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }

  // nogi i obuwie
  if (!st.dress) {
    for (const [lx, lift] of [[-4.2, sw > 0 ? 3.5 : 0], [4.2, sw > 0 ? 0 : 3.5]]) {
      limb(g, cx + lx, hem - 1, cx + lx * 1.1, base - 3 - lift, 6.6, legc);
      g.fillStyle = css(bootc); g.strokeStyle = out; g.lineWidth = 1.1; g.beginPath(); g.ellipse(cx + lx * 1.1, base - 1.5 - lift, 5, 3.1, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = css(scaleC(bootc, 1.4), 0.6); g.beginPath(); g.ellipse(cx + lx * 1.1 - 1, base - 2.6 - lift, 2.6, 1.2, 0, 0, TAU); g.fill();
    }
  } else {
    for (const [lx, lift] of [[-3.6, sw > 0 ? 2.5 : 0], [3.6, sw > 0 ? 0 : 2.5]]) { g.fillStyle = css(bootc); g.strokeStyle = out; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + lx, base - 1.5 - lift, 4.2, 2.6, 0, 0, TAU); g.fill(); g.stroke(); }
  }

  // tułów
  const tw = st.dress ? 21 : 22, hw = st.dress ? 30 : 25;
  g.beginPath(); g.moveTo(cx - tw / 2, sh + 3); g.quadraticCurveTo(cx - tw / 2 - 1, sh - 1, cx - 5, sh - 1.5); g.lineTo(cx + 5, sh - 1.5); g.quadraticCurveTo(cx + tw / 2 + 1, sh - 1, cx + tw / 2, sh + 3);
  g.lineTo(cx + hw / 2, hem); g.quadraticCurveTo(cx, hem + 3.5, cx - hw / 2, hem); g.closePath();
  g.fillStyle = shade(tun, 1.25, 0.66); g.fill(); g.strokeStyle = out; g.lineWidth = 1.3; g.stroke();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 0.9; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * 3.2, sh); g.lineTo(cx + i * 3.6, hem + 2); g.stroke(); }   // fałdy tkaniny
  if (st.apron && !back) { g.fillStyle = css(hex(st.apron)); g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx - 8, sh + 14); g.lineTo(cx + 8, sh + 14); g.lineTo(cx + 10, hem + 3); g.lineTo(cx - 10, hem + 3); g.closePath(); g.fill(); g.stroke(); }
  if (st.tabard && !back) { g.fillStyle = css(hex(st.tabard)); g.fillRect(cx - 1.8, sh + 1, 3.6, hem - sh + 3); g.fillRect(cx - 7, sh + 8, 14, 3.4); }
  g.restore();
  g.strokeStyle = css(trim); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - hw / 2 + 0.6, hem - 0.5); g.quadraticCurveTo(cx, hem + 3, cx + hw / 2 - 0.6, hem - 0.5); g.stroke();   // obszycie dołu
  if (!st.dress || st.sash) { g.fillStyle = css(st.sash ? hex(st.sash) : belt); g.strokeStyle = out; g.lineWidth = 0.9; g.fillRect(cx - tw / 2 - 0.4, sh + 20, tw + 0.8, 3.6); g.strokeRect(cx - tw / 2 - 0.4, sh + 20, tw + 0.8, 3.6); if (!back) { g.fillStyle = '#d8b44a'; g.fillRect(cx - 1.8, sh + 20.4, 3.6, 2.8); } }
  if (!back) { g.fillStyle = css(sk); g.beginPath(); g.moveTo(cx - 4.2, sh - 1.3); g.lineTo(cx, sh + 4.6); g.lineTo(cx + 4.2, sh - 1.3); g.closePath(); g.fill(); g.strokeStyle = css(trim); g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 4.6, sh - 1.4); g.lineTo(cx, sh + 5.2); g.lineTo(cx + 4.6, sh - 1.4); g.stroke(); }
  if (st.fur) { g.fillStyle = css(hex(st.fur)); for (let i = -5; i <= 5; i++) { g.beginPath(); g.ellipse(cx + i * 1.9, sh + 0.5 + Math.abs(i) * 0.25, 2.3, 2.9, 0, 0, TAU); g.fill(); } }

  // ręce (z rękawami / kolczugą) i dłonie
  const slv = st.mail ? hex('#8a9096') : (st.sleeve ? hex(st.sleeve) : scaleC(tun, 0.95));
  const handL = [cx - 12.5, sh + 19 + sw * 2.4], handR = [cx + 12.5, sh + 19 - sw * 2.4];
  const raiseR = has('spear') || has('axe') || has('scimitar'), holdL = has('shield-kite') || has('shield-round') || has('basket') || has('jar') || has('bow');
  const hr2 = raiseR ? [cx + 13.5, sh + 14] : handR, hl2 = holdL && !back ? [cx - 13.5, sh + 14] : handL;
  limb(g, cx - 10, sh + 3, hl2[0], hl2[1], 5.4, slv); limb(g, cx + 10, sh + 3, hr2[0], hr2[1], 5.4, slv);
  if (st.mail) { g.strokeStyle = 'rgba(30,34,40,0.35)'; g.lineWidth = 0.7; for (const [hx, hy2] of [hl2, hr2]) for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(hx * 0.3 + cx * 0.7, (hy2 + sh + 3) / 2 + i * 1.4 - 2, 2.4, 0, Math.PI); g.stroke(); } }
  for (const [hx, hy2] of [hl2, hr2]) { g.fillStyle = css(sk); g.strokeStyle = out; g.lineWidth = 1; g.beginPath(); g.arc(hx, hy2 + 1.5, 2.9, 0, TAU); g.fill(); g.stroke(); }

  // rekwizyty trzymane (przed tułowiem)
  if (has('shield-kite') && !back) {
    const x = cx - 14.5, y = sh + 3; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.quadraticCurveTo(x + 7.6, y + 13, x, y + 25); g.quadraticCurveTo(x - 7.6, y + 13, x - 7, y); g.closePath();
    g.fillStyle = st.shieldCol || '#2f5aa8'; g.fill(); g.strokeStyle = out; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#e0c060'; g.fillRect(x - 1.4, y + 2, 2.8, 19); g.fillRect(x - 5.4, y + 7, 10.8, 2.8);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 6, y + 1.2); g.lineTo(x + 6, y + 1.2); g.stroke();
  }
  if (has('shield-round') && !back) {
    const x = cx - 14, y = sh + 14, cols = st.shieldSegs || ['#b8352b', '#e8d8a0'];
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, 11, i * TAU / 8, (i + 1) * TAU / 8); g.closePath(); g.fillStyle = cols[i % cols.length]; g.fill(); }
    g.strokeStyle = out; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 11, 0, TAU); g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 8.6, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  }
  if (has('shield-round') && back) { const x = cx, y = sh + 11, cols = st.shieldSegs || ['#b8352b', '#e8d8a0']; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, 12, i * TAU / 8, (i + 1) * TAU / 8); g.closePath(); g.fillStyle = cols[i % cols.length]; g.fill(); } g.strokeStyle = out; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(x, y, 3.4, 0, TAU); g.fill(); g.stroke(); }
  if (has('basket') && !back) { const x = cx - 14, y = sh + 22; g.fillStyle = '#a07438'; g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 8, y - 3); g.lineTo(x + 8, y - 3); g.lineTo(x + 6, y + 8); g.lineTo(x - 6, y + 8); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(60,36,12,0.6)'; for (let j = 0; j < 3; j++) { g.beginPath(); g.moveTo(x - 7, y + j * 3.4); g.lineTo(x + 7, y + j * 3.4); g.stroke(); } g.fillStyle = '#d8b050'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x - 6 + i * 3, y - 3.6, 2.2, 0, TAU); g.fill(); } }
  if (has('jar')) { const x = cx + 11, y = sh - 4; g.save(); g.translate(x, y); g.rotate(-0.25); g.fillStyle = '#b4693a'; g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-3, -12); g.quadraticCurveTo(-3.4, -8, -7, -3); g.quadraticCurveTo(-9, 6, -3.5, 12); g.lineTo(3.5, 12); g.quadraticCurveTo(9, 6, 7, -3); g.quadraticCurveTo(3.4, -8, 3, -12); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#7a3e1c'; g.fillRect(-4, -13.6, 8, 3); g.strokeStyle = '#e8c070'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-7.4, 1); g.quadraticCurveTo(0, 4, 7.4, 1); g.stroke(); g.strokeStyle = 'rgba(255,230,190,0.4)'; g.beginPath(); g.moveTo(-5, -3); g.quadraticCurveTo(-7, 3, -3, 9); g.stroke(); g.restore(); }
  if (has('sack')) { const x = cx + 7, y = sh - 5; g.save(); g.translate(x, y); g.rotate(0.35); const gr = g.createRadialGradient(-3, -4, 1, 0, 0, 12); gr.addColorStop(0, '#e8d8a8'); gr.addColorStop(1, '#a89060'); g.fillStyle = gr; g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.ellipse(0, 0, 8.5, 11, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#7a6238'; g.fillRect(-3, -12.5, 6, 3); g.restore(); }
  if (has('axe')) {
    g.save(); g.translate(hr2[0], hr2[1] + 1); g.rotate(0.28); g.lineCap = 'round'; g.strokeStyle = out; g.lineWidth = 3.6; g.beginPath(); g.moveTo(0, 9); g.lineTo(0, -21); g.stroke(); g.strokeStyle = '#9a7240'; g.lineWidth = 2.1; g.stroke();
    g.fillStyle = '#c4cbd2'; g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0.5, -21); g.quadraticCurveTo(10, -23, 9, -12); g.quadraticCurveTo(5, -13, 0.5, -11); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(8, -20); g.quadraticCurveTo(9, -16, 8, -13); g.stroke(); g.restore();
  }
  if (has('spear')) {
    g.save(); g.translate(hr2[0] + 1, hr2[1]); g.lineCap = 'round'; g.strokeStyle = out; g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, 36); g.lineTo(0, -56); g.stroke(); g.strokeStyle = '#a07a44'; g.lineWidth = 1.9; g.stroke();
    g.fillStyle = '#d2d8de'; g.strokeStyle = out; g.lineWidth = 1.1; g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(4.4, -62, 0, -55); g.quadraticCurveTo(-4.4, -62, 0, -70); g.fill(); g.stroke();
    g.fillStyle = '#b8352b'; g.beginPath(); g.moveTo(0, -54); g.lineTo(6.5, -51); g.lineTo(0, -48); g.closePath(); g.fill(); g.restore();
  }
  if (has('scimitar')) { g.save(); g.translate(cx - 11, hem - 3); g.rotate(0.16); g.fillStyle = '#4a3422'; g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-2, 0); g.quadraticCurveTo(-5, 12, 1, 20); g.lineTo(3.4, 19); g.quadraticCurveTo(0, 11, 2.6, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#d8b44a'; g.fillRect(-3.4, -4, 7, 3); g.restore(); }

  if (has('bow') && !back) {                                          // łuk w lewej dłoni: pionowy łuk z cięciwą
    const bx = hl2[0] - 1, by = hl2[1] + 1; g.save(); g.lineCap = 'round';
    g.strokeStyle = out; g.lineWidth = 3.6; g.beginPath(); g.moveTo(bx + 1, by - 24); g.quadraticCurveTo(bx - 12, by, bx + 1, by + 24); g.stroke();
    g.strokeStyle = '#8a5a2c'; g.lineWidth = 2.1; g.stroke(); g.strokeStyle = 'rgba(255,230,180,0.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(bx - 0.5, by - 22); g.quadraticCurveTo(bx - 8.5, by, bx - 0.5, by + 22); g.stroke();
    g.strokeStyle = 'rgba(245,240,225,0.9)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(bx + 1, by - 24); g.lineTo(bx + 1, by + 24); g.stroke(); g.restore();
  }

  // głowa
  const gradHead = g.createRadialGradient(cx - 2.4, hy - 2.4, 1, cx, hy, hr + 1); gradHead.addColorStop(0, css(scaleC(sk, 1.12))); gradHead.addColorStop(1, css(scaleC(sk, 0.82)));
  g.fillStyle = css(sk); g.strokeStyle = out; g.lineWidth = 1.3;
  if (!back) { g.beginPath(); g.ellipse(cx - hr + 0.4, hy + 0.6, 1.6, 2.2, 0, 0, TAU); g.ellipse(cx + hr - 0.4, hy + 0.6, 1.6, 2.2, 0, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = gradHead; g.beginPath(); g.arc(cx, hy, hr, 0, TAU); g.fill(); g.stroke();
  const hairStyle = st.hairStyle || 'short', hcol = css(hair);
  if (!back) {
    g.fillStyle = '#1c1410'; g.beginPath(); g.ellipse(cx - 2.7, hy + 0.4, 0.95, 1.35, 0, 0, TAU); g.ellipse(cx + 2.7, hy + 0.4, 0.95, 1.35, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(cx - 2.4, hy - 0.1, 0.35, 0, TAU); g.arc(cx + 3.0, hy - 0.1, 0.35, 0, TAU); g.fill();
    g.strokeStyle = css(scaleC(hair, 0.8)); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 4.2, hy - 1.9); g.lineTo(cx - 1.4, hy - 2.4); g.moveTo(cx + 1.4, hy - 2.4); g.lineTo(cx + 4.2, hy - 1.9); g.stroke();
    g.strokeStyle = 'rgba(120,70,40,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 0.4, hy + 0.6); g.lineTo(cx - 0.4, hy + 2.8); g.lineTo(cx + 1, hy + 3); g.stroke();
    if (!st.beard) { g.strokeStyle = 'rgba(110,50,40,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 1.8, hy + 4.7); g.quadraticCurveTo(cx, hy + 5.6, cx + 1.8, hy + 4.7); g.stroke(); }
  }
  const hasHat = st.head && st.head !== 'bare';
  if (!(hasHat && ['helm', 'conical', 'hood'].includes(st.head) && !back && false)) {
    g.fillStyle = hcol; g.strokeStyle = 'rgba(16,10,6,0.6)'; g.lineWidth = 0.9;
    if (back) { g.beginPath(); g.arc(cx, hy, hr + 0.2, 0, TAU); g.fill(); g.stroke(); if (hairStyle === 'braids') { for (const bx of [-2.6, 2.6]) { limb(g, cx + bx, hy + 5, cx + bx * 1.2, hy + 22, 3.4, hair); } } }
    else { g.beginPath(); g.arc(cx, hy - 0.4, hr + 0.35, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(cx + hr - 1, hy - 2.6, cx + hr - 2.4, hy + 2.4); g.lineTo(cx + hr - 1, hy - 1.2); g.quadraticCurveTo(cx, hy - 5.6, cx - hr + 1, hy - 1.2); g.lineTo(cx - hr + 2.4, hy + 2.4); g.closePath(); g.fill(); g.stroke();
      if (hairStyle === 'braids') { for (const bx of [-hr + 0.4, hr - 0.4]) limb(g, cx + bx, hy + 1, cx + bx * 1.15, hy + 17, 3.2, hair); } }
  }
  if (st.beard && !back) { g.fillStyle = css(hex(st.beardCol || st.hair || '#6a4a2a')); g.strokeStyle = 'rgba(16,10,6,0.6)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(cx - hr + 0.8, hy + 1.4); g.quadraticCurveTo(cx - hr + 1.4, hy + 8.4, cx, hy + 12.4); g.quadraticCurveTo(cx + hr - 1.4, hy + 8.4, cx + hr - 0.8, hy + 1.4); g.quadraticCurveTo(cx + 3.6, hy + 4.2, cx, hy + 3.4); g.quadraticCurveTo(cx - 3.6, hy + 4.2, cx - hr + 0.8, hy + 1.4); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.18)'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 1.6, hy + 4.6); g.lineTo(cx + i * 1.3, hy + 10); g.stroke(); } }

  // nakrycia głowy
  const hc = st.headCol ? hex(st.headCol) : tun, ht = st.head;
  const metal = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#eef1f4'); gr.addColorStop(0.5, '#a9b0b8'); gr.addColorStop(1, '#5e656e'); return gr; };
  if (ht === 'cap') { g.fillStyle = css(hc); g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - hr - 0.4, hy - 1.4); g.quadraticCurveTo(cx - 6, hy - 14, cx + 1, hy - 15.5); g.quadraticCurveTo(cx + 7, hy - 12, cx + hr + 0.4, hy - 1.4); g.quadraticCurveTo(cx, hy - 5, cx - hr - 0.4, hy - 1.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle = css(scaleC(hc, 1.5)); g.beginPath(); g.ellipse(cx, hy - 2.4, hr + 0.8, 2.4, 0, 0, TAU); g.fill(); g.stroke(); }
  if (ht === 'hood') { g.fillStyle = css(hc); g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx - hr - 2.4, hy + 7); g.quadraticCurveTo(cx - hr - 3.6, hy - 6, cx - 2, hy - 13); g.quadraticCurveTo(cx + 5, hy - 17, cx + 4.4, hy - 11); g.quadraticCurveTo(cx + hr + 3.6, hy - 6, cx + hr + 2.4, hy + 7); g.lineTo(cx + hr - 0.4, hy + 3); g.quadraticCurveTo(cx + hr - 0.8, hy - 5.6, cx, hy - 7); g.quadraticCurveTo(cx - hr + 0.8, hy - 5.6, cx - hr + 0.4, hy + 3); g.closePath(); g.fill(); g.stroke(); if (back) { g.beginPath(); g.arc(cx, hy, hr + 1.4, 0, TAU); g.fill(); g.stroke(); } }
  if (ht === 'kettle') { g.fillStyle = metal(cx - 10, hy - 14, cx + 10, hy); g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.ellipse(cx, hy - 3.6, hr + 4, 2.9, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx - hr - 0.6, hy - 3.8); g.quadraticCurveTo(cx - hr, hy - 15, cx, hy - 14.6); g.quadraticCurveTo(cx + hr, hy - 15, cx + hr + 0.6, hy - 3.8); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 4, hy - 12); g.quadraticCurveTo(cx - 6, hy - 8, cx - 5.6, hy - 5); g.stroke(); if (!back) { g.fillStyle = '#8a9098'; g.fillRect(cx - 0.9, hy - 4, 1.8, 7); } }
  if (ht === 'conical') { g.fillStyle = metal(cx - 9, hy - 18, cx + 9, hy - 2); g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx - hr - 0.6, hy - 2.2); g.quadraticCurveTo(cx - 4, hy - 12, cx + 0.6, hy - 19); g.quadraticCurveTo(cx + 5, hy - 11, cx + hr + 0.6, hy - 2.2); g.quadraticCurveTo(cx, hy - 5, cx - hr - 0.6, hy - 2.2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#7a5a2a'; g.fillRect(cx - hr - 0.6, hy - 4, hr * 2 + 1.2, 2.2); if (!back) { g.fillStyle = '#8a9098'; g.fillRect(cx - 0.9, hy - 2, 1.8, 7); } g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(cx - 3.4, hy - 9); g.lineTo(cx - 1.4, hy - 16); g.stroke(); }
  if (ht === 'turban') { g.strokeStyle = out; g.lineWidth = 1.3; g.fillStyle = css(hex(st.headCol || '#f1ead8')); g.beginPath(); g.ellipse(cx, hy - 3.2, hr + 2.4, 5.2, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(cx, hy - 7.4, hr + 0.2, 4.4, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = css(hex(st.turbanStripe || '#2f6ea8')); g.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 3.2 - 3, hy - 0.6); g.quadraticCurveTo(cx + i * 3.4, hy - 6, cx + i * 3 + 3, hy - 11); g.stroke(); } g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx - 3, hy - 9, 3.2, 1.3, -0.3, 0, TAU); g.fill(); }
  if (ht === 'kerchief') { g.fillStyle = css(hc); g.strokeStyle = out; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx - hr - 0.8, hy + 3); g.quadraticCurveTo(cx - hr - 1.4, hy - 9, cx, hy - 10); g.quadraticCurveTo(cx + hr + 1.4, hy - 9, cx + hr + 0.8, hy + 3); g.quadraticCurveTo(cx + hr - 0.4, hy - 3, cx, hy - 5.4); g.quadraticCurveTo(cx - hr + 0.4, hy - 3, cx - hr - 0.8, hy + 3); g.closePath(); g.fill(); g.stroke(); g.fillStyle = css(scaleC(hc, 0.8)); g.beginPath(); g.moveTo(cx + hr, hy + 1); g.lineTo(cx + hr + 5.4, hy + 5.4); g.lineTo(cx + hr + 0.4, hy + 5.4); g.closePath(); g.fill(); g.stroke(); if (back) { g.fillStyle = css(hc); g.beginPath(); g.arc(cx, hy, hr + 0.8, 0, TAU); g.fill(); g.stroke(); } }
  if (ht === 'fur') { g.fillStyle = css(hc); g.strokeStyle = out; g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx, hy - 5.4, hr + 2.2, 5.6, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = css(scaleC(hc, 1.5), 0.7); g.lineWidth = 1; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 4, hy - 5.4 + Math.sin(a) * 2.4); g.lineTo(cx + Math.cos(a) * 9, hy - 5.4 + Math.sin(a) * 4.8); g.stroke(); } }

  // lekkie światło z lewej-góry na całej postaci
  g.save(); g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(cx - 20, 10, cx + 22, base); lg.addColorStop(0, 'rgba(255,240,190,0.16)'); lg.addColorStop(0.55, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,20,0.18)'); g.fillStyle = lg; g.fillRect(0, 0, 400, 400); g.restore();
  return { c, u, ax: cx * F, ay: base * F, w: W * F, h: H * F, R, Ru };
}

/* zestawy postaci (styl + rola) — po 2 na nację; każdy: [przód A, przód B, tył A, tył B] */
const CAST = {
  slavAxe: { tunic: '#e6dcc0', trim: '#b8352b', belt: '#6a4a2a', legs: '#7a6044', boots: '#8a6a40', hair: '#8a5a2a', beard: true, beardCol: '#8a5a2a', head: 'cap', headCol: '#7a5a3a', props: ['axe'] },
  slavWoman: { tunic: '#b04a32', trim: '#3a6aa0', belt: '#6a4a2a', boots: '#8a6a40', hair: '#a8702e', hairStyle: 'braids', dress: true, apron: '#f0e8d0', head: 'kerchief', headCol: '#dcc060', props: ['basket'] },
  frankGuard: { tunic: '#2f5aa8', trim: '#e0c060', belt: '#4a3422', legs: '#4a3a2a', boots: '#2e2218', hair: '#4a3020', head: 'kettle', mail: true, tabard: '#e8e0c0', props: ['spear', 'shield-kite'] },
  frankPeasant: { tunic: '#7a8a3e', trim: '#d8c070', belt: '#5a3a1c', legs: '#6a5238', boots: '#4a3422', hair: '#5a3a1c', head: 'hood', headCol: '#8a5a3a', props: ['sack'] },
  sarMerchant: { tunic: '#efe6d0', trim: '#2f6ea8', belt: '#b8352b', sash: '#b8352b', boots: '#8a5a2a', hair: '#2a1c10', beard: true, beardCol: '#2a1c10', dress: true, head: 'turban', headCol: '#f1ead8', turbanStripe: '#2f6ea8', props: ['jar'] },
  sarGuard: { tunic: '#2f7a72', trim: '#d8a830', belt: '#d8a830', legs: '#e8e0cc', boots: '#8a5a2a', hair: '#2a1c10', beard: true, beardCol: '#2a1c10', head: 'turban', headCol: '#b8352b', turbanStripe: '#e8d8a0', props: ['scimitar', 'shield-round'], shieldSegs: ['#d8a830', '#2f7a72'] },
  vikWarrior: { tunic: '#8a3a2a', trim: '#e0b840', belt: '#3a2a1c', legs: '#5a4a38', boots: '#3a2a1c', hair: '#c89a50', beard: true, beardCol: '#c89a50', head: 'conical', fur: '#d8d0c0', props: ['axe', 'shield-round'], shieldSegs: ['#b8352b', '#e8d8a0'] },
  vikFisher: { tunic: '#3a6a8a', trim: '#e8d8a0', belt: '#4a3422', legs: '#6a5a46', boots: '#4a3422', hair: '#d8b060', beard: true, beardCol: '#d8b060', head: 'fur', headCol: '#7a6a5a', props: ['sack'] },
  /* myśliwi z łukiem (Faza 8) — dopisani na końcu, by nie przesunąć indeksów 0 i 1 wybieranych w grze po kolorze stroju */
  frankHunter: { tunic: '#6a7a3a', trim: '#c8b060', belt: '#4a3422', legs: '#5a4630', boots: '#3a2a1c', hair: '#4a3020', head: 'hood', headCol: '#4a5a2a', props: ['bow', 'quiver'] },
  sarHunter: { tunic: '#b8946a', trim: '#2f6ea8', belt: '#8a3a22', legs: '#e8e0cc', boots: '#8a5a2a', hair: '#2a1c10', beard: true, beardCol: '#2a1c10', head: 'turban', headCol: '#d8c8a0', turbanStripe: '#8a3a22', dress: false, props: ['bow', 'quiver'] },
  vikHunter: { tunic: '#5a6a4a', trim: '#c89a50', belt: '#3a2a1c', legs: '#5a4a38', boots: '#3a2a1c', hair: '#c89a50', beard: true, beardCol: '#c89a50', head: 'fur', headCol: '#6a5a4a', fur: '#d8d0c0', props: ['bow', 'quiver'] },
  slavHunter: { tunic: '#7a5a32', trim: '#b8352b', belt: '#4a3422', legs: '#6a5238', boots: '#4a3422', hair: '#8a5a2a', beard: true, beardCol: '#8a5a2a', head: 'cap', headCol: '#6a4a2a', props: ['bow', 'quiver'] },
  /* robotnicy (Faza 9B) — dopisani na końcu; bez rekwizytów w ręku: narzędzia i ładunki dorysowuje gra zależnie od czynności (Walkers → drawFigure); 2 warianty koloru na nację */
  frankWorker: { tunic: '#8a7a46', trim: '#d8c070', belt: '#5a3a1c', legs: '#6a5238', boots: '#4a3422', hair: '#5a3a1c', head: 'hood', headCol: '#8a5a3a', props: [] },
  frankWorkerB: { tunic: '#9a5a3a', trim: '#e0d090', belt: '#4a3422', legs: '#5a4630', boots: '#3a2a1c', hair: '#3a2a18', head: 'cap', headCol: '#6a5a3a', props: [] },
  sarWorker: { tunic: '#d8c8a0', trim: '#2f6ea8', belt: '#8a3a22', legs: '#e8e0cc', boots: '#8a5a2a', hair: '#2a1c10', beard: true, beardCol: '#2a1c10', head: 'turban', headCol: '#e8dcc0', turbanStripe: '#2f6ea8', props: [] },
  sarWorkerB: { tunic: '#b8946a', trim: '#b8352b', belt: '#5a3a1c', legs: '#d8d0b8', boots: '#7a4a22', hair: '#2a1c10', head: 'turban', headCol: '#c8a878', turbanStripe: '#8a3a22', props: [] },
  vikWorker: { tunic: '#6a6a4a', trim: '#c89a50', belt: '#3a2a1c', legs: '#5a4a38', boots: '#3a2a1c', hair: '#c89a50', beard: true, beardCol: '#c89a50', head: 'fur', headCol: '#7a6a5a', fur: '#d8d0c0', props: [] },
  vikWorkerB: { tunic: '#4a6a8a', trim: '#e8d8a0', belt: '#4a3422', legs: '#6a5a46', boots: '#4a3422', hair: '#a87a3a', head: 'cap', headCol: '#5a4a3a', props: [] },
  slavWorker: { tunic: '#e6dcc0', trim: '#b8352b', belt: '#6a4a2a', legs: '#7a6044', boots: '#8a6a40', hair: '#8a5a2a', beard: true, beardCol: '#8a5a2a', head: 'cap', headCol: '#7a5a3a', props: [] },
  slavWorkerB: { tunic: '#c8a868', trim: '#3a6aa0', belt: '#6a4a2a', legs: '#6a5238', boots: '#7a5a38', hair: '#a8702e', head: 'kerchief', headCol: '#b04a32', props: [] }
};
function bakeCast(key, F = 1) { const st = CAST[key]; return { front: [bakeFigure(st, 'front', 0, F), bakeFigure(st, 'front', 1, F)], back: [bakeFigure(st, 'back', 0, F), bakeFigure(st, 'back', 1, F)] }; }
