// Test generatora terenu v2: macierz 4 nacje × 4 klimaty × 6 typów map (Wikingowie: tylko nadmorska) × kilka ziaren.
// Sprawdza: poprawność pól kafli, walidację generatora (łączność, drzewa, złoża, miejsce pod zabudowę, brody, brzeg Wikingów), płaski plac wokół Dworu,
// liczby drzew i złóż względem danych nacji, reguły canPlace dla cech terenu, determinizm (to samo ziarno → ta sama mapa)
// i izolację globalnego RNG (Terrain.apply nie wywołuje RNG gry — przeplot losowań logiki zostaje taki jak dotąd).
// Użycie: node tools/terrain.js [plik.html] [liczba_ziaren]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, MapGen, RNG, Terrain } = G;
const SEEDS = +process.argv[3] || 3;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 40) console.log('  ✘ ' + msg); } return c; };
const FACTIONS = ['franks', 'saracens', 'vikings', 'slavs'], CLIMATES = Object.keys(Data.CLIMATES), TYPES = Object.keys(Data.MAPTYPES);
const WK = ['sea', 'lake', 'river', 'ford', 'ice'], K = ['bog', 'dune', 'quick', 'oasis', 'cliff', 'drift'];
const sig = map => map.tiles.map(t => [t.h, t.e, t.wk || '', t.k || '', t.trees, t.deposit || ''].join(',')).join(';');

// --- izolacja RNG: Terrain.apply nie może dotykać RNG gry (liczymy wywołania w czasie apply) ---
let rngCalls = 0, inApply = 0, rngInApply = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { rngCalls++; if (inApply) rngInApply++; return f.apply(this, arguments); }; }
const apply0 = Terrain.apply; Terrain.apply = function () { inApply++; try { return apply0.apply(this, arguments); } finally { inApply--; } };

