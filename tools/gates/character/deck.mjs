// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
// AN UPPER STOREY IS SOMEWHERE YOU CAN STAND — the stair, and the surface rule
// the walk asks for it.
//
// `WORLD_MODEL.md` § "Which layer is the surface" has been the walk's rule on paper
// since the camera and the road adopted it, and its DECK half was untestable for
// one reason: nothing could get a character up there. A storey is 12 height units,
// a stride is 4, and every route to a first floor was therefore a cliff. So the
// rule's own most interesting case — a column with more than one surface — was
// "correct by construction", which is what you say about a claim you cannot fail.
//
// This gate builds the missing gesture and then uses it to fail three claims that
// could not be failed before. Each has a mutation that turns it red, named here with
// what it actually measured so the next person does not have to invent one:
//
//   1. THE STAIR IS THE GROUND, CUT ONE STRIDE AT A TIME. `30:` sets the cell ahead
//      to the walker's own surface plus exactly `cliff_step()` — `stair_height` in
//      `moros_sim`, which is the cliff threshold read from the other side. It SETS
//      rather than adds, so it is idempotent and a held key cuts one step.
//      RED: `here + step + 1` in `stair_height` → steps of 5, 10, 15, and the walker
//      climbs the first one and is refused by the second (x = 2.59, peak 1.66).
//
//   2. THE WALK MEASURES AGAINST THE SURFACE, NOT THE OUTDOORS. The cell beside a
//      platform reads as the ground under it — one storey down — so the last step
//      onto a deck reported a rise of two strides and was refused.
//      RED: `terrain_h` back in `edges_walk`'s sampler → the walker is stopped at the
//      platform's edge (x = 6.05, one SKIN short of the cell boundary): it peaks at
//      2.951 on the stair and takes NO sample over the platform at all.
//
//   3. THE LEVEL IS A STATE, LIKE THE FEET. Every "which surface" question in a tick
//      is answered against the surface the walker stood on when the tick BEGAN.
//      ⚠ Asking with `py` is not a near-miss: the feet ride the INTERPOLATED
//      heightfield, whose corners are three-cell means, so at the rim of the last
//      step they sag far below that step's own height — outside `world_surface`'s
//      `ε/2` window, which is documented as absorbing exactly this and cannot,
//      because nothing bounds a neighbour's drop.
//      RED: pass `py` to the fall's `ground_under` → the walker crosses (19 samples
//      over the platform) but at y = 1.0, the paved ground UNDER the deck, peaking at
//      2.951 on the stair instead of 4.0 on the deck.
//
// ⚠ **THE DECK IS ONE STRIDE ABOVE THE STAIR'S TOP STEP, AND A FLUSH ONE HIDES A
// DEFECT.** The first version of this gate paved at grade 0, so the deck landed at
// exactly the stair's top of 12 — and in that scene mutation 3 PASSES. Not because
// the level is a state after all, but because gravity is slower than the walk: the
// feet sag as the walker leaves the last step, and it crosses the sag before the
// fall has taken it below the deck. One stride of separation removes the coincidence
// and the mutation fails, as it should. Same family as the flat wheel and the
// axis-aligned cross-slope — a fixture with no offset cannot see an offset error.
//
// ⚠ THE PLATFORM IS PAVED, NOT RAISED. `12:` refuses a column with no ground, and a
// raise would put the disc on a dome — a storey follows each column's own top, so a
// bumpy platform has a bumpy deck and no single stair height meets it. A road is the
// authoring gesture that GRADES, and its grade is frozen from the feet, which is what
// lets this gate choose the platform's height by standing on the first step.

import { connect, send, ask, until, report, traceOf } from '../lib.mjs';

