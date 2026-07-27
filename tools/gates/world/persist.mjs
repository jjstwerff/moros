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
const status = [];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// Wait for the SERVER to say the command landed, then for the picture to stop
// moving. Two different signals on purpose: the acknowledgement is independent
// of the height this gate asserts, so waiting on it cannot make the assertion
// vacuous the way "wait until the height is what I expect" would.
const ack = async (match, limitMs = 8000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    if (status.slice(from).some(x => x.includes(match))) return true;
  }
  console.error(`ack: server never said "${match}" in ${limitMs}ms`);
  return false;
};
// ⚠ SETTLE, don't sleep. A load marks every chunk dirty and the meshes come back
// over the following ticks, so a fixed wait measures whatever the rebuild happens
// to have reached — this gate read 5.583 instead of 6.25 on roughly one run in
// two, and only ever on a server it did not share with an earlier gate.
//
// Stability ALONE is not enough either: it settles on the value the world had
// before the command landed, and reported a wipe that had done nothing. Hence
// `ack` first (the server says it loaded), `settle` second (the meshes catch up).
const settle = async (limitMs = 8000) => {
  let prev = null, stable = 0;
  for (let t = 0; t < limitMs; t += 150) {
    await wait(150);
    const v = hi();
    if (prev !== null && Math.abs(v - prev) < 0.0005) { stable += 1; if (stable >= 4) return v; }
    else stable = 0;
    prev = v;
  }
  console.error(`settle: height never stopped moving in ${limitMs}ms`);
  return hi();
};
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    ws.send('8:gateflat'); await wait(700);        // save the world while it is still flat
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await wait(200); }
    // ⚠ settle before measuring: a raise marks chunks dirty and the meshes are
    // rebuilt on the next tick, so reading straight after the last keypress
    // measures a hill one rebuild short of finished.
    const built = await settle();

    ws.send('8:gate'); await wait(700);            // save the raised world
    ws.send('9:gateflat');                         // wipe by loading the flat one
    const ackFlat = await ack('loaded');
    const wiped = await settle();
    ws.send('9:gate');                             // load the raised one back
    const ackRaised = await ack('loaded');
    const restored = await settle();

    // CONTROL, and the behaviour the old wipe depended on being broken: loading a
    // world that does not exist must REFUSE and leave the ground exactly as it is.
    ws.send('9:__no_such_world__');
    await ack('load refused');
    const afterMissing = await settle();

    const raised   = built > 0.4;
    const wentFlat = Math.abs(wiped) < 0.001;
    const same     = Math.abs(restored - built) < 0.001;
    const missingKept = Math.abs(afterMissing - restored) < 0.001;
    const ok = raised && wentFlat && same && missingKept && ackFlat && ackRaised;
    console.log(JSON.stringify({ built, wiped, restored, afterMissing, ackFlat, ackRaised,
                                 raised, wentFlat, same, missingKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
