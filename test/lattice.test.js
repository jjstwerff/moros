const { assert } = require('chai');
const { hexCenter, neighborOffsets, MIRROR_DIR, dirName,
        hexWidth } = require('../html/hex-lattice.js');

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
