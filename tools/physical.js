// Test fizycznej sprawności transportu (settings.physical, Faza 9B-2): model cyklu pracy Logistics.cycleEff — nigdy powyżej nominału, monotoniczny, skalibrowany do dawnej krzywej liniowej;
// droga i Skład poprawiają sprawność, brak dojścia daje najniższą wartość; parytet przy wyłączonym przełączniku; determinizm, zero RNG, JSON; BRAMKA BILANSU: boty R/D/N czterech nacji
// z physical=true osiągają ≥ 95% wyniku z dawną krzywą logistyczną (to, co gra już dostarcza) i ≥ 85% wyniku bazowego ze specyfikacji (ludność @60/@90/koniec), dostawy haraczu ≥ 85% i głód ≤ 10 min.
// Użycie: node tools/physical.js [plik.html] [--full] [--quick] [--faction=nacja]   (domyślnie bramka na botach R e0 i D; --full: wszystkie 5 konfiguracji z normal.js)
const G = require('./headless').load(process.argv.find((a, i) => i > 1 && a.endsWith('.html')) || 'Nova_Roma.html');
const FULL = process.argv.includes('--full'), QUICK = process.argv.includes('--quick'), ONLY = (process.argv.find(a => a.startsWith('--faction=')) || '').slice(10);   // --quick: bez bramki bilansu (sekcja 3)
const { World, Data, TestBots, RNG, Logistics, Roads, Walkers, Economy } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('  ✘ ' + msg); } return c; };
let inL = 0, rngInL = 0;
for (const m of Object.keys(RNG)) if (typeof RNG[m] === 'function') { const f = RNG[m]; RNG[m] = function () { if (inL) rngInL++; return f.apply(this, arguments); }; }
for (const m of Object.keys(Logistics)) { const f = Logistics[m]; if (typeof f === 'function') Logistics[m] = function () { inL++; try { return f.apply(this, arguments); } finally { inL--; } }; }

const C = Data.RULES.cycle, R = Data.RULES.logistics;
// ---------- 1. model: własności ----------
const probe = { out: { 'pień': 1 } }, bakery = Data.BUILDINGS.bakery, smelter = Data.BUILDINGS.smelter, sawmill = Data.BUILDINGS.sawmill;
let monotone = true, bounded = true, prev = 2;
for (let L = 0; L <= 60; L += 0.5) { const e = Logistics.cycleEff(probe, 1, L).eff; if (e > prev + 1e-12) monotone = false; if (e > 1 + 1e-12 || e < C.min - 1e-12) bounded = false; prev = e; }
ok(monotone, 'sprawność maleje wraz z odległością (nie rośnie nigdzie)');
ok(bounded, `sprawność zawsze w zakresie [${C.min}; 1] — nic nie przyspiesza gospodarki ponad nominał`);
ok(Logistics.cycleEff(probe, 1, 0).eff === 1 && Logistics.cycleEff(probe, 1, C.ref).eff === 1, `do L_ref = ${C.ref} pól — bez kary (i bez premii)`);
const un = Logistics.cycleEff(probe, 1, Infinity); ok(un.unreachable && un.eff === C.min, `brak dojścia → najniższa sprawność ${C.min} (nie zero)`);
// kalibracja do dawnej krzywej dla producenta o tempie ≈ 1 szt./min (drwal): różnica ≤ 0,2 w całym zakresie 0–40 pól (cykl ma L_ref = 8 zamiast 6 pól „za darmo" i nie ma „dna" 0,7)
let worst = 0, atL = 0;
for (let L = 0; L <= 40; L += 1) { const old = 1 - (1 - R.min) * Math.max(0, Math.min(1, (L - R.free) / R.span)), e = Logistics.cycleEff(probe, 1, L).eff, d = Math.abs(old - e); if (d > worst) { worst = d; atL = L; } }
ok(worst <= 0.2, `kalibracja do dawnej krzywej liniowej: największa różnica ${worst.toFixed(3)} (przy ${atL} polach) ≤ 0,2`);
// producenci o dużym przepływie są bardziej wrażliwi na odległość, wolni — mniej
ok(Logistics.cycleEff(bakery, 1, 20).eff < Logistics.cycleEff(probe, 1, 20).eff, 'Piekarnia (3,3 szt./min) traci przy 20 polach więcej niż drwal (1 szt./min)');
ok(Logistics.cycleParams(smelter, 1).trips >= 1.9 && Logistics.cycleParams(sawmill, 1).trips === 1, `kursy: Huta ${Logistics.cycleParams(smelter, 1).trips.toFixed(2)} (2 wejścia na 1 wyjście), Tartak ${Logistics.cycleParams(sawmill, 1).trips} (wejście lżejsze od wyjścia)`);
// droga: ta sama odległość kosztu po drodze (×0,6) daje wyższą sprawność
ok(Logistics.cycleEff(probe, 1, 20 * 0.6).eff > Logistics.cycleEff(probe, 1, 20).eff + 0.04, 'droga (koszt ×0,6) podnosi sprawność o ≥ 4 pp przy 20 polach');

