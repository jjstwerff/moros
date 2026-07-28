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

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
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
    const ok = doubles && closes && noSlip;
    console.log(JSON.stringify({ a, b2, back, v1, v2, v0, t0, skid,
                                 doubles, closes, noSlip, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
