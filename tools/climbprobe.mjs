// Raise a hill ahead, walk into it, and watch the character's Y.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
let st = 0; const ys = [];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T' && b.startsWith('0;')) ys.push(+b.slice(2).split(',')[13]);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(150); }
    const y0 = ys[ys.length - 1];
    ws.send('4:1'); await wait(6000); ws.send('4:0'); await wait(400);
    const y1 = ys[ys.length - 1];
    const climbed = y1 - y0;
    const monotone = ys.slice(-30).every((v, k, a) => k === 0 || v >= a[k-1] - 0.001);
    console.log(JSON.stringify({ startY: +y0.toFixed(3), endY: +y1.toFixed(3),
                                 climbed: +climbed.toFixed(3),
                                 smooth: monotone, ok: climbed > 0.4 && monotone }));
    ws.close(); process.exit(climbed > 0.4 && monotone ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 25000);
