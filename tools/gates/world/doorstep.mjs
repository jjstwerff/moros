// ⚠ CHECKED AND LEFT WHOLE — it is invariant I, and invariant I is about the WIRE.
// The rule *no edit is ever silently corrected* is a statement about what reaches the
// author, so a store test cannot pose it: `w_tau` proves in `hex_editor`'s own tests
// that a refused gesture writes nothing, and that is exactly half the claim. The other
// half is that the sentence said so, with a NAMED reason, an OFFER and a RESIDUAL for
// an ordinal parameter and no offer at all for a nominal one.
//
// Its one store read is deliberate and the file already says why, further down: a
// refusal that reached the author as words while the world moved anyway is the precise
// failure this forbids, and only a running editor can show the sentence and the store
// disagreeing.
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

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
const column = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

await send(g, '7:0,0,0', ['placed']);

const before = await column(0, 0);
const short = await ask(g, '14:5', 'stencil');
const after = await column(0, 0);

const species = await ask(g, '13:9,30', 'scatter');
const dense = await ask(g, '13:1,500', 'scatter');

await send(g, '7:0,0,0', ['placed']);
const lowered = await ask(g, '5:-1', 'ground approximated');

await send(g, '7:0,0,0', ['placed']);
for (let k = 0; k < 3; k++) await send(g, '5:1', ['rebuilt']);
await send(g, '7:14,0,0', ['placed']);            // partway up the hill's flank
const road = await ask(g, '10:1', 'road true');
await send(g, '10:0', ['road false']);

const good = await ask(g, '14:12', 'stencil');

const asked = 5;
const min = Number((short.match(/below the minimum (\d+)/) ?? [])[1]);
const named    = short.includes(`roof ${asked}`) && Number.isFinite(min) && min > asked;
const offered  = short.includes(`offer ${min}`);
const residual = short.includes(`residual ${min - asked}`);
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
// ⚠ `wroteNothing` STAYS, and deliberately, though `w_tau` now proves the same thing in
// `hex_editor`'s tests for every gesture. Here it is checked at the END of the wire: a
// refusal that reached the author as words while the world moved anyway is the exact
// failure invariant I forbids, and only a running editor can show the sentence and the
// store disagreeing.
const ok = named && offered && residual && wroteNothing
           && nominalRefused && noOffer && applied
           && densityRefused && approxReported && gradeReported;
report(g, { short, species, dense, lowered, road, good,
            named, offered, residual, wroteNothing,
            nominalRefused, noOffer, applied,
            densityRefused, approxReported, gradeReported, ok }, ok);
