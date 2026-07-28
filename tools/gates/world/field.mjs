// Field gate (rung W3, moros#11).
//
// ⚠ Getting this to pass found a bug in ROADS, not in fields: road was laid at
// `last_hq`/`last_hr`, which only the walk tick updates, so every PLACEMENT paved
// the same stale hex and a placed path made a blob instead of a line. Row 5's gate
// passed anyway — it asked whether road cells existed and were flat, never whether
// they followed the path. This gate needs a closed ring, so it could not.
//
// The claim: a fill is BOUNDED or it is REFUSED. Enclose ground with road and the
// fill takes the inside; stand on open ground and it must refuse and change
// nothing — because a flood that stops at a cap leaves a field with an edge nobody
// drew, which looks like a bug in the fill rather than a gap in the fence.
//
// A WORLD gate: places, never walks. Surfaces are one mesh each, id ≡ 0/1/2 mod 3
// above the reserved figure block (0-15): ground, road, field.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { place(x, z, yaw); return ack('placed'); };
const chunks = new Map();
let st = 0, status = [];

const verts = (kind) => {           // 0 ground, 1 road, 2 field
  let n = 0;
  for (const [id, d] of chunks) {
    if (id <= 15) continue;
    if ((id - 16) % 5 !== kind) continue;
    n += d.length / 6;
  }
  return n;
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const body = rest.slice(rest.indexOf(';') + 1);
    // ⚠ An EMPTY mesh is the normal case here — a chunk with no field cells sends
    // one — and `''.split(',')` is `['']`, which maps to `[NaN]` and counts as one
    // element. Summing length/6 over those produced 8.000000000000005 vertices,
    // a number that cannot be right and was the tell that the GATE was at fault.
    chunks.set(id, body === '' ? [] : body.split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // ⚠ WAIT FOR THE SERVER, NOT THE CLOCK. Every step below used a fixed sleep,
    // and on a busy box they all came up short: the fill's refusal arrived after
    // the gate had already read "no refusal", and the road ring leaked because
    // 150ms per placement was not enough for the server to lay each segment. Both
    // look exactly like the feature being broken.
    // ── CONTROL FIRST: open ground has no boundary, so the fill must refuse.
    await placeAck(0, 0, 0);
    ws.send('11:');
    const refused = await ack('field');
    await wait(400);
    const refusedField = verts(2);

    // ── enclose a small patch by walking a road ring around it
    // ⚠ RADIUS MATTERS. The road is ROAD_HALF = 2 hexes each side (~3.5 wu), so a
    // ring tighter than that paves its own interior — the first version used ~6 wu
    // and the fill then refused because the character was standing ON the road,
    // not inside an enclosure. 16 wu leaves roughly six hexes of open ground.
    // 32 samples, not 16: the chord between placements must be comfortably under the
    // road width or the ring leaks. At R=16 sixteen samples give a 6.2 wu chord
    // against a ~7 wu strip — overlapping only just, and it did not close.
    const R = 16, ring = [];
    for (let k = 0; k <= 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      ring.push([+(R * Math.cos(a)).toFixed(2), +(R * Math.sin(a)).toFixed(2)]);
    }
    ws.send('10:1'); await ack('road');
    for (const [x, z] of ring) { await placeAck(x, z, 0); }
    ws.send('10:0'); await ack('road');

    // stand inside and fill
    await placeAck(1, 1, 0);
    ws.send('11:');
    const fillMsg = await ack('field');
    await wait(1200);
    const filled = verts(2);
    const okMsg  = fillMsg.includes('field filled');

    const ok = refused.includes('field refused') && refusedField === 0
               && okMsg && filled > 0;
    console.log(JSON.stringify({ refusedOnOpenGround: refused, fieldAfterRefusal: refusedField,
                                 filledInsideRing: okMsg, fieldVerts: filled, ok,
                                 status: status.slice(-4) }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
