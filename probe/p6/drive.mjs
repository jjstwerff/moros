// P6's browser half — does the page's filesystem survive a RELOAD?
//
//   node probe/p6/drive.mjs <http|file> <dir-with-store.html>
//
// It loads the page TWICE and reads the verdict out of the page's OWN `<pre
// id="out">`, which is where `loft_host_print` writes. The first load must say
// `pass1 ok` — the world was built, saved and read back inside one run — and the
// second must say `pass2 ok`, which it can only reach by finding a file no code
// in that document wrote.
//
// ⚠ THE STAMP IS WHAT TELLS TWO FAILURES APART, and its value was MEASURED
// rather than argued. A stamp is put on the document before navigating and the
// second load is not believed until that stamp is GONE — a new document is a
// fact about the JS realm, not about what is on screen. Run
// `P6_SABOTAGE=noreload,nostamp` and the driver reports *"the reloaded page found
// NO file: the delta did not survive"* — a DRIVER bug wearing a product failure's
// clothes, with `delta bytes 11092` printed directly above it contradicting the
// verdict. With the stamp the same run says *"the second load never printed a
// RESULT line"*, which points where the fault is.
//
// ⚠ AND IT IS NOT WHAT MAKES THE PASSING RUN CORRECT — that was measured too.
// `P6_SABOTAGE=nostamp` passes three times out of three: `Page.navigate` returns
// after the commit, so the old document's `<pre>` is already gone by the first
// poll. The race the stamp guards did not reproduce; it is kept because a
// misdiagnosis costs more than one `Runtime.evaluate`.
//
// ⚠ AND A FRESH PROFILE PER RUN, because `localStorage` is what is being
// measured. A leftover delta from an earlier run makes the FIRST load take the
// pass-2 branch, which reads as a pass and says nothing about this build.
//
// ⚠ THE CHROME FLAGS AND THE PID SWEEP ARE `probe/p2/drive.mjs`'s, kept in step
// on purpose: this box runs other agents' browsers, so a port is not an identity
// and a stray headless Chrome is somebody's core.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const SCHEME = process.argv[2];
const DIR = process.argv[3];
// What `--interpret` printed for the base-tree line, handed in so the ORACLE is
// the other target rather than a string typed twice. Optional: without it the
// base tree is still injected and reported, just not compared.
const EXPECT_BASE = process.argv[4] ?? '';
if (!DIR || (SCHEME !== 'http' && SCHEME !== 'file')) {
  console.error('usage: drive.mjs <http|file> <dir-with-store.html> [expected-base-line]');
  process.exit(2);
}

// ⚠ THE BASE TREE IS THE PAGE'S HALF OF `data/parts/`. The interpreter reads
// `probe/p6/base/` off the disk; the page is GIVEN the same bytes here. Keep the
// two in step — the claim is that they answer identically, so a difference in the
// fixture would read as a difference in the target.
const BASE_FS = { '/base/hello.txt': 'hello from the base tree\n' };

const CDP = 9368, PORT = 18573, WIN = '900,600';
const MIME = { '.html': 'text/html', '.wasm': 'application/wasm', '.js': 'text/javascript' };

let server = null;
let URL_ = `file://${resolve(DIR, 'store.html')}`;
if (SCHEME === 'http') {
  server = createServer(async (req, res) => {
    try {
      const p = join(DIR, req.url === '/' ? '/store.html' : req.url.split('?')[0]);
      const body = await readFile(p);
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('no'); }
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  URL_ = `http://127.0.0.1:${PORT}/store.html`;
}

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error(`P6 SKIP — no chrome`); server?.close(); process.exit(2); }

for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
  const pid = Number(line.split(/\s+/)[0]);
  if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
    try { process.kill(pid); } catch { /* already gone */ }
  }
}

