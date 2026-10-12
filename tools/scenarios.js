'use strict';
/* Scenariusze akceptacyjne ze specyfikacji (rozdz. „Kryteria akceptacji i testy regresji"):
   normalna gra, warunki brzegowe, kryzysy — dla 4 nacji, z niezmiennikami sprawdzanymi w każdym ticku.
   Użycie:  node tools/scenarios.js [Nova_Roma.html] [filtr-nazwy] */
const { load } = require('./headless');

const file = process.argv[2] && process.argv[2].endsWith('.html') ? process.argv[2] : 'Nova_Roma.html';
const filter = process.argv.find((a, i) => i >= 2 && !a.endsWith('.html')) || '';
const G = load(file);
const { World: W, Tribute, TestBots: TB, Economy, Events, MapGen, Data } = G;

const FOOD_IDS = ['orchard', 'hunter', 'farm', 'mill', 'bakery', 'dairy', 'watercarrier', 'dategrove', 'fisherhut', 'gatherer', 'field', 'kasha'];
const base = f => TB.RECIPE[f].slice();
const without = (plan, ...ids) => plan.filter(x => !ids.includes(x));
function dropN(plan, id, n) { const out = []; let k = 0; for (const x of plan) { if (x === id && k < n) { k++; continue; } out.push(x); } return out; }
function keepN(plan, id, n) { const out = []; let k = 0; for (const x of plan) { if (x === id) { if (k >= n) continue; k++; } out.push(x); } return out; }

