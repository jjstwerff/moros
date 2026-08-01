// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
// Raise a hill ahead, walk into it, and watch the character's Y.
//
// ⚠ Walks a DISTANCE, not a duration. The first version held W for a fixed 6 s
// — which encoded the walking speed as a hidden constant, so doubling the speed
// sent the character over the summit and down the far side, and "monotonically
// ascending" failed against working code. A gate that breaks when a constant it
// never mentions changes is measuring the wrong thing.
//
// ⚠ AND IT REPORTS THE HEIGHT AT A FIXED DISTANCE, not the height wherever the
// walk happened to be cut off. Those are different measurements and only the first
// is reproducible. The old version polled every 50 ms and broke past the threshold,
// so the release point overshot by up to one poll of travel and `climbed` came out
// 0.743 one run and 0.682 the next — a 9% spread in the number the gate exists to
// report. The trace is a sampled curve; the answer is that curve evaluated at
// `TARGET`, interpolated between the two samples that bracket it, which makes the
// result a function of the TERRAIN and not of when anyone looked.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let st = 0, body = null, tCount = 0;
const trace = [];                       // every body transform, in order
const TARGET = 8.0;                     // wu of ground covered

const posOf = () => (body ? [body[12], body[13], body[14]] : null);
// ⚠ `T:` IS BROADCAST ONLY FROM INSIDE `if moved`, so once the character stands
// still there is no next one and waiting for one times out. `2:<aspect>,` sets
// `moved`, so the tick that follows broadcasts a fresh transform — a position can
// be REQUESTED. That is what makes the reads below barriers rather than guesses.
const freshPos = async (limitMs = 8000) => {
  const before = tCount;
  ws.send('2:1.5,');
  for (let t = 0; t < limitMs; t += 2) {
    if (tCount !== before) return posOf();
    await wait(2);
  }
  return null;
};
// Two requested reads that agree is a fixed point on the observable. There is no
// deceleration to wait out — `if fwd != 0.0` in the server means key-up stops the
// walk in the same tick — so this converges at once and says so if it does not.
const restingPos = async (limit = 200) => {
  let a = await freshPos();
  for (let k = 0; k < limit; k++) {
    const b = await freshPos();
    if (a && b && a[0] === b[0] && a[2] === b[2]) return { pos: b, rounds: k, ok: true };
    a = b;
  }
  return { pos: a, rounds: limit, ok: false };
};
const nextT = async (limitMs = 8000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 1) {
    if (tCount !== before) return true;
    await wait(1);
  }
  return false;
};

