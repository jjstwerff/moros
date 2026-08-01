// A CELLAR HAS A CEILING — the third recurrence of "something overhead with no
// underside", and the first one no single instrument could see.
//
// ⚠ CHECKED AND LEFT WHOLE. The structural half — *is the ground a ceiling when
// something is dug under it* — DID move out: `hex_editor::col_has_below` is a pure
// function with its claims in `lib/hex_editor/tests/storey.loft`, including both
// negative controls (open ground owes nothing; a deck overhead puts nothing under
// the ground). What is left here is what only a running world can answer: whether
// the renderer CALLS it, and whether what it emits stays under the ground it hangs
// beneath. That is this session's dominant defect class — six things were built,
// tested, and reaching nobody — so the call is the thing worth gating.
//
// Three instruments, because the first two are each blind to this on their own:
//
//   `mesh soffit`     what reached the surface. 342 → 684: every dug cell gets an
//                     underside AND a ceiling. Blind alone — see below.
//   `meshy soffit`    the same count inside a band of world y, and the reason this
//                     command exists. Digging a cellar puts 342 vertices into
//                     `soffit` whether or not a ceiling is drawn, because the
//                     cellar FLOOR's own underside goes in the same surface in the
//                     same colour. Seen red: 342, every one of them 3.0 wu BELOW
//                     the ground. A count cannot see a colour, a colour cannot see
//                     a count, and NEITHER can see a height.
//   `frame … soffit`  and a picture from OUTSIDE, which caught the first fix being
//                     wrong: a flat ceiling under a smoothed ground stands proud of
//                     it all round a plateau — `soffit 0.0187` of a hillside that
//                     must hold none. That row is why the ceiling is the ground's
//                     own surface dropped by a thickness rather than a flat fan.
//
// ⚠ THERE IS NO PICTURE FROM INSIDE, and that is a fact about the world rather than
// a thinned gate: nothing can stand in a cellar. `stair_cut` cuts the GROUND layer
// down, so a stair walked toward a cellar refuses on the world's floor long before
// it arrives — `stair refused (-1) the world's floor is 0`. Until a gesture connects
// the two, the wire is the only instrument that reaches in there.
//
// It is a thin wrapper on `tools/script.mjs tools/scripts/cellar.keys`, which is
// where the rows live — the script IS the gate.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/cellar.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