// ⚠ `ack` ONLY SEES WHAT ARRIVES AFTER IT IS CALLED, which is right for "the next
// one" and wrong for "did this happen while I was doing that". A phase that sends
// two messages and then waits for a broadcast the FIRST one triggered waits for a
// second that never comes — measured, a full 40-second limit, and the gate carried
// on green because the claims below did not depend on it. `mark()` before the
// phase and `after(m, …)` at the end asks the exact question instead.
// ⚠ A GAP IN `T:` IS NOT A STOP, AND READING IT AS ONE MADE THIS GATE FLAKY — two
// runs of identical code ended at x = 5.44 and x = 9.60. `moved` is set whenever the
// walk key is held, blocked or not, so a walker refused by a cliff keeps
// broadcasting; what interrupts the stream is the SERVER, streaming a chunk into an
// interpreter. So this bound is a failure timeout — "the server is gone" — and the
// stop is measured from the POSITION instead, below.


const nums = (m) => { const v = m.slice(m.indexOf('=') + 1).trim();
  return v === '' ? [] : v.split(',').map(Number); };
const num = (m, key) => { const p = m.split(' '); return Number(p[p.indexOf(key) + 1]); };
// Hex pitch east–west. Cell (k,0) is centred here, which is what lets this gate place
// the character IN a named cell rather than near one.
const HEX = 1.7320508075688772;
const STOREY = 12, STRIDE = 4, UNIT = 0.25;
const GRADE = STRIDE;                    // the platform's own ground
const DECK = GRADE + STOREY;             // …and its deck, one stride above the stair
// ⚠ Keep equal to `SURFACES` in `src/editor_server.loft`. Index 6 is the FLOOR — the
// seventh surface, added with this gate because a deck was walkable and INVISIBLE.
const SURFACES = 10;   // …, floor, frame, soffit, rock — keep equal to editor_server.loft
const FLOOR_SURFACE = 6;
const FLOOR_THICK = 2;                   // slab depth under a floor's top face

const g = await connect({ camera: true });
const mark = () => g.says.length;
const after = async (m, needle, limitMs = 8000) => {
  if (g.says.slice(m).some((x) => x.includes(needle))) return needle;
  await until(() => g.says.slice(m).some((x) => x.includes(needle)),
              `never saw "${needle}"`, limitMs);
  return g.says.slice(m).find((x) => x.includes(needle)) ?? `(no "${needle}")`;
};
const trace = () => traceOf(g, '0;').map((b) => {
  const m = b.slice(2).split(',').map(Number);
  return [m[12], m[13], m[14]];
});
// ⚠ A GAP IN `T:` IS NOT A STOP, AND READING IT AS ONE MADE THIS GATE FLAKY — two runs
// of identical code ended at x = 5.44 and x = 9.60. `moved` is set whenever the walk key
// is held, blocked or not, so a walker refused by a cliff keeps broadcasting; what
// interrupts the stream is the SERVER, streaming a chunk into an interpreter. So this
// bound is a failure timeout — "the server is gone" — and the stop is measured from the
// POSITION instead, below.
const nextT = async (limitMs = 20000) => {
  const before = trace().length;
  return until(() => trace().length !== before, 'no transform (the server is gone?)', limitMs);
};
const place = (x, z, yaw) => ask(g, `7:${x},${z},${yaw}`, 'placed');
const col = (q, r) => ask(g, `15:${q},${r}`, `column ${q},${r} =`);
const labels = (q, r) => ask(g, `29:${q},${r}`, `labels ${q},${r} =`);
const walls = (q, r) => ask(g, `16:${q},${r}`, `walls ${q},${r} =`);
const floorHeights = () => {
  const ys = new Set();
  for (const [id, b] of g.picture) {
    if (id <= 15 || g.gone.has(id) || (id - 16) % SURFACES !== FLOOR_SURFACE) continue;
    const p = b.split(';');
    // ⚠ An EMPTY mesh is the normal case — a chunk with no floor cells sends one.
    if (p.length < 3 || p[2] === '') continue;
    const d = p[2].split(',').map(Number);
    for (let k = 1; k < d.length; k += 6) ys.add(+d[k].toFixed(3));
  }
  return [...ys].sort((a, b) => a - b);
};

