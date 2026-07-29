// P7's other half: does the SERVER emit the boxes the probe assumed?
//
// `skin_joint.loft` is pure geometry and needs no server — but it carries a
// COPY of `body_mesh()` and `limb_mesh()`'s numbers, and a copy that drifts
// turns a green sweep into a statement about a figure nobody draws. That is
// exactly how the flat wheel passed four tests: every check re-derived the
// shape instead of reading the one that was emitted.
//
// So the expectations are NOT typed here. `skin_joint.loft` writes `expect.txt`
// holding the geometry its sweep actually used, and this reads the wire and
// compares against that. One home for the numbers; drift shows up as a failure
// instead of as two files quietly agreeing about nothing.
//
// The wire: `M:<part>;<lod>;<r>,<g>,<b>;<f...>` carries 6 floats per vertex
// (position, then normal). `T:<part>;<16 floats>` carries the column-major
// world matrix — and with yaw 0 the translation column, minus the body's, IS
// the joint's pivot in the figure's own frame.
//
// run: node plans/14-props-dressing/probe/emitted_boxes.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PART = { body: 0, leg_l: 1, leg_r: 2, arm_l: 3, arm_r: 4 };
// The wire prints floats at ~8 significant digits, so an exact compare would
// fail on the formatting and say nothing about the geometry. 1e-6 is three
// orders below the 34 mm wedge under test and two below the tightest static
// margin (13 mm), so a real drift cannot hide under it.
const TOL = 1e-6;

let spec;
try {
  spec = readFileSync(join(HERE, 'expect.txt'), 'utf8');
} catch {
  console.log('emitted_boxes: no expect.txt — run skin_joint.loft first');
  process.exit(1);
}
const boxes = {}, pivots = {};
for (const line of spec.split('\n')) {
  const w = line.trim().split(/\s+/);
  if (w[0] === 'box') boxes[w[1]] = w.slice(2).map(Number);
  if (w[0] === 'pivot') pivots[w[1]] = w.slice(2).map(Number);
}

const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const mesh = {}, xform = {};
let armed = false;

const bounds = (f) => {
  const b = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i + 5 < f.length; i += 6)
    for (let a = 0; a < 3; a++) {
      b[a * 2] = Math.min(b[a * 2], f[i + a]);
      b[a * 2 + 1] = Math.max(b[a * 2 + 1], f[i + a]);
    }
  return b;
};

ws.onopen = () => ws.send('1:');
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    const p = b.split(';');
    const id = Number(p[0]);
    if (mesh[id] === undefined && p.length >= 4)
      mesh[id] = bounds(p[3].split(',').map(Number));
  }
  if (t === 'T') {
    const p = b.split(';');
    const id = Number(p[0]);
    if (xform[id] === undefined) xform[id] = p[1].split(',').map(Number);
  }
  // The server asks for an aspect ratio (`E:`) before it will solve a camera
  // and send `C:` — without the reply it waits for ever, which is what the
  // first run of this probe spent twenty seconds doing.
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !armed) { armed = true; setTimeout(finish, 400); }
};

function finish() {
  let bad = 0;
  const cmp = (label, got, want) => {
    const off = Math.abs(got - want);
    if (off > TOL) {
      bad++;
      console.log(`  FAIL ${label}: wire ${got}, probe ${want} (off ${off.toExponential(2)})`);
    }
    return off;
  };

  const AX = ['x0', 'x1', 'y0', 'y1', 'z0', 'z1'];
  for (const [name, want] of Object.entries(boxes)) {
    const got = mesh[PART[name]];
    if (!got) { console.log(`  FAIL ${name}: no mesh on the wire`); bad++; continue; }
    let worst = 0;
    for (let a = 0; a < 6; a++) worst = Math.max(worst, cmp(`${name}.${AX[a]}`, got[a], want[a]));
    if (worst <= TOL) console.log(`  ok   ${name} extents match the probe (worst ${worst.toExponential(2)})`);
  }

  const bt = xform[PART.body];
  if (!bt) { console.log('  FAIL body: no transform on the wire'); bad++; }
  else for (const [name, want] of Object.entries(pivots)) {
    const t = xform[PART[name]];
    if (!t) { console.log(`  FAIL ${name}: no transform on the wire`); bad++; continue; }
    let worst = 0;
    for (let a = 0; a < 3; a++)
      worst = Math.max(worst, cmp(`${name} pivot.${'xyz'[a]}`, t[12 + a] - bt[12 + a], want[a]));
    if (worst <= TOL) console.log(`  ok   ${name} pivot matches the probe (worst ${worst.toExponential(2)})`);
  }

  console.log(bad === 0
    ? 'emitted_boxes: the wire agrees with skin_joint.loft'
    : `emitted_boxes: ${bad} disagreement(s)`);
  ws.close();
  process.exit(bad === 0 ? 0 : 1);
}

setTimeout(() => { console.log('emitted_boxes: TIMEOUT'); process.exit(1); }, 20000);
