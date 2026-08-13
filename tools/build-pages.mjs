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
// ⚠ AND THERE IS NOTHING TO INLINE YET, WHICH IS SAID HERE SO THE THINNESS DOES
// NOT READ AS AN OVERSIGHT. loft's `--html` shell already emits ONE self-contained
// file — the wasm and every piece of glue are inside it — so routing's
// `build-site.mjs` bundling step has no counterpart here. The base tree
// (`data/parts/`, as a `globalThis.loftBaseFS` prelude, measured by `P6`) arrives
// when something in the client READS a file; adding it before that would be this
// tree's commonest defect, a thing built and never called.
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

// ── The copy, and the assertion that it is one ──────────────────────────────
mkdirSync(SITE, { recursive: true });
const bytes = readFileSync(ENGINE);
writeFileSync(INDEX, bytes);

// ⚠ READ BACK AND COMPARE, because the claim of this script is *the demo is the
// same artifact* and a write is not a proof of one. It costs one read of a 4.7 MB
// file and it is the only invariant here that could ever be false.
const back = readFileSync(INDEX);
if (!back.equals(bytes)) die('the written page is not byte-identical to the engine build');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`build-pages: _site/index.html  ${kb(bytes.length)}  (the client engine build, verbatim)`);
console.log(`build-pages: open it from file:// — no server, no toolchain, no port.`);
