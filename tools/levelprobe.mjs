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
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
let st = 0; const ys = [], xs = [], zs = [];
const y = () => ys[ys.length - 1];
const here = () => [xs[xs.length-1], zs[zs.length-1]];
async function walkFor(dist) {
  const [x0, z0] = here();
  ws.send('4:1');
  for (let i = 0; i < 400; i++) {
    await new Promise(r => setTimeout(r, 50));
    const [x, z] = here();
    if (Math.hypot(x - x0, z - z0) >= dist) break;
  }
  ws.send('4:0');
  await new Promise(r => setTimeout(r, 300));
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  // ⚠ x AND z, not just y. An earlier edit pushed only `ys`, so `here()`
  // returned undefined, `walkFor`'s distance check was NaN, and it spun its full
  // 20 s twice — walking 64 wu clean past the hill and reporting onHill 0
  // against working code. A distance-based walk needs the distance.
  if (t === 'T' && b.startsWith('0;')) { const m = b.slice(2).split(',').map(Number);
    xs.push(m[12]); ys.push(m[13]); zs.push(m[14]); }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 5; k++) { ws.send('5:1'); await wait(150); }   // a hill ahead
    await walkFor(8.0);                                                 // climb it
    const onHill = y();
    ws.send('6:1'); await wait(300);                                    // freeze the level
    ws.send('3:524,0'); await wait(300);         // about-face: 524 px ≈ π rad
    await walkFor(8.0);                                                 // back onto the plain
    const whileLevel = y();
    ws.send('6:0'); await wait(600);                                    // let go
    const afterLevel = y();
    const climbed  = onHill > 0.5;
    const frozen   = Math.abs(whileLevel - onHill) < 0.3;
    const ridgeKept = afterLevel > onHill - 0.5;      // did NOT fall to the plain
    const ok = climbed && frozen && ridgeKept;
    console.log(JSON.stringify({ onHill: +onHill.toFixed(2),
                                 whileLevel: +whileLevel.toFixed(2),
                                 afterLevel: +afterLevel.toFixed(2),
                                 climbed, frozen, ridgeKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 90000);
