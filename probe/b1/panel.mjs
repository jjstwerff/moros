// B1.3's instrument — is the PANEL in the client's picture?
//
// ⚠ READING A SCREENSHOT BY EYE IS A BLIND INSTRUMENT, and this tree has written
// that down after paying for it. "I can see six buttons" cannot tell six from
// five, cannot tell the strip being 240px from it being 88px, and cannot notice
// the panel drawing over the whole canvas. All three are things that happened or
// nearly happened while building this step.
//
// So: count. The claims, each with something that must fail —
//
//   the strip is DARK          · a column inside it is panel-coloured, not sky
//   the strip is 240 WIDE      · a column just outside it is sky, not panel
//   there are SIX buttons      · six lighter bands in the toolbar region
//   the panel did not eat the canvas · most of the frame is still sky
//
// The last one is the control that the first three cannot provide: a renderer
// that filled everything with panel_bg passes "the strip is dark" perfectly.
import { decodePng } from './shot.mjs';

const path = process.argv[2];
// ⚠ THE SWATCHES ARE ASKED FOR, NOT ASSUMED. A client with no server has an
// empty catalogue and therefore no swatches — correctly — so demanding them of
// every picture would fail the one stage that deliberately runs without one.
const wantSwatches = process.argv.includes('--swatches');
if (!path) { console.error('usage: panel.mjs <png> [--swatches]'); process.exit(2); }

const img = decodePng(path);
const px = (x, y) => {
    const i = (y * img.w + x) * img.ch;
    return [img.px[i], img.px[i + 1], img.px[i + 2]];
};
const lum = (x, y) => { const [r, g, b] = px(x, y); return (r + g + b) / 3; };

// The panel is dark (0x1E1E22-ish, lum ~32) and the sky is light (lum ~130).
// A threshold halfway between separates them with room to spare; it is not
// tuned, and if it ever needs tuning the two are no longer distinguishable and
// this gate should say so rather than be nudged.
const DARK = 80;
const STRIP = 240;

