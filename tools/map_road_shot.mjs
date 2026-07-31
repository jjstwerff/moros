#!/usr/bin/env node
// tools/map_road_shot.mjs — lay a road in the world-map editor and photograph it.
//
// WHY. `test/lattice.test.js` proves the mirror direction from the geometry, with
// the shipped table as its control — but a pure test cannot say whether the page
// still WIRES that geometry: the lattice moved into its own module, and an import
// that fails leaves a blank canvas and a green test suite. So this drives the real
// page: pick the road tool, click two tiles, screenshot.
//
//   node tools/map_road_shot.mjs <url> <out.png> [--pairs "col,row col,row; …"]
//
// Exits 0 whatever the page did — it is an instrument, not a gate.
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: map_road_shot.mjs <url> <out.png>');
  process.exit(64);
}

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('SKIP: no chrome on this box'); process.exit(2); }

const PORT = 9337;
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox',
  '--disable-gpu-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1280,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 50; i++) {
    try {
      return await new Promise((res, rej) => {
        http.get({ host: '127.0.0.1', port: PORT, path }, (r) => {
          let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => res(JSON.parse(b)));
        }).on('error', rej);
      });
    } catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
}

const targets = await json('/json/list');
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});
const notes = [];

await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled') {
    notes.push(`[${m.params.type}] ` +
      m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  } else if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    notes.push(`[exception] ${d.exception?.description ?? d.text}`);
  }
});

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url });
await sleep(2500);

// The road tool takes two clicks: a start tile and a destination, with a
// shortest path laid between them. Click a run of tiles so the picture shows a
// road crossing BOTH row parities — the bug was parity-shaped, and a road along
// one row would have looked fine either way.
const click = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await call('Input.dispatchMouseEvent',
      { type, x, y, button: 'left', clickCount: 1, buttons: 1 });
    await sleep(60);
  }
};

// Canvas coordinates of hex (col,row), read from the page's own layout so this
// tool never has a second copy of the geometry.
const centre = await call('Runtime.evaluate', {
  expression: `(() => {
    const cv = document.getElementById('map-canvas');
    const r = cv.getBoundingClientRect();
    const S = 36, w = Math.sqrt(3) * S, h = 2 * S;
    const at = (c, row) => ({
      x: r.left + c * w + (row % 2 === 1 ? w / 2 : 0) + w,
      y: r.top + row * h * 0.75 + S,
    });
    return JSON.stringify([[2,2],[5,3],[7,6],[3,7]].map(([c,q]) => at(c,q)));
  })()`, returnByValue: true,
});
const pts = JSON.parse(centre.result.value);

await call('Runtime.evaluate', { expression: `window.setMode('road')` });
await sleep(200);
for (const p of pts) { await click(p.x, p.y); await sleep(250); }
await sleep(600);

const shot = await call('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(notes.length ? notes.join('\n') : '(no console output, no exceptions)');
console.log(`wrote ${out}`);
ws.close();
proc.kill();
process.exit(0);
