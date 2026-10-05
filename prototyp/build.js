'use strict';
/* Skleja prototyp/src/*.js w jeden samowystarczalny plik prototyp/grafika_prototyp.html */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const js = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(dir, f), 'utf8').replace(/^'use strict';\n/, '')).join('\n');
const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Nova Roma — próbka stylu graficznego</title>
<style>
html,body{margin:0;height:100%;background:#1c2a14;overflow:hidden;font-family:Georgia,'Times New Roman',serif;touch-action:none;-webkit-user-select:none;user-select:none}
canvas{display:block;cursor:grab;touch-action:none}
#cap{position:fixed;left:12px;top:10px;color:#f6ecd0;text-shadow:0 1px 3px #000,0 0 8px #000;pointer-events:none;max-width:70vw}
#cap b{font-size:clamp(15px,2.4vw,20px);letter-spacing:.5px}
#cap div{font-size:clamp(10px,1.5vw,12.5px);opacity:.9;margin-top:3px;line-height:1.35}
#st{position:fixed;right:10px;top:8px;color:#e8dcb8;font:11px/1.5 monospace;text-align:right;text-shadow:0 1px 2px #000;pointer-events:none;max-width:45vw}
#ui{position:fixed;right:12px;bottom:14px;display:flex;gap:8px;align-items:center}
#ui button{width:46px;height:46px;border-radius:10px;border:2px solid #d8b86a;background:rgba(40,28,14,.82);color:#f6ecd0;font:600 22px/1 Georgia,serif;cursor:pointer;padding:0;box-shadow:0 2px 6px rgba(0,0,0,.5)}
#ui button:active{background:rgba(90,64,28,.9)} #ui button.on{background:#b8902c;color:#2a1c08}
#zl{min-width:48px;text-align:center;color:#f6ecd0;font:12px monospace;text-shadow:0 1px 2px #000}
@media (max-width:640px){#leg,#cap div{display:none} #st{top:auto;bottom:74px;left:10px;right:auto;text-align:left;font-size:9px;max-width:60vw} #ui button{width:44px;height:44px} #cap{max-width:80vw}}
#load{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1c2a14;color:#f6ecd0;z-index:10}
#lbar{width:min(320px,70vw);height:12px;border:2px solid #d8b86a;border-radius:8px;overflow:hidden;margin-top:14px;background:#2a1c08}
#lbar i{display:block;height:100%;width:0;background:linear-gradient(#e8c25a,#b8902c)}
#leg{position:fixed;left:12px;bottom:12px;color:#f0e4c0;font-size:11.5px;text-shadow:0 1px 3px #000,0 0 6px #000;pointer-events:none;max-width:55vw;line-height:1.35}
</style></head><body>
<canvas id="cv"></canvas>
<div id="load"><b style="font-size:22px;letter-spacing:1px">Nova Roma</b><div id="ltxt" style="margin-top:8px;font-size:13px;opacity:.85">Wypiekanie grafiki…</div><div id="lbar"><i></i></div></div>
<div id="cap"><b>Nova Roma — próbka nowego stylu (v2)</b><div>Każdy budynek mieści się w jednym polu · Słowianie, Frankowie, Saraceni, Wikingowie · wszystko rysowane kodem</div></div>
<div id="st"><span id="fps"></span><br><span id="bake"></span></div>
<div id="leg">Kółko / szczypanie — zoom · przeciągnięcie — przesuwanie · G — siatka pól</div>
<div id="ui"><span id="zl"></span><button id="zout" aria-label="Oddal">−</button><button id="zin" aria-label="Przybliż">+</button><button id="zreset" aria-label="Domyślny widok">⟲</button><button id="grid" aria-label="Siatka pól">▦</button></div>
<script>
${js}
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, 'grafika_prototyp.html'), html);
console.log('OK', (html.length / 1024).toFixed(1) + ' KB');
