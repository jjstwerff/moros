// `B1b.1b`'s browser half — WAIT FOR A SENTENCE, THEN PRESS, THEN HAND BACK THE
// WHOLE TRANSCRIPT.
//
//   node probe/b1b/press.mjs <url> <key,key,…> [--await <text>] [--wait-ms N]
//
// It is `probe/b1a/drive.mjs` with one difference, and the difference is the point:
// that driver presses as soon as the client has BOOTED, which is right when the
// subject is what a key sends over the wire. Here the subject is what a key does
// once the page has decided it is on its own, and that decision is several seconds
// after boot — so pressing on a timer would press into the wrong authority and
// report an empty local transcript, which reads exactly like local mode not
// working.
//
// ⚠ SO IT WAITS FOR THE CLIENT'S OWN LINE, NEVER FOR A CLOCK. `--await` polls the
// page's console for a substring. A fixed sleep would be a wall clock deciding
// which authority the run is about, on a box that is shared with other agents'
// work, and this tree has an entry for a probe whose 120-second window turned into
// a flake generator.
import { spawn, spawnSync } from 'node:child_process';

const [url, keysArg] = process.argv.slice(2);
let waitMs = 45000, holdMs = 120, gapMs = 600, afterMs = 3000, awaitText = null;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--wait-ms') waitMs = +process.argv[++i];
  else if (process.argv[i] === '--await') awaitText = process.argv[++i];
}
if (!url || !keysArg) {
  console.error('usage: press.mjs <url> <key,key,…> [--await <text>] [--wait-ms N]');
  process.exit(2);
}

// CDP's three spellings of a key, and they are not interchangeable — a printable
// character needs `text`, an arrow must not have it at all.
const KEYS = {
  ArrowUp:   { key: 'ArrowUp',   code: 'ArrowUp',   vk: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
};
const describe = (k) => KEYS[k] ?? {
  key: k, code: 'Key' + k.toUpperCase(), vk: k.toUpperCase().charCodeAt(0), text: k,
};

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('B1b SKIP — no chrome'); process.exit(2); }

const CDP = 9372, WIN = '1100,760';
for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
  const pid = Number(line.split(/\s+/)[0]);
  if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
    try { process.kill(pid); } catch { /* already gone */ }
  }
}

const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader', `--window-size=${WIN}`, 'about:blank'],
  { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpJson = async (path) => {
  for (let i = 0; i < 100; i++) {
    try { return await (await fetch(`http://127.0.0.1:${CDP}${path}`)).json(); }
    catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
};

let id = 0; const pending = new Map(); const notes = [];
const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') {
    notes.push('[exception] ' + (m.params.exceptionDetails.exception?.description ?? ''));
  }
});
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
});

const out = async () => (await call('Runtime.evaluate', {
  expression: `(document.getElementById('out')||{}).textContent || ''`,
  returnByValue: true,
}))?.result?.value ?? '';

// ⚠ THE TRANSCRIPT IS PRINTED WHATEVER HAPPENS, including on the failure paths.
// A driver that dies with its subject's console still inside the browser leaves
// the caller reading the driver's opinion instead of the client's own words.
const bye = async (code, msg) => {
  const t = await out().catch(() => '');
  if (notes.length) console.log(notes.join('\n'));
  console.log(t);
  console.log(msg);
  try { ws.close(); } catch { /* already closed */ }
  try { proc.kill(); } catch { /* already gone */ }
  process.exit(code);
};

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url });

// The page boots a 1.8 MB wasm; a key pressed before that is dropped on the floor.
let ready = false;
for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
  if ((await out()).includes('moros editor client')) { ready = true; break; }
  await sleep(250);
}
if (!ready) await bye(1, 'B1b FAIL — the client never booted; nothing was pressed');

if (awaitText) {
  let seen = false;
  for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
    if ((await out()).includes(awaitText)) { seen = true; break; }
    await sleep(250);
  }
  // ⚠ IT REPORTS THE MISS AS A MISS. Pressing anyway would produce a transcript
  // with no local lines in it, and "the keys did nothing" is what a reader would
  // conclude from that — about a run where the keys were never in local mode.
  if (!seen) await bye(1, `B1b FAIL — the page never said '${awaitText}'; nothing was pressed`);
}

// loft's browser shell binds keydown to the CANVAS, not the window, so a page
// nobody has clicked is deaf.
await call('Input.dispatchMouseEvent',
  { type: 'mousePressed', x: 550, y: 400, button: 'left', clickCount: 1, buttons: 1 });
await call('Input.dispatchMouseEvent',
  { type: 'mouseReleased', x: 550, y: 400, button: 'left', clickCount: 1, buttons: 0 });
await sleep(300);

for (const k of keysArg.split(',')) {
  const d = describe(k.trim());
  await call('Input.dispatchKeyEvent', { type: d.text ? 'keyDown' : 'rawKeyDown',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk,
    ...(d.text ? { text: d.text } : {}) });
  await sleep(holdMs);
  await call('Input.dispatchKeyEvent', { type: 'keyUp',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk });
  await sleep(gapMs);
}
await sleep(afterMs);
await bye(0, `B1b pressed ${keysArg}`);
