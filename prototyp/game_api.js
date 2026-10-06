/* ====================== INTERFEJS DLA GRY ======================
   Ten plik jest doklejany do silnika WYŁĄCZNIE przez build_game.js (blok `Sprites` w Nova_Roma.html) — grafika_prototyp.html go nie zawiera.
   Silnik (00_util … 54_slavs) ładuje się bez DOM i bez wypieku; sprite'y powstają dopiero w bake(), po wyborze nacji. */
const SPR = {}, SETS = {};                                          // wypieczone sprite'y budynków (nazwa → sprite) i zestawy przyrody / postaci
const NATIVE = { franks: 'temperate', saracens: 'desert', vikings: 'snow', slavs: 'eastern' };      // domyślny klimat nacji
const FIG = 0.85;                                                   // skala postaci względem sprite'ów budynków
let bakedFor = null, bakedKey = null, bakeMs = 0;                  // nacja, której sprite'y leżą w pamięci (klucz: nacja|klimat); czas ostatniego wypieku

/* jakość: 2 = ostre duże budynki także po przybliżeniu (pulpit), 1 = lżej (telefon, mało pamięci) */
function setQuality(q) { RES = q >= 2 ? 2 : 1; TEXRES = RES >= 2 ? 2 : 1; }
const quality = () => RES;
const nextPaint = () => new Promise(r => { let ok = false; const f = () => { if (!ok) { ok = true; r(); } }; if (typeof requestAnimationFrame === 'function') requestAnimationFrame(f); setTimeout(f, 60); });
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/* zestaw przyrody dla klimatu mapy: [nazwa zestawu, liczba, generator]; zestawy: oaks, pines, birches, winters, palms (drzewa), shrubs, cacti, reeds (rośliny),
   cliffs (bloki klifów), rocks (głazy), tufts (kępy trawy) */
function natureJobs(climate) {
  const many = (set, n, fn) => Array.from({ length: n }, (_, i) => ['Przyroda', () => { (SETS[set] = SETS[set] || []).push(fn(i + 1)); }]);
  const cliffPal = { temperate: 'rock', eastern: 'rock', snow: 'snow', desert: 'sand' }[climate] || 'rock';
  const jobs = [];
  if (climate === 'temperate') jobs.push(...many('oaks', 5, i => TREES.oak(100 + i)), ...many('pines', 4, i => TREES.pine(200 + i)), ...many('shrubs', 3, i => TREES.shrub(800 + i, 'green')), ...many('tufts', 4, i => bakeTuft(500 + i, 'green')), ...many('reeds', 3, i => bakeReeds(900 + i)));
  else if (climate === 'eastern') jobs.push(...many('birches', 5, i => TREES.birch(150 + i)), ...many('pines', 4, i => TREES.pine(200 + i)), ...many('oaks', 3, i => TREES.oak(100 + i)), ...many('shrubs', 2, i => TREES.shrub(800 + i, 'green')), ...many('tufts', 4, i => bakeTuft(520 + i, 'steppe')), ...many('reeds', 4, i => bakeReeds(900 + i)));
  else if (climate === 'snow') jobs.push(...many('pines', 6, i => TREES.pine(200 + i, 0.8, { snow: true })), ...many('winters', 3, i => TREES.winter(250 + i)), ...many('shrubs', 2, i => TREES.shrub(800 + i, 'snow')), ...many('tufts', 3, i => bakeTuft(540 + i, 'snow')));
  else jobs.push(...many('palms', 4, i => TREES.palm(300 + i)), ...many('shrubs', 4, i => TREES.shrub(800 + i, 'dry')), ...many('cacti', 3, i => TREES.cactus(850 + i)), ...many('tufts', 3, i => bakeTuft(600 + i, 'sand')), ...many('reeds', 3, i => bakeReeds(900 + i)));
  const roadCol = { temperate: '#8a6e40', eastern: '#7a6242', snow: '#a29a8c', desert: '#c4a468' }[climate] || '#8a6e40';
  jobs.push(...many('cliffs', 4, i => bakeCliff(950 + i, cliffPal)), ...many('rocks', 4, i => bakeRock(400 + i)), ...many('roads', 3, i => bakeRoadPatch(1000 + i, roadCol)));
  return jobs;
}
/* złoża (kamień, żelazo, węgiel, glina, torf): skała w barwie złoża + znaki rozpoznawcze (rudne żyły, błyski węgla, wilgotny połysk gliny, mech na torfie) */
const DEPOSIT_COL = { stone: '#8e8c84', iron: '#86594a', coal: '#2c2c32', clay: '#b9774c', peat: '#4a3a2a' };
function bakeDeposit(kind, seed) {
  const o = bakeRock(seed, DEPOSIT_COL[kind], 0.8), g = o.c.getContext('2d'), r = rng(seed * 7 + kind.length);
  g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70; i++) {
    const x = 40 + r() * 64, y = 40 + r() * 42, l = 2 + r() * 5;
    if (kind === 'iron') { g.fillStyle = r() < 0.5 ? 'rgba(222,170,98,0.85)' : 'rgba(120,48,28,0.8)'; g.fillRect(x, y, l, 1.4 + r() * 1.6); }
    else if (kind === 'coal') { g.fillStyle = r() < 0.4 ? 'rgba(210,214,224,0.55)' : 'rgba(0,0,0,0.5)'; g.fillRect(x, y, 1.5 + r() * 2.5, 1.5 + r() * 2.5); }
    else if (kind === 'clay') { g.fillStyle = r() < 0.5 ? 'rgba(255,214,170,0.35)' : 'rgba(110,52,28,0.4)'; g.beginPath(); g.ellipse(x, y, l, 1.2 + r() * 1.5, 0, 0, TAU); g.fill(); }
    else if (kind === 'peat') { g.fillStyle = r() < 0.4 ? 'rgba(86,128,50,0.6)' : 'rgba(20,12,6,0.55)'; g.beginPath(); g.ellipse(x, y, l * 0.8, 1.6, 0, 0, TAU); g.fill(); }
  }
  g.restore();
  return o;
}
const castKeys = nation => Object.keys(CAST).filter(k => k.startsWith({ franks: 'frank', saracens: 'sar', vikings: 'vik', slavs: 'slav' }[nation]));

