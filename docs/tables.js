'use strict';
/* Generatory tabel, wykresów i wartości dokumentacji — wszystko liczone z kodu gry (tools/headless.js ładuje Nova_Roma.html),
   więc dane w PDF nie rozjeżdżają się z silnikiem. Dyrektywy w rozdziałach: {{tabela:nazwa}} (blok) i {{v:wyrażenie}} (śródwierszowo). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GAME_FILE = path.join(ROOT, 'Nova_Roma.html');
const diagrams = require('./diagrams');

let G = null;
const game = () => G || (G = require(path.join(ROOT, 'tools/headless.js')).load(GAME_FILE));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- formatowanie ---------- */
const nf = n => (typeof n !== 'number' ? String(n) : Number.isInteger(n) ? String(n) : String(+n.toFixed(3)).replace('.', ','));
const pct = n => nf(Math.round(n * 1000) / 10) + '%';
const FIDS = ['franks', 'saracens', 'vikings', 'slavs'];
const FNAME = { franks: 'Frankowie', saracens: 'Saraceni', vikings: 'Wikingowie', slavs: 'Słowianie' };
const DEP_PL = { stone: 'kamień', iron: 'żelazo', coal: 'węgiel', clay: 'glina', peat: 'ruda darniowa (torf)' };
const CLIMATE_PL = { temperate: 'umiarkowany', eastern: 'Europa Wschodnia', snow: 'śnieżny', desert: 'pustynny' };
const MAT = { d: 'd', k: 'k', gl: 'gl', zl: 'zł' };
const costStr = c => { const o = []; for (const k of ['d', 'k', 'gl', 'zl']) if (c && c[k]) o.push(c[k] + (k === 'zl' ? ' zł' : ' ' + MAT[k])); return o.join(' + ') || '—'; };
const goodsStr = (obj, sc, labels) => { const o = []; for (const [g, r] of Object.entries(obj || {})) o.push(((labels && labels[g]) || g) + ' ' + nf(+(r * (sc || 1)).toFixed(3))); return o.join(' + '); };

function evalV(expr) {
  const g = game();
  const names = Object.keys(g).filter(k => /^[A-Za-z_]\w*$/.test(k));
  const d = resultsData() || { normal: [], scenarios: [] };
  const N = (f, b, e, p) => d.normal.find(r => r.faction === f && r.bot === b && r.eps === e && r.preset === p) || (() => { throw new Error('brak wiersza normalnej gry ' + [f, b, e, p]); })();
  const S = code => d.scenarios.find(r => r.code === code) || (() => { throw new Error('brak scenariusza ' + code); })();
  const fn = new Function(...names, 'F', 'N', 'S', 'return (' + expr + ')');
  const val = fn(...names.map(k => g[k]), { nf, pct, FIDS, FNAME }, N, S);
  if (Array.isArray(val)) return val.map(x => (typeof x === 'number' ? nf(x) : x)).join(' / ');
  if (typeof val === 'number') return nf(val);
  if (val === undefined || val === null) throw new Error('puste wyrażenie: ' + expr);
  return typeof val === 'object' ? JSON.stringify(val) : String(val);
}

