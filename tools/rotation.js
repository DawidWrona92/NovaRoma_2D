// Test obrotu budynków i stref ląd/woda (Faza 9C): Przystań (szopa na lądzie + molo na wodzie morza) i Okręt (tylko woda przy molo) w czterech kierunkach; budynki bez wariantów się nie obracają.
// Sprawdza: obrysy i strefy wariantów, reguły stawiania, plac i wyburzenie na wodzie, wejście od strony lądu, zapis stanu (JSON), klucze sprite'ów, kierunki wybierane przez bota.
// Użycie: node tools/rotation.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, TestBots, Walkers, Events } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const FID = 'vikings';

// --- 1. katalog wariantów: obrysy, strefy, klucze ---
ok(JSON.stringify(Data.rotsOf('dock', FID)) === '[0,1,2,3]' && JSON.stringify(Data.rotsOf('ship', FID)) === '[0,1,2,3]', 'Przystań i Okręt mają cztery kierunki');
ok(Data.rotsOf('hut', FID).length === 1 && Data.rotsOf('woodcutter', 'franks').length === 1, 'pozostałe budynki mają jeden kierunek (na razie)');
for (let r = 0; r < 4; r++) {
  const [w, h] = Data.footprint('dock', FID, r), z = Data.zonesOf('dock', FID, r), zs = Data.zonesOf('ship', FID, r);
  ok(r % 2 ? (w === 2 && h === 4) : (w === 4 && h === 2), `Przystań kierunek ${r}: obrys ${w}×${h}`);
  ok(z.land.length === 2 && z.water.length === 6 && z.land.length + z.water.length === w * h, `Przystań kierunek ${r}: 2 pola lądu i 6 pól wody`);
  ok(zs.land.length === 0 && zs.water.length === w * h, `Okręt kierunek ${r}: cały obrys na wodzie`);
  // molo ma 3 pola długości w stronę kierunku: pola lądu leżą na przeciwległym krańcu
  const cx = z.land.reduce((a, q) => a + q[0], 0) / 2, cy = z.land.reduce((a, q) => a + q[1], 0) / 2;
  ok([[0, (h - 1) / 2], [(w - 1) / 2, 0], [w - 1, (h - 1) / 2], [(w - 1) / 2, h - 1]][r].every((v, i) => Math.abs(v - [cx, cy][i]) < 1e-9), `Przystań kierunek ${r}: szopa na kraju przeciwnym molu`);
  ok(Data.metaOf('dock', FID, r) && Data.metaOf('ship', FID, r) && G.Sprites && true, `kierunek ${r}: wpisy katalogu sprite'ów istnieją`);
}
ok(Data.metaKey('dock', 0) === 'dock' && Data.metaKey('dock', 3) === 'dock@3', 'klucz sprite\'a: dock, dock@3');

