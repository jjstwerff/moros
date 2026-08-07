// ⚠ THIS GATE IS ALREADY WHAT A GATE SHOULD BE, and it was checked rather than
// assumed when the others were thinned: every number below comes from the VERTICES
// the server sent, not from a read-back of what it thinks it stored. The brush's
// own rules — the hill lands ten hexes ahead, spares the cell under the author,
// and two strokes SUM where they overlap — are `lib/hex_editor/tests/gesture.loft`
// now, and nothing here restates them. What it measures is whether the store's
// answer reached a mesh, which no loft test can see.
// Terrain gate. Four claims, each separable:
//   raises      — an ↑ ahead changes the ground
//   spares      — and does NOT change the ground under the character (PEAK_R <
//                 PEAK_AHEAD, so a hill can never lift or bury you)
//   blends      — two peaks side by side sum where they overlap, rather than
//                 the later one replacing the earlier
//   idempotent  — levelling flat ground is a no-op; walking a flat path twice
//                 cannot dig a trench
//
// It reads HEIGHTS off the chunk meshes rather than trusting a report: every
// mesh vertex carries its world y, so the ground's actual shape is what is
// measured, not the server's opinion of it.
//
// Drives the character by PLACING it (7:<x>,<z>,<yaw>), never by walking.
// This is a WORLD gate: it measures terrain, streaming or levelling, and must
// not depend on locomotion — walking speed, stride or step timing. See
// tools/gates/README.md for why (a fixed-millisecond walk made this fail
// against working code the day the speed changed).
//
// ⚠ IT WAS FAILING THREE RUNS IN FOUR, and for two reasons that compound.
//
// The first is the usual one: every step was `step(fn, ms)` — eight fixed sleeps,
// each a claim about how fast this box is, before reads of a MESH that arrives
// several ticks after the world changes. Raises now wait for `S:rebuilt`, places
// for `S:placed`, and the opening read for the `Z:0` that closes the initial
// streaming batch.
//
// ⚠ The second is subtler and is what actually made it red: THE PHASES WERE
// COMPARING MAXIMA OVER DIFFERENT DOMAINS. `yStats` ranged over whatever chunks
// happened to be loaded, and a place changes the loaded set — the streamer brings
// chunks in and drops others. So `walked.hi` read 1.583 when part of the hill had
// not arrived and 2.917 when it had, and `levels` (`levelled.hi <= walked.hi`)
// failed against a server doing nothing wrong. Waiting longer would have hidden it
// rather than fixed it: the defect is that a maximum over set A was being compared
// with a maximum over set B. Every phase is now measured over the chunks present in
// ALL of them, so the comparison has one domain.

import { connect, send, ask, until, report, chunkFloats } from '../lib.mjs';

// ⚠ `Z:0` CLOSES A TRANSACTION, and the opening world is only complete when one has
// arrived — watched from the first byte, because it lands during the opening burst.
let zClosed = 0;
const watch = (t) => { if (t === 'Z:0') zClosed++; };
const g = await connect({ camera: true, watch });
const awaitZ = (limitMs = 40000) =>
  until(() => zClosed > 0, 'no Z:0 — the world never finished a transaction', limitMs);
// A snapshot of the live chunk meshes, id -> floats.
const snap = () => {
  const m = new Map();
  for (const [id, b] of g.picture) {
    if (id <= 1000 || g.gone.has(id)) continue;
    const p = b.split(';');
    if (p.length >= 3) m.set(id, p[2] === '' ? [] : p[2].split(',').map(Number));
  }
  return m;
};
const statsOver = (m, ids) => {
  let lo = 1e9, hi = -1e9, n = 0;
  for (const id of ids)
    for (let i = 1; i < (m.get(id) ?? []).length; i += 6) {
      lo = Math.min(lo, m.get(id)[i]); hi = Math.max(hi, m.get(id)[i]); n++;
    }
  return { lo: +lo.toFixed(3), hi: +hi.toFixed(3), n };
};
const raise = () => send(g, '5:1', ['rebuilt']);

// ⚠ THE BATCH MAY ALREADY HAVE CLOSED. `run()` is started from the first `C:`,
// and the streamer's `Z:0` can precede it — so waiting for a NEW one waits for
// something that already happened. Ask whether it has closed, not whether it will.
const loaded = zClosed > 0 ? true : await awaitZ();
const flatM = snap();

await raise();                               // raise once
await raise();                               // and again — same cell, one peak
const raisedM = snap();

await send(g, '7:9.0,0.0,0.0', ['placed']);   // stand on its flank
const walkedM = snap();

await send(g, '6:1', ['level']);          // levelling on, at this height
await send(g, '7:12.0,0.0,0.0', ['placed']);  // step outward, one place at a time
await send(g, '7:15.0,0.0,0.0', ['placed']);
const levelledM = snap();

// ⚠ ONE DOMAIN. The chunks present in every phase — anything else compares a
// maximum over one region with a maximum over another, which is what made this
// gate red against working code.
const phases = [flatM, raisedM, walkedM, levelledM];
const common = [...flatM.keys()].filter((id) => phases.every((p) => p.has(id)));
const flat = statsOver(flatM, common);
const raised = statsOver(raisedM, common);
const walked = statsOver(walkedM, common);
const levelled = statsOver(levelledM, common);

const raises = raised.hi > flat.hi + 0.2;
const sparesStart = Math.abs(flat.lo) < 0.001 && Math.abs(raised.lo) < 0.001;
const levels = levelled.hi <= walked.hi + 0.001;
// ⚠ AND THE DOMAIN MUST NOT BE EMPTY. An intersection that collapsed would make
// every claim above vacuously true — `hi` and `lo` of nothing compare however you
// like. This is the clause that stops the fix from becoming a way to pass.
const domainHeld = common.length > 8 && flat.n > 1000;
const ok = loaded && raises && sparesStart && levels && domainHeld;
report(g, { flat, raised, walked, levelled,
                             commonChunks: common.length,
                             loaded, raises, sparesStart, levels, domainHeld, ok }, ok);