// ── ONE STEP, THEN THE PLATFORM, THEN THE REST OF THE STAIR
//
// ⚠ THE ORDER CHANGED WITH plan 20, AND IT IS THE FIXTURE THAT MOVED, NOT A CLAIM.
// The platform used to be PAVED: road mode was switched on while standing on the
// first step and the strip came out dead level, because a road's grade was FROZEN
// when the mode went on. A road follows the landscape now — *"it flows upwards with
// the hills with its own rules about how much"* — so a strip laid from the step out
// over open ground RAMPS, which is what a road should do and is useless to stand a
// deck on.
//
// Levelling is the gesture that owns HEIGHT, and it can make the pad — but its brush
// is `LEVEL_R = 5`, so it reaches back over anything already cut. Levelling after the
// whole stair would flatten steps 2 and 3 into it. So the stair is cut around it:
// ONE step to stand on and give the pad its height, then the pad, then the rest of
// the stair up from it. That is also the order a builder would use.
//
// ⚠ AND THE PAD IS WALKED AS A CROSS, which is `cellar.keys`'s own idiom and for its
// reason: `brush` scales the gap by `f²` and truncates, so only the cell the walker
// STEPS ON closes exactly — a cell one hex off the path stalls a unit short. A deck
// follows each column's own top, so a bumpy pad is a bumpy deck and no single stair
// height meets it.
const cuts = [];
const layerReads = [];

// step one, from the plain
await place(0, 0, 0);
cuts.push(await ask(g, '30:1', 'stair'));
// ⚠ LAYERS ARE CHUNK-WIDE, so this is the chunk's stack and not the column's.
// Read after every cut: the claim is that a STEP IS THE GROUND, MOVED — the
// first cut authors the chunk's ground layer and no cut after it adds one.
layerReads.push(await labels(2, 0));

// the platform, levelled from that step so it takes the step's own height
await place(1 * HEX, 0, 0);
const roadMark = mark();
const roadOn = await ask(g, '6:1', 'level true');
await place(6 * HEX, 0, 0);
await place(6 * HEX, 2 * HEX, 0);
await place(6 * HEX, 0, 0);
await place(6 * HEX, -2 * HEX, 0);
await place(6 * HEX, 0, 0);
await place(8 * HEX, 0, 0);
await place(6 * HEX, 0, 0);
await send(g, '6:0', ['level false']);

// and the rest of the stair, cut UP from the step the pad was levelled to
for (const k of [1, 2]) {
  await place(k * HEX, 0, 0);
  cuts.push(await ask(g, '30:1', 'stair'));
  layerReads.push(await labels(2, 0));
}
// ⚠ AND ONE PRESS TOO MANY, from the same spot. The gesture SETS the cell ahead;
// an adding one would build a tower out of a held key.
const again = await ask(g, '30:1', 'stair');
// ⚠ NO WAIT FOR A REBUILD HERE, and that is the point of the press. This one
// is the press too many: the gesture SETS the cell ahead, so pressing again
// from the same spot changes nothing, nothing goes dirty, and the server has
// no rebuild to announce. Waiting for one cost the full 40-second limit and
// then carried on green — 40 seconds of the suite spent on a message that was
// never coming. The reads below are store reads over the socket; they do not
// need the picture to have caught up.
const steps = [await col(1, 0), await col(2, 0), await col(3, 0)];
// The levelling rebuild lands on the PLACEMENT, before `level false` is even sent,
// so this asks whether one happened during the phase — not whether another
// follows it.
await after(roadMark, 'rebuilt');
// ⚠ AND THE DECK GOES OVER THE PLATFORM, WHICH IS NO LONGER WHERE THE AUTHOR IS.
// `12:` builds where the character stands, and the reorder above leaves them on the
// stair — so the walk back out is part of the gesture now, not scene-setting.
await place(6 * HEX, 0, 0);
const storey = await ask(g, '12:1', 'storey');
// Nothing is sent for this: the gesture above already dirtied the chunks, so the
// rebuild is on its way — an ordered read is the barrier.
await send(g, '15:0,0', ['column 0,0 =']);
const deckCol = await col(5, 0);
// …and the CONTRAST that says the read can see a new layer when there is one:
// a storey adds one, so this must differ from the stair's reads or the claim
// above is satisfied by an instrument that cannot tell.
const layersWithDeck = await labels(2, 0);

