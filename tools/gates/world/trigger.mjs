// ⚠ A WIRE GATE, deliberately, and left whole when the others were thinned. The
// anchor RULE — follows, breaks, foreign is left alone, unchanged says nothing —
// is `lib/hex_editor/tests/modes.loft` now, where it is four assertions against
// the store. What only a running editor can show is that the verdict reaches the
// author as a SENTENCE: `triggers_resolve` returns findings and the server
// broadcasts them, so a resolver that decided correctly and a server that never
// said so would pass every loft test and fail here.
// Trigger gate (rung W8, moros#15) — invariant II: no anchor ever silently
// dangles.
//
// > When geometry changes under an attached thing, its anchor MOVES WITH IT or
// > is REPORTED BROKEN. Never dropped, never silently relocated. A FOREIGN name
// > the editor cannot resolve is neither: it is shown as foreign, and left alone.
//
// Three outcomes and exactly three, each gated:
//   · raise the ground under a trigger  → it follows, and says so;
//   · pave over it                      → BROKEN, and says so. NOT quietly
//     re-pointed at the road, which would leave a trigger attached to a surface
//     nobody chose;
//   · a foreign binding                 → untouched and shown as foreign.
//
// The middle one is the whole invariant. Silently relocating is the comfortable
// bug: everything keeps working and the trigger now means something else.

import { connect, send, ask, until, report } from '../lib.mjs';

const g = await connect({ camera: true });
// ⚠ THE HISTORY, NOT THE NEXT ONE. `send` scans only what arrives after it, which is
// right for *has this just happened*; some of these broadcasts have ALREADY landed by
// the time they are asked for, so the read is over everything seen.
const seen = (needle) =>
  [...g.says].reverse().find((x) => x.includes(needle)) || `(never saw "${needle}")`;
const everSaid = (needle, limitMs = 20000) =>
  until(() => g.says.some((x) => x.includes(needle)), `never saw "${needle}"`, limitMs);
const num_after = (m, key) => Number((m.split(key)[1] || '').trim().split(/\s+/)[0]);

// ⚠ THE TRIGGER MUST SIT WHERE THE GROUND WILL MOVE. A raise lands PEAK_AHEAD (10)
// hexes along the facing with a radius-7 falloff, so the character's OWN cell is outside
// its own stroke — an earlier version anchored at the origin, raised twice, and watched
// nothing happen. Build the hill first, then stand on it and anchor there.
await send(g, '7:0,0,0', ['placed']);
await send(g, '5:1', ['rebuilt']);
await send(g, '5:1', ['rebuilt']);
await send(g, '7:17.3,0,0', ['placed']);       // onto the hill: hex (10,0)
const placed = await ask(g, '18:door_opens', 'trigger 0');

// ── raise the SAME hill again from the same spot; the anchor must follow
await send(g, '7:0,0,0', ['placed']);
await send(g, '5:1', ['rebuilt']);
const followed = (await send(g, '5:1', ['trigger 0 followed']))
  .find((x) => x.includes('trigger 0 followed')) ?? seen('trigger 0 followed');

// ── now pave over it. The ground it named is gone — not moved, GONE.
await send(g, '7:17.3,0,0', ['placed']);
await send(g, '10:1', ['road true']);
await send(g, '7:18.0,0,0', ['placed']);
await send(g, '7:17.3,0,0', ['placed']);
await send(g, '10:0', ['road false']);
// ⚠ THE TRIGGER IS RE-RESOLVED BY THE DIRTY FLUSH, not by the road toggle —
// `triggers_resolve` runs where geometry has just changed, so the BROKEN broadcast is
// the thing to wait for. ⚠ AND IT MUST BE A HISTORY SCAN: a wait that sees only what
// arrives AFTER it burned the full 40-second limit for a SECOND broadcast when the
// first had already landed, then found that first one in the history anyway. The
// verdict was right and forty seconds of the suite went on proving it twice.
await everSaid('trigger 0 BROKEN');
const broken = seen('trigger 0 BROKEN');

// ── a foreign binding is neither resolved nor dropped
await send(g, '7:6,6,0', ['placed']);
const foreign = await ask(g, '18:story::act2_begins', 'trigger 1');

const anchored = placed.includes('bound to door_opens')
                 && num_after(placed, 'height ') > 0;
const moved    = followed.includes('followed to height')
                 && num_after(followed, 'to height ') > num_after(placed, 'height ');
const reported = broken.includes('BROKEN') && broken.includes('is now material');
const notRelocated = !broken.includes('followed');
const foreignKept = foreign.includes('is foreign') && foreign.includes('left alone');
const ok = anchored && moved && reported && notRelocated && foreignKept;
report(g, { placed, followed, broken, foreign,
            anchored, moved, reported, notRelocated, foreignKept, ok }, ok);
