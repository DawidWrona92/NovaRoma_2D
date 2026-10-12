// Misja (Punkt 11): cel gry, komunikat po każdym terminie haraczu, zwycięstwo po N terminach, porażka po 3 niespełnionych z rzędu albo po wyludnieniu osady, podsumowanie; swobodna gra bez celów.
// Użycie: node tools/mission.js [plik.html]
const G = require('./headless').load(process.argv[2] || 'Nova_Roma.html');
const { World, Mission, Tribute, Data } = G;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails <= 30) console.log('  ✘ ' + msg); } return c; };
const run = (s, until, step = 0.5, hook) => { for (let t = 0; t < 400 && !until(s); t += step) { World.tick(step); if (hook) hook(s); } };

ok(JSON.stringify(Mission.GOAL) === '{"easy":6,"normal":8,"hard":10,"master":12}' && Mission.MAX_MISS === 3, 'cele: 6/8/10/12 terminów, porażka po 3 niespełnionych z rzędu');
for (const fid of ['franks', 'saracens', 'vikings', 'slavs']) ok(Mission.BRIEF[fid] && Mission.BRIEF[fid].length > 40, `${fid}: jest opis celu`);

// bez misji: haracz działa jak dotąd (żadnych komunikatów, stan misji pusty)
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 3 }); const s = World.state(); Tribute.set('easy');
  run(s, q => q.tribute.terms >= 2); ok(s.mission === null && s.tribute.terms >= 2, 'bez Mission.start misji nie ma, a haracz liczy terminy (' + s.tribute.terms + ')');
}
// porażka: nic nie robimy, trzy terminy z rzędu niespełnione
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 3 }); const s = World.state(); s.res.złoto = 0; Mission.start('normal'); const m = s.mission;
  ok(m.status === 'active' && m.goal === 8 && s.settings.mission === true && s.tribute.preset === 'normal', 'start misji Normalny: cel 8, haracz włączony');
  run(s, q => q.mission.status !== 'active');
  ok(m.status === 'lost' && m.streak >= 3, `porażka po ${m.streak} niespełnionych z rzędu (status ${m.status})`);
  const bad = m.msgs.filter(x => x.kind === 'bad'); ok(bad.length >= 3 && /niespełniony/.test(bad[0].title), 'komunikat po każdym niespełnionym terminie (' + bad.map(x => x.title).join(' | ') + ')');
  ok(/jeszcze jeden/.test(bad[1].text) || /jeszcze jeden/.test(bad[0].text) || /Nadrób/.test(bad[0].text), 'komunikat radzi, co dalej');
  ok(m.summary && m.summary.terms >= 3 && m.summary.missed >= 3 && m.summary.goal === 8 && m.reason.length > 10, 'podsumowanie z liczbami i powodem: ' + m.reason);
  const t0 = s.time; run(s, q => q.time > t0 + 20, 1); ok(m.status === 'lost', 'po porażce status nie zmienia się');
}
// zwycięstwo: haracz spełniany (dostawy sztucznie zawyżone)
{
  World.init('saracens', { climate: 'desert', type: 'plain', seed: 3 }); const s = World.state(); Mission.start('easy'); const m = s.mission;
  run(s, q => q.mission.status !== 'active', 0.5, q => { if (q.tribute) q.tribute.delivered = 1e9; });
  ok(m.status === 'won' && s.tribute.terms >= 6, `zwycięstwo po ${s.tribute.terms} terminach (cel 6)`);
  const good = m.msgs.filter(x => x.kind === 'good'); ok(good.length >= 7 && /spełniony/.test(good[0].title) && /Zwycięstwo/.test(good[good.length - 1].title), 'komunikaty: spełnione terminy i zwycięstwo (' + good.length + ')');
}
// dwa niespełnione, trzeci spełniony: seria się zeruje
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 3 }); const s = World.state(); Mission.start('hard'); const m = s.mission;
  Mission.onTerm(s, { n: 1, ok: false, required: 10, delivered: 0 }); Mission.onTerm(s, { n: 2, ok: false, required: 20, delivered: 0 }); ok(m.streak === 2 && m.status === 'active', 'dwa niespełnione z rzędu: gra trwa (seria 2)');
  Mission.onTerm(s, { n: 3, ok: true, required: 30, delivered: 30 }); ok(m.streak === 0 && m.status === 'active', 'spełniony termin zeruje serię');
}
// wyludnienie
{
  World.init('slavs', { climate: 'eastern', type: 'plain', seed: 3 }); const s = World.state(); Mission.start('easy'); run(s, q => q.time > 10, 1); s.pop = 0; World.tick(0.1);
  ok(s.mission.status === 'lost' && /wyludni/.test(s.mission.reason), 'wyludnienie osady kończy misję porażką: ' + s.mission.reason);
}
// ostrzeżenie przed terminem: raz na termin, WARN_MIN minut wcześniej, z liczbami i wskazówką
{
  World.init('franks', { climate: 'temperate', type: 'plain', seed: 3 }); const s = World.state(); s.res.złoto = 0; Mission.start('normal'); const seen = [];
  const UIo = G.UI; const orig = UIo.warnTerm; UIo.warnTerm = w => seen.push(w);
  run(s, q => q.time > 65, 0.5);
  ok(seen.length === 1 && seen[0].n === 1 && seen[0].remain <= Mission.WARN_MIN && seen[0].required > 0 && seen[0].need === seen[0].required - seen[0].delivered && /Koszar/.test(seen[0].hint), 'ostrzeżenie przed pierwszym terminem: raz, ' + JSON.stringify(seen[0] || {}).slice(0, 120));
  run(s, q => q.time > 80, 0.5); ok(seen.length === 2 && seen[1].n === 2, 'kolejne ostrzeżenie przed drugim terminem (razem ' + seen.length + ')');
  UIo.warnTerm = orig;
}
// swobodna gra
{
  World.init('vikings', { climate: 'snow', type: 'coast', seed: 3 }); const s = World.state(); Mission.start('hard'); Mission.free(); run(s, q => q.time > 140, 2);
  ok(s.mission.status === 'free' && s.tribute === null && s.settings.mission === false && s.settings.raids === false && !s.mission.msgs.length, 'wolne budowanie: bez haraczu, napadów, celów i komunikatów');
}
console.log(fails ? `\n✘ ${fails} z ${checks} sprawdzeń nie przeszło` : `Wszystko OK — ${checks} sprawdzeń`); process.exit(fails ? 1 : 0);
