// Oczyszczanie terenu pod budowę (Faza 9E-3, settings.clearing): na polach z drzewami i bagnem wolno budować — budowniczowie najpierw ścinają drzewa (RULES.clear.tree min na drzewo)
// i osuszają bagno (RULES.clear.bog min na pole), co wydłuża budowę; rzeki, klify, wydmy, ruchome piaski i złoża nadal blokują. Przy wyłączonej fladze obowiązuje dawny zakaz.
// Użycie: node tools/clearing.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, Terrain } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const rich = s => { s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; s.res.narzędzia = 50; };
const fp = (s, id, x, y) => { const [w, h] = World.footprint(id); const out = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push((y + dy) * s.map.size + x + dx); return out; };
const findSpot = (s, id, pred) => { const N = s.map.size; for (let y = 2; y < N - 3; y++) for (let x = 2; x < N - 3; x++) if (pred(fp(s, id, x, y).map(i => s.map.tiles[i]), x, y)) return [x, y]; return null; };
const R = Data.RULES.clear;

for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: fid === 'vikings' ? 'coast' : 'plain', seed: 4 }); let s = World.state(); rich(s);
  // flaga wyłączona: dawny zakaz
  const spotT = findSpot(s, 'hut', (ts) => ts.some(t => t.trees > 0) && ts.every(t => t.h === 1 && !t.occup && !t.deposit && !t.k));
  if (!ok(spotT, `${fid}: jest miejsce z drzewami`)) continue;
  ok(!World.canPlace('hut', spotT[0], spotT[1]).ok, `${fid}: bez flagi na drzewach nie wolno budować`);
  s.settings.clearing = true;
  const cp = World.canPlace('hut', spotT[0], spotT[1]); const cl = World.clearOf('hut', spotT[0], spotT[1]);
  ok(cp.ok || /przerwa|Za blisko|odcięty|nierówny/.test(cp.reason), `${fid}: z flagą drzewa nie blokują (${cp.reason || 'ok'})`);
  if (!cp.ok) continue;
  const trees0 = fp(s, 'hut', spotT[0], spotT[1]).reduce((a, i) => a + s.map.tiles[i].trees, 0);
  ok(cl.trees === trees0 && Math.abs(cl.minutes - trees0 * R.tree) < 1e-9, `${fid}: clearOf liczy ${cl.trees} drzew = ${cl.minutes.toFixed(1)} min`);
  const lv0 = World.levelOf('hut', spotT[0], spotT[1]).minutes;
  const r = Build.enqueue('hut', spotT[0], spotT[1], 0); ok(r.ok, `${fid}: plac na drzewach otwarty`);
  const site = s.sites[0]; ok(Math.abs(site.levelTotal - (lv0 + cl.minutes)) < 1e-9 && site.clr && site.clr.trees === trees0, `${fid}: plac ma czas czyszczenia (${site.levelTotal.toFixed(1)} min etapu 0)`);
  // drzewa znikają po kolei, nigdy nie przybywają; budynek staje po czyszczeniu
  let prev = trees0, mono = true, t = 0, done = false, tAt0 = null;
  for (; t < 400; t += 0.1) { World.tick(0.1); const cur = fp(s, 'hut', spotT[0], spotT[1]).reduce((a, i) => a + s.map.tiles[i].trees, 0); if (cur > prev) mono = false; if (cur === 0 && tAt0 == null) tAt0 = t; prev = cur; if (!s.sites.length) { done = true; break; } }
  ok(mono && tAt0 != null && done, `${fid}: drzewa znikają stopniowo (do zera po ${tAt0 == null ? '?' : tAt0.toFixed(1)} min) i budynek powstaje (${t.toFixed(1)} min)`);
  ok(s.buildings.some(b => b.id === 'hut' && b.x === spotT[0] && b.y === spotT[1]), `${fid}: Chata stoi na oczyszczonym polu`);
  // wolne pole buduje się krócej
  const spotF = findSpot(s, 'hut', (ts, x, y) => World.canPlace('hut', x, y).ok && ts.every(q => !q.trees && !q.k) && World.levelOf('hut', x, y).minutes === lv0);
  if (spotF) { Build.enqueue('hut', spotF[0], spotF[1], 0); const sf = s.sites[s.sites.length - 1]; ok(!sf.clr && sf.levelTotal < site.levelTotal + 1e-9 && (trees0 === 0 || sf.levelTotal < site.levelTotal), `${fid}: plac na wolnym polu ma krótszy etap 0 (${sf.levelTotal.toFixed(1)} < ${site.levelTotal.toFixed(1)} min)`); }
}

// bagno: osuszane, rzeka nie
{
  World.init('franks', { climate: 'temperate', type: 'wetlands', seed: 2 }); const s = World.state(); rich(s); s.settings.clearing = true;
  const spotB = findSpot(s, 'hut', (ts, x, y) => ts.some(t => t.k === 'bog') && ts.every(t => t.h === 1 && !t.occup && !t.deposit && (!t.k || t.k === 'bog')) && World.canPlace('hut', x, y).ok);
  if (ok(spotB, 'mapa z bagnami: jest miejsce na bagnie')) {
    const cl = World.clearOf('hut', spotB[0], spotB[1]); ok(cl.bogs > 0 && cl.minutes >= cl.bogs * R.bog, `bagno: clearOf ${cl.bogs} pól = ${cl.minutes.toFixed(1)} min`);
    Build.enqueue('hut', spotB[0], spotB[1], 0); for (let t = 0; t < 600 && s.sites.length; t += 0.1) World.tick(0.1);
    ok(!s.sites.length && fp(s, 'hut', spotB[0], spotB[1]).every(i => s.map.tiles[i].k !== 'bog'), 'bagno osuszone, Chata stoi');
  }
  const N = s.map.size; let water = null, cliff = null, deposit = null;
  for (let y = 1; y < N - 2; y++) for (let x = 1; x < N - 2; x++) { const t = s.map.tiles[y * N + x]; if (!water && t.h === 0 && s.map.tiles[y * N + x + 1].h === 0 && s.map.tiles[(y + 1) * N + x].h === 0 && s.map.tiles[(y + 1) * N + x + 1].h === 0) water = [x, y]; if (!cliff && t.k === 'cliff') cliff = [x, y]; }
  ok(!water || !World.canPlace('hut', water[0], water[1]).ok, 'woda (rzeka, jezioro, morze) nie jest oczyszczana');
  ok(!cliff || !World.canPlace('hut', cliff[0], cliff[1]).ok, 'klif nadal blokuje');
}
// złoże zostaje zarezerwowane, nawet z flagą
{
  World.init('franks', { climate: 'temperate', type: 'mountains', seed: 3 }); const s = World.state(); rich(s); s.settings.clearing = true; const N = s.map.size;
  let dep = null; for (let i = 0; i < N * N; i++) if (s.map.tiles[i].deposit) { dep = i; break; }
  ok(dep != null && !World.canPlace('hut', dep % N, (dep / N) | 0).ok, 'złoże jest nadal zarezerwowane dla kopalni');
}
console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `Wszystko OK — ${checks} sprawdzeń`); process.exit(fails ? 1 : 0);
