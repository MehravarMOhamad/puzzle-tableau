const express = require('express'), http = require('http'), path = require('path'), fs = require('fs');
const { WebSocketServer } = require('ws');
const Q = require('./questions');
const HEROES = require('./assets/heroes.json');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new Map();
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const uriCache = new Map();
const rnd = n => Math.floor(Math.random() * n);

function heroUri(h) {
  if (!uriCache.has(h.id)) {
    const f = path.join(__dirname, 'assets', 'heroes', h.file);
    uriCache.set(h.id, `data:${MIME[path.extname(f).toLowerCase()] || 'image/png'};base64,${fs.readFileSync(f).toString('base64')}`);
  }
  return uriCache.get(h.id);
}

app.get('/api/heroes', (req, res) => res.json(HEROES.map(h => ({ id: h.id, name: h.name, icon: h.icon }))));
app.get('/healthz', (req, res) => res.send('ok'));

function authed(req) {
  const r = rooms.get(String(req.params.room).toUpperCase());
  const slot = r && [1, 2].find(s => r.players[s] && r.players[s].token === req.query.t);
  return r && slot ? { r, slot } : null;
}
// A tile is only served if the requesting player has earned it (or the game is over).
app.get('/tile/:room/:cell', (req, res) => {
  const a = authed(req), c = parseInt(req.params.cell, 10);
  if (!a || !(c >= 0 && c < 100)) return res.sendStatus(404);
  if (a.r.status !== 'over' && !a.r.rev[a.slot].has(c)) return res.sendStatus(403);
  const x = (c % 10) * 100, y = Math.floor(c / 10) * 100;
  res.type('image/svg+xml').set('Cache-Control', 'private, max-age=3600').send(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${x} ${y} 100 100" preserveAspectRatio="none">` +
    `<image href="${heroUri(HEROES[a.r.hero])}" xlink:href="${heroUri(HEROES[a.r.hero])}" width="1000" height="1000" preserveAspectRatio="xMidYMid slice"/></svg>`);
});
app.get('/full/:room', (req, res) => {
  const a = authed(req);
  if (!a || a.r.status !== 'over') return res.sendStatus(403);
  res.sendFile(path.join(__dirname, 'assets', 'heroes', HEROES[a.r.hero].file));
});

function resetGame(r) {
  let h; do { h = rnd(HEROES.length); } while (HEROES.length > 1 && h === r.hero);
  Object.assign(r, {
    hero: h, gameId: (r.gameId || 0) + 1, status: 'waiting', started: false, winner: 0, reason: '',
    rev: { 1: new Set(), 2: new Set() }, failed: { 1: new Set(), 2: new Set() },
    strikes: { 1: 0, 2: 0 }, wrong: { 1: [], 2: [] },
  });
  [1, 2].forEach(s => clearRes(r, s));
  r.res = { 1: null, 2: null };
  if (r.players[1] && r.players[2]) r.status = 'playing';
}
function clearRes(r, s) { if (r.res && r.res[s]) { clearTimeout(r.res[s].timer); r.res[s] = null; } }

function getRoom(id) {
  if (!rooms.has(id)) {
    const r = { id, method: 1, category: 'math', players: {}, res: { 1: null, 2: null }, last: Date.now() };
    resetGame(r); rooms.set(id, r);
  }
  return rooms.get(id);
}

function view(r, slot) {
  const o = slot === 1 ? 2 : 1, over = r.status === 'over', mine = r.res[slot];
  const cells = Array.from({ length: 100 }, (_, i) =>
    over || r.rev[slot].has(i) ? 1 : mine && mine.cell === i ? 2 : r.res[o] && r.res[o].cell === i ? 3 : r.failed[slot].has(i) ? 4 : 0);
  return {
    t: 'state', room: r.id, you: slot, gameId: r.gameId, status: r.status, method: r.method,
    methodLocked: r.started, cells, wrong: r.wrong[slot], winner: r.winner, reason: r.reason,
    heroName: over ? HEROES[r.hero].name : null,
    mine: mine ? { cell: mine.cell, left: mine.expires - Date.now(), secs: mine.secs, q: mine.q.text } : null,
    players: [1, 2].map(s => r.players[s] ? {
      slot: s, name: r.players[s].name, avatar: r.players[s].avatar, online: !!(r.players[s].ws && r.players[s].ws.readyState === 1),
      strikes: r.strikes[s], solved: r.rev[s].size } : { slot: s, empty: true }),
  };
}
function broadcast(r) {
  r.last = Date.now();
  [1, 2].forEach(s => { const p = r.players[s]; if (p && p.ws && p.ws.readyState === 1) p.ws.send(JSON.stringify(view(r, s))); });
}
const err = (ws, code, msg) => ws.send(JSON.stringify({ t: 'error', code, msg }));

