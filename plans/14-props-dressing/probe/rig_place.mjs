// P1's other half: does (node frame) + (rig segment) reproduce the cart's
// BROADCAST matrices, with no third source?
//
// `probe/rig_place.loft` establishes what the rig's segment carries — the
// in-plane direction, exactly, and nothing out of the plane. This measures
// whether that plus the node frame is the whole of a render transform, against
// the matrices the server actually puts on the wire.
//
// ── what is independent of what ─────────────────────────────────────────────
//
// The wheel transforms are predicted from THREE things, none of which is a
// wheel matrix:
//
//   · the BODY's broadcast matrix     — the support solve's output (`A-GROUND`)
//   · the mount offset `w`            — measured once on flat ground, then used
//                                       to predict the SLOPED case
//   · the spin, from `S:cart travel … angle A` — which is `wheel_angle` of the
//     rig's own joint value, i.e. exactly what the segment carries
//
// ⚠ `w` is measured at rest and then TESTED against a different configuration.
// Reading it from the sloped frames would make the whole thing circular, which
// is the shape of the axle clause that once computed `2·half·√(cos²+sin²)` and
// could not fail.
//
// ⚠ THIS PROBE MOVES THE WORLD — it turns the character, raises a hill and rolls
// the cart, exactly as the cart gate does. Reload a world afterwards.
//
// run: node plans/14-props-dressing/probe/rig_place.mjs
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Column-major 4x4, the wire's own layout: element (row, col) is m[col*4 + row].
const mul = (a, b) => {
  const c = new Array(16).fill(0);
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[col * 4 + k];
      c[col * 4 + row] = s;
    }
  return c;
};
const trans = (x, y, z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t);
                      return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; };
// ⚠ MEASURED, NOT ASSUMED. mesh3d's `rotate_x` puts +sin in the third column's
// second row, which is the transpose of the convention written here first — and
// the mistake survived a whole run because the world was FLAT, where this matrix
// is the identity and its sign cannot matter. `bodyConvention` below is the
// clause that catches it, and it too is void on flat ground.
const rotX = (t) => { const c = Math.cos(t), s = Math.sin(t);
                      return [1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1]; };
const rotZ = (t) => { const c = Math.cos(t), s = Math.sin(t);
                      return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; };
const maxdiff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
// R = Ry(yaw)·Rx(bank). Row 1 of that product is (0, cos b, sin b) and column 0
// is (cos y, 0, −sin y), so each angle comes out without the other.
// ⚠ In this world `cart_yaw` never changes — nothing rotates the cart — so the
// yaw term is exercised only as an identity here. The bank is the one under test.
const yawOf = (m) => Math.atan2(-m[2], m[0]);
const bankOf = (m) => Math.atan2(m[9], m[5]);

const status = [];
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return null;
};
const num = (m, key) => { const p = m.split(/\s+/); const i = p.indexOf(key);
                          return i < 0 ? NaN : Number(p[i + 1]); };

const cur = { body: null, wl: null, wr: null, bank: NaN };
const shots = [];
let phase = 0;

const mat = (b) => b.slice(b.indexOf(';') + 1).split(',').map(Number);

ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T') {
    if (b.startsWith('5;')) cur.body = mat(b);
    if (b.startsWith('6;')) cur.wl = mat(b);
    if (b.startsWith('7;')) cur.wr = mat(b);
  }
  if (t === 'S') {
    status.push(b);
    if (b.startsWith('cart pose')) cur.bank = num(b, 'bank');
    // `cart travel` is broadcast AFTER cart_send, so everything above is this
    // tick's — which is what makes a snapshot coherent rather than mixed.
    if (b.startsWith('cart travel') && cur.body && cur.wl && cur.wr)
      shots.push({ body: cur.body, wl: cur.wl, wr: cur.wr,
                   bank: cur.bank, roll: num(b, 'angle') });
  }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !phase) { phase = 1; run(); }
};

