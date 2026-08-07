// ⚠ CHECKED AGAINST THE RULE AND LEFT WHOLE. Every number here comes from what
// was DRAWN or read back through the wire — the ground's height before and after a
// cellar, the cell the label points at. `hex_world` owns the rule (the ground is a
// reserved LABEL, not index 0) and tests it; this is the editor honouring it end to
// end, which is the half a store test cannot see.
// THE DRAWN GROUND IS THE GROUND, not whatever layer happens to be at index 0.
//
// The editor answered "which layer is the ground" with the constant `SURFACE = 0`
// in twelve places. That is correct until something is dug beneath it, and then
// layer 0 IS the cellar — so digging three cellars under a hill sank the drawn
// ground from 10.917 to 5.583 wu and `cell 0,10` went from `1,49` to `4,13`.
// The ground is now a reserved LABEL (`hex_world::LABEL_GROUND`), carried through
// every insert by the column write; see `doc/claude/WORLD_MODEL.md`.
//
// ⚠ THIS GATE ASSERTS BOTH HALVES, and the second is the one a screenshot misses.
// Fixing only the READ would draw a correct ground that editing no longer moves,
// because `terrain_set` wrote a ONE-ELEMENT column — index 0, positionally — so a
// raise would have raised the cellar floor. A gate that only checked the picture
// held still would have passed that. So it also raises again afterwards and
// requires the drawn ground to follow.
//
// ⚠ And it asserts the ground held at its EXACT height, not merely that it stayed
// above the cellars. "Did not sink" is the claim; a tolerance wide enough to
// admit some sinking would be measuring something else.

import { connect, send, ask, report, chunkFloats } from '../lib.mjs';

const g = await connect({ camera: true });
// The highest vertex the client was told about, over the CHUNK meshes only — the
// figure and the cart sit below id 1000 and would hide a ground that sank.
// ⚠ `X:` DROPS A CHUNK, and `chunkFloats` subtracts what the server retired — a mesh
// still in the picture after that is geometry the client has been told to forget.
const hi = () => {
  let h = -1e9;
  for (const d of chunkFloats(g)) for (let k = 1; k < d.length; k += 6) h = Math.max(h, d[k]);
  return +h.toFixed(3);
};

// A hill, raised one step at a time — `5:` has no ack of its own, so `rebuilt` is the
// barrier, and two raises in one flush produce only one of them.
await send(g, '7:0,0,1.5708', ['placed']);
for (let k = 0; k < 8; k++) await send(g, '5:1', ['rebuilt']);
const peakBefore = hi();
const cellBefore = await ask(g, '26:0,10', 'cell 0,10 =');
const colBefore  = await ask(g, '15:0,10', 'column 0,10 =');

// Dig three cellars under the hill's flank. The character moves off the summit first:
// a cellar needs headroom above it, and `storey refused` names the case.
await send(g, '7:0,15,0', ['placed']);
const digs = [];
for (let k = 0; k < 3; k++) digs.push(await ask(g, '12:-1', 'storey'));
await send(g, '26:0,10', ['cell 0,10 =']);      // an ordered read is the rebuild barrier
const peakAfter = hi();
const cellAfter = await ask(g, '26:0,10', 'cell 0,10 =');
const colAfter  = await ask(g, '15:0,10', 'column 0,10 =');
const labels    = await ask(g, '29:0,10', 'labels 0,10 =');

// THE WRITE SIDE. Back to the summit and raise once more.
await send(g, '7:0,0,1.5708', ['placed']);
await send(g, '5:1', ['rebuilt']);
const peakRaised = hi();

const dug = digs.every((d) => d.startsWith('storey -1'));
// four layers, and the cellars really are BELOW — otherwise "held" is vacuous
const stacked = colAfter.slice(colAfter.indexOf('=') + 1).trim().split(',').map(Number);
const inserted = stacked.length === 4 && stacked[3] > stacked[0];
// the ground carries the reserved label 1, and it is LAST — at the top, with its own
// height, which is the identity claim stated as a number
const lbls = labels.slice(labels.indexOf('=') + 1).trim().split(',').map(Number);
const groundLabelled = lbls.length === 4 && lbls[3] === 1;
const held = Math.abs(peakAfter - peakBefore) < 0.001;
const cellHeld = cellAfter === cellBefore;
const writeReaches = peakRaised > peakBefore + 0.1;
const ok = dug && inserted && groundLabelled && held && cellHeld && writeReaches;
report(g, { cellBefore, cellAfter, colBefore, colAfter, labels,
            peakBefore, peakAfter, peakRaised,
            dug, inserted, groundLabelled, held, cellHeld, writeReaches, ok }, ok);
