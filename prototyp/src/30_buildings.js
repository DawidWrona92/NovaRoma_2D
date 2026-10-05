/* ====================== ZESTAW ELEMENTÓW ARCHITEKTONICZNYCH ====================== */
const BAKED = {};

/* scena dla budynku o obrysie fw×fh pól i wysokości hgt (w polach); początek układu = środek obrysu na ziemi */
function sceneFor(fw, fh, hgt, o = {}) {
  const half = (fw + fh) / 2, W = (fw + fh) * AX + 150 + hgt * 60, top = hgt * VH + half * AY + 70, bot = half * AY + 80 + hgt * 16;
  return new Scene(W, top + bot, half * AX + 75, top, Object.assign({ fw, fh }, o));
}
/* układ (O,U,V) ściany południowej (+y) i wschodniej (+x) prostopadłościanu — do drzwi, okien, zdobień */
const wallS = (x0, x1, y1, zt, zb) => ({ O: [x0, y1, zt], U: [x1 - x0, 0, 0], V: [0, 0, -(zt - zb)] });
const wallE = (y0, y1, x1, zt, zb) => ({ O: [x1, y1, zt], U: [0, -(y1 - y0), 0], V: [0, 0, -(zt - zb)] });

/* drzwi z (opcjonalnym) łukiem i okuciami; (u0,w) — położenie na ścianie, h — wysokość, vb — v podstawy drzwi */
function door(sc, O, U, V, u0, w, h, o = {}) {
  const lu = Math.hypot(...U), lv = Math.hypot(...V), vb = o.vb ?? lv;
  if (LINT) sc.regRect(O, U, V, 'drzwi', u0 - 0.04, u0 + w + 0.04, vb - h - (o.arch ? w / 2 : 0) - 0.06, vb);
  sc.local(O, U, V, (g) => {
    g.fillStyle = o.frame || '#2b1c10';
    g.beginPath(); g.moveTo(u0 - 0.025, vb); g.lineTo(u0 - 0.025, vb - h); if (o.arch) g.arc(u0 + w / 2, vb - h, w / 2 + 0.025, Math.PI, 0); else g.lineTo(u0 + w + 0.025, vb - h); g.lineTo(u0 + w + 0.025, vb); g.closePath(); g.fill();
    if (o.lintel) { g.fillStyle = o.lintel; g.fillRect(u0 - 0.06, vb - h - (o.arch ? w / 2 : 0) - 0.06, w + 0.12, 0.05); }
  });
  const dir = [U[0] / lu, U[1] / lu, U[2] / lu], up = [-V[0] / lv, -V[1] / lv, -V[2] / lv];
  const base = [O[0] + dir[0] * u0 + V[0] / lv * vb, O[1] + dir[1] * u0 + V[1] / lv * vb, O[2] + dir[2] * u0 + V[2] / lv * vb];
  const topLeft = [base[0] + up[0] * h, base[1] + up[1] * h, base[2] + up[2] * h];
  sc.face(topLeft, [dir[0] * w, dir[1] * w, dir[2] * w], [-up[0] * h, -up[1] * h, -up[2] * h], 'plank', { shade: 1, pal: o.pal || '#6a4a2c', edge: 0.5, wear: 0.4, vgrad: [[0, 0.25], [0.5, 0], [1, 0.2]], clip: o.arch ? [[0, 1], [0, 0.18], [0.08, 0.1], [0.5, 0.0], [0.92, 0.1], [1, 0.18], [1, 1]] : undefined });
  sc.local(O, U, V, (g) => { // okucia i klamka
    g.strokeStyle = 'rgba(20,16,12,0.75)'; g.lineWidth = 0.016;
    for (const f of [0.22, 0.7]) { g.beginPath(); g.moveTo(u0, vb - h * (1 - f)); g.lineTo(u0 + w, vb - h * (1 - f)); g.stroke(); }
    g.fillStyle = '#c9a85a'; g.beginPath(); g.arc(u0 + w * 0.78, vb - h * 0.46, 0.016, 0, TAU); g.fill();
  });
}

