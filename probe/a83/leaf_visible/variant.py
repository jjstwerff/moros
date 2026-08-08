# Build a variant `prop_build.loft` for one of the probe's controls.
#
#   python3 variant.py <tmpdir> no-open      door/hung states NO opening profile
#   python3 variant.py <tmpdir> frame-wall   door/frame states up=6 surface=frame
#
# ⚠ EACH EDIT ASSERTS IT MATCHED EXACTLY ONCE. A silent zero-replacement builds the
# COMMITTED part, and the control downstream then compares a thing against itself
# and passes — which is the shape of a test that cannot fail.
#
# ⚠ IT IS A FILE RATHER THAN A HEREDOC INSIDE `run.sh` for a duller reason: the
# inner `<<'PY'` and the outer one are the same delimiter, and the shell ends the
# outer heredoc at the first of them.
import sys

tmp, which = sys.argv[1], sys.argv[2]
src = open('src/prop_build.loft').read()

if which == 'no-open':
    i, j = src.index('fn write_hung'), src.index('// A doorway: the frame standing on paving')
    body = src[i:j]
    old = '''  assert(part_set_open(w, PartOpen { po_head: 10, po_sill: 0,
                                     po_kind: "flat" }) == PO_OK,
         "the hung doorway's opening profile was refused");
'''
    assert body.count(old) == 1, 'write_hung changed shape'
    out = src[:i] + body.replace(old, '') + src[j:]

elif which == 'frame-wall':
    i, j = src.index('fn write_frame'), src.index('fn write_cell_leaf')
    body = src[i:j]
    old = '''  assert(part_set_meta(w, PartMeta {
    pm_kind: PK_FITTING, pm_name: "frame",'''
    new = '''  assert(part_set_wall(w, PartWall { wa_up: 6, wa_surface: "frame" }) == WA_OK,
         "the frame's wall profile was refused");
''' + old
    assert body.count(old) == 1, 'write_frame changed shape'
    out = src[:i] + body.replace(old, new) + src[j:]

else:
    raise SystemExit(f'unknown variant {which}')

open(f'{tmp}/variant_build.loft', 'w').write(out)
