// ⚠ CHECKED AND LEFT WHOLE. The occlusion class is the CAMERA's — can the eye be
// inside this thing — and the camera solve lives in the server. Nothing here
// restates a store rule; the reach and height are read from the transforms the
// server broadcast.
// Occlusion gate (rung W2, moros#10) — THE CAMERA'S CLASS, AND WHY IT IS NOT
// "DOES IT BLOCK MOVEMENT".
//
// A fence stops a character and is visually almost nothing. A castle wall is not
// terrain and obstructs totally. So the camera's question is neither "is it
// terrain" nor "does it block me" — it is **can the camera be INSIDE it**, because
// a volume you are inside fills the whole screen while a thing you see past costs
// a fraction of the frame (`EDITOR_SUBSTRATE.md`, settled before walls arrived).
//
// The measurement is the eye itself — reach and height — read out of the view
// matrix the server sends. Stand in the middle of a ring, once fenced and once
// walled:
//
//   open ground → the full boom
//   fence ring  → the full boom, unchanged   ← the clause that makes this a class
//   wall ring   → the eye is NOT INSIDE the wall
//
// ⚠ The last clause is an invariant, not a mechanism. The camera has two degrees
// of freedom and spends the cheaper one: measured here it LIFTS over a 3 wu wall
// (y 3.424 → 3.911) rather than pulling in, and both are correct. A gate written
// against "the boom gets shorter" would fail a camera that did the right thing.
//
// ⚠ AND FOR MOST OF THIS GATE'S LIFE IT MEASURED A CAMERA STILL IN FLIGHT. The
// ease past a wall takes about 2.5 s and the gate slept 1.5 — so `beside_wall` was
// read mid-move, 0.42 wu short of where the eye actually comes to rest, and the
// only symptom was the last digits wandering between runs. Removing the sleep is
// what exposed it; see the barrier below and STATE.md item 18.
//
// ⚠ And the fence clause is the one worth having. A camera that gave way to
// anything solid would sail through a gate that only checked the wall.

import { connect, send, ask, until, report } from '../lib.mjs';

const settleFailures = [];
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];

const g = await connect({ camera: true });
const lastBody = () => {
  const t = g.ts.filter((b) => b.startsWith('0;'));
  return t.length ? t[t.length - 1].slice(2).split(',').map(Number) : null;
};
const lastView = () => (g.views.length
  ? g.views[g.views.length - 1].split(';')[0].split(',').map(Number) : null);
const eyeOf = () => {
  const view = lastView();
  if (!view) return null;
  const m = view, t = [m[12], m[13], m[14]];
  return [
    -(m[0] * t[0] + m[1] * t[1] + m[2] * t[2]),
    -(m[4] * t[0] + m[5] * t[1] + m[6] * t[2]),
    -(m[8] * t[0] + m[9] * t[1] + m[10] * t[2]),
  ];
};
const posOf = () => { const b = lastBody(); return b ? [b[12], b[13], b[14]] : null; };
const cam = () => {
  const e = eyeOf(), p = posOf();
  if (!e || !p) return { reach: NaN, y: NaN };
  return { reach: +Math.hypot(e[0] - p[0], e[2] - p[2]).toFixed(3), y: +e[1].toFixed(3) };
};
const restQuery = async () => {
  const m = await ask(g, '28:', 'camera rested');
  const boom = Number((m.match(/boom (\S+)/) || [])[1]);
  const free = Number((m.match(/free (\S+)/) || [])[1]);
  return { rested: m.includes('rested true'), boom, free,
           arrived: !m.includes('rested true') || boom === free, msg: m };
};
// ⚠ WAIT FOR THE EASE TO ARRIVE, NOT FOR A COUNT OF MILLISECONDS. The boom and the lift
// each ease toward a target, so "where is the eye" has no answer until they get there.
const freshView = async (limitMs = 8000) => {
  const before = g.views.length;
  g.ws.send('2:1.5,');
  return until(() => g.views.length !== before, 'no fresh camera', limitMs);
};
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  await send(g, `7:${x.toFixed(4)},${z.toFixed(4)},0`, ['placed']);
  let m = await restQuery(), rounds = 0;
  while (!m.rested && rounds < 400) { m = await restQuery(); rounds++; }
  const fresh = await freshView();
  if (!m.rested || !fresh || !m.arrived) {
    settleFailures.push(`${q},${r}: rested=${m.rested} arrived=${m.arrived} `
                        + `freshView=${fresh} after ${rounds} asks — ${m.msg}`);
  }
  return cam();
};

const R = 2;
// The ring's edge sits half a hex beyond its outermost cell.
const ringAt = (R + 0.5) * SQ3;
const out = { ringAt: +ringAt.toFixed(3) };

out.open = await placeAt(0, 0);                 // nothing in the way

await placeAt(40, 0);
out.fenced = await ask(g, `23:3,${R}`, 'fenced');
out.beside_fence = await placeAt(40, 0);

await placeAt(80, 0);
out.walled = await ask(g, `23:1,${R}`, 'fenced');
out.beside_wall = await placeAt(80, 0);

// A wall is WALL_UP = 12 height units tall, and a height unit is 0.25 wu.
const wallTop = 12 * 0.25;
// Only interesting if the wall is nearer than the open boom reaches — else
// there was nothing to give way to and every clause below is vacuous.
const meaningful = out.open.reach > ringAt + 0.3;
// THE INVARIANT: the eye is never inside a view-blocking wall. It may be
// nearer than the wall, or higher than it — those are the camera's two ways
// out, and either satisfies the rule.
const outside = out.beside_wall.reach <= ringAt + 0.1 || out.beside_wall.y > wallTop;
const wallGaveWay = outside
  && (out.beside_wall.reach < out.open.reach - 0.1
      || out.beside_wall.y > out.open.y + 0.1);
// And a FENCE costs nothing at all — neither reach nor lift moves.
const fenceIgnored = Math.abs(out.beside_fence.reach - out.open.reach) < 0.2
                     && Math.abs(out.beside_fence.y - out.open.y) < 0.2;
const settled = settleFailures.length === 0;
const ok = meaningful && fenceIgnored && wallGaveWay && settled;
report(g, { ...out, wallTop, meaningful, fenceIgnored, outside, wallGaveWay,
                             settled, settleFailures, ok }, ok);