// ---------- 2. świat: parytet, droga, Skład ----------
function bot(fid, cl, ty, seed, minutes, flags, probeFn) {
  World.init(fid, { climate: cl, type: ty, seed }); const s = World.state(); Object.assign(s.settings, flags);
  const plan = TestBots.RECIPE[fid].slice(); let pi = 0, nd = 0;
  for (let t = 0; t < minutes; t += 0.1) { World.tick(0.1); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } if (probeFn) probeFn(s, t); }
  return s;
}
const digest = s => JSON.stringify([s.res, s.pop, s.time, s.buildings.length, s.sites.length, s.tribute && s.tribute.delivered]);
for (const [fid, cl, ty] of [['franks', 'temperate', 'river'], ['saracens', 'desert', 'river'], ['vikings', 'snow', 'coast'], ['slavs', 'eastern', 'wetlands']]) {
  const a = digest(bot(fid, cl, ty, 7, 60, {})), b = digest(bot(fid, cl, ty, 7, 60, { physical: false, logistics: false }));
  ok(a === b, `${fid}: physical=false i logistics=false — logika jak dawniej (parytet)`);
  const p1 = bot(fid, cl, ty, 7, 60, { physical: true }), p2 = bot(fid, cl, ty, 7, 60, { physical: true });
  ok(digest(p1) === digest(p2), `${fid}: physical=true jest deterministyczne`);
  ok(JSON.stringify(JSON.parse(JSON.stringify(p1))) === JSON.stringify(p1), `${fid}: stan gry przechodzi przez JSON`);
  const logi = Logistics.compute(p1); let allLe = true, any = 0; for (const [, r] of logi) { any++; if (r.eff > 1 || r.eff < C.min - 1e-9) allLe = false; }
  ok(any > 5 && allLe, `${fid}: ${any} producentów, sprawność każdego w [${C.min}; 1]`);
}
// czułość na drogę i Skład: producent odległy o ≥ 15 pól zyskuje ≥ 3 pp po położeniu drogi lub postawieniu Składu przy nim
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); const s = World.state(); s.settings.physical = true; s.res.deski = 400; s.res.kamień = 200; s.res.złoto = 400;
  const keep = World.centerOf(s.keep); let spot = null;
  for (let r = 15; r < 24 && !spot; r++) for (let a = 0; a < 360 && !spot; a += 15) { const x = Math.round(keep.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(keep.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('farm', x, y).ok) spot = [x, y]; }
  const placed = spot && Economy && require('./headless') && G.Build.enqueue('farm', spot[0], spot[1]);
  for (let t = 0; t < 30 && s.sites.length; t += 0.1) World.tick(0.1);
  const farm = s.buildings.find(b => b.id === 'farm');
  if (!farm) ok(false, 'nie udało się postawić farmy w odległości ≥ 15 pól');
  else {
    const before = Logistics.compute(s).get(farm.uid);
    ok(before.dist >= 14, `farma stoi ${before.dist.toFixed(1)} pól od Dworu`);
    const e0 = before.eff;
    // skład przy farmie
    const near = [[-3, 0], [3, 0], [0, 3], [0, -3], [-4, 2], [4, -2], [2, 4]].map(([dx, dy]) => [farm.x + dx, farm.y + dy]).find(([x, y]) => World.canPlace('store', x, y).ok);
    if (near) { G.Build.enqueue('store', near[0], near[1]); for (let t = 0; t < 30 && s.sites.length; t += 0.1) World.tick(0.1); const e1 = Logistics.compute(s).get(farm.uid).eff; ok(e1 >= e0 + 0.03, `Skład przy farmie podnosi sprawność z ${e0.toFixed(3)} do ${e1.toFixed(3)} (≥ +0,03)`); }
    else ok(false, 'brak miejsca na Skład przy farmie');
    // droga do Dworu
    World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); const s2 = World.state(); s2.settings.physical = true; s2.res.deski = 400; s2.res.kamień = 200; s2.res.złoto = 400;
    G.Build.enqueue('farm', spot[0], spot[1]); for (let t = 0; t < 30 && s2.sites.length; t += 0.1) World.tick(0.1);
    const f2 = s2.buildings.find(b => b.id === 'farm'), d0 = Walkers.doorOf(f2), kd = Walkers.doorOf(s2.keep), eA = Logistics.compute(s2).get(f2.uid).eff;
    s2.res.deski = 400; const rr = Roads.lay(Math.floor(d0[0]), Math.floor(d0[1]), Math.floor(kd[0]), Math.floor(kd[1])); s2.map.roadRev = (s2.map.roadRev | 0) + 1;
    const eB = Logistics.compute(s2).get(f2.uid).eff;
    ok(rr.ok && eB >= eA + 0.03, `droga do Dworu podnosi sprawność z ${eA.toFixed(3)} do ${eB.toFixed(3)} (≥ +0,03; ${rr.n || 0} pól, ${rr.cost || 0} desek)`);
  }
}
ok(rngInL === 0, `Logistics nie wywołuje RNG (wywołań: ${rngInL})`);

