const { load } = require('./headless');
const G = load(process.argv[2] || 'Nova_Roma.html');
const facs = Object.keys(G.Data.FACTIONS);
for (const f of facs) {
  G.World.init(f);
  const s = G.World.state();
  const size = s.map.size, c = Math.floor(size/2);
  let trees = 0, water = 0, dep = {};
  let shoreSpots = 0, nearestShore = 99, shoreWithin = {8:0, 12:0, 16:0};
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const t = s.map.tiles[y*size+x];
    trees += t.trees; if (t.h === 0) water++;
    if (t.deposit) dep[t.deposit] = (dep[t.deposit]||0)+1;
    if (t.h === 1 && !t.occup && t.trees === 0 && !t.deposit) {
      let w = false;
      for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) { const n = G.MapGen.at(s.map, x+dx, y+dy); if (n && n.h === 0) w = true; }
      if (w) { shoreSpots++; const d = Math.hypot(x-c, y-c); nearestShore = Math.min(nearestShore, d); for (const R of [8,12,16]) if (d <= R) shoreWithin[R]++; }
    }
  }
  console.log(f.padEnd(9), 'drzew', trees, '/ cel', G.Data.FACTIONS[f].treesTarget, '| woda', water, '| złoża', JSON.stringify(dep),
    '| brzeg: pól', shoreSpots, 'najbliższy', nearestShore.toFixed(1), 'w promieniu 8/12/16:', shoreWithin[8], shoreWithin[12], shoreWithin[16]);
}
