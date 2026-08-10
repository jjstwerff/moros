#!/usr/bin/env node
// RUN A SCRIPT OF KEY PRESSES AGAINST THE EDITOR, AND PHOTOGRAPH THE RESULT.
//
// WHY. Every iteration on how a house looks meant re-typing the same walk-and-press
// by hand, which is slow, unrepeatable, and impossible to diff: two runs that
// differ tell you nothing when the inputs differed too. A script makes the INPUT
// fixed so the only thing that changes between runs is the editor.
//
//   node tools/script.mjs <script.keys> [--port 18090] [--shots] [--keep]
//
// The script speaks in the keys a person presses. One table below maps each to the
// wire message the client sends for it — ⚠ IT MUST MATCH `html/editor.html`, and
// that is the one duplication here; a key that does something different in the
// page than in this file makes every script a lie.
//
// ⚠ NO BROWSER BY DEFAULT. `watched = live_clients > 0`, and this runner IS a
// client — so the server ticks for it, and the whole scene can be driven and read
// back with nothing but the socket. A browser is attached ONLY for `--shots`, and
// only from the first `snap` that needs one, because it is the single slowest and
// flakiest thing in the loop and most runs do not want a picture.
//
//   # a comment
//   at <x> <z> [yawdeg]     teleport — exact, repeatable, the workhorse
//   key <K>                 send what pressing K sends
//   hold <WASD> <wu>        hold a key until that much ground is covered
//   turn <deg>              turn by that much, measured off the body's facing
//   wait <prefix>           wait for a status line starting with this
//   snap <name>             picture + state dump, into shots/
//   keys <bitmask>          hold W=1 S=2 A=4 D=8 — raw, so a walk can be held for
//                           an EXACT number of ticks rather than a distance
//   rate <n>                simulation speed: 1 real time, 8 fast, 0 STEPPED
//   step <n>                advance exactly n ticks and wait until they are done
//   save <name>             write the world; the file is the determinism fingerprint
//   echo <text>             print a marker into the transcript
//   mesh <surf> [lo hi]     vertices the server EMITTED into a surface, off the wire
//   feet [lo hi]             where the character is STANDING — a stair is a sequence
//                           of these, and `cam` cannot say it
//   meshy <surf> <y0> <y1> [lo hi]   the same, inside a band of world y — for when
//                           one surface carries two things of one colour
//   meshr <surf> <r0> <r1> [lo hi]   the same, inside a band of height ABOVE THE
//                           GROUND at each vertex's own x,z — for when both things
//                           ride the terrain, so world y cannot separate them.
//                           Reports how many sat over OPEN ground, which have no
//                           datum and are counted by neither band
import http from 'node:http';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
const scriptPath = args[0];
if (!scriptPath) { console.error('usage: script.mjs <script.keys> [--port N] [--keep]'); process.exit(64); }
// ⚠ `EDITOR_PORT` FIRST, because the gate suite gives every gate its own port and
// its own server. A runner that hardcoded 18090 would pass alone and dial another
// gate's world inside the suite — which is the worst way round, and the reason
// `run-gates.sh` says so at the top of itself.
let PORT = +(process.env.EDITOR_PORT ?? 18090), keep = false, shots = false, wasm = false;
// ⚠ THE WINDOW IS A PARAMETER BECAUSE THE TWO RENDERERS DO NOT AGREE ON IT, and until
// they do their histograms cannot be compared at all. `editor.html` fills whatever
// window it is given and re-asks the server for a camera on resize; the wasm client's
// canvas is a fixed `WIN_W`x`WIN_H` = 1280x800. At the harness's own 1200x800 that is
// aspect 1.50 against 1.60 — a wider field of view, more sky, and every share in the
// frame shifted for a reason that has nothing to do with what was drawn. Measured:
// FOLLOW read `grass 0.5336` on one and `sky 0.7734` on the other.
//
// The default stays 1200x800 so every existing gate's thresholds are untouched; an
// A/B passes 1280x800 to BOTH sides.
let WIN = null;
// ⚠ THE WASM PAGE NEEDS A TALLER WINDOW THAN IT DRAWS INTO, and getting this wrong
// reads exactly like a lighting bug. Its canvas is a fixed `WIN_W`x`WIN_H` = 1280x800
// (`editor_client.loft`, and it is fixed because `gl_window_width`/`gl_window_height`
// are not in the browser's host-import set at all — loft-lang/loft#668), while the
// region actually drawn is the browser VIEWPORT: the window less the ~140px `<pre>`
// HUD under the canvas. At the default 1200x800 that is 1200x660 inside a 1280x800
// canvas, so 22.66% of every frame is black L-shaped dead area — and a mean
// luminance over it comes back 22% low at EVERY station.
//
// Measured, and it is why this constant is here rather than a comment: the two
// renderers read `lum 0.4181` against `0.5362` on identical sky, `0.1112` against
// `0.1406` on identical soffit. Predicted from the dead fraction alone: 0.4147 and
// 0.1087. At 1280x940 the drawn region fills the canvas and they agree to 0.3%.
const WASM_WIN = '1280,940';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port') PORT = +args[++i];
  if (args[i] === '--keep') keep = true;
  if (args[i] === '--shots') shots = true;
  if (args[i] === '--client') wasm = true;
  if (args[i] === '--window') WIN = args[++i].replace('x', ',');
}
// ⚠ `--client` DRIVES THE WASM PAGE INSTEAD OF THE JAVASCRIPT ONE, so one script can
// be run against both and the two histograms compared. That comparison is the whole
// reason `editor.html` is still here: plan 16's own rule is that a dual path exists
// to be COMPARED and is deleted in the commit that proves the new one.
//
// ⚠ AND THE READINESS AND SETTLE CHECKS DEGRADE, LOUDLY. Both interrogate
// `editor.html`'s own JS — `parts.size`, its `view` — and a wasm page has no such
// globals to ask. Against `/client` they fall back to "the canvas is not blank",
// which is strictly weaker, so it SAYS so rather than reporting a check it did not
// make. A silent degrade here would let a stale frame pass as a match.
if (WIN === null) WIN = wasm ? WASM_WIN : '1200,800';
const PAGE = wasm ? '/client' : '/';
// The client's UI chrome — `lavition_ui::PANEL_WIDTH` and `STATUS_HEIGHT`.
// Named here rather than buried in the measurement, so changing the panel is one
// edit and a reader can see why a picture gate skips some pixels.
//
// The status BAR spans the whole window, not just the strip: the line it carries
// runs to 80-odd characters and never fitted a 240px column. That makes it 24 of
// 660 rows = 3.6% of the frame, which is exactly the `sky 0.0364` that took
// `deck_soffit` red — a gate that wants to be fully under a deck, reading the
// bottom bar as sky.
const UI_STRIP   = 240;
const UI_STATUS  = 24;
// And the SUBJECT bar across the top (plan 18 B1.5) — the always-visible line
// saying what you are working on. Same reason as the status bar: it spans the
// window because its content does.
const UI_SUBJECT = 24;
const CANVAS = wasm ? '#c' : '#gl';

