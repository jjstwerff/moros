// Vegetation gate (rung W5, moros#13) — "a forest that reads as landscape,
// not a list".
//
// The claim under test is not "trees appeared". It is that the forest is a
// FIELD, derived from the cell coordinate, rather than a set of remembered
// instances:
//   · scattering the same ground twice yields the SAME wood, not twice as much
//     — the property a stored RNG would break invisibly, since the second
//     stroke would merely look thicker;
//   · density is a dial, not a boolean — 80 must put down more than 20;
//   · clearing empties it, and the mesh empties with it;
//
// ⚠ NOT GATED HERE: that a tree stands on the ground it grows on. Checking it
// means reading a height off the mesh wire, and I could not pin that layout
// down — index 7 stride 6 yields 0.707 for ground four raises high (a normal),
// index 4 yields 47.5 (a horizontal extent), while the older gates' `i = 1;
// i += 6` yields a sensible 6.25 from a series containing index 7. Those cannot
// all be right, so the convention those gates rely on is not understood, and a
// height assertion built on it would be decoration. `chunk_mesh_veg` does place
// each tree at its own cell's height; that is untested. See EDITOR_LADDER.md.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const chunks = new Map();
const status = [];
let st = 0;

// vegetation is surface kind 3 of 4 (0 ground, 1 road, 2 field, 3 vegetation)
//
// ⚠ THE WIRE. The payload after the id and the flag is `r,g,b;` followed by six
// floats a vertex, NORMAL FIRST: nx,ny,nz,x,y,z. Splitting on ',' yields
// [r, g, "b;nx0", ny0, nz0, x0, y0, …] — index 2 is the join of the blue channel
// and the first normal, and parses to NaN. So a HEIGHT sits at index 7 + 6k.
//
// This is worth spelling out because the layout is not the obvious one, and
// reading it as position-first is self-consistent enough to fool a gate: it
// yields ~9.165 for trees on flat ground, which is the disc's horizontal extent
// wearing a height's clothes. The cross-check that settles it is the GROUND
// mesh, whose height is known independently — four raises must read ~6.25.
// An empty mesh is the three colour entries and nothing else.
const isVeg = (id) => (id - 16) % 4 === 3;
const vegVerts = () => {
  let n = 0;
  for (const [id, d] of chunks) if (isVeg(id) && d.length > 3) n += Math.floor((d.length - 3) / 6);
  return n;
};
const topYOfKind = (k) => {
  let y = -1e9;
  for (const [id, d] of chunks) if ((id - 16) % 4 === k && d.length > 3)
    for (let i = 7; i < d.length; i += 6) if (Number.isFinite(d[i])) y = Math.max(y, d[i]);
  return y === -1e9 ? null : +y.toFixed(3);
};
const vegTopY = () => topYOfKind(3);
const lastCount = () => {
  const m = [...status].reverse().find(x => x.startsWith('scattered'));
  return m ? Number(m.split(' ')[1]) : null;
};
const ack = async (limitMs = 6000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    if (status.slice(from).some(x => x.startsWith('scattered'))) return true;
  }
  return false;
};
// ⚠ THE SAME TRAP `persist` FELL INTO. The server acknowledges a scatter the
// moment it has written the cells, but the chunk MESHES are rebuilt on a later
// tick — measured at up to ~900ms for a handful of chunks under the interpreter.
// Stability alone therefore settles on the picture from BEFORE the rebuild: this
// gate saw 84 trees go onto a hill and still read the old meshes, so the trees
// looked like they had not moved. Wait a floor for the rebuild, THEN for the
// count to stop moving.
const settleVerts = async (minMs = 2500, limitMs = 12000) => {
  let prev = null, stable = 0, t = 0;
  while (t < limitMs) {
    await wait(150); t += 150;
    const v = vegVerts();
    if (prev !== null && v === prev) stable += 1; else stable = 0;
    prev = v;
    if (t >= minMs && stable >= 4) return v;
  }
  console.error(`settleVerts: never stopped moving in ${limitMs}ms`);
  return vegVerts();
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const id = Number(b.slice(0, b.indexOf(';')));
    const rest = b.slice(b.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    place(0, 0, 0); await wait(600);

    // ── scatter, then scatter the SAME ground again
    ws.send('13:1,30'); await ack();
    const first = lastCount();
    const vertsFirst = await settleVerts();
    ws.send('13:1,30'); await ack();
    const second = lastCount();
    const vertsSecond = await settleVerts();

    // ── the dial
    ws.send('13:1,80'); await ack();
    const dense = lastCount();
    await settleVerts();

    // ── clear
    ws.send('13:0,0'); await ack();
    const cleared = lastCount();
    const vertsCleared = await settleVerts();

    // ── vegetation survives terrain being raised under it, and re-scatters on
    //    the hill. Counts only: see the wire-layout note above for why there is
    //    no height assertion here.
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(200); }
    await wait(1200);
    place(17.3, 0, 0); await wait(700);
    ws.send('13:1,60'); await ack();
    const onHill = lastCount();
    const vertsHill = await settleVerts();
    const kindTop = (k) => { let y=-1e9; for (const [id,d] of chunks) if ((id-16)%4===k && d.length>=6) for (let i=1;i+5<d.length;i+=6) y=Math.max(y,d[i]); return y===-1e9?null:+y.toFixed(3); };


    const cells = 1 + 3 * 6 * 7;                    // a radius-6 disc
    const inBand    = first > cells * 0.15 && first < cells * 0.45;
    const idempotent = second === first && vertsSecond === vertsFirst;
    const dialled   = dense > first;
    const emptied   = cleared === 0 && vertsCleared === 0;
    const grewOnHill = onHill > 0 && vertsHill > 0;
    const ok = inBand && idempotent && dialled && emptied && grewOnHill;
    console.log(JSON.stringify({ cells, first, second, dense, cleared, onHill,
                                 vertsFirst, vertsSecond, vertsCleared, vertsHill,
                                 inBand, idempotent, dialled, emptied, grewOnHill, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 90000);