/* ---------- tabela HTML ---------- */
function table(state, cap, head, rows, o = {}) {
  const n = cap ? ++state.tables : 0;
  const al = o.align || [];
  const th = head.map((h, i) => '<th' + (al[i] ? ' style="text-align:' + al[i] + '"' : '') + '>' + h + '</th>').join('');
  const body = rows.map(r => '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + (r.cells || r).map((c, i) => '<td' + (al[i] ? ' style="text-align:' + al[i] + '"' : '') + (c && c.cls ? ' class="' + c.cls + '"' : '') + '>' + (c && c.html !== undefined ? c.html : c) + '</td>').join('') + '</tr>').join('');
  return '<div class="tw' + (o.cls ? ' ' + o.cls : '') + '">' + (cap ? '<div class="tcap"><b>Tabela ' + n + '.</b> ' + cap + '</div>' : '') + '<table><thead><tr>' + th + '</tr></thead><tbody>' + body + '</tbody></table></div>';
}

/* ---------- wykres liniowy / słupkowy (SVG) ---------- */
function lineChart(state, cap, o) {
  const W = 520, H = 230, L = 46, R = 14, T = 14, B = 38, n = ++state.figures;
  const xs = o.xs, ymax = o.ymax != null ? o.ymax : Math.max(...o.series.flatMap(s => s.ys)) * 1.08, ymin = o.ymin || 0;
  const px = x => L + (x - xs[0]) / (xs[xs.length - 1] - xs[0]) * (W - L - R), py = y => T + (1 - (y - ymin) / (ymax - ymin)) * (H - T - B);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img">';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) { const y = ymin + (ymax - ymin) * i / ticks; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + py(y) + '" y2="' + py(y) + '" class="grid"/><text x="' + (L - 6) + '" y="' + (py(y) + 3) + '" class="ax" text-anchor="end">' + nf(+y.toFixed(2)) + '</text>'; }
  for (const x of o.xticks || xs) s += '<text x="' + px(x) + '" y="' + (H - B + 14) + '" class="ax" text-anchor="middle">' + nf(x) + '</text>';
  s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" class="axl" text-anchor="middle">' + esc(o.xlabel || '') + '</text>';
  s += '<text transform="translate(11 ' + ((T + H - B) / 2) + ') rotate(-90)" class="axl" text-anchor="middle">' + esc(o.ylabel || '') + '</text>';
  const COL = ['#2f6f9f', '#b5532e', '#3f8a4f', '#8a5aa8', '#a58a1f'];
  o.series.forEach((se, k) => {
    s += '<polyline fill="none" stroke="' + COL[k % COL.length] + '" stroke-width="2" points="' + xs.map((x, i) => px(x).toFixed(1) + ',' + py(se.ys[i]).toFixed(1)).join(' ') + '"/>';
    const lx = L + 10 + k * 120; s += '<line x1="' + lx + '" x2="' + (lx + 16) + '" y1="' + (T + 6) + '" y2="' + (T + 6) + '" stroke="' + COL[k % COL.length] + '" stroke-width="2"/><text x="' + (lx + 20) + '" y="' + (T + 9) + '" class="ax">' + esc(se.name) + '</text>';
  });
  return '<figure class="chartfig">' + s + '</svg><figcaption><b>Rysunek ' + n + '.</b> ' + cap + '</figcaption></figure>';
}

/* ---------- dane z plików ---------- */
function resultsData() {
  const p = path.join(__dirname, 'data', 'wyniki_testow.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

/* ---------- opisy ---------- */
const REQ_TXT = fid => def => {
  if (!def.req) return '';
  if (def.req === 'forest') return 'las: ≥ 4 drzew w obrysie i pierścieniu';
  if (def.req === 'shore') return 'brzeg morza, jeziora lub lodu';
  if (def.req === 'waterEdge') return 'brzeg morza';
  if (def.req.startsWith('deposit:')) return 'złoże: ' + DEP_PL[def.req.slice(8)];
  return def.req;
};
const EXTRA_IO = {
  hut: { out: 'mieszkania +6 (Wikingowie +8)' }, store: { out: 'pojemność +80 szt. każdego towaru' }, barracks: { out: 'warunek dostaw żołnierzy' },
  market: { out: 'zakup narzędzi (20 zł); Saraceni: sprzedaż towarów' }, dock: { out: 'warunek dla Okrętu' }, ship: { inp: 'miód pitny + broń + załoga', out: 'wyprawa (6/6/6 albo 12/12/12)' },
  temple: { dobro: true, out: 'Dobrobyt +10 (1 budynek na 50 os.)' }, bathhouse: { out: 'Dobrobyt +6 (1 budynek na 50 os.)' }, sauna: { out: 'Dobrobyt +6 (1 budynek na 50 os.)' },
  guardpost: { inp: 'złoto 0,6 (utrzymanie)', out: 'ryzyko napadu −40%, łup −25% (max 2)' }, caravanserai: { out: 'ceny +20%, liczy się jak 2 Targi (max 2)' },
  forester: { out: 'sadzi drzewa 1,0' }
};

const MODULE_DOC = {
  RNG: 'Globalny generator mulberry32 (seed, next, range, int, pick) — jedyne źródło losowości logiki gry',
  SPRITE_META: 'Katalog budynków z prototypu: obrys w×h, wejście, kotwice dymu, rozmiar sprite\'a (blok generowany)',
  Sprites: 'Silnik grafiki proceduralnej: wypiek sprite\'ów budynków, przyrody, ludzi i zwierząt, chunki podłoża (blok generowany z prototyp/src)',
  Data: 'Dane: nacje, budynki (koszty, wejścia i wyjścia), klimaty, typy map, zasady zabudowy, fauna, danina',
  Camera: 'Rzut dimetryczny 2:1, przesuwanie i zoom, przeliczanie świat ↔ ekran',
  Terrain: 'Generator terenu v2 (woda, wysokości, klify, cechy klimatu, łączność, walidacja), predykaty przechodności i koszt pola',
  MapGen: 'Mapa 48×48: stary generator (morze, skały, drzewa, złoża) + nakładka Terrain.apply, meta mapy',
  Gfx: 'Grafika klasyczna (zapas, ?classic=1) i miniatury kart nacji',
  Path: 'A* po polach (8 kierunków, bez ścinania rogów), pola odległości, najbliższe osiągalne pole; bez RNG',
  World: 'Stan gry, init, canPlace i build, drzewa jako zasób, kolejność ticku, obywatele i nosiciele (cień symulacji)',
  Economy: 'Ekonomia przepływowa: obsada, produkcja, jedzenie, ludność, popularność, narzędzia, magazyny',
  Build: 'Place budowy, budowniczowie, etapy 0–2, anulowanie',
  Tribute: 'Haracz seniora: poziomy, terminy, żołnierze / złoto / wyprawy / danina, rynek Targu',
  Events: 'Napady na karawanę, kryzysy (zaraza, pożar, krach cen, wylesienie) wg harmonogramu',
  TestBots: 'Boty testowe R/D/N, przepisy nacji, snapshot i restore, runSync, panel testowy',
  Advisor: 'Doradca: statusy budynków, ostrzeżenia, plan haraczu (tylko czyta stan)',
  Roads: 'Drogi: wytyczanie, koszt, rozbiórka',
  Logistics: 'Sprawność logistyczna producentów (odległość do Składu / Dworu)',
  BuildMode: 'Tryb budowy: duch budynku, strefy zakazu i kary, narzędzia dróg, klik = plac budowy',
  UI: 'HUD, pasek budowy, karty i podpowiedzi, Doradca, ekran wyboru nacji, UI.startGame',
  Fauna: 'Zwierzęta i polowanie: populacja, ruch, legowiska, wyprawy myśliwego, plon zależny od zwierzyny',
  Walkers: 'Widoczni piesi: ścieżki obywateli, nosicieli i budowniczych (cień symulacji)',
  Game: 'Pętla gry, render (teren, obiekty, zwierzęta, strzały, efekty), wejście: mysz, klawiatura, dotyk'
};
const MODULE_ORDER = ['RNG', 'SPRITE_META', 'Sprites', 'Data', 'Camera', 'Terrain', 'MapGen', 'Gfx', 'Path', 'World', 'Economy', 'Build', 'Tribute', 'Events', 'TestBots', 'Advisor', 'Roads', 'Logistics', 'BuildMode', 'UI', 'Fauna', 'Walkers', 'Game'];
const MARKER_TO_ID = { RNG: 'RNG', DATA: 'Data', CAMERA: 'Camera', TERRAIN: 'Terrain', MAPGEN: 'MapGen', GFX: 'Gfx', PATH: 'Path', WORLD: 'World', ECONOMY: 'Economy', BUILD: 'Build', TRIBUTE: 'Tribute', EVENTS: 'Events', TESTBOTS: 'TestBots', ADVISOR: 'Advisor', ROADS: 'Roads', LOGISTICS: 'Logistics', BUILDMODE: 'BuildMode', UI: 'UI', FAUNA: 'Fauna', WALKERS: 'Walkers', GAME: 'Game' };

/* podział pliku gry na moduły: { id → { from, to, text } } (numery linii od 1) */
function splitModules() {
  const src = fs.readFileSync(GAME_FILE, 'utf8'), lines = src.split('\n'), marks = [];
  lines.forEach((l, i) => { const m = /^\/\* =+ ?MODUL: ([A-Z_]+)/.exec(l); if (m && MARKER_TO_ID[m[1]]) marks.push([MARKER_TO_ID[m[1]], i]); });
  const scriptEnd = lines.findIndex(l => l.startsWith('</script>'));
  const out = {};
  marks.forEach(([id, i], k) => { const end = k + 1 < marks.length ? marks[k + 1][1] : scriptEnd; out[id] = { from: i + 1, to: end, text: lines.slice(i, end).join('\n') }; });
  const find = re => lines.findIndex(l => re.test(l));
  const a = find(/SPRITES:BEGIN/), b = find(/SPRITES:END/), c = find(/SPRITE_META:BEGIN/), d = find(/SPRITE_META:END/);
  out.Sprites = { from: a + 1, to: b + 1, text: lines.slice(a, b + 1).join('\n') };
  out.SPRITE_META = { from: c + 1, to: d + 1, text: lines.slice(c, d + 1).join('\n') };
  return out;
}
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[\s;{}()])\/\/[^\n]*/g, '$1');
function dependencyMatrix() {
  const mods = splitModules(), ids = MODULE_ORDER.filter(i => mods[i]), dep = {};
  for (const a of ids) {
    const t = stripComments(mods[a].text); dep[a] = {};
    for (const b of ids) { if (a === b) continue; const re = b === 'SPRITE_META' ? /\bSPRITE_META\b/g : new RegExp('\\b' + b + '\\.', 'g'); const n = (t.match(re) || []).length; if (n) dep[a][b] = n; }
  }
  return { mods, ids, dep };
}

const STATE_DOC = {
  factionId: 'id nacji: franks, saracens, vikings, slavs', map: 'mapa: size 48, tiles[2304], meta {climate, type, seed, valid, why, stats}, dirty (pola do odświeżenia chunków), roadRev',
  buildings: 'gotowe budynki {id, x, y, w, h, uid}; pola robocze: st (status), eff, logi, huntAcc, awayUntil, carrierT', citizens: 'obywatele „cienia symulacji” (losowania RNG logiki); widoczne postacie rysuje Walkers',
  time: 'czas gry w minutach', speed: 'mnożnik prędkości 0 / 1 / 2 / 3 / 6 (0 = pauza; przyciski ×1 → ×2 → ×3 → ×6)', res: 'magazyn: towary (Economy.LIMIT), złoto, narzędzia, popularity', nextId: 'licznik uid budynków i placów',
  pop: 'ludność (liczba rzeczywista; w obliczeniach Math.floor)', controls: '{ rations: 0,5 / 1 / 1,5 / 2, tax: 0–3 }', starveTimer: 'minuty ciągłego braku jedzenia (≥ 5 → ginie 1 osoba na minutę)',
  immigrantTimer: 'akumulator czasu do kolejnego imigranta', tooled: 'uid → true: budynek już dostał narzędzie', staffed: 'uid → true: budynek obsadzony w bieżącym ticku',
  saplings: 'sadzonki { t: czas dojrzenia; przy settings.physical także b: uid Leśniczówki, k: numer kolejny }', plantSeq: 'licznik sadzonek (przy settings.physical wybiera pole drzewa w pobliżu Leśniczówki)', caravans: 'karawany Saracenów w drodze (settings.physical): { id, m: uid Targu, goods, t0, tSale, tBack, cost, tx, ty, dx, dy, sold, rev }', caravanWait: 'minuty oczekiwania towaru handlowego na komplet do wysyłki karawany', caravanPile: 'towar handlowy sprzedany przy Targu (złoto już wpłynęło), czekający na komplet do karawany: { towar: szt. } (settings.physical; tylko ilustracja)',treeFrac: 'ułamek ściętych drzew do rozliczenia (Chata drwala)', plantFrac: 'ułamek posadzonych drzew do rozliczenia (Leśniczówka)',
  welfare: 'Dobrobyt z poprzedniego ticku: liczba zasilonych budynków temple / bathhouse / sauna', foodRep: 'ostatni bilans jedzenia: potential, people, builders, buildings, consumption, pmax',
  workersStaffed: 'liczba obsadzonych budynków', workersNeeded: 'liczba budynków potrzebujących pracownika', waitingForTool: 'czy jakiś budynek czeka na narzędzie',
  stats: 'liczniki raportowe: toolsBought, toolsForged, planksSpent, starveMin', settings: 'przełączniki scenariusza: raids, voyageGuard, shoreSpots, logistics, fauna',
  animals: 'zwierzęta (lista JSON-owa, Faza 8)', fauna: 'stan modułu Fauna: rs (PRNG), nid, bt, dens, hunts, kills (null przy wyłączonej faunie)', depositLeft: 'opcjonalne skończone złoża, np. { clay: 60 }',
  sites: 'place budowy {id, x, y, w, h, uid, need, got, work, workNeed, levelLeft, crowd, assigned}', builders: 'ustawienie liczby budowniczych (2–5)', buildersActive: 'budowniczowie faktycznie rekrutowani w ticku',
  buildersWorking: 'budowniczowie przydzieleni do placów (jedzą 1,5 racji)', carriers: 'nosiciele „cienia symulacji” (wizualni; ekonomia jest nominalna)', tribute: 'bieżący haracz: preset, level, firstTerm, terms, met, missed, delivered, byGood, log…',
  marketPrices: 'ceny Targu (kadzidło, tkanina, ceramika)', voyageMode: 'tryb wypraw Wikingów: normal | mixed', crewAway: 'załoga na wyprawach (osoby poza pracą)', voyages: 'trwające wyprawy {until, crew, great, ships}',
  voyageStats: 'wykonane wyprawy: done (jednostki haraczu), trips', raids: 'napady na karawanę: count, lost, next (czas kolejnego sprawdzenia)', crisis: 'harmonogram kryzysów (null = wyłączony) lub { idx }',
  eventMsgs: 'komunikaty zdarzeń { text, time }', keep: 'wskaźnik na budynek Dworu (po restore odtwarzany z listy budynków)'
};

/* ---------- generatory ---------- */
const GEN = {};

GEN.limity = (arg, state) => {
  const { Economy } = game(), e = Object.entries(Economy.LIMIT), cols = 3, per = Math.ceil(e.length / cols), head = [], rows = [];
  for (let c = 0; c < cols; c++) head.push('Towar', 'Limit');
  for (let r = 0; r < per; r++) { const row = []; for (let c = 0; c < cols; c++) { const x = e[c * per + r]; row.push(x ? x[0] : '', x ? String(x[1]) : ''); } rows.push(row); }
  return table(state, 'Limity magazynowe towarów w całej osadzie (Economy.LIMIT)', head, rows, { align: ['', 'right', '', 'right', '', 'right'] });
};

GEN.start = (arg, state) => {
  const { Data } = game();
  const row = (label, f) => [label, ...FIDS.map(f)];
  const F = id => Data.FACTIONS[id];
  return table(state, 'Zasoby startowe i parametry mapy nacji (Data.FACTIONS)', ['Parametr', ...FIDS.map(f => FNAME[f])], [
    row('Ludność', f => F(f).start.pop), row('Deski', f => F(f).start.wood), row('Kamień', f => F(f).start.stone || '—'), row('Glina', f => F(f).start.clay || '—'),
    row('Jedzenie startowe', f => F(f).start.food + ' (' + F(f).start.foodKind.toLowerCase() + ')'), row('Narzędzia', f => F(f).start.tools), row('Złoto', f => F(f).start.gold),
    row('Drzewa na mapie', f => F(f).treesTarget), row('Dojrzewanie drzewa [min]', f => F(f).treeGrowthMin),
    row('Złoża (liczba miejsc)', f => Object.entries(F(f).deposits).map(([k, v]) => DEP_PL[k] + ' ' + v).join(', ') || '—'),
    row('Próg gęstości lasu (Puszcza)', f => Object.values(Data.BUILDINGS).some(d => d.forest && (!d.factions || d.factions.includes(f))) ? Data.FOREST_REF[f] + ' drzew' : '— (brak budynków leśnych)'), row('Klimat domyślny', f => CLIMATE_PL[F(f).climate]),
    row('Etap kampanii / trudność', f => F(f).campaign.order + '/4 · ' + '★'.repeat(F(f).campaign.stars) + '☆'.repeat(4 - F(f).campaign.stars))
  ], { align: ['', 'center', 'center', 'center', 'center'] });
};

function buildingRow(id, fid) {
  const { Data, Economy } = game(), def = Data.BUILDINGS[id], sc = fid === 'vikings' ? (Economy.VIK_RATE[id] || 1) : 1, ex = EXTRA_IO[id] || {}, notes = [];
  let inp = goodsStr(def.inp, sc, def.outLabel), out = goodsStr(def.out, sc, def.outLabel);
  if (ex.dobro) inp = Economy.DOBRO[fid] + ' 0,3';
  if (ex.inp) inp = inp ? inp + ' + ' + ex.inp : ex.inp;
  if (ex.out) out = out ? out + '; ' + ex.out : ex.out;
  if (Economy.MINE_EATERS[id]) notes.push('zjada ' + nf(Economy.MINE_EATERS[id]) + ' porcji/min tylko z nadwyżki');
  if (def.forest) notes.push('plon × min(1, drzewa / ' + Data.FOREST_REF[fid] + ')');
  if (def.game) notes.push('nie wymaga lasu; plon × min(1, zwierzyna w łowisku / ' + Data.FAUNA_RULES.ref + ' pkt)');
  if (id === 'woodcutter') notes.push('pierwsza Chata drwala jest darmowa');
  if (def.note && !['hut', 'store', 'barracks', 'market', 'dock', 'temple', 'bathhouse', 'sauna', 'guardpost', 'caravanserai'].includes(id) && !notes.length) notes.push(def.note.replace(/^Pierwsza darmowa$/, ''));
  const [w, h] = Data.footprint(id, fid);
  return [Data.nameOf(id, fid), w + '×' + h, costStr(def.costs[fid]), def.tool ? 'T' : '', def.worker ? '1' : '0', inp, out, REQ_TXT(fid)(def), notes.filter(Boolean).join('; ')];
}
GEN.budynki = (fid, state) => {
  const { Data } = game(), rows = [];
  for (const cat of Data.CATS) for (const [id, def] of Object.entries(Data.BUILDINGS)) {
    if (id === 'keep' || def.cat !== cat || (def.factions && !def.factions.includes(fid))) continue;
    rows.push({ cells: buildingRow(id, fid) });
  }
  const keep = Data.footprint('keep', fid);
  return table(state, 'Budynki nacji: ' + FNAME[fid] + ' — ' + rows.length + ' budynków poza Dworem (' + keep[0] + '×' + keep[1] + '). T = wymaga narzędzia przy obsadzeniu; tempo na minutę gry przy obsadzie 1 pracownika', ['Budynek', 'Obrys', 'Koszt', 'T', 'Prac.', 'Wejścia /min', 'Wyjścia /min', 'Wymagania terenu', 'Uwagi'], rows, { cls: 'bld', align: ['', 'center', '', 'center', 'center'] });
};

GEN.koszty_wspolne = (arg, state) => {
  const { Data } = game(), rows = [];
  for (const [id, def] of Object.entries(Data.BUILDINGS)) {
    if (id === 'keep' || def.factions) continue;
    rows.push([Data.BUILDINGS[id].names ? Data.BUILDINGS[id].name : def.name, ...FIDS.map(f => costStr(def.costs[f])), def.tool ? 'T' : '']);
  }
  return table(state, 'Budynki wspólne i ich koszty w poszczególnych nacjach (d = deski, k = kamień, gl = glina)', ['Budynek', ...FIDS.map(f => FNAME[f]), 'T'], rows, { align: ['', 'left', 'left', 'left', 'left', 'center'] });
};

GEN.narzedzia_T = (arg, state) => {
  const { Data } = game(), rows = FIDS.map(f => [FNAME[f], Object.entries(Data.BUILDINGS).filter(([id, d]) => id !== 'keep' && d.tool && (!d.factions || d.factions.includes(f))).map(([id]) => Data.nameOf(id, f)).join(', ')]);
  return table(state, 'Budynki wymagające narzędzia przy obsadzeniu (flaga tool w Data.BUILDINGS)', ['Nacja', 'Budynki T'], rows);
};

GEN.liczba_budynkow = (arg, state) => {
  const { Data } = game(); const rows = FIDS.map(f => [FNAME[f], Object.entries(Data.BUILDINGS).filter(([id, d]) => id !== 'keep' && (!d.factions || d.factions.includes(f))).length, Object.entries(Data.BUILDINGS).filter(([id, d]) => id !== 'keep' && d.factions && d.factions.includes(f)).length]);
  return table(state, 'Liczba budynków budowanych przez nację (bez Dworu)', ['Nacja', 'Razem', 'W tym własne'], rows, { align: ['', 'center', 'center'] });
};

GEN.popularnosc = (arg, state) => {
  const { Economy } = game(), rows = [];
  rows.push(['Wartość bazowa', '50']);
  rows.push(['Racje ×0,5 / ×1 / ×1,5 / ×2', Object.keys(Economy.RATIONS_POP).map(k => (Economy.RATIONS_POP[k] > 0 ? '+' : '') + Economy.RATIONS_POP[k]).join(' / ')]);
  rows.push(['Podatek 0 / 1 / 2 / 3', Object.keys(Economy.TAX_POP).map(k => (Economy.TAX_POP[k] > 0 ? '+' : '') + Economy.TAX_POP[k]).join(' / ')]);
  rows.push(['Różnorodność jedzenia', '+4 za każdy rodzaj poza pierwszym, którego zapas przekracza 5 szt.']);
  rows.push(['Dobrobyt: Kościół / Meczet / Kapliczka', '+10, gdy zasilonych budynków × 50 ≥ ludność']);
  rows.push(['Dobrobyt: Łaźnia (Saraceni) / Bania (Słowianie)', '+6, gdy zasilonych budynków × 50 ≥ ludność']);
  rows.push(['Zakres końcowy', '0–100']);
  rows.push(['Mnożnik wydajności', 'clamp(1 + 0,004 × (popularność − 50), 0,8; 1,2)']);
  rows.push(['Imigracja', 'tylko przy popularności ≥ 45; interwał 0,5 × 50 / max(10, popularność) min']);
  return table(state, 'Składniki popularności (Economy.popularity)', ['Składnik', 'Wartość'], rows);
};

GEN.podatki = (arg, state) => {
  const { Economy } = game();
  return table(state, 'Podatki i racje', ['Poziom podatku', 'Dochód [zł / os. / min]', 'Popularność'], Economy.TAX_INCOME.map((v, i) => [String(i), nf(v), (Economy.TAX_POP[i] > 0 ? '+' : '') + Economy.TAX_POP[i]]), { align: ['center', 'right', 'right'] });
};

GEN.kolejnosc_produkcji = (arg, state) => {
  const { Economy, Data } = game(), rows = Economy.PROD_ORDER.map((id, i) => [i + 1, Data.BUILDINGS[id] ? (Data.BUILDINGS[id].names ? Data.BUILDINGS[id].names.franks + ' / ' + Data.BUILDINGS[id].names.saracens + ' / ' + Data.BUILDINGS[id].names.slavs : Data.BUILDINGS[id].name) : id, id]);
  const half = Math.ceil(rows.length / 2), r2 = [];
  for (let i = 0; i < half; i++) r2.push([...rows[i], ...(rows[i + half] || ['', '', ''])]);
  return table(state, 'Kolejność przetwarzania producentów w ticku (Economy.PROD_ORDER; budynki spoza listy idą na końcu)', ['#', 'Budynek', 'id', '#', 'Budynek', 'id'], r2, { align: ['center', '', '', 'center', '', ''] });
};

GEN.priorytet_obsady = (arg, state) => {
  const { Economy, Data } = game();
  return table(state, 'Priorytet obsady, gdy brakuje ludzi (Economy.FOOD_PRIORITY): budynki żywności pierwsze, reszta w kolejności budowy', ['Kolejność', 'Budynek'], Economy.FOOD_PRIORITY.map((id, i) => [i + 1, Data.BUILDINGS[id].name]), { align: ['center', ''] });
};

GEN.haracz_skala = (arg, state) => {
  const { Tribute } = game(), rows = [];
  for (let l = 1; l <= 11; l++) rows.push([l, ...FIDS.map(f => nf(Tribute.RATE[f][l])), 30 * l]);
  return table(state, 'Skala poziomów haraczu: wartość żądana co 15 min (jednostki: żołnierze / zł / wyprawy / osobominuty daniny)', ['Poziom', ...FIDS.map(f => FNAME[f] + ' [' + Tribute.UNIT[f] + ']'), 'Osobominuty'], rows, { align: ['center', 'right', 'right', 'right', 'right', 'right'] });
};

GEN.presety = (arg, state) => {
  const { Tribute } = game(), rows = Object.keys(Tribute.PRESET_LEVEL).map(p => [Tribute.PRESET_LABEL[p], ...FIDS.map(f => Tribute.PRESET_LEVEL[p][f])]);
  rows.push(['Własny', '1–11', '1–11', '1–11', '1–11']);
  return table(state, 'Presety trudności haraczu: poziom stały od pierwszego terminu', ['Preset', ...FIDS.map(f => FNAME[f])], rows, { align: ['', 'center', 'center', 'center', 'center'] });
};

GEN.terminy = (arg, state) => {
  const { Tribute } = game();
  return table(state, 'Terminy haraczu', ['Parametr', ...FIDS.map(f => FNAME[f])], [
    ['Pierwszy termin [min]', ...FIDS.map(f => Tribute.FIRST_TERM[f])], ['Kolejne terminy', ...FIDS.map(() => 'co ' + Tribute.TERM_EVERY + ' min')],
    ['Ogłoszenie', ...FIDS.map(() => '30 min przed pierwszym terminem')], ['Jednostka żądania', ...FIDS.map(f => Tribute.UNIT[f])],
    ['Lista budynków łańcucha w ogłoszeniu', ...FIDS.map(f => Tribute.NEED_LIST[f].map(id => game().Data.nameOf(id, f)).join(', '))]
  ], { align: ['', 'center', 'center', 'center', 'center'] });
};

GEN.rynek = (arg, state) => {
  const { Tribute } = game(), rows = Object.entries(Tribute.TRADE).map(([g, t]) => [g, nf(t.base) + ' zł', nf(t.floor) + ' zł', nf(+(t.base * 1.2).toFixed(2)) + ' zł', nf(+(t.floor * 1.2).toFixed(2)) + ' zł']);
  return table(state, 'Ceny towarów handlowych Saracenów (Tribute.TRADE); spadek 0,05 zł za sztukę ÷ liczba Targów, odnowa 1,43% luki na minutę', ['Towar', 'Cena bazowa', 'Podłoga', 'Baza z Karawanserajem (+20%)', 'Podłoga z Karawanserajem'], rows, { align: ['', 'right', 'right', 'right', 'right'] });
};

GEN.kryzysy = (arg, state) => table(state, 'Harmonogram kryzysów (Events.SCHEDULE; włączany przyciskiem 🔥 Kryzysy)', ['Nacja', 'Minuta', 'Zdarzenie'], [
  ['Frankowie', '60', 'pożar: Piekarnia, Młyn, Farma, Sad (po jednym) + zaraza (−12 osób)'],
  ['Saraceni', '60', 'pożar: 2 Gaje daktylowe i Qanat'], ['Saraceni', '70', 'krach cen: kadzidło i tkanina 0,9 zł, ceramika 0,6 zł'],
  ['Wikingowie', '90', 'pożar: Przystań i Okręt'],
  ['Słowianie', '60', 'zaraza (−12 osób)'], ['Słowianie', '70', 'pożar lasu (−60% drzew) + pożar 3 Barci i 3 Woskarni']
]);

GEN.klimaty = (arg, state) => {
  const { Data } = game(), rows = Object.values(Data.CLIMATES).map(c => [c.name, c.region, FNAME[c.native], c.classic, nf(c.amp), nf(c.bog), nf(c.drift), nf(c.dune), nf(c.quick), c.oasis || '—', c.ice ? 'tak' : 'nie', c.desc]);
  return table(state, 'Klimaty (Data.CLIMATES): zmieniają teren, wygląd i faunę — nie ekonomię', ['Klimat', 'Region', 'Nacja natywna', 'Grunt', 'amp', 'bagna', 'zaspy', 'wydmy', 'plaży ruchome', 'oazy', 'lód', 'Opis'], rows, { cls: 'small' });
};
GEN.typy_map = (arg, state) => {
  const { Data } = game(), rows = Object.values(Data.MAPTYPES).map(t => [t.name, t.sea ? 'tak' : 'nie', t.shares.map(x => Math.round(x * 100) + '%').join(' / '), nf(t.cliff), nf(t.amp), nf(t.ridge), t.rivers ? 'tak' : '—', t.lakes.join('–'), t.ponds.join('–'), nf(t.bog), t.desc]);
  return table(state, 'Typy map (Data.MAPTYPES). shares = udział poziomów wysokości; cliff = udział stromych stoków zamienianych w klify', ['Typ', 'Morze', 'Poziomy (udział)', 'cliff', 'amp', 'grzbiety', 'rzeka', 'jeziora', 'stawy', 'bagna ×', 'Opis'], rows, { cls: 'small' });
};

GEN.cechy_terenu = (arg, state) => {
  const { Terrain } = game(), c = t => { const v = Terrain.cost(t); return Number.isFinite(v) ? nf(v) : '∞ (nieprzechodnie)'; };
  const rows = [
    ['Ląd (h = 1)', 'trawa, piasek, tundra', c({ h: 1 }), 'tak', 'tak'], ['Skała (h = 2)', 'z generatora; nie na starcie', c({ h: 2 }), '—', 'nie'],
    ['Woda: morze, jezioro, rzeka', 'wk = sea / lake / river', c({ h: 0, wk: 'sea' }), '—', 'nie'], ['Bród (wk = ford)', 'płycizna na rzece', c({ h: 0, wk: 'ford' }), '—', 'nie'], ['Lód (wk = ice)', 'zamarznięte jeziora (klimat śnieżny)', c({ h: 0, wk: 'ice' }), '—', 'nie'],
    ['Bagno (k = bog)', 'rozlewiska, torfowiska', c({ h: 1, k: 'bog' }), 'tak', 'nie'], ['Wydma (k = dune)', 'pustynia', c({ h: 1, k: 'dune' }), 'tak', 'nie'], ['Zaspa (k = drift)', 'klimat śnieżny', c({ h: 1, k: 'drift' }), 'tak', 'nie'],
    ['Ruchome piaski (k = quick)', 'pustynia', c({ h: 1, k: 'quick' }), 'nie', 'nie'], ['Klif (k = cliff)', 'strome stoki, skarpy nad morzem', c({ h: 1, k: 'cliff' }), 'nie', 'nie'], ['Oaza (k = oasis)', 'pustynia; zielony pierścień wokół wody', c({ h: 1, k: 'oasis' }), 'tak', 'tak (rosną drzewa)']
  ];
  return table(state, 'Rodzaje pól: koszt przejścia (Terrain.cost), przechodniość i możliwość zabudowy (Terrain.passable / buildable)', ['Pole', 'Występowanie', 'Koszt', 'Przechodnie', 'Budowlane'], rows, { align: ['', '', 'center', 'center', 'center'] });
};

GEN.zasady_zabudowy = (arg, state) => {
  const { Data, Roads, Terrain } = game(), R = Data.RULES;
  return table(state, 'Zasady zabudowy, dróg i logistyki (Data.RULES, Roads, Terrain)', ['Parametr', 'Wartość', 'Znaczenie'], [
    ['gap', R.gap + ' pole', 'twarda przerwa między obrysami (ulica na drogę i przejścia): budowa zabroniona w pierścieniu'],
    ['crowd.ring', R.crowd.ring + ' pola', 'szerokość pasa kary tuż za przerwą (pola 2–3 od budynku)'], ['crowd.per', '+' + pct(R.crowd.per), 'dodatek do czasu budowy za każdy sąsiedni budynek lub plac w pasie'],
    ['crowd.max', '+' + pct(R.crowd.max), 'górna granica kary'], ['level.per', nf(R.level.per) + ' min', 'czas pracy budowniczych na każde pole × poziom wysokości do wyrównania'],
    ['logistics.free', R.logistics.free + ' pól', 'odległość drogi do Składu / Dworu bez kary'], ['logistics.span', R.logistics.span + ' pól', 'zakres, na którym sprawność spada liniowo do minimum'], ['logistics.min', pct(R.logistics.min), 'najniższa sprawność logistyczna'],
    ['Roads.COST', Roads.COST + ' deska / pole', 'koszt nowego pola drogi'], ['Terrain.ROAD_COST', nf(Terrain.ROAD_COST), 'koszt pola drogi dla A*'], ['Terrain.ROAD_SPEED', '×' + nf(Terrain.ROAD_SPEED), 'prędkość pieszych po drodze'],
    ['Terrain.PLAZA_R', nf(Terrain.PLAZA_R) + ' pola', 'płaski plac wokół Dworu (generator terenu)'], ['Terrain.EARLY_R', nf(Terrain.EARLY_R) + ' pola', 'obszar początkowej zabudowy bez stoków; dalej wzgórza rosną stopniowo']
  ]);
};

GEN.fauna_gatunki = (arg, state) => {
  const { Data } = game(), ROLE = { prey: 'zwierzyna łowna', roamer: 'wałęsający się', bird: 'ptak' }, HAB = { forest: 'skraje lasów', open: 'otwarty ląd', shore: 'brzeg morza i lodu', water: 'okolice wody', sand: 'piasek i wydmy', any: 'dowolne' };
  const rows = Object.entries(Data.FAUNA).map(([id, k]) => [k.pl, ROLE[k.role], k.climates.map(c => CLIMATE_PL[c]).join(', '), HAB[k.hab], k.n, k.den || '—', k.herd ? k.herd.join('–') : '—', k.br != null ? nf(k.br) : '—', k.w != null ? nf(k.w) : '—', nf(k.sp) + (k.flee ? ' / ' + nf(k.flee) : k.fly ? ' / lot ' + nf(k.fly) : '')]);
  return table(state, 'Gatunki fauny (Data.FAUNA): n = osobniki na mapę 48×48, den = legowiska, herd = stado przy legowisku, br = odradzanie [os./min przy pustym legowisku], w = waga w puli zwierzyny, prędkości w polach na minutę', ['Gatunek', 'Rola', 'Klimaty', 'Siedlisko', 'n', 'den', 'herd', 'br', 'w', 'chód / ucieczka'], rows, { cls: 'small', align: ['', '', '', '', 'center', 'center', 'center', 'center', 'center', 'center'] });
};
GEN.fauna_zasady = (arg, state) => {
  const { Data } = game(), R = Data.FAUNA_RULES;
  return table(state, 'Zasady polowania (Data.FAUNA_RULES)', ['Stała', 'Wartość', 'Znaczenie'], [
    ['radius', R.radius + ' pól', 'promień łowiska Chaty myśliwego'], ['ref', R.ref + ' pkt', 'punkty zwierzyny w łowisku dające pełny plon (gameMult = min(1, Σw / ref))'], ['meat', R.meat, 'mięsa z osobnika o wadze 1'],
    ['hunterSpeed', R.hunterSpeed + ' pola/min', 'prędkość marszu myśliwego (powrót z łupem × 0,9)'], ['bow', R.bow + ' pola', 'zasięg łuku — myśliwy staje i celuje z tej odległości'], ['aim', R.aim + ' min', 'czas celowania'],
    ['arrow', R.arrow + ' min', 'czas lotu strzały'], ['pick', R.pick + ' min', 'czas podniesienia zwierzyny'], ['minMeat', R.minMeat, 'ile mięsa trzeba zebrać, by myśliwy wyruszył'], ['owed', R.owed, 'nadwyżka mięsa, powyżej której kolejne upolowania są rozstrzygane bez wyprawy'], ['carcass', R.carcass + ' min', 'jak długo leży padlina']
  ]);
};

GEN.role_robotnikow = (arg, state) => {
  const { Data } = game(), ACT = { chop: 'ścina drzewo', plant: 'sadzi sadzonkę', saw: 'piłuje', milk: 'doi', pick: 'zbiera owoce', draw: 'czerpie wodę', stall: 'obsługuje stoisko', pray: 'modli się', drill: 'ćwiczy', dig: 'kopie', hoe: 'okopuje', grind: 'miele', bake: 'piecze', stir: 'miesza', forge: 'kuje', press: 'tłoczy', tap: 'nacina żywicę', weave: 'tka', pot: 'lepi', sweep: 'zamiata', guard: 'stoi na straży', fish: 'łowi', stack: 'układa stos', brew: 'warzy', smoke: 'okadza ule', wax: 'obrabia wosk', trap: 'zastawia sidła', tan: 'garbuje' };
  const TOOL = { axe: 'siekiera', sapling: 'sadzonka', saw: 'piła', bucket: 'wiadro', basket: 'kosz', spear: 'włócznia', pick: 'kilof', hoe: 'motyka', sack: 'worek', spoon: 'warząchew', hammer: 'młot', knife: 'nóż', net: 'sieć', broom: 'miotła' };
  const SPOT = { door: 'przy drzwiach', field: 'pola wokół budynku', tree: 'najbliższe drzewo', shore: 'brzeg wody', service: 'obsługa przy drzwiach' };
  const SH = { log: 'kłoda', plank: 'deski', rock: 'kamień', sack: 'worek', basket: 'kosz', bucket: 'wiadro', jar: 'dzban', bar: 'sztabki', fish: 'ryby', bundle: 'zwój', crate: 'skrzynka' };
  const rows = [];
  for (const [id, r] of Object.entries(Data.ROLES)) {
    const d = Data.BUILDINGS[id], names = d.names ? [...new Set(Object.values(d.names))].join(' / ') : d.name, ld = g => SH[(Data.LOADS[g] || [])[0]] || '?';
    const inn = Object.keys(d.inp || {}).filter(g => g in game().Economy.LIMIT).map(g => g + ' (' + ld(g) + ')').join(', ') || '—', out = Object.keys(d.out || {}).filter(g => g in game().Economy.LIMIT).map(g => g + ' (' + ld(g) + ')').join(', ') || '—';
    rows.push([names, ACT[r.act] || r.act, TOOL[r.tool] || '—', SPOT[r.spot], inn, out]);
  }
  return table(state, 'Role robotników (Data.ROLES i Data.LOADS): czynność na ekranie, narzędzie, miejsce pracy oraz ładunki wejścia (po które idzie do Składu / Dworu) i wyjścia (które tam niesie)', ['Budynek', 'Czynność', 'Narzędzie', 'Miejsce pracy', 'Wejście', 'Wyjście'], rows, { cls: 'small' });
};
GEN.stan_gry = (arg, state) => {
  const { World } = game(); World.init('franks');
  const keys = Object.keys(World.state()); const missing = keys.filter(k => !STATE_DOC[k]);
  if (missing.length) state.warnings.push('stan_gry: brak opisu pól state: ' + missing.join(', '));
  return table(state, 'Pola stanu gry (World.state()); stan jest JSON-owy, więc TestBots.snapshot / restore klonuje go przez JSON', ['Pole', 'Opis'], keys.map(k => ['<code>' + k + '</code>', STATE_DOC[k] || '<b>brak opisu</b>']), { cls: 'small' });
};

GEN.moduly = (arg, state) => {
  const { mods, ids } = dependencyMatrix(), g = game(), rows = ids.map(id => {
    const m = mods[id], ex = g[id] && typeof g[id] === 'object' ? Object.keys(g[id]) : null;
    return [id, m.from + '–' + m.to, m.to - m.from + 1, MODULE_DOC[id] || '', ex ? String(ex.length) : '—'];
  });
  return table(state, 'Moduły w Nova_Roma.html (kolejność w pliku; zakresy linii liczone z kodu)', ['Moduł', 'Linie', 'Dł.', 'Zadanie', 'API'], rows, { cls: 'small', align: ['', '', 'right', '', 'center'] });
};
GEN.zaleznosci = (arg, state) => {
  const { ids, dep } = dependencyMatrix(), max = Math.max(...ids.flatMap(a => Object.values(dep[a])));
  const heat = n => { if (!n) return ''; const t = Math.min(1, Math.log(1 + n) / Math.log(1 + max)); return 'background:rgba(47,111,159,' + (0.12 + 0.78 * t).toFixed(2) + ');color:' + (t > 0.55 ? '#fff' : '#12304a'); };
  let h = '<div class="tw matrix"><div class="tcap"><b>Tabela ' + (++state.tables) + '.</b> Macierz zależności: liczba odwołań <code>Moduł.</code> w kodzie wiersza do modułu kolumny (komentarze pominięte)</div><table><thead><tr><th></th>' + ids.map(b => '<th class="rot"><span>' + b + '</span></th>').join('') + '</tr></thead><tbody>';
  for (const a of ids) h += '<tr><th class="rl">' + a + '</th>' + ids.map(b => '<td style="' + heat(dep[a][b]) + '">' + (a === b ? '·' : dep[a][b] || '') + '</td>').join('') + '</tr>';
  return h + '</tbody></table></div>';
};
GEN.zaleznosci_lista = (arg, state) => {
  const { ids, dep } = dependencyMatrix(), rows = ids.map(a => {
    const top = Object.entries(dep[a]).sort((x, y) => y[1] - x[1]).slice(0, 9).map(([b, n]) => b + ' (' + n + ')').join(', ');
    const used = ids.filter(b => b !== a && dep[b][a]).length;
    return [a, top || '—', used];
  });
  return table(state, 'Najczęściej używane moduły każdego modułu (liczba odwołań) i liczba modułów, które go używają', ['Moduł', 'Używa (najczęstsze)', 'Używany przez'], rows, { cls: 'small', align: ['', '', 'center'] });
};

GEN.przepisy = (arg, state) => {
  const { TestBots, Data } = game(), rows = FIDS.map(f => [FNAME[f], '<ol class="cols">' + TestBots.RECIPE[f].map(id => '<li>' + Data.nameOf(id, f) + '</li>').join('') + '</ol>']);
  return table(state, 'Przepisy nacji — kolejność budowy botów R/D (TestBots.RECIPE); odpowiada rozdziałom „Przepis na gospodarkę” specyfikacji', ['Nacja', 'Kolejność budowy'], rows, { cls: 'small' });
};

GEN.narzedzia_testowe = (arg, state) => {
  const dir = path.join(ROOT, 'tools'), rows = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && x !== 'headless.js').sort()) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n'); let desc = [];
    for (const l of lines.slice(0, 6)) { const m = /^\/\/\s?(.*)$/.exec(l); if (m && !/^Użycie:/.test(m[1])) desc.push(m[1]); else if (/^\/\*/.test(l)) { desc.push(l.replace(/^\/\*\s*/, '').replace(/\*\/\s*$/, '')); } else if (desc.length && !m) break; }
    if (!desc.length) { const i = lines.findIndex(l => /^\/\*/.test(l)); if (i >= 0) desc.push(lines[i].replace(/^\/\*\s*/, '')); }
    rows.push(['<code>' + f + '</code>', esc(desc.join(' ').replace(/\s+/g, ' ').trim()) || '—']);
  }
  return table(state, 'Skrypty w tools/ (opis z nagłówków plików)', ['Skrypt', 'Co sprawdza'], rows, { cls: 'small' });
};

