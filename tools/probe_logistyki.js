// Pomiar logistyki w osadach botów (headless): odległości drogi drzwi producenta → najbliższy Skład / Dwór, średnia sprawność modułu Logistics i „obciążenie transportu”
// (Σ przepływ towaru [szt./min] × odległość [pola] — tyle „sztuko-pól na minutę” trzeba przenieść) wraz z liczbą nosicieli, których wymagałby fizyczny transport.
// Wyniki są podstawą analizy w aneksie E dokumentacji (fizyczna logistyka, Faza 9B). Użycie: node tools/probe_logistyki.js [plik.html] [nacja]
const MINUTES = [40, 90, 150];
/* G — załadowana gra (tools/headless.js); zwraca { minuta → pomiary } dla osady bota R danej nacji (bez dróg, logistyka włączona) */
function measure(G, fid) {
  const { World, TestBots, Logistics, Data, Economy, Tribute } = G;
  World.init(fid); const s = World.state(); s.settings.logistics = true; Tribute.set('easy');
  const plan = TestBots.RECIPE[fid].slice(); let pi = 0, next = 0; const out = {};
  for (let t = 0; t < 150; t += 0.1) {
    World.tick(0.1);
    if (t >= next) { next = t + 0.5; if (pi < plan.length) { const r = TestBots.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } }
    for (const m of MINUTES) if (!out[m] && t >= m - 0.15) {
      const eff = Logistics.compute(s), rows = []; let D = 0, flowOut = 0, flowIn = 0;
      for (const b of s.buildings) {
        const e = eff.get(b.uid); if (!e || b.id === 'keep') continue;
        rows.push({ id: b.id, dist: e.dist, eff: e.eff });
        if (!s.staffed[b.uid]) continue;
        const def = Data.BUILDINGS[b.id], sc = fid === 'vikings' ? (Economy.VIK_RATE[b.id] || 1) : 1, dist = Number.isFinite(e.dist) ? e.dist : 12;
        let o = 0, i = 0; for (const [g, r] of Object.entries(def.out || {})) if (g in Economy.LIMIT) o += r * sc; for (const r of Object.values(def.inp || {})) i += r * sc;
        D += (o + i) * dist; flowOut += o; flowIn += i;
      }
      const ds = rows.map(r => r.dist).filter(Number.isFinite).sort((a, b) => a - b), q = p => ds[Math.floor(p * (ds.length - 1))];
      const free = Math.floor(s.pop) - s.workersStaffed - (s.buildersActive || 0), carriers = v => +(D / (6 * v / 2)).toFixed(1);   // nosiciel niesie 6 szt. w jedną stronę z prędkością v pól/min
      out[m] = { pop: Math.floor(s.pop), producenci: rows.length, mediana: +q(0.5).toFixed(1), p90: +q(0.9).toFixed(1), max: +ds[ds.length - 1].toFixed(1), sredniaSprawnosc: +(rows.reduce((a, r) => a + r.eff, 0) / rows.length).toFixed(3),
        przeplywWyjscia: +flowOut.toFixed(1), przeplywWejscia: +flowIn.toFixed(1), obciazenie: Math.round(D), wolniLudzie: free, nosicieli_v8: carriers(8), nosicieli_v18: carriers(18) };
    }
  }
  return out;
}
module.exports = { measure, MINUTES };
if (require.main === module) {
  const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html'), only = process.argv[3];
  for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) if (!only || only === fid) console.log(fid, JSON.stringify(measure(G, fid)));
}
