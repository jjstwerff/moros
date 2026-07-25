// Persistence gate: the AUTHORED SET survives a round trip, and only it.
//
// Placed, never walked (a world gate — see ../README.md).
//
// The claim is not "a file appeared". It is that reloading reproduces the same
// GROUND: raise a hill, save, wipe the world by loading an empty name, confirm
// the ground really went flat, then load the save back and require the heights
// to match what they were. A save that stored meshes rather than peaks would
// still pass a file-exists check and fail this one the moment a mesh went stale.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
const chunks = new Map();
let st = 0;
const hi = () => {
  let h = -1e9;
  for (const d of chunks.values()) for (let i = 1; i < d.length; i += 6) h = Math.max(h, d[i]);
  return +h.toFixed(3);
};
const wait = (ms) => new Promise(r => setTimeout(r, ms));
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(200); }
    const built = hi();
    ws.send('8:gate'); await wait(600);            // save
    ws.send('9:__empty__'); await wait(900);       // load a world that is not there → empty
    const wiped = hi();
    ws.send('9:gate'); await wait(900);            // load it back
    const restored = hi();
    const raised   = built > 0.4;
    const wentFlat = Math.abs(wiped) < 0.001;      // the wipe really wiped
    const same     = Math.abs(restored - built) < 0.001;
    const ok = raised && wentFlat && same;
    console.log(JSON.stringify({ built, wiped, restored, raised, wentFlat, same, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
