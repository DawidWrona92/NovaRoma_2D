/* ====================== BUDOWA Z BRYŁ: automatyczna kolejność rysowania, cienie, układ okien ======================
   Zamiast ręcznie ustawiać kolejność wywołań (źródło „ścian przechodzących przez siebie") budynek składa się z węzłów:
   każdy węzeł to bryła (prostopadłościan AABB) + funkcja rysująca. flush() ustala kolejność z relacji „bliżej / dalej od widza"
   (przy rzucie dimetrycznym bryła A jest bliżej, gdy leży dalej w +x, +y albo wyżej), rzuca cienie z sumy brył
   i dopiero potem rysuje. Okna i drzwi układa facade() w równych odstępach — nie nachodzą na siebie i nie wychodzą poza ścianę. */

/* wysokość połaci dwuspadowej w punkcie (x, y) — do osadzania kominów */
const gableZ = (o, x, y) => { const half = o.ridge === 'y' ? (o.x1 - o.x0) / 2 : (o.y1 - o.y0) / 2, d = o.ridge === 'y' ? Math.abs(x - (o.x0 + o.x1) / 2) : Math.abs(y - (o.y0 + o.y1) / 2); return o.z + o.rise * Math.max(0, 1 - d / half); };

class Build {
  constructor(sc) { this.sc = sc; this.nodes = []; }
  /* dodaje węzeł; pts — punkty 3D do cienia (domyślnie narożniki bryły), o.shadow:false — bez cienia, o.nest — dozwolone przenikanie */
  add(kind, x0, y0, z0, x1, y1, z1, draw, o = {}) {
    const n = { kind, x0, y0, z0, x1, y1, z1, draw, tag: o.tag || '', nest: !!o.nest, shadow: o.shadow !== false, pts: o.pts, contact: o.contact, i: this.nodes.length };
    this.nodes.push(n); return n;
  }
  /* prostopadłościan; deco(S, E, V) — dekoracje ścian południowej (+y) i wschodniej (+x): S, E = {O,U,V}, V = {x0,y0,x1,y1,z0,z1} */
  box(x0, y0, z0, x1, y1, z1, m, o = {}, deco) {
    return this.add('box', x0, y0, z0, x1, y1, z1, () => { this.sc.box(x0, y0, z0, x1, y1, z1, m, o); if (deco) deco(wallS(x0, x1, y1, z1, z0), wallE(y0, y1, x1, z1, z0), { x0, y0, x1, y1, z0, z1 }); }, { tag: o.tag, nest: o.nest, shadow: o.shadow, contact: o.contact ?? z0 < 0.14 });
  }
  cyl(cx, cy, z0, z1, r, o = {}, deco) {
    const pts = []; for (let k = 0; k < 8; k++) for (const z of [z0, z1]) pts.push([cx + Math.cos(k * TAU / 8) * r, cy + Math.sin(k * TAU / 8) * r, z]);
    return this.add('cyl', cx - r, cy - r, z0, cx + r, cy + r, z1, () => { this.sc.cyl(cx, cy, z0, z1, r, o); if (deco) deco(); }, { tag: o.tag, nest: o.nest, shadow: o.shadow, contact: o.contact ?? z0 < 0.14, pts });
  }
  /* dach dwuspadowy na prostokącie ścian; deco(R) po narysowaniu; zwraca węzeł z polem .info */
  gable(o, deco) {
    const oe = o.ovE ?? 0.05, ov = o.ov ?? 0.07, ex = o.ridge === 'y' ? ov : oe, ey = o.ridge === 'y' ? oe : ov, z = o.z, top = z + o.rise;
    const pts = [[o.x0 - ex, o.y0 - ey, z], [o.x1 + ex, o.y0 - ey, z], [o.x1 + ex, o.y1 + ey, z], [o.x0 - ex, o.y1 + ey, z]];
    pts.push(o.ridge === 'y' ? [(o.x0 + o.x1) / 2, o.y0 - ey, top] : [o.x0 - ex, (o.y0 + o.y1) / 2, top], o.ridge === 'y' ? [(o.x0 + o.x1) / 2, o.y1 + ey, top] : [o.x1 + ex, (o.y0 + o.y1) / 2, top]);
    const n = this.add('roof', o.x0 - ex, o.y0 - ey, z, o.x1 + ex, o.y1 + ey, top, () => { n.info = gableRoof(this.sc, o); if (deco) deco(n.info); }, { tag: o.tag, nest: o.nest, pts, contact: false });
    return n;
  }
  pyramid(o) {
    const ov = o.ov ?? 0.05, z = o.z, top = z + o.rise, xm = (o.x0 + o.x1) / 2, ym = (o.y0 + o.y1) / 2;
    const pts = [[o.x0 - ov, o.y0 - ov, z], [o.x1 + ov, o.y0 - ov, z], [o.x1 + ov, o.y1 + ov, z], [o.x0 - ov, o.y1 + ov, z], [xm, ym, top]];
    return this.add('roof', o.x0 - ov, o.y0 - ov, z, o.x1 + ov, o.y1 + ov, top, () => pyramidRoof(this.sc, o), { tag: o.tag, nest: o.nest, pts, contact: false });
  }
  /* dach jednospadowy: pochyła płaszczyzna od krawędzi północnej (wyżej) do południowej (niżej) o spadek drop */
  lean(o) {
    const { x0, y0, x1, y1, z, drop } = o, pts = [[x0, y0, z], [x1, y0, z], [x1, y1, z - drop], [x0, y1, z - drop]];
    return this.add('roof', x0, y0, z - drop, x1, y1, z, () => this.sc.face([x0, y0, z], [x1 - x0, 0, 0], [0, y1 - y0, -drop], o.mat, { shade: 1.0, pal: o.pal, edge: 0.4, roof: true, vgrad: [[0, 0], [0.88, 0], [1, 0.25]] }), { tag: o.tag, nest: o.nest, pts, contact: false });
  }
  cone(cx, cy, z0, r, h, col, o = {}) {
    const pts = []; for (let k = 0; k < 8; k++) pts.push([cx + Math.cos(k * TAU / 8) * r, cy + Math.sin(k * TAU / 8) * r, z0]); pts.push([cx, cy, z0 + h]);
    return this.add('cone', cx - r, cy - r, z0, cx + r, cy + r, z0 + h, () => cone(this.sc, cx, cy, z0, r, h, col), { tag: o.tag, nest: o.nest, pts, contact: false });
  }
  dome(cx, cy, z, r, o = {}) {
    const h = r * 1.16 * (o.onion ? 1.75 : 1), pts = []; for (let k = 0; k < 8; k++) pts.push([cx + Math.cos(k * TAU / 8) * r, cy + Math.sin(k * TAU / 8) * r, z]); pts.push([cx, cy, z + h * 0.7]);
    return this.add('dome', cx - r, cy - r, z, cx + r, cy + r, z + h, () => dome(this.sc, cx, cy, z, r, o), { tag: o.tag, nest: o.nest, pts, contact: false });
  }
  /* dowolny element o zadanej bryle (rekwizyty, kominy, słupy): draw rysuje go na scenie */
  part(x0, y0, z0, x1, y1, z1, draw, o = {}) { return this.add(o.kind || 'prop', x0, y0, z0, x1, y1, z1, draw, o); }
  /* typowe rekwizyty z gotową bryłą (rozmiary w polach) */
  barrel(x, y, z = 0, s = 1) { return this.part(x - 0.09 * s, y - 0.09 * s, z, x + 0.09 * s, y + 0.09 * s, z + 0.2 * s, () => barrel(this.sc, x, y, z, s), { tag: 'beczka' }); }
  crate(x, y, s = 0.16, h = 0.16) { return this.part(x - s / 2, y - s / 2, 0, x + s / 2, y + s / 2, h, () => crate(this.sc, x, y, s, h), { tag: 'skrzynia' }); }
  sack(x, y, col, s = 1, z = 0) { return this.part(x - 0.08, y - 0.08, z, x + 0.08, y + 0.08, z + 0.22, () => sack(this.sc, x, y, col, s, z), { tag: 'worek', shadow: false }); }
  logs(x, y) { return this.part(x - 0.18, y - 0.08, 0, x + 0.18, y + 0.08, 0.25, () => logPile(this.sc, x, y), { tag: 'stos', shadow: false }); }
  hay(x, y) { return this.part(x - 0.22, y - 0.22, 0, x + 0.22, y + 0.22, 0.5, () => haystack(this.sc, x, y), { tag: 'stóg' }); }
  skep(x, y, s = 1) { return this.part(x - 0.08 * s, y - 0.08 * s, 0, x + 0.08 * s, y + 0.08 * s, 0.2 * s, () => skep(this.sc, x, y, s), { tag: 'ul', shadow: false }); }
  stairs(xa, xb, y, n, h, mat = 'stone', d = 0.14, pal) { return this.part(xa, y, 0, xb, y + n * d, h, () => stairs(this.sc, xa, xb, y, n, h, mat, d, pal), { tag: 'schody', kind: 'box', shadow: false }); }
  chimney(cx, cy, zb, zt, w = 0.26, mat = 'stone', pal) { return this.part(cx - w / 2 - 0.035, cy - w / 2 - 0.035, zb, cx + w / 2 + 0.035, cy + w / 2 + 0.035, zt + 0.07, () => chimney(this.sc, cx, cy, zb, zt, w, mat, pal), { tag: 'komin', kind: 'box', shadow: false }); }

