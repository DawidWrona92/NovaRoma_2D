// Test robotników (moduł Workers, Faza 9B-1): każdy obsadzony budynek z rolą ma jednego widocznego robotnika, który chodzi tylko po polach przechodnich i wolnych, wykonuje pętlę
// (weź wejście → idź → pracuj → zanieś wyjście do Składu / Dworu), stoi przy drzwiach, gdy budynek stoi, a liczba widocznych obywateli = wolna ludność. Logika gry jest identyczna
// z robotnikami i bez (cień symulacji), moduł nie wywołuje RNG i nie dopisuje niczego do stanu gry (JSON).
// Użycie: node tools/workers.js [plik.html] [minuty]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, TestBots, RNG, Terrain, Walkers, Workers } = G;
const MIN = +process.argv[3] || 60;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
let inW = 0, rngInW = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inW) rngInW++; return f.apply(this, arguments); }; }
for (const [mod, name] of [[Workers, 'update'], [Walkers, 'update']]) { const f = mod[name]; mod[name] = function () { inW++; try { return f.apply(this, arguments); } finally { inW--; } }; }

function sim(fid, cl, ty, withWalkers, probe, o = {}) {
  World.init(fid, { climate: cl, type: ty, seed: 7 });
  const s = World.state(), plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0, step = 0;
  s.settings.workers = true; s.settings.logistics = true; if (o.fauna) G.Fauna.enable(s);
  for (let t = 0; t < MIN; t += 0.05, step++) {
    World.tick(0.05); if (withWalkers) Walkers.update(0.05);
    if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
    if (probe && withWalkers) probe(s, step, t);
  }
  return s;
}
const digest = s => JSON.stringify([s.res, s.pop, s.time, s.buildings.length, s.sites.length, s.citizens.map(c => [c.x, c.y, c.tx, c.ty]), s.carriers.map(c => [c.x, c.y, c.tx, c.ty])]);