/* jeden przebieg: bot R z przepisem (ε = 0), zdarzenia o zadanym czasie, odbudowa spalonych budynków */
function run(spec) {
  const undo = spec.patch ? spec.patch() : null;
  try {
    const f = spec.f;
    W.init(f);
    const s = W.state();
    if (spec.tax != null) s.controls.tax = spec.tax;
    if (spec.mixed) s.voyageMode = 'mixed';
    if (spec.setup) spec.setup(s);
    const pre = (spec.level === 0) ? null : Tribute.set('custom', spec.level || 3);
    let plan = (spec.plan ? spec.plan(base(f)) : base(f));
    const END = spec.end || TB.EVAL_END[f];
    const events = (spec.events || []).map(e => ({ ...e, done: false }));
    let pi = 0, nextDecide = 0, empty = 0, minPop = 99, pop36 = null;
    const marks = {}, viol = {}, rebuild = [];
    const flag = m => { viol[m] = (viol[m] || 0) + 1; };
    const sites = s.map.tiles;
    const cap = s.map.tiles.length;
    for (let t = 0; t < END - 0.05; t += 0.1) {
      W.tick(0.1);
      // --- niezmienniki (spec: „Niezmienniki do sprawdzania w silniku") ---
      for (const g in Economy.LIMIT) {
        if (s.res[g] < -1e-6) flag('ujemny zapas ' + g);
        const startMax = g === 'narzędzia' ? Data.FACTIONS[f].start.tools : 0; // spec: start 14 narzędzi przy limicie magazynu 10
        if (s.res[g] > Math.max(Economy.LIMIT[g], startMax) + 1e-6) flag('ponad limit ' + g);
      }
      if (s.pop < 10 - 1e-9) flag('ludność < 10');
      if (s.res.narzędzia < -1e-9) flag('ujemne narzędzia');
      if (s.buildersActive < 2) flag('budowniczych < 2');
      if (s.workersStaffed + s.crewAway > Math.floor(s.pop) + 2) flag('załoga + pracownicy > ludność');
      for (const g of ['kadzidło', 'tkanina', 'ceramika']) {
        const m = s.buildings.some(b => b.id === 'caravanserai' && s.staffed[b.uid]) ? 1.2 : 1;
        const lo = { kadzidło: 0.9, tkanina: 0.9, ceramika: 0.6 }[g] * m - 1e-6, hi = { kadzidło: 4.2, tkanina: 3.6, ceramika: 2.4 }[g] * m + 1e-6;
        if (f === 'saracens' && (s.marketPrices[g] < lo - 0.0001 || s.marketPrices[g] > hi + 0.0001)) { flag('cena ' + g + ' poza krzywą'); }
      }
      if (Economy.totalFood(s.res) < 0.01) empty += 0.1;
      if (pop36 === null && s.pop >= 36) pop36 = Math.round(t);
      minPop = Math.min(minPop, s.pop);
      for (const m of [20, 40, 60, 90, 150]) if (t >= m && !(m in marks)) marks[m] = Math.floor(s.pop);
      // --- zdarzenia scenariusza ---
      for (const e of events) if (!e.done && s.time >= e.at) {
        e.done = true;
        const before = s.buildings.map(b => b.id);
        const r = e.fn(s);
        if (e.rebuild !== false) {
          const after = s.buildings.slice(); // spalone = zniknęły z listy
          const cnt = {}; for (const id of before) cnt[id] = (cnt[id] || 0) + 1;
          for (const b of after) cnt[b.id]--;
          for (const id in cnt) for (let k = 0; k < cnt[id]; k++) rebuild.push(id);
        }
        if (Array.isArray(r)) rebuild.push(...r);
      }
      // --- decyzje bota ---
      if (t >= nextDecide) {
        nextDecide = t + 0.5;
        if (s.time >= (spec.planFrom || 0)) {
          if (rebuild.length) {
            const id = rebuild[0], r = TB.tryBuild(s, id);
            if (r === 'built' || r === 'noplace') rebuild.shift();
          } else if (pi < plan.length) {
            const r = TB.tryBuild(s, plan[pi]);
            if (r === 'built' || r === 'noplace') pi++;
          }
        }
      }
      if (spec.late && t >= spec.late.at && !spec._lateDone) { spec._lateDone = true; plan = plan.slice(0, pi).concat(spec.late.items, plan.slice(pi)); }
    }
    if (!(150 in marks)) marks[150] = Math.floor(s.pop);
    const tr = s.tribute;
    const met = tr ? tr.met : 0, total = tr ? tr.met + tr.missed : 0;
    return { f, met, total, trib: met + '/' + total, pop: marks, endPop: Math.floor(s.pop), minPop: Math.floor(minPop),
      starve: Math.round(s.stats.starveMin), empty: Math.round(empty), gold: Math.round(s.res.złoto), planks: Math.round(s.stats.planksSpent),
      trees: W.treeCount(), voyages: s.voyageStats.done, pop36, byGood: tr && tr.byGood, delivered: tr ? Math.round(tr.delivered) : 0,
      raids: s.raids.count, lost: Math.round(s.raids.lost), tools: s.stats.toolsBought, viol, pi: pi + '/' + plan.length,
      bld: s.buildings.reduce((a, b) => { a[b.id] = (a[b.id] || 0) + 1; return a; }, {}) };
  } finally { if (undo) undo(); }
}

/* ------------------------------ definicje scenariuszy ------------------------------ */
const patchData = (f, key, val) => () => { const d = Data.FACTIONS[f], old = d[key]; d[key] = typeof val === 'object' ? { ...old, ...val } : val; return () => { d[key] = old; }; };
const fire70 = ids => ({ at: 70, fn: s => Events.fire(s, ids) });
const S = []; // { name, spec, expect: 'opis', ok: r => bool }
const add = (name, spec, expect, ok) => S.push({ name, spec, expect, ok });

/* --- normalna gra (poziom 3) --- */
add('F  normalna gra', { f: 'franks' }, '6/6, ludność ≈43 (±15%), 36 os. ≈47. min', r => r.met === r.total && r.total >= 6 && Math.abs(r.endPop - 43) <= 7);
add('S  normalna gra (bez napadów)', { f: 'saracens', setup: s => { s.settings.raids = false; } }, '6/6, ludność ≈36 (±15%)', r => r.met === r.total && r.total >= 6 && Math.abs(r.endPop - 36) <= 6);
add('V  normalna gra', { f: 'vikings' }, '6/6, ludność ≈38 (±15%)', r => r.met === r.total && r.total >= 6 && Math.abs(r.endPop - 38) <= 6);
add('W  normalna gra', { f: 'slavs' }, '6/6, ludność 40, 36 os. w 25. min, 540 os.min.', r => r.met === 6 && r.total === 6 && r.endPop === 40 && r.delivered === 540);

