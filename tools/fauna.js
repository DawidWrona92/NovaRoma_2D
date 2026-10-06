// Test fauny (moduł Fauna, Faza 8): zaludnienie mapy wg klimatu, poprawność pozycji, własne PRNG (zero wywołań globalnego RNG), determinizm, snapshot/restore,
// parytet ekonomii z fauną i bez niej, wyprawy myśliwych (przebieg faz, strzała, ubytek i odradzanie zwierzyny), przetrzebienie przy wielu Chatach, koszt ticku.
// Użycie: node tools/fauna.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, TestBots, RNG, Terrain, Fauna, Events, Advisor } = G;
const K = Data.FAUNA, R = Data.FAUNA_RULES;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
let inF = 0, rngInF = 0;                                              // wywołania globalnego RNG wewnątrz modułu Fauna
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inF) rngInF++; return f.apply(this, arguments); }; }
for (const m of Object.keys(Fauna)) if (typeof Fauna[m] === 'function') { const f = Fauna[m]; Fauna[m] = function () { inF++; try { return f.apply(this, arguments); } finally { inF--; } }; }

const tileAt = (map, x, y) => map.tiles[Math.floor(y) * map.size + Math.floor(x)];
const grounded = a => !a.fl;
const kc = s => ({ x: s.keep.x + s.keep.w / 2, y: s.keep.y + s.keep.h / 2 });
const digest = s => JSON.stringify([s.res, s.pop, s.time, s.buildings.length, s.sites.length, s.citizens.map(c => [c.x, c.y, c.tx, c.ty]), s.carriers.map(c => [c.x, c.y, c.tx, c.ty])]);
const stateOf = s => JSON.stringify([s.animals, s.fauna, s.res, s.buildings.map(b => b.huntAcc || 0)]);

/* bot buduje przepis nacji; opcjonalnie `hunters` dodatkowych Chat myśliwego na początku */
function sim(fid, cl, ty, seed, minutes, o = {}) {
  World.init(fid, { climate: cl, type: ty, seed });
  const s = World.state(); if (o.fauna) Fauna.enable(s);
  s.res.deski = Math.max(s.res.deski, 400); s.res.złoto = Math.max(s.res.złoto, 400);
  const plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0, hb = 0, nh = o.hunters || 0;
  for (let t = 0, i = 0; t < minutes; t += o.dt || 0.05, i++) {
    World.tick(o.dt || 0.05);
    if (hb < nh && t >= hb * 1.5) { const r = TestBots.tryBuild(s, 'hunter'); if (r === 'built') hb++; else if (r === 'noplace') nh = hb; }
    if (!o.noBuild && t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
    if (o.probe) o.probe(s, i, t);
  }
  return s;
}

/* ---------- 1. zaludnienie: wszystkie klimaty, typy map i ziarna ---------- */
const SETS = [['franks', 'temperate', 'river', 7], ['franks', 'temperate', 'mountains', 8], ['franks', 'snow', 'lakes', 9], ['saracens', 'desert', 'plain', 7], ['saracens', 'desert', 'wetlands', 8],
  ['vikings', 'snow', 'coast', 7], ['vikings', 'snow', 'coast', 11], ['slavs', 'eastern', 'wetlands', 7], ['slavs', 'eastern', 'plain', 9], ['franks', 'desert', 'coast', 5], ['slavs', 'snow', 'plain', 6], ['saracens', 'eastern', 'river', 4]];
let minPrey = 1e9, minRing = 1e9, shoreMiss = 0;
for (const [fid, cl, ty, seed] of SETS) {
  const tag = `${fid}/${cl}/${ty}/${seed}`;
  World.init(fid, { climate: cl, type: ty, seed }); const s = World.state(), map = s.map;
  ok(s.animals.length === 0 && s.fauna === null && s.settings.fauna === false, `${tag}: po World.init fauna jest wyłączona i pusta`);
  const n = Fauna.enable(s), st = Fauna.stats(s), c = kc(s);
  ok(n > 30 && n === s.animals.length && s.settings.fauna === true, `${tag}: Fauna.enable zaludnia mapę (${n} zwierząt)`);
  const hasShore = map.tiles.some((t, i) => t.h === 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const u = map.tiles[i + dy * map.size + dx]; return u && u.h === 0 && (u.wk === 'sea' || u.wk === 'ice'); }));
  const hasWater = map.tiles.some(t => t.h === 0 && t.wk !== 'ford');
  for (const k of Object.keys(K)) {
    if (!K[k].climates.includes(cl)) { ok(!st.by[k], `${tag}: ${k} nie występuje w klimacie ${cl}`); continue; }
    const need = K[k].hab === 'shore' ? hasShore : K[k].hab === 'water' ? hasWater : true;
    if (need) ok((st.by[k] || 0) > 0, `${tag}: gatunek ${k} (${K[k].pl}) jest na mapie`); else shoreMiss++;
  }
  let ring = 0, bad = 0, nearKeep = 0;
  for (const a of s.animals) {
    const KK = K[a.k], t = tileAt(map, a.x, a.y), d = Math.hypot(a.x - c.x, a.y - c.y);
    if (grounded(a) && !(t && t.h === 1 && t.occup == null && Terrain.passable(t))) bad++;
    if (d < 6) nearKeep++;
    if (KK.role === 'prey' && d >= 10 && d <= 24) ring += KK.w;
  }
  ok(bad === 0, `${tag}: ${bad} zwierząt na polach nieprzechodnich lub zajętych`);
  ok(nearKeep === 0, `${tag}: ${nearKeep} zwierząt tuż przy Dworze na starcie`);
  ok(st.prey >= 20, `${tag}: pula zwierzyny łownej ${st.prey} pkt ≥ 20`);
  ok(ring >= 12, `${tag}: zwierzyna łowna w pierścieniu 10–24 pól od Dworu ${ring.toFixed(1)} pkt ≥ 12`);
  minPrey = Math.min(minPrey, st.prey); minRing = Math.min(minRing, ring);
  ok(JSON.stringify(JSON.parse(JSON.stringify([s.animals, s.fauna]))) === JSON.stringify([s.animals, s.fauna]), `${tag}: stan fauny przechodzi przez JSON bez zmian`);
}
console.log(`zaludnienie: ${SETS.length} map, pula zwierzyny ≥ ${minPrey.toFixed(1)} pkt, w pierścieniu ≥ ${minRing.toFixed(1)} pkt` + (shoreMiss ? `, ${shoreMiss}× gatunek brzegowy pominięty (mapa bez brzegu / wody)` : ''));

