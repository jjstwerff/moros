// ⚠ CHECKED AND LEFT WHOLE — the subject is the SERVER's own filesystem sweep, and
// there is no library function to test instead. *The catalogue is exactly what is on
// disk* is a claim about a process watching a directory once a second and broadcasting
// `N:` when it changes; a part appearing or disappearing is the input, and the wire is
// the output. Nothing here restates a store rule.
//
// ⚠ AND ITS LAST WAIT IS A FIXED DURATION ON PURPOSE. *An unchanged library sends
// nothing in 4 s* is a claim about an ABSENCE over a window — there is no event to
// wait for, so a duration is the instrument rather than a shortcut. The other three
// waits poll for the `N:` the sweep announces itself with.
// `N:` — THE CATALOGUE IS THE LIBRARY, AND THE LIBRARY CAN CHANGE.
//
// Plan 17 `A7.1`. Two claims, and the second is the one that was false:
//
//   A7.1a  the catalogue's parts are EXACTLY what is on disk — none missing, none
//          invented. `subject.mjs` checked `parts.length >= 1` and that the cottage
//          was among them, which a server listing one part of five passes happily.
//          Four prop parts were added in `A6.2`/`A6.3` and no gate could see them.
//
//   A7.1b  a part that appears while the editor is running gets a row and a
//          picture, and one that goes away loses them. Until `A7.1` it did not:
//          `catalogue_wire` went out once per connection under the comment *"the
//          catalogue does not change during a session"*, while the loop beside it
//          polled the same library twice a second for CONTENT. That is a wall in
//          front of `A7.3` — *open a part, edit, save back* — because saving a new
//          part into a list that cannot grow is a gesture with no visible effect.
//
// ⚠ THE INSERTED PART SORTS **FIRST**, AND THAT IS THE WHOLE TEST. A catalogue row
// index is positional — `surface_count() + i` over a sorted list — and `W:`/`Y:`
// address a row. So inserting at the front renames every row after it, and a server
// that re-sent only the new part's picture would leave every other thumbnail
// addressed to its neighbour: all five drawn, four wrong, every count still
// agreeing. Inserting at the END would pass that broken server.
//
// ⚠ AND IT WRITES INTO `EDITOR_PARTS`, NEVER `data/parts/`. `tools/run-gates.sh`
// hands every gate its own copy of the library; editing the committed one would
// corrupt a tree two agents share and leave the repository dirty on failure.
import { readdirSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { connect, send, ask, said, until, quiet, absenceWindow, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';

const check = checker();

// What is on disk, read by the GATE rather than asked of the server — the two must
// agree and only one of them can be wrong at a time. ⚠ It mirrors
// `hex_part::part_list`: one level of directories plus the top level, `.hxw` only.
function onDisk(root) {
  const out = [];
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const f of readdirSync(`${root}/${e.name}`)) {
        if (f.endsWith('.hxw')) out.push(`${e.name}/${f.slice(0, -4)}`);
      }
    } else if (e.name.endsWith('.hxw')) {
      out.push(e.name.slice(0, -4));
    }
  }
  return out.sort();
}


const partsOf = (n) => (n ?? 'N:').slice(2).split(';').filter(Boolean)
    .map((r) => r.split('|'))
    .filter((f) => f[0] === 'part')
    .map((f) => f[1]);

const g = await connect();
// ── ⚠ WAIT FOR THE EVIDENCE, NOT FOR A CLOCK — except where the claim IS a duration ──
//
// This gate slept 14 s in four waits. Three of them were waiting for the server's
// once-a-second library sweep to notice a file, which is evidence that arrives on the
// wire as an `N:` — so they poll for it and finish in a fraction of the guess.
//
// ⚠ THE FOURTH ONE STAYS A FIXED WAIT, AND MUST. *"An unchanged library sends
// nothing"* is a claim about an ABSENCE over a window: there is no event to wait for,
// and polling for one would either return immediately (proving nothing) or hang. A
// duration is the instrument there, not a shortcut — see the control at the end.
// The thumbnails, settled: `W:` traffic gone quiet rather than a guess at how long a
// re-mesh of every row takes.
const camsQuiet = (quietMs = 600) => quiet(() => g.cams.length, quietMs, 20000, 'the thumbnails');
await until(() => g.cats.length >= 1, 'the catalogue never arrived');
await camsQuiet();