let fail = 0;
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${msg}`); if (!ok) fail++; };

// ── the strip is there and it is dark ────────────────────────────
const midY = Math.floor(img.h * 0.6);              // in the list well, below the buttons
check(lum(20, midY) < DARK,
      `a column inside the strip is dark (lum ${lum(20, midY).toFixed(0)} < ${DARK})`);

// ── and it stops at 240 ──────────────────────────────────────────
check(lum(STRIP + 40, midY) >= DARK,
      `just right of 240px is NOT panel (lum ${lum(STRIP + 40, midY).toFixed(0)} >= ${DARK})`);

// Walk the row to find where dark gives way to sky — the measured width.
let edge = 0;
while (edge < img.w && lum(edge, midY) < DARK) edge++;
check(Math.abs(edge - STRIP) <= 2, `the strip measures ${edge}px, want ${STRIP}`);

// ── six buttons ──────────────────────────────────────────────────
// Buttons (0x33333A, lum ~52) sit on the panel background (0x1E1E22, lum ~32).
//
// ⚠ A ROW, NOT A COLUMN. The first version sampled one column and counted runs;
// once B1.4 put LABELS in the buttons, that column ran through the glyphs and
// six buttons read as thirteen fragments. A single sample line is hostage to
// whatever is drawn on it.
//
// A button row is MOSTLY button — text is a small fraction of it — so the test
// is a majority across the button's width. That survives labels, a highlight, or
// anything else drawn inside the box.
//
// ⚠ AND COUNT BARS, NOT LIGHTER PIXELS. Before that it counted runs of "lighter
// than the background" and reported SEVEN, the seventh being the 2px separator
// hairline. The fix is not a threshold tuned between 44 and 52; it is that a
// button is a 32px BAR and a hairline is not. Both discriminators come from the
// shape, which is what makes them survive a restyle.
const BTN = 42;
const MIN_BAR = 8;
const BTN_X0 = 8, BTN_X1 = 232;
const runs = [];
let run = 0;
for (let y = 0; y < Math.floor(img.h * 0.4); y++) {
    let hit = 0, seen = 0;
    for (let x = BTN_X0; x < BTN_X1; x += 2) {
        seen++;
        const l = lum(x, y);
        if (l > BTN && l < DARK) hit++;
    }
    const isBtnRow = seen > 0 && hit / seen > 0.6;
    if (isBtnRow) { run++; } else { if (run > 0) runs.push(run); run = 0; }
}
if (run > 0) runs.push(run);
const bars = runs.filter((r) => r >= MIN_BAR);
check(bars.length === 6,
      `six toolbar bars of >=${MIN_BAR}px, counted ${bars.length} (runs: ${runs.join(",")})`);
// ⚠ `[].every(…)` IS TRUE, so this row reported "ok" on a picture with NO panel
// in it — a vacuous pass sitting in the middle of a failing run, which is the
// shape that teaches a reader to skim the output. The count is part of the claim.
check(bars.length > 0 && bars.every((r) => r >= 24 && r <= 40),
      `each bar is button-height (32px): ${bars.length ? bars.join(",") : "none found"}`);

// ── the labels are legible (B1.4) ────────────────────────────────
// Text is 0xE0E0E6 (lum ~224) against buttons at ~52 and the list well at ~20,
// so a bright pixel inside the strip is a glyph. This does not read the WORDS —
// a pixel count cannot — but it separates "labels drawn" from "labels missing",
// which is the failure B1.4 can actually have. What the words say is checked by
// the loft tests that built the list.
let glyph = 0;
for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < STRIP; x++) if (lum(x, y) > 150) glyph++;
}
check(glyph > 500, `the panel has text in it (${glyph} glyph pixels, want > 500)`);

// And in the toolbar specifically, so a status line alone cannot carry the row.
let btnGlyph = 0;
for (let y = 0; y < Math.floor(img.h * 0.35); y++) {
    for (let x = 0; x < STRIP; x++) if (lum(x, y) > 150) btnGlyph++;
}
check(btnGlyph > 300, `the BUTTONS have labels (${btnGlyph} glyph pixels, want > 300)`);

// ── the subject line (B1.5) ──────────────────────────────────────
// §C1 wants one line, top-left, NEVER HIDDEN. Two claims, and the second is the
// one with teeth: the bar is there, and nothing is drawn over it.
const SUBJ_H = 24;
let subjGlyph = 0;
for (let y = 0; y < SUBJ_H; y++) {
    for (let x = 0; x < img.w; x++) if (lum(x, y) > 150) subjGlyph++;
}
check(subjGlyph > 200, `the subject line has words in it (${subjGlyph} glyph pixels)`);

// ⚠ AND IT RUNS PAST THE STRIP. A subject bar that stopped at 240px would look
// fine in a thumbnail and truncate the answer to "what am I working on" down to
// its first two words — the failure this bar exists to avoid.
let past = 0;
for (let y = 0; y < SUBJ_H; y++) {
    for (let x = STRIP + 10; x < img.w; x++) if (lum(x, y) > 150) past++;
}
check(past > 0, `the subject line extends past the 240px strip (${past} glyph pixels)`);

// ── the catalogue's images: swatches and thumbnails (B3.3, B5.2) ─
// §C4: each image is RENDERED — a material swatch is one hex tile through the
// world's own shader, a part thumbnail is the part itself from a canonical
// three-quarter view. Neither is a picture on disk. What a screenshot can check
// is that every row HAS one, that they are DIFFERENT, and that a part's is not
// the flat blob a material's is.
//
// ⚠ AND BOTH HALVES ARE NEEDED. Nine swatches were "rendered" and the picture
// had none: the hexagon was built in the world's XZ plane while clip space is
// XY, so it collapsed to a line. The client's own count said 9. A count of
// draw calls is not a count of pixels — and it said 9 again the day a shared
// framebuffer got a mismatched depth attachment and every swatch was dropped.
//
// ⚠ THE ROW COUNT IS READ FROM THE PICTURE, NOT ASSUMED. This loop used to be
// `for (i = 0; i < 9; i++)` — the mesher's nine surfaces — and `B5.1` added a
// TENTH row, a part. Nothing looked at it, so nobody saw that the client was
// drawing `house/cottage` a BLACK HEXAGON: `render_swatches` indexed
// `surface_at(i)` by the row, and `surface_at(9)` is the `?` sentinel with
// colour (0,0,0). Measured at the time: row 9 read `5,5,6` against a list
// background of `20,20,24` — not blank, DARKER than blank. A gate that counts
// what it expects cannot see what was added.
const SW_W = 22, SW_H = 16;
const ROW_H = 20;
// The list is `rect(8, top, 224, h)` and the image sits `SW_W + 4` in from its
// right edge — derived rather than typed, because the previous constant was 4px
// out and sampled a slice of the row beside the picture.
const LIST_X = 8, LIST_W = 224;
const IMG_X = LIST_X + LIST_W - SW_W - 4;
let listTop = 0;
for (let y = 0; y < img.h; y++) {
    // the list well is the darkest band inside the strip, below the buttons
    if (y > img.h * 0.35 && lum(20, y) < 28) { listTop = y; break; }
}

// The list background, read from the picture rather than named: a row with no
// image shows exactly this, which is what "blank" means here.
const bg = px(LIST_X + 4, listTop + 4);
const isBg = ([r, g, b]) =>
    Math.abs(r - bg[0]) < 4 && Math.abs(g - bg[1]) < 4 && Math.abs(b - bg[2]) < 4;

// One row: does it carry text, and what is in its image slot?
const readRow = (i) => {
    const y0 = listTop + i * ROW_H;
    let textPeak = 0;
    for (let y = y0; y < y0 + ROW_H && y < img.h; y++)
        for (let x = LIST_X; x < IMG_X - 2; x++) textPeak = Math.max(textPeak, lum(x, y));
    let ink = 0, peak = 0, sum = 0, n = 0;
    const buckets = new Set();
    for (let y = y0 + 2; y < y0 + 2 + SW_H && y < img.h; y++) {
        for (let x = IMG_X; x < IMG_X + SW_W; x++) {
            const p = px(x, y);
            n++; sum += (p[0] + p[1] + p[2]) / 3;
            peak = Math.max(peak, (p[0] + p[1] + p[2]) / 3);
            if (!isBg(p)) { ink++; buckets.add(p.map((v) => v >> 4).join(",")); }
        }
    }
    return { textPeak: Math.round(textPeak), ink, colours: buckets.size,
             peak: Math.round(peak), mean: Math.round(sum / n) };
};

// How many rows the catalogue actually drew — a row with a label is a row.
const rows = [];
for (let i = 0; i * ROW_H + listTop + ROW_H < img.h; i++) {
    const r = readRow(i);
    if (r.textPeak < 100) break;
    rows.push(r);
}

if (wantSwatches) {
check(rows.length >= 10,
      `the catalogue drew ${rows.length} labelled rows (nine surfaces and at least one part)`);

// EVERY row has an image, not the first nine.
const blank = rows.map((r, i) => [i, r]).filter(([, r]) => r.ink < 20);
check(blank.length === 0,
      `every catalogue row carries an image (${rows.length - blank.length}/${rows.length}; `
    + `blank rows: ${blank.length ? blank.map(([i]) => i).join(",") : "none"})`);

// ⚠ AND NONE OF THEM IS DARKER THAN THE BACKGROUND, which is the shape of the
// bug this row was added for. A black hexagon has plenty of ink and is not
// blank; it is an image of nothing, and only a comparison against the row it sits
// on can say so.
const bgLum = (bg[0] + bg[1] + bg[2]) / 3;
const murky = rows.map((r, i) => [i, r]).filter(([, r]) => r.peak <= bgLum + 6);
check(murky.length === 0,
      `no row's image is darker than the list well it sits in (background lum `
    + `${bgLum.toFixed(0)}; offenders: ${murky.length ? murky.map(([i, r]) => `${i}@${r.peak}`).join(",") : "none"})`);

