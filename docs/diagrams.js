'use strict';
/* Diagramy SVG dokumentacji. Schematy ręczne (warstwy, tick, teren, polowanie, budowa, pętle ekonomii) i diagram łańcuchów produkcji liczony z Data.BUILDINGS.
   Każda funkcja: (state, game, arg) → HTML figury z podpisem. Style klas .dg-* w docs/style.css. */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nf = n => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)).replace('.', ','));

const svg = (w, h, inner, cls = '') => '<svg class="dg ' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" role="img"><defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" class="dg-ahead"/></marker></defs>' + inner + '</svg>';
const box = (x, y, w, h, label, cls = '', sub = '') => '<g class="dg-box ' + cls + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4"/>' +
  '<text x="' + (x + w / 2) + '" y="' + (y + (sub ? h / 2 - 2 : h / 2 + 3.5)) + '" text-anchor="middle" class="dg-t">' + esc(label) + '</text>' + (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 9) + '" text-anchor="middle" class="dg-s">' + esc(sub) + '</text>' : '') + '</g>';
const arrow = (x1, y1, x2, y2, cls = '', label = '', lx = 0, ly = 0) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="dg-arrow ' + cls + '" marker-end="url(#ah)"/>' + (label ? '<text x="' + ((x1 + x2) / 2 + lx) + '" y="' + ((y1 + y2) / 2 + ly) + '" class="dg-s" text-anchor="middle">' + esc(label) + '</text>' : '');
const curve = (x1, y1, cx, cy, x2, y2, cls = '') => '<path d="M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2 + '" class="dg-arrow ' + cls + '" fill="none" marker-end="url(#ah)"/>';
const label = (x, y, t, cls = 'dg-s', anchor = 'start') => '<text x="' + x + '" y="' + y + '" class="' + cls + '" text-anchor="' + anchor + '">' + esc(t) + '</text>';
const fig = (state, cap, body) => '<figure class="dgfig">' + body + '<figcaption><b>Rysunek ' + (++state.figures) + '.</b> ' + cap + '</figcaption></figure>';

/* ------------------------------------------------------------------ warstwy */
function warstwy(state) {
  let s = '';
  const L = (y, h, t, cls) => '<rect x="4" y="' + y + '" width="512" height="' + h + '" rx="6" class="dg-layer ' + cls + '"/>' + label(12, y + 12, t, 'dg-lt');
  s += L(4, 62, 'PREZENTACJA I WEJŚCIE (przeglądarka)', 'l1');
  s += box(14, 24, 70, 32, 'Game', 'm', 'pętla, render') + box(92, 24, 54, 32, 'UI', 'm', 'HUD, karty') + box(154, 24, 76, 32, 'BuildMode', 'm', 'duch, strefy') + box(238, 24, 66, 32, 'Advisor', 'm', 'statusy') +
       box(312, 24, 54, 32, 'Camera', 'm', 'rzut 2:1') + box(374, 24, 60, 32, 'Sprites', 'g', 'wypiek (gen.)') + box(442, 24, 64, 32, 'Gfx', 'm', 'klasyka');
  s += L(72, 50, 'CIEŃ SYMULACJI (wizualny; bez RNG, poza stanem gry)', 'l2');
  s += box(14, 88, 96, 28, 'Walkers', 'm', 'piesi po ścieżkach') + label(120, 98, 'obywatele, nosiciele i budowniczowie idą po Path', 'dg-s') + label(120, 110, 'do celów „cienia” z World.tick; render czyta pozycje', 'dg-s');
  s += L(128, 108, 'LOGIKA GRY (JSON-owy stan World.state(); kolejność ticku →)', 'l3');
  s += box(14, 146, 74, 34, 'World', 'k', 'stan, canPlace') + box(98, 146, 76, 34, 'Economy', 'k', '1. obsada, produkcja') + box(184, 146, 62, 34, 'Build', 'k', '2. place') + box(256, 146, 72, 34, 'Tribute', 'k', '3. haracz, rynek') + box(338, 146, 62, 34, 'Events', 'k', '4. napady') + box(410, 146, 96, 34, 'Fauna', 'k', '5. zwierzęta (opc.)');
  s += arrow(88, 163, 98, 163, 'dg-flow') + arrow(174, 163, 184, 163, 'dg-flow') + arrow(246, 163, 256, 163, 'dg-flow') + arrow(328, 163, 338, 163, 'dg-flow') + arrow(400, 163, 410, 163, 'dg-flow');
  s += box(14, 192, 74, 32, 'Logistics', 'k', 'sprawność') + box(98, 192, 62, 32, 'Roads', 'k', 'drogi') + box(170, 192, 100, 32, 'TestBots', 't', 'boty R/D/N, snapshot') + label(280, 205, 'TestBots steruje World, Build i Tribute', 'dg-s') + label(280, 217, 'z zewnątrz (testy, panel botów)', 'dg-s');
  s += L(242, 46, 'TEREN I ŚCIEŻKI', 'l4');
  s += box(14, 258, 74, 26, 'Terrain', 'm', 'generator v2') + box(98, 258, 74, 26, 'MapGen', 'm', 'mapa 48×48') + box(182, 258, 56, 26, 'Path', 'm', 'A*') + label(250, 270, 'przechodniość, koszt pola, osiągalność (reachSet) —', 'dg-s') + label(250, 281, 'używane też przez World.canPlace i Fauna', 'dg-s');
  s += L(294, 40, 'DANE I LOSOWOŚĆ', 'l5');
  s += box(14, 308, 74, 22, 'Data', 'd') + box(98, 308, 62, 22, 'RNG', 'd') + box(170, 308, 110, 22, 'SPRITE_META', 'g') + label(290, 318, 'Data: nacje, budynki, klimaty, zasady;', 'dg-s') + label(290, 329, 'RNG: jedyny globalny strumień losowości', 'dg-s');
  s += arrow(51, 242, 51, 226, 'dg-up') + arrow(51, 128, 51, 120, 'dg-up');
  return fig(state, 'Warstwy modułów. Warstwa wyższa woła niższą; logika gry nie zna renderu ani Walkers (render tylko czyta stan). Zielone: bloki generowane z prototypu.', svg(520, 338, s));
}

/* --------------------------------------------------------------------- tick */
function tick(state, g) {
  let s = '';
  s += box(8, 10, 118, 40, 'Game.loop', 'm', 'rAF, realDt ≤ 0,05 s') + label(8, 62, 'gameDt = realDt / secPerMin × speed', 'dg-s') + label(8, 74, '(secPerMin = ' + g.Data.RULES.clock.secPerMin + ' s realne = 1 min gry)', 'dg-s');
  s += arrow(126, 30, 150, 30, 'dg-flow') + box(150, 10, 150, 40, 'World.tick(dt)', 'k', 'time += dt');
  const steps = [['Economy.tick', 'obsada → popularność →', 'produkcja → zawory → jedzenie →', 'podatki → imigracja'], ['Build.tick', 'gang 2–5, place:', 'etap 0 wyrównanie,', '1 noszenie, 2 budowa'], ['Tribute.tick', 'rynek Targu, wyprawy,', 'żołnierze, termin', 'haraczu co 15 min'], ['Events.tick', 'napad na karawanę,', 'kryzysy wg', 'harmonogramu'], ['Fauna.tick', 'wyprawy myśliwych,', 'zagrożenia, narodziny,', 'ruch zwierząt'], ['Cień symulacji', 'obywatele i nosiciele', '(RNG logiki), liczba', 'figurek = ludność']];
  steps.forEach((st, i) => { const x = 8 + (i % 3) * 172, y = 100 + Math.floor(i / 3) * 96; s += '<g class="dg-box ' + (i < 5 ? 'k' : 'm') + '"><rect x="' + x + '" y="' + y + '" width="160" height="74" rx="4"/><text x="' + (x + 80) + '" y="' + (y + 15) + '" text-anchor="middle" class="dg-t">' + esc(st[0]) + '</text></g>'; s += label(x + 80, y + 34, st[1], 'dg-s', 'middle') + label(x + 80, y + 46, st[2], 'dg-s', 'middle') + label(x + 80, y + 58, st[3], 'dg-s', 'middle'); });
  s += arrow(220, 50, 220, 76, 'dg-flow') + '<path d="M220,76 L88,76 L88,100" class="dg-arrow dg-flow" fill="none" marker-end="url(#ah)"/>';
  s += arrow(168, 137, 180, 137, 'dg-flow') + arrow(340, 137, 352, 137, 'dg-flow');
  s += '<path d="M436,174 L436,186 L88,186 L88,196" class="dg-arrow dg-flow" fill="none" marker-end="url(#ah)"/>';
  s += arrow(168, 233, 180, 233, 'dg-flow') + arrow(340, 233, 352, 233, 'dg-flow');
  s += box(8, 300, 160, 38, 'Walkers.update(dt)', 'm', 'widoczne postacie') + box(180, 300, 160, 38, 'UI.refreshHUD', 'm', 'co ¼ min gry') + box(352, 300, 160, 38, 'render(t)', 'm', 'teren, obiekty, fauna, FX');
  s += '<path d="M436,270 L436,284 L88,284 L88,300" class="dg-arrow dg-flow" fill="none" marker-end="url(#ah)"/>' + arrow(168, 319, 180, 319, 'dg-flow') + arrow(340, 319, 352, 319, 'dg-flow');
  return fig(state, 'Kolejność ticku: dwa tory — logika (World.tick, w minutach gry) i prezentacja (Walkers, HUD, render). W testach botów World.tick wołany jest bezpośrednio krokiem 0,1 min.', svg(520, 346, s));
}

/* -------------------------------------------------------------------- teren */
function teren(state) {
  const steps = [
    ['MapGen.generate(nacja, {climate, type, seed})', 'RNG.seed(ziarno) → morze (coastal), skały, kępy drzew do celu nacji, złoża (stary generator)'],
    ['Terrain.apply: do 8 prób (ziarno + 7919·próba)', 'własny PRNG mulberry32 — globalny RNG nietknięty'],
    ['1. Woda', 'morze z generatora (sea); jeziora i stawy (blobWater), rzeka z meandrami i 3 brodami, lód w klimacie śnieżnym'],
    ['2. Wysokości e = 1…4', 'szum fbm → rangi → udziały poziomów typu mapy; płaski plac 9,5 i obszar startowy 13,5; doliny przy wodzie; 2–4 „wzgórza decyzyjne”'],
    ['3. Klify', 'Δe ≥ 2 między sąsiadami, najstromsze stoki wg udziału cliff, skarpy nad morzem'],
    ['4. Cechy klimatu', 'bagna, zaspy, wydmy, oazy, ruchome piaski (kwantyle szumu); poza placem startowym'],
    ['5. ensureConnected', 'Dijkstra przekopuje ścieżki / brody do odciętych kęp lądu (≥ 6 pól)'],
    ['6. reDeposit i brzeg Wikingów', 'złoża z miejscem na kopalnię 3×3 + przerwa; pas brzegu bez drzew; pola rezerwowane (pad)'],
    ['7. rePlant', 'drzewa do celu nacji: tylko na osiągalnych polach bez cech blokujących; pustynia: przy wodzie i oazach'],
    ['8. validate', 'łączność ≥ 80%, złoża osiągalne, ≥ 280 pól pod zabudowę ≤ 14 od Dworu, bród ≤ 16, brzeg Wikingów (≥ 9 budynków) → meta.valid']
  ];
  let s = '', y = 6;
  steps.forEach((st, i) => { const h = 34; s += box(8, y, 196, h, st[0], i < 2 ? 'k' : 'm'); s += '<foreignObject x="212" y="' + y + '" width="304" height="' + h + '"><div xmlns="http://www.w3.org/1999/xhtml" class="dg-fo">' + esc(st[1]) + '</div></foreignObject>'; if (i < steps.length - 1) s += arrow(106, y + h, 106, y + h + 7, 'dg-flow'); y += h + 7; });
  return fig(state, 'Potok generatora terenu v2: stary generator daje bazę (morze, skały, drzewa, złoża), Terrain.apply nakłada wodę, wysokości, klify i cechy klimatu, po czym naprawia łączność i waliduje wynik.', svg(520, y + 2, s));
}

/* ----------------------------------------------------------------- polowanie */
function polowanie(state, g) {
  const R = g.Data.FAUNA_RULES, L = 12, v = R.hunterSpeed, dShot = Math.max(0, L - R.bow);
  const seg = [['idzie', dShot / v, 'go'], ['celuje', R.aim, 'aim'], ['podchodzi', (L - dShot) / v, 'approach'], ['podnosi', R.pick, 'pick'], ['wraca z łupem', L / (v * 0.9), 'back']];
  const total = seg.reduce((a, x) => a + x[1], 0), W = 480, x0 = 20; let x = x0, s = '';
  const cols = ['#6fa8dc', '#e69138', '#93c47d', '#b4a7d6', '#f6b26b'];
  seg.forEach((sg, i) => { const w = Math.max(18, sg[1] / total * W); s += '<rect x="' + x + '" y="40" width="' + w + '" height="34" class="dg-seg" style="fill:' + cols[i] + '"/>' + label(x + w / 2, 60, sg[0], 'dg-t', 'middle').replace('dg-t', 'dg-t sm') + label(x + w / 2, 90, nf(+sg[1].toFixed(2)) + ' min', 'dg-s', 'middle'); x += w; });
  const shotX = x0 + (seg[0][1] + seg[1][1]) / total * W, aimX = x0 + seg[0][1] / total * W;
  s += label(aimX, 28, 'stoi w odl. łuku ' + R.bow + ' pola od ofiary', 'dg-s', 'middle') + '<line x1="' + aimX + '" x2="' + aimX + '" y1="32" y2="40" class="dg-tick"/>';
  s += '<line x1="' + shotX + '" x2="' + shotX + '" y1="34" y2="78" class="dg-shot"/>' + label(shotX + 4, 116, 'strzał: ofiara pada (DEAD),', 'dg-s') + label(shotX + 4, 127, 'strzała w locie ' + R.arrow + ' min przed tą chwilą', 'dg-s');
  s += label(x0, 150, 'Przykład dla ścieżki L = ' + L + ' pól od drzwi do ofiary; prędkość ' + v + ' pola/min, powrót × 0,9. Pozycja myśliwego jest czystą funkcją czasu gry (Fauna.poseOf).', 'dg-s');
  s += label(x0, 163, 'Wyprawa zaczyna się, gdy zebrane mięso b.huntAcc ≥ ' + R.minMeat + '; upolowanie zmniejsza je o ' + R.meat + ' × waga gatunku.', 'dg-s');
  return fig(state, 'Oś czasu wyprawy myśliwego (Data.FAUNA_RULES). Ekonomia nalicza mięso jak dotąd — wyprawa tylko „wyjaśnia” ubytek zwierzyny w łowisku.', svg(520, 174, s));
}

/* ------------------------------------------------------------------- budowa */
function budowa(state, g) {
  const B = g.Build;
  let s = '';
  const st = [['Kolejka gracza', 'klik: canPlace → złoto', 'zapłacone, plac zajmuje pola', 'k'], ['Etap 0', 'wyrównanie terenu', nf(g.Data.RULES.level.per) + ' min × pole × Δe', 'm'], ['Etap 1', 'noszenie materiałów', nf(B.PIECE_MIN) + ' min budowniczego / szt.', 'm'], ['Etap 2', 'budowa', '(' + nf(B.BASE_WORK) + ' + ' + nf(B.PER_PIECE) + ' × szt.) × (1 + kara)', 'm'], ['Gotowe', 'placeBuilding', 'pola zajęte przez budynek', 'k']];
  st.forEach((x, i) => { const bx = 8 + i * 102; s += box(bx, 20, 94, 54, x[0], x[3], x[1]); s += '<foreignObject x="' + bx + '" y="78" width="94" height="40"><div xmlns="http://www.w3.org/1999/xhtml" class="dg-fo c">' + esc(x[2]) + '</div></foreignObject>'; if (i < 4) s += arrow(bx + 94, 47, bx + 102, 47, 'dg-flow'); });
  s += label(8, 140, 'Przydział budowniczych: 1 na plac, +1 na każde 20 szt. materiału (max 3; Okręt 2, Przystań 1); gang 2–5 (domyślnie 3) z wolnej ludności.', 'dg-s');
  s += label(8, 153, 'Plac bez ani jednej dostępnej sztuki materiału nie zajmuje budowniczych; wcześniejszy plac w kolejce ma pierwszeństwo do materiałów.', 'dg-s');
  s += label(8, 166, 'Anulowanie placu (klik poza trybem budowy) zwraca materiały i złoto.', 'dg-s');
  return fig(state, 'Etapy budowy (moduł Build): od otwarcia placu do gotowego budynku.', svg(520, 176, s));
}

/* ------------------------------------------------------------ pętle ekonomii */
function petle(state) {
  let s = '';
  const nodes = { pop: [200, 120, 'Ludność'], food: [30, 36, 'Produkcja jedzenia'], eat: [30, 200, 'Zużycie jedzenia'], hous: [370, 36, 'Mieszkania'], popu: [370, 120, 'Popularność'], tax: [370, 204, 'Podatek / racje'], gold: [200, 262, 'Złoto'], hung: [200, 26, 'Głód'], work: [30, 120, 'Obsada budynków'] };
  for (const [k, [x, y, t]] of Object.entries(nodes)) s += box(x, y, 124, 34, t, k === 'pop' ? 'k' : 'm');
  const A = (a, b, t, lx = 0, ly = -4, cls = '') => { const [x1, y1] = nodes[a], [x2, y2] = nodes[b]; return arrow(x1 + 62, y1 + 17, x2 + 62, y2 + 17, cls, t, lx, ly); };
  s += A('pop', 'eat', '+', -10, -2) + A('eat', 'hung', 'brak jedzenia', -50, 0, 'dg-neg') + A('hung', 'pop', '−1/min po 5 min', 46, 0, 'dg-neg') + A('food', 'pop', 'brama 110%', -4, -8) + A('hous', 'pop', 'miejsce', 14, -10) + A('popu', 'pop', '≥ 45', 8, -8);
  s += A('tax', 'popu', '−8 / −16', 10, 0, 'dg-neg') + A('tax', 'gold', 'dochód', 0, 12) + A('pop', 'work', 'robotnicy', -4, -6) + A('work', 'food', 'wydajność', -8, 0) + A('pop', 'gold', '× podatek', 14, 0);
  return fig(state, 'Główne sprzężenia ekonomii: ludność rośnie tylko przy nadwyżce jedzenia (≥ 110% zużycia), miejscu w chatach i popularności ≥ 45; podatek daje złoto kosztem popularności.', svg(520, 304, s));
}

/* --------------------------------------------------- łańcuchy produkcji (z Data) */
function lancuch(state, g, fid) {
  fid = (fid || 'franks').trim();
  const { Data, Economy, Tribute } = g, FOODS = Economy.FOODS;
  const ids = Object.keys(Data.BUILDINGS).filter(id => id !== 'keep' && (!Data.BUILDINGS[id].factions || Data.BUILDINGS[id].factions.includes(fid)));
  const sinkOf = good => FOODS.includes(good) ? 'S:jedzenie' : good === 'deski' ? 'S:budowa' : ['kadzidło', 'tkanina', 'ceramika'].includes(good) ? 'S:targ' : good === 'broń' ? 'S:haracz' : null;
  const nodes = new Map(), edges = [];
  const add = id => { if (!nodes.has(id)) nodes.set(id, { id, layer: 0 }); return nodes.get(id); };
  for (const id of ids) { const d = Data.BUILDINGS[id]; if (!d.inp && !d.out) continue; if (!d.worker) continue; add(id); }
  const producers = good => ids.filter(id => Data.BUILDINGS[id].out && good in Data.BUILDINGS[id].out);
  for (const id of ids) {
    const d = Data.BUILDINGS[id]; const inp = Object.assign({}, d.inp || {});
    if (id === 'temple') inp[Economy.DOBRO[fid]] = 0.3;
    if (id === 'ship') { inp['miód pitny'] = 6; inp['broń'] = 6; }
    if (id === 'barracks') inp['broń'] = 1;
    if (!nodes.has(id)) continue;
    for (const gd of Object.keys(inp)) for (const p of producers(gd)) if (p !== id && nodes.has(p)) edges.push({ from: p, to: id, good: gd });
    for (const gd of Object.keys(d.out || {})) { const sk = sinkOf(gd); if (sk && !(fid === 'slavs' && ['miód', 'wosk'].includes(gd))) { add(sk); edges.push({ from: id, to: sk, good: gd }); } }
  }
  if (fid === 'slavs') { add('S:danina'); for (const id of ['tannery', 'waxery']) if (nodes.has(id)) edges.push({ from: id, to: 'S:danina', good: id === 'tannery' ? 'futro wyprawione' : 'miód + wosk' }); }
  if (fid === 'vikings') for (const id of ['ship']) if (nodes.has(id)) { add('S:haracz'); edges.push({ from: id, to: 'S:haracz', good: 'wyprawy' }); }
  if (fid === 'franks') if (nodes.has('barracks')) { add('S:haracz'); edges.push({ from: 'barracks', to: 'S:haracz', good: 'żołnierze' }); }
  if (fid === 'saracens') for (const sk of ['S:targ']) if (nodes.has(sk)) edges.push({ from: sk, to: 'S:haracz', good: 'złoto' }), add('S:haracz');
  /* warstwy: najdłuższa ścieżka od źródeł (krawędzie wsteczne ignorowane) */
  const order = [...nodes.keys()];
  for (let it = 0; it < order.length; it++) for (const e of edges) { const a = nodes.get(e.from), b = nodes.get(e.to); if (a && b && b.layer < a.layer + 1 && a.layer + 1 <= order.length) b.layer = a.layer + 1; if (b.layer > 7) b.layer = 7; }
  for (const n of nodes.values()) if (n.id.startsWith('S:')) n.layer = Math.max(n.layer, 1);
  const maxL = Math.max(...[...nodes.values()].map(n => n.layer)), cols = [];
  for (let l = 0; l <= maxL; l++) cols.push([...nodes.values()].filter(n => n.layer === l));
  const SINK = { 'S:jedzenie': 'Ludność (jedzenie)', 'S:budowa': 'Budowa', 'S:targ': 'Targ → złoto', 'S:haracz': 'Haracz', 'S:danina': 'Danina (haracz)' };
  const BW = 92, BH = 24, gapX = Math.min(40, (520 - 8 - (maxL + 1) * BW) / Math.max(1, maxL)), maxRows = Math.max(...cols.map(c => c.length)), H = Math.max(120, maxRows * (BH + 12) + 16);
  cols.forEach((c, l) => c.forEach((n, i) => { n.x = 4 + l * (BW + gapX); n.y = 8 + i * (BH + 12) + (maxRows - c.length) * (BH + 12) / 2; }));
  let s = '';
  for (const e of edges) { const a = nodes.get(e.from), b = nodes.get(e.to); if (!a || !b) continue; const back = b.layer <= a.layer;
    const x1 = a.x + BW, y1 = a.y + BH / 2, x2 = b.x, y2 = b.y + BH / 2;
    if (back) s += '<path d="M' + (a.x + BW / 2) + ',' + (a.y + BH) + ' q0,14 ' + (b.x - a.x) + ',14" class="dg-arrow dg-flow" fill="none"/>';
    else s += '<path d="M' + x1 + ',' + y1 + ' C' + (x1 + gapX / 2 + 4) + ',' + y1 + ' ' + (x2 - gapX / 2 - 4) + ',' + y2 + ' ' + x2 + ',' + y2 + '" class="dg-arrow dg-flow" fill="none" marker-end="url(#ah)"/>'; }
  for (const n of nodes.values()) { const nm = n.id.startsWith('S:') ? SINK[n.id] : Data.nameOf(n.id, fid); s += box(n.x, n.y, BW, BH, nm.length > 17 ? nm.slice(0, 16) + '…' : nm, n.id.startsWith('S:') ? 'k' : 'm'); }
  return fig(state, 'Łańcuchy produkcji nacji ' + { franks: 'Frankowie', saracens: 'Saraceni', vikings: 'Wikingowie', slavs: 'Słowianie' }[fid] + ' (diagram liczony z Data.BUILDINGS; strzałka = towar produkowany przez budynek po lewej i zużywany przez budynek po prawej; skrócone nazwy)', svg(520, H, s, 'chain'));
}

module.exports = { warstwy, tick, teren, polowanie, budowa, petle, lancuch };
