// ⚠ CHECKED AND LEFT WHOLE. Which layer the camera and the road READ is the
// surface rule applied by the server's own samplers; `hex_voxel` owns
// `world_surface` and tests it, and this is the editor's consumers honouring it.
// THE CAMERA AND THE ROAD ASK THE SURFACE RULE, not "the outdoors".
//
// `WORLD_MODEL.md` § "Which layer is the surface" states one rule for the WALK —
// the highest occupied terrain layer at or below the feet — and a separate reserved
// LABEL for the outdoors. The camera and the road were on neither: both read
// `terrain_y`, which always answers the ground.
//
// Two claims, one for each, and each has a control that used to pass.
//
// ⚠ 1. THE CAMERA'S EYE OBEYS THE FEET'S RULE, WITH THE EYE FOR THE FEET.
// `cam_wire` already states the invariant — "the eye is never below the surface" —
// but asked it of the outdoors, so a boom swung over a deck passed straight through
// it. Measured: with five decks stacked overhead the camera reported boom 5.860 and
// pitch 0.35, IDENTICAL to the same spot with no decks at all.
//
// ⚠ AND A SINGLE STOREY DISC CANNOT SHOW THIS. The eye rides up and back from the
// pivot — about 5.5 wu back at rest — while a storey disc is radius 2 (~3.5 wu), so
// the eye clears a lone disc entirely and both rules agree. The overlapping discs
// below are not decoration: they are what puts the eye OVER a deck rather than
// beside one. A gate built on one disc would have passed the broken code.
//
// ⚠ 2. THE ROAD GRADES THE SURFACE UNDER THE AUTHOR. `road_h` is frozen from the
// FEET, so the write must land on the layer those feet are on. Over a cellar that is
// the ground — which is the half this gate can witness, because the editor has no
// way to get a character onto an upper deck yet (a storey is 3 wu and the cliff rule
// refuses a climb that steep). The deck half is correct by construction and NOT
// gated, which is a weaker claim and is recorded as one.

import { connect, send, ask, absenceWindow, report } from '../lib.mjs';

const g = await connect({ camera: true });
const place = (x, z, yaw) => send(g, `7:${x},${z},${yaw}`, ['placed']);
// The boom and the lift each ease toward a target, so the eye is in transit for some
// ticks after anything disturbs it. `28:` is the server saying it has arrived — the only
// honest moment to read a camera.
const rest = async () => {
  for (let k = 0; k < 400; k++) {
    const m = await ask(g, '28:', 'camera rested', 8000);
    if (m.startsWith('camera rested true')) return m;
    // ⚠ THE EASE HAS NO EVENT OF ITS OWN — `28:` answers immediately with wherever the
    // camera currently is, so this polls it. The pause is between ASKS, not a guess at
    // how long the ease takes: the loop's exit is the server saying `rested true`.
    await absenceWindow(25, 'the camera is easing and only says so when asked again');
  }
  return ask(g, '28:', 'camera rested', 8000);
};
const num = (m, key) => { const p = m.split(' '); return Number(p[p.indexOf(key) + 1]); };
const nums = (m) => m.slice(m.indexOf('=') + 1).trim().split(',').map(Number);

// ── a hill to the north, high enough to leave room under it
await place(0, 0, 1.5708);
for (let k=0;k<4;k++) { await send(g, '5:1', ['rebuilt']); }
await place(0, 15, 0);
const camOpen = await rest();

// ── THE CAMERA: a platform of overlapping storey discs overhead
const built = [];
for (const [x, z] of [[0,15],[3.5,15],[-3.5,15],[0,18],[0,12],[3.5,18],[-3.5,12]]) {
  await place(x, z, 0); built.push(await ask(g, '12:1', 'storey'));
}
await send(g, '26:0,0', ['cell 0,0 =']);
await place(0, 15, 0);
const camDecked = await rest();
const stack = await ask(g, '15:0,10', 'column 0,10 =');

// ── THE ROAD: cellars dug under a hill, then a road laid over them.
// ⚠ THE HEX IS FOUND, NOT GUESSED. A raise builds the hill AHEAD of the facing,
// not under the character, so the interesting cell is nowhere the gate can name
// from the place coordinates — an earlier version hard-coded (20,0), read a
// virgin column, and reported the road missing when it was simply elsewhere.
await place(0, 0, 0);
for (let k=0;k<6;k++) { await send(g, '5:1', ['rebuilt']); }
await place(17.3, 0, 0);
const dug = [];
for (let k=0;k<2;k++) { dug.push(await ask(g, '12:-1', 'storey')); }
await send(g, '26:0,0', ['cell 0,0 =']);
// the deepest stack in the neighbourhood is the cellar column
let hq = null, deep = 0, roadColBefore = null;
for (let q = 12; q <= 26 && hq === null; q++) {
  const m = await ask(g, `15:${q},0`, `column ${q},0 =`, 8000);
  const v = m.slice(m.indexOf('=') + 1).trim();
  const n = v === '' ? 0 : v.split(',').length;
  if (n > deep) { deep = n; hq = q; roadColBefore = m; }
}
await send(g, '10:1', ['road true']);
await place(17.3, 0, 0);
await send(g, '26:0,0', ['cell 0,0 =']);
await send(g, '10:0', ['road false']);
const roadCell = await ask(g, `26:${hq},0`, `cell ${hq},0 =`);
const roadColAfter = await ask(g, `15:${hq},0`, `column ${hq},0 =`);
const roadLabels = await ask(g, `29:${hq},0`, `labels ${hq},0 =`);

// ── the claims
const decks = built.filter((m) => m.startsWith('storey +1')).length;
const stacked = nums(stack);
const platform = decks >= 4 && stacked.length >= 4;
// the camera pulled in AND the eye is no longer inside a deck
const cameraSawTheDeck = num(camDecked, 'boom') < num(camOpen, 'boom') - 0.5;

const cellars = dug.filter((m) => m.startsWith('storey -1')).length === 2 && deep >= 3;
const [rMat, rHeight] = nums(roadCell);
const before = nums(roadColBefore), after = nums(roadColAfter);
// ⚠ the road is ON THE GROUND — the TOP of the stack, not the bottom. Reading
// material alone would pass on the cellar too, since `cell` used to answer from
// layer 0; the height is what says WHICH layer took it.
const roadOnTop = rMat === 2 && rHeight === Math.max(...after);
// and the cellars are still under it, unchanged — a road that flattened them
// would also satisfy "the road is on top"
const cellarsKept = before.length === after.length
  && before.slice(0, -1).every((v, k) => v === after[k]);
// ⚠ the ground is the layer LABELLED 1 — not the top one and not the bottom
// one. Over a cellar it is above; under a deck it is below. The label is the
// only thing that is true in both, which is the whole reason it exists.
const groundStillLabelled = nums(roadLabels).includes(1);

const ok = platform && cameraSawTheDeck && cellars && roadOnTop
           && cellarsKept && groundStillLabelled;
report(g, {
  camOpen, camDecked, stack,
  boomOpen: num(camOpen,'boom'), boomDecked: num(camDecked,'boom'),
  pitchOpen: num(camOpen,'pitch'), pitchDecked: num(camDecked,'pitch'),
  decks, hq, deep, dug, roadCell, roadColBefore, roadColAfter, roadLabels,
  platform, cameraSawTheDeck, cellars, roadOnTop, cellarsKept,
  groundStillLabelled, ok }, ok);
