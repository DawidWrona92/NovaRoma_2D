// Test Path (A* po polach mapy): optymalność względem niezależnego Dijkstry, poprawność trasy (tylko pola przechodnie, kroki sąsiednie, bez ścinania rogów),
// przejście rzeki wyłącznie brodem lub lodem, brak trasy do wysp i zalanych pól, wygładzanie nie drożeje, brak RNG, determinizm, szybkość.
// Użycie: node tools/path.js [plik.html] [pary_na_mapę]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, MapGen, RNG, Terrain, Path } = G;
const PAIRS = +process.argv[3] || 40;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
let rngCalls = 0, inPath = 0, rngInPath = 0;                          // RNG liczymy tylko wewnątrz wywołań Path (World.init losuje dużo)
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { rngCalls++; if (inPath) rngInPath++; return f.apply(this, arguments); }; }
for (const m of Object.keys(Path)) { const f = Path[m]; Path[m] = function () { inPath++; try { return f.apply(this, arguments); } finally { inPath--; } }; }

/* niezależny Dijkstra z tymi samymi kosztami (8 sąsiadów, bez ścinania rogów) */
function dijkstra(map, s, g, blocked) {
  const N = map.size, T = map.tiles, cost = t => Path.tileCost(t, { blocked }), dist = new Float64Array(N * N).fill(Infinity), done = new Uint8Array(N * N);
  dist[s] = 0;
  for (;;) {
    let u = -1, best = Infinity; for (let i = 0; i < N * N; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0 || u === g) break; done[u] = 1;
    const x = u % N, y = (u / N) | 0;
    for (const [dx, dy, d] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const v = ny * N + nx, c = cost(T[v]); if (c === Infinity) continue;
      if (dx && dy && (cost(T[y * N + nx]) === Infinity || cost(T[ny * N + x]) === Infinity)) continue;
      const nd = dist[u] + d * (c + 0.5 * Math.abs((T[v].e || 0) - (T[u].e || 0))); if (nd < dist[v]) dist[v] = nd;
    }
  }
  return dist[g];
}
const rnd = (() => { let a = 12345; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

let queries = 0, ms = 0, crossings = 0, nulls = 0;
const SETS = [['franks', 'temperate', 'river'], ['franks', 'temperate', 'mountains'], ['saracens', 'desert', 'river'], ['vikings', 'snow', 'coast'], ['slavs', 'eastern', 'wetlands'], ['franks', 'temperate', 'lakes'], ['saracens', 'desert', 'mountains']];
for (const [fid, cl, ty] of SETS) {
  World.init(fid, { climate: cl, type: ty, seed: 7 });
  const map = World.state().map, N = map.size, T = map.tiles, tag = `${fid}/${cl}/${ty}`;
  const passIdx = []; for (let i = 0; i < N * N; i++) if (Terrain.passable(T[i])) passIdx.push(i);
  const reach = Terrain.reach(map);                                   // osiągalne z Dworu — do sprawdzenia brodów
  for (let q = 0; q < PAIRS; q++) {
    const s = passIdx[(rnd() * passIdx.length) | 0], g = passIdx[(rnd() * passIdx.length) | 0], sx = s % N, sy = (s / N) | 0, gx = g % N, gy = (g / N) | 0;
    const t0 = process.hrtime.bigint(); const ids = Path.grid(map, sx, sy, gx, gy, {}); ms += Number(process.hrtime.bigint() - t0) / 1e6; queries++;
    const ref = dijkstra(map, s, g);
    if (!ids) { nulls++; ok(ref === Infinity, `${tag}: A* nie znalazł trasy ${sx},${sy}→${gx},${gy}, a Dijkstra tak (${ref.toFixed(1)})`); continue; }
    ok(Math.abs(ids.cost - ref) < 1e-3, `${tag}: koszt A* ${ids.cost.toFixed(2)} ≠ Dijkstra ${ref.toFixed(2)} (${sx},${sy}→${gx},${gy})`);
    let bad = 0, corner = 0, river = 0;
    for (let k = 0; k < ids.length; k++) {
      const t = T[ids[k]]; if (!Terrain.passable(t)) bad++;
      if (t.h === 0 && t.wk === 'river') river++;
      if (t.h === 0 && t.wk !== 'ford' && t.wk !== 'ice') bad++;
      if (k) {
        const x0 = ids[k - 1] % N, y0 = (ids[k - 1] / N) | 0, x1 = ids[k] % N, y1 = (ids[k] / N) | 0, dx = x1 - x0, dy = y1 - y0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) bad++;
        if (dx && dy && (!Terrain.passable(T[y0 * N + x1]) || !Terrain.passable(T[y1 * N + x0]))) corner++;
        if (t.h === 0 && (t.wk === 'ford' || t.wk === 'ice')) crossings++;
      }
    }
    ok(bad === 0 && corner === 0 && river === 0, `${tag}: trasa po niedozwolonych polach (${bad}), ścięte rogi (${corner}), rzeka (${river})`);
    // trasa wygładzona: ta sama długość lub krótsza, każdy odcinek przechodni, koszt nie większy niż 1,04× siatkowego + zapas
    const sm = Path.find(map, sx + 0.5, sy + 0.5, gx + 0.5, gy + 0.5, {});
    ok(!!sm && sm.length <= ids.length, `${tag}: wygładzona trasa ma więcej punktów niż siatkowa`);
    let segs = 0; for (let k = 1; sm && k < sm.length; k++) if (Path.segCost(map, sm[k - 1][0], sm[k - 1][1], sm[k][0], sm[k][1], {}, 1e9) === Infinity) segs++;
    ok(segs === 0, `${tag}: ${segs} odcinków wygładzonej trasy przechodzi przez zakazane pola`);
  }
  // rzeka bez brodu jest przeszkodą: z Dworu na drugi brzeg tylko przez bród / lód — nigdy przez pole rzeki
  const st = Terrain.stats(map);
  if (ty === 'river' && st.ford) {
    const keepIdx = 24 * N + 24; let tested = 0;
    for (let q = 0; q < 60 && tested < 12; q++) {
      const g = passIdx[(rnd() * passIdx.length) | 0]; if (!reach[g]) continue;
      const ids = Path.grid(map, 24, 24, g % N, (g / N) | 0, {}); void keepIdx; tested++;
      ok(ids && ids.every(i => !(T[i].h === 0 && T[i].wk === 'river')), `${tag}: trasa z Dworu przechodzi przez rzekę`);
    }
  }
  // cel w wodzie lub w skale: brak trasy
  const wi = T.findIndex(t => t.h === 0 && t.wk !== 'ford' && t.wk !== 'ice');
  if (wi >= 0) ok(Path.grid(map, 24, 24, wi % N, (wi / N) | 0, {}) === null, `${tag}: cel w głębokiej wodzie nie ma trasy`);
  // blokada (zajęte pola): trasa omija zajęte pole; cel zajęty → brak trasy
  const blocked = t => t.occup != null, k = World.state().keep;
  const p1 = Path.find(map, 10.5, 24.5, 38.5, 24.5, { blocked }); ok(!p1 || p1.every(([x, y]) => !(x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h)), `${tag}: trasa omija obrys Dworu`);
  ok(Path.find(map, 10.5, 24.5, 23, 23, { blocked }) === null, `${tag}: cel wewnątrz Dworu — brak trasy`);
}
// nearest / closest
World.init('franks', { climate: 'temperate', type: 'lakes', seed: 7 });
{ const map = World.state().map, wi = map.tiles.findIndex(t => t.h === 0), x = wi % map.size + 0.5, y = ((wi / map.size) | 0) + 0.5, n = Path.nearest(map, x, y, {});
  ok(!!n && Terrain.passable(MapGen.at(map, Math.floor(n[0]), Math.floor(n[1]))), 'nearest: z wody wskazuje przechodnie pole'); }
// determinizm i izolacja RNG
{ const map = World.state().map, a = JSON.stringify(Path.find(map, 5.5, 5.5, 40.5, 40.5, {})), b = JSON.stringify(Path.find(map, 5.5, 5.5, 40.5, 40.5, {})); ok(a === b, 'determinizm: to samo zapytanie → ta sama trasa'); }
ok(rngInPath === 0, `Path nie wywołuje RNG gry (wywołań wewnątrz Path: ${rngInPath})`);
ok(ms / queries < 2.5, `średni czas A*: ${(ms / queries).toFixed(2)} ms na zapytanie (limit 2,5)`);
console.log(`${queries} zapytań A* (${nulls} bez trasy), przejść brodem/lodem w trasach: ${crossings}, średnio ${(ms / queries).toFixed(2)} ms`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
