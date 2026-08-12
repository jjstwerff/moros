// THE PLACED EYE — `48:`, and the claim is that the character is IN the picture.
//
// ⚠ CHECKED AND LEFT WHOLE, and it is a WIRE gate of the strictest kind: every row
// is read out of the `C:` matrices the client is actually told to draw with. A loft
// test could prove a `look_at` composes correctly; only this can prove the server
// PUBLISHED it, which is the exact fault CAMERA_INDOORS records — *"three fixes to
// the solve were right and invisible, because the solve's answer was never on the
// wire."*
//
// Why the message exists: all five camera modes are DERIVED from the character's
// pose, so a script could only change the view by moving the character — and moving
// the character moves where the next gesture lands. There was no way to ask for
// *the house from outside, with the author standing in its door*.
//
// ⚠ AND "THE CHARACTER IS IN FRAME" IS NOT MEASURED BY LOOKING. The rows project
// the character's own world position through `proj · view` and test the clip
// volume — which is the arithmetic the GPU does, not a resemblance to it. The
// control below is what stops that instrument answering *inside* for everything.
import { connect, send, ask, until, checker, verdict } from '../lib.mjs';

const g = await connect({ camera: true });
const check = checker();

// ── the instruments ─────────────────────────────────────────────────────────
const mats = () => {
  const b = g.views[g.views.length - 1];
  const [v, p] = b.split(';');
  return [v.split(',').map(Number), p.split(',').map(Number)];
};
// For a rigid `V = R·T(-eye)`, `eye = -Rᵀt`. Column-major: (row r, col c) is m[c*4+r].
const eyeAt = () => {
  const [v] = mats();
  const e = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let r = 0; r < 3; r++) s += v[c * 4 + r] * v[12 + r];
    e[c] = -s;
  }
  return e;
};
// `proj · view · p`, then the clip test the rasteriser applies.
const inFrame = (p) => {
  const [v, pr] = mats();
  const mul = (m, q) => [0, 1, 2, 3].map((r) =>
    m[0 * 4 + r] * q[0] + m[1 * 4 + r] * q[1] + m[2 * 4 + r] * q[2] + m[3 * 4 + r] * q[3]);
  const c = mul(pr, mul(v, [p[0], p[1], p[2], 1]));
  const w = c[3];
  return w > 0 && Math.abs(c[0]) <= w && Math.abs(c[1]) <= w && c[2] >= -w && c[2] <= w;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ── the scene: a character standing somewhere, with ground under everything ──
await send(g, '7:0,0,0', ['placed']);
await send(g, '5:1', ['rebuilt']);
const CX = 6, CZ = 4;
await send(g, `7:${CX},${CZ},0`, ['placed']);
// The character's feet, as the server itself resolves them: `T:0` is the body's own
// model matrix, so this is where the figure IS rather than where we asked it to go.
//
// ⚠ WAIT FOR THE TRANSFORM THAT SHOWS THE TELEPORT, NOT FOR ANY TRANSFORM. The
// first version waited for *a* `0;` — which the opening burst already sent, at the
// origin — so it measured the character at (0,0) while the server had it at (6,4),
// and reported the eye 4.243 from a character 11.402 away. Two rows red, one of
// them the whole claim, and both about the gate rather than the subject. **Wait for
// the evidence, not for an event of the right shape.**
const bodyAt = () => {
  const b = g.ts.filter((x) => x.startsWith('0;')).pop();
  return b ? b.split(';')[1].split(',').map(Number) : null;
};
await until(() => {
  const m = bodyAt();
  return m && Math.abs(m[12] - CX) < 0.01 && Math.abs(m[14] - CZ) < 0.01;
}, `the figure never reached ${CX},${CZ}`);
const body = bodyAt();
const feet = [body[12], body[13], body[14]];

// ── 1. the follow camera is BEHIND the character, which is the baseline ─────
const nViews = () => g.views.length;
const follow = eyeAt();
check(dist(follow, feet) > 1.0,
      `the follow eye stands ${dist(follow, feet).toFixed(3)} from the character`);

// ── 2. a placed eye is WHERE IT WAS PUT ─────────────────────────────────────
//
// ⚠ WAIT FOR THE `C:`, NOT FOR THE ACKNOWLEDGEMENT. The server answers `48:` from
// the message loop and publishes the camera from the tick, so reading the matrix on
// the `S:` line reads the one before it — the exact shape `cache` was red on.
//
// ⚠ AND LET THE CAMERA REST FIRST, WHICH IS WHAT MAKES THE NEXT ROW MEAN ANYTHING.
// The tick publishes a `C:` whenever the EASE is still moving, so a gate that places
// its eye just after a teleport gets a fresh camera whichever code sent it — and it
// passed with the publish path sabotaged, measured. Resting closes that door: with
// the boom, the pitch and the slide all settled, the only thing left that can put a
// `C:` on the wire is `48:` itself.
// ⚠ NOT THROUGH `until`: its condition is called WITHOUT `await`, so an async one
// returns a Promise — always truthy — and the wait returns on the first poll having
// checked nothing. A loop that awaits is four lines and cannot lie.
let rested = '';
for (let i = 0; i < 60 && !rested.startsWith('camera rested true'); i++) {
  rested = await ask(g, '28:', 'camera rested', 5000);
}
check(rested.startsWith('camera rested true'),
      `the camera came to rest before the eye was placed: ${rested}`);
const EX = CX - 9, EZ = CZ - 7, EH = 4.0;
const before = nViews();
const said = await ask(g, `48:${EX},${EZ},${EH}`, 'eye ');
await until(() => nViews() > before, 'no camera was published for the placed eye');
const placed = eyeAt();
check(Math.abs(placed[0] - EX) < 0.01 && Math.abs(placed[2] - EZ) < 0.01,
      `the eye stands at ${placed.map((n) => n.toFixed(2)).join(',')} and was put at ${EX},?,${EZ}`);
// The height is above the GROUND there, so it is at least the requested lift and
// the ground is flat here — an exact number would be a second implementation of
// `ground_under`, which is the thing this is supposed to be trusting.
check(placed[1] >= EH - 0.01,
      `and at least ${EH} above the ground under it (${placed[1].toFixed(3)})`);

// ── 3. …and it LOOKS AT the character ───────────────────────────────────────
check(inFrame(feet), 'the character is inside the clip volume of what was published');
// ⚠ THE INSTRUMENT, CHECKED AGAINST SOMETHING IT SHOULD *NOT* FIND. `inFrame`
// answering true for everything would make the row above free. A point the same
// distance BEHIND the eye must be outside — and if it is not, nothing here means
// anything.
const behind = [EX - (CX - EX), feet[1], EZ - (CZ - EZ)];
check(!inFrame(behind),
      `and a point behind the eye at ${behind[0].toFixed(1)},${behind[2].toFixed(1)} is NOT`);

// ── 4. the boom is gone, which is what makes it a tripod ────────────────────
//
// ⚠ THE ROW THAT SEPARATES THIS FROM A MODE. Every mode puts the eye a boom's
// length from the character; this one puts it where the author said, and the two
// only look alike until the author asks for a distance the boom cannot reach.
const want = Math.hypot(CX - EX, CZ - EZ);
const got = Math.hypot(placed[0] - feet[0], placed[2] - feet[2]);
check(Math.abs(got - want) < 0.01,
      `the eye is ${got.toFixed(3)} from the character in plan and was asked for ${want.toFixed(3)}`);
check(Math.abs(got - dist(follow, feet)) > 1.0,
      `and that is not the boom the follow camera used (${dist(follow, feet).toFixed(3)})`);

// ── 5. releasing gives the mode its camera back ─────────────────────────────
const beforeOff = nViews();
await ask(g, '48:', 'eye ');
await until(() => nViews() > beforeOff, 'no camera was published for the release');
const back = eyeAt();
check(Math.hypot(back[0] - placed[0], back[2] - placed[2]) > 1.0,
      `releasing moved the eye off the tripod (${back.map((n) => n.toFixed(2)).join(',')})`);
check(dist(back, feet) < dist(placed, feet),
      'and back to something the character\'s own boom would reach');

// ── 6. a distance past what is streamed is refused WITH the offer ───────────
//
// ⚠ REFUSED RATHER THAN CLAMPED, `K-FIT`: chunks are streamed within `DRAW_HEXES`
// of the CHARACTER and the fog is centred there too, so an eye beyond that
// photographs the inside of the fog and reports a successful picture of nothing.
const far = await ask(g, `48:${CX + 200},${CZ}`, 'eye ');
check(far.startsWith('eye refused'), `a far eye is refused: ${far}`);
check(far.includes('offer') && far.includes('residual'),
      'with the nearest admissible distance and how far off it was');
// …and it changed nothing: the release above is still in force.
const afterFar = eyeAt();
check(dist(afterFar, feet) < dist(placed, feet),
      'and a refused eye left the camera exactly as it was');

verdict(g, 'eye', check, { said, far });
