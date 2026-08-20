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
import fs from 'node:fs';

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
  // ⚠ `.` NEEDS ITS OWN ROW BECAUSE THE FALLBACK BELOW IS A LETTER HEURISTIC.
  // `'Key' + k.toUpperCase()` yields `Key.`, which is not a code any keyboard
  // sends, and `charCodeAt` gives 46 where the virtual key is 190. Measured: the
  // press was delivered and the client never saw it — the demo placed a HOUSE,
  // which is exactly what "nothing was chosen" looks like, so the miss reads as
  // the feature not working rather than as the driver not pressing.
  // ⚠ `Tab` NEEDS ITS OWN ROW like the arrows: the fallback below is a LETTER
  // heuristic (`'Key' + k.toUpperCase()`), and there is no `KeyTAB`. ⚠ And it takes
  // no `text` — a printable character would make the page insert one.
  Tab:       { key: 'Tab',       code: 'Tab',       vk: 9 },
  // ⚠ `Escape` NEEDS ITS OWN ROW FOR THE ARROWS' REASON — the fallback is a LETTER
  // heuristic and there is no `KeyESCAPE`. It arms rebinding (plan 22 `M3`), and it
  // takes no `text`: a printable character would make the page insert one.
  Escape:    { key: 'Escape',    code: 'Escape',    vk: 27 },
};
// ⛔ **DIGITS ARE NOT LETTERS, AND THE FALLBACK BELOW SILENTLY MADE THEM ONE** — found
// at plan 22 `M3`, the first check in this tree that ever pressed one. `'Key' + '5'` is
// `Key5`, which no keyboard sends; the page's `mapKey` takes the `Key` branch anyway
// and computes `'Key5'.charCodeAt(3) + 32` = **85**, a code that names no key at all.
// So the press was delivered, the client saw nothing, and the transcript read exactly
// like a rebind that does not work. ⚠ Digits matter here specifically because they are
// the only genuinely FREE keys — all 26 letters are taken — so they are what a person
// rebinds ONTO.
const digit = (k) => k.length === 1 && k >= '0' && k <= '9';
const describe = (k) => KEYS[k] ?? (digit(k)
  ? { key: k, code: 'Digit' + k, vk: k.charCodeAt(0), text: k }
  : { key: k, code: 'Key' + k.toUpperCase(), vk: k.toUpperCase().charCodeAt(0), text: k });

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

// ⚠ `--use-gl=angle --use-angle=swiftshader`, NOT `--use-gl=swiftshader`, AND THE
// DIFFERENCE IS THE WHOLE PICTURE. `probe/b1a/drive.mjs` — which this driver was
// copied from — passes the second spelling, and it is fine there because that probe
// reads the SERVER's transcript and never looks at the canvas. Measured here: with
// `--use-gl=swiftshader` the client boots, uploads 49 meshes, runs 300 frames
// without one exception, and `Page.captureScreenshot` comes back a WHITE PAGE — the
// canvas composites transparent. The flags below are `html_render_check.mjs`'s,
// which is the tool in this tree known to photograph a WebGL canvas.
//
// ⚠ AND IT IS A COPIED INSTRUMENT NOBODY AIMED, one more time: `probe/b1a`'s filter
// was blind to half its own step for the same reason. What a driver inherits is
// whatever its parent needed.
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-sandbox', '--enable-unsafe-swiftshader',
  '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio', '--hide-scrollbars',
  `--window-size=${WIN}`, 'about:blank'],
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