// ⚠ KEEP IN STEP WITH `html/editor.html`'s keydown handler.
const KEYMAP = {
  ArrowUp: '5:1', ArrowDown: '5:-1',
  F: '23:3,3',            // ring a fence around you
  G: '23:1,3',            // the same tool with wall material — a hex RING, not a line
  E: '30:1', Q: '30:-1',  // cut one step into the cell ahead
  B: '12:1', C: '12:-1',  // a storey above, a cellar below
  R: '25:1',              // a wall run — two presses, start and end
  H: '32:',               // a house where you are looking (S4)
  O: '36:1',              // a ROUND-headed opening in the wall you face
  P: '36:2',              // …a POINTED one
  I: '36:3',              // …a segmental one
  U: '36:4',              // …and an oculus, a round window
  N: '36:11',             // a round-headed NICHE — the same curve, stopped short
  M: '36:21',             // …and a window in that niche's BACK — the embrasure
  J: '37:0',              // a BEDSTEE — a closed box built ONTO the wall you face
  K: '37:1',              // a BALCONY — an open deck with a rail, and a way in
  V: '37:2',              // a CUPBOARD beside the last box — they share a wall
  Y: '38:0',              // a BED in the box you stand at — sized by the box
  T: '38:1',              // a STATUE in the niche — sized by the niche
  X: '39:0',              // a SLAB over the last house — a floor WITH A THICKNESS
  Z: '39:1',              // a stairwell through it, with a reveal in the thickness
};
const HELD = { W: 1, S: 2, A: 4, D: 8 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The palette the server sends, from `editor_server.loft`. ⚠ Keep in step with it —
// a classifier holding last month's colours reports a frame nobody is looking at.
// ⚠ A COPY OF `hex_mesh::surfaces()`, AND THE THIRD ONE. The renderer's
// colours live there; this table is what the gates classify with, and it has to
// agree or a gate reads one surface as another. Cross-language, so nothing
// checks it — the same shape moros#3 closed for the hex lattice with a shared
// fixture, and the same fix is available here when it next bites.
const PALETTE = {
  figure: [0.80, 0.60, 0.45],   // the SUBJECT — the row every gate here asks about
  grass:  [0.42, 0.50, 0.30],
  rock:   [0.46, 0.38, 0.26],
  field:  [0.55, 0.62, 0.24],
  road:   [0.30, 0.18, 0.15],   // ⚠ see hex_mesh::surfaces() — a RED EARTH now
  tree:   [0.16, 0.34, 0.14],
  roof:   [0.45, 0.20, 0.17],
  soffit: [0.34, 0.30, 0.36],   // the roof's UNDERSIDE — its own surface, its own row

  wall:   [0.55, 0.52, 0.46],
  floor:  [0.65, 0.40, 0.25],
  frame:  [0.78, 0.74, 0.65],
  sky:    [0.48, 0.55, 0.64],
};
const CHROMA = Object.entries(PALETTE).map(([k, c]) => {
  const s = c[0] + c[1] + c[2];
  return [k, [c[0] / s, c[1] / s, c[2] / s]];
});

// ⚠ THE FRAME IS THE WALL'S CHROMATICITY — 0.371/0.341/0.287 against 0.359/0.340/
// 0.301 — because both are pale warm greys, which is a fact about the palette and
// not a flaw in the method. Those two are reported as one bucket rather than
// pretended apart; a frame is a jamb and a soffit, so the bucket is a wall with its
// reveals and reads as one surface in the picture as well as in the histogram.
//
// ⚠ THE FLOOR USED TO BE IN HERE TOO, AND THAT MADE THE SECOND ROW UNMEASURABLE.
// The rule is *no SINGLE surface over 60%*, and while the floor was `0.62,0.57,0.48`
// it landed 0.0003 from the wall against a 0.0009 tolerance — so an interior frame
// reported one bucket of 77% that was a wall AND the floor it stands on, and no
// threshold over it could mean what it said. The floor is timber now, in the
// renderer, which separates them in the picture and not merely in the classifier.
const MERGE = { wall: 'masonry', frame: 'masonry' };
// ⚠ AND THE SUBJECT'S BUCKET COLLECTS THE FLOOR/WALL SEAM. Anti-aliased pixels on
// that edge blend 0.500/0.308/0.192 with 0.359/0.340/0.301, whose midpoint is
// 0.43/0.32/0.25 — the FIGURE's chromaticity to three decimals. Nothing can be done
// about it inside a classifier that reads a composited frame, so it is stated here
// and the gates bound the subject ABOVE the seam rather than at zero. Measured with
// the body hidden: 0.0003 of the frame, against 0.1364 with it drawn.


// ── the browser, attached lazily and only for pictures
// ⚠ DERIVED FROM THE EDITOR PORT, or two browser gates fight over one devtools
// socket. `run-gates.sh` gives every gate its own `EDITOR_PORT` precisely so they can
// run together; a fixed devtools port undoes that — and the stale-browser guard below
// would then KILL the other gate's browser, which is the worst possible version of
// the collision because it looks like a flake in the victim.
const CDP = 9300 + (PORT % 100);
let proc = null, cdp = null, cdpId = 0;
const cdpPending = new Map();
async function cdpJson(path) {
  for (let i = 0; i < 60; i++) {
    try { return await new Promise((res, rej) => {
      http.get({ host: '127.0.0.1', port: CDP, path }, (r) => {
        let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => res(JSON.parse(b)));
      }).on('error', rej); }); } catch { await sleep(200); }
  }
  throw new Error('devtools never answered');
}
const call = (method, params = {}) => new Promise((res) => {
  const n = ++cdpId; cdpPending.set(n, res); cdp.send(JSON.stringify({ id: n, method, params })); });
async function browser() {
  if (cdp) return true;
  const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
    .find((c) => spawnSync('which', [c]).status === 0);
  if (!chrome) { console.log('  !! no chrome — state dump only'); return false; }
  // ⚠ FREE THE DEVTOOLS PORT FIRST, AND ONLY IF IT IS OURS. A run that died before
  // its `proc.kill()` leaves Chrome holding 9345; the next run's spawn cannot bind,
  // `cdpJson` attaches to the CORPSE — still on `about:blank` — and the wait times
  // out as "the page never drew". That reads as a broken renderer and is a stale
  // process, which cost a full diagnosis once already.
  //
  // This is `run-gates.sh`'s own rule one tool over, including its caution: match on
  // the flags THIS file spawns with, because a port number is not an identity and
  // this box runs other people's browsers.
  for (const line of (spawnSync('pgrep', ['-af', `remote-debugging-port=${CDP}`],
                                { encoding: 'utf8' }).stdout ?? '').split('\n')) {
    const pid = Number(line.split(/\s+/)[0]);
    // ⚠ IDENTIFIED AS OURS, NOT MERELY AS "A BROWSER ON THAT PORT". This box runs
    // other agents' work and one of them keeps headless Chrome on 9391 — inside the
    // same 93xx band this derives from. A port number is not an identity, so the
    // match is on the window size THIS file spawns with, which nothing else here
    // uses. `run-gates.sh` says the same thing about the editor port in more words.
    if (pid && pid !== process.pid && line.includes(`--window-size=${WIN}`)) {
      try { process.kill(pid); } catch { /* already gone */ }
    }
  }
  // ⚠ THE THREE FLAGS TOGETHER, and `--use-gl=angle` rather than
  // `--use-gl=swiftshader`. This spawned Chrome with the older spelling and got a
  // WebGL2 context that DREW — `readPixels` returned a full picture — but composited
  // nothing, so `Page.captureScreenshot` returned the DOM over white. Two blank
  // PNGs this session, S3's wall and S4's house, while `html_render_check.mjs`
  // photographed the same scene at 478 distinct colours with these flags.
  //
  // A picture that is blank for a browser-flag reason is the worst possible
  // failure here: the method is "every step ends in a PNG", so a broken camera
  // reads as broken work.
  proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${CDP}`,
    '--no-sandbox', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader',
    '--mute-audio', '--hide-scrollbars',
    `--window-size=${WIN}`, 'about:blank'],
    { stdio: 'ignore' });
  const page = (await cdpJson('/json/list')).find((t) => t.type === 'page');
  cdp = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => cdp.addEventListener('open', r));
  cdp.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && cdpPending.has(m.id)) { cdpPending.get(m.id)(m.result); cdpPending.delete(m.id); } });
  await call('Page.enable');
  await call('Page.navigate', { url: `http://127.0.0.1:${PORT}${PAGE}` });

  // ⚠ WAIT FOR THE CANVAS, NOT THE CLOCK. This was `await sleep(4000)` — a guess
  // that the page had connected, streamed and drawn — and it wrote BLANK PNGs
  // twice: S3's wall and S4's house both photographed an empty canvas while
  // `make editor-check` rendered the same scene at 478 distinct colours. Measured
  // afterwards, a fresh client needs about 6.5s to reach a drawn frame (3.6s for
  // the server to load and build, then connect, opening burst, camera), so four
  // was never going to be enough — and a blank picture is worse than no picture,
  // because it reads as a broken renderer.
  //
  // So it waits until something is drawn, and SAYS SO on timeout rather than
  // writing the blank frame silently.
  //
  // ⚠ IT ASKED `readPixels`, WHICH THIS FILE'S OWN NEXT COMMENT SAYS RETURNS BLACK.
  // A WebGL context without `preserveDrawingBuffer` clears its drawing buffer at
  // composite, so a read from outside the render loop sees whatever is left — and
  // the readiness check and the MEASUREMENT were therefore asking two different
  // questions of two different buffers. It reported "the page never drew" against a
  // page holding 440 meshes with a live WebGL2 context and no exceptions, measured
  // directly over CDP.
  //
  // Both go through `Page.captureScreenshot` now, which is the one path known to
  // work here. A readiness check that cannot see what the gate will measure is worse
  // than no check: it fails runs that would have passed and passes runs that will
  // photograph nothing.
  // ⚠ AND IT ASKS ABOUT THE TWO FAILURES, NOT ABOUT COLOURFULNESS. This required
  // twelve distinct colours, which is a proxy — and a legitimately UNIFORM frame has
  // one. EYES looking straight up at the sky is 99.7% one colour, so the check timed
  // out for twenty seconds on a page that was drawing perfectly, and said "the page
  // never drew" about the correct picture. A readiness test that fails on a valid
  // scene is worse than none: it teaches the reader to ignore it.
  //
  // The two things that actually go wrong are LOADED (no meshes, no camera yet) and
  // COMPOSITED (the WebGL layer missing, so the shot is the DOM over white). So it
  // asks the page for the first and measures whiteness for the second.
  const ready = async () => {
    const lag = await browserLag();
    if (lag.page < 1 || !lag.cam) return false;
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    if (!shot?.data) return false;
    const r = await call('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
      expression: `
      (async () => {
        const img = new Image();
        img.src = 'data:image/png;base64,${shot.data}';
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data;
        let s = 0, n = 0;
        for (let i = 0; i < d.length; i += 4 * 401) { s += (d[i] + d[i+1] + d[i+2]) / 765; n++; }
        return s / n;
      })()` });
    const white = r?.result?.value ?? 1;
    return white < 0.95;
  };
  for (let t = 0; t < 20000; t += 250) {
    await sleep(250);
    if (await ready()) return true;
  }
  console.log('  !! the page never drew — the picture will be blank, and that is the finding');
  return true;
}

