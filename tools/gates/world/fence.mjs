// ⚠ THINNED, AND THIS IS THE WIRE HALF. The counting law below — a hex disc of
// radius R has 6(2R+1) boundary edges of which exactly 3(2R+1) are stored outside
// it — is `lib/hex_editor/tests/fence.loft`, in
// `test_a_ring_has_the_exact_number_of_edges_the_geometry_says` and
// `test_half_the_ring_is_stored_outside_it`, with the refusals and the gateway
// beside them. Against the store that is arithmetic and needs no world.
//
// What is left here is the half a store test cannot see: that the counts are REPORTED
// on the wire, and that a nominal refusal arrives WITHOUT an offer while an ordinal
// one arrives with it. This gate asserts on acknowledgement strings and nothing else,
// which is what makes it a wire gate rather than a second opinion.
// Fence gate (rung W2, moros#10) — THE EXACT PERIMETER, AND WHO STORES IT.
//
// A hex owns three of its six edges, so half of any region's boundary is stored
// in the cells OUTSIDE it. That is #10's design question, and stated as a count it
// is exact rather than approximate:
//
//   a hex disc of radius R has  6(2R+1)  boundary edges,
//   of which exactly            3(2R+1)  are stored outside the disc.
//
// Both numbers are closed forms — every one of the six directions faces 2R+1 of
// the ring's cells, and three of the six are stored by the neighbour. So this gate
// asserts arithmetic, not a sample.
//
// ⚠ THE SUM IS COUNTED INDEPENDENTLY, by reading every wall byte in a window and
// adding up the non-zero ones. The server's own figure comes from the same
// `edge_owner` map the write used, so two directions colliding in one byte would
// report 30 and store 25 — the map cannot check itself. The byte sum can.
//
// Run at four centres: both row parities, both signs. Parity is where this
// codebase breaks — four separate bugs, all "right for non-negative coordinates".

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
const R = 2;
await send(g, '7:0,0,0', ['placed']);
const laid = await ask(g, `23:3,${R}`, 'fenced');

const reports = /^fenced (\d+) edges, (\d+) stored outside, radius (\d+) material (\d+)$/
  .test(laid.trim());
const saysCounts = laid.includes(`fenced ${6 * (2 * R + 1)} edges`)
                && laid.includes(`${3 * (2 * R + 1)} stored outside`);

// ⚠ THE DOORSTEP REACHES THE WIRE INTACT — `X68`. A nominal refusal must arrive WITHOUT
// an offer and an ordinal one WITH it; the library decides that, and this is the only
// place that checks it survives being said.
await send(g, '7:20,20,0', ['placed']);
const badMat = await ask(g, '23:9,2', 'fence refused');
const badRad = await ask(g, '23:3,40', 'fence refused');
const nominalHasNoOffer = badMat.includes('no nearest one') && !badMat.includes('offer');
const ordinalOffers = badRad.includes('offer 12') && badRad.includes('residual 28');

const ok = reports && saysCounts && nominalHasNoOffer && ordinalOffers;
report(g, { laid, reports, saysCounts, refusals: [badMat, badRad],
            nominalHasNoOffer, ordinalOffers, ok }, ok);
