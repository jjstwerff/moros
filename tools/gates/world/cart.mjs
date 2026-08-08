// ⚠ THINNED, AND THIS IS THE POSE HALF — the wheel law below is no longer its claim.
// `lib/moros_sim/tests/cart_as_data.loft` holds it in eleven tests, several of them
// BIT-IDENTICAL: doubling the travel doubles the value, out and back closes exactly,
// the value is linear in travel across the range, and the rim, offset, axis and radius
// each come from the rig rather than from a constant.
//
// ⚠ AND THE HEADER BELOW STILL ARGUES FOR THAT LAW WHILE THE VERDICT IS
// `grounded && banked && bankSigned` — the travel figures are printed here and not
// judged. A header claiming more than the verdict checks reads as coverage that is not
// there. What is left, and what needs a world, is the cart's POSE: on the ground it is
// standing on, banked on a slope, and banked the right way round.
// Cart gate (rung W7, moros#14) — a cart whose wheels turn from DISTANCE
// TRAVELLED, not from elapsed time or accumulated steps.
//
// `hex_body` owns the rule: `wheel_value = travel / (2πr)`, and because the
// value is a FUNCTION of travel rather than a running total, two things follow
// that an accumulation cannot give you:
//
//   · doubling the distance doubles the value, exactly;
//   · rolling out and back returns the wheel to where it started, exactly —
//     an accumulation drifts and never quite closes.
//
// And the skid — `|r·θ − travel|` — is machine-ε for a true roll, which is the
// no-slip identity holding by construction. `slip` is the library's own defect
// knob and is left at 0 here.

import { connect, send, ask, report, traceOf } from '../lib.mjs';

const g = await connect({ camera: true });
const num = (m, key) => {
  const p = m.split(/\s+/);
  const i = p.indexOf(key);
  return i < 0 ? NaN : Number(p[i + 1]);
};
const roll = (d) => ask(g, `17:${d}`, 'cart travel');
// The wheels' own transforms, straight off the wire. A 4x4 column-major matrix carries
// its translation at 12..14, which is where each wheel ACTUALLY ended up — as distinct
// from where the server believes it put them.
const xyz = (b) => { const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
                     return [m[12], m[13], m[14]]; };
const lastOf = (prefix) => {
  const t = traceOf(g, prefix);
  return t.length ? xyz(t[t.length - 1]) : null;
};

const a = await roll(10);
const b2 = await roll(10);
const back = await roll(-20);

const v1 = num(a, 'value'), v2 = num(b2, 'value'), v0 = num(back, 'value');
const t1 = num(a, 'travel'), t2 = num(b2, 'travel'), t0 = num(back, 'travel');
const skid = Math.max(num(a, 'skid'), num(b2, 'skid'), num(back, 'skid'));

const doubles = Math.abs(v2 - 2 * v1) < 1e-12 && t2 === 20 && t1 === 10;
const closes = t0 === 0 && v0 === 0;
const noSlip = skid < 1e-9;
// ⚠ THE HILL HAS TO REACH THE CART, AND FOR YEARS IT DID NOT. `3:200,0` turned the
// author 1.2 rad, which puts the brush's centre about 14 wu off the cart's line —
// its 7-hex dome never came near. What banked the cart was an ARTIFACT: an unwritten
// cell read back its chunk's window base, so raising anywhere lifted whole 32-hex
// chunks to a plateau and the cart crossed the step between two of them. With that
// fixed the old fixture reported `maxBank 0, banked false` — the gate's own
// void-guard, correctly firing on a run that met no slope at all.
//
// ⚠ AND THE SLOPE IT HAD BEEN MEETING WAS A STEP BETWEEN TWO FLAT PLATEAUS, so
// `grounded` — every wheel within a millimetre — had never once been asked about a
// real gradient. Pointed at one it failed, and that turned out to be the contact
// solve rather than the fixture. `3:60,0` with five raises now puts the cart across
// a genuine 0.695 rad flank — 40°, four times the bank the artifact ever produced:
//
//    bank (rad)     worst gap, old solve      worst gap, now
//      0.083            1.5e-8                  (the artifact's step)
//      0.245            3.5e-5                   5.6e-17
//      0.395            1.3e-3  ← failed         1.1e-16
//      0.695            9.8e-2  ← failed         4.4e-16
//
// The solve brackets a chord length now instead of iterating on the bank, so the
// answer is exact at any slope rather than converging as `s²` and refusing past 45°.
// `lib/moros_sim/tests/ground.loft` owns the rule; this is the cart meeting a real
// hillside with it.
g.ws.send('3:60,0');                        // turn, so the hill lands off-axis
for (let k = 0; k < 5; k++) g.ws.send('5:1');

