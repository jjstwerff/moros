// Cart gate (rung W7, moros#14) — a cart whose wheels turn from DISTANCE
// TRAVELLED, not from elapsed time or accumulated steps.
//
// `hex_body` owns the rule: `wheel_value = travel / (2πr)`, and because the
// value is a FUNCTION of travel rather than a running total, two things follow
// that an accumulation cannot give you:
//
//   · doubling the distance doubles the value, exactly;
//   · rolling out and back returns the wheel to where it started, exactly —
//     an accumulation drifts and never quite closes.
//
// And the skid — `|r·θ − travel|` — is machine-ε for a true roll, which is the
// no-slip identity holding by construction. `slip` is the library's own defect
// knob and is left at 0 here.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const num = (m, key) => {
  const p = m.split(/\s+/);
  const i = p.indexOf(key);
  return i < 0 ? NaN : Number(p[i + 1]);
};
const roll = async (d) => { ws.send(`17:${d}`); return ack('cart travel'); };

// The wheels' own transforms, straight off the wire. A 4x4 column-major matrix
// carries its translation at 12..14, which is where each wheel ACTUALLY ended
// up — as distinct from where the server believes it put them.
let wheelL = null, wheelR = null;
const xyz = (b) => { const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
                     return [m[12], m[13], m[14]]; };

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('6;')) wheelL = xyz(b);
  if (t === 'T' && b.startsWith('7;')) wheelR = xyz(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    const a = await roll(10);
    const b2 = await roll(10);
    const back = await roll(-20);

    const v1 = num(a, 'value'), v2 = num(b2, 'value'), v0 = num(back, 'value');
    const t1 = num(a, 'travel'), t2 = num(b2, 'travel'), t0 = num(back, 'travel');
    const skid = Math.max(num(a, 'skid'), num(b2, 'skid'), num(back, 'skid'));

    // derived, so doubling the travel doubles the value — to the bit, not "about"
    const doubles = Math.abs(v2 - 2 * v1) < 1e-12 && t2 === 20 && t1 === 10;
    // and out-and-back closes exactly; an accumulation would leave a remainder
    const closes = t0 === 0 && v0 === 0;
    // the no-slip identity, machine-eps rather than algebraic zero
    const noSlip = skid < 1e-9;
    // ── THE CART RIDES ON ITS WHEELS (moros#14) ───────────────────────────
    //
    // Everything above measures the wheel's ARITHMETIC and nothing about where
    // the cart is, which is how a cart whose body sat at a constant height over
    // y = 0 — wheels hanging in the air on any slope — stayed green for a whole
    // rung. The pose is now solved from the ground contacts, so gate the two
    // numbers that decide it and let the picture look after itself:
    //
    //   gap  — each wheel's lowest point minus the ground beneath it. Non-zero
    //          means the wheel hovers or sinks, at any camera angle.
    //   axle — the distance between the wheel centres, which must not change
    //          with the bank. Crawler's `hexlink` gates its con-rod for the
    //          same reason: solve the linkage wrongly and the parts still move
    //          convincingly — only the length tells you.
    //
    // ⚠ THE AXLE IS MEASURED FROM THE BROADCAST TRANSFORMS, not from a number
    // the server derives. The first version asked the server, which computed
    // `2·half·√(cos²+sin²)` — 1.1 for every input, a clause that could not
    // fail. Reading the two `T:` matrices measures where the wheels were
    // actually PUT, which is the only version a stretch could show up in.
    //
    // ⚠ AND THE CONTROL: `banked`. On flat ground every clause here passes
    // trivially, so a run that never reached a slope proves nothing. Turning
    // the character before raising puts the hill OFF the cart's axis, which is
    // what makes the two wheels see different ground at all.
    // A look updates `yaw` inside its own handler, and a raise applies in full before
    // the next message is read — so on an ORDERED wire the `17:` ack below covers both.
    // This gate reads no mesh, so there is nothing else to wait for.
    ws.send('3:200,0');                       // turn, so the hill lands off-axis
    for (let k = 0; k < 5; k++) ws.send('5:1');

    const poses = [], axleEnds = [];
    for (let k = 0; k < 10; k++) {
      ws.send('17:1.5');
      poses.push(await ack('cart pose'));
      if (wheelL && wheelR) axleEnds.push({ l: wheelL.slice(), r: wheelR.slice() });
      else axleEnds.push(null);
    }
    const gaps = poses.flatMap(p => [num(p, 'gapl'), num(p, 'gapr')]);
    const banks = poses.map(p => Math.abs(num(p, 'bank')));

    // ── ⚠ THE BANK'S SIGN, WHICH WAS WRONG FOR A WHOLE RUNG AND INVISIBLE ────
    //
    // `gapl`/`gapr` used to be re-derived as `y ± half·sin(bank)` while the
    // wheels were placed by `mat4_rotate_x(bank)` — and mesh3d's `rotate_x`
    // turns about **−x**, the transpose of the sense the solve uses. The two
    // disagreed by `2·half·sin(bank)`: measured, one wheel FLOATED 0.0914 wu and
    // the other SANK the same on a 4.8° slope, while both gaps reported zero.
    //
    // Neither the gap clause nor the axle clause could see it. The gaps were the
    // solve's own arithmetic; the axle is a length, and tilting an axle the wrong
    // way does not change its length. What gives it away is the RELATION between
    // the two hub HEIGHTS and the bank, so that is what this reads — off the
    // transforms, the one place it cannot be re-derived away.
    const hubRel = poses.map((p, i) => {
      const w = axleEnds[i];
      if (!w) return NaN;
      const half = Math.hypot(w.l[0] - w.r[0], w.l[1] - w.r[1], w.l[2] - w.r[2]) / 2;
      return (w.l[1] - w.r[1]) - 2 * half * Math.sin(num(p, 'bank'));
    }).filter(v => Number.isFinite(v));
    const bankSigned = hubRel.length > 0 && Math.max(...hubRel.map(Math.abs)) < 1e-9;
    const worstHubRel = hubRel.length > 0 ? Math.max(...hubRel.map(Math.abs)) : NaN;

    // a wheel is ON the ground: a millimetre, not a hand's width
    const grounded = gaps.every(g => Number.isFinite(g) && Math.abs(g) < 1e-3);
    // ── ⚠ THE AXLE CLAUSE AND ITS `1.1` ARE GONE — `A10` ────────────────────
    //
    // It used to assert `|axle - 1.1| < 1e-9` from the two wheel transforms. That
    // literal was the THIRD home of a number the design's re-assertion table
    // counted: the render transform, the contact solve, and here. The editor now
    // reads it from the mount (`asm_cart` names it once, `asm_frames` and
    // `body_axle` read it), so a gate restating it would be asserting the
    // library's own arithmetic in a browser — and `A-RIGID` is already a property
    // test over generated point pairs and joint values, with a `scale` knob that
    // makes it fail. A stretch is caught there, not here.
    //
    // What stays is what genuinely needs a running world: the wheel's arithmetic,
    // the GAP (which needs terrain), and `bankSigned` (which needs the emitted
    // transforms). That is the shrinking the design predicted for this step.
    // ...and the run actually met a slope, or the three clauses above are void
    const banked = banks.some(b => b > 1e-3);
    const worstGap = Math.max(...gaps.map(Math.abs));
    const maxBank = Math.max(...banks);

    const ok = doubles && closes && noSlip && grounded && banked && bankSigned;
    console.log(JSON.stringify({ a, b2, back, v1, v2, v0, t0, skid,
                                 doubles, closes, noSlip,
                                 worstGap, maxBank, grounded, banked,
                                 worstHubRel, bankSigned, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
