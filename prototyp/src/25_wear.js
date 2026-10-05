/* ====================== ZUŻYCIE: przybrudzenia, zacieki, pęknięcia, łaty napraw, mech, ziarno ======================
   Rysowane na każdej ścianie/połaci zaraz po nałożeniu tekstury (więc dostają to samo oświetlenie co reszta).
   Wszystkie rozmiary w tekselach: K tekseli = 1 jednostka świata (pole). Deterministyczne (ziarno z położenia ściany). */
const WEAR = {
  log:       { streak: 0.45, grime: 0.8, patch: ['log', '#cfa468', 'rect'], patchN: 0.8, moss: 0.35, crack: 0.15, nail: 1, tone: 1 },
  plank:     { streak: 0.6, grime: 0.7, patch: ['plank', '#bb915c', 'rect'], patchN: 1.0, moss: 0.3, crack: 0.2, nail: 1, tone: 1 },
  thatch:    { streak: 0.3, patch: ['thatch', '#e8c35a', 'blob'], patchN: 0.9, moss: 0.55, dark: 0.8, tone: 1 },
  tiles:     { streak: 0.3, patch: ['tiles', '#c8672f', 'rect'], patchN: 1.2, moss: 0.5, missing: 0.5, tone: 1 },
  shingle:   { streak: 0.3, patch: ['shingle', '#80664a', 'rect'], patchN: 0.9, moss: 0.4, missing: 0.4, tone: 1 },
  slate:     { streak: 0.35, patch: ['slate', '#7c8794', 'rect'], patchN: 0.9, moss: 0.45, missing: 0.35, tone: 1 },
  stone:     { streak: 0.5, grime: 0.9, patch: ['stone', '#bdb9ac', 'rect'], patchN: 0.8, moss: 0.5, crack: 1.0, chip: 0.8, tone: 1 },
  rubble:    { streak: 0.4, grime: 0.9, patch: ['rubble', '#a49f93', 'rect'], patchN: 0.5, moss: 0.7, crack: 0.8, chip: 0.6, tone: 1 },
  sandstone: { streak: 0.45, grime: 0.7, patch: ['sandstone', '#ecd8a6', 'rect'], patchN: 0.8, crack: 0.9, chip: 0.8, salt: 0.6, tone: 1 },
  plaster:   { streak: 0.8, grime: 0.8, patch: ['plaster', '#d8ccae', 'blob'], patchN: 0.6, moss: 0.15, crack: 0.6, peel: 0.7, tone: 1 },
  whitewash: { streak: 0.7, grime: 0.7, patch: ['whitewash', '#e4dcc4', 'blob'], patchN: 0.5, crack: 0.5, peel: 0.6, tone: 1 }
};

