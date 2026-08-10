// ⚠ CHECKED AND LEFT WHOLE, and the file already argues it in its second sentence —
// this line is here because the rule is that it argues it at the TOP. `P1`'s band rule
// on a column is the model's, and `hex_world` tests it there; what this proves is that
// the EDITOR places a real structure by it, on ground someone walked to.
//
// The cases are the ones a column test states and cannot stage: a house over a deep
// cave keeps the cave, a house under a high bridge keeps the deck, and a house under a
// deck too close to fit is refused WHOLE rather than built halfway. Plus the roof, which
// is derived geometry and has to actually be drawn.
// Stencil gate (rung W4, moros#12) — `P1` end to end in a running world.
//
// The model's tests prove the band rule on a column. This proves the EDITOR
// places a real structure by it, on ground someone walked to:
//   · a house on open ground goes down, keeping nothing because there is
//     nothing to keep — the control that stops the cases below passing because
//     placement silently does nothing;
//   · a house over a deep cave keeps the cave (cells BELOW the band survive);
//   · a house under a high bridge keeps the deck (cells ABOVE it survive);
//   · a house under a deck too close to fit is REFUSED, whole — `F1` says it
//     does not fit, and the editor does not build half of it anyway;
//   · the ROOF is its own geometry: derived from the footprint, pitched by
//     ring, and actually drawn.
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled 5 or 6 in a comparison. A chunk
// draws one mesh per surface on consecutive ids, so every decoder here depends on
// how many there are — and when the roof made it five, three decoders moved and
// the gates did not. Keep this equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 11;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit, rock, water

import { connect, send, ask, report } from '../lib.mjs';

const lastLike = (p) => [...status].reverse().find(x => x.startsWith(p)) || '(none)';
// ⚠ WAIT FOR THE SERVER, NOT THE CLOCK. Every command below is acknowledged, and
// the wire is ORDERED — so an ack is a sequencing barrier for everything sent
// before it, and a fixed sleep is only ever a statement about how fast this box
// is. `field.mjs` is the record of what a guess costs when it stops winning.
//
// A RAISE HAS NO ACK OF ITS OWN and needs none: the handler applies it in full
// before the next message is read, so the NEXT command's ack covers it. That is
// only true because the raise now takes its origin from the character's actual
// position; it used to read the once-per-tick `last_hq`, and a raise sent in the
// same breath as a teleport landed underfoot. Removing these sleeps is what
// exposed that — see `probe/raise_origin.mjs`.
const nums = (m) => (m.match(/-?\d+/g) || []).map(Number);

const g = await connect({ camera: true });
const place = (x, z, yaw) => send(g, `7:${x},${z},${yaw}`, ['placed']);
const column = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const stencil = (msg) => ask(g, msg, 'stencil');
const storey = (msg) => ask(g, msg, 'storey');


// ── ground high enough to dig under. The raise lands 10 hexes along the
//    facing, so build the hill then walk onto it.
await place(0, 0, 0);
for (let k = 0; k < 8; k++) await send(g, '5:1', ['rebuilt']);
await place(17.3, 0, 0);

// ── (1) open ground: it builds, and keeps nothing
const openMsg = await stencil('14:12');
const [openCells, openBelow, openAbove] = nums(openMsg);

// ── (2) over a cave: three cellars put floors well under the foundation
await place(0, 0, 1.5708);
for (let k = 0; k < 8; k++) await send(g, '5:1', ['rebuilt']);
await place(0, 15, 0);
for (let k = 0; k < 3; k++) await storey('12:-1');
const caveMsg = await stencil('14:12');
const [caveCells, caveBelow] = nums(caveMsg);

// ── (3) under a bridge.
//
// ⚠ THE DECK HAS TO BE FLAT, and on raw hillside it is not: a storey is added
// STOREY_H above each column's OWN top, so decks follow the terrain while a
// roof is level. Over a radius-2 footprint on a hill the two pinch to 4 apart
// and `F1` refuses — correctly, because no flat house fits under a sloping
// deck. Measured, and it is the rule working, not the gate failing.
//
// So level the ground first, using the thing that levels it: a stencil floor
// IS flat across its footprint. Place one, raise the decks off THAT, and the
// deck is uniform by construction.
await place(0, 0, 3.1416);
for (let k = 0; k < 8; k++) await send(g, '5:1', ['rebuilt']);
await place(-17.3, 0, 0);
await stencil('14:12');            // a flat floor and roof
for (let k = 0; k < 2; k++) await storey('12:1');
const bridgeMsg = await stencil('14:12');
const bn = nums(bridgeMsg);
const bridgeCells = bn[0], bridgeAbove = bn[2];

// ── (4) the same deck, but a roof at 18 leaves only 6 under it
const tightMsg = await stencil('14:18');

