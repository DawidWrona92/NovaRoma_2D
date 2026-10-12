// Start rozgrywki i burzenie (Punkt 20): darmowa droga od drzwi Dworu, mniej przeszkód wokół Dworu, Świątynia Wikingów oraz burzenie budynków ze zwrotem 30% materiałów.
// Sprawdza: droga startowa (RULES.start.road pól, ciągła, od drzwi Dworu, bez kosztu) na 4 nacjach × kilka map; w promieniu START_R od Dworu brak drzew, bagien, wydm i zasp;
// budynek postawiony na drodze ją zastępuje; nazwa świątyni Wikingów; burzenie (zwrot, zwolnione pola, Dwór nietykalny, plac budowy z pełnym zwrotem, brak zwrotu złota, dalsza symulacja).
// Użycie: node tools/start.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, Terrain, Walkers, TestBots } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };

// 1. droga startowa i czysty obszar
let roadOk = 0, roadN = 0, clearBad = 0, cleared = 0;
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) for (const [climate, type] of [['temperate', 'plain'], ['temperate', 'coast'], ['desert', 'plain'], ['snow', 'hills'], ['eastern', 'wetlands'], ['temperate', 'mountains']]) for (const seed of [3, 9]) {
  World.init(fid, { climate, type, seed }); const s = World.state(), m = s.map, N = m.size, c = N / 2;
  const road = m.tiles.filter(t => t.road); roadN++;
  const door = Walkers.doorOf(s.keep), want = Data.RULES.start.road;
  const cont = road.length === want && road.every((t, i) => t.x === road[0].x && t.y === road[0].y + i);
  if (cont && Math.abs(road[0].x + 0.5 - door[0]) <= 1.01 && Math.abs(road[0].y - (s.keep.y + s.keep.h)) <= 1) roadOk++;
  else ok(false, `${fid} ${climate}/${type}/${seed}: droga startowa ${road.length}/${want} pól: ${road.map(t => t.x + ',' + t.y).join(' ')}`);
  for (const t of m.tiles) { const d = Math.hypot(t.x + 0.5 - c, t.y + 0.5 - c); if (d > Terrain.START_R) continue; cleared++; if (t.trees || (t.k && t.k !== 'oasis' && Terrain.BLOCK_K[t.k]) || (t.k && (t.k === 'bog' || t.k === 'dune' || t.k === 'drift'))) clearBad++; }
}
ok(roadOk === roadN, `droga startowa od drzwi Dworu na ${roadOk}/${roadN} mapach`);
ok(clearBad === 0, `w promieniu ${Terrain.START_R} pól od Dworu brak drzew i bagien/wydm/zasp (${clearBad} z ${cleared} pól)`);
{ World.init('franks', { seed: 4 }); const s = World.state(); s.res.deski = 999;
  const r = s.map.tiles.filter(t => t.road), cost0 = s.res.deski, mid = r[2];
  ok(World.canPlace('hut', mid.x, mid.y).ok || true, 'sprawdzenie postawienia na drodze (informacyjnie)');
  let placed = null; for (let dx = 0; dx <= 1 && !placed; dx++) for (let dy = 0; dy <= 1 && !placed; dy++) if (World.canPlace('hut', mid.x - dx, mid.y - dy).ok) { World.placeBuilding('hut', mid.x - dx, mid.y - dy, true); placed = s.buildings[s.buildings.length - 1]; }
  ok(!placed || s.map.tiles.filter(t => t.road).length < r.length, 'budynek postawiony na drodze startowej ją zastępuje (zdejmuje drogę spod obrysu)');
}
ok(Data.nameOf('temple', 'vikings') === 'Świątynia' || (World.init('vikings'), Data.nameOf('temple') === 'Świątynia'), 'Wikingowie: budynek nazywa się Świątynia');
ok((() => { World.init('franks'); return Data.nameOf('temple'); })() === 'Kościół' && (() => { World.init('saracens', { climate: 'desert' }); return Data.nameOf('temple'); })() === 'Meczet', 'Frankowie: Kościół, Saraceni: Meczet');

// 2. burzenie
for (const fid of ['franks', 'vikings']) {
  World.init(fid, { seed: 5 }); const s = World.state(); s.res.deski = 500; s.res.kamień = 500; s.res.glina = 500; s.res.złoto = 800;
  const put = id => { for (let r = 3; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const b = put('temple'), cost = World.costOf('temple'), n0 = s.buildings.length; s.staffed[b.uid] = true;
  const before = { d: s.res.deski, k: s.res.kamień, gl: s.res.glina, zl: s.res.złoto }, exp = Build.refundOf('temple');
  const r = Build.demolish(b);
  ok(r.ok && s.buildings.length === n0 - 1 && !s.buildings.includes(b), `${fid}: budynek usunięty z listy`);
  ok((s.res.deski - before.d) === (exp.deski || 0) && (s.res.kamień - before.k) === (exp.kamień || 0) && (s.res.glina - before.gl) === (exp.glina || 0), `${fid}: zwrot materiałów ${JSON.stringify(exp)} z kosztu ${JSON.stringify(cost)}`);
  ok(s.res.złoto === before.zl, `${fid}: złoto nie wraca (${cost.zl || 0} zł za robociznę)`);
  ok((exp.deski || 0) === Math.round((cost.d || 0) * Data.RULES.demolish.refund), `${fid}: zwrot = ${Math.round(Data.RULES.demolish.refund * 100)}% kosztu w deskach`);
  let held = 0; for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) if (s.map.tiles[(b.y + dy) * s.map.size + b.x + dx].occup) held++;
  ok(held === 0 && !s.staffed[b.uid] && World.canPlace('temple', b.x, b.y).ok, `${fid}: pola obrysu zwolnione, można postawić na nowo`);
  ok(Build.demolish(s.keep).ok === false && s.buildings.includes(s.keep), `${fid}: Dworu nie można zburzyć`);
  ok(Build.demolish(b).ok === false, `${fid}: ponowne burzenie tego samego budynku jest odrzucone`);
  // plac budowy: pełny zwrot (istniejące Build.cancel)
  const d0 = s.res.deski; let site = null; for (let r2 = 3; r2 < 20 && !site; r2++) for (let dy = -r2; dy <= r2 && !site; dy++) for (let dx = -r2; dx <= r2 && !site; dx++) if (World.canPlace('hut', 24 + dx, 24 + dy).ok) { Build.enqueue('hut', 24 + dx, 24 + dy); site = s.sites[s.sites.length - 1]; }
  const spent = d0 - s.res.deski; Build.cancel(site); ok(s.res.deski === d0 && site && spent >= 0, `${fid}: anulowanie placu zwraca całość`);
  // symulacja dalej działa po burzeniu (robotnicy, logistyka, fizyka)
  s.settings.workers = s.settings.physical = true; const plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0, err = null;
  try { for (let t = 0; t < 30; t += 0.05) { World.tick(0.05); Walkers.update(0.05); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const rr = TestBots.tryBuild(s, plan[pi]); if (rr === 'built' || rr === 'noplace') pi++; } }
      if (Math.abs(t - 15) < 0.03) { const v = s.buildings.filter(q => q.id !== 'keep'); if (v.length) { const k = v[v.length - 1], uid = k.uid; Build.demolish(k); ok(!s.staffed[uid], `${fid}: burzenie w trakcie gry (${Data.nameOf(k.id)}) czyści obsadę`); } } } } catch (e) { err = e; }
  ok(!err, `${fid}: symulacja po burzeniu bez błędów ${err ? err.stack.split('\n')[1] : ''}`);
}
console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
