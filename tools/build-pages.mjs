// Copyright (c) 2026 Jurjen Stellingwerff
// SPDX-License-Identifier: LGPL-3.0-or-later
//
// PLAN 22 `B2` — ASSEMBLE `_site/`, THE QUICK-START DEMO.
//
//   node tools/build-pages.mjs            (or `make pages`)
//
// ⚠ THE DEMO IS THE CLIENT ENGINE BUILD, NOT A PAGE BUILT FOR AN AUDIENCE.
// [PAGES_EDITOR § The target shape](../doc/claude/PAGES_EDITOR.md) is explicit:
// *"`_site/index.html` IS THE SAME ARTIFACT THE SERVER SERVES … if the standalone
// page is a different file, there are two pages to keep in step; if it is the same
// file booted differently, there is one."* So this script COPIES `make client`'s
// output and asserts it arrived verbatim. It composes nothing, and the day it
// starts composing is the day there are two pages again.
//
// ⚠ AND THERE IS ALMOST NOTHING TO INLINE, WHICH IS SAID HERE SO THE THINNESS DOES
// NOT READ AS AN OVERSIGHT. loft's `--html` shell already emits ONE self-contained
// file — the wasm and every piece of glue are inside it — so routing's
// `build-site.mjs` bundling step has no counterpart here. The rest of the base tree
// (`data/parts/`) arrives when something in the client READS it; adding it before
// that would be this tree's commonest defect, a thing built and never called.
//
// ── `--servers <url>[,<url>]` — plan 22 `B2b` ───────────────────────────────
//
// The one thing that IS inlined, and only when asked for. A demo opened off a disk
// dials `/ws` against `file://` and reaches nothing, which is correct; this is how
// it can be told that an editor is running somewhere else. It is written as a
// `globalThis.loftBaseFS` prelude ahead of loft's own script — `P6`'s measured
// mechanism, where a page reads its base tree exactly as the interpreter reads a
// directory.
//
// ⚠ IT IS A FLAG RATHER THAN A DEFAULT, and that is the whole safety of it. A
// candidate baked into every demo would have any page on this box silently adopt
// whatever is on that port — somebody's live session, or `probe/b1b/auth.sh`'s run
// B, whose entire subject is a page that finds NO server. The person who wants an
// attachment asks for one; a plain `make pages` produces a page that behaves
// exactly as it did before this existed.
//
// ⚠ THE STALENESS CHECK IS THE ONE THING THIS SCRIPT DECIDES. A demo assembled
// from an engine older than its own sources is the failure mode the design named:
// *"a demo kept forever is exactly the thing that must not be a second program …
// this tree's most-repeated defect is a thing built, green, and never checked
// again."* A silent copy of a stale engine reproduces that with a build step in
// front of it, so an out-of-date engine is REFUSED rather than shipped.
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// ⚠ `--engine <path>` ASSEMBLES A DIFFERENT CLIENT BUILD, and it exists for one
// caller: a sabotage sweep (`probe/b6`) that builds a broken client beside the real
// one and needs it assembled with THIS prelude — the overlay below is the subject of
// that sweep, and a page copied raw would test the engine without it.
const engFlag = process.argv.indexOf('--engine');
const ENGINE = engFlag < 0 ? join(root, 'src', '.loft', 'editor_client.html')
                           : resolve(process.argv[engFlag + 1] ?? '');
const SITE = join(root, '_site');
const INDEX = join(SITE, 'index.html');

const die = (msg) => { console.error(`build-pages: ${msg}`); process.exit(1); };

if (!existsSync(ENGINE)) {
  die(`no client engine build at src/.loft/editor_client.html — run \`make client\` first.\n`
    + `            The demo IS that artifact; there is no second page to fall back to.`);
}