// ── (4b) THE ROOF IS PITCHED, and the pitch is DERIVED, not stored.
//
// On open ground the house at hex (10,0) has floor = anchor and a roof that
// gains ROOF_PITCH (4) per ring inward from the eave: the outer ring at
// distance 2 is `anchor + 12`, distance 1 is `+16`, and the centre is `+20`.
// Exact numbers, because a derived pitch has no freedom in it — if the ridge
// is not 8 above the eave the rule is not the rule.
await place(17.3, 0, 0);
const centreCol = await column(10, 0);
const midCol    = await column(11, 0);
const eaveCol   = await column(12, 0);
const roofOf = (c) => { const h = c.split(',').map(Number); return h[h.length - 1]; };
const ridge = roofOf(centreCol), mid = roofOf(midCol), eave = roofOf(eaveCol);
const pitched = ridge - mid === 4 && mid - eave === 4;

// ── (5) THE REFUSAL CHANGED NOTHING, with the conflict placed LATE.
//
// The clause below used to be untestable. A placement walks `dq` from -2 to
// +2, so when the offending column is the FIRST one examined nothing has been
// written yet and a missing pre-flight is invisible — the gate stayed green
// with the check deleted. The conflict has to land at the END of the walk.
//
// So build it deliberately, on virgin ground where every height is known:
//   · house A at hex (0,0) — floor 0, roof 12 — then two storeys, decks at
//     24 and 36, uniform because A's own floor levelled the footprint;
//   · stand 4 hexes west, at (-4,0), so B's footprint spans q -6..-2 and
//     meets A's only at q = -2 — B's LAST `dq` band;
//   · ask for a roof at 18. On the five virgin columns it simply builds; at
//     q = -2 it leaves 6 under A's deck at 24, and eps is 8, so `F1` refuses.
// Without the pre-flight the first four `dq` bands are already written when
// the fifth refuses, and `15:` can see it: q = -6 holds a floor and a roof
// instead of just the terrain it started with.
await place(0, 0, 0);
await stencil('14:12');
for (let k = 0; k < 2; k++) await storey('12:1');

await place(-6.928, 0, 0);      // 4 hexes west: hex (-4,0)
const farBefore = await column(-6, 0);
const lateMsg = await stencil('14:18');
const farAfter = await column(-6, 0);

// ── (6) the earlier refusal changed nothing either.
//
// Not a restatement of (4): a placement covers 19 columns and the tight roof
// fits under the deck on some of them. Without the pre-flight, those would be
// written and only the failing column would refuse — half a house, reported
// as no house. It is observable: a partially written roof at 66 sits ABOVE
// the next placement's band, so it would be COUNTED as kept, and this number
// would exceed the 38 that the two real decks contribute.
await place(-17.3, 0, 0);
const againMsg = await stencil('14:12');
const againAbove = nums(againMsg)[2];

const built      = openCells > 0 && openBelow === 0 && openAbove === 0;
// EXACT, not "> 0". Three cellars under 19 columns is 57 kept cells, less
// the one column whose top cellar fell inside the band and was reformed by
// the floor — 56. A `> 0` test passes at 18, which is what a whole-column
// replace leaves behind: it overwrites layers 0..n-1 and the deeper ones
// survive by accident, so the cave looks preserved while most of it is gone.
const keptCave   = caveCells === 19 && caveBelow === 56;
const keptBridge = bridgeCells > 0 && bridgeAbove > 0;
const refusedTight = tightMsg.startsWith('stencil refused (-11)');
// the roof is DRAWN — surface kind 4 of 5. A rule nobody can see is a rule
// that will rot; vegetation taught this gate that the model and the picture
// are two claims.
// the only MESH claim in this gate, so this is the only place the picture has
// to have caught up with the world: `rebuilt` closes the server's own
// `Z:1` … `Z:0` transaction. The last stencil marked its chunks dirty and
// acked in the same handler, so that flush is necessarily still pending here.
// An ordered READ is the rebuild barrier: it cannot answer before what preceded it.
await send(g, '15:0,0', ['column 0,0 =']);
// Roof vertices over the LIVE chunk meshes — `X:` retirements subtracted.
let roofVerts = 0;
for (const [id, b] of g.picture) {
  if (g.gone.has(id) || (id - 16) % SURFACES !== 4) continue;
  const p = b.split(';');
  if (p.length >= 3 && p[2].length > 0) roofVerts += Math.floor(p[2].split(',').length / 6);
}
const refusedLate = lateMsg.startsWith('stencil refused (-11)')
                    && lateMsg.includes('(-2,0)');
// The claim is UNCHANGED, not empty: earlier scenes in this gate raised
// ground that reaches here, so the column legitimately holds terrain. Without
// the pre-flight it would hold that terrain PLUS a floor and a roof.
const untouched = farAfter === farBefore;
const atomic = againAbove === bridgeAbove;
const drawn = roofVerts > 0;
const ok = built && keptCave && keptBridge && refusedTight
           && refusedLate && untouched && atomic && pitched && drawn;
report(g, { openMsg, caveMsg, bridgeMsg, tightMsg, lateMsg,
                             farBefore, farAfter, againMsg,
                             ridge, mid, eave, roofVerts,
                             built, keptCave, keptBridge, refusedTight,
                             refusedLate, untouched, atomic, pitched, drawn, ok }, ok);
