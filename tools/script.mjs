#!/usr/bin/env node
// RUN A SCRIPT OF KEY PRESSES AGAINST THE EDITOR, AND PHOTOGRAPH THE RESULT.
//
// WHY. Every iteration on how a house looks meant re-typing the same walk-and-press
// by hand, which is slow, unrepeatable, and impossible to diff: two runs that
// differ tell you nothing when the inputs differed too. A script makes the INPUT
// fixed so the only thing that changes between runs is the editor.
//
//   node tools/script.mjs <script.keys> [--port 18090] [--shots] [--keep]
//
// The script speaks in the keys a person presses. One table below maps each to the
// wire message the client sends for it — ⚠ IT MUST MATCH `html/editor.html`, and
// that is the one duplication here; a key that does something different in the
// page than in this file makes every script a lie.
//
// ⚠ NO BROWSER BY DEFAULT. `watched = live_clients > 0`, and this runner IS a
// client — so the server ticks for it, and the whole scene can be driven and read
// back with nothing but the socket. A browser is attached ONLY for `--shots`, and
// only from the first `snap` that needs one, because it is the single slowest and
// flakiest thing in the loop and most runs do not want a picture.
//
//   # a comment
//   at <x> <z> [yawdeg]     teleport — exact, repeatable, the workhorse
//   key <K>                 send what pressing K sends
//   hold <WASD> <wu>        hold a key until that much ground is covered
//   turn <deg>              turn by that much, measured off the body's facing
//   wait <prefix>           wait for a status line starting with this
//   snap <name>             picture + state dump, into shots/
//   keys <bitmask>          hold W=1 S=2 A=4 D=8 — raw, so a walk can be held for
//                           an EXACT number of ticks rather than a distance
//   rate <n>                simulation speed: 1 real time, 8 fast, 0 STEPPED
//   step <n>                advance exactly n ticks and wait until they are done
//   save <name>             write the world; the file is the determinism fingerprint
//   echo <text>             print a marker into the transcript
import http from 'node:http';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
const scriptPath = args[0];
if (!scriptPath) { console.error('usage: script.mjs <script.keys> [--port N] [--keep]'); process.exit(64); }
let PORT = 18090, keep = false, shots = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port') PORT = +args[++i];
  if (args[i] === '--keep') keep = true;
  if (args[i] === '--shots') shots = true;
}

