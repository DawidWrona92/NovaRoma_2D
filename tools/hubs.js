// Osada i Składy wyspecjalizowane (Faza 9D-2/9D-3): węzły logistyczne obok Dworu i Składu.
// Sprawdza: dane i sprite'y czterech nacji, reguły stawiania Osady (odległość od Dworu i od siebie, limit zależny od rozmiaru mapy), miejsca w domach i pojemność magazynu,
// wybór węzła przez logistykę (Skład górniczy i drzewny pomagają tylko swoim producentom, Osada skraca drogę o RULES.hub.free), bazę budowniczych i pełną budowę z kosztami.
// Użycie: node tools/hubs.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Data, Build, Logistics, Economy } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const FIDS = ['franks', 'saracens', 'vikings', 'slavs'], HUBS = ['settlement', 'minestore', 'timberstore'];
const rich = s => { s.res.deski = 9999; s.res.kamień = 999; s.res.glina = 999; s.res.złoto = 9999; s.res.narzędzia = 50; };
const set = (s, on) => { s.settings.logistics = on; s.settings.physical = on; };

// --- 1. dane i grafika ---
ok(Data.hubGoods('keep') === '*' && Data.hubGoods('store') === '*' && Data.hubGoods('settlement') === '*' && Data.hubGoods('hut') === null, 'węzły ogólne: Dwór, Skład, Osada; Chata nie jest węzłem');
ok(Data.hubAccepts('minestore', ['ruda', 'węgiel']) && !Data.hubAccepts('minestore', ['ruda', 'pień']) && !Data.hubAccepts('timberstore', ['ruda']) && Data.hubAccepts('timberstore', ['pień', 'deski']), 'Skład górniczy i drzewny przyjmują tylko swoje towary (wszystkie z listy)');
ok(!Data.hubAccepts('minestore', []) && Data.hubAccepts('store', []), 'pusta lista towarów: tylko węzły ogólne');
for (const fid of FIDS) for (const id of HUBS) {
  const d = Data.BUILDINGS[id], c = d.costs[fid];
  ok(c && (c.d || 0) > 0, `${fid}/${id}: jest koszt w deskach`);
  const [w, h] = Data.footprint(id, fid); ok(id === 'settlement' ? (w === 4 && h === 3) : (w === 3 && h === 2), `${fid}/${id}: obrys ${w}×${h}`);
  ok(Data.metaOf(id, fid) && Data.metaOf(id, fid).in, `${fid}/${id}: jest wpis sprite'a z wejściem`);
}
ok(Data.RULES.hub && Data.RULES.hub.free === 3, 'RULES.hub.free = 3');

