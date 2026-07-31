// Probe: stand on a deck, run every authoring gesture, and read back WHICH LAYER
// took it. The class is "a gesture that means *here, where I am standing* but
// writes the outdoors"; this makes the whole class visible in one run instead of
// arguing site by site from the design table.
//
// Not a gate — it prints a table and exits 0.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = []; let st = 0, tCount = 0; const trace = [];
const ack = async (p, l = 30000) => { const f = status.length;
  for (let t = 0; t < l; t += 60) { await wait(60);
    const m = status.slice(f).find((x) => x.startsWith(p)); if (m) return m; }
  return `(no "${p}" in ${l}ms)`; };
const place = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const col = async (q, r) => { ws.send(`15:${q},${r}`); return ack(`column ${q},${r} =`); };
const walls = async (q, r) => { ws.send(`16:${q},${r}`); return ack(`walls ${q},${r} =`); };
const dress = async (q, r) => { ws.send(`20:${q},${r}`); return ack(`dressing ${q},${r} =`); };
const nextT = async (l = 15000) => { const b = tCount;
  for (let t = 0; t < l; t += 5) { if (tCount !== b) return true; await wait(5); } return false; };
const vegY = new Set();
const HEX = 1.7320508075688772;
const GRADE = 4, DECK = 16, UNIT = 0.25;

ws.onmessage = async (e) => { const s=e.data,i=s.indexOf(':'),t=s.slice(0,i),b=s.slice(i+1);
  if (t==='S') status.push(b);
  if (t==='T' && b.startsWith('0;')) { trace.push(b.slice(2).split(',').map(Number)); tCount++; }
  if (t==='M') { const h = b.indexOf(';'); const id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const d = rest.slice(rest.indexOf(';') + 1);
    // surface 3 of 7 is vegetation
    if (id > 15 && (id - 16) % 7 === 3) {
      vegY.clear();
      const v = d === '' ? [] : d.split(',').map(Number);
      for (let k = 1; k < v.length; k += 6) vegY.add(+v[k].toFixed(2));
    } }
  if (t==='E') ws.send('2:1.5,');
  if (t==='C' && !st) { st=1;
    const rows = [];
    // ── the scene: a stair to a platform whose deck is one stride above it
    for (const k of [0, 1, 2]) { await place(k * HEX, 0, 0); ws.send('30:1'); await ack('stair'); }
    await place(1 * HEX, 0, 0);
    ws.send('10:1'); await ack('road true');
    await place(6 * HEX, 0, 0);
    ws.send('10:0'); await ack('road false');
    await ack('rebuilt');
    ws.send('12:1'); await ack('storey');
    await ack('rebuilt');

    // ── stand ON the deck (up the stair first, so `py` carries the level)
    await place(3 * HEX, 0, 0);
    await place(6 * HEX, 0, 0);
    let y = null;
    for (let k = 0; k < 300 && y === null; k++) {
      if (!(await nextT())) break;
      const p = trace[trace.length - 1];
      if (Math.abs(p[12] - 6 * HEX) < 0.01) y = p[13];
    }
    rows.push(['stood on', `y ${y}  (deck is ${DECK * UNIT}, ground ${GRADE * UNIT})`]);

    const before5 = await col(5, 0);
    // ── FENCE — "ring the disc you stand in"
    ws.send('23:3,2'); rows.push(['23: fence', await ack('fenc')]);
    await ack('rebuilt');
    // ⚠ a fence rings the PERIMETER, so an interior cell legitimately reads zero —
    // the first version of this probe read (5,0) and learned nothing.
    rows.push(['  walls 4,0 (rim)', await walls(4, 0)]);
    rows.push(['  walls 8,0 (rim)', await walls(8, 0)]);
    // ── EDGE — one edge of the cell you stand in
    ws.send('24:0,1'); rows.push(['24: edge', await ack('edge')]);
    rows.push(['  walls 6,0', await walls(6, 0)]);
    // ── PROP — dressing at the feet
    ws.send('19:1'); rows.push(['19: prop', await ack('prop')]);
    rows.push(['  dressing 6,0', await dress(6, 0)]);
    // ── TRIGGER — an anchor on the ground here
    ws.send('18:deck_test'); rows.push(['18: trigger', await ack('trigger')]);
    // ── SCATTER — vegetation on the disc you stand in
    ws.send('13:1,80'); rows.push(['13: scatter', await ack('scatter')]);
    await ack('rebuilt');
    // Which LAYER holds the trees? The heights say so: the vegetation mesh puts a
    // tree at its own cell's height, so y tells ground (1.0) from deck (4.0).
    rows.push(['  tree heights', [...vegY].sort((a, b) => a - b).join(' ') || '(none)']);
    // ── LEVEL — flatten as you walk, from the frozen foot height
    ws.send('6:1'); rows.push(['6: level on', await ack('level')]);
    // Levelling stamps as you MOVE, so it needs a placement to do anything.
    await place(5 * HEX, 0, 0);
    await ack('rebuilt');
    rows.push(['  column 5,0 levelled', await col(5, 0)]);
    ws.send('6:0'); await ack('level');
    await place(6 * HEX, 0, 0);
    // ── RAISE — the ground ahead
    ws.send('5:1'); await ack('rebuilt');
    rows.push(['5: raise', 'sent']);

    const after5 = await col(5, 0);
    const after6 = await col(6, 0);
    rows.push(['column 5,0 before', before5]);
    rows.push(['column 5,0 after ', after5]);
    rows.push(['column 6,0 after ', after6]);
    rows.push(['labels 5,0', (ws.send('29:5,0'), await ack('labels 5,0 ='))]);
    for (const [k, v] of rows) console.log(k.padEnd(20), v);
    ws.close(); process.exit(0); } };
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 180000);
