// ⚠ THINNED, AND THIS IS THE WIRE HALF. The structure is
// `lib/hex_editor/tests/storey.loft` — a storey appends a layer above, three stack
// rather than replace, a cellar inserts at the bottom and the order still holds, the
// ground becomes a ceiling the moment something is dug under it, the stair opens only
// where the fold rule demands and is walkable end to end. Fourteen tests, negative
// controls included, none of which needs a server.
//
// What is left is the `12:` gesture's own acknowledgement — `storey -1 on N cells,
// stair of M` — matched as a shape, because the defect this rung closed was a CONSTANT
// FACTOR and any slack admits it back. This gate asserts on that string and nothing
// else.
// Storey gate (rung W4, moros#12) — the checkpoint the whole model rests on:
// a tower with a dungeon under it.
//
// What is gated is the LAYER STACK, not "a floor appeared":
//   · a floor above appends a layer, three times, on real ground
//   · a cellar INSERTS at the bottom, so stack order still holds
//   · a cellar with no room below is REFUSED, and refused for the RIGHT reason
//
// ⚠ The third clause is why the refusal codes are checked EXACTLY. The first
// version of this gate ran on an empty world, so every call refused with -1
// ("nothing to build on") — and the gate went green on a refusal it had not
// meant to test while the tower silently built nothing. A refusal gate that does
// not name the code is a gate that passes when the feature is absent.
//   -1 nothing to build on   -2 no room below the world   -10-N a column refusal

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
// ⚠ A STOREY ANSWERS WITH ITS OWN LINE *OR* A REFUSAL, and both are results here —
// waiting only for the success wording makes the two refusal cases pay the timeout.
const storeyAck = (msg) => ask(g, msg, 'storey');

// ── two hills, because the two clauses need two ground heights. A raise builds
//    PEAK_AHEAD(10) hexes along the facing at PEAK_STEP(6) per press: east is √3 wu/hex
//    → ~17.3 wu, north is 1.5 wu/hex → 15 wu.
await send(g, '7:0,0,0', ['placed']);
await send(g, '5:1', ['rebuilt']);                        // low hill east, peak 6
await send(g, '7:0,0,1.5708', ['placed']);
for (let k = 0; k < 4; k++) await send(g, '5:1', ['rebuilt']);   // high hill north, peak 24

// ── the tower: three floors on the low hill
await send(g, '7:17.3,0,0', ['placed']);
// ⚠ A STOREY COSTS ONE LAYER, and for a long time it cost eleven. That claim —
// "exactly one layer, however many columns it touches" — is
// `lib/hex_editor/tests/storey.loft` now, counting `ck_layers` directly. It needed `29:`
// LABELS and a socket to be visible at all when the only way in was through one;
// against the store it is a length.
const up = [];
for (let k = 0; k < 3; k++) up.push(await storeyAck('12:1'));

// ── the dungeon that CANNOT be: peak 6 < STOREY_H 12, so no room below
const cellarLow = await storeyAck('12:-1');

// ── the dungeon that can: peak 24 leaves room
await send(g, '7:0,15,0', ['placed']);
const cellarHigh = await storeyAck('12:-1');

const towerBuilt  = up.length === 3 && up.every((m) => /^storey \+1 on \d+ cells$/.test(m));
const refusedLow  = cellarLow.startsWith('storey refused (-2)');
// ⚠ A CELLAR NOW COMES WITH ITS STAIR, and the ack says so — `storey -1 on 19 cells,
// stair of 2`. This used to be anchored with `$` and went red on the extra clause, which
// is the anchor doing its job: the gesture's contract changed and a gate that shrugged
// at that would be worth less. The stair is asserted rather than merely tolerated,
// because a cellar with no way in is the defect this whole rung exists to close.
const cellarBuilt = /^storey -1 on \d+ cells, stair of [1-9]\d*$/.test(cellarHigh);
const ok = towerBuilt && refusedLow && cellarBuilt;
report(g, { tower: up, cellarLow, cellarHigh,
            towerBuilt, refusedLow, cellarBuilt, ok }, ok);
