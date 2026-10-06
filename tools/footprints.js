// Test obrysów budynków (w×h pól): zgodność z katalogiem sprite'ów, zajętość i zwolnienie pól, canPlace z pierścieniem sąsiedztwa,
// złoża pod kopalnią na dowolnym polu obrysu, place budowy (siteAt / cancel), wyburzenie, start Dworu 4×4 i miejsca dla botów.
// Użycie: node tools/footprints.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, Events, MapGen, TestBots } = G, Terrain = G.run('Terrain');
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
const FACTIONS = ['slavs', 'franks', 'vikings', 'saracens'];
const idsOf = fid => Object.keys(Data.BUILDINGS).filter(id => id !== 'keep' && (!Data.BUILDINGS[id].factions || Data.BUILDINGS[id].factions.includes(fid)));
const tiles = (x, y, w, h) => { const o = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) o.push([x + dx, y + dy]); return o; };
/* wolny obrys wg reguł gry: ląd bez drzew, złóż, zajętości i cech blokujących; różnica wysokości < 2; styka się z obszarem osiągalnym z Dworu */
const freeFp = (s, x, y, w, h) => tiles(x, y, w, h).every(([tx, ty]) => { const t = MapGen.at(s.map, tx, ty); return t && t.h === 1 && !t.occup && !t.trees && !t.deposit && !(t.k && Terrain.BLOCK_K[t.k]); })
  && (() => { const es = tiles(x, y, w, h).map(([tx, ty]) => MapGen.at(s.map, tx, ty).e); return Math.max(...es) - Math.min(...es) < 2; })()
  && Terrain.ringReachable(s.map, x, y, w, h)
  && tiles(x - Data.RULES.gap, y - Data.RULES.gap, w + 2 * Data.RULES.gap, h + 2 * Data.RULES.gap).every(([tx, ty]) => { const t = MapGen.at(s.map, tx, ty); return !t || t.occup == null; });   // twarda przerwa (Data.RULES.gap) wokół obrysu
const occ = (s, x, y) => { const t = MapGen.at(s.map, x, y); return t ? t.occup : undefined; };

