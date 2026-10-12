#!/usr/bin/env node
'use strict';
/* Zbiera wyniki testów do docs/data/wyniki_testow.json (używane przez tabele wyniki_normalna i wyniki_scenariusze w dokumentacji).
   node docs/collect.js                       — uruchamia tools/normal.js (~5 min) i tools/scenarios.js (~1,5 min)
   node docs/collect.js --parse n.txt s.txt   — tylko parsuje gotowe wyjścia (np. z regress.sh / baseline) */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);

function get(file, script) {
  if (file) return fs.readFileSync(file, 'utf8');
  console.error('uruchamiam ' + script + ' …');
  return cp.execFileSync('node', [path.join(ROOT, 'tools', script)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
}
const parse = argv[0] === '--parse';
const normalTxt = get(parse ? argv[1] : null, 'normal.js'), scenTxt = get(parse ? argv[2] : null, 'scenarios.js');

const normal = [];
for (const l of normalTxt.split('\n')) {
  const m = /^(\w+)\s+(\w) e([\d.]+) (\w+)\s+pop@20\/40\/60\/90\/150: ([\d/]+)\s+koniec (\d+)\s+36@ (\S+)\s+głód (\d+)\s+haracz (\S+)\s+dost (\d+)\s+zł (\d+)\s+deski (\d+)/.exec(l);
  if (m) normal.push({ faction: m[1], bot: m[2], eps: +m[3], preset: m[4], pop: m[5].split('/').map(Number), end: +m[6], pop36: m[7] === 'null' ? null : +m[7], famine: +m[8], tribute: m[9], delivered: +m[10], gold: +m[11], planks: +m[12] });
}
const scenarios = [];
for (const l of scenTxt.split('\n')) {
  const m = /^([✔✘!?])\s+(\S+)\s+(.*?)\s+haracz (\S+)\s+lud @20\/40\/60\/90: ([\d/]+)\s+koniec (\d+)\s+min (\d+)\s+głód (\d+)\s+zł (\d+)/.exec(l);
  if (m) scenarios.push({ ok: m[1] === '✔', code: m[2], name: m[3].trim(), tribute: m[4], pop: m[5], end: +m[6], famine: +m[8], gold: +m[9] });
}
const sum = /Podsumowanie:\s*([^\n]*)/.exec(scenTxt);
if (!normal.length || !scenarios.length) { console.error('nie sparsowano wyników (normal: ' + normal.length + ', scenariusze: ' + scenarios.length + ')'); process.exit(1); }
let commit = ''; try { commit = cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { /* brak gita */ }
const out = { meta: { date: new Date().toISOString().slice(0, 10), commit, summary: sum ? sum[1].replace(/;\s*czas.*$/, '') : '' }, normal, scenarios };
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data', 'wyniki_testow.json'), JSON.stringify(out, null, 1) + '\n');
console.log('zapisano docs/data/wyniki_testow.json: ' + normal.length + ' wierszy normalnej gry, ' + scenarios.length + ' scenariuszy; ' + out.meta.summary);
