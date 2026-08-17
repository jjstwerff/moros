// EVERYTHING THE BROWSER SAYS, not only what the page's <pre> holds — probe 5.
//
//   node probe/t5/console.mjs <url> [wait-ms]
//   node probe/t5/console.mjs "file://$PWD/probe/t5/out/ctl.html" 3000     # the control
//
// ⚠ **`probe/b1b/press.mjs` CANNOT ANSWER *DID THE PAGE SAY ANYTHING*, AND THAT IS NOT
// A DEFECT IN IT.** That driver reads the page's own `<pre id="out">` and subscribes to
// `Runtime.exceptionThrown` — which is exactly right for pressing keys and reading a
// transcript, and blind to `console.log` / `console.error`. So *the panic printed
// nothing* could not be concluded from its output: an absence there is an absence in
// the ELEMENT, not in the browser. This subscribes to `Runtime.consoleAPICalled` and
// `Log.entryAdded` as well, and then prints the element too.
//
// ⚠ **AND ITS FIRST RUN WAS BLIND, WHICH IS WHY `ctl.html` EXISTS.** A page that
// `console.error`s a known line is the control, and the first version scored it as
// silence — `Page.navigate` had answered `net::ERR_ACCESS_DENIED`, because headless
// chrome would not open a `file://` URL under the session scratch directory. The URL
// has to be inside the tree. **A driver that cannot see a line it was told to look for
// will report the same silence for a page that never spoke and a page it never
// loaded**, so the navigate result is printed on every run.
import { spawn, spawnSync } from 'node:child_process';

const url = process.argv[2];
if (!url) { console.error('usage: console.mjs <url> [wait-ms]'); process.exit(2); }
const waitMs = Number(process.argv[3] ?? 40000);

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('t5/console SKIP — no chrome'); process.exit(2); }

// ⚠ A PORT OF ITS OWN. `press.mjs` uses 9372 and the two are run back to back.
const CDP = 9375, WIN = '1100,760';
// The swiftshader spelling `press.mjs` had to learn: `--use-gl=angle
// --use-angle=swiftshader`, or the canvas composites transparent.
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--enable-unsafe-swiftshader',
  '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio', '--hide-scrollbars',
  `--window-size=${WIN}`, 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpJson = async (p) => {
  for (let i = 0; i < 100; i++) {
    try { return await (await fetch(`http://127.0.0.1:${CDP}${p}`)).json(); }
    catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
};

let id = 0; const pending = new Map();
const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    console.log('[exception] ' + (m.params.exceptionDetails.exception?.description ?? ''));
  } else if (m.method === 'Runtime.consoleAPICalled') {
    const txt = (m.params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
    console.log(`[console.${m.params.type}] ${txt}`);
  } else if (m.method === 'Log.entryAdded') {
    console.log(`[log.${m.params.entry.level}] ${m.params.entry.text}`);
  }
});
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
});

await call('Runtime.enable');
await call('Log.enable');
await call('Page.enable');
const nav = await call('Page.navigate', { url });
console.log(`[navigate] ${nav?.errorText ?? 'ok'} — ${url}`);
await sleep(waitMs);
const t = (await call('Runtime.evaluate', {
  expression: `(document.getElementById('out')||{}).textContent || ''`,
  returnByValue: true,
}))?.result?.value ?? '';
console.log('--- the page\'s own transcript ---');
console.log(t);
try { ws.close(); } catch { /* already closed */ }
try { proc.kill(); } catch { /* already gone */ }
process.exit(0);
