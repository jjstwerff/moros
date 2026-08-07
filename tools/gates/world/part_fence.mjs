// ⚠ CHECKED AND LEFT WHOLE, and it could not be otherwise — the subject IS the mode.
// Part mode is a property of the running server: which store the gestures reach, which
// registries are held aside, and which messages are refused while one is open. There is
// no library function that has a mode, so there is nothing here to move.
//
// The rule it gates is one sentence: a gesture whose state part mode does not hold
// aside LEAKS out of the mode, and a gesture that writes cells where the format wants a
// REFERENCE corrupts the part silently. Both are statements about routing, and routing
// is what a server does.
// WHAT PART MODE REFUSES, AND — THE HARDER HALF — WHAT IT STILL LETS THROUGH.
//
// Plan 17 `A7.3b`. `A7.3a` opened a part as the edited store and shut the two doors
// that could lose something on disk (`8:`, `9:`). This is the rest of the fence, and
// its rule is one sentence: **a gesture whose state part mode does not hold aside
// leaks out of the mode, and a gesture that writes cells where the format wants a
// REFERENCE corrupts the part silently.**
//
//   A7.3b-i    ⚠ **SUPERSEDED BY `A7.3f`, AND MOVED RATHER THAN DROPPED.** This
//              used to require `14:<roof>,<part>` to be REFUSED in part mode, on
//              the grounds that stamping a leaf bakes it in and editing the leaf
//              then changes nothing. The refusal's own words were *"the gesture
//              that makes one does not exist yet"* — and now it does, so the same
//              message writes an `INST` instead. The CLAIM did not go anywhere:
//              *a part inside a part does not become cells* is asserted in
//              `part_inst.mjs`, against the store, which is a sharper instrument
//              than a refusal string ever was. What is kept here is the half that
//              is still this gate's: the gesture must not be silently ignored.
//   A7.3b-ii   `18:` TRIGGER and `21:` IMPORT are refused — `trigs`, `n_imported`
//              and the imported meshes are the WORLD's state and are not held
//              aside, so either would still be there after the world came back.
//   A7.3b-iii  everything else still works. ⚠ **This is the claim with teeth**: a
//              server that refused every message in part mode passes (i) and (ii)
//              perfectly, and would be useless. A part-editing mode that cannot
//              edit is not a fence, it is a wall.
//
// ⚠ THE INSTRUMENT IS THE STORE'S OWN EDIT CLOCK, arriving on the close: `44:`
// answers `K edits discarded`, and `w_tau` bumps once per write that CHANGED
// something. So *the refusal wrote nothing* is `K == 0` — an exact integer, not a
// re-read of cells the gate would have to know the right values for, and not a
// tally the writer kept about itself.
//
// ⚠ AND IT WRITES NOTHING ITSELF. `tools/run-gates.sh` hands every gate its own
// copy of the library; this one only opens parts and is refused.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { connect, send, ask, said, until, quiet, absenceWindow, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const PART = 'house/cottage';
const LEAF = 'prop/plinth';

const check = checker();
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');


const g = await connect();
g.ws.send('1:');
// ⚠ WAIT FOR THE SERVER, NOT FOR A CLOCK. This was `await wait(2000)` — a guess at
// how long the opening burst takes, so a loaded box made it a guess that was wrong.
// Every gesture below waits for its own acknowledgement; this only has to see the
// server answer at all, and it SAYS SO if it never does.
await until(() => g.says.length >= 1, 'the server never answered 1:');

// Everything the gate asks is answered on `S:`, so a step is "send, then read what
// arrived because of it".
// ⚠ WAIT FOR THE ANSWER, NOT FOR A CLOCK. Written with fixed sleeps this gate
// passed alone and failed at `GATE_JOBS=4`: four interpreted servers on one box
// answer slower than the sleep, so a green that depended on the load was a gate
// reporting the machine. Polling for the acknowledgement is faster on an idle box
// and correct on a busy one. ⚠ The few gestures that answer nothing of their own
// still take a fixed wait, which is what `null` selects.
async function step(msg, prefix = null, maxMs = 12000) {
  const before = g.says.length;
  g.ws.send(msg);
  if (prefix === null) { await absenceWindow(1200, 'no event marks this — see the check below'); return g.says.slice(before); }
  for (let waited = 0; waited < maxMs; waited += 50) {
    if (g.says.slice(before).some((s) => s.startsWith(prefix))) break;
    await absenceWindow(50, 'no event marks this — see the check below');
  }
  return g.says.slice(before);
}

// One open→close cycle, returning what the close counted. `K` is the whole
// instrument: 0 means the store was never written.
// Each entry is `[message, the prefix its answer starts with]` — or a bare
// message for a gesture that answers nothing.
async function cycle(inside) {
  const opened = said(await step(`44:${PART}`, `part '${PART}'`), `part '${PART}'`);
  if (!opened.includes('opened')) return { opened, edits: NaN, lines: [] };
  const lines = [];
  for (const m of inside) {
    if (Array.isArray(m)) lines.push(...await step(m[0], m[1]));
    else lines.push(...await step(m));
  }
  // ⚠ TAKEN WHILE THE PART IS STILL OPEN. Read after the close it is the world's
  // line, which passes any subject check by accident — the first version of the
  // blanking check below did exactly that.
  const hudInside = g.huds[g.huds.length - 1] ?? '';
  const closed = said(await step('44:', `part '${PART}'`), `part '${PART}'`);
  return { opened, closed, lines, hudInside,
           edits: +(closed.match(/(-?\d+) edits discarded/)?.[1] ?? NaN) };
}

