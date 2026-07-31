// Probe: HOW FAR DOES THE BODY GO THROUGH A FENCE?
//
// The walk moves a POINT and stops it one SKIN (1 cm) short of a hex bisector,
// while the drawn body is a box some tens of centimetres wide — so the overlap is
// whatever half that box is, and nothing in the model knows about it. Measure it
// rather than assume it: read the body mesh's own extents off the wire, walk into
// a fence, and report the gap between the body's near face and the barrier.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = []; let st = 0, tCount = 0;
const trace = [];
const meshes = new Map();
const ack = async (p, l = 30000) => { const f = status.length;
  for (let t = 0; t < l; t += 60) { await wait(60);
    const m = status.slice(f).find((x) => x.startsWith(p)); if (m) return m; }
  return `(no "${p}" in ${l}ms)`; };
const place = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const nextT = async (l = 15000) => { const b = tCount;
  for (let t = 0; t < l; t += 5) { if (tCount !== b) return true; await wait(5); } return false; };
const HEX = 1.7320508075688772;

ws.onmessage = async (e) => { const s=e.data,i=s.indexOf(':'),t=s.slice(0,i),b=s.slice(i+1);
  if (t==='S') status.push(b);
  if (t==='T' && b.startsWith('0;')) { trace.push(b.slice(2).split(',').map(Number)); tCount++; }
  if (t==='M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const d = rest.slice(rest.indexOf(';') + 1);
    meshes.set(id, d === '' ? [] : d.split(',').map(Number)); }
  if (t==='E') ws.send('2:1.5,');
  if (t==='C' && !st) { st=1;
    await place(0, 0, 0);
    await nextT();

    // ── the body's own size, from the mesh the server sent for part 0
    const body = meshes.get(0) ?? [];
    let bx = [Infinity, -Infinity], bz = [Infinity, -Infinity];
    for (let k = 0; k + 5 < body.length; k += 6) {
      bx = [Math.min(bx[0], body[k]), Math.max(bx[1], body[k])];
      bz = [Math.min(bz[0], body[k + 2]), Math.max(bz[1], body[k + 2])];
    }
    const halfX = (bx[1] - bx[0]) / 2, halfZ = (bz[1] - bz[0]) / 2;

    // ── a fence ring around cell (4,0), then walk east into its west side
    await place(4 * HEX, 0, 0);
    ws.send('23:3,2'); const fenced = await ack('fenced');
    await ack('rebuilt');

    // start well west of the ring and walk east
    await place(0, 0, 0);
    await nextT();
    ws.send('4:1');
    let stuck = 0, lastX = trace[trace.length - 1][0];
    for (let k = 0; k < 6000; k++) {
      if (!(await nextT())) break;
      const x = trace[trace.length - 1][0];
      if (Math.abs(x - lastX) < 0.0005) { stuck += 1; if (stuck >= 60) break; }
      else stuck = 0;
      lastX = x;
    }
    ws.send('4:0'); await nextT();
    const stopX = trace[trace.length - 1][0];

    // The ring's west side: cells at distance 2 from (4,0), so the barrier lies on
    // the bisector between cell 1 and cell 2 — at x = 1.5 * HEX.
    const barrier = 1.5 * HEX;
    console.log(JSON.stringify({
      fenced,
      bodyHalfWidthX: +halfX.toFixed(4), bodyHalfWidthZ: +halfZ.toFixed(4),
      stopX: +stopX.toFixed(4), barrierX: +barrier.toFixed(4),
      centreGap: +(barrier - stopX).toFixed(4),
      // NEGATIVE means the drawn body is through the barrier
      bodyGap: +(barrier - stopX - halfX).toFixed(4),
    }, null, 1));
    ws.close(); process.exit(0); } };
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 120000);
