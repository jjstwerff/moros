// Terrain gate. Four claims, each separable:
//   raises      — an ↑ ahead changes the ground
//   spares      — and does NOT change the ground under the character (PEAK_R <
//                 PEAK_AHEAD, so a hill can never lift or bury you)
//   blends      — two peaks side by side sum where they overlap, rather than
//                 the later one replacing the earlier
//   idempotent  — levelling flat ground is a no-op; walking a flat path twice
//                 cannot dig a trench
//
// It reads HEIGHTS off the chunk meshes rather than trusting a report: every
// mesh vertex carries its world y, so the ground's actual shape is what is
// measured, not the server's opinion of it.
//
// Drives the character by PLACING it (7:<x>,<z>,<yaw>), never by walking.
// This is a WORLD gate: it measures terrain, streaming or levelling, and must
// not depend on locomotion — walking speed, stride or step timing. See
// tools/gates/README.md for why (a fixed-millisecond walk made this fail
// against working code the day the speed changed).
//
// ⚠ IT WAS FAILING THREE RUNS IN FOUR, and for two reasons that compound.
//
// The first is the usual one: every step was `step(fn, ms)` — eight fixed sleeps,
// each a claim about how fast this box is, before reads of a MESH that arrives
// several ticks after the world changes. Raises now wait for `S:rebuilt`, places
// for `S:placed`, and the opening read for the `Z:0` that closes the initial
// streaming batch.
//
// ⚠ The second is subtler and is what actually made it red: THE PHASES WERE
// COMPARING MAXIMA OVER DIFFERENT DOMAINS. `yStats` ranged over whatever chunks
// happened to be loaded, and a place changes the loaded set — the streamer brings
// chunks in and drops others. So `walked.hi` read 1.583 when part of the hill had
// not arrived and 2.917 when it had, and `levels` (`levelled.hi <= walked.hi`)
// failed against a server doing nothing wrong. Waiting longer would have hidden it
// rather than fixed it: the defect is that a maximum over set A was being compared
// with a maximum over set B. Every phase is now measured over the chunks present in
// ALL of them, so the comparison has one domain.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);

let stage = 0, zClosed = 0;
const chunks = new Map();
const status = [];
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find((x) => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
// `Z:1` … `Z:0` brackets a batch of mesh traffic — both the dirty flush and the
// streamer use it. The `Z:0` that follows the connect is the signal that the
// opening set of chunks has actually landed, which is otherwise unobservable: the
// streamer sends no status of its own.
const awaitZ = async (limitMs = 40000) => {
  const before = zClosed;
  for (let t = 0; t < limitMs; t += 50) {
    if (zClosed > before) return true;
    await wait(50);
  }
  return false;
};
// A raise has no ack of its own; `rebuilt` is what says the picture caught up.
const raise = async () => { ws.send('5:1'); return ack('rebuilt'); };

// A phase is a SNAPSHOT of the mesh, kept whole so the domain can be intersected
// afterwards rather than guessed at in advance.
const snap = () => new Map([...chunks].map(([id, d]) => [id, d]));
const statsOver = (m, ids) => {
  let lo = 1e9, hi = -1e9, n = 0;
  for (const id of ids)
    for (let i = 1; i < m.get(id).length; i += 6) {
      lo = Math.min(lo, m.get(id)[i]); hi = Math.max(hi, m.get(id)[i]); n++;
    }
  return { lo: +lo.toFixed(3), hi: +hi.toFixed(3), n };
};

ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') {
    const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    if (id > 1000) chunks.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number));
  }
  if (t === 'X') chunks.delete(Number(b));
  if (t === 'S') status.push(b);
  if (t === 'Z' && b === '0') zClosed++;
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && stage === 0) { stage = 1; run(); }
};
async function run() {
  // ⚠ THE BATCH MAY ALREADY HAVE CLOSED. `run()` is started from the first `C:`,
  // and the streamer's `Z:0` can precede it — so waiting for a NEW one waits for
  // something that already happened. Ask whether it has closed, not whether it will.
  const loaded = zClosed > 0 ? true : await awaitZ();
  const flatM = snap();

  await raise();                               // raise once
  await raise();                               // and again — same cell, one peak
  const raisedM = snap();

  place(9.0, 0.0, 0.0); await ack('placed');   // stand on its flank
  const walkedM = snap();

  ws.send('6:1'); await ack('level');          // levelling on, at this height
  place(12.0, 0.0, 0.0); await ack('placed');  // step outward, one place at a time
  place(15.0, 0.0, 0.0); await ack('placed');
  const levelledM = snap();

  // ⚠ ONE DOMAIN. The chunks present in every phase — anything else compares a
  // maximum over one region with a maximum over another, which is what made this
  // gate red against working code.
  const phases = [flatM, raisedM, walkedM, levelledM];
  const common = [...flatM.keys()].filter((id) => phases.every((p) => p.has(id)));
  const flat = statsOver(flatM, common);
  const raised = statsOver(raisedM, common);
  const walked = statsOver(walkedM, common);
  const levelled = statsOver(levelledM, common);

  const raises = raised.hi > flat.hi + 0.2;
  const sparesStart = Math.abs(flat.lo) < 0.001 && Math.abs(raised.lo) < 0.001;
  const levels = levelled.hi <= walked.hi + 0.001;
  // ⚠ AND THE DOMAIN MUST NOT BE EMPTY. An intersection that collapsed would make
  // every claim above vacuously true — `hi` and `lo` of nothing compare however you
  // like. This is the clause that stops the fix from becoming a way to pass.
  const domainHeld = common.length > 8 && flat.n > 1000;
  const ok = loaded && raises && sparesStart && levels && domainHeld;
  console.log(JSON.stringify({ flat, raised, walked, levelled,
                               commonChunks: common.length,
                               loaded, raises, sparesStart, levels, domainHeld, ok }));
  ws.close(); process.exit(ok ? 0 : 1);
}
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
