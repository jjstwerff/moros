// A LIMB'S BLOCKOUT COMES OUT AS A `.glb` — plan 17 `A8.6`, §P9.4.
//
// ⚠ CHECKED AND LEFT WHOLE, and it needs a running editor by construction: the
// blockout mesher lives in `editor_server.loft` (`part_body_meshes`), so there is no
// library call a loft test could make instead. What it asserts is the round trip's
// first half — block out in cells, get geometry a tool can open.
//
// Three claims:
//
//   i    in PART mode `22:` exports the open part's own cells, not the placeholder
//        box. `door/leaf` is one wall panel, so its blockout is small and exact.
//   ii   ⚠ THE CONTROL: in a WORLD the same message still hands out the box. The
//        mode decides what the gesture means (`8:`'s rule, `A7.3c`), and a change
//        that made export part-only would pass every check about parts.
//   iii  ⚠ AND A COUNT IS NOT A FILE. The bytes on disk are read back and must be a
//        real glb — magic, and a size that could hold the vertices claimed. An
//        export that wrote nothing acknowledges identically.
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { connect, send, said, checker, verdict } from '../lib.mjs';

const check = checker();
const OUT = `${process.env.TMPDIR ?? '/tmp'}/a86-blockout.glb`;
const BOX = `${process.env.TMPDIR ?? '/tmp'}/a86-world.glb`;
for (const f of [OUT, BOX]) { if (existsSync(f)) unlinkSync(f); }

const g = await connect();
const verts = (line) => Number((line.match(/exported (\d+) vertices/) ?? [])[1] ?? 0);

// ── ii — a WORLD export is still the box ───────────────────────────────────
await send(g, '44:', ['part ']);
const worldSaid = said(await send(g, `22:${BOX}`, ['exported', 'refused']), 'exported');
const worldVerts = verts(worldSaid);
check(worldVerts > 0, `a world export still hands out the box (${worldVerts} vertices)`);

// ── i — a PART export is the part's own cells ──────────────────────────────
await send(g, '44:door/leaf', ["part 'door/leaf'"]);
const partSaid = said(await send(g, `22:${OUT}`, ['exported', 'refused']), 'exported');
const partVerts = verts(partSaid);
check(partVerts > 0, `a part export hands out its blockout (${partVerts} vertices)`);
// ⚠ THE TWO MUST DIFFER, and that is the row with teeth: a handler that ignored the
// mode would answer the box's vertex count here and satisfy every other check.
check(partVerts !== worldVerts,
      `and it is NOT the placeholder box (${partVerts} against the world's ${worldVerts})`);

// ── iii — the file is real ─────────────────────────────────────────────────
const wrote = existsSync(OUT);
check(wrote, `the file reached the disk (${OUT})`);
const bytes = wrote ? readFileSync(OUT) : Buffer.alloc(0);
check(bytes.length > 0 && bytes.slice(0, 4).toString() === 'glTF',
      `and it is a glb — magic ${JSON.stringify(bytes.slice(0, 4).toString())}, `
    + `${bytes.length} bytes`);
// A vertex is 3 floats of position and 3 of normal; a glb that claims N of them and
// is smaller than their raw size cannot be holding what it acknowledged.
check(bytes.length >= partVerts * 24,
      `and it is big enough for the ${partVerts} vertices it claims (${bytes.length} `
    + `bytes against ${partVerts * 24} of raw position and normal)`);

// ── and a part with NO cells is refused rather than written ────────────────
//
// ⚠ `prop/statue` IS A MESH AND NOTHING ELSE, so there is no blockout to hand over.
// Writing an empty file would give an author a `.glb` they would take to be their
// work — the silent-absence shape this tree keeps paying for.
await send(g, '44:', ['part ']);
await send(g, '44:prop/statue', ["part 'prop/statue'"]);
const EMPTY = `${process.env.TMPDIR ?? '/tmp'}/a86-empty.glb`;
if (existsSync(EMPTY)) unlinkSync(EMPTY);
const emptySaid = await send(g, `22:${EMPTY}`, ['exported', 'refused']);
check(emptySaid.some((s) => s.includes('export refused')),
      `a part with no cells is refused (${said(emptySaid, 'export refused') || said(emptySaid, 'exported')})`);
check(!existsSync(EMPTY), 'and nothing was written for it');
await send(g, '44:', ['part ']);

verdict(g, 'part_export', check,
        { worldVerts, partVerts, bytes: bytes.length });
