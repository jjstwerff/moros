const { assert } = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const { hexCenter, hexLattice, neighborOffsets, MIRROR_DIR, dirName,
        hexWidth, HEX_SIZE } = require('../html/hex-lattice.js');

// THE MAP EDITOR'S ROADS, AND WHY THEY WERE BROKEN.
//
// A road is stored as two HALF EDGES — each tile carries a flag per direction
// and the renderer draws centre → edge-midpoint — so one road means a flag on
// both tiles, and the second has to be the direction pointing BACK. `map.js`
// used `[3, 4, 5, 0, 1, 2]` for that, twice, hand-written. That table is the
// mirror of the COMPASS NAMES the file documented (NE↔SW, E↔W, SE↔NW) and not
// of the offsets those indices actually stand for, so every road put its second
// half on an edge aimed at a third tile.
//
// So this file does not check the table against another table. It re-DERIVES
// the mirror from the offsets, over a whole grid and both parities, and derives
// the compass labels from `hexCenter` — the renderer's own geometry. A wrong
// constant cannot survive being computed from the thing it describes.

const COLS = 9, ROWS = 8;

// From the neighbour reached by `d`, which index leads back to where we came
// from? Computed, never assumed.
function mirrorAt(col, row, d) {
    const [dc, dr] = neighborOffsets(row)[d];
    const nc = col + dc, nr = row + dr;
    return neighborOffsets(nr).findIndex(([bc, br]) => nc + bc === col && nr + br === row);
}

describe('hex lattice — the mirror direction', () => {
    it('is derivable at every cell, in every direction', () => {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                for (let d = 0; d < 6; d++) {
                    assert.notStrictEqual(
                        mirrorAt(col, row, d), -1,
                        `no way back from the neighbour of [${col},${row}] in direction ${d}`);
                }
            }
        }
    });

    it('is the same table everywhere — parity included', () => {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                for (let d = 0; d < 6; d++) {
                    assert.strictEqual(
                        mirrorAt(col, row, d), MIRROR_DIR[d],
                        `mirror of ${d} at [${col},${row}] (row ${row % 2 ? 'odd' : 'even'})`);
                }
            }
        }
    });

    it('rejects the table the editor used to lay roads with', () => {
        // ⚠ The control. `[3,4,5,0,1,2]` is what shipped, and it must NOT satisfy
        // the derivation above — otherwise this whole file proves nothing.
        const shipped = [3, 4, 5, 0, 1, 2];
        const agrees = shipped.every((v, d) => v === MIRROR_DIR[d]);
        assert.isFalse(agrees, 'the old table would have been correct after all');
    });

    it('is an involution — mirroring twice is where you started', () => {
        for (let d = 0; d < 6; d++) {
            assert.strictEqual(MIRROR_DIR[MIRROR_DIR[d]], d, `direction ${d}`);
        }
    });
});

describe('hex lattice — a road links the two tiles it is drawn between', () => {
    // The invariant the editor actually needs: set a flag on A toward its
    // neighbour and the mirrored flag on that neighbour, and the two half-edges
    // meet at the SAME point — which is what makes a road one line rather than
    // two stubs pointing away from each other.
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    it('puts both halves on the same edge midpoint', () => {
        for (let row = 1; row < ROWS - 1; row++) {
            for (let col = 1; col < COLS - 1; col++) {
                for (let d = 0; d < 6; d++) {
                    const [dc, dr] = neighborOffsets(row)[d];
                    const nc = col + dc, nr = row + dr;
                    const a = hexCenter(col, row), b = hexCenter(nc, nr);

                    // A draws toward its neighbour in direction d …
                    const fromA = midpoint(a, b);
                    // … and B draws toward whatever MIRROR_DIR[d] points at.
                    const [bc, br] = neighborOffsets(nr)[MIRROR_DIR[d]];
                    const back = hexCenter(nc + bc, nr + br);
                    const fromB = midpoint(b, back);

                    assert.closeTo(fromA.x, fromB.x, 1e-9,
                        `x at [${col},${row}] dir ${d}`);
                    assert.closeTo(fromA.y, fromB.y, 1e-9,
                        `y at [${col},${row}] dir ${d}`);
                }
            }
        }
    });

    it('does not, with the table that shipped', () => {
        // The same measurement with the old table: the halves land apart. One
        // failing pair is enough — this is the defect, reproduced.
        const shipped = [3, 4, 5, 0, 1, 2];
        let apart = 0;
        for (let row = 1; row < ROWS - 1; row++) {
            for (let col = 1; col < COLS - 1; col++) {
                for (let d = 0; d < 6; d++) {
                    const [dc, dr] = neighborOffsets(row)[d];
                    const nc = col + dc, nr = row + dr;
                    const a = hexCenter(col, row), b = hexCenter(nc, nr);
                    const fromA = midpoint(a, b);
                    const [bc, br] = neighborOffsets(nr)[shipped[d]];
                    const back = hexCenter(nc + bc, nr + br);
                    const fromB = midpoint(b, back);
                    if (Math.hypot(fromA.x - fromB.x, fromA.y - fromB.y) > 1e-9) apart++;
                }
            }
        }
        assert.isAbove(apart, 0, 'the old table drew both halves on one edge');
    });
});