const poses = [], axleEnds = [];
for (let k = 0; k < 10; k++) {
  poses.push(await ask(g, '17:1.5', 'cart pose'));
  const l = lastOf('6;'), r = lastOf('7;');
  axleEnds.push(l && r ? { l, r } : null);
}
const gaps = poses.flatMap(p => [num(p, 'gapl'), num(p, 'gapr')]);
const banks = poses.map(p => Math.abs(num(p, 'bank')));

// ── ⚠ THE BANK'S SIGN, WHICH WAS WRONG FOR A WHOLE RUNG AND INVISIBLE ────
//
// `gapl`/`gapr` used to be re-derived as `y ± half·sin(bank)` while the
// wheels were placed by `mat4_rotate_x(bank)` — and mesh3d's `rotate_x`
// turns about **−x**, the transpose of the sense the solve uses. The two
// disagreed by `2·half·sin(bank)`: measured, one wheel FLOATED 0.0914 wu and
// the other SANK the same on a 4.8° slope, while both gaps reported zero.
//
// Neither the gap clause nor the axle clause could see it. The gaps were the
// solve's own arithmetic; the axle is a length, and tilting an axle the wrong
// way does not change its length. What gives it away is the RELATION between
// the two hub HEIGHTS and the bank, so that is what this reads — off the
// transforms, the one place it cannot be re-derived away.
const hubRel = poses.map((p, i) => {
  const w = axleEnds[i];
  if (!w) return NaN;
  const half = Math.hypot(w.l[0] - w.r[0], w.l[1] - w.r[1], w.l[2] - w.r[2]) / 2;
  return (w.l[1] - w.r[1]) - 2 * half * Math.sin(num(p, 'bank'));
}).filter(v => Number.isFinite(v));
const bankSigned = hubRel.length > 0 && Math.max(...hubRel.map(Math.abs)) < 1e-9;
const worstHubRel = hubRel.length > 0 ? Math.max(...hubRel.map(Math.abs)) : NaN;

// a wheel is ON the ground: a millimetre, not a hand's width
const grounded = gaps.every(g => Number.isFinite(g) && Math.abs(g) < 1e-3);
// ── ⚠ THE AXLE CLAUSE AND ITS `1.1` ARE GONE — `A10` ────────────────────
//
// It used to assert `|axle - 1.1| < 1e-9` from the two wheel transforms. That
// literal was the THIRD home of a number the design's re-assertion table
// counted: the render transform, the contact solve, and here. The editor now
// reads it from the mount (`asm_cart` names it once, `asm_frames` and
// `body_axle` read it), so a gate restating it would be asserting the
// library's own arithmetic in a browser — and `A-RIGID` is already a property
// test over generated point pairs and joint values, with a `scale` knob that
// makes it fail. A stretch is caught there, not here.
//
// What stays is what genuinely needs a running world: the wheel's arithmetic,
// the GAP (which needs terrain), and `bankSigned` (which needs the emitted
// transforms). That is the shrinking the design predicted for this step.
// ...and the run actually met a slope, or the three clauses above are void
const banked = banks.some(b => b > 1e-3);
const worstGap = Math.max(...gaps.map(Math.abs));
const maxBank = Math.max(...banks);

// ⚠ THE WHEEL'S OWN RULE MOVED. `doubles`, `closes` and `noSlip` are arithmetic
// about `wheel_value` being a FUNCTION of travel rather than a running total,
// and they are `lib/moros_sim/tests/cart_as_data.loft` now — three assertions
// against the library, including a linearity sweep the single doubling case
// could not make. This file USED `wheel_value` for years without asserting it;
// the gate was the only thing that did, over a socket.
//
// What stays is the integration no library test can reach: the wheels sit ON
// the drawn ground, the cart BANKS with it, and the bank is signed the way the
// slope runs. They are read from the TRANSFORMS the server broadcast.
const ok = grounded && banked && bankSigned;
report(g, { a, b2, back, v1, v2, v0, t0, skid,
                             doubles, closes, noSlip,
                             worstGap, maxBank, grounded, banked,
                             worstHubRel, bankSigned, ok }, ok);
