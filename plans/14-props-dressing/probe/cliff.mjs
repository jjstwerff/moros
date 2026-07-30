// P-CLIFF — HOW STEEP A FACE WILL THE CHARACTER WALK UP TODAY?
//
// The goal is that steep ground should become a cliff that blocks movement
// automatically. Before designing that, measure what happens now — because the
// design's whole value is the size of this number.
//
// The editor says so in its own words at `editor_server.loft`:
//
//   > CLIMB. The feet follow the surface every tick, so walking into a slope
//   > walks UP it. No jump, no fall, no step limit yet — this is the ground being
//   > followed, not physics.
//
// And `walk_to` consults exactly one thing — `hex_edge::sweep_path` over an
// `EdgeSet`. Steepness is never consulted, so nothing can stop a climb.
//
// ⚠ The raise brush's own documentation records flanks of **74–83°**, and says
// they are WANTED. So this is not a brush to soften; it is ground a walker should
// not be able to ascend.
//
// The measurement: raise a hill, walk into its flank, and report the steepest
// gradient the character actually traversed — Δrise / Δrun between consecutive
// transforms. A gradient of 1.0 is 45°; the flanks here should be 3.5–8.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, body = null, tCount = 0;
const trace = [];
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find((x) => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
const nextT = async (limitMs = 8000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 5) {
    if (tCount !== before) return true;
    await wait(5);
  }
  return false;
};
const col = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  const h = m.slice(m.indexOf('=') + 1).trim().split(',').map(Number);
  return h[h.length - 1];
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('0;')) {
    body = b.slice(2).split(',').map(Number);
    trace.push([body[12], body[13], body[14]]); tCount++;
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // A hill ahead: the raise lands PEAK_AHEAD hexes along the facing, and each
    // press adds PEAK_STEP. Six presses is a tall one with the documented flanks.
    ws.send('7:0,0,0'); await ack('placed');
    for (let k = 0; k < 6; k++) ws.send('5:1');

    // The ground profile along +x, in height units, read from the store rather
    // than from the mesh — this is the shape the walker will meet.
    const prof = [];
    for (let q = 0; q <= 14; q++) prof.push(await col(q, 0));

    // Walk into it and record every transform.
    // ⚠ BOUND THE WALK, or it crosses the summit and comes down the far side —
    // the first run did exactly that (902 samples, ~100 wu) and reported a height
    // GAIN of zero for a character that had been over the top.
    const i0 = trace.length - 1;
    const x0 = trace[i0][0];
    ws.send('4:1');
    for (let k = 0; k < 4000; k++) {
      if (!(await nextT())) break;
      const p2 = trace[trace.length - 1];
      if (Math.hypot(p2[0] - x0, p2[2] - trace[i0][2]) >= 17.0) break;   // just past the peak
    }
    ws.send('4:0');
    await nextT();

    // The steepest gradient actually traversed, and where.
    let worst = 0, worstAt = null, gained = 0, peak = trace[i0][1];
    // skip the first samples: the feet settle onto the surface there, which is a
    // step, not a climb, and it dominated the first run's answer at x = 0.11
    for (let i = i0 + 4; i < trace.length; i++) {
      if (trace[i][1] > peak) peak = trace[i][1];
      const a = trace[i - 1], b2 = trace[i];
      const run = Math.hypot(b2[0] - a[0], b2[2] - a[2]);
      const rise = b2[1] - a[1];
      if (run > 0.001 && rise > 0) {
        const g = rise / run;
        if (g > worst) { worst = g; worstAt = [+b2[0].toFixed(2), +b2[1].toFixed(2)]; }
      }
    }
    gained = trace[trace.length - 1][1] - trace[i0][1];

    // The profile's own steepest step, for comparison: consecutive columns are
    // one hex apart (√3 wu east–west) and a height unit is 0.25 wu.
    let profWorst = 0;
    for (let i = 1; i < prof.length; i++) {
      const g = ((prof[i] - prof[i - 1]) * 0.25) / Math.sqrt(3);
      if (g > profWorst) profWorst = g;
    }

    const deg = (g) => +(Math.atan(g) * 180 / Math.PI).toFixed(1);
    console.log(JSON.stringify({
      profileHeightUnits: prof,
      groundSteepestGradient: +profWorst.toFixed(3),
      groundSteepestDegrees: deg(profWorst),
      walkedSteepestGradient: +worst.toFixed(3),
      walkedSteepestDegrees: deg(worst),
      walkedSteepestAt: worstAt,
      heightGained: +gained.toFixed(3),
      peakHeightReached: +peak.toFixed(3),
      summitHeightWu: +(37 * 0.25).toFixed(3),
      reachedTheSummit: peak > 37 * 0.25 - 0.3,
      // The whole point: did the walker ascend something no walker should?
      climbedACliff: worst > 1.0,
      samples: trace.length - i0,
    }));
    ws.close(); process.exit(0); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
