#!/usr/bin/env node
// tools/page_console.mjs — load a `loft --html` page in headless Chrome and print
// what it SAID: the `<pre id="out">` the shell writes `println` into, plus every
// console message and page exception.
//
// WHY THIS EXISTS. `html_render_check.mjs` answers "did it draw" — one bit and a
// colour count. When the answer is "no", it has nothing further to say, and the
// program's own `println` lines are invisible because the shell HIDES the output
// element the moment `gl_create_window` succeeds. So a client that connects,
// parses a wire and draws nothing looks exactly like one that never started.
//
// This is the attribution half: the render check says WHETHER, this says WHAT.
// Use it whenever a page is blank and you do not yet know at which step.
//
//   node tools/page_console.mjs <url> [--wait-ms N] [--tail N] [--hook-shaders]
//                                     [--press KeyW[:ms]]
//
// `--press` focuses the canvas and holds a key down for `ms` (default 3000), so the
// INPUT half of a page can be measured and not just its picture. ⚠ The focus is not
// optional: loft's shell binds keydown/keyup to the CANVAS (which carries
// `tabindex="0"`), not to the window — so a page nobody has clicked receives no keys
// at all, where the JavaScript it replaces listened at the document.
//
// `--hook-shaders` wraps `shaderSource` / `compileShader` before the page loads and
// logs the source WebGL was actually handed, plus the info log of anything that
// failed. loft's browser shell rewrites the `#version` line on the way through and
// reports a failure as a bare `console.error('Vertex:', log)` — which is empty when
// the driver has nothing to say, and that is precisely the case where you need to
// read the source the driver read rather than the source you wrote.
//
// Exits 0 whatever the page did — it is an instrument, not a gate.
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('usage: page_console.mjs <url> [--wait-ms N] [--tail N]');
  process.exit(64);
}
const url = args[0];
let waitMs = 12000;
let tail = 200;
let hookShaders = false;
let press = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--wait-ms') waitMs = parseInt(args[++i], 10);
  else if (args[i] === '--tail') tail = parseInt(args[++i], 10);
  else if (args[i] === '--hook-shaders') hookShaders = true;
  else if (args[i] === '--press') press = args[++i];
}

// The virtual-key code the shell's `mapKey` derives its ASCII from — 'KeyW' -> 87.
// Chrome ignores a dispatched key event whose windowsVirtualKeyCode is missing.
const vkOf = (code) => (code.startsWith('Key') ? code.charCodeAt(3)
  : code === 'ArrowUp' ? 38 : code === 'ArrowDown' ? 40
  : code === 'ArrowLeft' ? 37 : code === 'ArrowRight' ? 39 : 0);

const SHADER_HOOK = `
(function () {
  const protos = [globalThis.WebGL2RenderingContext, globalThis.WebGLRenderingContext];
  const srcs = new WeakMap();
  for (const P of protos) {
    if (!P) continue;
    const ss = P.prototype.shaderSource;
    P.prototype.shaderSource = function (sh, src) { srcs.set(sh, src); return ss.call(this, sh, src); };
    const cs = P.prototype.compileShader;
    P.prototype.compileShader = function (sh) {
      cs.call(this, sh);
      const _ok = this.getShaderParameter(sh, this.COMPILE_STATUS);
      console.log('COMPILE ok=' + _ok
        + ' glsl=' + this.getParameter(this.SHADING_LANGUAGE_VERSION)
        + ' glerr=' + this.getError() + ' lost=' + this.isContextLost());
      if (!_ok) {
        const s = srcs.get(sh) || '';
        console.log('SHADER FAILED, source follows:\\n' + (s || '<none>'));
        console.log('SHADER LOG: [' + this.getShaderInfoLog(sh) + ']');
        // The bytes, not the rendering: a length mismatch or a trailing NUL is
        // invisible in the pretty-print above and is exactly what an EMPTY info
        // log looks like from the outside.
        console.log('SHADER len=' + s.length + ' tail=' + JSON.stringify(s.slice(-24))
          + ' nonascii=' + JSON.stringify([...s].filter((c) => c.charCodeAt(0) > 126
            || (c.charCodeAt(0) < 32 && c !== '\\n')).map((c) => c.charCodeAt(0))));
      }
    };
  }
})();
`;

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('SKIP: no chrome on this box'); process.exit(2); }

const PORT = 9333;
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox',
  '--disable-gpu-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1280,800', 'about:blank',
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

const { WebSocket } = await import('node:worker_threads').then(() => ({ WebSocket: globalThis.WebSocket }));

const targets = await json('/json/list');
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }));

const lines = [];
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.consoleAPICalled') {
    lines.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  } else if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    lines.push(`[exception] ${d.exception?.description ?? d.text}`);
  } else if (m.id === 9999) {
    const v = m.result?.result?.value;
    if (v) console.log('--- page <pre id="out"> ---\n' + v.split('\n').slice(-tail).join('\n'));
  }
});
send('Runtime.enable');
send('Page.enable');
if (hookShaders) send('Page.addScriptToEvaluateOnNewDocument', { source: SHADER_HOOK });
send('Page.navigate', { url });
await sleep(waitMs);

if (press) {
  const [code, msRaw] = press.split(':');
  const holdMs = parseInt(msRaw ?? '3000', 10);
  const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code;
  send('Runtime.evaluate', { expression: "document.getElementById('c') && document.getElementById('c').focus()" });
  await sleep(300);
  console.log(`--- holding ${code} for ${holdMs}ms ---`);
  send('Input.dispatchKeyEvent', {
    type: 'keyDown', code, key, windowsVirtualKeyCode: vkOf(code), nativeVirtualKeyCode: vkOf(code),
  });
  await sleep(holdMs);
  send('Input.dispatchKeyEvent', {
    type: 'keyUp', code, key, windowsVirtualKeyCode: vkOf(code), nativeVirtualKeyCode: vkOf(code),
  });
  await sleep(2500);
}

ws.send(JSON.stringify({
  id: 9999, method: 'Runtime.evaluate',
  params: { expression: "document.getElementById('out') ? document.getElementById('out').textContent : ''" },
}));
await sleep(1500);
if (lines.length) console.log('--- console ---\n' + lines.slice(-tail).join('\n'));
ws.close();
proc.kill();
process.exit(0);
