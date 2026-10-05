/* ====================== TEKSTURY PROCEDURALNE ======================
   Każda tekstura jest kafelkowalna (szwy okresowe) i ma gęstość ppu = pikseli tekstury na jednostkę świata,
   więc na każdej ścianie / połaci deska, bal czy dachówka mają ten sam rozmiar. */
const GEN = {};
const TEXCACHE = {};
let TEXRES = 1;                     // mnożnik rozdzielczości tekstur terenu (ustawiany przy starcie razem z RES)
function tex(name, pal) {
  const key = name + '|' + (pal || '');
  return TEXCACHE[key] || (TEXCACHE[key] = GEN[name](pal));
}
/* rysuje obiekt także w kopiach przesuniętych o okres, żeby kafelek był bezszwowy */
function wrapDraw(N, x, y, w, h, fn) {
  for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
    if (x + ox > N + 4 || x + ox + w < -4 || y + oy > N + 4 || y + oy + h < -4) continue;
    fn(ox, oy);
  }
}

/* --- bale (zrąb): poziome okrągłe kłody z usłojeniem i sękami --- */
GEN.log = (base = '#a0723f') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(11), rows = 8, rh = N / rows, b = hex(base);
  for (let i = 0; i < rows; i++) {
    const y = i * rh, k = 0.86 + r() * 0.28;
    const gr = g.createLinearGradient(0, y, 0, y + rh);
    gr.addColorStop(0, css(scaleC(b, 1.28 * k))); gr.addColorStop(0.3, css(scaleC(b, 1.05 * k))); gr.addColorStop(0.75, css(scaleC(b, 0.74 * k))); gr.addColorStop(1, css(scaleC(b, 0.46 * k)));
    g.fillStyle = gr; g.fillRect(0, y, N, rh);
    for (let j = 0; j < 8; j++) { // usłojenie: falujące, okresowe linie
      const yy = y + 2 + r() * (rh - 5), ph = r() * TAU, amp = 0.5 + r() * 1.1, f = 1 + ((r() * 3) | 0);
      g.strokeStyle = `rgba(36,20,8,${0.12 + r() * 0.22})`; g.lineWidth = 0.7 + r() * 0.9;
      g.beginPath();
      for (let x = 0; x <= N; x += 4) { const v = yy + Math.sin(x / N * TAU * f + ph) * amp; x ? g.lineTo(x, v) : g.moveTo(x, v); }
      g.stroke();
    }
    if (r() < 0.5) { // sęk
      const kx = r() * N, ky = y + rh * (0.35 + r() * 0.3), kr = 2.4 + r() * 2;
      wrapDraw(N, kx - 9, ky - 6, 18, 12, (ox, oy) => {
        g.fillStyle = 'rgba(30,16,6,0.55)'; g.beginPath(); g.ellipse(kx + ox, ky + oy, kr, kr * 0.7, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(30,16,6,0.28)'; g.lineWidth = 1; g.beginPath(); g.ellipse(kx + ox, ky + oy, kr * 2, kr * 1.3, 0, 0, TAU); g.stroke();
      });
    }
    g.fillStyle = 'rgba(14,7,2,0.6)'; g.fillRect(0, y + rh - 1.6, N, 1.6);   // szczelina między bali
    g.fillStyle = 'rgba(255,225,170,0.2)'; g.fillRect(0, y + 0.4, N, 1);     // błysk na grzbiecie
  }
  addGrain(g, N, N, 15, 2);
  return { c, ppu: 112 };
};

/* --- deski pionowe --- */
GEN.plank = (base = '#7b5a36') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(13), b = hex(base), cols = 8, cw = N / cols;
  for (let i = 0; i < cols; i++) {
    const x = i * cw, k = 0.85 + r() * 0.3;
    const gr = g.createLinearGradient(x, 0, x + cw, 0);
    gr.addColorStop(0, css(scaleC(b, 0.8 * k))); gr.addColorStop(0.5, css(scaleC(b, 1.08 * k))); gr.addColorStop(1, css(scaleC(b, 0.75 * k)));
    g.fillStyle = gr; g.fillRect(x, 0, cw, N);
    for (let j = 0; j < 6; j++) {
      const xx = x + 2 + r() * (cw - 4), ph = r() * TAU, amp = 0.6 + r() * 0.8;
      g.strokeStyle = `rgba(30,16,6,${0.12 + r() * 0.2})`; g.lineWidth = 0.7 + r() * 0.7; g.beginPath();
      for (let y = 0; y <= N; y += 4) { const v = xx + Math.sin(y / N * TAU * 2 + ph) * amp; y ? g.lineTo(v, y) : g.moveTo(v, y); }
      g.stroke();
    }
    g.fillStyle = 'rgba(12,6,2,0.65)'; g.fillRect(x + cw - 1.2, 0, 1.2, N);
  }
  g.fillStyle = 'rgba(20,14,10,0.7)';
  for (let i = 0; i < cols; i++) for (const y of [20, 64, 108]) { g.beginPath(); g.arc(i * cw + cw / 2, y, 1.1, 0, TAU); g.fill(); }
  addGrain(g, N, N, 13, 4);
  return { c, ppu: 120 };
};

