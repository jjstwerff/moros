#!/usr/bin/env python3
# Copyright (c) 2026 Jurjen Stellingwerff
# SPDX-License-Identifier: LGPL-3.0-or-later
#
# citations.py — the formal-core tags this tree cites, and whether they resolve.
#
# Moros consumes a formal core it does not own: `../hexbody/ROUNDTRIP.md` defines
# rows numbered 1..70, and this tree cites them from docs, plans, probes AND code.  A
# citation ROTS SILENTLY — the prose goes on reading correctly while the number now
# names something else — so it needs a gate rather than a habit.  Taken from
# `../loft2`'s `@FR-` rule tags; see doc/claude/NOTATION.md.
#
# ── TWO NAMESPACES, AND THE PREFIX IS WHAT MAKES THIS EXACT ──────────────────
#
#   @HB-X<n>   hexbody's.  A tree this one does not own and cannot edit.
#   X<n>       this tree's own — plan #8's world-model rows, defined in a table here.
#
# ⚠ THE PREFIX WAS NOT COSMETIC.  Before it, both families were spelled the same and
# overlapped in 1..5: `WORLD_MODEL.md` defines `X1`..`X5` (`CW_EXTENT`,
# `CW_CONCURRENT`, churn under compaction) while hexbody numbers to 70.  A checker
# resolving every bare `X<n>` upstream called all five RESOLVED **by coincidence** —
# a false green built in on day one — and the two only missed each other because this
# tree's hexbody citations happened to start at 24.
#
# ⚠ AND IT FIXED A SECOND FALSE POSITIVE FOR FREE.  A bare reading counted every
# tag-shaped token in prose as a citation, so a sentence merely DISCUSSING a tag was
# reported as citing it.  A mention is not a citation, and only a namespaced tag can
# tell them apart.
#
# Subcommands:
#   check          every @HB- tag resolves upstream; every bare tag is defined here
#   list           every upstream tag and whether this tree cites it
#   sites <tag>    the sites citing one tag  (@HB-X47, or a bare local tag)
#
# ⚠ SKIPS RATHER THAN FAILS when `../hexbody` is absent.  A consistency check, not a
# capability the build depends on — a clone without the sibling tree must not go red.
# loft's own gate makes the same distinction for a missing `python3`.
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEXBODY = os.path.join(os.path.dirname(ROOT), "hexbody")
UPSTREAM = os.path.join(HEXBODY, "ROUNDTRIP.md")

# ⚠ CODE TOO, AND IT DID NOT AT FIRST.  The first version scanned only `.md` and
# reported "98 sites, all resolve" while 43 citations sat in `.loft`, `.mjs` and
# `.sh` — unchecked and uncounted.  A citation in a comment rots exactly as one in
# prose does, and loft's own `rule_tags.py` reads `src/` for that reason.
SCAN = ["doc", "plans", "probe", "lib", "src", "tools"]
EXT = (".md", ".loft", ".mjs", ".sh", ".py")
SKIP = ("/out", "/.out", "/node_modules", "/native-auto", "/.loft", "/.git", "/target")

# ⚠ BOUNDARY-EXACT THREE WAYS, and each guard was earned by a false positive.
#   * a digit may not follow — `X4` must not match inside a longer tag, and `\b`
#     does not save you because a digit continues the token;
#   * a letter or `-` may not precede — else a bare-X match fires on the `X` inside
#     a namespaced tag, counting every upstream citation twice;
#   * an UNDERSCORE may not precede — `const BTN_X0 = 8` in `probe/b1/panel.mjs` is a
#     pixel coordinate, and the first version reported it as citing a formal rule.
CITE_UP = re.compile(r"@HB-X([0-9]{1,3})(?![0-9])")
CITE_LOCAL = re.compile(r"(?<![A-Za-z0-9_-])X([0-9]{1,3})(?![0-9])")
# A tag is DEFINED by a table row that OPENS with it, here and upstream alike.
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


def walk():
    for base in SCAN:
        for dirpath, _, names in os.walk(os.path.join(ROOT, base)):
            if any(s in dirpath for s in SKIP):
                continue
            for nm in names:
                if nm.endswith(EXT):
                    yield os.path.join(dirpath, nm)


def local_defs():
    defs = {}
    for p in walk():
        for tag, where in defined_in(p).items():
            defs.setdefault(tag, where)
    return defs


def citations():
    """(tag, file, line, text, is_upstream) for every citation that is not a definition."""
    out = []
    for p in walk():
        rel = os.path.relpath(p, ROOT)
        try:
            with open(p, encoding="utf-8") as fh:
                lines = fh.readlines()
        except (OSError, UnicodeDecodeError):
            continue
        for n, line in enumerate(lines, 1):
            if DEFN.match(line):
                continue          # a definition is not a citation of itself
            for m in CITE_UP.finditer(line):
                out.append((int(m.group(1)), rel, n, line.strip(), True))
            # bare tags, with the namespaced ones masked out so the `X` inside a
            # namespaced tag is not counted a second time
            for m in CITE_LOCAL.finditer(CITE_UP.sub("", line)):
                out.append((int(m.group(1)), rel, n, line.strip(), False))
    return out


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"

    if not os.path.exists(UPSTREAM):
        print("citations: SKIP — no ../hexbody/ROUNDTRIP.md "
              "(the formal core is a sibling tree and may be absent)")
        return 0

    up = defined_in(UPSTREAM)
    loc = local_defs()
    cites = citations()

    if cmd == "list":
        used = {t for t, _, _, _, u in cites if u}
        print(f"upstream defines {len(up)} tags; this tree cites {len(used)}")
        for t in sorted(up):
            print(f"  @HB-X{t:<3} {'cited' if t in used else ''}")
        return 0

    if cmd == "sites":
        if len(sys.argv) < 3:
            print("usage: citations.py sites @HB-X47   (or X3 for a local tag)",
                  file=sys.stderr)
            return 2
        want = int(sys.argv[2].replace("@HB-", "").lstrip("Xx"))
        for t, rel, n, text, u in cites:
            if t == want:
                print(f"  {'@HB-' if u else 'local'}  {rel}:{n}  {text[:88]}")
        return 0

    bad, stray = [], []
    for t, rel, n, text, u in cites:
        if u:
            # ⚠ AN @HB- TAG MUST EXIST UPSTREAM. This is the rot the gate is for.
            if t not in up:
                bad.append((t, rel, n, text))
        elif t not in loc:
            # ⚠ AND A BARE TAG MUST BE DEFINED HERE — a question that could not be
            # ASKED before the namespace, because every bare `X<n>` might have been
            # an upstream citation. Now it is a typo or a citation that lost its
            # prefix, and both deserve a red.
            stray.append((t, rel, n, text))

    if bad:
        print(f"citations: ⛔ {len(bad)} `@HB-` citation(s) resolve to nothing upstream:")
        for t, rel, n, text in bad:
            print(f"     @HB-X{t}  {rel}:{n}  {text[:85]}")
    if stray:
        print(f"citations: ⛔ {len(stray)} bare tag(s) nothing here defines "
              "— did you mean `@HB-X…`?")
        for t, rel, n, text in stray:
            print(f"     X{t}  {rel}:{n}  {text[:85]}")
    if bad or stray:
        return 1

    n_up = len({t for t, _, _, _, u in cites if u})
    n_lo = len({t for t, _, _, _, u in cites if not u})
    print(f"citations: ok — {len(cites)} sites · {n_up} upstream tags all resolve "
          f"· {n_lo} local tags all defined here")
    return 0


if __name__ == "__main__":
    sys.exit(main())
