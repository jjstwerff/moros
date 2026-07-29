// SEAM PROBE — is the drawn ground watertight, and is its shading continuous?
//
// "Lines on the outside of hexes" has two candidate causes that look identical on
// screen and are completely different to fix:
//
//   a CRACK   — two cells disagree about where a shared corner IS, so background
//               shows through a sub-pixel gap. Fixed by making the corner one
//               value, computed once.
//   a CREASE  — the corner positions agree but the NORMALS at them do not, so
//               lighting steps across the hex edge. Fixed in the shading, and
//               rounding heights would only move it, never remove it.
//
// So this reports both, separately, and it reads THE TRIANGLES THAT ARE DRAWN —
// the same `M:` vertex runs the client renders — rather than the server's opinion
// of the height field.
//
// It is READ-ONLY. It sends one `2:<aspect>` (a camera for its own viewport, which
// is per-client) and nothing else, so it is safe to point at a server a human is
// already using: the shared character does not move.
//
// ⚠ THE SETTLED WORLD IS THE STATE IN WHICH THIS BUG CANNOT APPEAR. Measured on a
// finished hill the ground is watertight to the last bit — and that is precisely
// when the artefact is not on screen. The chunk meshes are rebuilt one at a time,
// and a corner on a chunk boundary is the mean of cells on BOTH sides, so between
// the rebuild of one chunk and its neighbour the two disagree about where that
// corner is. `--watch` samples while the world is being edited, which is the only
// window in which there is anything to see.
//
// Usage:  node tools/seam.mjs [port] [--watch SECONDS]
const port = process.argv[2] ?? '18090';
const watchArg = process.argv.indexOf('--watch');
const watchSec = watchArg > 0 ? Number(process.argv[watchArg + 1] ?? 15) : 0;
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);

// TWO views of the same stream, which is what makes this a gate rather than an
// observation. `chunks` applies every M:/X: the moment it arrives — the client we
// had. `staged` holds a rebuild back until its `Z:0` commit — the client we want.
// The fix is proven when the first shows cracks and the second does not; if BOTH
// are clean the run measured nothing, and if BOTH tear the staging is not working.
const chunks = new Map();
const staged = new Map();
let pending = null;

ws.onopen = () => ws.send('1:');   // ready — send me the world

// --drive raises and lowers a hill itself, so the check does not need a human at
// the keyboard. It EDITS THE WORLD, so point it at a scratch server, never at one
// someone is using.
const drive = process.argv.includes('--drive');

// LIVENESS. A watch over a world nobody is editing reports zero cracks, which
// reads exactly like "no bug" and means "no measurement" — the same shape as the
// idle-gate result that was verified on a server which had never had a client.
// So count the mesh updates that actually arrived, and refuse a verdict without
// them.
let meshUpdates = 0;

ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    meshUpdates++;
    const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1);
    rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) {
      const away = gone.get(id);
      if (away !== undefined) { holes.push({ id, ms: Date.now() - away }); gone.delete(id); }
      const data = rest.slice(rest.indexOf(';') + 1).split(',').map(Number);
      chunks.set(id, data);
      if (pending) pending.push([id, data]); else staged.set(id, data);
    }
  }
  if (t === 'Z') {
    if (b === '1') { pending = []; }
    else {
      for (const [id, d] of pending ?? []) { if (d === null) staged.delete(id); else staged.set(id, d); }
      pending = null;
    }
  }
  if (t === 'X') {
    chunks.delete(Number(b)); gone.set(Number(b), Date.now());
    if (pending) pending.push([Number(b), null]); else staged.delete(Number(b));
  }
  if (t === 'E') ws.send('2:1.5,');
};

// SEEING THROUGH THE WORLD is not a crack at all — it is a chunk that is not
// there. A rebuild that sends `X:<id>` and then `M:<id>` leaves that chunk's
// ground absent for the interval between them, and for that interval the client
// draws sky where the hill is. So time the gap: how long each id stays deleted
// before it comes back, and how many are missing at once.
const gone = new Map();     // id → when it was deleted
const holes = [];           // { id, ms } for each delete → re-add round trip

// Cluster vertices by their (x, z) footprint. Every hex corner is emitted once per
// cell that touches it — three times for an interior corner — so a corner with a
// spread of zero in y is shared exactly, and a nonzero spread IS the crack.
const KEY = (x, z) => `${x.toFixed(3)},${z.toFixed(3)}`;

