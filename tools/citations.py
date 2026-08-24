#!/usr/bin/env python3
# Copyright (c) 2026 Jurjen Stellingwerff
# SPDX-License-Identifier: LGPL-3.0-or-later
#
# citations.py — the `X` tags this tree cites, and whether they still resolve.
#
# Moros consumes a formal core it does not own: `../hexbody/ROUNDTRIP.md` defines
# `X1`..`X70` as table rows, and 100-odd sites here cite them.  A citation ROTS
# SILENTLY — the prose goes on reading correctly while the number now names
# something else — so it needs a gate rather than a habit.  Read from `../loft2`,
# where the same problem is solved for `@FR-` rule tags; see doc/claude/NOTATION.md.
#
# ⚠ THERE ARE TWO `X` NAMESPACES IN THIS TREE AND THEY OVERLAP.  `WORLD_MODEL.md`
# defines `X1`..`X5` as plan #8's OWN rows — `CW_EXTENT`, `CW_CONCURRENT`, churn
# under compaction — which have nothing to do with hexbody's `X1`..`X5`.  A checker
# that simply resolved every `X<n>` against hexbody would call all five RESOLVED **by
# coincidence**, because hexbody happens to number that far.  That is a false green
# built in on day one, and it is why this reads the local definitions first.
#
# ⚠ AND AN AMBIGUOUS TAG IS REPORTED, NOT PICKED.  A tag defined locally AND present
# upstream is a collision the tree should see; choosing one silently is the defect
# this file exists to prevent, one level up.
#
# Subcommands:
#   check          every citation resolves, and no tag is ambiguous  (exit 1 on failure)
#   list           every upstream tag and whether this tree cites it
#   sites <tag>    the doc sites citing one tag
#
# ⚠ SKIPS RATHER THAN FAILS when `../hexbody` is absent.  This is a consistency
# check, not a capability the build depends on — a clone without the sibling tree
# must not go red.  loft's own gate makes the same distinction for `python3`.
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEXBODY = os.path.join(os.path.dirname(ROOT), "hexbody")
UPSTREAM = os.path.join(HEXBODY, "ROUNDTRIP.md")
SCAN = ["doc", "plans", "probe"]

# ⚠ BOUNDARY-EXACT.  `X4` must not match inside `X47`, and `\b` does not save you —
# a digit continues the token, so the guard is an explicit "no digit follows".
CITE = re.compile(r"\bX([0-9]{1,3})(?![0-9])")
# A tag is DEFINED by a table row that OPENS with it, upstream and locally alike.
DEFN = re.compile(r"^\|\s*\*\*X([0-9]{1,3})\*\*")


def defined_in(path):
    out = {}
    try:
        with open(path, encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                m = DEFN.match(line)
                if m:
                    out.setdefault(int(m.group(1)), (path, n))
    except OSError:
        return {}
    return out


def walk_md():
    for base in SCAN:
        for dirpath, _, names in os.walk(os.path.join(ROOT, base)):
            # generated and recorded output is not a citation site
            if "/out" in dirpath or "/.out" in dirpath or "/node_modules" in dirpath:
                continue
            for nm in names:
                if nm.endswith(".md"):
                    yield os.path.join(dirpath, nm)


def local_defs():
    defs = {}
    for p in walk_md():
        for tag, where in defined_in(p).items():
            defs.setdefault(tag, where)
    return defs


def citations(local):
    """Every X citation that is NOT a local definition line, with its site."""
    out = []
    for p in walk_md():
        rel = os.path.relpath(p, ROOT)
        with open(p, encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                if DEFN.match(line):
                    continue          # a definition is not a citation of itself
                for m in CITE.finditer(line):
                    out.append((int(m.group(1)), rel, n, line.strip()))
    return out


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"

    if not os.path.exists(UPSTREAM):
        print(f"citations: SKIP — no {os.path.relpath(UPSTREAM, os.path.dirname(ROOT))} "
              f"(the formal core is a sibling tree and may be absent)")
        return 0

    up = defined_in(UPSTREAM)
    loc = local_defs()
    cites = citations(loc)

    if cmd == "list":
        used = {t for t, _, _, _ in cites}
        print(f"upstream defines {len(up)} tags; this tree cites {len(used & set(up))}")
        for t in sorted(up):
            mark = "cited" if t in used else "     "
            print(f"  X{t:<3} {mark}")
        return 0

    if cmd == "sites":
        if len(sys.argv) < 3:
            print("usage: citations.py sites X47", file=sys.stderr)
            return 2
        want = int(sys.argv[2].lstrip("Xx"))
        for t, rel, n, text in cites:
            if t == want:
                print(f"  {rel}:{n}  {text[:100]}")
        return 0

    # ── check ────────────────────────────────────────────────────────────────
    bad = []
    ambiguous = sorted(set(loc) & set(up))
    for t, rel, n, text in cites:
        if t in loc:
            continue              # a locally defined tag is this tree's own
        if t not in up:
            bad.append((t, rel, n, text))

    if ambiguous:
        print("citations: ⚠ AMBIGUOUS — defined BOTH here and upstream:")
        for t in ambiguous:
            p, n = loc[t]
            print(f"     X{t} — local {os.path.relpath(p, ROOT)}:{n}, and upstream")
        print("     They do not collide in USE today (this tree's own are #8's world-model")
        print("     rows and its hexbody citations start at X24), which is luck rather than")
        print("     design. Namespace one of them before the ranges meet.")

    if bad:
        print(f"citations: ⛔ {len(bad)} citation(s) resolve to nothing upstream:")
        for t, rel, n, text in bad:
            print(f"     X{t}  {rel}:{n}  {text[:90]}")
        return 1

    n_up = len({t for t, _, _, _ in cites if t not in loc})
    print(f"citations: ok — {len(cites)} sites, {n_up} distinct upstream tags, all resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
