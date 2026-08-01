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
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
// Drives the character by PLACING it (7:<x>,<z>,<yaw>), never by walking.
// This is a WORLD gate: it measures terrain, streaming or levelling, and must
// not depend on locomotion — walking speed, stride or step timing. See
// tools/gates/README.md for why (a fixed-millisecond walk made this fail
// against working code the day the speed changed).
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);

let st = 0, tCount = 0; const ys = [], xs = [], zs = [], status = [];
const y = () => ys[ys.length - 1];
const here = () => [xs[xs.length-1], zs[zs.length-1]];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${p} ${limitMs}ms`); return `(no "${p}" in ${limitMs}ms)`;
};
// ⚠ WAIT FOR THE TRANSFORM, NOT A TIMER — and the transform is the *only* correct
// barrier here, because `S:placed` is not enough. Levelling drops its counter-peak
// from the per-tick hex-change block, which `placed` (sent inside the place handler)
// precedes. The `T:` broadcast sits AFTER that block in the same tick, so a fresh
// transform proves the levelling for this step has run. A place always produces one:
// the handler sets `moved`, and `T:` is emitted inside `if moved`.
// ⚠ A WALL-CLOCK DEADLINE, NOT A COUNT OF SLEEPS. This looped 8000 times over
// `await wait(1)` and called that "8000 ms" — but a 1 ms `setTimeout` is 1 ms only
// on an idle box. Inside the full suite, with thirty gates and two browsers running,
// each pass costs several milliseconds, so the budget is neither the stated time nor
// a fixed number of ticks: it stretches exactly when the barrier it guards is
// slowest. Observed once in eight suite runs — the gate took 14.3 s against 6.2 s
// alone and reported `onHill 2.8` against 3.88, which is a stale height read after a
// barrier that never completed.
//
// ⚠ THE GATE WAS RIGHT TO FAIL: `stalls === 0` is in its verdict, so a missed
// barrier is reported as a missed barrier and not smuggled out as a measurement.
// What is fixed here is only that the bound now means what it says. WHY a transform
// can go missing for eight seconds is NOT settled — if it is a real loss rather than
// a slow one, this will still fail, which is the outcome to want.
const nextT = async (limitMs = 8000) => {
  const before = tCount;
  const until = Date.now() + limitMs;
  while (Date.now() < until) {
    if (tCount !== before) return true;
    await wait(1);
  }
  return false;
};
let stalls = 0;
// March by PLACING, one hex-ish step at a time — levelling triggers on entering
// a cell, so a sequence of places drives it exactly as walking would, minus the
// dependence on how fast the character happens to move.
async function march(fromX, toX, stepX) {
  for (let x = fromX; (stepX > 0 ? x <= toX : x >= toX); x += stepX) {
    place(x, 0, 0);
    if (!(await nextT())) stalls++;
  }
}
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  // ⚠ x AND z, not just y. An earlier edit pushed only `ys`, so `here()`
  // returned undefined, `walkFor`'s distance check was NaN, and it spun its full
  // 20 s twice — walking 64 wu clean past the hill and reporting onHill 0
  // against working code. A distance-based walk needs the distance.
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('0;')) { const m = b.slice(2).split(',').map(Number);
    xs.push(m[12]); ys.push(m[13]); zs.push(m[14]); tCount++; }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 5; k++) ws.send('5:1');   // a hill ahead; ordered, no mesh read
    await march(1.5, 12.0, 1.5);                        // out onto the hill's flank
    const onHill = y();
    ws.send('6:1'); const froze = await ack('level');                   // freeze the level
    await march(10.5, 0.0, -1.5);                       // back down onto the plain
    const whileLevel = y();
    // ⚠ RELEASING IS ACKNOWLEDGED BY A TRANSFORM, not by a status line: the handler
    // puts the feet back on the ground (`py = terrain_y`) and sets `moved`, so the
    // next `T:` carries the released height. Its own comment records that without
    // that recompute this gate was unfalsifiable — so the barrier must be the `T:`.
    ws.send('6:0');
    if (!(await nextT())) stalls++;
    const afterLevel = y();
    const climbed  = onHill > 0.5;
    const frozen   = Math.abs(whileLevel - onHill) < 0.3;
    const ridgeKept = afterLevel > onHill - 0.5;      // did NOT fall to the plain
    const ok = climbed && frozen && ridgeKept && stalls === 0 && froze.startsWith('level');
    console.log(JSON.stringify({ onHill: +onHill.toFixed(2),
                                 whileLevel: +whileLevel.toFixed(2),
                                 afterLevel: +afterLevel.toFixed(2),
                                 froze, stalls, climbed, frozen, ridgeKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
