/**
 * The world map's hex lattice — pure geometry, no DOM, importable in Node for
 * testing (the same shape `dm-logic.js` has).
 *
 * It exists because the map editor had the lattice in two places and they
 * disagreed. Roads are stored as HALF EDGES — each tile carries a flag per
 * direction and the renderer draws centre → edge-midpoint — so laying one road
 * means setting a flag on both tiles, and the second flag has to be the
 * direction that points BACK. `map.js` used `[3, 4, 5, 0, 1, 2]` for that, in
 * two hand-written copies, and it is wrong: it is the mirror of the COMPASS
 * NAMES the file documents (NE↔SW, E↔W, SE↔NW), while the offsets those indices
 * actually stand for are a different ordering entirely. So every road wrote its
 * second half onto an edge pointing at a third tile, and drew a stub going
 * nowhere. That is the whole of "roads are broken".
 *
 * ⚠ ONE HOME FOR THE LATTICE. This is the same rule the loft side of this
 * project states as "hex_grid owns the lattice; a parity-blind copy is where
 * this codebase breaks". A second table is a second thing that can be wrong
 * about parity.
 */

// ── Layout: pointy-top hexes, odd-r offset (odd rows shifted right by half) ──
export const HEX_SIZE = 36;

export function hexWidth() { return Math.sqrt(3) * HEX_SIZE; }
export function hexHeight() { return 2 * HEX_SIZE; }

/**
 * ⚠ THE PARITY TEST IS `row & 1`, NEVER `row % 2 === 1`.
 *
 * JavaScript's `%` keeps the sign of the dividend, so `-1 % 2` is `-1` and the
 * half-hex shift silently stopped happening on every ODD NEGATIVE row — the map
 * drew rows -1, -3, -5 half a hex to the left of where `hex_grid` puts them.
 * `-1 & 1` is `1`, which is what the loft side computes and what odd-r means.
 *
 * This is the fourth time this codebase has been bitten by `%` where `&` was
 * meant (see moros#3); `test/lattice.test.js` now pins it against the shared
 * fixture, on both signs and both parities.
 */
export function hexCenter(col, row) {
    const w = hexWidth();
    const h = hexHeight();
    const x = col * w + ((row & 1) ? w / 2 : 0) + w;
    const y = row * h * 0.75 + HEX_SIZE;
    return { x, y };
}

/**
 * The exact integer lattice point of a cell — the form `hex_grid` and
 * `hex_field` both state the convention in, and the ONE thing the two languages
 * compare. Doubled coordinates, so the half-hex shift is the integer 1 rather
 * than a float that cannot be compared without an epsilon:
 *
 *   k = 2*col + (row & 1)      m = 3*row       centre = (k*sqrt(3)/2, m/2)
 *
 * Cell centres satisfy `k ≡ m (mod 2)`. A drift of half a hex is a drift of 1
 * in `k`, which is visible without a tolerance — which is why the cross-language
 * fixture is stated here and not over `hexCenter`'s floats.
 */
export function hexLattice(col, row) {
    return { k: 2 * col + (row & 1), m: 3 * row };
}

/**
 * The six neighbour offsets, by row parity.
 *
 * ⚠ A DIRECTION INDEX HERE IS NOT A COMPASS DIRECTION. Odd rows are shifted, so
 * index 2 is NE on an even row and NW on an odd one — derived from `hexCenter`
 * itself, not asserted. That is survivable because every consumer resolves a
 * direction through this table rather than by naming it; what it forbids is a
 * hand-written mirror table and a fixed list of labels. Both existed, and both
 * were wrong. Use `MIRROR_DIR` and `dirName` instead.
 */
export function neighborOffsets(row) {
    return (row & 1) === 0
        ? [[1, 0], [-1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1]]
        : [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1]];
}

/**
 * From the neighbour in direction `d`, the direction that points back.
 *
 * Parity-independent, which is not obvious and is therefore checked rather than
 * claimed: `test/lattice.test.js` re-derives this table from `neighborOffsets`
 * over every cell of a grid on both parities and requires it to match. A road
 * whose two halves disagree is a road drawn as two unconnected stubs.
 */
export const MIRROR_DIR = [1, 0, 3, 2, 5, 4];

/**
 * What direction `d` actually points to from a tile on this row — the honest
 * label, because the index means different compass directions on the two
 * parities. The tile panel showed a fixed `['NE','E','SE','SW','W','NW']`,
 * which matches neither parity, so a flow direction was reported wrong on every
 * row of the map.
 */
export function dirName(row, d) {
    const names = (row & 1) === 0
        ? ['E', 'W', 'NE', 'SE', 'NW', 'SW']
        : ['E', 'W', 'NW', 'SW', 'NE', 'SE'];
    return names[d] ?? '?';
}
