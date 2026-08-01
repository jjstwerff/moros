// Doorstep gate (`K-FIT`, invariant I) — no edit is ever silently corrected.
//
// > Every author action ends in exactly one of three states: applied exactly,
// > refused with a NAMED REASON, an OFFER and a RESIDUAL, or applied as an
// > explicit approximation with its residual shown.
//
// Two leak sites, each with its own control:
//
//   1. A tool writes without consulting the doorstep, and an inadmissible value
//      is SNAPPED silently. The editor used to do exactly this — a roof of 0 or
//      less became STOREY_H with nothing said. The gate asks for a roof of 5
//      (below eps) and requires a refusal that names the reason, offers 8, and
//      states the residual 3 — and requires that NOTHING was written.
//
//   2. A NOMINAL parameter offered as if ordinal. A material or species is a
//      name, not a magnitude: 255 is not "nearly" 256, and offering it reads as
//      a small correction while changing what the thing is made of (`X68`). The
//      gate asks for species 9 and requires a refusal WITHOUT an offer.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const column = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    await placeAck(0, 0, 0);

    // ── leak 1: an inadmissible ORDINAL value
    const before = await column(0, 0);
    ws.send('14:5');
    const short = await ack('stencil');
    const after = await column(0, 0);

    // ── leak 2: an inadmissible NOMINAL value
    ws.send('13:9,30');
    const species = await ack('scatter');

    // ── leak 1 again, on a tool that had NO check at all: the scatter's
    //    density was unvalidated, so `13:1,500` placed on every cell and called
    //    it density 500. Ordinal, so it refuses with an offer and a residual.
    ws.send('13:1,500');
    const dense = await ack('scatter');

    // ── invariant I's THIRD state: applied as an explicit approximation, with
    //    the residual REPORTED. Lowering ground that is already at the floor
    //    cannot deliver what was asked; clamping is legitimate, silence is not.
    await placeAck(0, 0, 0);
    ws.send('5:-1');
    const lowered = await ack('ground approximated');

    // ── the LAST approximation: a grade is an integer frozen from a real foot
    //    height, so switching a road on loses up to half a unit. Stand on a
    //    slope, where the feet are genuinely between grades, and require the
    //    residual to be reported rather than quietly discarded.
    await placeAck(0, 0, 0);
    for (let k = 0; k < 3; k++) ws.send('5:1');   // ordered; `placeAck` below is the barrier
    await placeAck(14, 0, 0);                      // partway up the hill's flank
    ws.send('10:1');
    const road = await ack('road true');
    ws.send('10:0'); await ack('road false');

    // ── and the doorstep lets a good value through untouched
    ws.send('14:12');
    const good = await ack('stencil');

    const named    = short.includes('roof 5') && short.includes('below the minimum 8');
    const offered  = short.includes('offer 8');
    const residual = short.includes('residual 3');
    const wroteNothing = after === before;
    // the nominal refusal must NOT carry an offer — that is the whole of X68
    const nominalRefused = species.includes('refused') && species.includes('species 9');
    const noOffer = !species.includes('offer');
    const applied = good.startsWith('stencil placed');
    const densityRefused = dense.includes('density 500')
                           && dense.includes('above the maximum 100')
                           && dense.includes('offer 100') && dense.includes('residual 400');
    // the approximation must NAME itself and carry a residual — it is not a refusal
    const approxReported = lowered.includes('ground approximated')
                           && lowered.includes('residual');
    // the grade must say what it quantised FROM and by how much
    const gradeReported = road.includes('quantised from') && road.includes('residual');
    // ⚠ `wroteNothing` STAYS, and deliberately, though `w_tau` now proves the same
    // thing in `hex_editor`'s tests for every gesture. Here it is checked at the
    // END of the wire: a refusal that reached the author as words while the world
    // moved anyway is the exact failure invariant I forbids, and only a running
    // editor can show the sentence and the store disagreeing.
    const ok = named && offered && residual && wroteNothing
               && nominalRefused && noOffer && applied
               && densityRefused && approxReported && gradeReported;
    console.log(JSON.stringify({ short, species, dense, lowered, road, good,
                                 named, offered, residual, wroteNothing,
                                 nominalRefused, noOffer, applied,
                                 densityRefused, approxReported, gradeReported, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
