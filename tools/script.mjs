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
  Y: '38:0',              // a BED in the box you stand at — sized by the box
  T: '38:1',              // a STATUE in the niche — sized by the niche
  X: '39:0',              // a SLAB over the last house — a floor WITH A THICKNESS
  Z: '39:1',              // a stairwell through it, with a reveal in the thickness
};
const HELD = { W: 1, S: 2, A: 4, D: 8 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The palette the server sends, from `editor_server.loft`. ⚠ Keep in step with it —
// a classifier holding last month's colours reports a frame nobody is looking at.
const PALETTE = {
  figure: [0.80, 0.60, 0.45],   // the SUBJECT — the row every gate here asks about
  grass:  [0.42, 0.50, 0.30],
  rock:   [0.46, 0.38, 0.26],
  field:  [0.55, 0.62, 0.24],
  road:   [0.28, 0.26, 0.24],
  tree:   [0.16, 0.34, 0.14],
  roof:   [0.45, 0.20, 0.17],
  wall:   [0.55, 0.52, 0.46],
  floor:  [0.62, 0.57, 0.48],
  frame:  [0.78, 0.74, 0.65],
  sky:    [0.48, 0.55, 0.64],
};
const CHROMA = Object.entries(PALETTE).map(([k, c]) => {
  const s = c[0] + c[1] + c[2];
  return [k, [c[0] / s, c[1] / s, c[2] / s]];
});

// ⚠ WALL, FLOOR AND FRAME ARE NEARLY THE SAME CHROMATICITY — 0.359/0.340/0.301
// against 0.371/0.341/0.287 — because they are all pale warm greys, which is a fact
// about the palette and not a flaw in the method. They are reported as one bucket
// rather than pretended apart, and the SUBJECT is what this exists to count: at
// 0.432/0.324/0.243 it is far warmer than any of them, which is why the one row that
// matters is the one that survives.
const MERGE = { wall: 'masonry', floor: 'masonry', frame: 'masonry' };

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
// ⚠ A judged frame that fails must fail the RUN. A gate that prints FAIL and exits
// 0 is a gate the suite reports as green.
let frameFails = 0;
async function frameStats() {
  if (!(await browser())) return { ok: false, why: 'no browser' };
  // ⚠ THROUGH THE SCREENSHOT, NOT `readPixels`. A WebGL context without
  // `preserveDrawingBuffer` clears its drawing buffer at composite, so a
  // `readPixels` from outside the render loop returns a black frame however good the
  // picture is — measured, 49500 samples and every one black while the PNG beside it
  // showed a house. `Page.captureScreenshot` is what the snapshots already use and
  // what is known to work here, so the pixels come back the same way and are decoded
  // by the page itself: no node dependency, and one small payload back.
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
  const r = await call('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
    expression: `
    (async () => {
      const img = new Image();
      img.src = 'data:image/png;base64,${shot.data}';
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const PAL = ${JSON.stringify(CHROMA)};
      const MERGE = ${JSON.stringify(MERGE)};
      const counts = {}; let total = 0;
      for (let y = 0; y < cv.height; y += 4) {
        for (let x = 0; x < cv.width; x += 4) {
          const i = (y * cv.width + x) * 4;
          const R = d[i] / 255, G = d[i+1] / 255, B = d[i+2] / 255;
          const s = R + G + B;
          let key;
          if (s < 0.06) key = 'black';
          else {
            const cr = R/s, cg = G/s, cb = B/s;
            let best = null, bd = 1e9;
            for (const [k, c] of PAL) {
              const dd = (cr-c[0])**2 + (cg-c[1])**2 + (cb-c[2])**2;
              if (dd < bd) { bd = dd; best = k; }
            }
            key = bd > 0.0009 ? 'other' : (MERGE[best] ?? best);
          }
          counts[key] = (counts[key] ?? 0) + 1; total += 1;
        }
      }
      return { counts, total, w: cv.width, h: cv.height };
    })()` });
  const v = r?.result?.value;
  if (!v) return { ok: false, why: 'no frame' };
  const share = {};
  for (const [k, n] of Object.entries(v.counts)) share[k] = +(n / v.total).toFixed(4);
  const ranked = Object.entries(share).sort((a, b) => b[1] - a[1]);
  return {
    subject: share.figure ?? 0,          // the gate's first row: must be > 0
    largest: ranked[0]?.[0], largestShare: ranked[0]?.[1] ?? 0,
    samples: v.total, share,
  };
}

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
  } else if (cmd === 'frame') {
    // ⚠ WHAT IS ACTUALLY ON SCREEN, AS NUMBERS. Every wrong turn in the camera work
    // came from reading a picture by eye: "it does not know about walls" (it does),
    // "the clamp is the fault" (it was, and the frame did not change), "the edge set
    // is empty" (it was full — the counter used the wrong channel). A frame is a
    // histogram, and the row that matters is how much of it is the SUBJECT.
    //
    // `frame` reports; `frame <minSubject> <maxLargest>` also JUDGES, which is what
    // turns the instrument into a gate. Both print the whole histogram, because a
    // pass/fail with no numbers behind it is the thing this replaced.
    const fs2 = await frameStats();
    const wantSub = rest[0] === undefined ? null : Number(rest[0]);
    const wantMax = rest[1] === undefined ? null : Number(rest[1]);
    let verdict = '';
    if (wantSub !== null) {
      const okSub = fs2.subject >= wantSub;
      const okMax = wantMax === null || fs2.largestShare <= wantMax;
      if (!okSub) { verdict += ` FAIL subject ${fs2.subject} < ${wantSub}`; frameFails += 1; }
      if (!okMax) { verdict += ` FAIL ${fs2.largest} ${fs2.largestShare} > ${wantMax}`; frameFails += 1; }
      if (okSub && okMax) verdict = ' PASS';
    }
    console.log('  ' + JSON.stringify(fs2) + verdict);
  } else if (cmd === 'send') {
    // ⚠ Raw wire, for the messages a KEY should not exist for. `27:1` turns the
    // server's tracer on; binding a key to it would put a diagnostic in the page.
    ws.send(rest.join(' '));
    await sleep(120);
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
// ⚠ A JUDGED FRAME THAT FAILED MUST FAIL THE RUN. A gate that prints FAIL and exits
// 0 is a gate the suite reports as green — which is worse than no gate, because it
// is a green light nobody earned.
if (frameFails > 0) {
  console.log(`script: ${frameFails} frame check(s) failed`);
  process.exit(1);
}
process.exit(0);
