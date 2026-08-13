// ⚠ A WIRE GATE, AND THE ONLY ONE THAT CAN SEE ITS CLAIM. What a waterway WRITES is
// `hex_editor`'s and is covered by loft tests; what this measures is that the two
// paths a chunk's picture can arrive by describe it the SAME WAY — which is a
// property of `editor_server.loft` and of nothing else, so no library test can hold
// it. Plan 22 `B1b.2c.4b`.
//
// ⛔ IT EXISTS BECAUSE THE TWO PATHS HAD DIVERGED AND NOTHING COULD SEE IT. A
// chunk's surfaces reach a client two ways — the dirty FLUSH after an edit, and the
// chunk STREAM when a tile comes into view — and they were two copies of one loop.
// The flush asked `hex_mesh::surface_ramp`; the stream wrote a literal `0`, under a
// comment claiming *"the same loop as the flush, over the same list, in the same
// order"*. The ramp slot is a MODE (0 flat, 1 by height, 2 by DEPTH), so **water drew
// flat when a tile came into view and depth-ramped the moment anything near it was
// edited**: one world, two pictures, decided by which path delivered the tile.
//
// ⚠ AND THERE WAS NO WATER GATE AT ALL, which is the reason it survived. Water is the
// eleventh surface (plan 20 `A10`) and the only one besides the ground with a ramp
// other than flat — so it is the ONE surface on which the two paths could disagree,
// and the only surface nothing drove.
//
// ⚠ THE GEOMETRY CHECK IS NOT DECORATION. Two empty meshes agree about everything,
// so *the ramps match* means nothing until *water was drawn at all* is asserted
// first — the trap `probe-mesher`'s first run sprang, one step back in this phase.
//
// ⚠ AND A RETIREMENT IS WHAT MAKES THE SECOND PATH REACHABLE. A chunk already in the
// picture is not re-streamed; it has to leave range and come back, so the walk out is
// part of the instrument rather than scene-setting, and `X:` for the tile is the
// proof that it did.
import { connect, send, ask, until, report } from '../lib.mjs';

// ⚠ KEEP EQUAL TO `SURFACES` in `src/editor_server.loft`. A chunk draws one mesh per
// surface on consecutive ids, so the slot a mesh id names is a modulo of this — and
// when the roof made it five, three decoders moved and the gates did not.
const SURFACES = 11;
const FIGURE_MAX = 15;
const WATER = 10;   // the eleventh surface, appended so nothing already numbered moved

// Every `M:` as it ARRIVES, not the picture at the end. The picture keeps one body
// per id, so a tile delivered twice would leave only the second — and "the two
// deliveries agree" is exactly the question.
const arrivals = [];
const retired = [];
const watch = (t) => {
  if (t.startsWith('M:')) {
    const b = t.slice(2);
    const semi = b.indexOf(';');
    const id = Number(b.slice(0, semi));
    if (id <= FIGURE_MAX) return;              // 0-15 are the figure
    const rest = b.slice(semi + 1).split(';');
    arrivals.push({
      id,
      slot: (id - FIGURE_MAX - 1) % SURFACES,
      ramp: Number(rest[0]),
      floats: rest[2] && rest[2].length > 0 ? rest[2].split(',').length : 0,
    });
  } else if (t.startsWith('X:')) retired.push(Number(t.slice(2)));
};

const g = await connect({ camera: true, watch });
// ⚠ WAIT FOR THE THING ITSELF, NOT FOR `rebuilt`. This waited on the server's
// `S:rebuilt N chunks` and timed out 20 s on EVERY run — the flush for the last
// placement has usually closed before the wait is armed, which is the race
// `road.mjs`'s own comment warns about one toggle over. The water surface ARRIVING
// is the condition this gate is actually waiting for, it is already being recorded
// from the first byte, and it cannot be missed by being early.
const waterDrawn = async () =>
  until(() => arrivals.some((a) => a.slot === WATER && a.floats > 0),
        'no water surface was ever drawn', 20000);

