// Test dróg: wytyczanie (koszt tylko za nowe pola), odmowy (woda, brak desek, zajęte pola), budowa budynku zdejmuje drogę, A* i piesi preferują drogę,
// narzędzie nie dotyka RNG, a pole drogi przechodzi przez JSON (snapshot/restore). Użycie: node tools/roads.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, MapGen, RNG, Terrain, Path, Roads, Build, Walkers } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
let inRoads = 0, rngInRoads = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inRoads) rngInRoads++; return f.apply(this, arguments); }; }
for (const m of Object.keys(Roads)) { const f = Roads[m]; if (typeof f === 'function') Roads[m] = function () { inRoads++; try { return f.apply(this, arguments); } finally { inRoads--; } }; }
const roadCount = map => map.tiles.filter(t => t.road).length;

World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 });
let s = World.state(), map = s.map; s.res.deski = 100;
// 1. wytyczenie: tylko nowe pola kosztują (trasę wyznacza A*, więc nie musi być prosta)
let r = Roads.lay(8, 30, 18, 30), road1 = []; map.tiles.forEach((t, i) => { if (t.road) road1.push(i); });
ok(r.ok && r.n === road1.length && r.cost === r.n && s.res.deski === 100 - r.n && r.n >= 11, `droga kosztuje tyle desek, ile nowych pól (${r.n} pól, zostało ${s.res.deski} desek)`);
const mid = road1[Math.floor(road1.length / 2)], mx = mid % 48, my = (mid / 48) | 0, n1 = road1.length;
r = Roads.lay(mx, my, mx, my + 6);
ok(r.ok && r.n >= 1 && r.n <= 6 && roadCount(map) === n1 + r.n, `odnoga od istniejącej drogi płaci tylko za nowe pola (${r.n} z 7 pól trasy)`);
ok(!Roads.lay(8, 30, 18, 30).ok, 'ta sama trasa drugi raz — odmowa („już jest droga”)');
// 2. odmowy
const before = roadCount(map), dBefore = s.res.deski;
const pick = (x0, y0) => { for (let x = x0; x < 44; x++) for (let y = y0; y < 44; y++) if (Roads.free(MapGen.at(map, x, y)) && Roads.free(MapGen.at(map, x + 6, y + 6)) && !map.tiles[y * 48 + x].road) return [x, y]; return [30, 30]; };
const [fx, fy] = pick(26, 26); s.res.deski = 3; r = Roads.lay(fx, fy, fx + 6, fy + 6); ok(!r.ok && /Brak desek/.test(r.reason) && roadCount(map) === before, `za mało desek — odmowa i brak zmian (${r.reason})`); s.res.deski = dBefore;
const water = map.tiles.findIndex(t => t.h === 0); if (water >= 0) { r = Roads.lay(water % 48, (water / 48) | 0, 30, 30); ok(!r.ok, 'początek w wodzie — odmowa'); }
const k = s.keep; r = Roads.lay(k.x, k.y, 30, 30); ok(!r.ok, 'początek na polu Dworu — odmowa');
// 3. droga na jeziorze: trasa omija wodę
World.init('franks', { climate: 'temperate', type: 'lakes', seed: 7 }); s = World.state(); map = s.map; s.res.deski = 500;
let lakes = 0, across = 0;
for (let q = 0; q < 40; q++) { const a = (q * 37) % 2304, b = (q * 91 + 500) % 2304; const pa = Roads.preview(a % 48, (a / 48) | 0, b % 48, (b / 48) | 0); if (pa.ids.length) { across++; if (pa.ids.some(i => !(map.tiles[i].h === 1))) lakes++; } }
ok(lakes === 0 && across > 5, `trasy dróg nigdy nie prowadzą przez wodę (${across} tras, ${lakes} przez wodę)`);
// 4. A* preferuje drogę; budynek zdejmuje drogę spod obrysu
World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); s = World.state(); map = s.map; s.res.deski = 200; s.res.złoto = 500; s.res.kamień = 100;
Roads.lay(10, 12, 40, 12);
const ends = [[10, 12], [40, 12]], withRoad = Path.grid(map, ends[0][0], ends[0][1], ends[1][0], ends[1][1], {}).cost, ids = []; map.tiles.forEach((t, i) => { if (t.road) ids.push(i); });
const saved = ids.slice(); for (const i of ids) map.tiles[i].road = 0;
const noRoad = Path.grid(map, ends[0][0], ends[0][1], ends[1][0], ends[1][1], {}).cost; for (const i of saved) map.tiles[i].road = 1;
ok(withRoad < 0.75 * noRoad, `przejście po drodze tańsze o ≥ 25% (${withRoad.toFixed(1)} vs ${noRoad.toFixed(1)} bez drogi)`);
s.res.deski = 999;
const hutSpot = saved.map(i => [i % 48, (i / 48) | 0]).find(([x, y]) => World.canPlace('hut', x, y).ok), hid = hutSpot ? hutSpot[1] * 48 + hutSpot[0] : -1;
const e = hutSpot ? Build.enqueue('hut', hutSpot[0], hutSpot[1]) : { ok: false };
ok(e.ok && !map.tiles[hid].road, 'plac budowy zdejmuje drogę spod obrysu');
ok(roadCount(map) < saved.length && roadCount(map) >= saved.length - 6, `poza obrysem droga zostaje (${roadCount(map)} z ${saved.length} pól)`);
// 5. prędkość pieszych
const rd = saved.find(i => map.tiles[i].road), rx = rd % 48 + 0.5, ry = ((rd / 48) | 0) + 0.5, off = map.tiles.findIndex(t => t.h === 1 && !t.road && !t.k);
ok(Walkers.speedAt(map, rx, ry) / Walkers.speedAt(map, off % 48 + 0.5, ((off / 48) | 0) + 0.5) >= 1.5, `po drodze ≥ 1,5× szybciej (${Walkers.speedAt(map, rx, ry).toFixed(2)} vs ${Walkers.speedAt(map, off % 48 + 0.5, ((off / 48) | 0) + 0.5).toFixed(2)})`);
// 6. rozbiórka, drzewa, JSON, RNG
const rm = saved.find(i => map.tiles[i].road); ok(Roads.remove(rm % 48, (rm / 48) | 0) && !Roads.remove(rm % 48, (rm / 48) | 0) && !map.tiles[rm].road, 'rozbiórka usuwa drogę (drugi raz — brak)');
for (let i = 0; i < 400; i++) World.addTree(); ok(!map.tiles.some(t => t.road && t.trees), 'nowe drzewa nie rosną na drodze');
ok(JSON.parse(JSON.stringify(map)).tiles.filter(t => t.road).length === roadCount(map), 'pole drogi przechodzi przez JSON (snapshot / restore)');
ok(rngInRoads === 0, `Roads nie wywołuje RNG (wywołań: ${rngInRoads})`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
