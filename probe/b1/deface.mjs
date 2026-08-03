// THE CONTROL FOR `panel.mjs`'s CATALOGUE ROWS — paint over one row's image and
// hand the result back to the reader, which must refuse it.
//
// ⚠ A READER THAT PASSES EVERYTHING AND A READER THAT WORKS LOOK IDENTICAL FROM
// ONE GREEN RUN, and this tree has paid for that repeatedly: a luminance band
// that counted 824 "dim" pixels where nothing was dim, a sample column that read
// six buttons as thirteen, and `[].every(…)` reporting `ok` on a picture with no
// panel in it. So before `B5.2`'s claims are believed, the same reader is fed the
// two pictures those claims are about — and both of them really happened:
//
//   blank   the part row with no image at all — the failure a thumbnail HAS
//   black   the part row with a black hexagon — what `B5.1` actually shipped,
//           because `render_swatches` indexed `surface_at(row)` and
//           `surface_at(9)` is the `?` sentinel with colour (0,0,0)
//
// The second is the interesting one: it is not blank. It has as much ink as a
// real swatch. Only a comparison against the row it sits in can call it.
//
// ⚠ THE ROW GEOMETRY IS DUPLICATED FROM `panel.mjs` on purpose. A control that
// imported the reader's own idea of where a row is could not catch a reader
// looking in the wrong place — it would deface exactly the pixels the reader
// went on to inspect, whatever they were.
import { decodePng } from './shot.mjs';
import zlib from 'zlib';
import fs from 'fs';

const [, , src, out, what] = process.argv;
if (!src || !out || !what) {
    console.error('usage: deface.mjs <in.png> <out.png> blank|black');
    process.exit(2);
}

const img = decodePng(src);
const at = (x, y) => (y * img.w + x) * img.ch;
const lum = (x, y) => { const i = at(x, y); return (img.px[i] + img.px[i + 1] + img.px[i + 2]) / 3; };

const SW_W = 22, SW_H = 16, ROW_H = 20, LIST_X = 8, LIST_W = 224;
const IMG_X = LIST_X + LIST_W - SW_W - 4;
let listTop = 0;
for (let y = 0; y < img.h; y++) {
    if (y > img.h * 0.35 && lum(20, y) < 28) { listTop = y; break; }
}
if (!listTop) { console.error('deface: no list well found — nothing to control against'); process.exit(2); }

// The LAST labelled row, which is where a part lands: `catalogue_wire` sends the
// materials first and the parts after them.
let last = -1;
for (let i = 0; listTop + (i + 1) * ROW_H < img.h; i++) {
    let peak = 0;
    for (let y = listTop + i * ROW_H; y < listTop + (i + 1) * ROW_H; y++)
        for (let x = LIST_X; x < IMG_X - 2; x++) peak = Math.max(peak, lum(x, y));
    if (peak < 100) break;
    last = i;
}
if (last < 0) { console.error('deface: no labelled rows — nothing to control against'); process.exit(2); }

// `blank` is the list well's own colour, read from the picture: a row whose
// image failed to render shows exactly this, so the control is the real failure
// rather than an approximation of it.
const wellIdx = at(LIST_X + 4, listTop + 4);
const paint = what === 'black'
    ? [5, 5, 6]
    : [img.px[wellIdx], img.px[wellIdx + 1], img.px[wellIdx + 2]];

const y0 = listTop + last * ROW_H + 2;
for (let y = y0; y < y0 + SW_H && y < img.h; y++) {
    for (let x = IMG_X; x < IMG_X + SW_W; x++) {
        const i = at(x, y);
        img.px[i] = paint[0]; img.px[i + 1] = paint[1]; img.px[i + 2] = paint[2];
    }
}

const rows = [];
for (let y = 0; y < img.h; y++) {
    const line = Buffer.alloc(1 + img.w * 3);
    for (let x = 0; x < img.w; x++) {
        const i = at(x, y);
        line[1 + x * 3] = img.px[i];
        line[2 + x * 3] = img.px[i + 1];
        line[3 + x * 3] = img.px[i + 2];
    }
    rows.push(line);
}
function crc32(buf) {
    let c, crc = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
        c = (crc ^ buf[n]) & 0xff;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crc = (crc >>> 8) ^ c;
    }
    return (crc ^ 0xffffffff) >>> 0;
}
const chunk = (t, d) => {
    const c = Buffer.concat([Buffer.from(t), d]);
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(c));
    return Buffer.concat([len, c, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(out, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
]));
console.log(`  defaced row ${last}'s image as ${what} → ${out}`);