async function run() {
  const out = {};
  // ── flat and at rest: measure the mount offset, once ──────────────────────
  await wait(400);
  if (!cur.wl || !cur.wr || !cur.body) { fail('no cart on the wire'); return; }
  const w = Math.hypot(cur.wl[12] - cur.wr[12], cur.wl[13] - cur.wr[13],
                       cur.wl[14] - cur.wr[14]) / 2;
  out.mountOffset = +w.toFixed(9);
  // the convention check: rebuild the BODY from its translation, its own yaw and
  // the bank the STATUS line reports. A wrong matrix convention dies here.
  const rebuildBody = (m, bank) =>
    mul(mul(trans(m[12], m[13], m[14]), rotY(yawOf(m))), rotX(bank));
  out.bodyConvention = +maxdiff(cur.body, rebuildBody(cur.body, cur.bank)).toExponential(3);
  out.bankFromMatrix = +bankOf(cur.body).toFixed(9);
  out.bankFromStatus = +cur.bank.toFixed(9);

  // ── onto a slope, and rolling ────────────────────────────────────────────
  ws.send('3:200,0');                       // turn, so the hill lands off-axis
  await wait(300);
  for (let k = 0; k < 5; k++) { ws.send('5:1'); await wait(160); }
  shots.length = 0;
  for (let k = 0; k < 10; k++) { ws.send('17:1.5'); await ack('cart travel'); }

  if (shots.length < 5) { fail(`only ${shots.length} snapshots`); return; }

  // ── the reconstruction, and three ways to break it ───────────────────────
  const worst = { full: 0, noOffset: 0, noSpin: 0, noBank: 0 };
  let maxBank = 0, maxSpinOff = 0;
  for (const s of shots) {
    maxBank = Math.max(maxBank, Math.abs(s.bank));
    // How far the spin is from a whole turn. ⚠ MAX, not min: every `worst.*`
    // below is a max over snapshots, so a control is exercised as soon as ONE
    // snapshot has a real spin. Guarding on the min asked every snapshot to be
    // spun and failed a run whose measurements were all fine.
    const wrapped = Math.atan2(Math.sin(s.roll), Math.cos(s.roll));
    maxSpinOff = Math.max(maxSpinOff, Math.abs(wrapped));

    const node = (base, off) => mul(base, trans(0, 0, off));
    const flat = mul(trans(s.body[12], s.body[13], s.body[14]), rotY(yawOf(s.body)));

    const predL = mul(node(s.body, -w), rotZ(s.roll));
    const predR = mul(node(s.body, +w), rotZ(s.roll));
    worst.full = Math.max(worst.full, maxdiff(predL, s.wl), maxdiff(predR, s.wr));

    // (1) the mount offset dropped. ⚠ Measured as the TRANSLATION DISTANCE, not
    // an elementwise max: the offset is along the node frame's z, so its largest
    // single component is `w·|z_axis component|` — 0.5481 against w = 0.55, which
    // is not a failure of the offset but of comparing a max to a length.
    const pz = mul(node(s.body, 0), rotZ(s.roll));
    worst.noOffset = Math.max(worst.noOffset,
      Math.hypot(pz[12] - s.wl[12], pz[13] - s.wl[13], pz[14] - s.wl[14]));
    // (2) the spin dropped — the one thing the rig's segment supplies
    worst.noSpin = Math.max(worst.noSpin, maxdiff(node(s.body, -w), s.wl));
    // (3) the node frame's OUT-OF-PLANE rotation dropped
    worst.noBank = Math.max(worst.noBank,
      maxdiff(mul(node(flat, -w), rotZ(s.roll)), s.wl));
  }

  out.snapshots = shots.length;
  out.maxBank = +maxBank.toFixed(6);
  out.spinAwayFromZero = +maxSpinOff.toFixed(4);
  out.fullReconstruction = +worst.full.toExponential(3);
  out.withoutMountOffset = +worst.noOffset.toFixed(9);
  out.withoutSpin = +worst.noSpin.toFixed(6);
  out.withoutBank = +worst.noBank.toFixed(6);

  // Void guards first: on flat ground with a still wheel every clause below
  // passes for free, which is how a whole rung of cart gates stayed green.
  const reached = maxBank > 1e-3 && maxSpinOff > 0.5;
  const ok = reached
    && out.bodyConvention < 1e-12
    && worst.full < 1e-12
    && Math.abs(worst.noOffset - w) < 1e-9      // exactly the offset, nothing else
    && worst.noSpin > 0.1
    && worst.noBank > 0.01;
  out.reachedASlopeAndASpin = reached;
  out.ok = ok;
  console.log(JSON.stringify(out, null, 1));
  ws.close();
  process.exit(ok ? 0 : 1);
}

function fail(why) { console.log(JSON.stringify({ ok: false, why })); process.exit(1); }
// A silent exit-1 once cost a debugging round: an unhandled rejection in the
// async message handler leaves nothing on stdout at all.
process.on('unhandledRejection', (e) => fail(`unhandled: ${e && e.message}`));
process.on('uncaughtException', (e) => fail(`uncaught: ${e && e.message}`));
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
