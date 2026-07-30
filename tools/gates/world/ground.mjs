// THE DRAWN GROUND IS THE GROUND, not whatever layer happens to be at index 0.
//
// The editor answered "which layer is the ground" with the constant `SURFACE = 0`
// in twelve places. That is correct until something is dug beneath it, and then
// layer 0 IS the cellar — so digging three cellars under a hill sank the drawn
// ground from 10.917 to 5.583 wu and `cell 0,10` went from `1,49` to `4,13`.
// The ground is now a reserved LABEL (`hex_world::LABEL_GROUND`), carried through
// every insert by the column write; see `doc/claude/WORLD_MODEL.md`.
//
// ⚠ THIS GATE ASSERTS BOTH HALVES, and the second is the one a screenshot misses.
// Fixing only the READ would draw a correct ground that editing no longer moves,
// because `terrain_set` wrote a ONE-ELEMENT column — index 0, positionally — so a
// raise would have raised the cellar floor. A gate that only checked the picture
// held still would have passed that. So it also raises again afterwards and
// requires the drawn ground to follow.
//
// ⚠ And it asserts the ground held at its EXACT height, not merely that it stayed
// above the cellars. "Did not sink" is the claim; a tolerance wide enough to
// admit some sinking would be measuring something else.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const chunks = new Map(); const status = []; let st = 0;
// Mesh parsing and the peak are persist.mjs's, unchanged — stride 6 is position
// plus normal, and every chunk mesh counts, so a cellar floor drawn LOWER cannot
// hide a ground that sank.
const hi = () => { let h = -1e9;
  for (const d of chunks.values()) for (let i = 1; i < d.length; i += 6) h = Math.max(h, d[i]);
  return +h.toFixed(3); };
const ack = async (p, l = 40000) => { const f = status.length;
  for (let t = 0; t < l; t += 60) { await wait(60);
    const m = status.slice(f).find(x => x.startsWith(p)); if (m) return m; }
  return `(no "${p}" in ${l}ms)`; };

ws.onmessage = async (e) => { const s=e.data,i=s.indexOf(':'),t=s.slice(0,i),b=s.slice(i+1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // A hill, raised one step at a time — `5:` has no ack of its own, so `rebuilt`
    // is the barrier, and two raises in one flush produce only one of them.
    ws.send('7:0,0,1.5708'); await ack('placed');
    for (let k = 0; k < 8; k++) { ws.send('5:1'); await ack('rebuilt'); }
    const peakBefore = hi();
    ws.send('26:0,10'); const cellBefore = await ack('cell 0,10 =');
    ws.send('15:0,10'); const colBefore  = await ack('column 0,10 =');

    // Dig three cellars under the hill's flank. The character moves off the summit
    // first: a cellar needs headroom above it, and `storey refused` names the case.
    ws.send('7:0,15,0'); await ack('placed');
    const digs = [];
    for (let k = 0; k < 3; k++) { ws.send('12:-1'); digs.push(await ack('storey')); }
    await ack('rebuilt');
    const peakAfter = hi();
    ws.send('26:0,10'); const cellAfter = await ack('cell 0,10 =');
    ws.send('15:0,10'); const colAfter  = await ack('column 0,10 =');
    ws.send('29:0,10'); const labels    = await ack('labels 0,10 =');

    // THE WRITE SIDE. Back to the summit and raise once more.
    ws.send('7:0,0,1.5708'); await ack('placed');
    ws.send('5:1'); await ack('rebuilt');
    const peakRaised = hi();

    const dug = digs.every((d) => d.startsWith('storey -1'));
    // four layers, and the cellars really are BELOW — otherwise "held" is vacuous
    const stacked = colAfter.slice(colAfter.indexOf('=') + 1).trim().split(',').map(Number);
    const inserted = stacked.length === 4 && stacked[3] > stacked[0];
    // the ground carries the reserved label 1, and it is LAST — at the top, with
    // its own height, which is the identity claim stated as a number
    const lbls = labels.slice(labels.indexOf('=') + 1).trim().split(',').map(Number);
    const groundLabelled = lbls.length === 4 && lbls[3] === 1;
    const held = Math.abs(peakAfter - peakBefore) < 0.001;
    const cellHeld = cellAfter === cellBefore;
    const writeReaches = peakRaised > peakBefore + 0.1;
    const ok = dug && inserted && groundLabelled && held && cellHeld && writeReaches;
    console.log(JSON.stringify({ cellBefore, cellAfter, colBefore, colAfter, labels,
      peakBefore, peakAfter, peakRaised,
      dug, inserted, groundLabelled, held, cellHeld, writeReaches, ok }));
    ws.close(); process.exit(ok ? 0 : 1); } };
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
