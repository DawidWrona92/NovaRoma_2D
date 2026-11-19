// game.js: RTS-lite "Afganistan 1979" (sprite'y: scripts/sprites.js, silnik canvas 2D).
'use strict';

const TILE_W = 64, TILE_H = 32;
const W = 1280, H = 680;
const ORIGIN_X = W / 2 - 32;

// ---------- Sprite'y -> offscreen canvas ----------
const spriteCache = {};
function buildSprite(id) {
  const data = SPRITE_DATA[id];
  const c = document.createElement('canvas');
  c.width = data.width; c.height = data.height;
  const ctx = c.getContext('2d');
  data.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      ctx.fillStyle = SPRITE_PALETTE[ch] || '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    }
  });
  spriteCache[id] = { canvas: c, w: data.width, h: data.height, ax: data.anchor.x, ay: data.anchor.y };
}
Object.keys(SPRITE_DATA).forEach(buildSprite);

// ---------- Definicje jednostek ----------
const UNITS = {
  sov_rifle: { sprite: 'sov_rifle', name: 'Strzelec', hp: 75, dmg: 13, range: 3.2, rof: 0.8, speed: 1.5, cost: 100, cls: 'inf', splash: 0 },
  sov_rpg:   { sprite: 'sov_rpg',   name: 'RPG-7',    hp: 55, dmg: 46, range: 3.6, rof: 2.6,  speed: 1.4, cost: 160, cls: 'inf', splash: 0 },
  muj_rifle: { sprite: 'muj_rifle', name: 'Mudżahedin', hp: 75, dmg: 13, range: 3.2, rof: 0.85, speed: 1.5, cost: 100, cls: 'inf', splash: 0 },
  muj_rpg:   { sprite: 'muj_rpg',   name: 'Mudż. RPG', hp: 55, dmg: 46, range: 3.6, rof: 2.6, speed: 1.4, cost: 160, cls: 'inf', splash: 0 },
  btr:       { sprite: 'btr',  name: 'BTR-70',  hp: 230, dmg: 12, range: 4.2, rof: 0.55, speed: 2.6, cost: 320, cls: 'veh', splash: 0 },
  tank:      { sprite: 'tank', name: 'T-62',    hp: 420, dmg: 72, range: 5.0, rof: 3.0,  speed: 1.9, cost: 520, cls: 'veh', splash: 0.8 },
  technical: { sprite: 'technical', name: 'Technikal', hp: 130, dmg: 12, range: 4.2, rof: 0.7, speed: 3.0, cost: 260, cls: 'veh', splash: 0 },
};
function damageVs(attType, att, defUnit) {
  let d = att.dmg;
  const target = UNITS[defUnit.type];
  if (attType.endsWith('rpg')) d = target.cls === 'veh' ? 46 : 18;
  if (att.cls === 'veh') d = target.cls === 'veh' ? d * 0.7 : d;
  if (attType === 'tank') d *= target.cls === 'veh' ? 0.85 : 1.1;
  return d;
}

// ---------- Stan gry ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
let state = null;

function tileSprite(x, y) { return ['tile0', 'tile1', 'tile2'][(x * 7 + y * 13) % 3]; }