// ── the wire: how the world is actually driven
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
const status = []; const trace = []; let tCount = 0; let view = null;
// ── WHAT IS ACTUALLY IN THE MESHES, BY SURFACE ──────────────────────────────
//
// ⚠ PIXELS CANNOT ALWAYS TELL TWO THINGS APART, and a deck's underside is the case
// that proved it: a roof's soffit and a floor's soffit are one colour and one
// surface, so standing under an upper storey inside a house photographs `soffit
// 0.997` whether the DECK has an underside or you are seeing the ROOF through it.
// The count does distinguish them — adding a storey either adds triangles to that
// surface or it does not.
//
// Only the SIZE is kept: the id encodes chunk and surface as
// `chunk * SURFACES + MESH_FIGURE_MAX + k`, and a vertex is six floats.
//
// ⚠ AND A COUNT CANNOT SEE A HEIGHT, which is the cellar's version of the same trap.
// Digging a cellar adds 342 vertices to `soffit` whatever happens — that is the
// cellar FLOOR's own underside, emitted by the same clause every non-ground layer
// goes through. A ceiling over the cellar would be 342 more, in the same surface, of
// the same colour, and `mesh soffit` cannot tell one total from the other. What
// separates them is WHERE THEY ARE: a cellar floor's underside is twelve units down,
// a ceiling is at the ground. Hence `meshy`, which counts inside a y band.
const SURFACES = 11;
const SURF = ['ground', 'road', 'field', 'veg', 'roof', 'wall', 'floor', 'frame', 'soffit',
              'rock', 'water'];
const meshLen = new Map();
// Every vertex's y, per mesh — one float of the six, so a sixth of the traffic kept.
const meshY = new Map();
const meshX = new Map();
const meshZ = new Map();
ws.addEventListener('message', (ev) => {
  const s = ev.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'T' && b.startsWith('0;')) { trace.push(b.slice(2).split(',').map(Number)); tCount++; }
  // ⚠ THE VIEW MATRIX THE RENDERER ACTUALLY USED. The `27:` trace reports the
  // camera's own valves — `want`, `dist`, `free` — and every one of them can be
  // right while the eye is somewhere the room does not contain: `dist` is a length
  // along a ray whose origin and direction are decided elsewhere. So the position
  // is read back from `C:`, which is the matrix that drew the picture and cannot
  // disagree with it.
  if (t === 'C') view = b.split(';')[0].split(',').map(Number);
  if (t === 'M') {
    const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    const d = rest.slice(rest.indexOf(';') + 1);
    const f = d === '' ? [] : d.split(',');
    meshLen.set(id, f.length);
    // ⚠ SIX FLOATS PER VERTEX, y SECOND — `mesh_to_floats` writes position then
    // normal. Taking every sixth from index 1 is the y column and nothing else.
    const ys = new Array(f.length / 6);
    for (let v = 0; v < ys.length; v += 1) ys[v] = Number(f[v * 6 + 1]);
    meshY.set(id, ys);
    // ⚠ AND x AND z, WHICH `meshr` NEEDS AND NOTHING ELSE DOES. Three floats of six
    // instead of one — still nothing off the wire, which is unchanged; this is what
    // is KEPT. A band on world y cannot separate two things whose separation is
    // vertical but whose datum moves, and the datum here is the ground itself.
    const xs = new Array(f.length / 6);
    const zs = new Array(f.length / 6);
    for (let v = 0; v < xs.length; v += 1) {
      xs[v] = Number(f[v * 6]);
      zs[v] = Number(f[v * 6 + 2]);
    }
    meshX.set(id, xs);
    meshZ.set(id, zs);
  }
  if (t === 'X') {
    meshLen.delete(Number(b)); meshY.delete(Number(b));
    meshX.delete(Number(b)); meshZ.delete(Number(b));
  }
});
// Vertices in one surface, summed over every loaded chunk. ⚠ A COUNT OF WHAT WAS
// EMITTED, not of what a producer says it emitted — the same rule the gates already
// hold to for the ground and the wall.
const surfaceVerts = (name) => {
  const k = SURF.indexOf(name);
  if (k < 0) return -1;
  let n = 0;
  for (const [id, len] of meshLen) {
    if (id <= 15) continue;
    if ((id - 16) % SURFACES === k) n += len / 6;
  }
  return n;
};
// The same count, restricted to a band of world y. `[ylo, yhi)` — half-open, so two
// adjacent bands partition the surface and a vertex is never counted twice.
//
// ⚠ NO SCRIPT USES THIS TODAY, and that is said here rather than left to be noticed.
// Its one caller was `cellar.keys`, which now bands on height above the GROUND
// (`meshr` below) because both of the things it separates ride the terrain. It is
// kept for the same reason `turn` and `hold` are kept with no callers — this is a
// verb vocabulary, not an API — but a world-y band is the wrong instrument whenever
// the two populations share a moving datum, which is worth reading before reaching
// for it again.
const surfaceVertsY = (name, ylo, yhi) => {
  const k = SURF.indexOf(name);
  if (k < 0) return -1;
  let n = 0;
  for (const [id, ys] of meshY) {
    if (id <= 15) continue;
    if ((id - 16) % SURFACES !== k) continue;
    for (const y of ys) if (y >= ylo && y < yhi) n += 1;
  }
  return n;
};
// ── `meshr` — a band on height ABOVE THE GROUND AT THE SAME POINT ────────────
//
// ⚠ WHY A SECOND BANDING VERB EXISTS. `meshy` bands on world y, so it can only
// separate two populations whose datum does not move. The cellar's do not qualify:
// a ceiling sits `FLOOR_THICK` under the ground and a cellar floor's underside a
// storey below that, so the two are a fixed distance apart and BOTH ride the
// terrain. Over a plateau that is not flat they smear across each other, and no
// threshold in world y reads a whole number of fans — measured on `cellar.keys`,
// where the split fell from an exact 306/342 to 310/338 the moment the ground under
// the disc stopped being artificially flat.
//
// ⚠ AND LEVELLING THE FIXTURE IS NOT THE FIX — that was built and backed out. The
// datum is the problem, not the terrain, so this measures against the datum.
//
// The ground's own vertices are the datum, and they are already on the wire: an
// underside fan is emitted at the SAME (x, z) as the ground fan above it, because
// both are the same cell's corners. So no geometry is needed — just the ground's y
// at that exact point.
const GKEY = (x, z) => `${Math.round(x * 1e4)},${Math.round(z * 1e4)}`;
const groundMap = () => {
  const k = SURF.indexOf('ground');
  const m = new Map();
  for (const [id, ys] of meshY) {
    if (id <= 15) continue;
    if ((id - 16) % SURFACES !== k) continue;
    const xs = meshX.get(id), zs = meshZ.get(id);
    // ⚠ THE HIGHEST GROUND AT A SHARED CORNER, not the first seen. A corner belongs
    // to three cells and arrives once per chunk that draws it; taking whichever came
    // last would make the answer depend on chunk order.
    //
    // ⚠ AND SINCE plan 20 `A5` THAT IS A CHOICE RATHER THAN THE ONLY ANSWER, because
    // the drawn ground is no longer continuous: where it is too steep to hold it
    // parts and shows rock, so one (x, z) can carry two or three different heights.
    // A vertex hanging under the LOW side is then measured against the HIGH one.
    //
    // ⚠ THREE CLEVERER RULES WERE MEASURED AGAINST `cellar.keys` AND ALL THREE ARE
    // WORSE. Its 306 ceiling vertices are 17 fans of 18: a [min,max] RANGE reads
    // 302, recovering four and missing the four whose own ground is the MIDDLE of
    // three (measured at (16.454, ±3.5): 3.250, 3.583 and 4.125 at one point, the
    // ceiling exactly 0.5 under the middle); accepting ANY member reads 310,
    // because `emit_ground_reveal`'s cut face is in the GROUND mesh too and its
    // bottom edge is itself one SLAB_THICK down, so a stairwell puts phantom
    // datums into the set; and REFUSING to band a parted corner reads 262,
    // throwing away 44 ceilings that were measured correctly.
    //
    // The wire carries no ownership — a vertex does not say which cell emitted it
    // — so no rule over these numbers can always pick the right one of three. The
    // highest is kept because it is the one rule that has not changed under any
    // caller, and `split` below reports how often the premise is shaky — a number
    // beside the count, never folded into it.
    for (let v = 0; v < ys.length; v += 1) {
      const key = GKEY(xs[v], zs[v]);
      const prev = m.get(key);
      if (prev === undefined) m.set(key, [ys[v]]);
      else if (!prev.some((y) => Math.abs(y - ys[v]) < 1e-6)) prev.push(ys[v]);
    }
  }
  return m;
};
// ⚠ IT RETURNS THE UNMATCHED COUNT TOO, AND THAT IS NOT OPTIONAL. A vertex over a
// point where the ground was OPENED — a stairwell — has no datum, and silently
// dropping it would let this verb report a clean number about a set it had quietly
// shrunk. The caller prints it, so a lookup that stops matching is visible as a
// number rather than as a wrong count.
const surfaceVertsR = (name, rlo, rhi) => {
  const k = SURF.indexOf(name);
  if (k < 0) return { n: -1, miss: -1, split: -1 };
  const g = groundMap();
  let n = 0, miss = 0, split = 0;
  for (const [id, ys] of meshY) {
    if (id <= 15) continue;
    if ((id - 16) % SURFACES !== k) continue;
    const xs = meshX.get(id), zs = meshZ.get(id);
    for (let v = 0; v < ys.length; v += 1) {
      const gy = g.get(GKEY(xs[v], zs[v]));
      if (gy === undefined) { miss += 1; continue; }
      if (gy.length > 1) split += 1;
      const r = ys[v] - Math.max(...gy);
      if (r >= rlo && r < rhi) n += 1;
    }
  }
  return { n, miss, split };
};
await new Promise((r) => ws.addEventListener('open', r));
ws.send('1:');
// The camera has to be asked for, or the server sends no `C:` and never ticks a view.
await sleep(400); ws.send('2:1.5,');

