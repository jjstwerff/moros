// Where does the occlusion gate's eye reading actually come from — and does it
// have a fixed point at all?
//
// Three wrong answers were measured out of the way first, and they are worth
// keeping because each one looked right:
//
//   1. "it samples mid-ease" — NO. `28:` reports `cam_rested true` on the first
//      ask, inside 50 ms, and the value never changes over the 2.5 s that follow.
//   2. "`cam_rate` keeps creeping" — NO. With yaw fixed the filter is 0 and the
//      boom is bit-stable.
//   3. "the eye is still moving when read" — NO. It is FROZEN; what varies is
//      WHERE it froze.
//
// The mechanism, measured: `cam_rested = dd < 0.001` is a tolerance, and the line
// below it stops the solve — `if cam_moved || !cam_rested`. So the boom parked up
// to 0.001 short of target forever, and which tick the ease crossed on decided
// where. Two runs of the same build: reach 5.324 residual 0.00098131, and reach
// 5.299 residual 0.00097224. Fixed by snapping to the target in the tick that
// declares rest, so rest means ARRIVED.
//
// What remains is a client-side confusion this probe is built to avoid: `C:` (the
// view matrix) and the `28:` reply are separate messages from different ticks, so
// reading one and then asking the other compares two moments. Back-solving the eye
// showed exactly that — the matrix was built from a boom the query no longer
// reported. The honest test is a fixed point on the OBSERVABLE: sample the eye
// until two consecutive view matrices are bit-identical. That is a real barrier
// now, because the server's rest is exact and a fixed point therefore exists.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, view = null, body = null, cViews = 0;
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 50) {
    await wait(50);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
const eyeOf = () => {
  const m = view, t = [m[12], m[13], m[14]];
  return [-(m[0]*t[0] + m[1]*t[1] + m[2]*t[2]),
          -(m[4]*t[0] + m[5]*t[1] + m[6]*t[2]),
          -(m[8]*t[0] + m[9]*t[1] + m[10]*t[2])];
};
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  await ack('placed');
};
// THE FIXED POINT, on the thing being measured. Two consecutive view matrices
// identical to the bit means the camera has stopped, whatever the reason — and it
// refuses rather than returning a value that never settled.
const settledEye = async (limit = 400) => {
  let prev = null, rounds = 0, seen = 0;
  while (rounds < limit) {
    const before = cViews;
    while (cViews === before) { await wait(10); }     // wait for a NEW matrix
    const now = view.join(',');
    if (prev === now) { seen++; if (seen >= 2) return { eye: eyeOf(), rounds, ok: true }; }
    else { seen = 0; }
    prev = now; rounds++;
  }
  return { eye: eyeOf(), rounds, ok: false };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T') { const k = b.indexOf(';');
    if (Number(b.slice(0, k)) === 0) body = b.slice(k + 1).split(',').map(Number); }
  if (t === 'C') { view = b.split(';')[0].split(',').map(Number); cViews++; }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && cViews === 1 && !st) { st = 1;
    // the gate's sequence, so the pitch arrives mid-flight exactly as it does there
    await placeAt(0, 0);
    await placeAt(40, 0);
    ws.send('23:3,2'); await ack('fenced');
    await placeAt(40, 0);
    await placeAt(80, 0);
    ws.send('23:1,2'); await ack('fenced');
    await placeAt(80, 0);

    const s1 = await settledEye();
    const rest = await ack('camera rested', 1) || '';
    ws.send('28:'); const restMsg = await ack('camera rested');
    const p = [body[12], body[13], body[14]];
    console.log(JSON.stringify({
      converged: s1.ok,
      rounds: s1.rounds,
      eyeX: s1.eye[0], eyeY: s1.eye[1], eyeZ: s1.eye[2],
      bodyX: p[0], bodyZ: p[2],
      reach: +Math.hypot(s1.eye[0]-p[0], s1.eye[2]-p[2]).toFixed(6),
      y: +s1.eye[1].toFixed(6),
      restMsg,
    }));
    ws.close(); process.exit(s1.ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 120000);