/* ---------- 2. długa gra z botem: pozycje zawsze poprawne, populacje żyją ---------- */
{
  let worst = 0, samples = 0; const streak = new Map();
  for (const [fid, cl, ty, seed] of [['franks', 'temperate', 'river', 7], ['saracens', 'desert', 'plain', 7], ['vikings', 'snow', 'coast', 7], ['slavs', 'eastern', 'wetlands', 7]]) {
    streak.clear(); let bad = 0;
    const s = sim(fid, cl, ty, seed, 120, { fauna: true, hunters: 2, probe: (s, i) => {
      if (i % 5) return; samples++;
      for (const a of s.animals) {
        if (a.fl || a.m === Fauna.DEAD || a.m === Fauna.HIDE) continue;                  // ptaki w locie, padlina i nurkujące foki nie są rysowane na polu
        const t = tileAt(s.map, a.x, a.y), viol = !(t && t.h === 1 && Terrain.passable(t) && t.occup == null), run = viol ? (streak.get(a.id) || 0) + 1 : 0; streak.set(a.id, run);
        if (run > 12) bad++;                                         // plac postawiony pod zwierzęciem: chwilowe, do ~3 min symulacji próbkowanych co 0,25 min
        worst = Math.max(worst, run);
      }
    } });
    const st = Fauna.stats(s);
    ok(bad === 0, `${fid}: ${bad} zwierząt dłużej niż 3 min na polu zajętym lub nieprzechodnim`);
    ok(st.total > 40 && st.prey >= 15, `${fid}: po 120 min żyje ${st.total} zwierząt, pula ${st.prey} pkt`);
    for (const a of s.animals) ok(Number.isFinite(a.x) && Number.isFinite(a.y) && a.x > 0 && a.y > 0 && a.x < s.map.size && a.y < s.map.size, `${fid}: zwierzę #${a.id} poza mapą`);
  }
  console.log(`długa gra: ${samples} próbek, najdłuższa seria na polu zajętym ${worst} próbek`);
}