/* okno z oświetlonym wnętrzem, ramą i (opcjonalnie) okiennicami */
function windowAt(sc, O, U, V, u0, v0, w, h, o = {}) {
  if (LINT) { const sw = o.shutters ? w * 0.42 + 0.012 : 0.014; sc.regRect(O, U, V, 'okno', u0 - sw, u0 + w + sw, v0 - 0.014, v0 + h + (o.sill ? 0.05 : 0.026)); }
  sc.local(O, U, V, (g) => {
    if (o.shutters) { g.fillStyle = o.shutters; const sw = w * 0.42; g.fillRect(u0 - sw - 0.012, v0 - 0.004, sw, h + 0.008); g.fillRect(u0 + w + 0.012, v0 - 0.004, sw, h + 0.008);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.008; g.strokeRect(u0 - sw - 0.012, v0 - 0.004, sw, h + 0.008); g.strokeRect(u0 + w + 0.012, v0 - 0.004, sw, h + 0.008);
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.005; for (const x of [u0 - sw * 0.5 - 0.012, u0 + w + sw * 0.5 + 0.012]) for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x - sw * 0.4, v0 + h * i / 5); g.lineTo(x + sw * 0.4, v0 + h * i / 5); g.stroke(); } }
    g.fillStyle = o.frame || '#3a2818'; g.fillRect(u0 - 0.014, v0 - 0.014, w + 0.028, h + 0.028);
    const gr = g.createLinearGradient(0, v0, 0, v0 + h), glow = !!(o.lit || o.glow);                                // za dnia: ciemna szyba z odbiciem nieba; ciepłe światło tylko na życzenie (o.glow / o.lit)
    if (glow) { gr.addColorStop(0, o.lit || '#ffe9a0'); gr.addColorStop(1, '#d99a40'); } else { gr.addColorStop(0, '#9bb0c4'); gr.addColorStop(0.5, '#51657a'); gr.addColorStop(1, '#2c3947'); }
    g.fillStyle = o.dark ? '#1c1710' : gr; g.fillRect(u0, v0, w, h);
    if (!glow && !o.dark) { g.strokeStyle = 'rgba(235,245,255,0.28)'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(u0 + w * 0.12, v0 + h * 0.46); g.lineTo(u0 + w * 0.46, v0 + h * 0.08); g.stroke(); }
    g.strokeStyle = o.frame || '#3a2818'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(u0 + w / 2, v0); g.lineTo(u0 + w / 2, v0 + h); g.moveTo(u0, v0 + h / 2); g.lineTo(u0 + w, v0 + h / 2); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(u0 - 0.014, v0 + h + 0.014, w + 0.028, 0.012);   // parapet
    if (o.sill) { g.fillStyle = o.sill; g.fillRect(u0 - 0.03, v0 + h + 0.014, w + 0.06, 0.03); }
  });
}

