// A LIMB MADE OF CELLS IS DRAWN, AND A FINER ONE AT THE RATIO — plan 17 `A8.2`,
// `A8.2b`.
//
// ⚠ CHECKED AND LEFT WHOLE. What `expand` hands back is a `MeshAt` naming a part,
// and `hex_part/tests/place.loft` already tests that record to death — that a bound
// leaf comes out as a placement, where it lands, that its cells are in no world.
// None of that is restated here. What only a running editor can answer is whether
// the display path turned that record into TRIANGLES, because the meshing, the
// posing and the slot block all live in `editor_server.loft` and there is no
// library function to call instead.
//
// Four claims:
//
//   A8.2-i    a limb whose body is CELLS arrives on the wire with geometry in it.
//             `A8.1` left these counted and undrawn — the server said *"N bound
//             limb(s) are cell-bodied and not drawn yet"* — so the check is that
//             the slots carry floats AND that the apology is gone.
//   A8.2-ii   ⚠ THE CONTROL, AND WITHOUT IT THIS GATE CANNOT FAIL FOR THE RIGHT
//             REASON. `door/doorway` hangs the SAME frame with the `.glb` leaf, so
//             it must still draw. A change that drew cells by breaking meshes would
//             pass every check above.
//   A8.2-iii  the cell leaf really has no mesh — `door/plank.hxw` names no `.glb`
//             and no `.glb` exists beside it. Otherwise (i) is satisfied by the
//             path that already worked.
//   A8.2b     ⚠ A COUNT CANNOT SEE A SIZE. `hex_part/tests/scale.loft` owns the
//             ratio — that it is derived, which way up, and that the hinge scales
//             with the leaf — and none of that says the DISPLAY path used it. A
//             leaf drawn at twice its opening has exactly the same triangles as
//             one drawn right, so the only instrument is the extent of what
//             arrived: `door/slatted` must draw to `door/planked`'s height.
//
// ⚠ THE THREE DOORWAYS DIFFER IN ONE FIELD. `door/doorway` binds `door/oak`,
// `door/planked` binds `door/plank` and `door/slatted` binds `door/slat`; the frame,
// the socket, the paving and the swing are identical in all three. So a difference in
// what is drawn is a difference in the BODY and not in the fixture — which is `A6.3`'s
// rule for the statues, one step on.
import { existsSync, readFileSync } from 'node:fs';
import { connect, send, until, quiet, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const check = checker();

// The reserved block the display path draws limbs into — `PART_MESH_BASE` 8,
// `PART_MESH_MAX` 8, so ids 8..15. Kept in step with `editor_server.loft`.
//
// ⚠ IT WAS 5..15 AND THAT INCLUDED THE CART — plan 17 `A8.3`. `CART_BODY`,
// `CART_WHEEL_L` and `CART_WHEEL_R` are 5, 6 and 7, so the limb block and the cart
// wrote to one another's slots: opening a part deleted the cart, and the cart the
// `MSG_READY` handler sends a joining client overwrote the limbs. This gate passed
// throughout, because a float count cannot tell a door panel from a cart body — it
// was reading the cart and reporting a drawn limb.
const LIMB_LO = 8, LIMB_HI = 15;

const g = await connect();
// The limb slots, as float counts. `M:<id>;<flag>;<r>,<g>,<b>;<floats>` — an empty
// slot carries no float list at all, which is how the display path clears one.
const slotFloats = () => {
  const out = new Map();
  for (const [id, body2] of g.picture) {
    if (id < LIMB_LO || id > LIMB_HI) continue;
    // `picture` holds everything after the id: `<flag>;<r>,<g>,<b>;<floats>`, so the
    // float list is the THIRD field. Reading the second gives the colour, which
    // always has three commas — a slot that looks drawn whatever is in it.
    const parts = body2.split(';');
    const f = parts.length >= 3 ? parts[2] : '';
    out.set(id, f.trim() === '' ? 0 : f.split(',').length);
  }
  return out;
};
const openPart = async (name, want = true) => {
  g.picture.clear();
  // ⚠ A CLOSE ACKNOWLEDGES WITH THE NAME IT HAD OPEN, not with the empty one it was
  // sent — so the prefix is what the ANSWER looks like. Waiting for `part ''` cost
  // this gate 40 of its 43 seconds before the harness made the shape explicit.
  const lines = await send(g, `44:${name}`, [name === '' ? "part '" : `part '${name}'`]);
  // ⚠ SETTLE ONLY WHERE GEOMETRY IS EXPECTED, and count ARRIVALS rather than judging
  // them: a close settles at zero, which is the right answer, and a settle that
  // cannot accept it is a sleep with a reason attached.
  if (want) await quiet(() => g.meshes.length, 400, 15000, 'the limb block');
  return lines;
};
const drawnFloats = () => [...slotFloats().values()]
  .filter((n) => n > 6).reduce((a, b2) => a + b2, 0);
const drawnSlots = () => [...slotFloats().values()].filter((n) => n > 6).length;

// The limb block's bounding box, in world units — `A8.2b`.
//
// ⚠ A FLOAT COUNT CANNOT SEE A SIZE, which is why this exists beside `drawnFloats`.
// A leaf drawn at twice its opening has exactly the same triangles as one drawn
// right, so every count in this file agrees with a door hanging through the wall.
// The stride is 6 — `graphics::mesh_to_floats` writes pos+normal per vertex — so
// the positions are the first three of every six.
const limbBox = () => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const [id, body2] of g.picture) {
    if (id < LIMB_LO || id > LIMB_HI) continue;
    const parts = body2.split(';');
    if (parts.length < 3) continue;
    const fs = parts[2].trim();
    if (fs === '') continue;
    const nums = fs.split(',').map(Number);
    for (let i = 0; i + 5 < nums.length; i += 6) {
      for (let a = 0; a < 3; a++) {
        if (nums[i + a] < lo[a]) lo[a] = nums[i + a];
        if (nums[i + a] > hi[a]) hi[a] = nums[i + a];
      }
    }
  }
  return lo.map((v, i) => (Number.isFinite(v) ? hi[i] - v : 0));
};

