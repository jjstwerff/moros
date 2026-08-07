// THE GATE HARNESS — one socket, one way to wait, one verdict.
//
// WHY. Forty-five gates each hand-rolled the same four things: 40 their own
// WebSocket, 38 their own `sleep`, **37 their own ack-poller**, and 45 their own
// verdict and exit code. So the one operation that keeps going wrong — *wait for
// evidence, and make sure the evidence can actually arrive* — was written
// thirty-seven slightly different ways, and every one of them had to be got right
// on its own.
//
// ⚠ THAT IS NOT A TIDINESS ARGUMENT, IT IS A MEASURED RECURRENCE. The suite carried
// **82 s of fixed sleeps**; they were removed, and within the hour a NEW gate
// (`part_limb`) was written with the same fault twice — 74 s, then 43 s, then 5.3 s.
// First a settle whose condition the CORRECT outcome cannot satisfy, then a wait for
// an acknowledgement string the server never says. Neither is visible by reading;
// both cost a timing run to find. Care did not scale, so the primitive moved here.
//
// WHAT THIS DELIBERATELY DOES NOT EXPORT: a sleep. The only fixed wait you can
// spell is `absenceWindow(ms, why)`, and it demands a reason — because there are
// exactly two legitimate ones in this suite and both are claims about something NOT
// arriving, where there is no event to poll for and the window IS the instrument:
//
//     *an unchanged library sends nothing in 4 s*   (library)
//     *a REFUSED toggle sends no `H:` at all*       (subject)
//
// Everything else waits for evidence. If you find yourself wanting a delay for any
// other reason, the thing you actually want is `send(..., prefixes)` or `quiet()`.

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

// ── ⚠ THE ONLY FIXED WAIT, AND IT HAS TO SAY WHY ────────────────────────────
//
// A claim about an absence has no event to wait for: polling would either return at
// once, proving nothing, or hang. The window is the measurement. `why` is required
// so that the next reader can tell this from a guess, and so that a guess cannot be
// spelled without writing a sentence that would obviously be false.
export async function absenceWindow(ms, why) {
  if (!why) throw new Error('absenceWindow needs a reason — if you cannot name the '
                          + 'absence being measured, you want send(...) or quiet()');
  await tick(ms);
}