describe('hex lattice — direction names', () => {
    // The label a direction index deserves, read off the renderer's geometry.
    function compassAt(row, d) {
        const col = 4;
        const [dc, dr] = neighborOffsets(row)[d];
        const a = hexCenter(col, row), b = hexCenter(col + dc, row + dr);
        const deg = Math.round(Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI);
        return { 0: 'E', 180: 'W', '-180': 'W', 60: 'NE', 120: 'NW',
                 '-60': 'SE', '-120': 'SW' }[deg];
    }

    it('matches where the direction actually points, on both parities', () => {
        for (const row of [2, 3]) {
            for (let d = 0; d < 6; d++) {
                assert.strictEqual(dirName(row, d), compassAt(row, d),
                    `direction ${d} on a ${row % 2 ? 'odd' : 'even'} row`);
            }
        }
    });

    it('genuinely differs by parity — which is why one fixed list was wrong', () => {
        // ⚠ The tile panel showed `['NE','E','SE','SW','W','NW']` for every row.
        // No single list can be right: index 2 is NE on an even row and NW on an
        // odd one. Asserting the difference is what stops someone "simplifying"
        // `dirName` back into a constant.
        const even = [0, 1, 2, 3, 4, 5].map((d) => dirName(2, d));
        const odd  = [0, 1, 2, 3, 4, 5].map((d) => dirName(3, d));
        assert.notDeepEqual(even, odd);
    });
});

describe('hex lattice — the layout it all rests on', () => {
    it('shifts odd rows by half a hex and stacks rows at three quarters', () => {
        const w = hexWidth();
        assert.closeTo(hexCenter(3, 1).x - hexCenter(3, 0).x, w / 2, 1e-9);
        assert.closeTo(hexCenter(3, 2).x - hexCenter(3, 0).x, 0, 1e-9);
        assert.closeTo(hexCenter(0, 1).y - hexCenter(0, 0).y, 2 * 36 * 0.75, 1e-9);
    });

    it('keeps every neighbour one hex away', () => {
        const w = hexWidth();
        for (const row of [2, 3]) {
            const a = hexCenter(4, row);
            for (let d = 0; d < 6; d++) {
                const [dc, dr] = neighborOffsets(row)[d];
                const b = hexCenter(4 + dc, row + dr);
                assert.closeTo(Math.hypot(b.x - a.x, b.y - a.y), w, 1e-9,
                    `direction ${d} on row ${row}`);
            }
        }
    });
});