// ---------- 2b. Faza 9B-3: drwal, leśnik, budowniczowie ----------
{
  const tileDist = (map, i, p) => Math.hypot((i % 48) + 0.5 - p[0], ((i / 48) | 0) + 0.5 - p[1]);
  // drwal ścina najbliższe drzewo (bez RNG), a czynnik odległości od lasu maleje wraz z oddaleniem
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); let s = World.state(); s.settings.physical = true; s.res.deski = 400;
  const keep = World.centerOf(s.keep); let spot = null;
  for (let r = 6; r < 14 && !spot; r++) for (let a = 0; a < 360 && !spot; a += 20) { const x = Math.round(keep.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(keep.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('woodcutter', x, y).ok) spot = [x, y]; }
  G.Build.enqueue('woodcutter', spot[0], spot[1]); for (let t = 0; t < 20 && s.sites.length; t += 0.1) World.tick(0.1);
  const wc = s.buildings.find(b => b.id === 'woodcutter'); ok(!!wc, 'drwal postawiony');
  const door = Walkers.doorOf(wc), before = s.map.tiles.map(t => t.trees);
  const nearest = () => { let best = -1, bd = 1e9; s.map.tiles.forEach((t, i) => { if (t.trees > 0 && t.h === 1) { const d = tileDist(s.map, i, door); if (d < bd - 1e-9) { bd = d; best = i; } } }); return best; };
  const first = nearest(); let rngBefore = rngInL; const cnt0 = RNG.next; let rngCalls = 0; RNG.next = function () { rngCalls++; return cnt0.apply(this, arguments); };
  s.res['pień'] = 0; for (let t = 0; t < 6; t += 0.1) { s.res['pień'] = Math.min(s.res['pień'], 5); World.tick(0.1); }
  RNG.next = cnt0;
  ok(s.map.tiles[first].trees < before[first], `drwal ściął najbliższe drzewo (pole ${first % 48},${(first / 48) | 0}, ${tileDist(s.map, first, door).toFixed(1)} pola od drzwi)`);
  const cutTiles = s.map.tiles.map((t, i) => before[i] - t.trees).map((d, i) => d > 0 ? i : -1).filter(i => i >= 0), maxCutD = Math.max(...cutTiles.map(i => tileDist(s.map, i, door)));
  ok(cutTiles.length > 0 && maxCutD <= tileDist(s.map, first, door) + 6, `ścięte drzewa leżą w pobliżu drzwi (najdalsze ${maxCutD.toFixed(1)} pól)`);
  const tf = Logistics.treeFactor(s, wc); ok(tf <= 1 && tf >= C.min, `czynnik lasu drwala ${tf.toFixed(2)} ∈ [${C.min}; 1]`);
  // czynnik maleje z odległością lasu: symulacja przez wycięcie wszystkich drzew w promieniu
  for (const R of [4, 8, 14]) { s.map.tiles.forEach((t, i) => { if (tileDist(s.map, i, door) < R) t.trees = 0; }); wc.tree = null; const f = Logistics.treeFactor(s, wc); wc.__f = wc.__f || []; wc.__f.push(f); }
  ok(wc.__f[0] >= wc.__f[1] && wc.__f[1] >= wc.__f[2] && wc.__f[2] < 0.95, `czynnik lasu maleje z odległością (las dalej niż 4 / 8 / 14 pól: ${wc.__f.map(v => v.toFixed(2)).join(' → ')})`);
  // leśnik sadzi przy swojej chacie
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); s = World.state(); s.settings.physical = true; s.res.deski = 400;
  spot = null; for (let r = 6; r < 14 && !spot; r++) for (let a = 0; a < 360 && !spot; a += 20) { const x = Math.round(keep.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(keep.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('forester', x, y).ok) spot = [x, y]; }
  G.Build.enqueue('forester', spot[0], spot[1]); for (let t = 0; t < 20 && s.sites.length; t += 0.1) World.tick(0.1);
  const fo = s.buildings.find(b => b.id === 'forester'), fd = Walkers.doorOf(fo), t0 = s.map.tiles.map(t => t.trees);
  for (let t = 0; t < 90; t += 0.1) World.tick(0.1);
  const added = s.map.tiles.map((t, i) => t.trees - t0[i]).map((d, i) => d > 0 ? [i, d] : null).filter(Boolean);
  const nNear = added.filter(([i]) => tileDist(s.map, i, fd) <= 9).reduce((a, [, d]) => a + d, 0), nAll = added.reduce((a, [, d]) => a + d, 0);
  ok(nAll >= 10 && nNear >= 0.9 * nAll, `Leśniczówka sadzi przy chacie: ${nNear} z ${nAll} nowych drzew w promieniu 9 pól`);
  // budowa: dojście i czas noszenia zależą od odległości
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); s = World.state(); s.settings.physical = true; s.res.deski = 400; s.res.kamień = 100;
  const kc = World.centerOf(s.keep), near = [], far = [];
  for (let r = 4; r < 24; r++) for (let a = 0; a < 360; a += 20) { const x = Math.round(kc.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(kc.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('hut', x, y).ok) (r <= 7 ? near : far).push([x, y, r]); }
  G.Build.enqueue('hut', near[0][0], near[0][1]); G.Build.enqueue('hut', far[far.length - 1][0], far[far.length - 1][1]);
  const sn = s.sites[0], sf = s.sites[1];
  ok(Logistics.pieceMin(s, sn, G.Build.PIECE_MIN) >= G.Build.PIECE_MIN - 1e-9 && Logistics.pieceMin(s, sf, G.Build.PIECE_MIN) > Logistics.pieceMin(s, sn, G.Build.PIECE_MIN) + 0.05, `czas noszenia sztuki rośnie z odległością: blisko ${Logistics.pieceMin(s, sn, G.Build.PIECE_MIN).toFixed(2)} min, daleko ${Logistics.pieceMin(s, sf, G.Build.PIECE_MIN).toFixed(2)} min (nominał ${G.Build.PIECE_MIN})`);
  World.tick(0.05); ok(sn.walkLeft != null && sf.walkLeft != null && sf.walkLeft > sn.walkLeft, `budowniczowie dochodzą na plac: ${sn.walkLeft.toFixed(2)} min (blisko), ${sf.walkLeft.toFixed(2)} min (daleko)`);
  // przy wyłączonym przełączniku dawne zachowanie: brak pól fizycznych
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); s = World.state(); s.res.deski = 400; G.Build.enqueue('hut', near[0][0], near[0][1]); World.tick(0.05);
  ok(s.sites[0].walkLeft === undefined && s.saplings.every(sp => sp.b === undefined), 'physical=false: place bez dojścia i sadzonki bez przypisania (dawny model)');
}

