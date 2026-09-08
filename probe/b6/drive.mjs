// Plan 26 `B6` — THE PLAN ON THE PAGE, AND A PICK ON IT: the browser half.
//
//   node probe/b6/drive.mjs <url>        (run.sh is the caller; `make probe-b6`)
//
// Opens the demo from `file://`, waits until it is on its own, and drives one
// sentence: open the plan, click a cell, raise it, close the plan, raise again.
// Every row reads the DOM the page holds — the SVG the client handed the page —
// and the client's own console, never a number this script computed.
//
// ⚠ THE CLICK IS A REAL CLICK AT A POINT READ OFF THE PICTURE. The target cell's
// polygon is found in the DOM, its centre taken from `getBoundingClientRect`, and
// the mouse dispatched THERE — so the page's own `getScreenCTM` inverse, the
// client's `plan_pick` and the SVG's `viewBox` are all in the loop. A pick pushed
// straight into `loftPush` would prove the client and skip the page.
//
// ⚠ AND THE VERDICT ON A PICK IS THE HIGHLIGHT, NOT THE SENTENCE. `polygon.aimcell`
// is what the client drew back into the picture after resolving the point; the
// console line is quoted beside it, and the two have to agree with the cell that
// was clicked. `probe/b1b/press.mjs` is the driver this is cut from.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2];
if (!url) { console.error('usage: drive.mjs <url>'); process.exit(2); }
const waitMs = 90000, holdMs = 120, gapMs = 600;

const KEYS = {
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', vk: 38 },
};
const describe = (k) => KEYS[k]
  ?? { key: k, code: 'Key' + k.toUpperCase(), vk: k.toUpperCase().charCodeAt(0), text: k };

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find((c) => spawnSync('which', [c]).status === 0);
if (!chrome) { console.error('B6 SKIP — no chrome'); process.exit(2); }

