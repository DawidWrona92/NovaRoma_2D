'use strict';
/* Minimalny konwerter Markdown → HTML na potrzeby dokumentacji (bez zależności).
   Obsługuje: nagłówki (# … ####, z {#id}), akapity, **pogrubienie**, *kursywę*, `kod`, [łącza](url), listy (zagnieżdżone, numerowane),
   tabele (| a | b |, wyrównanie :---:), bloki kodu ```, cytaty i ramki [!typ], poziome linie, obrazy ![alt](plik "podpis"),
   surowe bloki HTML (linia zaczynająca się od `<`), dyrektywy blokowe {{nazwa:arg}} i śródwierszowe {{v:wyrażenie}} / {{ref:id}} (obsługuje je wywołujący przez `hooks`).
   Numeracja nagłówków: H1 = etykieta rozdziału (np. „4”, „A”), H2 = „4.1”, H3 = „4.1.1”; H4 bez numeru. */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => String(s).toLowerCase().replace(/[ąćęłńóśźż]/g, c => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CALLOUT = { uwaga: 'Uwaga', decyzja: 'Decyzja projektowa', spec: 'Specyfikacja', kod: 'W kodzie', test: 'Test', wazne: 'Ważne', pulapka: 'Pułapka', historia: 'Historia' };

/* wartości śródwierszowe: {{v:…}} i {{ref:…}} → placeholder, potem podstawienie po ucieczce znaków */
function makeInline(hooks) {
  return function inline(src) {
    const keep = [];
    const hold = html => { keep.push(html); return '\u0001' + (keep.length - 1) + '\u0001'; };
    let s = String(src);
    s = s.replace(/`([^`]+)`/g, (m, c) => hold('<code>' + esc(c) + '</code>'));
    s = s.replace(/\{\{(v|ref):([^}]+)\}\}/g, (m, kind, arg) => hold(hooks.inline(kind, arg.trim())));
    s = esc(s);
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(„"—–-])\*([^*\s][^*]*?)\*(?=$|[\s).,;:!?”"—–-])/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\u0001(\d+)\u0001/g, (m, i) => keep[+i]);
    return s;
  };
}

function splitRow(line) {
  let t = line.trim(); if (t.startsWith('|')) t = t.slice(1); if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells = []; let cur = '';
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (c === '\\' && t[i + 1] === '|') { cur += '|'; i++; } else if (c === '|') { cells.push(cur.trim()); cur = ''; } else cur += c; }
  cells.push(cur.trim()); return cells;
}
const isSep = line => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) && line.includes('-');

function parseList(lines, i, inline) {
  const re = /^(\s*)([-*]|\d+\.)\s+(.*)$/, first = re.exec(lines[i]);
  const base = first[1].length, ordered = /\d/.test(first[2]);
  let html = '<' + (ordered ? 'ol' : 'ul') + '>'; let open = false;
  while (i < lines.length) {
    const m = re.exec(lines[i]);
    if (m && m[1].length === base) {
      if (open) html += '</li>'; open = true;
      let text = m[3]; i++;
      while (i < lines.length && lines[i].trim() && !re.test(lines[i]) && /^\s{2,}\S/.test(lines[i]) && !lines[i].trim().startsWith('|')) { text += ' ' + lines[i].trim(); i++; }
      html += '<li>' + inline(text);
      if (i < lines.length && re.test(lines[i]) && re.exec(lines[i])[1].length > base) { const r = parseList(lines, i, inline); html += r.html; i = r.i; }
    } else break;
  }
  if (open) html += '</li>';
  return { html: html + '</' + (ordered ? 'ol' : 'ul') + '>', i };
}

/* chapter: { label, title, md }.  state: wspólny licznik tabel/rysunków i lista nagłówków. hooks: { inline(kind,arg), block(name,arg) } */
function convert(chapter, state, hooks) {
  const inline = makeInline(hooks), lines = chapter.md.replace(/\r/g, '').split('\n'), out = [];
  let i = 0, h2 = 0, h3 = 0, para = [];
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flush(); i++; continue; }
    let m;
    if ((m = /^```(\w*)\s*$/.exec(line))) {                                   // blok kodu
      flush(); const buf = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue;
    }
    if ((m = /^(#{1,4})\s+(.*?)(?:\s*\{#([\w-]+)\})?\s*$/.exec(line))) {      // nagłówek
      flush(); const lvl = m[1].length; let num = '', text = m[2];
      if (lvl === 1) { h2 = 0; h3 = 0; num = chapter.label; }
      else if (lvl === 2) { h2++; h3 = 0; num = chapter.label + '.' + h2; }
      else if (lvl === 3) { h3++; num = chapter.label + '.' + h2 + '.' + h3; }
      const id = m[3] || ('s-' + (num || slug(text)).replace(/\./g, '-') + (lvl === 4 ? '-' + slug(text) : ''));
      const h = { lvl, num, text, id, chapter: chapter.label };
      state.headings.push(h); if (m[3]) state.refs[m[3]] = h;
      const title = lvl === 1 ? chapter.title : text;
      out.push('<h' + lvl + ' id="' + id + '">' + (num ? '<span class="num">' + num + (lvl === 1 && /^\d+$/.test(num) ? '.' : '') + '</span> ' : '') + inline(title) + '</h' + lvl + '>');
      i++; continue;
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
    if ((m = /^\{\{([\w-]+)(?::(.*))?\}\}\s*$/.exec(line.trim())) && !/^(v|ref)$/.test(m[1])) {   // dyrektywa blokowa
      flush(); out.push(hooks.block(m[1], (m[2] || '').trim(), state)); i++; continue;
    }
    if (line.trim().startsWith('<') && /^<(svg|div|figure|table|section|img|p|span|h\d|ul|ol|pre|hr|br|a)\b/.test(line.trim())) {   // surowy HTML do pustej linii
      flush(); const buf = [];
      while (i < lines.length && lines[i].trim()) buf.push(lines[i++]);
      out.push(hooks.raw ? hooks.raw(buf.join('\n')) : buf.join('\n')); continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line.trim()))) {   // obraz
      flush(); const n = ++state.figures;
      out.push('<figure><img src="' + m[2] + '" alt="' + esc(m[1]) + '">' + '<figcaption><b>Rysunek ' + n + '.</b> ' + inline(m[3] || m[1]) + '</figcaption></figure>'); i++; continue;
    }
    if (line.trim().startsWith('>')) {                                         // cytat / ramka
      flush(); const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      let type = '', first = buf[0] || ''; const mm = /^\[!(\w+)\]\s*(.*)$/.exec(first);
      if (mm) { type = mm[1].toLowerCase(); buf[0] = mm[2]; }
      const inner = convertBlockSimple(buf, inline);
      out.push(type ? '<div class="callout ' + type + '"><div class="ct">' + (CALLOUT[type] || type) + '</div>' + inner + '</div>' : '<blockquote>' + inner + '</blockquote>');
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && isSep(lines[i + 1])) {   // tabela
      flush(); let cap = '';
      if (out.length && out[out.length - 1].startsWith('<p class="cap">')) cap = out.pop().replace(/^<p class="cap">|<\/p>$/g, '');
      const head = splitRow(line), aligns = splitRow(lines[i + 1]).map(c => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''));
      i += 2; const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      const td = (tag, c, k) => '<' + tag + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(c) + '</' + tag + '>';
      const n = cap ? ++state.tables : 0;
      out.push('<div class="tw">' + (cap ? '<div class="tcap"><b>Tabela ' + n + '.</b> ' + cap + '</div>' : '') + '<table><thead><tr>' + head.map((c, k) => td('th', c, k)).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + head.map((_, k) => td('td', r[k] || '', k)).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if ((m = /^Tabela:\s*(.*)$/.exec(line.trim()))) { flush(); out.push('<p class="cap">' + inline(m[1]) + '</p>'); i++; continue; }
    if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) { flush(); const r = parseList(lines, i, inline); out.push(r.html); i = r.i; continue; }
    para.push(line.trim()); i++;
  }
  flush();
  return out.join('\n');
}

/* prosta zawartość ramki: akapity i listy */
function convertBlockSimple(buf, inline) {
  const out = []; let para = [], i = 0;
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  while (i < buf.length) {
    if (!buf[i].trim()) { flush(); i++; continue; }
    if (/^(\s*)([-*]|\d+\.)\s+/.test(buf[i])) { flush(); const r = parseList(buf, i, inline); out.push(r.html); i = r.i; continue; }
    para.push(buf[i].trim()); i++;
  }
  flush(); return out.join('');
}

module.exports = { convert, esc, slug, CALLOUT };
