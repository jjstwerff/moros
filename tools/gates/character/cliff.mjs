// Cliff gate — steep ground stops a walker, and gentle ground does not.
//
// ⚠ THE SECOND CLAUSE IS THE ONE THAT MAKES THIS A GATE. "Did not summit" alone
// passes for a character that cannot move at all — the same hole `collide.mjs`'s
// control leg exists to close. So this asserts BOTH: the hill is refused, and the
// walker still covers ground on the flat approach to it. `climb.mjs` holds the
// other end, proving a gentle rise is still climbed (0.619 wu over 8) — the two
// gates together say the threshold discriminates rather than merely blocks.
//
// Measured on correct code: the character walks the flat approach, stops at the
// foot, tops out around 0.66 wu against a 9.25 wu summit, and never traverses a
// gradient past ~26°. With the threshold disabled it summits at 9.085 and walks a
// 66.6° face — which is what this gate is here to keep out.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, body = null, tCount = 0;
const trace = [];
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find((x) => x.startsWith(p));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${p} ${limitMs}ms`); return `(no "${p}" in ${limitMs}ms)`;
};
// `T:` is broadcast only from inside `if moved`, so a standing character produces
// none — which is exactly what happens once the cliff stops the walk. So the wait
// is BOUNDED and its expiry is the signal, not a failure.
const nextT = async (limitMs = 1500) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 1) {
    if (tCount !== before) return true;
    await wait(1);
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
    ws.send('7:0,0,0'); await ack('placed');
    // A raise lands PEAK_AHEAD hexes along the facing; six presses gives the
    // documented 60°-plus flanks.
    for (let k = 0; k < 6; k++) ws.send('5:1');

    // the ground the walker will meet, read from the store
    const prof = [];
    for (let q = 0; q <= 12; q++) prof.push(await col(q, 0));
    const summitUnits = Math.max(...prof);

    // ⚠ EIGHT TIMES THE CLOCK, NOT A SHORTER WALK. The loop below waits for
    // transforms, and at real time this gate spent 143 SECONDS delivering them
    // while the server did 0.5 s of work. `34:8` consumes the same fixed ticks
    // faster — the walk integrates a fixed step precisely so the rate cannot
    // change the answer (STATE.md: three rates, byte-identical worlds).
    ws.send('34:8');

    const i0 = trace.length - 1;
    const x0 = trace[i0][0], z0 = trace[i0][2];
    ws.send('4:1');
    // Walk until the transforms stop arriving — the character has stopped — or
    // until it is clear past the summit. Neither branch is a timer on the answer.
    // ⚠ AND IT STOPS WHEN THE WALKER DOES. The distance test only fires for a
    // walker that gets somewhere; this gate is about one that is REFUSED, so it
    // used to wait out all 4000 ticks — 143 seconds of real time for a character
    // that stopped in the first two. Standing still for a second of simulation is
    // the answer arriving, not the answer being slow.
    let still = 0;
    for (let k = 0; k < 4000; k++) {
      const before = trace[trace.length - 1];
      if (!(await nextT())) break;
      const p = trace[trace.length - 1];
      if (Math.hypot(p[0] - x0, p[2] - z0) >= 17.0) break;
      still = Math.hypot(p[0] - before[0], p[2] - before[2]) < 0.0005 ? still + 1 : 0;
      if (still >= 30) break;
    }
    ws.send('4:0');
    await nextT();

    let worst = 0, peak = trace[i0][1];
    for (let i = i0 + 4; i < trace.length; i++) {
      if (trace[i][1] > peak) peak = trace[i][1];
      const a = trace[i - 1], c = trace[i];
      const run = Math.hypot(c[0] - a[0], c[2] - a[2]);
      const rise = c[1] - a[1];
      if (run > 0.001 && rise > 0) worst = Math.max(worst, rise / run);
    }
    const gone = Math.hypot(trace[trace.length - 1][0] - x0,
                            trace[trace.length - 1][2] - z0);
    const summitWu = summitUnits * 0.25;
    const deg = (g) => +(Math.atan(g) * 180 / Math.PI).toFixed(1);

    const groundIsSteep = summitUnits > 24;        // the hill really is a hill
    const refused = peak < summitWu * 0.35;        // nowhere near the top
    const noCliffWalked = worst < 1.0;             // never steeper than 45°
    const stillWalks = gone > 4.0;                 // ⚠ and it DID cover ground
    const ok = groundIsSteep && refused && noCliffWalked && stillWalks;
    console.log(JSON.stringify({
      summitHeightUnits: summitUnits,
      summitWu: +summitWu.toFixed(3),
      peakReached: +peak.toFixed(3),
      steepestWalkedDegrees: deg(worst),
      groundTravelled: +gone.toFixed(3),
      groundIsSteep, refused, noCliffWalked, stillWalks, ok,
    }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
