/* ====================== INTERFEJS DLA GRY ======================
   Ten plik jest doklejany do silnika WYŁĄCZNIE przez build_game.js (blok `Sprites` w Nova_Roma.html) — grafika_prototyp.html go nie zawiera.
   Silnik (00_util … 54_slavs) ładuje się bez DOM i bez wypieku; sprite'y powstają dopiero w bake(), po wyborze nacji. */
const SPR = {}, SETS = {};                                          // wypieczone sprite'y budynków (nazwa → sprite) i zestawy przyrody / postaci
const CLIMATE = { franks: 'grass', slavs: 'grass', vikings: 'tundra', saracens: 'sand' };
const FIG = 0.85;                                                   // skala postaci względem sprite'ów budynków
let bakedFor = null, bakeMs = 0;                                    // nacja, której sprite'y leżą w pamięci; czas ostatniego wypieku

/* jakość: 2 = ostre duże budynki także po przybliżeniu (pulpit), 1 = lżej (telefon, mało pamięci) */
function setQuality(q) { RES = q >= 2 ? 2 : 1; TEXRES = RES >= 2 ? 2 : 1; }
const quality = () => RES;
const nextPaint = () => new Promise(r => { let ok = false; const f = () => { if (!ok) { ok = true; r(); } }; if (typeof requestAnimationFrame === 'function') requestAnimationFrame(f); setTimeout(f, 60); });
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/* zestaw przyrody dla klimatu nacji: [nazwa zestawu, liczba, generator] */
function natureJobs(climate) {
  const many = (set, n, fn) => Array.from({ length: n }, (_, i) => ['Przyroda', () => { (SETS[set] = SETS[set] || []).push(fn(i + 1)); }]);
  const jobs = [];
  if (climate === 'grass') jobs.push(...many('oaks', 5, i => TREES.oak(100 + i)), ...many('pines', 4, i => TREES.pine(200 + i)), ...many('tufts', 4, i => bakeTuft(500 + i, 'green')));
  else if (climate === 'tundra') jobs.push(...many('pines', 6, i => TREES.pine(200 + i)), ...many('oaks', 2, i => TREES.oak(100 + i)), ...many('tufts', 4, i => bakeTuft(500 + i, 'green')));
  else jobs.push(...many('palms', 4, i => TREES.palm(300 + i)), ...many('tufts', 3, i => bakeTuft(600 + i, 'sand')));
  jobs.push(...many('rocks', 4, i => bakeRock(400 + i)));
  return jobs;
}
const castKeys = nation => Object.keys(CAST).filter(k => k.startsWith({ franks: 'frank', saracens: 'sar', vikings: 'vik', slavs: 'slav' }[nation]));

/* Wypiek sprite'ów wybranej nacji + przyrody jej klimatu + jej mieszkańców. Zwraca Promise; onProgress(0..1, etykieta) co kilkadziesiąt ms.
   Poprzednia nacja jest zwalniana (jedna nacja w pamięci naraz). */
async function bake(nation, onProgress = null) {
  if (!NATIONS[nation]) throw new Error('Nieznana nacja: ' + nation);
  if (bakedFor === nation) return SPR;
  const t0 = now();
  for (const k of Object.keys(SPR)) delete SPR[k];
  for (const k of Object.keys(SETS)) delete SETS[k];
  bakedFor = null;
  const jobs = [];
  for (const id of NATIONS[nation]) { const n = spriteName(nation, id); if (BAKED[n]) jobs.push(['Budynki', () => { LINT_NAME = n; SPR[n] = BAKED[n](); }]); }
  jobs.push(...natureJobs(CLIMATE[nation]));
  for (const key of castKeys(nation)) jobs.push(['Mieszkańcy', () => { (SETS.cast = SETS.cast || {})[key] = bakeCast(key, FIG); }]);
  let last = 0;
  for (let i = 0; i < jobs.length; i++) {
    if (onProgress && now() - last > 40) { onProgress(i / jobs.length, jobs[i][0]); await nextPaint(); last = now(); }
    jobs[i][1]();
  }
  if (onProgress) onProgress(1, 'Gotowe');
  bakedFor = nation; bakeMs = now() - t0;
  return SPR;
}

/* narysowanie warstwy sprite'a ('p' plac, 'u' cień, 'c' obiekt) w punkcie ekranu (sx, sy) = środek obrysu na ziemi; k = px ekranu na px logiczny sprite'a */
function draw(ctx, spr, layer, sx, sy, k) {
  const im = spr[layer]; if (!im) return;
  ctx.drawImage(lodPick(im, (layer === 'u' ? (spr.Ru ?? spr.R) : layer === 'p' ? (spr.Rp ?? spr.R) : spr.R) / k), sx - spr.ax * k, sy - spr.ay * k, spr.w * k, spr.h * k);
}

return {
  version: 'v4', S, AX, AY, VH, FIG,
  setQuality, quality, bake, draw,
  baked: () => bakedFor, bakeMs: () => bakeMs,
  ids: nation => NATIONS[nation].slice(), name: nameOfBuilding, nations: () => Object.keys(NATIONS),
  get: (nation, id) => SPR[spriteName(nation, id)] || null,
  spr: SPR, sets: SETS, castKeys, cast: key => (SETS.cast || {})[key] || null,
  catalog: catalogJSON,
  /* niskopoziomowe elementy silnika dla modułów gry (teren, zwierzęta…): sceny ze zdobieniami terenu, tekstury, generatory */
  engine: { Scene, tex, GEN, TREES, CAST, bakeCast, bakeRock, bakeTuft, newCanvas, lodPick, rng, hex, css, mixc, scaleC, clamp, lerp, TAU, BAKED, softFill, fbm, periodicNoise }
};