  /* komin osadzony w połaci dwuspadowej roof (te same opcje co w gable()), w punkcie (x,y); h — wysokość nad połacią */
  chim(roof, x, y, h = 0.7, w = 0.26, mat = 'stone', pal) {
    const zb = gableZ(roof, x, y) - 0.1;
    return this.part(x - w / 2 - 0.035, y - w / 2 - 0.035, zb, x + w / 2 + 0.035, y + w / 2 + 0.035, zb + h + 0.17, () => { chimney(this.sc, x, y, zb, zb + h + 0.1, w, mat, pal); soot(this.sc, x, y, zb + 0.05, w * 0.8, 0.45); }, { tag: 'komin', kind: 'box' });
  }

  /* ---------- cienie i kontakt z ziemią: jedna suma kształtów, więc zakładki nie ciemnieją podwójnie ---------- */
  shadows(o = {}) {
    const sc = this.sc, sd = o.dir || SHADOW_DIR, polys = [], cont = [];
    for (const n of this.nodes) {
      if (n.shadow && n.z1 - Math.max(0, n.z0) > 0.1) {
        const pts = n.pts || [[n.x0, n.y0, n.z0], [n.x1, n.y0, n.z0], [n.x1, n.y1, n.z0], [n.x0, n.y1, n.z0], [n.x0, n.y0, n.z1], [n.x1, n.y0, n.z1], [n.x1, n.y1, n.z1], [n.x0, n.y1, n.z1]];
        const gnd = n.z0 > 0.3 ? [] : [];                                                                                        // bryły oderwane od ziemi (okapy) rzucają cień tak samo
        polys.push(convexHull(pts.concat(gnd).map(([x, y, z]) => sc.P(x + z * sd[0], y + z * sd[1], 0))));
      }
      if (n.contact) cont.push([n.x0, n.y0, n.x1, n.y1]);
    }
    if (polys.length) softFill(sc.gu, g => { for (const h of polys) { h.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); } }, `rgba(14,22,8,${o.alpha ?? 0.5})`, (o.blur ?? 9) * sc.F);
    if (cont.length) { const e = 0.05, P = (x, y) => sc.P(x, y, 0); softFill(sc.gu, g => { for (const [x0, y0, x1, y1] of cont) { [[x0 - e, y0 - e], [x1 + e, y0 - e], [x1 + e, y1 + e], [x0 - e, y1 + e]].forEach(([x, y], i) => { const p = P(x, y); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); } }, `rgba(10,12,4,${o.contact ?? 0.5})`, (o.cblur ?? 6) * sc.F); }
  }

