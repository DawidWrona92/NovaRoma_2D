// Test sprawności logistycznej (Logistics): producent blisko Składu / Dworu ma pełną sprawność, daleki — niższą (≥ min), drogi ją poprawiają, wyłączona opcja nie zmienia nic,
// ekonomia produkuje mniej przy słabej logistyce i tyle samo przy dobrej, moduł nie dotyka RNG. Użycie: node tools/logistics.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Economy, Logistics, Roads, RNG, Walkers } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
let inL = 0, rngInL = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inL) rngInL++; return f.apply(this, arguments); }; }
for (const m of ['effOf', 'compute']) { const f = Logistics[m]; Logistics[m] = function () { inL++; try { return f.apply(this, arguments); } finally { inL--; } }; }
const R = Data.RULES.logistics;

function setup(x, y) {                                   // Dwór na środku, jedna Chata drwala na (x, y) — zasilana, z drzewami
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 });
  const s = World.state(); s.res.deski = 9999; s.res.kamień = 999; s.res.złoto = 9999; s.res.narzędzia = 99; s.pop = 12;
  const b = World.placeBuilding('woodcutter', x, y); return { s, b };
}
// 1. wyłączona logistyka: sprawność 1, b.logi puste
let { s, b } = setup(30, 26); s.settings.logistics = false;
ok(Logistics.effOf(s, b) === 1 && !b.logi, 'wyłączona logistyka: sprawność 1');
// 2. blisko Dworu: pełna sprawność; daleko: niższa, ale ≥ min
const near = setup(27, 23); near.s.settings.logistics = true; const eNear = Logistics.effOf(near.s, near.b);
const far = setup(40, 10); far.s.settings.logistics = true; const eFar = Logistics.effOf(far.s, far.b);
ok(eNear === 1, `blisko Dworu bez kary (${eNear.toFixed(3)}, dystans ${near.b.logi && near.b.logi.dist.toFixed(1)})`);
ok(eFar < 0.95 && eFar >= R.min - 1e-9, `daleko od Dworu kara w granicach [${R.min}, 0.95): ${eFar.toFixed(3)} (dystans ${far.b.logi.dist.toFixed(1)})`);
// 3. Skład blisko producenta poprawia sprawność
{ const st = World.placeBuilding('store', 42, 8); void st; far.s.settings.logistics = true; const e2 = Logistics.effOf(far.s, far.b); ok(e2 > eFar, `Skład obok producenta poprawia sprawność (${eFar.toFixed(3)} → ${e2.toFixed(3)})`); }
// 4. droga skraca czas marszu
{ const t = setup(40, 10); t.s.settings.logistics = true; const e0 = Logistics.effOf(t.s, t.b), m0 = t.b.logi.dist; t.s.res.deski = 999;
  const door = Walkers.doorOf(t.b), kd = Walkers.doorOf(t.s.keep), r = Roads.lay(Math.floor(door[0]), Math.floor(door[1]), Math.floor(kd[0]), Math.floor(kd[1]));
  const e1 = Logistics.effOf(t.s, t.b); ok(r.ok && t.b.logi.dist < 0.8 * m0 && e1 > e0, `droga skraca dystans (${m0.toFixed(1)} → ${t.b.logi.dist.toFixed(1)} pól, sprawność ${e0.toFixed(3)} → ${e1.toFixed(3)})`); }
// 5. ekonomia: Chata drwala daleko produkuje mniej drewna niż blisko (ta sama obsada i drzewa)
function wood(x, y, on) { const t = setup(x, y); t.s.settings.logistics = on; t.s.res.pień = 0; for (let i = 0; i < 600; i++) { Economy.tick(0.05); World.tick(0.0); } return (t.s.res.pień || 0) + (t.s.res.deski || 0) * 0; }
const nearOn = wood(27, 23, true), nearOff = wood(27, 23, false), farOn = wood(40, 10, true), farOff = wood(40, 10, false);
ok(Math.abs(nearOn - nearOff) < 1e-6, `blisko: ta sama produkcja z logistyką i bez (${nearOn.toFixed(2)} vs ${nearOff.toFixed(2)})`);
ok(farOn < farOff - 0.01 && farOn >= farOff * R.min - 1e-6, `daleko: produkcja spada, ale nie poniżej ${R.min * 100}% (${farOn.toFixed(2)} vs ${farOff.toFixed(2)})`);
ok(rngInL === 0, `Logistics nie wywołuje RNG (${rngInL})`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