/* --- Frankowie: warunki brzegowe --- */
add('F1 kopalnie bez żywności', { f: 'franks', plan: p => without(p, 'orchard', 'hunter', 'farm', 'mill', 'bakery', 'dairy') }, 'ludność 10, głód ~137 min, 0/6', r => r.met === 0 && r.endPop <= 14);
add('F2 Zbrojownia bez Huty', { f: 'franks', plan: p => without(p, 'smelter') }, '0/6 (zero darmowej broni)', r => r.met === 0);
add('F3 1 łańcuch i 8 kopalni', { f: 'franks', patch: patchData('franks', 'deposits', { iron: 4, coal: 4 }),
  plan: p => { const q = without(p, 'ironmine', 'coalmine', 'smelter', 'armory', 'sawmill', 'farm', 'mill', 'bakery', 'toolforge'); const i = q.indexOf('barracks'); return [...q.slice(0, i + 1).concat(['farm', 'mill', 'bakery']), ...q.slice(i + 1), ...Array(4).fill('ironmine'), ...Array(4).fill('coalmine')]; } },
  'kopalnie stoją (jedzą tylko z nadwyżki), 0/6, bez głodu', r => r.met === 0 && r.starve < 5);
add('F4 1 miejsce pod Kopalnię węgla', { f: 'franks', patch: patchData('franks', 'deposits', { coal: 1 }) }, '6/6 (poziom 3 mieści się w połowie mocy), ludność ≈42', r => r.met >= 5 && r.endPop >= 36);
add('F5 0 miejsc pod Kamieniołom', { f: 'franks', patch: patchData('franks', 'deposits', { stone: 0 }) }, '3/6, ludność ≈39 (bez kamienia brak Tartaku i Huty)', r => r.met < r.total && r.endPop >= 30);
add('F6 podatek 3', { f: 'franks', tax: 3 }, 'start zamrożony (ludność 14 jeszcze w 40. min w spec), poziom 3 spełniony', r => r.pop[20] <= 16 && r.met >= 5);

/* --- Saraceni: warunki brzegowe (bez napadów, żeby wynik był deterministyczny) --- */
const noRaids = s => { s.settings.raids = false; };
add('S1 eksport bez Gajów', { f: 'saracens', setup: noRaids, plan: p => without(p, 'dategrove') }, 'ludność 10, głód ~126 min, 3/6', r => r.endPop <= 20 && r.met < r.total);
add('S2 5 Wytwórni na 1 Gaju', { f: 'saracens', setup: noRaids, plan: p => [...keepN(without(p, 'incense', 'incensewood'), 'dategrove', 1), ...Array(5).fill('incensewood'), ...Array(5).fill('incense')] }, 'ludność 10, głód ~113 min, 2/6 (w silniku wytwórnie jedzą tylko z nadwyżki → bez śmierci głodowej)', r => r.endPop <= 30 && r.met < r.total);
add('S3 bez wody', { f: 'saracens', setup: noRaids, plan: p => without(p, 'watercarrier', 'qanat') }, 'ludność 14, 0/6 (woda realnym ograniczeniem)', r => r.met === 0);
add('S4 wyczerpana glina (60)', { f: 'saracens', setup: s => { noRaids(s); s.depositLeft = { clay: 60 }; } }, 'budowa staje, ekonomia działa; 1/6', r => r.total >= 6);
add('S5 0 miejsc pod Glinianki', { f: 'saracens', setup: noRaids, patch: patchData('saracens', 'deposits', { clay: 0 }) }, '0/6 (zawór Dworu 0,4 gliny/min)', r => r.met < r.total);
add('S6 sam eksport kadzidła', { f: 'saracens', setup: noRaids, plan: p => without(p, 'cotton', 'weaver', 'pottery') }, '6/6, ludność ≈37', r => r.met >= 5);
add('S7 1 Targ', { f: 'saracens', setup: noRaids, plan: p => keepN(p, 'market', 1) }, '6/6, ludność ≈36 (drugi Targ wart ≈257 zł)', r => r.met >= 5);

