#!/usr/bin/env python3
# NAME THE FRAMES IN A `--html` TRAP — plan 22, probe 5.
#
#   python3 probe/t5/wasmname.py <page.html> [funcidx …]
#   grep -o 'wasm-function\[[0-9]*\]' probe/t5/out/origsrc.raw | tr -dc '0-9\n' \
#     | xargs python3 probe/t5/wasmname.py src/.loft/editor_client.html
#
# ⚠ THE STACK WAS IN THE TRANSCRIPT THE WHOLE TIME AND NOBODY READ IT. Chrome hands
# `RuntimeError: unreachable` a full wasm backtrace — ten frames of
# `wasm-function[1073]` — and `press.mjs` records it verbatim. Bisecting the client's
# source to find the trap is guessing at what those ten numbers already say, so this
# resolves them against the module's own name section.
#
# A `--html` page holds its engine as one base64 string (`wasmB64="…"`). The name
# section is a custom section called `name`; subsection 1 maps a FUNCTION INDEX to a
# name, in the same index space the browser prints — imports first, then the module's
# own. So an index below the import count is a host call, and this says so.
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
    """Yield (id, payload) for every top-level section."""
    i = 8
    while i < len(w):
        sid = w[i]
        n, i = uleb(w, i + 1)
        yield sid, w[i:i + n]
        i += n


def imports_and_names(w):
    """(import count, {func index: name}) — the two things a frame number needs."""
    nimp = 0
    names = {}
    for sid, p in sections(w):
        if sid == 2:  # imports — only the FUNCTION ones take an index
            cnt, i = uleb(p, 0)
            for _ in range(cnt):
                n, i = uleb(p, i)
                mod = p[i:i + n].decode('utf8', 'replace')
                i += n
                n, i = uleb(p, i)
                nm = p[i:i + n].decode('utf8', 'replace')
                i += n
                kind = p[i]
                i += 1
                if kind == 0:
                    names.setdefault(nimp, f'(import) {mod}.{nm}')
                    nimp += 1
                    _, i = uleb(p, i)
                elif kind == 1:  # table
                    i += 1
                    lim = p[i]
                    i += 1
                    _, i = uleb(p, i)
                    if lim:
                        _, i = uleb(p, i)
                elif kind == 2:  # memory
                    lim = p[i]
                    i += 1
                    _, i = uleb(p, i)
                    if lim:
                        _, i = uleb(p, i)
                else:  # global
                    i += 2
        elif sid == 0:  # custom
            n, i = uleb(p, 0)
            if p[i:i + n] != b'name':
                continue
            i += n
            while i < len(p):
                sub = p[i]
                sz, i = uleb(p, i + 1)
                if sub == 1:
                    cnt, j = uleb(p, i)
                    for _ in range(cnt):
                        idx, j = uleb(p, j)
                        ln, j = uleb(p, j)
                        names[idx] = p[j:j + ln].decode('utf8', 'replace')
                        j += ln
                i += sz
    return nimp, names


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__ or 'usage: wasmname.py <page.html> [funcidx …]')
    w = wasm_of(sys.argv[1])
    nimp, names = imports_and_names(w)
    own = sum(1 for k in names if k >= nimp)
    print(f'{sys.argv[1]}: {len(w)} bytes, {nimp} imported function(s), '
          f'{own} named module function(s)')
    if own == 0:
        print('⚠ NO NAME SECTION — the build is stripped, so an index cannot be named.')
    for a in sys.argv[2:]:
        idx = int(a)
        print(f'  wasm-function[{idx}] = {names.get(idx, "?? (unnamed)")}')


main()
