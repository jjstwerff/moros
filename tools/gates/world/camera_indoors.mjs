// THE CAMERA INDOORS, AS NUMBERS — the frame's histogram and the eye's position.
//
// ⚠ CHECKED AND LEFT WHOLE. Both halves need a running world and a drawn frame,
// so neither can move into `lib/hex_editor/tests`: one counts pixels the renderer
// actually composited, the other reads the view matrix off the wire. A loft test
// can prove what the boom SOLVES; only this can prove what the client was TOLD.
//
// It is a thin wrapper on `tools/script.mjs tools/scripts/indoors.keys`, which is
// where the rows live — the script IS the gate, and duplicating its stations here
// would give the suite a second opinion about the same scene.
//
// Two claims, and they fail independently:
//
//   `cam <lo> <hi>`    where the EYE is, inverted out of the `C:` matrix. Outdoors
//                      it must sit a full boom back; indoors it must not. This is
//                      the direct test of the fault fixed on 2026-08-01 — the
//                      camera's ease was solved every tick and published on none,
//                      so the eye stood where the character last MOVED. Seen red:
//                      mid-floor read `apart 5.900`, the outdoor control's own
//                      number, from inside a house.
//   `frame <sub> <max>`  the histogram, classified by chromaticity so a lit surface
//                      and a shadowed one land in the same bucket. The subject at
//                      least half a percent of the frame, no single surface over
//                      60%.
//
// ⚠ THIS IS THE SUITE'S SLOWEST GATE — 56 s against a 17 s next-worst, because it
// is the only one that attaches a browser. The suite runs its gates in parallel,
// so it costs the suite its own wall time and not a sum: 24 s to 56 s. That is
// the price of the only gate here that looks at a picture.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node',
  ['tools/script.mjs', 'tools/scripts/indoors.keys', '--shots'],
  { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
// The rows the suite reports, pulled back out of the transcript: a gate that
// printed only `ok` would make a failure a re-run rather than a reading.
const rows = out.split('\n').filter((l) => /PASS|FAIL/.test(l)).map((l) => l.trim());
const ok = r.status === 0;
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
console.log(JSON.stringify({ rows, ok }));
process.exit(ok ? 0 : 1);
