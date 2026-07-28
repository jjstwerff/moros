// PLAN VIEW — draw what the world actually holds, and look at it.
//
// A screenshot of the editor cannot answer "is this road straight": the camera is
// behind the character at a shallow pitch, so perspective bends everything and a
// wobble reads as distance. This renders the CELLS AND EDGES the server reports —
// plan view, one hex to scale, no camera — into a PNG.
//
// It is an instrument, not a gate: it exits 0 whatever it finds, and prints the
// numbers a gate would assert (see `road.mjs`). Run it to LOOK.
//
//   node tools/gates/world/plan.mjs [out.png]
//
// The PNG is written by hand — IHDR, one zlib-deflated IDAT of filter-0 scanlines,
// IEND — because node ships zlib and a dependency for 40 lines is a dependency to
// keep current.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const OUT = process.argv[2] || 'plan.png';
const SQ3 = Math.sqrt(3);
const cellXZ = (q, r) => [SQ3 * q + (SQ3 / 2) * (r & 1), 1.5 * r];

// ── the smallest correct PNG writer ─────────────────────────────────────────
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const writePNG = (path, w, h, rgb) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGB
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;                                            // filter: none
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
};

// ── the canvas, in world units ──────────────────────────────────────────────
const PX = 14;                       // pixels per world unit
class Canvas {
  constructor(x0, z0, x1, z1) {
    this.x0 = x0; this.z0 = z0;
    this.w = Math.ceil((x1 - x0) * PX); this.h = Math.ceil((z1 - z0) * PX);
    this.buf = Buffer.alloc(this.w * this.h * 3, 0x14);
  }
  px(x, z) { return [Math.round((x - this.x0) * PX), Math.round((z - this.z0) * PX)]; }
  dot(x, z, [r, g, b], rad = 1) {
    const [cx, cy] = this.px(x, z);
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const X = cx + dx, Y = cy + dy;
      if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) continue;
      const i = (Y * this.w + X) * 3;
      this.buf[i] = r; this.buf[i + 1] = g; this.buf[i + 2] = b;
    }
  }
  line(x0, z0, x1, z1, col, rad = 0) {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) * PX));
    for (let i = 0; i <= n; i++) this.dot(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, col, rad);
  }
}
const GROUND = [0x14, 0x14, 0x14], ROAD = [0x9a, 0x86, 0x5e];
const FENCE = [0x4c, 0xd0, 0x6a], WALL = [0xe8, 0xe8, 0xe8], DOOR = [0xff, 0x8c, 0x2a];
const matColour = (m) => (m === 1 ? WALL : m === 2 ? DOOR : FENCE);

// ── talk to the editor ──────────────────────────────────────────────────────
const meshes = new Map();
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find((x) => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAt = async (q, r) => {
  const [x, z] = cellXZ(q, r);
  ws.send(`7:${x.toFixed(4)},${z.toFixed(4)},0`);
  return ack('placed');
};
// Read a window's cells (materials via the column read-back) and edges in one trip.
const readWindow = async (q0, r0, q1, r1) => {
  const want = [];
  for (let r = r0; r <= r1; r++) for (let q = q0; q <= q1; q++) want.push([q, r]);
  const from = status.length;
  for (const [q, r] of want) { ws.send(`16:${q},${r}`); ws.send(`26:${q},${r}`); }
  let walls = new Map(), mats = new Map();
  for (let t = 0; t < 90000; t += 150) {
    await wait(150);
    walls = new Map(); mats = new Map();
    for (const s of status.slice(from)) {
      let m = s.match(/^walls (-?\d+),(-?\d+) = (.*)$/);
      if (m) walls.set(`${m[1]},${m[2]}`, m[3].trim());
      m = s.match(/^cell (-?\d+),(-?\d+) = (\d+),(\d+)$/);
      if (m) mats.set(`${m[1]},${m[2]}`, Number(m[3]));
    }
    if (walls.size >= want.length && mats.size >= want.length) break;
  }
  return { walls, mats, want };
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'M') {
    const hh = b.indexOf(';');
    const id = Number(b.slice(0, hh));
    let rest = b.slice(hh + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const body = rest.slice(rest.indexOf(';') + 1);
    meshes.set(id, body === '' ? [] : body.split(',').map(Number));
  }
  if (t === 'X') meshes.delete(Number(b));
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // ── the scene the brief asks for: walk a road, then fence along it
    await placeAt(0, 0);
    ws.send('25:3'); console.log(await ack('road'));
    await placeAt(14, 4);                      // an off-axis end, so the snap has work
    ws.send('25:3'); const laid = await ack('road');
    console.log(laid);

    await wait(2500);                          // let the mesh rebuild land
    const { walls, mats, want } = await readWindow(-4, -4, 20, 10);
    const pts = want.map(([q, r]) => cellXZ(q, r));
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const cv = new Canvas(Math.min(...xs) - 2, Math.min(...zs) - 2,
                          Math.max(...xs) + 2, Math.max(...zs) + 2);

    // road cells first, then the edges over them
    let road = 0, edges = 0;
    for (const [q, r] of want) {
      const m = mats.get(`${q},${r}`) ?? 0;
      if (m === 2) { road += 1; const [x, z] = cellXZ(q, r); cv.dot(x, z, ROAD, 5); }
    }
    // Each stored byte is an EDGE between two cells: draw the segment between the
    // two shared corners, which is where the wall actually stands.
    const SLOT_DIR = [4, 5, 0];               // NW, NE, E — `edge_owner`'s slots
    const nb = (q, r, d) => {
      const odd = (r & 1) === 1;
      const even = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];
      const oddT = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
      const [dq, dr] = (odd ? oddT : even)[d];
      return [q + dq, r + dr];
    };
    for (const [q, r] of want) {
      const body = walls.get(`${q},${r}`) ?? '';
      if (body === '') continue;
      const v = body.split(';')[0].split(',').map(Number);
      for (let sI = 0; sI < 3; sI++) {
        if (!v[sI]) continue;
        edges += 1;
        const [nq, nr] = nb(q, r, SLOT_DIR[sI]);
        const [ax, az] = cellXZ(q, r), [bx, bz] = cellXZ(nq, nr);
        // the shared edge is perpendicular to the centre-to-centre line, at its
        // midpoint, and one hex side (1.0 wu) long
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
        const px = -dz / L * 0.5, pz = dx / L * 0.5;
        cv.line(mx - px, mz - pz, mx + px, mz + pz, matColour(v[sI]), 1);
      }
    }
    // ── and the WALL MESH over it: what is actually drawn, from the runs.
    // The staircase below is the index; this is the wall. Seeing both at once is
    // the point — they must agree in position and disagree in shape.
    let wallVerts = 0;
    const SURF = 6;
    for (const [id, d] of meshes) {
      if (id <= 15 || (id - 16) % SURF !== 5) continue;
      for (let k = 0; k + 11 < d.length; k += 12) {         // two verts of a tri
        cv.line(d[k], d[k + 2], d[k + 6], d[k + 8], [0xff, 0xff, 0xff], 0);
        wallVerts += 2;
      }
    }
    console.log('wall mesh vertices drawn:', wallVerts);
    writePNG(OUT, cv.w, cv.h, cv.buf);
    const sha = createHash('sha256').update(Buffer.from(cv.buf)).digest('hex').slice(0, 12);
    console.log(JSON.stringify({ out: OUT, size: [cv.w, cv.h], roadCells: road,
                                 fenceEdges: edges, pixels: sha }));
    ws.close(); process.exit(0); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => { console.log('no editor on 18090'); process.exit(2); };
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
