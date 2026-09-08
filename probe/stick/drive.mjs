// CONTROLS §6 `C1`/`C2` — THE STICKS ON THE PAGE, AND A KEYBOARD SHAPED LIKE THEM.
//
//   node probe/stick/drive.mjs <url>        (run.sh is the caller; `make probe-stick`)
//
// Opens the demo from `file://`, waits until it is on its own, and installs a FAKE
// GAMEPAD — `navigator.getGamepads` replaced with a function returning one pad whose
// axes this driver sets — so the page's own reader (deadzone, rounding, push on
// change) runs exactly as it would with a cable in. Then it drives the sticks, the
// keyboard and the mouse in turn and reads the walker's OWN line for every claim:
// `client: local walker — N steps, yaw Y (turned T), walked W at (x,z) …`.
//
// ⚠ EVERY ROW IS A DIFFERENCE BETWEEN TWO WALKER LINES, and a line is printed every
// ~300 frames or when the picture moves — so a row waits for a line that was printed
// AFTER its input, never reads the last one. A row that read the standing line would
// credit a stick with a walk that happened before it was tilted.
import { spawn, spawnSync } from 'node:child_process';

const url = process.argv[2];
if (!url) { console.error('usage: drive.mjs <url>'); process.exit(2); }
const waitMs = 90000, holdMs = 120, gapMs = 400;

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('STICK SKIP — no chrome'); process.exit(2); }
const CDP = 9377, WIN = '1100,760';
for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
  const pid = Number(line.split(/\s+/)[0]);
  if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
    try { process.kill(pid); } catch { /* gone */ }
  }
}
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--enable-unsafe-swiftshader',
  '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio', '--hide-scrollbars',
  `--window-size=${WIN}`, 'about:blank'], { stdio: 'ignore' });
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
  } else if (m.method === 'Runtime.consoleAPICalled') {
    const t = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    if (t.includes('[pad]')) notes.push('[console] ' + t);
  }
});
const call = (method, params = {}) => new Promise((res) => {
  const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
});
const evalJs = async (expression) => (await call('Runtime.evaluate',
  { expression, returnByValue: true }))?.result?.value;
const out = async () => (await evalJs(`(document.getElementById('out')||{}).textContent || ''`)) ?? '';
const linesWith = async (s) => (await out()).split('\n').filter((l) => l.includes(s));

let bad = 0;
const ok = (row, msg) => console.log(`STICK ${row} ok    ${msg}`);
const fail = (row, msg) => { bad += 1; console.log(`STICK ${row} FAIL  ${msg}`); };
const bye = async (code, msg) => {
  const t = await out().catch(() => '');
  if (notes.length) console.log(notes.join('\n'));
  console.log('--- transcript ---');
  console.log(t);
  console.log(msg);
  try { ws.close(); } catch { /* closed */ }
  try { proc.kill(); } catch { /* gone */ }
  process.exit(code);
};
const awaitLines = async (s, n) => {
  for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
    if ((await linesWith(s)).length >= n) return true;
    await sleep(250);
  }
  return false;
};
// The walker, read off its own line — and only a line printed after `since` lines.
const WALK = 'client: local walker — ';
const walker = async (since) => {
  if (!(await awaitLines(WALK, since + 1))) return null;
  const l = (await linesWith(WALK)).at(-1);
  const m = l.match(/(\d+) steps, yaw (-?[\d.]+) \(turned (-?[\d.]+)\), walked (-?[\d.]+) at \((-?[\d.]+),(-?[\d.]+)\)/);
  if (!m) return null;
  return { steps: +m[1], yaw: +m[2], turned: +m[3], walked: +m[4], x: +m[5], z: +m[6], line: l.trim() };
};
const walkerCount = async () => (await linesWith(WALK)).length;
const key = async (k, type) => {
  const d = { key: k, code: 'Key' + k.toUpperCase(), vk: k.toUpperCase().charCodeAt(0) };
  await call('Input.dispatchKeyEvent', { type, key: d.key, code: d.code,
    windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk, ...(type === 'keyDown' ? { text: k } : {}) });
};
const pad = async (lx, ly, rx, ry) => {
  await evalJs(`(() => { window.__fakePad.axes = [${lx}, ${ly}, ${rx}, ${ry}]; return true; })()`);
};
const near = (a, b, eps) => Math.abs(a - b) < eps;

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url });
if (!(await awaitLines('lavition editor client', 1))) await bye(1, 'STICK FAIL — the client never booted');
if (!(await awaitLines('no server answered', 1))) await bye(1, 'STICK FAIL — the page never went local');
ok('A', 'the page booted from file:// and edits its own world');

// Focus the canvas: keydown is bound to it.
const crect = await evalJs(`(() => { const c = document.getElementById('c'); if (!c) return null;
  const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`)
  ?? { x: 0, y: 0, w: 800, h: 600 };
const fx = Math.max(60, Math.min(crect.x + crect.w * 0.6, 900)), fy = Math.max(8, Math.min(crect.y + crect.h * 0.6, 700));
await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: fx, y: fy, button: 'left', clickCount: 1, buttons: 1 });
await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: fx, y: fy, button: 'left', clickCount: 1, buttons: 0 });
await sleep(300);

// ── the fake pad ─────────────────────────────────────────────────────────────
const installed = await evalJs(`(() => {
  window.__fakePad = { id: 'probe pad', index: 0, connected: true, mapping: 'standard',
                       axes: [0, 0, 0, 0], buttons: [] };
  navigator.getGamepads = function () { return [window.__fakePad]; };
  return typeof navigator.getGamepads === 'function'; })()`);
