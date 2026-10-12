// Rozmiary map (Faza 9D-1): 48 (bazowy), 72 i 96. Sprawdza poprawność generatora na wszystkich rozmiarach, skalowanie lasu, złóż i zwierzyny, położenie Dworu, środek mapy, opis w podglądzie
// oraz to, że rozmiar 48 daje dokładnie dotychczasowe wyniki (parametr size pominięty = 48). Użycie: node tools/mapsize.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, MapGen, Terrain, Fauna, Minimap, TestBots } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const sig = m => { let h = 0; for (const t of m.tiles) h = (Math.imul(h, 31) + t.h * 7 + t.trees * 3 + (t.deposit ? t.deposit.length : 0) + (t.e | 0) * 5 + (t.k ? t.k.length : 0)) | 0; return h; };

ok(JSON.stringify(Data.MAP_SIZES.map(z => z.id)) === '[48,72,96]' && Data.DEFAULT_MAP_SIZE === 72 && JSON.stringify(MapGen.SIZES) === '[48,72,96]', 'rozmiary 48/72/96, domyślnie 72');
ok(Data.sizeName(96) === 'Duża' && Data.sizeName(7) === 'Mała', 'nazwy rozmiarów');

// --- 48 bez parametru = 48 z parametrem = dotychczasowa mapa ---
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) {
  World.init(fid); const a = sig(World.state().map); World.init(fid, { size: 48 }); const b = sig(World.state().map);
  ok(a === b && World.state().map.size === 48, `${fid}: size 48 = brak parametru (mapa identyczna)`);
  World.init(fid, { size: 50 }); ok(World.state().map.size === 48, `${fid}: nieznany rozmiar wraca do 48`);
}

// --- poprawność i skalowanie ---
const tot = {};
for (const size of [48, 72, 96]) for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) for (const ty of ['coast', 'plain', 'river', 'lakes', 'mountains', 'wetlands']) {
  if (fid === 'vikings' && ty !== 'coast') continue;
  for (const seed of [1, 2]) {
    World.init(fid, { climate: Data.FACTIONS[fid].climate, type: ty, seed, size }); const s = World.state(), m = s.map;
    ok(m.size === size && m.tiles.length === size * size && m.meta.size === size, `${size}/${fid}/${ty}/${seed}: rozmiar mapy ${m.size}`);
    ok(m.meta.valid, `${size}/${fid}/${ty}/${seed}: mapa poprawna (${(m.meta.why || []).join('; ')})`);
    ok(Terrain.CX === size / 2 && s.keep.x === Math.floor((size - s.keep.w) / 2), `${size}/${fid}/${ty}/${seed}: Dwór pośrodku (${s.keep.x}), środek planu ${Terrain.CX}`);
    const t = tot[size] || (tot[size] = { trees: 0, dep: 0, n: 0 }); t.n++; for (const q of m.tiles) { t.trees += q.trees; if (q.deposit) t.dep++; }
  }
}
const per = k => tot[k].trees / tot[k].n, dep = k => tot[k].dep / tot[k].n;
ok(per(72) > per(48) * 1.8 && per(96) > per(48) * 3.2, `drzewa rosną z polem (średnio ${per(48).toFixed(0)} / ${per(72).toFixed(0)} / ${per(96).toFixed(0)})`);
ok(dep(72) > dep(48) * 1.2 && dep(96) > dep(48) * 1.5, `złoża rosną z rozmiarem (średnio ${dep(48).toFixed(1)} / ${dep(72).toFixed(1)} / ${dep(96).toFixed(1)})`);

// --- zwierzyna rośnie z polem i odradza się w obrębie mapy ---
const an = {};
for (const size of [48, 96]) { World.init('franks', { climate: 'temperate', type: 'plain', seed: 3, size }); const s = World.state(); Fauna.enable(s); an[size] = s.animals.length; ok(s.animals.every(a => a.x > 0 && a.y > 0 && a.x < size && a.y < size), `${size}: zwierzęta w granicach mapy`); }
ok(an[96] > an[48] * 3, `zwierząt na dużej mapie jest ok. 4× więcej (${an[48]} → ${an[96]})`);

// --- podgląd i opis ---
{ const m = Minimap.generate('franks', { climate: 'temperate', type: 'plain', seed: 5, size: 96 }); ok(m.size === 96 && /duża 96×96/.test(Minimap.describe(m.meta)), 'podgląd i opis: ' + Minimap.describe(m.meta)); }
// --- bot buduje na dużej mapie (przepis nacji znajduje miejsce) ---
for (const fid of ['franks', 'vikings']) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'coast', seed: 4, size: 96 }); const s = World.state(); s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; let miss = [];
  for (const id of TestBots.RECIPE[fid]) { if (id === 'ship' && !s.buildings.some(b => b.id === 'dock')) { const d = TestBots.findPlace(s, 'dock'); if (d) World.placeBuilding('dock', d.x, d.y, false, d.rot); } const p = TestBots.findPlace(s, id); if (!p) { miss.push(id); continue; } World.placeBuilding(id, p.x, p.y, false, p.rot); }
  ok(miss.length === 0, `${fid} 96×96: przepis nacji mieści się (${TestBots.RECIPE[fid].length} budynków)` + (miss.length ? ' — brak: ' + miss.join(',') : ''));
}
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
