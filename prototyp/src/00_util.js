'use strict';
/* ====================== NARZĘDZIA ====================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) { // mulberry32 — deterministyczny generator (te same tekstury za każdym razem)
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const scaleC = (c, f) => [clamp(c[0] * f, 0, 255), clamp(c[1] * f, 0, 255), clamp(c[2] * f, 0, 255)];
function ramp(stops, t) { // stops: [[pozycja, [r,g,b]], ...]
  t = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [p0, c0] = stops[i - 1], [p1, c1] = stops[i];
    return mixc(c0, c1, (t - p0) / ((p1 - p0) || 1));
  }
  return stops[stops.length - 1][1];
}
/* tablica kolorów (256 wpisów) zamiast liczenia rampy dla każdego piksela */
function lutRamp(stops, n = 256) { return Array.from({ length: n }, (_, i) => ramp(stops, i / (n - 1))); }
function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

/* drobny szum ziarna dodany do całej tekstury */
function addGrain(g, w, h, amt, seed) {
  const r = rng(seed || 1), im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(im, 0, 0);
}

/* szum wartościowy okresowy (kafelkowalny) i fbm */
function periodicNoise(size, cells, seed) {
  const r = rng(seed), L = new Float32Array(cells * cells);
  for (let i = 0; i < L.length; i++) L[i] = r();
  const out = new Float32Array(size * size), s = cells / size;
  for (let y = 0; y < size; y++) {
    const fy = y * s, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), yy0 = y0 % cells, yy1 = (y0 + 1) % cells;
    for (let x = 0; x < size; x++) {
      const fx = x * s, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xx0 = x0 % cells, xx1 = (x0 + 1) % cells;
      const a = L[yy0 * cells + xx0], b = L[yy0 * cells + xx1], c = L[yy1 * cells + xx0], d = L[yy1 * cells + xx1];
      out[y * size + x] = lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
    }
  }
  return out;
}
function fbm(size, cells, oct, seed) {
  const out = new Float32Array(size * size); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const n = periodicNoise(size, cells * (1 << o), seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

/* miękki cień/poświata: rysuje kształt poza płótnem i przesuwa jego cień (shadowBlur działa w każdej przeglądarce).
   Rozmycie i przesunięcie cienia nie podlegają macierzy, więc skalujemy je o mnożnik z bieżącej macierzy kontekstu. */
function softFill(g, pathFn, color, blur, dx = 0, dy = 0) {
  const OFF = 4000, R = g.getTransform().a || 1;
  g.save();
  g.shadowColor = color; g.shadowBlur = blur * R; g.shadowOffsetX = (OFF + dx) * R; g.shadowOffsetY = dy * R;
  g.translate(-OFF, 0);
  g.fillStyle = '#000'; g.beginPath(); pathFn(g); g.fill();
  g.restore();
}

/* LOD (mipmapy): przy oddaleniu rysujemy wstępnie pomniejszone kopie — bez poszarpanych krawędzi */
function lodHalf(c) {
  if (!c._h) {
    const h = newCanvas(Math.max(1, c.width >> 1), Math.max(1, c.height >> 1)), g = h.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, h.width, h.height); c._h = h;
  }
  return c._h;
}
function lodPick(c, ratio) { while (ratio >= 2 && c.width > 8 && c.height > 8) { c = lodHalf(c); ratio /= 2; } return c; }