// ── THE CROSS-LANGUAGE PARITY GATE (moros#3) ────────────────────────────────
//
// The convention is implemented twice: here for the browser map editor, and in
// `hex_grid` for the loft side. Two implementations of one convention is the
// silent-failure shape — everything "works" until they disagree about where a
// row sits, and nothing says so.
//
// So both sides read ONE committed file, and neither generates it at test time.
// `hex_grid/tests/02-parity.loft` asserts these same bytes; the comment at the
// top of the fixture explains why it holds INTEGERS and not sampled floats.
//
// ⚠ IT FOUND A LIVE BUG THE DAY IT WAS WRITTEN. `hexCenter` tested row parity
// with `row % 2 === 1`, and JavaScript's `%` keeps the sign of the dividend, so
// `-1 % 2` is `-1`: the half-hex shift silently stopped on every odd NEGATIVE
// row, putting the loft and browser lattices half a hex apart below y=0. That is
// the fourth instance of `%`-where-`&`-was-meant in this codebase.
//
// ⚠ AND IT MUST FAIL IF THE SIBLING TREE IS MISSING, never skip. A gate that
// quietly passes when it cannot find what it measures reports an absence it is
// blind to.

const FIXTURE = path.join(__dirname, '..', '..',
    'loft-libs-world', 'hex_grid', 'tests', 'fixtures', 'lattice.tsv');

function loadFixture() {
    const raw = fs.readFileSync(FIXTURE, 'utf8');     // throws if absent, on purpose
    return raw.split('\n')
        .filter((l) => l.length > 0 && !l.startsWith('#'))
        .map((l) => l.split('\t').map(Number))
        .map(([col, row, k, m]) => ({ col, row, k, m }));
}

describe('hex lattice — parity with the loft implementation', () => {
    it('reads the shared fixture, and it covers both signs of row', () => {
        const rows = loadFixture();
        assert.strictEqual(rows.length, 63,
            'the shared fixture changed size — has it been regenerated to pass?');
        assert.isAbove(rows.filter((r) => r.row < 0 && (r.row & 1) === 1).length, 0,
            'no odd NEGATIVE rows in the fixture — the one case that keeps breaking');
        assert.isAbove(rows.filter((r) => r.row > 0 && (r.row & 1) === 1).length, 0,
            'no odd positive rows in the fixture');
    });

    it('puts every fixture cell on its integer lattice point', () => {
        for (const { col, row, k, m } of loadFixture()) {
            const got = hexLattice(col, row);
            assert.strictEqual(got.k, k, `cell [${col},${row}] k`);
            assert.strictEqual(got.m, m, `cell [${col},${row}] m`);
            assert.strictEqual((got.k - got.m) % 2, 0,
                `cell [${col},${row}] breaks k = m (mod 2)`);
        }
    });

    // hexCenter is what the renderer actually calls, so the fixture has to reach
    // it. It carries a scale (HEX_SIZE) and a one-hex pad so the map is not drawn
    // against the canvas edge; both are removed here, and what is left must be
    // the lattice point. The tolerance is honest: this claim is about SCALE, and
    // the two languages multiply in a different order.
    it('agrees with hexCenter once the scale and the pad are removed', () => {
        const w = hexWidth();
        for (const { col, row, k, m } of loadFixture()) {
            const c = hexCenter(col, row);
            assert.closeTo((c.x - w) / HEX_SIZE, k * Math.sqrt(3) / 2, 1e-9,
                `cell [${col},${row}] x`);
            assert.closeTo((c.y - HEX_SIZE) / HEX_SIZE, m / 2, 1e-9,
                `cell [${col},${row}] y`);
        }
    });

    // The specific bug, by name, so a reader can find it.
    it('shifts odd NEGATIVE rows exactly like odd positive ones', () => {
        const w = hexWidth();
        for (let i = 0; i < 4; i++) {
            const neg = -(2 * i + 1);
            const pos = 2 * i + 1;
            assert.closeTo(hexCenter(0, neg).x, hexCenter(0, pos).x, 1e-9,
                `row ${neg} and row ${pos} disagree — the shift stopped below zero`);
            assert.closeTo(hexCenter(0, neg).x - hexCenter(0, 0).x, w / 2, 1e-9,
                `row ${neg} is not shifted half a hex`);
        }
        // and even rows must NOT move, or the above passes on a lattice that
        // shifts everything
        for (let i = 0; i < 4; i++) {
            assert.closeTo(hexCenter(0, -(2 * i + 2)).x, hexCenter(0, 0).x, 1e-9,
                `even row ${-(2 * i + 2)} was shifted`);
        }
    });
});
