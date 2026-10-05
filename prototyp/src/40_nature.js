/* ====================== PRZYRODA: teren, drzewa, skały, figurki ====================== */

/* trawa kafelkowalna rysowana w płaszczyźnie świata (jeden wzór dla całej mapy — brak szwów między kaflami) */
GEN.grass = (pal = 'green') => {
  const N = 256, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const sets = {
    green: { stops: [[0, '#2c5520'], [0.35, '#44782a'], [0.65, '#5c9533'], [1, '#8ab648']], blades: ['#22481a', '#336322', '#4a8a2c', '#6aa83c', '#9bc653', '#c3d86a'], dirt: '#7a6232' },
    sand: { stops: [[0, '#b99c62'], [0.4, '#cdb27a'], [0.7, '#dcc48e'], [1, '#e8d6a4']], blades: ['#9c8248', '#b89c60', '#cfb77c', '#e4d3a0', '#a3a06a'], dirt: '#a8884e' },
    tundra: { stops: [[0, '#3a5a34'], [0.4, '#52743e'], [0.7, '#6a8a48'], [1, '#8da358']], blades: ['#2c4a2a', '#406038', '#587a42', '#7a9850', '#a3b46a'], dirt: '#6a5a3a' }
  }[pal];
  const st = sets.stops.map(([p, h]) => [p, hex(h)]);
  const n1 = fbm(N, 3, 4, 7), n2 = fbm(N, 10, 3, 19), n3 = periodicNoise(N, 40, 31);
  const dirt = hex(sets.dirt);
  for (let i = 0; i < N * N; i++) {
    const t = n1[i] * 0.55 + n2[i] * 0.3 + n3[i] * 0.15;
    let col = ramp(st, (t - 0.25) * 1.7);
    const dm = clamp((n1[i] - 0.64) * 6, 0, 0.5) * clamp((n2[i] - 0.3) * 3, 0, 1);     // plamy gołej ziemi
    if (dm > 0) col = mixc(col, dirt, dm);
    d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const r = rng(5);
  for (let i = 0; i < 5200; i++) { // źdźbła
    const x = r() * N, y = r() * N, a = r() * TAU, l = 2 + r() * 5;
    g.strokeStyle = sets.blades[(r() * sets.blades.length) | 0]; g.globalAlpha = 0.22 + r() * 0.4; g.lineWidth = 0.8 + r() * 0.8;
    wrapDraw(N, x - 8, y - 8, 16, 16, (ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); });
  }
  g.globalAlpha = 1;
  if (pal !== 'sand') for (let i = 0; i < 36; i++) { // kwiatki
    const x = r() * N, y = r() * N, col = ['#f4efe0', '#f0d84a', '#e87a9a', '#c9a0e8'][(r() * 4) | 0];
    g.fillStyle = col; g.globalAlpha = 0.75; g.beginPath(); g.arc(x, y, 1.1 + r() * 0.9, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  return { c, ppu: 64 };
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
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(81 + kind.length);
  const P = { wheat: ['#7a5c22', '#cfa938', '#f2d56c'], green: ['#3c2e16', '#4f8a2c', '#98cf50'], plow: ['#2e2012', '#6a4a2a', '#94703c'] }[kind].map(hex);
  const rows = 16, rh = N / rows;
  g.fillStyle = css(P[0]); g.fillRect(0, 0, N, N);
  for (let i = 0; i < rows; i++) {
    const y = i * rh, k = 0.85 + r() * 0.3, gr = g.createLinearGradient(0, y, 0, y + rh);
    gr.addColorStop(0, css(scaleC(P[1], 0.9 * k))); gr.addColorStop(0.45, css(scaleC(P[2], 0.95 * k))); gr.addColorStop(1, css(scaleC(P[1], 0.55 * k)));
    g.fillStyle = gr; g.fillRect(0, y + 1, N, rh - 2);
    if (kind === 'plow') { g.fillStyle = 'rgba(255,230,180,0.18)'; g.fillRect(0, y + 2, N, 1.2); }
    else for (let x = 0; x < N; x += 2 + r() * 2) { // kłosy / sadzonki
      const hh = kind === 'wheat' ? 2.2 + r() * 2.2 : 1.6 + r() * 1.8;
      g.strokeStyle = kind === 'wheat' ? `rgba(${r() < 0.5 ? '255,236,140' : '176,132,38'},${0.5 + r() * 0.4})` : `rgba(${r() < 0.5 ? '190,240,110' : '40,100,28'},${0.5 + r() * 0.4})`;
      g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + rh * 0.62); g.lineTo(x + (r() - 0.5) * 1.6, y + rh * 0.62 - hh); g.stroke();
    }
  }
  addGrain(g, N, N, 14, 83);
  return { c, ppu: 64 };
};
GEN.water = () => {
  const N = 256, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, n1 = fbm(N, 4, 4, 41), n2 = periodicNoise(N, 20, 43);
  const st = [[0, hex('#1d6a8c')], [0.5, hex('#2f8ba6')], [1, hex('#5cc0c8')]];
  for (let i = 0; i < N * N; i++) { const col = ramp(st, n1[i] * 0.8 + n2[i] * 0.3 - 0.1); d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  const r = rng(47);
  for (let i = 0; i < 260; i++) { // fale
    const x = r() * N, y = r() * N, rx = 6 + r() * 16;
    g.strokeStyle = `rgba(235,250,255,${0.1 + r() * 0.2})`; g.lineWidth = 1 + r();
    wrapDraw(N, x - rx, y - 4, rx * 2, 8, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rx, 1.5 + r() * 2, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
  }
  return { c, ppu: 64 };
};

/* ---------- drzewa ---------- */
const TREES = {};
function treeBase(w, h, cx, base, seed, sh = {}) {
  const c = newCanvas(w, h), g = c.getContext('2d'), u = newCanvas(w, h);
  softFill(u.getContext('2d'), gg => gg.ellipse(cx + (sh.dx ?? 30), base + 3, sh.rx ?? 52, sh.ry ?? 14, 0, 0, TAU), `rgba(14,22,8,${sh.a ?? 0.5})`, 9);
  return { c, g, u, r: rng(seed) };
}
function treeShadeOverlay(g, x0, y0, x1, y1) { // światło z lewej góry, cień z prawej dołu — na całej koronie
  g.save(); g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,240,170,0.16)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,0,0.42)');
  g.fillStyle = gr; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
}
TREES.oak = (seed) => {
  const W = 210, H = 240, cx = 105, base = 204, { c, g, u, r } = treeBase(W, H, cx, base, seed);
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
  return { c, u, ax: cx, ay: base };
};
TREES.pine = (seed) => {
  const W = 170, H = 280, cx = 85, base = 244, { c, g, u, r } = treeBase(W, H, cx, base, seed);
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
    g.restore();
  }
  treeShadeOverlay(g, cx - 50, 40, cx + 50, base);
  return { c, u, ax: cx, ay: base };
};
TREES.palm = (seed) => {
  const W = 250, H = 240, cx = 125, base = 206, { c, g, u, r } = treeBase(W, H, cx, base, seed, { dx: 28, rx: 46, ry: 12 });
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
  return { c, u, ax: cx, ay: base };
};

