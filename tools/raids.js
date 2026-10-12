// Napady na karawanę (Saraceni): rozkład strat po wielu ziarnach RNG; ze Strażnicami i bez.
const { load } = require('./headless');
const G = load('Nova_Roma.html');
const W = G.World, TB = G.TestBots, T = G.Tribute, RNG = G.RNG;
function run(seed, guards) {
  W.init('saracens'); const s = W.state(); T.set('custom', 3);
  RNG.seed(seed); // inne ziarno gry po wygenerowaniu mapy
  const plan = TB.RECIPE.saracens.slice();
  let pi = 0, nd = 0, added = false;
  for (let t = 0; t < 139.95; t += 0.1) { W.tick(0.1); if (!added && t >= 70) { added = true; plan.push(...Array(guards).fill('guardpost')); }  if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TB.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } }
  return { gold: Math.round(s.res.złoto), raids: s.raids.count, lost: Math.round(s.raids.lost), met: s.tribute.met + '/' + (s.tribute.met + s.tribute.missed) };
}
for (const g of [0, 1, 2]) {
  const rs = []; for (let seed = 1; seed <= 24; seed++) rs.push(run(seed * 7919, g));
  const avg = k => (rs.reduce((a, r) => a + r[k], 0) / rs.length).toFixed(1);
  console.log('Strażnic:', g, '| śr. złoto', avg('gold'), '| śr. napadów', avg('raids'), '| śr. strata', avg('lost'), '| 6/6 w', rs.filter(r => r.met === '6/6').length + '/24 ziaren');
}
