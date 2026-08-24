// K3f — EYES IS FIRST PERSON, and nothing was checking that it was.
//
// ⚠ **`eyes.keys` WAS RUN ONLY BY CHECKS THAT CANNOT SEE A CAMERA** — `probe/k3c` row
// B through the HEADLESS runner, to prove that runner refuses server-only messages,
// and `probe/k3d` on the world it leaves, which `K3d` measured to be byte-identical to
// five other scripts'. Nothing looked at a picture.
//
// WHAT IT ESTABLISHES — measured 2026-08-24 on a fresh server:
//
//     straight up, outdoors    sky    1.00      the control
//     straight up, indoors     soffit 1.00      and NO sky
//     straight down, indoors   floor  1.00      and no sky through it either
//     level, indoors           masonry 0.7162, soffit 0.2716
//     the eye, in EYES         apart 0.959      on the character
//     the eye, back in FOLLOW  apart 1.938      standing off again
//
// ⚠ **THE `cam` BANDS ARE DISJOINT — EYES under 1.3, FOLLOW over 1.6.** A mode that
// silently fell back to FOLLOW would keep every picture plausible and break one of
// these, which is the point of asserting the eye as well as the frame.
//
// ⚠ **AND `sky 1` IS NOT A ROUNDING.** Straight up outdoors is sky and nothing else,
// which is what makes it the control: if the pitch fence stopped the look short,
// something else is in shot and every row below is measuring the wrong frame.
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
  ['tools/script.mjs', 'tools/scripts/eyes.keys', '--shots'],
  { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