// ⚠ KEEP IN STEP WITH `html/editor.html`'s keydown handler.
const KEYMAP = {
  ArrowUp: '5:1', ArrowDown: '5:-1',
  F: '23:3,3',            // ring a fence around you
  G: '23:1,3',            // the same tool with wall material — a hex RING, not a line
  E: '30:1', Q: '30:-1',  // cut one step into the cell ahead
  B: '12:1', C: '12:-1',  // a storey above, a cellar below
  R: '25:1',              // a wall run — two presses, start and end
  H: '32:',               // a house where you are looking (S4)
  O: '36:1',              // a ROUND-headed opening in the wall you face
  P: '36:2',              // …a POINTED one
  I: '36:3',              // …a segmental one
  U: '36:4',              // …and an oculus, a round window
  N: '36:11',             // a round-headed NICHE — the same curve, stopped short
  M: '36:21',             // …and a window in that niche's BACK — the embrasure
  J: '37:0',              // a BEDSTEE — a closed box built ONTO the wall you face
  K: '37:1',              // a BALCONY — an open deck with a rail, and a way in
  V: '37:2',              // a CUPBOARD beside the last box — they share a wall
};
const HELD = { W: 1, S: 2, A: 4, D: 8 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the browser, attached lazily and only for pictures
const CDP = 9345;
let proc = null, cdp = null, cdpId = 0;
const cdpPending = new Map();
async function cdpJson(path) {
  for (let i = 0; i < 60; i++) {
    try { return await new Promise((res, rej) => {
      http.get({ host: '127.0.0.1', port: CDP, path }, (r) => {
        let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => res(JSON.parse(b)));
      }).on('error', rej); }); } catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
}
const call = (method, params = {}) => new Promise((res) => {
  const n = ++cdpId; cdpPending.set(n, res); cdp.send(JSON.stringify({ id: n, method, params })); });
async function browser() {
  if (cdp) return true;
  const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
    .find((c) => spawnSync('which', [c]).status === 0);
  if (!chrome) { console.log('  !! no chrome — state dump only'); return false; }
  // ⚠ THE THREE FLAGS TOGETHER, and `--use-gl=angle` rather than
  // `--use-gl=swiftshader`. This spawned Chrome with the older spelling and got a
  // WebGL2 context that DREW — `readPixels` returned a full picture — but composited
  // nothing, so `Page.captureScreenshot` returned the DOM over white. Two blank
  // PNGs this session, S3's wall and S4's house, while `html_render_check.mjs`
  // photographed the same scene at 478 distinct colours with these flags.
  //
  // A picture that is blank for a browser-flag reason is the worst possible
  // failure here: the method is "every step ends in a PNG", so a broken camera
  // reads as broken work.
  proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
    '--no-sandbox', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader',
    '--mute-audio', '--hide-scrollbars',
    '--window-size=1200,800', 'about:blank'],
    { stdio: 'ignore' });
  const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
  cdp = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => cdp.addEventListener('open', r));
  cdp.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && cdpPending.has(m.id)) { cdpPending.get(m.id)(m.result); cdpPending.delete(m.id); } });
  await call('Page.enable');
  await call('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

  // ⚠ WAIT FOR THE CANVAS, NOT THE CLOCK. This was `await sleep(4000)` — a guess
  // that the page had connected, streamed and drawn — and it wrote BLANK PNGs
  // twice: S3's wall and S4's house both photographed an empty canvas while
  // `make editor-check` rendered the same scene at 478 distinct colours. Measured
  // afterwards, a fresh client needs about 6.5s to reach a drawn frame (3.6s for
  // the server to load and build, then connect, opening burst, camera), so four
  // was never going to be enough — and a blank picture is worse than no picture,
  // because it reads as a broken renderer.
  //
  // So it asks the canvas how many distinct colours it holds, the same question
  // `html_render_check.mjs` asks, and waits until the answer says something is
  // drawn. It SAYS SO on timeout rather than writing the blank frame silently.
  const colours = async () => {
    const r = await call('Runtime.evaluate', { returnByValue: true, expression: `
      (() => {
        const c = document.querySelector('#gl');
        if (!c || !c.width) return 0;
        const g = c.getContext('webgl2') || c.getContext('webgl');
        if (!g) return 0;
        const px = new Uint8Array(c.width * c.height * 4);
        g.readPixels(0, 0, c.width, c.height, g.RGBA, g.UNSIGNED_BYTE, px);
        const seen = new Set();
        for (let i = 0; i < px.length; i += 4 * 997) seen.add(px[i] << 16 | px[i+1] << 8 | px[i+2]);
        return seen.size;
      })()` });
    return r?.result?.value ?? 0;
  };
  for (let t = 0; t < 20000; t += 250) {
    await sleep(250);
    if (await colours() >= 12) return true;
  }
  console.log('  !! the page never drew — the picture will be blank, and that is the finding');
  return true;
}

// ── the wire: how the world is actually driven
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const status = []; const trace = []; let tCount = 0;
ws.addEventListener('message', (ev) => {
  const s = ev.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('0;')) { trace.push(b.slice(2).split(',').map(Number)); tCount++; }
});
await new Promise((r) => ws.addEventListener('open', r));
ws.send('1:');
// The camera has to be asked for, or the server sends no `C:` and never ticks a view.
await sleep(400); ws.send('2:1.5,');

const ack = async (prefix, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 50) {
    await sleep(50);
    const m = status.slice(from).find((x) => x.startsWith(prefix));
    if (m) return m;
  }
  return `(no "${prefix}" in ${limitMs}ms)`;
};
const nextT = async (limitMs = 15000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 5) { if (tCount !== before) return true; await sleep(5); }
  return false;
};
const pose = () => trace[trace.length - 1] ?? new Array(16).fill(0);
// Facing from the body's own model matrix — the same third column `keyonly` reads,
// so the script and the gate agree about which way the character is looking.
const facing = () => { const m = pose(); return Math.atan2(m[2], m[0]) * 180 / Math.PI; };

let snaps = 0;
async function snap(name) {
  snaps += 1;
  const tag = name ?? `s${snaps}`;
  // The state dump is the SERVER's — one instant, the same one the picture is of.
  ws.send('31:');
  await ack('snapshot', 10000);
  if (!shots) { console.log(`  … snap ${tag} — state only (pass --shots for a picture)`); return; }
  if (!(await browser())) return;
  // ⚠ CLIPPED TO THE CANVAS, and that is not framing — it is the difference
  // between a picture and a blank page. An unclipped `Page.captureScreenshot`
  // under `--use-gl=swiftshader` does not composite the WebGL layer: it returns
  // the DOM (the HUD) over white, twice in this session, while
  // `html_render_check.mjs` rendered the same scene at 478 distinct colours by
  // capturing WITH a clip. Ask the canvas where it is and photograph that.
  const rect = (await call('Runtime.evaluate', { returnByValue: true, expression: `
    (() => { const el = document.querySelector('#gl');
             if (!el) return null;
             const r = el.getBoundingClientRect();
             if (r.width < 1 || r.height < 1) return null;
             return { x: r.x, y: r.y, width: r.width, height: r.height }; })()` }))
    ?.result?.value;
  const shot = await call('Page.captureScreenshot',
                          rect ? { format: 'png', clip: { ...rect, scale: 1 } }
                               : { format: 'png' });
  fs.mkdirSync('shots', { recursive: true });
  fs.writeFileSync(`shots/${tag}.png`, Buffer.from(shot.data, 'base64'));
  console.log(`  … snap ${tag} → shots/${tag}.png`);
}