/* ---------- 3. izolacja od globalnego RNG i parytet logiki ---------- */
{
  // Słowianie nie mają Chaty myśliwego w przepisie: stan gry (zasoby, ludność, obywatele, nosiciele) musi być bit-w-bit identyczny z fauną i bez niej, a RNG w tym samym stanie
  const a = sim('slavs', 'eastern', 'plain', 7, 70, { fauna: true }), da = digest(a), ra = RNG.next();
  const b = sim('slavs', 'eastern', 'plain', 7, 70, { fauna: false }), db = digest(b), rb = RNG.next();
  ok(da === db, 'Słowianie: logika gry identyczna z fauną i bez niej (cień symulacji nienaruszony)');
  ok(ra === rb, 'Słowianie: globalny RNG w tym samym stanie z fauną i bez niej');
  ok(rngInF === 0, `Fauna nie wywołuje globalnego RNG (wywołań wewnątrz modułu: ${rngInF})`);
  // fauna wyłączona nie zostawia śladu
  ok(b.animals.length === 0 && b.fauna === null, 'bez Fauna.enable lista zwierząt jest pusta, a gameMult = 1');
  World.init('franks'); const s0 = World.state(); const hb = World.placeBuilding('hunter', 30, 14, true); ok(Fauna.gameMult(s0, hb) === 1 && Fauna.stock(s0, hb) === null, 'fauna wyłączona: gameMult = 1');
}

/* ---------- 4. determinizm i snapshot / restore ---------- */
{
  const a = sim('franks', 'temperate', 'river', 7, 100, { fauna: true, hunters: 1 }), b = sim('franks', 'temperate', 'river', 7, 100, { fauna: true, hunters: 1 });
  ok(stateOf(a) === stateOf(b), 'determinizm: to samo ziarno i te same działania → identyczny stan zwierząt, wypraw i zasobów po 100 min');
  // snapshot w trakcie gry, dalszy bieg, przywrócenie i ten sam bieg jeszcze raz
  const s = sim('franks', 'temperate', 'river', 7, 50, { fauna: true, hunters: 1 }), snap = TestBots.snapshot();
  const cont = () => { RNG.seed(4242); for (let i = 0; i < 1000; i++) World.tick(0.05); return stateOf(World.state()); };      // globalny RNG nie wchodzi do snapshotu — przy obu biegach zasiewamy go tak samo (ruch obywateli)
  const x = cont();
  TestBots.restore(snap);
  const s2 = World.state();
  ok(s2.fauna && s2.animals.length > 0 && s2.settings.fauna === true, 'snapshot: po restore fauna i ustawienie są na miejscu');
  const y = cont();
  ok(x === y, 'snapshot → restore → dalszy bieg daje identyczny stan fauny, wypraw i zasobów jak bieg bez przerwy');
  void s;
}

/* ---------- 5. wyprawy myśliwego: fazy, strzała, ubytek i odradzanie ---------- */
{
  const modes = new Set(); let arrows = 0, maxHunts = 0, gmMin = 9, gmN = 0, gmSum = 0, killsAt = [];
  const s = sim('franks', 'temperate', 'river', 7, 150, { fauna: true, hunters: 1, dt: 0.02, noBuild: false, probe: (s, i, t) => {
    for (const h of Fauna.hunters(s)) { modes.add(h.mode); if (h.arrow) { arrows++; ok(h.arrow.u >= 0 && h.arrow.u <= 1 && Number.isFinite(h.arrow.x1), 'strzała ma poprawny postęp lotu'); } }
    { const per = {}; for (const h of s.fauna.hunts) per[h.b] = (per[h.b] || 0) + 1; maxHunts = Math.max(maxHunts, ...Object.values(per), 0); }
    if (i % 250 === 0 && t > 5) { const hs = s.buildings.filter(b => b.id === 'hunter' && s.staffed[b.uid]); for (const b of hs) { const g = Fauna.gameMult(s, b); gmMin = Math.min(gmMin, g); gmSum += g; gmN++; } }
    if (i % 1500 === 0) killsAt.push(s.fauna.kills);
  } });
  const st = Fauna.stats(s);
  ok(['go', 'aim', 'approach', 'pick', 'back'].every(m => modes.has(m)), 'wyprawa przechodzi przez fazy: ' + [...modes].join(', '));
  ok(arrows > 3, `strzała leci (${arrows} próbek lotu)`);
  ok(st.kills >= 15, `myśliwy upolował ${st.kills} zwierząt w 150 min (≥ 15)`);
  ok(gmN > 5 && gmMin >= 0.9 && gmSum / gmN >= 0.97, `1 Chata: gameMult min ${gmMin.toFixed(2)} śr. ${(gmSum / Math.max(1, gmN)).toFixed(3)} (≥ 0,90 / 0,97)`);
  ok(st.prey >= 20, `pula zwierzyny po 150 min nadal ${st.prey} pkt`);
  ok(maxHunts <= 1, 'jedna Chata prowadzi najwyżej jedną wyprawę naraz');
  // padlina leży tylko do podniesienia / upływu czasu
  ok(!s.animals.some(a => a.m === Fauna.DEAD && s.time - a.t0 > R.carcass + 0.5), 'padlina nie leży dłużej niż ' + R.carcass + ' min');
  console.log(`wyprawy: fazy [${[...modes].join(' ')}], upolowano ${st.kills}, gameMult min ${gmMin.toFixed(2)}, pula ${st.prey} pkt`);
}