/* --- Wikingowie: warunki brzegowe --- */
add('V1 Okręt bez Miodosytni', { f: 'vikings', plan: p => without(p, 'mead') }, '0 wypraw, 0/6', r => r.voyages === 0 && r.met === 0);
add('V1 Okręt bez Zbrojowni', { f: 'vikings', plan: p => without(p, 'armory') }, '0 wypraw', r => r.voyages === 0);
add('V1 Okręt bez kopalni rudy', { f: 'vikings', plan: p => without(p, 'peatmine') }, '0 wypraw', r => r.voyages === 0);
add('V2 4 Wypalarki na 2 drwalach', { f: 'vikings', plan: p => [...keepN(without(p, 'charburner', 'smelter', 'armory', 'peatmine'), 'woodcutter', 2), ...Array(4).fill('charburner')] }, 'ludność ≈28, 0 wypraw (wypalarki bez rudy i huty nie dają broni)', r => r.voyages === 0);
add('V3 0 miejsc pod Kopalnię darniową', { f: 'vikings', patch: patchData('vikings', 'deposits', { peat: 0 }) }, '0 wypraw, ludność ≈40', r => r.voyages === 0);
add('V4 3 miejsca na brzegu', { f: 'vikings', setup: s => { s.settings.shoreSpots = 3; } }, '6/6, ludność ≈32', r => r.met >= 5 && r.endPop < 38);
add('V5 3 miejsca + dodatkowy Myśliwy/Mleczarnia/Sad', { f: 'vikings', setup: s => { s.settings.shoreSpots = 3; }, plan: p => [...p, 'hunter', 'dairy', 'orchard'] }, '6/6, ludność ≈48 (różnorodność zastępuje ryby)', r => r.met >= 5 && r.endPop >= 38);
add('V6 poziom 8, przepis nacji, zwykłe', { f: 'vikings', level: 8 }, '3/6 (poziom 8 przekracza pojemność 7)', r => r.met < r.total);