/* okno łukowe (architektura wschodnia): ciemne wnętrze albo światło lampy */
function archWin(sc, O, U, V, u0, v0, w, h, o = {}) {
  if (LINT) sc.regRect(O, U, V, 'okno', u0 - 0.014, u0 + w + 0.014, v0 - 0.014, v0 + h + 0.026);
  sc.local(O, U, V, (g) => {
    const r = w / 2, e = 0.014;
    g.fillStyle = o.frame || '#8a5a2a'; g.beginPath(); g.moveTo(u0 - e, v0 + h + e); g.lineTo(u0 - e, v0 + r); g.arc(u0 + r, v0 + r, r + e, Math.PI, 0); g.lineTo(u0 + w + e, v0 + h + e); g.closePath(); g.fill();
    const gr = g.createLinearGradient(0, v0, 0, v0 + h); gr.addColorStop(0, o.lit || '#241a10'); gr.addColorStop(1, o.lit2 || '#120d08');
    g.fillStyle = gr; g.beginPath(); g.moveTo(u0, v0 + h); g.lineTo(u0, v0 + r); g.arc(u0 + r, v0 + r, r, Math.PI, 0); g.lineTo(u0 + w, v0 + h); g.closePath(); g.fill();
    if (o.louver) { g.strokeStyle = 'rgba(150,118,76,0.85)'; g.lineWidth = 0.014; for (let j = 0; j < 6; j++) { const yy = v0 + r * 0.9 + j * (h - r * 0.9) / 6 + 0.03; g.beginPath(); g.moveTo(u0 + 0.01, yy + 0.03); g.lineTo(u0 + w - 0.01, yy); g.stroke(); } }
    if (o.grille) { g.strokeStyle = 'rgba(210,170,90,0.55)'; g.lineWidth = 0.008; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(u0 + w * i / 4, v0 + r * 0.6); g.lineTo(u0 + w * i / 4, v0 + h); g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(u0 - e, v0 + h + e, w + 2 * e, 0.012);
  });
}

/* ostrołukowe okno witrażowe (gotyk): kamienna rama, ołowiane szprosy, kolorowe szybki */
function glassWin(sc, O, U, V, u0, v0, w, h, o = {}) {
  if (LINT) sc.regRect(O, U, V, 'okno', u0 - 0.02, u0 + w + 0.02, v0 - w * 0.275 - 0.02, v0 + h + 0.02);
  sc.local(O, U, V, (g) => {
    const r = w / 2, e = 0.02, x1 = u0 + w, xm = u0 + r, ys = v0 + r, yt = v0 - r * 0.55, yb = v0 + h;
    const path = (dx) => { g.beginPath(); g.moveTo(u0 - dx, yb + dx); g.lineTo(u0 - dx, ys); g.quadraticCurveTo(u0 - dx, yt + r * 0.6 - dx, xm, yt - dx); g.quadraticCurveTo(x1 + dx, yt + r * 0.6 - dx, x1 + dx, ys); g.lineTo(x1 + dx, yb + dx); g.closePath(); };
    g.fillStyle = o.frame || '#8d897d'; path(e); g.fill();
    g.save(); path(0); g.clip();
    const cols = o.glass || ['#3c62a8', '#a8342c', '#d8a830', '#2f7a58', '#4a7ac0'], rr = rng(Math.round((u0 + v0) * 977));
    const nx = 3, ny = 6; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const c = cols[(rr() * cols.length) | 0]; g.fillStyle = c; g.fillRect(u0 + i * w / nx, yt + j * (yb - yt) / ny, w / nx + 0.002, (yb - yt) / ny + 0.002); }
    const gl = g.createLinearGradient(0, yt, 0, yb); gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(0,0,20,0.35)'); g.fillStyle = gl; g.fillRect(u0, yt, w, yb - yt);
    g.strokeStyle = 'rgba(14,14,20,0.8)'; g.lineWidth = 0.008; for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(u0 + i * w / nx, yt); g.lineTo(u0 + i * w / nx, yb); g.stroke(); } for (let j = 1; j < ny; j++) { g.beginPath(); g.moveTo(u0, yt + j * (yb - yt) / ny); g.lineTo(x1, yt + j * (yb - yt) / ny); g.stroke(); }
    g.restore(); g.strokeStyle = 'rgba(20,16,12,0.6)'; g.lineWidth = 0.008; path(0); g.stroke();
  });
}

/* ryglówka: słupy, rygle i zastrzały na ścianie */
function halfTimber(sc, O, U, V, o = {}) {
  const nu = o.nu ?? 4, nv = o.nv ?? 1, bw = o.bw ?? 0.03, col = o.col || '#3b2616';
  sc.local(O, U, V, (g, lu, lv) => {
    g.fillStyle = col;
    g.fillRect(0, 0, lu, bw); g.fillRect(0, lv - bw, lu, bw);
    for (let j = 1; j < nv; j++) g.fillRect(0, lv * j / nv - bw / 2, lu, bw * 0.8);
    for (let i = 0; i <= nu; i++) g.fillRect(i * (lu - bw) / nu, 0, bw, lv);
    g.strokeStyle = col; g.lineWidth = bw * 0.9;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = i * lu / nu, b = (i + 1) * lu / nu, y0 = lv * j / nv, y1 = lv * (j + 1) / nv; g.beginPath(); if ((i + j) % 2) { g.moveTo(a, y1 - bw); g.lineTo(b, y0 + bw); } else { g.moveTo(a, y0 + bw); g.lineTo(b, y1 - bw); } g.stroke(); }
    g.fillStyle = 'rgba(255,235,200,0.14)'; for (let i = 0; i <= nu; i++) g.fillRect(i * (lu - bw) / nu, 0, bw * 0.28, lv);   // światło na krawędzi słupów
  });
}

