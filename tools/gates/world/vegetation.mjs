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
//   · a tree stands on the ground it grows on, so a wood scattered on a hill
//     sits higher than one scattered on the flat.
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled 5 or 6 in a comparison. A chunk
// draws one mesh per surface on consecutive ids, so every decoder here depends on
// how many there are — and when the roof made it five, three decoders moved and
// the gates did not. Keep this equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 8;   // ground, road, field, vegetation, roof, wall, floor, frame
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const chunks = new Map();
const status = [];
let st = 0;

// vegetation is surface kind 3 of 4 (0 ground, 1 road, 2 field, 3 vegetation)
//
// THE WIRE, settled against `graphics::mesh_to_floats` and a captured payload:
//
//   M:<id>;<flag>;<r>,<g>,<b>;x0,y0,z0,nx0,ny0,nz0,x1,y1,z1,…
//
// POSITION FIRST, six floats a vertex. So strip THREE semicolons — id, flag,
// AND colour — and the array is pure floats with a height at index 1 + 6k.
// That is the convention every gate in this directory uses, and it is correct.
//
// ⚠ Strip only two and the colour rides along: the array becomes
// [r, g, "b;x0", y0, …], index 2 parses to NaN, and every offset shifts by two.
// This gate did exactly that and then read index 7 (a normal, max 0.707) and
// index 4 (a horizontal extent, 47.5) while `persist` read a correct 6.25 from
// index 1 — which looked like three gates disagreeing about the layout, and was
// really one gate parsing differently from the rest.
// An empty mesh is one empty field, so fewer than six numbers.
const isVeg = (id) => (id - 16) % SURFACES === 3;
const vegVerts = () => {
  let n = 0;
  for (const [id, d] of chunks) if (isVeg(id) && d.length >= 6) n += Math.floor(d.length / 6);
  return n;
};
const topYOfKind = (k) => {
  let y = -1e9;
  for (const [id, d] of chunks) if ((id - 16) % SURFACES === k && d.length >= 6)
    for (let i = 1; i < d.length; i += 6) if (Number.isFinite(d[i])) y = Math.max(y, d[i]);
  return y === -1e9 ? null : +y.toFixed(3);
};
const vegTopY = () => topYOfKind(3);
const lastCount = () => {
  const m = [...status].reverse().find(x => x.startsWith('scattered'));
  return m ? Number(m.split(' ')[1]) : null;
};
// Wait for any status line containing `needle`. ⚠ Scans from the CURRENT end, so
// it waits for the NEXT one — right for a reply, and `field.mjs` is the record of
// what happens when a gate waits on the clock instead.
const ackS = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
// The world changes when a scatter is acknowledged; the MESHES follow several
// ticks later. The server brackets a rebuild `Z:1` … `Z:0` and then says
// `S:rebuilt N chunks` — that is the signal the PICTURE caught up.
const rebuilt = () => ackS('rebuilt');

const ack = async (limitMs = 6000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    if (status.slice(from).some(x => x.startsWith('scattered'))) return true;
  }
  return false;
};
// ⚠ THE SAME TRAP `persist` FELL INTO, AND IT IS FIXED PROPERLY NOW. The server
// acknowledges a scatter the moment it has written the cells, but the chunk MESHES
// are rebuilt on a later tick. This used to be a floor-plus-settle heuristic —
// wait at least 2500ms, then for the count to stop moving four times — which is two
// guesses stacked: how long a rebuild takes, and how long "stopped moving" needs to
// be believed. Both are statements about this box.
//
// `S:rebuilt N chunks` is the server saying the picture caught up, so one ack
// replaces both, and the count is read ONCE afterwards rather than sampled until it
// looks calm. `field.mjs` is the record of what a guess costs when it stops winning.
const settleVerts = async () => { await rebuilt(); return vegVerts(); };

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    place(0, 0, 0); await ackS('placed');

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

    // ── a tree stands on the ground it grows on.
    //
    // ⚠ The raise lands PEAK_AHEAD (10) hexes along the facing, which is OUTSIDE
    // a radius-6 scatter — an earlier version raised ground the trees were
    // nowhere near and then wondered why they had not moved. So: scatter here,
    // raise the hill over there, walk onto it, scatter again.
    ws.send('13:1,60'); await ack();
    await settleVerts();
    const yFlat = vegTopY();
    // a raise has no acknowledgement of its own — `rebuilt` is the one that says
    // the ground it changed has reached the client
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await rebuilt(); }
    place(17.3, 0, 0); await ackS('placed');
    ws.send('13:1,60'); await ack();
    const onHill = lastCount();
    const vertsHill = await settleVerts();
    const yHill = vegTopY();
    const groundTop = topYOfKind(0);
    const kindTop = (k) => { let y=-1e9; for (const [id,d] of chunks) if ((id-16)%4===k && d.length>=6) for (let i=1;i+5<d.length;i+=6) y=Math.max(y,d[i]); return y===-1e9?null:+y.toFixed(3); };


    const cells = 1 + 3 * 6 * 7;                    // a radius-6 disc
    const inBand    = first > cells * 0.15 && first < cells * 0.45;
    const idempotent = second === first && vertsSecond === vertsFirst;
    const dialled   = dense > first;
    const emptied   = cleared === 0 && vertsCleared === 0;
    const grewOnHill = onHill > 0 && vertsHill > 0;
    // the hill is ~6.25wu, so a wood on it must clear a wood on the flat by a
    // margin no jitter could account for
    const standsOn = yHill !== null && yFlat !== null && yHill > yFlat + 3;
    // ⚠ THE COUNTS MOVED, THE PICTURE STAYED. That the forest is a FIELD — the
    // same species at the same density over the same disc twice lands on exactly
    // the same cells — and that density is monotonic and species 0 clears are
    // `lib/hex_editor/tests/field.loft` now. `idempotent` and `dialled` below read
    // the same numbers back through a socket, which is the model restating itself.
    //
    // What stays is emission: trees reach a MESH (`vertsFirst`), clearing removes
    // it (`vertsCleared`), and a tree on a hill STANDS ON the ground rather than
    // hovering at the flat's height (`standsOn`) — none of which the store can say.
    const ok = emptied && grewOnHill && standsOn;
    console.log(JSON.stringify({ cells, first, second, dense, cleared, onHill,
                                 vertsFirst, vertsSecond, vertsCleared, vertsHill,
                                 yFlat, yHill, groundTop,
                                 inBand, idempotent, dialled, emptied, grewOnHill,
                                 standsOn, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
