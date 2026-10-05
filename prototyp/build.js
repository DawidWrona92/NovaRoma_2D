'use strict';
/* Skleja prototyp/src/*.js w jeden samowystarczalny plik prototyp/grafika_prototyp.html */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const js = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(dir, f), 'utf8').replace(/^'use strict';\n/, '')).join('\n');
const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nova Roma — próbka stylu graficznego</title>
<style>
html,body{margin:0;height:100%;background:#1c2a14;overflow:hidden;font-family:Georgia,'Times New Roman',serif}
canvas{display:block;cursor:grab}
#cap{position:fixed;left:14px;top:12px;color:#f6ecd0;text-shadow:0 1px 3px #000,0 0 8px #000;pointer-events:none;max-width:60vw}
#cap b{font-size:20px;letter-spacing:.5px}
#cap div{font-size:12.5px;opacity:.9;margin-top:3px}
#st{position:fixed;right:12px;top:10px;color:#e8dcb8;font:11.5px/1.5 monospace;text-align:right;text-shadow:0 1px 2px #000;pointer-events:none}
#leg{position:fixed;left:14px;bottom:12px;color:#f0e4c0;font-size:12px;text-shadow:0 1px 3px #000,0 0 6px #000;pointer-events:none}
</style></head><body>
<canvas id="cv"></canvas>
<div id="cap"><b>Nova Roma — próbka nowego stylu</b><div>Słowianie (zrąb + strzecha) · Frankowie (ryglówka + wieża) · Saraceni (piaskowiec + meczet) · Wikingowie (długi dom + okręt) — wszystko rysowane kodem, bez plików graficznych</div></div>
<div id="st"><span id="fps"></span><br><span id="bake"></span></div>
<div id="leg">Kółko myszy — zbliżenie · przeciągnij — przesuń · ruchome: woda, dym, drzewa, mieszkańcy</div>
<script>
${js}
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, 'grafika_prototyp.html'), html);
console.log('OK', (html.length / 1024).toFixed(1) + ' KB');
