'use strict';
/* Osadza silnik sprite'ów prototypu w grze (../Nova_Roma.html), tak by gra pozostała jednym plikiem:
     node build_game.js            — przebudowuje bloki w Nova_Roma.html
     node build_game.js --check    — tylko sprawdza, czy bloki w Nova_Roma.html są aktualne (kod wyjścia 1, gdy nie)
   Bloki (znaczniki wstawiane automatycznie przed modułem DATA przy pierwszym uruchomieniu):
     SPRITE_META (BEGIN…END) — dane katalogu: obrys, wejście, dym, rozmiar sprite'a (z katalog_budynkow.json; działa w testach headless bez wypieku)
     SPRITES (BEGIN…END)     — moduł `Sprites`: src/00…54 + game_api.js w jednym IIFE (bez DOM przy ładowaniu; wypiek dopiero w Sprites.bake(nacja))
   Źródłem prawdy pozostaje prototyp/src — bloków w grze nie edytuje się ręcznie.
   Katalog (katalog_budynkow.json) odświeża `node katalog.js` po każdej zmianie obrysów / wejść / kominów. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const check = process.argv.includes('--check');
const target = path.resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || path.join(__dirname, '..', 'Nova_Roma.html'));
const dir = path.join(__dirname, 'src');

const modules = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !/^9\d_/.test(f)).sort();            // 90_main.js (scena pokazowa prototypu) nie wchodzi do gry
const engine = modules.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(dir, f), 'utf8').replace(/^'use strict';\n/, '')).join('\n');
const api = fs.readFileSync(path.join(__dirname, 'game_api.js'), 'utf8');

/* 1. silnik musi się załadować bez DOM i bez wypieku, a katalog musi pokrywać wszystkie budynki nacji */
const noDom = { document: { createElement() { throw new Error('DOM niedostępny przy ładowaniu silnika'); } }, console, Math, JSON, Date, Object, Array, Map, Set, Number, String, parseInt, parseFloat, isNaN, setTimeout };
const ctx = vm.createContext(Object.assign({}, noDom));
let nations;
try { nations = vm.runInContext(`(() => {'use strict';\n${engine}\n${api.replace(/^return \{[\s\S]*$/m, 'return { NATIONS, BAKED };')}\n})()`, ctx, { filename: 'Sprites(build)' }); }
catch (e) { console.error('Silnik sprite\'ów nie ładuje się bez DOM:', e.stack || e); process.exit(2); }

const cat = JSON.parse(fs.readFileSync(path.join(__dirname, 'katalog_budynkow.json'), 'utf8'));
const meta = {}; let missing = [];
for (const [n, ids] of Object.entries(nations.NATIONS)) {
  meta[n] = {};
  for (const id of ids) {
    const b = cat.nacje[n] && cat.nacje[n].budynki[id];
    if (!b) { missing.push(`${n}_${id}`); continue; }
    if (!nations.BAKED[`${n}_${id}`]) missing.push(`${n}_${id} (brak generatora)`);
    meta[n][id] = { fp: b.obrys, in: [b.wejscie.strona, b.wejscie.x, b.wejscie.y], smoke: b.dym, px: [b.sprite_px.w, b.sprite_px.h, b.sprite_px.ax, b.sprite_px.ay] };
  }
}
if (missing.length) { console.error('Katalog niekompletny (uruchom: node katalog.js):', missing.join(', ')); process.exit(3); }

/* 2. bloki do wstawienia */
const metaBlock = `/* SPRITE_META:BEGIN — wygenerowane przez prototyp/build_game.js z katalog_budynkow.json (nie edytuj ręcznie)\n   id → fp: obrys [w,h] w polach · in: wejście [strona,x,y] względem środka obrysu · smoke: kotwice dymu [x,y,z] · px: sprite [w,h,ax,ay] */\nconst SPRITE_META = ${JSON.stringify(meta)};\n/* SPRITE_META:END */`;
const spritesBlock = `/* SPRITES:BEGIN — wygenerowane przez prototyp/build_game.js z prototyp/src + game_api.js (nie edytuj ręcznie) */\nconst Sprites = (() => {\n'use strict';\n${engine}\n${api}\n})();\n/* SPRITES:END */`;

let html = fs.readFileSync(target, 'utf8');
const MOD = '/* ============================== MODUL: DATA';
const put = (name, block) => {
  const re = new RegExp(`/\\* ${name}:BEGIN[\\s\\S]*?/\\* ${name}:END \\*/`);
  if (re.test(html)) html = html.replace(re, () => block);
  else { const i = html.indexOf(MOD); if (i < 0) { console.error('Nie znaleziono modułu DATA w', target); process.exit(4); } html = html.slice(0, i) + block + '\n\n' + html.slice(i); }
};
put('SPRITE_META', metaBlock); put('SPRITES', spritesBlock);

if (check) {
  const cur = fs.readFileSync(target, 'utf8');
  if (cur !== html) { console.error('Bloki sprite\'ów w', path.basename(target), 'są nieaktualne — uruchom: node prototyp/build_game.js'); process.exit(1); }
  console.log('OK — bloki aktualne'); process.exit(0);
}
fs.writeFileSync(target, html);
console.log('OK', path.basename(target), (html.length / 1024).toFixed(0) + ' KB · moduły:', modules.length, '· budynków w katalogu:', Object.values(meta).reduce((a, m) => a + Object.keys(m).length, 0));
