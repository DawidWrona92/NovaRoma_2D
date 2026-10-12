/* ====================== MURY OBRONNE (Punkt 13): segmenty 1×1 pole w 16 wariantach sąsiedztwa ======================
   Sprite `${nacja}_wall@${maska}` (maska 0 = `${nacja}_wall`): bity N=1 (−y), E=2 (+x), S=4 (+y), W=8 (−x) mówią, ku którym sąsiednim polom biegnie mur. Ramiona mają wspólne pozycje blanek / pali na krawędziach pola,
   więc sąsiednie segmenty zlewają się w ciągły mur. Frankowie i Saraceni: ten sam kamień, blanki i wieżyczki co w ich zamkach (wieżyczka na zakrętach, rozgałęzieniach i końcach); Wikingowie i Słowianie: palisada z zaostrzonych pali. */
const WALL_T = 0.17, WALL_POS = [-0.425, -0.255, -0.085, 0.085, 0.255, 0.425];                // połowa grubości muru; pozycje blanek wzdłuż osi (krok 0,17 — ciągłość między polami)
const WALL_STYLE = {
  franks: { zc: 0.85, hgt: 2.3, mat: 'stone', pal: null, towerPal: '#9d9a90' },
  saracens: { zc: 0.8, hgt: 2.0, mat: 'sandstone', pal: SR.sand, towerPal: '#e4cf9e' },
  vikings: { zc: 0.8, hgt: 1.5, pal: '#6a4a2c', post: '#4a3220' },
  slavs: { zc: 0.7, hgt: 1.4, pal: '#a07040', post: '#7a5430' }
};
function wallPiece(n, mask) {
  const st = WALL_STYLE[n], sc = sceneFor(1, 1, st.hgt), B = new Build(sc), t = WALL_T, zc = st.zc, bits = [mask & 1, mask & 2, mask & 4, mask & 8], cnt = bits.filter(Boolean).length;
  const straight = mask === 5 || mask === 10, tower = !straight;                           // prosty odcinek bez wieżyczki; reszta (zakręt, koniec, rozgałęzienie, słupek) ją ma
  const arm = (x0, y0, x1, y1) => {                                                      // ramię od (x0,y0) do (x1,y1) — oś x albo y
    const horiz = y0 === y1;
    if (st.mat) {
      const o = { ao: 0.3, nest: true }; if (st.pal) o.pal = st.pal;
      if (horiz) B.box(Math.min(x0, x1), y0 - t, 0, Math.max(x0, x1), y0 + t, zc, st.mat, o); else B.box(x0 - t, Math.min(y0, y1), 0, x0 + t, Math.max(y0, y1), zc, st.mat, o);
      const lo = Math.min(horiz ? x0 : y0, horiz ? x1 : y1), hi = Math.max(horiz ? x0 : y0, horiz ? x1 : y1), ps = WALL_POS.filter(p => p > lo + 0.02 && p < hi - 0.02 && (!tower || Math.abs(p) > 0.3));
      if (ps.length) { const a = ps[0], b = ps[ps.length - 1];
        const [mx0, my0, mx1, my1] = horiz ? [a, y0, b, y0] : [x0, a, x0, b];
        B.part(Math.min(mx0, mx1) - 0.05, Math.min(my0, my1) - 0.05, zc, Math.max(mx0, mx1) + 0.05, Math.max(my0, my1) + 0.05, zc + 0.13, () => merlonLine(sc, mx0, my0, mx1, my1, zc, ps.length, 0.1, 0.13, st.mat), { tag: 'blanki', shadow: false, nest: true }); }
    } else B.palisade(x0, y0, x1, y1, zc, 0, st.pal);
  };
  const lines = [];                                                                       // [x0,y0,x1,y1]
  if (bits[0] && bits[2]) lines.push([0, -0.5, 0, 0.5]); else { if (bits[0]) lines.push([0, -0.5, 0, 0]); if (bits[2]) lines.push([0, 0, 0, 0.5]); }
  if (bits[1] && bits[3]) lines.push([-0.5, 0, 0.5, 0]); else { if (bits[1]) lines.push([0, 0, 0.5, 0]); if (bits[3]) lines.push([-0.5, 0, 0, 0]); }
  for (const l of lines) arm(...l);
  if (tower) {
    if (st.mat === 'stone') {                                                             // wieżyczka jak baszta Dworu Franków: kamienny walec, wieniec i czerwony stożek
      B.cyl(0, 0, 0, zc + 0.3, 0.27, { mat: 'stone', pal: st.towerPal, topMat: 'stone', ao: 0.45, nest: true });
      B.cyl(0, 0, zc + 0.26, zc + 0.36, 0.32, { mat: 'stone', pal: '#8c897f', topMat: 'stone', ao: 0, top: false, nest: true });
      B.cone(0, 0, zc + 0.36, 0.34, 0.62, [168, 62, 40], { nest: true });
    } else if (st.mat === 'sandstone') {                                                  // wieżyczka jak baszta Pałacu Saracenów: piaskowiec i mała kopuła
      B.cyl(0, 0, 0, zc + 0.3, 0.27, { mat: 'sandstone', pal: st.towerPal, topMat: 'sandstone', ao: 0.45, nest: true });
      B.dome(0, 0, zc + 0.3, 0.31, { cols: SR.domeSand, nest: true });
    } else {                                                                              // palisada: wyższy, grubszy słup narożny z okrągłym zwieńczeniem
      B.box(-0.1, -0.1, 0, 0.1, 0.1, zc + 0.28, 'bark', { ao: 0.2, pal: st.post, nest: true });
      B.box(-0.12, -0.12, zc + 0.28, 0.12, 0.12, zc + 0.36, 'bark', { ao: 0.1, pal: st.pal, nest: true });
    }
  }
  return B.flush();
}
for (const n of Object.keys(WALL_STYLE)) {
  BAKED[n + '_wall'] = () => wallPiece(n, 0);
  for (const m of WALL_MASKS) BAKED[`${n}_wall@${m}`] = () => wallPiece(n, m);
}