const lines = fs.readFileSync(scriptPath, 'utf8').split('\n');
await sleep(1200);            // the opening burst
await nextT();

for (const raw of lines) {
  const line = raw.trim();
  if (line === '' || line.startsWith('#')) continue;
  const [cmd, ...rest] = line.split(/\s+/);
  console.log(`> ${line}`);
  if (cmd === 'at') {
    const [x, z, yaw = 0] = rest.map(Number);
    ws.send(`7:${x},${z},${(yaw * Math.PI) / 180}`);
    console.log('  ' + await ack('placed', 10000));
  } else if (cmd === 'key') {
    const k = rest[0];
    const msg = KEYMAP[k];
    if (!msg) { console.log(`  !! no key '${k}' — add it to KEYMAP and to editor.html`); continue; }
    ws.send(msg);
    await sleep(250);
    const said = status[status.length - 1];
    if (said) console.log('  ' + said);
  } else if (cmd === 'hold') {
    const bit = HELD[rest[0]];
    const want = Number(rest[1]);
    const p0 = pose();
    ws.send(`4:${bit}`);
    let stuck = 0, last = -1;
    for (let n = 0; n < 8000; n++) {
      if (!(await nextT())) break;
      const p = pose();
      const gone = Math.hypot(p[12] - p0[12], p[14] - p0[14]);
      if (gone >= want) break;
      if (Math.abs(gone - last) < 0.0005) { stuck += 1; if (stuck >= 40) break; } else stuck = 0;
      last = gone;
    }
    ws.send('4:0'); await nextT();
    const p = pose();
    console.log(`  moved ${Math.hypot(p[12] - p0[12], p[14] - p0[14]).toFixed(3)} wu`);
  } else if (cmd === 'turn') {
    const want = Number(rest[0]);
    const a0 = facing();
    ws.send(`4:${want >= 0 ? 8 : 4}`);
    for (let n = 0; n < 8000; n++) {
      if (!(await nextT())) break;
      let d = facing() - a0;
      while (d > 180) d -= 360; while (d < -180) d += 360;
      if (Math.abs(d) >= Math.abs(want)) break;
    }
    ws.send('4:0'); await nextT();
    console.log(`  facing ${facing().toFixed(1)}°`);
  } else if (cmd === 'keys') {
    ws.send(`4:${rest[0]}`);
    await sleep(60);
  } else if (cmd === 'rate') {
    ws.send(`34:${rest[0]}`);
    console.log('  ' + await ack('rate', 10000));
  } else if (cmd === 'step') {
    // ⚠ The ack arrives when the ticks have been CONSUMED, not when the message
    // landed — that difference is the whole point of stepping.
    ws.send(`35:${rest[0]}`);
    console.log('  ' + await ack('stepped', 60000));
  } else if (cmd === 'save') {
    ws.send(`8:${rest[0]}`);
    console.log('  ' + await ack('saved', 30000));
  } else if (cmd === 'wait') {
    // ⚠ LOOK AT WHAT ALREADY ARRIVED. `ack` scans only messages that land AFTER it
    // is called, which is right for "the next one" and wrong for "has this
    // happened" — and a `key` that prints its own acknowledgement has already
    // consumed it, so `wait` for the same thing sat out the full 40-second limit
    // and carried on. Exactly the fault that cost two gates 80 seconds a run.
    const want = rest.join(' ');
    const seen = status.find((x) => x.startsWith(want));
    console.log('  ' + (seen ?? await ack(want)));
  } else if (cmd === 'snap') {
    await snap(rest[0]);
  } else if (cmd === 'echo') {
    console.log('  ' + rest.join(' '));
  } else {
    console.log(`  !! unknown command '${cmd}'`);
  }
}

if (!keep) { ws.close(); if (cdp) cdp.close(); if (proc) proc.kill(); }
console.log('script done');
process.exit(0);
