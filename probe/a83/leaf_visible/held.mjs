// WHAT THE CLIENT IS STILL HOLDING — not what the server just sent.
//
// ⚠ `panels.mjs` CANNOT SEE THIS, and that is why this file exists. It clears its
// map at each subject and records what arrives, so a mesh that nobody re-sends is
// simply absent from its answer — it reports *what was sent for this subject*,
// which is a different question from *what is on screen*. Under `door/frame` then
// `door/leaf` it said `floor=30` and no wall, while the PICTURE showed the frame's
// walls still standing. Both were right about different things.
//
// This one keeps the client's own bookkeeping: an `M:` with a payload adds an id,
// an `M:` with an empty payload or an `X:` removes it, and nothing else does. What
// is left after a switch is exactly what a viewer sees.
const PORT = Number(process.argv[2] ?? 18097);
const subjects = process.argv.slice(3);
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const held = new Map();      // id -> {colour, verts}
let lastMsg = Date.now();

ws.addEventListener('message', (ev) => {
  lastMsg = Date.now();
  const s = typeof ev.data === 'string' ? ev.data : '';
  if (s.startsWith('X:')) { held.delete(Number(s.slice(2))); return; }
  if (!s.startsWith('M:')) return;
  const body = s.slice(2);
  const i = body.indexOf(';');
  const id = Number(body.slice(0, i));
  const j = body.indexOf(';', i + 1);
  const payload = body.slice(j + 1);
  if (!payload) { held.delete(id); return; }
  const k = payload.indexOf(';');
  const rest = payload.slice(k + 1);
  if (rest === '') { held.delete(id); return; }
  held.set(id, { colour: payload.slice(0, k), verts: rest.split(',').length / 6 });
});

const settle = async (quiet = 900, cap = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < cap) {
    if (lastMsg > t0 && Date.now() - lastMsg >= quiet) return;
    await sleep(100);
  }
};

const report = (label) => {
  const by = new Map();
  for (const { colour, verts } of held.values()) {
    by.set(colour, (by.get(colour) ?? 0) + verts);
  }
  const rows = [...by.entries()].sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}=${n}`).join('  ');
  console.log(`${label.padEnd(26)} ${rows}`);
};

await new Promise((r) => ws.addEventListener('open', r));
await settle(500, 8000);

// ⚠ NO CLEARING BETWEEN SUBJECTS. The whole point is what SURVIVES one.
for (const name of subjects) {
  ws.send('44:'); await settle(500, 8000);
  ws.send(`44:${name}`); await settle();
  report(`holding under ${name}`);
}
ws.send('44:'); await settle(500, 8000);
report('holding back in the world');
ws.close();
