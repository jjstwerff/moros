#!/usr/bin/env python3
# Copyright (c) 2026 Jurjen Stellingwerff
# SPDX-License-Identifier: LGPL-3.0-or-later
#
# PLAN 24 `H1` — WHICH HEADINGS EXIST ON THIS LATTICE, AND WHAT DOES EACH COST?
#
#   python3 probe/headings/enumerate.py     (or `make probe-headings`)
#
# ⚠ THIS MEASURES THE LATTICE. IT IS NOT AN ALGORITHM THE EDITOR USES, and the
# ground rule is why that distinction is drawn in the first line: the resulting
# TABLE belongs in a library beside `hex_form::head_step`, never here.
#
# The question it answers is exact and has no floats in it. Degrees are printed
# for a reader; every decision below is integer.
from math import gcd, atan2, degrees, sqrt
from collections import deque

# The six edge vectors, in DOUBLED lattice coordinates, derived from
# `hex_field::corner_k/corner_m` — corner i of a cell, and edge i joins corner i
# to corner i+1. Nothing here is chosen; it is read off the library.
CORNERS = [(0, 2), (-1, 1), (-1, -1), (0, -2), (1, -1), (1, 1)]
EDGES = [(CORNERS[(i + 1) % 6][0] - CORNERS[i][0],
          CORNERS[(i + 1) % 6][1] - CORNERS[i][1]) for i in range(6)]


def reach(limit_k, limit_m):
    """Fewest edge vectors summing to each (k, m). A wall IS a chain of edges, so
    this is 'how long must a wall be to point that way' — the whole finding."""
    best = {(0, 0): 0}
    q = deque([(0, 0)])
    while q:
        k, m = q.popleft()
        for dk, dm in EDGES:
            n = (k + dk, m + dm)
            if abs(n[0]) > limit_k or abs(n[1]) > limit_m:
                continue
            if n not in best:
                best[n] = best[(k, m)] + 1
                q.append(n)
    return best


def directions(best, max_edges, quadrant=True):
    """Primitive directions reachable within max_edges — the first quadrant, or the
    whole circle.

    The full circle is COUNTED, never extrapolated from the quadrant. The first
    version multiplied a quadrant count by four with a correction for the shared
    ends, and it reported FOUR directions for a one-edge run when the six edge
    vectors are right there in `EDGES`. A count that disagrees with the input it
    was derived from is the cheapest kind of wrong number to catch, and it was
    still wrong once."""
    out = {}
    for (k, m), n in best.items():
        if (k, m) == (0, 0) or n > max_edges:
            continue
        if quadrant and (k < 0 or m < 0):
            continue
        g = gcd(abs(k), abs(m))
        p = (k // g, m // g)
        a = degrees(atan2(m, k * sqrt(3))) % 360.0
        if p not in out or n < out[p][0]:
            out[p] = (n, a)
    return sorted(out.items(), key=lambda t: t[1][1])


def main():
    print("edge vectors, doubled coordinates:", EDGES)
    best = reach(8, 16)
    for lim in (1, 2, 3, 4, 5):
        rows = directions(best, lim)
        full = len(directions(best, lim, quadrant=False))
        print(f"\na run of at most {lim} edge(s) can point {full:3d} ways "
              f"({len(rows)} in the first quadrant)")
        prev = None
        for p, (n, a) in rows:
            gap = "" if prev is None else f"   gap {a - prev:6.3f}"
            print(f"   {str(p):7s} {n} edge(s)  {a:7.3f} deg{gap}")
            prev = a


if __name__ == "__main__":
    main()