function analyse(light, src) {
  const at = new Map();
  let verts = 0;
  for (const [id, d] of (src ?? chunks)) {
    for (let i = 0; i + 5 < d.length; i += 6) {
      verts++;
      const k = KEY(d[i], d[i + 2]);
      let e = at.get(k);
      if (!e) { e = { y: [], n: [], ids: new Set() }; at.set(k, e); }
      e.y.push(d[i + 1]);
      e.n.push([d[i + 3], d[i + 4], d[i + 5]]);
      e.ids.add(id);
    }
  }

  const spread = (v) => Math.max(...v) - Math.min(...v);
  // Worst angle between any two normals reported at one place, in degrees.
  const normalSpread = (ns) => {
    let worst = 0;
    for (let a = 0; a < ns.length; a++)
      for (let b = a + 1; b < ns.length; b++) {
        const [x1, y1, z1] = ns[a], [x2, y2, z2] = ns[b];
        const d = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2));
        worst = Math.max(worst, Math.acos(d) * 180 / Math.PI);
      }
    return worst;
  };

  let shared = 0, cracked = 0, worstCrack = 0, creased = 0, worstCrease = 0;
  let crossChunk = 0, crossChunkCracked = 0;
  const examples = [];
  for (const [k, e] of at) {
    if (e.y.length < 2) continue;          // a corner only one cell reported
    shared++;
    const dy = spread(e.y);
    const dn = normalSpread(e.n);
    const multi = e.ids.size > 1;
    if (multi) crossChunk++;
    if (dy > 1e-6) {
      cracked++;
      if (multi) crossChunkCracked++;
      worstCrack = Math.max(worstCrack, dy);
      if (examples.length < 6) examples.push({ at: k, dy: +dy.toFixed(4), meshes: e.ids.size, n: e.y.length });
    }
    if (dn > 1e-3) { creased++; worstCrease = Math.max(worstCrease, dn); }
  }

  // THE FACET. Vertex normals agreeing at a corner does not make the SURFACE
  // smooth — the two triangles meeting at a hex edge still have their own planes,
  // and the angle between those planes is what a silhouette and a specular show
  // however carefully the normals are interpolated. `emit_tri` gives every
  // triangle its own three vertices, so the run is triples in order.
  if (light) {
    return { meshes: chunks.size, verts, sharedCorners: shared,
             crack: { corners: cracked, worstY: +worstCrack.toFixed(5) },
             chunkBoundary: { corners: crossChunk, cracked: crossChunkCracked },
             examples };
  }

  const faceKey = (d, i, j) => {
    const a = KEY(d[i], d[i + 2]), b = KEY(d[j], d[j + 2]);
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };
  const edges = new Map();
  for (const [id, d] of (src ?? chunks)) {
    for (let t = 0; t + 17 < d.length; t += 18) {
      const p = [0, 6, 12].map(o => [d[t + o], d[t + o + 1], d[t + o + 2]]);
      const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
      const v = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const L = Math.hypot(...n) || 1;
      n = n.map(c => c / L);
      for (const [a, b] of [[0, 6], [6, 12], [12, 0]]) {
        const k = faceKey(d, t + a, t + b);
        let e = edges.get(k);
        if (!e) { e = []; edges.set(k, e); }
        e.push(n);
      }
    }
  }
  let facetN = 0, facetWorst = 0, facetSum = 0, facetOver5 = 0;
  for (const [, ns] of edges) {
    if (ns.length !== 2) continue;
    const d = Math.max(-1, Math.min(1, ns[0][0] * ns[1][0] + ns[0][1] * ns[1][1] + ns[0][2] * ns[1][2]));
    const deg = Math.acos(d) * 180 / Math.PI;
    facetN++; facetSum += deg;
    facetWorst = Math.max(facetWorst, deg);
    if (deg > 5) facetOver5++;
  }

  // THE APEX BIAS. `emit_hex_sloped` writes each cell as six triangles whose FIRST
  // vertex is the fan centre, taken from the cell's RAW height, while the two rim
  // vertices are three-cell AVERAGES. Mixing an unsmoothed centre with a smoothed
  // rim biases every cell by its local curvature — and the bias is largest exactly
  // where curvature is: at a summit the centre sits above all six of its corners,
  // so the top cell is drawn as a little pyramid. A ridge of those reads as a
  // serrated crest, which is the "tents against the sky" silhouette.
  const cells = new Map();      // centre (x,z) → { cy, rim: [] }
  for (const [, d] of (src ?? chunks)) {
    for (let t = 0; t + 17 < d.length; t += 18) {
      const k = KEY(d[t], d[t + 2]);
      let c = cells.get(k);
      if (!c) { c = { cy: d[t + 1], rim: [] }; cells.set(k, c); }
      c.rim.push(d[t + 7], d[t + 13]);
    }
  }
  let peaks = 0, peakBias = 0, biasSum = 0, biasN = 0, worstBias = 0;
  for (const [, c] of cells) {
    if (c.rim.length < 6) continue;
    const mean = c.rim.reduce((s, y) => s + y, 0) / c.rim.length;
    const bias = c.cy - mean;
    biasSum += Math.abs(bias); biasN++;
    worstBias = Math.max(worstBias, Math.abs(bias));
    if (c.rim.every(y => y < c.cy - 1e-6)) {      // a local summit cell
      peaks++; peakBias = Math.max(peakBias, bias);
    }
  }

  return {
    apex: { cells: biasN, meanAbsBias: +(biasSum / (biasN || 1)).toFixed(4),
            worstBias: +worstBias.toFixed(4),
            summitCells: peaks, worstSummitSpike: +peakBias.toFixed(4) },
    meshes: chunks.size, verts, sharedCorners: shared,
    crack: { corners: cracked, worstY: +worstCrack.toFixed(5) },
    crease: { corners: creased, worstDeg: +worstCrease.toFixed(3) },
    chunkBoundary: { corners: crossChunk, cracked: crossChunkCracked },
    facet: { edges: facetN, worstDeg: +facetWorst.toFixed(2),
             meanDeg: +(facetSum / (facetN || 1)).toFixed(2), over5deg: facetOver5 },
    examples,
  };
}

