// Odpoczynek przed domem (Punkt 15): wizualna warstwa nad cieniem symulacji — robotnicy po cyklu (krok `rest` z `sit`) i wolni mieszkańcy przy Chatach siadają na krześle (a.sit, a.act = 'rest').
// Sprawdza: siadają i jedni, i drudzy w ciągu godziny gry; siedzący stoją na wolnych, przechodnich polach (nie na murze); jedno miejsce przy drzwiach = jedna osoba; nikt nie siedzi dłużej niż REST.max
// (+ margines); bez settings.workers nikt nie siada; stan logiki gry jest identyczny z postaciami i bez nich (cień symulacji). Użycie: node tools/rest.js [plik.html] [minuty]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, TestBots, Terrain, Walkers } = G;
const MIN = +process.argv[3] || 60;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const digest = s => JSON.stringify([s.res, s.pop, s.time, s.buildings.length, s.sites.length, s.citizens.map(c => [c.x, c.y, c.tx, c.ty])]);

function sim(fid, cl, ty, workersOn, withWalkers, probe) {
  World.init(fid, { climate: cl, type: ty, seed: 7 });
  const s = World.state(), plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0;
  s.settings.workers = workersOn; s.settings.logistics = workersOn;
  for (let r = 4; r < 12; r++) { let done = false; for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) { const x = 22 + dx, y = 26 + dy; if (World.canPlace('hut', x, y).ok) { World.placeBuilding('hut', x, y, true); done = true; } } if (done) break; }      // Chata blisko Dworu, gdzie krążą wolni mieszkańcy (miejsce Chat z planu bota zależy od terenu)
  for (let t = 0; t < MIN; t += 0.05) {
    World.tick(0.05); if (withWalkers) Walkers.update(0.05);
    if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
    if (probe) probe(s, t);
  }
  return s;
}
for (const [fid, cl, ty] of [['franks', 'temperate', 'river'], ['saracens', 'desert', 'river'], ['vikings', 'snow', 'coast'], ['slavs', 'eastern', 'wetlands']]) {
  const tag = `${fid}/${ty}`, since = new Map(); let maxFree = 0, citSit = 0, workSit = 0, maxSit = 0, badTile = 0, twice = 0; const everSat = new Set();
  const s = sim(fid, cl, ty, true, true, (s, t) => {
    const N = s.map.size, at = new Map(); maxFree = Math.max(maxFree, Walkers.figures().filter(a => a.kind === 'citizen').length);
    for (const a of Walkers.figures()) {
      if (!(a.act === 'rest' && a.sit)) { since.delete(a); continue; }
      if (!since.has(a)) { since.set(a, t); if (a.kind === 'citizen') citSit++; else if (a.kind === 'worker') workSit++; }
      maxSit = Math.max(maxSit, t - since.get(a)); everSat.add(a);
      const tl = s.map.tiles[Math.floor(a.y) * N + Math.floor(a.x)]; if (!tl || !Terrain.passable(tl) || tl.wall) badTile++;
      if (a.kind === 'citizen') { const k = a.seat; if (k) { if (at.has(k)) twice++; at.set(k, a); } }
    }
  });
  ok(citSit > 0 || maxFree < 2, `${tag}: wolni mieszkańcy siadają przed domem (${citSit} razy, wolnych maks. ${maxFree})`);
  ok(workSit > 0, `${tag}: robotnicy siadają po cyklu (${workSit} razy)`);
  ok(badTile === 0, `${tag}: siedzący stoją na wolnych, przechodnich polach (${badTile} próbek poza)`);
  ok(twice === 0, `${tag}: jedno miejsce przy drzwiach = jedna osoba (${twice} kolizji)`);
  ok(maxSit <= 1.4, `${tag}: nikt nie siedzi dłużej niż 1,4 min gry (maks. ${maxSit.toFixed(2)})`);
  // logika identyczna z postaciami i bez
  const a = digest(s), b = digest(sim(fid, cl, ty, true, false, null));
  ok(a === b, `${tag}: stan logiki gry identyczny z postaciami i bez (cień symulacji)`);
}
// bez settings.workers nikt nie siada
{ let sat = 0; sim('franks', 'temperate', 'river', false, true, () => { for (const a of Walkers.figures()) if (a.sit) sat++; }); ok(sat === 0, `bez settings.workers nikt nie siada (${sat})`); }
console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `\n✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