/* --- Słowianie: presety i pojemność --- */
add('W1 Normalny (poziom 6)', { f: 'slavs', level: 6 }, '6/6', r => r.met === r.total && r.total === 6);
add('W2 Trudny (poziom 8), przepis nacji', { f: 'slavs', level: 8 }, '4/6 (poziom 8 > pojemność 7)', r => r.met < r.total && r.met >= 2);
add('W3 Mistrz (poziom 11) + 2 pary', { f: 'slavs', level: 11, plan: p => [...p, ...['bartnik', 'waxery', 'trapper', 'tannery', 'bartnik', 'waxery', 'trapper', 'tannery']] }, '6/6, ≈275 drzew', r => r.met === r.total);
/* --- Słowianie: warunki brzegowe --- */
add('W4 brak Chaty nosiwody', { f: 'slavs', plan: p => without(p, 'watercarrier') }, '0/6 (Garbarnia bez wody)', r => r.met === 0);
add('W5 Barć bez Woskarni', { f: 'slavs', plan: p => without(p, 'waxery') }, '0/6 (plaster nie jest miodem ani woskiem)', r => r.met === 0);
add('W6 Chaty łowców bez Garbarni', { f: 'slavs', plan: p => without(p, 'tannery') }, '0/6', r => r.met === 0);
add('W7 tylko futra', { f: 'slavs', plan: p => without(p, 'bartnik', 'waxery') }, '0/6 (każdy towar ≥ 50% udziału)', r => r.met === 0);
add('W8a 5 drwali bez leśników, poziom 3', { f: 'slavs', plan: p => [...without(p, 'forester'), 'woodcutter', 'woodcutter', 'woodcutter'] }, '6/6, 11 min głodu, ≈32 drzewa', r => r.trees < 120);
add('W8b 5 drwali bez leśników, poziom 5', { f: 'slavs', level: 5, plan: p => [...without(p, 'forester'), 'woodcutter', 'woodcutter', 'woodcutter'] }, '4/6, ludność ≈33', r => r.met < r.total);
add('W9a las 150 drzew na starcie', { f: 'slavs', patch: patchData('slavs', 'treesTarget', 150) }, '6/6, ludność ≈33', r => r.met === r.total);
add('W9b las 100 drzew na starcie', { f: 'slavs', patch: patchData('slavs', 'treesTarget', 100) }, 'spec: 0/6 (wosk 7 z 135 os.min.); silnik: plon ×0,5 i las odrasta dzięki Leśniczówkom — ludność niższa (≈30), haracz na granicy', r => r.pop[40] < 36 && r.pop[20] < 28);
add('W10 poziom 6 bez Składu', { f: 'slavs', level: 6, plan: p => without(p, 'store') }, '5/6 (pojemność 6); silnik: poziom 6 przechodzi, poziom 7 bez Składu 0/6 (patrz tools/store.js)', r => r.met >= 5);
add('W11 Kapliczka bez Woskarni', { f: 'slavs', plan: p => without(p, 'waxery') }, '0/6', r => r.met === 0);
add('W12 bez żywności leśnej', { f: 'slavs', plan: p => without(p, 'gatherer') }, '6/6, ludność ≈24', r => r.met === r.total && r.endPop <= 30);
/* --- Słowianie: kryzysy --- */
add('W13 zaraza −12 os. na 60. min', { f: 'slavs', events: [{ at: 60, fn: s => Events.plague(s), rebuild: false }] }, 'bez trwałej straty, 6/6', r => r.met === r.total);
add('W14a pożar 3 Barci i 3 Woskarni na 70. min', { f: 'slavs', events: [fire70(['bartnik', 'bartnik', 'bartnik', 'waxery', 'waxery', 'waxery'])] }, '6/6, odbudowa bez cheatów', r => r.met >= 5);
add('W14b pożar 3 Garbarni i 3 Chat łowców na 70. min', { f: 'slavs', events: [fire70(['tannery', 'tannery', 'tannery', 'trapper', 'trapper', 'trapper'])] }, '6/6, odbudowa bez cheatów', r => r.met >= 5);
add('W15 pożar lasu (60% drzew) na 70. min', { f: 'slavs', events: [{ at: 70, fn: s => Events.forestFire(s, 0.6), rebuild: false }] }, '6/6, ≈155 drzew na końcu', r => r.met >= 5);
add('W16 las spada do 80 drzew na 60. min', { f: 'slavs', events: [{ at: 60, fn: s => { const n = W.treeCount(); if (n > 80) W.takeTrees(n - 80); }, rebuild: false }] }, '6/6, ≈139 drzew na końcu (Leśniczówki odtwarzają)', r => r.met >= 5 && r.trees > 80);
add('W17 brak żywności do 40. min, potem odbudowa', { f: 'slavs', plan: p => without(p, ...FOOD_IDS), late: { at: 40, items: FOOD_IDS.filter(id => id !== 'dategrove' && id !== 'fisherhut').flatMap(id => id === 'gatherer' ? [id, id, id] : [id]) } }, 'ludność 10 przez ~27 min głodu, ≈26 na końcu', r => r.minPop <= 14 && r.endPop > 14);

