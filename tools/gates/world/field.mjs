// ⚠ THINNED, AND THIS IS THE WIRE HALF. Every structural claim is
// `lib/hex_editor/tests/field.loft`: a fill stops at the ring that encloses it, an
// unenclosed one is refused rather than running away, a refused one leaves the world
// alone, the scatter is a FIELD and not a list, a denser scatter plants more, and
// species zero clears. All pure functions over a world in memory.
//
// What is left is that the `24:`/`25:` gestures carry it end to end — the refusal
// reaches the wire by name, the acknowledgement carries the count, and a rebuild
// follows. The verdict here reads acknowledgement strings only.
// Field gate (rung W3, moros#11).
//
// ⚠ Getting this to pass found a bug in ROADS, not in fields: road was laid at
// `last_hq`/`last_hr`, which only the walk tick updates, so every PLACEMENT paved
// the same stale hex and a placed path made a blob instead of a line. Row 5's gate
// passed anyway — it asked whether road cells existed and were flat, never whether
// they followed the path. This gate needs a closed ring, so it could not.
//
// The claim: a fill is BOUNDED or it is REFUSED. Enclose ground with road and the
// fill takes the inside; stand on open ground and it must refuse and change
// nothing — because a flood that stops at a cap leaves a field with an edge nobody
// drew, which looks like a bug in the fill rather than a gap in the fence.
//
// A WORLD gate: places, never walks. Surfaces are one mesh each, id ≡ 0/1/2 mod 3
// above the reserved figure block (0-15): ground, road, field.
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled 5 or 6 in a comparison. A chunk
// draws one mesh per surface on consecutive ids, so every decoder here depends on
// how many there are — and when the roof made it five, three decoders moved and
// the gates did not. Keep this equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 11;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit, rock, water

import { connect, send, ask, until, report } from '../lib.mjs';

const g = await connect({ camera: true });
// Vertices in surface `k` over live chunk meshes — `X:` retirements subtracted, so a
// field the server has dropped cannot still be counted.
const verts = (k) => {
  let n = 0;
  for (const [id, body] of g.picture) {
    if (id <= 1000 || g.gone.has(id) || (id - 16) % SURFACES !== k) continue;
    const p = body.split(';');
    if (p.length >= 3 && p[2].length > 0) n += p[2].split(',').length;
  }
  return n;
};

await send(g, '7:0,0,0', ['placed']);
const refused = await ask(g, '11:', 'field');
await send(g, '7:0,0,0', ['placed']);
const refusedField = verts(2);

const R = 16, ring = [];
for (let k = 0; k <= 32; k++) {
  const a = (k / 32) * Math.PI * 2;
  ring.push([+(R * Math.cos(a)).toFixed(2), +(R * Math.sin(a)).toFixed(2)]);
}
await send(g, '10:1', ['road']);
for (const [x, z] of ring) await send(g, `7:${x},${z},0`, ['placed']);
await send(g, '10:0', ['road']);

await send(g, '7:1,1,0', ['placed']);
const beforeFill = g.says.length;
const fillMsg = await ask(g, '11:', 'field');
// ⚠ THE `rebuilt` ACK IS WHAT MAKES THIS GATE REAL, and its control is in the note
// below: skip it and `filled` reads 0 on EVERY run. The old fixed sleep was simply long
// enough to usually win the race.
//
// ⚠ NOTHING IS SENT FOR IT. The fill itself dirties the chunks, so the rebuild is
// already coming — this waits for it among the lines the fill produced, rather than
// poking the socket with an empty message to have something to await.
await until(() => g.says.slice(beforeFill).some((x) => x.startsWith('rebuilt')),
            'the fill never produced a rebuild');
const rebuilt = g.says.slice(beforeFill).find((x) => x.startsWith('rebuilt')) ?? '';
const filled = verts(2);

const okMsg  = fillMsg.includes('field filled');
const sawRebuild = rebuilt.includes('rebuilt');

// ⚠ THE CLAIM IS `> 0`, NOT A COUNT, and that is deliberate. A chunk that is
// dirty but not on screen is dropped from the dirty set BY DESIGN — it will be
// built from the current world when it next comes into range — so the number
// counts loaded chunks, and on a slower box or a different view radius a 16 wu
// ring need not all have streamed in. It reads 3150 on six consecutive runs
// here; pinning that would be asserting the streamer's timing rather than the
// fill's boundedness, which is what this gate is about.
//
// The control that says the wait is what fixed this: skip the `rebuilt` ack and
// it reads **0 on every run**, not intermittently — the old fixed sleep was
// simply long enough to usually win the race.
// ⚠ WHAT IS LEFT HERE IS WHAT WAS DRAWN. That a fill stops at its ring (19
// cells at R=2, 37 at R=3), that an open one is refused, and that a refusal
// writes nothing are `lib/hex_editor/tests/field.loft` now — arithmetic against
// the store. What no store test can see is whether the field REACHED A MESH:
// `filled` counts vertices in the loaded chunks, and a fill that is perfect in
// the model and invisible on screen passes every test but this one.
const ok = refused.includes('field refused') && okMsg && sawRebuild && filled > 0;
report(g, { refusedOnOpenGround: refused, fieldAfterRefusal: refusedField,
                             filledInsideRing: okMsg, rebuilt, sawRebuild,
                             fieldVertsInLoadedChunks: filled, ok,
                             status: g.says.slice(-4) }, ok);
