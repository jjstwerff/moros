// ⚠ THE WIRE HALF — plan 20 `A9`. The RULE is thirteen tests in
// `lib/hex_editor/tests/cave.loft`: what a shelf's column looks like, that it keeps
// a storey of headroom, that the walk finds the road and not the rock, that the run
// is one surface through it, and the negative control that a gentle flank caves
// nothing. None of that needs a server and none of it is repeated here.
//
// What DOES need one is the question this tree keeps getting wrong: **is the rule
// reached by the gesture at all.** `slope_settle` was five tests, three probes and no
// gesture for weeks; `footprint_seat` had no caller at all. So this drives the real
// editor — raise, road on, walk — and asks the STORE and the MESH whether a shelf
// came out the other end.
//
// Two instruments, because neither can answer alone:
//
//   · `15:` COLUMN says a caved column holds TWO occupied heights. That is the
//     store, and it is what `A9`'s invariant is written in.
//   · `mesh soffit` says the rock over the road was DRAWN with an underside. A
//     column can be right while the picture shows nothing — `A8.3`'s door read as a
//     hole for four days with every count agreeing.
//
// ⚠ AND THE CONTROL IS A ROAD ON FLAT GROUND, run first. An open cut in level ground
// has nothing above to hold a lid up, so both instruments must read zero there — and
// without that row a build that roofed every road would pass this gate.
const SURFACES = 10;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit, rock

import { connect, send, ask, until, report } from '../lib.mjs';

const g = await connect({ camera: true });
const Z = 7;                     // the flank the road is walked along — see below

const rebuilt = async () => {
  const before = g.says.length;
  return until(() => g.says.slice(before).some((x) => x.startsWith('rebuilt')),
               'no rebuild followed', 20000);
};

// Vertices in one surface, over every live chunk. ⚠ `X:` retirements subtracted, or a
// chunk the server dropped still contributes.
const surf = (k) => {
  let n = 0;
  for (const [id, b] of g.picture) {
    if (id <= 15 || g.gone.has(id)) continue;
    if (((id - 16) % SURFACES) !== k) continue;
    const p = b.split(';');
    if (p.length >= 3 && p[2].length > 0) n += p[2].split(',').length / 6;
  }
  return n;
};
const SOFFIT = 8;
const ROAD = 1;
const ROCK = 9;

// ── ⚠ THE MOUTH IS AN ABSENCE, AND ONLY A BAND CAN SEE IT ───────────────────
//
// Whether a road really passes UNDER the rock is a claim about what is NOT drawn
// between the shelf and its ceiling, and no count of a surface can state it: the
// mountain's own flanks put rock at every height in this scene. Four pictures were
// read by eye first and every one of them was ambiguous — a dark band in a grey
// massif looks the same whether it is 1 world unit tall or 6.
//
// ⚠ AND THE FIRST BAND WAS BLIND TO EXACTLY WHAT IT WAS AIMED AT. Counting rock
// vertices INSIDE the mouth — `y` between the shelf and its ceiling — cannot see a
// sealed mouth at all: a face is one quad, six vertices, and they sit at its corners.
// A quad that spans the opening has its bottom at the road and its top at the rock
// and NOTHING in between, so the count came back `+3` either way. It reads as a clean
// result, which is the worst kind of wrong.
//
// What separates them is where the face BEGINS. A sealed mouth starts at the road;
// an opened one starts at the ceiling the lid is drawn at. So the band is the FOOT of
// the cliff — and the claim is that cutting a gallery adds rock over it and none
// under it. Measured on this scene: `+48` above, `+0` below.
const rockIn = (y0, y1) => {
  let n = 0;
  for (const [id, b] of g.picture) {
    if (id <= 15 || g.gone.has(id)) continue;
    if (((id - 16) % SURFACES) !== ROCK) continue;
    const p = b.split(';');
    if (p.length < 3 || p[2].length === 0) continue;
    const f = p[2].split(',');
    for (let v = 0; v * 6 + 1 < f.length; v++) {
      const y = Number(f[v * 6 + 1]);
      if (y >= y0 && y < y1) n++;
    }
  }
  return n;
};

