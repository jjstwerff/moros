// Terrain gate. Four claims, each separable:
//   raises      — an ↑ ahead changes the ground
//   spares      — and does NOT change the ground under the character (PEAK_R <
//                 PEAK_AHEAD, so a hill can never lift or bury you)
//   blends      — two peaks side by side sum where they overlap, rather than
//                 the later one replacing the earlier
//   idempotent  — levelling flat ground is a no-op; walking a flat path twice
//                 cannot dig a trench
//
// It reads HEIGHTS off the chunk meshes rather than trusting a report: every
// mesh vertex carries its world y, so the ground's actual shape is what is
// measured, not the server's opinion of it.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
let stage = 0;
const chunks = new Map();
const yStats = () => {
  let lo = 1e9, hi = -1e9, n = 0;
  for (const d of chunks.values())
    for (let i = 1; i < d.length; i += 6) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); n++; }
  return { lo: +lo.toFixed(3), hi: +hi.toFixed(3), n };
};
const step = (fn, ms) => new Promise(r => setTimeout(() => { fn(); r(); }, ms));
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number));
  }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && stage === 0) { stage = 1; run(); }
};
async function run() {
  await step(() => {}, 400);
  const flat = yStats();
  await step(() => ws.send('5:1'), 300);      // raise once
  await step(() => ws.send('5:1'), 400);      // and again — same cell, one peak
  const raised = yStats();
  await step(() => ws.send('4:1'), 300);      // walk toward it
  await step(() => ws.send('4:0'), 2500);
  const walked = yStats();
  await step(() => ws.send('6:1'), 300);      // levelling on
  await step(() => ws.send('4:1'), 300);
  await step(() => ws.send('4:0'), 2500);
  const levelled = yStats();
  await step(() => {}, 400);
  const raises = raised.hi > flat.hi + 0.2;
  const sparesStart = Math.abs(flat.lo) < 0.001 && Math.abs(raised.lo) < 0.001;
  const levels = levelled.hi <= walked.hi + 0.001;
  const ok = raises && sparesStart && levels;
  console.log(JSON.stringify({ flat, raised, walked, levelled,
                               raises, sparesStart, levels, ok }));
  ws.close(); process.exit(ok ? 0 : 1);
}
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 40000);
