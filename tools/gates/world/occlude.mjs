// Occlusion gate (rung W2, moros#10) — THE CAMERA'S CLASS, AND WHY IT IS NOT
// "DOES IT BLOCK MOVEMENT".
//
// A fence stops a character and is visually almost nothing. A castle wall is not
// terrain and obstructs totally. So the camera's question is neither "is it
// terrain" nor "does it block me" — it is **can the camera be INSIDE it**, because
// a volume you are inside fills the whole screen while a thing you see past costs
// a fraction of the frame (`EDITOR_SUBSTRATE.md`, settled before walls arrived).
//
// The measurement is the eye itself — reach and height — read out of the view
// matrix the server sends. Stand in the middle of a ring, once fenced and once
// walled:
//
//   open ground → the full boom
//   fence ring  → the full boom, unchanged   ← the clause that makes this a class
//   wall ring   → the eye is NOT INSIDE the wall
//
// ⚠ The last clause is an invariant, not a mechanism. The camera has two degrees
// of freedom and spends the cheaper one: measured here it LIFTS over a 3 wu wall
// (y 3.424 → 3.911) rather than pulling in, and both are correct. A gate written
// against "the boom gets shorter" would fail a camera that did the right thing.
//
// ⚠ AND FOR MOST OF THIS GATE'S LIFE IT MEASURED A CAMERA STILL IN FLIGHT. The
// ease past a wall takes about 2.5 s and the gate slept 1.5 — so `beside_wall` was
// read mid-move, 0.42 wu short of where the eye actually comes to rest, and the
// only symptom was the last digits wandering between runs. Removing the sleep is
// what exposed it; see the barrier below and STATE.md item 18.
//
// ⚠ And the fence clause is the one worth having. A camera that gave way to
// anything solid would sail through a gate that only checked the wall.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, view = null, body = null, cViews = 0;
const settleFailures = [];
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
// The view matrix is column-major and rigid: V = R·T(-eye), so its translation
// column is -R·eye and the eye is -Rᵀ·(that). Reading the eye any other way (the
// translation alone) gives a point that is not where the camera is.
const eyeOf = () => {
  if (!view) return null;
  const m = view, t = [m[12], m[13], m[14]];
  return [
    -(m[0] * t[0] + m[1] * t[1] + m[2] * t[2]),
    -(m[4] * t[0] + m[5] * t[1] + m[6] * t[2]),
    -(m[8] * t[0] + m[9] * t[1] + m[10] * t[2]),
  ];
};
const posOf = () => (body ? [body[12], body[13], body[14]] : null);
// Reach AND height, because the camera has two degrees of freedom and clears an
// obstruction with whichever costs less: it lifts first and shortens second. A
// gate that watched only the boom would call a camera that rose over the wall a
// failure, and a camera that walked through it a pass.
const cam = () => {
  const e = eyeOf(), p = posOf();
  if (!e || !p) return { reach: NaN, y: NaN };
  return { reach: +Math.hypot(e[0] - p[0], e[2] - p[2]).toFixed(3), y: +e[1].toFixed(3) };
};
// ⚠ WAIT FOR THE EASE TO ARRIVE, NOT FOR A COUNT OF MILLISECONDS. The boom and
// the lift each ease toward a target, so "where is the eye" has no answer until
// they get there — and this used to answer it with `await wait(1500)`, which is a
// statement about how fast this box is. It showed reach 5.324 / y 3.900 one run and
// 5.322 / 3.899 the next on identical code — and both were mid-ease, because the
// true rested reading is 5.346 / 3.911.
//
// `28:` asks the server for its own `cam_rested`, which is computed against the
// real targets rather than guessed at from outside. Two parts, and BOTH are needed:
//
//   1. poll until the server says rested — a barrier on the ease;
//   2. then ASK for a fresh view matrix and read that one. The matrix and the
//      status reply are separate messages from different ticks, so reading whichever
//      matrix happened to be in hand compares two moments — back-solving the eye
//      proved it, the matrix having been built from a boom the query no longer
//      reported. A `2:` request is answered from the state as it stands, so the
//      matrix read is the rested one by construction.
//
// It refuses rather than returning a number it could not stand behind — a silent
// fallback here would read as a camera that settled somewhere it never did.
const restQuery = async () => {
  ws.send('28:');
  const m = await ack('camera rested');
  // ⚠ REST MUST MEAN ARRIVED, and this is the clause that says so in ONE run. The
  // rest test is a tolerance (`dd < 0.001`) and it gates whether the solve runs at
  // all, so without a snap the boom parks up to 0.001 short of its target and stays
  // there — where it stopped decided by which tick the ease crossed on. From inside
  // a single run that is indistinguishable from correct: the value is frozen and
  // self-consistent. Only the last digits moving between runs betrayed it, and no
  // gate can see across runs. `boom == free` can.
  const boom = Number((m.match(/boom (\S+)/) || [])[1]);
  const free = Number((m.match(/free (\S+)/) || [])[1]);
  return { rested: m.includes('rested true'), boom, free,
           arrived: !m.includes('rested true') || boom === free, msg: m };
};
// ⚠ AND THE MATRIX HAS TO BE ASKED FOR. `C:` is sent from inside `if moved` in the
// tick loop, so once the camera is at rest there is no next one — waiting for it
// times out, which is how this was found. `2:<aspect>,` is a request: the handler
// replies with a `C:` built from the state as it stands right now. So the read is a
// request/response and not a hope that a broadcast is still coming.
const freshView = async (limitMs = 8000) => {
  const before = cViews;
  ws.send('2:1.5,');
  for (let t = 0; t < limitMs; t += 10) {
    if (cViews !== before) return true;
    await wait(10);
  }
  return false;
};
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  await ack('placed');
  let m = await restQuery(), rounds = 0;
  while (!m.rested && rounds < 400) { m = await restQuery(); rounds++; }
  const fresh = await freshView();
  if (!m.rested || !fresh || !m.arrived) {
    settleFailures.push(`${q},${r}: rested=${m.rested} arrived=${m.arrived} `
                        + `freshView=${fresh} after ${rounds} asks — ${m.msg}`);
  }
  return cam();
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T') {
    const k = b.indexOf(';');
    if (Number(b.slice(0, k)) === 0) body = b.slice(k + 1).split(',').map(Number);
  }
  if (t === 'C') { view = b.split(';')[0].split(',').map(Number); cViews++; }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    const R = 2;
    // The ring's edge sits half a hex beyond its outermost cell.
    const ringAt = (R + 0.5) * SQ3;
    const out = { ringAt: +ringAt.toFixed(3) };

    out.open = await placeAt(0, 0);                 // nothing in the way

    await placeAt(40, 0);
    ws.send(`23:3,${R}`); out.fenced = await ack('fenced');
    out.beside_fence = await placeAt(40, 0);

    await placeAt(80, 0);
    ws.send(`23:1,${R}`); out.walled = await ack('fenced');
    out.beside_wall = await placeAt(80, 0);

    // A wall is WALL_UP = 12 height units tall, and a height unit is 0.25 wu.
    const wallTop = 12 * 0.25;
    // Only interesting if the wall is nearer than the open boom reaches — else
    // there was nothing to give way to and every clause below is vacuous.
    const meaningful = out.open.reach > ringAt + 0.3;
    // THE INVARIANT: the eye is never inside a view-blocking wall. It may be
    // nearer than the wall, or higher than it — those are the camera's two ways
    // out, and either satisfies the rule.
    const outside = out.beside_wall.reach <= ringAt + 0.1 || out.beside_wall.y > wallTop;
    const wallGaveWay = outside
      && (out.beside_wall.reach < out.open.reach - 0.1
          || out.beside_wall.y > out.open.y + 0.1);
    // And a FENCE costs nothing at all — neither reach nor lift moves.
    const fenceIgnored = Math.abs(out.beside_fence.reach - out.open.reach) < 0.2
                         && Math.abs(out.beside_fence.y - out.open.y) < 0.2;
    const settled = settleFailures.length === 0;
    const ok = meaningful && fenceIgnored && wallGaveWay && settled;
    console.log(JSON.stringify({ ...out, wallTop, meaningful, fenceIgnored, outside, wallGaveWay,
                                 settled, settleFailures, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
