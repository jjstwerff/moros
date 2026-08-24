// ⚠ THIS GATE'S CLAIM MOVED, AND THE GATE STAYS AS THE WIRE HALF OF IT. `@HB-X70` — a
// door is its own MATERIAL on the edge, never a cleared one, so the wall run keeps
// every edge and one of them simply reads differently — is
// `lib/hex_editor/tests/fence.loft` now: it rings a disc, turns one edge into a
// door, and counts OWNED edges before and after. Against the store that is
// arithmetic; here it needed a ring walked over a socket and three read-backs.
//
// What stays is that the editor's own `24:` gesture produces it end to end, and
// says so — the count, the single door, and the interior cell that owns nothing
// are the shape a script parses.
// Opening gate (rung W4, moros#12) — `@HB-X70`: AN OPENING IS NEVER ABSENCE.
//
// Moros used to store a door as wall material 0. hexbody measured what that
// costs — the wall run breaks, 38 edges with 0 ends becoming 36 with 2 — and
// `@HB-X70` turned it into a decision: a door is its own MATERIAL on the edge, never
// a cleared edge.
//
// The claim is therefore countable, and this gate counts it: putting a door into
// a wall must leave the number of wall EDGES unchanged. One of them is simply a
// different material. Absence would have removed an edge, and the hole it leaves
// is not "a way through" but "no boundary here" — an enclosure with a doorway is
// still enclosed.

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
const wallsAt = async (q, r) => {
  const m = await ask(g, `16:${q},${r}`, `walls ${q},${r} =`);
  const body = m.slice(m.indexOf('=') + 1).trim();
  if (body === '') return [];
  return body.split(';')[0].split(',').map(Number);
};

await send(g, '7:0,0,0', ['placed']);
await send(g, '14:12', ['stencil']);

// The footprint is a radius-2 disc centred on hex (0,0), so its perimeter is the twelve
// cells at distance 2. Walk them and count.
//
// ⚠ DISTANCE IS ODD-R OFFSET, not axial. This read `(|dq| + |dr| + |dq+dr|)/2` straight
// off (dq, dr) — the AXIAL cube distance — which is a different set of cells on an
// offset lattice: it calls (0,0) and (-1,-1) two steps apart where they are neighbours.
// It agreed with the editor only because the editor was making the same mistake, through
// `moros_map::hex_distance` (moros#3). Both now go through the one convention `hex_grid`
// owns.
const axial = (q, r) => q - ((r - (r & 1)) / 2);
const dist = (q, r) => {
  const dq = axial(q, r) - axial(0, 0), dr = r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};
const ring = [];
for (let dq = -3; dq <= 3; dq++)
  for (let dr = -3; dr <= 3; dr++)
    if (dist(dq, dr) === 2) ring.push([dq, dr]);

let edges = 0, doors = 0, cleared = 0;
for (const [dq, dr] of ring) {
  const w = await wallsAt(dq, dr);
  for (const m of w) {
    if (m === 0) cleared += 1; else edges += 1;
    if (m === 2) doors += 1;
  }
}

// an interior cell is not a wall — the control that stops "everything has walls"
// passing this gate
const inner = await wallsAt(0, 0);
const innerBare = inner.length === 3 && inner.every((m) => m === 0);

const expected = ring.length * 3;         // every perimeter cell owns three
const noneCleared = cleared === 0;
const oneDoor = doors === 1;
const runIntact = edges === expected;
const ok = runIntact && oneDoor && noneCleared && innerBare;
report(g, { ringCells: ring.length, expected, edges, doors, cleared,
            inner, runIntact, oneDoor, noneCleared, innerBare, ok }, ok);
