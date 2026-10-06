// Test podglądu mapy (moduł Minimap, Faza 9): opis, podsumowanie, rysowanie na atrapie kanwy, zgodność podglądu z mapą gry (to samo ziarno = ta sama mapa),
// obsługa mapy niepoprawnej i brak wpływu na stan gry. Użycie: node tools/minimap.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, MapGen, Minimap, Terrain } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };

// atrapa kanwy: zapisuje malowane prostokąty
function canvas(w) {
  const rects = [], strokes = [], c = { width: w, height: w, getContext() { return ctx; } };
  const ctx = { fillStyle: '', strokeStyle: '', lineWidth: 0, fillRect(x, y, ww, hh) { rects.push({ x, y, w: ww, h: hh, c: this.fillStyle }); }, strokeRect(x, y, ww, hh) { strokes.push({ x, y, w: ww, h: hh, c: this.strokeStyle }); } };
  c.rects = rects; c.strokes = strokes; return c;
}

const CLIMATES = ['temperate', 'eastern', 'snow', 'desert'], TYPES = Object.keys(Data.MAPTYPES || { plain: 1, coast: 1, river: 1, lakes: 1, hills: 1, bog: 1 });
let maps = 0, invalid = 0;
for (const climate of CLIMATES) for (const type of TYPES) {
  const map = Minimap.generate('franks', { climate, type, seed: 11 }); maps++;
  const d = Minimap.describe(map.meta);
  ok(d.includes(Data.mapTypeName(type, climate)) && d.includes(Data.CLIMATES[climate].name) && d.includes('ziarno 11'), `opis ${climate}/${type}: „${d}”`);
  const sm = Minimap.summary(map);
  ok(Array.isArray(sm.lines) && sm.lines.length >= 3 && /^Woda \d+% · wzgórza \d+% · drzewa \d+/.test(sm.lines[0]) && /^Złoża: /.test(sm.lines[sm.lines.length - 1]), `podsumowanie ${climate}/${type}: ${sm.lines.length} linii`);
  if (!sm.valid) invalid++;
  // rysowanie: każde pole = jeden prostokąt, wszystkie w obrębie kanwy; ramka Dworu pośrodku
  const cv = canvas(192); Minimap.draw(cv, map);
  ok(cv.rects.length === map.size * map.size, `rysunek ${climate}/${type}: ${cv.rects.length} prostokątów = ${map.size * map.size} pól`);
  ok(cv.rects.every(r => r.x >= 0 && r.y >= 0 && r.x + r.w <= 192 + 4 && r.y + r.h <= 192 + 4 && /^(#|rgb)/.test(r.c)), `wszystkie pola mieszczą się na kanwie i mają kolor (${climate}/${type})`);
  ok(cv.strokes.length === 1 && cv.strokes[0].c === '#fff' && Math.abs(cv.strokes[0].x + cv.strokes[0].w / 2 - 96) < 1, `ramka Dworu (4×4) pośrodku (${climate}/${type})`);
}
ok(maps === 24, `przeliczono 24 kombinacje klimat × typ (${maps})`);
console.log(`  (mapy oznaczone jako niepoprawne przy ziarnie 11: ${invalid} z ${maps})`);

// podgląd = mapa gry: to samo ziarno, ta sama mapa (pole po polu), także po innym starcie w tym samym procesie
for (const [fid, climate, type, seed] of [['franks', 'snow', 'lakes', 5], ['saracens', 'desert', 'river', 597318], ['slavs', 'eastern', 'bog', 42], ['vikings', 'temperate', 'coast', 9]]) {
  const prev = Minimap.generate(fid, { climate, type, seed });
  World.init(fid, { climate, type, seed });
  // jedyna różnica to rezerwacja pól Dworu (occup) — World.init stawia budynek startowy
  const strip = tiles => JSON.stringify(tiles.map(t => { const c = Object.assign({}, t); delete c.occup; return c; }));
  const m2 = World.state().map, a = strip(prev.tiles), b = strip(m2.tiles), nOcc = m2.tiles.filter(t => t.occup).length;
  ok(a === b && JSON.stringify(prev.meta) === JSON.stringify(m2.meta) && nOcc >= 16, `podgląd ${fid}/${climate}/${type}/${seed} = mapa gry (${a.length} znaków; pól Dworu ${nOcc})`);
}

// Minimap.draw/summary nie zmieniają mapy
{
  const map = Minimap.generate('franks', { climate: 'temperate', type: 'plain', seed: 3 }), before = JSON.stringify(map);
  Minimap.draw(canvas(96), map); Minimap.summary(map); Minimap.describe(map.meta);
  ok(JSON.stringify(map) === before, 'draw / summary / describe tylko czytają mapę');
}
// mapa niepoprawna: podsumowanie zgłasza valid=false; mapa bez meta nie wywraca modułu
{
  const map = Minimap.generate('franks', { climate: 'temperate', type: 'plain', seed: 3 }); map.meta.valid = false;
  ok(Minimap.summary(map).valid === false, 'meta.valid=false → summary.valid=false (Piaskownica losuje następne ziarno)');
  ok(Minimap.describe(null) === '', 'describe(null) → pusty opis');
  const bare = { size: 4, tiles: Array.from({ length: 16 }, () => ({ h: 1, e: 1, trees: 0 })) };
  let thrown = null; try { Minimap.summary(bare); Minimap.draw(canvas(16), bare); } catch (e) { thrown = e; }
  ok(!thrown, 'mapa bez meta (testowa 4×4) nie wywraca podsumowania i rysowania' + (thrown ? ': ' + thrown.message : ''));
}
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
