// Part placement gate (plan 17 `A2.2`) — the authored house, over the wire.
//
// ⚠ THIS GATE IS THE WIRE HALF, AND IT IS DELIBERATELY THIN. The claim that the
// authored house IS the procedural house — cell for cell, edge for edge, label
// for label, and on `τ` — is a structural invariant and it lives where it can be
// stated exactly: `lib/hex_editor/tests/part_place.loft`, five tests over flat
// ground, a slope and a ceiling that refuses both paths. Restating it here would
// be a weaker copy of a stronger claim.
//
// What needs a RUNNING WORLD is everything that test cannot reach:
//   · `14:<roof>,<part>` is accepted, resolved to a file, and changes the world;
//   · the walls arrive with it — `part_diff` cannot see edges, and neither can
//     any height comparison;
//   · the RENDERER redraws it, because a house nobody meshed is not placed;
//   · a part that is not there, and a name that leaves `data/parts/`, are
//     refused BY NAME rather than read as an empty house.
//
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled. A chunk draws one mesh per surface
// on consecutive ids, so every decoder here depends on how many there are. Keep
// equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 9;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
const chunks = new Map();
let st = 0;
const ack = async (p, limitMs = 8000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${p} ${limitMs}ms`); return `(no "${p}" in ${limitMs}ms)`;
};
const rebuilt = () => ack('rebuilt');
const column = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const walls = async (q, r) => {
  ws.send(`16:${q},${r}`);
  const m = await ack(`walls ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const roofVerts = () => [...chunks].filter(([id, d]) => (id - 16) % SURFACES === 4 && d.length >= 6)
                                   .reduce((n, [, d]) => n + Math.floor(d.length / 6), 0);

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h2 = b.indexOf(';'), id = Number(b.slice(0, h2));
    let rest = b.slice(h2 + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;

    // ── (1) the procedural house at hex (10,0), which is the reference
    place(17.3, 0, 0); await ack('placed');
    const procMsg = (ws.send('14:12'), await ack('stencil'));
    await rebuilt();
    const roofAfterProc = roofVerts();
    const procCentre = await column(10, 0);
    const procEave   = await column(12, 0);
    const procWalls  = await walls(12, 0);

    // ── (2) the SAME house from the file, thirty hexes east — a different chunk,
    //        so the two placements cannot share a mesh and the roof count below
    //        is genuinely new geometry rather than the first house recounted.
    place(69.3, 0, 0); await ack('placed');
    const partMsg = (ws.send('14:12,house/cottage'), await ack('stencil'));
    await rebuilt();
    const roofAfterPart = roofVerts();
    const partCentre = await column(40, 0);
    const partEave   = await column(42, 0);
    const partWalls  = await walls(42, 0);

    // ── (3) refusals, by name
    const missingMsg = (ws.send('14:12,house/nosuchthing'), await ack('stencil'));
    const escapeMsg  = (ws.send('14:12,../../worlds/gate'), await ack('stencil'));
    // CONTROL: the world is UNTOUCHED by the two refusals — a refusal that built
    // something would satisfy every string test above.
    const afterRefusals = await column(40, 0);

    const placedFromPart = /^stencil placed \d+ cells from part 'cottage'$/.test(partMsg);
    // ⚠ THE HEIGHTS AND THE EDGES, NOT A COUNT OF EITHER. Two houses that agree
    // on how many cells they have and disagree on where is exactly the failure
    // this whole step exists to rule out.
    const sameCentre = procCentre === partCentre;
    const sameEave   = procEave === partEave;
    const sameWalls  = procWalls === partWalls;
    // the door is on the eave cell's north edge, and it is not a wall — so this
    // says the edge travelled with its MATERIAL rather than as a plain wall.
    const hasDoor = /(^|,)2(,|$)/.test(partWalls);
    // the renderer drew it: strictly more roof than the procedural house alone
    const drawn = roofAfterPart > roofAfterProc;
    const refusedMissing = missingMsg.startsWith('stencil refused — part ')
                           && missingMsg.includes('nosuchthing');
    // ⚠ The fence is `hex_part::part_name_ok` since `A7.3e` — one rule for what a
    // part name is, so the wording is the library's and names no directory.
    const refusedEscape  = escapeMsg.includes('leaves the part library');
    const untouched = afterRefusals === partCentre;

    const ok = placedFromPart && sameCentre && sameEave && sameWalls && hasDoor
               && drawn && refusedMissing && refusedEscape && untouched;
    console.log(JSON.stringify({ procMsg, partMsg, missingMsg, escapeMsg,
                                 procCentre, partCentre, procEave, partEave,
                                 procWalls, partWalls, afterRefusals,
                                 roofAfterProc, roofAfterPart,
                                 placedFromPart, sameCentre, sameEave, sameWalls,
                                 hasDoor, drawn, refusedMissing, refusedEscape,
                                 untouched, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
