// WHERE IS THE LIMB DRAWN, AND WHAT COLOUR? — the payload, not the picture.
//
// `M:{id};0;{r},{g},{b};{x,y,z,...}` — the colour the client is told to paint it
// and the vertices it is told to paint. A limb that reaches the wire and never
// reaches a pixel is either somewhere else or the wrong size, and both are in here.
const PORT = Number(process.argv[2] ?? 18097);
const subjects = process.argv.slice(3);
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const limb = new Map();

ws.addEventListener('message', (ev) => {
  const s = typeof ev.data === 'string' ? ev.data : '';
  if (!s.startsWith('M:')) return;
  const body = s.slice(2);
  const i = body.indexOf(';');
  const id = Number(body.slice(0, i));
  if (id < 8 || id > 15) return;
  const j = body.indexOf(';', i + 1);
  const payload = body.slice(j + 1);
  if (!payload) { limb.delete(id); return; }
  limb.set(id, payload);
});

await new Promise((r) => ws.addEventListener('open', r));
await sleep(1500);

for (const name of subjects) {
  ws.send('44:'); await sleep(1200); limb.clear();
  ws.send(`44:${name}`); await sleep(4000);
  console.log(`\n${name}`);
  for (const [id, payload] of [...limb.entries()].sort((a, b) => a[0] - b[0])) {
    const k = payload.indexOf(';');
    const [r, g, b] = payload.slice(0, k).split(',').map(Number);
    const f = payload.slice(k + 1).split(',').map(Number).filter((n) => Number.isFinite(n));
    // stride 3 assumed; a stride of 6 would show y spanning -1..1 from normals
    const xs = [], ys = [], zs = [];
    for (let t = 0; t + 2 < f.length; t += 3) { xs.push(f[t]); ys.push(f[t + 1]); zs.push(f[t + 2]); }
    const mm = (a) => `${Math.min(...a).toFixed(2)}..${Math.max(...a).toFixed(2)}`;
    console.log(`  id ${id}: colour (${r},${g},${b})  ${f.length / 3} verts  ` +
                `x ${mm(xs)}  y ${mm(ys)}  z ${mm(zs)}`);
  }
}
ws.send('44:'); await sleep(500); ws.close();
