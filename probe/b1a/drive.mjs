// B1a's browser half — press a sequence of keys into the REAL client page.
//
//   node probe/b1a/drive.mjs <url> <key,key,…> [--wait-ms N]
//
// `tools/press_key.mjs` sends one keystroke and `page_console.mjs --press` holds a
// movement key; this sends a SEQUENCE, including arrows, because the claim under
// test is *what each key sends over the wire* and one key cannot show a table.
//
// ⚠ IT DOES NOT WALK, AND THAT IS THE COMPARISON. Holding `w` integrates movement
// on the SERVER's tick, so how far the character gets is a wall clock — and two
// runs that stop in different places build different worlds for a reason that has
// nothing to do with what a key means. Every gesture here happens where the fresh
// server put the character.
//
// ⚠ THE CANVAS IS CLICKED FIRST. loft's browser shell binds keydown to the CANVAS
// element, not the window, so a page nobody has clicked is deaf — the client's own
// source says so, and it is why `press_key.mjs` clicks too.
import { spawn, spawnSync } from 'node:child_process';

const [url, keysArg] = process.argv.slice(2);
let waitMs = 25000, holdMs = 120, gapMs = 600, afterMs = 2500;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--wait-ms') waitMs = +process.argv[++i];
}
if (!url || !keysArg) {
  console.error('usage: drive.mjs <url> <key,key,…> [--wait-ms N]');
  process.exit(2);
}

// CDP's three spellings of a key, and they are not interchangeable. A printable
// character needs `text` (that is what makes it a character rather than a code);
// an arrow must NOT have `text` at all, or the shell sees a printable keystroke.
const KEYS = {
  ArrowUp:   { key: 'ArrowUp',   code: 'ArrowUp',   vk: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
};
const describe = (k) => KEYS[k] ?? {
  key: k, code: 'Key' + k.toUpperCase(), vk: k.toUpperCase().charCodeAt(0), text: k,
};

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('B1a SKIP — no chrome'); process.exit(2); }

const CDP = 9371, WIN = '1100,760';
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

const bye = (code, msg) => {
  if (notes.length) console.log(notes.join('\n'));
  console.log(msg);
  try { ws.close(); } catch { /* already closed */ }
  try { proc.kill(); } catch { /* already gone */ }
  process.exit(code);
};

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url });

// ⚠ POLL FOR THE CLIENT TO BE CONNECTED, NEVER SLEEP A FIXED TIME. The page boots
// a 1.8 MB wasm and then dials a socket; a key pressed before that is dropped on
// the floor and the run reports an empty transcript, which reads exactly like a
// client that sends nothing. The evidence is the client's own boot line.
let ready = false;
for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
  const t = (await call('Runtime.evaluate', {
    expression: `(document.getElementById('out')||{}).textContent || ''`,
    returnByValue: true,
  }))?.result?.value ?? '';
  if (t.includes('moros editor client')) { ready = true; break; }
  await sleep(250);
}
if (!ready) bye(1, 'B1a FAIL — the client never booted; nothing was pressed');
await sleep(1500);   // let the first frames and the initial chunk stream settle

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
bye(0, `B1a pressed ${keysArg}`);
