# Put `edges_around`'s predicate pair into the state asked for — plan 21 `R5b`.
#   python3 wire.py <walk.loft> wired|bytes
# ⚠ Idempotent, and it REFUSES when neither form is present rather than writing
# something plausible: a probe that silently measures the wrong build is worse than
# one that stops.
import io, sys

p, want = sys.argv[1], sys.argv[2]
s = io.open(p, encoding='utf-8').read()
wired = ('        stops = wall_stops_walk_at(wld, q, r, mats[si]);\n'
         '        if view { stops = wall_stops_view_at(wld, q, r, mats[si]); }')
bytes_ = ('        stops = wall_stops_walk(mats[si]);\n'
          '        if view { stops = wall_stops_view(mats[si]); }')
need, have = (wired, bytes_) if want == 'wired' else (bytes_, wired)
if s.count(need) == 1:
    sys.exit(0)                     # already in the state asked for
if s.count(have) != 1:
    sys.exit('neither predicate form found in ' + p)
io.open(p, 'w', encoding='utf-8').write(s.replace(have, need))