/* sadza: ciemny nalot na połaci przy kominie / nad paleniskiem */
function soot(sc, x, y, z, r = 0.12, a = 0.4) {
  const g = sc.g, [px, py] = sc.P(x, y, z), rr = r * AX * sc.F, gr = g.createRadialGradient(px, py, 0, px, py, rr);
  gr.addColorStop(0, `rgba(10,8,6,${a})`); gr.addColorStop(1, 'rgba(10,8,6,0)');
  g.save(); g.translate(px, py); g.scale(1, 0.62); g.translate(-px, -py); g.fillStyle = gr; g.fillRect(px - rr, py - rr, rr * 2, rr * 2); g.restore();
}
/* komin z kapturem i ciemnym wylotem */
function chimney(sc, cx, cy, zb, zt, w = 0.24, mat = 'stone', pal) {
  sc.box(cx - w / 2, cy - w / 2, zb, cx + w / 2, cy + w / 2, zt, mat, { ao: 0.15, pal, tag: 'komin' });
  sc.box(cx - w / 2 - 0.035, cy - w / 2 - 0.035, zt, cx + w / 2 + 0.035, cy + w / 2 + 0.035, zt + 0.07, mat, { ao: 0, pal, wear: 0.3, tag: 'komin' });
  const g = sc.g, [px, py] = sc.P(cx, cy, zt + 0.07), rx = (w / 2 - 0.02) * AX * sc.F * 1.4142;
  g.fillStyle = '#17120e'; g.beginPath(); g.ellipse(px, py, rx * 0.8, rx * 0.4, 0, 0, TAU); g.fill();
}
/* schody przed drzwiami (n stopni, od najwyższego); xa..xb — szerokość */
function stairs(sc, xa, xb, y, n, h, mat = 'stone', d = 0.17, pal) {
  for (let i = 0; i < n; i++) sc.box(xa, y + i * d, 0, xb, y + (i + 1) * d, h * (n - i) / n, mat, { ao: 0.2, pal, wear: 0.5 });
}
/* skrzynka z kwiatami pod oknem (na ścianie) */
function flowerBox(sc, O, U, V, u0, v, w, cols = ['#d8433a', '#f0d84a', '#e8e0d0']) {
  if (LINT) sc.regRect(O, U, V, 'kwiaty', u0 - 0.02, u0 + w + 0.02, v - 0.05, v + 0.07);
  sc.local(O, U, V, (g) => {
    g.fillStyle = '#6a4428'; g.fillRect(u0 - 0.02, v, w + 0.04, 0.07); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.006; g.strokeRect(u0 - 0.02, v, w + 0.04, 0.07);
    const r = rng(Math.round(u0 * 311 + v * 97)); for (let i = 0; i < 9; i++) { const x = u0 + (i + 0.5) * w / 9; g.fillStyle = '#3f7a2c'; g.beginPath(); g.arc(x, v - 0.005, 0.022, 0, TAU); g.fill(); g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.arc(x + (r() - 0.5) * 0.01, v - 0.03, 0.016, 0, TAU); g.fill(); }
  });
}
/* latarnia przy drzwiach: ciepłe światło */
function lantern(sc, x, y, z) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z), gr = g.createRadialGradient(px, py, 0, px, py, 16 * f);
  gr.addColorStop(0, 'rgba(255,214,120,0.55)'); gr.addColorStop(1, 'rgba(255,190,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, 16 * f, 0, TAU); g.fill();
  g.strokeStyle = '#2a2018'; g.lineWidth = 1.6 * f; g.beginPath(); g.moveTo(px, py - 7 * f); g.lineTo(px, py - 3 * f); g.stroke();
  g.fillStyle = '#ffe08a'; g.strokeStyle = '#2a2018'; g.lineWidth = 1.2 * f; g.beginPath(); g.rect(px - 2.6 * f, py - 3 * f, 5.2 * f, 7 * f); g.fill(); g.stroke();
}
/* wiszący szyld nad wejściem: żelazny wysięgnik i deska z godłem */
function signBoard(sc, x, y, z, emblem = 'loaf') {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z);
  g.strokeStyle = '#2a2018'; g.lineWidth = 2 * f; g.beginPath(); g.moveTo(px - 14 * f, py); g.lineTo(px + 8 * f, py); g.moveTo(px - 8 * f, py); g.lineTo(px - 2 * f, py - 6 * f); g.stroke();
  g.fillStyle = '#7a5530'; g.strokeStyle = '#2a2018'; g.lineWidth = 1.3 * f; g.beginPath(); g.rect(px - 2 * f, py + 3 * f, 13 * f, 14 * f); g.fill(); g.stroke();
  g.strokeStyle = '#2a2018'; g.lineWidth = f; g.beginPath(); g.moveTo(px + 1 * f, py); g.lineTo(px + 1 * f, py + 3 * f); g.moveTo(px + 8 * f, py); g.lineTo(px + 8 * f, py + 3 * f); g.stroke();
  g.fillStyle = '#e8c870';
  if (emblem === 'loaf') { g.beginPath(); g.ellipse(px + 4.5 * f, py + 10 * f, 4.4 * f, 3 * f, 0, 0, TAU); g.fill(); } else if (emblem === 'anvil') { g.fillRect(px + 0.5 * f, py + 8 * f, 8 * f, 2.6 * f); g.fillRect(px + 2.6 * f, py + 10.6 * f, 3.8 * f, 3.4 * f); } else { g.fillRect(px + 1.5 * f, py + 7 * f, 6 * f, 7 * f); }
}
/* markiza w pasy nad drzwiami / straganem: skośna połać + przednia falbana */
function awning(sc, x, y, z, width, depth, drop, pal = '#b8352b|#f1e6c8') {
  sc.face([x, y, z], [width, 0, 0], [0, depth, -drop], 'stripes', { shade: 1.0, edge: 0.45, pal, ppu: 150, wear: 0.3 });
  sc.face([x, y + depth, z - drop], [width, 0, 0], [0, 0, -0.07], 'stripes', { shade: 0.8, edge: 0.45, pal, ppu: 150, wear: 0 });
}
/* krenelaż: rząd blanek wzdłuż krawędzi (x lub y) */
function merlonLine(sc, x0, y0, x1, y1, z, n, size = 0.09, h = 0.12, mat = 'stone') {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; sc.box(x - size / 2, y - size / 2, z, x + size / 2, y + size / 2, z + h, mat, { ao: 0.1, wear: 0.7 }); }
}
/* płot wiklinowy (odcinek wzdłuż x lub y) */
function wattle(sc, x0, y0, x1, y1, h = 0.4, th = 0.05) {
  sc.box(Math.min(x0, x1) - th / 2, Math.min(y0, y1) - th / 2, 0, Math.max(x0, x1) + th / 2, Math.max(y0, y1) + th / 2, h, { east: 'wattle', south: 'wattle', top: 'plank' }, { ao: 0.25, pal: '#8a6a3c', wear: 0.5 });
}
/* ul: słomiany kosz (dla pszczół) rysowany w przestrzeni ekranu */
function skep(sc, x, y, s = 1) {
  sc.regVol('prop', x - 0.08, y - 0.08, 0, x + 0.08, y + 0.08, 0.2, 'ul');
  const g = sc.g, f = sc.F * s, [px, py] = sc.P(x, y, 0), w = 8 * f, h = 12 * f;
  g.fillStyle = 'rgba(14,22,8,0.3)'; g.beginPath(); g.ellipse(px + 3 * f, py + 0.5 * f, w * 0.9, w * 0.35, 0, 0, TAU); g.fill();
  const gr = g.createLinearGradient(px - w, 0, px + w, 0); gr.addColorStop(0, '#f0d27a'); gr.addColorStop(0.55, '#d4a948'); gr.addColorStop(1, '#8c6a28');
  g.fillStyle = gr; g.strokeStyle = 'rgba(40,26,8,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px - w, py); g.quadraticCurveTo(px - w * 1.05, py - h * 0.9, px, py - h); g.quadraticCurveTo(px + w * 1.05, py - h * 0.9, px + w, py); g.ellipse(px, py, w, w * 0.32, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(70,44,10,0.55)'; for (let i = 1; i < 5; i++) { const t = i / 5, yy = py - h * t, ww = w * (1 - t * 0.85); g.beginPath(); g.ellipse(px, yy, ww, ww * 0.3, 0, 0, Math.PI); g.stroke(); }
  g.fillStyle = '#2a1c0c'; g.beginPath(); g.ellipse(px, py - 2.6 * f, 1.8 * f, 1.2 * f, 0, 0, TAU); g.fill();
}