const ack = async (prefix, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 50) {
    await sleep(50);
    const m = status.slice(from).find((x) => x.startsWith(prefix));
    if (m) return m;
  }
  return `(no "${prefix}" in ${limitMs}ms)`;
};
// ── ⚠ WAIT FOR THE EVIDENCE, NOT FOR A DURATION — plan 19 `L5` ──────────────
//
// `wait` answers *has this happened* and `last` answers *where did it end up*.
// Neither answers **has the thing being measured actually occurred yet**, and that
// is the gap the `cache` flake lived in: the client re-answers on every `D:` digest,
// and the FIRST answer is `agree 0 bad 24 layers 0` — it has cached nothing, so
// everything disagrees. Read at the wrong moment that is a confident, wrong verdict
// with the right shape, which is the worst kind.
//
// So: poll the newest status line starting with `prefix` until one of its numbered
// fields satisfies a comparison. ⚠ **On timeout it says what it DID see** — an
// instrument that reports only *nothing* cannot be told from one that is blind.
const untilField = async (prefix, field, op, want, limitMs = 60000) => {
  const read = () => {
    const hits = status.filter((x) => x.startsWith(prefix));
    if (hits.length === 0) return null;
    const m = hits[hits.length - 1].match(new RegExp(`${field}\\s+(-?\\d+)`));
    return m ? { line: hits[hits.length - 1], v: +m[1] } : null;
  };
  const holds = (v) => op === '>' ? v > want : op === '>=' ? v >= want
                     : op === '<' ? v < want : op === '<=' ? v <= want : v === want;
  for (let t = 0; t < limitMs; t += 50) {
    const r = read();
    if (r && holds(r.v)) return r.line;
    await sleep(50);
  }
  const r = read();
  return `(never saw '${prefix}' with ${field} ${op} ${want} in ${limitMs}ms; `
       + `newest was ${r ? `'${r.line}'` : 'nothing at all'})`;
};
const nextT = async (limitMs = 15000) => {
  const before = tCount;
  for (let t = 0; t < limitMs; t += 5) { if (tCount !== before) return true; await sleep(5); }
  return false;
};
const pose = () => trace[trace.length - 1] ?? new Array(16).fill(0);
// Facing from the body's own model matrix — the same third column `keyonly` reads,
// so the script and the gate agree about which way the character is looking.
const facing = () => { const m = pose(); return Math.atan2(m[2], m[0]) * 180 / Math.PI; };
// Where the eye is, inverted out of the view matrix: for a rigid `V = R·T(-eye)`,
// `eye = -Rᵀt`. Column-major, so element (row r, col c) is `m[c*4+r]`.
const eyeAt = () => {
  if (!view || view.length < 16) return null;
  const e = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let r = 0; r < 3; r++) s += view[c * 4 + r] * view[12 + r];
    e[c] = -s;
  }
  return e;
};

let snaps = 0;
// ⚠ A judged frame that fails must fail the RUN. A gate that prints FAIL and exits
// 0 is a gate the suite reports as green.
let frameFails = 0;
// HOW FAR BEHIND THE BROWSER IS, measured against the runner's own stream.
//
// ⚠ THE RUNNER IS A CLIENT TOO, and that is what makes this answerable at all. Both
// it and the page are fed the same `M:` broadcasts, so the runner's `meshLen` is the
// set the page is *supposed* to hold — no guess, no clock, no proxy. Anything the
// page is missing is stream it has not caught up with.
// ⚠ AND THE CAMERA TOO, WHICH THE MESH COUNT CANNOT SEE. `C:` is broadcast to both
// sides exactly as `M:` is, so the page's view matrix is comparable against the
// runner's the same way — and it is the one the gates change LAST. `send 40:4` then
// `send 3:0,-20000` then a shot: if the page has not processed those two yet, the
// picture is of the old camera, with every mesh present and correct. That frame reads
// as a renderer fault and is a race.
// ⚠ AND IT ASKS THE PAGE THAT IS ACTUALLY SERVED, WHICH IT DID NOT FOR FOUR DAYS.
//
// This branched on `--client`: without it, the probe read `parts.size` and `view` —
// globals of `html/editor.html`. **That file was deleted on 2026-08-02**, when `/`
// became the wasm client (`editor_server.loft:5357`), and `/` and `/client` have
// served the same page ever since. So the default probe asked a page that does not
// exist, `settle()` never fired, and `snap` and `frame` each burned their full
// 8-second limit — measured at **175 s of `camera_indoors`' 246 s, 71 %**, with the
// diagnostic `parts -1/440, camera STALE` printed twenty times a run and read as lag.
//
// ⚠ THE COMMENT THAT SAID *"a sleep here would be the same mistake as the
// `sleep(4000)` this replaced"* WAS DESCRIBING ITSELF. An accidental fixed wait is
// what the gates have been settling on, and it passed because 8 s is long enough.
//
// ⚠ ONLY THE PROBE MOVED. `WIN` and `CANVAS` still follow `--client`, deliberately:
// they decide the window size and whether the shot is clipped to the canvas, so
// changing them shifts every histogram in every `.keys` file. This file's own §
// measures that — *"FOLLOW read `grass 0.5336` on one and `sky 0.7734` on the
// other"*. A speed fix must leave the numbers alone, and this one does.
const browserLag = async () => {
  // ⚠ THE PAGE REPORTS ITSELF IN ITS OWN HUD, which is weaker than a JavaScript
  // global but is NOT nothing — and "nothing" is what this used to assume.
  // `<pre id="out">` carries `meshes M ... cameras C ... parts R`, so the
  // same two questions can be asked: has it caught up with the wire, and does it
  // have a camera at all.
  //
  // ⚠ WITHOUT THE CAMERA TEST THE FIRST FRAME IS A LIE. The client draws NOTHING
  // before its first `C:` — deliberately, because every vertex would land in one
  // place — so a shot taken early is the clear colour and nothing else: measured,
  // FOLLOW came back `sky 0.995, lum 0.5378`, which is the sky station's own number
  // at a station pointed at the ground.
  const st = await call('Runtime.evaluate', { returnByValue: true, expression:
    `(() => { const el = document.querySelector('#out');
              return el ? el.textContent : ''; })()` });
  const txt = st?.result?.value ?? '';
  const m = [...txt.matchAll(/meshes (\d+),.*?cameras (\d+),.*?parts (\d+)/g)].pop();
  if (!m) return { page: -1, wire: meshLen.size, cam: false };
  return { page: +m[1], wire: meshLen.size, cam: +m[2] > 0 && +m[3] > 0 };
};

