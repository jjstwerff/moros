// ⚠ CHECKED AND LEFT WHOLE. `hex_world` tests that a world round-trips; this tests
// that the EDITOR's save and load do, through `8:`/`9:`, including that loading a
// genuinely flat world really flattens first. The claim is about the editor's I/O
// path, not the format.
// Persistence gate: the AUTHORED SET survives a round trip, and only it.
//
// Placed, never walked (a world gate — see ../README.md).
//
// The claim is not "a file appeared". It is that reloading reproduces the same
// GROUND: raise a hill, save, wipe by loading a world that is genuinely flat,
// confirm the ground really went flat, then load the save back and require the
// heights to match. A save that stored meshes rather than cells would still pass
// a file-exists check and fail this one the moment a mesh went stale.
//
// ⚠ THE WIPE CHANGED, and the old one was testing a bug. It used to load a name
// that did not exist and rely on the editor returning an empty world — so a
// mistyped filename silently destroyed your work. A missing world is now REFUSED
// by name and changes nothing, which this gate also checks, so the wipe is done
// by saving a flat world first and loading that instead.

import { connect, send, ask, report, chunkFloats } from '../lib.mjs';

const g = await connect({ camera: true });
// The highest vertex the client holds over the CHUNK meshes — `chunkFloats` subtracts
// what `X:` retired, so a ground that sank cannot hide behind a stale chunk.
const hi = () => {
  let h = -1e9;
  for (const d of chunkFloats(g)) for (let k = 1; k < d.length; k += 6) h = Math.max(h, d[k]);
  return +h.toFixed(3);
};

await send(g, '8:gateflat', ['saved']);          // save the world while it is still flat
for (let k = 0; k < 4; k++) await send(g, '5:1', ['rebuilt']);
const built = hi();

await send(g, '8:gate', ['saved']);              // save the raised world
const ackFlat = (await send(g, '9:gateflat', ['loaded'])).some((x) => x.startsWith('loaded'));
await send(g, '26:0,0', ['cell 0,0 =']);         // an ordered read is the rebuild barrier
const wiped = hi();
const ackRaised = (await send(g, '9:gate', ['loaded'])).some((x) => x.startsWith('loaded'));
await send(g, '26:0,0', ['cell 0,0 =']);
const restored = hi();

// CONTROL, and the behaviour the old wipe depended on being broken: loading a world that
// does not exist must REFUSE and leave the ground exactly as it is.
await send(g, '9:__no_such_world__', ['load refused']);
// a refusal changes nothing, so there is no rebuild to wait for — and the restore above
// already awaited its own, so nothing is in flight
const afterMissing = hi();

const raised   = built > 0.4;
const wentFlat = Math.abs(wiped) < 0.001;
const same     = Math.abs(restored - built) < 0.001;
const missingKept = Math.abs(afterMissing - restored) < 0.001;
const ok = raised && wentFlat && same && missingKept && ackFlat && ackRaised;
report(g, { built, wiped, restored, afterMissing, ackFlat, ackRaised,
            raised, wentFlat, same, missingKept, ok }, ok);
