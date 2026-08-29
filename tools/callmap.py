# -*- coding: utf-8 -*-
import re, subprocess, glob, os, collections

libs = ["hex_draw","hex_edge","hex_field","hex_form","hex_grid","hex_place",
        "hex_shape","hex_way","hex_body","hex_recover","hex_roof","hex_fit","hex_terrain"]

# our own sources (production only: lib/*/src and src)
srcs = sorted(glob.glob('lib/*/src/*.loft')) + sorted(glob.glob('src/*.loft'))
text = {}
for f in srcs:
    text[f] = open(f, encoding='utf-8', errors='replace').read()
blob = "\n".join(text.values())

print(f"{'library':<13} {'public':>6} {'used':>5} {'sites':>6}   unused-but-notable")
print("-" * 78)
for lib in libs:
    cand = glob.glob(os.path.expanduser(f'~/.loft/registry/{lib}-*/src/*.loft'))
    if not cand:
        continue
    # newest version dir
    vers = sorted(set(os.path.basename(os.path.dirname(os.path.dirname(c))) for c in cand))
    newest = vers[-1]
    names = set()
    for c in cand:
        if os.path.dirname(os.path.dirname(c)).endswith(newest):
            for m in re.finditer(r'^pub fn ([a-z_0-9]+)', open(c, encoding='utf-8', errors='replace').read(), re.M):
                names.add(m.group(1))
    used, sites = set(), 0
    for n in sorted(names):
        # qualified OR bare, as a call
        pat = re.compile(r'(?<![A-Za-z0-9_])(?:' + lib + r'::)?' + re.escape(n) + r'\s*\(')
        hits = 0
        for f, t in text.items():
            # don't count the library's own name inside a comment-only line
            for line in t.split('\n'):
                ls = line.lstrip()
                if ls.startswith('//'):
                    continue
                hits += len(pat.findall(line))
        if hits:
            used.add(n); sites += hits
    unused = sorted(names - used)
    note = ", ".join(unused[:4]) + (" …" if len(unused) > 4 else "")
    print(f"{lib:<13} {len(names):>6} {len(used):>5} {sites:>6}   {note}")
