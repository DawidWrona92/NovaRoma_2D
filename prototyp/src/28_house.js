/* ====================== DOM: wspólny szkielet małych budynków ======================
   Prostokątny budynek z dachem dwuspadowym (jedno- albo dwukondygnacyjny, z nawisem piętra). Okna i drzwi układa facade(),
   komin osadza chim() na połaci. Zwraca opis (roof, zTop…), z którego korzystają rekwizyty.
   o: x0,x1,y0,y1 — ściany parteru; h1 — wysokość parteru nad cokołem zp; floors: 1|2, h2, J (nawis piętra);
      low: [mat, pal, kolor ryglówki?]; up: [mat, pal, kolor ryglówki?]; plinth: [mat, pal] | false;
      S, E — elewacje parteru (opcje facade); S2, E2 — piętra; nu — liczba pól ryglówki;
      roof: { mat, pal, rise, ov, ovE, ridge, gableMat, gablePal, gwin }; chim: [x, y, h, w] | null; wear */
/* grubość darniowej połaci: ciemna krawędź pod okapem przedniej (widocznej) połaci */
function sodEdge(sc, roof, R, pal = '#4a3a22', mat = 'dirt', shade = 0.7) {
  const ovE = roof.ovE ?? 0.1;
  if (roof.ridge === 'y') sc.face([R.xEo, roof.y1 + ovE, R.eaveZ], [0, -(roof.y1 - roof.y0 + 2 * ovE), 0], [0, 0, -0.1], mat, { shade, pal, edge: 0.45 });
  else sc.face([roof.x0 - ovE, R.ySo, R.eaveZ], [roof.x1 - roof.x0 + 2 * ovE, 0, 0], [0, 0, -0.1], mat, { shade, pal, edge: 0.45 });
}
function cottage(B, o) {
  const sc = B.sc, zp = o.zp ?? 0.1, { x0, x1, y0, y1 } = o, z1 = zp + o.h1, two = o.floors === 2, J = two ? (o.J ?? 0.1) : 0, zt = two ? z1 + o.h2 : z1, low = o.low, up = o.up || o.low;
  if (o.plinth !== false) { const p = o.plinth || ['stone', null]; B.box(x0 - 0.02, y0 - 0.02, 0, x1 + 0.02, y1 + 0.02, zp, p[0], { ao: 0.4, pal: p[1] }); }
  const timber = (S, E, spec, nuS, nuE) => { if (spec[2]) { halfTimber(sc, S.O, S.U, S.V, { nu: nuS, col: spec[2] }); halfTimber(sc, E.O, E.U, E.V, { nu: nuE, col: spec[2] }); } };
  B.box(x0, y0, zp, x1, y1, z1, low[0], { ao: 0.3, pal: low[1], eave: two ? 0.55 : 0.4, wear: o.wear }, (S, E) => {
    timber(S, E, low, o.nuS ?? Math.max(2, Math.round((x1 - x0) / 0.5)), o.nuE ?? Math.max(2, Math.round((y1 - y0) / 0.5)));
    const rS = o.S ? facade(sc, S, o.S) : null, rE = o.E ? facade(sc, E, o.E) : null; if (o.deco1) o.deco1(S, E, rS, rE, { x0, y0, x1, y1, z0: zp, z1 });
  });
  if (two) B.box(x0 - J, y0 - J, z1, x1 + J, y1 + J, zt, up[0], { ao: 0.15, pal: up[1], eave: 0.3, wear: o.wear }, (S, E) => {
    const nS = o.S2 && o.S2.win ? o.S2.win.n : 2, nE = o.E2 && o.E2.win ? o.E2.win.n : 2;                      // pola ryglówki = liczba okien, okna w środku pól (słup nigdy nie przecina okna)
    timber(S, E, up, o.nuS2 ?? nS, o.nuE2 ?? nE);
    if (o.S2) facade(sc, S, { ...o.S2, marg: 0 }); if (o.E2) facade(sc, E, { ...o.E2, marg: 0 }); if (o.deco2) o.deco2(S, E);
  });
  const r = o.roof, roof = { x0: x0 - J, x1: x1 + J, y0: y0 - J, y1: y1 + J, z: zt, rise: r.rise, ov: r.ov ?? 0.1, ovE: r.ovE ?? 0.1, mat: r.mat, pal: r.pal, gableMat: r.gableMat, gablePal: r.gablePal, ridge: o.ridge || 'x', nest: r.nest };
  B.gable(roof, (R) => {
    if (r.sod) sodEdge(sc, roof, R, r.sodPal, r.sodMat, r.sodShade);
    if (!r.gwin) return;
    const gy = roof.ridge === 'y', G = gy ? { O: [roof.x0, roof.y1, zt + r.rise], U: [roof.x1 - roof.x0, 0, 0], V: [0, 0, -r.rise] } : { O: [roof.x1, roof.y1, zt + r.rise], U: [0, -(roof.y1 - roof.y0), 0], V: [0, 0, -r.rise] };
    const lu = Math.hypot(...G.U), w = r.gwin.w ?? 0.16; windowAt(sc, G.O, G.U, G.V, lu / 2 - w / 2, r.rise * 0.4, w, r.gwin.h ?? 0.22, { frame: r.gwin.frame || '#3b2616', shutters: r.gwin.shut });
  });
  if (o.chim) { const [cx, cy, ch, cw, cm, cp] = o.chim; B.chim(roof, cx, cy, ch, cw, cm, cp); }
  return { roof, zp, z1, zt, J, x0, x1, y0, y1 };
}
