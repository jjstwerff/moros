// Drive `probe/b1c/parts.loft` as a PAGE, with `data/parts/` injected as its base
// tree, and compare what it lists against the interpreter's answer for the real
// directory.
//
// ⚠ THE ORACLE IS THE OTHER TARGET, never a number typed here — loft#851's contract
// is *the page answers what --interpret answers*, and `P6` established this shape.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DIR = 'probe/b1c/.loft';
const PARTS = resolve('data/parts');

// The tree, as the build will bake it: every file under an absolute root.
const base = {};
const walk = (dir, at) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, `${at}/${e}`);
    else base[`${at}/${e}`] = readFileSync(p).toString('base64');
  }
};
walk(PARTS, '/data/parts');
console.log(`injecting ${Object.keys(base).length} files under /data/parts`);

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('SKIP — no chrome'); process.exit(2); }
const CDP = 9376;
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--mute-audio', `--user-data-dir=${resolve('probe/b1c/.chrome-parts')}`,
  '--window-size=600,400', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
// ⚠ AHEAD OF LOFT'S SCRIPT — the filesystem is built at boot, so a tree handed over
// afterwards is one nobody ever looks at, and it fails as an ABSENT file.
await call('Page.addScriptToEvaluateOnNewDocument', { source:
  `globalThis.loftBaseFS = (() => { const b = ${JSON.stringify(base)}, o = {};
     for (const k in b) { const s = atob(b[k]); const u = new Uint8Array(s.length);
       for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); o[k] = u; }
     return o; })();` });
await call('Page.navigate', { url: `file://${resolve(DIR, 'parts.html')}` });

let text = '';
for (let i = 0; i < 300; i++) {
  text = (await call('Runtime.evaluate', {
    expression: `(document.getElementById('out')||{}).textContent || ''`, returnByValue: true,
  }))?.result?.value ?? '';
  if (text.includes('PARTS DONE')) break;
  await sleep(100);
}
for (const l of text.split('\n')) if (/^PARTS (relative|absolute) '/.test(l)) console.log('  page: ' + l);
const abs = +(text.match(/^PARTS absolute '.*' -> (\d+)$/m)?.[1] ?? -1);
try { proc.kill(); } catch {}
console.log(abs > 0 ? `PAGE LISTED ${abs} parts off its base tree`
                    : `PAGE LISTED NOTHING (absolute -> ${abs})`);
process.exit(abs > 0 ? 0 : 1);