// --- 2. reguły stawiania Osady: odległość od Dworu, od innych Osad, limit z rozmiaru mapy ---
const maxFor = { 48: 1, 72: 2, 96: 3 };
for (const size of [48, 72, 96]) {
  World.init('slavs', { climate: 'temperate', type: 'plain', seed: 3, size }); const s = World.state(); rich(s); const N = s.map.size, K = N / 48, minD = Math.round(12 * K), apart = Math.round(10 * K);
  const kc = [s.keep.x + s.keep.w / 2, s.keep.y + s.keep.h / 2], [w, h] = Data.footprint('settlement', 'slavs');
  const spots = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (World.canPlace('settlement', x, y).ok) spots.push([x, y]);
  ok(spots.length > 20, `${size}: są miejsca na Osadę (${spots.length})`);
  ok(spots.every(([x, y]) => Math.hypot(x + w / 2 - kc[0], y + h / 2 - kc[1]) >= minD), `${size}: wszystkie dozwolone miejsca ≥ ${minD} pól od Dworu`);
  let near = null; for (let y = 0; y < N && !near; y++) for (let x = 0; x < N; x++) { const r = World.canPlace('settlement', x, y); if (!r.ok && /od Dworu/.test(r.reason || '')) { near = r.reason; break; } }
  ok(near && near.includes(String(minD)), `${size}: odmowa blisko Dworu podaje ${minD} pól: ${near}`);
  const placed = [];
  for (let n = 0; n < maxFor[size]; n++) {
    const sp = spots.find(([x, y]) => World.canPlace('settlement', x, y).ok && placed.every(([px, py]) => Math.hypot(px - x, py - y) >= apart + 1));
    if (!ok(sp, `${size}: miejsce na Osadę nr ${n + 1}`)) break;
    placed.push(sp); World.placeBuilding('settlement', sp[0], sp[1], true);
  }
  ok(s.buildings.filter(b => b.id === 'settlement').length === maxFor[size], `${size}: postawiono ${maxFor[size]} Osad`);
  let any = null; for (let y = 0; y < N && !any; y++) for (let x = 0; x < N; x++) { const r = World.canPlace('settlement', x, y); if (r.ok) { any = [x, y]; break; } else if (/Limit/.test(r.reason || '')) { any = r.reason; break; } }
  ok(typeof any === 'string' && any.includes('Limit Osad') && any.includes(String(maxFor[size])), `${size}: ponad limit ${maxFor[size]} odmowa „${any}”`);
}
// za blisko innej Osady (limit 3 na mapie 96, więc odmowa musi dotyczyć odległości)
{
  World.init('slavs', { climate: 'temperate', type: 'plain', seed: 3, size: 96 }); const s = World.state(); rich(s); const N = 96;
  let a = null; for (let y = 0; y < N && !a; y++) for (let x = 0; x < N; x++) if (World.canPlace('settlement', x, y).ok) { a = [x, y]; break; }
  World.placeBuilding('settlement', a[0], a[1], true);
  const r = World.canPlace('settlement', a[0] + 6, a[1]); ok(!r.ok && /Osady|Dworu|Zajęte|przerwa|blisko/.test(r.reason), 'tuż obok Osady nie da się postawić drugiej: ' + r.reason);
  let got = null; for (let dx = 5; dx < 25 && !got; dx++) { const rr = World.canPlace('settlement', a[0] + dx, a[1]); if (!rr.ok && /innej Osady/.test(rr.reason)) got = rr.reason; }
  ok(got && got.includes('20'), 'odmowa „za blisko innej Osady” podaje 20 pól na mapie 96: ' + got);
}

// --- 3. miejsca w domach i pojemność magazynu ---
for (const fid of FIDS) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'plain', seed: 5, size: 72 }); const s = World.state(); rich(s);
  const per = fid === 'vikings' ? 8 : 6, h0 = Economy.housing(s), c0 = { deski: Economy.capOf(s, 'deski'), ruda: Economy.capOf(s, 'ruda'), pień: Economy.capOf(s, 'pień'), kamień: Economy.capOf(s, 'kamień') };
  const free = id => { for (let y = 2; y < 70; y++) for (let x = 2; x < 70; x++) { const [w, h] = Data.footprint(id, fid); let good = true; for (let dy = 0; dy < h && good; dy++) for (let dx = 0; dx < w; dx++) { const t = s.map.tiles[(y + dy) * 72 + x + dx]; if (t.h !== 1 || t.occup != null || t.trees > 0 || t.deposit || t.k) { good = false; break; } } if (good && Math.hypot(x - 36, y - 36) > 18) return [x, y]; } return null; };
  const at = free('settlement'); World.placeBuilding('settlement', at[0], at[1], true);
  ok(Economy.housing(s) === h0 + 2 * per, `${fid}: Osada daje ${2 * per} miejsc (${Economy.housing(s) - h0})`);
  ok(Economy.capOf(s, 'deski') === Math.min(250, c0.deski + 40) && Economy.capOf(s, 'pień') === Math.min(100, c0.pień + 40), `${fid}: Osada +40 szt. każdego towaru`);
  const mp = (() => { for (let y = 2; y < 70; y++) for (let x = 2; x < 70; x++) if (World.canPlace('minestore', x, y).ok) return [x, y]; return null; })();
  const h1 = Economy.housing(s), cK = Economy.capOf(s, 'kamień'), cR = Economy.capOf(s, 'ruda'), cD = Economy.capOf(s, 'deski');
  World.placeBuilding('minestore', mp[0], mp[1], true);
  ok(Economy.capOf(s, 'kamień') === Math.min(300, cK + 100) && Economy.capOf(s, 'ruda') === Math.min(40, cR + 100) && Economy.capOf(s, 'deski') === cD, `${fid}: Skład górniczy +100 tylko dla kamienia i rudy, deski bez zmian`);
  ok(Economy.housing(s) === h1, `${fid}: Skład nie dodaje miejsc w domach`);
  const tp = (() => { for (let y = 2; y < 70; y++) for (let x = 2; x < 70; x++) if (World.canPlace('timberstore', x, y).ok) return [x, y]; return null; })(), cD2 = Economy.capOf(s, 'deski'), cP = Economy.capOf(s, 'pień'), cK2 = Economy.capOf(s, 'kamień');
  World.placeBuilding('timberstore', tp[0], tp[1], true);
  ok(Economy.capOf(s, 'deski') === Math.min(250, cD2 + 100) && Economy.capOf(s, 'pień') === Math.min(100, cP + 100) && Economy.capOf(s, 'kamień') === cK2, `${fid}: Skład drzewny +100 tylko dla pni i desek`);
}

