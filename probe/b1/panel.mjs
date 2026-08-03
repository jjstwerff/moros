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
if (!path) { console.error('usage: panel.mjs <png>'); process.exit(2); }

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
// ⚠ COUNT BARS, NOT LIGHTER PIXELS. The first version counted runs of
// "lighter than the background" and reported SEVEN — the seventh being the 2px
// separator hairline above the list, which is also lighter than the background.
// The fix is not a tuned threshold between 44 and 52; it is that a button is a
// 32px BAR and a hairline is not, so the run length is what tells them apart.
// A discriminator that comes from the shape survives a restyle; one that comes
// from a luminance gap does not.
const BTN = 42;
const MIN_BAR = 8;
const runs = [];
let run = 0;
for (let y = 0; y < Math.floor(img.h * 0.4); y++) {
    const isBtn = lum(60, y) > BTN && lum(60, y) < DARK;
    if (isBtn) { run++; } else { if (run > 0) runs.push(run); run = 0; }
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
