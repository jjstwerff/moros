// K3f — WHAT IS OVERHEAD FROM INSIDE, and the answer is not what the design predicted.
//
// ⚠ **THIS GATE EXISTS BECAUSE `ceiling.keys` WAS RUN BY NOTHING.** `K3d` found the
// six camera scripts leave the SAME world and the SAME session to the byte — everything
// after the house is `send 40:`, `send 3:`, `snap` and `frame` — so no headless
// baseline can see them. `ceiling` and `lamp` had no runner at all; the script took
// three photographs a year and nobody looked at one.
//
// ⚠ **AND THE PHOTOGRAPHS WERE UNJUDGED EVEN WHEN TAKEN.** `frame` alone REPORTS a
// histogram; `frame <minSubject> <maxLargest> [surface lo hi]` also JUDGES. Every row
// in this script was the bare form, which is an instrument with no verdict attached.
// The bands are in the script, measured on a fresh server, so a reader sees the claim
// beside the gesture that makes it rather than in a JavaScript file.
//
// WHAT IT ESTABLISHES — measured 2026-08-24, and it REFUTES `CAMERA_INDOORS.md`'s
// "The roof has no underside": `emit_roof_plan` does emit one winding, but the client
// never enables backface culling, so from inside the soffit is a quarter of the frame
// and there is NO sky overhead at all. The prediction assumed a cull that is not there.
//
// ⚠ **ONE SCRIPT PER GATE, AND THAT IS NOT TIDINESS.** `run-gates.sh` gives each gate
// its own server; running several camera scripts through ONE would let the first
// script's world change the second's camera. Measured while writing this: `indoors`
// re-run against a server that had already run it answers `apart 5.864` where a fresh
// server answers `6.095` — the same commit, the same script, a different world under it.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node',
  ['tools/script.mjs', 'tools/scripts/ceiling.keys', '--shots'],
  { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
