// A CELLAR IS SOMEWHERE YOU CAN BE — a ceiling over it, and a stair into it.
//
// ⚠ CHECKED AND LEFT WHOLE. The structural half DID move out, and most of it: that
// the ground is a ceiling when something is dug under it (`col_has_below`), that an
// opened ground is told from an unauthored one by its COLUMN (`ground_open`), that
// the stair opens every tread and that each step is one a walker can climb — all of
// those are pure functions with their claims in `lib/hex_editor/tests/storey.loft`,
// negative controls included. What is left here is what only a running world can
// answer: whether the renderer CALLS any of it, and whether a walker driven through
// the socket actually arrives at the bottom.
//
// That is this session's dominant defect class — things built, tested, and reaching
// nobody — and it bit twice inside this one feature. The store held a correct stair
// while `ground_under` put the walker back on the floor it had just been given a
// hole through, because `sf_smooth` means "this column holds one layer" and an
// OPENED column holds one layer too. No loft test in `hex_editor` could see that:
// the defect was in the consumer's reading of a library answer.
//
// Four instruments, and each of the first three is blind to something the next one
// sees:
//
//   `mesh soffit`     what reached the surface. 0 before anything is dug — the row
//                     that catches the ground emitting an underside everywhere, for
//                     a face nothing can ever see. Blind to WHERE those faces are.
//   `meshr soffit`    the same count inside a band of height ABOVE THE GROUND, and
//                     the reason that command exists. Digging a cellar puts 342
//                     vertices into `soffit` whether or not a ceiling is drawn — the
//                     cellar FLOOR's own underside, same surface, same colour. Seen
//                     red: 342, every one of them 3.0 wu BELOW the ground.
//                     ⚠ IT WAS A WORLD-y BAND (`meshy`) AND THAT COULD NOT HOLD.
//                     Both populations are a fixed distance UNDER the ground, so
//                     both ride the terrain and a fixed y smears them together the
//                     moment the plateau is not flat — which it stopped being when
//                     a window-base read was fixed. Banding on height above the
//                     ground makes the terrain drop out: 306, exactly 17 fans, on
//                     the bumpy fixture. The `meshy` rows are gone; they had fallen
//                     to 310/338, which are not fan counts.
//   `feet`            where the walker is STANDING, four stations one stride apart.
//                     The claim the whole feature exists for, and neither count can
//                     stand in for it: the store held a perfect stair the walker
//                     climbed straight back out of, and every structural test passed
//                     while it did.
//   `frame`           two pictures. Looking up from the cellar floor — impossible
//                     before this, because nothing could stand in one — and the
//                     hillside from outside, which caught the first fix being wrong:
//                     a flat ceiling under a smoothed ground stands proud of it all
//                     round a plateau, `soffit 0.0187` of a frame that must hold
//                     none.
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
