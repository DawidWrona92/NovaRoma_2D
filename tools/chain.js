// Łańcuch Drwal → Tartak (poprawka błędu zgłoszonego przez grających): gdy Tartak dostaje tylko część pni, jego robotnik ma pracować (piłować), a nie stać i zamiatać,
// pnie wnosi do Składu / Dworu drwal, a robotnik Tartaku je stamtąd zabiera i odnosi deski. Sprawdza stany logiki (ułamek pracy) i widoczne czynności robotnika.
// Użycie: node tools/chain.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Workers, Walkers } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: fid === 'vikings' ? 'coast' : 'plain', seed: 3 });
  const s = World.state(); s.res.deski = 999; s.res.kamień = 99; s.res.złoto = 999; s.res.narzędzia = 50; s.res['pień'] = 0; s.settings.workers = true; s.settings.physical = true;
  const put = id => { for (let r = 3; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const wc = put('woodcutter'), sw = put('sawmill'); s.staffed[wc.uid] = s.staffed[sw.uid] = true; s.res.deski = 0;
  let n = 0, working = 0, idleSt = 0, sweeping = 0, partial = 0, sawActs = 0, loadSeen = new Set();
  for (let i = 0; i < 1200; i++) {
    World.tick(0.05); Walkers.update(0.05); if (i % 20 === 19) s.res.deski = 0;                      // deski są stale wydawane (budowa), więc Tartak nie stoi z pełnym magazynem
    if (i < 400) continue; n++;
    const w = Walkers.figures().find(a => a.kind === 'worker' && a.uid === sw.uid); if (!w) continue;
    if (sw.st && sw.st.c === 'in' && (sw.eff || 0) >= 0.2) partial++;
    if (Workers.idleNow(sw)) idleSt++;
    if (w.act === 'sweep' || w.act === 'look') sweeping++;
    if (w.act === 'saw') sawActs++;
    if (w.load) loadSeen.add(w.load[0]);
  }
  const eff = sw.eff || 0;
  ok(eff > 0.2 && (partial > n * 0.5 || (sw.st && sw.st.c !== 'in')), `${fid}: Tartak produkuje (${Math.round(eff * 100)}% nominału) i bywa w stanie „za mało pni” (${partial}/${n})`);
  ok(idleSt === 0, `${fid}: robotnik Tartaku nie jest uznany za bezczynnego, gdy Tartak pracuje częściowo (${idleSt}/${n} próbek)`);
  ok(sweeping < n * 0.15, `${fid}: robotnik Tartaku nie zamiata zamiast pracować (${sweeping}/${n} próbek)`);
  ok(sawActs > n * 0.2, `${fid}: robotnik Tartaku piłuje (${sawActs}/${n} próbek)`);
  console.log(`${fid}: eff Tartaku ${Math.round(eff * 100)}% · piłuje ${sawActs}/${n} · zamiata ${sweeping} · ładunki ${[...loadSeen].join(',')}`);
}
// Leśnik: sadzi sadzonki na polach wybranych przez logikę, ręka pusta po sadzeniu, powrót do domu po następną, drzewo wyrasta tam, gdzie posadzono
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: fid === 'vikings' ? 'coast' : 'plain', seed: 5 });
  const s = World.state(); s.res.narzędzia = 50; s.settings.workers = true; s.settings.physical = true;
  const put = id => { for (let r = 3; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const fo = put('forester'); s.staffed[fo.uid] = true; const door = Walkers.doorOf(fo), N = s.map.size;
  let away = false, wasPlant = false, violHome = 0, plants = 0, loadAfter = 0, tracked = new Map(), matured = 0, ok1 = 0, sawPlanted = 0, sawTotal = 0, farPlant = 0;
  const growth = Data.FACTIONS[fid].treeGrowthMin;
  for (let i = 0; i < Math.ceil((growth + 40) / 0.05); i++) {
    const before = s.saplings.slice(); World.tick(0.05); Walkers.update(0.05);
    for (const q of before) if (q.i != null && !s.saplings.includes(q)) { matured++; sawTotal++; if (Workers.plantedAt(q) != null) sawPlanted++; if (s.map.tiles[q.i].trees >= 1) ok1++; }
    const w = Walkers.figures().find(a => a.kind === 'worker' && a.uid === fo.uid); if (!w) continue;
    const dd = Math.hypot(w.x - door[0], w.y - door[1]);
    if (w.act === 'plant') { if (!wasPlant) { plants++; if (away && fid !== 'vikings') violHome++; away = true; if (dd > 12) farPlant++; } }
    else if (wasPlant && w.load && fid !== 'vikings' && !s.saplings.some(q => q.b === fo.uid && !Workers.plantedAt(q))) loadAfter++;   // po sadzeniu (ostatniej sadzonki) ręka ma być pusta
    if (dd < 1.6 && w.act !== 'plant') away = false;
    wasPlant = w.act === 'plant';
  }
  ok(plants >= 10, `${fid}: leśnik sadzi (${plants} sadzeń)`);
  ok(violHome === 0, `${fid}: po każdej sadzonce wraca do domu po następną (${violHome} naruszeń)`);
  ok(sawTotal > 5 && sawPlanted >= sawTotal * 0.8, `${fid}: dojrzałe drzewa były wcześniej posadzone przez leśnika (${sawPlanted}/${sawTotal})`);
  ok(sawTotal > 5 && ok1 >= sawTotal * 0.9, `${fid}: drzewo wyrasta na polu sadzonki (${ok1}/${sawTotal})`);
  console.log(`${fid}: sadzeń ${plants}, dojrzało ${matured}, na swoim polu ${ok1}, posadzonych wcześniej ${sawPlanted}`);
}
// status w interfejsie: częściowe wejście to ostrzeżenie z procentem, brak wejścia to błąd
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 3 }); const s = World.state(); s.res.narzędzia = 50;
  const put = id => { for (let r = 3; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const sw = put('sawmill'); s.staffed[sw.uid] = true; sw.st = { c: 'in', g: 'pień' }; sw.eff = 0.56;
  const st = G.Advisor.statusOf(sw); ok(st.code === 'in' && st.sev === 'warn' && /56%/.test(st.text), 'status Tartaku z 56% pni: ostrzeżenie z procentem (' + st.text + ')');
  sw.eff = 0; const st0 = G.Advisor.statusOf(sw); ok(st0.sev === 'bad' && /Brak wejścia/.test(st0.text), 'status Tartaku bez pni: Brak wejścia (' + st0.text + ')');
}
// Pętle pracy (Faza 9F): stałe miejsce pracy, powrót do domu i odpoczynek, etykiety etapów; kapłan odwiedza domy
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 6 }); const s = World.state(); s.res.narzędzia = 50; s.settings.workers = true; s.settings.physical = true; s.res['zboże'] = 30; s.res.mąka = 30;
  const put = id => { for (let r = 3; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const set = {}; for (const id of ['hut', 'hut', 'dairy', 'orchard', 'farm', 'temple', 'mill']) { const b = put(id); (set[id] = set[id] || []).push(b); if (id !== 'hut') s.staffed[b.uid] = true; }
  const track = {}; for (const id of ['dairy', 'orchard', 'farm', 'temple', 'mill']) track[id] = { spots: new Set(), rests: 0, labels: new Set(), max: 0, door: Walkers.doorOf(set[id][0]) };
  for (let i = 0; i < 1600; i++) {
    World.tick(0.05); Walkers.update(0.05); s.res['zboże'] = i % 40 < 20 ? 20 : 6; s.res.mąka = 0; s.res.wino = 30; s.res.chleb = 0; s.res.ser = 0; s.res.owoce = 0;          // zasoby uzupełniane i towary zużywane, żeby budynki nie stały
    for (const id in track) { const b = set[id][0], w = Walkers.figures().find(a => a.kind === 'worker' && a.uid === b.uid); if (!w) continue; const T = track[id];
      if (w.stage) T.labels.add(w.stage); if (w.act === 'rest') T.rests++;
      if (w.act === Data.ROLES[id].act && w.act !== 'rest') T.spots.add(Math.round(w.x * 2) + ',' + Math.round(w.y * 2));
      T.max = Math.max(T.max, Math.hypot(w.x - T.door[0], w.y - T.door[1])); }
  }
  const t = track;
  ok(t.dairy.spots.size === 1, `mleczarz doi w jednym stałym miejscu (${t.dairy.spots.size} miejsc)`);
  ok(t.dairy.max <= 8, `mleczarz nie oddala się od zagrody (maks. ${t.dairy.max.toFixed(1)} pól od drzwi, razem z drogą do Składu)`);
  ok(t.orchard.spots.size >= 1 && t.orchard.spots.size <= 3, `sadownik zbiera w co najwyżej 3 stałych miejscach (${t.orchard.spots.size})`);
  ok(t.farm.spots.size >= 1 && t.farm.spots.size <= 4, `rolnik pracuje w co najwyżej 4 sekcjach pola (${t.farm.spots.size})`);
  for (const id of ['dairy', 'orchard', 'farm', 'mill', 'temple']) ok(t[id].rests > 0 && t[id].labels.size >= 3, `${id}: robotnik odpoczywa po cyklu (${t[id].rests} próbek), etapy: ${[...t[id].labels].slice(0, 4).join(' / ')}`);
  ok([...t.temple.labels].some(l => /Błogosławi/.test(l)), 'kapłan błogosławi mieszkańców');
  ok(/doi krowy.*niesie ser do Składu.*odpoczywa/.test(G.Workers.describe(set.dairy[0])), 'opis cyklu mleczarni: ' + G.Workers.describe(set.dairy[0]));
}
// Praca na zewnątrz i w budynku (Punkt 10): Tartak pracuje na stanowisku przy budynku, piekarz wchodzi do środka (znika), w oknach świeci się światło
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 6 }); const s = World.state(); s.res.narzędzia = 50; s.settings.workers = true; s.settings.physical = true;
  const put = id => { for (let r = 3; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace(id, x, y).ok) { World.placeBuilding(id, x, y, true); return s.buildings[s.buildings.length - 1]; } } };
  const sw = put('sawmill'), bk = put('bakery'); s.staffed[sw.uid] = s.staffed[bk.uid] = true; const dSw = Walkers.doorOf(sw);
  ok(Data.ROLES.bakery.where === 'in' && Data.ROLES.sawmill.where === 'out' && Data.ROLES.woodcutter.where === 'out', 'role: piekarnia pracuje w środku, tartak i drwal na zewnątrz');
  ok((Data.metaOf('bakery', 'franks').wins || []).length >= 1, 'sprite piekarni ma metadane okien (' + (Data.metaOf('bakery', 'franks').wins || []).length + ')');
  let hiddenN = 0, litN = 0, swHidden = 0, swAway = 0, bkWorkHidden = 0, n = 0, exits = 0, prevHidden = false;
  for (let i = 0; i < 1600; i++) {
    World.tick(0.05); Walkers.update(0.05); s.res['mąka'] = 20; s.res.woda = 20; s.res['pień'] = 20; s.res.deski = 0; s.res.chleb = 0; n++;
    const wb = Walkers.figures().find(a => a.kind === 'worker' && a.uid === bk.uid), ws = Walkers.figures().find(a => a.kind === 'worker' && a.uid === sw.uid);
    if (wb) { if (wb.hidden) hiddenN++; if (Workers.lit(bk.uid)) litN++; if (prevHidden && !wb.hidden) exits++; prevHidden = !!wb.hidden; }
    if (ws) { if (ws.hidden) swHidden++; if (ws.act === 'saw' && Math.hypot(ws.x - dSw[0], ws.y - dSw[1]) > 0.8) swAway++; }
  }
  ok(hiddenN > n * 0.2, `piekarz wchodzi do budynku i bywa niewidoczny (${hiddenN}/${n} próbek)`);
  ok(litN > 0 && litN <= hiddenN, `w oknach piekarni świeci się światło, gdy ktoś pracuje w środku (${litN} próbek)`);
  ok(exits >= 3, `piekarz wychodzi z budynku po pracy (${exits} razy)`);
  ok(swHidden === 0 && swAway > 0, `Tartak: robotnik zawsze widoczny, piłuje przy stanowisku obok budynku (${swAway} próbek poza drzwiami)`);
}
// Targ: karta budynku opisuje, do czego służy (kupno narzędzi; Saraceni — też sprzedaż)
for (const fid of ['franks', 'saracens']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'plain', seed: 3 }); const s = World.state(); s.res.narzędzia = 50;
  let mk = null; for (let r = 3; r < 16 && !mk; r++) for (let dy = -r; dy <= r && !mk; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('market', 24 + dx, 24 + dy).ok) { World.placeBuilding('market', 24 + dx, 24 + dy, true); mk = s.buildings[s.buildings.length - 1]; break; }
  s.staffed[mk.uid] = true; const st = G.Advisor.statusOf(mk);
  ok(/kupuje narzędzia za 20 zł/.test(st.text) && (fid !== 'saracens' || /kadzidło/.test(st.text)) && (fid !== 'franks' || /żołdu/.test(st.text)), `${fid}: karta Targu opisuje jego rolę (${st.text.slice(0, 70)}…)`);
}
// Drwal: rąbanie trwa co najmniej RULES.cycle.chopMin (błąd zgłoszony po Punkcie 15: gdy logika ścięła drzewo, zanim drwal doszedł, rąbanie kończyło się po 0 s)
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: fid === 'vikings' ? 'coast' : 'plain', seed: 5 });
  const s = World.state(); s.res.narzędzia = 50; s.settings.workers = true; s.settings.physical = true; s.settings.logistics = true;
  let b = null; for (let r = 3; r < 16 && !b; r++) for (let dy = -r; dy <= r && !b; dy++) for (let dx = -r; dx <= r && !b; dx++) { const x = 24 + dx, y = 24 + dy; if (World.canPlace('woodcutter', x, y).ok) b = World.placeBuilding('woodcutter', x, y, true); }
  s.staffed[b.uid] = true; let cur = 0; const streaks = [], min = Data.RULES.cycle.chopMin;
  for (let i = 0; i < 1500; i++) { World.tick(0.05); Walkers.update(0.05); const w = Walkers.figures().find(a => a.kind === 'worker' && a.uid === b.uid); if (w && w.act === 'chop') cur += 0.05; else if (cur > 0) { streaks.push(cur); cur = 0; } }
  const longEnough = streaks.filter(x => x >= min - 0.1).length;
  ok(streaks.length >= 5, `${fid}: drwal rąbie (${streaks.length} rąbań w 75 min)`);
  ok(longEnough >= streaks.length * 0.7, `${fid}: rąbanie trwa ≥ ${min} min (${longEnough}/${streaks.length}; najkrótsze ${Math.min(...streaks).toFixed(2)})`);
}
console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `Wszystko OK — ${checks} sprawdzeń`); process.exit(fails ? 1 : 0);