function startGame(mapId) {
  const def = MAPS[mapId];
  const grid = def.grid.map(r => r.padEnd(def.w, '.'));
  const map = {
    def, w: def.w, h: def.h,
    tiles: [], objects: [], points: [], spawn: { sov: null, muj: null },
  };
  for (let y = 0; y < def.h; y++) {
    map.tiles[y] = [];
    for (let x = 0; x < def.w; x++) {
      const ch = grid[y][x];
      let type = 'open';
      if (ch === '#') type = 'rock';
      else if (ch === 'T') type = 'tree';
      else if (ch === 'H') type = 'house';
      map.tiles[y][x] = { ch, type, blocked: type !== 'open' };
      if (ch === 'S') map.spawn.sov = { x, y };
      if (ch === 'M') map.spawn.muj = { x, y };
      if (type === 'rock') map.objects.push({ sprite: 'rocks' + ((x * 7 + y) % 2), x, y });
      if (type === 'tree') map.objects.push({ sprite: 'tree' + ((x * 7 + y) % 2), x, y });
      if (type === 'house') map.objects.push({ sprite: 'house', x, y });
    }
  }
  for (const p of def.points) {
    const t = map.tiles[p.y][p.x];
    t.blocked = false; t.type = 'open';
    map.points.push({ id: p.id, name: p.name, x: p.x, y: p.y, owner: null, progress: 0, capturing: null });
  }
  state = {
    map, units: [], projectiles: [], fx: [], time: 0, over: null,
    supply: { sov: 250, muj: 260 }, selected: [], dragBox: null,
    aiTimer: 3, holdTimer: null, log: [],
  };
  for (let i = 0; i < 3; i++) spawnUnit('sov_rifle', 'sov', map.spawn.sov.x + (i - 1) * 0.6, map.spawn.sov.y + 0.8);
  spawnUnit('sov_rpg', 'sov', map.spawn.sov.x, map.spawn.sov.y + 1.4);
  for (let i = 0; i < 3; i++) spawnUnit('muj_rifle', 'muj', map.spawn.muj.x + (i - 1) * 0.6, map.spawn.muj.y - 0.8);
  spawnUnit('muj_rpg', 'muj', map.spawn.muj.x, map.spawn.muj.y - 1.4);
  document.getElementById('mapname').textContent = def.name;
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('endscreen').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
}

function logEvent(txt) {
  const el = document.getElementById('eventlog');
  const p = document.createElement('p');
  p.textContent = txt;
  el.prepend(p);
  setTimeout(() => p.remove(), 7000);
  while (el.children.length > 6) el.lastChild.remove();
}

function spawnUnit(type, faction, x, y) {
  const def = UNITS[type];
  state.units.push({
    type, faction, def, x, y, hp: def.hp, maxHp: def.hp,
    path: [], target: null, cooldown: Math.random(), radius: def.cls === 'veh' ? 0.45 : 0.32,
  });
}

// ---------- Izometria ----------
function worldToScreen(x, y) {
  return { sx: ORIGIN_X + (x - y) * (TILE_W / 2), sy: (x + y) * (TILE_H / 2) + 40 };
}
function screenToWorld(sx, sy) {
  sy -= 40;
  const x = (sx - ORIGIN_X) / TILE_W + sy / TILE_H;
  const y = sy / TILE_H - (sx - ORIGIN_X) / TILE_W;
  return { x, y };
}

// ---------- Pathfinding (A* 8-dir) ----------
function walkable(map, x, y) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  return !map.tiles[y][x].blocked;
}
function findPath(map, from, to) {
  const sx = Math.round(from.x), sy = Math.round(from.y), tx = Math.round(to.x), ty = Math.round(to.y);
  if (!walkable(map, tx, ty)) return null;
  const key = (x, y) => y * map.w + x;
  const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  const seen = new Map([[key(sx, sy), open[0]]]);
  let iter = 0;
  while (open.length && iter++ < 4000) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === tx && cur.y === ty) {
      const path = [];
      let n = cur;
      while (n) { path.unshift({ x: n.x + 0.5, y: n.y + 0.5 }); n = n.parent; }
      return path;
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!walkable(map, nx, ny)) continue;
      if (dx && dy && (!walkable(map, cur.x + dx, cur.y) || !walkable(map, cur.x, cur.y + dy))) continue;
      const g = cur.g + (dx && dy ? 1.4 : 1);
      const ex = seen.get(key(nx, ny));
      if (ex && ex.g <= g) continue;
      const node = { x: nx, y: ny, g, f: g + Math.hypot(tx - nx, ty - ny), parent: cur };
      seen.set(key(nx, ny), node);
      open.push(node);
    }
  }
  return null;
}

// ---------- Walka ----------
function acquireTarget(u) {
  let best = null, bestD = Infinity;
  for (const e of state.units) {
    if (e.faction === u.faction || e.hp <= 0) continue;
    const d = Math.hypot(e.x - u.x, e.y - u.y);
    if (d < u.def.range + 0.5 && d < bestD) { best = e; bestD = d; }
  }
  return best;
}

