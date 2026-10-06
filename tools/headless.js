'use strict';
/* Headless harness dla Nova_Roma.html: uruchamia skrypt gry w node:vm z atrapami DOM
   i zwraca moduły silnika (World, Economy, Build, Tribute, Events, TestBots, Data…).
   Użycie:  const G = require('./headless').load('Nova_Roma.html');  G.World.init('franks'); */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeCtx() {
  const grad = { addColorStop() {} };
  const target = function () {};
  return new Proxy(target, {
    get(_, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'canvas') return {};
      return () => {};
    },
    set() { return true; }
  });
}

function makeEl(id) {
  const el = {
    id, style: {}, children: [], _html: '', textContent: '', className: '',
    width: 1000, height: 800, offsetHeight: 20, offsetWidth: 100,
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    getContext() { return makeCtx(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 800 }; },
    focus() {}, remove() {}
  };
  Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; } });
  return el;
}

function load(htmlFile, opts = {}) {
  const html = fs.readFileSync(path.resolve(htmlFile), 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('Nie znaleziono <script> w ' + htmlFile);
  const els = {};
  const document = {
    getElementById(id) { return els[id] || (els[id] = makeEl(id)); },
    createElement(tag) { return makeEl(tag); },
    querySelectorAll() { return []; },
    body: makeEl('body'),
    addEventListener() {}
  };
  const sandbox = {
    document, console, Math, JSON, Date, Object, Array, Map, Set, Number, String, parseInt, parseFloat, isNaN,
    setTimeout, clearTimeout, setInterval, clearInterval,
    performance: { now: () => 0 },
    requestAnimationFrame() {}, cancelAnimationFrame() {},
    innerWidth: 1000, innerHeight: 800, devicePixelRatio: 1
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  vm.createContext(sandbox);
  vm.runInContext(m[1], sandbox, { filename: path.basename(htmlFile) });
  const names = ['RNG', 'Data', 'Camera', 'Terrain', 'MapGen', 'Gfx', 'Sprites', 'Path', 'World', 'Economy', 'Build', 'Tribute', 'Events',
    'TestBots', 'Roads', 'Logistics', 'Minimap', 'Menu', 'Fauna', 'BuildMode', 'UI', 'Walkers', 'Game', 'Advisor'];
  const out = { sandbox, els, document };
  for (const n of names) {
    try { out[n] = vm.runInContext('typeof ' + n + " !== 'undefined' ? " + n + ' : undefined', sandbox); } catch (e) { /* brak modułu */ }
  }
  out.run = code => vm.runInContext(code, sandbox);
  return out;
}

module.exports = { load };