/* ---------- symulowane czasy budowy ---------- */
function buildTimes() {
  const g = game(), { World, Build, TestBots, Data } = g, res = {};
  for (const fid of FIDS) {
    res[fid] = {};
    for (const [id, def] of Object.entries(Data.BUILDINGS)) {
      if (id === 'keep' || (def.factions && !def.factions.includes(fid))) continue;
      World.init(fid); const s = World.state();
      Object.assign(s.res, { deski: 250, kamień: 300, glina: 300, złoto: 1000 });
      if (id === 'ship') { const d = TestBots.findPlace(s, 'dock'); if (!d || !World.placeFree('dock', d.x, d.y)) { res[fid][id] = null; continue; } }
      const spot = TestBots.findPlace(s, id); if (!spot) { res[fid][id] = null; continue; }
      const r = Build.enqueue(id, spot.x, spot.y); if (!r.ok) { res[fid][id] = null; continue; }
      const site = s.sites[0]; let t = 0; const info = { crowd: site.crowd, level: site.levelTotal };
      while (s.sites.includes(site) && t < 60) { World.tick(0.05); t += 0.05; }
      res[fid][id] = s.sites.includes(site) ? null : { t: +t.toFixed(1), pieces: site.pieces, ...info };
    }
  }
  return res;
}
let _bt = null;
GEN.czasy_budowy = (arg, state) => {
  const { Data } = game(); _bt = _bt || buildTimes();
  const ids = Object.keys(Data.BUILDINGS).filter(id => id !== 'keep'), rows = [];
  for (const cat of Data.CATS) for (const id of ids) {
    const def = Data.BUILDINGS[id]; if (def.cat !== cat) continue;
    const cells = FIDS.map(f => { const r = _bt[f][id]; return r === undefined ? '—' : r ? { html: nf(r.t) + '<span class="sub"> (' + r.pieces + ' szt.)</span>' } : '?'; });
    if (cells.every(c => c === '—')) continue;
    rows.push([def.names ? def.names.franks + ' / ' + def.names.saracens + ' / ' + def.names.slavs : def.name, ...cells]);
  }
  return table(state, 'Czas budowy od otwarcia placu do ukończenia [min gry]: 3 budowniczych, płaski teren, bez sąsiadów, zapas materiałów w magazynie (symulacja Build.tick; w nawiasie liczba sztuk materiału)', ['Budynek', ...FIDS.map(f => FNAME[f])], rows, { cls: 'small', align: ['', 'center', 'center', 'center', 'center'] });
};