// ⚠ AND THEY DIFFER FROM EACH OTHER. Ten identical blobs would pass every row
// above perfectly and would mean the shader drew one colour for everything.
const key = (r) => `${Math.round(r.mean / 8)}`;
const distinct = new Set(rows.map(key)).size;
check(distinct >= 6, `the images are different (${distinct} distinct of ${rows.length})`);

// ── a part's image is a PICTURE, a material's is a SWATCH (B5.2) ──
// The discriminator comes from the SHAPE, not from a threshold: a material swatch
// is ONE flat colour over a transparent surround, so it has two buckets; a part
// is a roof over walls over ground and cannot have fewer than three. Measured on
// the cottage: swatches 2, thumbnail 5.
const thumbs = rows.filter((r) => r.colours >= 3).length;
check(thumbs >= 1,
      `at least one row is a rendered PART, not a flat swatch `
    + `(${thumbs} of ${rows.length} rows have >=3 colours; per row: ${rows.map((r) => r.colours).join(",")})`);
// ⚠ AND THE OTHER SIDE OF IT. If every row came back multi-coloured the
// discriminator is measuring noise rather than the difference it names.
check(thumbs < rows.length,
      `and the material rows are still flat swatches (${rows.length - thumbs} of ${rows.length})`);
} else if (rows.some((r) => r.ink > 20)) {
  // Not an error, but worth saying: a picture that was not asked about images
  // and has them means the two stages have drifted apart.
  console.log(`  note  ${rows.filter((r) => r.ink > 20).length} row images present but not checked (no --swatches)`);
}