function fail(r, slot, cell) {
  clearRes(r, slot);
  r.failed[slot].add(cell);
  if (r.method === 2) r.rev[slot === 1 ? 2 : 1].add(cell); // method 2: shown to the other player
}
function end(r, winner, reason) {
  r.status = 'over'; r.winner = winner; r.reason = reason;
  [1, 2].forEach(s => clearRes(r, s));
}

wss.on('connection', ws => {
  ws.alive = true; ws.on('pong', () => (ws.alive = true));
  let room = null, slot = 0;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'join') {
      const id = String(m.room || '').toUpperCase();
      if (!/^[A-Z0-9]{4}$/.test(id)) return err(ws, 'bad_room', 'Room code must be 4 letters or digits.');
      const s = m.slot === 2 ? 2 : 1, tok = String(m.token || '').slice(0, 64);
      if (tok.length < 8) return err(ws, 'bad_token', 'Missing player token.');
      const r = getRoom(id), p = r.players[s];
      if (p && p.token !== tok) return err(ws, 'slot_taken', `Player ${s} is already taken in room ${id}. Pick Player ${s === 1 ? 2 : 1}.`);
      if (p && p.ws && p.ws !== ws) try { p.ws.close(); } catch {}
      r.players[s] = { token: tok, name: String(m.name || 'Player').trim().slice(0, 16) || 'Player', avatar: String(m.avatar || '🦸').slice(0, 8), ws };
      room = r; slot = s;
      if (r.players[1] && r.players[2] && r.status === 'waiting') r.status = 'playing';
      ws.send(JSON.stringify({ t: 'joined', slot: s }));
      return broadcast(r);
    }
    if (!room) return;
    const r = room, o = slot === 1 ? 2 : 1;
    if (m.t === 'method' && slot === 1 && !r.started && (m.method === 1 || m.method === 2)) { r.method = m.method; return broadcast(r); }
    if (m.t === 'newgame' && r.status === 'over') { resetGame(r); return broadcast(r); }
    if (r.status !== 'playing') return;

    if (m.t === 'claim') {
      const c = parseInt(m.cell, 10), secs = Math.min(120, Math.max(5, parseInt(m.secs, 10) || 20));
      if (!(c >= 0 && c < 100)) return;
      if (r.res[slot]) return err(ws, 'busy', 'Finish your current cell first.');
      if (r.rev[slot].has(c) || r.failed[slot].has(c)) return err(ws, 'unavailable', 'That cell is not available to you.');
      if (r.res[o] && r.res[o].cell === c) return err(ws, 'reserved', 'Your opponent is solving that cell.');
      r.started = true;
      const q = Q.generate(r.category);
      const res = { cell: c, secs, q, expires: Date.now() + secs * 1000 };
      res.timer = setTimeout(() => { if (r.res[slot] === res && r.status === 'playing') { fail(r, slot, c); broadcast(r); } }, secs * 1000 + 150);
      r.res[slot] = res;
      return broadcast(r);
    }
    if (m.t === 'answer') {
      const res = r.res[slot];
      if (!res) return;
      if (Date.now() > res.expires + 300) { fail(r, slot, res.cell); return broadcast(r); }
      if (Q.check(res.q, m.value)) { clearRes(r, slot); r.rev[slot].add(res.cell); } else fail(r, slot, res.cell);
      return broadcast(r);
    }
    if (m.t === 'guess') {
      const i = HEROES.findIndex(h => h.id === m.hero);
      if (i < 0 || r.wrong[slot].includes(HEROES[i].id)) return;
      if (i === r.hero) return end(r, slot, 'guessed the hero'), broadcast(r);
      r.strikes[slot]++; r.wrong[slot].push(HEROES[i].id);
      if (r.strikes[slot] >= 2) end(r, o, 'the other player made two wrong guesses');
      return broadcast(r);
    }
  });
  ws.on('close', () => { if (room) broadcast(room); });
});

setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); });
  for (const [id, r] of rooms) if (Date.now() - r.last > 6 * 3600e3) { [1, 2].forEach(s => clearRes(r, s)); rooms.delete(id); }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Puzzle Tableau on :' + PORT));
