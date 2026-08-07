// ⚠ THINNED, AND THIS IS THE WIRE HALF. The socket record is
// `lib/hex_part/tests/sock.loft` (22 tests — an edge and a heading with the same index
// are different sockets, two sockets may not share a name, a comma is refused because a
// binding names one) and the matching rule is `fit.loft` (11 tests, including *the
// library answers which parts fit a socket*).
//
// What is left is that `45:` reaches them, and one thing the library cannot pose at
// all: a query aimed at an INSTANCE resolves through the reference to the LEAF, so the
// answer is about the part being pointed at rather than the frame holding it. That is a
// question about the store the server currently has open.
// THE JOINTS, READ BACK — AND `parts_for_socket` FINALLY HAS A CONSUMER.
//
// Plan 17 `A7.3f2`. `socket_fit` and `parts_for_socket` were built and tested at
// `A4.2` and called by nothing at all since; `A7.1` deliberately did NOT push
// `SOCK`/`FITS` on connect, because a message no client reads is this tree's own
// trap. So this is a READ-BACK and not a broadcast — it joins the `15:`/`16:`/`26:`
// family, where the consumer is whoever asked, and it needs no client change to be
// honest.
//
// `45:` has three forms, escalating, which are the three questions a binding is
// made of:
//
//   `45:`                  what THIS part offers, and what it goes into
//   `45:<inst>`            the sockets of instance <inst>'s part
//   `45:<inst>,<socket>`   what in the library fits that socket
//
// ⚠ THE FRAME IS THE INSTANCE'S PART, NOT THE OPEN ONE. A cottage does not offer
// the door-frame's `leaf`; the door-frame does. Getting that backwards produces a
// message that answers confidently about the wrong part, and every count agrees.
//
// ⚠ AND THE FIXTURE IS THE COMMITTED LIBRARY, WHICH ALREADY HELD A REAL JOINT:
// `prop/plinth` offers `top @ statue/plinth-2` on heading 18, and every part that
// declares that class fits it — `A6.3`'s swap, and `A8.5`'s cell statue after it.
//
// ⚠ THE COUNT IS DERIVED FROM THE LIBRARY, NOT PINNED. It was `2 of 5`, and
// `A8.5` made it three by adding `prop/carved` — a gate that fails because CONTENT
// arrived is a gate that trains its reader to edit the number, which is how a real
// regression gets waved through next time. What is a discriminator is the same
// either way: the parts on disk that declare this class, and nothing else. A lookup
// returning the whole library, or nothing, still fails.
//
// ⚠ THE CLASS IS READ OUT OF THE FILE'S BYTES. `FITS` is a tagged section holding
// text, so the class name appears verbatim — the same trick `part_limb` uses to ask
// whether a part names a mesh.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

// Every part in the library, as `family/name`.
const libraryParts = () => readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(`${ROOT}/${d.name}`)
    .filter((f) => f.endsWith('.hxw'))
    .map((f) => `${d.name}/${f.slice(0, -4)}`));
import { connect, send, ask, said, until, quiet, absenceWindow, checker, verdict } from '../lib.mjs';

const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';

const check = checker();

const FRAME = 'prop/plinth';    // offers `top`
const HOLDER = 'prop/shrine';   // holds one instance, of the plinth
const LEAF = 'prop/statue';     // fits statue/plinth-2
const LEAF2 = 'prop/seated';    // and so does this one


const g = await connect();
g.ws.send('1:');
// ⚠ WAIT FOR THE SERVER, NOT FOR A CLOCK. This was `await wait(2000)` — a guess at
// how long the opening burst takes, so a loaded box made it a guess that was wrong.
// Every gesture below waits for its own acknowledgement; this only has to see the
// server answer at all, and it SAYS SO if it never does.
await until(() => g.says.length >= 1, 'the server never answered 1:');

// ⚠ A BURST, NOT A LINE. `45:` answers with a LEAD line and then one line per
// record — never a delimiter, because a part handle is a file path and may hold a
// comma, and a socket name is free text. So the gate waits for the lead and then
// lets the rest land, which is also why it is ack-driven rather than timed.
async function burst(msg, prefix, maxMs = 20000) {
  const before = g.says.length;
  g.ws.send(msg);
  for (let waited = 0; waited < maxMs; waited += 50) {
    if (g.says.slice(before).some((s) => s.startsWith(prefix))) {
      await absenceWindow(700, 'no event marks this — see the check below');
      return g.says.slice(before);
    }
    await absenceWindow(50, 'no event marks this — see the check below');
  }
  return g.says.slice(before);
}
const lead = (lines, prefix) => lines.find((s) => s.startsWith(prefix)) ?? '';

check(existsSync(`${ROOT}/${FRAME}.hxw`) && existsSync(`${ROOT}/${HOLDER}.hxw`),
      'the fixture parts are in the library');

