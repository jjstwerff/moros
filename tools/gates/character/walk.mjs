// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
// Walk gate: hold W, and require BOTH that the body moved and that a leg
// swung. Position alone would pass a figure sliding along like a chess piece;
// leg motion alone would pass one marching on the spot.
//
// ⚠ THE FIRST VERSION OF THIS GATE WAS FAKE, and its control proved it. It
// counted distinct LEG MATRICES — but a limb's world matrix is
// `body * translate * rotZ(swing)`, so it changes whenever the BODY moves.
// With the gait pinned to zero the gate still read 37 distinct leg poses and
// passed: it was measuring body motion twice.
//
// The fix is to look at the leg's ROTATION relative to the body's. `translate`
// does not touch a rotation, so with swing = 0 the leg's upper-3x3 is exactly
// the body's, and the count collapses to 1. That is the difference between a
// check that can fail and one that cannot.
// ⚠ PART IDS ARE A CONTRACT WITH THE SERVER, and they moved once already.
// When the world went infinite the static ground mesh went away and PART_BODY
// slid from 1 to 0 — so this probe silently began reading the LEFT LEG as "the
// body" and kept PASSING, because a leg does move. Named constants and this
// note, because the failure was invisible: green, for the wrong reason.
const BODY = '0;', LEG_L = '1;';
// ── ⚠ DRIVEN BY FRAMES, NEVER BY THE WALL CLOCK — plan 19 `L5` ──────────────
//
// This gate used to hold W for 1200 ms and judge at 1700 ms. A wall clock measures
// the MACHINE: with four interpreted servers sharing the box the same 1700 ms
// delivered **one** frame instead of 44, and the gate reported
// `{"frames":1,"bodyMoved":false}` — which reads as *the walk is broken* and means
// *nothing happened yet*. It passed alone on the same build, every time.
//
// So the phases advance on frames RECEIVED. A busy box now makes this gate slower
// and never wrong, which is the trade a gate should always take. Measured healthy:
// 44 leg frames; the counts below sit under that with room, and the run still has
// the 240 s backstop underneath it.
// ⚠ ONE COUNT, NOT TWO, AND MEASURING IT IS WHAT SAID SO. The first version held
// for 26 frames and judged at 40 — and hung at 27, because **the server sends a
// transform only while the body is moving**: releasing W stops the stream, so a
// count taken after the release can never be reached. So W is held until the
// verdict's own evidence exists, and released in the same breath as judging it.
const JUDGE_FRAMES = 34;   // frames observed WHILE walking, then release and judge

import { connect, send, until, report, traceOf, rot9 } from '../lib.mjs';

const g = await connect({ camera: true });
const legRot = () => traceOf(g, LEG_L).map(rot9);
const bodyRot = () => traceOf(g, BODY).map(rot9);
const bodyPos = () => traceOf(g, BODY);

// The clock, not the walk: `34:8` consumes the same FIXED ticks eight times faster,
// so the world is the one this gate has always measured and the waiting is not.
// (STATE.md: three rates, byte-identical worlds.)
await send(g, '34:8', ['rate ']);
g.ws.send('4:1');                                   // hold W

// ⚠ ONE COUNT, NOT TWO, AND MEASURING IT IS WHAT SAID SO. The first version held for
// 26 frames and judged at 40 — and hung at 27, because **the server sends a transform
// only while the body is moving**: releasing W stops the stream, so a count taken
// after the release can never be reached. So W is held until the verdict's own
// evidence exists, and released in the same breath as judging it.
const arrived = await until(() => legRot().length >= JUDGE_FRAMES,
  `only ${legRot().length} of ${JUDGE_FRAMES} leg frames arrived while walking`, 240000);
g.ws.send('4:0');                                   // release

const moved = bodyPos().length > 1 && bodyPos()[0] !== bodyPos()[bodyPos().length - 1];
// Distinct leg ROTATIONS. With no gait this is 1, because a limb's rotation is the
// body's rotation when the joint angle is zero.
const legRots = new Set(legRot()).size;
const bodyRots = new Set(bodyRot()).size;
const ok = arrived && moved && legRots >= 3;
report(g, { frames: legRot().length, bodyMoved: moved, bodyRots, legRots, ok }, ok);