for (const fid of FACTIONS) {
  console.log(fid);
  World.init(fid);
  const s = World.state(), meta = G.run('SPRITE_META')[fid];

  // --- katalog ↔ Data.footprint, Dwór 4×4 na środku, plac wokół Dworu ---
  let bad = idsOf(fid).concat('keep').filter(id => !meta[id] || meta[id].fp.join() !== Data.footprint(id, fid).join());
  ok(bad.length === 0, 'Data.footprint zgodne z katalogiem sprite\'ów' + (bad.length ? ': ' + bad.join(',') : ''));
  const k = s.keep;
  ok(k.w === 4 && k.h === 4 && k.x === 22 && k.y === 22, 'Dwór 4×4 na środku mapy (22,22) — jest ' + k.w + '×' + k.h + ' @' + k.x + ',' + k.y);
  ok(tiles(k.x, k.y, 4, 4).every(([x, y]) => occ(s, x, y) === k.uid), 'Dwór zajmuje 16 pól');
  let clear = true;
  for (let y = 20; y <= 27; y++) for (let x = 20; x <= 27; x++) { const t = MapGen.at(s.map, x, y); if (t.h !== 1 || t.trees || t.deposit) clear = false; }
  ok(clear, 'plac 8×8 wokół Dworu: ląd bez drzew i złóż');
  ok(MapGen.at(s.map, 21, 21).occup == null && MapGen.at(s.map, 26, 26).occup == null, 'pola wokół Dworu wolne');

  // --- każdy budynek nacji: zajętość, plac, anulowanie, wyburzenie ---
  s.res.deski = 5000; s.res.kamień = 500; s.res.glina = 500; s.res.złoto = 5000; s.res.narzędzia = 50;
  const missing = [];
  for (const id of idsOf(fid)) {
    const [w, h] = Data.footprint(id, fid), spot = TestBots.findPlace(s, id);
    if (!spot) { missing.push(id); continue; }
    ok(World.canPlace(id, spot.x, spot.y).ok, id + ': findPlace zwraca poprawne miejsce');
    // plac budowy
    const r = Build.enqueue(id, spot.x, spot.y), site = s.sites.find(st => st.id === id && st.x === spot.x && st.y === spot.y);
    ok(r.ok && site && site.w === w && site.h === h, id + ': plac ' + w + '×' + h);
    if (!site) continue;
    ok(tiles(spot.x, spot.y, w, h).every(([x, y]) => occ(s, x, y) === site.uid), id + ': plac zajmuje wszystkie pola obrysu');
    ok(tiles(spot.x, spot.y, w, h).every(([x, y]) => Build.siteAt(x, y) === site), id + ': siteAt widzi całość obrysu');
    ok(Build.siteAt(spot.x - 1, spot.y) !== site && Build.siteAt(spot.x + w, spot.y + h - 1) !== site, id + ': siteAt poza obrysem puste');
    // nachodzenie: obrys przesunięty o 1 pole nakłada się na plac → zakaz
    ok(!World.canPlace(id, spot.x + w - 1, spot.y).ok && !World.canPlace(id, spot.x, spot.y + h - 1).ok, id + ': nachodzący obrys odrzucony');
    const gold0 = s.res.złoto;
    Build.cancel(site);
    ok(tiles(spot.x, spot.y, w, h).every(([x, y]) => occ(s, x, y) == null) && !s.sites.includes(site), id + ': anulowanie zwalnia całość obrysu');
    ok(s.res.złoto >= gold0, id + ': anulowanie zwraca złoto');
    // gotowy budynek i wyburzenie
    const b = World.placeBuilding(id, spot.x, spot.y);
    ok(b.w === w && b.h === h && tiles(spot.x, spot.y, w, h).every(([x, y]) => occ(s, x, y) === b.uid), id + ': budynek zajmuje ' + w * h + ' pól');
    Events.destroy(s, b);
    ok(tiles(spot.x, spot.y, w, h).every(([x, y]) => occ(s, x, y) == null) && !s.buildings.includes(b), id + ': wyburzenie zwalnia obrys');
  }
  // brak miejsca dopuszczalny tylko dla budynków z wymaganiem terenowym (brzeg, złoże) na mapie, która ich nie ma
  const unexpected = missing.filter(id => !Data.BUILDINGS[id].req);
  ok(unexpected.length === 0, 'miejsce znalezione dla wszystkich budynków bez wymagań terenowych' + (unexpected.length ? ': ' + unexpected.join(',') : ''));
  if (missing.length) console.log('    (bez miejsca na tej mapie: ' + missing.join(', ') + ')');

  // --- kopalnie: złoże na dowolnym polu obrysu ---
  for (const id of idsOf(fid).filter(i => (Data.BUILDINGS[i].req || '').startsWith('deposit:'))) {
    const kind = Data.BUILDINGS[id].req.split(':')[1], [w, h] = Data.footprint(id, fid);
    World.init(fid); const s2 = World.state(); s2.res.deski = 999;
    const dep = s2.map.tiles.find(t => t.deposit === kind);
    ok(!!dep, id + ': na mapie jest złoże ' + kind);
    if (!dep) continue;
    let good = 0, total = 0;
    for (let oy = dep.y - h + 1; oy <= dep.y; oy++) for (let ox = dep.x - w + 1; ox <= dep.x; ox++) { total++; if (World.canPlace(id, ox, oy).ok) good++; }
    ok(good > 0, id + ': kopalnia mieści się na złożu ' + kind + ' (' + good + '/' + total + ' ułożeń obrysu)');
    let blank = null; // wolny obrys bez złoża w pobliżu Dworu → kopalnia odrzucona (brak złoża)
    for (let y = 28; y < 40 && !blank; y++) for (let x = 14; x < 40 && !blank; x++)
      if (tiles(x, y, w, h).every(([tx, ty]) => { const t = MapGen.at(s2.map, tx, ty); return t && t.h === 1 && !t.occup && !t.trees && !t.deposit; })) blank = { x, y };
    ok(blank && !World.canPlace(id, blank.x, blank.y).ok, id + ': wolny obrys bez złoża — odmowa');
    const plain = idsOf(fid).find(i => !Data.BUILDINGS[i].req && Data.footprint(i, fid).join() === '2,2');
    ok(!World.canPlace(plain, dep.x, dep.y).ok, 'zwykły budynek nie stanie na złożu ' + kind);
    World.init(fid);
  }

  // --- pierścień sąsiedztwa: las i brzeg liczone wokół całego obrysu ---
  World.init(fid);
  const s3 = World.state(), hunter = Data.BUILDINGS.hunter;
  let forestOk = 0, forestWrong = 0;
  for (let y = 1; y < 47; y++) for (let x = 1; x < 47; x++) {
    const [w, h] = Data.footprint('hunter', fid); let trees = 0;
    for (let dy = -1; dy <= h; dy++) for (let dx = -1; dx <= w; dx++) { const t = MapGen.at(s3.map, x + dx, y + dy); if (t) trees += t.trees; }
    const expect = freeFp(s3, x, y, w, h) && trees >= 4, got = World.canPlace('hunter', x, y).ok;
    if (expect === got) forestOk++; else forestWrong++;
  }
  ok(hunter.req === 'forest' && forestWrong === 0, 'wymóg lasu liczony w pierścieniu wokół obrysu (' + forestOk + ' pól zgodnych, ' + forestWrong + ' różnic)');
  if (fid === 'vikings') {
    let shoreOk = 0, shoreBad = 0;
    for (let y = 1; y < 47; y++) for (let x = 1; x < 47; x++) {
      const [w, h] = Data.footprint('dock', fid); let sea = false;
      for (let dy = -1; dy <= h; dy++) for (let dx = -1; dx <= w; dx++) { const t = MapGen.at(s3.map, x + dx, y + dy); if (t && t.wk === 'sea') sea = true; }
      if ((freeFp(s3, x, y, w, h) && sea) === World.canPlace('dock', x, y).ok) shoreOk++; else shoreBad++;
    }
    ok(shoreBad === 0, 'Przystań 4×2: dostęp do wody liczony w pierścieniu (' + shoreOk + ' zgodnych, ' + shoreBad + ' różnic)');
  }

  // --- boty: cały przepis nacji znajduje miejsca (poza budynkami z wymaganiem, którego mapa nie spełnia) ---
  World.init(fid);
  const s4 = World.state(); s4.res.deski = 99999; s4.res.kamień = 999; s4.res.glina = 999; s4.res.złoto = 99999;
  let noplace = [];
  for (const id of TestBots.RECIPE[fid]) {
    if (id === 'ship' && !s4.buildings.some(b => b.id === 'dock')) { const d = TestBots.findPlace(s4, 'dock'); ok(!!d, 'Przystań ma miejsce na brzegu morza'); if (d) World.placeFree('dock', d.x, d.y); }
    const p = TestBots.findPlace(s4, id);
    if (!p) { noplace.push(id); continue; }
    World.placeBuilding(id, p.x, p.y);
  }
  ok(noplace.length === 0, 'bot znajduje miejsce dla całego przepisu (' + TestBots.RECIPE[fid].length + ' budynków)' + (noplace.length ? ' — brak: ' + noplace.join(',') : ''));
  // żadne dwa budynki nie dzielą pola
  const seen = new Map(); let overlap = 0;
  for (const b of s4.buildings) for (const [x, y] of tiles(b.x, b.y, b.w, b.h)) { const key = x + ',' + y; if (seen.has(key)) overlap++; seen.set(key, b.uid); }
  ok(overlap === 0, 'budynki nie nachodzą na siebie (' + s4.buildings.length + ' budynków)');
}

// nieznany identyfikator: zapasowy obrys 1×1
ok(Data.footprint('nie_ma_takiego', 'franks').join() === '1,1', 'nieznany budynek ma obrys 1×1');
console.log(fails ? '\n' + fails + ' z ' + checks + ' sprawdzeń nie przeszło' : '\nWszystko OK (' + checks + ' sprawdzeń)');
process.exit(fails ? 1 : 0);
