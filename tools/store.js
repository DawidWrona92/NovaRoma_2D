const { load } = require('./headless');
const G = load('Nova_Roma.html');
// efekt Składu na wysokich poziomach: bez Składu vs ze Składem
const TB = G.TestBots, W = G.World, T = G.Tribute;
function run(level, store) {
  W.init('slavs'); const s = W.state(); T.set('custom', level);
  const plan = TB.RECIPE.slavs.filter(x => store || x !== 'store'); let pi = 0, nd = 0;
  for (let t = 0; t < 149.9; t += 0.1) { W.tick(0.1); if (t >= nd) { nd = t + 0.5; if (pi < plan.length) { const r = TB.tryBuild(s, plan[pi]); if (r === 'built' || r === 'noplace') pi++; } } }
  return s.tribute.met + '/' + (s.tribute.met + s.tribute.missed);
}
for (const L of [6, 7, 8]) console.log('poziom', L, 'ze Składem', run(L, true), '| bez Składu', run(L, false));