/* Wypiek sprite'ów wybranej nacji + przyrody klimatu mapy (opts.climate: temperate|eastern|snow|desert; domyślnie klimat nacji) + jej mieszkańców.
   opts.deposits — rodzaje złóż do wypieku. Zwraca Promise; onProgress(0..1, etykieta) co kilkadziesiąt ms. Jedna nacja w pamięci naraz. */
async function bake(nation, onProgress = null, opts = {}) {
  if (!NATIONS[nation]) throw new Error('Nieznana nacja: ' + nation);
  const climate = opts.climate || NATIVE[nation], key = nation + '|' + climate;
  if (bakedKey === key) return SPR;
  const t0 = now();
  for (const k of Object.keys(SPR)) delete SPR[k];
  for (const k of Object.keys(SETS)) delete SETS[k];
  bakedFor = null; bakedKey = null;
  const jobs = [];
  for (const id of NATIONS[nation]) { const n = spriteName(nation, id); if (BAKED[n]) jobs.push(['Budynki', () => { LINT_NAME = n; SPR[n] = BAKED[n](); }]); }
  jobs.push(...natureJobs(climate));
  for (const kind of opts.deposits || []) jobs.push(['Złoża', () => { (SETS.deposits = SETS.deposits || {})[kind] = bakeDeposit(kind, 700 + kind.length); }]);
  for (const key of castKeys(nation)) jobs.push(['Mieszkańcy', () => { (SETS.cast = SETS.cast || {})[key] = bakeCast(key, FIG); }]);
  for (const kind of faunaKinds(climate)) jobs.push(['Zwierzęta', () => { (SETS.fauna = SETS.fauna || {})[kind] = bakeFauna(kind, 1); }]);   // fauna wg klimatu mapy (foka też — czy się pojawi, rozstrzyga gra)
  let last = 0;
  for (let i = 0; i < jobs.length; i++) {
    if (onProgress && now() - last > 40) { onProgress(i / jobs.length, jobs[i][0]); await nextPaint(); last = now(); }
    jobs[i][1]();
  }
  if (onProgress) onProgress(1, 'Gotowe');
  bakedFor = nation; bakedKey = key; SETS.climate = climate; bakeMs = now() - t0;
  return SPR;
}

/* narysowanie warstwy sprite'a ('p' plac, 'u' cień, 'c' obiekt) w punkcie (sx, sy) = środek obrysu na ziemi;
   k = jednostek płótna na px logiczny sprite'a (przy skali płótna `dpr` — dobór mipmapy liczy się w px urządzenia) */
function draw(ctx, spr, layer, sx, sy, k, dpr = 1) {
  const im = spr[layer]; if (!im) return;
  ctx.drawImage(lodPick(im, (layer === 'u' ? (spr.Ru ?? spr.R) : layer === 'p' ? (spr.Rp ?? spr.R) : spr.R) / (k * dpr)), sx - spr.ax * k, sy - spr.ay * k, spr.w * k, spr.h * k);
}

return {
  version: 'v4', S, AX, AY, VH, FIG,
  setQuality, quality, bake, draw, sort: sortDrawables,
  baked: () => bakedFor, bakeMs: () => bakeMs,
  ids: nation => NATIONS[nation].slice(), name: nameOfBuilding, nations: () => Object.keys(NATIONS),
  get: (nation, id) => SPR[spriteName(nation, id)] || null,
  spr: SPR, sets: SETS, castKeys, cast: key => (SETS.cast || {})[key] || null, faunaKinds, fauna: kind => (SETS.fauna || {})[kind] || null,
  catalog: catalogJSON,
  makeGround: (map, o) => new Ground(map, o), GCH,
  /* niskopoziomowe elementy silnika dla modułów gry (teren, zwierzęta…): sceny ze zdobieniami terenu, tekstury, generatory */
  engine: { Scene, tex, GEN, TREES, CAST, bakeCast, bakeRock, bakeTuft, bakeCliff, bakeReeds, newCanvas, lodPick, rng, hex, css, mixc, scaleC, clamp, lerp, TAU, BAKED, softFill, fbm, periodicNoise }
};
