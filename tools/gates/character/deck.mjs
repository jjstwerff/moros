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
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = [];
let st = 0, body = null, tCount = 0;
const trace = [];
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 60) {
    await wait(60);
    const m = status.slice(from).find((x) => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
// ⚠ A GAP IN `T:` IS NOT A STOP, AND READING IT AS ONE MADE THIS GATE FLAKY — two
// runs of identical code ended at x = 5.44 and x = 9.60. `moved` is set whenever the
// walk key is held, blocked or not, so a walker refused by a cliff keeps
// broadcasting; what interrupts the stream is the SERVER, streaming a chunk into an
// interpreter. So this bound is a failure timeout — "the server is gone" — and the
// stop is measured from the POSITION instead, below.
const nextT = async (limitMs = 20000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 5) {
    if (tCount !== before) return true;
    await wait(5);
  }
  return false;
};
const place = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const col = async (q, r) => { ws.send(`15:${q},${r}`); return ack(`column ${q},${r} =`); };
const labels = async (q, r) => { ws.send(`29:${q},${r}`); return ack(`labels ${q},${r} =`); };
const nums = (m) => { const v = m.slice(m.indexOf('=') + 1).trim();
  return v === '' ? [] : v.split(',').map(Number); };
const num = (m, key) => { const p = m.split(' '); return Number(p[p.indexOf(key) + 1]); };
// Hex pitch east–west. Cell (k,0) is centred here, which is what lets this gate place
// the character IN a named cell rather than near one.
const HEX = 1.7320508075688772;
const STOREY = 12, STRIDE = 4, UNIT = 0.25;
const GRADE = STRIDE;                    // the platform's own ground
const DECK = GRADE + STOREY;             // …and its deck, one stride above the stair

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('0;')) {
    body = b.slice(2).split(',').map(Number);
    trace.push([body[12], body[13], body[14]]); tCount++;
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // ── the stair first: cut, step onto what you cut, cut again
    const cuts = [];
    const layerReads = [];
    for (const k of [0, 1, 2]) {
      await place(k * HEX, 0, 0);
      ws.send('30:1'); cuts.push(await ack('stair'));
      // ⚠ LAYERS ARE CHUNK-WIDE, so this is the chunk's stack and not the column's.
      // Read after every cut: the claim is that a STEP IS THE GROUND, MOVED — the
      // first cut authors the chunk's ground layer and no cut after it adds one.
      layerReads.push(await labels(2, 0));
    }
    // ⚠ AND ONE PRESS TOO MANY, from the same spot. The gesture SETS the cell ahead;
    // an adding one would build a tower out of a held key.
    ws.send('30:1'); const again = await ack('stair');
    await ack('rebuilt');
    const steps = [await col(1, 0), await col(2, 0), await col(3, 0)];

    // ── the platform: paved from the FIRST step, so its ground is one stride up and
    //    its deck one stride above the stair's top
    await place(1 * HEX, 0, 0);
    ws.send('10:1'); const roadOn = await ack('road true');
    await place(6 * HEX, 0, 0);
    ws.send('10:0'); await ack('road false');
    await ack('rebuilt');
    ws.send('12:1'); const storey = await ack('storey');
    await ack('rebuilt');
    const deckCol = await col(5, 0);
    // …and the CONTRAST that says the read can see a new layer when there is one:
    // a storey adds one, so this must differ from the stair's reads or the claim
    // above is satisfied by an instrument that cannot tell.
    const layersWithDeck = await labels(2, 0);

    // ── WALK IT. From the bottom, one key, no teleport past the interesting part.
    await place(0, 0, 0);
    await nextT();
    const i0 = trace.length - 1;
    ws.send('4:1');
    // Walk until it is over the platform, or until it has genuinely stopped — forty
    // consecutive transforms with no ground covered. That is a fact about the walker,
    // where a silent second is a fact about the box this runs on.
    let stuck = 0, lastX = trace[trace.length - 1][0];
    for (let k = 0; k < 8000; k++) {
      if (!(await nextT())) break;
      const x = trace[trace.length - 1][0];
      if (x >= 9.5) break;
      if (Math.abs(x - lastX) < 0.001) { stuck += 1; if (stuck >= 40) break; }
      else stuck = 0;
      lastX = x;
    }
    ws.send('4:0');
    await nextT();
    const last = trace[trace.length - 1];
    // ⚠ THE WALK'S SAMPLES, CAPTURED HERE AND NOT LATER. Everything below appends to
    // `trace` — including a teleport that deliberately puts the character ON the deck —
    // so a peak computed at claim time is satisfied by the teleport whatever the walk
    // did. It read a green peak under two of the three mutations before this line
    // existed.
    const walkTrace = trace.slice(i0);

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
      const p = trace[trace.length - 1];
      if (Math.abs(p[0] - 6 * HEX) < 0.01) standY = p[1];
    }
    ws.send('30:1'); const deckCut = await ack('stair');
    await ack('rebuilt');
    const cutQ = Number(deckCut.split(' ')[3].split(',')[0]);
    const deckCutCol = await col(cutQ, 0);

    // ── the claims
    const [gnd0, deck0] = nums(deckCol);
    const platform = storey.startsWith('storey +1')
      && roadOn.startsWith(`road true at grade ${GRADE}`)
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

    const ok = platform && stair && madeNoLayer && idempotent
               && crossed && groundKept && stoodOnTheDeck && deckTookTheWrite;
    console.log(JSON.stringify({
      cuts, again, steps, layerReads, layersWithDeck, roadOn, storey, deckCol,
      endX: +last[0].toFixed(3), endY: +last[1].toFixed(3), endQ, endCol,
      deckAfter, standY, deckCut, deckCutCol,
      walkSamples: walkTrace.length, walkPeak: +Math.max(...ys).toFixed(3),
      overDeckSamples: overDeck.length,
      overDeckY: [...new Set(overDeck.map((p) => +p[1].toFixed(3)))],
      platform, stair, madeNoLayer, idempotent, peakIsTheDeck, crossed, groundKept,
      stoodOnTheDeck, deckTookTheWrite, ok,
    }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
