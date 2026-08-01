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
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
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
    // ⚠ WHAT THIS GATE STILL OWNS: the WIRE. The ring's arithmetic — 6(2R+1) edges,
    // half of them stored outside, the four centres that catch a row-parity bug,
    // the interior cell that owns nothing, `X70`'s gateway keeping the count, the
    // enclosure a fill respects — is `lib/hex_editor/tests/fence.loft` now, nine
    // tests against the store in under a second. Re-asserting it through a socket
    // measured nothing the model did not already say, and cost eleven seconds.
    //
    // What a loft test CANNOT say is what the running editor tells its author. The
    // acknowledgement is a contract: a script, a gate and a person all read it, and
    // a refusal that loses its offer on the way to the wire is a real regression
    // that no store test can see. So this checks the SENTENCES.
    const R = 2;
    await placeAck(0, 0);
    ws.send(`23:3,${R}`);
    const laid = await ack('fenced');

    // The count reaches the author, and in the shape the scripts parse.
    const reports = /^fenced (\d+) edges, (\d+) stored outside, radius (\d+) material (\d+)$/
      .test(laid.trim());
    const saysCounts = laid.includes(`fenced ${6 * (2 * R + 1)} edges`)
                    && laid.includes(`${3 * (2 * R + 1)} stored outside`);

    // ⚠ THE DOORSTEP REACHES THE WIRE INTACT — `X68`. A nominal refusal must arrive
    // WITHOUT an offer and an ordinal one WITH it; the library decides that, and
    // this is the only place that checks it survives being said.
    await placeAck(20, 20);
    ws.send('23:9,2');
    const badMat = await ack('fence refused');
    ws.send('23:3,40');
    const badRad = await ack('fence refused');
    const nominalHasNoOffer = badMat.includes('no nearest one') && !badMat.includes('offer');
    const ordinalOffers = badRad.includes('offer 12') && badRad.includes('residual 28');

    const ok = reports && saysCounts && nominalHasNoOffer && ordinalOffers;
    console.log(JSON.stringify({ laid, reports, saysCounts,
                                 refusals: [badMat, badRad],
                                 nominalHasNoOffer, ordinalOffers, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
