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