// Cumulative ground distance along the recorded path, from index `i0`.
const pathAt = (i0) => {
  const out = [0];
  for (let i = i0 + 1; i < trace.length; i++) {
    const a = trace[i - 1], b = trace[i];
    out.push(out[out.length - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]));
  }
  return out;
};
// Height at exactly `d` wu along the path — linear between the bracketing samples.
const yAtDistance = (i0, cum, d) => {
  for (let k = 1; k < cum.length; k++) {
    if (cum[k] >= d) {
      const span = cum[k] - cum[k - 1];
      const f = span > 0 ? (d - cum[k - 1]) / span : 0;
      const ya = trace[i0 + k - 1][1], yb = trace[i0 + k][1];
      return ya + (yb - ya) * f;
    }
  }
  return null;                          // never got there — the caller makes it red
};

ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T' && b.startsWith('0;')) {
    body = b.slice(2).split(',').map(Number);
    trace.push([body[12], body[13], body[14]]);
    tCount++;
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // A raise applies in full before the next message is read and this gate reads no
    // mesh, so the ordered wire is the whole barrier — no sleep, and nothing to ack.
    for (let k = 0; k < 4; k++) ws.send('5:1');

    const start = await restingPos();
    const i0 = trace.length - 1;
    const y0 = trace[i0][1];

    // Hold W and step forward one TRANSFORM at a time — the server's own tick, not
    // a 50 ms timer of ours — until the ground covered reaches TARGET.
    // The clock, not the walk: `34:8` consumes the same FIXED ticks eight times
    // faster, so the world is the one this gate has always measured and the
    // waiting is not. (STATE.md: three rates, byte-identical worlds.)
    ws.send('34:8');
    ws.send('4:1');
    let cum = [0];
    for (let k = 0; k < 4000; k++) {
      if (!(await nextT())) break;
      cum = pathAt(i0);
      if (cum[cum.length - 1] >= TARGET) break;
    }
    ws.send('4:0');
    const end = await restingPos();
    cum = pathAt(i0);
    // Concluded from the path, not from where the loop broke — a loop that gave up
    // for any other reason must not be able to claim the ground was covered.
    const reached = cum[cum.length - 1] >= TARGET;

    const yT = reached ? yAtDistance(i0, cum, TARGET) : null;
    const climbed = yT === null ? null : yT - y0;
    // Monotone over the WHOLE ascent, not the last 30 samples — the claim is that
    // walking into a slope never drops, and the walk is the thing being claimed of.
    const upto = trace.slice(i0, i0 + cum.length).map((p) => p[1]);
    const monotone = upto.every((v, k, a) => k === 0 || v >= a[k - 1] - 0.001);
    // The same evaluation from every other sample — see `halved` below.
    const dec = [0]; const decIdx = [i0];
    for (let i = i0 + 2; i < i0 + cum.length; i += 2) {
      const a = trace[decIdx[decIdx.length - 1]], b = trace[i];
      dec.push(dec[dec.length - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]));
      decIdx.push(i);
    }
    let yHalf = null;
    for (let k = 1; k < dec.length; k++) {
      if (dec[k] >= TARGET) {
        const span = dec[k] - dec[k - 1];
        const f = span > 0 ? (TARGET - dec[k - 1]) / span : 0;
        const ya = trace[decIdx[k - 1]][1], yb = trace[decIdx[k]][1];
        yHalf = ya + (yb - ya) * f;
        break;
      }
    }
    const sampleFree = yT !== null && yHalf !== null && Math.abs(yT - yHalf) < 0.01;
    const settled = start.ok && end.ok;
    // ⚠ 0.25, NOT 0.4, AND THE DIFFERENCE IS A BUG THIS GATE USED TO CONTAIN.
    // `climbed` is `yAtTarget - startY`, and `yAtTarget` is unchanged at 0.619 —
    // only the BASELINE moved. `startY` used to read 0 because the feet were
    // `start.y`, set once and refreshed only on a MOVE; the four raises above lift
    // the ground under the standing character to 1 height unit, which nothing
    // noticed until it walked. So the old 0.619 was 0.369 of climb plus 0.25 of
    // stale baseline, and 0.4 was a threshold fitted to that. Measured on correct
    // code with the feet tracking the ground: **0.369**, and 0.25 keeps the same
    // 1.5x margin the old pair had.
    const ok = reached && settled && sampleFree
               && climbed !== null && climbed > 0.25 && monotone;
    console.log(JSON.stringify({
      startY: +y0.toFixed(3),
      yAtTarget: yT === null ? null : +yT.toFixed(3),
      climbed: climbed === null ? null : +climbed.toFixed(3),
      target: TARGET,
      // ⚠ EXPECTED TO VARY, and reported for that reason: how far past TARGET the
      // tick that crossed it landed. That is the sampling granularity itself, and
      // keeping it in a field that is NOT a claim is what lets `climbed` be exact.
      // Measured at 0.109 … 0.429 across runs — which is precisely the error that
      // used to land in `climbed`.
      tickOvershoot: +(cum[cum.length - 1] - TARGET).toFixed(3),
      // Is the answer really a property of the CURVE? Evaluate it again from half
      // the samples: a curve read at a fixed abscissa barely moves under decimation,
      // while a last-sample reading moves by a whole step. This is the claim
      // "sampling-independent" made checkable inside one run.
      halved: yHalf === null ? null : +(yHalf - y0).toFixed(3),
      sampleFree, reached, settled, smooth: monotone, ok,
    }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
