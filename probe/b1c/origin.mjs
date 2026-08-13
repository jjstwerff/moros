// Can a page loaded from `file://` open a WebSocket to a server on this box?
//
// The demo is the client engine build, and it is opened from a DISK — so the
// `/ws` the client dials resolves against `file://` and reaches nothing, which is
// correct and is why local mode exists. "Connections to potential servers" asks a
// different question: with the editor actually running, may a `file://` page
// attach to it at all, or does the browser refuse a null-origin upgrade?
//
// ⚠ IT IS A BROWSER-POLICY QUESTION, NOT AN EDITOR ONE, so the listener is
// `probe/b1b/static.mjs --silent` — twenty lines that complete the handshake and
// say nothing. Using the real editor here would put a 4.7 MB client and a world
// load between the question and its answer.
//
// ⚠ AND IT IS CHECKED AGAINST SOMETHING IT SHOULD FIND: the same page dials a
// port with NOTHING on it in the same run. An `open` on both would mean the probe
// is reading its own optimism; a refusal on both would mean the browser is
// refusing everything and says nothing about origins.
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LIVE = 18761, DEAD = 18762;
const OUT = resolve('probe/b1c/.origin.html');

writeFileSync(OUT, `<!doctype html><meta charset=utf8><pre id=out>dialling
</pre><script>
const say = (s) => { document.getElementById('out').textContent += s + '\\n'; };
const dial = (label, url) => new Promise((res) => {
  let done = false;
  const settle = (verdict) => { if (!done) { done = true; say(label + ' ' + verdict); res(verdict); } };
  let ws;
  try { ws = new WebSocket(url); } catch (e) { settle('threw ' + e.name); return; }
  ws.onopen  = () => settle('OPEN');
  ws.onerror = () => settle('ERROR');
  ws.onclose = () => settle('CLOSED');
  setTimeout(() => settle('TIMEOUT'), 8000);
});
(async () => {
  say('origin ' + JSON.stringify(location.origin));
  await dial('live', 'ws://127.0.0.1:${LIVE}/ws');
  await dial('dead', 'ws://127.0.0.1:${DEAD}/ws');
  say('B1C ORIGIN DONE');
})();
</script>`);

const listener = spawn('node', ['probe/b1b/static.mjs', 'probe/b1c', String(LIVE), '--ws-silent'],
                       { stdio: ['ignore', 'pipe', 'pipe'] });
const lLog = [];
listener.stdout.on('data', (b) => lLog.push(String(b)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 100 && !lLog.join('').includes('static:'); i++) await sleep(100);

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('B1C SKIP — no chrome'); listener.kill(); process.exit(2); }

const CDP = 9374, WIN = '600,400';
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--mute-audio', `--user-data-dir=${resolve('probe/b1c/.chrome')}`,
  `--window-size=${WIN}`, 'about:blank'], { stdio: 'ignore' });

const cdpJson = async (p) => {
  for (let i = 0; i < 100; i++) {
    try { return await (await fetch(`http://127.0.0.1:${CDP}${p}`)).json(); } catch { await sleep(100); }
  }
  throw new Error('devtools never answered');
};
let id = 0; const pending = new Map();
const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
});
await call('Page.enable');
await call('Page.navigate', { url: `file://${OUT}` });

let text = '';
for (let i = 0; i < 300; i++) {
  text = (await call('Runtime.evaluate', {
    expression: `(document.getElementById('out')||{}).textContent || ''`, returnByValue: true,
  }))?.result?.value ?? '';
  if (text.includes('B1C ORIGIN DONE')) break;
  await sleep(100);
}
console.log(text.trim());
console.log('listener said: ' + lLog.join('').trim().split('\n').join(' | '));
try { proc.kill(); } catch {}
try { listener.kill(); } catch {}
process.exit(0);