// ⚠ AND EVEN THAT WAS NOT ENOUGH ON ITS OWN, because the road's OWN bank is a cliff:
// cutting the strip adds legitimate rock at the foot (`+27` on this scene) whether or
// not a single mouth is sealed. So the count is narrowed to the shelves themselves —
// a face quad's corners lie on the hex edge it fills, one unit from the centre of the
// cell that stands over it. A sealed mouth puts six of them at the ROAD; an open one
// puts them at the ceiling, six world units up, and none survive the filter.
const SQ3 = Math.sqrt(3);
const centreOf = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
const rockFeetAt = (cells, ymax) => {
  const cs = cells.map(([q, r]) => centreOf(q, r));
  let n = 0;
  for (const [id, b] of g.picture) {
    if (id <= 15 || g.gone.has(id)) continue;
    if (((id - 16) % SURFACES) !== ROCK) continue;
    const p = b.split(';');
    if (p.length < 3 || p[2].length === 0) continue;
    const f = p[2].split(',');
    for (let v = 0; v * 6 + 2 < f.length; v++) {
      if (Number(f[v * 6 + 1]) >= ymax) continue;
      const x = Number(f[v * 6]);
      const z = Number(f[v * 6 + 2]);
      for (const [cx, cz] of cs) {
        if (Math.hypot(x - cx, z - cz) < 1.05) { n++; break; }
      }
    }
  }
  return n;
};

// How many columns in a band hold more than one occupied height — a shelf, read off
// the store rather than off the gesture's own report.
const shelves = async (q0, q1, r0, r1) => {
  const out = [];
  for (let q = q0; q <= q1; q++) {
    for (let r = r0; r <= r1; r++) {
      const s = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
      const hs = s.slice(s.indexOf('=') + 1).trim();
      if (hs.length === 0) continue;
      const parts = hs.split(',');
      if (parts.length > 1) out.push([q, r, parts.map(Number)]);
    }
  }
  return out;
};

// ── THE CONTROL: a road across flat ground ──────────────────────────────────
//
// ⚠ THIRTY UNITS AWAY FROM WHERE THE MOUNTAIN GOES, AND THE FIRST VERSION WAS NOT.
// It laid the control road across `z = 0` and then raised the mountain on top of it —
// and a road has a slope limit of 1, which `brush` enforces, so the summit came out
// held down to a ramp and the whole scene produced **one** shelf instead of thirteen.
// The control was quietly deciding the subject. `r ≈ -20` is well clear of a peak
// whose radius is `PEAK_R` 7.
const CZ = -30;
await send(g, `7:0,${CZ},0`, ['placed']);
await send(g, '10:1', ['road true']);
for (let x = 2; x <= 20; x += 2) await send(g, `7:${x},${CZ},0`, ['placed']);
await rebuilt();
await ask(g, '10:0', 'road false');
const flatSoffit = surf(SOFFIT);
const flatShelves = (await shelves(0, 13, -23, -17)).length;

// ── AND A MOUNTAIN, with the road walked ALONG its flank ────────────────────
//
// ⚠ ALONG, NOT OVER, AND THE PROBE IS WHY. `probe/house/cave.loft` measured both: on
// a contour the strip is half cut and half fill, so the cut has a transverse
// gradient and the uphill cells have rock to keep. Up the fall line the transverse
// spread is **1** — a road over a hill has no cliff side to roof.
//
// ⚠ AND IT HAS TO BE A MOUNTAIN. `cave_stands` hangs off `tr_face`, so a flank that
// grass can stand at is a flank with no rock in it; six presses is the hill the road
// gate uses and it is not enough.
// ⚠ NO `rebuilt()` AFTER THE RAISES — the loop above already waits for one per
// press, so a second wait has nothing left to arrive and burns its full 20 s into a
// discarded return value. That is `nextT`'s 15,185 ms on an empty script, one gate
// later.
await send(g, '7:0,0,0', ['placed']);
for (let k = 0; k < 14; k++) await send(g, '5:1', ['rebuilt']);
const beforeSoffit = surf(SOFFIT);
// ⚠ THE BANDS ARE CHOSEN FROM THE STORE, NOT FROM THE PICTURE. The shelves come out
// with their road at 1..5 height units and their rock at 28..42 — `y` under 1.5 world
// units is where a face that sealed a mouth would have its foot, and `y` over 6.0 is
// where the lid's own edge belongs.
const beforeMouth = rockIn(0.0, 1.5);
const beforeLid = rockIn(6.0, 30.0);

