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
    setTimeout(() => ws.send('4:0'), 1500);            // release
    setTimeout(finish, 2000);
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
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
