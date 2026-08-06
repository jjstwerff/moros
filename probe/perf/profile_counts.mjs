// Instrument check: arm the profile, send a KNOWN load, and require the report to
// show exactly that load. A profiler that cannot be checked against a count it
// should find is a profiler nobody should believe.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18777}/ws`);
const wait = ms => new Promise(r => setTimeout(r, ms));
const status = [];
ws.addEventListener('message', e => { if (typeof e.data === 'string' && e.data.startsWith('S:')) status.push(e.data.slice(2)); });
const ack = async (p, limit = 20000) => {
  const from = status.length;
  for (let t = 0; t < limit; t += 5) { await wait(5); const m = status.slice(from).find(x => x.startsWith(p)); if (m) return m; }
  return `(no "${p}")`;
};
await new Promise(r => ws.addEventListener('open', r));
ws.send('1:');            await wait(400);
ws.send('27:2');          await ack('profile armed');
// A known load: 5 places and 3 column reads. Nothing else.
for (let i = 0; i < 5; i++) { ws.send(`7:${i},0,0`); await ack('placed'); }
for (let i = 0; i < 3; i++) { ws.send(`15:${i},0`); await ack(`column ${i},0 =`); }
const from = status.length;
ws.send('27:3');
await ack('PROFILE ');
await wait(300);
const rows = status.slice(from).filter(x => x.startsWith('PROFILE ')).map(x => x.slice(8));
const table = {};
for (const r of rows) { const p = r.split(' '); if (p.length === 4) table[p[0]] = {n: +p[1], us: +p[2], tau: +p[3]}; }
const place = table['7'] ?? {n: 0}, col = table['15'] ?? {n: 0};
console.log(JSON.stringify({
  rows, place, col,
  placeCountRight: place.n === 5,
  colCountRight: col.n === 3,
  ok: place.n === 5 && col.n === 3,
}));
ws.close();