// ⚠ THE PROFILE DIR LIVES BESIDE THE PROBE, NOT IN `/tmp`. The chromium here is a
// SNAP, and a snap has its own private `/tmp` — a `--user-data-dir` under the real
// one leaves the browser with no devtools port and the driver hanging on a socket
// that will never open. Measured: the identical flags with a repo-local profile
// answer `/json/version` in 6 s.
const profile = await mkdtemp(resolve(DIR, '..', '.chrome-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--mute-audio', '--hide-scrollbars', `--user-data-dir=${profile}`,
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
const evalJs = async (expression) => (await call('Runtime.evaluate',
  { expression, returnByValue: true, awaitPromise: false }))?.result?.value;

const label = `P6 ${SCHEME}`;
// ⚠ WAIT FOR THE BROWSER TO ACTUALLY EXIT BEFORE REMOVING ITS PROFILE. Removing
// it beside a live process leaves half a profile behind — measured, two of them
// in the tree after the first runs — because chromium is still writing `Local
// State` and its caches while the `rm` walks them.
const done = async (code, msg) => {
  console.log(msg);
  try { proc.kill(); } catch { /* already gone */ }
  await Promise.race([
    new Promise((r) => proc.once('exit', r)),
    sleep(3000),
  ]);
  server?.close();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
};

await call('Page.enable');
await call('Runtime.enable');

// ── The sabotages, so the run above is known to be able to go red ────────────
// Comma-separated; they compose.
//
//   P6_SABOTAGE=persist    the host keeps its delta in memory for the tab's
//                          lifetime instead of writing it. Everything inside one
//                          run still works; only the RELOAD half can see it — so
//                          this is the control for the claim, not for the wiring.
//                          ⚠ SEEN RED: `pass1 ok` twice, and `delta bytes -1`
//                          from the second instrument for the same reason.
//   P6_SABOTAGE=noreload   the second navigate is skipped. ⚠ SEEN RED — and with
//                          `nostamp` beside it, red for the WRONG reason, which
//                          is the measurement that earns the stamp.
//   P6_SABOTAGE=nostamp    the second load is read without waiting for a new
//                          document. Passes on its own; see the header.
const SAB = new Set((process.env.P6_SABOTAGE ?? '').split(',').filter(Boolean));
const SABOTAGE = { has: (k) => SAB.has(k) };

// The base tree, supplied the way a built `_site/index.html` will supply it — a
// global defined before loft boots. ⚠ `nobase` is its control: with the tree
// withheld the page must say `base file MISSING`, so a page that reported a size
// no matter what would be caught.
if (!SABOTAGE.has('nobase')) {
  await call('Page.addScriptToEvaluateOnNewDocument',
             { source: `globalThis.loftBaseFS = ${JSON.stringify(BASE_FS)};` });
}
if (SABOTAGE.has('persist')) {
  await call('Page.addScriptToEvaluateOnNewDocument',
             { source: `globalThis.loftFSPersist = false;` });
  console.log(`${label} SABOTAGE persist — the delta is never written to localStorage`);
}
if (SABOTAGE.has('noreload')) {
  console.log(`${label} SABOTAGE noreload — the second navigate is skipped`);
}

// ⚠ POLL FOR THE EVIDENCE, NEVER SLEEP A FIXED TIME — this tree's `L5` finding.
// The evidence is the RESULT line the loft program prints; until it appears there
// is nothing to judge. `fresh` additionally requires the stamp to be gone, which
// is what makes a reload a measurement rather than an assumption.
const awaitResult = async (fresh) => {
  for (let i = 0; i < 300; i++) {
    if (fresh && (await evalJs(`globalThis.__p6_stamp ?? null`)) !== null) { await sleep(100); continue; }
    const text = await evalJs(`(document.getElementById('out')||{}).textContent || ''`) ?? '';
    if (text.includes('P6 RESULT')) return text;
    await sleep(100);
  }
  return '';
};

await call('Page.navigate', { url: URL_ });
const first = await awaitResult(false);
console.log(`${label} load 1: ${JSON.stringify(first.trim())}`);
if (!first.includes('P6 RESULT')) {
  await done(1, `${label} FAIL — the first load printed no RESULT line (loft never ran)`);
}
if (!first.includes('P6 RESULT pass1 ok')) {
  await done(1, `${label} FAIL — the page has no working filesystem within one run`);
}

// The base tree, against what the INTERPRETER printed for the same program.
if (EXPECT_BASE) {
  // ⚠ The program prefixes every line with `P6`, so the match is on the SUBSTRING
  // from `base file` onward — a `startsWith` here reported `null` against a line
  // that was present and correct, which reads as a failure of the target.
  const raw = first.split('\n').find((l) => l.includes('base file'));
  const line = raw ? raw.slice(raw.indexOf('base file')).trim() : null;
  console.log(`${label} base: ${JSON.stringify(line ?? null)}  (interpreter: ${JSON.stringify(EXPECT_BASE)})`);
  if (line !== EXPECT_BASE) {
    await done(1, `${label} FAIL — the page's base tree does not read as the interpreter's directory`);
  }
}

// The host half, as a SECOND instrument, blind in the other direction: the loft
// print says the program's calls answered, this says the delta reached storage.
const delta = await evalJs(
  `(() => { try { const v = localStorage.getItem(globalThis.loftFSKey || 'loft-fs-delta');
                  return v === null ? -1 : v.length; } catch (e) { return -2; } })()`);
console.log(`${label} delta bytes in localStorage: ${delta}`);

await evalJs(`globalThis.__p6_stamp = 'before-reload'`);
if (!SABOTAGE.has('noreload')) { await call('Page.navigate', { url: URL_ }); }
const second = await awaitResult(!SABOTAGE.has('nostamp'));
console.log(`${label} load 2: ${JSON.stringify(second.trim())}`);

if (!second.includes('P6 RESULT')) {
  await done(1, `${label} FAIL — the second load never printed a RESULT line`);
}
if (second.includes('P6 RESULT pass1')) {
  await done(1, `${label} FAIL — the reloaded page found NO file: the delta did not survive`);
}
if (!second.includes('P6 RESULT pass2 ok')) {
  await done(1, `${label} FAIL — the file survived but its contents did not`);
}
if (delta <= 0) {
  await done(1, `${label} FAIL — loft says pass2 but localStorage held nothing: the verdict is not about storage`);
}
await done(0, `${label} PASS — a world saved in a page is still there after a reload`);
