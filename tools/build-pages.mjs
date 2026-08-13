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
const ENGINE = join(root, 'src', '.loft', 'editor_client.html');
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
const prelude = servers.length
  ? Buffer.from(`<script>globalThis.loftBaseFS = ${JSON.stringify({
      '/servers.txt': `# plan 22 B2b: where this demo may look for an editor.\n`
                    + `# The page's own origin is always tried first.\n`
                    + servers.map((s) => s + '\n').join(''),
    })};</script>\n`, 'utf8')
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
if (prelude && !back.includes(prelude)) die('the servers prelude did not reach the page');
if (prelude && back.length !== bytes.length + prelude.length) {
  die('the page is not the engine build plus a prelude — something else changed');
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`build-pages: _site/index.html  ${kb(out.length)}  (the client engine build, verbatim)`);
if (servers.length) {
  console.log(`build-pages: and ${servers.length} server candidate(s) after its own origin:`);
  for (const s of servers) console.log(`             ${s}`);
} else {
  console.log(`build-pages: open it from file:// — no server, no toolchain, no port.`);
}
