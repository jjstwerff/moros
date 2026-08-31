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
        '''  raw = hex_voxel::world_palette_name(w, hex_voxel::PAL_EDGE,
                                      hex_voxel::world_region_at(w, q, r), mat);
  if raw != "" && raw != hex_voxel::PAL_ABSENT { return edge_role_of(pal_word(raw)); }
  for e in edge_kinds() {''',
        '''  for e in edge_kinds() {'''),
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
# ── plan 21 `R5b.2` — ONE ROW PER WIRED READER ─────────────────────────────
#
# ⛔ **THE TABLE IS THE COVERAGE ANSWER, NOT JUST A PASS.** Eight sites were rewired and
# the honest question is which of them anything can SEE go wrong. A row that comes back
# green is a site with no test behind it, which is a finding to print rather than a
# result to round up.
E = 'lib/hex_editor/src/hex_editor.loft'
S = 'lib/hex_editor/src/session.loft'

ROWS.update({
  '10': (G, 'mark_left asks the byte',
         '  if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref)) { return false; }',
         '  if !edge_is_wall(wall_of(wld, q, r, d, ref)) { return false; }'),
  '11': (G, 'oct_fits_at asks the byte (unobservable — see role_mat)',
         '        if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref)) { continue; }',
         '        if !edge_is_wall(wall_of(wld, q, r, d, ref)) { continue; }'),
  '12': (G, 'the HOUSE acceptance reader asks the byte',
         '        got = edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref));',
         '        got = edge_is_wall(wall_of(wld, q, r, d, ref));'),
  '13': (G, 'the REGION acceptance reader asks the byte',
         '        rg_got = edge_is_wall_at(wld, q, r, wall_of(wld, q, r, rg_d, ref));',
         '        rg_got = edge_is_wall(wall_of(wld, q, r, rg_d, ref));'),
  '14': (G, 'corner_write skips MASONRY again, not what is marked',
         '        if wall_of(wld, q, r, cw_d, ref) != 0 { continue; }',
         '        if edge_is_wall(wall_of(wld, q, r, cw_d, ref)) { continue; }'),
  '15': (G, 'wall_corner_close asks the byte',
         '        if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, cc_d, cc_ref)) { continue; }',
         '        if !edge_is_wall(wall_of(wld, q, r, cc_d, cc_ref)) { continue; }'),
  '16': (E, 'the room-add union asks the byte',
         '        ra_has = edge_is_wall_at(w, q, r, wall_of(w, q, r, ra_e, ra_ref));',
         '        ra_has = edge_is_wall(wall_of(w, q, r, ra_e, ra_ref));'),
  '17': (S, "the run gesture's own material asks the byte",
         '  if edge_is_wall_at(w, sr_q0, sr_r0, mat) {',
         '  if edge_is_wall(mat) {'),
  '18': (G, 'edge_is_wall_at never resolves — the whole step at once',
         '  if mat == 0 { return false; }\n  edge_role_at(w, q, r, mat) == ROLE_WALL\n}',
         '  edge_is_wall(mat)\n}'),
  '20': (G, 'a declared wall TYPE is a role of its own (the shipped-and-caught bug)',
         '  if raw != "" && raw != hex_voxel::PAL_ABSENT { return edge_role_of(pal_word(raw)); }',
         '  if raw != "" && raw != hex_voxel::PAL_ABSENT { return raw; }'),
  '19': (G, "edge_is_wall_at's absence GUARD dropped (a speed cut, not a rule)",
         'pub fn edge_is_wall_at(w: VoxelWorld, q: integer, r: integer,\n                       mat: integer) -> boolean {\n  if mat == 0 { return false; }',
         'pub fn edge_is_wall_at(w: VoxelWorld, q: integer, r: integer,\n                       mat: integer) -> boolean {'),
})

# ── plan 21 `R5b.3` — THE MESHER, in a different package ───────────────────
#
# ⚠ **THESE ROWS RUN A DIFFERENT TEST FILE**, so a row declares its own — see `FILES`.
# Running every file for every row would be three `loft test` runs a row over 27 rows for
# a table where most cells are structurally green.
M  = 'lib/hex_mesh/src/hex_mesh.loft'
PV = 'lib/hex_mesh/src/planview.loft'

