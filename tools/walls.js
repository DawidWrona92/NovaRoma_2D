// Mury obronne (Punkt 13): pole t.wall = 1 blokuje ruch ludzi i zwierząt, nie pozwala budować ani kłaść dróg, kosztuje surowiec zależny od nacji.
// Sprawdza: koszt i odjęcie surowców, linię prostą i „L”, odmowy (drzewa, droga, budynek, brak surowców), przejście A* (obejście muru), odcięcie budynku od Dworu,
// burzenie, unieważnienie pamięci logistyki (map.roadRev), brak zmian w grze bez murów. Użycie: node tools/walls.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Walls, Roads, Path, Terrain, Build } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const FIDS = ['franks', 'saracens', 'vikings', 'slavs'], COST = { franks: 'kamień', saracens: 'glina', vikings: 'deski', slavs: 'deski' };

const dry = (map, N) => { const T = (x, y) => map.tiles[y * N + x]; for (let y = 4; y < N - 18; y++) for (let x = 4; x < N - 18; x++) { let good = true; for (let j = -3; j < 11 && good; j++) for (let i = -3; i < 11 && good; i++) { const t = T(x + i, y + j); if (t.h !== 1 || t.occup || t.road || t.k) good = false; } if (good) return [x, y]; } return null; };
for (const fid of FIDS) {
  let seed = 5; World.init(fid, { climate: 'temperate', type: 'plain', seed }); while (!dry(World.state().map, World.state().map.size) && seed < 40) World.init(fid, { climate: 'temperate', type: 'plain', seed: ++seed });
  const s = World.state(), map = s.map, N = map.size;
  s.res.deski = 500; s.res.kamień = 500; s.res.glina = 500;
  for (const t of map.tiles) { t.trees = 0; t.deposit = null; }
  const T = (x, y) => map.tiles[y * N + x];
  const [cx, cy] = dry(map, N) || [-1, -1];
  ok(cx >= 0, `${fid}: jest suchy, pusty obszar do testu`); if (cx < 0) continue;
  const res = COST[fid], r0 = s.res[res];
  ok(Walls.costOf()[res] === 1, `${fid}: koszt pola muru = 1 ${res}`);
  const pv = Walls.preview(cx, cy, cx + 4, cy); ok(pv.ok && pv.fresh.length === 5, `${fid}: podgląd linii 5 pól (${pv.reason || 'ok'})`);
  const lay = Walls.lay(cx, cy, cx + 4, cy);
  ok(lay.ok && lay.n === 5 && s.res[res] === r0 - 5, `${fid}: położono 5 pól i odjęto 5 ${res}`);
  ok([0, 1, 2, 3, 4].every(i => T(cx + i, cy).wall === 1), `${fid}: pola mają t.wall = 1`);
  ok(!Terrain.passable(T(cx, cy)) && Terrain.passable(T(cx, cy + 1)), `${fid}: pole muru nieprzechodnie, sąsiednie przechodnie`);
  ok(!Walls.preview(cx, cy, cx + 4, cy).ok, `${fid}: drugi raz na tej samej linii — odmowa`);
  ok(!Roads.free(T(cx + 1, cy)), `${fid}: na murze nie wolno kłaść dróg`);
  ok(!G.World.canPlace('hut', cx + 1, cy).ok, `${fid}: na murze nie wolno budować`);
  // linia „L”
  const L = Walls.line(cx, cy + 2, cx + 3, cy + 5); ok(L.length === 7 && L[0] === (cy + 2) * N + cx && L[L.length - 1] === (cy + 5) * N + cx + 3, `${fid}: linia „L” ma 7 pól od początku do końca`);
  // odmowy
  T(cx + 6, cy + 3).trees = 2; ok(/Drzewa/.test(Walls.preview(cx + 6, cy + 3, cx + 8, cy + 3).reason || ''), `${fid}: drzewa na linii — odmowa z powodem`);
  T(cx + 6, cy + 3).trees = 0;
  T(cx + 7, cy + 3).road = 1; ok(!Walls.preview(cx + 6, cy + 3, cx + 8, cy + 3).ok, `${fid}: droga na linii — odmowa`); T(cx + 7, cy + 3).road = 0;
  s.res[res] = 2; ok(/Brak surowców/.test(Walls.preview(cx, cy + 8, cx + 4, cy + 8).reason || ''), `${fid}: brak surowców — odmowa`); s.res[res] = 500;
  // A* omija mur
  const rev0 = map.roadRev | 0;
  for (let i = -3; i <= 8; i++) if (!T(cx + i, cy).wall) T(cx + i, cy).wall = 1;                                          // długa przegroda (-3…8) w poprzek
  const p = Path.find(map, cx + 2.5, cy - 1.5, cx + 2.5, cy + 2.5, {}), len = p ? p.length : 0;
  ok(p && len > 2, `${fid}: ścieżka przez przegrodę nie idzie prosto (obejście, ${len} punktów zwrotnych)`);
  ok(!p || p.every(q => !T(Math.floor(q.x != null ? q.x : q[0]), Math.floor(q.y != null ? q.y : q[1])).wall), `${fid}: ścieżka nie wchodzi na mur`);
  for (let i = -3; i <= 8; i++) if (i < 0 || i > 4) T(cx + i, cy).wall = 0;
  // burzenie
  ok(Walls.remove(cx + 2, cy) && !T(cx + 2, cy).wall && (map.roadRev | 0) > rev0, `${fid}: rozbiórka zdejmuje mur i zmienia roadRev`);
  ok(!Walls.remove(cx + 2, cy), `${fid}: rozbiórka pustego pola — brak`);
}

// odcięcie budynku od Dworu: pierścień muru wokół budynku, do którego dało się dojść, jest odrzucony; gdy budynku nie ma — wolno
World.init('franks', { climate: 'temperate', type: 'plain', seed: 5 });
{
  const s = World.state(), map = s.map, N = map.size; s.res.kamień = 999; s.res.deski = 999; s.res.glina = 999; s.res.złoto = 999;
  for (const t of map.tiles) { t.trees = 0; t.deposit = null; }
  const kx = Math.floor(s.keep.x), ky = Math.floor(s.keep.y);
  let placed = null; for (let dx = 4; dx < 14 && !placed; dx++) { if (G.World.canPlace('hut', kx + dx, ky).ok) placed = G.World.placeBuilding('hut', kx + dx, ky, true); }
  ok(placed, 'Chata postawiona do testu odcięcia');
  if (placed) {
    const b = s.buildings.find(q => q.id === 'hut'); const bx = b.x, by = b.y, w = b.w, h = b.h;
    const ring = [[bx - 1, by - 1, bx + w, by - 1], [bx + w, by - 1, bx + w, by + h], [bx - 1, by + h, bx + w, by + h], [bx - 1, by - 1, bx - 1, by + h]];
    const ids = ring.flatMap(([a, b2, c, d]) => Walls.line(a, b2, c, d)).filter(i => !map.tiles[i].occup);
    ok(Walls.cutsOff(ids) === true, 'pierścień wokół Chaty odcina ją od Dworu');
    ok(Walls.cutsOff([ (ky + 1) * N + kx - 8 ]) === false, 'pojedyncze pole muru daleko od budynków nie odcina nic');
  }
}

// brak murów → zero wpływu: hasWall nie ustawione, passable bez zmian
World.init('vikings', { climate: 'temperate', type: 'plain', seed: 5 });
ok(!World.state().map.hasWall && World.state().map.tiles.every(t => !t.wall), 'bez murów: brak flagi hasWall i pól t.wall');
console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `\n✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