if (!installed) await bye(1, 'STICK FAIL — could not install the fake gamepad');
let n0 = await walkerCount();
const w0 = await walker(n0 - 1);
if (!w0) await bye(1, 'STICK FAIL — no walker line to start from');
console.log(`start: ${w0.line}`);

// ── B  the left stick forward walks along the facing ─────────────────────────
let before = w0; let n = await walkerCount();
await pad(0, -1, 0, 0);
await sleep(1500);
await pad(0, 0, 0, 0);
let after = await walker(n);
if (!after) { fail('B1', 'no walker line after the stick'); after = before; }
else if (after.walked > before.walked + 0.5 && after.x > before.x + 0.5 && near(after.z, before.z, 0.05) && near(after.turned, before.turned, 0.001)) {
  ok('B1', `stick forward walked ${(after.walked - before.walked).toFixed(2)} along +x (${before.x.toFixed(2)} → ${after.x.toFixed(2)}), z and yaw unmoved`);
} else fail('B1', `stick forward: walked ${before.walked} → ${after.walked}, x ${before.x} → ${after.x}, z ${before.z} → ${after.z}, turned ${before.turned} → ${after.turned}`);
if ((await linesWith('client: pad — ')).length) ok('B0', 'the client said a controller is speaking');
else fail('B0', 'the client never reported the pad');

// ── C  the left stick sideways STRAFES: z moves, x and yaw do not ────────────
before = after; n = await walkerCount();
await pad(1, 0, 0, 0);
await sleep(1500);
await pad(0, 0, 0, 0);
after = await walker(n);
if (!after) { fail('C1', 'no walker line after the strafe'); after = before; }
else if (Math.abs(after.z - before.z) > 0.5 && near(after.x, before.x, 0.05) && near(after.turned, before.turned, 0.001)) {
  ok('C1', `stick right strafed ${(after.z - before.z).toFixed(2)} along z with x and yaw unmoved — a vector, not a turn`);
} else fail('C1', `stick right: x ${before.x} → ${after.x}, z ${before.z} → ${after.z}, turned ${before.turned} → ${after.turned}`);

// ── D  the right stick TURNS and walks nowhere ───────────────────────────────
before = after; n = await walkerCount();
await pad(0, 0, 1, 0);
await sleep(1000);
await pad(0, 0, 0, 0);
after = await walker(n);
if (!after) { fail('D1', 'no walker line after the turn'); after = before; }
else if (after.turned > before.turned + 0.5 && near(after.x, before.x, 0.01) && near(after.z, before.z, 0.01)) {
  ok('D1', `right stick turned ${(after.turned - before.turned).toFixed(2)} rad and moved nothing`);
} else fail('D1', `right stick: turned ${before.turned} → ${after.turned}, at (${before.x},${before.z}) → (${after.x},${after.z})`);

// ── E  a centred stick moves nothing — the control ───────────────────────────
before = after; n = await walkerCount();
await sleep(1500);
after = await walker(n);
if (!after) { fail('E1', 'no walker line while resting'); after = before; }
else if (near(after.walked, before.walked, 0.001) && near(after.turned, before.turned, 0.001)) {
  ok('E1', 'a centred stick walked and turned nothing');
} else fail('E1', `at rest: walked ${before.walked} → ${after.walked}, turned ${before.turned} → ${after.turned}`);

// ── F  the keyboard is the stick: `d` strafes and does not turn ──────────────
// Face +x first so the strafe reads on z: the yaw is wherever D left it, so this
// compares the DIRECTION of the step against the facing rather than an axis.
before = after; n = await walkerCount();
await key('d', 'keyDown'); await sleep(800); await key('d', 'keyUp');
after = await walker(n);
if (!after) { fail('F1', 'no walker line after d'); after = before; }
else {
  const dx = after.x - before.x, dz = after.z - before.z, dist = Math.hypot(dx, dz);
  const rx = -Math.sin(before.yaw), rz = Math.cos(before.yaw);   // the facing's RIGHT
  const along = dist > 0 ? (dx * rx + dz * rz) / dist : 0;
  if (dist > 0.3 && along > 0.99 && near(after.turned, before.turned, 0.001)) {
    ok('F1', `held d moved ${dist.toFixed(2)} to the facing's right (cos ${along.toFixed(3)}) and turned nothing`);
  } else fail('F1', `held d: moved ${dist.toFixed(2)} with cos-to-right ${along.toFixed(3)}, turned ${before.turned} → ${after.turned}`);
}

// ── G  the mouse is the right stick: a drag turns, locally ───────────────────
before = after; n = await walkerCount();
const px = 44;
await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: fx, y: fy, buttons: 0 });
await sleep(60);
await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: fx, y: fy, button: 'left', clickCount: 1, buttons: 1 });
await sleep(holdMs);
for (let i = 1; i <= 4; i++) {
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: fx + px * i / 4, y: fy, buttons: 1 });
  await sleep(40);
}
await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: fx + px, y: fy, button: 'left', clickCount: 1, buttons: 0 });
await sleep(gapMs);
after = await walker(n);
if (!after) { fail('G1', 'no walker line after the drag'); after = before; }
else if (near(after.turned - before.turned, px * 0.006, 0.03) && near(after.x, before.x, 0.01) && near(after.z, before.z, 0.01)) {
  ok('G1', `a ${px} px drag turned ${(after.turned - before.turned).toFixed(3)} rad (${(px * 0.006).toFixed(3)} at LOOK_PER_PX) and moved nothing`);
} else fail('G1', `drag: turned ${before.turned} → ${after.turned} (wanted +${(px * 0.006).toFixed(3)}), at (${before.x},${before.z}) → (${after.x},${after.z})`);

await bye(bad ? 1 : 0, bad ? `STICK RESULT ${bad} FAILED` : 'STICK RESULT ok');