// Wait until the page is showing what the runner already knows — every mesh, and
// the same camera. Bounded, and it SAYS SO on timeout rather than photographing the old frame.
//
// ⚠ THE RUNNER IS THE REFERENCE BECAUSE IT IS A CLIENT TOO. Both are fed the same
// broadcasts, so "the page has caught up" is a comparison and not a guess about how
// long a browser needs. A sleep here would be the same mistake as the `sleep(4000)`
// this file's readiness check replaced.
const settle = async (limitMs = 8000) => {
  let last = { page: -1, wire: -1, cam: false };
  for (let t = 0; t < limitMs; t += 100) {
    last = await browserLag();
    // ⚠ `waited` IS REPORTED, or this is an instrument nobody can falsify. A wait
    // that never fires and a wait that is not wired look identical from outside, and
    // the whole point is to know whether the page was ever behind.
    if (last.page >= last.wire && last.cam) return { ...last, waited: t };
    await sleep(100);
  }
  console.log(`  !! the page never caught up — parts ${last.page}/${last.wire}`
            + `, camera ${last.cam ? 'current' : 'STALE'}`);
  return { ...last, waited: limitMs };
};

// ⚠ SETTLE, THEN PHOTOGRAPH, ONCE — and hand back BOTH the PNG and the lag, so the
// caller can save the very bytes that get measured. This used to capture inside
// `frameStats`, so a `snap` and the `frame` beside it took two different pictures of
// what was meant to be one instant, and only one of them reached the disk.
async function capture() {
  if (!(await browser())) return null;
  // ⚠ MEASURED BEFORE THE SHOT, so it describes the frame that is about to be taken
  // rather than the state afterwards — and WAITED FOR, so the frame is of the state
  // the script just set up rather than whatever the page had last drawn.
  const lag = await settle();
  // ⚠ CLIPPED TO THE CANVAS, and that is not framing — it is the difference between a
  // picture and a blank page. An unclipped `Page.captureScreenshot` under
  // `--use-gl=swiftshader` does not composite the WebGL layer: it returns the DOM (the
  // HUD) over white, twice in one session, while `html_render_check.mjs` rendered the
  // same scene at 478 distinct colours by capturing WITH a clip.
  const rect = (await call('Runtime.evaluate', { returnByValue: true, expression: `
    (() => { const el = document.querySelector('${CANVAS}');
             if (!el) return null;
             const r = el.getBoundingClientRect();
             if (r.width < 1 || r.height < 1) return null;
             return { x: r.x, y: r.y, width: r.width, height: r.height }; })()` }))
    ?.result?.value;
  const shot = await call('Page.captureScreenshot',
                          rect ? { format: 'png', clip: { ...rect, scale: 1 } }
                               : { format: 'png' });
  return { shot, lag };
}

// The histogram of ONE captured frame. ⚠ It does not photograph — `capture` did.
//
// ⚠ THROUGH THE SCREENSHOT, NOT `readPixels`. A WebGL context without
// `preserveDrawingBuffer` clears its drawing buffer at composite, so a `readPixels`
// from outside the render loop returns a black frame however good the picture is —
// measured, 49500 samples and every one black while the PNG beside it showed a house.
// So the pixels come back the same way the snapshot's do and are decoded by the page
// itself: no node dependency, and one small payload back.
async function frameStats(cap) {
  if (!cap) return { ok: false, why: 'no browser' };
  const { shot, lag } = cap;
  const r = await call('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
    expression: `
    (async () => {
      const img = new Image();
      img.src = 'data:image/png;base64,${shot.data}';
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const PAL = ${JSON.stringify(CHROMA)};
      const MERGE = ${JSON.stringify(MERGE)};
      // ⚠ AND THE LIGHT, WHICH THE CLASSIFIER IS DELIBERATELY BLIND TO. Buckets are
      // matched on CHROMATICITY so a lit surface and a shadowed one land together —
      // which is what makes the histogram readable, and exactly why it cannot see an
      // ambient change: dimming is a scalar and a ratio divides it out. Mean
      // luminance is the missing half, and it is the one thing SNUG's lower ambient
      // actually changes in the picture.
      const counts = {}, bl = {}, bl2 = {}; let total = 0, lum = 0, lum2 = 0;
      // WARNING - THE WORLD, NOT THE WHOLE CANVAS. The client draws a 240px UI
      // strip down the left (plan 18 B1.3), and these gates classify every pixel
      // into named SURFACES and take shares of the total. An opaque overlay is
      // 20% of the frame that is no surface at all, so counting it moved every
      // share in every gate at once - subject went to 0 and three gates went red
      // on a change that touched no world code.
      //
      // Excluding it is not a threshold nudged to fit: a gate asking what
      // fraction of the view is roof is asking about the VIEW, and the panel is
      // furniture in front of it. The saved snapshot still shows the whole
      // frame, because a human looking at a shot wants the UI in it.
      //
      // WARNING - AND NO BACKTICKS IN THIS COMMENT. The block is inside a JS
      // template literal; the first version of this very note quoted a variable
      // in backticks and stopped the file parsing, which is the trap the older
      // comment forty lines down already warned about.
      for (let y = ${UI_SUBJECT}; y < cv.height - ${UI_STATUS}; y += 4) {
        for (let x = ${UI_STRIP}; x < cv.width; x += 4) {
          const i = (y * cv.width + x) * 4;
          const R = d[i] / 255, G = d[i+1] / 255, B = d[i+2] / 255;
          const s = R + G + B;
          let key;
          if (s < 0.06) key = 'black';
          else {
            const cr = R/s, cg = G/s, cb = B/s;
            let best = null, bd = 1e9;
            for (const [k, c] of PAL) {
              const dd = (cr-c[0])**2 + (cg-c[1])**2 + (cb-c[2])**2;
              if (dd < bd) { bd = dd; best = k; }
            }
            key = bd > 0.0009 ? 'other' : (MERGE[best] ?? best);
          }
          counts[key] = (counts[key] ?? 0) + 1; total += 1;
          // ⚠ AND THE SPREAD *WITHIN* A BUCKET, which is the only thing that can see
          // a lamp. A whole-frame spread cannot: dropping the ambient widens the same
          // histogram, and lamp-on and lamp-off measured 0.1415 against 0.1418. But a
          // FLOOR is ONE PLANE with ONE normal and ONE colour, so with only an ambient
          // and a directional light every floor pixel has the IDENTICAL luminance and
          // the bucket's spread is zero. A light that falls off with distance is the
          // only term that can make it vary. Its signature, not a proxy for it.
          // ⚠ NAMED lm AND NOT y. The loop variable is y, and a second declaration
          // of it here puts the row index in a temporal dead zone one line above its
          // own declaration; the page threw "Cannot access y before initialization"
          // on every frame. The runner reported that instead of crashing, and the
          // message WAS the diagnosis — which is the whole argument for reporting.
          // ⚠ AND NO BACKTICKS ANYWHERE IN THIS BLOCK. It is inside a JS template
          // literal, so one closes the string and the file stops parsing. That is
          // the second time today, the first being a GLSL comment in the client.
          const lm = 0.2126*R + 0.7152*G + 0.0722*B;
          lum += lm; lum2 += lm*lm;
          bl[key] = (bl[key] ?? 0) + lm; bl2[key] = (bl2[key] ?? 0) + lm*lm;
        }
      }
      const mean = lum / total;
      const bsd = {};
      for (const k of Object.keys(counts)) {
        const m = bl[k] / counts[k];
        bsd[k] = Math.sqrt(Math.max(bl2[k] / counts[k] - m*m, 0));
      }
      return { counts, total, lum: mean, bsd,
               sd: Math.sqrt(Math.max(lum2 / total - mean*mean, 0)),
               w: cv.width, h: cv.height };
    })()` });
  const v = r?.result?.value;
  // ⚠ REPORT, NEVER THROW. When the decode rejected, `Runtime.evaluate` handed back
  // the thrown value — truthy, with no `counts` — and `Object.entries(undefined)`
  // killed the whole run with a TypeError three frames from the end. A gate helper
  // that crashes is strictly worse than one that says what it could not measure.
  // ⚠ AND IT PRINTS WHAT THE PAGE SAID. A bare "no frame" sent me looking at the
  // browser, the flags and the server; the page's own exception named the line.
  if (!v || !v.counts) {
    const why = r?.exceptionDetails?.text ?? 'the page returned nothing measurable';
    return { ok: false, why: `no frame — ${why}` };
  }
  const share = {};
  for (const [k, n] of Object.entries(v.counts)) share[k] = +(n / v.total).toFixed(4);
  const ranked = Object.entries(share).sort((a, b) => b[1] - a[1]);
  return {
    subject: share.figure ?? 0,          // the gate's first row: must be > 0
    largest: ranked[0]?.[0], largestShare: ranked[0]?.[1] ?? 0,
    lum: +(v.lum ?? 0).toFixed(4),
    // ⚠ THE SPREAD, WHICH IS WHAT A LAMP CHANGES AND A MEAN CANNOT SHOW. The design's
    // row for a close camera is *"distinct colours > 1 — a black frame is not
    // atmosphere"*, and the failure it names has TWO shapes: a black frame and a flat
    // grey one. Both have a spread of zero. A head-lamp lights what is near and leaves
    // what is far, so contrast is the thing it actually adds — and the mean can be held
    // constant while a picture goes from readable to featureless.
    sd: +(v.sd ?? 0).toFixed(4),
    bsd: Object.fromEntries(Object.entries(v.bsd ?? {}).map(([k, x]) => [k, +x.toFixed(4)])),
    samples: v.total, share, parts: lag.page, wire: lag.wire,
    cam: lag.cam, waited: lag.waited,
  };
}