const sum = {}; let maps = 0, retries = 0;
const add = (key, v) => { sum[key] = (sum[key] || 0) + v; };
for (const fid of FACTIONS) {
  const f = Data.FACTIONS[fid];
  for (const cl of CLIMATES) for (const ty of TYPES) {
    if (fid === 'vikings' && ty !== 'coast') continue;
    for (let i = 1; i <= SEEDS; i++) {
      const seed = i * 101 + 7, tag = `${fid}/${cl}/${ty}/${seed}`;
      World.init(fid, { climate: cl, type: ty, seed });
      const s = World.state(), map = s.map, N = map.size, m = map.meta; maps++; retries += m.attempt;
      ok(m.climate === cl && m.type === ty && m.seed === seed, `${tag}: meta zgodna z opcjami`);
      ok(m.valid, `${tag}: walidacja generatora: ${(m.why || []).join('; ')}`);
      // --- pola kafli ---
      let bad = 0;
      for (const t of map.tiles) {
        if (![0, 1, 2].includes(t.h) || !Number.isInteger(t.e) || t.e < 0 || t.e > 4 || t.trees < 0 || t.trees > 3) bad++;
        if (t.h === 0 && !WK.includes(t.wk)) bad++;
        if (t.h !== 0 && t.wk) bad++;
        if (t.k && (t.h === 0 || !K.includes(t.k))) bad++;
        if (t.h === 0 && (t.trees || t.deposit)) bad++;
        if (t.deposit && (t.h !== 1 || t.k || t.trees)) bad++;
        if (t.occup && !(t.x >= 22 && t.x <= 25 && t.y >= 22 && t.y <= 25)) bad++;
      }
      ok(bad === 0, `${tag}: ${bad} kafli łamie niezmienniki pól`);
      // --- plac wokół Dworu: 8×8 płaski, suchy, bez cech, drzew i złóż ---
      let plaza = true; const es = new Set();
      for (let y = 20; y <= 27; y++) for (let x = 20; x <= 27; x++) { const t = MapGen.at(map, x, y); if (t.h !== 1 || t.k || t.trees || t.deposit) plaza = false; es.add(t.e); }
      ok(plaza, `${tag}: plac 8×8 wokół Dworu czysty`); ok(es.size === 1, `${tag}: plac wokół Dworu płaski (poziomy ${[...es]})`);
      // --- liczby drzew i złóż ---
      let trees = 0; const dep = {};
      for (const t of map.tiles) { trees += t.trees; if (t.deposit) dep[t.deposit] = (dep[t.deposit] || 0) + 1; }
      ok(trees >= 0.95 * f.treesTarget && trees <= 1.05 * f.treesTarget, `${tag}: drzew ${trees} vs cel ${f.treesTarget}`);
      for (const [kind, n] of Object.entries(f.deposits || {})) ok((dep[kind] || 0) === n, `${tag}: złoża ${kind} ${dep[kind] || 0}/${n}`);
      // --- statystyki generatora ---
      const st = Terrain.stats(map);
      ok(st.depReach === st.depTotal, `${tag}: wszystkie złoża osiągalne`);
      ok(st.treesReach >= 0.85 * st.trees, `${tag}: drzewa osiągalne ${st.treesReach}/${st.trees}`);
      ok(st.buildNear >= 280, `${tag}: miejsce pod zabudowę ${st.buildNear}`);
      if (st.river + st.ford) ok(st.ford >= 1 && st.nearestFord <= 16, `${tag}: bród w pobliżu (${st.nearestFord.toFixed(1)})`);
      if (ty === 'river' && cl !== 'snow') ok(st.river > 0 && st.ford > 0, `${tag}: mapa rzeczna ma rzekę (${st.river}) i brody (${st.ford})`);
      if (ty === 'mountains') ok(st.hills > 150 && st.cliff > 20, `${tag}: góry: wzgórza ${st.hills}, klify ${st.cliff}`);
      if (ty === 'wetlands') ok(st.bog > 60 || cl === 'desert', `${tag}: bagna ${st.bog}`);
      if (ty === 'coast') ok(st.sea > 100, `${tag}: morze ${st.sea}`);
      if (ty === 'lakes') ok(st.lake + st.ice >= 40, `${tag}: jeziora ${st.lake + st.ice}`);
      if (cl === 'snow' && st.lake + st.ice > 0) ok(st.ice > 0 && st.lake === 0, `${tag}: jeziora zamarznięte (lód ${st.ice}, jezioro ${st.lake})`);
      if (cl === 'desert' && ty !== 'coast') ok(st.oasis > 0 || st.dune > 0, `${tag}: pustynia: oazy ${st.oasis}, wydmy ${st.dune}`);
      if (fid === 'vikings') ok(st.shoreNear >= 12 && st.shoreNearest <= 13, `${tag}: brzeg dla Wikingów ${st.shoreNear} @${st.shoreNearest.toFixed(1)}`);
      // --- reguły canPlace: woda, brody, lód i cechy blokujące nigdy nie przyjmują budynku; różnica wysokości ≥ 2 w obrysie — zakaz ---
      let leak = 0, span = 0;
      for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
        const t = map.tiles[y * N + x];
        if ((t.h !== 1 || (t.k && Terrain.BLOCK_K[t.k])) && World.canPlace('hut', x, y).ok) leak++;
        const es2 = [t, map.tiles[y * N + x + 1], map.tiles[(y + 1) * N + x], map.tiles[(y + 1) * N + x + 1]].map(q => q.e);
        const [w, h] = Data.footprint('hut', fid);
        if (w === 2 && h === 2 && Math.max(...es2) - Math.min(...es2) >= 2 && World.canPlace('hut', x, y).ok) span++;
      }
      ok(leak === 0, `${tag}: canPlace przepuszcza ${leak} pól wody/cech blokujących`); ok(span === 0, `${tag}: canPlace przepuszcza ${span} obrysów o rozpiętości ≥ 2`);
      // --- determinizm ---
      if (i === 1) { const a = sig(map); World.init(fid, { climate: cl, type: ty, seed }); ok(sig(World.state().map) === a, `${tag}: to samo ziarno → ta sama mapa`); }
      for (const k of ['water', 'sea', 'lake', 'ice', 'river', 'ford', 'cliff', 'bog', 'dune', 'quick', 'oasis', 'drift', 'hills']) add(cl + '.' + k, st[k] || 0);
    }
  }
}
ok(rngInApply === 0, `Terrain.apply wywołał RNG gry ${rngInApply} razy`);
// --- domyślne wejście (testy, scenariusze): klimat nacji, mapa nadmorska, dotychczasowe ziarno — i to samo przy powtórzeniu ---
for (const fid of FACTIONS) {
  World.init(fid); const a = sig(World.state().map), m = World.state().map.meta; const r1 = RNG.next();
  World.init(fid); const b = sig(World.state().map), r2 = RNG.next();
  ok(a === b && r1 === r2, `${fid}: domyślna mapa i stan RNG powtarzalne`);
  ok(m.climate === Data.FACTIONS[fid].climate && m.type === 'coast', `${fid}: domyślny klimat ${m.climate} / typ ${m.type}`);
}
console.log(`${maps} map, ponowień generatora łącznie ${retries}`);
for (const cl of CLIMATES) console.log(cl.padEnd(10), ['water', 'sea', 'lake', 'ice', 'river', 'ford', 'hills', 'cliff', 'bog', 'dune', 'quick', 'oasis', 'drift'].map(k => k + ' ' + Math.round((sum[cl + '.' + k] || 0) / (maps / CLIMATES.length))).join(' · '));
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
