/* ====================== KATALOG BUDYNKÓW: id z gry → sprite, obrys, nazwa ======================
   Sprite budynku `id` nacji `n` nazywa się `${n}_${id}` (np. franks_mill). Obrys (fw×fh w polach) pochodzi z wypieczonego sprite'a.
   Lista id odpowiada Data.BUILDINGS z Nova_Roma.html: 12 budynków wspólnych + budynki specyficzne dla nacji. */
const COMMON_IDS = ['keep', 'hut', 'woodcutter', 'forester', 'sawmill', 'hunter', 'dairy', 'orchard', 'watercarrier', 'market', 'store', 'temple'];
const NATIONS = {
  franks: COMMON_IDS.concat(['quarry', 'farm', 'mill', 'bakery', 'ironmine', 'coalmine', 'smelter', 'toolforge', 'armory', 'vineyard', 'winery', 'barracks']),
  saracens: COMMON_IDS.concat(['claypit', 'dategrove', 'incensewood', 'incense', 'cotton', 'weaver', 'pottery', 'qanat', 'bathhouse', 'caravanserai', 'guardpost']),
  vikings: COMMON_IDS.concat(['fisherhut', 'peatmine', 'charburner', 'mead', 'dock', 'smelter', 'toolforge', 'armory', 'ship']),
  slavs: COMMON_IDS.concat(['gatherer', 'field', 'kasha', 'bartnik', 'waxery', 'trapper', 'tannery', 'sauna'])
};
const NATION_PL = { franks: 'FRANKOWIE', saracens: 'SARACENI', vikings: 'WIKINGOWIE', slavs: 'SŁOWIANIE' };
const NAMES = {
  keep: 'Dwór', hut: 'Chata', woodcutter: 'Chata drwala', forester: 'Leśniczówka', sawmill: 'Tartak', hunter: 'Chata myśliwego', dairy: 'Mleczarnia', orchard: 'Sad', watercarrier: 'Chata nosiwody', market: 'Targ', store: 'Skład', temple: 'Świątynia',
  quarry: 'Kamieniołom', farm: 'Farma', mill: 'Młyn', bakery: 'Piekarnia', ironmine: 'Kopalnia żelaza', coalmine: 'Kopalnia węgla', smelter: 'Huta', toolforge: 'Kuźnia narzędzi', armory: 'Zbrojownia', vineyard: 'Winnica', winery: 'Winiarz', barracks: 'Koszary',
  claypit: 'Glinianka', dategrove: 'Gaj daktylowy', incensewood: 'Las kadzidlany', incense: 'Wytwórnia kadzidła', cotton: 'Plantacja bawełny', weaver: 'Tkalnia', pottery: 'Garncarnia', qanat: 'Qanat', bathhouse: 'Łaźnia', caravanserai: 'Karawanseraj', guardpost: 'Strażnica',
  fisherhut: 'Chata rybaka', peatmine: 'Kopalnia darniowa', charburner: 'Wypalarka węgla', mead: 'Miodosytnia', dock: 'Przystań', ship: 'Okręt',
  gatherer: 'Chata zbieracza', field: 'Pole stałe', kasha: 'Kaszarnia', bartnik: 'Barć', waxery: 'Woskarnia', trapper: 'Chata łowcy futer', tannery: 'Garbarnia', sauna: 'Bania'
};
const TEMPLE_PL = { franks: 'Kościół', saracens: 'Meczet', vikings: 'Kościół', slavs: 'Kapliczka' };
const spriteName = (nation, id) => `${nation}_${id}`;
const nameOfBuilding = (nation, id) => id === 'temple' ? TEMPLE_PL[nation] : NAMES[id];

/* eksport katalogu do integracji z grą: id → sprite, obrys, wejście, kotwice dymu, rozmiar i kotwica sprite'a.
   Współrzędne (wejście, drzwi, dym): pola względem środka obrysu (x w prawo-dół, y w lewo-dół, z w górę); sprite: w px logicznych, (ax, ay) = środek obrysu na ziemi.
   `wejscie` = punkt na krawędzi obrysu, do którego dochodzą pracownicy (strona S: y = fh/2, strona E: x = fw/2); `drzwi` = faktyczne położenie pierwszych drzwi w bryle (null, gdy budynek ma wejście bez drzwi: wiata, sad, targ…).
   Środek obrysu budynku z północnym rogiem (i, j) leży w polu (i + fw/2, j + fh/2); na ekranie (przy zoomie 1): ((x − y)·AX, (x + y)·AY). */
function catalogJSON() {
  const out = { wersja: 'v4-katalog', pole: { AX, AY, VH }, nacje: {} }, r2 = v => +v.toFixed(2), cl = (v, m) => Math.max(-m, Math.min(m, v));
  for (const n of Object.keys(NATIONS)) {
    out.nacje[n] = { nazwa: NATION_PL[n], budynki: {} };
    for (const id of NATIONS[n]) {
      const s = SPR[spriteName(n, id)]; if (!s) continue;
      const d = (s.doors && s.doors[0]) || null, fw = s.fw, fh = s.fh;
      const wejscie = d && d.side === 'E' ? { strona: 'E', x: r2(fw / 2), y: r2(cl(d.y, fh / 2 - 0.3)) } : { strona: 'S', x: r2(cl(d ? d.x : 0, fw / 2 - 0.3)), y: r2(fh / 2) };
      out.nacje[n].budynki[id] = { sprite: spriteName(n, id), nazwa: nameOfBuilding(n, id), obrys: [fw, fh], wejscie, drzwi: d ? { strona: d.side, x: d.x, y: d.y } : null, dym: s.smoke || [], sprite_px: { w: Math.round(s.w), h: Math.round(s.h), ax: Math.round(s.ax), ay: Math.round(s.ay) } };
    }
  }
  return out;
}