// ---------- 2b'. podgląd transportu w trybie budowy (jak w Settlers IV) ----------
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 7 }); const s = World.state(); s.settings.physical = true; s.settings.logistics = true;
  const kc = World.centerOf(s.keep), pick = (rmin, rmax) => { for (let r = rmin; r < rmax; r++) for (let a = 0; a < 360; a += 15) { const x = Math.round(kc.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(kc.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('bakery', x, y).ok) return [x, y]; } return null; };
  const nearP = pick(4, 9), farP = pick(16, 26), pn = nearP && Logistics.previewAt(s, 'bakery', nearP[0], nearP[1]), pf = farP && Logistics.previewAt(s, 'bakery', farP[0], farP[1]);
  ok(pn && pf && pn.eff > pf.eff + 0.05 && pf.dist > pn.dist, `podgląd transportu: Piekarnia blisko Dworu ${pn && Math.round(pn.dist)} pól → ${pn && (pn.eff * 100).toFixed(0)}%, daleko ${pf && Math.round(pf.dist)} pól → ${pf && (pf.eff * 100).toFixed(0)}%`);
  ok(Logistics.previewAt(s, 'hut', nearP[0], nearP[1]) === null && Logistics.previewAt(s, 'keep', 1, 1) === null, 'budynki bez produkcji nie mają podglądu transportu');
  const f0 = Logistics.fieldWith(s), f1 = Logistics.fieldWith(s, farP[0], farP[1]), i = Math.floor(farP[1]) * 48 + Math.floor(farP[0]);
  ok(f1[i] < f0[i] - 5 && f1.every((v, k) => v <= f0[k] + 1e-9), `planowany Skład w ${farP} skraca drogę do tego miejsca z ${f0[i].toFixed(1)} do ${f1[i].toFixed(1)} i nigdzie jej nie wydłuża (mapa ciepła)`);
}