// ── WALK IT. From the bottom, one key, no teleport past the interesting part.
await place(0, 0, 0);
await nextT();
const i0 = trace().length - 1;
// The clock, not the walk: `34:8` consumes the same FIXED ticks eight times
// faster, so the world is the one this gate has always measured and the
// waiting is not. (STATE.md: three rates, byte-identical worlds.)
g.ws.send('34:8');
g.ws.send('4:1');
// Walk until it is over the platform, or until it has genuinely stopped — forty
// consecutive transforms with no ground covered. That is a fact about the walker,
// where a silent second is a fact about the box this runs on.
let stuck = 0, lastX = trace()[trace().length - 1][0];
for (let k = 0; k < 8000; k++) {
  if (!(await nextT())) break;
  const x = trace()[trace().length - 1][0];
  if (x >= 9.5) break;
  if (Math.abs(x - lastX) < 0.001) { stuck += 1; if (stuck >= 40) break; }
  else stuck = 0;
  lastX = x;
}
g.ws.send('4:0');
await nextT();
const last = trace()[trace().length - 1];
// ⚠ THE WALK'S SAMPLES, CAPTURED HERE AND NOT LATER. Everything below appends to
// `trace` — including a teleport that deliberately puts the character ON the deck —
// so a peak computed at claim time is satisfied by the teleport whatever the walk
// did. It read a green peak under two of the three mutations before this line
// existed.
const walkTrace = trace().slice(i0);

// ⚠⚠ THE CLAIM IS THE CROSSING, NOT WHERE IT STOPPED — and reading the endpoint
// failed this gate inside the suite while it passed standalone. The walker cannot
// be halted on a mark: the stop travels client→server, so the overshoot is
// whatever the socket is behind by, and under a full suite that was **7.8 wu** —
// 73 ticks of walking buffered ahead of what this process had received. The
// trace over the platform is the same measurement and does not care how late the
// stop arrived: the platform spans x 6.06 … 14.72, and the walker is over it for
// some 80 ticks, so a sample lands there however starved the poll is.
// The platform spans x 6.06 … 14.72; this window sits inside it with a margin at
// each end, so a sample in it is unambiguously a sample over a deck.
const overDeck = walkTrace.filter((p) => p[0] >= 6.5 && p[0] <= 14.0);
const endQ = Math.round(last[0] / HEX);
const endCol = await col(endQ, 0);
// the platform, read at a NAMED cell rather than at wherever the walk ended
const deckAfter = await col(5, 0);

// ⚠ AND THE DECK MUST BE DRAWN, which for a whole rung it was not. Every terrain
// surface is built from `world_ground_cell` — the outdoors by definition — so a
// storey's deck sat in the store, walkable and INVISIBLE, and the character
// reached it and appeared to hang in the air three metres up. Read the FLOOR
// mesh's own vertex heights: the deck's must be among them, and at the height the
// feet were measured at rather than merely somewhere.
const drawn = floorHeights();

// ── AN EDGE BELONGS TO THE SURFACE IT BOUNDS. Ring a fence from up here: the
// bytes must land on the DECK's cell, the ground below must stay unfenced, and
// the walker must be stopped by it while still standing at deck height.
// Radius 1 so the whole ring sits inside the platform — a radius that reached
// the platform's rim would confound "the fence stopped me" with "the deck ran
// out and I fell".
await place(6 * HEX, 0, 0);
const fenced = await ask(g, '23:3,1', 'fenced');
// Nothing is sent for this: the gesture above already dirtied the chunks, so the
// rebuild is on its way — an ordered read is the barrier.
await send(g, '15:0,0', ['column 0,0 =']);
const ringWalls = [];
for (const q of [5, 6, 7]) ringWalls.push(await walls(q, 0));

