#!/usr/bin/env node
// PLAN AND ELEVATION, FROM THE GEOMETRY, WITH NO GPU AND NO BROWSER.
//
// WHY THIS AND NOT A SCREENSHOT. A screenshot answers *does it read as a house* —
// the question no measurement can answer — but it cannot answer *is the shape
// right*: the camera sits behind the character at a shallow pitch, so perspective
// bends everything and a wall five metres deep looks like a wall. These are
// orthographic views of the triangles the server actually sent, so a zigzag is
// visibly a zigzag and a road-shaped wall is visibly a road.
//
// It is PASSIVE — it sends nothing but the handshake, so it can be pointed at a
// session someone is driving. (`plan.mjs`, by contrast, places the character and
// lays a road.)
//
//   node tools/views.mjs [out.png] [--port 18090] [--only wall,floor]
//
// Exits 0 whatever it finds: an instrument, not a gate.
import process from 'node:process';
import { Canvas, compose, label } from './raster.mjs';

const args = process.argv.slice(2);
const OUT = args.find((a) => !a.startsWith('--')) ?? 'views.png';
let PORT = 18090, only = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') PORT = +args[i + 1];
  if (args[i] === '--only') only = args[i + 1].split(',');
}

// ⚠ Keep in step with `SURFACES` in `src/editor_server.loft`.
const SURFACES = 11;
const NAME = ['ground', 'road', 'field', 'veg', 'roof', 'wall', 'floor', 'frame', 'soffit', 'rock', 'water'];
const COLOUR = {
  ground: [0x3a, 0x4a, 0x28], road: [0x9a, 0x86, 0x5e], field: [0x6a, 0x8a, 0x3a],
  veg: [0x2e, 0x7a, 0x35], roof: [0xb0, 0x50, 0x42], wall: [0xe8, 0xe8, 0xe8],
  floor: [0xc8, 0xbc, 0x9a], frame: [0xff, 0xd0, 0x60], soffit: [0x70, 0x60, 0x78],
  rock: [0x57, 0x52, 0x4a], water: [0x3d, 0x6b, 0xa8],
};

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const meshes = new Map();
let done = false;

ws.addEventListener('message', (ev) => {
  const s = ev.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const d = rest.slice(rest.indexOf(';') + 1);
    meshes.set(id, d === '' ? [] : d.split(',').map(Number));
  }
  if (t === 'X') meshes.delete(Number(b));
  if (t === 'E') done = true;
});
ws.addEventListener('open', () => ws.send('1:'));

// Wait for the opening burst to finish, then a beat for the streamer.
for (let n = 0; n < 400 && !done; n++) await wait(50);
await wait(1500);

// ── the triangles, grouped by surface ───────────────────────────────────────
// A mesh id encodes its chunk and its surface: `chunk * SURFACES + 15 + k`, so
// `(id - 16) % SURFACES` is the surface and the rest is the chunk. The figure and
// anything fixed live below 16 and are not world geometry.
const tris = {};
for (const n of NAME) tris[n] = [];
for (const [id, d] of meshes) {
  if (id <= 15) continue;
  const kind = NAME[(id - 16) % SURFACES];
  if (!kind || (only && !only.includes(kind))) continue;
  for (let k = 0; k + 17 < d.length; k += 18) {
    tris[kind].push([
      [d[k], d[k + 1], d[k + 2]],
      [d[k + 6], d[k + 7], d[k + 8]],
      [d[k + 12], d[k + 13], d[k + 14]],
    ]);
  }
}

const all = Object.values(tris).flat();
if (all.length === 0) { console.log('no geometry — is the editor running and a world loaded?'); process.exit(0); }
const xs = all.flatMap((t) => t.map((v) => v[0]));
const ys = all.flatMap((t) => t.map((v) => v[1]));
const zs = all.flatMap((t) => t.map((v) => v[2]));
const bx = [Math.min(...xs), Math.max(...xs)];
const by = [Math.min(...ys), Math.max(...ys)];
const bz = [Math.min(...zs), Math.max(...zs)];

// ⚠ THE GROUND IS EXCLUDED FROM THE FRAME BY DEFAULT. It spans the whole streamed
// world — a hundred metres — so including it shrinks anything built to a few
// pixels. The bounds come from what was BUILT; the ground is still drawn, just not
// allowed to decide the scale.
const built = Object.entries(tris).filter(([k]) => k !== 'ground').flatMap(([, v]) => v);
const frame = built.length > 0 ? built : all;
const fx = frame.flatMap((t) => t.map((v) => v[0]));
const fy = frame.flatMap((t) => t.map((v) => v[1]));
const fz = frame.flatMap((t) => t.map((v) => v[2]));
const pad = 2;
const X = [Math.min(...fx) - pad, Math.max(...fx) + pad];
const Z = [Math.min(...fz) - pad, Math.max(...fz) + pad];
const Y = [Math.min(0, Math.min(...fy)) - 0.5, Math.max(...fy) + 1.5];

const PXS = 22;
const drawInto = (cv, pick) => {
  for (const [kind, list] of Object.entries(tris)) {
    const col = COLOUR[kind] ?? [0x80, 0x80, 0x80];
    for (const t of list) {
      const a = pick(t[0]), b = pick(t[1]), c = pick(t[2]);
      cv.line(a[0], a[1], b[0], b[1], col);
      cv.line(b[0], b[1], c[0], c[1], col);
      cv.line(c[0], c[1], a[0], a[1], col);
    }
  }
};

const plan = new Canvas(X[0], Z[0], X[1], Z[1], { px: PXS });
drawInto(plan, (v) => [v[0], v[2]]);
label(plan, 'PLAN X-Z', 6, 6);

const east = new Canvas(X[0], Y[0], X[1], Y[1], { px: PXS, flipV: true });
drawInto(east, (v) => [v[0], v[1]]);
label(east, 'ELEV X-Y', 6, 6);

const north = new Canvas(Z[0], Y[0], Z[1], Y[1], { px: PXS, flipV: true });
drawInto(north, (v) => [v[2], v[1]]);
label(north, 'ELEV Z-Y', 6, 6);

const { w, h } = compose(OUT, [plan, east, north]);
const counts = Object.entries(tris).filter(([, v]) => v.length)
  .map(([k, v]) => `${k} ${v.length}`).join('  ');
console.log(JSON.stringify({
  out: OUT, size: `${w}x${h}`, triangles: all.length, counts,
  bounds: { x: bx.map((n) => +n.toFixed(2)), y: by.map((n) => +n.toFixed(2)),
            z: bz.map((n) => +n.toFixed(2)) },
}));
ws.close();
process.exit(0);