function wearBlob(g, r, cx, cy, rad, n = 9, jit = 0.38) {
  g.beginPath();
  for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 - jit + r() * jit * 2, x = cx + Math.cos(a) * rad * k, y = cy + Math.sin(a) * rad * k * 0.85; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath();
}
function wearCrack(g, r, W, H, K, px, long = 1) {
  let x = r() * W, y = r() * H * 0.75, ang = Math.PI / 2 + (r() - 0.5) * 0.9;
  const pts = [[x, y]], steps = Math.round((4 + r() * 6) * long), br = [];
  for (let s = 0; s < steps; s++) {
    ang += (r() - 0.5) * 0.6; const l = (0.012 + r() * 0.022) * K; x += Math.cos(ang) * l; y += Math.sin(ang) * l; pts.push([x, y]);
    if (r() < 0.1) br.push([x, y, ang + (r() < 0.5 ? 0.8 : -0.8), 2 + (r() * 3 | 0)]);
  }
  const draw = (p, off) => { g.beginPath(); p.forEach(([a, b], i) => i ? g.lineTo(a + off, b + off) : g.moveTo(a + off, b + off)); g.stroke(); };
  const all = [pts];
  for (const [bx0, by0, ba, bn] of br) { const q = [[bx0, by0]]; let a2 = ba, xx = bx0, yy = by0; for (let s = 0; s < bn; s++) { a2 += (r() - 0.5) * 0.8; const l = (0.01 + r() * 0.02) * K; xx += Math.cos(a2) * l; yy += Math.sin(a2) * l; q.push([xx, yy]); } all.push(q); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(238,228,204,0.16)'; g.lineWidth = 0.9 / px; for (const p of all) draw(p, 0.8 / px);
  g.strokeStyle = 'rgba(16,10,6,0.62)'; g.lineWidth = 1.1 / px; for (const p of all) draw(p, 0);
}

/* zaplata ze świeżej słomy: wąski prostokąt z postrzępioną dolną krawędzią, kładziony na starą strzechę (cień + jasna krawędź zamiast obrysu) */
function thatchPatch(g, r, x, y, w, h, pat, px) {
  const n = 8, T = [], B = [];
  for (let i = 0; i <= n; i++) { const t = i / n; T.push([x + w * t, y + (r() - 0.5) * h * 0.08]); B.push([x + w * t + (r() - 0.5) * w * 0.05, y + h * (0.93 + r() * 0.15)]); }
  const path = () => { g.beginPath(); T.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); for (let i = n; i >= 0; i--) g.lineTo(B[i][0], B[i][1]); g.closePath(); };
  g.save(); g.translate(0, 2.4 / px); path(); g.fillStyle = 'rgba(14,9,4,0.4)'; g.fill(); g.restore();
  path(); g.fillStyle = pat; g.fill();
  g.lineJoin = 'round'; g.lineWidth = 1.5 / px; g.strokeStyle = 'rgba(244,226,150,0.5)'; g.beginPath(); T.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
  g.strokeStyle = 'rgba(30,18,6,0.5)'; g.beginPath(); B.forEach(([a, b], i) => i ? g.lineTo(a, b + 0.6 / px) : g.moveTo(a, b + 0.6 / px)); g.stroke();
  const cy0 = y + h * 0.46, cy1 = y + h * 0.5;   // sznur wiążący zaplatę: ciemny splot, jasna krawędź i dwa supełki
  g.strokeStyle = 'rgba(52,32,12,0.75)'; g.lineWidth = 1.5 / px; g.beginPath(); g.moveTo(x - 1 / px, cy0); g.lineTo(x + w + 1 / px, cy1); g.stroke();
  g.strokeStyle = 'rgba(214,176,98,0.45)'; g.lineWidth = 0.6 / px; g.beginPath(); g.moveTo(x - 1 / px, cy0 - 1 / px); g.lineTo(x + w + 1 / px, cy1 - 1 / px); g.stroke();
  g.fillStyle = 'rgba(46,28,10,0.85)'; for (const [kx, ky] of [[x + w * 0.12, cy0 + (cy1 - cy0) * 0.12], [x + w * 0.88, cy0 + (cy1 - cy0) * 0.88]]) { g.beginPath(); g.arc(kx, ky, 1.5 / px, 0, TAU); g.fill(); }
}

