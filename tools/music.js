// Muzyka tła w przeglądarce (Punkt 16): moduł Music — cztery utwory (po jednym na nację) o długości 170–260 s, kompozytor deterministyczny, z nowym wariantem w każdym obiegu pętli,
// poprawne zdarzenia (kolejność, zakresy, brak NaN, co najmniej 3 głosy), render offline 30-sekundowego wycinka (szczyt, RMS, brak ciszy), interfejs (poziomy, cykl, wyciszenie, zapis w localStorage),
// pozycja „Muzyka: …” w menu Esc i klawisz M w grze oraz brak błędów JS. Progi są tolerancyjne — strojenie utworów zmienia tylko liczby (długości, głośności).
// Użycie: node tools/music.js [plik.html]   (render 4 × 30 s trwa ok. minuty)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), file = 'file://' + path.resolve(process.argv[2] || 'Nova_Roma.html');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✘ ' + m); } return c; };
const NATIONS = ['franks', 'saracens', 'vikings', 'slavs'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); };

  // ---------- 1–5: moduł Music bez gry (menu główne) ----------
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } }); watch(p);
  await p.goto(file + '?menu=1'); await p.waitForFunction(() => typeof Music !== 'undefined', null, { timeout: 60000 });
  ok(await p.evaluate(() => Music.pieces().slice().sort().join()) === NATIONS.slice().sort().join(), 'Music.pieces() zawiera cztery nacje');

  for (const n of NATIONS) {
    const c = await p.evaluate(n => {
      const a = Music.compose(n, 0), a2 = Music.compose(n, 0), l1 = Music.compose(n, 1), ev = a.events, voices = new Set(ev.map(e => e.v));
      let sorted = true, inRange = true, pitch = true, dur = true, gain = true, finite = true;
      for (let i = 0; i < ev.length; i++) {
        const e = ev[i]; if (i && ev[i - 1].t > e.t) sorted = false;
        if (!(e.t >= 0 && e.t <= a.len)) inRange = false; if (!(e.n >= 24 && e.n <= 100)) pitch = false; if (!(e.d > 0)) dur = false; if (!(e.g > 0 && e.g <= 1.5)) gain = false;
        if (![e.t, e.n, e.d, e.g].every(Number.isFinite)) finite = false;
      }
      return { len: a.len, name: a.name, bars: a.bars, count: ev.length, same: JSON.stringify(a) === JSON.stringify(a2), differs: JSON.stringify(a.events) !== JSON.stringify(l1.events), lenNext: l1.len,
        voices: [...voices], sorted, inRange, pitch, dur, gain, finite, rng: typeof RNG !== 'undefined' };
    }, n);
    ok(c.len >= 170 && c.len <= 260, `${n}: długość utworu 170–260 s (${c.len.toFixed(1)} s, ${c.bars} taktów, „${c.name}”)`);
    ok(c.same, `${n}: dwa wywołania compose(${n}, 0) dają identyczny wynik`);
    ok(c.differs, `${n}: obieg 1 różni się od obiegu 0`);
    ok(c.lenNext >= 170 && c.lenNext <= 260, `${n}: obieg 1 też mieści się w 170–260 s (${c.lenNext.toFixed(1)} s)`);
    ok(c.count > 200, `${n}: utwór ma sporo zdarzeń (${c.count})`);
    ok(c.sorted, `${n}: zdarzenia posortowane po t`);
    ok(c.inRange, `${n}: wszystkie t w [0, len]`);
    ok(c.pitch, `${n}: wszystkie nuty w zakresie MIDI 24–100`);
    ok(c.dur, `${n}: wszystkie czasy trwania d > 0`);
    ok(c.gain, `${n}: wszystkie siły g w (0, 1,5]`);
    ok(c.finite, `${n}: brak NaN i nieskończoności w zdarzeniach`);
    ok(c.voices.length >= 3, `${n}: co najmniej 3 różne głosy (${c.voices.join(', ')})`);
  }

    // kompozytor ma własny PRNG: ciąg liczb globalnego RNG gry po compose jest taki sam jak bez niego
  const rngOk = await p.evaluate(() => {
    if (typeof RNG === 'undefined' || typeof RNG.seed !== 'function') return null;
    RNG.seed(4242); const ref = [RNG.next(), RNG.next(), RNG.next()];
    RNG.seed(4242); const x = RNG.next(); Music.compose('franks', 0); Music.compose('slavs', 3); const y = RNG.next(), z = RNG.next();
    return ref[0] === x && ref[1] === y && ref[2] === z;
  });
  if (rngOk !== null) ok(rngOk, 'compose nie rusza globalnego RNG gry (ciąg liczb bez zmian)');

  // ---------- 4: render offline 30 s od 60. sekundy ----------
  for (const n of NATIONS) {
    const t0 = Date.now();
    const r = await p.evaluate(async n => {
      const o = await Music.render(n, 0, 30, 22050, 60), L = o.left, R = o.right, N = L.length, sr = o.sampleRate, win = sr * 5;
      let peak = 0, nan = 0, sum = 0; for (let i = 0; i < N; i++) { const l = L[i], r = R[i]; if (!Number.isFinite(l) || !Number.isFinite(r)) { nan++; continue; } peak = Math.max(peak, Math.abs(l), Math.abs(r)); sum += (l * l + r * r) / 2; }
      const db = x => 10 * Math.log10(x + 1e-12), wins = [];
      for (let w = 0; w + win <= N; w += win) { let s = 0; for (let i = w; i < w + win; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2; wins.push(db(s / win)); }
      return { N, sr: o.sampleRate, peak, nan, rms: db(sum / N), wins };
    }, n);
    const minWin = Math.min(...r.wins);
    ok(r.N === 30 * 22050 && r.sr === 22050, `${n}: render zwraca 30 s przy 22050 Hz (${r.N} próbek)`);
    ok(r.nan === 0, `${n}: render bez NaN (${r.nan})`);
    ok(r.peak <= 0.95, `${n}: szczyt ≤ 0,95 (${r.peak.toFixed(3)})`);
    ok(r.rms >= -40 && r.rms <= -12, `${n}: RMS między −40 a −12 dBFS (${r.rms.toFixed(1)} dBFS)`);
    ok(minWin > -60, `${n}: żadne 5-sekundowe okno nie jest ciche (najcichsze ${minWin.toFixed(1)} dBFS; okna ${r.wins.map(x => x.toFixed(0)).join(' ')})`);
    console.log(`    ${n}: render ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }

  // ---------- 5: interfejs ----------
  await p.evaluate(() => localStorage.removeItem('novaroma.music'));
  ok(await p.evaluate(() => Music.levels()) === 4, 'Music.levels() = 4');
  const cyc = await p.evaluate(() => { Music.setLevel(0); const seen = [Music.level()]; for (let i = 0; i < 4; i++) { Music.cycle(); seen.push(Music.level()); } return { seen, names: [0, 1, 2, 3].map(i => { Music.setLevel(i); return Music.levelName(); }) }; });
  ok(cyc.seen.join() === '0,1,2,3,0', `cycle() przechodzi przez poziomy 0→1→2→3 i wraca do 0 (${cyc.seen.join('→')})`);
  ok(cyc.names.join('|') === 'Wył.|Cicho|Średnio|Głośno', `nazwy poziomów: ${cyc.names.join('|')}`);
  const tg = await p.evaluate(() => { Music.setLevel(2); const a = Music.level(); Music.toggle(); const off = Music.level(), offName = Music.levelName(); Music.toggle(); return { a, off, offName, back: Music.level() }; });
  ok(tg.off === 0 && tg.offName === 'Wył.', `toggle() wycisza (poziom ${tg.a} → ${tg.off}, „${tg.offName}”)`);
  ok(tg.back > 0, `drugie toggle() przywraca dźwięk (poziom ${tg.back})`);
  const sv = await p.evaluate(() => { Music.setLevel(3); const s3 = JSON.parse(localStorage.getItem('novaroma.music')); Music.setLevel(1); const s1 = JSON.parse(localStorage.getItem('novaroma.music')); return [s3 && s3.level, s1 && s1.level]; });
  ok(sv[0] === 3 && sv[1] === 1, `ustawienie zapisuje się w localStorage['novaroma.music'] ({level}: ${sv.join(', ')})`);
  await p.evaluate(() => Music.setLevel(2));
  // zapis jest odczytywany po przeładowaniu
  await p.evaluate(() => Music.setLevel(3)); await p.reload(); await p.waitForFunction(() => typeof Music !== 'undefined', null, { timeout: 60000 });
  ok(await p.evaluate(() => Music.level()) === 3, 'po przeładowaniu strony poziom wraca z localStorage');
  await p.evaluate(() => Music.setLevel(2));
  await p.close();

  // ---------- 6: muzyka w grze, menu Esc i klawisz M ----------
  const g = await b.newPage({ viewport: { width: 1280, height: 800 } }); watch(g);
  await g.goto(file + '?menu=0&play=franks&seed=7'); await g.waitForFunction(() => window.__gameReady, null, { timeout: 90000 });
  await g.evaluate(() => Music.setLevel(2));
  ok(await g.evaluate(() => Music.state().armed) === 'franks', 'po starcie gry Music.state().armed === \'franks\'');
  await g.keyboard.press('Escape'); await g.waitForTimeout(300);
  const btn = g.locator('#pmList [data-id=music]');
  ok(await btn.count() === 1, 'menu Esc ma przycisk [data-id=music]');
  const t0 = await btn.innerText();
  ok(/^Muzyka: /.test(t0) && t0 === 'Muzyka: Średnio', `tekst przycisku to „Muzyka: …” (${t0})`);
  await btn.click(); await g.waitForTimeout(200);
  const t1 = await btn.innerText();
  ok(t1 !== t0 && /^Muzyka: /.test(t1), `kliknięcie zmienia tekst (${t0} → ${t1})`);
  ok(t1 === 'Muzyka: ' + await g.evaluate(() => Music.levelName()), 'tekst przycisku zgadza się z Music.levelName()');
  ok(await g.evaluate(() => JSON.parse(localStorage.getItem('novaroma.music')).level) === await g.evaluate(() => Music.level()), 'kliknięcie zapisuje poziom w localStorage');
  await g.keyboard.press('Escape'); await g.waitForTimeout(300);
  ok(await g.evaluate(() => Menu.mode()) == null, 'Esc zamyka menu pauzy');
  const l0 = await g.evaluate(() => { Music.setLevel(2); return Music.level(); });
  await g.keyboard.press('m'); await g.waitForTimeout(150);
  const l1 = await g.evaluate(() => Music.level());
  ok(l1 !== l0 && l1 === 0, `klawisz M przy zamkniętym menu wycisza (poziom ${l0} → ${l1})`);
  await g.keyboard.press('M'); await g.waitForTimeout(150);
  ok(await g.evaluate(() => Music.level()) > 0, 'ponowne M przywraca dźwięk');
  // M w otwartym menu nie przełącza
  await g.evaluate(() => Music.setLevel(2)); await g.keyboard.press('Escape'); await g.waitForTimeout(300); await g.keyboard.press('m'); await g.waitForTimeout(150);
  ok(await g.evaluate(() => Music.level()) === 2, 'M przy otwartym menu nie zmienia poziomu');
  await g.keyboard.press('Escape'); await g.waitForTimeout(300);
  // pierwszy gest użytkownika uruchamia dźwięk (kontekst audio powstaje po geście)
  await g.mouse.click(640, 400); await g.waitForTimeout(800);
  const stt = await g.evaluate(() => Music.state());
  ok(stt.armed === 'franks' && stt.ctx != null, `po geście powstaje kontekst audio (ctx: ${stt.ctx}, nacja: ${stt.nation})`);
  await g.waitForTimeout(1500);
  await g.evaluate(() => Music.setLevel(2));
  ok(errs.length === 0, `brak błędów JS ${errs.slice(0, 3).join(' | ')}`);
  await g.close();

  await b.close(); console.log(fails ? `\n✘ ${fails} z ${checks} nie przeszło` : `\n✔ Wszystko OK (${checks} sprawdzeń)`); process.exit(fails ? 1 : 0);
})();