// --- 2. reguły stawiania na mapie nadmorskiej ---
World.init(FID, { climate: 'snow', type: 'coast', seed: 7 });
let s = World.state(); s.res.deski = 9999; s.res.kamień = 999; s.res.złoto = 9999; s.res.narzędzia = 50;
const N = s.map.size, T = (x, y) => World.state().map.tiles[y * N + x];
const spots = [[], [], [], []]; let landOnly = null;
for (let rot = 0; rot < 4; rot++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (World.canPlace('dock', x, y, rot).ok) spots[rot].push([x, y]);
ok(spots.filter(a => a.length).length >= 2, 'Przystań da się postawić w co najmniej dwóch kierunkach: ' + spots.map(a => a.length).join('/'));
for (let rot = 0; rot < 4; rot++) for (const [x, y] of spots[rot].slice(0, 40)) {
  const z = Data.zonesOf('dock', FID, rot);
  if (!z.land.every(([dx, dy]) => T(x + dx, y + dy).h === 1) || !z.water.every(([dx, dy]) => { const t = T(x + dx, y + dy); return t.h === 0 && t.wk === 'sea'; })) ok(false, `dozwolona Przystań ${x},${y} kierunek ${rot} ma ląd lub wodę w złej strefie`);
}
// czysty ląd i czysta woda są odrzucane
for (let y = 0; y < N - 1 && !landOnly; y++) for (let x = 0; x < N - 3; x++) { const t = [0, 1, 2, 3].every(i => T(x + i, y).h === 1 && T(x + i, y + 1).h === 1); if (t) { landOnly = [x, y]; break; } }
ok(landOnly && !World.canPlace('dock', landOnly[0], landOnly[1], 0).ok, 'Przystań w całości na lądzie jest odrzucona (molo musi być na wodzie)');
let seaOnly = null; for (let y = 0; y < N - 1 && !seaOnly; y++) for (let x = 0; x < N - 3; x++) if ([0, 1, 2, 3].every(i => T(x + i, y).h === 0 && T(x + i, y + 1).h === 0)) { seaOnly = [x, y]; break; }
ok(seaOnly && !World.canPlace('dock', seaOnly[0], seaOnly[1], 0).ok, 'Przystań w całości na wodzie jest odrzucona (szopa musi stać na lądzie)');
ok(!World.canPlace('hut', 30, 14, 1).ok, 'budynek bez wariantów odrzuca obrót ≠ 0');

// --- 3. Okręt: tylko z istniejącą Przystanią, na wodzie, przy molo ---
ok(Object.keys(spots).length && (() => { let any = false; for (let rot = 0; rot < 4 && !any; rot++) for (let y = 0; y < N && !any; y++) for (let x = 0; x < N; x++) if (World.canPlace('ship', x, y, rot).ok) { any = true; break; } return !any; })(), 'Okręt bez Przystani nie ma miejsca');
const start = spots.find(a => a.length), rot0 = spots.indexOf(start), [dx0, dy0] = start[0];
const dockSite = Build.enqueue('dock', dx0, dy0, rot0); ok(dockSite.ok, 'plac Przystani stawia się z kierunkiem ' + rot0);
const site = s.sites.find(q => q.id === 'dock'); ok(site && (site.rot | 0) === rot0, 'plac pamięta kierunek');
const wz = Data.zonesOf('dock', FID, rot0).water;
ok(wz.every(([dx, dy]) => T(dx0 + dx, dy0 + dy).occup === site.uid), 'plac Przystani rezerwuje także pola wody (molo)');
Build.cancel(site); ok(wz.every(([dx, dy]) => T(dx0 + dx, dy0 + dy).occup == null) && !s.sites.length, 'anulowanie placu zwalnia pola wody');
Build.enqueue('dock', dx0, dy0, rot0); for (let t = 0; t < 200 && s.sites.length; t += 0.1) World.tick(0.1);
const dock = s.buildings.find(b => b.id === 'dock'); ok(!!dock && (dock.rot | 0) === rot0, 'Przystań zbudowana, kierunek zapisany w budynku');
ok(dock && dock.w === Data.footprint('dock', FID, rot0)[0] && dock.h === Data.footprint('dock', FID, rot0)[1], 'wymiary budynku zgodne z kierunkiem');
const door = Walkers.doorOf(dock), dt = T(Math.floor(door[0]), Math.floor(door[1]));
ok(dt && dt.h === 1 && dt.occup == null, `wejście Przystani jest na wolnym lądzie (${door.map(v => v.toFixed(1))})`);
let shipSpots = 0, shipBad = 0, touch = false;
for (let rot = 0; rot < 4; rot++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (World.canPlace('ship', x, y, rot).ok) {
  shipSpots++; const z = Data.zonesOf('ship', FID, rot);
  if (!z.water.every(([dx, dy]) => { const t = T(x + dx, y + dy); return t.h === 0 && t.wk === 'sea' && t.occup == null; })) shipBad++;
  const pier = World.dockPierTiles(); if (!z.water.some(([dx, dy]) => pier.some(([px, py]) => Math.abs(x + dx - px) + Math.abs(y + dy - py) === 1))) shipBad++; else touch = true;
}
ok(shipSpots > 0 && shipBad === 0 && touch, `Okręt stawia się tylko na wodzie przy molo (${shipSpots} miejsc, ${shipBad} błędnych)`);
const sp = TestBots.findPlace(s, 'ship'); ok(!!sp, 'bot znajduje miejsce na Okręt przy Przystani');
if (sp) { ok(World.canPlace('ship', sp.x, sp.y, sp.rot | 0).ok, 'miejsce bota na Okręt jest dozwolone'); ok(Build.enqueue('ship', sp.x, sp.y, sp.rot).ok, 'plac Okrętu na wodzie'); for (let t = 0; t < 200 && s.sites.length; t += 0.1) World.tick(0.1); ok(s.buildings.some(b => b.id === 'ship'), 'Okręt zbudowany na wodzie (budowniczowie dochodzą do placu)'); }
// --- 4. zapis stanu i wyburzenie ---
ok(JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s), 'stan z obróconymi budynkami przechodzi przez JSON bez zmian');
const sh = s.buildings.find(b => b.id === 'ship'); if (sh) { Events.destroy(s, sh); ok(Data.zonesOf('ship', FID, sh.rot).water.every(([dx, dy]) => T(sh.x + dx, sh.y + dy).occup == null), 'wyburzenie Okrętu zwalnia pola wody'); }
Events.destroy(s, dock); ok(wz.every(([dx, dy]) => T(dx0 + dx, dy0 + dy).occup == null), 'wyburzenie Przystani zwalnia molo i szopę');
// --- 5. bot na wielu mapach: 4 klimaty × 12 ziaren ---
let bad = 0, n = 0; const used = [0, 0, 0, 0];
for (const cl of ['snow', 'temperate', 'eastern', 'desert']) for (let seed = 1; seed <= 12; seed++) {
  World.init(FID, { climate: cl, type: 'coast', seed }); const w = World.state(); w.res.deski = 9999; w.res.kamień = 999; w.res.złoto = 9999; n++;
  const d = TestBots.findPlace(w, 'dock'); if (!d) { bad++; continue; } used[d.rot | 0]++; World.placeBuilding('dock', d.x, d.y, false, d.rot);
  if (!TestBots.findPlace(w, 'ship')) bad++;
}
ok(bad === 0, `bot stawia Przystań i Okręt na ${n} mapach nadmorskich (${bad} niepowodzeń; kierunki ${used.join('/')})`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