// ── the fixture: a waterway needs GROUND UNDER IT ────────────────────────────
//
// ⚠ MEASURED, NOT ASSUMED. On the world the server starts with, every placement was
// answered `water refused after 0 cells — water at -2 leaves no room for a bed 12
// deep above the reserve`: a river digs its bed DOWN from the terrain, so a run needs
// `W_RESERVE + depth` of ground to cut into. The first version of this gate drove the
// gesture over flat ground and reported a clean set of zeroes.
//
// ⚠ AND THE BRUSH IS TEN HEXES AHEAD OF THE CHARACTER, not under it — the editor's
// own help line says so (*"↑/↓ raise/lower ground 10 hexes ahead"*), and a raise
// aimed at the feet is why the first probe read a height that never moved.
await send(g, '7:0,0,0', ['placed']);
for (let x = -14; x <= 6; x += 2) {
  await send(g, `7:${x},0,0`, ['placed']);
  for (let k = 0; k < 3; k++) await send(g, '5:1', ['rebuilt']);
}

// ── the flush path: lay a waterway and let the edit rebuild the tile ─────────
// Water is laid on the walk tick, so the placements are what drive it — `road.mjs`'s
// shape, and for its reason: a world gate must not break when locomotion changes.
//
// ⚠ A REFUSAL PART WAY ALONG IS THE NORMAL ANSWER AND NOT A FAILURE. A run gets
// DEEPER as it goes (`water_run`), so a few cells in it asks for a bed the hill
// cannot give and stops — `water refused after 2 cells` means two cells of water
// were written, which is all this claim needs. What would be a failure is zero, and
// `drawn` below is what says so.
await send(g, '7:0,0,0', ['placed']);
await ask(g, '47:1', 'water true');
for (let x = 2; x <= 10; x += 2) await send(g, `7:${x},0,0`, ['placed']);
await ask(g, '47:0', 'water false');
await waterDrawn();

const flush = arrivals.filter((a) => a.slot === WATER && a.floats > 0);
const flushIds = new Set(flush.map((a) => a.id));

// ── the stream path: walk out until the tile is retired, then walk back ──────
const before = arrivals.length;
for (let x = 20; x <= 140; x += 20) await send(g, `7:${x},0,0`, ['placed']);
const dropped = retired.filter((id) => flushIds.has(id));
for (let x = 120; x >= 0; x -= 20) await send(g, `7:${x},0,0`, ['placed']);
await until(() => arrivals.slice(before).some((a) => flushIds.has(a.id)),
            'the water tile never streamed back', 30000);

const stream = arrivals.slice(before).filter((a) => flushIds.has(a.id) && a.floats > 0);

// ⚠ THE POSITIVE CONTROL FIRST, both halves. A run that laid no water, or one whose
// tile never came back, makes every claim below true by being empty.
const drawn = flush.length > 0;
const restreamed = stream.length > 0;
const wasRetired = dropped.length > 0;
// The claim: the ramp is a property of the SURFACE, so every delivery of it says the
// same number — and that number is 2, the depth ramp, because still water reads its
// own depth. A run where both paths said `0` would satisfy "they agree" and be the
// bug this gate is named after.
const flushRamps = [...new Set(flush.map((a) => a.ramp))];
const streamRamps = [...new Set(stream.map((a) => a.ramp))];
const agree = flushRamps.length === 1 && streamRamps.length === 1
              && flushRamps[0] === streamRamps[0];
const depth = flushRamps[0] === 2;

report(g, {
  waterTilesDrawnByTheEdit: flush.length,
  tilesRetiredOnTheWalkOut: dropped.length,
  sameTilesStreamedBack: stream.length,
  rampFromTheFlush: flushRamps,
  rampFromTheStream: streamRamps,
  drawn, wasRetired, restreamed, agree, depth,
  ok: drawn && wasRetired && restreamed && agree && depth,
}, drawn && wasRetired && restreamed && agree && depth);
