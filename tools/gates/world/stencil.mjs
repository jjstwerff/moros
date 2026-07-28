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
const column = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

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

    // ── (5) THE REFUSAL CHANGED NOTHING, with the conflict placed LATE.
    //
    // The clause below used to be untestable. A placement walks `dq` from -2 to
    // +2, so when the offending column is the FIRST one examined nothing has been
    // written yet and a missing pre-flight is invisible — the gate stayed green
    // with the check deleted. The conflict has to land at the END of the walk.
    //
    // So build it deliberately, on virgin ground where every height is known:
    //   · house A at hex (0,0) — floor 0, roof 12 — then two storeys, decks at
    //     24 and 36, uniform because A's own floor levelled the footprint;
    //   · stand 4 hexes west, at (-4,0), so B's footprint spans q -6..-2 and
    //     meets A's only at q = -2 — B's LAST `dq` band;
    //   · ask for a roof at 18. On the five virgin columns it simply builds; at
    //     q = -2 it leaves 6 under A's deck at 24, and eps is 8, so `F1` refuses.
    // Without the pre-flight the first four `dq` bands are already written when
    // the fifth refuses, and `15:` can see it: q = -6 holds a floor and a roof
    // instead of just the terrain it started with.
    place(0, 0, 0); await wait(900);
    ws.send('14:12'); await ack('stencil');
    for (let k = 0; k < 2; k++) { ws.send('12:1'); await wait(900); }

    place(-6.928, 0, 0); await wait(900);          // 4 hexes west: hex (-4,0)
    const farBefore = await column(-6, 0);
    const lateMsg = (ws.send('14:18'), await ack('stencil'));
    const farAfter = await column(-6, 0);

    // ── (6) the earlier refusal changed nothing either.
    //
    // Not a restatement of (4): a placement covers 19 columns and the tight roof
    // fits under the deck on some of them. Without the pre-flight, those would be
    // written and only the failing column would refuse — half a house, reported
    // as no house. It is observable: a partially written roof at 66 sits ABOVE
    // the next placement's band, so it would be COUNTED as kept, and this number
    // would exceed the 38 that the two real decks contribute.
    place(-17.3, 0, 0); await wait(900);
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
    const refusedLate = lateMsg.startsWith('stencil refused (-11)')
                        && lateMsg.includes('(-2,0)');
    // The claim is UNCHANGED, not empty: earlier scenes in this gate raised
    // ground that reaches here, so the column legitimately holds terrain. Without
    // the pre-flight it would hold that terrain PLUS a floor and a roof.
    const untouched = farAfter === farBefore;
    const atomic = againAbove === bridgeAbove;
    const ok = built && keptCave && keptBridge && refusedTight
               && refusedLate && untouched && atomic;
    console.log(JSON.stringify({ openMsg, caveMsg, bridgeMsg, tightMsg, lateMsg,
                                 farBefore, farAfter, againMsg,
                                 built, keptCave, keptBridge, refusedTight,
                                 refusedLate, untouched, atomic, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 90000);