// ── Is the engine older than what it was built from? ────────────────────────
//
// ⚠ A TIMESTAMP IS A HEURISTIC AND IT IS THE RIGHT ONE HERE, which is worth saying
// because `tools/run-gates.sh` refuses exactly this reasoning for the server binary
// ("the build is never skipped on a guess"). The difference is what the two do with
// the answer: the gate runner would SKIP a rebuild on a timestamp, so a wrong answer
// runs old code silently. This only ever REFUSES — a false alarm costs one
// `make client`, and the failure it is guarding against is the silent one.
const engineAt = statSync(ENGINE).mtimeMs;
const sources = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.loft')) sources.push(p);
  }
};
walk(join(root, 'src'));
walk(join(root, 'lib'));
const newer = sources.filter((p) => statSync(p).mtimeMs > engineAt);
if (newer.length) {
  const show = newer.slice(0, 5).map((p) => '              ' + p.slice(root.length + 1)).join('\n');
  die(`the client engine is OLDER than ${newer.length} of its sources — run \`make client\`.\n`
    + `            A demo assembled from a stale engine passes its own gate and ships\n`
    + `            last week's editor:\n${show}`
    + (newer.length > 5 ? `\n              … and ${newer.length - 5} more` : ''));
}

// ── THE PART LIBRARY, BAKED IN — plan 22 `B2c` ──────────────────────────────
//
// `data/parts/` becomes the page's base tree at `/data/parts`, which is where
// `editor_client.loft`'s `LOCAL_PARTS` looks. ⚠ It is an ABSOLUTE root because a
// page has no working directory; `probe/b1c/parts.mjs` measured a page listing 20
// parts from exactly this path, against the interpreter's own 20 for the real
// directory.
//
// ⚠ INLINED RATHER THAN FETCHED, and that is `file://`'s doing: a `fetch()` of a
// sibling file is blocked by CORS off a disk, which is the constraint
// [PAGES_EDITOR § quick start](../doc/claude/PAGES_EDITOR.md) derives from the word
// "no install". So the bytes ride in the HTML.
//
// ⚠ AND THEY ARE BASE64, BECAUSE A PART IS BINARY. `loftBaseFS` takes
// `string | Uint8Array`; a `.hxw` put in as a JS string would be mangled by exactly
// the encoding trap that cost this file an em dash — so the prelude decodes to
// bytes and nothing is decoded twice.
const partsRoot = join(root, 'data', 'parts');
const parts = {};
const walkParts = (dir, at) => {
  for (const e of readdirSync(dir).sort()) {
    const q = join(dir, e);
    if (statSync(q).isDirectory()) walkParts(q, `${at}/${e}`);
    else parts[`${at}/${e}`] = readFileSync(q).toString('base64');
  }
};
// ⚠ `--no-parts` IS THE CONTROL, NOT AN OPTION ANYBODY NEEDS. `probe/b2` uses it to
// show that the catalogue's rows come from the baked library rather than from the
// page being a page — a demo built without it must find nothing.
const noParts = process.argv.includes('--no-parts');
if (existsSync(partsRoot) && !noParts) walkParts(partsRoot, '/data/parts');
const partBytes = Object.values(parts).reduce((n, b) => n + Math.floor(b.length * 3 / 4), 0);

