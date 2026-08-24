// K3f — CUTAWAY TAKES THE ROOF OFF, and nothing was checking that it did.
//
// ⚠ **`cutaway.keys` WAS RUN ONLY BY CHECKS THAT CANNOT SEE A CAMERA.** `probe/k3c`
// row B runs it through the HEADLESS runner to prove that runner refuses server-only
// messages, and `probe/k3d` reads the world it leaves — which `K3d` itself measured to
// be byte-identical to five other scripts', because everything after the house is
// `send 40:`, `send 3:`, `snap` and `frame`. Nothing looked at a picture.
//
// WHAT IT ESTABLISHES — measured 2026-08-24 on a fresh server, from the SAME spot
// mid-floor, FOLLOW then CUTAWAY:
//
//     FOLLOW    soffit 0.1941   grass absent    lum 0.2706   boom 2.152
//     CUTAWAY   soffit absent   grass 0.2601    lum 0.4334   boom 6.990
//
// The roof's underside is a fifth of the frame and then gone; the ground outside
// becomes visible from inside; the frame brightens; and the boom stands back because
// there is no longer a roof to stand under. ⚠ `soffit 0 0.001` is the whole verb, and
// the fourth row asserts the first row's numbers again — that is what the script's own
// "the mode is not a one-way door" means, and it was a bare `frame` judging nothing.
//
// ⚠ **ONE SCRIPT PER GATE.** `run-gates.sh` gives each gate its own server; sharing one
// lets the first script's world move the second's camera. Measured: `indoors` re-run
// against a server that had already run it answers `apart 5.864` where a fresh server
// answers `6.095` — same commit, same script, a different world underneath.
//
// ✅ **RE-MEASURED 2026-08-25 WITH THE BROWSER ATTACHED EARLY, AND NOTHING MOVED.** The
// bands above were taken while the browser attached LAZILY at the first `snap`, so the
// frames behind them could have been missing meshes broadcast before it connected —
// `eyes.keys` was demonstrably five short. Every value here is identical to four
// decimals under the early attach, with `held == wire` on every frame. The risk was
// real and it did not materialise for this script: the bands are confirmed, not
// merely un-refuted.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node',
  ['tools/script.mjs', 'tools/scripts/cutaway.keys', '--shots'],
  { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