/* ---------- wyniki testów (docs/data/wyniki_testow.json, odświeżane przez node docs/collect.js) ---------- */
GEN.wyniki_normalna = (arg, state) => {
  const d = resultsData(); if (!d) { state.warnings.push('brak docs/data/wyniki_testow.json'); return '<p><i>Brak danych — uruchom node docs/collect.js</i></p>'; }
  const rows = d.normal.map(r => [FNAME[r.faction], r.bot + (r.eps ? ' (ε ' + nf(r.eps) + ')' : ''), r.preset === 'off' ? 'wył.' : 'Łatwy', r.pop.join(' / '), r.end, r.pop36 == null ? '—' : r.pop36, r.famine, r.tribute, r.delivered, r.gold, r.planks]);
  return table(state, 'Normalna gra botów (tools/normal.js, ' + d.meta.date + ', commit ' + d.meta.commit + '): ludność @20/40/60/90/150, koniec, minuta 36 osób, minuty głodu, terminy haraczu, dostawy, złoto, deski', ['Nacja', 'Bot', 'Haracz', 'Ludność', 'Koniec', '36 os.', 'Głód', 'Terminy', 'Dost.', 'Złoto', 'Deski'], rows, { cls: 'small', align: ['', '', '', 'center', 'center', 'center', 'center', 'center', 'center', 'right', 'right'] });
};
GEN.wyniki_scenariusze = (arg, state) => {
  const d = resultsData(); if (!d) return '<p><i>Brak danych — uruchom node docs/collect.js</i></p>';
  const rows = d.scenarios.map(r => [r.ok ? '✔' : '✘', r.code, r.name, r.tribute, r.pop, r.end, r.famine, r.gold]);
  return table(state, 'Scenariusze akceptacyjne (tools/scenarios.js, ' + d.meta.date + '): ' + d.meta.summary, ['', 'Id', 'Scenariusz', 'Haracz', 'Ludność @20/40/60/90', 'Koniec', 'Głód', 'Złoto'], rows, { cls: 'small', align: ['center', '', '', 'center', 'center', 'center', 'center', 'right'] });
};