/* ---------- 6. przetrzebienie przy wielu Chatach, wyburzenie w trakcie wyprawy, ostrzeżenie Doradcy ---------- */
{
  let gmMin = 9;
  const s = sim('franks', 'temperate', 'river', 7, 120, { fauna: true, hunters: 12, probe: (s, i) => { if (i % 100 === 0) for (const b of s.buildings) if (b.id === 'hunter' && s.staffed[b.uid]) gmMin = Math.min(gmMin, Fauna.gameMult(s, b)); } });
  const hs = s.buildings.filter(b => b.id === 'hunter');
  ok(hs.length >= 6, `zbudowano ${hs.length} Chat myśliwego`);
  ok(gmMin < 0.9, `wiele Chat przetrzebia zwierzynę: gameMult spada do ${gmMin.toFixed(2)} (< 0,90)`);
  const w = Advisor.warnings(s).filter(x => /przetrzebiona/.test(x.text));
  const poor = hs.filter(b => s.staffed[b.uid] && Fauna.gameMult(s, b) < 0.7);
  ok(poor.length === 0 || w.length === 1, 'Doradca ostrzega o przetrzebionej zwierzynie, gdy któraś Chata ma plon < 70%');
  if (poor.length) ok(/zwierzyna w łowisku/.test(Advisor.statusOf(poor[0]).text), 'karta Chaty pokazuje stan zwierzyny w łowisku');
  // wyburzenie wszystkich Chat w trakcie wypraw: wyprawy znikają, a zwierzyna nie zostaje „uwięziona"
  const before = s.fauna.hunts.length;
  for (const b of hs) Events.destroy(s, b);
  World.tick(0.05);
  ok(s.fauna.hunts.length === 0, `wyburzenie Chat kończy wyprawy (było ${before}, jest ${s.fauna.hunts.length})`);
  ok(!s.animals.some(a => a.m === Fauna.HUNTED), 'po wyburzeniu żadne zwierzę nie czeka na strzał');
  const prey0 = Fauna.stats(s).prey;
  for (let i = 0; i < 2400; i++) World.tick(0.05);                  // 120 min spokoju
  const prey1 = Fauna.stats(s).prey;
  ok(prey1 > prey0 + 3, `bez myśliwych zwierzyna się odradza (${prey0} → ${prey1} pkt)`);
  console.log(`przetrzebienie: ${hs.length} Chat, gameMult min ${gmMin.toFixed(2)}, odrodzenie ${prey0} → ${prey1} pkt`);
}

/* ---------- 7. parytet ekonomii: boty z fauną ≈ boty bez fauny ---------- */
for (const f of ['franks', 'saracens', 'vikings']) for (const bot of ['R', 'D']) {
  const cfg = { faction: f, bot, epsilon: bot === 'R' ? 0 : 0.15, preset: 'easy' }, a = TestBots.runSync(cfg), b = TestBots.runSync({ ...cfg, fauna: true });
  ok(a.tribute === b.tribute && Math.abs(a.endPop - b.endPop) <= 1 && Math.abs(a.famine - b.famine) <= 2 && Math.abs(a.gold - b.gold) <= Math.max(10, a.gold * 0.05),
    `${f} ${bot}: fauna nie zmienia wyniku gry (haracz ${a.tribute}/${b.tribute}, ludność ${a.endPop}/${b.endPop}, głód ${a.famine}/${b.famine}, złoto ${a.gold}/${b.gold})`);
}

/* ---------- 8. koszt ticku ---------- */
{
  World.init('franks'); const s = World.state(); Fauna.enable(s);
  for (let i = 0; i < 80; i++) World.tick(0.05);
  const N = 2000, t0 = process.hrtime.bigint(); for (let i = 0; i < N; i++) { s.time += 0.05; Fauna.tick(0.05); } const ms = Number(process.hrtime.bigint() - t0) / 1e6 / N;
  ok(ms < 0.6, `Fauna.tick: ${ms.toFixed(3)} ms na tick, ${s.animals.length} zwierząt (limit 0,6; cel 0,3)`);
  console.log(`koszt: Fauna.tick ${ms.toFixed(3)} ms, zwierząt ${s.animals.length}`);
}

console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
