// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
// "The mouse is optional" — as a gate rather than a claim.
//
// This client NEVER sends a look message (3:). It steers with keys alone and
// requires both halves of navigation to work: the facing must change (A/D turn)
// and the position must change (W/S walk). If either needed the mouse, one of
// them stays frozen and this fails.
//
// Control: make A/D strafe again and turnedWithoutMouse goes false — the
// position still moves, so a position-only check could not tell the difference.
// ⚠ PART IDS ARE A CONTRACT WITH THE SERVER, and they moved once already.
// When the world went infinite the static ground mesh went away and PART_BODY
// slid from 1 to 0 — so this probe silently began reading the LEFT LEG as "the
// body" and kept PASSING, because a leg does move. Named constants and this
// note, because the failure was invisible: green, for the wrong reason.
// ⚠ AND IT WAS A 1.9-SECOND WINDOW, which failed TWO RUNS IN THREE — measured on
// unmodified code, so it was never about what it was testing. `facings: 0,
// positions: 0` is not a marginal count: it is the whole window elapsing with no
// transform in it, because a freshly started server can still be streaming its
// first chunks when the camera message arrives. The claim never needed a clock —
// it is "the facing changes and the position changes" — so it waits for the
// TRANSFORMS now, with a bound that is a failure timeout rather than a
// measurement. This is the last clock-paced gate; `hipskin` and `walk` count
// what arrived in a fixed window by design and are a different class.
const BODY = '0;';

import { connect, until, report, traceOf, rot9 } from '../lib.mjs';

// ⚠ THE MOUSE IS NEVER TOUCHED, AND THAT IS THE CLAIM. Every `3:` this gate could
// send goes through here, so *no look message was sent* is a fact about the run and
// not an intention — a bare `g.ws.send` would let one slip past unrecorded.
let sentLook = false;
const key = (m) => { if (m.startsWith('3:')) sentLook = true; g.ws.send(m); };

// The x,z of a column-major mat4 — where the body IS, as opposed to which way it faces.
const xz = (b) => {
  const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
  return m[12].toFixed(4) + ',' + m[14].toFixed(4);
};

const g = await connect({ camera: true });
const rot = () => traceOf(g, BODY).map(rot9);
const pos = () => traceOf(g, BODY).map(xz);
// Distinct values reaching `n`, or the bound elapsing. ⚠ THE EXPIRY IS THE GATE'S RED
// PATH — a strafing A/D never turns, and must not hang.
const distinct = (pick, n) =>
  until(() => new Set(pick()).size >= n, `only ${new Set(pick()).size} distinct of ${n}`, 15000);

key('4:8');                                 // hold D — turn
await distinct(rot, 3);
key('4:0');
const facings = new Set(rot()).size;

key('4:1');                                 // hold W — walk
await distinct(pos, 3);
key('4:0');

const turned = facings >= 3;
const walked = new Set(pos()).size >= 3;
const ok = turned && walked && !sentLook;
report(g, { facings, positions: new Set(pos()).size,
            turnedWithoutMouse: turned, walkedWithoutMouse: walked,
            everSentLook: sentLook, ok }, ok);
