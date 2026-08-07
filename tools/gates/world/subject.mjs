// ⚠ CHECKED AND LEFT WHOLE — the subject line is AUTHORED BY THE SERVER, which is the
// whole point of it (plan 18 `B1.5`), so every claim here is about what the server sent
// and when. A client that echoed its own keystroke would show the same words and mean
// nothing; that is the failure the control below exists for.
//
// ⚠ AND ITS REFUSAL CHECK IS A FIXED WAIT ON PURPOSE. *A REFUSED toggle sends no `H:`
// at all* is a claim about something NOT arriving: there is no event to poll for, so
// the window IS the instrument. The other four waits poll for the line the server sends
// unprompted.
// `H:` — THE SUBJECT LINE COMES FROM THE SERVER, AND ONLY FROM THE SERVER.
//
// Plan 18 `B2`. CATALOGUE §C1 asks that every field of the line be what the
// server SAYS, never what the client believes it sent, and the whole difference
// between those two shows up in exactly one place: what happens when the server
// says NO.
//
// ⚠ THIS IS A WIRE GATE, NOT A PICTURE. A screenshot cannot tell a line the
// server sent from a line the client wrote for itself — they are the same
// pixels. A plain socket can, because it sees whether anything was sent at all.
// So there is no browser here on purpose.
//
// Three claims, and the third is the one with teeth:
//
//   B2.1  a toggle the server ACCEPTS produces an `H:` carrying the new state
//   B2.2  a client that connects is TOLD the line, before it has touched anything
//   B2.3  a toggle the server REFUSES produces NO `H:` at all
//
// Without the third, a HUD that simply echoed every keystroke passes the first
// two perfectly.

import { connect, send, ask, said, until, quiet, absenceWindow, checker, report } from '../lib.mjs';
const check = checker();

// ⚠ NODE'S GLOBAL `WebSocket`, not the `ws` package — it is the browser API, so
// it is `addEventListener`/`ev.data` and there is no `.on()`. Every other gate
// here uses the global; importing `ws` fails at load with a module-not-found
// that reads like a broken gate rather than a wrong import.

const g = await connect();
// ── ⚠ WAIT FOR THE LINE, NOT FOR A CLOCK — except where the claim IS an absence ──
//
// This gate slept 6.9 s in five waits. Four were waiting for an `H:` subject line that
// the server sends unprompted, so they poll for it. ⚠ THE FIFTH STAYS A FIXED WAIT AND
// MUST: *"a REFUSED toggle sends no H: at all"* is a claim about something NOT
// arriving, and there is no event to wait for. A duration is the instrument there.
await until(() => g.huds.length >= 1 && g.cats.length >= 1,
            'the opening subject line and catalogue never arrived');

// ── B2.2 — an arriving client is told, before it has touched anything ────────
// ⚠ The re-send is placed where the client JOINS THE LIST, not in the `1:`
// handler after it. S4 had to learn that for the ground: a re-send aimed at "the
// arriving client" fired before the client was in the list and reached nobody.
check(g.huds.length >= 1, `an arriving client is told the line (${g.huds.length} H:)`);
const first = g.huds[0] ?? '';
check(first.includes('world '), `the line names the world: ${JSON.stringify(first)}`);
check(/level (ON|off)/.test(first), 'the line carries the level toggle');

// ── B3.2 — the catalogue, derived from the mesher ────────────────────────────
// ⚠ THE COUNT IS THE CLAIM (§C3). The list is what `hex_mesh::surfaces()`
// says it is, so it cannot name a material the renderer cannot draw or miss one
// it can. `SURFACES` — the mesh-id stride — is that same length, and its own
// comment records it drifting 4 → 5 → 7 → 9 with nine files holding a copy.
check(g.cats.length === 1, `the catalogue is sent once on connect (${g.cats.length})`);
// ⚠ `;` BETWEEN ENTRIES AND `|` WITHIN, not commas — a reason is a sentence and
// a sentence has commas in it. This gate split on commas until B6 gave entries a
// reason, and then read one nine-field row as a single material.
//
// ⚠ AND THE FIRST FIELD IS THE KIND (B5.1, §C3). One list carries both families,
// so the count below had to stop being "how many entries" and become "how many
// entries of kind material" — otherwise every part authored from now on would
// have broken a gate about the MESHER's surfaces, which is a gate going red for
// something it is not about.
const cat = (g.cats[0] ?? 'N:').slice(2).split(';').filter(Boolean)
    .map((r) => { const [kind, name, avail, why] = r.split('|'); return { kind, name, avail, why }; });
const mats = cat.filter((r) => r.kind === 'material');
check(mats.length === 9, `nine materials, the mesher's own surfaces (${mats.length})`);
for (const want of ['grass', 'road', 'field', 'tree', 'roof', 'wall', 'floor', 'frame', 'soffit']) {
  check(mats.some((r) => r.name === want), `the catalogue lists '${want}'`);
}

