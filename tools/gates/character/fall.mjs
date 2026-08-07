// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
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
import { connect, send, ask, until, report, traceOf } from '../lib.mjs';

const g = await connect({ camera: true });
const trace = () => traceOf(g, '0;').map((b) => {
  const m = b.slice(2).split(',').map(Number);
  return [m[12], m[13], m[14]];
});
const col = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  const h = m.slice(m.indexOf('=') + 1).trim().split(',').map(Number);
  return h[h.length - 1];
};
// ⚠ BOUNDED, AND ITS EXPIRY IS THE SIGNAL. `T:` is broadcast only while the body is
// moving, so no transform means the walker has come to rest — which is the thing this
// gate is waiting to see.
const nextT = async (limitMs = 1500) => {
  const before = trace().length;
  return until(() => trace().length !== before, 'no transform (the body is at rest)', limitMs);
};

await send(g, '7:0,0,0', ['placed']);
for (let k = 0; k < 6; k++) await send(g, '5:1', ['rebuilt ']);
const summit = await col(10, 0);
const beyond = await col(13, 0);

// Stand ON the summit — a teleport is the only way up, which is itself the cliff
// working — then walk outward, off the far side.
await send(g, '7:17.3,0,0', ['placed']);
await nextT();
const i0 = trace().length - 1;
const yTop = trace()[i0][1];

// The clock, not the walk: `34:8` consumes the same FIXED ticks eight times faster, so
// the world is the one this gate has always measured and the waiting is not.
// (STATE.md: three rates, byte-identical worlds.)
await send(g, '34:8', ['rate ']);

g.ws.send('4:1');
for (let k = 0; k < 3000; k++) {
  if (!(await nextT())) break;
  const t = trace();
  if (t[t.length - 1][0] > 17.3 + 12.0) break;
}
g.ws.send('4:0');
await nextT();

// ⚠ THE RUN THAT MATTERS IS THE ACCELERATING ONE, not merely the descending one.
// Walking DOWN a slope also drops the feet every tick — steadily, at the terrain's
// gradient times the walking speed — and the first version of this gate measured that
// instead and called the fall non-accelerating. Free fall is the run where each drop is
// LARGER than the one before, which is what a constant acceleration means and what a
// walk down a ramp is not.
const tr = trace();
let best = 0, run = 0, bestFirst = 0, bestLast = 0, first = 0, last = 0;
let biggest = 0, prev = 0;
for (let i = i0 + 1; i < tr.length; i++) {
  const d = tr[i - 1][1] - tr[i][1];
  if (d > biggest) biggest = d;
  if (d > 0.0001 && d > prev * 1.001) {
    if (run === 0) first = prev > 0.0001 ? prev : d;
    run++; last = d;
    if (run > best) { best = run; bestFirst = first; bestLast = last; }
  } else { run = 0; }
  prev = d;
}
const yEnd = tr[tr.length - 1][1];

const descended = yTop - yEnd > 1.0;           // it really went down
const spread = best >= 4;                      // accelerating over many ticks, not one
const accelerating = bestLast > bestFirst * 1.5;
// ⚠ and it must have LANDED, not still be going: the last few ticks are flat
const settled = tr.length > i0 + 6
  && Math.abs(tr[tr.length - 1][1] - tr[tr.length - 4][1]) < 0.01;
const ok = descended && spread && accelerating && settled;
report(g, {
  summitUnits: summit, beyondUnits: beyond,
  yTop: +yTop.toFixed(3), yEnd: +yEnd.toFixed(3),
  descent: +(yTop - yEnd).toFixed(3),
  acceleratingTicks: best,
  firstDrop: +bestFirst.toFixed(4), lastDrop: +bestLast.toFixed(4),
  biggestSingleDrop: +biggest.toFixed(4),
  descended, spread, accelerating, settled, ok,
}, ok);