// ── A7.1a — the list IS the library ──────────────────────────────────────────

const disk = onDisk(ROOT);
// ⚠ THE INSTRUMENT, CHECKED AGAINST SOMETHING IT SHOULD FIND. A reader that
// returned nothing — wrong path, wrong extension — makes *every part on disk is
// listed* vacuously true, and this gate would then be green on an empty answer.
check(disk.includes('house/cottage'),
      `the gate can read the library itself (${disk.length} parts: ${disk.join(',')})`);

check(g.cats.length === 1, `the catalogue arrives once on connect (${g.cats.length})`);
const listed = partsOf(g.cats[0]).sort();
const missing = disk.filter((p) => !listed.includes(p));
const invented = listed.filter((p) => !disk.includes(p));
check(missing.length === 0,
      `every part on disk is in the catalogue (missing: ${missing.join(',') || 'none'})`);
check(invented.length === 0,
      `and the catalogue names nothing that is not (invented: ${invented.join(',') || 'none'})`);

// ── A7.1b — a part appears, and the list follows ─────────────────────────────

// ⚠ `aaa/` SORTS BEFORE EVERY EXISTING FAMILY, so every existing row shifts by one.
const NEWDIR = `${ROOT}/aaa_probe`;
const NEWPART = 'aaa_probe/first';
const seed = existsSync(`${ROOT}/house/cottage.hxw`)
  ? `${ROOT}/house/cottage.hxw` : `${ROOT}/${disk[0]}.hxw`;

const camsBefore = g.cams.length;
mkdirSync(NEWDIR, { recursive: true });
copyFileSync(seed, `${NEWDIR}/first.hxw`);

// The server sweeps once a second, and the sweep announces itself with an `N:`.
const catsBeforeAdd = g.cats.length;
await until(() => g.cats.length > catsBeforeAdd, 'the added part was never noticed');
await camsQuiet();

check(g.cats.length >= 2, `a part appearing re-sends the catalogue (${g.cats.length} N:)`);
const after = partsOf(g.cats[g.cats.length - 1]);
check(after.includes(NEWPART),
      `and the new part is in it: ${JSON.stringify(after)}`);
check(after.length === listed.length + 1,
      `the list grew by exactly one (${listed.length} → ${after.length})`);
// ⚠ IT IS FIRST, which is what makes the row check below mean anything.
check(after[0] === NEWPART,
      `and it sorts first, so every other row moved (${after[0]})`);

// ⚠ EVERY ROW'S PICTURE CAME AGAIN, NOT JUST THE NEW ONE. A `W:` leads each part's
// thumbnail set, so counting the DISTINCT rows carried by the cameras that arrived
// after the insert says how many parts were re-addressed. One is the bug.
const fresh = g.cams.slice(camsBefore);
const freshRows = new Set(fresh.map((s) => s.slice(2).split(';')[0]));
check(freshRows.size === after.length,
      `every row's thumbnail was re-sent, not only the new one `
    + `(${freshRows.size} rows re-addressed of ${after.length} parts)`);

// ── the part goes away again ─────────────────────────────────────────────────

const catsBeforeRm = g.cats.length;
rmSync(NEWDIR, { recursive: true, force: true });
await until(() => g.cats.length > catsBeforeRm, 'the removed part was never noticed');
await camsQuiet();

check(g.cats.length > catsBeforeRm,
      `a part disappearing re-sends the catalogue (${g.cats.length} N:)`);
const back = partsOf(g.cats[g.cats.length - 1]).sort();
check(!back.includes(NEWPART), `and it is gone from the list (${back.join(',')})`);
check(back.join(',') === listed.join(','),
      `the catalogue is what it was before (${back.join(',')} vs ${listed.join(',')})`);

// ⚠ THE CONTROL, AND WITHOUT IT THE WHOLE GATE IS SATISFIED BY A SERVER THAT
// BROADCASTS THE CATALOGUE EVERY TICK. Nothing changed in this window, so nothing
// may be sent — a list that re-sends unprompted is a list the client must re-render
// once a second, and every check above passes on it.
const catsBeforeQuiet = g.cats.length;
await absenceWindow(4000, 'no event marks this — see the check below');
check(g.cats.length === catsBeforeQuiet,
      `an unchanged library sends nothing (${g.cats.length - catsBeforeQuiet} extra N: in 4 s)`);

verdict(g, 'library', check);
