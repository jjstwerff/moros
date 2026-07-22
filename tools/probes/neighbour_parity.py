#!/usr/bin/env python3
"""Neighbour-parity probe for moros_render.loft (loft ade530c2^).

Transcribed VERBATIM from the recovered source:

    pub HEX_WIDTH = 1.7320508;
    pub HEX_ROW_HEIGHT = 1.5;

    pub fn hex_to_world(q, r, height) -> Vec3 {
      x = q as float * HEX_WIDTH + (r % 2) as float * (HEX_WIDTH / 2.0);
      y = height as float * HEIGHT_SCALE;
      z = r as float * HEX_ROW_HEIGHT;
      vec3(x, y, z)
    }

    fn neighbour_dq(dir) { if dir == 1 || dir == 2 { return 1; }
                           if dir == 4 || dir == 5 { return -1; } 0 }
    fn neighbour_dr(dir) { if dir == 0 || dir == 5 { return -1; }
                           if dir == 3 || dir == 2 { return 1; } 0 }

The height/y axis is irrelevant to adjacency and is dropped.

INVARIANT: a neighbour is exactly ONE hex step away.  With circumradius 1 the
step is sqrt(3) for every one of the six directions -- so every (q, r, dir)
must give |centre(q,r) - centre(neighbour)| == sqrt(3).

NEGATIVE CONTROL: the same probe is run against a parity-aware odd-r table.
If the probe cannot pass that one, it is measuring something other than what
it claims, and its verdict on the real table is worthless.
"""
import math

HEX_WIDTH = 1.7320508
HEX_ROW_HEIGHT = 1.5
STEP = HEX_WIDTH          # one hex step, for circumradius 1
TOL = 1e-6                # transcribed sqrt(3) is truncated, so compare loosely


def centre(q, r):
    x = q * HEX_WIDTH + (r % 2) * (HEX_WIDTH / 2.0)
    z = r * HEX_ROW_HEIGHT
    return x, z


# --- the code under test, verbatim -------------------------------------
def neighbour_dq(d):
    if d == 1 or d == 2:
        return 1
    if d == 4 or d == 5:
        return -1
    return 0


def neighbour_dr(d):
    if d == 0 or d == 5:
        return -1
    if d == 3 or d == 2:
        return 1
    return 0


# --- the negative control: a correct odd-r offset table ----------------
# Diagonal q-offsets depend on row parity; E/W do not.  This is the shape
# hex_field's nb_q(q, r, d) has, and the shape the code under test cannot
# express because it never receives r.
def correct_neighbour(q, r, d):
    odd = r & 1
    if d == 0:                      # E
        return q + 1, r
    if d == 1:                      # W
        return q - 1, r
    if d == 2:                      # NE
        return (q + 1 if odd else q), r - 1
    if d == 3:                      # NW
        return (q if odd else q - 1), r - 1
    if d == 4:                      # SE
        return (q + 1 if odd else q), r + 1
    return (q if odd else q - 1), r + 1     # SW


def bearing(dx, dz):
    """Name the direction of a step, for reporting.  -z is north."""
    if abs(dz) < 1e-9:
        return "E " if dx > 0 else "W "
    ns = "N" if dz < 0 else "S"
    if abs(dx) < 1e-9:
        return ns + "?"
    return ns + ("E" if dx > 0 else "W")


def run(label, neighbour_fn):
    print(f"\n=== {label} ===")
    bad = 0
    for r in (4, 5):                       # one even row, one odd row
        parity = "even" if r % 2 == 0 else "odd "
        print(f"  r = {r} ({parity})")
        reached = []
        for d in range(6):
            nq, nr = neighbour_fn(10, r, d)
            x0, z0 = centre(10, r)
            x1, z1 = centre(nq, nr)
            dx, dz = x1 - x0, z1 - z0
            dist = math.hypot(dx, dz)
            ok = abs(dist - STEP) < TOL
            if not ok:
                bad += 1
            steps = dist / STEP
            note = "" if ok else f"   <-- {steps:.3f} hex steps away, NOT adjacent"
            print(f"    dir {d}: -> ({nq:3d},{nr:3d})  dist {dist:.4f}  "
                  f"{bearing(dx, dz)}  {'ok ' if ok else 'BAD'}{note}")
            if ok:
                reached.append(bearing(dx, dz).strip())
        missing = {"E", "W", "NE", "NW", "SE", "SW"} - set(reached)
        if missing:
            print(f"    unreachable neighbours: {sorted(missing)}")
    return bad


under_test = run("CODE UNDER TEST - moros_render neighbour_dq/dr (parity-blind)",
                 lambda q, r, d: (q + neighbour_dq(d), r + neighbour_dr(d)))

control = run("NEGATIVE CONTROL - parity-aware odd-r table", correct_neighbour)

print(f"\ncode under test : {under_test} failing (q,r,dir) cases")
print(f"negative control: {control} failing cases  "
      f"({'probe can tell the two apart' if control == 0 and under_test > 0 else 'PROBE IS BLIND - discard its verdict'})")


# ---------------------------------------------------------------------
# The distance invariant above is NECESSARY BUT NOT SUFFICIENT.  A step
# can be exactly one hex long and still point somewhere else than it did
# on the previous row.  The stronger invariant: direction d must name the
# SAME compass direction on every row.
# ---------------------------------------------------------------------
def identity_check(label, neighbour_fn):
    print(f"\n=== IDENTITY: does dir d mean the same thing on every row? ({label}) ===")
    unstable = 0
    for d in range(6):
        seen = {}
        for r in (4, 5):
            nq, nr = neighbour_fn(10, r, d)
            x0, z0 = centre(10, r)
            x1, z1 = centre(nq, nr)
            dist = math.hypot(x1 - x0, z1 - z0)
            b = bearing(x1 - x0, z1 - z0) if abs(dist - STEP) < TOL else "BAD"
            seen["even" if r % 2 == 0 else "odd"] = b.strip()
        stable = seen["even"] == seen["odd"]
        if not stable:
            unstable += 1
        print(f"    dir {d}: even row -> {seen['even']:<3}  odd row -> {seen['odd']:<3}  "
              f"{'stable' if stable else 'UNSTABLE - same index, different neighbour'}")
    return unstable


u1 = identity_check("code under test", lambda q, r, d: (q + neighbour_dq(d), r + neighbour_dr(d)))
u2 = identity_check("negative control", correct_neighbour)
print(f"\ncode under test : {u1}/6 directions change meaning between rows")
print(f"negative control: {u2}/6")