// --- 4. logistyka: który węzeł obsługuje którego producenta (Frankowie, mapa górzysta — kopalnie w masywie, daleko od Dworu) ---
World.init('franks', { climate: 'temperate', type: 'plain', seed: 11, size: 72 });
{
  let s = World.state(); rich(s); set(s, true); const N = 72;
  const spotFar = (id, minD, near) => { let best = null; for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { if (!World.canPlace(id, x, y).ok) continue; const d = Math.hypot(x - 36, y - 36); if (d < minD) continue; if (near && Math.hypot(x - near[0], y - near[1]) > near[2]) continue; if (!best || d > best[2]) best = [x, y, d]; } return best; };
  const mine = spotFar('ironmine', 14);
  if (ok(mine, 'jest miejsce na Kopalnię żelaza daleko od Dworu')) {
    World.placeBuilding('ironmine', mine[0], mine[1], true); const b = s.buildings.find(q => q.id === 'ironmine'); s.staffed[b.uid] = true;
    const eff = () => { Logistics.effOf(s, b); return Object.assign({}, b.logi); };
    s.buildings.forEach(q => { q.logi = null; }); const e0 = eff(); ok(e0.dist > 10 && e0.via === 'gen', `kopalnia daleko od Dworu: ${Math.round(e0.dist)} pól, węzeł ogólny (${e0.via})`);
    // Skład drzewny obok kopalni nie pomaga
    const tNear = (() => { for (let r = 3; r < 9; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('timberstore', mine[0] + dx, mine[1] + dy).ok) return [mine[0] + dx, mine[1] + dy]; return null; })();
    World.placeBuilding('timberstore', tNear[0], tNear[1], true); const eT = eff(); ok(eT.dist === e0.dist && eT.via === 'gen', `Skład drzewny nie skraca drogi kopalni (${Math.round(eT.dist)} pól, ${eT.via})`);
    // Skład górniczy obok kopalni pomaga
    const mNear = (() => { for (let r = 3; r < 9; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('minestore', mine[0] + dx, mine[1] + dy).ok) return [mine[0] + dx, mine[1] + dy]; return null; })();
    World.placeBuilding('minestore', mNear[0], mNear[1], true); const eM = eff();
    ok(eM.via === 'minestore' && eM.dist < e0.dist / 2 && eM.eff >= e0.eff, `Skład górniczy obok kopalni: ${Math.round(e0.dist)} → ${Math.round(eM.dist)} pól, ${Math.round(e0.eff * 100)}% → ${Math.round(eM.eff * 100)}% (${eM.via})`);
    // Huta (ruda + węgiel + sztabki) też korzysta; Wypalarka-podobny producent z pniem i węglem — tylko Wikingowie, więc sprawdzamy Tartak (pień → deski): górniczy nie pomaga, drzewny tak
    const smelterSpot = (() => { for (let r = 2; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('smelter', mNear[0] + dx, mNear[1] + dy).ok) return [mNear[0] + dx, mNear[1] + dy]; return null; })();
    World.placeBuilding('smelter', smelterSpot[0], smelterSpot[1], true); const sm = s.buildings.find(q => q.id === 'smelter'); s.staffed[sm.uid] = true; Logistics.effOf(s, sm); ok(sm.logi && sm.logi.via === 'minestore', `Huta przy Składzie górniczym liczy do niego (${sm.logi && sm.logi.via})`);
    const sawSpot = (() => { for (let r = 2; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('sawmill', mNear[0] + dx, mNear[1] + dy).ok) return [mNear[0] + dx, mNear[1] + dy]; return null; })();
    World.placeBuilding('sawmill', sawSpot[0], sawSpot[1], true); const sw = s.buildings.find(q => q.id === 'sawmill'); s.staffed[sw.uid] = true; Logistics.effOf(s, sw);
    ok(sw.logi && sw.logi.via !== 'minestore', `Tartak przy Składzie górniczym go nie używa (${sw.logi && sw.logi.via})`);
  }
}

