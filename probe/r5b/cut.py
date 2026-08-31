# THE SABOTAGES, ONE PER ROW — plan 21 `R5b`.
#
#   python3 cut.py <row>      apply row <row>
#   python3 cut.py --label N  print the row's label
#
# ⚠ **EVERY CUT IS A `replace` WITH AN ASSERTED COUNT OF 1.** A sabotage that silently
# fails to apply reads as *the tests cannot see this*, which is the answer a sweep
# exists to distinguish from *nothing was cut*.
import io, sys

G = 'lib/hex_editor/src/gesture.loft'
W = 'lib/hex_editor/src/walk.loft'

ROWS = {
  '1': (G, 'edge_role_at never reads the palette',
        '''  nm = hex_voxel::world_palette_name(w, hex_voxel::PAL_EDGE,
                                     hex_voxel::world_region_at(w, q, r), mat);
  if nm != "" && nm != hex_voxel::PAL_ABSENT { return nm; }
  for e in edge_kinds() {
    if e.ek_mat == mat { return e.ek_name; }
  }''',
        '''  for e in edge_kinds() {
    if e.ek_mat == mat { return e.ek_name; }
  }'''),
  '2': (G, 'absence falls through to the wall default',
        'pub fn edge_role_at(w: VoxelWorld, q: integer, r: integer, mat: integer) -> text {\n  if mat == 0 { return hex_voxel::PAL_ABSENT; }',
        'pub fn edge_role_at(w: VoxelWorld, q: integer, r: integer, mat: integer) -> text {'),
  '3': (W, 'a fence blocks the VIEW too — the two sets collapse',
        '  edge_role_at(w, q, r, mat) == ROLE_WALL\n}',
        '  role = edge_role_at(w, q, r, mat);\n  role == ROLE_WALL || role == ROLE_FENCE\n}'),
  '4': (W, 'edges_around still asks the BYTE pair',
        '        stops = wall_stops_walk_at(wld, q, r, mats[si]);\n        if view { stops = wall_stops_view_at(wld, q, r, mats[si]); }',
        '        stops = wall_stops_walk(mats[si]);\n        if view { stops = wall_stops_view(mats[si]); }'),
  '5': (G, 'open_ahead asks is_opening, not is_opening_at',
        'if !is_opening_at(w, cq, cr, kind) {', 'if !is_opening(kind) {'),
  '6': (G, 'run_slope asks edge_kind_of, not edge_kind_at',
        '    e = edge_kind_at(w, q, r, m).ek_slope;', '    e = edge_kind_of(m).ek_slope;'),
  '7': (G, 'edge_kind_of(0) is masonry again',
        '''  if mat == 0 {
    return EdgeKind { ek_mat: 0, ek_name: hex_voxel::PAL_ABSENT, ek_slope: SLOPE_FREE };
  }
  for e in edge_kinds() {
    if e.ek_mat == mat { return e; }
  }''',
        '''  for e in edge_kinds() {
    if e.ek_mat == mat { return e; }
  }'''),
  '8': (G, 'the wall/door rows in a different ORDER (valid)',
        '''    EdgeKind { ek_mat: WALL_MAT,   ek_name: ROLE_WALL,   ek_slope: 1 },
    EdgeKind { ek_mat: DOOR_MAT,   ek_name: ROLE_DOOR,   ek_slope: 1 },''',
        '''    EdgeKind { ek_mat: DOOR_MAT,   ek_name: ROLE_DOOR,   ek_slope: 1 },
    EdgeKind { ek_mat: WALL_MAT,   ek_name: ROLE_WALL,   ek_slope: 1 },'''),
  '9': (W, 'the walk absence GUARD dropped (a speed cut, not a rule)',
        '  if mat == 0 { return false; }\n  role = edge_role_at(w, q, r, mat);',
        '  role = edge_role_at(w, q, r, mat);'),
}
LABELS = {'0': 'control — nothing cut'}
LABELS.update({k: v[1] for k, v in ROWS.items()})
# ⚠ Rows 8 and 9 must stay GREEN — a sweep of only-red rows cannot tell *the tests see
# this* from *the tests fail on anything I touch here*.
GREEN = {'8', '9'}

if sys.argv[1] == '--label':
    n = sys.argv[2]
    mark = ' ✅' if n in GREEN else '   '
    print('%3s |%s %-49s' % (n, mark, LABELS[n]))
    sys.exit(0)

path, _, have, want = ROWS[sys.argv[1]]
s = io.open(path, encoding='utf-8').read()
if s.count(have) != 1:
    sys.exit('row %s: the text to cut appears %d times in %s' % (sys.argv[1], s.count(have), path))
io.open(path, 'w', encoding='utf-8').write(s.replace(have, want))
