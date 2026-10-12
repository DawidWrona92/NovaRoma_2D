// Normalna gra (150/140/200/150 min): boty R/D/N dla 4 nacji; porównanie z tabelą kryteriów akceptacji spec.
// Użycie: node tools/normal.js [plik.html] [nacja]
const { load } = require('./headless');
const G = load(process.argv[2] || 'Nova_Roma.html');
const only = process.argv[3];
const t0 = Date.now();
for (const f of ['franks', 'saracens', 'vikings', 'slavs']) {
  if (only && only !== f) continue;
  for (const [bot, eps, preset] of [['R', 0, 'off'], ['R', 0, 'easy'], ['R', 0.15, 'easy'], ['D', 0.15, 'easy'], ['N', 0.15, 'easy']]) {
    const r = G.TestBots.runSync({ faction: f, bot, epsilon: eps, preset });
    const p = r.pop;
    console.log(f.padEnd(9), bot, 'e' + eps, preset.padEnd(4), 'pop@20/40/60/90/150:', [20,40,60,90,150].map(m => p[m]).join('/').padEnd(14),
      'koniec', String(r.endPop).padEnd(3), '36@', String(r.pop36).padEnd(4), 'głód', String(r.famine).padEnd(3), 'haracz', r.tribute.padEnd(4), 'dost', String(r.delivered).padEnd(4), 'zł', String(r.gold).padEnd(5), 'deski', r.planks, 'narz.kup', r.toolsBought, 'drzewa', r.trees);
  }
}
console.log('czas:', Date.now() - t0, 'ms');