// ⚠ z = 7 IS MEASURED, NOT CHOSEN. Swept against the running editor at 14 presses:
// z = 5 gives **5** shelves, z = 7 and z = 9 give **13**. Too close to the peak and
// the strip is inside the summit; too far and the flank is soil again.
await send(g, `7:0,${Z},0`, ['placed']);
await send(g, '10:1', ['road true']);
for (let x = 2; x <= 34; x += 2) await send(g, `7:${x},${Z},0`, ['placed']);
await rebuilt();
const off = await ask(g, '10:0', 'road false');

const found = await shelves(0, 18, 1, 8);
const soffit = surf(SOFFIT);
const road = surf(ROAD);
const mouth = rockIn(0.0, 1.5);
const lid = rockIn(6.0, 30.0);

// ⚠ THE HEADROOM IS RE-DERIVED FROM THE STORE, not taken from the library's word for
// it. `CAVE_HEAD` is 12 and the editor's `ε` is 10; a shelf that came out between the
// two would be legal to `F1` and under what it was cut for, which is exactly the
// state `A8`'s fill can produce and the settle's sweep exists to remove.
let thinnest = 1e9;
for (const [, , hs] of found) {
  for (let i = 1; i < hs.length; i++) thinnest = Math.min(thinnest, hs[i] - hs[i - 1]);
}
if (found.length === 0) thinnest = 0;

const control = flatSoffit === 0 && flatShelves === 0;
const caved = found.length > 0;
const drawn = soffit > beforeSoffit;
const headroom = caved && thinnest >= 12;
// ⚠ A LOWER BOUND, NOT THE MEASURED 13. Pinning the count would make this a test of
// where `brush_delta`'s falloff truncates rather than of whether a road can cave at
// all, and the exact figure belongs to a fixture the library owns. What is being
// claimed is that a WALK produces a run of shelves — one would be a coincidence.
const gallery = found.length >= 6;
// ⚠ THE TWO HALVES OF ONE CLAIM, AND EITHER ALONE WOULD PASS ON A SEALED GALLERY.
// `open` says nothing new was drawn across the mouth; `lidFaced` says the rock ABOVE
// it did gain its own exposed edge — so a build that simply stopped drawing faces
// altogether cannot satisfy both.
// ⚠ THE ONE THAT ACTUALLY DISCRIMINATES, AND THE BOUND IS DERIVED RATHER THAN TUNED.
// A sealed mouth is one quad — six vertices — with its foot at the road, and every
// one of these thirteen shelves has at least one mouth edge, so sealing them costs
// **78 or more**. Measured open: **3**, and it is not zero because a corner is SHARED
// — the face on the open road's own bank beside a shelf lands within a hex radius of
// the shelf's centre too. Fewer than one vertex per shelf is therefore a bound no
// partially sealed build can slip under.
const feet = rockFeetAt(found.map(([q, r]) => [q, r]), 2.0);
const open = feet < found.length;
const lidFaced = lid > beforeLid;
const ok = control && caved && drawn && headroom && gallery && open && lidFaced
        && road > 0;
report(g, { off, flatSoffit, flatShelves, beforeSoffit, soffit, road,
            shelves: found.length, thinnest,
            beforeMouth, mouth, beforeLid, lid, feet,
            control, caved, drawn, headroom, gallery, open, lidFaced, ok }, ok);