// ── The servers this demo may be told about ─────────────────────────────────
const flag = process.argv.indexOf('--servers');
const servers = flag < 0 ? [] : (process.argv[flag + 1] ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);
if (flag >= 0 && !servers.length) die('--servers was given no url');
for (const u of servers) {
  // ⚠ REFUSED HERE RATHER THAN DISCOVERED IN A BROWSER. A relative path in this
  // list is not a second origin — it is `/ws` again, spelled by somebody who meant
  // a host — and it would spend `LOCAL_AFTER` frames re-dialling the candidate the
  // page already tried first.
  if (!/^wss?:\/\//.test(u)) die(`--servers takes ws:// or wss:// urls; got '${u}'`);
}

// ⚠ AHEAD OF LOFT'S OWN SCRIPT, WHICH IS THE ONLY PLACE IT WORKS. `loftBaseFS` is
// read when the filesystem is constructed at boot, so a prelude appended after that
// script is a tree nobody ever looks at — and it would fail SILENTLY, as an absent
// file rather than as an error.
//
// ⚠ ASCII ONLY, AND IT IS THE WRITE PATH THAT SAYS SO RATHER THAN TASTE. The first
// version put an em dash in this comment line and the byte-count assertion below
// caught it MANGLED in the page: splicing a string into a 4.7 MB binary means one
// encoding for both, and latin1 — the only lossless one for the engine's bytes —
// truncates every code point above 0xFF. The splice is Buffers now, which removes
// the trap; the ASCII stays because a file the page PARSES should not depend on
// having got that right.
// ⚠ ONE PRELUDE, ONE `loftBaseFS`. Two script tags each assigning it would leave
// whichever ran last, silently — the page would boot with a library and no servers,
// or the reverse, and both look like a working demo.
const baseText = {};
if (servers.length) {
  baseText['/servers.txt'] = `# plan 22 B2b: where this demo may look for an editor.\n`
                           + `# The page's own origin is always tried first.\n`
                           + servers.map((s) => s + '\n').join('');
}
const fsChunk = (Object.keys(parts).length || Object.keys(baseText).length)
  ? `globalThis.loftBaseFS = (() => {
  const t = ${JSON.stringify(baseText)}, b = ${JSON.stringify(parts)}, o = {};
  for (const k in t) o[k] = t[k];
  for (const k in b) { const s = atob(b[k]); const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); o[k] = u; }
  return o; })();`
  : '';

// -- THE CANVAS FILLS THE WINDOW -- plan 22 `B5` ----------------------------
//
// The shell asks the program what size to be and the program answers with two
// constants, so the page it produces is a 1200x660 rectangle centred on black
// whatever the window is. This makes the canvas the window instead, and the
// client reads the size back through `gl_window_width`/`gl_window_height` rather
// than trusting the size it asked for.
//
// WHY IT IS HERE AND NOT IN THE PROGRAM: a loft program cannot reach the DOM.
// `gl_create_window` sets `canvas.width`, `canvas.style.width` and `display` and
// nothing else ever changes them; the element's box is the page's business.
//
// THE BACKING STORE IS SET AT ONE DEVICE PIXEL PER CSS PIXEL, DELIBERATELY. The
// shell allocates `w * devicePixelRatio` so a program that follows its advice is
// crisp on a dense display -- but this client lays its PANEL out in the same
// pixels, so honouring the ratio would render the toolbar and the catalogue at
// half size on a 2x screen. Matching CSS pixels keeps the UI the size it was
// designed at; the cost is that the picture is not retina-sharp, and that is a
// trade to revisit when the panel can scale.
//
// AND IT IS DEBOUNCED, because a drag fires `resize` continuously and every
// change costs the client a rebuild of 49 offscreen images. 150 ms after the
// person stops is one rebuild per resize instead of one per frame.
//
// THE POLL EXISTS BECAUSE THERE IS NO BOOT EVENT. The canvas is `display:none`
// until `gl_create_window` runs, which is several seconds into a 5.6 MB wasm
// boot; sizing it before then would be overwritten by the shell's own inline
// style. It stops at the first success, and it is the only loop here.
const fitChunk = `(() => {
  var deb = 0;
  var fit = function () {
    var c = document.getElementById('c');
    if (!c || c.style.display === 'none') return false;
    var w = Math.max(320, document.documentElement.clientWidth);
    var h = Math.max(240, document.documentElement.clientHeight);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return true;
  };
  var t = setInterval(function () { if (fit()) clearInterval(t); }, 100);
  addEventListener('resize', function () {
    clearTimeout(deb); deb = setTimeout(fit, 150);
  });
  var st = document.createElement('style');
  st.textContent = 'html,body{height:100%;overflow:hidden}';
  document.head.appendChild(st);
})();`;

// -- THE PLAN OVER THE CANVAS -- plan 26 `B6` -------------------------------
//
// The client draws a plan of where the author stands (`m`) and hands the SVG out
// through `host_output` as `plan:<svg>`; this puts it over the canvas. A click on it
// goes back as `pick:<x>,<y>` in the PICTURE'S OWN UNITS -- `getScreenCTM` is the
// browser's inverse of the `viewBox`, so what the client receives is exactly the
// number its `plan_pick` divides by, and no scale is spelled twice. An empty
// `plan:` takes the overlay down.
//
// WHY IT IS HERE AND NOT IN THE PROGRAM: a loft program cannot reach the DOM, and
// the DOM is what makes a 300 KB SVG a picture with a click on it for free.
//
// THE CANVAS KEEPS THE KEYBOARD. loft binds keydown to the canvas, so a click that
// moved focus to the overlay would leave every key after it going nowhere -- the
// exact transcript `probe/b1b` documents for a page nobody has clicked. `mousedown`
// is cancelled so focus stays put, and the click is read on `click`.
//
// THE QUEUE IS PRE-CREATED, `probe/p2`'s finding: the engine shell makes `loftPush`
// lazily inside the first `host_input()`, so a click that landed before the client
// ever polled would have nowhere to go. Creating it here is idempotent with the
// shell's own.
//
// `--plan-sabotage nopush|noshow` builds the CONTROL pages for `probe/b6`: the click
// that pushes nothing, and the overlay that never appears. Neither is an option
// anybody wants; they exist so the gate can be seen red on the JavaScript half.
const psFlag = process.argv.indexOf('--plan-sabotage');
const planSab = psFlag < 0 ? '' : (process.argv[psFlag + 1] ?? '');
if (psFlag >= 0 && !['nopush', 'noshow'].includes(planSab)) {
  die(`--plan-sabotage takes nopush or noshow; got '${planSab}'`);
}
const planChunk = `(() => {
  if (!globalThis.__loftInQ) {
    globalThis.__loftInQ = [];
    globalThis.loftPush = function (m) {
      globalThis.__loftInQ.push(new TextEncoder().encode(String(m)));
    };
  }
  var box = null;
  var pick = function (e) {
    var s = box.querySelector('svg');
    if (!s) return;
    var pt = s.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(s.getScreenCTM().inverse());
    ${planSab === 'nopush'
      ? "console.log('[plan] SABOTAGE nopush ' + p.x.toFixed(4) + ',' + p.y.toFixed(4));"
      : "globalThis.loftPush('pick:' + p.x.toFixed(4) + ',' + p.y.toFixed(4));"}
  };
  var show = function (svg) {
    if (!box) {
      box = document.createElement('div');
      box.id = 'plan';
      box.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;'
        + 'justify-content:center;background:rgba(0,0,0,0.55);z-index:10;cursor:crosshair';
      box.addEventListener('mousedown', function (e) { e.preventDefault(); });
      box.addEventListener('click', pick);
      document.body.appendChild(box);
    }
    if (!svg) { box.hidden = true; box.innerHTML = ''; return; }
    ${planSab === 'noshow'
      ? "console.log('[plan] SABOTAGE noshow ' + svg.length + ' bytes'); return;"
      : ""}
    box.innerHTML = svg;
    box.hidden = false;
    var s = box.querySelector('svg');
    if (!s) return;
    var vw = s.viewBox.baseVal.width, vh = s.viewBox.baseVal.height;
    var k = Math.min(innerWidth * 0.94 / vw, innerHeight * 0.94 / vh);
    s.setAttribute('width', String(Math.round(vw * k)));
    s.setAttribute('height', String(Math.round(vh * k)));
  };
  var prior = globalThis.loftOutput;
  globalThis.loftOutput = function (m) {
    m = String(m);
    if (m.slice(0, 5) === 'plan:') show(m.slice(5));
    else if (prior) prior(m);
    else console.log('[loft:out]', m);
  };
})();`;

// -- THE CONTROLLER -- CONTROLS section 6, step C1 --------------------------
//
// loft's graphics layer has no gamepad and neither does the --html shell, so the
// page reads `navigator.getGamepads()` itself and hands the sticks to the client
// through the same queue the plan's pick uses: `pad:<lx>,<ly>,<rx>,<ry>`, pushed ON
// CHANGE only, after a deadzone and rounded to two decimals so a resting stick's
// noise is not a message stream. A pad that goes away pushes a centred stick, so a
// walker is never left walking on a cable that came out.
//
// `--pad-sabotage nopad` is `probe/stick`'s control: the reader runs, logs what it
// read, and pushes nothing.
const padFlag = process.argv.indexOf('--pad-sabotage');
const padSab = padFlag < 0 ? '' : (process.argv[padFlag + 1] ?? '');
if (padFlag >= 0 && padSab !== 'nopad') die(`--pad-sabotage takes nopad; got '${padSab}'`);
const padChunk = `(() => {
  if (!navigator.getGamepads) return;
  if (!globalThis.__loftInQ) {
    globalThis.__loftInQ = [];
    globalThis.loftPush = function (m) {
      globalThis.__loftInQ.push(new TextEncoder().encode(String(m)));
    };
  }
  var DEAD = 0.15, last = '', had = false;
  var q = function (v) {
    if (v > -DEAD && v < DEAD) return 0;
    var s = (Math.abs(v) - DEAD) / (1 - DEAD);
    if (s > 1) s = 1;
    return Math.round((v < 0 ? -s : s) * 100) / 100;
  };
  var poll = function () {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var p = null;
    for (var i = 0; i < pads.length; i++) { if (pads[i] && pads[i].connected) { p = pads[i]; break; } }
    var msg = p ? 'pad:' + q(p.axes[0] || 0) + ',' + q(p.axes[1] || 0) + ','
                        + q(p.axes[2] || 0) + ',' + q(p.axes[3] || 0)
                : (had ? 'pad:0,0,0,0' : '');
    if (p) had = true; else if (msg) had = false;
    if (msg && msg !== last) {
      last = msg;
      ${padSab === 'nopad' ? "console.log('[pad] SABOTAGE nopad ' + msg);" : "globalThis.loftPush(msg);"}
    }
    requestAnimationFrame(poll);
  };
  addEventListener('gamepadconnected', function (e) {
    console.log('[pad] connected: ' + e.gamepad.id + ' (' + e.gamepad.axes.length + ' axes)');
  });
  requestAnimationFrame(poll);
})();`;

const chunks = [fsChunk, fitChunk, planChunk, padChunk].filter(Boolean);
const prelude = chunks.length
  ? Buffer.from(`<script>${chunks.join('\n')}</script>\n`, 'utf8')
  : null;

// ── The copy, and the assertion that it is one ──────────────────────────────
mkdirSync(SITE, { recursive: true });
const bytes = readFileSync(ENGINE);
let out = bytes;
if (prelude) {
  // ⚠ THE SEARCH IS ON THE BUFFER, so the engine's bytes are never decoded at all.
  const at = bytes.indexOf(Buffer.from('<script>', 'utf8'));
  if (at < 0) die('no <script> in the engine build — the prelude has nowhere to go');
  out = Buffer.concat([bytes.subarray(0, at), prelude, bytes.subarray(at)]);
}
writeFileSync(INDEX, out);

// ⚠ READ BACK AND COMPARE, because the claim of this script is *the demo is the
// same artifact* and a write is not a proof of one. It costs one read of a 4.7 MB
// file and it is the only invariant here that could ever be false. With a prelude
// the claim weakens by exactly one thing — the engine bytes are still all there, in
// order, and something was put in front of them.
const back = readFileSync(INDEX);
if (!prelude && !back.equals(bytes)) die('the written page is not byte-identical to the engine build');
if (prelude && !back.includes(prelude)) die('the base-tree prelude did not reach the page');
if (prelude && back.length !== bytes.length + prelude.length) {
  die('the page is not the engine build plus a prelude — something else changed');
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`build-pages: _site/index.html  ${kb(out.length)}  (the client engine build, verbatim`
          + (engFlag < 0 ? ')' : ` -- from ${process.argv[engFlag + 1]})`)
          + (planSab ? `  PLAN SABOTAGE ${planSab}` : '')
          + (padSab ? `  PAD SABOTAGE ${padSab}` : ''));
if (Object.keys(parts).length) {
  console.log(`build-pages: and the part library — ${Object.keys(parts).length} files, `
            + `${kb(partBytes)} raw, baked at /data/parts`);
}
if (servers.length) {
  console.log(`build-pages: and ${servers.length} server candidate(s) after its own origin:`);
  for (const s of servers) console.log(`             ${s}`);
} else {
  console.log(`build-pages: open it from file:// — no server, no toolchain, no port.`);
}
