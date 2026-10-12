// Analiza muzyki (Punkt 16): renderuje utwór nacji offline (OfflineAudioContext w Chromium) i drukuje długość, liczbę zdarzeń wg głosów, szczyt, głośność RMS, głośność co 10 s, środek ciężkości widma
// i udział energii poniżej 300 Hz; zapisuje spektrogram (PNG) i podgląd (WAV 22,05 kHz mono) do katalogu $OUT (domyślnie tymczasowy).
// Użycie: [OUT=katalog] node tools/music_analyze.js [franks|saracens|vikings|slavs]
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs'); const path = require('path'), SP = process.env.OUT || require('os').tmpdir(), FILE = 'file://' + path.resolve(__dirname, '..', 'Nova_Roma.html'); fs.mkdirSync(SP, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE + '?menu=1'); await p.waitForTimeout(1500);
  const nations = process.argv[2] ? [process.argv[2]] : ['franks', 'saracens', 'vikings', 'slavs'];
  for (const n of nations) {
    const t0 = Date.now();
    const r = await p.evaluate(async (n) => {
      const c = Music.compose(n, 0), sr = 22050, o = await Music.render(n, 0, c.len, sr), L = o.left, R = o.right, N = L.length;
      const mono = new Float32Array(N); let peak = 0, sum = 0; for (let i = 0; i < N; i++) { mono[i] = (L[i] + R[i]) / 2; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); sum += mono[i] * mono[i]; }
      const win = sr * 10, wr = []; for (let w = 0; w + win <= N; w += win) { let s = 0; for (let i = w; i < w + win; i++) s += mono[i] * mono[i]; wr.push(+(10 * Math.log10(s / win + 1e-12)).toFixed(1)); }
      // widmo: FFT 2048 co 1 s → centroid i energia < 300 Hz
      const F = 2048, re = new Float32Array(F), im = new Float32Array(F), cent = [], spec = [];
      const fft = () => { for (let i = 1, j = 0; i < F; i++) { let bit = F >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
        for (let len = 2; len <= F; len <<= 1) { const ang = -2 * Math.PI / len, wr_ = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < F; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const nr = cr * wr_ - ci * wi; ci = cr * wi + ci * wr_; cr = nr; } } } };
      let lowE = 0, totE = 0;
      for (let s = 0; s + F < N; s += sr) { for (let i = 0; i < F; i++) { re[i] = mono[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / F)); im[i] = 0; } fft(); let num = 0, den = 0; const row = []; for (let k = 1; k < F / 2; k++) { const m = Math.hypot(re[k], im[k]), f = k * sr / F; num += f * m; den += m; if (f < 300) lowE += m * m; totE += m * m; if (k % 4 === 0) row.push(m); } cent.push(den ? num / den : 0); spec.push(row); }
      // spektrogram → PNG
      const cv = document.createElement('canvas'), W = Math.min(spec.length, 1200), H = 128; cv.width = W; cv.height = H; const g = cv.getContext('2d'), mx = Math.max(...spec.flat());
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const row = spec[Math.floor(x * spec.length / W)], bin = Math.floor((H - 1 - y) * 1.5 * row.length / H / 1.5 / 3 * 1.0); const v = Math.log10(1 + 40 * (row[Math.min(row.length - 1, Math.floor((H - 1 - y) / H * row.length * 0.55))] / mx)) / Math.log10(41); g.fillStyle = `rgb(${Math.round(255 * v)},${Math.round(190 * v * v)},${Math.round(80 * v)})`; g.fillRect(x, y, 1, 1); }
      // WAV 16-bit mono
      const pcm = new Int16Array(N); for (let i = 0; i < N; i++) pcm[i] = Math.max(-1, Math.min(1, mono[i])) * 32767; let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      const voices = {}; for (const e of c.events) voices[e.v] = (voices[e.v] || 0) + 1;
      return { len: c.len, bars: c.bars, events: c.events.length, voices, peak: +peak.toFixed(3), rms: +(10 * Math.log10(sum / N)).toFixed(1), win: wr, centroid: +(cent.reduce((a, b) => a + b, 0) / cent.length).toFixed(0), low: +(lowE / totE).toFixed(2), png: cv.toDataURL('image/png'), pcm: btoa(bin), sr };
    }, n);
    fs.writeFileSync(`${SP}/${n}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
    const pcm = Buffer.from(r.pcm, 'base64'), h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(r.sr, 24); h.writeUInt32LE(r.sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(`${SP}/${n}.wav`, Buffer.concat([h, pcm]));
    console.log(n, `len ${r.len.toFixed(1)}s bars ${r.bars} events ${r.events} peak ${r.peak} rms ${r.rms}dB centroid ${r.centroid}Hz low<300 ${r.low} render ${((Date.now() - t0) / 1000).toFixed(0)}s`); console.log('  voices', JSON.stringify(r.voices)); console.log('  win dB', r.win.join(' '));
  }
  console.log('errors', errs); await b.close();
})();