// --- 5. Osada: bonus RULES.hub.free i baza budowniczych ---
{
  World.init('slavs', { climate: 'temperate', type: 'plain', seed: 21, size: 72 }); let s = World.state(); rich(s); set(s, true); const N = 72;
  const far = (() => { let best = null; for (let y = 1; y < N - 4; y++) for (let x = 1; x < N - 4; x++) if (World.canPlace('settlement', x, y).ok) { const d = Math.hypot(x - 36, y - 36); if (!best || d > best[2]) best = [x, y, d]; } return best; })();
  const woodAt = (cx, cy, r0) => { for (let r = r0; r < r0 + 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('woodcutter', cx + dx, cy + dy).ok) return [cx + dx, cy + dy]; return null; };
  const wc = woodAt(far[0], far[1], 5); World.placeBuilding('woodcutter', wc[0], wc[1], true); const w = s.buildings.find(q => q.id === 'woodcutter'); s.staffed[w.uid] = true;
  Logistics.effOf(s, w); const d0 = w.logi.dist;
  const site0 = { id: 'hut', x: far[0] + 6, y: far[1] + 6, w: 2, h: 2, uid: 9999, rot: 0 }; const sd0 = Logistics.siteDist(s, site0);
  World.placeBuilding('settlement', far[0], far[1], true); Logistics.effOf(s, w);
  const d1 = w.logi.dist;
  ok(d1 < d0 && w.logi.via === 'settlement', `Osada skraca drogę drwala: ${Math.round(d0)} → ${Math.round(d1)} pól (${w.logi.via})`);
  const sd1 = Logistics.siteDist(s, site0); ok(sd1 < sd0, `Osada jest bazą budowniczych: dojście na plac ${Math.round(sd0)} → ${Math.round(sd1)} pól`);
  // zwykły Skład w tym samym miejscu daje o RULES.hub.free pola mniej bonusu niż Osada
  World.init('slavs', { climate: 'temperate', type: 'plain', seed: 21, size: 72 }); s = World.state(); rich(s); set(s, true);
  World.placeBuilding('woodcutter', wc[0], wc[1], true); const w2 = s.buildings.find(q => q.id === 'woodcutter'); s.staffed[w2.uid] = true;
  const st = (() => { for (let r = 3; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (World.canPlace('store', far[0] + dx, far[1] + dy).ok) return [far[0] + dx, far[1] + dy]; return null; })();
  World.placeBuilding('store', st[0], st[1], true); Logistics.effOf(s, w2); ok(w2.logi.via === 'gen' && Number.isFinite(w2.logi.dist), `Skład: transport do węzła ogólnego (${Math.round(w2.logi.dist)} pól)`);
}

// --- 6. pełna budowa Osady i składów z kosztem (plac → budynek) ---
for (const fid of FIDS) {
  World.init(fid, { climate: Data.FACTIONS[fid].climate, type: 'plain', seed: 8, size: 72 }); const s = World.state(); rich(s);
  const sp = (() => { for (let y = 1; y < 70; y++) for (let x = 1; x < 68; x++) if (World.canPlace('settlement', x, y).ok) return [x, y]; return null; })();
  const zl0 = s.res.złoto, r = Build.enqueue('settlement', sp[0], sp[1], 0); ok(r.ok, `${fid}: plac Osady (${r.reason || 'ok'})`);
  ok(s.res.złoto === zl0 - 100, `${fid}: otwarcie placu Osady kosztuje 100 złota (${zl0 - s.res.złoto})`);
  for (let t = 0; t < 400 && s.sites.length; t += 0.1) World.tick(0.1);
  ok(s.buildings.some(b => b.id === 'settlement') && !s.sites.length, `${fid}: Osada zbudowana`);
  const msp = (() => { for (let y = 1; y < 70; y++) for (let x = 1; x < 68; x++) if (World.canPlace('minestore', x, y).ok) return [x, y]; return null; })();
  ok(Build.enqueue('minestore', msp[0], msp[1], 0).ok, `${fid}: plac Składu górniczego`);
  for (let t = 0; t < 200 && s.sites.length; t += 0.1) World.tick(0.1); ok(s.buildings.some(b => b.id === 'minestore'), `${fid}: Skład górniczy zbudowany`);
}

console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `Wszystko OK — ${checks} sprawdzeń`); process.exit(fails ? 1 : 0);
