// Fence gate (rung W2, moros#10) — THE EXACT PERIMETER, AND WHO STORES IT.
//
// A hex owns three of its six edges, so half of any region's boundary is stored
// in the cells OUTSIDE it. That is #10's design question, and stated as a count it
// is exact rather than approximate:
//
//   a hex disc of radius R has  6(2R+1)  boundary edges,
//   of which exactly            3(2R+1)  are stored outside the disc.
//
// Both numbers are closed forms — every one of the six directions faces 2R+1 of
// the ring's cells, and three of the six are stored by the neighbour. So this gate
// asserts arithmetic, not a sample.
//
// ⚠ THE SUM IS COUNTED INDEPENDENTLY, by reading every wall byte in a window and
// adding up the non-zero ones. The server's own figure comes from the same
// `edge_owner` map the write used, so two directions colliding in one byte would
// report 30 and store 25 — the map cannot check itself. The byte sum can.
//
// Run at four centres: both row parities, both signs. Parity is where this
// codebase breaks — four separate bugs, all "right for non-negative coordinates".
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
// hex_grid's lattice: pointy-top, odd-r offset. The gate needs it only to steer
// the character onto a named cell — every claim below is about counts.
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
const placeAck = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  return ack('placed');
};

// Every wall byte in a window, read in ONE round trip: fire all the requests, then
// wait for all the replies. Asking one at a time costs a poll interval each and
// turned a 49-cell window into five seconds.
const wallWindow = async (cq, cr, reach) => {
  const cells = [];
  for (let dq = -reach; dq <= reach; dq++)
    for (let dr = -reach; dr <= reach; dr++) cells.push([cq + dq, cr + dr]);
  const from = status.length;
  for (const [q, r] of cells) ws.send(`16:${q},${r}`);
  const want = cells.length;
  let got = new Map();
  for (let t = 0; t < 60000 && got.size < want; t += 100) {
    await wait(100);
    got = new Map();
    for (const s of status.slice(from)) {
      const m = s.match(/^walls (-?\d+),(-?\d+) = (.*)$/);
      if (m) got.set(`${m[1]},${m[2]}`, m[3].trim());
    }
  }
  return got;
};

// Sum the wall bytes of a window: how many are set, and what materials they hold.
const tally = (got) => {
  const by = new Map();
  let set = 0;
  for (const [, body] of got) {
    if (body === '') continue;
    for (const layer of body.split(';'))
      for (const v of layer.split(',').map(Number))
        if (v !== 0) { set += 1; by.set(v, (by.get(v) || 0) + 1); }
  }
  return { set, by };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    const R = 2;
    const wantEdges = 6 * (2 * R + 1);          // 30
    const wantOutside = 3 * (2 * R + 1);        // 15
    const report = {};

    // ── the four centres: even/odd row, positive/negative
    const centres = [[0, 0], [9, 1], [-9, -3], [-9, -10]];
    const counted = [];
    for (const [cq, cr] of centres) {
      await placeAck(cq, cr);
      ws.send(`23:3,${R}`);
      const m = await ack('fenced');
      const n = m.match(/fenced (\d+) edges, (\d+) stored outside/);
      counted.push(n ? [Number(n[1]), Number(n[2])] : [-1, -1]);
    }
    report.perCentre = counted;
    const everyCentreExact = counted.every(([n, o]) => n === wantEdges && o === wantOutside);

    // ── the INDEPENDENT count, at the origin disc: sum the bytes themselves
    const win = await wallWindow(0, 0, R + 2);
    const sum = tally(win);
    report.bytesSet = sum.set;
    report.byMaterial = [...sum.by.entries()];
    const bytesExact = sum.set === wantEdges;

    // ── the control: an interior cell bounds nothing, so it owns no wall.
    // ⚠ An empty reply IS the bare answer, not a missing one: a cell with no
    // ground and no edges is absent, so `16:` reports nothing for it (`E1`).
    const innerBody = win.get('0,0') ?? '(unanswered)';
    const inner = innerBody === '' ? [0, 0, 0]
                                   : innerBody.split(';')[0].split(',').map(Number);
    report.centreCell = inner;
    const innerBare = inner.length === 3 && inner.every((v) => v === 0);

    // ── `X70` — A GATEWAY DOES NOT REMOVE AN EDGE.
    // Stand on the ring cell two east of the centre and turn its outward (E) edge
    // into a door. The count must not move: one of the thirty is simply a
    // different material. Storing the opening as 0 instead would leave 29.
    await placeAck(2, 0);
    ws.send('24:0,2');
    const gate = await ack('edge 0 of');
    const win2 = await wallWindow(0, 0, R + 2);
    const sum2 = tally(win2);
    report.afterGateway = { set: sum2.set, byMaterial: [...sum2.by.entries()] };
    const gatewayKeepsCount = sum2.set === wantEdges
      && (sum2.by.get(2) || 0) === 1 && (sum2.by.get(3) || 0) === wantEdges - 1;

    // ── the fence is an ENCLOSURE: a fill inside it takes the disc and no more.
    // 3R²+3R+1 = 19 cells for R=2, and the gateway must not leak it — "a boundary
    // you can walk through" is still a boundary.
    await placeAck(0, 0);
    ws.send('11:');
    const fill = await ack('field');
    const nfill = Number((fill.match(/field filled (\d+) cells/) || [])[1] ?? -1);
    report.fill = fill;
    const encloses = nfill === 3 * R * R + 3 * R + 1;

    // ── the doorstep: a material is nominal, a radius is ordinal (`X68`)
    await placeAck(20, 20);
    ws.send('23:9,2');
    const badMat = await ack('fence refused');
    ws.send('23:3,40');
    const badRad = await ack('fence refused');
    report.refusals = [badMat, badRad];
    const nominalHasNoOffer = badMat.includes('no nearest one') && !badMat.includes('offer');
    const ordinalOffers = badRad.includes('offer 12') && badRad.includes('residual 28');

    const ok = everyCentreExact && bytesExact && innerBare && gatewayKeepsCount
               && encloses && nominalHasNoOffer && ordinalOffers;
    console.log(JSON.stringify({ wantEdges, wantOutside, everyCentreExact, bytesExact,
                                 innerBare, gatewayKeepsCount, encloses, nfill,
                                 nominalHasNoOffer, ordinalOffers, ok, ...report }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
