// Test zasad zabudowy (Data.RULES): twarda przerwa między obrysami (canPlace odrzuca budynek styczny lub w pierścieniu `gap`),
// miękka kara czasu budowy za sąsiadów tuż za przerwą (crowdOf → workNeed placu), brak wpływu przerwy na drogi, boty układają całą recepturę.
// Użycie: node tools/spacing.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, TestBots, MapGen, Roads } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
const R = Data.RULES, g = R.gap;
console.log(`zasady: przerwa ${g} pole, kara +${R.crowd.per * 100}% za sąsiada w pierścieniu ${R.crowd.ring} za przerwą, maks. +${R.crowd.max * 100}%`);

for (const fid of ['franks', 'vikings']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'coast', seed: 5 });
  const s = World.state(), k = s.keep; s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; s.res.narzędzia = 99;
  // 1. tuż przy Dworze: styk i pierścień przerwy odrzucone, pole za przerwą wolne
  const [w, h] = Data.footprint('hut', fid);
  const touch = World.canPlace('hut', k.x + k.w, k.y), gapRow = World.canPlace('hut', k.x + k.w + g - 1, k.y), clear = World.canPlace('hut', k.x + k.w + g, k.y);
  ok(!touch.ok && /blisko/.test(touch.reason || ''), `${fid}: budynek tuż przy Dworze odrzucony (${touch.reason})`);
  ok(!gapRow.ok || g < 1, `${fid}: pole w pierścieniu przerwy odrzucone`);
  ok(clear.ok, `${fid}: pole za przerwą dozwolone (${clear.reason || 'ok'})`);
  // 2. dwa place: drugi styczny do pierwszego — odmowa; po przerwie — zgoda
  const a = Build.enqueue('hut', k.x + k.w + g, k.y); ok(a.ok, `${fid}: pierwszy plac otwarty`);
  ok(!World.canPlace('hut', k.x + k.w + g + w, k.y).ok, `${fid}: plac styczny do placu odrzucony`);
  const right = k.x + k.w + g + w; let first = null;
  for (let x = right; x < right + 10 && first === null; x++) for (let y = k.y - 2; y <= k.y + 2 && first === null; y++) if (World.canPlace('hut', x, y).ok) first = x;
  ok(first !== null && first >= right + g, `${fid}: najbliższe dozwolone miejsce obok placu leży za przerwą (x=${first}, plac kończy się na ${right})`);
  // 3. kara czasu budowy: pusty teren 0%, sąsiad za jedną przerwą +10%, dwóch +20%; plac zapisuje karę i wydłuża workNeed
  const site1 = s.sites[0], base = (1.0 + 0.1 * site1.pieces);
  ok(Math.abs(site1.workNeed - base * (1 + site1.crowd)) < 1e-9, `${fid}: workNeed placu = bazowy × (1 + kara)`);
  const farX = k.x + k.w + g + w + g + 6, c0 = World.crowdOf('hut', farX, k.y);
  ok(c0.n === 0 && c0.pct === 0, `${fid}: z dala od innych — bez kary`);
  const near = World.crowdOf('hut', right + g, k.y);   // plac po prawej za przerwą → sąsiad pierścienia (+ Dwór po lewej? — tylko pierścień za przerwą)
  ok(near.n >= 1 && Math.abs(near.pct - Math.min(R.crowd.max, near.n * R.crowd.per)) < 1e-9, `${fid}: sąsiad za przerwą daje karę ${Math.round(near.pct * 100)}% (sąsiadów ${near.n})`);
  // 3b. strefy: pole 1 zakaz, pola 2–3 dłuższa budowa, od 4. normalnie (odległość liczona od ostatniego pola obrysu placu)
  const x1 = k.x + k.w + g + w, zone = d => World.crowdOf('hut', x1 - 1 + d, k.y);
  ok(zone(2).n === 1 && zone(3).n === 1 && zone(4).n === 0 && zone(5).n === 0, `${fid}: sąsiad liczy się w odległości 2 i 3 pól, od 4. nie (${[2, 3, 4, 5].map(d => zone(d).n).join('/')})`);
  ok(Math.abs(zone(2).pct - R.crowd.per) < 1e-9 && zone(4).pct === 0, `${fid}: kara = ${R.crowd.per * 100}% za jednego sąsiada, 0 od 4. pola`);
  // 4. droga mieści się w przerwie (nie jest zajęciem pola)
  const rd = Roads.lay(k.x + k.w, k.y + 1, k.x + k.w + g - 1 + 0, k.y + 1);
  ok(rd.ok || g === 0, `${fid}: droga w przerwie między budynkami`);
  // 5. boty układają całą recepturę mimo przerwy
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'coast', seed: 5 });
  const s2 = World.state(); s2.res.deski = 99999; s2.res.kamień = 999; s2.res.glina = 999; s2.res.złoto = 99999; s2.res.narzędzia = 99;
  const miss = [];
  for (const id of TestBots.RECIPE[fid]) {
    if (id === 'ship' && !s2.buildings.some(b => b.id === 'dock')) { const d = TestBots.findPlace(s2, 'dock'); if (d) World.placeBuilding('dock', d.x, d.y); }
    const p = TestBots.findPlace(s2, id); if (!p) { miss.push(id); continue; } World.placeBuilding(id, p.x, p.y);
  }
  ok(miss.length === 0, `${fid}: receptura (${TestBots.RECIPE[fid].length} budynków) mieści się z przerwą` + (miss.length ? ' — brak: ' + miss.join(',') : ''));
  // żadna para budynków nie leży bliżej niż przerwa
  let tooClose = 0;
  for (const b1 of s2.buildings) for (const b2 of s2.buildings) if (b1.uid < b2.uid) {
    const dx = Math.max(b2.x - (b1.x + b1.w), b1.x - (b2.x + b2.w), 0), dy = Math.max(b2.y - (b1.y + b1.h), b1.y - (b2.y + b2.h), 0);
    if (Math.max(dx, dy) < g) tooClose++;
  }
  ok(tooClose === 0, `${fid}: ${tooClose} par budynków bliżej niż przerwa`);
}
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
