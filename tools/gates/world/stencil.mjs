// Stencil gate (rung W4, moros#12) — `P1` end to end in a running world.
//
// The model's tests prove the band rule on a column. This proves the EDITOR
// places a real structure by it, on ground someone walked to:
//   · a house on open ground goes down, keeping nothing because there is
//     nothing to keep — the control that stops the cases below passing because
//     placement silently does nothing;
//   · a house over a deep cave keeps the cave (cells BELOW the band survive);
//   · a house under a high bridge keeps the deck (cells ABOVE it survive);
//   · a house under a deck too close to fit is REFUSED, whole — `F1` says it
//     does not fit, and the editor does not build half of it anyway.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const lastLike = (p) => [...status].reverse().find(x => x.startsWith(p)) || '(none)';
const ack = async (p, limitMs = 8000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
const nums = (m) => (m.match(/-?\d+/g) || []).map(Number);

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;

    // ── ground high enough to dig under. The raise lands 10 hexes along the
    //    facing, so build the hill then walk onto it.
    place(0, 0, 0); await wait(500);
    for (let k = 0; k < 8; k++) { ws.send('5:1'); await wait(180); }
    await wait(1200);
    place(17.3, 0, 0); await wait(900);

    // ── (1) open ground: it builds, and keeps nothing
    const openMsg = (ws.send('14:12'), await ack('stencil'));
    const [openCells, openBelow, openAbove] = nums(openMsg);

    // ── (2) over a cave: three cellars put floors well under the foundation
    place(0, 0, 1.5708); await wait(500);
    for (let k = 0; k < 8; k++) { ws.send('5:1'); await wait(180); }
    await wait(1200);
    place(0, 15, 0); await wait(900);
    for (let k = 0; k < 3; k++) { ws.send('12:-1'); await wait(800); }
    const caveMsg = (ws.send('14:12'), await ack('stencil'));
    const [caveCells, caveBelow] = nums(caveMsg);

    // ── (3) under a bridge.
    //
    // ⚠ THE DECK HAS TO BE FLAT, and on raw hillside it is not: a storey is added
    // STOREY_H above each column's OWN top, so decks follow the terrain while a
    // roof is level. Over a radius-2 footprint on a hill the two pinch to 4 apart
    // and `F1` refuses — correctly, because no flat house fits under a sloping
    // deck. Measured, and it is the rule working, not the gate failing.
    //
    // So level the ground first, using the thing that levels it: a stencil floor
    // IS flat across its footprint. Place one, raise the decks off THAT, and the
    // deck is uniform by construction.
    place(0, 0, 3.1416); await wait(500);
    for (let k = 0; k < 8; k++) { ws.send('5:1'); await wait(180); }
    await wait(1200);
    place(-17.3, 0, 0); await wait(900);
    ws.send('14:12'); await ack('stencil');            // a flat floor and roof
    for (let k = 0; k < 2; k++) { ws.send('12:1'); await wait(900); }
    const bridgeMsg = (ws.send('14:12'), await ack('stencil'));
    const bn = nums(bridgeMsg);
    const bridgeCells = bn[0], bridgeAbove = bn[2];

    // ── (4) the same deck, but a roof at 18 leaves only 6 under it
    const tightMsg = (ws.send('14:18'), await ack('stencil'));

    // ── (5) the refusal changed NOTHING.
    //
    // Not a restatement of (4): a placement covers 19 columns and the tight roof
    // fits under the deck on some of them. Without the pre-flight, those would be
    // written and only the failing column would refuse — half a house, reported
    // as no house. It is observable: a partially written roof at 66 sits ABOVE
    // the next placement's band, so it would be COUNTED as kept, and this number
    // would exceed the 38 that the two real decks contribute.
    const againMsg = (ws.send('14:12'), await ack('stencil'));
    const againAbove = nums(againMsg)[2];

    const built      = openCells > 0 && openBelow === 0 && openAbove === 0;
    // EXACT, not "> 0". Three cellars under 19 columns is 57 kept cells, less
    // the one column whose top cellar fell inside the band and was reformed by
    // the floor — 56. A `> 0` test passes at 18, which is what a whole-column
    // replace leaves behind: it overwrites layers 0..n-1 and the deeper ones
    // survive by accident, so the cave looks preserved while most of it is gone.
    const keptCave   = caveCells === 19 && caveBelow === 56;
    const keptBridge = bridgeCells > 0 && bridgeAbove > 0;
    const refusedTight = tightMsg.startsWith('stencil refused (-11)');
    const atomic = againAbove === bridgeAbove;
    const ok = built && keptCave && keptBridge && refusedTight && atomic;
    console.log(JSON.stringify({ openMsg, caveMsg, bridgeMsg, tightMsg, againMsg,
                                 built, keptCave, keptBridge, refusedTight, atomic, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 90000);