// ---------- Aktualizacja ----------
function update(dt) {
  state.time += dt;
  // zaopatrzenie
  for (const f of ['sov', 'muj']) {
    let gain = 3;
    for (const p of state.map.points) if (p.owner === f) gain += 4;
    state.supply[f] += gain * dt;
  }
  // punkty kontroli
  for (const p of state.map.points) {
    let sov = 0, muj = 0;
    for (const u of state.units) {
      if (u.hp > 0 && Math.hypot(u.x - p.x - 0.5, u.y - p.y - 0.5) <= 1.4) {
        if (u.faction === 'sov') sov++; else muj++;
      }
    }
    const f = sov > 0 && muj === 0 ? 'sov' : muj > 0 && sov === 0 ? 'muj' : null;
    if (f && f !== p.owner) {
      p.progress += dt * (f === 'sov' ? sov : muj) * 12;
      if (p.progress >= 100) {
        if (p.owner) logEvent(`${f === 'sov' ? '40. Armia' : 'Mudżahedini'} przejmują: ${p.name}`);
        p.owner = f; p.progress = 0;
      }
    } else if (!f) p.progress = Math.max(0, p.progress - dt * 20);
  }
  // jednostki
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    u.cooldown -= dt;
    const tgt = u.target && u.target.hp > 0 ? u.target : (u.target = acquireTarget(u));
    if (tgt && Math.hypot(tgt.x - u.x, tgt.y - u.y) <= u.def.range) {
      if (u.cooldown <= 0) {
        u.cooldown = u.def.rof;
        state.projectiles.push({
          x: u.x, y: u.y, tx: tgt.x, ty: tgt.y, target: tgt, faction: u.faction,
          speed: u.def.cls === 'veh' && u.type === 'tank' ? 14 : 20, dmg: damageVs(u.type, u.def, tgt), life: 2, big: u.type === 'tank' || u.type.endsWith('rpg'),
        });
      }
      u.path = [];
    } else if (u.path.length) {
      const next = u.path[0];
      const dx = next.x - u.x, dy = next.y - u.y;
      const d = Math.hypot(dx, dy);
      const step = u.def.speed * dt;
      if (d <= step) { u.x = next.x; u.y = next.y; u.path.shift(); }
      else { u.x += dx / d * step; u.y += dy / d * step; }
    } else if (u.attackMove) {
      const p = nearestPointTo(u);
      if (p) orderMove(u, p.x + 0.5 + (Math.random() - 0.5), p.y + 0.5 + (Math.random() - 0.5));
    }
  }
  // pociski
  for (const pr of state.projectiles) {
    pr.life -= dt;
    const dx = pr.tx - pr.x, dy = pr.ty - pr.y;
    const d = Math.hypot(dx, dy), step = pr.speed * dt;
    if (pr.target && pr.target.hp > 0) { pr.tx = pr.target.x; pr.ty = pr.target.y; }
    if (d <= step) {
      pr.life = -1;
      if (pr.target && pr.target.hp > 0) {
        pr.target.hp -= pr.dmg;
        state.fx.push({ x: pr.tx, y: pr.ty, t: 0, kind: pr.big ? 'boom' : 'hit' });
        if (pr.target.hp <= 0) state.fx.push({ x: pr.tx, y: pr.ty, t: 0, kind: 'wreck' });
      }
    } else { pr.x += dx / d * step; pr.y += dy / d * step; }
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0);
  // fx
  for (const f of state.fx) f.t += dt;
  state.fx = state.fx.filter(f => f.t < (f.kind === 'wreck' ? 1.5 : 0.4));
  // sprzatanie
  const dead = state.units.filter(u => u.hp <= 0);
  if (dead.length) {
    state.selected = state.selected.filter(u => u.hp > 0);
    state.units = state.units.filter(u => u.hp > 0);
  }
  // AI mudżahedinów
  state.aiTimer -= dt;
  if (state.aiTimer <= 0) {
    state.aiTimer = 7;
    aiThink();
  }
  // warunki zwyciestwa
  const pts = state.map.points;
  const allSov = pts.every(p => p.owner === 'sov');
  const allMuj = pts.every(p => p.owner === 'muj');
  const mujCount = state.units.filter(u => u.faction === 'muj').length;
  const sovCount = state.units.filter(u => u.faction === 'sov').length;
  if (allSov) {
    if (state.holdTimer === null) { state.holdTimer = 30; logEvent('Wszystkie punkty nasze! Utrzymać 30 s.'); }
    state.holdTimer -= dt;
    if (state.holdTimer <= 0) endGame(true, 'Przejąłeś wszystkie punkty kontroli. Wadi jest nasze.');
  } else state.holdTimer = null;
  if (allMuj) endGame(false, 'Mudżahedini opanowali wszystkie punkty kontroli.');
  if (mujCount === 0 && state.supply.muj < 100) endGame(true, 'Siły mudżahedinów rozbite.');
  if (sovCount === 0 && state.supply.sov < 100) endGame(false, 'Twoja kompania przestała istnieć.');
}

