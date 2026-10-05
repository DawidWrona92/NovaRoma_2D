/* ====================== REKWIZYTY 1×1: stóg, drewno, studnia ====================== */
BAKED.hay = function () {
  const sc = new Scene(130, 120, 65, 96, { F: 1.5, wear: 0 });
  sc.shadow([[-0.2, -0.2, 0], [0.2, -0.2, 0], [0.2, 0.2, 0], [-0.2, 0.2, 0], [0, 0, 0.5]], { alpha: 0.42, blur: 6 });
  sc.contact(-0.17, -0.17, 0.17, 0.17, { alpha: 0.4 });
  haystack(sc, 0, 0);
  const o = sc.finish({ grain: 0.4 }); o.fw = 1; o.fh = 1; return o;
};
BAKED.logs = function () {
  const sc = new Scene(130, 110, 65, 84, { F: 1.5, wear: 0 });
  sc.shadowBox(-0.2, -0.08, 0.2, 0.08, 0.16, { alpha: 0.4, blur: 5 });
  sc.contact(-0.2, -0.08, 0.2, 0.08, { alpha: 0.4 });
  logPile(sc, 0, 0);
  const o = sc.finish({ grain: 0.4 }); o.fw = 1; o.fh = 1; return o;
};
BAKED.well = function () {
  const sc = sceneFor(1, 1, 1.5);
  sc.patch(0, 0, 0.6, 0.6, { seed: 12, alpha: 0.6 });
  sc.shadow([[-0.3, -0.3, 0], [0.3, -0.3, 0], [0.3, 0.3, 0], [-0.3, 0.3, 0], [-0.32, 0, 0.95], [0.32, 0, 0.95]], { alpha: 0.42, blur: 6 });
  sc.contact(-0.32, -0.32, 0.32, 0.32, { alpha: 0.5 });
  sc.cyl(0, 0, 0, 0.26, 0.3, { mat: 'stone', pal: '#9a978c', topMat: 'stone', topPal: '#8c8a80', ao: 0.4 });
  const g = sc.g, f = sc.F, [px, py] = sc.P(0, 0, 0.26), rx = 0.22 * AX * f * 1.4142;
  g.fillStyle = '#0f1e28'; g.beginPath(); g.ellipse(px, py, rx, rx / 2, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(80,140,170,0.45)'; g.beginPath(); g.ellipse(px, py + 2 * f, rx * 0.7, rx * 0.3, 0, 0, TAU); g.fill();
  sc.box(-0.3, -0.025, 0.26, -0.24, 0.03, 0.95, 'plank', { pal: '#6a4a2c', ao: 0 }); sc.box(0.24, -0.025, 0.26, 0.3, 0.03, 0.95, 'plank', { pal: '#6a4a2c', ao: 0 });
  gableRoof(sc, { x0: -0.38, x1: 0.38, y0: -0.22, y1: 0.22, z: 0.95, rise: 0.3, ov: 0.08, ovE: 0.06, mat: 'shingle', pal: '#6a4a34', ridge: 'x' });
  return sc.finish();
};
