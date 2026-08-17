#!/usr/bin/env python3
# MAKE A `--html` PANIC SAY WHAT IT IS — plan 22, probe 5.
#
#   python3 probe/t5/wasmpanic.py <page.html> <defined-func-idx> <out.html>
#   python3 probe/t5/wasmpanic.py _site/index.html 1113 probe/t5/out/patched.html
#   node probe/t5/console.mjs "file://$PWD/probe/t5/out/patched.html" 45000
#
# ⚠ **THE MESSAGE WAS IN THE MODULE THE WHOLE TIME AND THE BROWSER NEVER SAW IT.** An
# `--html` build panics into an abort stub — a three-byte `unreachable`, which is all
# Chrome can report — while the panic's own text sits in the data section and the page
# already imports `loft_io.loft_host_print` as `(i32 i32)`, a (ptr, len) print. So the
# diagnosis was one call away and nothing made it.
#
# This rewrites ONE function body to `local.get 0; local.get 1; call loft_host_print;
# end`, which is a HYPOTHESIS about that function's first two parameters as much as it
# is an instrument: if they are a (ptr, len) pair the page prints the panic, and if
# they are not the print is garbage — which is an answer too, and the one that stops
# you believing a guess.
#
# ⚠ **RUN IT AGAINST THE PANIC ENTRY, NOT THE ABORT STUB.** `wasmframes.py` names the
# stub (`() -> ()`, body `00 00 0b`) and the frames above it; the useful target is the
# deepest frame that still CARRIES arguments — defined#1113 in the build this was
# written against, the `(i32, i32, i32)` the raising code calls directly.
#
# ⚠ **AND WHAT IT PRINTED IS WHY PROBE 5 IS BLOCKED**: `Store offset overflow: rec=…
# fld=…` — loft's own store bounds check, firing on the browser target only, with the
# same source green on the interpreter, `--native` and `--native-wasm`. The second
# argument is NOT a length, so the print runs off the end of the string into the rest
# of the table; the first word is the answer and the rest is the instrument being
# honest about its own limits.
#
# ⚠ **THE PATCHED PAGE ALSO HAS A BETTER BACKTRACE, WHICH WAS NOT THE POINT AND IS THE
# BIGGEST WIN.** With the panic returning instead of aborting, the trap that follows is
# raised at the RAISING frame, so Chrome prints five loft frames where it used to print
# eight frames of panic machinery and two of program.
import base64
import re
import sys


def uleb(b, i):
    v = 0
    s = 0
    while True:
        c = b[i]
        i += 1
        v |= (c & 0x7F) << s
        if not c & 0x80:
            return v, i
        s += 7


def enc(v):
    """LEB128 the other way — a body's new size has to be re-emitted."""
    out = bytearray()
    while True:
        c = v & 0x7F
        v >>= 7
        if v:
            out.append(c | 0x80)
        else:
            out.append(c)
            return bytes(out)


def main():
    if len(sys.argv) != 4:
        sys.exit('usage: wasmpanic.py <page.html> <defined-func-idx> <out.html>')
    page = open(sys.argv[1], 'rb').read()
    target = int(sys.argv[2])
    m = re.search(rb'wasmB64\s*=\s*"([A-Za-z0-9+/=]+)"', page)
    if not m:
        sys.exit(f'{sys.argv[1]}: no wasmB64 blob')
    w = base64.b64decode(m.group(1))

    nimp = 0
    printidx = None
    code_span = None
    i = 8
    while i < len(w):
        sid = w[i]
        n, j = uleb(w, i + 1)
        p = w[j:j + n]
        if sid == 2:
            cnt, k = uleb(p, 0)
            for _ in range(cnt):
                ln, k = uleb(p, k); k += ln
                ln, k = uleb(p, k); nm = p[k:k + ln].decode(); k += ln
                kind = p[k]; k += 1
                if kind == 0:
                    if nm == 'loft_host_print':
                        printidx = nimp
                    nimp += 1
                    _, k = uleb(p, k)
                elif kind == 1:
                    k += 1
                    lim = p[k]; k += 1
                    _, k = uleb(p, k)
                    if lim:
                        _, k = uleb(p, k)
                elif kind == 2:
                    lim = p[k]; k += 1
                    _, k = uleb(p, k)
                    if lim:
                        _, k = uleb(p, k)
                else:
                    k += 2
        elif sid == 10:
            code_span = (i, j, n, p)
        i = j + n

    if printidx is None:
        sys.exit('this page does not import loft_io.loft_host_print — nothing to print with')
    si, sj, sn, p = code_span
    cnt, k = uleb(p, 0)
    bodies = []
    for _ in range(cnt):
        sz, j2 = uleb(p, k)
        bodies.append(p[j2:j2 + sz])
        k = j2 + sz

    print(f'loft_host_print is import #{printidx} of {nimp}; {cnt} code bodies')
    print(f'  defined#{target} was {len(bodies[target])} bytes')
    # no locals · local.get 0 · local.get 1 · call print · end
    bodies[target] = (bytes([0x00, 0x20, 0x00, 0x20, 0x01, 0x10])
                      + enc(printidx) + bytes([0x0b]))
    print(f'  now {len(bodies[target])}: '
          + ' '.join(f'{x:02x}' for x in bodies[target]))

    sec = bytearray(enc(cnt))
    for b in bodies:
        sec += enc(len(b)) + b
    mod = w[:si] + bytes([10]) + enc(len(sec)) + bytes(sec) + w[sj + sn:]
    print(f'  module {len(w)} -> {len(mod)} bytes')
    out = page[:m.start(1)] + base64.b64encode(mod) + page[m.end(1):]
    open(sys.argv[3], 'wb').write(out)
    print(f'wrote {sys.argv[3]}')


main()
