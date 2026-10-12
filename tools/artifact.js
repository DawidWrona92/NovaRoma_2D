// Buduje wersję gry do opublikowania jako artefakt (claude.ai): strona bez <!doctype>, <html>, <head>, <body> i metatagów (opakowanie dokłada je przy publikacji).
// Użycie: node tools/artifact.js [plik_wyjściowy]   (domyślnie /tmp/Nova_Roma_artefakt.html)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', 'Nova_Roma.html'), 'utf8');
let out = src.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<head>\s*/i, '').replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '').replace(/<\/html>\s*$/i, '\n');
if (!/<title>[^<]+<\/title>/.test(out.slice(0, 8192))) throw new Error('brak <title> w pierwszych 8 KB');
for (const bad of ['<!doctype', '<html', '<head', '<body']) if (out.toLowerCase().includes(bad)) throw new Error('została znaczniki dokumentu: ' + bad);
const dest = process.argv[2] || '/tmp/Nova_Roma_artefakt.html';
fs.writeFileSync(dest, out); console.log('artefakt:', dest, (out.length / 1024).toFixed(0) + ' KB');
