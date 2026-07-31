// Straightness gate (rung W2, moros#10) — THE WALL THAT IS DRAWN IS THE RUN.
//
// The edges a wall marks are a staircase; they have to be, because an edge is a
// boundary between two cells and a line crossing the lattice crosses a staircase
// of them. That is the INDEX. What gets DRAWN must be the run, and the difference
// is measurable: every vertex of the wall mesh must lie on the run's line.
//
// So this reads the wall surface's own triangles off the wire and measures each
// vertex's perpendicular distance to the authored line. A per-hex-edge wall — the
// version this replaced — scatters vertices up to half a hex either side; the run
// puts them ON it.
//
// ⚠ The bound is not "small", it is ZERO to within float noise. A tolerance loose
// enough to admit a zigzag would pass the thing this exists to catch.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = [];
const chunks = new Map();
let st = 0;
const SURFACES = 7;                  // ground, road, field, vegetation, roof, wall, floor
const isWall = (id) => id > 15 && (id - 16) % SURFACES === 5;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find((x) => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  return ack('placed');
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'M') {
    const h = b.indexOf(';');
    const id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const body = rest.slice(rest.indexOf(';') + 1);
    chunks.set(id, body === '' ? [] : body.split(',').map(Number));
  }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // Walk a road with an OFF-AXIS end, so the heading has to snap and the run is
    // not accidentally parallel to a lattice axis — where a staircase and a line
    // agree and the measurement says nothing.
    const A = [0, 0], B = [14, 4];
    await placeAt(...A);
    ws.send('25:3'); await ack('road');
    await placeAt(...B);
    ws.send('25:3');
    const laid = await ack('road laid');
    // ⚠ WAIT FOR THE SERVER, NOT THE CLOCK. This was `await wait(2500)` with the
    // comment "let the rebuild land" — which names exactly the thing the server
    // announces. `S:rebuilt N chunks` is broadcast after the whole `Z:1` … `Z:0`
    // transaction, so it is the signal that the PICTURE caught up and not just the
    // world. `field.mjs` had the same sleep and read **0 vertices on every run**
    // once the guess stopped winning the race.
    const rebuilt = await ack('rebuilt');

    const m = laid.match(/heading (\d+) of 24 \(snapped, residual ([0-9.]+)/);
    const step = m ? Number(m[1]) : -1;
    // The run the server actually laid: from A along the snapped heading, for the
    // walked distance projected onto it. Re-derived here rather than trusted.
    const ang = step * (2 * Math.PI / 24);
    const [ax, az] = cellXZ(...A), [bx, bz] = cellXZ(...B);
    const reach = (bx - ax) * Math.cos(ang) + (bz - az) * Math.sin(ang);
    const ex = ax + Math.cos(ang) * reach, ez = az + Math.sin(ang) * reach;
    // perpendicular distance from a point to the infinite line through A and E
    const L = Math.hypot(ex - ax, ez - az);
    const nx = -(ez - az) / L, nz = (ex - ax) / L;
    const perp = (x, z) => Math.abs(nx * (x - ax) + nz * (z - az));

    // Every wall vertex, and how far off the line it sits. The fence runs on BOTH
    // sides at a fixed offset, so the measurement is the distance to the nearer
    // side — a vertex belongs to one of two parallel lines, not to the centre.
    let verts = 0, worst = 0, sides = new Set();
    for (const [id, d] of chunks) {
      if (!isWall(id)) continue;
      for (let k = 0; k + 5 < d.length; k += 6) {
        const dist = perp(d[k], d[k + 2]);
        const side = Math.round(dist * 100) / 100;
        sides.add(side);
        verts += 1;
      }
    }
    // Group the offsets: a straight pair of fences gives exactly TWO distinct
    // perpendicular distances (one per side). A staircase gives a spread.
    const offsets = [...sides].sort((a, b) => a - b);
    const spread = offsets.length ? offsets[offsets.length - 1] - offsets[0] : -1;
    // the two sides are half a road-width apart, so the spread across all vertices
    // is that gap and nothing more; within one side it must be zero
    const bySide = new Map();
    for (const o of offsets) {
      const key = o < (offsets[0] + offsets[offsets.length - 1]) / 2 ? 'near' : 'far';
      bySide.set(key, Math.max(bySide.get(key) ?? 0, o) - Math.min(bySide.get(key) ?? o, o));
    }
    const near = offsets.filter((o) => o <= (offsets[0] + offsets[offsets.length - 1]) / 2);
    const far = offsets.filter((o) => o > (offsets[0] + offsets[offsets.length - 1]) / 2);
    const nearSpread = near.length ? near[near.length - 1] - near[0] : 0;
    const farSpread = far.length ? far[far.length - 1] - far[0] : 0;
    worst = Math.max(nearSpread, farSpread);

    const drew = verts > 0;
    const straight = worst <= 0.02;          // float noise, not half a hex
    const ok = drew && straight && step >= 0;
    console.log(JSON.stringify({ step, verts, rebuilt, offsets: offsets.slice(0, 8),
                                 nearSpread: +nearSpread.toFixed(4),
                                 farSpread: +farSpread.toFixed(4),
                                 worstSpreadWithinASide: +worst.toFixed(4),
                                 drew, straight, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