const done = (o) => { console.log(JSON.stringify(o, null, 2)); ws.close(); process.exit(0); };

if (!watchSec) {
  setTimeout(() => done(analyse(false)), 4000);
} else {
  // SAMPLE WHILE THE WORLD IS BEING EDITED. Each sample is one still of the mesh
  // set as it stands; a crack that appears in any of them is a crack that was on
  // screen, even though the settled world before and after shows none.
  const t0 = Date.now();
  const samples = [];
  let peak = null;
  let baseUpdates = 0;
  // The initial world arrives as a burst of `M:` before any editing — discount it,
  // or the world's own delivery would count as movement.
  setTimeout(() => { baseUpdates = meshUpdates; }, 2500);
  console.error(drive
    ? `watching for ${watchSec}s — driving the raise itself`
    : `watching for ${watchSec}s — edit the world now (raise a hill)`);
  if (drive) {
    // Place rather than walk: this measures the rebuild, not locomotion, and a
    // fixed-millisecond walk is what made an earlier gate fail against working
    // code. Raise, then lower — the user sees it during both.
    setTimeout(() => ws.send('7:0,0,0'), 1200);
    for (let k = 0; k < 8; k++) setTimeout(() => ws.send('5:1'), 2000 + k * 700);
    for (let k = 0; k < 8; k++) setTimeout(() => ws.send('5:-1'), 8000 + k * 700);
  }
  const tick = setInterval(() => {
    const a = analyse(true, chunks);
    const sA = analyse(true, staged);
    samples.push({ t: +((Date.now() - t0) / 1000).toFixed(2),
                   cracked: a.crack.corners, worstY: a.crack.worstY,
                   atChunkEdge: a.chunkBoundary.cracked,
                   stagedCracked: sA.crack.corners, stagedWorstY: sA.crack.worstY,
                   meshes: a.meshes, missing: gone.size });
    if (!peak || a.crack.corners > peak.crack.corners) peak = a;
    if (Date.now() - t0 > watchSec * 1000) {
      clearInterval(tick);
      const withCracks = samples.filter(s => s.cracked > 0);
      const rebuilds = meshUpdates - baseUpdates;
      done({
        // ⚠ READ THIS FIRST. Zero cracks over a world that never moved is not a
        // clean result, it is an empty one.
        verdict: rebuilds < 5
          ? `INCONCLUSIVE — only ${rebuilds} mesh rebuilds arrived in ${watchSec}s, so the world was not being edited. Nothing was measured. Run again and raise a hill DURING the window.`
          : (holes.length > 0
             ? `HOLES SEEN — ${holes.length} chunks were deleted and not replaced for up to ${Math.max(...holes.map(h => h.ms))}ms, which is ground the client cannot draw`
             : withCracks.length > 0
             ? `CRACKS SEEN in ${withCracks.length}/${samples.length} samples while the world rebuilt`
             : `CLEAN over ${rebuilds} rebuilds — no missing chunk and no crack while it was being edited`),
        // THE HOLE, which is the reported symptom: ground that is not drawn at
        // all because its chunk was deleted and not yet replaced.
        holes: {
          count: holes.length,
          worstMs: holes.length ? Math.max(...holes.map(h => h.ms)) : 0,
          meanMs: holes.length
            ? +(holes.reduce((s, h) => s + h.ms, 0) / holes.length).toFixed(1) : 0,
          overOneFrameMs: holes.filter(h => h.ms > 33).length,
          maxMissingAtOnce: Math.max(0, ...samples.map(s => s.missing)),
          meshCountRange: [Math.min(...samples.map(s => s.meshes)),
                           Math.max(...samples.map(s => s.meshes))],
        },
        // THE PAIR THAT PROVES IT. `unstaged` is what a client applying every
        // mesh on arrival sees; `staged` is what one honouring Z:1/Z:0 sees.
        unstagedCrackedSamples: withCracks.length,
        stagedCrackedSamples: samples.filter(s => s.stagedCracked > 0).length,
        worstUnstagedY: Math.max(0, ...samples.map(s => s.worstY)),
        worstStagedY: Math.max(0, ...samples.map(s => s.stagedWorstY)),
        rebuildsDuringWatch: rebuilds,
        watched: watchSec, samples: samples.length,
        samplesWithCracks: withCracks.length,
        worstSample: withCracks.sort((x, y) => y.cracked - x.cracked)[0] ?? null,
        allCracksAtChunkEdges: withCracks.length > 0 &&
          withCracks.every(s => s.cracked === s.atChunkEdge),
        peakExamples: peak?.examples ?? [],
        timeline: withCracks.slice(0, 40),
        settledNow: analyse(false),
      });
    }
  }, 150);
}
