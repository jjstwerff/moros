// Fall gate — walking off a ledge is a DESCENT OVER TIME, not a teleport down.
//
// Before the fall existed the feet were `terrain_y(px, pz)` every tick, so leaving
// a ledge moved you to the lower ground in ONE tick. That reads as a fall in a
// screenshot and as nothing at all in a trace, which is why this gate measures the
// shape of the descent rather than its existence.
//
// ⚠ THE DISCRIMINATOR IS THAT THE DROP IS SPREAD AND ACCELERATING. A teleport puts
// the whole descent in a single tick; a fall spreads it over many and each is
// larger than the last, because that is what a constant acceleration does. So the
// gate asserts BOTH — many airborne ticks, and a later drop bigger than an earlier
// one — either of which alone a teleport could fake.
//
// And it asserts the walker got there on its own feet: it must walk OFF the ledge,
// which is only possible because a cliff stops a climb and not a descent.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
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
const nextT = async (limitMs = 1500) => {
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
    ws.send('7:0,0,0'); await ack('placed');
    for (let k = 0; k < 6; k++) ws.send('5:1');
    const summit = await col(10, 0);
    const beyond = await col(13, 0);

    // Stand ON the summit — a teleport is the only way up, which is itself the
    // cliff working — then walk outward, off the far side.
    ws.send('7:17.3,0,0'); await ack('placed');
    await nextT();
    const i0 = trace.length - 1;
    const yTop = trace[i0][1];

    // The clock, not the walk: `34:8` consumes the same FIXED ticks eight times

    // faster, so the world is the one this gate has always measured and the

    // waiting is not. (STATE.md: three rates, byte-identical worlds.)

    ws.send('34:8');

    ws.send('4:1');
    for (let k = 0; k < 3000; k++) {
      if (!(await nextT())) break;
      const p = trace[trace.length - 1];
      if (p[0] > 17.3 + 12.0) break;
    }
    ws.send('4:0');
    await nextT();

    // ⚠ THE RUN THAT MATTERS IS THE ACCELERATING ONE, not merely the descending
    // one. Walking DOWN a slope also drops the feet every tick — steadily, at the
    // terrain's gradient times the walking speed — and the first version of this
    // gate measured that instead and called the fall non-accelerating. Free fall
    // is the run where each drop is LARGER than the one before, which is what a
    // constant acceleration means and what a walk down a ramp is not.
    let best = 0, run = 0, bestFirst = 0, bestLast = 0, first = 0, last = 0;
    let biggest = 0, prev = 0;
    for (let i = i0 + 1; i < trace.length; i++) {
      const d = trace[i - 1][1] - trace[i][1];
      if (d > biggest) biggest = d;
      if (d > 0.0001 && d > prev * 1.001) {
        if (run === 0) first = prev > 0.0001 ? prev : d;
        run++; last = d;
        if (run > best) { best = run; bestFirst = first; bestLast = last; }
      } else { run = 0; }
      prev = d;
    }
    const yEnd = trace[trace.length - 1][1];

    const descended = yTop - yEnd > 1.0;           // it really went down
    const spread = best >= 4;                      // accelerating over many ticks, not one
    const accelerating = bestLast > bestFirst * 1.5;
    // ⚠ and it must have LANDED, not still be going: the last few ticks are flat
    const settled = trace.length > i0 + 6
      && Math.abs(trace[trace.length - 1][1] - trace[trace.length - 4][1]) < 0.01;
    const ok = descended && spread && accelerating && settled;
    console.log(JSON.stringify({
      summitUnits: summit, beyondUnits: beyond,
      yTop: +yTop.toFixed(3), yEnd: +yEnd.toFixed(3),
      descent: +(yTop - yEnd).toFixed(3),
      acceleratingTicks: best,
      firstDrop: +bestFirst.toFixed(4), lastDrop: +bestLast.toFixed(4),
      biggestSingleDrop: +biggest.toFixed(4),
      descended, spread, accelerating, settled, ok,
    }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