// ── the socket, with everything already collected ───────────────────────────
//
// ⚠ EVERY STREAM, NOT THE ONE THIS GATE HAPPENS TO WANT. A per-gate handler is how
// `subject` ended up unable to see `N:` and `part_inst` unable to see `M:`; and a
// gate that later needs another stream should not have to re-derive the parsing.
// The cost is a few arrays.
//
//   says    `S:` status lines, WITHOUT the prefix — what every ack matches on
//   huds    `H:` subject lines, with the prefix, because their content starts there
//   cats    `N:` catalogue rows        cams  `W:` thumbnail cameras
//   ls      `L:` layer lines           es    `E:` (the camera handshake)
//   meshes  every `M:` id in arrival order
//   picture id -> the last body sent for it, which is the client's picture
//   ys      `Y:` thumbnail bodies
//   ts      `T:` transforms, WITHOUT the prefix — `traceOf(g, '0;')` picks a part
//   views   `C:` camera matrices, in arrival order
//   gone    `X:` chunk ids the server RETIRED — a mesh it drops must leave the
//           picture too, so anything reading `picture` has to subtract these
//   all     every message, verbatim, for the checks that need the raw wire
export async function connect(opts = {}) {
  const port = opts.port ?? PORT;
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const g = {
    ws, port,
    says: [], huds: [], cats: [], cams: [], ls: [], ys: [], ts: [], views: [],
    all: [], meshes: [], picture: new Map(), gone: new Set(),
  };
  // ⚠ `watch` IS REGISTERED BEFORE THE HELLO IS SENT, and that is the whole reason it
  // exists rather than the caller adding its own listener afterwards. A gate measuring a
  // HIGH-WATER MARK — the most chunks live at once — has to see the opening burst; added
  // from outside `connect`, `stream` counted 306 arrivals where the truth was 738 and its
  // peak read 306 against 468. A snapshot at the end cannot recover a maximum over time.
  if (opts.watch) ws.addEventListener('message', (ev) => opts.watch(String(ev.data), g));
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    g.all.push(s);
    const i = s.indexOf(':');
    if (i < 0) return;
    const t = s.slice(0, i), b = s.slice(i + 1);
    if (t === 'S') g.says.push(b);
    else if (t === 'H') g.huds.push(s);
    else if (t === 'N') g.cats.push(s);
    else if (t === 'W') g.cams.push(s);
    else if (t === 'L') g.ls.push(b);
    else if (t === 'Y') g.ys.push(s);
    else if (t === 'T') g.ts.push(b);
    else if (t === 'C') g.views.push(b);
    else if (t === 'X') g.gone.add(Number(b));
    // ⚠ THE ASPECT IS ANSWERED HERE OR NO CAMERA EVER COMES. The server asks with
    // `E:` and sends no `C:` until a client states one — and a gate that never
    // answered would sit on a world that draws nothing, which reads as a broken
    // renderer. Every gate in the old shape had this line in its own handler.
    else if (t === 'E') { try { ws.send(`2:${opts.aspect ?? 1.5},`); } catch { /* closing */ } }
    else if (t === 'M') {
      const semi = b.indexOf(';');
      const id = +b.slice(0, semi);
      g.meshes.push(id);
      g.picture.set(id, b.slice(semi + 1));
    }
  });
  await new Promise((r) => ws.addEventListener('open', r));
  if (opts.hello !== false) ws.send('1:');
  // ⚠ NOT A FIXED OPENING WAIT. The old idiom was `send('1:'); await wait(2000)`,
  // which is a guess at how long a burst takes and therefore a measurement of the
  // box. Every gesture below waits for its own answer, so this only has to see the
  // server answer at all — and it SAYS SO if it never does.
  if (opts.hello !== false) {
    await until(() => g.says.length >= 1, 'the server never answered 1:');
  }
  // ⚠ THE CAMERA IS EVIDENCE, AND THE OLD SHAPE DROVE FROM IT. Gates in the
  // `ws.onmessage` family started work inside `if (t === 'C' && !phase)`, which is
  // "the world is up and a view exists" expressed as a callback. Asking for it here
  // lets the body of a gate be straight-line code with the same guarantee.
  if (opts.camera) {
    await until(() => g.views.length >= 1, 'the server never sent a camera');
  }
  return g;
}

// ── ⚠ WAIT FOR THE EVIDENCE, AND SAY SO WHEN IT DOES NOT COME ───────────────
export async function until(cond, what, maxMs = 20000) {
  for (let t = 0; t < maxMs; t += 25) {
    if (cond()) return true;
    await tick(25);
  }
  console.log(`  !! ${what} — never happened in ${maxMs}ms`);
  return false;
}

// Send a message and wait for any of `prefixes` among the status lines it produces.
//
// ⚠ IT TAKES SEVERAL PREFIXES BECAUSE A REFUSAL IS AN ANSWER TOO. Half of a gate's
// waits are on negative controls, and polling only for the success line makes every
// one of them pay the whole timeout — which is slower than the sleep it replaced.
// The check after the call is what decides which answer was wanted.
//
// ⚠ AND THE PREFIX IS WHAT THE ANSWER LOOKS LIKE, NOT WHAT WAS ASKED. `44:` with an
// empty name CLOSES a part, and the close acknowledges with the name it HAD open —
// so waiting for `part ''` matches nothing and burns the limit. That exact mistake
// cost `part_limb` 40 of its 43 seconds.
//
// Returns the status lines that arrived after the send.
export async function send(g, msg, prefixes = [], maxMs = 20000) {
  const before = g.says.length;
  const want = Array.isArray(prefixes) ? prefixes : [prefixes];
  g.ws.send(msg);
  if (want.length === 0) return g.says.slice(before);
  await until(() => g.says.slice(before).some((s) => want.some((p) => s.includes(p))),
              `no answer to ${JSON.stringify(msg)} matching ${want.join(' | ')}`, maxMs);
  return g.says.slice(before);
}

// The first line of `lines` starting with `prefix`, or ''.
export const said = (lines, prefix) =>
  lines.find((s) => s.startsWith(prefix)) ?? '';

