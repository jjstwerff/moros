// A LIMB MADE OF CELLS IS DRAWN — plan 17 `A8.2`.
//
// ⚠ CHECKED AND LEFT WHOLE. What `expand` hands back is a `MeshAt` naming a part,
// and `hex_part/tests/place.loft` already tests that record to death — that a bound
// leaf comes out as a placement, where it lands, that its cells are in no world.
// None of that is restated here. What only a running editor can answer is whether
// the display path turned that record into TRIANGLES, because the meshing, the
// posing and the slot block all live in `editor_server.loft` and there is no
// library function to call instead.
//
// Three claims:
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
//
// ⚠ THE TWO DOORWAYS DIFFER IN ONE FIELD. `door/doorway` binds `door/oak` and
// `door/planked` binds `door/plank`; the frame, the socket, the paving and the
// swing are identical. So a difference in what is drawn is a difference in the
// BODY and not in the fixture — which is `A6.3`'s rule for the statues, one step on.
import { existsSync, readFileSync } from 'node:fs';
import { connect, send, until, quiet, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const check = checker();

// The reserved block the display path draws limbs into — `PART_MESH_BASE` 5,
// `PART_MESH_MAX` 11, so ids 5..15. Kept in step with `editor_server.loft`.
const LIMB_LO = 5, LIMB_HI = 15;

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

verdict(g, 'part_limb', check, { cellFloats, meshFloats });
