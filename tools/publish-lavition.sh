#!/bin/sh
# PUBLISH THE EDITOR PAGE ON THE LAVITION PROJECT — `sh tools/publish-lavition.sh <clone>`.
#
# `lavition/lavition` serves GitHub Pages from its `gh-pages` branch, root — one
# `index.html`, a `.nojekyll`, the LICENSE — at https://lavition.github.io/lavition/.
# This puts `_site/index.html` there: the same artifact `make pages` assembles and
# `probe/b2`, `probe/b6` and `probe/stick` drive, byte for byte, with the moros
# commit it was built from in the gh-pages commit message so the two can be joined.
#
# ⚠ THE PAGE IS ASSEMBLED HERE, NOT COPIED FROM WHATEVER `_site/` HOLDS. A sabotage
# sweep leaves a broken page in `_site/` for the length of a row, and a publish that
# copied blindly would ship it. `build-pages.mjs` also refuses an engine older than
# its sources, so a stale build cannot be published either.
#
# ⚠ A PUBLICATION, SO IT IS NEVER RUN BY A MAKE TARGET OR A LOOP — a person asks.
set -eu
cd "$(dirname "$0")/.."
CLONE="${1:-}"
test -n "$CLONE" || { echo "usage: sh tools/publish-lavition.sh <path to a lavition/lavition clone>"; exit 2; }
test -d "$CLONE/.git" || { echo "publish: $CLONE is not a git clone"; exit 2; }
git -C "$CLONE" remote get-url origin | grep -q "lavition/lavition" \
  || { echo "publish: $CLONE does not track lavition/lavition"; exit 2; }
test -z "$(git status --short src lib tools | grep -v '^??')" \
  || { echo "publish: moros has uncommitted changes under src/ lib/ tools/ — commit first, the page must name a commit"; exit 2; }

node tools/build-pages.mjs
HEAD_MOROS=$(git rev-parse --short HEAD)
SHA=$(sha256sum _site/index.html | cut -c1-16)
SIZE=$(stat -c %s _site/index.html)

git -C "$CLONE" fetch -q origin gh-pages
git -C "$CLONE" checkout -q gh-pages
git -C "$CLONE" reset -q --hard origin/gh-pages
cp _site/index.html "$CLONE/index.html"
touch "$CLONE/.nojekyll"
if git -C "$CLONE" diff --quiet -- index.html; then
  echo "publish: the page on gh-pages is already this build ($SHA) — nothing to push"
  exit 0
fi
git -C "$CLONE" add index.html .nojekyll
git -C "$CLONE" commit -q -m "The editor page, built from jjstwerff/moros@$HEAD_MOROS

sha256 $SHA… · $SIZE bytes · assembled by tools/build-pages.mjs, published by
tools/publish-lavition.sh. Opens from https://lavition.github.io/lavition/ with no
server: the page dials its own origin, finds no editor, and edits its own world."
git -C "$CLONE" push -q origin gh-pages
echo "publish: pushed gh-pages ← moros@$HEAD_MOROS ($SHA…, $SIZE bytes)"
echo "         https://lavition.github.io/lavition/ — Pages rebuilds in a minute; check with"
echo "         gh api repos/lavition/lavition/pages/builds/latest --jq .status"
