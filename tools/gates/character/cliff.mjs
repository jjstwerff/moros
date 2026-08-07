// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
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
import { connect, send, ask, until, report, traceOf, absenceWindow } from '../lib.mjs';

const g = await connect({ camera: true });
// Where the body has been, as x,y,z — `T:0;` is the body's own transform.
const trace = () => traceOf(g, '0;').map((b) => {
  const m = b.slice(2).split(',').map(Number);
  return [m[12], m[13], m[14]];
});
const col = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  const h = m.slice(m.indexOf('=') + 1).trim().split(',').map(Number);
  return h[h.length - 1];
};
// ⚠ `T:` IS BROADCAST ONLY FROM INSIDE `if moved`, so a standing character produces
// none — which is exactly what happens once the cliff stops the walk. So this wait
// is BOUNDED and its expiry is the SIGNAL, not a failure.
const nextT = async (limitMs = 1500) => {
  const before = trace().length;
  return until(() => trace().length !== before, 'no transform (the walker stopped)', limitMs);
};

await send(g, '7:0,0,0', ['placed']);
// A raise lands PEAK_AHEAD hexes along the facing; six presses gives the documented
// 60°-plus flanks.
for (let k = 0; k < 6; k++) await send(g, '5:1', ['rebuilt ']);

// the ground the walker will meet, read from the store
const prof = [];
for (let q = 0; q <= 12; q++) prof.push(await col(q, 0));
const summitUnits = Math.max(...prof);

// ⚠ EIGHT TIMES THE CLOCK, NOT A SHORTER WALK. This gate spent 143 SECONDS delivering
// transforms at real time while the server did 0.5 s of work. `34:8` consumes the same
// fixed ticks faster — the walk integrates a fixed step precisely so the rate cannot
// change the answer (STATE.md: three rates, byte-identical worlds).
await send(g, '34:8', ['rate ']);

const i0 = trace().length - 1;
const x0 = trace()[i0][0], z0 = trace()[i0][2];
g.ws.send('4:1');
// Walk until the transforms stop arriving — the character has stopped — or until it is
// clear past the summit. Neither branch is a timer on the answer. ⚠ AND IT STOPS WHEN
// THE WALKER DOES: this gate is about one that is REFUSED, so waiting out all 4000
// ticks was 143 s for a character that stopped in the first two. Standing still for a
// second of simulation is the answer arriving, not the answer being slow.
let still = 0;
for (let k = 0; k < 4000; k++) {
  const t0 = trace();
  const before = t0[t0.length - 1];
  if (!(await nextT())) break;
  const t1 = trace();
  const pt = t1[t1.length - 1];
  if (Math.hypot(pt[0] - x0, pt[2] - z0) >= 17.0) break;
  still = Math.hypot(pt[0] - before[0], pt[2] - before[2]) < 0.0005 ? still + 1 : 0;
  if (still >= 30) break;
}
g.ws.send('4:0');
await nextT();

const tr = trace();
let worst = 0, peak = tr[i0][1];
for (let i = i0 + 4; i < tr.length; i++) {
  if (tr[i][1] > peak) peak = tr[i][1];
  const a = tr[i - 1], c = tr[i];
  const run = Math.hypot(c[0] - a[0], c[2] - a[2]);
  const rise = c[1] - a[1];
  if (run > 0.001 && rise > 0) worst = Math.max(worst, rise / run);
}
const gone = Math.hypot(tr[tr.length - 1][0] - x0, tr[tr.length - 1][2] - z0);
const summitWu = summitUnits * 0.25;
const deg = (x) => +(Math.atan(x) * 180 / Math.PI).toFixed(1);

const groundIsSteep = summitUnits > 24;        // the hill really is a hill
const refused = peak < summitWu * 0.35;        // nowhere near the top
const noCliffWalked = worst < 1.0;             // never steeper than 45°
const stillWalks = gone > 4.0;                 // ⚠ and it DID cover ground
const ok = groundIsSteep && refused && noCliffWalked && stillWalks;
report(g, {
  summitHeightUnits: summitUnits,
  summitWu: +summitWu.toFixed(3),
  peakReached: +peak.toFixed(3),
  steepestWalkedDegrees: deg(worst),
  groundTravelled: +gone.toFixed(3),
  groundIsSteep, refused, noCliffWalked, stillWalks, ok,
}, ok);
