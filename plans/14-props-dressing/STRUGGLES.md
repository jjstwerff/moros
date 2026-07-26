# 14 — what fought back

## The dressing layer designed twice, because the sibling was not read first

A separate layer type for set dressing was designed as *the same eight bytes as terrain,
reinterpreted* — height becomes placement, the wall bytes become sub-hex offset and scale.
It left chunks, elision, the window and the CRC untouched, and the write-up called that out
as the virtue.

`../crawler` had already built it, gated it across nine phases, and reached a different
answer on every axis that mattered: a level is **a sheet, not a slot** (bucketed records,
several props per hex); terrain is dense but dressing is sparse, so a 1024-cell array
spends 8 KB to place three lamps; and placement is mostly **derived** rather than authored —
*a village furnishes itself* from the architecture plus a seed, storing nothing.

**The lesson is not "read the sibling first", though that is true.** It is that the
uniform-cell model *felt* like one mechanism serving two cases, and the feeling was the
tell. It was one mechanism serving terrain and disfiguring dressing — over-unification in
its textbook form, presenting as elegance, invisible from the desk, and caught only by a
case that already existed elsewhere. The design protocol names this exactly: attack the
cleanest claim, because the cleanest claim is where the error hides.

