// DID THAT ROW'S IMAGE CHANGE? — `B5.3`'s instrument.
//
// ⚠ THE CLAIM IS *IT CHANGED*, NOT *IT IS NOT BLANK*, and the plan says so in
// capitals for a reason: a thumbnail that never invalidates is non-blank on every
// frame of its life. `panel.mjs` already answers "is there a picture there"; this
// answers "is it a picture of the part that is on disk NOW", which is the only
// thing a cache can get wrong.
//
//     rowdiff.mjs <before.png> <after.png> same|differ
//
// `same` is not a convenience — it is the control. Two shots of an UNCHANGED part
// must be identical in that row, or "it changed" is measuring the renderer's
// noise: anti-aliasing that lands differently, a light that drifted, a frame
// caught mid-draw. Without it a gate that always passes and a gate that works
// look the same.
import { decodePng } from './shot.mjs';

const [, , aPath, bPath, want] = process.argv;
if (!aPath || !bPath || (want !== 'same' && want !== 'differ')) {
    console.error('usage: rowdiff.mjs <before.png> <after.png> same|differ');
    process.exit(2);
}

// The image slot, derived the same way `panel.mjs` derives it: the list is
// `rect(8, top, 224, h)` and the picture sits `SW_W + 4` in from its right edge.
const SW_W = 22, SW_H = 16, ROW_H = 20, LIST_X = 8, LIST_W = 224;
const IMG_X = LIST_X + LIST_W - SW_W - 4;

const read = (path) => {
    const img = decodePng(path);
    const px = (x, y) => { const i = (y * img.w + x) * img.ch; return [img.px[i], img.px[i + 1], img.px[i + 2]]; };
    const lum = (x, y) => { const p = px(x, y); return (p[0] + p[1] + p[2]) / 3; };
    let listTop = 0;
    for (let y = 0; y < img.h; y++) {
        if (y > img.h * 0.35 && lum(20, y) < 28) { listTop = y; break; }
    }
    if (!listTop) { console.error(`rowdiff: no list well in ${path}`); process.exit(2); }
    // The LAST labelled row — where a part lands, since `catalogue_wire` sends the
    // materials first and the parts after them.
    let last = -1;
    for (let i = 0; listTop + (i + 1) * ROW_H < img.h; i++) {
        let peak = 0;
        for (let y = listTop + i * ROW_H; y < listTop + (i + 1) * ROW_H; y++)
            for (let x = LIST_X; x < IMG_X - 2; x++) peak = Math.max(peak, lum(x, y));
        if (peak < 100) break;
        last = i;
    }
    if (last < 0) { console.error(`rowdiff: no labelled rows in ${path}`); process.exit(2); }
    const y0 = listTop + last * ROW_H + 2;
    const slot = [];
    for (let y = y0; y < y0 + SW_H && y < img.h; y++)
        for (let x = IMG_X; x < IMG_X + SW_W; x++) slot.push(px(x, y));
    return { row: last, slot };
};

const A = read(aPath), B = read(bPath);
if (A.row !== B.row || A.slot.length !== B.slot.length) {
    console.log(`  FAIL  the two pictures do not have the same catalogue shape `
              + `(row ${A.row} vs ${B.row}, ${A.slot.length} vs ${B.slot.length} pixels)`);
    process.exit(1);
}

// ⚠ COUNT THE PIXELS THAT MOVED, AND BY HOW MUCH. A boolean "are these buffers
// equal" cannot tell a redrawn thumbnail from one pixel of anti-aliasing landing
// differently, and those want opposite verdicts. The tolerance is per channel and
// the threshold is a share of the slot, both taken from the shape of the thing:
// a rebuilt thumbnail is a different BUILDING, so it moves a large fraction of a
// 22x16 picture, while sampling noise moves a rim.
const TOL = 8;
let moved = 0, worst = 0;
for (let i = 0; i < A.slot.length; i++) {
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(A.slot[i][c] - B.slot[i][c]));
    worst = Math.max(worst, d);
    if (d > TOL) moved++;
}
const share = moved / A.slot.length;
const detail = `row ${A.row}: ${moved}/${A.slot.length} pixels moved (${(share * 100).toFixed(0)}%), `
             + `worst channel delta ${worst}`;

if (want === 'differ') {
    const ok = share >= 0.10;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  the thumbnail CHANGED when the part did — ${detail}`);
    process.exit(ok ? 0 : 1);
}
const ok = moved === 0;
console.log(`  ${ok ? 'ok  ' : 'FAIL'}  the thumbnail held still while the part did — ${detail}`);
process.exit(ok ? 0 : 1);
