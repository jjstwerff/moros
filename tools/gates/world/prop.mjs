// ⚠ THE SEPARATION IS `hex_world`'s AND IT IS TESTED THERE. `tests/dressing.loft`
// holds all three of the claims below against the store: dressing is written and
// read, it is INVISIBLE to a terrain read, and a terrain write leaves it alone
// ("not even to blank it"). This gate is the EDITOR's half — that `19:` puts a
// prop where the author stands, that two props ACCUMULATE in one cell rather than
// replacing, and that the acknowledgement says so.
//
// It is not thinned further because the prop gesture itself has not moved into
// `hex_editor` yet — when it does, the accumulation claim goes with it and what is
// left here is the sentence.
// Prop gate (rung W6, moros#14) — `D1` in a running editor.
//
// The model can hold dressing; this is the first time the EDITOR puts anything
// there. What it gates is the separation, not the placement:
//
//   · a prop reads back from the DRESSING view;
//   · it is invisible to the TERRAIN view — the same cell, two answers, which
//     is `D1`'s "excluded from col_K";
//   · raising the ground under it does not delete it, and the terrain write
//     that raises it is exactly the one that used to blank a dressing slot;
//   · props ACCUMULATE in a cell rather than replacing each other;
//   · a prop index outside the palette is refused NOMINALLY — no offer (`X68`).

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
const dressing = async (q, r) => {
  const m = await ask(g, `20:${q},${r}`, `dressing ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const terrain = async (q, r) => {
  const m = await ask(g, `15:${q},${r}`, `column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

// build a hill and stand on it, so the ground can later MOVE under the prop
await send(g, '7:0,0,0', ['placed']);
await send(g, '5:1', ['rebuilt']);
await send(g, '5:1', ['rebuilt']);
await send(g, '7:17.3,0,0', ['placed']);          // hex (10,0)

const placed = await ask(g, '19:3', 'prop 3 placed');
const dress1 = await dressing(10, 0);
const terr1 = await terrain(10, 0);

// a second prop in the same cell must ADD, not replace
await send(g, '19:5', ['prop 5 placed']);
const dress2 = await dressing(10, 0);

// ── build a STOREY over them, which is the terrain write that actually reaches a
//    dressing slot.
//
// ⚠ A RAISE DOES NOT. The brush writes a ONE-CELL terrain column, so it only ever
// touches layer 0 and can never reach the dressing appended after it — this clause was
// green with the protection deleted, which makes it a clause about nothing. A storey's
// column comes from `world_column`, which carries one entry per chunk layer INCLUDING
// the absent placeholders for dressing, so it addresses layer 1 and the skip is what
// stops that placeholder being written back over a prop.
const storey = await ask(g, '12:1', 'storey');
const dress3 = await dressing(10, 0);
const terr3 = await terrain(10, 0);

// a nominal refusal, with no offer
const bad = await ask(g, '19:99', 'prop');

const inDressing = dress1.startsWith('13/3') || /\/3(,|$)/.test(dress1);
const notInTerrain = !terr1.includes('/');       // terrain carries heights only
const accumulates = dress2.split(',').length === 2 && dress2.includes('/5');
const survived = dress3.split(',').length === 2 && dress3.includes('/3')
                 && dress3.includes('/5');
const groundMoved = terr3 !== terr1 && storey.startsWith('storey +1');
const refusedNominal = bad.includes('refused') && bad.includes('prop 99')
                       && !bad.includes('offer');
const ok = inDressing && notInTerrain && accumulates && survived
           && groundMoved && refusedNominal;
report(g, { placed, dress1, terr1, dress2, storey, dress3, terr3, bad,
            inDressing, notInTerrain, accumulates, survived,
            groundMoved, refusedNominal, ok }, ok);