// ⚠ ITS OWN PORT AND ITS OWN WINDOW SIZE, so the sweep below kills only its own
// leftovers: this box runs other agents' browsers.
const CDP = 9376, WIN = '1100,760';
for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                              { encoding: 'utf8' }).stdout ?? '').split('\n')) {
  const pid = Number(line.split(/\s+/)[0]);
  if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
    try { process.kill(pid); } catch { /* already gone */ }
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
    if (t.includes('[plan]')) notes.push('[console] ' + t);
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
const ok = (row, msg) => console.log(`B6 ${row} ok    ${msg}`);
const fail = (row, msg) => { bad += 1; console.log(`B6 ${row} FAIL  ${msg}`); };
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
// Wait until the transcript holds at least `n` lines carrying `s`.
const awaitLines = async (s, n, what) => {
  for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
    if ((await linesWith(s)).length >= n) return true;
    await sleep(250);
  }
  console.log(`B6 wait  the page never said '${s}' ×${n} (${what})`);
  return false;
};
const press = async (k) => {
  const d = describe(k);
  await call('Input.dispatchKeyEvent', { type: d.text ? 'keyDown' : 'rawKeyDown',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk,
    ...(d.text ? { text: d.text } : {}) });
  await sleep(holdMs);
  await call('Input.dispatchKeyEvent', { type: 'keyUp',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk });
  await sleep(gapMs);
};
const clickAt = async (x, y) => {
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  await sleep(60);
  await call('Input.dispatchMouseEvent',
    { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(gapMs);
};
// What the page holds: the overlay's state and the SVG's own attributes.
const planState = async () => await evalJs(`(() => {
  const b = document.getElementById('plan');
  if (!b) return { present: false };
  const s = b.querySelector('svg');
  const aim = b.querySelector('polygon.aimcell');
  const who = b.querySelector('circle.author');
  const cap = [...b.querySelectorAll('text')].map((t) => t.textContent).join(' | ');
  return { present: true, hidden: !!b.hidden, svg: !!s,
           cells: b.querySelectorAll('polygon.cell').length,
           marks: b.querySelectorAll('line.edge').length,
           aim: aim ? [aim.dataset.q, aim.dataset.r].join(',') : '',
           who: who ? who.getAttribute('cx') + ',' + who.getAttribute('cy') : '',
           caption: cap };
})()`);
// ⚠ EVERY PICTURE IS KEPT, in `probe/b6/out/<tag>.svg` — a row that fails on a
// number should leave the picture the number was read from; and the raised cells
// are listed beside it, because *which cell moved* is the whole of rows D and E.
const dump = async (tag) => {
  const svg = await evalJs(`(document.getElementById('plan')||{}).innerHTML || ''`);
  fs.writeFileSync(`probe/b6/out/${tag}.svg`, svg ?? '');
  const up = await evalJs(`[...document.querySelectorAll("#plan polygon.cell")]
    .filter((p) => p.dataset.h !== '0').map((p) => p.dataset.q + ',' + p.dataset.r + ':' + p.dataset.h).join(' ')`);
  console.log(`picture ${tag}: ${(svg ?? '').length} bytes, cells off the ground: ${up || '(none)'}`);
  // And what a person sees — the overlay over the canvas, the whole window.
  const cap = await call('Page.captureScreenshot', { format: 'png' });
  if (cap?.data) fs.writeFileSync(`probe/b6/out/${tag}.png`, Buffer.from(cap.data, 'base64'));
};
const cellH = async (q, r) => await evalJs(
  `(document.querySelector("#plan polygon.cell[data-q='${q}'][data-r='${r}']")||{dataset:{}}).dataset.h ?? null`);
const cellCentre = async (q, r) => await evalJs(`(() => {
  const p = document.querySelector("#plan polygon.cell[data-q='${q}'][data-r='${r}']");
  if (!p) return null; const b = p.getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url });

// ── A  the page boots and decides it is on its own ──────────────────────────
if (!(await awaitLines('lavition editor client', 1, 'boot'))) await bye(1, 'B6 FAIL — the client never booted');
if (!(await awaitLines('no server answered', 1, 'local mode'))) await bye(1, 'B6 FAIL — the page never went local');
ok('A', 'the page booted from file:// and edits its own world');

// Focus: keydown is bound to the canvas.
const crect = await evalJs(`(() => { const c = document.getElementById('c'); if (!c) return null;
  const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`)
  ?? { x: 0, y: 0, w: 800, h: 600 };
await clickAt(Math.max(8, Math.min(crect.x + crect.w * 0.6, 1000)),
              Math.max(8, Math.min(crect.y + crect.h * 0.6, 700)));

// ── B  `m` puts the plan on the page ────────────────────────────────────────
const before = await planState();
if (before.present && !before.hidden) fail('B0', 'the overlay was up before any key was pressed');
else ok('B0', 'no plan on the page before the key');
await press('m');
if (!(await awaitLines('client: plan — q', 1, 'the first plan'))) await bye(1, 'B6 FAIL — `m` drew no plan');
await sleep(400);
const planLine = (await linesWith('client: plan — q')).at(-1);
const st1 = await planState();
await dump('1-open');
if (st1.present && !st1.hidden && st1.svg && st1.cells === 289) {
  ok('B1', `the overlay holds an SVG of ${st1.cells} cells (17×17), ${st1.marks} marks`);
} else {
  fail('B1', `overlay present=${st1.present} hidden=${st1.hidden} svg=${st1.svg} cells=${st1.cells} — wanted 289 cells on show`);
}
// The window the client says it drew, so the target cell is named off ITS line.
const wm = planLine?.match(/q (-?\d+)\.\.(-?\d+) r (-?\d+)\.\.(-?\d+)/);
if (!wm) await bye(1, `B6 FAIL — the plan line names no window: ${planLine}`);
const cq = (Number(wm[1]) + Number(wm[2]) - 1) / 2, cr = (Number(wm[3]) + Number(wm[4]) - 1) / 2;
// ⚠ AN EVEN ROW OFFSET, ON PURPOSE. The lattice is pointy-top odd-r, so a shape
// moved by an odd number of rows is not a translation in (q,r) — the first target,
// (+2,+1), made the two rings different shapes and the row read as a miss. Two rows
// down, a ring is the same ring shifted, key for key.
const tq = cq + 2, tr = cr + 2;
if (st1.caption.includes(`cells ${st1.cells}`)) ok('B2', `the caption counts what the DOM holds: ${st1.caption.slice(0, 60)}…`);
else fail('B2', `the caption disagrees with the DOM: ${st1.caption}`);

// ── C  a click on a cell is a pick on that cell ─────────────────────────────
const hT0 = await cellH(tq, tr), hW0 = await cellH(cq, cr);
const at = await cellCentre(tq, tr);
if (!at) await bye(1, `B6 FAIL — no polygon for (${tq},${tr}) in the overlay`);
console.log(`click cell (${tq},${tr}) at viewport ${at.x.toFixed(1)},${at.y.toFixed(1)}`);
await clickAt(at.x, at.y);
const picked = await awaitLines('client: pick (', 1, 'the pick');
const pickLine = picked ? (await linesWith('client: pick (')).at(-1) : '(no pick line)';
if (!picked) fail('C1', `the client never resolved a pick — ${pickLine}`);
else if (pickLine.includes(`(${tq},${tr})`)) ok('C1', pickLine.trim());
else fail('C1', `the pick resolved elsewhere: ${pickLine.trim()} — wanted (${tq},${tr})`);
if (picked) await awaitLines('client: plan — q', 2, 'the redraw with the aim');
await sleep(400);
const st2 = await planState();
await dump('2-pick');
if (st2.aim === `${tq},${tr}`) ok('C2', `the highlight in the picture is (${st2.aim})`);
else fail('C2', `the highlight is '${st2.aim}' — wanted ${tq},${tr}`);
if (st2.who && st2.who === st1.who) ok('C3', `the author marker stayed at ${st2.who} — a pick is not a teleport`);
else fail('C3', `the author marker moved ${st1.who} → ${st2.who}`);

// ── D  a verb lands on the pick, and not under the feet ─────────────────────
//
// ⚠ THE VERB IS `fence`, AND THE INVARIANT IS `probe/plan`'s: *pick + verb* is
// *stand there + verb*. The first driver pressed `raise` and read the picked
// cell's height — and `raise_ahead` lands `PEAK_AHEAD` hexes along the FACING, so
// the bump appeared six cells east of the pick and the row read as a miss. A row
// that assumes a verb's reach is a second copy of the verb; what a pick changes is
// WHERE THE AUTHOR IS, so the measurement is the ring's centre against the pick,
// and the same ring from the feet against the feet — a difference the reach
// cancels out of.
const marks = async () => await evalJs(`[...document.querySelectorAll("#plan line.edge")]
  .map((l) => l.dataset.q + ',' + l.dataset.r + ',' + l.dataset.slot)`) ?? [];
const centroid = (keys) => {
  let q = 0, r = 0;
  for (const k of keys) { const [a, b] = k.split(',').map(Number); q += a; r += b; }
  return keys.length ? { q: q / keys.length, r: r / keys.length } : null;
};
const m0 = await marks();
const fences0 = (await linesWith('client: local fence')).length;
await press('f');
if (!(await awaitLines('client: local fence', fences0 + 1, 'the fence'))) fail('D0', '`f` fenced nothing');
await awaitLines('client: plan — q', 3, 'the redraw after the fence');
await sleep(400);
await dump('3-fenced');
const m1 = await marks();
const ring1 = m1.filter((k) => !m0.includes(k));
const c1 = centroid(ring1);
if (ring1.length > 0 && c1) ok('D1', `the fence from the pick wrote ${ring1.length} marks into the picture, centred (${c1.q.toFixed(2)},${c1.r.toFixed(2)})`);
else fail('D1', `no new marks in the picture after the fence (${m1.length} total)`);
const hW1 = await cellH(cq, cr);
if (hW1 === hW0) ok('D2', `the cell under the feet (${cq},${cr}) is untouched`);
else fail('D2', `the cell under the feet changed ${hW0} → ${hW1}`);

// ── E  closing the plan drops the target ────────────────────────────────────
await press('m');
if (!(await awaitLines('client: plan — closed', 1, 'the close'))) fail('E0', '`m` did not close the plan');
await sleep(300);
const st3 = await planState();
if (st3.present && st3.hidden) ok('E1', 'the overlay is hidden');
else fail('E1', `overlay present=${st3.present} hidden=${st3.hidden} after close`);
await press('f');
await awaitLines('client: local fence', fences0 + 2, 'the second fence');
await press('m');
await awaitLines('client: plan — q', 4, 'the plan re-opened');
await sleep(400);
await dump('4-reopened');
const m2 = await marks();
const ring2 = m2.filter((k) => !m1.includes(k));
const c2 = centroid(ring2);
if (ring2.length > 0 && c2) ok('E2', `with the plan closed the fence wrote ${ring2.length} marks, centred (${c2.q.toFixed(2)},${c2.r.toFixed(2)})`);
else fail('E2', `no new marks after a fence with no pick (${m2.length} total)`);
// The one claim: the ring from the pick is the ring from the feet, MOVED BY THE PICK.
// ⚠ AS A SET OF EDGES, NOT AS A COUNT — the two rings overlap (the pick is four cells
// from the feet and a fence reaches three), so the second ring's NEW marks are fewer
// than the first's by exactly the shared ones, and a count or a centroid reads that as
// a different ring. Translate the first ring by the pick offset: every edge it names
// must be in the picture after the second fence, and every edge the second fence
// added must be one it names.
const shift = (keys, dq, dr) => keys.map((k) => { const [q, r, sl] = k.split(',').map(Number);
  return `${q + dq},${r + dr},${sl}`; });
const expect = shift(ring1, cq - tq, cr - tr);
const missing = expect.filter((k) => !m2.includes(k));
const extra = ring2.filter((k) => !expect.includes(k));
if (ring1.length && expect.some((k) => !ring1.includes(k))) ok('E3a', `the control: moved by (${cq - tq},${cr - tr}) the ring is a different set of edges`);
else fail('E3a', 'the moved ring is the same set — the pick offset is zero and E3 could not fail');
if (ring1.length && !missing.length && !extra.length) {
  ok('E3', `pick + fence is stand-there + fence: all ${expect.length} edges of the first ring, moved by the pick, are the second ring (${ring2.length} new, the rest shared)`);
} else {
  fail('E3', `${missing.length} edges of the moved ring are absent and ${extra.length} unexpected edges were written — e.g. ${missing.slice(0, 3).join(' ')} / ${extra.slice(0, 3).join(' ')}`);
}

await bye(bad ? 1 : 0, bad ? `B6 RESULT ${bad} FAILED` : 'B6 RESULT ok');
