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
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
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
// Wait for the SERVER to say the command landed, then that it has REBUILT the
// meshes, then for the picture to stop moving. Three signals, none of them the
// height this gate asserts — so waiting cannot make the assertion vacuous the
// way "wait until the height is what I expect" would.
//
// ⚠ `loaded` alone is not enough, and that is the whole flake: the world changes
// when the load is acknowledged, the MESHES change several ticks later, and a
// settle in between stabilises on the picture from before the load. It read a
// wiped world as still 6.25 about one run in five.
const ack = async (match, limitMs = 8000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    if (status.slice(from).some(x => x.includes(match))) return true;
  }
  console.error(`ack: server never said "${match}" in ${limitMs}ms`);
  return false;
};
// ⚠ `settle` IS GONE, AND SO ARE THE SLEEPS. This gate used to `ack` that the
// server had loaded and then *settle* — sample the height until it stopped moving
// four times — because a fixed wait measured whatever the rebuild happened to have
// reached, and stability alone settled on the value from before the command landed.
// Both notes were right about the symptom and both fixes were heuristics: one guess
// about how long a rebuild takes, another about how long "stopped" must hold.
//
// `S:rebuilt N chunks` is the server saying the picture caught up, so the ack
// replaces both and the height is read ONCE. The saves say `saved N chunks`, and a
// raise has no acknowledgement of its own — `rebuilt` is the one that means the
// ground it changed has reached the client.
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    ws.send('8:gateflat'); await ack('saved');    // save the world while it is still flat
    for (let k = 0; k < 4; k++) { ws.send('5:1'); await ack('rebuilt'); }
    const built = hi();

    ws.send('8:gate'); await ack('saved');         // save the raised world
    ws.send('9:gateflat');                         // wipe by loading the flat one
    const ackFlat = await ack('loaded');
    await ack('rebuilt');
    const wiped = hi();
    ws.send('9:gate');                             // load the raised one back
    const ackRaised = await ack('loaded');
    await ack('rebuilt');
    const restored = hi();

    // CONTROL, and the behaviour the old wipe depended on being broken: loading a
    // world that does not exist must REFUSE and leave the ground exactly as it is.
    ws.send('9:__no_such_world__');
    await ack('load refused');
    // a refusal changes nothing, so there is no rebuild to wait for — and the
    // restore above already awaited its own, so nothing is in flight
    const afterMissing = hi();

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
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
