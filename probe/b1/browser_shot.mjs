// B1.1's browser half — does the text bridge reach the CANVAS under `--html`?
//
// This is the half that was actually broken until 2026-08-03, and the half a
// desktop run cannot answer: the desktop backend rasterises with fontdue, the
// browser with a 2D-canvas `fillText`, and they are separate implementations of
// the same six builtins. #18's whole B1 arc assumes the browser one works.
//
// ⚠ THE FLAGS ARE NOT NEGOTIABLE, and the comment in tools/script.mjs is why:
// with `--use-gl=swiftshader` (the older spelling) Chrome gives a WebGL2 context
// that DRAWS -- readPixels returns a full picture -- and COMPOSITES nothing, so
// captureScreenshot returns the DOM over white. Two blank PNGs came out of that
// once. `--use-gl=angle --use-angle=swiftshader` is the pair that works.
//
// ⚠ AND THE SHOT IS CLIPPED TO THE CANVAS, not to the viewport. The probe's
// control is "the right half of the CANVAS is empty"; measuring the right half
// of the PAGE would include the page background and answer a different question.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIR = process.argv[2];
const OUT = process.argv[3];
if (!DIR || !OUT) { console.error('usage: browser_shot.mjs <dir-with-html> <out.png>'); process.exit(2); }

// A port band of our own, and identity by window size — this box runs other
// agents' browsers and a port number is not an identity (run-gates.sh's rule).
const CDP = 9366, PORT = 18571, WIN = '900,400';
const PAGE = '/text_gl.html';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm',
               '.png': 'image/png', '.json': 'application/json' };

const server = createServer(async (req, res) => {
    try {
        const p = join(DIR, decodeURIComponent(req.url.split('?')[0]));
        const body = await readFile(p);
        res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
        res.end(body);
    } catch { res.writeHead(404); res.end('no'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
    .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('B1.1-html SKIP — no chrome'); server.close(); process.exit(2); }

for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
    const pid = Number(line.split(/\s+/)[0]);
    if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
        try { process.kill(pid); } catch { /* already gone */ }
    }
}

const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
    '--no-sandbox', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader',
    '--mute-audio', '--hide-scrollbars', `--window-size=${WIN}`, 'about:blank'],
    { stdio: 'ignore' });

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

const fail = async (msg) => {
    console.error(`B1.1-html FAIL — ${msg}`);
    try { proc.kill(); } catch {}
    server.close(); process.exit(1);
};

await call('Page.enable');
await call('Runtime.enable');
await call('Page.navigate', { url: `http://127.0.0.1:${PORT}${PAGE}` });

// ⚠ WAIT FOR THE CANVAS TO EXIST AND BE NON-EMPTY, NOT FOR A CLOCK. A fixed
// sleep is how this tree wrote two blank PNGs and read them as a broken
// renderer. The probe clears to BLACK, so "drawn" here means the canvas is
// present, sized, and not the white page background.
let rect = null;
for (let i = 0; i < 150; i++) {
    const r = await call('Runtime.evaluate', { returnByValue: true, expression:
        `(() => { const c = document.querySelector('canvas');
                  if (!c) return null;
                  const b = c.getBoundingClientRect();
                  return { x: b.x, y: b.y, w: b.width, h: b.height }; })()` });
    const v = r?.result?.value;
    if (v && v.w > 0 && v.h > 0) { rect = v; break; }
    await sleep(100);
}
if (!rect) await fail('no canvas on the page after 15s');

// Give the program a few frames to draw into it.
await sleep(1500);

const shot = await call('Page.captureScreenshot', {
    format: 'png',
    clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 },
    captureBeyondViewport: true,
});
if (!shot?.data) await fail('captureScreenshot returned nothing');
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log(`B1.1-html wrote ${OUT} (canvas ${rect.w}x${rect.h})`);

// ⚠ THE PROGRAM'S OWN OUTPUT, WHICH IS INVISIBLE BY DEFAULT. `gl_create_window`
// sets the `<pre>` that `println` writes to `display:none`, so a probe that
// reports its findings in text says them to nobody. Read it back out.
const out = await call('Runtime.evaluate', { returnByValue: true, expression:
    `(() => { const p = document.querySelector('pre');
              return p ? p.textContent : '(no <pre> on the page)'; })()` });
console.log('  --- the program said ---');
for (const l of String(out?.result?.value ?? '').split('\n')) {
    if (l.trim()) console.log(`  | ${l}`);
}

// What the browser would give for a REAL monospace request, for comparison with
// what the .ttf path actually resolved to above.
const m = await call('Runtime.evaluate', { returnByValue: true, expression:
    `(() => { const c = document.createElement('canvas').getContext('2d');
              const w = (f, s) => { c.font = '32px ' + f; return c.measureText(s).width; };
              return { mono_M: w('monospace','MMMMMMMMMM'), mono_i: w('monospace','iiiiiiiiii'),
                       dejavu_M: w('DejaVuSansMono','MMMMMMMMMM'),
                       dejavu_i: w('DejaVuSansMono','iiiiiiiiii') }; })()` });
console.log(`  browser families at 32px: ${JSON.stringify(m?.result?.value)}`);

try { proc.kill(); } catch {}
server.close();
process.exit(0);
