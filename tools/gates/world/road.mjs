// ⚠ CHECKED AND LEFT WHOLE — it reads the VERTICES. The road's per-step write is
// `hex_editor::road_lay` now and `tests/modes.loft` covers the band and the grade;
// what this measures is that a road walked as a path reaches the mesh as ONE
// connected strip that follows the walk, which is a property of the drawing.
// Road gate (rung W1, moros#9).
//
// ⚠ Its control is the point: run the same script with the `10:1`/`10:0` toggles
// removed and it must FAIL (0 road cells). An earlier version passed the control,
// because it counted the CHARACTER's limbs as road — mesh ids 0-15 are the figure,
// and the left leg (1) and arm (3) are odd, which is the road parity. Filtering
// that block is not tidiness; without it this gate was green with no road laid.
//
// The claim is not "some cells changed colour". It is that a road GRADES the
// ground it crosses: walk a road over a hill and the strip must come out flatter
// than the hill was, at the grade the road was switched on at.
//
// A WORLD gate — it places the character rather than walking it, so it cannot
// break when locomotion changes. Road laying happens on the walk tick, so the
// placements are what drive it.
// ⚠ THE SURFACE STRIDE IS NAMED, not spelled 5 or 6 in a comparison. A chunk
// draws one mesh per surface on consecutive ids, so every decoder here depends on
// how many there are — and when the roof made it five, three decoders moved and
// the gates did not. Keep this equal to `SURFACES` in `src/editor_server.loft`.
const SURFACES = 7;   // ground, road, field, vegetation, roof, wall, floor
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const chunks = new Map();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;

// ⚠ WAIT FOR THE SERVER, NOT THE CLOCK. This gate had SIX fixed sleeps and did not
// collect status at all, so it could not have waited for anything. Every one of them
// was a statement about how fast this box is; `field.mjs` is the record of what that
// costs when a guess stops winning — it read 0 vertices on every run.
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
// The world changes when a command is acknowledged; the MESHES follow several ticks
// later. `S:rebuilt N chunks` closes the server's own `Z:1` … `Z:0` transaction and
// is the signal that the PICTURE caught up.
const rebuilt = () => ack('rebuilt');

// Chunk meshes live above the reserved low block (ids 0-15 are the FIGURE), and
// within it the parity says which surface: ground even, road odd. ⚠ Not filtering
// that block is what made this gate green with no road laid — the character's left
// leg (id 1) and arm (id 3) are odd, so they counted as road.
// Road cells, as a set of 1-wu grid keys taken from the road mesh's vertices.
const roadCells = () => {
  const set = new Set();
  for (const [id, d] of chunks) {
    if (id <= 15) continue;
    if (((id - 16) % SURFACES) !== 1) continue;              // 0 ground, 1 road, 2 field, 3 veg, 4 roof, 5 wall
    for (let i = 0; i + 2 < d.length; i += 6)
      set.add(`${Math.round(d[i])},${Math.round(d[i + 2])}`);
  }
  return set;
};

// How many CONNECTED components those cells form, over an 8-neighbourhood.
const components = (set) => {
  const left = new Set(set);
  let n = 0;
  while (left.size) {
    n++;
    const start = left.values().next().value;
    const q = [start];
    left.delete(start);
    while (q.length) {
      const [x, z] = q.pop().split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const k = `${x + dx},${z + dz}`;
        if (left.has(k)) { left.delete(k); q.push(k); }
      }
    }
  }
  return n;
};

const stats = (road) => {
  let lo = 1e9, hi = -1e9, n = 0;
  for (const [id, d] of chunks) {
    if (id <= 15) continue;
    if (id <= 15) continue;
    if ((((id - 16) % SURFACES) === 1) !== road) continue;   // 0 ground, 1 road, 2 field, 3 veg, 4 roof, 5 wall
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
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // build a hill ahead, then measure how rough the ground is
    // a raise has no acknowledgement of its own, so `rebuilt` is the one that says
    // the ground it changed has reached the client
    for (let k = 0; k < 6; k++) { ws.send('5:1'); await rebuilt(); }
    const ground0 = stats(false);

    // lay a road across it: switch on at flat ground, then walk into the hill
    place(0, 0, 0); await ack('placed');
    ws.send('10:1'); await ack('road true');
    for (let x = 2; x <= 26; x += 2) { place(x, 0, 0); await ack('placed'); }
    // ⚠ THE REBUILD WAIT GOES HERE, BEFORE the toggle off — and the order is the
    // whole guarantee. The last placement marks its chunks dirty and acks in the
    // SAME handler, so at the moment `placed` reaches us the flush is necessarily
    // still pending and the next `rebuilt` is necessarily the one carrying it.
    // Put this after `10:0` instead and the flush may already have run, leaving
    // nothing to wait for.
    await rebuilt();
    ws.send('10:0');
    const off = await ack('road false');

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
    // ⚠ CONNECTED AND EXTENDED, not merely present. Measured on correct code:
    //     components 1 · span 33 wu · 1602 road verts
    // The walk runs x = 2 … 26, so a span of 34 is that path plus the strip width.
    // A road laid at one stale hex would be a blob: one component, span ≈ 7.
    //
    // ⚠ NOT MUTATION-VERIFIED. Re-introducing the stale-hex bug makes the editor
    // fail to START, so the mutated build cannot be driven. The evidence that this
    // discriminates is indirect but real: with that bug present, the FIELD gate
    // could not close a ring, which is what exposed it in the first place. A road laid at one stale hex
    // is still road cells, still flatter than the hill, and still passed the
    // earlier version of this gate — it was a blob, and only a rung that needed a
    // closed ring (fields, #11) noticed. So the strip must be ONE component and
    // must span the walk that drew it.
    const cells = roadCells();
    const comps = components(cells);
    let xlo = 1e9, xhi = -1e9;
    for (const k of cells) { const x = Number(k.split(',')[0]); xlo = Math.min(xlo, x); xhi = Math.max(xhi, x); }
    const span = xhi - xlo;

    const groundRange = ground0.hi - ground0.lo;
    const roadRange   = road.hi - road.lo;
    const laid    = road.n > 0;
    const graded  = laid && roadRange < groundRange * 0.6;
    const crossed = groundRange > 2.0;                 // there WAS relief to cut
    const connected = comps === 1;
    const follows   = span > 18;          // the walk ran x = 2 … 26
    const ok = laid && graded && crossed && connected && follows;
    console.log(JSON.stringify({ off, groundRange: +groundRange.toFixed(3),
                                 roadRange: +roadRange.toFixed(3),
                                 verts: road.n, components: comps, span,
                                 laid, graded, crossed, connected, follows, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
