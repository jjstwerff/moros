// Storey gate (rung W4, moros#12) — the checkpoint the whole model rests on:
// a tower with a dungeon under it.
//
// What is gated is the LAYER STACK, not "a floor appeared":
//   · a floor above appends a layer, three times, on real ground
//   · a cellar INSERTS at the bottom, so stack order still holds
//   · a cellar with no room below is REFUSED, and refused for the RIGHT reason
//
// ⚠ The third clause is why the refusal codes are checked EXACTLY. The first
// version of this gate ran on an empty world, so every call refused with -1
// ("nothing to build on") — and the gate went green on a refusal it had not
// meant to test while the tower silently built nothing. A refusal gate that does
// not name the code is a gate that passes when the feature is absent.
//   -1 nothing to build on   -2 no room below the world   -10-N a column refusal
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let st = 0; const status = [];
// ⚠ WAIT FOR THE SERVER, NOT FOR THE CLOCK. Fixed sleeps encode an assumption
// about how fast the box is, and this gate read "(none)" for every step on a
// machine running a sibling agent's test suite — the editor took seconds per
// message and the 700ms waits sailed past. Every step here is acknowledged, so
// wait for the acknowledgement.
const ackStorey = async (limitMs = 30000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.startsWith('storey'));
    if (m) return m;
  }
  return '(none)';
};
const lastStorey = () => [...status].reverse().find(x => x.startsWith('storey')) || '(none)';
// The places were the last thing here still on a timer. A place acknowledges; a raise
// does not, and needs no ack — it is applied in full before the next message is read,
// and this gate reads no mesh. See doc/claude/WIRE_PROTOCOL.md.
const ack = async (p, limitMs = 30000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${p} ${limitMs}ms`); return `(no "${p}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { place(x, z, yaw); return ack('placed'); };

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'S') status.push(b);
  if (t === 'C' && !st) { st = 1;

    // ── two hills, because the two clauses need two ground heights.
    //    A raise builds PEAK_AHEAD(10) hexes along the facing at PEAK_STEP(6)
    //    per press: east is √3 wu/hex → ~17.3 wu, north is 1.5 wu/hex → 15 wu.
    await placeAck(0, 0, 0);
    ws.send('5:1');                                        // low hill east, peak 6
    await placeAck(0, 0, 1.5708);
    for (let k = 0; k < 4; k++) ws.send('5:1');            // high hill north, peak 24

    // ── the tower: three floors on the low hill
    await placeAck(17.3, 0, 0);
    // ⚠ A STOREY COSTS ONE LAYER, and for a long time it cost eleven. A layer is
    // CHUNK-WIDE while this writes a DISC OF 19 COLUMNS, and each column read one
    // cell more than the last — the layer its neighbour had just made, absent at
    // this hex — and appended yet another. Measured: 12, 23, 34 layers for three
    // storeys, against a LAYER_CAP of 64, so a six-storey tower would have hit the
    // cap. The stack of OCCUPIED cells was `25,37,49,61` either way, which is why
    // nothing caught it until `29:` LABELS existed to count layers with.
    // ⚠ THE LAYER COUNT MOVED. "A storey costs exactly one layer, however many
    // columns it touches" — the defect that cost eleven a storey — is
    // `lib/hex_editor/tests/storey.loft` now, counting `ck_layers` directly. It
    // needed `29:` LABELS and a socket to be visible at all when the only way in
    // was through one; against the store it is a length.
    const up = [];
    for (let k = 0; k < 3; k++) { ws.send('12:1'); up.push(await ackStorey()); }

    // ── the dungeon that CANNOT be: peak 6 < STOREY_H 12, so no room below
    ws.send('12:-1');
    const cellarLow = await ackStorey();

    // ── the dungeon that can: peak 24 leaves room
    await placeAck(0, 15, 0);
    ws.send('12:-1');
    const cellarHigh = await ackStorey();

    const towerBuilt  = up.length === 3 && up.every(m => /^storey \+1 on \d+ cells$/.test(m));
    const refusedLow  = cellarLow.startsWith('storey refused (-2)');
    const cellarBuilt = /^storey -1 on \d+ cells$/.test(cellarHigh);
    // one layer per storey, exactly — not "few", because the defect it guards
    // against was a CONSTANT FACTOR and any slack admits it back
    const ok = towerBuilt && refusedLow && cellarBuilt;
    console.log(JSON.stringify({ tower: up, cellarLow, cellarHigh,
                                 towerBuilt, refusedLow, cellarBuilt, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
