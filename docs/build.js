#!/usr/bin/env node
'use strict';
/* Budowa dokumentacji: docs/chapters/*.md → HTML → PDF (Chromium z Playwrighta). Dane (tabele, wykresy, wartości {{v:…}}) liczone z kodu gry.
   Użycie:
     node docs/build.js            — pełny PDF docs/Nova_Roma_dokumentacja.pdf (dwa przebiegi: numery stron w spisie treści)
     node docs/build.js --html     — tylko docs/_build.html (podgląd)
     node docs/build.js --check    — sprawdza dyrektywy, opisy pól stanu i odwołania; kod wyjścia 1 przy błędach */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const md = require('./md');
const T = require('./tables');

const ROOT = path.resolve(__dirname, '..');
const DOCS = __dirname;
const OUT_PDF = path.join(DOCS, 'Nova_Roma_dokumentacja.pdf');
const OUT_HTML = path.join(DOCS, '_build.html');
const FRONT_HTML = path.join(DOCS, '_front.html');
const args = process.argv.slice(2);
const MODE = args.includes('--check') ? 'check' : args.includes('--html') ? 'html' : 'pdf';

const meta = JSON.parse(fs.readFileSync(path.join(DOCS, 'meta.json'), 'utf8'));
const git = c => { try { return cp.execSync('git ' + c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { return ''; } };
const commit = git('rev-parse --short HEAD') || 'brak', commitDate = git('log -1 --format=%cd --date=short') || '';
const dirty = git('status --porcelain -- Nova_Roma.html tools prototyp').length > 0;
const today = new Date().toISOString().slice(0, 10);

/* ---------- rozdziały ---------- */
function loadChapters() {
  const dir = path.join(DOCS, 'chapters');
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().map(f => {
    const m = /^([0-9A-Za-z]+)_(.*)\.md$/.exec(f), text = fs.readFileSync(path.join(dir, f), 'utf8');
    const h = /^#\s+(.*?)(?:\s*\{#([\w-]+)\})?\s*$/m.exec(text);
    if (!m || !h) throw new Error('rozdział ' + f + ': nazwa NN_nazwa.md i nagłówek # …');
    const label = /^\d+$/.test(m[1]) ? String(parseInt(m[1], 10)) : m[1];
    return { file: f, label, title: h[1], md: text };
  });
}

const stripMark = s => String(s).replace(/`/g, '').replace(/\*\*?/g, '').replace(/\{\{[^}]*\}\}/g, '');

/* ---------- konwersja wszystkich rozdziałów (dwa przebiegi: odwołania {{ref:id}} mogą wskazywać dalej) ---------- */
function convertAll(chapters, refs) {
  const state = { headings: [], refs: {}, tables: 0, figures: 0, warnings: [], errors: [] };
  const hooks = {
    inline(kind, arg) {
      try {
        if (kind === 'v') return md.esc(T.evalV(arg));
        const h = refs && refs[arg];
        if (!h) { if (refs) state.errors.push('odwołanie do nieznanego id: ' + arg); return '§?'; }
        return '<a href="#' + h.id + '">§' + h.num + '</a>';
      } catch (e) { state.errors.push('{{' + kind + ':' + arg + '}}: ' + e.message); return '<b class="err">[błąd]</b>'; }
    },
    block(name, arg, st) {
      try { return T.block(name, arg, st); } catch (e) { state.errors.push('{{' + name + ':' + arg + '}}: ' + e.message); return '<p class="err">[błąd dyrektywy ' + name + ']</p>'; }
    }
  };
  const html = chapters.map(c => md.convert(c, state, hooks));
  return { state, html };
}

/* ---------- składanie dokumentu ---------- */
function cssStr(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
function tocHtml(state, pages) {
  const items = state.headings.filter(h => h.lvl <= 2);
  return '<section class="toc"><h1>Spis treści</h1>' + items.map(h => {
    const p = pages ? (pages[h.id] || '') : '00';
    return '<a class="l' + h.lvl + '" href="#' + h.id + '"><span class="t"><span class="num">' + h.num + (h.lvl === 1 && /^\d+$/.test(h.num) ? '.' : '') + '</span>' + md.esc(stripMark(h.text)) + '</span><span class="dots"></span><span class="p">' + p + '</span></a>';
  }).join('') + '</section>';
}
function coverHtml() {
  return '<section class="cover"><svg class="emb" viewBox="0 0 120 120"><g fill="none" stroke="#d6a64a" stroke-width="1.6"><circle cx="60" cy="60" r="54"/><circle cx="60" cy="60" r="46" stroke-width=".8"/>' +
    '<path d="M28 82 V52 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 V82 Z"/><path d="M52 82 V66 a8 8 0 0 1 16 0 V82"/><path d="M60 28 V16 l12 4 -12 4"/></g></svg>' +
    '<div class="wm">NOVA ROMA<small>DOKUMENTACJA PROJEKTU</small></div><div class="band"></div>' +
    '<div class="sub">Logika, zasady, zależności modułów i decyzje projektowe gry strategiczno-ekonomicznej w jednym pliku HTML.<br>Cztery nacje: Frankowie, Saraceni, Wikingowie, Słowianie.</div>' +
    '<div class="meta"><b>Wersja dokumentu:</b> ' + md.esc(meta.wersja) + ' · <b>Zbudowano:</b> ' + today + '<br><b>Stan kodu:</b> commit ' + commit + (commitDate ? ' z ' + commitDate : '') + (dirty ? ' (+ zmiany robocze)' : '') + '<br><b>Stan projektu:</b> ' + md.esc(meta.stan) + '<br><br>' +
    '<b>Opracowano na podstawie:</b> kodu <i>Nova_Roma.html</i> i narzędzi <i>tools/</i>; dokumentu „Ekonomia „Nova Roma” — wersja finalna”; dokumentu „Nova Roma — specyfikacja ekonomii do wdrożenia” (v3.2 / v3.6); planu faz i decyzji projektowych podjętych w trakcie prac.</div></section>';
}
function pageRules(chapters) {
  return chapters.map(c => '@page ch_' + c.label + ' { @top-right { content: ' + cssStr(c.label + (/^\d+$/.test(c.label) ? '. ' : ' — ') + c.title) + '; font: 7.5pt "Liberation Sans", sans-serif; color: #7a8594; } }').join('\n');
}
function assemble(chapters, conv, pages, frontOnly) {
  const css = fs.readFileSync(path.join(DOCS, 'style.css'), 'utf8') + '\nbody { font-variant-ligatures: none; }\n.err { color: #b00020; background: #ffe5e9; }\n' + pageRules(chapters);
  const body = coverHtml() + tocHtml(conv.state, pages) + (frontOnly ? '' : chapters.map((c, i) => '<section class="chapter" style="page:ch_' + c.label + '">' + conv.html[i] + '</section>').join('\n'));
  return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Nova Roma — dokumentacja projektu</title><style>' + css + '</style></head><body>' + body + '</body></html>';
}

/* ---------- PDF ---------- */
let pw = null;
function playwright() { if (pw) return pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); } return pw; }
async function toPdf(browser, htmlFile, outFile) {
  const page = await browser.newPage();
  await page.goto('file://' + htmlFile, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: outFile, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
  await page.close();
}
const pdfPages = f => parseInt(/Pages:\s+(\d+)/.exec(cp.execSync('pdfinfo "' + f + '"', { encoding: 'utf8' }))[1], 10);
const pageTexts = f => cp.execSync('pdftotext -layout "' + f + '" -', { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\f').map(t => t.replace(/[ﬁﬂﬀﬃﬄ]/g, m => ({ 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl' }[m])).replace(/\s+/g, ''));
function locateHeadings(file, state, front) {
  const texts = pageTexts(file), pages = {}, missing = []; let from = front;
  for (const h of state.headings.filter(x => x.lvl <= 2)) {
    const needle = (h.num + (h.lvl === 1 && /^\d+$/.test(h.num) ? '.' : '') + stripMark(h.text)).replace(/\s+/g, '');
    let found = 0;
    for (let p = Math.max(from, front); p < texts.length; p++) if (texts[p].includes(needle)) { found = p + 1; break; }
    if (found) { pages[h.id] = found; from = found - 1; } else missing.push(h.num + ' ' + h.text);
  }
  return { pages, missing };
}

async function main() {
  const chapters = loadChapters();
  const first = convertAll(chapters, null);
  const conv = convertAll(chapters, first.state.refs);
  const problems = [...first.state.errors.filter(e => !/nieznanego id/.test(e)), ...conv.state.errors, ...conv.state.warnings];
  if (problems.length) { console.error('PROBLEMY:\n - ' + [...new Set(problems)].join('\n - ')); if (MODE === 'check') process.exit(1); }
  if (MODE === 'check') { console.log('OK: ' + chapters.length + ' rozdziałów, ' + conv.state.headings.length + ' nagłówków, ' + conv.state.tables + ' tabel, ' + conv.state.figures + ' rysunków'); return; }
  fs.writeFileSync(OUT_HTML, assemble(chapters, conv, null, false));
  if (MODE === 'html') { console.log('zapisano ' + OUT_HTML); return; }

  const browser = await playwright().chromium.launch({ args: ['--no-sandbox'] });
  try {
    fs.writeFileSync(FRONT_HTML, assemble(chapters, conv, null, true));
    const frontPdf = path.join(DOCS, '_front.pdf'); await toPdf(browser, FRONT_HTML, frontPdf);
    const front = pdfPages(frontPdf); fs.unlinkSync(frontPdf); fs.unlinkSync(FRONT_HTML);
    let pages = null, tmp = path.join(DOCS, '_pass.pdf'), pass = 0;
    for (; pass < 4; pass++) {
      fs.writeFileSync(OUT_HTML, assemble(chapters, conv, pages, false));
      await toPdf(browser, OUT_HTML, tmp);
      const r = locateHeadings(tmp, conv.state, front);
      if (r.missing.length) console.warn('nie znaleziono w PDF: ' + r.missing.join('; '));
      if (pages && JSON.stringify(r.pages) === JSON.stringify(pages)) break;
      pages = r.pages;
    }
    fs.copyFileSync(tmp, OUT_PDF); fs.unlinkSync(tmp);
    console.log('PDF: ' + path.relative(ROOT, OUT_PDF) + ' — ' + pdfPages(OUT_PDF) + ' stron (okładka + spis: ' + front + '), ' + conv.state.tables + ' tabel, ' + conv.state.figures + ' rysunków, przebiegi: ' + (pass + 1));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
