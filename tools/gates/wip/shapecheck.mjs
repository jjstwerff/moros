// Press the keys a person presses, then MEASURE the geometry that appears.
//
// Not "did the ack say ok" — the acks have been green for shapes nobody would
// recognise. This reads the drawn triangles off the wire and reports, per
// surface, how many vertices there are and what they span, so a "wall" that is
// two panels somewhere else is visible as two panels somewhere else.
//
//   node shapecheck.mjs <scene>     scene: wall | fence | tower
const scene = process.argv[2] ?? 'wall';
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
const SURFACES = 7;
const NAME = ['ground', 'road', 'field', 'veg', 'roof', 'wall', 'floor'];

const surf = (k) => {
  const out = [];
  for (const [id, d] of meshes) {
    if (id <= 15 || (id - 16) % SURFACES !== k) continue;
    for (let i = 0; i + 5 < d.length; i += 6) out.push([d[i], d[i + 1], d[i + 2]]);
  }
  return out;
};
const span = (v) => v.length === 0 ? null : {
  n: v.length,
  x: [+Math.min(...v.map(p => p[0])).toFixed(2), +Math.max(...v.map(p => p[0])).toFixed(2)],
  y: [+Math.min(...v.map(p => p[1])).toFixed(2), +Math.max(...v.map(p => p[1])).toFixed(2)],
  z: [+Math.min(...v.map(p => p[2])).toFixed(2), +Math.max(...v.map(p => p[2])).toFixed(2)],
};

ws.onmessage = async (e) => { const s=e.data,i=s.indexOf(':'),t=s.slice(0,i),b=s.slice(i+1);
  if (t==='S') status.push(b);
  if (t==='T' && b.startsWith('0;')) { trace.push(b.slice(2).split(',').map(Number)); tCount++; }
  if (t==='M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const d = rest.slice(rest.indexOf(';') + 1);
    meshes.set(id, d === '' ? [] : d.split(',').map(Number)); }
  if (t==='X') meshes.delete(Number(b));
  if (t==='E') ws.send('2:1.5,');
  if (t==='C' && !st) { st=1;
    const said = [];

    if (scene === 'wall') {
      // R at one end, walk east, R at the other — exactly what the key does.
      await place(0, 0, 0);
      ws.send('25:1'); said.push(['R (start)', await ack('road')]);
      await place(6 * HEX, 0, 0);
      ws.send('25:1'); said.push(['R (close)', await ack('road laid')]);
      await ack('rebuilt');
    } else if (scene === 'fence') {
      await place(0, 0, 0);
      ws.send('23:3,2'); said.push(['F', await ack('fenc')]);
      await ack('rebuilt');
    } else {
      // L level, B storey, C cellar — the tower recipe, pressed cold.
      await place(0, 0, 0);
      ws.send('6:1'); said.push(['L on', await ack('level')]);
      for (const [x, z] of [[1.7,0],[3.4,0],[1.7,1.5],[0,1.5],[-1.7,0],[0,-1.5]]) {
        await place(x, z, 0);
      }
      ws.send('6:0'); said.push(['L off', await ack('level')]);
      await ack('rebuilt');
      await place(0, 0, 0);
      ws.send('12:1'); said.push(['B storey', await ack('storey')]);
      await ack('rebuilt');
      ws.send('12:-1'); said.push(['C cellar', await ack('storey')]);
      await ack('rebuilt');
      ws.send('15:0,0'); said.push(['column 0,0', await ack('column 0,0 =')]);
    }

    const out = {};
    for (let k = 0; k < SURFACES; k++) { const v = span(surf(k)); if (v) out[NAME[k]] = v; }
    console.log(JSON.stringify({ scene, said, surfaces: out }, null, 1));
    ws.close(); process.exit(0); } };
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 120000);