/* --- strzecha: gęste źdźbła wzdłuż spadku, pasy wiązań --- */
GEN.thatch = (base = '#cba94d') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(21), b = hex(base);
  g.fillStyle = css(scaleC(b, 0.62)); g.fillRect(0, 0, N, N);
  const cols = [scaleC(b, 1.3), scaleC(b, 1.12), b, scaleC(b, 0.86), scaleC(b, 0.66), mixc(b, [255, 246, 205], 0.45)];
  for (let i = 0; i < 3600; i++) {
    const x = r() * N, y = r() * N, len = 9 + r() * 18, ang = Math.PI / 2 + (r() - 0.5) * 0.3;
    g.strokeStyle = css(cols[(r() * cols.length) | 0], 0.5 + r() * 0.45); g.lineWidth = 0.8 + r() * 1.1;
    wrapDraw(N, x - 20, y - 20, 40, 40 + len, (ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(ang) * len, y + oy + Math.sin(ang) * len); g.stroke(); });
  }
  for (let k = 0; k < 4; k++) { // wiązania
    const y = k * 32 + 22;
    g.fillStyle = 'rgba(38,24,8,0.3)'; g.fillRect(0, y, N, 3);
    g.fillStyle = 'rgba(255,240,170,0.16)'; g.fillRect(0, y + 3, N, 2);
  }
  addGrain(g, N, N, 16, 3);
  return { c, ppu: 96 };
};

/* --- dachówka ceramiczna (karpiówka) --- */
GEN.tiles = (base = '#b4532f') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(31), b = hex(base), rows = 8, rh = N / rows, tw = 16;
  g.fillStyle = css(scaleC(b, 0.4)); g.fillRect(0, 0, N, N);
  for (let row = 0; row < rows; row++) {
    const y = row * rh, off = (row % 2) * tw / 2;
    for (let col = -1; col <= N / tw; col++) {
      const x = col * tw + off, k = 0.8 + r() * 0.4;
      const gr = g.createLinearGradient(0, y, 0, y + rh);
      gr.addColorStop(0, css(scaleC(b, 0.7 * k))); gr.addColorStop(0.5, css(scaleC(b, 1.0 * k))); gr.addColorStop(1, css(scaleC(b, 1.22 * k)));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + tw, y); g.lineTo(x + tw, y + rh - 4);
      g.quadraticCurveTo(x + tw, y + rh, x + tw / 2, y + rh); g.quadraticCurveTo(x, y + rh, x, y + rh - 4); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(32,10,4,0.6)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,214,170,0.15)'; g.fillRect(x + 1.5, y + 2, 2, rh - 7);
      if (r() < 0.2) { g.fillStyle = `rgba(86,118,48,${0.1 + r() * 0.16})`; g.beginPath(); g.ellipse(x + r() * tw, y + rh * (0.45 + r() * 0.5), 3 + r() * 4, 2 + r() * 2, 0, 0, TAU); g.fill(); }
    }
  }
  addGrain(g, N, N, 14, 5);
  return { c, ppu: 96 };
};

