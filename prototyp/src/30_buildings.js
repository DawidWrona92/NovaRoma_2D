/* ====================== BUDYNKI (wypiekane sprite'y) ====================== */
const BAKED = {};

/* drzwi z łukiem i okucia; (u0,w) — położenie na ścianie w jednostkach, h — wysokość, zb — wysokość podstawy ściany na osi v */
function door(sc, O, U, V, u0, w, h, o = {}) {
  const lu = Math.hypot(...U), lv = Math.hypot(...V), vb = o.vb ?? lv;   // vb: v podstawy drzwi
  sc.local(O, U, V, (g) => {
    g.fillStyle = o.frame || '#2b1c10';
    g.beginPath(); g.moveTo(u0 - 0.02, vb); g.lineTo(u0 - 0.02, vb - h); if (o.arch) g.arc(u0 + w / 2, vb - h, w / 2 + 0.02, Math.PI, 0); else g.lineTo(u0 + w + 0.02, vb - h); g.lineTo(u0 + w + 0.02, vb); g.closePath(); g.fill();
  });
  // deski drzwi jako teksturowany równoległobok
  const dir = [U[0] / lu, U[1] / lu, U[2] / lu], up = [-V[0] / lv, -V[1] / lv, -V[2] / lv];
  const base = [O[0] + dir[0] * u0 + V[0] / lv * vb, O[1] + dir[1] * u0 + V[1] / lv * vb, O[2] + dir[2] * u0 + V[2] / lv * vb];
  const topLeft = [base[0] + up[0] * h, base[1] + up[1] * h, base[2] + up[2] * h];
  sc.face(topLeft, [dir[0] * w, dir[1] * w, dir[2] * w], [-up[0] * h, -up[1] * h, -up[2] * h], 'plank', { shade: 1, pal: o.pal || '#6a4a2c', edge: 0.5, vgrad: [[0, 0.25], [0.5, 0], [1, 0.2]], clip: o.arch ? [[0, 1], [0, 0.18], [0.08, 0.1], [0.5, 0.0], [0.92, 0.1], [1, 0.18], [1, 1]] : undefined });
  sc.local(O, U, V, (g) => { // okucia i klamka
    g.strokeStyle = 'rgba(20,16,12,0.75)'; g.lineWidth = 0.014;
    for (const f of [0.22, 0.7]) { g.beginPath(); g.moveTo(u0, vb - h * (1 - f)); g.lineTo(u0 + w, vb - h * (1 - f)); g.stroke(); }
    g.fillStyle = '#c9a85a'; g.beginPath(); g.arc(u0 + w * 0.78, vb - h * 0.46, 0.012, 0, TAU); g.fill();
  });
}

/* okno z oświetlonym wnętrzem, ramą i (opcjonalnie) okiennicami */
function windowAt(sc, O, U, V, u0, v0, w, h, o = {}) {
  sc.local(O, U, V, (g) => {
    if (o.shutters) { g.fillStyle = o.shutters; const sw = w * 0.42; g.fillRect(u0 - sw - 0.012, v0 - 0.004, sw, h + 0.008); g.fillRect(u0 + w + 0.012, v0 - 0.004, sw, h + 0.008);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.008; g.strokeRect(u0 - sw - 0.012, v0 - 0.004, sw, h + 0.008); g.strokeRect(u0 + w + 0.012, v0 - 0.004, sw, h + 0.008); }
    g.fillStyle = o.frame || '#3a2818'; g.fillRect(u0 - 0.014, v0 - 0.014, w + 0.028, h + 0.028);
    const gr = g.createLinearGradient(0, v0, 0, v0 + h); gr.addColorStop(0, o.lit || '#ffe9a0'); gr.addColorStop(1, '#d99a40');
    g.fillStyle = o.dark ? '#1c1710' : gr; g.fillRect(u0, v0, w, h);
    g.strokeStyle = o.frame || '#3a2818'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(u0 + w / 2, v0); g.lineTo(u0 + w / 2, v0 + h); g.moveTo(u0, v0 + h / 2); g.lineTo(u0 + w, v0 + h / 2); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(u0 - 0.014, v0 + h + 0.014, w + 0.028, 0.012);   // parapet
  });
}