// ── A8.2-iii — the fixture is cells, checked before it is relied on ──────────
const plankFile = `${ROOT}/door/plank.hxw`;
check(existsSync(plankFile), 'the cell leaf is in the library');
check(!existsSync(`${ROOT}/door/plank.glb`),
      'and there is no .glb beside it — the body can only be its cells');
// `MESH` is a tagged section; a part that names one carries the tag in its bytes.
const plankBytes = existsSync(plankFile) ? readFileSync(plankFile) : Buffer.alloc(0);
check(!plankBytes.includes(Buffer.from('door/plank.glb')),
      'and the document names no mesh file');

// ── A8.2-i — the cell limb is drawn ─────────────────────────────────────────
const cellSaid = await openPart('door/planked');
const cellFloats = drawnFloats();
const plankBox = limbBox();
check(cellFloats > 0,
      `a cell-bodied limb reaches the wire as geometry (${cellFloats} floats in `
    + `${drawnSlots()} slot(s))`);
// ⚠ `A8.1`'s APOLOGY MUST BE GONE, and it is a separate check from the floats: a
// server that drew the limb AND still said it could not would be telling an author
// to look for something that is on their screen.
check(!cellSaid.some((s) => s.includes('cell-bodied and not drawn')),
      'and the server no longer says it cannot draw them');
check(!cellSaid.some((s) => s.includes('no body that can be drawn')),
      'and does not report it as bodyless');
await openPart('', false);

// ── A8.2-ii — THE CONTROL: the .glb path still draws ────────────────────────
const meshSaid = await openPart('door/doorway');
const meshFloats = drawnFloats();
check(meshFloats > 0,
      `the SAME frame with a .glb leaf still draws (${meshFloats} floats) — without `
    + `this row, breaking meshes to draw cells would pass`);
check(!meshSaid.some((s) => s.includes('will not load')),
      'and nothing failed to load on the way');
await openPart('', false);