function nearestPointTo(u) {
  let best = null, bd = Infinity;
  for (const p of state.map.points) {
    if (p.owner === u.faction) continue;
    const d = Math.hypot(p.x - u.x, p.y - u.y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function orderMove(u, x, y) {
  const from = { x: u.x, y: u.y };
  const path = findPath(state.map, from, { x: x - 0.5, y: y - 0.5 });
  if (path && path.length > 1) { u.path = path.slice(1); }
  else { u.path = [{ x, y }]; }
}

function aiThink() {
  const s = state;
  const my = s.units.filter(u => u.faction === 'muj');
  const budget = s.supply.muj;
  const roster = [
    { type: 'muj_rpg', cost: 160 }, { type: 'technical', cost: 260 }, { type: 'muj_rifle', cost: 100 },
    { type: 'tank', cost: 9999 },
  ];
  const pick = roster.filter(r => r.cost <= budget && r.type !== 'tank')
    .sort((a, b) => (a.type === 'muj_rpg' ? 0 : a.type === 'technical' ? 1 : 2) - (b.type === 'muj_rpg' ? 0 : b.type === 'technical' ? 1 : 2));
  const wantRpg = my.filter(u => u.type === 'muj_rpg').length < 2;
  const choice = wantRpg && pick.find(r => r.type === 'muj_rpg') || pick.find(r => r.type === 'technical') || pick.find(r => r.type === 'muj_rifle');
  if (choice && s.units.filter(u => u.faction === 'muj').length < 14) {
    s.supply.muj -= choice.cost;
    const sp = s.map.spawn.muj;
    spawnUnit(choice.type, 'muj', sp.x + Math.random() * 1.5 - 0.3, sp.y - 0.6 - Math.random());
    logEvent('Mudżahedini: posiłki z gór.');
  }
  // rozkazy: punkty nie-własne
  for (const u of my) {
    if (!u.path.length && !u.target) {
      const p = nearestPointTo(u);
      if (p) orderMove(u, p.x + 0.5 + Math.random() - 0.5, p.y + 0.5 + Math.random() - 0.5);
      u.attackMove = true;
    }
  }
}

function endGame(win, text) {
  if (state.over) return;
  state.over = true;
  document.getElementById('endtitle').textContent = win ? 'ZWYCIĘSTWO' : 'PORAŻKA';
  document.getElementById('endtitle').style.color = win ? '#e8b96a' : '#a32e22';
  document.getElementById('endtext').textContent = text;
  document.getElementById('endscreen').classList.remove('hidden');
}

// ---------- Render ----------
function draw() {
  ctx.fillStyle = '#14100c';
  ctx.fillRect(0, 0, W, H);
  const map = state.map;
  // kafle
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const sp = spriteCache[tileSprite(x, y)];
    const { sx, sy } = worldToScreen(x, y);
    ctx.drawImage(sp.canvas, Math.round(sx), Math.round(sy));
  }
  // punkty kontroli (piedestał + pierścienie)
  const drawList = [];
  for (const p of map.points) drawList.push({ depth: p.x + p.y, kind: 'point', ref: p });
  for (const o of map.objects) drawList.push({ depth: o.x + o.y, kind: 'obj', ref: o });
  for (const u of state.units) drawList.push({ depth: u.x + u.y, kind: 'unit', ref: u });
  drawList.sort((a, b) => a.depth - b.depth);
  for (const d of drawList) {
    if (d.kind === 'obj') {
      const sp = spriteCache[d.ref.sprite];
      const { sx, sy } = worldToScreen(d.ref.x, d.ref.y);
      ctx.drawImage(sp.canvas, Math.round(sx - sp.ax), Math.round(sy + TILE_H / 2 - sp.ay + 16));
    } else if (d.kind === 'point') {
      const p = d.ref;
      const sp = spriteCache.flag;
      const { sx, sy } = worldToScreen(p.x, p.y);
      const col = p.owner === 'sov' ? '#93b5e8' : p.owner === 'muj' ? '#e88a5e' : '#cbb082';
      ctx.drawImage(sp.canvas, Math.round(sx - sp.ax), Math.round(sy + TILE_H / 2 - sp.ay + 16));
      const cx = Math.round(sx + 12), cy = Math.round(sy + TILE_H / 2 + 6);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 34, 15, 0, 0, Math.PI * 2); ctx.stroke();
      if (col !== '#cbb082') { ctx.fillStyle = col + '33'; ctx.fill(); }
      ctx.fillStyle = '#111';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = col;
      ctx.fillText(p.name, cx, cy + 24);
      if (p.progress > 0 && p.progress < 100) {
        ctx.fillStyle = '#00000088';
        ctx.fillRect(cx - 20, cy - 26, 40, 6);
        ctx.fillStyle = col;
        ctx.fillRect(cx - 20, cy - 26, 40 * p.progress / 100, 6);
      }
    } else {
      drawUnit(d.ref);
    }
  }
  // pociski i fx
  for (const pr of state.projectiles) {
    const { sx, sy } = worldToScreen(pr.x, pr.y);
    ctx.fillStyle = pr.big ? '#f2a04c' : '#f0c9a0';
    const yy = sy - 16;
    ctx.fillRect(Math.round(sx) - 1, Math.round(yy) - 1, pr.big ? 3 : 2, pr.big ? 3 : 2);
  }
  for (const f of state.fx) {
    const { sx, sy } = worldToScreen(f.x, f.y);
    const a = 1 - f.t / (f.kind === 'wreck' ? 1.5 : 0.4);
    if (f.kind === 'hit') {
      ctx.fillStyle = `rgba(240,201,160,${a})`;
      ctx.fillRect(Math.round(sx) - 2, Math.round(sy) - 18, 5, 5);
    } else {
      const r = 6 + f.t * 30;
      ctx.fillStyle = f.kind === 'wreck' ? `rgba(60,50,45,${a})` : `rgba(217,92,46,${a})`;
      ctx.beginPath(); ctx.ellipse(Math.round(sx), Math.round(sy) - 10, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // ramka zaznaczania
  if (state.dragBox) {
    const b = state.dragBox;
    ctx.strokeStyle = '#93b5e8';
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    ctx.setLineDash([]);
  }
}

function drawUnit(u) {
  const sp = spriteCache[u.def.sprite];
  const { sx, sy } = worldToScreen(u.x, u.y);
  const px = Math.round(sx - sp.ax), py = Math.round(sy - sp.ay + 16);
  if (u.faction === 'muj') ctx.globalAlpha = 0.95;
  ctx.drawImage(sp.canvas, px, py);
  ctx.globalAlpha = 1;
  // pasek HP
  if (u.hp < u.maxHp) {
    ctx.fillStyle = '#00000099';
    ctx.fillRect(px + 4, py + sp.h - 4, sp.w - 8, 3);
    ctx.fillStyle = u.faction === 'sov' ? '#93b5e8' : '#e88a5e';
    ctx.fillRect(px + 4, py + sp.h - 4, (sp.w - 8) * Math.max(0, u.hp) / u.maxHp, 3);
  }
  // zaznaczenie
  if (state.selected.includes(u)) {
    ctx.strokeStyle = '#7fb46f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(Math.round(sx), Math.round(sy) + 14, sp.w * 0.4, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------- UI / input ----------
document.querySelectorAll('.mapbtn').forEach(b => b.addEventListener('click', () => startGame(b.dataset.map)));
document.getElementById('btn-menu').addEventListener('click', () => {
  document.getElementById('game').classList.add('hidden');
  document.getElementById('endscreen').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  state = null;
});
document.getElementById('btn-again').addEventListener('click', () => document.getElementById('btn-menu').click());
document.querySelectorAll('.pb').forEach(b => b.addEventListener('click', () => {
  if (!state || state.over) return;
  const type = b.dataset.unit;
  const def = UNITS[type];
  if (state.supply.sov < def.cost) { logEvent('Za mało zaopatrzenia: ' + def.name); return; }
  if (state.units.filter(u => u.faction === 'sov').length >= 18) { logEvent('Limit kompanii osiągnięty (18).'); return; }
  state.supply.sov -= def.cost;
  const sp = state.map.spawn.sov;
  spawnUnit(type, 'sov', sp.x + (Math.random() - 0.5) * 1.6, sp.y + 0.8 + Math.random());
  logEvent('Nowa jednostka: ' + def.name);
}));

canvas.addEventListener('mousedown', e => {
  if (!state) return;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (canvas.width / r.width), my = (e.clientY - r.top) * (canvas.height / r.height);
  if (e.button === 0) state.dragBox = { x0: mx, y0: my, x1: mx, y1: my, moved: false };
  if (e.button === 2) {
    const wpt = screenToWorld(mx, my);
    const tx = Math.round(wpt.x - 0.5), ty = Math.round(wpt.y - 0.5);
    // atak na jednostke wroga?
    let clickedEnemy = null;
    for (const u of state.units) {
      if (u.faction === 'sov') continue;
      const s = worldToScreen(u.x, u.y);
      if (Math.abs(mx - s.sx) < 16 && my > s.sy - 44 && my < s.sy + 16) { clickedEnemy = u; break; }
    }
    const orders = state.selected.filter(u => u.faction === 'sov');
    if (orders.length) {
      for (const u of orders) {
        u.attackMove = false; u.target = null;
        if (clickedEnemy) u.target = clickedEnemy;
        else if (tx >= 0 && ty >= 0 && tx < state.map.w && ty < state.map.h) orderMove(u, tx + 0.5, ty + 0.5);
      }
      if (clickedEnemy) logEvent('Atak!');
    }
  }
});
canvas.addEventListener('mousemove', e => {
  if (!state || !state.dragBox) return;
  const r = canvas.getBoundingClientRect();
  state.dragBox.x1 = (e.clientX - r.left) * (canvas.width / r.width);
  state.dragBox.y1 = (e.clientY - r.top) * (canvas.height / r.height);
  if (Math.abs(state.dragBox.x1 - state.dragBox.x0) > 6 || Math.abs(state.dragBox.y1 - state.dragBox.y0) > 6)
    state.dragBox.moved = true;
});
canvas.addEventListener('mouseup', e => {
  if (!state || e.button !== 0 || !state.dragBox) return;
  const b = state.dragBox;
  state.dragBox = null;
  const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1);
  const y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
  const selected = [];
  for (const u of state.units) {
    if (u.faction !== 'sov') continue;
    const s = worldToScreen(u.x, u.y);
    const ux = s.sx, uy = s.sy - 20;
    if (b.moved ? (ux >= x0 && ux <= x1 && uy >= y0 && uy <= y1) : (Math.hypot(ux - x0, uy - y0) < 18)) selected.push(u);
  }
  state.selected = selected;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (!state) return;
  if (e.key === 'Escape') state.selected = [];
  if (e.key === ' ') {
    for (const u of state.selected) { u.path = []; u.attackMove = false; }
    e.preventDefault();
  }
  if (e.key === 'a' || e.key === 'A') {
    const p = nearestPointTo({ faction: 'sov', x: state.selected[0]?.x ?? 0, y: state.selected[0]?.y ?? 0 });
    if (p && state.selected.length) {
      for (const u of state.selected) { u.attackMove = true; orderMove(u, p.x + 0.5, p.y + 0.5); }
    }
  }
});

function updateHUD() {
  if (!state) return;
  document.getElementById('supply').innerHTML = `Zaopatrzenie: <b>${Math.floor(state.supply.sov)}</b>`;
  const mine = state.units.filter(u => u.faction === 'sov').length;
  document.getElementById('army').innerHTML = `Kompania: <b>${mine}</b>/18`;
  const pts = state.map.points.map(p => p.owner === 'sov' ? '★' : p.owner === 'muj' ? '✚' : '·').join(' ');
  document.getElementById('points').innerHTML = `Punkty: <b>${pts}</b>${state.holdTimer !== null ? ` — utrzymać ${Math.ceil(state.holdTimer)}s` : ''}`;
  document.querySelectorAll('.pb').forEach(b => {
    b.classList.toggle('off', state.supply.sov < UNITS[b.dataset.unit].cost);
  });
}

// ---------- Petla ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state && !state.over) update(dt);
  if (state) { draw(); updateHUD(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