/* ---------- wykresy ---------- */
GEN.wykres_logistyki = (arg, state) => {
  const R = game().Data.RULES.logistics, xs = []; for (let d = 0; d <= 40; d += 2) xs.push(d);
  const eff = d => 1 - (1 - R.min) * Math.max(0, Math.min(1, (d - R.free) / R.span));
  return lineChart(state, 'Sprawność logistyczna producenta w zależności od odległości drogi do Składu lub Dworu (Data.RULES.logistics)', { xs, xticks: [0, 6, 10, 20, 26, 30, 40], series: [{ name: 'sprawność', ys: xs.map(eff) }], ymin: 0, ymax: 1.05, xlabel: 'odległość drogi nosiciela [pola; pole lądu = 1, droga = 0,6]', ylabel: 'mnożnik plonu' });
};
GEN.wykres_haraczu = (arg, state) => {
  const { Tribute } = game(), xs = []; for (let l = 1; l <= 11; l++) xs.push(l);
  const UNIT_PM = { franks: 19, saracens: 1.11, vikings: 60, slavs: 1 };
  return lineChart(state, 'Skala haraczu w osobominutach na 15 min: każda nacja płaci tyle samo pracy (30 × poziom), choć w innych jednostkach', { xs, xticks: xs, series: FIDS.map(f => ({ name: FNAME[f], ys: xs.map(l => Tribute.RATE[f][l] * UNIT_PM[f]) })), xlabel: 'poziom haraczu', ylabel: 'osobominuty / 15 min' });
};
GEN.wykres_cen = (arg, state) => {
  const T = game().Tribute.TRADE, xs = []; for (let n = 0; n <= 60; n += 2) xs.push(n);
  const curve = (t, markets) => xs.map(n => Math.max(t.floor, t.base - 0.05 * n / markets));
  return lineChart(state, 'Cena kadzidła po sprzedaży n sztuk naraz: 1 Targ, 2 Targi (lub Karawanseraj), z odnową pomijaną (Tribute.TRADE)', { xs, xticks: [0, 10, 20, 30, 40, 50, 60], series: [{ name: '1 Targ', ys: curve(T['kadzidło'], 1) }, { name: '2 Targi', ys: curve(T['kadzidło'], 2) }, { name: '4 Targi (limit)', ys: curve(T['kadzidło'], 4) }], ymin: 0, ymax: 4.6, xlabel: 'sprzedane sztuki', ylabel: 'cena [zł]' });
};