  /* ---------- kolejność rysowania ---------- */
  sort() {
    const sc = this.sc, N = this.nodes, n = N.length, eps = 0.015;
    N.forEach(a => { a.h = convexHull([a.x0, a.x1].flatMap(x => [a.y0, a.y1].flatMap(y => [a.z0, a.z1].map(z => sc.P(x, y, z))))); });
    const pred = N.map(() => []), succ = N.map(() => []);
    const link = (a, b, w) => { succ[a.i].push(b.i); pred[b.i].push([a.i, w]); };                                           // a przed b; w — głębokość zachodzenia (siła ograniczenia)
    const front = (p, q) => p.x0 >= q.x1 - eps || p.y0 >= q.y1 - eps || p.z0 >= q.z1 - eps;                                   // p bliżej widza niż q
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = N[i], b = N[j], w = hullDepth(a.h, b.h); if (!w) continue;
      const af = front(a, b), bf = front(b, a);
      if (af && !bf) link(b, a, w); else if (bf && !af) link(a, b, w); else link(a, b, 0.5);                                 // przenikanie / brak relacji → kolejność autora (słabe ograniczenie)
    }
    const out = [], done = new Array(n).fill(false), deg = pred.map(p => p.length);
    for (let k = 0; k < n; k++) {
      let pick = -1; for (let i = 0; i < n; i++) if (!done[i] && deg[i] === 0) { pick = i; break; }
      if (pick < 0) {                                                                                                          // cykl → bierzemy węzeł z najsłabszymi niespełnionymi ograniczeniami
        let bw = 1e18; for (let i = 0; i < n; i++) if (!done[i]) { const w = pred[i].reduce((s, [q, ww]) => s + (done[q] ? 0 : ww), 0); if (w < bw) { bw = w; pick = i; } }
        if (LINT && bw > 1) LINT_LOG.push({ b: LINT_NAME, kind: 'cykl', msg: `cykl w kolejności rysowania przy ${N[pick].kind}#${pick}${N[pick].tag ? '[' + N[pick].tag + ']' : ''} (siła pominiętych ograniczeń ${bw.toFixed(1)} px)` });
      }
      done[pick] = true; out.push(N[pick]); for (const j of succ[pick]) deg[j]--;
    }
    return out;
  }
  /* kończy budowę: cienie, kolejność, rysowanie, sprite */
  flush(o = {}) {
    if (o.shadow !== false) this.shadows(o.shadow || {});
    for (const n of this.sort()) { this.sc.grp = n.i; this.sc.grpTag = n.tag; n.draw(); }
    this.sc.grp = -1; this.sc.grpTag = '';
    return this.sc.finish(o.finish || {});
  }
}

