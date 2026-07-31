#!/usr/bin/env node
// Press a key in the real editor page, headless. `page_console.mjs --press` holds
// a MOVEMENT key; this sends one keystroke of any kind (including '$') to the
// canvas, which is what an editor gesture is.
//
//   node tools/press_key.mjs <url> <key> [--wait-ms N] [--after-ms N]
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const [url, key] = process.argv.slice(2);
let waitMs = 9000, afterMs = 3000;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--wait-ms') waitMs = +process.argv[++i];
  if (process.argv[i] === '--after-ms') afterMs = +process.argv[++i];
}
const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('SKIP: no chrome'); process.exit(2); }
const PORT = 9341;
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader', '--window-size=1100,760', 'about:blank'],
  { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 60; i++) {
    try { return await new Promise((res, rej) => {
      http.get({ host: '127.0.0.1', port: PORT, path }, (r) => {
        let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => res(JSON.parse(b)));
      }).on('error', rej); }); } catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
}
const page = (await json('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const notes = [];
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled')
    notes.push('[console] ' + m.params.args.map((a) => a.value ?? '').join(' '));
  else if (m.method === 'Runtime.exceptionThrown')
    notes.push('[exception] ' + (m.params.exceptionDetails.exception?.description ?? '')); });
await call('Runtime.enable'); await call('Page.enable');
await call('Page.navigate', { url });
await sleep(waitMs);
// ⚠ Focus the canvas first: keys are bound at the document here, but a click also
// makes this behave like a person, and the wasm client needs it outright.
await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 550, y: 400, button: 'left', clickCount: 1, buttons: 1 });
await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 550, y: 400, button: 'left', clickCount: 1, buttons: 1 });
for (const k of key.split('')) {
  await call('Input.dispatchKeyEvent', { type: 'keyDown', text: k, key: k,
    code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.charCodeAt(0) });
  await sleep(80);
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: k,
    code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.charCodeAt(0) });
  await sleep(400);
}
await sleep(afterMs);
console.log(notes.length ? notes.join('\n') : '(no console output, no exceptions)');
ws.close(); proc.kill(); process.exit(0);
