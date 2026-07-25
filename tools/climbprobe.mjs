// Raise a hill ahead, walk into it, and watch the character's Y.
//
// ⚠ Walks a DISTANCE, not a duration. The first version held W for a fixed 6 s
// — which encoded the walking speed as a hidden constant, so doubling the speed
// sent the character over the summit and down the far side, and "monotonically
// ascending" failed against working code. A gate that breaks when a constant it
// never mentions changes is measuring the wrong thing.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
let st = 0; const ys = [], xs = [], zs = [];
const here = () => [xs[xs.length-1], zs[zs.length-1]];
async function walkFor(dist) {
  const [x0, z0] = here();
  ws.send('4:1');
  for (let i = 0; i < 400; i++) {
    await new Promise(r => setTimeout(r, 50));
    const [x, z] = here();
    if (Math.hypot(x - x0, z - z0) >= dist) break;
  }
  ws.send('4:0');
  await new Promise(r => setTimeout(r, 300));
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T' && b.startsWith('0;')) { const m = b.slice(2).split(',').map(Number);
    xs.push(m[12]); ys.push(m[13]); zs.push(m[14]); }
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(150); }
    const y0 = ys[ys.length - 1];
    await walkFor(8.0);
    const y1 = ys[ys.length - 1];
    const climbed = y1 - y0;
    const monotone = ys.slice(-30).every((v, k, a) => k === 0 || v >= a[k-1] - 0.001);
    console.log(JSON.stringify({ startY: +y0.toFixed(3), endY: +y1.toFixed(3),
                                 climbed: +climbed.toFixed(3),
                                 smooth: monotone, ok: climbed > 0.4 && monotone }));
    ws.close(); process.exit(climbed > 0.4 && monotone ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 25000);