/* ---------- fizyczna logistyka (Faza 9B): model cyklu pracy producenta — stałe z Data.RULES.cycle i Data.RULES.walk ---------- */
const physC = () => { const R = game().Data.RULES; return { n: R.cycle.load, h: R.cycle.handle, v: R.walk.v, ref: R.cycle.ref }; };
const physEff = (L, v, n, h, ref) => { const c = physC(); v = v ?? c.v; n = n ?? c.n; h = h ?? c.h; ref = ref ?? c.ref; return Math.min(1, (n + 2 * ref / v + h) / (n + 2 * L / v + h)); };   // producent o tempie 1 szt./min (Tw = ładunek)
GEN.sonda_logistyki = (arg, state) => {
  const probe = require(path.join(ROOT, 'tools/probe_logistyki.js')), g = game(), rows = FIDS.map(f => { const m = probe.measure(g, f)[90]; return [FNAME[f], m.pop, m.producenci, nf(m.mediana), nf(m.p90), nf(m.max), nf(m.sredniaSprawnosc), nf(m.przeplywWyjscia), nf(m.przeplywWejscia), m.obciazenie, m.wolniLudzie, nf(m.nosicieli_v18)]; });
  return table(state, 'Osady botów R w 90. minucie (bez dróg, logistyka włączona; pomiar tools/probe_logistyki.js): odległość drogi drzwi producenta do najbliższego Składu lub Dworu, sprawność modułu Logistics, przepływy towarów, obciążenie transportu (Σ przepływ × odległość) i liczba nosicieli potrzebnych przy 18 polach/min', ['Nacja', 'Ludność', 'Producenci', 'Mediana [pola]', 'P90', 'Maks.', 'Śr. sprawność', 'Wyjścia [szt./min]', 'Wejścia [szt./min]', 'Obciążenie [szt.·pole/min]', 'Wolni ludzie', 'Nosiciele (v = 18)'], rows, { cls: 'small', align: ['', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'] });
};
GEN.tempo = (arg, state) => {
  const c = physC(), rows = [[6, 12], [12, 12], [18, 12], [24, 12], [30, 12]].map(([v, L]) => [v, nf(+physEff(L, v).toFixed(3)), nf(+physEff(L * game().Terrain.ROAD_COST, v).toFixed(3)), nf(+(v / 4).toFixed(1)), nf(+(v / 12).toFixed(2)), nf(+(v / 20).toFixed(2))]);
  return table(state, 'Prędkość chodu ludzi (pola na minutę gry) a sprawność transportu przy odległości 12 pól (producent o tempie 1 szt./min, ładunek ' + c.n + ' szt., obsługa ' + nf(c.h) + ' min, L_ref = ' + c.ref + ') i prędkość widoczna na ekranie [pola/s] przy tempie gry 4, 12 i 20 s na minutę', ['v [pola/min]', 'Sprawność bez drogi (12 pól)', 'Sprawność po drodze (7,2 pola)', 'Pola/s przy 4 s/min', 'Pola/s przy 12 s/min', 'Pola/s przy 20 s/min'], rows, { align: ['center', 'center', 'center', 'center', 'center', 'center'] });
};
GEN.wykres_fizyczny = (arg, state) => {
  const g = game(), R = g.Data.RULES.logistics, B = g.Data.BUILDINGS, xs = []; for (let d = 0; d <= 40; d += 2) xs.push(d);
  const lin = L => 1 - (1 - R.min) * Math.max(0, Math.min(1, (L - R.free) / R.span)), cyc = (def, L) => g.Logistics.cycleEff(def, 1, L).eff;
  return lineChart(state, 'Sprawność producenta w zależności od odległości do Składu / Dworu: dawna krzywa liniowa (Data.RULES.logistics) i model cyklu pracy (Logistics.cycleEff) dla drwala (1 szt./min), Piekarni (3,3 szt./min) i Huty (2 wejścia na 1 wyjście); przerywana: drwal po drodze (koszt pola 0,6)', { xs, xticks: [0, 6, 8, 12, 20, 26, 30, 40], series: [{ name: 'dawna krzywa', ys: xs.map(lin) }, { name: 'cykl: drwal', ys: xs.map(L => cyc(B.woodcutter, L)) }, { name: 'cykl: Piekarnia', ys: xs.map(L => cyc(B.bakery, L)) }, { name: 'cykl: Huta', ys: xs.map(L => cyc(B.smelter, L)) }, { name: 'drwal po drodze', ys: xs.map(L => cyc(B.woodcutter, L * g.Terrain.ROAD_COST)) }], ymin: 0.3, ymax: 1.02, xlabel: 'odległość drogi do Składu / Dworu [pola bez drogi]', ylabel: 'sprawność' });
};

/* diagramy z diagrams.js */
for (const k of Object.keys(diagrams)) GEN['diagram_' + k] = (arg, state) => diagrams[k](state, game(), arg);

function block(name, arg, state) {
  if (name === 'tabela') { const [n, a] = arg.split('|'); const k = n.trim(); if (k.startsWith('budynki:')) return GEN.budynki(k.slice(8), state); if (!GEN[k]) throw new Error('nieznana tabela: ' + k); return GEN[k](a, state); }
  if (name === 'diagram' || name === 'wykres') { const [n, a] = arg.split('|'); const k = (name === 'diagram' ? 'diagram_' : 'wykres_') + n.trim(); if (!GEN[k]) throw new Error('nieznany ' + name + ': ' + arg); return GEN[k](a || '', state); }
  throw new Error('nieznana dyrektywa: ' + name);
}
module.exports = { block, evalV, game, GEN, FIDS, FNAME, nf };