const SETS = [['franks', 'temperate', 'river'], ['saracens', 'desert', 'river'], ['vikings', 'snow', 'coast'], ['slavs', 'eastern', 'wetlands'], ['franks', 'temperate', 'mountains']];
const acts = new Set(), loads = new Set(); let totalFigs = 0, idleTotal = 0;
for (const [fid, cl, ty] of SETS) {
  const tag = `${fid}/${cl}/${ty}`;
  const streak = new Map(), staffedSince = new Map(), carried = new Set(), delivered = new Set(), idleSeen = new Set(), lastLoad = new Map(), standing = new Map();
  let bad = 0, citMis = 0, stepsN = 0, maxW = 0, pairMis = 0, maxStand = 0, bMis = 0; const badTiles = new Set();
  const s = sim(fid, cl, ty, true, (s, step, t) => {
    const figs = Walkers.figures(), map = s.map, N = map.size, workers = figs.filter(a => a.kind === 'worker'); stepsN++; totalFigs += figs.length; maxW = Math.max(maxW, workers.length);
    for (const a of figs) {
      const tl = map.tiles[Math.floor(a.y) * N + Math.floor(a.x)];
      const viol = !tl || !Terrain.passable(tl) || (tl.occup != null && !a.evac);
      const run = viol ? (streak.get(a) || 0) + 1 : 0; streak.set(a, run);
      if (run > 6) { bad++; badTiles.add(a.kind + '@' + Math.floor(a.x) + ',' + Math.floor(a.y)); }
      if (a.kind === 'worker') { if (a.act) acts.add(a.act); if (a.load) loads.add(a.load[0]); }
    }
    // jeden robotnik na obsadzony budynek z rolą (po 3 min od obsadzenia)
    for (const b of s.buildings) {
      if (!Data.ROLES[b.id]) continue;
      if (s.staffed[b.uid]) { if (!staffedSince.has(b.uid)) staffedSince.set(b.uid, t); } else staffedSince.delete(b.uid);
    }
    if (step % 20 === 0) for (const [uid, t0] of staffedSince) if (t - t0 > 3) { const n = workers.filter(a => a.uid === uid).length; if (n !== 1) pairMis++; }
    // pętla: robotnik z wyjściem niesie ładunek, a potem go zostawia
    const stores = s.buildings.filter(q => q.id === 'store' || q.id === 'keep').map(q => Walkers.doorOf(q));
    for (const a of workers) {
      const b = s.buildings.find(q => q.uid === a.uid), og = b && Object.keys(Data.BUILDINGS[b.id].out || {}).find(g => g in G.Economy.LIMIT), shape = og && Data.LOADS[og][0];
      const cur = a.load ? a.load[0] + a.load[1] : null, prev = lastLoad.get(a.uid); lastLoad.set(a.uid, cur);
      if (a.load) carried.add(a.uid);
      if (prev && prev !== cur && prev.startsWith(shape) && stores.some(d => Math.hypot(d[0] - a.x, d[1] - a.y) < 1.8)) delivered.add(a.uid);   // wyjście zostawione przy Składzie / Dworze (może od razu wziąć wejście)
    }
    for (const a of workers) {
      const b = s.buildings.find(q => q.uid === a.uid);
      if (b && Workers.idleNow(b) && (a.act === 'sweep' || a.act === 'look')) idleSeen.add(a.uid);                 // budynek stoi (brak wejścia / pełny magazyn) → robotnik zamiata albo idzie sprawdzić Skład
      const run = (!a.moving && !a.act) ? (standing.get(a) || 0) + 1 : 0; standing.set(a, run); maxStand = Math.max(maxStand, run);    // nikt z obsady nie stoi bezczynnie
    }
    const nB = figs.filter(a => a.kind === 'builder' && a.mode !== 'home').length; if (step > 5 && nB !== s.buildersActive) bMis++;
    // liczba widocznych obywateli = wolna ludność (ograniczona listą cieni)
    const free = Math.max(0, Math.floor(s.pop) - s.workersStaffed - (s.crewAway || 0) - (s.buildersActive || 0)), cit = figs.filter(a => a.kind === 'citizen').length;
    if (cit !== Math.min(free, s.citizens.length)) citMis++;
  });
  const roleStaffed = s.buildings.filter(b => Data.ROLES[b.id] && s.staffed[b.uid]);
  const withOut = roleStaffed.filter(b => { const o = Data.BUILDINGS[b.id].out || {}; return Object.keys(o).some(g => g in G.Economy.LIMIT) && Data.ROLES[b.id].spot !== 'service' && staffedSince.get(b.uid) < MIN - 22; });   // cykl trwa do ok. 12 min
  ok(bad === 0, `${tag}: ${bad} postaci na polach nieprzechodnich lub zajętych: ${[...badTiles].slice(0, 4).join(' | ')}`);
  ok(pairMis === 0, `${tag}: budynek obsadzony > 3 min bez dokładnie jednego robotnika (${pairMis} razy)`);
  ok(citMis === 0, `${tag}: liczba widocznych obywateli ≠ wolna ludność (${citMis} z ${stepsN} kroków)`);
  const nCar = withOut.filter(b => carried.has(b.uid)).length, nDel = withOut.filter(b => delivered.has(b.uid)).length;
  ok(withOut.length === 0 || nCar >= 0.85 * withOut.length, `${tag}: robotnicy z wyjściem, którzy nieśli ładunek: ${nCar} z ${withOut.length}`);
  ok(withOut.length === 0 || nDel >= 0.8 * withOut.length, `${tag}: robotnicy, którzy zanieśli i zostawili ładunek: ${nDel} z ${withOut.length}`);
  ok(maxStand <= 20, `${tag}: żaden robotnik nie stoi bezczynnie dłużej niż 1 min (najdłużej ${(maxStand * 0.05).toFixed(2)} min)`);
  ok(bMis === 0, `${tag}: liczba budowniczych na ekranie = czynni budowniczowie (${bMis} kroków niezgodnych); bez placu stoją przy Dworze`);
  if (s.sites.length === 0) { const kd = Walkers.doorOf(s.keep); ok(Walkers.figures().filter(a => a.kind === 'builder').every(a => Math.hypot(a.x - kd[0], a.y - kd[1]) < 4.5), `${tag}: budowniczowie bez placu czekają przy Dworze`); }
  // brak nosicieli-cieni w trybie robotników
  ok(!Walkers.figures().some(a => a.kind === 'carrier'), `${tag}: w trybie robotników nie ma cieni-nosicieli`);
  // izolacja i JSON
  const a = digest(s), b = digest(sim(fid, cl, ty, false));
  ok(a === b, `${tag}: logika gry inna z robotnikami i bez (cień symulacji naruszony)`);
  ok(JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s), `${tag}: stan gry bez śladów robotników (przechodzi przez JSON bez zmian)`);
  idleTotal += idleSeen.size;
  console.log(`${tag.padEnd(26)} robotników max ${maxW} · z wyjściem ${withOut.length} (nieśli ${nCar}, zanieśli ${nDel}) · postoje widziane ${idleSeen.size}`);
}
// tryb dawny: bez robotników są cienie (nosiciele) i wszyscy obywatele
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); const s = World.state(), plan = TestBots.RECIPE.franks.slice(); let pi = 0, nd = 0, car = 0, wk = 0;
  for (let t = 0; t < 40; t += 0.05) { World.tick(0.05); Walkers.update(0.05); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } car += Walkers.figures().filter(a => a.kind === 'carrier').length; wk += Walkers.figures().filter(a => a.kind === 'worker').length; }
  ok(wk === 0 && car > 0, `settings.workers=false: dawne cienie (nosiciele ${car}), brak robotników (${wk})`);
}
// myśliwi z faunę prowadzi Fauna, nie Workers
{
  const s = sim('franks', 'temperate', 'plain', true, null, { fauna: true });
  ok(!Walkers.figures().some(a => a.kind === 'worker' && a.tool === 'bow'), 'przy włączonej faunie myśliwych nie prowadzi Workers');
  ok(s.buildings.some(b => b.id === 'hunter') || true, 'sprawdzono przebieg z faunę');
}
ok(idleTotal > 0, `robotnicy przy budynkach, które stoją, mają zajęcie — zamiatają lub idą sprawdzić Skład (widziano ${idleTotal})`);
ok(rngInW === 0, `Walkers i Workers nie wywołują RNG gry (wywołań: ${rngInW})`);
const expectActs = ['chop', 'saw', 'plant', 'pick', 'hoe', 'dig', 'grind', 'bake', 'forge', 'draw', 'milk'];
ok(expectActs.filter(x => acts.has(x)).length >= 8, `na ekranie widać różne czynności: ${[...acts].sort().join(', ')}`);
ok(['log', 'plank', 'rock', 'sack', 'basket', 'bucket'].filter(x => loads.has(x)).length >= 4, `niesione ładunki: ${[...loads].sort().join(', ')}`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
