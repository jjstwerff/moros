// K3f — THE HEAD-LAMP ADDS CONTRAST, and nothing was checking that it did.
//
// ⚠ **THIS GATE EXISTS BECAUSE `lamp.keys` WAS RUN BY NOTHING.** `K3d` found the six
// camera scripts leave the same world and the same session to the byte, so no headless
// baseline can see them; `ceiling` and `lamp` had no runner at all.
//
// ⛔ **AND TWO OF ITS FIVE ROWS PHOTOGRAPHED NOTHING.** `frame` judges the picture the
// script asked for and takes none of its own, so a `frame` with no `snap` since the
// last thing that moved the world is — in its own words — "a row about an unknown
// scene". The two rows without one were the FOLLOW rows: the CONTROL that the SNUG
// rows are read against. The comparison the file exists to make had never been made.
//
// WHAT IT ESTABLISHES — measured 2026-08-24 on a fresh server, mid-floor, same place:
//
//     FOLLOW inside   lum 0.2706   sd 0.0857
//     SNUG   inside   lum 0.1654   sd 0.1255
//
// A lamp lights what is NEAR and leaves what is far, so what it adds is CONTRAST: SNUG
// is a third darker and has 46% more luminance spread. ⚠ The two `sd` bands in the
// script are DISJOINT — FOLLOW under 0.098, SNUG over 0.105 — so a change that made
// SNUG light the room the way FOLLOW does breaks one of them. Overlapping bands would
// pass either way, which is the failure mode a pair of thresholds invites.
//
// ⚠ **ONE SCRIPT PER GATE, AND THAT IS NOT TIDINESS.** `run-gates.sh` gives each gate
// its own server; sharing one lets the first script's world move the second's camera.
// Measured while writing this: `indoors` re-run against a server that had already run
// it answers `apart 5.864` where a fresh server answers `6.095` — same commit, same
// script, a different world underneath.
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
  ['tools/script.mjs', 'tools/scripts/lamp.keys', '--shots'],
  { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