/* ---------- skały, krzaki, kępy trawy ---------- */
function bakeRock(seed, col = '#8e8c84') {
  const W = 170, H = 110, cx = 70, base = 86, { c, g, u, r } = treeBase(W, H, cx, base, seed, { dx: 22, rx: 40, ry: 11 }), b = hex(col);
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
    for (let i = 0; i < n; i++) {                                   // ściany boczne — tylko te zwrócone ku widzowi (dolna połowa pierścienia) + boki
      const j = (i + 1) % n, am = (lo[i][2] + (lo[j][2] < lo[i][2] ? lo[j][2] + TAU : lo[j][2])) / 2;
      const light = Math.cos(am - Math.PI * 1.25) * 0.5 + 0.5, f = 0.58 + 0.62 * light + (r() - 0.5) * 0.12;
      g.beginPath(); g.moveTo(lo[i][0], lo[i][1]); g.lineTo(lo[j][0], lo[j][1]); g.lineTo(hi[j][0], hi[j][1]); g.lineTo(hi[i][0], hi[i][1]); g.closePath();
      const gr = g.createLinearGradient(0, hi[i][1], 0, lo[i][1]); gr.addColorStop(0, css(scaleC(tint[i % 2], f * 1.12))); gr.addColorStop(1, css(scaleC(tint[i % 2], f * 0.8)));
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(14,12,10,0.55)'; g.lineWidth = 1.1; g.stroke();
    }
    g.beginPath(); hi.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();   // wierzch
    const tg = g.createLinearGradient(px - rx * 0.5, py - hgt - ry * 0.5, px + rx * 0.5, py - hgt + ry * 0.5); tg.addColorStop(0, css(scaleC(b, 1.45))); tg.addColorStop(1, css(scaleC(b, 1.05)));
    g.fillStyle = tg; g.fill(); g.strokeStyle = 'rgba(14,12,10,0.6)'; g.lineWidth = 1.1; g.stroke();
    g.save(); g.clip(); g.fillStyle = 'rgba(96,140,56,0.35)'; g.beginPath(); g.ellipse(px + 4 * k, py - hgt + 2 * k, rx * 0.38, ry * 0.3, 0, 0, TAU); g.fill(); g.restore();
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,240,0.1)' : 'rgba(0,0,0,0.13)'; g.fillRect(px - rx + r() * rx * 2, py - hgt - ry + r() * (hgt + ry * 2), 1 + r() * 2, 1 + r() * 2); }
    const mg = g.createLinearGradient(0, py - 6 * k, 0, py + ry); mg.addColorStop(0, 'rgba(96,140,56,0)'); mg.addColorStop(1, 'rgba(96,140,56,0.5)');
    g.fillStyle = mg; g.fillRect(px - rx * 1.2, py - 6 * k, rx * 2.4, ry * 1.6);
    g.restore();
  }
  return { c, u, ax: cx, ay: base };
}
function bakeTuft(seed, pal) {
  const W = 40, H = 36, c = newCanvas(W, H), g = c.getContext('2d'), r = rng(seed), cx = 20, base = 30;
  const cols = pal === 'sand' ? ['#9c8248', '#b89c60', '#d4bd84'] : ['#2f6a22', '#4f9030', '#7bb544', '#a6cf5a'];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.7, len = 12 + r() * 14, x = cx + (r() - 0.5) * 10;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = 1.6 + r(); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, base + Math.sin(a) * len * 0.7, x + Math.cos(a) * len * 0.9 + (r() - 0.5) * 6, base + Math.sin(a) * len); g.stroke();
  }
  return { c, ax: cx, ay: base };
}

