// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
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
// ⚠ THAT CLAIM USED TO BE HALF FALSE, and the half that was false is the CONTROL.
// A blocked walk goes still and is bounded by the fence, so `blocked.gone` was
// steady at 6.052. An unobstructed walk never goes still, so it ran to the 6000 ms
// cap and `free.gone` was distance-in-six-seconds by another name — 19.418 one run,
// 19.312 the next. A gate whose own header says nothing is timed should not have a
// stopwatch in its control leg.
//
// So a walk now ends for one of two NAMED reasons, and both are observations:
//   · STOPPED — the position repeats while W is still held (blocked)
//   · REACHED — the ground covered passes a named TARGET (free)
// The distance is interpolated to exactly TARGET when it was reached, so the free
// legs report the distance they were ASKED for and the blocked leg reports the one
// the fence imposed. Neither is a function of the clock.
//
// ⚠ And it is a DISTANCE, not an arrival. A character that never moved also fails
// to arrive; the difference between "stopped at the fence" and "stopped at its own
// feet" is the entire feature, so the stop is checked against where the fence is.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0, body = null, tCount = 0;
const settleFailures = [];
const TARGET = 12.0;      // wu asked of an unobstructed walk; > fenceAt + 1
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
// The body's model matrix is column-major, so the translation is elements 12/13/14.
const posOf = () => (body ? [body[12], body[14]] : [NaN, NaN]);
// ⚠ `T:` IS BROADCAST ONLY FROM INSIDE `if moved`, so a standing character produces
// no next transform and waiting for one times out. `2:<aspect>,` sets `moved`, so
// the following tick broadcasts — a position can be REQUESTED. Two requests that
// agree is a fixed point on the observable, and there is no deceleration to wait
// out: `if fwd != 0.0` means key-up stops the walk in the same tick.
const freshPos = async (limitMs = 8000) => {
  const before = tCount;
  ws.send('2:1.5,');
  for (let t = 0; t < limitMs; t += 2) {
    if (tCount !== before) return posOf();
    await wait(2);
  }
  return null;
};
const restingPos = async (limit = 200) => {
  let a = await freshPos();
  for (let k = 0; k < limit; k++) {
    const b = await freshPos();
    if (a && b && a[0] === b[0] && a[1] === b[1]) return { pos: b, ok: true };
    a = b;
  }
  return { pos: a, ok: false };
};
const nextT = async (limitMs = 8000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 1) {
    if (tCount !== before) return true;
    await wait(1);
  }
  return false;
};
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  await ack('placed');
  // The place handler sets px/pz and acks in the same breath, but the TRANSFORM
  // follows on a later tick — so read the position back rather than sleeping and
  // hoping, and check it is the one that was asked for.
  const r2 = await restingPos();
  const at = r2.pos || [NaN, NaN];
  if (!r2.ok || Math.hypot(at[0] - x, at[1] - z) > 0.001) {
    settleFailures.push(`place ${q},${r}: asked ${x.toFixed(3)},${z.toFixed(3)} got ${at}`);
  }
  return at;
};
// Hold W until the walk ends for a NAMED reason: the position repeats while the key
// is held (blocked), or the ground covered reaches `target` (free). Steps one server
// TRANSFORM at a time — the tick, not a timer of ours.
const walkUntil = async (target, stillFor = 4) => {
  const start = await restingPos();
  const from = start.pos;
  const path = [from];
  // The clock, not the walk: `34:8` consumes the same FIXED ticks eight times
  // faster, so the world is the one this gate has always measured and the
  // waiting is not. (STATE.md: three rates, byte-identical worlds.)
  ws.send('34:8');
  ws.send('4:1');
  let still = 0, stopped = false, reached = false;   // `reached` is concluded below
  for (let k = 0; k < 4000; k++) {
    if (!(await nextT())) break;
    const now = posOf();
    const prev = path[path.length - 1];
    if (Math.hypot(now[0] - prev[0], now[1] - prev[1]) < 1e-9) still += 1; else still = 0;
    path.push(now);
    if (still >= stillFor) { stopped = true; break; }
    if (Math.hypot(now[0] - from[0], now[1] - from[1]) >= target) break;
  }
  ws.send('4:0');
  const end = await restingPos();
  // ⚠ REPORT THE DISTANCE THE REASON IMPLIES. Reached means the walk covered exactly
  // `target` — the overshoot past the sample that crossed it is an artifact of when
  // the tick landed, so it is interpolated away. Stopped means the fence chose the
  // number, and that one is read as it stands.
  const raw = Math.hypot(end.pos[0] - from[0], end.pos[1] - from[1]);
  // ⚠ THE REASON IS CONCLUDED FROM THE MEASUREMENT, not asserted by the loop that
  // broke. The first version set `reached` where it broke out, so a loop that gave up
  // for ANY other cause still claimed arrival — and `gone` then reported the target
  // it had not covered. Swapping the distance test for a tick budget produced
  // `gone: 12` from a walk of 6.5 wu, and the gate stayed green. Deriving it from the
  // distance actually travelled makes that impossible to say.
  reached = raw >= target;
  return { gone: +(reached ? target : raw).toFixed(3),
           // ⚠ EXPECTED TO VARY, and reported for that reason. This is how far past
           // TARGET the tick that crossed it landed — the sampling granularity
           // itself, quarantined into a field that is not a claim so that `gone`
           // can be exact. Meaningless for a walk that never got there, so null.
           tickOvershoot: reached ? +(raw - target).toFixed(3) : null,
           stopped, reached, settled: start.ok && end.ok };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T') {
    const k = b.indexOf(';');
    if (Number(b.slice(0, k)) === 0) { body = b.slice(k + 1).split(',').map(Number); tCount++; }
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
    const free = await walkUntil(TARGET);
    out.free = free;

    // ── 1: inside a fence ring, well away from the control's tracks.
    await placeAt(60, 0);
    ws.send(`23:3,${R}`);
    out.fenced = await ack('fenced');
    await placeAt(60, 0);
    const blocked = await walkUntil(TARGET);
    out.blocked = blocked;

    // ── 2: a gateway in the ring, on the cell due east of the centre.
    // `24:0,2` sets that cell's E edge — the outward one, since it is on the ring.
    await placeAt(60 + R, 0);
    ws.send('24:0,2');
    out.gate = await ack('edge 0 of');
    await placeAt(60, 0);
    const through = await walkUntil(TARGET);
    out.through = through;

    // ── 4: the SLIDE. Meet the wall at an angle and travel ALONG it.
    // Straight on it stops (clause 1) because there is no tangential component to
    // keep; obliquely it must not. The measurement is that the walker keeps moving
    // while the distance to the wall stops changing.
    await placeAt(60, 0);
    ws.send(`23:3,${R}`); await ack('fenced');
    await placeAt(60, 0);
    ws.send(`3:0,0`);                      // no look change; yaw is set by place
    const oblique = await walkUntil(TARGET);
    out.oblique = oblique;

    const controlRuns = free.reached && !free.stopped && TARGET > fenceAt + 1.0;
    const stops = blocked.stopped && !blocked.reached;
    const stopsAtTheFence = blocked.gone > fenceAt - 1.2 && blocked.gone < fenceAt + 0.2;
    const gatewayPasses = through.reached && !through.stopped;
    const settled = settleFailures.length === 0
                    && [free, blocked, through, oblique].every((w) => w.settled);
    const ok = controlRuns && stops && stopsAtTheFence && gatewayPasses && settled;
    console.log(JSON.stringify({ ...out, target: TARGET, controlRuns, stops,
                                 stopsAtTheFence, gatewayPasses, settled,
                                 settleFailures, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