// The verdict for one frame against one `frame` row's arguments.
//
// ⚠ LIFTED OUT SO IT CAN RUN TWICE, which is the whole of the retry below: the same
// checks against a second shot of the same scene. Inline, a re-shot frame would have
// to duplicate every threshold, and two copies of a gate's own rules is how they
// drift apart.
function judge(f, rest) {
  const wantSub = rest[0] === undefined ? null : Number(rest[0]);
  const wantMax = rest[1] === undefined ? null : Number(rest[1]);
  let verdict = '';
  let bad = 0;
  if (wantSub !== null) {
    if (f.subject < wantSub) { verdict += ` FAIL subject ${f.subject} < ${wantSub}`; bad += 1; }
    if (wantMax !== null && f.largestShare > wantMax) {
      verdict += ` FAIL ${f.largest} ${f.largestShare} > ${wantMax}`; bad += 1;
    }
  }
  for (let i = 2; i + 2 < rest.length + 1; i += 3) {
    const name = rest[i], lo = Number(rest[i + 1]), hi = Number(rest[i + 2]);
    const got = name === 'lum' ? f.lum
              : name === 'sd'  ? f.sd
              : name.startsWith('sd:') ? (f.bsd[name.slice(3)] ?? 0)
              : (f.share[name] ?? 0);
    if (got < lo || got > hi) { verdict += ` FAIL ${name} ${got} outside ${lo}..${hi}`; bad += 1; }
  }
  return { verdict, bad };
}

// ── ⚠ A PHOTOGRAPH IS TAKEN WHERE THE SCRIPT ASKS FOR ONE, AND NOWHERE ELSE ──
//
// `frame` used to take its OWN screenshot. So a script with a `snap` and a `frame`
// beside it photographed the scene TWICE, at two instants, and **the picture on disk
// was never the picture that was judged** — you could look at a PNG that passed while
// a different, unsaved frame is what the verdict came from. `indoors.keys` did that
// twenty times a run.
//
// Now `snap` is the only camera. It captures once, saves the PNG, and keeps the
// histogram; `frame` judges what the last `snap` took. That makes the moment a
// photograph happens something the script says — after an exact `step`, at a named
// tick — rather than something the harness decides, and it makes every judged frame
// an artefact you can open.
//
// ⚠ AND IT IS INVALIDATED BY ANYTHING THAT MOVES THE WORLD. A `frame` after a `step`
// with no `snap` between them would otherwise judge the previous station's picture and
// pass, which is the worst failure available here: a green row about the wrong scene.
// So every command that sends anything clears it, and `frame` says so loudly.
let lastShot = null;

async function snap(name) {
  snaps += 1;
  const tag = name ?? `s${snaps}`;
  // The state dump is the SERVER's — one instant, the same one the picture is of.
  ws.send('31:');
  await ack('snapshot', 10000);
  if (!shots) { console.log(`  … snap ${tag} — state only (pass --shots for a picture)`); return; }
  const cap = await capture();
  if (!cap) return;
  fs.mkdirSync('shots', { recursive: true });
  fs.writeFileSync(`shots/${tag}.png`, Buffer.from(cap.shot.data, 'base64'));
  // ⚠ THE HISTOGRAM OF *THIS* PNG. The picture on disk and the numbers a `frame` row
  // judges are now one capture, so a passing row can be looked at.
  lastShot = { tag, stats: await frameStats(cap) };
  console.log(`  … snap ${tag} → shots/${tag}.png`);
}

const lines = fs.readFileSync(scriptPath, 'utf8').split('\n');

// ⚠ A SCRIPT THAT STEPS IS ASKING FOR A STEPPED CLOCK, AND HAD TO REMEMBER TO SAY SO.
//
// `step n` is documented as "advance exactly n ticks", and at the DEFAULT rate it
// does nothing of the sort. The server's own gate is
//
//     if sim_rate <= 0.0 { may_tick = sim_pending > 0; }
//     else               { may_tick = now_us - last_us >= tick_wait; }
//
// so above rate 0 the pending count is ignored entirely and `step` degrades to a
// wall-clock WAIT while the world free-runs at 30Hz — including through every fixed
// `sleep` between commands, with the walk keys held.
//
// That is the whole of the `deck_soffit` flake, and it took an instrument to see
// because the obvious suspect was wrong: the browser was fully caught up (`parts`
// 404 of a wire 404) on the failing runs, so it was never a streaming lag. What
// differed was the TICK COUNTER — `stepped to 659` on a passing run against `657` on
// a failing one, diverging before the first step and again at each one. A couple of
// extra ticks with W held is a couple of extra centimetres of levelling walk, so the
// deck landed a shade over, and the camera under it caught the floor at the edge:
// `soffit 0.8505` against 0.9975, identically on every failing run because it is a
// discrete difference and not noise.
//
// ⚠ NOT STEPPED FOR EVERYONE. Nine of these scripts never call `step` at all and
// rely on the world advancing by itself — stepping them by default would hang every
// one. The rule keys on what the script actually asks for, which is what `step`
// already means, and a script that sets its own `rate` still wins because its line
// runs after this.
if (lines.some((l) => l.trim().startsWith('step '))) {
  ws.send('34:0');
  await ack('rate', 10000);
}

await sleep(1200);            // the opening burst
// ⚠ THIS WAS `await nextT()`, AND IT COULD NEVER SUCCEED — 15.2 s, every run.
//
// `nextT` waits for a `T:0;` body frame, which `editor_server.loft` broadcasts only
// `if moved`. At this point in a script nothing has been asked to move, so the wait
// always ran to its 15-second limit and returned `false` — into a discarded return
// value, so it never said so. Measured: 15,185 ms on an EMPTY script, 6 % of
// `camera_indoors`. It is right inside `hold`, where the body genuinely is moving,
// and that is where its other four call sites are.
//
// What this line actually wants is *the world is up and the camera exists*, and both
// of those DO arrive unbidden: the opening mesh burst and the first `C:`. So it waits
// for those, and — this tree's own rule — SAYS SO on timeout rather than carrying on.
const upBy = Date.now() + 15000;
while (Date.now() < upBy && (view === null || meshLen.size === 0)) await sleep(25);
if (view === null || meshLen.size === 0) {
  console.log(`  !! the world never came up — ${meshLen.size} meshes, `
            + `camera ${view === null ? 'MISSING' : 'present'}`);
}

