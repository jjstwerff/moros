// B1.1's instrument — reads a PNG and reports INK, split left/right.
//
// ⚠ THE PICTURE IS NOT THE MEASUREMENT. Looking at a screenshot and saying "yes
// that says MOROS" is exactly the reading-by-eye this tree has written down as a
// blind instrument. What the gate needs is a NUMBER, and one that can tell three
// different failures apart:
//
//   ink_left == 0                 nothing drew            -> the bridge is dead
//   ink_right > 0                 something drew EVERYWHERE -> a fill, not text
//   ink_left > 0 && right == 0    text, where it was asked
//
// The right half is the control and it lives in the same frame as the subject,
// so a backend that cleared to grey or splatted the buffer cannot pass by
// accident. "It drew something" is not the claim.
//
// Decodes 8-bit RGB/RGBA non-interlaced PNG, which is what `graphics::save_png`
// and Chrome's `Page.captureScreenshot` both produce. No dependency: a decoder
// this small is less risk than a package, and node ships the zlib it needs.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function decodePng(path) {
    const buf = readFileSync(path);
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: not a PNG`);
    let off = 8, w = 0, h = 0, depth = 0, colour = 0, interlace = 0;
    const idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.toString('ascii', off + 4, off + 8);
        const data = buf.subarray(off + 8, off + 8 + len);
        if (type === 'IHDR') {
            w = data.readUInt32BE(0); h = data.readUInt32BE(4);
            depth = data[8]; colour = data[9]; interlace = data[12];
        } else if (type === 'IDAT') idat.push(data);
        else if (type === 'IEND') break;
        off += 12 + len;
    }
    if (depth !== 8) throw new Error(`${path}: bit depth ${depth}, only 8 supported`);
    if (interlace !== 0) throw new Error(`${path}: interlaced, not supported`);
    const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colour];
    if (!ch) throw new Error(`${path}: colour type ${colour} unsupported`);

    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * ch;
    const out = Buffer.alloc(h * stride);
    // Undo the per-scanline filters. Getting this wrong shows up as diagonal
    // smear, which is visible — unlike a wrong threshold, which is not.
    for (let y = 0; y < h; y++) {
        const ft = raw[y * (stride + 1)];
        const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        for (let x = 0; x < stride; x++) {
            const a = x >= ch ? out[y * stride + x - ch] : 0;
            const b = y > 0 ? out[(y - 1) * stride + x] : 0;
            const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
            let v = line[x];
            if (ft === 1) v += a;
            else if (ft === 2) v += b;
            else if (ft === 3) v += (a + b) >> 1;
            else if (ft === 4) {
                const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
                v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
            }
            out[y * stride + x] = v & 0xff;
        }
    }
    return { w, h, ch, px: out };
}

// A pixel is INK if it is visibly brighter than black, or (for an image with
// alpha) visibly opaque. Both forms occur: the CPU canvas is white-on-
// transparent, the GL shot is white-on-black.
export function ink(img, x0, x1, threshold = 32) {
    let n = 0;
    for (let y = 0; y < img.h; y++) {
        for (let x = x0; x < x1; x++) {
            const i = (y * img.w + x) * img.ch;
            const a = img.ch === 4 || img.ch === 2 ? img.px[i + img.ch - 1] : 255;
            if (a < threshold) continue;
            const lum = img.ch >= 3 ? Math.max(img.px[i], img.px[i + 1], img.px[i + 2]) : img.px[i];
            if (lum >= threshold) n++;
        }
    }
    return n;
}

export function report(path, splitAt) {
    const img = decodePng(path);
    const split = splitAt ?? Math.floor(img.w / 2);
    const left = ink(img, 0, split);
    const right = ink(img, split, img.w);
    return { path, w: img.w, h: img.h, left, right };
}

if (process.argv[1]?.endsWith('shot.mjs')) {
    const path = process.argv[2];
    if (!path) { console.error('usage: shot.mjs <png> [splitAt]'); process.exit(2); }
    const r = report(path, process.argv[3] ? +process.argv[3] : undefined);
    const ok = r.left > 0 && r.right === 0;
    console.log(`${r.path}  ${r.w}x${r.h}  ink left=${r.left} right=${r.right}  ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) {
        if (r.left === 0) console.log('  left is empty — nothing drew where the text was asked for');
        if (r.right > 0) console.log('  right is inked — something drew where NOTHING was asked for');
    }
    process.exit(ok ? 0 : 1);
}
