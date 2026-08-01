// A DECK HAS AN UNDERSIDE — the roof's soffit, one axis over.
//
// ⚠ CHECKED AND LEFT WHOLE. Both halves need a running world: one counts what the
// server actually EMITTED into a surface, the other counts pixels the renderer
// actually composited. A loft test can prove where a slab's faces are; only this can
// prove a deck was drawn with one.
//
// It is a thin wrapper on `tools/script.mjs tools/scripts/deck.keys`, which is where
// the rows live — the script IS the gate.
//
// Two instruments, because ONE IS NOT ENOUGH HERE and that is the finding:
//
//   `mesh soffit <lo> <hi>`   what reached the surface, off the wire. A roof's
//                             soffit and a floor's soffit are the same colour and
//                             the same surface, so inside a house a PICTURE reads
//                             `soffit 0.997` whether the deck has an underside or
//                             you are seeing the roof through it. The count does
//                             not care: 0 before the storey, 342 after — nineteen
//                             cells at six triangles each.
//   `frame … soffit … floor`  and a picture taken where a deck is the only thing
//                             overhead, because a count cannot say the face is at
//                             the right height or facing the right way.
//
// ⚠ `floor` IS THE PIXEL ROW, NOT `sky`. Nothing culls backfaces, so a deck with no
// underside is not a hole — it is its own TOP FAN seen from below, in timber. Seen
// red: `soffit 0` on the wire and `floor 0.9967` in the frame.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/deck.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