/* ---------- figurki (mieszkańcy) ---------- */
function bakeFigure(colors, seed, o = {}) {
  const W = 44, H = 64, cx = 22, base = 54, { c, g, u, r } = treeBase(W, H, cx, base, seed);
  const uc = u.getContext('2d'); uc.clearRect(0, 0, W, H);
  softFill(uc, gg => gg.ellipse(cx + 6, base, 12, 4.2, 0, 0, TAU), 'rgba(14,22,8,0.5)', 4);
  const step = o.step || 0;
  g.lineCap = 'round';
  g.strokeStyle = '#2f2418'; g.lineWidth = 3.2;       // nogi
  g.beginPath(); g.moveTo(cx - 3, base - 14); g.lineTo(cx - 3 + step, base); g.moveTo(cx + 3, base - 14); g.lineTo(cx + 3 - step, base); g.stroke();
  const gr = g.createLinearGradient(cx - 8, 0, cx + 8, 0); gr.addColorStop(0, css(scaleC(colors.body, 1.25))); gr.addColorStop(0.6, css(colors.body)); gr.addColorStop(1, css(scaleC(colors.body, 0.6)));
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 8, base - 12); g.lineTo(cx - 6, base - 34); g.quadraticCurveTo(cx, base - 38, cx + 6, base - 34); g.lineTo(cx + 8, base - 12); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(10,6,2,0.6)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = css(colors.trim); g.fillRect(cx - 7.4, base - 22, 14.8, 2.4);
  g.strokeStyle = css(scaleC(colors.body, 0.8)); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 7, base - 32); g.lineTo(cx - 10 - step * 0.4, base - 20); g.moveTo(cx + 7, base - 32); g.lineTo(cx + 10 + step * 0.4, base - 21); g.stroke();
  g.fillStyle = '#e4bf94'; g.beginPath(); g.arc(cx, base - 41, 6.2, 0, TAU); g.fill(); g.strokeStyle = 'rgba(10,6,2,0.6)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = css(colors.hair); g.beginPath(); g.arc(cx, base - 43, 5.8, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  if (o.hood) { g.fillStyle = css(colors.body); g.beginPath(); g.moveTo(cx - 6, base - 41); g.quadraticCurveTo(cx, base - 56, cx + 6, base - 41); g.fill(); }
  if (o.spear) { g.strokeStyle = '#6a4a2c'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 12, base + 1); g.lineTo(cx + 12, base - 58); g.stroke(); g.fillStyle = '#cfd4d8'; g.beginPath(); g.moveTo(cx + 12, base - 66); g.lineTo(cx + 15, base - 57); g.lineTo(cx + 9, base - 57); g.closePath(); g.fill(); g.strokeStyle = 'rgba(10,10,10,0.6)'; g.lineWidth = 0.8; g.stroke(); }
  if (o.basket) { g.fillStyle = '#9a6e34'; g.beginPath(); g.ellipse(cx - 13, base - 20, 6, 5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,24,8,0.8)'; g.lineWidth = 1; g.stroke(); }
  if (o.turban) { g.fillStyle = '#f0ead8'; g.beginPath(); g.ellipse(cx, base - 46, 7, 4.6, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(90,80,60,0.6)'; g.stroke(); }
  return { c, u, ax: cx, ay: base };
}