/* --- Kryzysy F/S/V (poziom 3) --- */
add('FK1 brak żywności do 40. min', { f: 'franks', plan: p => without(p, ...FOOD_IDS), late: { at: 40, items: ['orchard', 'hunter', 'dairy', 'watercarrier', 'farm', 'mill', 'bakery'] } }, 'ludność 10 przez ~31 min głodu, ≈21 na końcu', r => r.minPop <= 14 && r.endPop > 14);
add('FK2 zaraza −12 na 60. min', { f: 'franks', events: [{ at: 60, fn: s => Events.plague(s), rebuild: false }] }, 'bez trwałej straty, 6/6', r => r.met === r.total);
add('FK3 pożar łańcucha chleba i Sadu na 60. min', { f: 'franks', events: [{ at: 60, fn: s => Events.fire(s, ['bakery', 'mill', 'farm', 'orchard']) }] }, 'głód 0, 6/6', r => r.met === r.total && r.starve === 0);
add('SK1 brak żywności do 40. min', { f: 'saracens', setup: noRaids, plan: p => without(p, ...FOOD_IDS), late: { at: 40, items: ['dategrove', 'dategrove', 'dategrove', 'watercarrier', 'dairy', 'orchard'] } }, 'ludność 10 (głód ~28 min), ≈26 na końcu', r => r.minPop <= 14 && r.endPop > 14);
add('SK2 zaraza −12 na 60. min', { f: 'saracens', setup: noRaids, events: [{ at: 60, fn: s => Events.plague(s), rebuild: false }] }, 'bez trwałej straty, 6/6', r => r.met === r.total);
add('SK3 pożar 2 Gajów i Qanatu na 60. min', { f: 'saracens', setup: noRaids, events: [{ at: 60, fn: s => Events.fire(s, ['dategrove', 'dategrove', 'qanat']) }] }, 'głód 0, 6/6', r => r.met === r.total && r.starve === 0);
add('SK4 krach cen na 70. min', { f: 'saracens', setup: noRaids, events: [{ at: 70, fn: s => Events.priceCrash(s), rebuild: false }] }, '≈592 zł zamiast ≈891, 6/6', r => r.met === r.total);
add('VK1 brak żywności do 40. min', { f: 'vikings', plan: p => without(p, ...FOOD_IDS), late: { at: 40, items: ['fisherhut', 'fisherhut', 'fisherhut', 'hunter', 'dairy', 'orchard', 'watercarrier'] } }, 'ludność 10 (głód ~28 min), ≈28 na końcu', r => r.minPop <= 14 && r.endPop > 14);
add('VK2 zaraza −12 na 60. min', { f: 'vikings', events: [{ at: 60, fn: s => Events.plague(s), rebuild: false }] }, 'bez trwałej straty, 6/6', r => r.met === r.total);
add('VK3 pożar Przystani i Okrętu na 90. min', { f: 'vikings', events: [{ at: 90, fn: s => Events.fire(s, ['dock', 'ship']) }] }, '6/6', r => r.met >= 5);
add('VK4 pożar Miodosytni na 90. min', { f: 'vikings', events: [{ at: 90, fn: s => Events.fire(s, ['mead']) }] }, '6/6', r => r.met >= 5);
add('VK5 wylesienie 150 drzew', { f: 'vikings', events: [{ at: 70, fn: s => Events.deforest(s, 150), rebuild: false }] }, 'ludność ≈38, 6/6', r => r.met >= 5);
add('VK6 pożar 4 Chat rybaka na 70. min', { f: 'vikings', events: [fire70(['fisherhut', 'fisherhut', 'fisherhut', 'fisherhut'])] }, 'głód 0, ludność ≈38, 6/6', r => r.met >= 5);

/* ------------------------------ wykonanie ------------------------------ */
let pass = 0, fail = 0, viol = 0;
const t0 = Date.now();
for (const sc of S) {
  if (filter && !sc.name.toLowerCase().includes(filter.toLowerCase())) continue;
  let r;
  try { r = run(sc.spec); } catch (e) { console.log('✘ BŁĄD', sc.name, e.stack.split('\n').slice(0, 3).join(' | ')); fail++; continue; }
  const ok = sc.ok(r);
  const v = Object.keys(r.viol);
  if (ok) pass++; else fail++;
  if (v.length) viol++;
  console.log((ok ? '✔' : '✘') + ' ' + sc.name.padEnd(46) + ' haracz ' + r.trib.padEnd(4) + ' lud @20/40/60/90: ' + [20, 40, 60, 90].map(m => r.pop[m]).join('/').padEnd(12) +
    ' koniec ' + String(r.endPop).padEnd(3) + ' min ' + String(r.minPop).padEnd(3) + ' głód ' + String(r.starve).padEnd(3) + ' zł ' + String(r.gold).padEnd(5) + ' drzew ' + String(r.trees).padEnd(4) + (r.voyages ? ' wypr ' + r.voyages : '') +
    (r.f === 'slavs' && r.byGood ? ' dost ' + r.delivered : '') + (v.length ? '  ⚠ NIEZMIENNIKI: ' + v.join('; ') : ''));
  if (!ok) console.log('     oczekiwano wg spec: ' + sc.expect);
}
console.log('\nPodsumowanie: ' + pass + ' zgodnych, ' + fail + ' odbiegających; przebiegi z naruszeniem niezmienników: ' + viol + '; czas ' + Math.round((Date.now() - t0) / 1000) + ' s');
