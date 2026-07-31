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
  proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
    '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader', '--window-size=1200,800', 'about:blank'],
    { stdio: 'ignore' });
  const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
  cdp = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => cdp.addEventListener('open', r));
  cdp.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && cdpPending.has(m.id)) { cdpPending.get(m.id)(m.result); cdpPending.delete(m.id); } });
  await call('Page.enable');
  await call('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await sleep(4000);          // let it connect, stream and draw a frame
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
  const shot = await call('Page.captureScreenshot', { format: 'png' });
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
    console.log('  ' + await ack(rest.join(' ')));
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
