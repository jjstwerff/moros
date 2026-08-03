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
const PORT = +(process.env.EDITOR_PORT ?? 18090);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };

// ⚠ NODE'S GLOBAL `WebSocket`, not the `ws` package — it is the browser API, so
// it is `addEventListener`/`ev.data` and there is no `.on()`. Every other gate
// here uses the global; importing `ws` fails at load with a module-not-found
// that reads like a broken gate rather than a wrong import.
function open() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const huds = [];
  const all = [];
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    all.push(s);
    if (s.startsWith('H:')) huds.push(s);
  });
  return { ws, huds, all, ready: new Promise((r) => ws.addEventListener('open', r)) };
}

const a = open();
await a.ready;
await wait(1500);

// ── B2.2 — an arriving client is told, before it has touched anything ────────
// ⚠ The re-send is placed where the client JOINS THE LIST, not in the `1:`
// handler after it. S4 had to learn that for the ground: a re-send aimed at "the
// arriving client" fired before the client was in the list and reached nobody.
check(a.huds.length >= 1, `an arriving client is told the line (${a.huds.length} H:)`);
const first = a.huds[0] ?? '';
check(first.includes('world '), `the line names the world: ${JSON.stringify(first)}`);
check(/level (ON|off)/.test(first), 'the line carries the level toggle');

// ── B2.1 — an accepted toggle moves it ───────────────────────────────────────
const before = a.huds.length;
a.ws.send('6:1');                       // level ON
await wait(1200);
const afterLevel = a.huds.slice(before);
check(afterLevel.length >= 1, `an accepted toggle sends H: (${afterLevel.length})`);
check((afterLevel[afterLevel.length - 1] ?? '').includes('level ON'),
      `and it carries the NEW state: ${JSON.stringify(afterLevel[afterLevel.length - 1] ?? '')}`);

// A mode the server accepts, so the control below is not the only mode traffic.
const beforeMode = a.huds.length;
a.ws.send('40:4');                      // EYES
await wait(1200);
const okMode = a.huds.slice(beforeMode);
check((okMode[okMode.length - 1] ?? '').includes('EYES'),
      `an accepted mode shows in the line: ${JSON.stringify(okMode[okMode.length - 1] ?? '')}`);

// ── B2.3 — THE CONTROL. A refused toggle must send NOTHING ───────────────────
// `40:7` is not a mode; the server refuses it by name rather than clamping it.
// A client that echoed its own keystroke would show mode 7 here, and a HUD that
// re-sent the line on every message would send an H: that says EYES — which
// looks right and is a picture of the client having asked, not of the server
// having agreed.
const beforeRefusal = a.huds.length;
const statusBefore = a.all.length;
a.ws.send('40:7');
await wait(1500);
const refusedHuds = a.huds.slice(beforeRefusal);
const sawRefusal = a.all.slice(statusBefore).some((m) => m.includes('mode refused'));
check(sawRefusal, 'the server refused 40:7 by name');
check(refusedHuds.length === 0,
      `a REFUSED toggle sends no H: at all (${refusedHuds.length} sent)`);

// ── B2.2 again, mid-session — a second client gets the CURRENT line ──────────
// Not the opening one: this client connects after two accepted toggles, and must
// be told what is true now rather than what was true at boot.
const b = open();
await b.ready;
await wait(1500);
const bFirst = b.huds[0] ?? '';
check(b.huds.length >= 1, `a client joining mid-session is told (${b.huds.length} H:)`);
check(bFirst.includes('level ON') && bFirst.includes('EYES'),
      `and told the CURRENT state, not the opening one: ${JSON.stringify(bFirst)}`);

a.ws.close();
b.ws.close();
console.log(JSON.stringify({ rows, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
