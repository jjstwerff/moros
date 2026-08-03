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

// ── the material swatches (B3.3) ─────────────────────────────────
// §C4: each swatch is one hex tile rendered with the WORLD'S OWN shader and
// light, so it IS the material rather than a claim about it. What a picture can
// check is that they are THERE and that they are DIFFERENT — a renderer that
// failed would leave the list background, and one that ignored the material
// would leave nine identical blobs.
//
// ⚠ AND BOTH HALVES ARE NEEDED. Nine swatches were "rendered" and the picture
// had none: the hexagon was built in the world's XZ plane while clip space is
// XY, so it collapsed to a line. The client's own count said 9. A count of
// draw calls is not a count of pixels.
const LIST_X1 = 232, SW_W = 22, SW_H = 16;
const ROW_H = 20;
let listTop = 0;
for (let y = 0; y < img.h; y++) {
    // the list well is the darkest band inside the strip, below the buttons
    if (y > img.h * 0.35 && lum(20, y) < 28) { listTop = y; break; }
}
const swatches = [];
for (let i = 0; i < 9; i++) {
    const y0 = listTop + i * ROW_H + 6;
    const x0 = LIST_X1 - SW_W;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y0 + SW_H - 6 && y < img.h; y++) {
        for (let x = x0 + 4; x < x0 + SW_W - 4; x++) {
            const [pr, pg, pb] = px(x, y);
            r += pr; g += pg; b += pb; n++;
        }
    }
    if (n > 0) swatches.push([r / n, g / n, b / n]);
}
const litSwatches = swatches.filter(([r, g, b]) => (r + g + b) / 3 > 28);
if (wantSwatches) {
check(litSwatches.length >= 8,
      `the material swatches are drawn (${litSwatches.length} of ${swatches.length} above the list background)`);

// ⚠ AND THEY DIFFER. Nine identical blobs would pass the row above perfectly and
// would mean the shader drew one colour for every material.
const key = ([r, g, b]) => `${Math.round(r / 12)},${Math.round(g / 12)},${Math.round(b / 12)}`;
const distinct = new Set(litSwatches.map(key)).size;
check(distinct >= 6, `the swatches are different colours (${distinct} distinct of ${litSwatches.length})`);
} else if (litSwatches.length > 0) {
  // Not an error, but worth saying: a picture that was not asked about swatches
  // and has them means the two stages have drifted apart.
  console.log(`  note  ${litSwatches.length} swatches present but not checked (no --swatches)`);
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
