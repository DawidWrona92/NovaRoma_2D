/* ====================== KLIMATY: tekstury gruntu i roślinność (śnieg, pustynia, Europa Wschodnia) ======================
   Tekstury kafelkowalne (jak GEN.grass): wydmy, bagno, ruchome piaski, zaspy. Sprite'y: brzoza, drzewo zimowe (nagie, ośnieżone), krzewy,
   kaktus, trzcina, bloki klifów (skała / piaskowiec / ośnieżona). Wszystko rysowane kodem, deterministycznie z ziarna. */

/* wydmy: asymetryczne grzbiety (łagodny stok nawietrzny, stromy zawietrzny w cieniu); okres całkowity → bezszwowy kafelek */
GEN.dune = () => {
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const n1 = fbm(N, 3, 3, 71), wp = fbm(N, 5, 3, 73), lut = lutRamp([[0, hex('#b6975a')], [0.45, hex('#d0b278')], [0.8, hex('#e2c98e')], [1, hex('#efdcaa')]]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, s = (2 * x + y) / N + (wp[i] - 0.5) * 0.9, f = s - Math.floor(s);
    const b = f < 0.7 ? 0.9 + 0.24 * (f / 0.7) : 0.6 + 0.3 * ((f - 0.7) / 0.3), k = Math.min(1, Math.abs(f - 0.7) / 0.025), bb = k < 1 ? lerp(0.78, b, k) : b;   // wygładzony grzbiet
    const col = lut[clamp(((n1[i] * 0.9 - 0.05) * 255) | 0, 0, 255)];
    d[i * 4] = col[0] * bb; d[i * 4 + 1] = col[1] * bb; d[i * 4 + 2] = col[2] * bb; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(75);
  for (let i = 0; i < 700; i++) { const x = r() * B, y = r() * B; g.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.25)' : 'rgba(120,90,50,0.22)'; g.fillRect(x, y, 1 + r() * 1.6, 1); }   // ziarenka piasku
  return { c, ppu: 64 * T };
};
/* zaspy: miękkie śnieżne garby z niebieskawym cieniem */
GEN.drift = () => {
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const n1 = fbm(N, 3, 3, 91), wp = fbm(N, 6, 3, 93), lut = lutRamp([[0, hex('#c4d4e4')], [0.5, hex('#e4eef6')], [1, hex('#ffffff')]]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, s = (x + 2 * y) / N + (wp[i] - 0.5) * 1.2, f = s - Math.floor(s);
    const b = f < 0.65 ? 0.96 + 0.08 * (f / 0.65) : 0.82 + 0.18 * ((f - 0.65) / 0.35), col = lut[clamp(((n1[i] - 0.1) * 1.4 * 255) | 0, 0, 255)];
    d[i * 4] = col[0] * b * 0.97; d[i * 4 + 1] = col[1] * b; d[i * 4 + 2] = Math.min(255, col[2] * b * 1.03); d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(95); for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.6 ? 'rgba(255,255,255,0.5)' : 'rgba(150,175,205,0.28)'; g.fillRect(r() * B, r() * B, 1 + r() * 1.4, 1); }
  return { c, ppu: 64 * T };
};
/* bagno: mchy, kałuże, kępy turzycy */
GEN.bog = () => {
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const n1 = fbm(N, 4, 4, 81), n2 = periodicNoise(N, 24, 83), n3 = fbm(N, 6, 3, 85), lut = lutRamp([[0, hex('#26331c')], [0.5, hex('#43552c')], [1, hex('#6c7c3e')]]);
  for (let i = 0; i < N * N; i++) {
    let col = lut[clamp(((n1[i] * 0.8 + n2[i] * 0.4 - 0.1) * 255) | 0, 0, 255)];
    const p = clamp((n3[i] - 0.58) / 0.1, 0, 1);                                                // kałuże
    if (p > 0) col = mixc(col, mixc(hex('#27434a'), hex('#4a7a82'), clamp((n2[i] - 0.3) * 1.5, 0, 1)), p * 0.9);
    d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(87);
  for (let i = 0; i < 520; i++) { const x = r() * B, y = r() * B, a = -Math.PI / 2 + (r() - 0.5) * 0.9, l = 2 + r() * 5; g.strokeStyle = ['#1e2c16', '#4c6a2c', '#7a9a44', '#9ab25a'][(r() * 4) | 0]; g.globalAlpha = 0.3 + r() * 0.5; g.lineWidth = 0.8 + r() * 0.8;
    wrapDraw(B, x - 6, y - 8, 12, 14, (ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); }); }
  g.globalAlpha = 1;
  return { c, ppu: 64 * T };
};
/* ruchome piaski: ciemniejszy, wilgotny piach z kręgami i połyskiem */
GEN.quick = () => {
  const T = TEXRES, B = 256, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const n1 = fbm(N, 4, 3, 61), lut = lutRamp([[0, hex('#6e5a34')], [0.5, hex('#8c7448')], [1, hex('#b09a68')]]);
  for (let i = 0; i < N * N; i++) { const col = lut[clamp(((n1[i] - 0.15) * 1.6 * 255) | 0, 0, 255)]; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(63);
  for (let i = 0; i < 9; i++) { const x = r() * B, y = r() * B; for (let k = 1; k <= 5; k++) { const rad = k * (5 + r() * 3);
    wrapDraw(B, x - rad, y - rad * 0.6, rad * 2, rad * 1.2, (ox, oy) => { g.strokeStyle = k % 2 ? 'rgba(56,40,20,0.38)' : 'rgba(230,208,150,0.3)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x + ox, y + oy, rad, rad * 0.55, 0, 0, TAU); g.stroke(); }); } }
  for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(255,240,190,0.28)'; g.fillRect(r() * B, r() * B, 1.6, 0.8); }
  return { c, ppu: 64 * T };
};

/* ---------- drzewa i krzewy ---------- */
/* brzoza: biały pień z czarnymi przewężeniami, jasna, ażurowa korona */
TREES.birch = (seed, F = 0.8) => {
  const W = 190, H = 250, cx = 95, base = 214, T = treeBase(W, H, cx, base, seed, { F, dx: 22, rx: 42, ry: 12 }), { g, r } = T;
  const lean = (r() - 0.5) * 8, topX = cx + lean, topY = base - 112;
  const tg = g.createLinearGradient(cx - 8, 0, cx + 8, 0); tg.addColorStop(0, '#f7f4ec'); tg.addColorStop(0.55, '#dad5c7'); tg.addColorStop(1, '#8c877c');
  g.fillStyle = tg; g.beginPath(); g.moveTo(cx - 6.5, base + 2); g.quadraticCurveTo(cx - 4 + lean * 0.3, base - 58, topX - 3, topY); g.lineTo(topX + 3, topY); g.quadraticCurveTo(cx + 4 + lean * 0.3, base - 58, cx + 6.5, base + 2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,24,18,0.4)'; g.lineWidth = 1; g.stroke();
  for (let k = 0; k < 18; k++) { const t = k / 18, y = base - 4 - t * (base - topY - 8), x = lerp(cx, topX, t * t), w = lerp(6.2, 3, t); g.fillStyle = `rgba(26,22,18,${0.55 + r() * 0.35})`; g.fillRect(x - w + (r() < 0.5 ? 0 : w * 0.6), y, w * (0.5 + r() * 0.8), 1.5 + r() * 1.5); }
  g.strokeStyle = '#d3cdbd'; g.lineWidth = 2.4; g.lineCap = 'round';
  for (const [dx, dy, by] of [[-30, -24, 46], [28, -30, 58], [-16, -52, 24], [20, -54, 32]]) { g.beginPath(); g.moveTo(lerp(cx, topX, 0.7), topY + by); g.lineTo(topX + dx, topY + dy + by * 0.1); g.stroke(); }
  const cyc = topY - 6, blobs = [];
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()); blobs.push({ x: topX + Math.cos(a) * d * 46, y: cyc + 10 + Math.sin(a) * d * 52, r: 11 + r() * 8 }); }
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) {
    const gr = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.45, b.r * 0.1, b.x, b.y, b.r * 1.1);
    gr.addColorStop(0, '#dff08e'); gr.addColorStop(0.32, '#aad352'); gr.addColorStop(0.72, '#66a03a'); gr.addColorStop(1, '#3b7228');
    g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 900; i++) { const b = blobs[(r() * blobs.length) | 0], a = r() * TAU, d = Math.sqrt(r()) * b.r * 0.95, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d, lit = (topX - x) * 0.5 + (cyc - y) * 0.6 + (r() - 0.5) * 40 > 0;
    g.fillStyle = lit ? `rgba(236,248,150,${0.2 + r() * 0.3})` : `rgba(22,56,18,${0.2 + r() * 0.3})`; g.beginPath(); g.ellipse(x, y, 1.6 + r() * 2.2, 1.1 + r() * 1.4, r() * 3, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  treeShadeOverlay(g, topX - 60, cyc - 60, topX + 60, cyc + 60);
  return T.out();
};
/* drzewo zimowe: nagie, rozgałęzione, ze śniegiem na gałęziach */
TREES.winter = (seed, F = 0.8) => {
  const W = 200, H = 250, cx = 100, base = 214, T = treeBase(W, H, cx, base, seed, { F, dx: 24, rx: 44, ry: 12 }), { g, r } = T;
  const lean = (r() - 0.5) * 0.25;
  const tg = g.createLinearGradient(cx - 10, 0, cx + 10, 0); tg.addColorStop(0, '#7a6a58'); tg.addColorStop(0.5, '#5a4c3e'); tg.addColorStop(1, '#2c241c');
  g.fillStyle = tg; g.beginPath(); g.moveTo(cx - 12, base + 2); g.quadraticCurveTo(cx - 6, base - 20, cx - 5, base - 70); g.lineTo(cx + 5, base - 70); g.quadraticCurveTo(cx + 6, base - 20, cx + 13, base + 2); g.closePath(); g.fill();
  g.fillStyle = 'rgba(250,253,255,0.9)'; g.beginPath(); g.ellipse(cx, base + 1, 15, 4.5, 0, 0, TAU); g.fill();
  g.lineCap = 'round';
  const br = (x, y, a, len, w, depth) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.strokeStyle = depth < 2 ? '#4a3e32' : '#5e5042'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = 'rgba(250,253,255,0.92)'; g.lineWidth = Math.max(1, w * 0.5); g.beginPath(); g.moveTo(x - 0.8, y - w * 0.35); g.lineTo(x2 - 0.8, y2 - w * 0.35); g.stroke();
    if (depth < 4) { const n = depth < 2 ? 3 : 2; for (let k = 0; k < n; k++) br(x2, y2, a + (k - (n - 1) / 2) * (0.5 + r() * 0.3) + (r() - 0.5) * 0.3, len * (0.68 + r() * 0.1), Math.max(1.2, w * 0.62), depth + 1); }
  };
  br(cx, base - 68, -Math.PI / 2 + lean, 54, 9, 0);
  treeShadeOverlay(g, cx - 70, 30, cx + 70, base);
  return T.out();
};
/* krzew: zielony / suchy (pustynia) / ośnieżony */
TREES.shrub = (seed, pal = 'green', F = 0.8) => {
  const W = 120, H = 90, cx = 60, base = 72, T = treeBase(W, H, cx, base, seed, { F, dx: 14, rx: 32, ry: 8, a: 0.4 }), { g, r } = T;
  const P = { green: ['#b2d868', '#62a038', '#2f6a22'], dry: ['#d8cc86', '#a09c5a', '#5e6a38'], snow: ['#8aa878', '#4e6e4e', '#2c4a3a'] }[pal] || ['#b2d868', '#62a038', '#2f6a22'], blobs = [];
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = Math.sqrt(r()); blobs.push({ x: cx + Math.cos(a) * d * 34, y: base - 14 + Math.sin(a) * d * 11, r: 10 + r() * 9 }); }
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) {
    const gr = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.45, b.r * 0.1, b.x, b.y, b.r * 1.1);
    gr.addColorStop(0, P[0]); gr.addColorStop(0.55, P[1]); gr.addColorStop(1, P[2]);
    g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
    if (pal === 'snow') { g.fillStyle = 'rgba(248,252,255,0.95)'; g.beginPath(); g.ellipse(b.x - b.r * 0.1, b.y - b.r * 0.55, b.r * 0.85, b.r * 0.42, 0, 0, TAU); g.fill(); }
  }
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 160; i++) { const b = blobs[(r() * blobs.length) | 0], a = r() * TAU, d = Math.sqrt(r()) * b.r * 0.9; g.fillStyle = r() < 0.5 ? 'rgba(255,255,220,0.22)' : 'rgba(10,30,10,0.25)'; g.beginPath(); g.ellipse(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 1.4 + r() * 1.6, 1 + r() * 1, r() * 3, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  if (pal === 'dry') { g.strokeStyle = 'rgba(70,56,30,0.7)'; g.lineWidth = 1; for (let i = 0; i < 22; i++) { const b = blobs[(r() * blobs.length) | 0], a = -Math.PI / 2 + (r() - 0.5) * 2.4; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + Math.cos(a) * (b.r + 5), b.y + Math.sin(a) * (b.r + 5)); g.stroke(); } }
  else if (pal === 'green') { for (let i = 0; i < 8; i++) { const b = blobs[(r() * blobs.length) | 0]; g.fillStyle = ['#e0506a', '#f2d24a', '#c0408a'][(r() * 3) | 0]; g.beginPath(); g.arc(b.x + (r() - 0.5) * b.r, b.y + (r() - 0.5) * b.r * 0.7, 1.7, 0, TAU); g.fill(); } }
  return T.out();
};
/* kaktus: kolumna z żebrami, ramiona, ciernie, kwiat */
TREES.cactus = (seed, F = 0.8) => {
  const W = 110, H = 150, cx = 55, base = 132, T = treeBase(W, H, cx, base, seed, { F, dx: 16, rx: 22, ry: 6, a: 0.4 }), { g, r } = T;
  const col = (w, a, b2, c2) => { const gr = g.createLinearGradient(cx - w, 0, cx + w, 0); gr.addColorStop(0, a); gr.addColorStop(0.45, b2); gr.addColorStop(1, c2); return gr; };
  const arm = (side, y0, up) => {
    const pts = [[cx + side * 7, y0], [cx + side * 24, y0], [cx + side * 24, y0 - up]];
    for (const [w, c2] of [[15, 'rgba(14,38,14,0.95)'], [12.5, col(12, '#78b050', '#3f7e36', '#26562a')]]) { g.strokeStyle = c2; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
    g.strokeStyle = 'rgba(170,220,120,0.5)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x - 3, y) : g.moveTo(x - 3, y)); g.stroke();
  };
  arm(-1, base - 42 - r() * 8, 24 + r() * 10); if (r() < 0.8) arm(1, base - 54 - r() * 10, 18 + r() * 12);
  const top = base - 92 - r() * 10;
  g.fillStyle = 'rgba(14,38,14,0.95)'; g.beginPath(); g.moveTo(cx - 13, base + 1); g.lineTo(cx - 13, top + 12); g.quadraticCurveTo(cx, top - 10, cx + 13, top + 12); g.lineTo(cx + 13, base + 1); g.closePath(); g.fill();
  g.fillStyle = col(12, '#7db455', '#3f8038', '#235428'); g.beginPath(); g.moveTo(cx - 11.5, base); g.lineTo(cx - 11.5, top + 12); g.quadraticCurveTo(cx, top - 7, cx + 11.5, top + 12); g.lineTo(cx + 11.5, base); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(14,50,20,0.55)'; g.lineWidth = 1.2; for (const k of [-6, -2, 2, 6]) { g.beginPath(); g.moveTo(cx + k * 0.9, base - 2); g.quadraticCurveTo(cx + k * 1.15, (base + top) / 2, cx + k * 0.8, top + 8); g.stroke(); }
  g.fillStyle = 'rgba(250,240,200,0.8)'; for (let i = 0; i < 40; i++) g.fillRect(cx - 10 + r() * 20, top + 10 + r() * (base - top - 14), 1.2, 1.2);
  g.fillStyle = '#e8508a'; g.beginPath(); g.arc(cx + (r() - 0.5) * 8, top + 2, 3.4, 0, TAU); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(cx, top + 2, 1.4, 0, TAU); g.fill();
  return T.out();
};
/* trzcina / pałki wodne: kępa (jak kępa trawy — bez osobnej warstwy cienia) */
function bakeReeds(seed, F = 0.8) {
  const W = 72, H = 96, R = RES, c = newCanvas(Math.ceil(W * F * R), Math.ceil(H * F * R)), g = c.getContext('2d'), r = rng(seed), cx = 36, base = 86;
  g.setTransform(R * F, 0, 0, R * F, 0, 0); g.lineCap = 'round';
  const stems = []; for (let i = 0; i < 10; i++) stems.push({ x: cx + (r() - 0.5) * 20, a: -Math.PI / 2 + (r() - 0.5) * 0.7, len: 46 + r() * 30, head: r() < 0.5 });
  stems.sort((a, b) => a.a - b.a);
  for (const s of stems) {
    const ex = s.x + Math.cos(s.a) * s.len, ey = base + Math.sin(s.a) * s.len, mx = (s.x + ex) / 2 + (r() - 0.5) * 8, my = (base + ey) / 2;
    g.strokeStyle = '#4c5a2a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(s.x, base); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.strokeStyle = ['#8aa04a', '#a6b85e', '#6f8a3a'][(r() * 3) | 0]; g.lineWidth = 1.5; g.beginPath(); g.moveTo(s.x - 0.5, base); g.quadraticCurveTo(mx - 0.5, my, ex - 0.5, ey); g.stroke();
    if (s.head) { g.fillStyle = '#5b3a1e'; g.strokeStyle = '#2c1c0c'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(ex, ey + 1, 2.7, 8, s.a + Math.PI / 2, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#9a7a46'; g.lineWidth = 1; g.beginPath(); g.moveTo(ex, ey - 8); g.lineTo(ex, ey - 13); g.stroke(); }
  }
  for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, len = 26 + r() * 20, x = cx + (r() - 0.5) * 24; g.strokeStyle = '#6f8a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, base + Math.sin(a) * len * 0.8, x + Math.cos(a) * len, base + Math.sin(a) * len); g.stroke(); }
  return { c, ax: cx * F, ay: base * F, w: W * F, h: H * F, R };
}

/* ---------- klify: blok skalny 1 pole, wysoki; pal: rock (szara skała z mchem), sand (piaskowiec z pasami), snow (skała z czapą śniegu) ---------- */
function bakeCliff(seed, pal = 'rock', F = 0.8) {
  const W = 200, H = 200, cx = 100, base = 158, T = treeBase(W, H, cx, base, seed, { F, dx: 28, rx: 58, ry: 16, a: 0.5 }), { g, r } = T;
  const tone = { rock: hex('#8e8c84'), sand: hex('#c9a46a'), snow: hex('#8c8e92') }[pal] || hex('#8e8c84');
  const parts = [[-40, 12, 0.62, 0.78], [42, 10, 0.58, 0.72], [0, 0, 1, 1]];                // ([przesunięcie x, y], skala, wysokość) — duży blok na końcu (na wierzchu)
  for (const [ox, oy, k, hs] of parts) {
    const n = 10, rx = 54 * k, ry = 28 * k, hgt = (66 + r() * 26) * hs, px = cx + ox, py = base + oy - 6 * k, lo = [], hi = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + (r() - 0.5) * 0.3, kk = 0.84 + r() * 0.26, kt = pal === 'sand' ? 0.9 + r() * 0.08 : 0.62 + r() * 0.18;
      lo.push([px + Math.cos(a) * rx * kk, py + Math.sin(a) * ry * kk, a]);
      hi.push([px + Math.cos(a) * rx * kk * kt - 2 * k, py - hgt + Math.sin(a) * ry * kk * kt, a]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, am = (lo[i][2] + (lo[j][2] < lo[i][2] ? lo[j][2] + TAU : lo[j][2])) / 2, light = Math.cos(am - Math.PI * 1.25) * 0.5 + 0.5, f = 0.56 + 0.66 * light + (r() - 0.5) * 0.1;
      g.beginPath(); g.moveTo(lo[i][0], lo[i][1]); g.lineTo(lo[j][0], lo[j][1]); g.lineTo(hi[j][0], hi[j][1]); g.lineTo(hi[i][0], hi[i][1]); g.closePath();
      const gr = g.createLinearGradient(0, hi[i][1], 0, lo[i][1]); gr.addColorStop(0, css(scaleC(tone, f * 1.12))); gr.addColorStop(1, css(scaleC(tone, f * 0.78)));
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      if (pal === 'sand') for (let b2 = 0; b2 < 6; b2++) { const t = (b2 + r() * 0.6) / 6, y = lerp(hi[i][1], lo[i][1], t); g.fillStyle = b2 % 2 ? 'rgba(120,80,40,0.28)' : 'rgba(255,230,170,0.2)'; g.fillRect(Math.min(lo[i][0], lo[j][0]) - 4, y, Math.abs(lo[j][0] - lo[i][0]) + 8, 3 + r() * 5); }
      g.strokeStyle = 'rgba(10,8,6,0.3)'; g.lineWidth = 1; for (let q = 0; q < 3; q++) { const t = (q + 0.5) / 3, x0 = lerp(lo[i][0], lo[j][0], t), x1 = lerp(hi[i][0], hi[j][0], t); g.beginPath(); g.moveTo(x0 + (r() - 0.5) * 3, lo[i][1] + (lo[j][1] - lo[i][1]) * t); g.lineTo(x1 + (r() - 0.5) * 4, hi[i][1] + (hi[j][1] - hi[i][1]) * t); g.stroke(); }
      if (pal === 'snow') { g.fillStyle = 'rgba(246,250,255,0.94)'; g.beginPath(); g.moveTo(hi[i][0] - 2, hi[i][1] - 2); g.lineTo(hi[j][0] + 2, hi[j][1] - 2); for (let q = 4; q >= 0; q--) { const t = q / 4; g.lineTo(lerp(hi[j][0], hi[i][0], 1 - t), hi[i][1] + (hi[j][1] - hi[i][1]) * (1 - t) + (4 + (r() * 18) * (q % 2 ? 1 : 0.5))); } g.closePath(); g.fill(); }
      g.restore();
      g.strokeStyle = 'rgba(14,12,10,0.55)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(lo[i][0], lo[i][1]); g.lineTo(hi[i][0], hi[i][1]); g.stroke();
    }
    g.beginPath(); hi.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    const tg = g.createLinearGradient(px - rx * 0.5, py - hgt - ry * 0.5, px + rx * 0.5, py - hgt + ry * 0.5);
    if (pal === 'snow') { tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#d5e3f0'); } else { tg.addColorStop(0, css(scaleC(tone, 1.5))); tg.addColorStop(1, css(scaleC(tone, 1.1))); }
    g.fillStyle = tg; g.fill(); g.strokeStyle = 'rgba(14,12,10,0.6)'; g.lineWidth = 1.1; g.stroke();
    if (pal === 'rock') { g.save(); g.clip(); g.fillStyle = 'rgba(96,140,56,0.4)'; g.beginPath(); g.ellipse(px + 4 * k, py - hgt + 2 * k, rx * 0.5, ry * 0.4, 0, 0, TAU); g.fill(); g.restore(); }
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 100; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,240,0.1)' : 'rgba(0,0,0,0.13)'; g.fillRect(px - rx + r() * rx * 2, py - hgt - ry + r() * (hgt + ry * 2), 1 + r() * 2, 1 + r() * 2); }
    const mg = g.createLinearGradient(0, py - 8 * k, 0, py + ry); mg.addColorStop(0, 'rgba(0,0,0,0)'); mg.addColorStop(1, pal === 'snow' ? 'rgba(235,245,255,0.5)' : pal === 'sand' ? 'rgba(220,190,130,0.4)' : 'rgba(96,140,56,0.45)');
    g.fillStyle = mg; g.fillRect(px - rx * 1.2, py - 8 * k, rx * 2.4, ry * 1.7); g.restore();
  }
  return T.out();
}
