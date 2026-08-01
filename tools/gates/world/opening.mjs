// ⚠ THIS GATE'S CLAIM MOVED, AND THE GATE STAYS AS THE WIRE HALF OF IT. `X70` — a
// door is its own MATERIAL on the edge, never a cleared one, so the wall run keeps
// every edge and one of them simply reads differently — is
// `lib/hex_editor/tests/fence.loft` now: it rings a disc, turns one edge into a
// door, and counts OWNED edges before and after. Against the store that is
// arithmetic; here it needed a ring walked over a socket and three read-backs.
//
// What stays is that the editor's own `24:` gesture produces it end to end, and
// says so — the count, the single door, and the interior cell that owns nothing
// are the shape a script parses.
// Opening gate (rung W4, moros#12) — `X70`: AN OPENING IS NEVER ABSENCE.
//
// Moros used to store a door as wall material 0. hexbody measured what that
// costs — the wall run breaks, 38 edges with 0 ends becoming 36 with 2 — and
// `X70` turned it into a decision: a door is its own MATERIAL on the edge, never
// a cleared edge.
//
// The claim is therefore countable, and this gate counts it: putting a door into
// a wall must leave the number of wall EDGES unchanged. One of them is simply a
// different material. Absence would have removed an edge, and the hole it leaves
// is not "a way through" but "no boundary here" — an enclosure with a doorway is
// still enclosed.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
// the three owned edges of a cell's lowest occupied layer — the floor
const wallsAt = async (q, r) => {
  ws.send(`16:${q},${r}`);
  const m = await ack(`walls ${q},${r} =`);
  const body = m.slice(m.indexOf('=') + 1).trim();
  if (body === '') return [];
  return body.split(';')[0].split(',').map(Number);
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    await placeAck(0, 0, 0);
    ws.send('14:12'); await ack('stencil');

    // The footprint is a radius-2 disc centred on hex (0,0), so its perimeter is
    // the twelve cells at distance 2. Walk them and count.
    //
    // ⚠ DISTANCE IS ODD-R OFFSET, not axial. This read `(|dq| + |dr| + |dq+dr|)/2`
    // straight off (dq, dr) — the AXIAL cube distance — which is a different set of
    // cells on an offset lattice: it calls (0,0) and (-1,-1) two steps apart where
    // they are neighbours. It agreed with the editor only because the editor was
    // making the same mistake, through `moros_map::hex_distance` (moros#3). Both
    // now go through the one convention `hex_grid` owns.
    const axial = (q, r) => q - ((r - (r & 1)) / 2);
    const dist = (q, r) => {
      const dq = axial(q, r) - axial(0, 0), dr = r;
      return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
    };
    const ring = [];
    for (let dq = -3; dq <= 3; dq++)
      for (let dr = -3; dr <= 3; dr++)
        if (dist(dq, dr) === 2) ring.push([dq, dr]);

    let edges = 0, doors = 0, cleared = 0;
    for (const [dq, dr] of ring) {
      const w = await wallsAt(dq, dr);
      for (const m of w) {
        if (m === 0) cleared += 1; else edges += 1;
        if (m === 2) doors += 1;
      }
    }

    // an interior cell is not a wall — the control that stops "everything has
    // walls" passing this gate
    const inner = await wallsAt(0, 0);
    const innerBare = inner.length === 3 && inner.every(m => m === 0);

    const expected = ring.length * 3;         // every perimeter cell owns three
    const noneCleared = cleared === 0;
    const oneDoor = doors === 1;
    const runIntact = edges === expected;
    const ok = runIntact && oneDoor && noneCleared && innerBare;
    console.log(JSON.stringify({ ringCells: ring.length, expected, edges, doors, cleared,
                                 inner, runIntact, oneDoor, noneCleared, innerBare, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