ROWS.update({
  '21': (M, 'wall_up_at asks the byte',
         '  role = hex_editor::edge_role_at(wld, q, r, mat);\n'
         '  if role == hex_editor::ROLE_FENCE { return FENCE_UP; }\n'
         '  if role == hex_editor::ROLE_DOOR { return 0; }\n'
         '  hex_editor::STOREY_H\n}',
         '  if mat == FENCE_MAT { return FENCE_UP; }\n'
         '  if mat == DOOR_MAT { return 0; }\n'
         '  hex_editor::STOREY_H\n}'),
  '22': (M, 'emit_run_wall asks edge_is_wall, not _at',
         '  if hex_editor::edge_is_wall_at(wld, rwq, rwr, run.wr_mat) {',
         '  if hex_editor::edge_is_wall(run.wr_mat) {'),
  '23': (M, "chunk_mesh_props' door SCAN asks the byte",
         '            if !hex_editor::edge_is(wld, gq, gr, gws[gi], hex_editor::ROLE_DOOR) { continue; }',
         '            if gws[gi] != DOOR_MAT { continue; }'),
  '24': (M, "chunk_mesh_props' sidoor asks the byte",
         '          sidoor = hex_editor::edge_is(wld, cq, cr, ews[si], hex_editor::ROLE_DOOR)\n'
         '                   && pohead > 0;',
         '          sidoor = ews[si] == DOOR_MAT && pohead > 0;'),
  '25': (M, 'wall_up_part_at asks the byte',
         '  role = hex_editor::edge_role_at(wld, q, r, mat);\n'
         '  if role == hex_editor::ROLE_FENCE { return FENCE_UP; }\n'
         '  if role == hex_editor::ROLE_DOOR { return 0; }\n'
         '  if pup > 0 { return pup; }',
         '  if mat == FENCE_MAT { return FENCE_UP; }\n'
         '  if mat == DOOR_MAT { return 0; }\n'
         '  if pup > 0 { return pup; }'),
  '26': (PV, "the plan view's colour asks the byte",
         '        erole = hex_editor::edge_role_at(w, q, r, emat);',
         '        erole = hex_editor::edge_kind_of(emat).ek_name;'),
})

# ── WHICH TEST FILES EACH ROW IS ASKED OF ──────────────────────────────────
#
# ⚠ **A ROW DECLARES ITS OWN**, because the mesher's rows live in another package and
# running all three files for all 27 rows is three `loft test` runs a row for a table
# whose off-diagonal cells are structurally green.
ED = 'lib/hex_editor:tests/role_mat.loft lib/hex_editor:tests/corner_close.loft'
ME = 'lib/hex_mesh:tests/wall_role.loft'
FILES = {}
for _k in ROWS:
    FILES[_k] = ME if _k in ('21', '22', '23', '24', '25', '26') else ED
FILES['0'] = ED + ' ' + ME       # ⚠ the control is asked of everything

LABELS = {'0': 'control — nothing cut'}
LABELS.update({k: v[1] for k, v in ROWS.items()})
# ⚠ Rows 8, 9 and 19 must stay GREEN — a sweep of only-red rows cannot tell *the tests
# see this* from *the tests fail on anything I touch here*.
# ⛔ **AND ROW 11 IS GREEN FOR A THIRD REASON, WHICH IS THE ONE WORTH READING.**
# `oct_fits_at`'s extent scan only sizes a window for `disc_marks`, which scans it
# again for the same thing — so its answer cannot show through the return while the
# two agree, and NO fixture can make this row red. It is wired anyway, because the
# failure mode of the two disagreeing is a window narrower than the field, which is
# `probe/tw`'s cliff rather than a smaller picture.
GREEN = {'8', '9', '11', '19'}

if sys.argv[1] == '--files':
    print(FILES[sys.argv[2]])
    sys.exit(0)

if sys.argv[1] == '--label':
    n = sys.argv[2]
    mark = ' ✅' if n in GREEN else '   '
    print('%3s |%s %-52s' % (n, mark, LABELS[n]))
    sys.exit(0)

path, _, have, want = ROWS[sys.argv[1]]
s = io.open(path, encoding='utf-8').read()
if s.count(have) != 1:
    sys.exit('row %s: the text to cut appears %d times in %s' % (sys.argv[1], s.count(have), path))
io.open(path, 'w', encoding='utf-8').write(s.replace(have, want))