const hash0 = md5(`${ROOT}/${PART}.hxw`);
// ⚠ AND THE PLACEMENT IS ACKNOWLEDGED, so this waits for `placed` rather than
// guessing half a second at it.
g.ws.send('7:0,0,0.5236');
await until(() => g.says.some((s2) => s2.startsWith('placed ')),
                'the walker was never placed');

// ── the fence must not leak into the WORLD ──────────────────────────────────
// ⚠ FIRST, AND IT IS A CONTROL FOR EVERY REFUSAL BELOW. Each of these three is
// refused inside a part; if it were refused out here too, the gate would be
// measuring a broken message rather than a fence.
check(said(await step(`14:12,${PART}`, 'stencil '), 'stencil placed').includes('from part'),
      'in the WORLD, a part still stamps');
check(said(await step('18:fence_probe', 'trigger '), 'trigger ').startsWith('trigger '),
      'in the WORLD, a trigger still anchors');
const worldImport = said(await step('21:/nonexistent.glb', 'import '), 'import refused');
check(worldImport !== '' && !worldImport.includes('editing part'),
      `in the WORLD, an import is refused by the LOADER, not by the fence (${worldImport})`);

// ── A7.3b-i, as `A7.3f` left it — a part inside a part is a REFERENCE ───────
// ⚠ The fence became a gesture. It is still checked HERE that the message is
// answered at all — a mode that quietly ignored it would fail no refusal test —
// and what it answers WITH is `part_inst.mjs`'s, because *the store did not grow*
// is the claim and a sentence on the wire is only its echo.
const stamped = await cycle([[`14:12,${LEAF}`, 'stencil ']]);
check(stamped.opened.includes('opened'), `the part opens (${stamped.opened})`);
const stampSay = said(stamped.lines, 'instance ');
check(stampSay !== '',
      `a part placed into a part is answered, not ignored: ${JSON.stringify(stampSay)}`);
check(stampSay.includes('reference'),
      'and the answer says WHAT it made — a reference, not a stamp');
// ⚠ THE REFUSAL WROTE NOTHING, which is the claim the sentence cannot make on its
// own: a server that answered "refused" and stamped anyway passes the two above.
check(stamped.edits === 0,
      `and nothing was written (${stamped.edits} edits on the store's own clock)`);

// ⚠ AND THE PART IS STILL NAMED. `14:` parses its payload into a local that was
// called `part_name` — the same name as the part being EDITED, in the same function
// scope, where loft has no block-local declaration — so every stencil in part mode
// blanked the subject line and the close ack. Caught here, fixed by renaming the
// stencil's local; the check stays because the collision is invisible at both sites.
check(stamped.closed.includes(`'${PART}'`),
      `and the close still names the part it had open (${stamped.closed})`);
check(stamped.hudInside === `H:part ${PART} · AUTO · level off · road off · trace off`,
      `and the subject still named it throughout (${JSON.stringify(stamped.hudInside)})`);

// ── A7.3b-ii — the state part mode does not hold aside ──────────────────────
const trig = await cycle([['18:in_a_part', 'trigger ']]);
const trigSay = said(trig.lines, 'trigger refused');
check(trigSay.includes('editing part'), `a trigger is refused in a part: ${JSON.stringify(trigSay)}`);
check(trig.edits === 0, `and nothing was written (${trig.edits} edits)`);

const imp = await cycle([['21:/nonexistent.glb', 'import ']]);
const impSay = said(imp.lines, 'import refused');
check(impSay.includes('editing part'), `an import is refused in a part: ${JSON.stringify(impSay)}`);
// ⚠ THE REASON IS THE CHECK, NOT THE REFUSAL. `21:` on a missing file is refused
// anyway — by the glb loader — so a fence that did nothing would still show a
// refusal here. This distinguishes the two, and the first version of the guard was
// written as its own `else if … && in_part` arm that the chain never reached: the
// fence read as present and `21:` went on importing.
check(!impSay.includes('(1)'), `by the FENCE and not by the loader (${impSay})`);

// ── A7.3b-iii — and the mode still edits ────────────────────────────────────
// The control that makes the whole fence mean something. Three ordinary gestures,
// each of which writes to the part's store and must go on doing so.
const live = await cycle(['5:1', '5:1', '5:1']);
check(live.edits > 0, `a raise still edits the part (${live.edits} edits)`);

const edged = await cycle([['24:0,wall', 'edge ']]);
check(edged.edits > 0, `an edge still writes into the part (${edged.edits} edits)`);

// ⚠ AND THE PROCEDURAL STENCIL IS NOT FENCED, which is the sharpest line here:
// `14:<roof>` and `14:<roof>,<part>` are the SAME message, and only the form that
// carries a library part is refused. A fence on the message rather than on the
// reference would say this mode is about stamping, when it is about references.
const proc = await cycle([['14:12', 'stencil ']]);
const procSay = said(proc.lines, 'stencil ');
check(procSay !== '' && !procSay.includes('editing part'),
      `the procedural form is answered on its own merits, not fenced (${procSay})`);

// ── nothing reached the library ─────────────────────────────────────────────
check(md5(`${ROOT}/${PART}.hxw`) === hash0,
      'and the part on disk is byte-identical through all of it');

verdict(g, 'part_fence', check);