// walk east into it, from the deck
await place(6 * HEX, 0, 0);
await nextT();
const f0 = trace().length - 1;
g.ws.send('4:1');
let fstuck = 0, fx = trace()[trace().length - 1][0];
for (let k = 0; k < 4000; k++) {
  if (!(await nextT())) break;
  const x = trace()[trace().length - 1][0];
  if (x >= 16.0) break;
  if (Math.abs(x - fx) < 0.001) { fstuck += 1; if (fstuck >= 40) break; }
  else fstuck = 0;
  fx = x;
}
g.ws.send('4:0');
await nextT();
const fenceWalk = trace().slice(f0);

// ── ON the deck, cut one more step: the DECK must take the write.
// ⚠ PLACED, NOT WALKED, and for the same reason — a walk cannot be stopped on a
// cell. A teleport carries `py` as its reference, so going up the stair first is
// what puts the feet at the stair's top and lets the platform's deck, one stride
// higher, be the surface it lands on. That IS the rule under test, applied by the
// gesture that can be aimed.
await place(3 * HEX, 0, 0);
await place(6 * HEX, 0, 0);
// ⚠ The transform is identified by the position that was ASKED FOR, not by being
// the newest one: transforms queued before the teleport can still be in flight,
// and "the last T" is then a sample of where the walker used to be.
let standY = null;
for (let k = 0; k < 400 && standY === null; k++) {
  if (!(await nextT())) break;
  const p = trace()[trace().length - 1];
  if (Math.abs(p[0] - 6 * HEX) < 0.01) standY = p[1];
}
const deckCut = await ask(g, '30:1', 'stair');
// Nothing is sent for this: the gesture above already dirtied the chunks, so the
// rebuild is on its way — an ordered read is the barrier.
await send(g, '15:0,0', ['column 0,0 =']);
const cutQ = Number(deckCut.split(' ')[3].split(',')[0]);
const deckCutCol = await col(cutQ, 0);

// ── the claims
const [gnd0, deck0] = nums(deckCol);
const platform = storey.startsWith('storey +1')
  && roadOn.startsWith(`level true at height ${GRADE}`)
  && gnd0 === GRADE && deck0 === DECK;
// each cut is one stride above the last, and each landed on ONE occupied layer —
// a stair that made a layer of its own would read two heights here
const cutHeights = [1, 2, 3].map((k) => STRIDE * k);
const stair = steps.every((m, k) => { const v = nums(m);
  return v.length === 1 && v[0] === cutHeights[k]; })
  && cuts.every((m, k) => num(m, 'height') === cutHeights[k]);
const madeNoLayer = layerReads.every((m) => nums(m).length === 1 && nums(m)[0] === 1)
  && nums(layersWithDeck).length === 2;
// the fourth press, from the third's spot, is the third press again
const idempotent = again === cuts[2];

// ⚠ NOT "IT GOT HIGH" — the stair's own top is 3.0 wu and the platform's ground is
// 1.0. The claim is that it crossed at the DECK's height over cells whose ground is
// a storey below, which nothing but a deck can do. Two halves, and both are stated
// so that MORE samples can only help: the peak of the whole walk is the deck (each
// of the three mutations tops out at the stair or below), and every sample taken
// over the platform is at that height (a walker that dropped through and carried on
// underneath fails on the samples it took at 1.0).
const ys = walkTrace.map((p) => p[1]);
const peakIsTheDeck = Math.abs(Math.max(...ys) - DECK * UNIT) < 0.001;
const crossed = peakIsTheDeck && overDeck.length >= 1
  && overDeck.every((p) => Math.abs(p[1] - DECK * UNIT) < 0.001);