// ── B5.1 — the parts on disk are in the SAME list ────────────────────────────
//
// ⚠ ONE CATALOGUE, NOT A SECOND WIDGET (§C3, and plan 17 `A7.2` says the same).
// A part and a material are each *a named thing you pick and then place*; what
// tells them apart is a field on the row, so adding a family is adding rows.
// ⚠ THE COMPLETENESS CLAIM LIVES IN `library.mjs`, NOT HERE (plan 17 `A7.1`).
// `>= 1` is deliberately weak — this gate is about `H:` and the catalogue's SHAPE,
// and a hard part count here would go red every time somebody authors a part, which
// is a gate failing for something it is not about. That `data/parts/` and the list
// hold exactly the same names — and that the list follows the library when it
// changes — is `library.mjs`'s, where it can add and remove parts to prove it.
const parts = cat.filter((r) => r.kind === 'part');
check(parts.length >= 1, `the catalogue lists what is in data/parts/ (${parts.length})`);
check(parts.some((r) => r.name === 'house/cottage'),
      `and names it family-first: ${JSON.stringify(parts.map((r) => r.name))}`);
// ⚠ EVERY ROW HAS A KIND. A blank one means a field was lost in the split and the
// two filters above would then be measuring a truncated list rather than the
// catalogue — both could pass while the list on screen was wrong.
check(cat.every((r) => r.kind === 'material' || r.kind === 'part'),
      `every entry names its family (${cat.filter((r) => !r.kind).length} blank)`);
check(cat.length === mats.length + parts.length, 'and no entry is in neither family');

// ── B6 — availability travels with the entry ─────────────────────────────────
// ⚠ AND AN UNAVAILABLE ENTRY IS STILL IN THE LIST. §C3: shown greyed with its
// reason, never hidden — hiding it makes the author think the thing is missing.
// ⚠ SCOPED TO THE MATERIALS, like the count above. `B6` is a claim about the
// three DERIVED surfaces; counted over the whole catalogue it would move the day
// a part is unavailable, and go red for something it is not about.
const blocked = mats.filter((r) => r.avail === '0');
check(blocked.length === 3, `three derived surfaces are unavailable (${blocked.length})`);
check(blocked.every((r) => (r.why ?? '') !== ''),
      `every unavailable entry carries a reason (${blocked.map((r) => r.name + '=' + r.why)})`);
check(mats.filter((r) => r.avail === '1').length === 6,
      'the other six are paintable');

// ── B2.1 — an accepted toggle moves it ───────────────────────────────────────
const before = g.huds.length;
g.ws.send('6:1');                       // level ON
await until(() => g.huds.length > before, 'the accepted toggle sent no H:');
const afterLevel = g.huds.slice(before);
check(afterLevel.length >= 1, `an accepted toggle sends H: (${afterLevel.length})`);
check((afterLevel[afterLevel.length - 1] ?? '').includes('level ON'),
      `and it carries the NEW state: ${JSON.stringify(afterLevel[afterLevel.length - 1] ?? '')}`);

// A mode the server accepts, so the control below is not the only mode traffic.
const beforeMode = g.huds.length;
g.ws.send('40:4');                      // EYES
await until(() => g.huds.length > beforeMode, 'the accepted mode sent no H:');
const okMode = g.huds.slice(beforeMode);
check((okMode[okMode.length - 1] ?? '').includes('EYES'),
      `an accepted mode shows in the line: ${JSON.stringify(okMode[okMode.length - 1] ?? '')}`);

// ── B2.3 — THE CONTROL. A refused toggle must send NOTHING ───────────────────
// `40:7` is not a mode; the server refuses it by name rather than clamping it.
// A client that echoed its own keystroke would show mode 7 here, and a HUD that
// re-sent the line on every message would send an H: that says EYES — which
// looks right and is a picture of the client having asked, not of the server
// having agreed.
const beforeRefusal = g.huds.length;
const statusBefore = g.all.length;
g.ws.send('40:7');
await absenceWindow(1500, 'no event marks this — see the check below');
const refusedHuds = g.huds.slice(beforeRefusal);
const sawRefusal = g.all.slice(statusBefore).some((m) => m.includes('mode refused'));
check(sawRefusal, 'the server refused 40:7 by name');
check(refusedHuds.length === 0,
      `a REFUSED toggle sends no H: at all (${refusedHuds.length} sent)`);

// ── B2.2 again, mid-session — a second client gets the CURRENT line ──────────
// Not the opening one: this client connects after two accepted toggles, and must
// be told what is true now rather than what was true at boot.
const b = await connect({ hello: false });
await until(() => b.huds.length >= 1, 'the second client was never told');
const bFirst = b.huds[0] ?? '';
check(b.huds.length >= 1, `a client joining mid-session is told (${b.huds.length} H:)`);
check(bFirst.includes('level ON') && bFirst.includes('EYES'),
      `and told the CURRENT state, not the opening one: ${JSON.stringify(bFirst)}`);

b.ws.close();
// ⚠ THIS GATE'S ROWS *ARE* ITS RESULT, so it reports the row shape rather than the
// `gate`/`checks` one — `report` keeps the output byte-identical to what the suite
// has always read, which is the control on a migration like this one.
report(g, { rows: check.rows, ok: check.bad() === 0 }, check.bad() === 0);
