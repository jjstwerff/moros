#!/usr/bin/env python3
# READ A `--html` TRAP'S BACKTRACE WITH NO NAME SECTION — plan 22, probe 5.
#
#   python3 probe/t5/wasmframes.py <page.html|module.wasm> [funcidx[:offset] …]
#   grep -o 'wasm-function\[[0-9]*\]:0x[0-9a-f]*' probe/t5/out/<tag>.raw \
#     | sed 's/wasm-function\[//; s/\]:/:/' \
#     | xargs python3 probe/t5/wasmframes.py src/.loft/editor_client.html
#
# ⚠ **`wasmname.py` IS THE ONE THAT CANNOT ANSWER, AND THIS IS WHY IT EXISTS.** That
# tool resolves a frame against the module's **name section**, and an `--html` build
# ships none ([loft#954](https://github.com/loft-lang/loft/issues/954)) — 58 named
# imports and **0** named module functions. So it correctly reports that it cannot
# say, and the ten frames stay ten numbers.
#
# ⚠ **BUT THE FRAME CARRIES A SECOND COORDINATE AND NOBODY HAD USED IT.** Chrome
# prints `wasm-function[1073]:0x56ba1c`, and that offset is a **module byte offset** —
# so the code section alone locates the function *and* the trapping instruction inside
# it, with no names involved. The index is then a cross-check rather than the only
# evidence: if `idx - imports` and the offset disagree, one of them is being read
# wrong, and this says so instead of guessing.
#
# ⚠ **AND THE FIRST THING IT SAID WAS THE ANSWER.** `wasm-function[1073]` is a body of
# **three bytes** — no locals, `unreachable`, `end` — and its caller is `call 1073;
# unreachable`. So the trap is a compiler-emitted ABORT STUB reached through a panic
# chain, not a fault inside a working function, and eight of the ten frames are the
# panic machinery rather than anything the program was doing. What matters is the
# deepest non-panic frame, which this makes obvious by printing each body's size.
import base64
import re
import sys


def uleb(b, i):
    """Read one LEB128 unsigned int at `i`; return (value, next index)."""
    v = 0
    s = 0
    while True:
        c = b[i]
        i += 1
        v |= (c & 0x7F) << s
        if not c & 0x80:
            return v, i
        s += 7


def wasm_of(path):
    """The engine bytes out of an `--html` page, or the file itself if it is wasm."""
    raw = open(path, 'rb').read()
    if raw[:4] == b'\0asm':
        return raw
    m = re.search(rb'wasmB64\s*=\s*"([A-Za-z0-9+/=]+)"', raw)
    if not m:
        sys.exit(f'{path}: no wasmB64 blob and not a wasm module')
    return base64.b64decode(m.group(1))


def sections(w):
    """Yield (id, payload start in the MODULE, payload) for every section."""
    i = 8
    while i < len(w):
        sid = w[i]
        n, j = uleb(w, i + 1)
        yield sid, j, w[j:j + n]
        i = j + n


VT = {0x7f: 'i32', 0x7e: 'i64', 0x7d: 'f32', 0x7c: 'f64',
      0x70: 'funcref', 0x6f: 'externref'}
# The handful of opcodes worth naming when one is sitting under a trap. Anything
# else is printed as a number rather than guessed at.
OP = {0x00: 'unreachable', 0x01: 'nop', 0x0b: 'end', 0x0f: 'return',
      0x10: 'call', 0x11: 'call_indirect', 0x20: 'local.get', 0x21: 'local.set',
      0x28: 'i32.load', 0x36: 'i32.store', 0x41: 'i32.const'}


def parse(w):
    types, imports, funcs, code = [], [], [], []
    for sid, base, p in sections(w):
        if sid == 1:
            cnt, i = uleb(p, 0)
            for _ in range(cnt):
                i += 1                      # 0x60, the func form
                np, i = uleb(p, i)
                par = list(p[i:i + np]); i += np
                nr, i = uleb(p, i)
                res = list(p[i:i + nr]); i += nr
                types.append((par, res))
        elif sid == 2:
            cnt, i = uleb(p, 0)
            for _ in range(cnt):
                n, i = uleb(p, i); mod = p[i:i + n].decode(); i += n
                n, i = uleb(p, i); nm = p[i:i + n].decode(); i += n
                kind = p[i]; i += 1
                if kind == 0:
                    imports.append(f'{mod}.{nm}')
                    _, i = uleb(p, i)
                elif kind == 1:
                    i += 1
                    lim = p[i]; i += 1
                    _, i = uleb(p, i)
                    if lim:
                        _, i = uleb(p, i)
                elif kind == 2:
                    lim = p[i]; i += 1
                    _, i = uleb(p, i)
                    if lim:
                        _, i = uleb(p, i)
                else:
                    i += 2
        elif sid == 3:
            cnt, i = uleb(p, 0)
            for _ in range(cnt):
                t, i = uleb(p, i)
                funcs.append(t)
        elif sid == 10:
            cnt, i = uleb(p, 0)
            for _ in range(cnt):
                sz, j = uleb(p, i)
                code.append((base + j, sz))
                i = j + sz
    return types, imports, funcs, code


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: wasmframes.py <page.html|module.wasm> [idx[:offset] …]')
    w = wasm_of(sys.argv[1])
    types, imports, funcs, code = parse(w)
    nimp = len(imports)
    print(f'{sys.argv[1]}: {len(w)} bytes, {nimp} imported function(s), '
          f'{len(funcs)} defined, {len(code)} code bodies')

    def sig(defidx):
        par, res = types[funcs[defidx]]
        return ('(' + ', '.join(VT.get(x, hex(x)) for x in par) + ') -> '
                + (', '.join(VT.get(x, hex(x)) for x in res) or '()'))

    def holder(off):
        for k, (s, n) in enumerate(code):
            if s <= off < s + n:
                return k, s, n
        return None, None, None

    for a in sys.argv[2:]:
        idx, _, offs = a.partition(':')
        idx = int(idx)
        if idx < nimp:
            print(f'wasm-function[{idx}] = (import) {imports[idx]}')
            continue
        d = idx - nimp
        line = f'wasm-function[{idx}] = defined#{d} {sig(d)}'
        if offs:
            off = int(offs, 0)
            k, s, n = holder(off)
            agree = 'index and offset AGREE' if k == d else \
                    f'⚠ DISAGREE — the offset is inside defined#{k}'
            op = w[off]
            line += (f'\n    body 0x{s:x} + {n} byte(s), trap at +{off - s}, '
                     f'opcode 0x{op:02x} {OP.get(op, "")} — {agree}')
            if n <= 8:
                line += ('\n    ⚠ the whole body is '
                         + ' '.join(f'{x:02x}' for x in w[s:s + n])
                         + ' — a stub, not a function that was doing work')
        print(line)


main()
