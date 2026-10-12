// Test wyrównywania terenu (Faza 7): levelOf (płasko = 0, stok = pola do przesunięcia), etap 0 placu (budowniczowie kopią bez materiałów, potem teren jest płaski i zgłoszony do odświeżenia),
// czas budowy na płaskim bez zmian, na stoku dłuższy o minuty wyrównania, zakaz rozpiętości ≥ 2, boty wybierają płaskie miejsca, obszar startowy bez stoków, wzgórza decyzyjne dalej od Dworu.
// Użycie: node tools/leveling.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, TestBots, MapGen, RNG, Terrain } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
const per = Data.RULES.level.per, N = 48;
let inB = 0, rngIn = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inB) rngIn++; return f.apply(this, arguments); }; }
const wl = World.levelOf; World.levelOf = function () { inB++; try { return wl.apply(this, arguments); } finally { inB--; } };

function slopeSpot(id) {                                                    // miejsce, gdzie canPlace pozwala, a obrys ma dwa poziomy
  const s = World.state();
  for (let y = 2; y < N - 3; y++) for (let x = 2; x < N - 3; x++) { if (World.canPlace(id, x, y).ok && World.levelOf(id, x, y).need > 0) return { x, y }; }
  return null;
}
function flatSpot(id, far) {
  for (let y = 2; y < N - 3; y++) for (let x = 2; x < N - 3; x++) { if (World.canPlace(id, x, y).ok && World.levelOf(id, x, y).need === 0 && (!far || Math.hypot(x - 24, y - 24) > far)) return { x, y }; }
  return null;
}
const finish = (s, site, limit = 400) => { let t = 0; for (; t < limit && s.sites.includes(site); t += 0.05) { Build.tick(0.05); } return t; };

for (const [cl, ty, seed] of [['temperate', 'plain', 7], ['eastern', 'plain', 11], ['desert', 'lakes', 5], ['snow', 'plain', 3]]) {
  const tag = `${cl}/${ty}/${seed}`;
  World.init('franks', { climate: cl, type: ty, seed }); let s = World.state(), map = s.map;
  s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; s.pop = 40;
  // obszar startowy bez stoków; dalej są wzgórza decyzyjne
  let early = 0, mid = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = map.tiles[y * N + x]; if (t.h !== 1) continue; const d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24);
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const n = MapGen.at(map, x + dx, y + dy); if (n && n.h === 1 && n.e !== t.e) { if (d <= 13.5) early++; else if (d <= 27) mid++; } }
  }
  ok(early === 0, `${tag}: w obszarze startowym (≤ 13,5 pola od Dworu) nie ma stoków (${early})`);
  ok(mid >= 8, `${tag}: dalej od Dworu są wzgórza decyzyjne (${mid} stopni terenu)`);
  // levelOf
  const flat = flatSpot('hut', 0), sl = slopeSpot('hut');
  ok(!!flat && World.levelOf('hut', flat.x, flat.y).need === 0, `${tag}: płaski obrys — wyrównanie 0`);
  ok(!!sl, `${tag}: istnieje dozwolone miejsce na stoku`);
  if (!sl) continue;
  const lv = World.levelOf('hut', sl.x, sl.y); ok(lv.need >= 1 && lv.need <= 2 && Math.abs(lv.minutes - lv.need * per) < 1e-9, `${tag}: stok 2×2: ${lv.need} pól do przesunięcia = ${lv.minutes} min`);
  // plac na stoku: budowniczowie kopią bez materiałów, potem teren płaski i odświeżenie
  const saved = Object.assign({}, s.res); for (const g of ['deski', 'kamień', 'glina']) s.res[g] = 0;
  const r = Build.enqueue('hut', sl.x, sl.y); const site = s.sites.find(x => x.uid === s.nextId - 1); s.res.deski = 0;
  ok(r.ok && site.levelLeft > 0, `${tag}: plac na stoku ma etap wyrównywania (${site && site.levelLeft} min)`);
  Build.tick(0.05); ok(site.assigned >= 1, `${tag}: budowniczowie dostają przydział mimo braku materiałów (${site.assigned})`);
  let guard = 0; while (site.levelLeft > 0 && guard++ < 4000) Build.tick(0.05);
  const tiles = []; for (let dy = 0; dy < site.h; dy++) for (let dx = 0; dx < site.w; dx++) tiles.push(MapGen.at(map, site.x + dx, site.y + dy).e);
  ok(site.levelLeft === 0 && tiles.every(e => e === site.levelTarget), `${tag}: po wyrównaniu obrys jest płaski (poziom ${site.levelTarget})`);
  ok(map.dirty && map.dirty.some(d => d[0] === site.x && d[1] === site.y), `${tag}: wyrównany obszar zgłoszony do odświeżenia grafiki`);
  ok(World.levelOf('hut', sl.x, sl.y).need === 0, `${tag}: ten sam obrys ma teraz wyrównanie 0`);
  Object.assign(s.res, saved);
}

// czas budowy: ten sam budynek na płaskim i na stoku (bez kary za ciasnotę) — różnica ≈ minuty wyrównania / liczba budowniczych
{
  const timeOn = (slope) => {
    World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); const s = World.state(); s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; s.pop = 40; s.builders = 3;
    const spot = slope ? slopeSpot('hut') : flatSpot('hut', 14); const lv = World.levelOf('hut', spot.x, spot.y); Build.enqueue('hut', spot.x, spot.y); const site = s.sites[0];
    return { t: finish(s, site), site, lv, crowd: site.crowd };
  };
  const a = timeOn(false), b = timeOn(true);
  ok(a.crowd === 0 && b.crowd === 0, 'porównanie bez kary za ciasną zabudowę');
  ok(b.t > a.t + 0.5 * b.lv.minutes / 3 && b.t < a.t + 2 * b.lv.minutes + 0.2, `stok wydłuża budowę o ≈ wyrównanie (płasko ${a.t.toFixed(2)} min, stok ${b.t.toFixed(2)} min, wyrównanie ${b.lv.minutes} min)`);
}
// zakaz rozpiętości ≥ 2 (klify) i boty wybierają płaskie miejsca
{
  World.init('franks', { climate: 'temperate', type: 'mountains', seed: 7 }); const s = World.state(); s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999;
  let bad = 0; for (let y = 0; y < N - 2; y++) for (let x = 0; x < N - 2; x++) { const es = [0, 1].flatMap(dy => [0, 1].map(dx => MapGen.at(s.map, x + dx, y + dy).e)); if (Math.max(...es) - Math.min(...es) >= 2 && World.canPlace('hut', x, y).ok) bad++; }
  ok(bad === 0, `canPlace nie pozwala na obrys o rozpiętości ≥ 2 (${bad} pól)`);
  let flatPick = 0, picks = 0;
  for (const id of ['hut', 'woodcutter', 'store', 'dairy', 'sawmill', 'market']) { const p = TestBots.findPlace(s, id); if (!p) continue; picks++; if (World.levelOf(id, p.x, p.y).need === 0) flatPick++; World.placeBuilding(id, p.x, p.y); }
  ok(picks >= 5 && flatPick >= picks - 1, `boty wybierają płaskie miejsca (${flatPick} z ${picks})`);
}
ok(rngIn === 0, `levelOf nie wywołuje RNG (${rngIn})`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
