// ⚠ CHECKED AND LEFT WHOLE. Levelling is a MODE — it freezes the walker's height
// and writes nothing — so there is no store claim here to move. What it measures is
// the walk over several ticks and the ridge left behind, which lives in the
// server's tick and nowhere else.
// Levelling gate: climb a hill, freeze the level, walk out over the plain, and
// require a RIDGE to be left behind.
//
// Two things make this gate real, and it was FAKE without the second.
//
// 1. Turn levelling OFF at the end. While it is on the character's height is
//    frozen by definition, so "y stayed high" proves nothing; released, the feet
//    read the ground again.
// 2. WALK BACK THE WAY YOU CAME, onto virgin plain. The first version walked
//    FORWARD after climbing — but the hill's radius is 7 hexes and the walk
//    covered ~5, so the character never left it. "Still high" meant "still on
//    the hill", and the control (levelling writes no terrain at all) PASSED with
//    identical numbers. Only ground that would otherwise be flat can show that a
//    ridge was built.
// ⚠ Walks DISTANCES, not durations — see climbprobe. Fixed millisecond walks
// hid the speed constant, so doubling it carried the character past the ridge's
// far end and "ridge kept" failed against working code.

import { connect, send, ask, until, report, traceOf } from '../lib.mjs';

const g = await connect({ camera: true });
const bodies = () => traceOf(g, '0;').map((b) => b.slice(2).split(',').map(Number));
const y = () => { const t = bodies(); return t.length ? t[t.length - 1][13] : NaN; };
// ⚠ BOUNDED, AND A MISS IS COUNTED RATHER THAN IGNORED. `T:` arrives only while the body
// is moving, so a place that changes nothing produces none — `stalls` is what says a
// march step went unobserved, and it is asserted to be zero.
let stalls = 0;
const nextT = async (limitMs = 8000) => {
  const before = bodies().length;
  return until(() => bodies().length !== before, 'no transform', limitMs);
};
async function march(fromX, toX, stepX) {
  for (let x = fromX; (stepX > 0 ? x <= toX : x >= toX); x += stepX) {
    g.ws.send(`7:${x},0,0`);
    if (!(await nextT())) stalls++;
  }
}

// ⚠ NO ACK HERE, DELIBERATELY — 'ordered, no mesh read'. The wire is ordered and this
// gate reads no geometry, so the march below is its own barrier. Waiting for five
// `rebuilt` lines instead took the gate from 11 s to 33 s and bought nothing.
for (let k = 0; k < 5; k++) g.ws.send('5:1');       // a hill ahead
await march(1.5, 12.0, 1.5);                        // out onto the hill's flank
const onHill = y();
const froze = await ask(g, '6:1', 'level');                      // freeze the level
await march(10.5, 0.0, -1.5);                       // back down onto the plain
const whileLevel = y();
// ⚠ `6:0` ANSWERS NOTHING, so there is nothing to wait for — and waiting anyway is not
// merely slow, it is WRONG here: a 20-second poll for a line the server never says
// swallowed the very transform the next step counts, and `stalls` went 0 -> 1. The
// transform IS the acknowledgement.
g.ws.send('6:0');
if (!(await nextT())) stalls++;
const afterLevel = y();
const climbed  = onHill > 0.5;
const frozen   = Math.abs(whileLevel - onHill) < 0.3;
const ridgeKept = afterLevel > onHill - 0.5;      // did NOT fall to the plain
const ok = climbed && frozen && ridgeKept && stalls === 0 && froze.startsWith('level');
report(g, { onHill: +onHill.toFixed(2),
            whileLevel: +whileLevel.toFixed(2),
            afterLevel: +afterLevel.toFixed(2),
            froze, stalls, climbed, frozen, ridgeKept, ok }, ok);
