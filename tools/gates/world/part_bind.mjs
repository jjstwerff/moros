// ⚠ THINNED, AND THIS IS THE WIRE HALF. The fit rule is `lib/hex_part/tests/fit.loft`
// entirely — a leaf of the frame's class fits, the right kind at the wrong size is
// refused, the right size of the wrong kind is refused, a refusal says what the frame
// actually TAKES, and the library answers which parts fit a socket. Eleven tests, none
// of which needs a world.
//
// What is left is that `46:` reaches any of it. `A4.2` built `socket_fit` and `A4.3`
// built `socket_for_binding`, and until this gesture existed **nothing an author could
// type called either** — which is this tree's own trap, so the gate that proves the
// call happens is the gate that matters. Plus the two things only a wire shows: a
// second bind SWAPS rather than refusing, and a refusal arrives carrying its offer.
// THE JOINT ITSELF — AND `socket_fit` REACHES AN AUTHOR.
//
// Plan 17 `A7.3f3`. `46:<inst>,<socket>,<part>` puts a part into a socket of an
// instance of the part being edited; `46:<inst>,<socket>` takes it out again.
// `A4.2` built `socket_fit` and `A4.3` built `socket_for_binding`, and until this
// gesture nothing an author could type reached either of them.
//
//   A7.3f3-i    a bind lands in the store and survives a save and a reopen
//   A7.3f3-ii   ⚠ a second bind on one socket SWAPS rather than refusing — §P3's
//               own promise that *composition by socket makes "swap this for that"
//               a one-field edit*, which `A6.3` proved needs no new code and had no
//               gesture to reach. `part_set_bindings` refuses a duplicate, so an
//               author who could only ADD would be stuck with their first choice
//   A7.3f3-iii  `socket_fit`'s refusal reaches the author, naming what the socket
//               takes — `A4.2` chose exact-and-complete over near-and-ranked
//               because a size class is NOMINAL, and this is where that lands
//   A7.3f3-iv   ⚠ §P8 ACROSS A BINDING. The cycle walk followed instances only,
//               so a part bound into its own socket answered `CY_OK` and reached
//               the renderer as *"nested 9 deep; the bound is 8"* — a DEPTH
//               overflow standing in for a cycle, which names no reference to cut
//
// ⚠ WHAT THIS GATE DOES NOT CLAIM: that a bound leaf is DRAWN. Both parts in this
// library that fit the plinth's socket are mesh-only bodies — `prop/statue` and
// `prop/seated` have **0 columns** — so an expansion delivers them as `ex_meshes`,
// and the display world is a `World`, which has nowhere to put a mesh. That gap
// predates this step (it is `A5.2`'s renderer half and `A6.2`'s *a mesh is not on
// the lattice*), and no gesture can author a `FITS`, so a cell-bodied leaf that
// fits cannot be made from the editor either. Said here rather than papered over
// with a check that would pass on a server drawing nothing.
import { existsSync } from 'node:fs';
import { connect, send, ask, said, until, quiet, absenceWindow, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';

const check = checker();

const HOLDER = 'prop/shrine';   // holds one instance, of the plinth, already bound
const LEAF = 'prop/statue';     // fits statue/plinth-2
const LEAF2 = 'prop/seated';    // and so does this one — the swap
const MISFIT = 'house/cottage'; // declares no FITS at all
const SAVED = 'prop/bound_probe';


const g = await connect();
g.ws.send('1:');
// ⚠ WAIT FOR THE SERVER, NOT FOR A CLOCK. This was `await wait(2000)` — a guess at
// how long the opening burst takes, so a loaded box made it a guess that was wrong.
// Every gesture below waits for its own acknowledgement; this only has to see the
// server answer at all, and it SAYS SO if it never does.
await until(() => g.says.length >= 1, 'the server never answered 1:');

// One implementation of *wait for the answer* now — `lib.mjs`'s `send`.
const stepFor = (msg, prefix, maxMs = 12000) => send(g, msg, [prefix], maxMs);
const askOne = (msg, prefix) => ask(g, msg, prefix);

check(existsSync(`${ROOT}/${HOLDER}.hxw`) && existsSync(`${ROOT}/${LEAF}.hxw`),
      'the fixture parts are in the library');

// ── out of part mode there is no instance to bind into ─────────────────────
const outside = await askOne(`46:0,top,${LEAF}`, 'bind refused');
check(outside.includes('not editing a part'),
      `outside a part the gesture is refused (${outside})`);

await stepFor(`44:${HOLDER}`, `part '${HOLDER}'`);

// ⚠ THE FIXTURE ALREADY CARRIES A BINDING — `A6.3`'s shrine binds the statue to
// the plinth's `top`. So the gate takes it out first and puts it back, which is
// also how it learns that *bound* and *swapped* are distinguishable at all.
const first = await askOne('46:0,top', 'unbound');
check(first.includes('0 bindings left'),
      `the fixture's own binding comes out (${first})`);

// ── A7.3f3-i — a bind, and it is really there ──────────────────────────────
const bound = await askOne(`46:0,top,${LEAF}`, 'bound');
check(bound.includes(LEAF) && bound.includes('statue/plinth-2'),
      `a part goes into the socket, named with its class: ${JSON.stringify(bound)}`);
// ⚠ THE READ-BACK IS BEHAVIOURAL, because nothing on this wire reports bindings:
// an unbind that SUCCEEDS is the proof one was there, and it is checked below
// after a save and a reopen rather than here.

// ── A7.3f3-ii — the swap is one field ──────────────────────────────────────
const swapped = await askOne(`46:0,top,${LEAF2}`, 'swapped');
check(swapped.includes(LEAF2),
      `a second bind on one socket SWAPS rather than refusing: ${JSON.stringify(swapped)}`);
check(!swapped.includes('refused'), 'and it is not a duplicate refusal wearing a verb');

// ── A7.3f3-iii — `socket_fit` reaches the author ───────────────────────────
const misfit = await askOne(`46:0,top,${MISFIT}`, 'bind refused');
check(misfit.includes('does not fit'),
      `a part that does not fit is refused: ${JSON.stringify(misfit)}`);
check(misfit.includes('statue/plinth-2'),
      `and the refusal names what the socket TAKES, which is what an author acts `
    + `on (${misfit})`);

// ── the other refusals ─────────────────────────────────────────────────────
const noSock = await askOne(`46:0,leef,${LEAF}`, 'bind refused');
check(noSock.includes("'top'"),
      `a misspelt socket is refused with what IS offered (${noSock})`);
const noInst = await askOne(`46:9,top,${LEAF}`, 'bind refused');
check(noInst.includes('1 instance'),
      `an instance past the end names the count (${noInst})`);
const shapeless = await askOne('46:0', 'bind refused');
check(shapeless.includes('<instance>,<socket>,<part>'),
      `and a payload with no shape says what one looks like (${shapeless})`);

// ── A7.3f3-i, the other half — it survives a save and a reopen ─────────────
const saved = await askOne(`8:${SAVED}`, 'part ');
check(saved.includes('saved'), `the bound part saves (${saved})`);
await stepFor('44:', "part '");
await stepFor(`44:${SAVED}`, `part '${SAVED}'`);
// The binding came back from disk iff there is something to take out.
const reUnbind = await askOne('46:0,top', 'unbound');
check(reUnbind.includes('unbound'),
      `and the binding came back from disk (${reUnbind})`);
// ⚠ AND THE CONTROL FOR THAT READ-BACK: with nothing in the socket, the same
// gesture must refuse — otherwise *unbound* is what it always says and the check
// above proves nothing.
const nothingThere = await askOne('46:0,top', 'bind refused');
check(nothingThere.includes('nothing in'),
      `while an empty socket refuses the same gesture (${nothingThere})`);
await stepFor('44:', "part '");

// ── A7.3f3-iv — §P8 across a binding ───────────────────────────────────────
//
// ⚠ REACHABLE WITH THE GESTURES THAT EXIST, which is why it is a gate and not
// only a library test: bind the statue into the shrine's plinth, then save the
// shrine AS `prop/statue`. The saved part would then hold an instance of the
// plinth whose socket is bound to the part itself.
await stepFor(`44:${HOLDER}`, `part '${HOLDER}'`);
const cyc = await askOne(`8:${LEAF}`, 'part save refused');
check(cyc !== '', `a binding that closes a loop is refused: ${JSON.stringify(cyc)}`);
check(cyc.includes('→'), `and the refusal carries the chain (${cyc})`);
check(cyc.includes(LEAF), 'naming the part it would have become');
await stepFor('44:', "part '");

// ⚠ THE CONTROL FOR THE WHOLE GATE. Every refusal above passes on a server that
// refuses every bind, so a sound one must still go through — and it is the same
// shape as the cycle case, one name apart.
await stepFor(`44:${HOLDER}`, `part '${HOLDER}'`);
const sound = await askOne(`8:${SAVED}2`, 'part ');
check(sound.includes('saved'),
      `and the same part saves under a name that closes nothing (${sound})`);
await stepFor('44:', "part '");

verdict(g, 'part_bind', check);
