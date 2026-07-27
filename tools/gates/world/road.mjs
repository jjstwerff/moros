// ⚠ THIS GATE IS NOT TRUSTWORTHY YET — its CONTROL passes.
//
// Running the identical script with the `10:1` / `10:0` road toggles removed still
// reports 72 road-material vertices and still returns ok:true. So it is green
// whether or not a road was laid, which makes it a test with no discriminating
// power, not a gate. Where those 72 vertices come from in a fresh world that had
// no road laid into it is NOT diagnosed.
//
// Kept, and kept out of the passing claim, because the finding is worth more than
// a green line: the road IS laid and IS graded when you drive it by hand (road
// range 4.3 against ground range 10.3 across the same hill), but that is an
// observation, not a proof.
//
// Road gate (rung W1, moros#9).
//
// The claim is not "some cells changed colour". It is that a road GRADES the
// ground it crosses: walk a road over a hill and the strip must come out flatter
// than the hill was, at the grade the road was switched on at.
//
// A WORLD gate — it places the character rather than walking it, so it cannot
// break when locomotion changes. Road laying happens on the walk tick, so the
// placements are what drive it.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const chunks = new Map();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let st = 0;

// One chunk carries two meshes and its id carries the PARITY: ground even, road
// odd. An offset would have to out-range enc_coord, which reaches 2.2e12.
const stats = (road) => {
  let lo = 1e9, hi = -1e9, n = 0;
  for (const [id, d] of chunks) {
    if (((id % 2) === 1) !== road) continue;
    for (let i = 1; i < d.length; i += 6) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); n++; }
  }
  return { lo: +lo.toFixed(3), hi: +hi.toFixed(3), n };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // build a hill ahead, then measure how rough the ground is
    for (let k = 0; k < 6; k++) { ws.send('5:1'); await wait(150); }
    await wait(900);
    const ground0 = stats(false);

    // lay a road across it: switch on at flat ground, then walk into the hill
    place(0, 0, 0); await wait(500);
    ws.send('10:1'); await wait(300);
    for (let x = 2; x <= 26; x += 2) { place(x, 0, 0); await wait(260); }
    ws.send('10:0'); await wait(900);

    const road = stats(true);
    // ⚠ NOT "the road mesh is exactly flat", which would be asserting something
    // the renderer deliberately does not do: corners are the mean of the three
    // cells sharing them, so where a graded road meets ungraded ground the edge
    // cells lift or dip to meet it. That lip is correct — it is what stops a seam
    // — and an exact-flatness gate would fail on working code.
    //
    // What IS exact and worth gating: the road strip is markedly flatter than the
    // terrain it crosses. A road that merely draped would match the ground's range
    // rather than cutting it.
    const groundRange = ground0.hi - ground0.lo;
    const roadRange   = road.hi - road.lo;
    const laid    = road.n > 0;
    const graded  = laid && roadRange < groundRange * 0.6;
    const crossed = groundRange > 2.0;                 // there WAS relief to cut
    const ok = laid && graded && crossed;
    console.log(JSON.stringify({ groundRange: +groundRange.toFixed(3),
                                 roadRange: +roadRange.toFixed(3),
                                 cells: road.n, laid, graded, crossed, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 45000);