/* ---------- drobne rekwizyty ---------- */
function barrel(sc, x, y, z = 0, s = 1) {
  sc.cyl(x, y, z, z + 0.2 * s, 0.085 * s, { color: [132, 92, 52], ao: 0, topMat: 'plank', topPal: '#7a5632', mat: 'plank', pal: '#84603a' });
  const g = sc.g, [px, py] = sc.P(x, y, z + 0.05 * s), [, py2] = sc.P(x, y, z + 0.15 * s), rx = 0.085 * s * AX * sc.F * 1.4142;
  g.strokeStyle = 'rgba(30,22,14,0.85)'; g.lineWidth = 1.8 * sc.F;
  for (const yy of [py, py2]) { g.beginPath(); g.ellipse(px, yy, rx, rx / 2, 0, 0, Math.PI); g.stroke(); }
}
function logPile(sc, x, y, n = 6) { // stos kłód (końce okrągłe)
  sc.regVol('prop', x - 0.18, y - 0.08, 0, x + 0.18, y + 0.08, 0.25, 'stos');
  const g = sc.g, r = 0.05, rows = [3, 2, 1], F = sc.F;
  rows.forEach((cnt, row) => {
    for (let i = 0; i < cnt; i++) {
      const lx = x + (i - (cnt - 1) / 2) * r * 2.1, [px, py] = sc.P(lx, y, row * r * 1.7 + r), rx = r * AX * F * 1.2;
      g.fillStyle = '#7d5a34'; g.beginPath(); g.ellipse(px, py, rx * 1.15, rx * 0.75, 0, 0, TAU); g.fill();
      g.fillStyle = '#d6b27a'; g.beginPath(); g.ellipse(px - rx * 0.1, py, rx * 0.78, rx * 0.62, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(80,50,22,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(px - rx * 0.1, py, rx * 0.45, rx * 0.36, 0, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(30,18,8,0.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(px, py, rx * 1.15, rx * 0.75, 0, 0, TAU); g.stroke();
    }
  });
}
function crate(sc, x, y, s = 0.16, h = 0.16) { sc.box(x - s / 2, y - s / 2, 0, x + s / 2, y + s / 2, h, 'plank', { pal: '#8a6a40', ao: 0.3 }); }
function haystack(sc, x, y) {
  sc.regVol('prop', x - 0.22, y - 0.22, 0, x + 0.22, y + 0.22, 0.5, 'stóg');
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, 0), R = 0.2 * AX * f * 1.4;
  g.save(); g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.9, py - R * 1.5, px, py - R * 1.65); g.quadraticCurveTo(px + R * 0.9, py - R * 1.5, px + R, py); g.ellipse(px, py, R, R * 0.45, 0, 0, Math.PI); g.closePath(); g.clip();
  const gr = g.createLinearGradient(px - R, 0, px + R, 0); gr.addColorStop(0, '#e6c868'); gr.addColorStop(0.5, '#cfa84c'); gr.addColorStop(1, '#8a6a28');
  g.fillStyle = gr; g.fillRect(px - R, py - R * 1.7, R * 2, R * 2.2);
  const r = rng(77); g.lineWidth = 1;
  for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '255,235,150' : '90,60,16'},${0.2 + r() * 0.35})`; const a = px - R + r() * R * 2, b = py - r() * R * 1.6; g.beginPath(); g.moveTo(a, b); g.lineTo(a + (r() - 0.5) * 8 * f, b + (5 + r() * 7) * f); g.stroke(); }
  g.restore(); g.strokeStyle = 'rgba(30,20,6,0.5)'; g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.9, py - R * 1.5, px, py - R * 1.65); g.quadraticCurveTo(px + R * 0.9, py - R * 1.5, px + R, py); g.stroke();
}
function sack(sc, x, y, col = '#d8c898', s = 1, z = 0) {
  sc.regVol('prop', x - 0.08, y - 0.08, z, x + 0.08, y + 0.08, z + 0.22, 'worek');
  const g = sc.g, f = sc.F * s, [px, py] = sc.P(x, y, z), w = 11 * f, h = 14 * f;
  const gr = g.createRadialGradient(px - 3 * f, py - h * 0.7, 1, px, py - h * 0.5, w);
  gr.addColorStop(0, css(scaleC(hex(col), 1.2))); gr.addColorStop(1, css(scaleC(hex(col), 0.62)));
  g.fillStyle = gr; g.beginPath(); g.ellipse(px, py - h * 0.45, w * 0.8, h * 0.55, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,30,14,0.55)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = css(scaleC(hex(col), 0.6)); g.fillRect(px - 3.5 * f, py - h - 1, 7 * f, 3 * f);
}
function shield(g, u, v, r, col) {
  g.fillStyle = col; g.beginPath(); g.arc(u, v, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 0.012; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.26)'; g.beginPath(); g.arc(u - r * 0.22, v - r * 0.22, r * 0.5, 0, TAU); g.fill();
  g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(u, v, r * 0.28, 0, TAU); g.fill(); g.stroke();
}
/* stożkowy dach wieżyczki */
function cone(sc, cx, cy, z0, r, h, col) {
  sc.regVol('cone', cx - r, cy - r, z0, cx + r, cy + r, z0 + h);
  const g = sc.g, [px, py] = sc.P(cx, cy, z0), [, pt] = sc.P(cx, cy, z0 + h), rx = r * AX * sc.F * 1.4142, ry = r * AY * sc.F * 1.4142;
  g.beginPath(); g.moveTo(px - rx, py); g.lineTo(px, pt); g.lineTo(px + rx, py); g.ellipse(px, py, rx, ry, 0, 0, Math.PI); g.closePath();
  const gr = g.createLinearGradient(px - rx, 0, px + rx, 0); gr.addColorStop(0, css(scaleC(col, 1.3))); gr.addColorStop(0.5, css(col)); gr.addColorStop(1, css(scaleC(col, 0.5)));
  g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(20,8,4,0.75)'; g.lineWidth = 1.2; g.stroke();
  g.save(); g.clip(); g.strokeStyle = 'rgba(30,10,4,0.35)'; g.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const t = i / 8, yy = py + (pt - py) * t, w2 = rx * (1 - t); g.beginPath(); g.ellipse(px, yy, w2, w2 * ry / rx, 0, 0, Math.PI); g.stroke(); }
  g.restore();
}
function pennant(sc, x, y, z, len, col) {
  const g = sc.g, f = sc.F, [px, py] = sc.P(x, y, z), top = py - len * f;
  g.strokeStyle = '#3a2814'; g.lineWidth = 1.8 * f; g.beginPath(); g.moveTo(px, py); g.lineTo(px, top); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(px, top); g.lineTo(px + 17 * f, top + 4 * f); g.lineTo(px + 12 * f, top + 8 * f); g.lineTo(px + 17 * f, top + 12 * f); g.lineTo(px, top + 14 * f); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(10,10,30,0.6)'; g.lineWidth = 1; g.stroke();
}

/* kopuła (półkula albo cebulasta) z żebrami, połyskiem i opcjonalnym zwieńczeniem */
function dome(sc, cx, cy, z, r, o = {}) {
  sc.regVol('dome', cx - r, cy - r, z, cx + r, cy + r, z + r * 1.16 * (o.onion ? 1.75 : 1), 'kopuła');
  const g = sc.g, f = sc.F, [dx, dy] = sc.P(cx, cy, z), R = r * AX * f * 1.4142, cols = o.cols || ['#a6e8ea', '#3fb0b8', '#1d7480', '#0f4452'];
  const path = () => { g.beginPath(); if (o.onion) { g.moveTo(dx - R, dy); g.bezierCurveTo(dx - R * 1.18, dy - R * 0.7, dx - R * 0.45, dy - R * 1.0, dx, dy - R * 1.75); g.bezierCurveTo(dx + R * 0.45, dy - R * 1.0, dx + R * 1.18, dy - R * 0.7, dx + R, dy); g.ellipse(dx, dy, R, R / 2, 0, 0, Math.PI); } else { g.arc(dx, dy, R, Math.PI, 0); g.ellipse(dx, dy, R, R / 2, 0, 0, Math.PI); } g.closePath(); };
  g.save(); path(); g.clip();
  const gr = g.createRadialGradient(dx - R * 0.45, dy - R * 0.75, 2, dx, dy - R * 0.2, R * 1.3); gr.addColorStop(0, cols[0]); gr.addColorStop(0.35, cols[1]); gr.addColorStop(0.75, cols[2]); gr.addColorStop(1, cols[3]);
  g.fillStyle = gr; g.fillRect(dx - R * 1.3, dy - R * 2, R * 2.6, R * 2.6);
  g.strokeStyle = 'rgba(8,40,50,0.4)'; g.lineWidth = 1.2 * f; for (const k of [0.22, 0.5, 0.78, 1.0]) { g.beginPath(); g.ellipse(dx, dy, R * k, R * (o.onion ? 1.5 : 1), 0, Math.PI, 0); g.stroke(); }
  g.strokeStyle = 'rgba(235,252,252,0.22)'; for (const k of [0.35, 0.65]) { g.beginPath(); g.ellipse(dx, dy, R * k, R * (o.onion ? 1.45 : 0.96), 0, Math.PI, 0); g.stroke(); }
  g.restore(); path(); g.strokeStyle = 'rgba(10,36,44,0.75)'; g.lineWidth = 1.3 * f; g.stroke();
  if (o.finial !== false) { const top = dy - R * (o.onion ? 1.75 : 1); g.strokeStyle = '#d8b44a'; g.lineWidth = 2.2 * f; g.beginPath(); g.moveTo(dx, top); g.lineTo(dx, top - 20 * f); g.stroke(); g.fillStyle = '#e8c860'; g.beginPath(); g.arc(dx, top - 12 * f, 3.4 * f, 0, TAU); g.fill();
    g.strokeStyle = '#e8c860'; g.lineWidth = 1.8 * f; g.beginPath(); g.arc(dx + 1 * f, top - 22 * f, 5 * f, Math.PI * 0.3, Math.PI * 1.75); g.stroke(); }
}
/* minaret: smukły trzon, balkony, kielich z kopułką i szpic */
function minaret(sc, cx, cy, h, r = 0.11, pal = '#e4cf9e') {
  sc.cyl(cx, cy, 0, h, r, { mat: 'sandstone', pal, topMat: 'sandstone', ao: 0.5 });
  for (const zb of [h * 0.55, h * 0.88]) sc.cyl(cx, cy, zb, zb + 0.06, r * 1.7, { mat: 'sandstone', pal: '#c9ad74', topMat: 'sandstone', ao: 0 });
  sc.cyl(cx, cy, h * 0.88 + 0.06, h + 0.18, r * 1.15, { mat: 'sandstone', pal, ao: 0 });
  dome(sc, cx, cy, h + 0.18, r * 1.2, { onion: true });
}