// Send and hand back the one line that answered.
export async function ask(g, msg, prefix, maxMs = 20000) {
  return said(await send(g, msg, [prefix], maxMs), prefix);
}

// ── ⚠ SETTLE ON A STREAM GOING QUIET, NEVER ON A PREDICATE ──────────────────
//
// `pick` returns a number that only grows while work is arriving — a message count.
// When it stops moving for `quietMs`, the thing has settled.
//
// ⚠ A SETTLE CONDITION MUST BE SATISFIABLE BY THE CORRECT OUTCOME. `part_limb`'s
// first version waited for *the total stopped moving AND is non-zero*, so every
// close — where zero is right — ran to the limit and the gate took 74 s instead of
// 5. Counting arrivals rather than judging them is what makes that unspellable:
// zero arrivals go quiet immediately, which is the true answer.
export async function quiet(pick, quietMs = 400, maxMs = 20000, what = 'the stream') {
  let last = pick(), still = 0;
  for (let t = 0; t < maxMs; t += 50) {
    await tick(50);
    const n = pick();
    if (n === last) {
      still += 50;
      if (still >= quietMs) return true;
    } else { last = n; still = 0; }
  }
  console.log(`  !! ${what} never went quiet (${pick()})`);
  return false;
}

// ── the verdict, in one shape ───────────────────────────────────────────────
//
// ⚠ THE `ok` FIELD SITS AT THE END OF THE JSON AND `run-gates.sh` READS THE WHOLE
// LINE FOR IT. Truncating to fit a terminal once hid exactly the field the suite
// exists to report — `grep -c ok:true` counted 3 of 28 passing runs.
export function checker() {
  const rows = [];
  let bad = 0;
  const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };
  check.rows = rows;
  check.bad = () => bad;
  return check;
}

// Print the rows, print the verdict, close, and exit with the right code.
//
// ⚠ A GATE THAT PRINTS FAIL AND EXITS 0 IS REPORTED GREEN BY THE SUITE, which is
// worse than no gate: a green light nobody earned.
export function verdict(g, name, check, extra = {}) {
  for (const r of check.rows) {
    console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => (m === ' PASS' ? '' : '  <-- FAIL'))}`);
  }
  const bad = check.bad();
  try { g.ws.close(); } catch { /* already gone */ }
  console.log(JSON.stringify({ gate: name, ...extra,
                               checks: check.rows.length, bad, ok: bad === 0 }));
  process.exit(bad === 0 ? 0 : 1);
}

// Some gates report a bare object rather than the `gate`/`checks` shape, because
// their rows ARE their result. This keeps their output byte-identical.
export function report(g, obj, ok) {
  try { g.ws.close(); } catch { /* already gone */ }
  console.log(JSON.stringify(obj));
  process.exit(ok ? 0 : 1);
}

// The `T:` transforms for one part — `traceOf(g, '0;')` is the body, `'1;'` a leg.
// ⚠ A PART ID IS A CONTRACT WITH THE SERVER AND THEY HAVE MOVED ONCE: when the world
// went infinite `PART_BODY` slid from 1 to 0, so a probe reading "the body" silently
// began reading the LEFT LEG and kept passing, because a leg does move.
export const traceOf = (g, prefix) => g.ts.filter((b) => b.startsWith(prefix));

// The upper-3x3 of a column-major mat4, rounded so float noise is not a pose.
export const rot9 = (b) => {
  const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
  return [0, 1, 2, 4, 5, 6, 8, 9, 10].map((i) => m[i].toFixed(4)).join(',');
};

// Every live chunk mesh's vertex floats — `picture` minus what `X:` retired, and minus
// the fixed ids below `1000` (the figure and the cart), which are not terrain.
// ⚠ SUBTRACTING `gone` IS NOT OPTIONAL. A gate that reads the picture without it sees
// geometry the server has already told the client to forget, which is exactly how a
// ground that sank would stay hidden behind a stale chunk.
export function chunkFloats(g, minId = 1000) {
  const out = [];
  for (const [id, body] of g.picture) {
    if (id <= minId || g.gone.has(id)) continue;
    const p = body.split(';');
    if (p.length >= 3) out.push(p[2].split(',').map(Number));
  }
  return out;
}