// ── availability: greyed, not hidden (B6) ────────────────────────
// §C3 shows an unusable entry GREYED WITH ITS REASON rather than hiding it.
//
// ⚠ THE PEAK PER ROW, NOT A LUMINANCE BAND. The first version counted pixels
// between two thresholds and reported 824 "dim" ones in a picture where nothing
// was unavailable — bright text is ANTI-ALIASED, so its edges sweep the whole
// range down to the background and land in any band you pick. The control failed
// to fail, which is the only reason it was caught.
//
// A row's BRIGHTEST pixel is the colour it was drawn in: ~224 for available
// (0xE0E0E6), ~142 for greyed (0x8A8A96). AA can only ever pull a pixel darker,
// so the peak is exactly the discriminator that survives it — the same shape
// argument as counting button bars by height rather than by lighter pixels.
if (wantSwatches) {
    const peaks = rows.map((r) => r.textPeak);
    const bright = peaks.filter((p) => p > 190).length;
    const dimmed = peaks.filter((p) => p > 100 && p <= 190).length;
    check(bright >= 5, `available entries are drawn bright (${bright} rows, peaks ${peaks})`);
    // ⚠ AND SOME ARE DIM. A list where nothing is dim has HIDDEN the unavailable
    // entries instead of showing them — the exact failure §C3 names, because the
    // author then thinks the thing is missing.
    check(dimmed >= 3, `unavailable entries are drawn DIM, not hidden (${dimmed} rows)`);
}

// ── the control: the panel did not eat the canvas ────────────────
let sky = 0, total = 0;
for (let y = 0; y < img.h; y += 7) {
    for (let x = 0; x < img.w; x += 7) { total++; if (lum(x, y) >= DARK) sky++; }
}
const skyFrac = sky / total;
check(skyFrac > 0.5,
      `most of the frame is still world, not panel (${(skyFrac * 100).toFixed(0)}% light)`);

console.log(fail === 0 ? 'B1.3 PASS — the panel is in the client\'s picture'
                       : `B1.3 FAIL — ${fail} check(s)`);
process.exit(fail === 0 ? 0 : 1);