// and nothing in the walk moved the ground the platform stands on
const groundKept = deckAfter === deckCol && nums(deckAfter)[0] === GRADE;
// the teleport up the stair put the feet ON the deck, not on the ground under it
const stoodOnTheDeck = Math.abs(standY - DECK * UNIT) < 0.001;
// and the step cut from there is one stride above the DECK, on the deck's layer
const dc = nums(deckCutCol);
const deckTookTheWrite = num(deckCut, 'from') === DECK
  && num(deckCut, 'height') === DECK + STRIDE
  && dc.length === 2 && dc[0] === GRADE && dc[1] === DECK + STRIDE;

// ⚠ AT THE FEET'S OWN HEIGHT, not "some floor exists". A flat fan at the deck's
// stored height is the same surface `ground_under` reports for a deck
// (`sf_smooth: false` → the stored height, unsmoothed) — so this asserts the
// picture and the feet are one surface, which is the rule the ground sampler
// already keeps for terrain.
const deckIsDrawn = drawn.includes(+(DECK * UNIT).toFixed(3));
// ⚠ AND IT HAS A SIDE. A flat fan alone is a ZERO-THICKNESS PLATE: measured from
// ground level, a deck drawn without one is a bright line in the sky with nothing
// to say it is a floor three metres up rather than a mark on the horizon. The
// ground gets away with no skirts because it is continuous; a floor's edge is
// where the floor stops.
const deckHasASide = drawn.includes(+((DECK - FLOOR_THICK) * UNIT).toFixed(3));

// ⚠ `walls q,r =` prints ONE TRIPLE PER PRESENT CELL, in layer order — so the
// first is the ground and the second the deck. The claim is both halves at
// once: the material is in the deck's triple and the ground's is untouched.
const triples = (m) => m.slice(m.indexOf('=') + 1).trim().split(';');
const fenceOnTheDeck =
  fenced.startsWith('fenced') && num(fenced, 'fenced') > 0
  && ringWalls.every((m) => (triples(m)[0] ?? '').split(',').every((v) => Number(v) === 0))
  && ringWalls.some((m) => (triples(m)[1] ?? '').split(',').some((v) => Number(v) === 3));
// and it stops the walker up there — still at deck height when it stops, which
// is what says a fence stopped it rather than the platform running out
const fw = fenceWalk[fenceWalk.length - 1] ?? [0, 0, 0];
// ⚠ The limit is 16.0 and the ring is at x 12.99, so "it stopped" is a fact
// about the fence and not about where this loop gave up. The first version
// broke at 13.0 — one hex-boundary from the ring — and could not tell the two
// apart. Still at deck height when it stops is what says a FENCE stopped it
// rather than the platform running out under it.
const fenceStopsOnTheDeck = fw[0] < 14.0
  && Math.abs(fw[1] - DECK * UNIT) < 0.001;

const ok = platform && stair && madeNoLayer && idempotent
           && crossed && groundKept && stoodOnTheDeck && deckTookTheWrite
           && deckIsDrawn && deckHasASide
           && fenceOnTheDeck && fenceStopsOnTheDeck;
report(g, {
  cuts, again, steps, layerReads, layersWithDeck, roadOn, storey, deckCol,
  endX: +last[0].toFixed(3), endY: +last[1].toFixed(3), endQ, endCol,
  deckAfter, standY, deckCut, deckCutCol, drawnFloorHeights: drawn,
  walkSamples: walkTrace.length, walkPeak: +Math.max(...ys).toFixed(3),
  overDeckSamples: overDeck.length,
  overDeckY: [...new Set(overDeck.map((p) => +p[1].toFixed(3)))],
  platform, stair, madeNoLayer, idempotent, peakIsTheDeck, crossed, groundKept,
  fenced, ringWalls, fenceEndX: +fw[0].toFixed(3), fenceEndY: +fw[1].toFixed(3),
  stoodOnTheDeck, deckTookTheWrite, deckIsDrawn, deckHasASide,
  fenceOnTheDeck, fenceStopsOnTheDeck, ok,
}, ok);
