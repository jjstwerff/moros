// ⚠ THINNED, AND ITS OWN HEADER HAD NOT NOTICED. The four claims listed below were
// this gate's when it was written; two of them are now
// `lib/hex_editor/tests/field.loft` — `test_the_scatter_is_a_field_and_not_a_list`
// (scattering the same ground twice yields the same wood) and
// `test_a_denser_scatter_plants_more` — and `test_species_zero_clears` holds the
// third against the store. The verdict here is `emptied && grewOnHill && standsOn`,
// so those two are no longer checked here at all.
//
// ⚠ THE HEADER CLAIMING MORE THAN THE VERDICT CHECKS IS ITS OWN HAZARD: it reads as
// coverage that is not there, and the next person to thin this file would be thinning
// something already gone. What is left, and what needs a server, is what the mesher
// EMITTED — a tree stands on the ground it grows on, so a wood on a hill sits higher
// than one on the flat, and clearing empties the mesh with it.
// Vegetation gate (rung W5, moros#13) — "a forest that reads as landscape,
// not a list".
//
// The claim under test is not "trees appeared". It is that the forest is a
// FIELD, derived from the cell coordinate, rather than a set of remembered
// instances:
//   · scattering the same ground twice yields the SAME wood, not twice as much
//     — the property a stored RNG would break invisibly, since the second
//     stroke would merely look thicker;
//   · density is a dial, not a boolean — 80 must put down more than 20;
//   · clearing empties it, and the mesh empties with it;
//   · a tree stands on the ground it grows on, so a wood scattered on a hill
//     sits higher than one scattered on the flat.
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled 5 or 6 in a comparison. A chunk
// draws one mesh per surface on consecutive ids, so every decoder here depends on
// how many there are — and when the roof made it five, three decoders moved and
// the gates did not. Keep this equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 9;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit

import { connect, send, ask, until, report } from '../lib.mjs';

const g = await connect({ camera: true });
// The live chunk meshes as (id, floats) — `X:` retirements subtracted.
const live = () => {
  const out = [];
  for (const [id, b] of g.picture) {
    if (id <= 1000 || g.gone.has(id)) continue;
    const p = b.split(';');
    if (p.length >= 3 && p[2].length > 0) out.push([id, p[2].split(',').map(Number)]);
  }
  return out;
};
const isVeg = (id) => (id - 16) % SURFACES === 3;
const vegVerts = () => {
  let n = 0;
  for (const [id, d] of live()) if (isVeg(id) && d.length >= 6) n += Math.floor(d.length / 6);
  return n;
};
const topYOfKind = (k) => {
  let y = -1e9;
  for (const [id, d] of live()) if ((id - 16) % SURFACES === k && d.length >= 6)
    for (let i = 1; i < d.length; i += 6) if (Number.isFinite(d[i])) y = Math.max(y, d[i]);
  return y === -1e9 ? null : +y.toFixed(3);
};
const vegTopY = () => topYOfKind(3);
const lastCount = () => {
  const m = [...g.says].reverse().find((x) => x.startsWith('scattered'));
  return m ? Number(m.split(' ')[1]) : null;
};
const rebuilt = async () => {
  const before = g.says.length;
  return until(() => g.says.slice(before).some((x) => x.startsWith('rebuilt')),
               'no rebuild followed', 20000);
};
const settleVerts = async () => { await rebuilt(); return vegVerts(); };

await send(g, '7:0,0,0', ['placed']);

// ── scatter, then scatter the SAME ground again
await send(g, '13:1,30', ['scattered']);
const first = lastCount();
const vertsFirst = await settleVerts();
await send(g, '13:1,30', ['scattered']);
const second = lastCount();
const vertsSecond = await settleVerts();

// ── the dial
await send(g, '13:1,80', ['scattered']);
const dense = lastCount();
await settleVerts();

// ── clear
await send(g, '13:0,0', ['scattered']);
const cleared = lastCount();
const vertsCleared = await settleVerts();

// ── a tree stands on the ground it grows on.
//
// ⚠ The raise lands PEAK_AHEAD (10) hexes along the facing, which is OUTSIDE
// a radius-6 scatter — an earlier version raised ground the trees were
// nowhere near and then wondered why they had not moved. So: scatter here,
// raise the hill over there, walk onto it, scatter again.
await send(g, '13:1,60', ['scattered']);
await settleVerts();
const yFlat = vegTopY();
// a raise has no acknowledgement of its own — `rebuilt` is the one that says
// the ground it changed has reached the client
for (let k = 0; k < 4; k++) await send(g, '5:1', ['rebuilt']);
await send(g, '7:17.3,0,0', ['placed']);
await send(g, '13:1,60', ['scattered']);
const onHill = lastCount();
const vertsHill = await settleVerts();
const yHill = vegTopY();
const groundTop = topYOfKind(0);
const kindTop = (k) => { let y=-1e9; for (const [id,d] of live()) if ((id-16)%4===k && d.length>=6) for (let i=1;i+5<d.length;i+=6) y=Math.max(y,d[i]); return y===-1e9?null:+y.toFixed(3); };


const cells = 1 + 3 * 6 * 7;                    // a radius-6 disc
const inBand    = first > cells * 0.15 && first < cells * 0.45;
const idempotent = second === first && vertsSecond === vertsFirst;
const dialled   = dense > first;
const emptied   = cleared === 0 && vertsCleared === 0;
const grewOnHill = onHill > 0 && vertsHill > 0;
// the hill is ~6.25wu, so a wood on it must clear a wood on the flat by a
// margin no jitter could account for
const standsOn = yHill !== null && yFlat !== null && yHill > yFlat + 3;
// ⚠ THE COUNTS MOVED, THE PICTURE STAYED. That the forest is a FIELD — the
// same species at the same density over the same disc twice lands on exactly
// the same cells — and that density is monotonic and species 0 clears are
// `lib/hex_editor/tests/field.loft` now. `idempotent` and `dialled` below read
// the same numbers back through a socket, which is the model restating itself.
//
// What stays is emission: trees reach a MESH (`vertsFirst`), clearing removes
// it (`vertsCleared`), and a tree on a hill STANDS ON the ground rather than
// hovering at the flat's height (`standsOn`) — none of which the store can say.
const ok = emptied && grewOnHill && standsOn;
report(g, { cells, first, second, dense, cleared, onHill,
                             vertsFirst, vertsSecond, vertsCleared, vertsHill,
                             yFlat, yHill, groundTop,
                             inBand, idempotent, dialled, emptied, grewOnHill,
                             standsOn, ok }, ok);
