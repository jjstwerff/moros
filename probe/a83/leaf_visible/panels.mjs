// EVERY MESH A SUBJECT EMITS, GROUPED BY THE COLOUR IT IS PAINTED IN.
//
// `limbwhere.mjs` reads the limb block (ids 8..15); this reads them ALL, which is
// where a part's OWN cells go when it is opened as the subject. One panel is 12
// vertices, so a five-cell wall with ten north edges and one doorway is 9 x 12 =
// 108 — and a profile that wrongly overrode `DOOR_MAT` would be 120. That
// difference is the whole of §P9.13's stated failure path, and it is a COUNT: no
// picture can tell "the opening is a hole" from "the opening is a panel the same
// colour as the wall", which is the exact trap `A8.3` spent four days in.
const PORT = Number(process.argv[2] ?? 18097);
const subjects = process.argv.slice(3);
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// ⚠ SETTLE ON THE EVIDENCE, NEVER ON A CLOCK. A fixed wait after `44:` reports the
// MACHINE: under load the meshes had not all arrived at 4 s and three claims came
// back false, then true on a rerun — a flake in a gate, which is worse than no
// gate. This returns when no `M:` has landed for `quiet` ms, capped, so it is fast
// when the box is idle and correct when it is not. (A fixed wait is right only
// when the claim is an ABSENCE; every claim here is a presence.)
const settle = async (quiet = 900, cap = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < cap) {
    // ⚠ `lastMsg > t0` IS THE HALF THAT MATTERS. Without it the second subject
    // settles instantly on the FIRST subject's silence — measured: `door/leaf`
    // came back with no meshes at all, three runs running. Quiet is only evidence
    // once something has actually arrived.
    if (lastMsg > t0 && Date.now() - lastMsg >= quiet) return;
    await sleep(100);
  }
};

const seen = new Map();   // id -> {colour, verts}

let lastMsg = Date.now();
ws.addEventListener('message', (ev) => {
  lastMsg = Date.now();
  const s = typeof ev.data === 'string' ? ev.data : '';
  if (!s.startsWith('M:')) return;
  const body = s.slice(2);
  const i = body.indexOf(';');
  const id = Number(body.slice(0, i));
  const j = body.indexOf(';', i + 1);
  const payload = body.slice(j + 1);
  if (!payload) { seen.delete(id); return; }
  const k = payload.indexOf(';');
  const colour = payload.slice(0, k);
  const rest = payload.slice(k + 1);
  // ⚠ SIX FLOATS A VERTEX, not three: `mesh_wire` writes `mesh_to_floats`, and
  // `emit_tri` puts a position AND a normal on every one. Dividing by 3 gave
  // 231.33 — a fractional vertex count, which is the tell that the stride is
  // wrong. And a payload that is a colour and nothing else is a CLEARED slot,
  // not a mesh of one vertex.
  if (rest === '') { seen.delete(id); return; }
  seen.set(id, { colour, verts: rest.split(',').length / 6 });
});

await new Promise((r) => ws.addEventListener('open', r));
await sleep(1500);

for (const name of subjects) {
  ws.send('44:'); await settle(500, 8000); seen.clear();
  ws.send(`44:${name}`); await settle();
  const byColour = new Map();
  for (const { colour, verts } of seen.values()) {
    byColour.set(colour, (byColour.get(colour) ?? 0) + verts);
  }
  const rows = [...byColour.entries()].sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}=${n}`).join('  ');
  console.log(`${name.padEnd(12)} ${rows}`);
}
ws.send('44:'); await sleep(500); ws.close();