// ── A8.2b — THE FINE LEAF IS DRAWN AT THE RATIO, NOT AT ITS OWN SIZE ────────
//
// `door/slat` is `door/plank` re-authored at HALF the unit: three courses and two
// staves where the plank has two courses and one column, spanning twice as far in
// its own frame. Shrunk by `child.w_unit / parent.w_unit` it fills the same
// opening — so the two doorways must draw to the same HEIGHT.
//
// ⚠ THE HEIGHT IS THE AXIS WITH AN ANSWER. Both leaves' courses are `W_EPS` apart
// in their own steps, so the arithmetic is exact: the plank spans heights 1..9 at
// 0.25 and the slat 2..18 at 0.125, which is the same span once halved. The
// horizontal extents are NOT equal and are not asserted — two fine hexes halved
// tile no coarse hex exactly, and a check that pretended otherwise would be tuned
// rather than derived.
//
// ⚠ AND THE DISCRIMINATOR IS A FACTOR OF TWO, which is why a 15% window is not a
// tuned threshold: a display path that ignored `ma_scale` draws this leaf at 2.0×,
// nowhere near any tolerance a reader could argue about.
const slatFile = `${ROOT}/door/slat.hxw`;
check(existsSync(slatFile), 'the fine leaf is in the library');
const fineSaid = await openPart('door/slatted');
const fineFloats = drawnFloats();
const slatBox = limbBox();
check(fineFloats > 0,
      `a limb authored at another unit reaches the wire as geometry (${fineFloats} `
    + `floats in ${drawnSlots()} slot(s))`);
const ratio = plankBox[1] > 0 ? slatBox[1] / plankBox[1] : 0;
check(Math.abs(ratio - 1) < 0.15,
      `and it is drawn to the opening's height, not its own: the fine leaf spans `
    + `${slatBox[1].toFixed(3)} against the coarse leaf's ${plankBox[1].toFixed(3)} `
    + `(ratio ${ratio.toFixed(3)}; unscaled it would be 2.0)`);
// ⚠ THE CONTROL THAT THE FIXTURE IS REALLY FINER. Two staves and three courses is
// more geometry than one column and two courses; if the slat were a copy of the
// plank, the row above would pass on a scale of 1.0 applied to identical cells.
check(fineFloats > cellFloats,
      `and the fine leaf really is more geometry than the coarse one `
    + `(${fineFloats} floats against ${cellFloats}) — otherwise the ratio above `
    + `is a claim about two identical parts`);
check(!fineSaid.some((s) => s.includes('is not fully drawn')),
      'and nothing in the doorway was refused on the way');

// ── A8.3 — A CLIENT THAT JOINS WHILE A PART IS OPEN GETS THE LIMBS ──────────
//
// ⚠ THE CASE A PERSON IS. The display rebuild BROADCASTS the limb block and then
// says nothing until the authored part changes, so a page loaded after `44:`
// received the wall and no door — every picture taken that way was a doorway with
// nothing in it, and no count anywhere could see it because the wire had carried
// the limbs correctly to the client that was already listening.
//
// ⚠ AND IT IS A SECOND CLIENT, NOT A RE-READ. `g.picture` holds what THIS socket
// was sent; asking the same client again can only ever confirm what it already has.
const late = await connect();
await quiet(() => late.picture.size, 400, 15000, 'the late client');
const lateFloats = [...late.picture.entries()]
  .filter(([id]) => id >= LIMB_LO && id <= LIMB_HI)
  .filter(([, b]) => (b.split(';')[2] ?? '').trim() !== '').length;
check(lateFloats > 0,
      `a client that joins while a part is open is sent the limb block too `
    + `(${lateFloats} slot(s))`);
try { late.ws.close(); } catch { /* already gone */ }
await openPart('', false);

verdict(g, 'part_limb', check,
        { cellFloats, meshFloats, fineFloats,
          plankH: Number(plankBox[1].toFixed(4)), slatH: Number(slatBox[1].toFixed(4)),
          ratio: Number(ratio.toFixed(4)) });