/* okno łukowe (architektura wschodnia): ciemne wnętrze albo światło lampy */
function archWin(sc, O, U, V, u0, v0, w, h, o = {}) {
  sc.local(O, U, V, (g) => {
    const r = w / 2, e = 0.014;
    g.fillStyle = o.frame || '#8a5a2a'; g.beginPath(); g.moveTo(u0 - e, v0 + h + e); g.lineTo(u0 - e, v0 + r); g.arc(u0 + r, v0 + r, r + e, Math.PI, 0); g.lineTo(u0 + w + e, v0 + h + e); g.closePath(); g.fill();
    const gr = g.createLinearGradient(0, v0, 0, v0 + h); gr.addColorStop(0, o.lit || '#241a10'); gr.addColorStop(1, o.lit2 || '#120d08');
    g.fillStyle = gr; g.beginPath(); g.moveTo(u0, v0 + h); g.lineTo(u0, v0 + r); g.arc(u0 + r, v0 + r, r, Math.PI, 0); g.lineTo(u0 + w, v0 + h); g.closePath(); g.fill();
    if (o.grille) { g.strokeStyle = 'rgba(210,170,90,0.55)'; g.lineWidth = 0.008; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(u0 + w * i / 4, v0 + r * 0.6); g.lineTo(u0 + w * i / 4, v0 + h); g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(u0 - e, v0 + h + e, w + 2 * e, 0.012);
  });
}

/* ---------- drobne rekwizyty ---------- */
function barrel(sc, x, y, z = 0, s = 1) {
  sc.cyl(x, y, z, z + 0.14 * s, 0.055 * s, { color: [132, 92, 52], ao: 0, topMat: 'plank', topPal: '#7a5632' });
  const g = sc.g, [px, py] = sc.P(x, y, z + 0.035 * s), [, py2] = sc.P(x, y, z + 0.105 * s), rx = 0.055 * s * AX * 1.4142;
  g.strokeStyle = 'rgba(30,22,14,0.8)'; g.lineWidth = 1.6;
  for (const yy of [py, py2]) { g.beginPath(); g.ellipse(px, yy, rx, rx / 2, 0, 0, Math.PI); g.stroke(); }
}
function logPile(sc, x, y, n = 6) { // stos kłód (końce okrągłe)
  const g = sc.g, r = 0.034, rows = [3, 2, 1];
  let k = 0;
  rows.forEach((cnt, row) => {
    for (let i = 0; i < cnt; i++) {
      const lx = x + (i - (cnt - 1) / 2) * r * 2.1, [px, py] = sc.P(lx, y, row * r * 1.7 + r);
      const rx = r * AX * 1.2;
      g.fillStyle = '#7d5a34'; g.beginPath(); g.ellipse(px, py, rx * 1.15, rx * 0.75, 0, 0, TAU); g.fill();   // bok kłody
      g.fillStyle = '#d6b27a'; g.beginPath(); g.ellipse(px - rx * 0.1, py, rx * 0.78, rx * 0.62, 0, 0, TAU); g.fill();   // przekrój
      g.strokeStyle = 'rgba(80,50,22,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(px - rx * 0.1, py, rx * 0.45, rx * 0.36, 0, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(30,18,8,0.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(px, py, rx * 1.15, rx * 0.75, 0, 0, TAU); g.stroke();
    }
  });
}
function crate(sc, x, y, s = 0.1, h = 0.1) { sc.box(x - s / 2, y - s / 2, 0, x + s / 2, y + s / 2, h, 'plank', { pal: '#8a6a40', ao: 0.3 }); }
function haystack(sc, x, y) {
  const g = sc.g, [px, py] = sc.P(x, y, 0), R = 0.13 * AX * 1.4;
  g.save(); g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.9, py - R * 1.5, px, py - R * 1.65); g.quadraticCurveTo(px + R * 0.9, py - R * 1.5, px + R, py); g.ellipse(px, py, R, R * 0.45, 0, 0, Math.PI); g.closePath(); g.clip();
  const gr = g.createLinearGradient(px - R, 0, px + R, 0); gr.addColorStop(0, '#e6c868'); gr.addColorStop(0.5, '#cfa84c'); gr.addColorStop(1, '#8a6a28');
  g.fillStyle = gr; g.fillRect(px - R, py - R * 1.7, R * 2, R * 2.2);
  const r = rng(77); g.lineWidth = 1;
  for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '255,235,150' : '90,60,16'},${0.2 + r() * 0.35})`; const a = px - R + r() * R * 2, b = py - r() * R * 1.6; g.beginPath(); g.moveTo(a, b); g.lineTo(a + (r() - 0.5) * 8, b + 5 + r() * 7); g.stroke(); }
  g.restore(); g.strokeStyle = 'rgba(30,20,6,0.5)'; g.beginPath(); g.moveTo(px - R, py); g.quadraticCurveTo(px - R * 0.9, py - R * 1.5, px, py - R * 1.65); g.quadraticCurveTo(px + R * 0.9, py - R * 1.5, px + R, py); g.stroke();
}
function sack(sc, x, y, col = '#d8c898') {
  const g = sc.g, [px, py] = sc.P(x, y, 0), w = 11, h = 14;
  const gr = g.createRadialGradient(px - 3, py - h * 0.7, 1, px, py - h * 0.5, w);
  gr.addColorStop(0, css(scaleC(hex(col), 1.2))); gr.addColorStop(1, css(scaleC(hex(col), 0.62)));
  g.fillStyle = gr; g.beginPath(); g.ellipse(px, py - h * 0.45, w * 0.8, h * 0.55, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,30,14,0.55)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = css(scaleC(hex(col), 0.6)); g.fillRect(px - 3.5, py - h - 1, 7, 3);
}

/* ================= SŁOWIANIE: chata ze zrębu i strzechy (styl Settlers) ================= */
BAKED.slavHut = function () {
  const sc = new Scene(330, 330, 165, 240);
  const x0 = -0.34, x1 = 0.34, y0 = -0.25, y1 = 0.25, zf = 0.05, zw = 0.52, rise = 0.36, ov = 0.07, ovE = 0.08;
  sc.patch(0.06, 0.06, 0.98, 0.88, { seed: 3 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - ovE, y1 + ov, zw], [x1 + ovE, y0 - ov, zw], [x1 + ovE, y1 + ov, zw], [x0 - ovE, y0 - ov, zw], [x0 - ovE, 0, zw + rise], [x1 + ovE, 0, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.012, y0 - 0.012, 0, x1 + 0.012, y1 + 0.012, zf, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zf, x1, y1, zw, 'log', { ao: 0.3, eave: 0.35 });
  const O = [x0, y1, zw], U = [x1 - x0, 0, 0], V = [0, 0, -(zw - zf)];
  door(sc, O, U, V, 0.13, 0.17, 0.3, { vb: zw - zf, arch: false });
  windowAt(sc, O, U, V, 0.44, 0.14, 0.11, 0.12, { shutters: '#5d3f22' });
  windowAt(sc, [x1, y1, zw], [0, -(y1 - y0), 0], V, 0.2, 0.14, 0.1, 0.12, { shutters: '#5d3f22' });
  // wystające końce bali w narożu (rytm kłód)
  const g = sc.g; for (let i = 0; i < 6; i++) { const z = zf + 0.04 + i * 0.075, [px, py] = sc.P(x1, y1, z); g.fillStyle = i % 2 ? '#8a6238' : '#9a6f3e'; g.beginPath(); g.ellipse(px, py, 4.8, 3.1, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,16,6,0.8)'; g.lineWidth = 1; g.stroke(); }
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov, ovE, mat: 'thatch', pal: '#cfae52', gableMat: 'log', ridge: 'x' });
  const L = x1 - x0 + 2 * ovE;
  sc.face([x0 - ovE, R.ySo, R.eaveZ], [L, 0, 0], [0, 0, -0.07], 'thatch', { shade: 0.62, pal: '#a98b3e', edge: 0.4 });   // gruba krawędź strzechy
  const a = sc.P(x0 - ovE, 0, zw + rise), b = sc.P(x1 + ovE, 0, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#7d5f28'; g.lineWidth = 8; g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke();
  g.strokeStyle = '#d9bf6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1] - 1.5); g.lineTo(b[0], b[1] - 1.5); g.stroke();
  logPile(sc, 0.48, 0.3); barrel(sc, 0.26, 0.42, 0, 1);
  return sc.finish();
};

/* ================= FRANKOWIE: dom ryglowy z dachówką (styl Twierdzy) ================= */
BAKED.frankHouse = function () {
  const sc = new Scene(300, 320, 150, 232);
  const x0 = -0.3, x1 = 0.3, y0 = -0.24, y1 = 0.24, zs = 0.2, zw = 0.5, rise = 0.34;
  sc.patch(0.02, 0.06, 0.8, 0.72, { seed: 8, alpha: 0.7 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - 0.08, y1 + 0.07, zw], [x1 + 0.08, y1 + 0.07, zw], [x1 + 0.08, y0 - 0.07, zw], [x0 - 0.08, y0 - 0.07, zw], [0, y0 - 0.06, zw + rise], [0, y1 + 0.06, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0, y0, 0, x1, y1, zs, 'stone', { ao: 0.45 });                         // parter z kamienia
  const J = 0.03;                                                               // wysunięcie piętra
  sc.box(x0 - J, y0 - J, zs, x1 + J, y1 + J, zw, 'plaster', { ao: 0.2, eave: 0.3, pal: '#eadfc2' });
  // belki ryglu: dwie ściany
  const beam = '#3b2616';
  const frame = (O, U, V, nu) => sc.local(O, U, V, (g, lu, lv) => {
    g.fillStyle = beam;
    const bw = 0.022;
    g.fillRect(0, 0, lu, bw); g.fillRect(0, lv - bw, lu, bw); g.fillRect(0, lv * 0.5 - bw / 2, lu, bw * 0.8);
    for (let i = 0; i <= nu; i++) g.fillRect(i * (lu - bw) / nu, 0, bw, lv);
    g.strokeStyle = beam; g.lineWidth = bw * 0.9;
    for (let i = 0; i < nu; i++) { const a = i * lu / nu, b = (i + 1) * lu / nu; g.beginPath(); if (i % 2) { g.moveTo(a, lv * 0.5); g.lineTo(b, lv * 0.05); } else { g.moveTo(a, lv * 0.05); g.lineTo(b, lv * 0.5); } g.stroke(); }
  });
  const Os = [x0 - J, y1 + J, zw], Us = [x1 - x0 + 2 * J, 0, 0], Vs = [0, 0, -(zw - zs)];
  const Oe = [x1 + J, y1 + J, zw], Ue = [0, -(y1 - y0 + 2 * J), 0];
  frame(Os, Us, Vs, 4); frame(Oe, Ue, Vs, 3);
  windowAt(sc, Os, Us, Vs, 0.1, 0.1, 0.1, 0.12, { shutters: '#7a2f22', frame: '#3b2616' });
  windowAt(sc, Os, Us, Vs, 0.42, 0.1, 0.1, 0.12, { shutters: '#7a2f22', frame: '#3b2616' });
  windowAt(sc, Oe, Ue, Vs, 0.2, 0.1, 0.1, 0.12, { shutters: '#7a2f22', frame: '#3b2616' });
  door(sc, [x0, y1, zs], [x1 - x0, 0, 0], [0, 0, -zs], 0.23, 0.15, 0.17, { vb: zs, arch: true });
  gableRoof(sc, { x0: x0 - J, x1: x1 + J, y0: y0 - J, y1: y1 + J, z: zw, rise, ov: 0.07, ovE: 0.06, mat: 'tiles', pal: '#b5532e', gableMat: 'plaster', gablePal: '#eadfc2', ridge: 'y' });
  // ryglowanie w szczycie (lewa ściana, +y)
  sc.local([x0 - J, y1 + J, zw + rise], [x1 - x0 + 2 * J, 0, 0], [0, 0, -rise], (g, lu, lv) => {
    g.save(); g.beginPath(); g.moveTo(lu / 2, 0); g.lineTo(lu, lv); g.lineTo(0, lv); g.closePath(); g.clip();
    g.fillStyle = beam; g.fillRect(lu / 2 - 0.011, 0, 0.022, lv); g.fillRect(0, lv * 0.55, lu, 0.02);
    g.strokeStyle = beam; g.lineWidth = 0.02; g.beginPath(); g.moveTo(lu * 0.5, lv * 0.55); g.lineTo(lu * 0.15, lv); g.moveTo(lu * 0.5, lv * 0.55); g.lineTo(lu * 0.85, lv); g.stroke(); g.restore();
  });
  // komin z kamienia
  sc.box(0.1, -0.15, zw + rise * 0.5, 0.2, -0.05, zw + rise + 0.12, 'stone', { ao: 0.2, top: true });
  barrel(sc, 0.36, 0.36, 0, 1); crate(sc, -0.38, 0.34, 0.1, 0.1);
  return sc.finish();
};

/* ================= FRANKOWIE: kamienna wieża z blankami (styl Twierdzy) ================= */
BAKED.stoneTower = function () {
  const sc = new Scene(280, 360, 140, 262);
  const h = 0.95, w = 0.23;
  sc.patch(0, 0.05, 0.7, 0.62, { seed: 14, alpha: 0.6 });
  sc.shadow([[-w, -w, 0], [w, -w, 0], [w, w, 0], [-w, w, 0], [-w, -w, h], [w, -w, h], [w, w, h], [-w, w, h]]);
  sc.contact(-w, -w, w, w, { grow: 0.06 });
  sc.box(-w - 0.03, -w - 0.03, 0, w + 0.03, w + 0.03, 0.12, 'stone', { ao: 0.4 });          // cokół
  sc.box(-w, -w, 0.12, w, w, h, 'stone', { ao: 0.3 });
  // blanki
  const zt = h, mh = 0.09, mw = 0.075;
  const merlon = (cx, cy) => sc.box(cx - mw / 2, cy - mw / 2, zt, cx + mw / 2, cy + mw / 2, zt + mh, 'stone', { ao: 0.1 });
  sc.box(-w - 0.03, -w - 0.03, zt - 0.05, w + 0.03, w + 0.03, zt, 'stone', { ao: 0.0, top: true });   // wystający gzyms
  for (const t of [-0.19, -0.06, 0.07, 0.19]) { merlon(t, -w - 0.01); merlon(-w - 0.01, t); }
  for (const t of [-0.19, -0.06, 0.07, 0.19]) { merlon(t, w + 0.01); merlon(w + 0.01, t); }
  // strzelnice i drzwi
  const Os = [-w, w, h], Us = [2 * w, 0, 0], Vs = [0, 0, -(h - 0.12)], Oe = [w, w, h], Ue = [0, -2 * w, 0];
  for (const [O, U, us] of [[Os, Us, [0.12, 0.34]], [Oe, Ue, [0.23]]]) for (const u of us) sc.local(O, U, Vs, (g) => { g.fillStyle = '#15120d'; g.beginPath(); g.moveTo(u, 0.2); g.lineTo(u, 0.38); g.lineTo(u + 0.022, 0.38); g.lineTo(u + 0.022, 0.2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(u - 0.004, 0.2, 0.004, 0.18); });
  for (const [O, U, us] of [[Os, Us, [0.2]], [Oe, Ue, [0.1]]]) for (const u of us) sc.local(O, U, Vs, (g) => { g.fillStyle = '#15120d'; g.beginPath(); g.moveTo(u, 0.52); g.lineTo(u, 0.68); g.lineTo(u + 0.022, 0.68); g.lineTo(u + 0.022, 0.52); g.fill(); });
  door(sc, Os, Us, Vs, 0.17, 0.12, 0.2, { vb: h - 0.12, arch: true });
  // chorągiew
  const g = sc.g, [px, py] = sc.P(0, 0, zt + mh), top = py - 46;
  g.strokeStyle = '#4a3420'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px, top); g.stroke();
  g.fillStyle = '#2f5aa8'; g.beginPath(); g.moveTo(px, top); g.lineTo(px + 26, top + 6); g.lineTo(px + 20, top + 11); g.lineTo(px + 26, top + 16); g.lineTo(px, top + 20); g.closePath(); g.fill(); g.strokeStyle = 'rgba(10,10,30,0.6)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#e8d8a0'; g.fillRect(px + 4, top + 7, 8, 2);
  return sc.finish();
};

/* ================= SARACENI: dom z piaskowca z markizą (styl AoE2) ================= */
BAKED.saracenHouse = function () {
  const sc = new Scene(360, 340, 180, 250);
  const x0 = -0.38, x1 = 0.38, y0 = -0.3, y1 = 0.3, zw = 0.5, up = 0.26;
  sc.patch(0.05, 0.1, 1.0, 0.85, { seed: 21, pal: '#b79a62', alpha: 0.75 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, zw + 0.06], [x1, y0, zw + 0.06], [x1, y1, zw + 0.06], [x0, y1, zw + 0.06], [-0.3, -0.2, zw + up + 0.2], [-0.1, 0, zw + up + 0.2]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0, y0, 0, x1, y1, zw, 'sandstone', { ao: 0.32, pal: '#dcc490', topPal: '#e2cd9c' });
  const pt = 0.055, pz = zw + 0.06;            // attyka dookoła dachu-tarasu
  sc.box(x0 - 0.01, y0 - 0.01, zw, x1 + 0.01, y0 + pt, pz, 'sandstone', { ao: 0, pal: '#e0c996', top: true });
  sc.box(x1 - pt, y0 - 0.01, zw, x1 + 0.01, y1 + 0.01, pz, 'sandstone', { ao: 0, pal: '#e0c996' });
  sc.box(x0 - 0.01, y1 - pt, zw, x1 + 0.01, y1 + 0.01, pz, 'sandstone', { ao: 0, pal: '#e0c996' });
  sc.box(x0 - 0.01, y0 - 0.01, zw, x0 + pt, y1 + 0.01, pz, 'sandstone', { ao: 0, pal: '#e0c996' });
  // wyższa kubatura w tylnym narożu + mała kopułka
  const ux0 = -0.33, ux1 = 0.02, uy0 = -0.25, uy1 = 0.06;
  sc.box(ux0, uy0, zw, ux1, uy1, zw + up, 'sandstone', { ao: 0.25, pal: '#e6d1a0', topPal: '#ead7a8' });
  const g = sc.g, [dx, dy] = sc.P((ux0 + ux1) / 2, (uy0 + uy1) / 2, zw + up), R = 0.1 * AX * 1.4142;
  g.save(); g.beginPath(); g.arc(dx, dy, R, Math.PI, 0); g.ellipse(dx, dy, R, R / 2, 0, 0, Math.PI); g.closePath(); g.clip();
  const gr = g.createRadialGradient(dx - R * 0.4, dy - R * 0.8, 2, dx, dy - R * 0.2, R * 1.2); gr.addColorStop(0, '#f6e8b8'); gr.addColorStop(0.6, '#d6bb7a'); gr.addColorStop(1, '#8e7440'); g.fillStyle = gr; g.fillRect(dx - R, dy - R, 2 * R, 1.6 * R); g.restore();
  g.strokeStyle = 'rgba(40,28,10,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(dx, dy, R, Math.PI, 0); g.stroke();
  g.strokeStyle = '#d8b44a'; g.lineWidth = 2; g.beginPath(); g.moveTo(dx, dy - R); g.lineTo(dx, dy - R - 12); g.stroke();
  // ściany: drzwi z błękitną ościeżnicą, okna łukowe, belki stropowe
  const Os = [x0, y1, zw], Us = [x1 - x0, 0, 0], Vs = [0, 0, -zw], Oe = [x1, y1, zw], Ue = [0, -(y1 - y0), 0];
  door(sc, Os, Us, Vs, 0.5, 0.17, 0.28, { vb: zw, arch: true, frame: '#1f6f78', pal: '#5a3d22' });
  archWin(sc, Os, Us, Vs, 0.12, 0.17, 0.1, 0.17, { frame: '#1f6f78', grille: true });
  archWin(sc, Os, Us, Vs, 0.3, 0.17, 0.1, 0.17, { frame: '#1f6f78', grille: true });
  for (const u of [0.1, 0.27, 0.44]) archWin(sc, Oe, Ue, Vs, u, 0.17, 0.1, 0.17, { frame: '#8a5a2a', grille: true });
  archWin(sc, [x0, uy1, zw + up], [ux1 - ux0, 0, 0], [0, 0, -up], 0.1, 0.06, 0.08, 0.14, { frame: '#1f6f78', lit: '#f6c866', lit2: '#c98a30' });
  archWin(sc, [x0, uy1, zw + up], [ux1 - ux0, 0, 0], [0, 0, -up], 0.23, 0.06, 0.08, 0.14, { frame: '#1f6f78' });
  for (const [O, U, n] of [[Os, Us, 6], [Oe, Ue, 5]]) sc.local(O, U, Vs, (gg, lu) => { gg.fillStyle = '#4a3018'; for (let i = 0; i < n; i++) gg.fillRect(0.06 + i * (lu - 0.12) / (n - 1) - 0.014, 0.0, 0.028, 0.035); });
  // markiza w pasy nad drzwiami
  const a = [x0 + 0.46, y1, zw - 0.17], aw = 0.3;
  sc.face([a[0], a[1], a[2]], [aw, 0, 0], [0, 0.19, -0.08], 'stripes', { shade: 1.0, edge: 0.45, pal: '#b8352b|#f1e6c8', ppu: 150 });
  sc.face([a[0], a[1] + 0.19, a[2] - 0.08], [aw, 0, 0], [0, 0, -0.055], 'stripes', { shade: 0.82, edge: 0.45, pal: '#b8352b|#f1e6c8', ppu: 150 });
  sc.cyl(x0 + 0.1, 0.44, 0, 0.13, 0.05, { color: [176, 112, 62], ao: 0 });     // dzban
  sack(sc, 0.5, 0.4); sack(sc, 0.58, 0.36, '#c9b27a');
  return sc.finish();
};

/* ================= SARACENI: meczet z błękitną kopułą i smukłym minaretem ================= */
BAKED.mosque = function () {
  const sc = new Scene(360, 440, 180, 330);
  const x0 = -0.36, x1 = 0.36, y0 = -0.3, y1 = 0.3, zw = 0.38;
  sc.patch(0.05, 0.08, 1.0, 0.9, { seed: 27, pal: '#b79a62', alpha: 0.7 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [0, 0, 0.9], [-0.24, 0.3, 0.3], [0.26, -0.22, 0.3], [0.3, 0.26, 1.0]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0, y0, 0, x1, y1, zw, 'sandstone', { ao: 0.32, pal: '#e0c995', topPal: '#e6d2a0' });
  const Os = [x0, y1, zw], Us = [x1 - x0, 0, 0], Vs = [0, 0, -zw], Oe = [x1, y1, zw], Ue = [0, -(y1 - y0), 0];
  for (const [O, U, us] of [[Os, Us, [0.1, 0.26, 0.42, 0.58]], [Oe, Ue, [0.08, 0.23, 0.38]]]) for (const u of us) archWin(sc, O, U, Vs, u, 0.12, 0.08, 0.2, { frame: '#1f6f78', lit: '#2c4a50', lit2: '#16282c', grille: true });
  sc.local(Os, Us, Vs, (gg, lu) => { gg.fillStyle = '#3f7f86'; gg.fillRect(0, 0.012, lu, 0.02); gg.fillStyle = '#2c5d66'; gg.fillRect(0, 0.032, lu, 0.008); });
  sc.local(Oe, Ue, Vs, (gg, lu) => { gg.fillStyle = '#3f7f86'; gg.fillRect(0, 0.012, lu, 0.02); gg.fillStyle = '#2c5d66'; gg.fillRect(0, 0.032, lu, 0.008); });
  sc.cyl(0, 0, zw, zw + 0.15, 0.2, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', topPal: '#e6d2a0', ao: 0.5 });      // tambur
  const g = sc.g, [dx, dy] = sc.P(0, 0, zw + 0.15), Rr = 0.215 * AX * 1.4142;
  g.save(); g.beginPath(); g.arc(dx, dy, Rr, Math.PI, 0); g.ellipse(dx, dy, Rr, Rr / 2, 0, 0, Math.PI); g.closePath(); g.clip();
  const gr = g.createRadialGradient(dx - Rr * 0.45, dy - Rr * 0.75, 2, dx, dy - Rr * 0.2, Rr * 1.25); gr.addColorStop(0, '#a6e8ea'); gr.addColorStop(0.35, '#3fb0b8'); gr.addColorStop(0.75, '#1d7480'); gr.addColorStop(1, '#0f4452');
  g.fillStyle = gr; g.fillRect(dx - Rr, dy - Rr, Rr * 2, Rr * 1.6);
  g.strokeStyle = 'rgba(8,50,60,0.45)'; g.lineWidth = 1.2; for (const f of [0.22, 0.5, 0.78, 1.0]) { g.beginPath(); g.ellipse(dx, dy, Rr * f, Rr, 0, Math.PI, 0); g.stroke(); }
  g.strokeStyle = 'rgba(230,250,250,0.25)'; for (const f of [0.35, 0.65]) { g.beginPath(); g.ellipse(dx, dy, Rr * f, Rr * 0.96, 0, Math.PI, 0); g.stroke(); }
  g.restore(); g.strokeStyle = 'rgba(10,40,48,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.arc(dx, dy, Rr, Math.PI, 0); g.stroke();
  g.strokeStyle = '#d8b44a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(dx, dy - Rr); g.lineTo(dx, dy - Rr - 20); g.stroke(); g.fillStyle = '#e8c860'; g.beginPath(); g.arc(dx, dy - Rr - 13, 3.6, 0, TAU); g.fill();
  // minaret: smukły trzon, balkon z poręczą, ośmiokątny kielich i szpic
  const mx = 0.33, my = 0.25;
  sc.cyl(mx, my, 0, 0.82, 0.05, { mat: 'sandstone', pal: '#e4cf9e', topMat: 'sandstone', ao: 0.5 });
  sc.cyl(mx, my, 0.7, 0.735, 0.095, { mat: 'sandstone', pal: '#c9ad74', topMat: 'sandstone', ao: 0 });
  sc.cyl(mx, my, 0.735, 0.83, 0.058, { mat: 'sandstone', pal: '#e4cf9e', ao: 0 });
  const [mx0, my0] = sc.P(mx, my, 0.83), mr = 0.058 * AX * 1.4142;
  g.beginPath(); g.arc(mx0, my0, mr, Math.PI, 0); g.ellipse(mx0, my0, mr, mr / 2, 0, 0, Math.PI); g.closePath();
  const g2 = g.createRadialGradient(mx0 - mr * 0.4, my0 - mr * 0.8, 1, mx0, my0, mr * 1.3); g2.addColorStop(0, '#a6e8ea'); g2.addColorStop(0.6, '#2c98a2'); g2.addColorStop(1, '#0f4452'); g.fillStyle = g2; g.fill(); g.strokeStyle = 'rgba(10,40,48,0.7)'; g.stroke();
  g.strokeStyle = '#d8b44a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(mx0, my0 - mr); g.lineTo(mx0, my0 - mr - 14); g.stroke();
  return sc.finish();
};

/* ================= STUDNIA ================= */
BAKED.well = function () {
  const sc = new Scene(150, 160, 75, 124);
  sc.shadow([[-0.15, -0.15, 0], [0.15, -0.15, 0], [0.15, 0.15, 0], [-0.15, 0.15, 0], [-0.17, 0, 0.5], [0.17, 0, 0.5]], { alpha: 0.42, blur: 6 });
  sc.contact(-0.17, -0.17, 0.17, 0.17, { alpha: 0.5 });
  sc.cyl(0, 0, 0, 0.14, 0.15, { mat: 'stone', pal: '#9a978c', topMat: 'stone', topPal: '#8c8a80', ao: 0.4 });
  const g = sc.g, [px, py] = sc.P(0, 0, 0.14), rx = 0.112 * AX * 1.4142;
  g.fillStyle = '#0f1e28'; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(80,140,170,0.45)'; g.beginPath(); g.ellipse(px, py + 2, rx * 0.7, rx * 0.3, 0, 0, TAU); g.fill();
  sc.box(-0.15, -0.012, 0.14, -0.125, 0.016, 0.5, 'plank', { pal: '#6a4a2c', ao: 0 });
  sc.box(0.125, -0.012, 0.14, 0.15, 0.016, 0.5, 'plank', { pal: '#6a4a2c', ao: 0 });
  gableRoof(sc, { x0: -0.19, x1: 0.19, y0: -0.11, y1: 0.11, z: 0.5, rise: 0.15, ov: 0.04, ovE: 0.03, mat: 'shingle', pal: '#6a4a34', ridge: 'x' });
  return sc.finish();
};

/* ================= REKWIZYTY JAKO SAMODZIELNE SPRITE'Y ================= */
BAKED.hay = function () {
  const sc = new Scene(120, 110, 60, 86);
  sc.shadow([[-0.12, -0.12, 0], [0.12, -0.12, 0], [0.12, 0.12, 0], [-0.12, 0.12, 0], [0, 0, 0.3]], { alpha: 0.42, blur: 6 });
  sc.contact(-0.1, -0.1, 0.1, 0.1, { alpha: 0.4 });
  haystack(sc, 0, 0);
  return sc.finish();
};
BAKED.logs = function () {
  const sc = new Scene(120, 100, 60, 76);
  sc.shadowBox(-0.12, -0.05, 0.12, 0.05, 0.12, { alpha: 0.4, blur: 5 });
  sc.contact(-0.12, -0.05, 0.12, 0.05, { alpha: 0.4 });
  logPile(sc, 0, 0);
  return sc.finish();
};

/* ================= WIKINGOWIE: długi dom z darnowym dachem i tarczami ================= */
function shield(g, u, v, r, col) {
  g.fillStyle = col; g.beginPath(); g.arc(u, v, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 0.012; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.26)'; g.beginPath(); g.arc(u - r * 0.22, v - r * 0.22, r * 0.5, 0, TAU); g.fill();
  g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(u, v, r * 0.28, 0, TAU); g.fill(); g.stroke();
}
BAKED.longhouse = function () {
  const sc = new Scene(420, 350, 210, 255);
  const x0 = -0.5, x1 = 0.5, y0 = -0.27, y1 = 0.27, zf = 0.06, zw = 0.56, rise = 0.3, ov = 0.07, ovE = 0.1;
  sc.patch(0.05, 0.08, 1.2, 0.9, { seed: 33, pal: '#7a6540', alpha: 0.8 });
  sc.shadow([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 - ovE, y1 + ov, zw], [x1 + ovE, y0 - ov, zw], [x1 + ovE, y1 + ov, zw], [x0 - ovE, y0 - ov, zw], [x0 - ovE, 0, zw + rise], [x1 + ovE, 0, zw + rise]]);
  sc.contact(x0, y0, x1, y1);
  sc.box(x0 - 0.012, y0 - 0.012, 0, x1 + 0.012, y1 + 0.012, zf, 'rubble', { ao: 0.3 });
  sc.box(x0, y0, zf, x1, y1, zw, 'plank', { pal: '#5c4630', ao: 0.3, eave: 0.4 });
  const O = [x0, y1, zw], U = [x1 - x0, 0, 0], V = [0, 0, -(zw - zf)];
  door(sc, O, U, V, 0.42, 0.17, 0.3, { vb: zw - zf, arch: true, frame: '#1f1308', pal: '#3a2816' });
  sc.local(O, U, V, (g) => {
    const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830', '#b8352b', '#e8d8a0'];
    [0.08, 0.17, 0.26, 0.66, 0.75, 0.84].forEach((u, i) => shield(g, u, 0.12, 0.042, cols[i]));
    g.fillStyle = '#c9a85a'; for (const u of [0.05, 0.95]) g.fillRect(u - 0.012, 0.02, 0.024, 0.28);
  });
  const Oe = [x1, y1, zw], Ue = [0, -(y1 - y0), 0];
  windowAt(sc, Oe, Ue, V, 0.1, 0.14, 0.07, 0.1, { dark: true, frame: '#2a1a0c' });
  windowAt(sc, Oe, Ue, V, 0.37, 0.14, 0.07, 0.1, { dark: true, frame: '#2a1a0c' });
  const R = gableRoof(sc, { x0, x1, y0, y1, z: zw, rise, ov, ovE, mat: 'grass', pal: 'green', gableMat: 'plank', gablePal: '#5c4630', ridge: 'x' });
  const L = x1 - x0 + 2 * ovE;
  sc.face([x0 - ovE, R.ySo, R.eaveZ], [L, 0, 0], [0, 0, -0.07], 'dirt', { shade: 0.7, pal: '#5a4528', edge: 0.45 });    // krawędź darniny
  const g = sc.g, ex = sc.P(x1 + ovE, 0, zw + rise), wx = sc.P(x0 - ovE, 0, zw + rise);
  g.lineCap = 'round'; g.strokeStyle = '#3a2614'; g.lineWidth = 7; g.beginPath(); g.moveTo(wx[0], wx[1]); g.lineTo(ex[0], ex[1]); g.stroke();      // belka kalenicowa
  g.lineWidth = 4;
  for (const [p, d] of [[ex, 1], [wx, -1]]) {                                                                                                  // skrzyżowane „rogi" na szczytach
    g.beginPath(); g.moveTo(p[0] - 3 * d, p[1] + 6); g.lineTo(p[0] + 10 * d, p[1] - 17); g.moveTo(p[0] + 3 * d, p[1] + 6); g.lineTo(p[0] - 10 * d, p[1] - 17); g.stroke();
    g.fillStyle = '#4a301a'; for (const s2 of [1, -1]) { g.beginPath(); g.arc(p[0] + 10 * d * s2, p[1] - 17, 3.2, 0, TAU); g.fill(); }
  }
  barrel(sc, 0.66, 0.4, 0, 1); logPile(sc, -0.62, 0.36);
  return sc.finish();
};

/* ================= WIKINGOWIE: smoczy okręt (kołysze się na wodzie) ================= */
BAKED.longship = function () {
  const sc = new Scene(460, 300, 230, 205), g = sc.g, H = 0.92, W = 0.2, N = 30;
  const hw = x => W * (1 - Math.pow(Math.abs(x) / H, 2.6)) + 0.012, zt = x => 0.15 + 0.22 * Math.pow(Math.abs(x) / H, 3.2), zb = x => 0.0 + 0.1 * Math.pow(Math.abs(x) / H, 1.4);
  const xs = Array.from({ length: N + 1 }, (_, i) => -H + 2 * H * i / N), rev = xs.slice().reverse();
  const poly = pts => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); };
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = sc.P(x, hw(x) + 0.06, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = sc.P(x, -hw(x) - 0.06, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(238,252,255,0.6)', 9);
  softFill(sc.gu, gg => { xs.forEach((x, i) => { const p = sc.P(x + 0.22, hw(x) + 0.1, 0); i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]); }); rev.forEach(x => { const p = sc.P(x + 0.22, -hw(x) + 0.1, 0); gg.lineTo(p[0], p[1]); }); gg.closePath(); }, 'rgba(6,34,52,0.42)', 10);
  // dalsza burta od wewnątrz i pokład
  poly([...xs.map(x => sc.P(x, -hw(x), zt(x))), ...rev.map(x => sc.P(x, -hw(x) * 0.78, zt(x) - 0.13))]); g.fillStyle = '#4a3220'; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.7)'; g.stroke();
  poly([...xs.map(x => sc.P(x, -hw(x) * 0.8, zt(x) - 0.1)), ...rev.map(x => sc.P(x, hw(x) * 0.8, zt(x) - 0.1))]);
  const dg = g.createLinearGradient(...sc.P(0, -0.2, 0.1), ...sc.P(0, 0.2, 0.1)); dg.addColorStop(0, '#7a5a34'); dg.addColorStop(1, '#a98450'); g.fillStyle = dg; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,24,10,0.55)'; g.lineWidth = 1; for (let i = -7; i <= 7; i++) { const x = i * 0.11; g.beginPath(); g.moveTo(...sc.P(x, -hw(x) * 0.78, zt(x) - 0.1)); g.lineTo(...sc.P(x, hw(x) * 0.78, zt(x) - 0.1)); g.stroke(); }
  // maszt i żagiel (płaszczyzna x = 0)
  g.lineCap = 'round'; g.strokeStyle = '#4a301a'; g.lineWidth = 4; g.beginPath(); g.moveTo(...sc.P(0, 0, zt(0) - 0.1)); g.lineTo(...sc.P(0, 0, 1.0)); g.stroke();
  const sails = 8, sy0 = 0.93, sy1 = 0.36, swd = 0.34;
  for (let i = 0; i < sails; i++) {
    const a = -swd + 2 * swd * i / sails, b = -swd + 2 * swd * (i + 1) / sails, bulge = t => 0.04 * Math.sin(Math.PI * (t + 1) / 2);
    poly([sc.P(bulge(a / swd), a, sy0), sc.P(bulge(b / swd), b, sy0), sc.P(bulge(b / swd) * 0.7, b, sy1), sc.P(bulge(a / swd) * 0.7, a, sy1)]);
    g.fillStyle = i % 2 ? '#efe4c6' : '#b8352b'; g.fill(); g.strokeStyle = 'rgba(40,20,10,0.4)'; g.lineWidth = 0.8; g.stroke();
  }
  const shade = g.createLinearGradient(...sc.P(0, -swd, 0.9), ...sc.P(0, swd, 0.4)); shade.addColorStop(0, 'rgba(255,240,200,0.16)'); shade.addColorStop(1, 'rgba(0,0,30,0.3)');
  poly([sc.P(0, -swd, sy0), sc.P(0, swd, sy0), sc.P(0, swd, sy1), sc.P(0, -swd, sy1)]); g.fillStyle = shade; g.fill();
  g.strokeStyle = '#3a2614'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(...sc.P(0, -swd - 0.03, sy0 + 0.01)); g.lineTo(...sc.P(0, swd + 0.03, sy0 + 0.01)); g.stroke();
  // bliższa burta: klinkier
  const strakes = 6;
  for (let k = 0; k < strakes; k++) {
    const a = k / strakes, b = (k + 1) / strakes;
    poly([...xs.map(x => sc.P(x, hw(x) * (1 - a * 0.28), lerp(zt(x), zb(x), a))), ...rev.map(x => sc.P(x, hw(x) * (1 - b * 0.28), lerp(zt(x), zb(x), b)))]);
    const gr = g.createLinearGradient(...sc.P(0, 0, zt(0)), ...sc.P(0, 0, zb(0)));
    const base = k === 0 ? [184, 53, 43] : (k % 2 ? [112, 78, 46] : [138, 98, 56]); gr.addColorStop(0, css(scaleC(base, 1.2))); gr.addColorStop(1, css(scaleC(base, 0.72)));
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(20,10,4,0.75)'; g.lineWidth = 1; g.stroke();
  }
  const cols = ['#b8352b', '#e8d8a0', '#2f5aa8', '#d8a830'];
  for (let i = 0; i < 11; i++) { const x = -0.62 + i * 0.124, [px, py] = sc.P(x, hw(x), zt(x) - 0.045); g.fillStyle = cols[i % 4]; g.beginPath(); g.ellipse(px, py, 8, 7.5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.85)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#c8ccd0'; g.beginPath(); g.arc(px, py, 2.4, 0, TAU); g.fill(); }
  // dziób ze smoczą głową i ogon
  const stem = (x, d, hgt, head) => {
    const a = sc.P(x, 0, zt(x) - 0.04), b = sc.P(x + 0.07 * d, 0, zt(x) + hgt * 0.55), c = sc.P(x + 0.02 * d, 0, zt(x) + hgt);
    g.strokeStyle = '#3a2614'; g.lineWidth = 6; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]); g.stroke();
    g.strokeStyle = '#8a6238'; g.lineWidth = 2.6; g.stroke();
    if (head) { g.fillStyle = '#7a5230'; g.strokeStyle = 'rgba(20,10,4,0.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(c[0] - 5, c[1] + 4); g.quadraticCurveTo(c[0] - 4, c[1] - 12, c[0] + 4, c[1] - 14); g.lineTo(c[0] + 16, c[1] - 8); g.lineTo(c[0] + 8, c[1] - 4); g.lineTo(c[0] + 12, c[1] + 2); g.lineTo(c[0] + 2, c[1] + 4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f0e8c8'; g.beginPath(); g.arc(c[0] + 5, c[1] - 7, 1.8, 0, TAU); g.fill(); g.fillStyle = '#b8352b'; g.beginPath(); g.arc(c[0] + 5, c[1] - 7, 0.8, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#3a2614'; g.lineWidth = 3; g.beginPath(); g.arc(c[0] - 3, c[1] - 1, 4, 0, Math.PI * 1.5); g.stroke(); }
  };
  stem(-H, -1, 0.28, false); stem(H, 1, 0.34, true);
  return sc.finish();
};
