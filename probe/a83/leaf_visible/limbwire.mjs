// WHAT REACHES THE WIRE IN THE LIMB BLOCK — ids PART_MESH_BASE..MAX = 8..15.
//
// `mesh <surface>` in tools/script.mjs counts the CHUNK id space, and a bound
// limb is broadcast on its own reserved block instead — so that verb cannot see
// a limb at all, whatever it reports. This reads the raw frames.
//
// ⚠ THE CONTROL IS FIRST AND IT IS THE POINT: `door/leaf` opened as a PART puts
// its cells in the chunk space (not the limb block), and `door/hung` is the only
// subject that should populate 8..15. A run where nothing ever lands in 8..15 —
// for any subject — is a broken probe, not a finding.
const PORT = Number(process.argv[2] ?? 18097);
const subjects = process.argv.slice(3);

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const limb = new Map();   // id -> payload length of the LAST frame seen
const status = [];

ws.addEventListener('message', (ev) => {
  const s = typeof ev.data === 'string' ? ev.data : '';
  if (s.startsWith('S:')) status.push(s.slice(2));
  if (!s.startsWith('M:')) return;
  const body = s.slice(2);
  const i = body.indexOf(';');
  const id = Number(body.slice(0, i));
  if (id >= 8 && id <= 15) {
    const j = body.indexOf(';', i + 1);
    limb.set(id, body.length - (j + 1));
  }
});

await new Promise((r) => ws.addEventListener('open', r));
await sleep(1500);

for (const name of subjects) {
  limb.clear();
  status.length = 0;
  ws.send('44:');
  await sleep(1200);
  limb.clear();
  ws.send(`44:${name}`);
  await sleep(4000);          // the display rebuild runs on the tick after the open
  const live = [...limb.entries()].filter(([, n]) => n > 0).sort((a, b) => a[0] - b[0]);
  const empty = [...limb.entries()].filter(([, n]) => n === 0).map(([id]) => id);
  console.log(`${name.padEnd(14)} limb ids with geometry: ` +
    (live.length ? live.map(([id, n]) => `${id}(${n}B)`).join(' ') : 'NONE') +
    `   cleared: [${empty.join(',')}]`);
  const said = status.filter((s) => /limb|body|opened/.test(s));
  for (const s of said) console.log(`    S: ${s}`);
}
ws.send('44:');
await sleep(500);
ws.close();