// ── out of part mode there is no frame to ask about ────────────────────────
const outside = lead(await burst('45:', 'sockets '), 'sockets refused');
check(outside.includes('not editing a part'),
      `outside a part the query is refused rather than invented (${outside})`);

// ── form one — what this part offers ───────────────────────────────────────
await burst(`44:${FRAME}`, `part '${FRAME}'`);
let lines = await burst('45:', 'sockets of');
const own = lead(lines, 'sockets of');
check(own.includes('= 1'), `the plinth offers one socket (${own})`);
// ⚠ THE FILE'S OWN SPELLING ON THE WIRE. `sock_text` is the library's, so a second
// rendering here would be the two-spellings trap `part_file` was moved to end.
const sockLine = lead(lines, 'sock=');
check(sockLine !== '', `and the socket comes back as a record (${sockLine})`);
check(sockLine.split(',').length === 8,
      `with all eight fields of the format (${sockLine})`);
check(sockLine.endsWith(',top') && sockLine.includes('statue,plinth-2'),
      `naming the socket and its class (${sockLine})`);
// ⚠ AN ABSENCE IS SAID, not left to be inferred from silence — `A4.1`'s rule that
// `FITS` is one or none.
check(lead(lines, 'fits ').includes('nothing'),
      `and the plinth declares no FITS, out loud (${lead(lines, 'fits ')})`);
await burst('44:', "part '");

// ⚠ THE CONTROL FOR IT: a part that DOES declare one must say so, or *fits
// nothing* is just what this message always answers.
await burst(`44:${LEAF}`, `part '${LEAF}'`);
lines = await burst('45:', 'sockets of');
check(lead(lines, 'fits ') === 'fits statue/plinth-2',
      `the statue declares what it goes into (${lead(lines, 'fits ')})`);
check(lead(lines, 'sockets of').includes('= 0'),
      `and offers none of its own (${lead(lines, 'sockets of')})`);
await burst('44:', "part '");

// ── form two — the sockets of an INSTANCE's part ───────────────────────────
await burst(`44:${HOLDER}`, `part '${HOLDER}'`);
lines = await burst('45:0', 'sockets of');
const viaInst = lead(lines, 'sockets of');
check(viaInst.includes(FRAME) && viaInst.includes('= 1'),
      `instance 0 resolves to the part it references (${viaInst})`);
// ⚠ AND NOT THE OPEN PART'S OWN. The shrine offers nothing; if this answered
// about the shrine it would say 0 and look like a broken lookup rather than the
// wrong question.
check(!viaInst.includes(HOLDER),
      `and the answer is about the LEAF, not the frame that holds it (${viaInst})`);
check(lead(lines, 'sock=').endsWith(',top'), 'with the socket itself');

// ── form three — what fits it. `A4.2`'s first consumer ─────────────────────
lines = await burst('45:0,top', 'socket ');
const fitLead = lead(lines, "socket 'top'");
check(fitLead.includes('statue/plinth-2'),
      `the socket's class comes back (${fitLead})`);
// ⚠ THE FRAME NAMES THE CLASS TOO, IN ITS `SOCK`, so a byte search alone answers
// four and the wire answers three. The part that OFFERS the socket is not a
// candidate for it — and a first version of this row called that a failure.
const declared = libraryParts()
  .filter((n) => n !== FRAME)
  .filter((n) => readFileSync(`${ROOT}/${n}.hxw`).includes(Buffer.from('plinth-2')))
  .sort();
check(fitLead.includes(`= ${declared.length} fit`),
      `and exactly the ${declared.length} library parts declaring that class fit it `
    + `(${fitLead})`);
const fits = lines.filter((s) => s.startsWith('fit ')).map((s) => s.slice(4)).sort();
check(JSON.stringify(fits) === JSON.stringify(declared),
      `named, one per line: ${JSON.stringify(fits)} against the library's `
    + `${JSON.stringify(declared)}`);
// ⚠ THE CONTROL THAT MAKES THE COUNT MEAN SOMETHING. `house/cottage` declares no
// FITS at all, so a lookup that listed the library would include it — and *2 of 5*
// is only evidence if the other three are genuinely excluded.
check(!fits.includes('house/cottage') && !fits.includes(FRAME),
      `and nothing that does not fit is offered (${JSON.stringify(fits)})`);

// ── the refusals ───────────────────────────────────────────────────────────
const misspelt = lead(await burst('45:0,leef', 'sockets refused'), 'sockets refused');
check(misspelt.includes("'top'"),
      `a misspelt socket is refused WITH what is offered (${misspelt})`);
const outOfRange = lead(await burst('45:9', 'sockets refused'), 'sockets refused');
check(outOfRange.includes('1 instance'),
      `an index past the end names the count (${outOfRange})`);
const notANumber = lead(await burst('45:x', 'sockets refused'), 'sockets refused');
check(notANumber.includes('not an instance number'),
      `and a non-number says so rather than reading as 0 (${notANumber})`);
await burst('44:', "part '");

verdict(g, 'part_sock', check);
