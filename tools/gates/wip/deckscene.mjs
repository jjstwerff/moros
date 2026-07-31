// Build a stair-and-platform scene and leave the character standing on the deck,
// so `make shot` has something to photograph. Not a gate — it drives the shared
// world on purpose.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = []; let st = 0;
const ack = async (p, l = 30000) => { const f = status.length;
  for (let t = 0; t < l; t += 60) { await wait(60);
    const m = status.slice(f).find((x) => x.startsWith(p)); if (m) return m; }
  return `(no "${p}" in ${l}ms)`; };
const place = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const HEX = 1.7320508075688772;

ws.onmessage = async (e) => { const s=e.data,i=s.indexOf(':'),t=s.slice(0,i),b=s.slice(i+1);
  if (t==='S') status.push(b);
  if (t==='E') ws.send('2:1.5,');
  if (t==='C' && !st) { st=1;
    const out = [];
    for (const k of [0, 1, 2]) {
      await place(k * HEX, 0, 0); ws.send('30:1'); out.push(await ack('stair'));
    }
    await place(1 * HEX, 0, 0);
    ws.send('10:1'); out.push(await ack('road true'));
    await place(6 * HEX, 0, 0);
    ws.send('10:0'); await ack('road false');
    await ack('rebuilt');
    ws.send('12:1'); out.push(await ack('storey'));
    await ack('rebuilt');
    // up the stair, then onto the deck, facing back down it
    await place(3 * HEX, 0, 0);
    await place(6 * HEX, 0, 3.1416);
    await wait(500);
    console.log(out.join(' | '));
    ws.close(); process.exit(0); } };
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 120000);
