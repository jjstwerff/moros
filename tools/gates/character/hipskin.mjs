// ⚠ THE CHARACTER SUITE WAS CHECKED AGAINST THE THINNING RULE AND LEFT WHOLE. The
// world gestures moved into `hex_editor` and their claims became loft tests; the
// WALK did not, and cannot yet — it lives in the server's tick (`walk_h`,
// `edges_walk`, the fall) and in `moros_sim`, and what these gates measure is the
// character's TRACE over many ticks: how far it got, how steep it climbed, where it
// stopped. There is no store claim here being restated, so nothing to remove.
// A-SKIN at the hip: the pelvis must reach BELOW the joint far enough to bury
// the thigh's top face at the widest angle the gait actually reaches.
//
// `limb_mesh` builds the leg from y = −len to y = 0 and `limb_at` pivots it
// about y = 0, so the leg's top face lies IN the pivot plane — exactly where
// the pelvis box's flat bottom was. At swing θ the face's corner dips
// (w/2)·sin θ below it and opens a wedge nothing fills; in the frame it reads
// as the lit top face of the thigh, seen from above through the gap.
//
// ⚠ EVERY NUMBER HERE COMES OFF THE WIRE. The leg's half-width is read from
// the emitted leg mesh, the pivot from the difference of the broadcast
// transforms, the pelvis's reach from the emitted body mesh — and the ANGLE is
// measured from the leg's own rotation while walking, not taken from
// LEG_SWING. That last one is the point: the overlap is exactly TANGENT at the
// edge of the swing range (probe/skin_joint.loft case C), so a gate that
// checked against a constant would stay green the day someone widens the gait
// and the seam reopens. Checking against the observed angle cannot.
//
// The pure-geometry half of this claim — that burying the face closes the seam
// at EVERY angle, not just the widest — is
// plans/14-props-dressing/probe/skin_joint.loft, which needs no server.
const BODY = 0, LEG_L = 1;
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);

let bodyMinY = null, legHalfW = null;
let bodyT = null, legT = null;
let maxSwing = 0, poses = 0, phase = 0;
// ── ⚠ DRIVEN BY POSES, NEVER BY THE WALL CLOCK — plan 19 `L5` ──────────────
//
// This gate held W for 1500 ms and judged at 2000 ms. A wall clock measures the
// MACHINE: with four interpreted servers on the box the same 2000 ms delivered
// **one** pose instead of 58, and it reported `{"poses":1,"maxSwing":0}` — which
// reads as *the gait is dead* and means *nothing happened yet*. It passed alone on
// the same build, every time.
//
// So the phases advance on poses OBSERVED — the very quantity the verdict is
// computed from. Measured healthy: 58. A busy box makes this slower and never
// wrong.
// ⚠ ONE COUNT, NOT TWO, AND MEASURING IT IS WHAT SAID SO. The first version held
// for 34 poses and judged at 52 — and hung at 34, because **the server sends a
// transform only while the body is moving**: releasing W stops the stream, so a
// count taken after the release can never be reached. W is held until the verdict's
// own evidence exists, and released in the same breath as judging it.
const JUDGE_POSES = 44;   // poses observed WHILE walking, then release and judge
let judged = false;

ws.onopen = () => ws.send('1:');
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    const p = b.split(';');
    const id = Number(p[0]);
    if (p.length < 4) return;
    if (id === BODY && bodyMinY === null) {
      let lo = Infinity;
      const f = p[3].split(',').map(Number);
      for (let k = 1; k + 4 < f.length; k += 6) lo = Math.min(lo, f[k]);
      bodyMinY = lo;
    }
    if (id === LEG_L && legHalfW === null) {
      let hi = 0;
      const f = p[3].split(',').map(Number);
      for (let k = 0; k + 5 < f.length; k += 6) hi = Math.max(hi, Math.abs(f[k]));
      legHalfW = hi;
    }
  }
  if (t === 'T') {
    const p = b.split(';');
    const id = Number(p[0]);
    const m = p[1].split(',').map(Number);
    if (id === BODY) bodyT = m;
    if (id === LEG_L) {
      legT = m;
      // R_leg = Ry(yaw)·Rz(swing). Ry leaves the y row alone, so the y
      // components of the first two columns are (sin θ, cos θ) whatever the
      // yaw — the joint angle falls out with no need to undo the turn.
      const sw = Math.atan2(m[1], m[5]);
      if (Math.abs(sw) > maxSwing) maxSwing = Math.abs(sw);
      poses++;
    }
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && phase === 0) {
    phase = 1;
    // The clock, not the walk: `34:8` consumes the same FIXED ticks eight times
    // faster, so the world is the one this gate has always measured and the
    // waiting is not. (STATE.md: three rates, byte-identical worlds.)
    ws.send('34:8');
    ws.send('4:1');                                    // hold W
  }
  // ⚠ THE PHASES ADVANCE ON THE MEASUREMENT ITSELF. `poses` is incremented above
  // for every leg transform that arrives, and it is what `finish` judges — so the
  // gate cannot judge a run it has not yet observed.
  if (phase === 1 && !judged && poses >= JUDGE_POSES) {
    judged = true;
    ws.send('4:0');                                    // release
    finish();
  }
};

function finish() {
  const pivotY = (legT && bodyT) ? legT[13] - bodyT[13] : null;
  // what the widest observed angle demands, and what the pelvis actually gives
  const need = (legHalfW !== null) ? legHalfW * Math.sin(maxSwing) : null;
  const have = (pivotY !== null && bodyMinY !== null) ? pivotY - bodyMinY : null;
  // ⚠ THE MARGIN HERE IS MICRONS, AND THAT IS CORRECT, NOT SLACK. The overlap
  // is derived from the gait's own peak, so `have` and `need` are the SAME
  // number whenever the sampled pose lands on the peak — the design is exactly
  // tangent and this gate sits on the tangency. The tolerance is the wire's
  // own precision (~8 significant digits), so the comparison is not decided by
  // formatting; it is not room for the pelvis to be short.
  const FLOOR = 1e-6;
  const ok = need !== null && have !== null && poses > 0
    && maxSwing > 0.05                                 // the gait really swung
    && have >= need - FLOOR;
  console.log(JSON.stringify({
    poses, maxSwing: r(maxSwing), legHalfW: r(legHalfW), pivotY: r(pivotY),
    bodyMinY: r(bodyMinY), need: r(need), have: r(have),
    margin: r(have === null || need === null ? null : have - need), ok }));
  ws.close();
  process.exit(ok ? 0 : 1);
}
const r = (v) => v === null ? null : Number(v.toFixed(6));

ws.onerror = () => process.exit(2);
// ⚠ THE BACKSTOP SAYS HOW FAR IT GOT — `TIMEOUT` alone cannot tell *the simulation
// never ticked* from *the gait is broken*, which is the whole distinction this
// change is about.
setTimeout(() => {
  console.log(JSON.stringify({ verdict: 'TIMEOUT waiting for poses',
                               poses, want: JUDGE_POSES, ok: false }));
  process.exit(3);
}, 240000);