for (const raw of lines) {
  const line = raw.trim();
  if (line === '' || line.startsWith('#')) continue;
  const [cmd, ...rest] = line.split(/\s+/);
  console.log(`> ${line}`);
  // ⚠ ANYTHING THAT MOVES THE WORLD DISCARDS THE PICTURE. `frame` judges the last
  // `snap`, so a stale one would be a green row about the previous station's scene —
  // and every reading of it would be wrong in a way no threshold could catch. The
  // list is *what sends*: `cam`, `mesh`, `feet`, `wait`, `echo` and `frame` itself
  // only read, so they leave it standing.
  if (['at', 'key', 'hold', 'turn', 'send', 'keys', 'rate', 'step', 'save'].includes(cmd)) {
    lastShot = null;
  }
  if (cmd === 'at') {
    const [x, z, yaw = 0] = rest.map(Number);
    ws.send(`7:${x},${z},${(yaw * Math.PI) / 180}`);
    console.log('  ' + await ack('placed', 10000));
  } else if (cmd === 'key') {
    const k = rest[0];
    const msg = KEYMAP[k];
    if (!msg) { console.log(`  !! no key '${k}' — add it to KEYMAP and to editor.html`); continue; }
    ws.send(msg);
    await sleep(250);
    const said = status[status.length - 1];
    if (said) console.log('  ' + said);
  } else if (cmd === 'hold') {
    const bit = HELD[rest[0]];
    const want = Number(rest[1]);
    const p0 = pose();
    ws.send(`4:${bit}`);
    let stuck = 0, last = -1;
    for (let n = 0; n < 8000; n++) {
      if (!(await nextT())) break;
      const p = pose();
      const gone = Math.hypot(p[12] - p0[12], p[14] - p0[14]);
      if (gone >= want) break;
      if (Math.abs(gone - last) < 0.0005) { stuck += 1; if (stuck >= 40) break; } else stuck = 0;
      last = gone;
    }
    ws.send('4:0'); await nextT();
    const p = pose();
    console.log(`  moved ${Math.hypot(p[12] - p0[12], p[14] - p0[14]).toFixed(3)} wu`);
  } else if (cmd === 'turn') {
    // ⚠ THE TURN IS ACCUMULATED PER TICK, NOT MEASURED AGAINST THE START, and that
    // is not a refinement — the difference form could not express a half turn at
    // all. It read `d = facing() - a0` normalised into (-180, 180], so `|d|` never
    // EXCEEDS 180 and touches it at one discrete facing the walker steps over: past
    // the halfway point `d` wraps negative and `|d|` starts falling again. So
    // `turn 180` never broke early and ran all 8000 iterations, each awaiting a
    // tick. Measured: 280 seconds, twice, in a gate whose every other line costs
    // milliseconds — 560 s of a 593 s gate was one command that had already arrived.
    //
    // Summing the per-tick step has no such ceiling: a step is small, so normalising
    // THAT is safe, and the total is unbounded — `turn 540` means what it says.
    const want = Number(rest[0]);
    let acc = 0;
    let prev = facing();
    ws.send(`4:${want >= 0 ? 8 : 4}`);
    for (let n = 0; n < 8000; n++) {
      if (!(await nextT())) break;
      const now = facing();
      let d = now - prev;
      while (d > 180) d -= 360; while (d < -180) d += 360;
      acc += d;
      prev = now;
      if (Math.abs(acc) >= Math.abs(want)) break;
    }
    ws.send('4:0'); await nextT();
    console.log(`  facing ${facing().toFixed(1)}°  turned ${acc.toFixed(1)}°`);
  } else if (cmd === 'frame') {
    // ⚠ WHAT IS ACTUALLY ON SCREEN, AS NUMBERS. Every wrong turn in the camera work
    // came from reading a picture by eye: "it does not know about walls" (it does),
    // "the clamp is the fault" (it was, and the frame did not change), "the edge set
    // is empty" (it was full — the counter used the wrong channel). A frame is a
    // histogram, and the row that matters is how much of it is the SUBJECT.
    //
    // `frame` reports; `frame <minSubject> <maxLargest>` also JUDGES, which is what
    // turns the instrument into a gate. Both print the whole histogram, because a
    // pass/fail with no numbers behind it is the thing this replaced.
    // ⚠ IT JUDGES THE PICTURE THE SCRIPT ASKED FOR, and takes none of its own. A
    // `frame` with no `snap` since the last thing that moved the world is a row about
    // an unknown scene, so it FAILS rather than photographing one — silently judging
    // the previous station's frame is the one outcome worse than no row at all.
    if (!lastShot) {
      console.log('  !! no picture to judge — put a `snap <name>` on the tick this row '
                + 'is about. A photograph is taken where the script asks for one.');
      if (rest[0] !== undefined) { frameFails += 1; }
      continue;
    }
    let fs2 = lastShot.stats;
    if (fs2.ok === false) {
      console.log(`  !! ${fs2.why}`);
      if (rest[0] !== undefined) { frameFails += 1; }
      continue;
    }
    const wantSub = rest[0] === undefined ? null : Number(rest[0]);
    // ⚠ AND A NAMED SURFACE, IN A BAND — because "the subject" and "the largest" are
    // questions about the frame as a whole, and some claims are about ONE surface.
    // The roof's underside is the case that needed it: from inside it must be most of
    // what is overhead, and from OUTSIDE it must be absent, because a surface that
    // faces the room is only ever seen from the room. Neither of those is a statement
    // about the biggest bucket. `lum`, `sd` and `sd:<bucket>` ride the same syntax
    // because they are the same kind of claim — a number in a band.
    //
    //   frame <minSubject> <maxLargest> [<name> <lo> <hi>]...
    let { verdict, bad } = judge(fs2, rest);

    // ⚠ A RED IS CONFIRMED BEFORE IT IS REPORTED, and this is the cause-agnostic half
    // of the browser problem. Everything the runner can compare — every mesh, the
    // camera matrix — is waited for before the shot, and the world itself is
    // deterministic now that the clock is stepped. What is left is the one thing this
    // side cannot inspect: whether the compositor handed back the frame that was
    // drawn from that state. So a failing frame is re-settled and re-shot ONCE, and
    // reported only if it fails again.
    //
    // ⚠ IT CANNOT HIDE A REAL FAILURE, because the world does not move between the
    // two shots — nothing is sent, no tick is asked for, and the scene is the same
    // one. A genuine defect fails both; a sampling artefact does not. And a retry
    // that fires SAYS SO on the row, so "it passed on the second look" is never
    // silent — that would be a gate quietly lowering its own bar.
    //
    // ⚠ THE RETRY IS THE SAME REQUESTED PHOTOGRAPH TAKEN AGAIN, not a new one the
    // script did not ask for — and the second PNG REPLACES the first on disk, because
    // the evidence must be the frame that produced the verdict.
    if (bad > 0) {
      const cap2 = await capture();
      const again = await frameStats(cap2);
      if (again.ok !== false) {
        const re = judge(again, rest);
        console.log(`  ⟳ re-shot after ${bad} failed check(s): now ${re.bad}`
                  + ` — ${re.bad === 0 ? 'the first frame was a sampling artefact'
                                       : 'the failure is real'}`);
        fs.writeFileSync(`shots/${lastShot.tag}.png`,
                         Buffer.from(cap2.shot.data, 'base64'));
        lastShot = { tag: lastShot.tag, stats: again };
        fs2 = again; verdict = re.verdict; bad = re.bad;
        if (wantSub !== null && bad === 0) verdict = ' PASS';
      }
    }
    if (wantSub !== null && bad === 0) verdict = ' PASS';
    frameFails += bad;
    console.log('  ' + JSON.stringify(fs2) + verdict);
  } else if (cmd === 'cam') {
    // ⚠ WHERE THE EYE IS, not how long the boom is. The two are different claims
    // and only the first one can be checked against the walls: a boom of 1.87 in a
    // room 3.4 wu wide is unremarkable, and the same boom pointed through a doorway
    // puts the eye in the garden. `dist` cannot tell those apart; a coordinate can.
    //
    // ⚠ AND IT IS THE DIRECT TEST OF THE FAULT THE PIXELS ONLY IMPLY. The camera's
    // ease was solved on every tick and published on none, so the eye stood where
    // the character last MOVED — measured, mid-floor `apart 5.900`, which is the
    // outdoor control's number to the millimetre inside a house. The frame rows
    // catch that as a consequence; this catches it as the thing itself.
    //
    // `cam` reports; `cam <lo> <hi>` judges. Checked against the old build: the
    // control's band passes on both, and BOTH indoor bands fail on it — 5.900
    // against 1.5..3.0 and 2.406 against 3.5..5.2.
    const e = eyeAt(), p = pose();
    if (!e) { console.log('  !! no C: yet — the camera was never asked for'); continue; }
    const d = Math.hypot(e[0] - p[12], e[1] - (p[13] + 0.9), e[2] - p[14]);
    const lo = rest[0] === undefined ? null : Number(rest[0]);
    const hi = rest[1] === undefined ? null : Number(rest[1]);
    let verdict = '';
    if (lo !== null) {
      if (d < lo || d > hi) { verdict = ` FAIL apart ${d.toFixed(3)} outside ${lo}..${hi}`; frameFails += 1; }
      else verdict = ' PASS';
    }
    console.log(`  eye ${e.map((v) => v.toFixed(3)).join(' ')}`
              + `  char ${p[12].toFixed(3)} ${p[13].toFixed(3)} ${p[14].toFixed(3)}`
              + `  apart ${d.toFixed(3)}` + verdict);
  } else if (cmd === 'feet') {
    // ⚠ WHERE THE CHARACTER IS STANDING — the one thing `cam` cannot say. `cam`
    // judges the eye's distance from the body, which is a camera claim; this is a
    // WORLD claim, and a stair is nothing but a sequence of them. Read off the
    // body's own model matrix, the same `pose()` the facing comes from, so it is
    // what the renderer drew and not a number the server re-derived.
    const p = pose();
    const y = p[13];
    let verdict = '';
    if (rest[0] !== undefined) {
      const lo = Number(rest[0]), hi = Number(rest[1]);
      if (y < lo || y > hi) { verdict = ` FAIL feet ${y.toFixed(3)} outside ${lo}..${hi}`; frameFails += 1; }
      else verdict = ' PASS';
    }
    console.log(`  feet ${y.toFixed(3)} at ${p[12].toFixed(2)},${p[14].toFixed(2)}${verdict}`);
  } else if (cmd === 'mesh') {
    // `mesh <surface>` reports; `mesh <surface> <lo> <hi>` judges. No browser: this
    // is the wire, so it costs nothing and works in a headless run.
    const name = rest[0];
    const n = surfaceVerts(name);
    let verdict = '';
    if (rest[1] !== undefined) {
      const lo = Number(rest[1]), hi = Number(rest[2]);
      if (n < lo || n > hi) { verdict = ` FAIL ${name} ${n} outside ${lo}..${hi}`; frameFails += 1; }
      else verdict = ' PASS';
    }
    console.log(`  mesh ${name} = ${n} vertices${verdict}`);
  } else if (cmd === 'meshy') {
    // `meshy <surface> <ylo> <yhi> [lo hi]` — the same wire count, inside a band of
    // world y. Two things of one colour in one surface are one number to `mesh`;
    // this is what tells a ceiling at the ground from a floor's underside twelve
    // units below it.
    const name = rest[0], ylo = Number(rest[1]), yhi = Number(rest[2]);
    const n = surfaceVertsY(name, ylo, yhi);
    let verdict = '';
    if (rest[3] !== undefined) {
      const lo = Number(rest[3]), hi = Number(rest[4]);
      if (n < lo || n > hi) {
        verdict = ` FAIL ${name} in y ${ylo}..${yhi} is ${n}, outside ${lo}..${hi}`;
        frameFails += 1;
      } else verdict = ' PASS';
    }
    console.log(`  meshy ${name} y ${ylo}..${yhi} = ${n} vertices${verdict}`);
  } else if (cmd === 'meshr') {
    // `meshr <surface> <rlo> <rhi> [lo hi]` — the same count, banded on height
    // ABOVE THE GROUND at each vertex's own (x, z) rather than on world y.
    const name = rest[0], rlo = Number(rest[1]), rhi = Number(rest[2]);
    const { n, miss, split } = surfaceVertsR(name, rlo, rhi);
    let verdict = '';
    if (rest[3] !== undefined) {
      const lo = Number(rest[3]), hi = Number(rest[4]);
      if (n < lo || n > hi) {
        verdict = ` FAIL ${name} at ${rlo}..${rhi} above ground is ${n}, outside ${lo}..${hi}`;
        frameFails += 1;
      } else verdict = ' PASS';
    }
    console.log(`  meshr ${name} r ${rlo}..${rhi} = ${n} vertices `
              + `(${miss} over open ground, ${split} at a parted corner)${verdict}`);
  } else if (cmd === 'send') {
    // ⚠ Raw wire, for the messages a KEY should not exist for. `27:1` turns the
    // server's tracer on; binding a key to it would put a diagnostic in the page.
    ws.send(rest.join(' '));
    await sleep(120);
  } else if (cmd === 'keys') {
    ws.send(`4:${rest[0]}`);
    await sleep(60);
  } else if (cmd === 'rate') {
    ws.send(`34:${rest[0]}`);
    console.log('  ' + await ack('rate', 10000));
  } else if (cmd === 'step') {
    // ⚠ The ack arrives when the ticks have been CONSUMED, not when the message
    // landed — that difference is the whole point of stepping.
    ws.send(`35:${rest[0]}`);
    console.log('  ' + await ack('stepped', 60000));
  } else if (cmd === 'save') {
    ws.send(`8:${rest[0]}`);
    console.log('  ' + await ack('saved', 30000));
  } else if (cmd === 'wait') {
    // ⚠ LOOK AT WHAT ALREADY ARRIVED. `ack` scans only messages that land AFTER it
    // is called, which is right for "the next one" and wrong for "has this
    // happened" — and a `key` that prints its own acknowledgement has already
    // consumed it, so `wait` for the same thing sat out the full 40-second limit
    // and carried on. Exactly the fault that cost two gates 80 seconds a run.
    const want = rest.join(' ');
    const seen = status.find((x) => x.startsWith(want));
    console.log('  ' + (seen ?? await ack(want)));
  } else if (cmd === 'until') {
    // `until <prefix> <field> <op> <value>` — e.g. `until cache layers > 0`.
    // ⚠ IT FAILS THE RUN rather than printing and carrying on. A gate that waited
    // for evidence, did not get it, and then judged anyway is exactly the shape
    // this verb exists to remove.
    const [uPrefix, uField, uOp, uVal] = [rest[0], rest[1], rest[2], Number(rest[3])];
    const got = await untilField(uPrefix, uField, uOp, uVal);
    console.log('  ' + got);
    if (got.startsWith('(never saw')) frameFails += 1;
  } else if (cmd === 'last') {
    // ⚠ `wait` ANSWERS "HAS THIS HAPPENED", `last` ANSWERS "WHERE DID IT END UP", and
    // a running tally needs the second. The client's cache and ground verdicts are
    // cumulative and arrive once per chunk, so `wait ground` reports the FIRST of them
    // — which for a guard that holds early tiles is always `0 bad 0 wait 1`, i.e. the
    // moment before the evidence exists. That read as "the guard blocks everything"
    // when it blocked one tile out of forty.
    const want = rest.join(' ');
    const hits = status.filter((x) => x.startsWith(want));
    if (hits.length === 0) console.log(`  !! no status ever started with '${want}'`);
    else console.log(`  ${hits[hits.length - 1]}   (${hits.length} reports)`);
  } else if (cmd === 'snap') {
    await snap(rest[0]);
  } else if (cmd === 'echo') {
    console.log('  ' + rest.join(' '));
  } else {
    console.log(`  !! unknown command '${cmd}'`);
  }
}

if (!keep) { ws.close(); if (cdp) cdp.close(); if (proc) proc.kill(); }
console.log('script done');
// ⚠ A JUDGED FRAME THAT FAILED MUST FAIL THE RUN. A gate that prints FAIL and exits
// 0 is a gate the suite reports as green — which is worse than no gate, because it
// is a green light nobody earned.
if (frameFails > 0) {
  console.log(`script: ${frameFails} frame check(s) failed`);
  process.exit(1);
}
process.exit(0);
