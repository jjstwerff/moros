// The other half of the instrument check: `tau` read 0 for every message in the
// first run. That is the RIGHT answer for a place and a column read — neither
// writes — but a column that is always 0 is indistinguishable from a broken one.
// So: send something that must move the edit clock, and require it to.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18777}/ws`);
const wait = ms => new Promise(r => setTimeout(r, ms));
const status = [];
ws.addEventListener('message', e => { if (typeof e.data === 'string' && e.data.startsWith('S:')) status.push(e.data.slice(2)); });
const ack = async (p, limit = 30000) => {
  const from = status.length;
  for (let t = 0; t < limit; t += 5) { await wait(5); const m = status.slice(from).find(x => x.startsWith(p)); if (m) return m; }
  return `(no "${p}")`;
};
await new Promise(r => ws.addEventListener('open', r));
ws.send('1:'); await wait(400);
ws.send('7:0,0,0'); await ack('placed');
ws.send('27:2'); await ack('profile armed');
// `5:` raises the terrain under the character — a write, so the edit clock MUST move.
for (let i = 0; i < 3; i++) { ws.send('5:1'); await wait(250); }
await wait(500);
const from = status.length;
ws.send('27:3'); await ack('PROFILE '); await wait(300);
const rows = status.slice(from).filter(x => x.startsWith('PROFILE ')).map(x => x.slice(8));
const table = {};
for (const r of rows) { const p = r.split(' '); if (p.length === 4) table[p[0]] = {n: +p[1], us: +p[2], tau: +p[3]}; }
const raise = table['5'] ?? {n: 0, tau: 0};
console.log(JSON.stringify({
  rows, raise,
  raiseSeen: raise.n === 3,
  tauMoved: raise.tau > 0,
  ok: raise.n === 3 && raise.tau > 0,
}));
ws.close();
