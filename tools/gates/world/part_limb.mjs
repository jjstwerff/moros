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

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };

// The reserved block the display path draws limbs into — `PART_MESH_BASE` 5,
// `PART_MESH_MAX` 11, so ids 5..15. Kept in step with `editor_server.loft`.
const LIMB_LO = 5, LIMB_HI = 15;

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const says = [];
let slots = new Map();
ws.addEventListener('message', (e) => {
  const s = String(e.data);
  if (s.startsWith('S:')) says.push(s.slice(2));
  if (s.startsWith('M:')) {
    const b = s.slice(2), i = b.indexOf(';');
    const id = +b.slice(0, i);
    if (id < LIMB_LO || id > LIMB_HI) return;
    // `M:<id>;<flag>;<r>,<g>,<b>;<floats>` — an empty slot carries no float list at
    // all, which is how the display path clears one.
    const parts = b.slice(i + 1).split(';');
    const floats = parts.length >= 3 ? parts[2] : '';
    slots.set(id, floats.trim() === '' ? 0 : floats.split(',').length);
  }
});

// ⚠ WAIT FOR THE ANSWER, NOT FOR A CLOCK — the suite's own rule.
const until = async (fn, what, maxMs = 20000) => {
  for (let t = 0; t < maxMs; t += 25) { if (fn()) return true; await wait(25); }
  console.log(`  !! ${what} — never happened in ${maxMs}ms`);
  return false;
};
const openPart = async (name, want = true) => {
  slots = new Map();
  const before = says.length;
  ws.send(`44:${name}`);
  // ⚠ A CLOSE ACKNOWLEDGES WITH THE NAME IT HAD OPEN, NOT WITH THE EMPTY ONE IT WAS
  // SENT. Waiting for `part ''` matches nothing, so both closes ran the full 20 s
  // limit and the gate cost 43 s of which 40 was waiting for a string the server
  // will never say. The prefix is what the answer looks like, not what was asked.
  const want_ack = name === '' ? "part '" : `part '${name}'`;
  await until(() => says.slice(before).some((s) => s.startsWith(want_ack)),
              `'${name || '(close)'}' was never acknowledged`);
  // The display rebuild follows the open; wait for the slot block to stop moving
  // rather than guessing how long a mesh takes.
  //
  // ⚠ ONLY WHEN GEOMETRY IS EXPECTED. The first version waited for the total to
  // settle at a NON-ZERO value, so every close — where zero is the right answer —
  // ran the loop to its limit and the gate took 74 s instead of 12. A settle
  // condition that cannot be met by the correct outcome is a sleep with a reason
  // attached, which is the fault this suite spent a day removing.
  if (want) {
    let last = -1;
    for (let t = 0; t < 15000; t += 100) {
      const n = [...slots.values()].reduce((a, b2) => a + b2, 0);
      if (n === last && n > 0) break;
      last = n; await wait(100);
    }
  }
  return says.slice(before);
};
const drawnFloats = () => [...slots.entries()]
  .filter(([, n]) => n > 6).reduce((a, [, n]) => a + n, 0);

await new Promise((r) => ws.addEventListener('open', r));
ws.send('1:');
await until(() => says.length >= 1, 'the server never answered 1:');

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
    + `${[...slots.entries()].filter(([, n]) => n > 6).length} slot(s))`);
// ⚠ `A8.1`'s APOLOGY MUST BE GONE, and it is a separate check from the floats: a
// server that drew the limb AND still said it could not would be telling an author
// to look for something that is on their screen.
check(!cellSaid.some((s) => s.includes('cell-bodied and not drawn')),
      'and the server no longer says it cannot draw them');
check(!cellSaid.some((s) => s.includes('no body that can be drawn')),
      'and does not report it as bodyless');
await openPart('', false);   // close — no geometry expected, so nothing to settle for

// ── A8.2-ii — THE CONTROL: the .glb path still draws ────────────────────────
const meshSaid = await openPart('door/doorway');
const meshFloats = drawnFloats();
check(meshFloats > 0,
      `the SAME frame with a .glb leaf still draws (${meshFloats} floats) — without `
    + `this row, breaking meshes to draw cells would pass`);
check(!meshSaid.some((s) => s.includes('will not load')),
      'and nothing failed to load on the way');
await openPart('', false);

ws.close();
for (const r of rows) console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => m === ' PASS' ? '' : '  <-- FAIL')}`);
console.log(JSON.stringify({ gate: 'part_limb', cellFloats, meshFloats,
                             checks: rows.length, bad, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