/* BRAMA 1×1 pole: przejście w murze. `gate` biegnie osią wschód–zachód (przechodzi się z północy na południe), `gate@1` osią północ–południe. Dwie baszty (Frankowie, Saraceni) albo dwa słupy z belką (Wikingowie, Słowianie)
   stoją na krawędziach pola, więc łączą się z sąsiednimi odcinkami muru; między nimi przejście jest otwarte (widać przez nie teren). */
function gatePiece(n, ns) {
  const st = WALL_STYLE[n], sc = sceneFor(1, 1, st.hgt + 0.2), B = new Build(sc), zc = st.zc, A = (a, b) => ns ? [b, a] : [a, b];
  const box = (x0, y0, z0, x1, y1, z1, m, o, deco) => { const [a, b] = A(x0, y0), [c, d] = A(x1, y1); return B.box(Math.min(a, c), Math.min(b, d), z0, Math.max(a, c), Math.max(b, d), z1, m, o, deco); };
  const cyl = (cx, cy, z0, z1, r, o) => { const [a, b] = A(cx, cy); return B.cyl(a, b, z0, z1, r, o); };
  const pier = 0.34, zt = zc + 0.35;
  if (st.mat) {
    const stone = st.mat === 'stone', o = { ao: 0.3, nest: true }; if (st.pal) o.pal = st.pal;
    for (const sx of [-pier, pier]) {
      cyl(sx, 0, 0, zt, 0.17, { mat: st.mat, pal: st.towerPal, topMat: st.mat, ao: 0.45, nest: true });
      if (stone) B.cone(...A(sx, 0), zt, 0.23, 0.45, [168, 62, 40], { nest: true });
      else B.dome(...A(sx, 0), zt, 0.2, { cols: SR.domeSand, nest: true });
    }
    box(-0.34, -0.15, zc - 0.28, 0.34, 0.15, zc, st.mat, o);                                 // nadproże nad przejściem
    const [mx0, my0] = A(-0.255, 0), [mx1, my1] = A(0.255, 0);
    B.part(Math.min(mx0, mx1) - 0.05, Math.min(my0, my1) - 0.05, zc, Math.max(mx0, mx1) + 0.05, Math.max(my0, my1) + 0.05, zc + 0.13, () => merlonLine(sc, mx0, my0, mx1, my1, zc, 4, 0.1, 0.13, st.mat), { tag: 'blanki', shadow: false, nest: true });
  } else {
    for (const sx of [-pier, pier]) {
      box(sx - 0.07, -0.07, 0, sx + 0.07, 0.07, zc + 0.55, 'bark', { ao: 0.2, pal: st.post, nest: true });
      box(sx - 0.09, -0.09, zc + 0.55, sx + 0.09, 0.09, zc + 0.65, 'bark', { ao: 0.1, pal: st.pal, nest: true });
    }
    box(-0.42, -0.05, zc + 0.3, 0.42, 0.05, zc + 0.4, 'log', { ao: 0.2, pal: st.post, nest: true });   // belka poprzeczna nad przejściem
    for (const sgn of [-1, 1]) B.palisade(...A(sgn * 0.5, 0), ...A(sgn * 0.42, 0), zc, 0, st.pal);
  }
  return B.flush();
}
for (const n of Object.keys(WALL_STYLE)) { BAKED[n + '_gate'] = () => gatePiece(n, false); BAKED[n + '_gate@1'] = () => gatePiece(n, true); }
