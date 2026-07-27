// Persistence gate: the AUTHORED SET survives a round trip, and only it.
//
// Placed, never walked (a world gate — see ../README.md).
//
// The claim is not "a file appeared". It is that reloading reproduces the same
// GROUND: raise a hill, save, wipe by loading a world that is genuinely flat,
// confirm the ground really went flat, then load the save back and require the
// heights to match. A save that stored meshes rather than cells would still pass
// a file-exists check and fail this one the moment a mesh went stale.
//
// ⚠ THE WIPE CHANGED, and the old one was testing a bug. It used to load a name
// that did not exist and rely on the editor returning an empty world — so a
// mistyped filename silently destroyed your work. A missing world is now REFUSED
// by name and changes nothing, which this gate also checks, so the wipe is done
// by saving a flat world first and loading that instead.
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
    ws.send('8:gateflat'); await wait(700);        // save the world while it is still flat
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(200); }
    // ⚠ settle before measuring: a raise marks chunks dirty and the meshes are
    // rebuilt on the next tick, so reading straight after the last keypress
    // measures a hill one rebuild short of finished.
    await wait(800);
    const built = hi();

    ws.send('8:gate'); await wait(700);            // save the raised world
    ws.send('9:gateflat'); await wait(1100);       // wipe by loading the flat one
    const wiped = hi();
    ws.send('9:gate'); await wait(1100);           // load the raised one back
    const restored = hi();

    // CONTROL, and the behaviour the old wipe depended on being broken: loading a
    // world that does not exist must REFUSE and leave the ground exactly as it is.
    ws.send('9:__no_such_world__'); await wait(900);
    const afterMissing = hi();

    const raised   = built > 0.4;
    const wentFlat = Math.abs(wiped) < 0.001;
    const same     = Math.abs(restored - built) < 0.001;
    const missingKept = Math.abs(afterMissing - restored) < 0.001;
    const ok = raised && wentFlat && same && missingKept;
    console.log(JSON.stringify({ built, wiped, restored, afterMissing,
                                 raised, wentFlat, same, missingKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