// ---------- 2c. Faza 9B-4: karawany Saracenów ----------
{
  const { Tribute } = G, Cc = Data.RULES.caravan;
  World.init('saracens', { climate: 'desert', type: 'river', seed: 7 }); let s = World.state(); s.settings.physical = true; s.res.deski = 800; s.res.kamień = 300; s.res.glina = 300; s.res.złoto = 400; s.res.narzędzia = 20;
  const kc = World.centerOf(s.keep); let spot = null;
  for (let r = 5; r < 14 && !spot; r++) for (let a = 0; a < 360 && !spot; a += 20) { const x = Math.round(kc.x + Math.cos(a * Math.PI / 180) * r), y = Math.round(kc.y + Math.sin(a * Math.PI / 180) * r); if (World.canPlace('market', x, y).ok) spot = [x, y]; }
  G.Build.enqueue('market', spot[0], spot[1]); for (let t = 0; t < 30 && s.sites.length; t += 0.1) World.tick(0.1);
  const mk = s.buildings.find(b => b.id === 'market'); World.tick(0.1); ok(!!mk && !!s.staffed[mk.uid], 'Targ postawiony i obsadzony');
  const gold0 = s.res.złoto; s.res.kadzidło = 12; s.marketPrices.kadzidło = 4.2; let dispatchedAt = null, soldAt = null, goldBack = null, maxActive = 0, revSnap = 0;
  const t0 = s.time; let c0 = null;
  for (let t = 0; t < 12; t += 0.05) {
    World.tick(0.05); maxActive = Math.max(maxActive, s.caravans.length);
    if (!c0 && s.caravans.length) { c0 = JSON.parse(JSON.stringify(s.caravans[0])); dispatchedAt = s.time - t0; }
    if (c0 && !soldAt && s.caravans[0] && s.caravans[0].sold) { soldAt = s.time - t0; revSnap = s.caravans[0].rev; }
    if (c0 && goldBack === null && !s.caravans.length) goldBack = s.time - t0;
  }
  ok(!!c0 && dispatchedAt <= 0.2 && c0.goods.kadzidło >= 11, `komplet towaru (≥ ${Cc.load} szt.) rusza od razu: karawana wyruszyła po ${dispatchedAt && dispatchedAt.toFixed(2)} min z ${c0 && c0.goods.kadzidło.toFixed(1)} szt.`);
  ok(c0 && s.res.kadzidło < 1, 'towar zniknął ze skarbca w chwili wyruszenia karawany');
  const T = c0 ? (c0.tSale - c0.t0) : 0;
  ok(c0 && T > 0.5 && T < 4 && Math.abs(c0.tBack - c0.tSale - (c0.tSale - c0.t0) - Cc.sale) < 1e-6, `czas drogi w jedną stronę ${T.toFixed(2)} min (trasa ${c0 && c0.cost.toFixed(1)} pól, ${Data.RULES.walk.caravan} pól/min), sprzedaż ${Cc.sale} min, powrót tyle samo`);
  const N = s.map.size; ok(c0 && (c0.tx < 1 || c0.ty < 1 || c0.tx > N - 1 || c0.ty > N - 1), `karawana idzie na krawędź mapy (cel ${c0 && c0.tx.toFixed(1)}, ${c0 && c0.ty.toFixed(1)})`);
  ok(soldAt !== null && soldAt >= T - 0.1 && goldBack !== null && goldBack >= 2 * T + Cc.sale - 0.1, `sprzedaż po dojściu (${soldAt && soldAt.toFixed(2)} min), złoto po powrocie (${goldBack && goldBack.toFixed(2)} min)`);
  const earned = revSnap, expected = (() => { let p = 4.2, r = 0; for (let i = 0; i < Math.floor(c0 ? c0.goods.kadzidło : 0); i++) { r += Math.max(0.9, p); p = Math.max(0.9, p - 0.05); } return r; })();
  ok(earned > 0.9 * expected && earned < 1.1 * expected + 1, `przychód ${earned.toFixed(1)} zł ≈ sprzedaż po krzywej cen (${expected.toFixed(1)} zł)`);
  ok(maxActive <= 1, `jednocześnie jedzie nie więcej karawan niż Targów (max ${maxActive})`);
  ok(JSON.stringify(JSON.parse(JSON.stringify(s.caravans))) === JSON.stringify(s.caravans) && JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s), 'karawany przechodzą przez JSON');
  // pozycja karawany = czysta funkcja czasu: na początku przy Targu, w chwili sprzedaży na krawędzi, po powrocie znów przy Targu
  s.res.kadzidło = 10; World.tick(0.1); const cv = s.caravans[0];
  if (cv) {
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), keep = s.time;
    s.time = cv.t0; let f = Walkers.caravanFigures(s)[0]; ok(d([f.x, f.y], [cv.dx, cv.dy]) < 0.8, 'w chwili wyruszenia kupiec stoi przy Targu');
    s.time = cv.tSale + 0.01; f = Walkers.caravanFigures(s)[0]; ok(d([f.x, f.y], [cv.tx, cv.ty]) < 1.5, `w chwili sprzedaży kupiec jest na krawędzi mapy (${f.x.toFixed(1)}, ${f.y.toFixed(1)})`);
    s.time = (cv.t0 + cv.tSale) / 2; f = Walkers.caravanFigures(s)[0]; ok(Walkers.caravanFigures(s).length === 3 && f.moving, 'karawana to 3 postaci (kupiec i 2 wielbłądy), w drodze się porusza');
    s.time = keep;
  } else ok(false, 'brak karawany do sprawdzenia pozycji');
  // bez przełącznika: sprzedaż natychmiast jak dawniej
  World.init('saracens', { climate: 'desert', type: 'river', seed: 7 }); s = World.state(); s.res.deski = 800; s.res.kamień = 300; s.res.glina = 300; s.res.narzędzia = 20;
  G.Build.enqueue('market', spot[0], spot[1]); for (let t = 0; t < 30 && s.sites.length; t += 0.1) World.tick(0.1);
  const g1 = s.res.złoto; s.res.kadzidło = 12; World.tick(0.1); ok(s.res.złoto > g1 + 20 && s.caravans.length === 0, 'physical=false: sprzedaż natychmiast, bez karawan (dawny model)');
}

