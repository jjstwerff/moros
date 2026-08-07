// ⚠ CHECKED AND LEFT WHOLE — the archetypal emission gate. Every vertex of the
// wall mesh must lie on the run's line; `tests/wallrun.loft` proves the STORE side
// (the edges the line marks) and only this can prove the DRAWN side. The two
// together are the point: the edges are the index, the run is the truth.
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

import { connect, send, ask, until, report } from '../lib.mjs';

const SURFACES = 9;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit
                      // — keep equal to `SURFACES` in `src/editor_server.loft`

const g = await connect({ camera: true });
const isWall = (id) => id > 15 && (id - 16) % SURFACES === 5;
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];
const placeAt = (q, r) => {
  const [x, z] = cellXZ(q, r);
  return send(g, `7:${x.toFixed(4)},${z.toFixed(4)},0`, ['placed']);
};
// The live wall meshes, as float arrays — `X:` retirements subtracted.
const wallMeshes = () => {
  const out = [];
  for (const [id, body] of g.picture) {
    if (g.gone.has(id) || !isWall(id)) continue;
    const p = body.split(';');
    if (p.length >= 3) out.push(p[2] === '' ? [] : p[2].split(',').map(Number));
  }
  return out;
};

// Walk a road with an OFF-AXIS end, so the heading has to snap and the run is
// not accidentally parallel to a lattice axis — where a staircase and a line
// agree and the measurement says nothing.
const A = [0, 0], B = [14, 4];
await placeAt(...A);
await send(g, '25:3', ['road']);          // start the run
await placeAt(...B);
const laid = await ask(g, '25:3', 'road laid');   // and close it
// ⚠ WAIT FOR THE SERVER, NOT THE CLOCK. This was `await wait(2500)` with the
// comment "let the rebuild land" — which names exactly the thing the server
// announces. `S:rebuilt N chunks` is broadcast after the whole `Z:1` … `Z:0`
// transaction, so it is the signal that the PICTURE caught up and not just the
// world. `field.mjs` had the same sleep and read **0 vertices on every run**
// once the guess stopped winning the race.
// ⚠ NOTHING IS SENT FOR IT — the road that was just laid dirties the chunks, so the
// rebuild is already on its way; this waits for it among what followed the `25:3`.
await until(() => g.says.some((x) => x.startsWith('rebuilt')), 'the road never rebuilt');
const rebuilt = [...g.says].reverse().find((x) => x.startsWith('rebuilt')) ?? '';

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
for (const d of wallMeshes()) {
  for (let k = 0; k + 5 < d.length; k += 6) {
    const dist = perp(d[k], d[k + 2]);
    sides.add(Math.round(dist * 100) / 100);
    verts += 1;
  }
}
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
report(g, { step, verts, rebuilt, offsets: offsets.slice(0, 8),
                             nearSpread: +nearSpread.toFixed(4),
                             farSpread: +farSpread.toFixed(4),
                             worstSpreadWithinASide: +worst.toFixed(4),
                             drew, straight, ok
}, ok);