function wearFace(sc, mat, o, W, H, K, px, seed) {
  const P = WEAR[mat]; if (!P) return;
  const k = (o.wear ?? 1) * sc.wear; if (k <= 0) return;
  const g = sc.g, r = rng(seed), A = (W * H) / (K * K), roof = !!o.roof;
  const ink = a => `rgba(24,16,9,${a})`, bone = a => `rgba(240,232,210,${a})`, moss = a => `rgba(70,118,40,${a})`;
  const cnt = x => { const n = Math.floor(x); return n + (r() < x - n ? 1 : 0); };
  g.save(); g.clip();

  // 1) plamy tonalne: wilgoć i wyblaknięcie — ożywiają jednolite powierzchnie
  for (let i = cnt(A * 2.6 * k); i > 0; i--) {
    const x = r() * W, y = r() * H, rr = (0.1 + r() * 0.22) * K, dark = r() < 0.6, gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, dark ? ink(0.10 * P.tone) : bone(0.07 * P.tone)); gr.addColorStop(1, dark ? ink(0) : bone(0));
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  // 2) strzecha: ciemne, zestarzałe pasma
  if (P.dark) for (let i = cnt(A * 3 * k); i > 0; i--) {
    const x = r() * W, y = r() * H, rx = (0.06 + r() * 0.14) * K, ry = rx * (1.6 + r()), gr = g.createRadialGradient(x, y, 0, x, y, ry);
    gr.addColorStop(0, ink(0.16 * P.dark)); gr.addColorStop(1, ink(0));
    g.save(); g.translate(x, y); g.scale(rx / ry, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - ry, y - ry, ry * 2, ry * 2); g.restore();
  }
  // 3) zacieki: długie pionowe smugi od górnej krawędzi
  if (P.streak) for (let i = cnt(P.streak * k * (W / K) * 2.4); i > 0; i--) {
    const x = r() * W, y0 = r() * H * 0.35, len = H * (0.2 + r() * 0.55), w = (0.012 + r() * 0.04) * K, light = P.salt && r() < 0.4;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len), a = 0.08 + r() * 0.11, col = light ? bone : ink;
    gr.addColorStop(0, col(0)); gr.addColorStop(0.12, col(a)); gr.addColorStop(0.65, col(a * 0.55)); gr.addColorStop(1, col(0));
    g.fillStyle = gr; g.fillRect(x - w / 2, y0, w, len);
  }
  // 4) łaty napraw — inny odcień materiału w tym samym układzie tekstury (deski/gonty/kamienie pasują do siatki)
  if (P.patch) for (let i = cnt(P.patchN * k * A * 0.5); i > 0; i--) {
    const [m2, pal2, shape] = P.patch, pat = sc.pat(m2, pal2).pat, gu = 16;
    g.save();
    if (shape === 'rect') {
      const w = gu * (1 + (r() * 3 | 0)) * (mat === 'log' ? 2 : 1), h = gu * (mat === 'plank' ? 2 + (r() * 3 | 0) : 1 + (r() * 2 | 0)), x = Math.floor(r() * Math.max(1, (W - w) / gu)) * gu, y = Math.floor(r() * Math.max(1, (H - h) / gu)) * gu;
      g.fillStyle = pat; g.fillRect(x, y, w, h);
      g.strokeStyle = ink(0.45); g.lineWidth = 1.1 / px; g.strokeRect(x, y, w, h);
      g.strokeStyle = bone(0.12); g.lineWidth = 0.9 / px; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y); g.lineTo(x + w, y); g.stroke();
      if (P.nail) { g.fillStyle = ink(0.8); for (const [nx, ny] of [[x + 2.5 / px, y + 2.5 / px], [x + w - 2.5 / px, y + 2.5 / px], [x + 2.5 / px, y + h - 2.5 / px], [x + w - 2.5 / px, y + h - 2.5 / px]]) { g.beginPath(); g.arc(nx, ny, 0.9 / px, 0, TAU); g.fill(); } }
    } else if (mat === 'thatch') {
      thatchPatch(g, r, r() * W * 0.9, r() * H * 0.85, (0.13 + r() * 0.2) * K, (0.17 + r() * 0.22) * K, pat, px);
    } else {
      const x = r() * W, y = r() * H, rad = (0.1 + r() * 0.12) * K; wearBlob(g, r, x, y, rad, 16, 0.16);
      g.globalAlpha = 0.9; g.fillStyle = pat; g.fill(); g.globalAlpha = 1; g.strokeStyle = ink(0.32); g.lineWidth = 1.2 / px; g.stroke();
    }
    g.restore();
  }
  // 5) odpadający tynk: odsłonięta cegła / kamień pod spodem
  if (P.peel) for (let i = cnt(P.peel * k * A * 0.8); i > 0; i--) {
    const x = r() * W, y = r() * H * 0.9, rad = (0.04 + r() * 0.09) * K;
    g.save(); wearBlob(g, r, x, y, rad, 10, 0.42); g.clip();
    g.fillStyle = sc.pat('stone', '#9a8c7a').pat; g.fillRect(x - rad * 2, y - rad * 2, rad * 4, rad * 4);
    g.fillStyle = ink(0.28); g.fillRect(x - rad * 2, y - rad * 2, rad * 4, rad * 4); g.restore();
    wearBlob(g, r, x, y, rad, 10, 0.42); g.strokeStyle = ink(0.6); g.lineWidth = 1.3 / px; g.stroke();
    g.strokeStyle = bone(0.35); g.lineWidth = 0.9 / px; g.translate(0.8 / px, 0.8 / px); g.stroke(); g.translate(-0.8 / px, -0.8 / px);
  }
  // 6) pęknięcia i wyszczerbienia
  if (P.crack) for (let i = cnt(P.crack * k * A * 1.1); i > 0; i--) wearCrack(g, r, W, H, K, px, 1);
  if (P.chip) for (let i = cnt(P.chip * k * A * 2.2); i > 0; i--) {
    const x = r() * W, y = r() * H, s = (0.012 + r() * 0.03) * K;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * 0.2); g.lineTo(x + s * 0.8, y + s * 0.9); g.lineTo(x + s * 0.1, y + s); g.closePath();
    g.fillStyle = bone(0.5 + r() * 0.25); g.fill(); g.strokeStyle = ink(0.55); g.lineWidth = 0.9 / px; g.stroke();
  }
  // 7) brakujące dachówki / gonty
  if (P.missing) for (let i = cnt(P.missing * k * A * 1.4); i > 0; i--) {
    const gu = 16, x = Math.floor(r() * (W / gu - 1)) * gu + (r() < 0.5 ? 8 : 0), y = Math.floor(r() * (H / gu - 1)) * gu, fresh = r() < 0.55;
    g.fillStyle = fresh ? 'rgba(255,196,140,0.30)' : 'rgba(36,44,30,0.34)'; g.fillRect(x, y + 2, gu - 2, gu - 3);          // wymieniona (jaśniejsza) albo zmurszała (ciemna) dachówka
    g.strokeStyle = ink(0.35); g.lineWidth = 0.9 / px; g.strokeRect(x, y + 2, gu - 2, gu - 3);
  }
  // 8) przybrudzenie u podstawy i bryzgi
  if (P.grime && !roof) {
    for (let i = cnt(P.grime * k * (W / K) * 7); i > 0; i--) {
      const x = r() * W, rx = (0.04 + r() * 0.1) * K, ry = (0.025 + r() * 0.06) * K, gr = g.createRadialGradient(x, H, 0, x, H, rx);
      gr.addColorStop(0, ink(0.13 + r() * 0.1)); gr.addColorStop(1, ink(0));
      g.save(); g.translate(x, H); g.scale(1, ry / rx); g.translate(-x, -H); g.fillStyle = gr; g.fillRect(x - rx, H - rx, rx * 2, rx * 2); g.restore();
    }
    g.fillStyle = ink(0.3); for (let i = cnt(P.grime * k * (W / K) * 26); i > 0; i--) { const x = r() * W, y = H - Math.pow(r(), 2.2) * H * 0.22; g.fillRect(x, y, 1.3 / px, 1.3 / px); }
  }
  // 9) mech: u podstawy ścian i na połaciach
  if (P.moss) for (let i = cnt(P.moss * k * A * 5); i > 0; i--) {
    const x = r() * W, y = roof ? r() * H : H * (0.7 + r() * 0.3), rr = (0.014 + r() * 0.04) * K, gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, moss(0.55)); gr.addColorStop(0.7, moss(0.28)); gr.addColorStop(1, moss(0));
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  g.restore();
}

/* ziarno całego sprite'a: drobne jasne i ciemne kropki wewnątrz sylwetki (kafel 256×256 px w pamięci podręcznej) */
const GRAIN = {};
function grainTiles(R) {
  if (!GRAIN[R]) {
    const mk = (light) => { const N = 256, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(light ? 91 : 53); for (let i = 0; i < 2400; i++) { const s = (0.7 + r() * 1.5) * R; g.fillStyle = light ? `rgba(255,244,214,${0.03 + r() * 0.06})` : `rgba(20,12,6,${0.05 + r() * 0.12})`; g.fillRect(r() * N, r() * N, s, s * (0.6 + r() * 0.8)); } return c; };
    GRAIN[R] = [mk(false), mk(true)];
  }
  return GRAIN[R];
}
function addSpriteGrain(g, w, h, R, amount = 1) {
  const [dk, lt] = grainTiles(R);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = Math.min(1, amount);
  g.fillStyle = g.createPattern(dk, 'repeat'); g.fillRect(0, 0, w, h);
  g.fillStyle = g.createPattern(lt, 'repeat'); g.fillRect(0, 0, w, h);
  g.restore();
}