// ---------- 3. bramka bilansu: boty z physical=true vs bazowe ----------
const CFGS = FULL ? [['R', 0, 'off'], ['R', 0, 'easy'], ['R', 0.15, 'easy'], ['D', 0.15, 'easy'], ['N', 0.15, 'easy']] : [['R', 0, 'easy'], ['D', 0.15, 'easy']];
let worstRatio = 1, worstCur = 1, rows = 0;
for (const fid of ['franks', 'saracens', 'vikings', 'slavs'].filter(f => !ONLY || f === ONLY)) for (const [bt, eps, preset] of (QUICK ? [] : CFGS)) {
  const base = TestBots.runSync({ faction: fid, bot: bt, epsilon: eps, preset }), ph = TestBots.runSync({ faction: fid, bot: bt, epsilon: eps, preset, logistics: true, physical: true }), old = TestBots.runSync({ faction: fid, bot: bt, epsilon: eps, preset, logistics: true });
  const ratio = (v, w) => w > 0 ? v / w : 1, q = (x, y) => ratio(x.pop[60], y.pop[60]) < ratio(x.pop[90], y.pop[90]) ? ratio(x.pop[60], y.pop[60]) : ratio(x.pop[90], y.pop[90]);
  const mCur = Math.min(q(ph, old), ratio(ph.endPop, old.endPop)), mBase = Math.min(q(ph, base), ratio(ph.endPop, base.endPop)), dl = ratio(ph.delivered, old.delivered);
  worstRatio = Math.min(worstRatio, mBase); worstCur = Math.min(worstCur, mCur); rows++;
  console.log(`${fid.padEnd(9)} ${bt} e${eps} ${preset.padEnd(4)} pop@60/90/koniec: baza ${base.pop[60]}/${base.pop[90]}/${base.endPop} · krzywa ${old.pop[60]}/${old.pop[90]}/${old.endPop} · cykl ${ph.pop[60]}/${ph.pop[90]}/${ph.endPop} · dostawa ${base.delivered}→${old.delivered}→${ph.delivered} · głód ${base.famine}→${old.famine}→${ph.famine} min · haracz ${base.tribute}→${ph.tribute}`);
  ok(mCur >= 0.95, `${fid} ${bt}: ludność z cyklem pracy ≥ 95% ludności z dawną krzywą (${(mCur * 100).toFixed(0)}%)`);
  ok(mBase >= 0.85, `${fid} ${bt}: ludność z cyklem pracy ≥ 85% bazowej ze specyfikacji (${(mBase * 100).toFixed(0)}%)`);
  ok(ph.famine <= Math.max(10, old.famine + 5), `${fid} ${bt}: głód ${ph.famine} min (≤ ${Math.max(10, old.famine + 5)})`);
  ok(old.delivered === 0 || dl >= 0.85, `${fid} ${bt}: dostawy haraczu ≥ 85% dostaw z dawną krzywą (${(dl * 100).toFixed(0)}%)`);
}
console.log(`najgorszy stosunek ludności: ${(worstRatio * 100).toFixed(0)}% bazowej, ${(worstCur * 100).toFixed(0)}% z dawną krzywą (${rows} przebiegów)`);
console.log(fails ? `\n${fails} z ${checks} sprawdzeń nie przeszło` : `\nWszystko OK (${checks} sprawdzeń)`);
process.exit(fails ? 1 : 0);