/* ---------- układ elewacji: drzwi + równo rozmieszczone okna ----------
   W — ściana {O,U,V}; s.door = {at (0..1 środek drzwi), w, h, vb (podstawa), arch, frame, pal, lintel};
   s.win = {n, w, h, v (górna krawędź od góry ściany), kind: 'rect' | 'arch' | 'glass', shut, frame, sill, lit, lit2, grille};
   s.marg — minimalny odstęp od narożników, s.gap — od drzwi i między oknami (liczone z okiennicami). Zwraca {win:[{u0,w,h,v0}], door:{u0,w}} */
function facade(sc, W, s = {}) {
  const lu = Math.hypot(...W.U), lv = Math.hypot(...W.V), marg = s.marg ?? 0.16, gap = s.gap ?? 0.12, res = { win: [], door: null };
  let spans = [[marg, lu - marg]];
  if (s.door) {
    const d = s.door, dw = d.w ?? 0.36, u0 = (d.at ?? 0.5) * lu - dw / 2, dh = d.h ?? 0.66, vb = d.vb ?? lv;
    door(sc, W.O, W.U, W.V, u0, dw, dh, { vb, arch: d.arch, frame: d.frame, pal: d.pal, lintel: d.lintel });
    res.door = { u0, w: dw, h: dh };
    spans = [[marg, u0 - gap - (d.arch || d.lintel ? 0.04 : 0)], [u0 + dw + gap + (d.arch || d.lintel ? 0.04 : 0), lu - marg]].filter(([a, b]) => b - a > 0.08);
  }
  const w = s.win; if (w && w.over) spans = [[marg, lu - marg]];                                                          // okna nad drzwiami (np. wieża): przęsło całej ściany
  if (!w || !(w.n > 0) || !spans.length) return res;
  const kind = w.kind || 'rect', ww = w.w ?? 0.2, hh = w.h ?? 0.3, occ = kind === 'rect' && w.shut ? ww * 1.84 + 0.024 : ww + 0.03;     // zajęta szerokość z okiennicami
  // przydział okien do przęseł: proporcjonalnie do szerokości, nie więcej niż się mieści
  const cap = spans.map(([a, b]) => Math.max(0, Math.floor((b - a + gap) / (occ + gap)))), tot = spans.reduce((q, [a, b]) => q + (b - a), 0);
  let left = Math.min(w.n, cap.reduce((q, c) => q + c, 0));
  if (LINT && left < w.n) LINT_LOG.push({ b: LINT_NAME, kind: 'okna', msg: `elewacja ${lu.toFixed(2)}×${lv.toFixed(2)}: miejsce tylko na ${left} z ${w.n} okien` });
  let alloc = spans.map(([a, b], i) => Math.min(cap[i], Math.round(w.n * (b - a) / tot)));
  let sum = alloc.reduce((q, c) => q + c, 0);
  for (let i = 0; sum > left && i < 99; i++) { const k = alloc.indexOf(Math.max(...alloc)); alloc[k]--; sum--; }
  for (let i = 0; sum < left && i < 99; i++) { const k = alloc.findIndex((c, q) => c < cap[q]); if (k < 0) break; alloc[k]++; sum++; }
  spans.forEach(([a, b], si) => {
    const k = alloc[si]; for (let i = 0; i < k; i++) {
      const uc = a + (b - a) * (i + 0.5) / k, u0 = uc - ww / 2, idx = res.win.length, o = { ...w, glow: typeof w.glow === 'function' ? w.glow(idx) : w.glow, shutters: kind === 'rect' ? (typeof w.shut === 'function' ? w.shut(idx) : w.shut) : undefined };
      if (kind === 'arch') archWin(sc, W.O, W.U, W.V, u0, w.v ?? 0.2, ww, hh, o); else if (kind === 'glass') glassWin(sc, W.O, W.U, W.V, u0, w.v ?? 0.3, ww, hh, o); else windowAt(sc, W.O, W.U, W.V, u0, w.v ?? 0.2, ww, hh, o);
      res.win.push({ u0, w: ww, h: hh, v0: w.v ?? 0.2, idx });
      if (w.each) w.each(res.win[idx], idx);
    }
  });
  return res;
}