// ── THE PICTURE, AND THE TWO REGIONS IT IS READ IN — plan 22 `B1b.2` ─────────
//
// ⚠ THE WHOLE CANVAS CANNOT ANSWER THIS. `html_render_check.mjs` counts distinct
// colours over the entire canvas, and the PANEL is drawn into that same canvas —
// six buttons, a list and two text strips — so a page whose world half is blank
// still counts dozens of colours and passes. The claim here is about the WORLD
// half, so the region is the instrument.
//
// ⚠ AND THE PANEL IS THE POSITIVE CONTROL. A capture that came back black, or a
// decoder that returned 1 for everything, would "prove" a blank world; the panel
// region must be busy in every shot, or the shot says nothing about the world.
//
// ⚠ THE PIXELS ARE THE COMPOSITOR'S, decoded by the browser. A WebGL canvas read
// back with `readPixels` or `toDataURL` comes out BLACK without
// `preserveDrawingBuffer` — this tree has that scar — so the capture is CDP's
// screenshot (what a person would see) and the decode is an `Image` in the page,
// which has nothing to do with the GL context at all.
// ⚠ AND A FLAT GROUND IS ONE COLOUR, WHICH IS WHY THERE ARE THREE REGIONS. The
// first version read a single rectangle in the middle of the world half and
// counted 1 — and the page was drawing perfectly: an unwritten world is a FLAT
// PLANE at one height, lit by a constant ambient, so every pixel of it is the same
// green. `1 colour` there means *the ground is flat*, not *nothing is drawn*, and
// the full-frame capture is what said so. A colour cannot see a horizon unless the
// horizon is inside the frame you handed it.
//
//   world   spans the horizon: sky above, ground below → 2+ colours means DRAWN
//   ground  entirely below it: its checksum is what a gesture has to move
//   panel   the positive control, drawn by a path this step does not touch
const REGIONS = {
  // ⚠ `dy` CLEARS THE SUBJECT BAR, and the sabotage is what found that. The bar
  // is full-canvas-width and 24 px high (`lavition_ui::SUBJECT_HEIGHT`), so a
  // region starting at 20 caught four rows of it — and `AUTH_SABOTAGE=nocam`, a
  // page with no camera at all, passed the *is anything drawn* check on the
  // BAR's colours. An instrument that includes the UI cannot report on the world.
  world:  { dx: 420, dy: 40,  w: 420, h: 200 },
  ground: { dx: 420, dy: 300, w: 420, h: 220 },
  panel:  { dx: 20,  dy: 40,  w: 200, h: 200 },
};

