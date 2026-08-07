// Part placement gate (plan 17 `A2.2`) — the authored house, over the wire.
//
// ⚠ THIS GATE IS THE WIRE HALF, AND IT IS DELIBERATELY THIN. The claim that the
// authored house IS the procedural house — cell for cell, edge for edge, label
// for label, and on `τ` — is a structural invariant and it lives where it can be
// stated exactly: `lib/hex_editor/tests/part_place.loft`, five tests over flat
// ground, a slope and a ceiling that refuses both paths. Restating it here would
// be a weaker copy of a stronger claim.
//
// What needs a RUNNING WORLD is everything that test cannot reach:
//   · `14:<roof>,<part>` is accepted, resolved to a file, and changes the world;
//   · the walls arrive with it — `part_diff` cannot see edges, and neither can
//     any height comparison;
//   · the RENDERER redraws it, because a house nobody meshed is not placed;
//   · a part that is not there, and a name that leaves `data/parts/`, are
//     refused BY NAME rather than read as an empty house.
//
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled. A chunk draws one mesh per surface
// on consecutive ids, so every decoder here depends on how many there are. Keep
// equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 9;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit

import { connect, send, ask, report, chunkFloats } from '../lib.mjs';

const g = await connect({ camera: true });
const column = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const walls = async (q, r) => {
  const m = await ask(g, `16:${q},${r}`, `walls ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
// Vertices in the ROOF surface, over live chunk meshes only. ⚠ The surface is picked by
// `(id - 16) % SURFACES`, so this count moves if a surface is ever added — keep
// `SURFACES` equal to the server's.
const roofVerts = () => {
  let n = 0;
  for (const [id, body] of g.picture) {
    if (id <= 1000 || g.gone.has(id) || (id - 16) % SURFACES !== 4) continue;
    const p = body.split(';');
    if (p.length >= 3 && p[2].length > 0) n += p[2].split(',').length;
  }
  return n;
};

await send(g, '7:17.3,0,0', ['placed']);
const procMsg = await ask(g, '14:12', 'stencil');
await send(g, '15:10,0', ['column 10,0 =']);      // an ordered read is the rebuild barrier
const roofAfterProc = roofVerts();
const procCentre = await column(10, 0);
const procEave   = await column(12, 0);
const procWalls  = await walls(12, 0);

await send(g, '7:69.3,0,0', ['placed']);
const partMsg = await ask(g, '14:12,house/cottage', 'stencil');
await send(g, '15:40,0', ['column 40,0 =']);
const roofAfterPart = roofVerts();
const partCentre = await column(40, 0);
const partEave   = await column(42, 0);
const partWalls  = await walls(42, 0);

const missingMsg = await ask(g, '14:12,house/nosuchthing', 'stencil');
const escapeMsg  = await ask(g, '14:12,../../worlds/gate', 'stencil');
const afterRefusals = await column(40, 0);

const placedFromPart = /^stencil placed \d+ cells from part 'cottage'$/.test(partMsg);
const sameCentre = procCentre === partCentre;
const sameEave   = procEave === partEave;
const sameWalls  = procWalls === partWalls;
const hasDoor = /(^|,)2(,|$)/.test(partWalls);
const drawn = roofAfterPart > roofAfterProc;
const refusedMissing = missingMsg.startsWith('stencil refused — part ')
                       && missingMsg.includes('nosuchthing');
const refusedEscape  = escapeMsg.includes('leaves the part library');
const untouched = afterRefusals === partCentre;

const ok = placedFromPart && sameCentre && sameEave && sameWalls && hasDoor
           && drawn && refusedMissing && refusedEscape && untouched;
report(g, { procMsg, partMsg, missingMsg, escapeMsg,
                                 procCentre, partCentre, procEave, partEave,
                                 procWalls, partWalls, afterRefusals,
                                 roofAfterProc, roofAfterPart,
                                 placedFromPart, sameCentre, sameEave, sameWalls,
                                 hasDoor, drawn, refusedMissing, refusedEscape,
                                 untouched, ok }, ok);