/* --- gonty drewniane (ciemne dachy wikińskie) --- */
GEN.shingle = (base = '#4a3a2e') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(33), b = hex(base), rows = 10, rh = N / rows;
  g.fillStyle = css(scaleC(b, 0.35)); g.fillRect(0, 0, N, N);
  for (let row = 0; row < rows; row++) {
    const y = row * rh, tw = 12.8, off = (row % 2) * tw / 2;
    for (let col = -1; col <= N / tw; col++) {
      const x = col * tw + off, k = 0.75 + r() * 0.5;
      const gr = g.createLinearGradient(0, y, 0, y + rh);
      gr.addColorStop(0, css(scaleC(b, 0.7 * k))); gr.addColorStop(1, css(scaleC(b, 1.25 * k)));
      g.fillStyle = gr; g.fillRect(x, y, tw - 0.6, rh - 0.6);
      g.strokeStyle = `rgba(0,0,0,${0.25 + r() * 0.2})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 3 + r() * 6, y + 1); g.lineTo(x + 3 + r() * 6, y + rh - 1); g.stroke();
      g.fillStyle = 'rgba(20,10,4,0.55)'; g.fillRect(x, y + rh - 1.5, tw - 0.6, 1.5);
    }
  }
  addGrain(g, N, N, 14, 6);
  return { c, ppu: 110 };
};

/* --- kamień ciosowy / łamany --- */
function stoneTex(base, seed, rows, jitter, bevel, mortar) {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(seed), b = hex(base), rh = N / rows;
  g.fillStyle = css(scaleC(b, mortar)); g.fillRect(0, 0, N, N);
  for (let row = 0; row < rows; row++) {
    const y = row * rh, ws = []; let sum = 0;
    while (sum < N - 22) { const w = 24 + r() * 26; ws.push(w); sum += w; }
    ws.push(N - sum); // domknięcie okresu
    let x = 0;
    for (const w of ws) {
      const k = 1 - jitter + r() * jitter * 2, tint = mixc(b, r() < 0.5 ? [150, 128, 96] : [120, 130, 140], 0.12 + r() * 0.12);
      wrapDraw(N, x, y, w, rh, (ox, oy) => {
        const gr = g.createLinearGradient(0, y + oy, 0, y + oy + rh);
        gr.addColorStop(0, css(scaleC(tint, 1.18 * k))); gr.addColorStop(1, css(scaleC(tint, 0.86 * k)));
        g.fillStyle = gr; g.fillRect(x + ox + 1, y + oy + 1, w - 2, rh - 2);
        g.fillStyle = `rgba(255,255,255,${bevel})`; g.fillRect(x + ox + 1, y + oy + 1, w - 2, 1.6); g.fillRect(x + ox + 1, y + oy + 1, 1.4, rh - 2);
        g.fillStyle = `rgba(0,0,0,${bevel * 1.5})`; g.fillRect(x + ox + 1, y + oy + rh - 2.6, w - 2, 1.6); g.fillRect(x + ox + w - 2.4, y + oy + 1, 1.4, rh - 2);
        for (let q = 0; q < 5; q++) { g.fillStyle = `rgba(20,20,16,${0.08 + r() * 0.14})`; g.fillRect(x + ox + 3 + r() * (w - 8), y + oy + 3 + r() * (rh - 8), 1 + r() * 2, 1 + r() * 2); }
      });
      x += w;
    }
  }
  addGrain(g, N, N, 14, seed + 1);
  return { c, ppu: 120 };
}
GEN.stone = (base = '#9d9a90') => stoneTex(base, 41, 6, 0.1, 0.22, 0.38);
GEN.rubble = (base = '#8a877c') => stoneTex(base, 43, 5, 0.2, 0.26, 0.3);
GEN.sandstone = (base = '#d8c08c') => stoneTex(base, 45, 7, 0.06, 0.16, 0.62);

/* --- tynk / wapno z plamami i spękaniami --- */
GEN.plaster = (base = '#e9dfc4') => {
  const N = 128, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(51), b = hex(base);
  g.fillStyle = css(b); g.fillRect(0, 0, N, N);
  for (let i = 0; i < 140; i++) {
    const x = r() * N, y = r() * N, rad = 8 + r() * 26, light = r() < 0.5;
    wrapDraw(N, x - rad, y - rad, rad * 2, rad * 2, (ox, oy) => {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      gr.addColorStop(0, light ? 'rgba(255,250,235,0.1)' : 'rgba(90,70,40,0.09)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    });
  }
  g.strokeStyle = 'rgba(70,52,30,0.2)'; g.lineWidth = 0.8;
  for (let i = 0; i < 7; i++) { let x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 14; y += r() * 10; g.lineTo(x, y); } g.stroke(); }
  addGrain(g, N, N, 12, 7);
  return { c, ppu: 120 };
};

/* --- ubita ziemia (decal pod budynkami) --- */
GEN.dirt = (base = '#85693b') => {
  const T = TEXRES, B = 128, N = B * T, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, b = hex(base);
  const n1 = fbm(N, 4, 3, 61), n2 = periodicNoise(N, 32, 67);
  const stops = [[0, scaleC(b, 0.62)], [0.5, b], [1, scaleC(b, 1.32)]], lut = lutRamp(stops);
  for (let i = 0; i < N * N; i++) { const col = lut[clamp(((n1[i] * 0.75 + n2[i] * 0.45 - 0.1) * 255) | 0, 0, 255)]; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); g.scale(T, T);
  const r = rng(71);
  for (let i = 0; i < 260; i++) { // kamyki i grudki
    const x = r() * B, y = r() * B, s = 0.8 + r() * 1.8, l = r() < 0.5;
    g.fillStyle = l ? `rgba(220,205,170,${0.25 + r() * 0.3})` : `rgba(40,28,14,${0.25 + r() * 0.3})`;
    g.beginPath(); g.ellipse(x, y, s * 1.4, s, r() * 3, 0, TAU); g.fill();
  }
  return { c, ppu: 96 * T };
};

/* --- tkanina w pasy (markizy Saracenów) --- */
GEN.stripes = (pal = '#b8352b|#f1e6c8') => {
  const [a, bcol] = pal.split('|'), N = 64, c = newCanvas(N, N), g = c.getContext('2d'), A = hex(a), B = hex(bcol);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = css(i % 2 ? B : A); g.fillRect(i * 16, 0, 16, N);
    const gr = g.createLinearGradient(i * 16, 0, i * 16 + 16, 0); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.14)');
    g.fillStyle = gr; g.fillRect(i * 16, 0, 16, N);
  }
  addGrain(g, N, N, 10, 8);
  return { c, ppu: 120 };
};