const shot = async (tag) => {
  const rect = (await call('Runtime.evaluate', {
    // ⚠ DOCUMENT COORDINATES, because that is what `captureScreenshot`'s clip is
    // in — `getBoundingClientRect` is viewport-relative, and this canvas is 1200
    // wide in an 1100 window, so the page is scrolled and the rect's x is
    // NEGATIVE. Adding that straight into a clip slides every region left by the
    // scroll, which is how the panel region came back holding half a panel.
    expression: `(() => { const c = document.getElementById('c');
      if (!c) return null; const r = c.getBoundingClientRect();
      return {x: r.x + window.scrollX, y: r.y + window.scrollY,
              w: r.width, h: r.height}; })()`,
    returnByValue: true,
  }))?.result?.value;
  if (!rect) { console.log(`SHOT ${tag} — no canvas`); return; }
  // ⚠ THE RECT IS PRINTED, because every clip below is relative to it. A canvas
  // pushed down the page by the shell's own log element, or scaled by a device
  // pixel ratio, moves every region — and a region that has slid off the viewport
  // captures black, which reads exactly like a world that was never drawn.
  const out = [`rect ${Math.round(rect.x)},${Math.round(rect.y)},` +
               `${Math.round(rect.w)}x${Math.round(rect.h)}`];
  for (const [name, r] of Object.entries(REGIONS)) {
    // ⚠ CLAMPED TO THE DOCUMENT. This canvas's own origin is NEGATIVE — it is
    // wider than the window and the shell centres it — so a region near its left
    // edge starts off the page, and a clip that starts off the page is captured
    // black. Clamping keeps the region on the canvas; it does not move which half
    // of the picture is being read.
    const cap = await call('Page.captureScreenshot', {
      format: 'png',
      clip: { x: Math.max(0, rect.x + r.dx), y: Math.max(0, rect.y + r.dy),
              width: r.w, height: r.h, scale: 1 },
    });
    if (!cap?.data) { out.push(`${name} CAPTURE-FAILED`); continue; }
    // Distinct RGB triples, and a checksum of every pixel. The count says
    // *something is drawn*; the checksum says *it is not the same picture* —
    // a raised patch of ground repaints in colours the frame already had.
    const res = await call('Runtime.evaluate', {
      expression: `new Promise((res) => { const im = new Image();
        im.onerror = () => res('DECODE-FAILED');
        im.onload = () => { const cv = document.createElement('canvas');
          cv.width = im.width; cv.height = im.height;
          const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
          const d = cx.getImageData(0, 0, cv.width, cv.height).data;
          const seen = new Set(); let sum = 0;
          for (let i = 0; i < d.length; i += 4) {
            seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
            sum = (sum * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) >>> 0;
          }
          res(seen.size + ':' + sum); };
        im.src = 'data:image/png;base64,' + ${JSON.stringify(cap.data)}; })`,
      awaitPromise: true, returnByValue: true,
    });
    out.push(`${name} ${res?.result?.value ?? 'NO-RESULT'}`);
    if (process.env.B1B_SHOTS) {
      // ⚠ AND THE WHOLE PAGE BESIDE THE CLIP. A region that captures the page's
      // white background reads as one colour, exactly like a world that was never
      // drawn — and no number in the clip can tell those apart. The full frame is
      // what says WHICH.
      const full = await call('Page.captureScreenshot', { format: 'png' });
      if (full?.data) {
        fs.writeFileSync(`${process.env.B1B_SHOTS}/${tag}-full.png`,
                         Buffer.from(full.data, 'base64'));
      }
      fs.writeFileSync(`${process.env.B1B_SHOTS}/${tag}-${name}.png`,
                       Buffer.from(cap.data, 'base64'));
    }
  }
  console.log(`SHOT ${tag} ${out.join('  ')}`);
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

// ⚠ TWO SHOTS BEFORE A KEY IS TOUCHED, and the second one is the control. A
// verdict of *the picture changed* means nothing until *the picture holds still*
// has been measured on the same page, with the same capture path, seconds apart.
await shot('before');
await sleep(1200);
await shot('steady');

// loft's browser shell binds keydown to the CANVAS, not the window, so a page
// nobody has clicked is deaf.
//
// ⚠ THE CLICK IS AT THE CANVAS'S FAR RIGHT, CLEAR OF THE PANEL. A press at
// (550,400) lands in the world, which is fine for focus — but the drag handler
// takes any button-down as the start of a look, and a stray pixel of motion would
// move the camera between the shots above and the shots below. The world region
// this probe reads would then change for a reason that is not a gesture.
// ⚠ THE POINT IS COMPUTED FROM THE CANVAS RECT, NOT TYPED. The canvas is 1200x660
// in a 1100x760 window, so the page is SCROLLED and the canvas's own origin is at
// negative viewport coordinates — a click typed as `1150,640` lands outside the
// viewport entirely, the canvas never takes focus, and every key press afterwards
// goes nowhere. Measured: six keys, not one gesture, and a transcript that reads
// exactly like a local mode that does not work.
// ⚠ `bw`/`bh` ARE THE BACKING STORE AND THEY ARE NOT `w`/`h` BY DEFINITION — plan 22
// `M3`. The page's `mousemove` reports `clientX - r.left`, which is CSS pixels, while
// everything the client LAYS OUT (a verb slot's rect) is in backing-store pixels. The
// two agree only while the canvas is displayed at its own size, and a slot click is
// the first thing in this tree that depends on it — so the ratio is measured and
// reported rather than assumed to be 1.
const crect = (await call('Runtime.evaluate', {
  expression: `(() => { const c = document.getElementById('c'); if (!c) return null;
    const r = c.getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height, bw: c.width, bh: c.height}; })()`,
  returnByValue: true,
}))?.result?.value ?? { x: 0, y: 0, w: 800, h: 600, bw: 800, bh: 600 };
const sx = crect.bw ? crect.w / crect.bw : 1, sy = crect.bh ? crect.h / crect.bh : 1;
console.log(`canvas css ${Math.round(crect.w)}x${Math.round(crect.h)} `
  + `backing ${crect.bw}x${crect.bh} scale ${sx.toFixed(3)},${sy.toFixed(3)}`);

// Click a VERB SLOT, at the centre the CLIENT reported for it.
//
// ⚠ **READ OFF THE CLIENT'S OWN LINE, NEVER RE-DERIVED.** `client: verb slots — …`
// carries each slot's centre out of the LAID-OUT bar. A driver that computed the
// position from `VERB_SLOT_W` and `PANEL_WIDTH` would be a second copy of the layout,
// green while clicking at the wrong pixel — and a mis-click reads as *rebinding does
// not work*, which is the wrong bug to go looking for.
//
// ⚠ **AND IT IS THE LAST SUCH LINE**, because a rebind rebuilds the bar and reprints
// it: taking the first would click where a slot USED to be after the first rebind.
const clickSlot = async (verb) => {
  const lines = (await out()).split('\n').filter((l) => l.includes('client: verb slots — '));
  if (!lines.length) await bye(1, `M SLOT MISS — the client never reported its slots`);
  const m = lines[lines.length - 1].match(new RegExp(`(?:^|[ —])${verb}@(-?\\d+),(-?\\d+)`));
  if (!m) await bye(1, `M SLOT MISS — no slot for '${verb}' in: ${lines[lines.length - 1]}`);
  const px = crect.x + Number(m[1]) * sx, py = crect.y + Number(m[2]) * sy;
  console.log(`click ${verb} slot at client ${m[1]},${m[2]} → viewport ` +
    `${Math.round(px)},${Math.round(py)}`);
  // ⚠ A MOVE FIRST. `gl_mouse_x` is only ever written by `mousemove`, so a press with
  // no motion in front of it is hit-tested against wherever the pointer was last —
  // which, in this driver, is the focus click in the middle of the world.
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, buttons: 0 });
  await sleep(60);
  await call('Input.dispatchMouseEvent',
    { type: 'mousePressed', x: px, y: py, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseReleased', x: px, y: py, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(gapMs);
};
// Click a CATALOGUE ROW, at the centre the CLIENT reported for it — plan 18 `B1.3c`.
//
// ⚠ **BY INDEX, NOT BY NAME.** `panel_build` fits every label to its box, so a long
// catalogue name reaches `lb_items` truncated — `thick_cu..` where the catalogue says
// `thick_curved`. A driver matching the name would miss exactly the long ones, which
// is the half most likely to be interesting.
//
// ⚠ **AND IT TWITCHES WHILE THE BUTTON IS DOWN, ON PURPOSE.** A press with no motion
// under it sends no look-delta whether or not the panel consumes the click, so a
// still click cannot tell a fixed editor from a broken one. Two pixels is what a hand
// does, and it is what makes `P2` able to fail.
const clickRow = async (sel) => {
  const lines = (await out()).split('\n').filter((l) => l.includes('client: catalogue rows — '));
  if (!lines.length) await bye(1, `P ROW MISS — the client never reported its rows`);
  // `#3` is row three; `#part` is the FIRST row of that kind. The second form is what
  // a gate should use: which index is a part changes the moment a catalogue grows,
  // and a hard-coded number would then click a material and report it as a part.
  const want = /^\d+$/.test(sel) ? `${sel}:[^@ ]*` : `\\d+:${sel}:[^@ ]*`;
  const m = lines[lines.length - 1].match(new RegExp(`(?:^|[ —])(${want})@(-?\\d+),(-?\\d+)`));
  if (!m) await bye(1, `P ROW MISS — no row '${sel}' in: ${lines[lines.length - 1]}`);
  const px = crect.x + Number(m[2]) * sx, py = crect.y + Number(m[3]) * sy;
  console.log(`click row ${m[1]} at client ${m[2]},${m[3]} → viewport ` +
    `${Math.round(px)},${Math.round(py)}`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, buttons: 0 });
  await sleep(60);
  await call('Input.dispatchMouseEvent',
    { type: 'mousePressed', x: px, y: py, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseMoved', x: px + 2, y: py + 2, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseReleased', x: px + 2, y: py + 2, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(gapMs);
};
// The SAME press-and-twitch, out in the world — the positive control for it.
//
// ⚠ **A GATE THAT ONLY CHECKS THE PANEL CANNOT SEE A DEAD INSTRUMENT.** "No look-drag
// came out of that press" is an absence, and an absence reads identically when the
// drag path is broken, when the page stopped printing, or when the twitch never
// arrived. This clicks where the answer must be YES, so the zero next to it is a fact
// about the panel rather than about the driver.
const clickWorld = async () => {
  const px = Math.max(8, Math.min(crect.x + crect.w * 0.6, 1000));
  const py = Math.max(8, Math.min(crect.y + crect.h * 0.6, 700));
  console.log(`click world at viewport ${Math.round(px)},${Math.round(py)}`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, buttons: 0 });
  await sleep(60);
  await call('Input.dispatchMouseEvent',
    { type: 'mousePressed', x: px, y: py, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseMoved', x: px + 2, y: py + 2, buttons: 1 });
  await sleep(holdMs);
  await call('Input.dispatchMouseEvent',
    { type: 'mouseReleased', x: px + 2, y: py + 2, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(gapMs);
};
const clickX = Math.max(8, Math.min(crect.x + crect.w * 0.6, 1000));
const clickY = Math.max(8, Math.min(crect.y + crect.h * 0.6, 700));
await call('Input.dispatchMouseEvent',
  { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1, buttons: 1 });
await call('Input.dispatchMouseEvent',
  { type: 'mouseReleased', x: clickX, y: clickY, button: 'left', clickCount: 1, buttons: 0 });
await sleep(300);

let first = true;
for (const k of keysArg.split(',')) {
  // ⚠ `@verb` IS A CLICK ON THAT VERB'S SLOT — plan 22 `M3`, and it is in the key list
  // rather than a flag of its own because the ORDER is the whole gesture: arm, pick,
  // press. `Escape,@raise,5` is one sentence and splitting it across two arguments
  // would let a caller write it in an order the editor cannot answer.
  if (k.trim().startsWith('@')) { await clickSlot(k.trim().slice(1)); continue; }
  // ⚠ `#N` IS A CLICK ON CATALOGUE ROW N, in the key list for `@verb`'s reason — what
  // a click MEANS depends on what was pressed before it.
  if (k.trim().startsWith('#')) { await clickRow(k.trim().slice(1)); continue; }
  // `~world` is the same press-and-twitch out in the world — P2's positive control.
  if (k.trim() === '~world') { await clickWorld(); continue; }
  // ⚠ `!reload` RE-OPENS THE PAGE MID-RUN — plan 22 `M5b`, and it is in the key list for
  // `@verb`'s reason: *bind it, close the tab, come back* is ONE sentence, and a run
  // that had to be split across two invocations of this driver would be two experiments
  // with a browser restart between them.
  //
  // ⚠ **THE TRANSCRIPT IS DUMPED FIRST, because navigating DESTROYS it.** The page's
  // `<pre id=out>` is part of the document, so the first half's evidence — the rebind
  // that is supposed to be surviving — would be gone from the log the caller reads, and
  // the check would be asserting a persistence claim with no proof that anything was
  // ever saved.
  if (k.trim() === '!reload') {
    console.log('--- transcript before reload ---');
    console.log(await out());
    console.log('--- reloading ---');
    await call('Page.navigate', { url });
    let back = false;
    for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
      if ((await out()).includes('moros editor client')) { back = true; break; }
      await sleep(250);
    }
    if (!back) await bye(1, 'B1b FAIL — the page never booted after the reload');
    if (awaitText) {
      let seen2 = false;
      for (let i = 0; i < Math.ceil(waitMs / 250); i++) {
        if ((await out()).includes(awaitText)) { seen2 = true; break; }
        await sleep(250);
      }
      if (!seen2) await bye(1, `B1b FAIL — after the reload the page never said '${awaitText}'`);
    }
    // ⚠ AND FOCUS AGAIN. The shell binds keydown to the CANVAS, and a freshly navigated
    // page has never been clicked — so every key after this would go nowhere, which
    // reads exactly like a binding that did not survive.
    await call('Input.dispatchMouseEvent',
      { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1, buttons: 1 });
    await call('Input.dispatchMouseEvent',
      { type: 'mouseReleased', x: clickX, y: clickY, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(afterMs);
    continue;
  }
  // ⚠ `+key` HOLDS AND `-key` LETS GO — plan 22 `M5`, and this driver could not say it
  // before. Every press above is down-then-up inside one step, which cannot express the
  // situation the fresh-press rule exists for: a key that was ALREADY DOWN when the
  // slot was clicked. `+w,Escape,@raise,-w` is that sentence, and the whole run is one
  // gesture — so the hold has to survive the click between them.
  // ⚠ ONE `keyDown` IS ENOUGH: the page's shell keeps a SET (`keys.add(mapKey(e.code))`
  // on keydown, delete on keyup), so a held key needs no auto-repeat — and sending
  // repeats would be a different physical event than the one being modelled.
  const held = k.trim().startsWith('+') || k.trim().startsWith('-');
  if (held) {
    const d = describe(k.trim().slice(1));
    await call('Input.dispatchKeyEvent', {
      type: k.trim().startsWith('+') ? (d.text ? 'keyDown' : 'rawKeyDown') : 'keyUp',
      key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk,
      ...(d.text && k.trim().startsWith('+') ? { text: d.text } : {}) });
    console.log(`${k.trim().startsWith('+') ? 'hold' : 'release'} ${d.key}`);
    await sleep(gapMs);
    continue;
  }
  const d = describe(k.trim());
  await call('Input.dispatchKeyEvent', { type: d.text ? 'keyDown' : 'rawKeyDown',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk,
    ...(d.text ? { text: d.text } : {}) });
  await sleep(holdMs);
  await call('Input.dispatchKeyEvent', { type: 'keyUp',
    key: d.key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk });
  await sleep(gapMs);
  // ⚠ AFTER THE FIRST KEY, NOT ONLY AT THE END. The first press is a raise, which
  // is the one gesture the ground mesh can show; reading the picture only after
  // the whole sequence would credit any of six presses with the change.
  if (first) { await shot('after-first'); first = false; }
}
await sleep(afterMs);
await shot('after-all');
await bye(0, `B1b pressed ${keysArg}`);
