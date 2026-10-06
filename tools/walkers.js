// Test widocznych pieszych (moduł Walkers): symulacja boty-budowniczego na kilku mapach, w każdym kroku sprawdzamy, że postacie stoją tylko na polach przechodnich i wolnych,
// nosiciele kończą marsz przy drzwiach celu, budowniczowie pojawiają się przy placach i znikają po budowie, a „cień symulacji" się nie zmienia:
// stan logiki (zasoby, ludność, położenie obywateli i nosicieli) jest identyczny z Walkers i bez, a Walkers nie wywołuje RNG.
// Użycie: node tools/walkers.js [plik.html] [minuty]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, TestBots, RNG, Terrain, Walkers } = G;
const MIN = +process.argv[3] || 60, SETTLE = 12;   // po MIN minutach bot przestaje budować, jeszcze SETTLE minut płynie czas (budowniczowie wracają do Dworu)
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
let inW = 0, rngInW = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inW) rngInW++; return f.apply(this, arguments); }; }
const upd = Walkers.update; Walkers.update = function () { inW++; try { return upd.apply(this, arguments); } finally { inW--; } };

function sim(fid, cl, ty, withWalkers, probe) {
  World.init(fid, { climate: cl, type: ty, seed: 7 });
  const s = World.state(), plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0, step = 0;
  for (let t = 0; t < MIN + SETTLE; t += 0.05, step++) {
    World.tick(0.05); if (withWalkers) Walkers.update(0.05);
    if (t < MIN && t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
    if (probe && withWalkers) probe(s, step, t);
  }
  return s;
}
const digest = s => JSON.stringify([s.res, s.pop, s.time, s.buildings.length, s.sites.length, s.citizens.map(c => [c.x, c.y, c.tx, c.ty]), s.carriers.map(c => [c.x, c.y, c.tx, c.ty])]);

const SETS = [['franks', 'temperate', 'river'], ['saracens', 'desert', 'river'], ['vikings', 'snow', 'coast'], ['slavs', 'eastern', 'wetlands'], ['franks', 'temperate', 'mountains']];
let totalFigs = 0, builderSeen = 0, carrierDone = 0, fordSteps = 0;
for (const [fid, cl, ty] of SETS) {
  const tag = `${fid}/${cl}/${ty}`; let bad = 0, badTiles = new Set(), figsMax = 0, builders = 0, carriers = 0, mism = 0;
  const lastPos = new Map(), seenCar = new Set(), streak = new Map(); let carNear = 0, carFar = 0;
  const s = sim(fid, cl, ty, true, (s, step) => {
    const figs = Walkers.figures(), map = s.map, N = map.size; figsMax = Math.max(figsMax, figs.length); totalFigs += figs.length;
    const cit = figs.filter(a => a.kind === 'citizen').length; if (cit !== s.citizens.length) mism++;
    for (const a of figs) {
      const t = map.tiles[Math.floor(a.y) * N + Math.floor(a.x)];
      const viol = !t || !Terrain.passable(t) || (t.occup != null && !a.evac);
      const run = viol ? (streak.get(a) || 0) + 1 : 0; streak.set(a, run);                                  // plac postawiony pod postacią: chwilowe, kilka kroków do wyjścia
      if (run > 6) { bad++; badTiles.add(a.kind + '@' + Math.floor(a.x) + ',' + Math.floor(a.y) + (t ? ' h' + t.h + ' ' + (t.wk || t.k || '') + (t.occup != null ? ' zajęte' : '') : ' poza mapą')); }
      if (t && t.h === 0) fordSteps++;
      if (a.kind === 'builder') builders++;
      if (a.kind === 'carrier') { carriers++; lastPos.set(a, [a.x, a.y]); seenCar.add(a); }
    }
    for (const a of [...seenCar]) if (!figs.includes(a)) { seenCar.delete(a); if (a.done) { carrierDone++; if (a.goal) { const p = lastPos.get(a); if (Math.hypot(p[0] - a.goal[0], p[1] - a.goal[1]) < 1.2) carNear++; else carFar++; } } }
    builderSeen = Math.max(builderSeen, builders);
  });
  ok(bad === 0, `${tag}: ${bad} postaci na polach nieprzechodnich lub zajętych: ${[...badTiles].slice(0, 4).join(' | ')}`);
  ok(mism === 0, `${tag}: liczba widocznych obywateli ≠ ludność logiki (${mism} kroków)`);
  ok(builders > 0, `${tag}: budowniczowie pojawili się przy placach (${builders} postaci·kroków)`);
  ok(carriers > 0, `${tag}: nosiciele wychodzą z drzwi (${carriers} postaci·kroków)`);
  ok(carNear > 0 && carFar <= 0.05 * (carNear + carFar), `${tag}: nosiciele dochodzą do drzwi celu (${carNear} z ${carNear + carFar}) — przerwa między budynkami zostawia przejścia`);
  // po zakończeniu wszystkich budów budowniczowie, którzy jeszcze są na mapie, wracają do Dworu
  if (s.sites.length === 0) ok(Walkers.figures().every(a => a.kind !== 'builder' || a.mode === 'home'), `${tag}: po ukończeniu budów budowniczowie wracają do Dworu`);
  // izolacja: te same wyniki logiki z Walkers i bez
  const a = digest(s), b = digest(sim(fid, cl, ty, false));
  ok(a === b, `${tag}: logika gry inna z Walkers i bez (cień symulacji naruszony)`);
  console.log(`${tag.padEnd(26)} postaci max ${figsMax} · budowniczowie ${builders} · nosiciele ${carriers} (dotarło ${carNear}, bez trasy ${carFar})`);
}
ok(rngInW === 0, `Walkers nie wywołuje RNG gry (wywołań: ${rngInW})`);
ok(carrierDone > 0, 'nosiciele dochodzą do celu (zniknięcia po dojściu: ' + carrierDone + ')');
console.log(`brodem / lodem przeszło kroków: ${fordSteps}`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
