// ⚠ THIS GATE DOES NOT YET WORK — kept out of the passing claim.
//
// It reports `refusedOnOpenGround: false` and a FRACTIONAL vertex count
// (8.000000000000005), so both of its observations are wrong: the status capture
// misses a message that demonstrably arrives, and the mesh slicing is off by
// something that leaves a non-multiple of six.
//
// The BEHAVIOUR is verified directly — a probe that connects, places at the origin
// and sends `11:` gets back exactly
//     "field refused — the enclosure is not closed"
// which is the refusal this rung is about. What is unproven is the bounded case,
// and nothing here should be read as gating it.
//
// Field gate (rung W3, moros#11).
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
const chunks = new Map();
let st = 0, status = [];

const verts = (kind) => {           // 0 ground, 1 road, 2 field
  let n = 0;
  for (const [id, d] of chunks) {
    if (id <= 15) continue;
    if ((id - 16) % 3 !== kind) continue;
    n += d.length / 6;
  }
  return n;
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // ── CONTROL FIRST: open ground has no boundary, so the fill must refuse.
    place(0, 0, 0); await wait(500);
    ws.send('11:'); await wait(1200);
    const refusedField = verts(2);
    const refused = status.some(x => x.includes('field refused'));

    // ── enclose a small patch by walking a road ring around it
    const ring = [[6,0],[6,2],[6,4],[4,6],[2,6],[0,6],[-2,6],[-4,4],[-4,2],[-4,0],
                  [-4,-2],[-2,-4],[0,-4],[2,-4],[4,-4],[6,-2],[6,0]];
    ws.send('10:1'); await wait(300);
    for (const [x, z] of ring) { place(x, z, 0); await wait(240); }
    ws.send('10:0'); await wait(600);

    // stand inside and fill
    place(1, 1, 0); await wait(600);
    ws.send('11:'); await wait(1800);
    const filled = verts(2);
    const okMsg  = status.some(x => x.includes('field filled'));

    const ok = refused && refusedField === 0 && okMsg && filled > 0;
    console.log(JSON.stringify({ refusedOnOpenGround: refused, fieldAfterRefusal: refusedField,
                                 filledInsideRing: okMsg, fieldVerts: filled, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 60000);
