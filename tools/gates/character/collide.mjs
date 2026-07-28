// Collision gate (rung W2, moros#10) — WALLS STOP THE WALK, DOORWAYS DO NOT.
//
// A CHARACTER gate: it drives by WALKING, because locomotion is what is under
// test. The world gates place instead, deliberately — the suites are split by what
// they are allowed to break.
//
// Three legs of the same walk, from the centre of a hex, facing +x:
//
//   1. inside a fence ring   → it STOPS, and stops at the fence
//   2. with a gateway in it  → it walks through (`X70`: an opening is passable and
//                              is still a boundary — `fence.mjs` proves the second
//                              half by filling through it)
//   3. no fence at all       → the control: it does not stop
//
// ⚠ NOTHING HERE IS TIMED. "Blocked" is measured as *the position stopped moving
// while W was still held*, not as "it did not get far in N milliseconds" — which
// measures the box, and on a loaded machine reported a free walk as shorter than a
// blocked one. The distance is then read off the body's own matrix.
//
// ⚠ And it is a DISTANCE, not an arrival. A character that never moved also fails
// to arrive; the difference between "stopped at the fence" and "stopped at its own
// feet" is the entire feature, so the stop is checked against where the fence is.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, body = null;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
// The body's model matrix is column-major, so the translation is elements 12/13/14.
const posOf = () => (body ? [body[12], body[14]] : [NaN, NaN]);
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  await ack('placed');
  await wait(300);
  return posOf();
};
// Hold W until the character stops moving, or until the cap. Returns how far it
// went and whether it stopped of its own accord.
const walkTillStill = async (capMs = 6000) => {
  const from = posOf();
  ws.send('4:1');
  let last = from, still = 0, stopped = false;
  for (let t = 0; t < capMs; t += 250) {
    await wait(250);
    const now = posOf();
    if (Math.hypot(now[0] - last[0], now[1] - last[1]) < 0.01) still += 1; else still = 0;
    last = now;
    if (still >= 3) { stopped = true; break; }      // three quiet samples, not one
  }
  ws.send('4:0');
  await wait(400);
  const end = posOf();
  return { gone: +Math.hypot(end[0] - from[0], end[1] - from[1]).toFixed(3), stopped };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T') {
    const k = b.indexOf(';');
    if (Number(b.slice(0, k)) === 0) body = b.slice(k + 1).split(',').map(Number);
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    const R = 3;
    // The ring's outermost edge is half a hex beyond the last cell it contains, so
    // a walker leaving the centre due east meets it at (R + 0.5)·√3.
    const fenceAt = (R + 0.5) * SQ3;
    const out = { fenceAt: +fenceAt.toFixed(3) };

    // ── 3: the control first — open ground, nothing in the way.
    await placeAt(0, 0);
    const free = await walkTillStill();
    out.free = free;

    // ── 1: inside a fence ring, well away from the control's tracks.
    await placeAt(60, 0);
    ws.send(`23:3,${R}`);
    out.fenced = await ack('fenced');
    await placeAt(60, 0);
    const blocked = await walkTillStill();
    out.blocked = blocked;

    // ── 2: a gateway in the ring, on the cell due east of the centre.
    // `24:0,2` sets that cell's E edge — the outward one, since it is on the ring.
    await placeAt(60 + R, 0);
    ws.send('24:0,2');
    out.gate = await ack('edge 0 of');
    await placeAt(60, 0);
    const through = await walkTillStill();
    out.through = through;

    const controlRuns = !free.stopped && free.gone > fenceAt + 1.0;
    const stops = blocked.stopped;
    const stopsAtTheFence = blocked.gone > fenceAt - 1.2 && blocked.gone < fenceAt + 0.2;
    const gatewayPasses = !through.stopped && through.gone > fenceAt + 1.0;
    const ok = controlRuns && stops && stopsAtTheFence && gatewayPasses;
    console.log(JSON.stringify({ ...out, controlRuns, stops, stopsAtTheFence,
                                 gatewayPasses, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
