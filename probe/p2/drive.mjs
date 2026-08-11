// P2's browser half — does `host_output` → JS → `loftPush` round-trip in a page?
//
// It serves the injected page over HTTP and reads the verdict out of the page's
// OWN `<pre id="out">`, which is where `loft_host_print` writes. ⚠ That is
// deliberate: reading a value this script computed would be reading our own JS
// back, and the claim is about what the LOFT side saw. The verdict sentence is
// composed inside `ping.loft` and only transported here.
//
// ⚠ THE CHROME FLAGS AND THE PID SWEEP ARE `probe/b1/browser_shot.mjs`'s, kept in
// step on purpose: this box runs other agents' browsers, so a port is not an
// identity and a stray headless Chrome is somebody's core.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIR = process.argv[2];
if (!DIR) { console.error('usage: drive.mjs <dir-with-ping.html>'); process.exit(2); }

const CDP = 9367, PORT = 18572, WIN = '900,600';
const MIME = { '.html': 'text/html', '.wasm': 'application/wasm', '.js': 'text/javascript' };

const server = createServer(async (req, res) => {
  try {
    const p = join(DIR, req.url === '/' ? '/ping.html' : req.url.split('?')[0]);
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('no'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('P2 SKIP — no chrome'); server.close(); process.exit(2); }

for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
  const pid = Number(line.split(/\s+/)[0]);
  if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
    try { process.kill(pid); } catch { /* already gone */ }
  }
}

const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--mute-audio', '--hide-scrollbars',
  `--window-size=${WIN}`, 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdpJson = async (path) => {
  for (let i = 0; i < 100; i++) {
    try { return await (await fetch(`http://127.0.0.1:${CDP}${path}`)).json(); }
    catch { await sleep(100); }
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

const done = async (code, msg) => {
  console.log(msg);
  try { proc.kill(); } catch {}
  server.close();
  process.exit(code);
};

await call('Page.enable');
await call('Runtime.enable');
await call('Page.navigate', { url: `http://127.0.0.1:${PORT}/ping.html` });

// ⚠ POLL FOR THE EVIDENCE, NEVER SLEEP A FIXED TIME. A gate that sleeps reports
// the machine — this tree's `L5` finding, and the reason `walk`/`hipskin` were
// rewritten. The evidence here is the RESULT line the loft program prints; until
// it appears there is nothing to judge.
let text = '';
for (let i = 0; i < 200; i++) {
  const r = await call('Runtime.evaluate', {
    expression: `(document.getElementById('out')||{}).textContent || ''`,
    returnByValue: true,
  });
  text = r?.result?.value ?? '';
  if (text.includes('P2 RESULT')) break;
  await sleep(100);
}

// What JS itself observed, as a SECOND instrument. If the page never called our
// loftOutput at all, `seen` is empty and the loft side would report three empty
// answers — two different sentences for two different failures.
const seen = (await call('Runtime.evaluate', {
  expression: `JSON.stringify(globalThis.__p2 || null)`, returnByValue: true,
}))?.result?.value ?? 'null';

console.log(`P2 page said: ${JSON.stringify(text.trim())}`);
console.log(`P2 js saw:    ${seen}`);

if (!text.includes('P2 RESULT')) {
  await done(1, 'P2 FAIL — the page never printed a RESULT line (loft never ran, or host_print is dead)');
}
if (!text.includes('P2 RESULT ok')) {
  await done(1, 'P2 FAIL — the round trip did not behave: see the A/B/C lines above');
}
if (seen === 'null') {
  await done(1, 'P2 FAIL — loft reported ok but our loftOutput was never called: the verdict is not about the channel');
}
await done(0, 'P2 PASS — host_output -> JS -> loftPush round-trips in a --html page, with OUR js');
