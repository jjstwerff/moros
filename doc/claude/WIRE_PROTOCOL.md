<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# WIRE_PROTOCOL — the editor's socket, as it stands, with each message's fate

**Why this exists.** None of this was written down. Every acknowledgement string and every
ordering guarantee below was reverse-engineered out of `src/editor_server.loft` (4,238 lines) in
order to de-flake eight gates on 2026-07-30 — and the next person would have paid that cost
again. 28 gates depend on this protocol today.

**Why it carries dispositions.** [`HEX_STACK.md`](HEX_STACK.md) settles that the client derives
meshes from the store (I2) and that the static world is pulled from static blocks (§3). Most of
this protocol therefore disappears. So each row says what becomes of it, and this file doubles
as the migration checklist rather than becoming a second thing to keep in step.

**Frame format.** One text frame per message, `"<id>:<payload>"` client→server and
`"<tag>:<payload>"` server→client. `id` is an integer; `tag` is one uppercase letter. Payload
fields are comma-separated; sub-records are semicolon-separated.

## Disposition key

| | meaning |
|---|---|
| **A** | **authoring command** — survives as a store write. Over a socket only for live co-authoring; a single author writes locally |
| **R** | **read-back** — survives as a *local store query*, not a message. The client holds the store, so there is nothing to ask |
| **D** | **derived delivery** — **disappears** (I2). The receiver derives it from the store instead |
| **V** | **view or input** — moves client-side with the `view` group; never crosses a socket again |
| **X** | **dynamic state** — stays on a socket. This is the residue §3 says a server is actually for |
| **S** | **session plumbing** — survives as transport, whatever the transport becomes |

---

## Client → server

| id | name | payload | acknowledgement | fate |
|---|---|---|---|---|
| `1` | READY | — | the opening burst, then `E:` | **S** |
| `43` | DERIVES | `<0\|1>` — **"I draw the ground myself"** | `S:… derive N of M ground sent S held H` | **K** — the deletion S4 was measuring for |
| `2` | CAM | `<aspect>,` | `C:` immediately, from current state | **V** — and see the ⚠ below: today it doubles as *"resend `T:`/`C:`"* |
| `3` | LOOK | `<dx>,<dy>` | none | **V** |
| `4` | KEYS | `<bitmask>` — `1` forward, `2` back, `4` turn left, `8` turn right | none | **V** — the shipped `input` library owns this |
| `5` | RAISE | `<±1>` | ⚠ **none of its own.** `S:rebuilt` is the only signal | **A** → `raise_at(store, q, r, amp, rad)` |
| `6` | LEVEL | `<0\|1>` | `level true at height N (quantised from V, residual R)` · `level false…` · `level approximated — N cells hit the floor` | **A** |
| `7` | PLACE | `<x>,<z>,<yaw>` | `placed <x>,<z>` | **X** — a character pose is dynamic state, not world |
| `8` | SAVE | `<name>` | `saved N chunks to NAME (code C)` | **A** → publish an immutable versioned snapshot (§6) |
| `9` | LOAD | `<name>` | `loaded N chunks from NAME` · `load refused (C) detail` | **R** → map the store; no whole-world read |
| `10` | ROAD | `<0\|1>` | `road true at grade N (quantised from V, residual R)` · `road false at grade N` | **A** |
| `11` | FIELD | — | `field filled N cells` · `field refused — grew past the cap C without closing` · `field refused — nothing to fill here` | **A** → `flood_outside` + `trace` + `validate` |
| `12` | STOREY | `<±1>` | `storey ±N on N cells` · `storey refused (C) why` | **A** → `combine_cut_level` + `seat_write` |
| `13` | SCATTER | `<species>,<density>` | `scattered N of species S at density D` · `scatter refused — …` | **A** |
| `14` | STENCIL | `<roof_up>` — or `<roof_up>,<part>` for a SAVED part (plan 17 `A2.2`) | `stencil placed N cells, kept B below and A above` · `stencil placed N cells from part 'NAME'` · `stencil refused — …` · `stencil refused — part 'NAME' (C) detail` · `stencil refused — part name 'NAME' leaves data/parts/` · `stencil refused (C) why` | **A** → `stencil_stamp_all`. ⚠ **A PART AT ANOTHER UNIT IS REFUSED HERE, and this is the only path that meets that refusal** — plan 17 `A8.2b`, §P9.1. The `why` names **both** units: *the part is authored at unit 0.125 and this world is at 0.25 — a cell cannot cross that*. ⚠ **The number is `-10` because no `CW_*` rule refused**, which the `-10 - CW_*` encoding cannot say better; the sentence carries the diagnosis. ⚠ **This gesture does not go through `part_expand` at all** — it is `hex_editor::part_place` → `hex_part::part_stamp` — so `EX_UNIT` is unreachable from it and `PS_UNIT` is what an author actually meets |
| `15` | COLUMN | `<q>,<r>` | `column q,r = <heights>` | **R** |
| `16` | WALLS | `<q>,<r>` | `walls q,r = <three owned edges>` | **R** |
| `17` | CART | `<…>` | `cart travel T value V angle A skid S`, plus a broadcast `cart pose y Y bank B gapl L gapr R` | **X** |
| `18` | TRIGGER | `<name>` | `trigger N at q,r height H bound to NAME` · `trigger N binding NAME is foreign — left alone` | **A** for the anchor; the binding is game state (`L15`) |
| `19` | PROP | `<item>` | `prop I placed at q,r height H (n in this cell)` · `prop refused — …` | **A** |
| `20` | DRESSING | `<q>,<r>` | `dressing q,r = <layer/item pairs>` | **R** |
| `21` | IMPORT | `<path>` | `imported N vertices as mesh M at x,z` · `import refused (C) detail` · `import refused — N imported props is the limit` | **A** — a server-side filesystem read, never a payload |
| `22` | EXPORT | `<path>` | `exported N vertices to PATH` | **A** |
| `23` | FENCE | `<material>,<radius>` | `fenced N edges, M stored outside, radius R material X` · `fence refused — …` | **A** → `hexdisk_into` + `edge_set_mat` |
| `24` | EDGE | `<dir>,<material>` | `edge D of (q,r) = M, stored at (q,r)` · `edge refused — …` · `edge refused — the world declined it (C)` | **A** → `edge_set_mat` |
| `25` | WALL | `<material>` | ⚠ **emits `road …` strings** — `road started at x,z`, then `road laid N cells and M fence edges, cut C, heading H of 24 (snapped, residual R°), length L` | **A** → `snap_run_d24` + `way_stamp` |
| `26` | CELL | `<q>,<r>` | `cell q,r = <material>,<height>` | **R** |
| `27` | TRACE | `<0\|1\|2\|3>` | `trace true/false` · `profile armed` · `PROFILE …` | **S** — diagnostics |
| `28` | CAMREST | — | `camera rested B boom D free F pitch P residual A,B` | **V** — added 2026-07-30; see [`HEX_STACK.md`](HEX_STACK.md) and the note below |
| `29` | LABELS | `<q>,<r>` | `labels q,r = <one layer label per layer, bottom-up>` | **R** — added 2026-07-30. The companion to `15` COLUMN: same column, identities instead of heights |
| `30` | STAIR | `<+1\|-1>` | `stair ±1 at q,r height H from S` · `stair refused (C) why` · `stair refused — no cell along the facing` | **A** — added 2026-07-31 → `stair_height` + `surface_set` |
| `44` | PART | `<name>` opens a part as the edited store · **empty closes it** | `part 'NAME' opened as 'SHOWN' — N chunks, world held aside` · `part 'NAME' closed — K edits discarded[ plus its sections], world restored (N chunks)` · `part refused — 'NAME' (C) detail` · `part refused — 'NAME' leaves the part library` · `part refused — already editing 'X'; close it with 44: first` · `part close refused — not editing a part` | **A** — added 2026-08-04, plan 17 `A7.3a`. ⚠ **A part IS a world (§P1), so this is a SWAP and not a second editor**: the same gestures, the same renderer, the same camera, and the world held aside rather than closed. ⚠ **ONE message with two forms**, `14:`'s precedent — and 44 is the next free id, 1 through 43 all being taken. ⚠ **It also swaps the RENDERER's registries** — wall runs, roof plans, leaves, openings, annexes, props, slabs and holes are the server's records for the world being edited, so a part drawn while they are live has the world's walls standing inside it; `part_thumb_wire` settled the same question the same way. ⚠ **A close DISCARDS, and says how many edits it discarded**, counted from the store's own `w_tau` — which is re-anchored by `8:` (`A7.3c`), so a close straight after a save reports `0`. Anything unsaved when the mode closes is gone, which is why the number is on the wire rather than in a log |
| `18`/`21` in part mode | — | — | `trigger refused — editing part 'X'; a trigger belongs to a world, and a part cannot hold one` · `import refused — editing part 'X'; a part's mesh is its MESH section, not an imported prop` | **A** — plan 17 `A7.3b`. ⚠ **Fenced on OWNERSHIP** — `trigs`, `n_imported` and the imported mesh ids are the world's state and part mode does not hold them aside, so either would still be there after the world came back; and the part format has no section for either, so one authored here could never be saved. ⚠ **Everything else still edits the part** — `5:`, `24:`, `30:`, `32:` and the rest — which is the claim with teeth, since a server refusing everything in part mode passes every refusal above. ⚠ **`14:` WAS FENCED HERE AND IS NOT ANY MORE** (plan 17 `A7.3f1`): its refusal said *the gesture that makes one does not exist yet*, and it does — see the `14` in part mode row below |
| `8` in part mode | `<name>`, or **empty for the part that is open** | — | `part 'NAME' saved — N chunks, M sections` · `part save refused — 'X' leaves the part library` · `part save refused — 'X' is more than one level deep; a part is 'family/part' or 'part'` · `part save refused — 'X' did not reach the disk; nothing was written (code 3)` · `part save refused — 'NAME' (code C)` · `part save refused — 'NAME' (1) a → b → a` · `part save refused — 'NAME' names a mesh that will not load (C) why` · `part save refused — 'NAME' has a damaged INST section: why` | **A** — plan 17 `A7.3c`. ⚠ **§P2: a part is saved the way a world is saved, because it IS one**, so the MODE decides the root rather than a second message — the same rule that decides where a raise lands. The cost is stated: a client that saves without checking the mode writes a part. ⚠ **The sections come along because they are in the STORE**, not because this path carries them; `lib/hex_part/tests/save_edit.loft` pins that, with a dropped section and a changed byte as controls. ⚠ **A name saves under that name and keeps editing it**, which is what makes a part that did not exist before possible. ⚠ **`OWNER_ANY`, deliberately**: `world_save_as(…, port)` was tried and stamps an owner field INTO the file, so a null save rewrote the bytes of a part nobody edited and left a diff `make parts` reverts. ⚠ **The edit clock is re-anchored here**, so a close straight after a save reports `0 edits discarded` — and a REFUSED save does not re-anchor it, or the author would be told their work was safe and then watch it dropped. ⚠ **§P8 is checked BEFORE the write** (`A7.3d`, which closes `A3.4`): `part_cycle_of` on the candidate's instances under the name it is about to take — `part_cycle` walks what is on DISK and cannot see the cycle a save-AS creates — plus `part_mesh_loads`, where `MC_NONE` is not a fault because most parts name no mesh. The refusal carries the CHAIN, and *the acknowledgement said no* and *nothing was written* are separate claims: only the second is the property, and only an ordering gives it |
| `14` in part mode | `<roof_up>,<part>` | — | `instance N of 'PART' at (q,r,h) — a reference, not a stamp` · `instance refused — (C) a → b → a` · `instance refused — 'PART' (code C)` · `instance refused — 'X' has a damaged INST section: why` | **A** — plan 17 `A7.3f1`. ⚠ **THE SAME MESSAGE, AND THE MODE DECIDES WHAT IT MEANS**, which is `A7.3c`'s rule for `8:` rather than a new one: *put that part here* is one intent, and in a WORLD it stamps cells while in a PART it writes an `INST`. Two ids for one intent would make the author's hand learn the store's internals. ⚠ **§P4: the cells are DERIVED** — the authored store does not grow, and the client is shown a DISPLAY world (the authored one copied, with every instance expanded into it). Expanding into the edited store itself is the one damage an author cannot undo. ⚠ **§P8 is checked ON THE GESTURE**, not only at the save: an instance is exactly how a cycle is authored, and the refusal carries the chain. ⚠ **The facing is 0**, because only six of the 24 headings turn a body on the lattice (`A4.4`) and a facing taken from the walker's yaw would refuse most placements for a reason the gesture never mentions; a turn is its own gesture and does not exist yet |
| `45` | SOCKETS | **empty** · `<inst>` · `<inst>,<socket>` | `sockets of 'PART' = N` + one `sock=…` per socket + `fits KIND/SIZE` or `fits nothing — …` · `sockets of instance N 'PART' = M` + the `sock=` lines · `socket 'NAME' of instance N KIND/SIZE = K fit` + one `fit <handle>` per part · `sockets refused — not editing a part; open one with 44:` · `sockets refused — 'PART' offers no socket called 'X'; it offers 'a', 'b'` · `sockets refused — 'PART' has N instances, so there is no M` · `sockets refused — 'X' is not an instance number` | **R** — plan 17 `A7.3f2`. ⚠ **A READ-BACK, NOT A BROADCAST**, and that is why it can exist before the bind gesture: `A7.1` refused to push `SOCK`/`FITS` on connect because a message no client reads is this tree's own trap, and a query's consumer is whoever asked. It joins the `15`/`16`/`26` family. ⚠ **THE FRAME IS THE INSTANCE'S PART, NOT THE OPEN ONE** — a cottage does not offer the door-frame's `leaf`, the door-frame does. ⚠ **ONE RECORD PER LINE, never a separator the payload may carry**: a part handle is a file path and may hold a comma, a socket name is free text, so the lead line carries the count and each record gets its own line. ⚠ **`A4.2`'s `parts_for_socket` gets its first consumer here** — exact and complete rather than near and ranked, because a size class is NOMINAL |
| `46` | BIND | `<inst>,<socket>,<part>` · **`<inst>,<socket>` unbinds** | `bound 'PART' into 'SOCKET' of instance N 'FRAME' (KIND/SIZE)` · `swapped 'PART' into …` · `unbound 'SOCKET' of instance N — K bindings left` · `bind refused — not editing a part; open one with 44:` · `bind refused — say <instance>,<socket>,<part>` · `bind refused — (4) 'X' does not fit 'FRAME' socket 'S': why; 'S' takes KIND/SIZE` · `bind refused — (3) 'FRAME' offers no socket called 'X'; it offers …` · `bind refused — (C) chain` · `bind refused — instance N has nothing in 'S' to take out` | **A** — plan 17 `A7.3f3`. ⚠ **THE PART HANDLE IS THE TAIL**, which is `BIND`'s own record shape and for `inst.loft`'s reason: a handle is a file path and may contain a comma. The socket name sits between two commas and may not hold one. ⚠ **A SECOND BIND ON ONE SOCKET SWAPS**, which is §P3's own promise that *composition by socket makes "swap this for that" a one-field edit* — `part_set_bindings` refuses a duplicate, so a gesture that could only ADD would leave an author stuck with their first choice. ⚠ **`socket_for_binding` and not `socket_named` here**: this call HAS a candidate, so the question is *may this go in that*, and `A4.2`'s `socket_fit` answers it. ⚠ **§P8 is checked on the gesture, over the candidate list** — a binding is the second kind of edge in the graph, and one that closes a loop was answering `CY_OK` and reaching the renderer as a DEPTH overflow until this step. ⚠ **A bound leaf is NOT drawn yet**: every part that fits a socket in this library is mesh-only, and the display world has nowhere to put a mesh |
| `47` | WATER | `<0\|1>` | `water true` · `water false` · `water refused after N cells — …` | **A** — added 2026-08-10, plan 20 `A10`. ⚠ **The walk is a HINT, not the route**: `water_lay` follows the LOWEST PATH and uses the facing only to break a tie, so on a hillside the ground decides every step and on a plain the author does. A stroke lays up to six cells, which is why the dirty mark is the run's length and not a brush radius |
| `48` | EYE | `<x>,<z>[,<h>]` — **empty releases** | `eye at X,Y,Z looking at the character D away` · `eye released — mode N` · `eye refused — D from the character is past what is streamed; offer O, residual R` · `eye refused — say <x>,<z> or <x>,<z>,<height>` | **V** — added 2026-08-12. ⚠ **NOT A SIXTH CAMERA MODE, and the difference is what it is derived FROM**: the five in `40:` all orbit the character, so a script could only change the view by moving the character — and moving the character moves where the next gesture lands. This stands the eye at a point in the WORLD and aims it back at the character, which is the only way to photograph a building from outside with its author in the picture. ⚠ **It SUSPENDS the mode rather than replacing it**: releasing returns to whatever `40:` last said, at whatever the ease had reached. ⚠ **`h` is above the GROUND at `(x, z)`**, defaulting to a person's own eye height — a script that had to know the terrain to place a camera would break the moment anything was raised under it, and every gesture already takes the ground under the feet as its datum. ⚠ **The distance is ORDINAL and refused with the offer** (`K-FIT`): chunks stream within `DRAW_HEXES` of the CHARACTER and the fog is centred there, so an eye beyond that photographs the inside of the fog and reports a successful picture of nothing. ⚠ **Nothing eases into place** — two consecutive `snap`s of one scene must be the same picture. ⚠ **It publishes through `cam_pub`**, whose single-writer `=` in the tick had to become an accumulate; measured, the handler's flag is what carries the two `C:` frames (`moved=false cam_pub=true`) |
| `49` | SELECT | `<kind>` | `opening K selected` · `selection refused — K is not an opening kind; nominal, so there is no nearest one` | **A** — added 2026-08-12, plan 22 `S2b`. ⚠ **WHAT THE NEXT BARE `36:` WILL CUT.** CATALOGUE §C1's question — *what are you working on* — applied to the opening family: `36:<kind>` says which hole to cut THIS time, and this says which one is CHOSEN. ⚠ **`36:<kind>` does NOT move the selection**: a key that silently re-chose would make *what am I working on* depend on what you last pressed, which is the thing the subject line exists to answer. ⚠ **The admissible set is not a range** — the units are the outline (`0..4`) and the tens the depth, so `5`, `15`, `25` and `30` are nothing at all and a `0..24` bound would wave nine of them through. Nominal, so refused **without an offer**, and the selection does not move. ⚠ **The choosing AND the refusal are `hex_editor::session_select_open`**; what stays here is the sentence and the `H:` line. Its rules are `lib/hex_editor/tests/opening.loft` — three selections cutting three different `Opening`s — because *does the choice change what gets cut* is a claim about the store |
| `9` in part mode | — | — | `load refused — editing part 'X'; close it with 44: first` | ⚠ **The two guards that ship WITH the mode rather than with `A7.3b`'s fence.** In part mode `wld` IS the part, so `8:<world name>` would write four chunks of cottage over the world file of that name — data loss on disk from a message that looks like the save you meant. A load would put a world into the store the subject line calls a part, and the mode would go on saying `part <name>` over it. Everything else part mode can reach is in memory and goes when the mode closes |
| `H:` | **SUBJECT** — server→client only, no request id. The whole subject line, composed by the server and shown verbatim: `H:world <name> · <MODE> · level ON/off · road ON/off · trace ON/off · opening <kind>` — or **`H:part <name> · …`** while `44:` has a part open (plan 17 `A7.3a`), because a gesture landing in the store you did not mean is that mode's one unrecoverable failure and the line is what makes it visible. ⚠ **Both names are carried into `hud_wire` and neither is copied into a third variable**: a *current name* kept in sync across a mode switch is a second authority, and `B2.3`'s control only means something while one place decides. Sent to a client **where it joins the list** on connect, and broadcast **on every accepted change**. ⚠ **Never on a refusal** — that is the one behaviour separating a HUD from an echo of the keystroke, and `tools/gates/world/subject.mjs` is the control. ⚠ FPS is deliberately absent: it is a client fact, and one mixed field would make "the server authored this line" untrue of the whole. Plan 18 `B2` |
| `N:` | **CATALOGUE** — server→client only, sent where the client joins the list **and re-broadcast whenever the library's LIST changes** (plan 17 `A7.1`). `N:<kind>\|<name>\|<0\|1>\|<reason>;…` — ⚠ `;` between entries and `\|` within, because a reason is a SENTENCE and a sentence has commas in it. **ONE list, two families** (§C3): materials **derived from `hex_mesh::surfaces()`** so it cannot name a material the renderer cannot draw, and parts from `hex_part::part_list(data/parts/)` so it cannot name one that is not on disk. Neither is a list the server keeps. ⚠ **A part that fails §P8's cycle check is listed UNAVAILABLE with its chain** — `part|house/loop_a|0|contains itself: house/loop_a → house/loop_b → house/loop_a` (plan 17 `A3.1`); the library is swept once at startup, because a cycle is a property of the library and not of a connection. ⚠ **A part added or removed while the editor runs moves the list, and every thumbnail goes out again with it** — a catalogue row index is POSITIONAL (`surface_count() + i` over a sorted list) and `W:`/`Y:` address a row, so an insert renames every row after it. Re-sending only the new part's picture would leave every later thumbnail addressed to its neighbour. ⚠ **And nothing is sent when the library holds still**: a list that re-broadcast on a timer is one the client must re-render for ever. `tools/gates/world/library.mjs` inserts a part that sorts FIRST for exactly this reason. Plan 18 `B3.2` + `B5.1`, plan 17 `A3.1`, `A7.1` |
| `W:` | **THUMBNAIL CAMERA** — server→client only. `W:<row>;<view 16>;<proj 16>` — the canonical three-quarter camera for catalogue **row** `<row>`, fitted by the server to that part's own emitted vertices. ⚠ **It is also the INVALIDATION** (`B5.3`): the camera can only be composed once every mesh is built, so it always leads a part's set, and a `W:` for a row the client already holds means fresh geometry is coming. No message means *forget this row* — a rule read off the ordering cannot drift from a rule written beside it. The client drops the old meshes when the first replacement `Y:` **arrives**, not here, because dropping on `W:` blinks the row to black on every rebuild. ⚠ **The client never composes a camera.** A second projection path is a second thing to keep honest, and the look-at that aims the world's camera already lives on the server; `B3.3` refused the same trade for the swatch by building its hexagon directly in clip space, and a 3D part has no such escape. Plan 18 `B5.2`, `B5.3` |
| `Y:` | **THUMBNAIL GEOMETRY** — server→client only. `Y:<row>;<ramp>;<r>,<g>,<b>;<6 floats per vertex>` — **`M:`'s own shape with the mesh id replaced by a catalogue row**, so a thumbnail parses the way a world mesh does. One message per non-empty surface; a cottage fills six of the thirty-six a four-chunk part could produce. ⚠ **Sent after the `N:` it indexes into**, because a row must exist before a picture can name it — one socket is FIFO and that ordering is the whole guarantee. ⚠ **The server meshes and the client draws**, which is not the obvious split: a part IS a world and the client already meshes worlds out of its own cache, but four of a chunk's nine surfaces come from `chunk_mesh_props`, which reads wall EDGES and the server's registries. A client meshing a part would draw its ground and its floor and **no walls** — a house with no house in it. ⚠ **Re-broadcast when the part's file changes** (`B5.3`) — to everyone, not to the next client to connect, because the author who changed it is the one person certain to be looking. Plan 18 `B5.2`, `B5.3` |
| `40` | MODE | `<0\|1\|2\|3\|4>` — AUTO, FOLLOW, SNUG, CUTAWAY, EYES | `mode N` · `mode refused — N is not a mode (offer 0, AUTO..4, EYES)` | **V** — added 2026-08-01. AUTO is the default and degrades into SNUG on `sh_room`; ⚠ naming any other mode turns the degradation OFF for good, because a chosen mode never auto-switches. ⚠ It also RE-FENCES the pitch: EYES allows ±1.5 and FOLLOW −0.20, and a mode change is not a look |

⚠ **`14` STENCIL GREW A SECOND FORM RATHER THAN A SECOND MESSAGE**, and the old payload
is untouched: `14:12` still builds a house of that roof height, so
`tools/gates/world/stencil.mjs` did not change — which is itself the claim that the procedural
path was not disturbed. ⚠ **Since `A2.3` it no longer PLACES one, though**: `14:<roof_up>`
generates a part in a scratch world and stamps it, so both forms land through `part_place` and
there is one way for a house to reach the world. The acknowledgement is identical, including
the refusal number — `-10 - CW_*`, which names *which* rule refused rather than merely that
something did. A part is
**named, never pathed**: `21:` IMPORT takes a filesystem path because a kit-bashed `.glb`
genuinely lives anywhere, while a part lives in `data/parts/` by definition and a name is what
`A7.1`'s catalogue will offer. `house/cottage` is a name with a family in it, and a name
containing `..` is refused rather than normalised. ⚠ `roof_up` is still parsed and **fenced**
for the part form and then **ignored** by it — a part's roof is whatever was authored into it,
and an author who asks for an inadmissible roof is owed the refusal even on a message that
would not have used the number.

⚠ **`30` STAIR is the gesture that made an upper storey REACHABLE**, and until it
existed three of this editor's rules could not be tested at all. A storey is 12 height
units and a stride is 4, so every route onto a deck was a cliff — which meant the deck
half of the camera's surface rule, of the road's surface write, and of the walk's own
step test were all "correct by construction". It cuts the cell you are FACING to exactly
one stride above the surface under your feet: it **sets rather than adds**, so it is
idempotent and a held key builds one step, and going up is walking onto what you cut and
cutting again. The step's height comes from the same function the cliff threshold does
(`moros_sim::stair_height`), so *a stair you build is a stair you can climb* needs no
agreement between two constants.

⚠ **`29` LABELS exists because heights cannot show identity.** `15` COLUMN answers
`column 0,10 = 13,25,37,49` both when three cellars were *inserted under* a ground layer that
kept its label and when they were appended and everything was renumbered — the heights are
identical and only the labels differ. Adding the read-back is what turned "the ground keeps its
identity" from an argument into a measurement, and it caught a real defect the same minute: a
first attempt answered **`59,58,…,2` — 34 labels for 4 layers**, because a layer is chunk-wide
while `storey_add` writes a *disc of 19 columns*, so every column inserted its own. **A claim
about the store needs a read-back on the thing claimed, not on its consequences.**

⚠ **`25` WALL answers in `road` vocabulary.** `do_wall` emits `road started` / `road laid` /
`road refused`, which belong to `10` by name. This cost real time: `road.mjs` was written to wait
for `road started` after `10:1`, which never arrives — `10` answers `road true at grade N`. Two
features share one vocabulary and neither owns it. **Do not "fix" the strings without changing
the gates that match them**; record it and let the migration retire both.

## Server → client

| tag | payload | meaning | fate |
|---|---|---|---|
| `M` | `<id>;<flags>;<colour+vertices>` | a mesh. Chunk ids live above the reserved low block; within it, parity selects the surface — `0` ground, `1` road, `2` field, `3` vegetation, `4` roof, `5` wall. ⚠ **THE RESERVED BLOCK IS 0-15 AND EVERY SLOT IS SPOKEN FOR**: `0-4` the figure, `5-7` the cart (`CART_BODY`, `CART_WHEEL_L/R`), **`8-15` the part-mode limb block** (`PART_MESH_BASE` 8, `PART_MESH_MAX` 8). Plan 17 `A8.3` — `A8.2` took 5 on the reasoning *0-4 are the figure* and collided with the cart in both directions: opening a part deleted the cart, and the cart sent to a joining client overwrote its limbs. **No count can see that collision** — the wire carries both and a float count cannot tell a door panel from a cart body — so a new user of this block must be added HERE first. ⚠ **The limb block is re-sent when a client joins while a part is open** (`disp_tau = -1` in `MSG_READY`): the rebuild broadcasts it once and is otherwise silent, so a page loaded after `44:` used to get the doorway and no door | **D** |
| `T` | `<id>;<16 floats>` | a transform, column-major | **D** for world meshes; **X** for the figure |
| `C` | `<view 16>;<proj 16>` | camera. ⚠ Everything past the first `;` is parsed as the projection by `editor_client.loft` — **a third field silently blinds the wasm client** | **V** |
| `S` | `<text>` | status: every acknowledgement above | **A**/**R** — becomes a return value, not a message |
| `X` | `<id>` | drop a mesh (streamed out of range) | **D** |
| `V` | `<hideMask>,<ambient>,<lamp>` | ⚠ **per-client** — bit 0 hides the FIGURE, bit *k* hides surface *k*; the ambient the fragment shader mixes against its one light, and the head-lamp's intensity. ⚠ The lamp's POSITION is not on the wire — the client derives it from the view matrix it already holds (`-transpose(R)·t`), so it cannot drift from the camera by a frame or a rounding, and the wire carries only the number that is a decision. Sent on CHANGE, and re-sent to an ARRIVING client (`1` READY resets the sent-key), because a send-on-change that forgets the new tab is a bug | **V** |
| `Z` | `1` / `0` | brackets a batch of mesh traffic. Used by **both** the dirty flush and the streamer | **D** |
| `E` | — | the opening burst is complete; *"tell me your aspect"*. Clients answer `2:<aspect>,` | **S** |
| `G` | `<grass rgb>,<rock rgb>,<from>,<to>` | terrain ramp colours | **V** |
| `F` | `<x>,<y>,<z>,<from>,<to>,<sky rgb>` | fog, centred on the **character**, not the camera | **V** |
| `P` | — | liveness probe, broadcast once a second; its return value is the live client count, which is how a closed tab is detected | **S** |
| `L` | `<cx>,<cz>,<li>,<id>,<kind>,<ver>,<base>;<cells>` | **one terrain layer, whole** — the voxels themselves, the store's own flat encoding. This is the message every `M` is meant to become unnecessary by | **K** — the point of the design |
| `K` | `<cx>,<cz>` | **that chunk is empty, and I am telling you so.** ⚠ Silence is not an answer: inside a cache, "there is nothing there" and "it has not arrived" are the same observation, and only the authority can separate them. Sent for the margin chunks a tile needs but that hold nothing | **K** |
| `Q` | `<cx>,<cz>,<crc>` | the checksum of the ground mesh the server just built for that tile, so the client can derive its own from its cache and prove it is the same one. Answered by `42:` | **A** — it disappears when the client's mesh is trusted rather than compared |
| `D` | `<cx>,<cz>,<li>,<crc>;…` | the digest of the **visible** set — twelve-ish bytes a layer against 8 KB of cells, so it can go every tick where a resend cannot. Answered by `41:` | **K** |

---

## ⚠ A RECEIVER'S PRECONDITION IS THE SENDER'S JOB

The S3 finding, and it generalises past this protocol. The client's mesher reads
**two cells past** every tile it builds (`hex_mesh::MESH_MARGIN`), so a tile is
derivable only once the store chunks its *margin* touches have arrived. Three separate
things had to change before that held, and each looked like someone else's problem:

- **`send_layers` sent the chunk under the tile's ORIGIN only.** A tile near a chunk
  edge needs the chunk before it too. Measured: tiles at `cz = -4` wanted store chunk
  `r = -2`, and no tile in range had its origin there, so it went to nobody.
- **An empty chunk was sent as silence**, which a cache cannot distinguish from a
  chunk in flight — hence `K:`. 36 of 48 verdicts were held forever on chunks the
  *server* did not have either.
- **The comparison ran on arrival**, before the batch that could complete it had
  landed. It belongs at `Z:0`, which is the server's own statement that a batch is
  whole.

`ground 41 bad 7` → `ground 12 bad 0 wait 36` → **`ground 48 bad 0 wait 0`**. The first
step was a guard, the second was the sender honouring it. A guard alone converts a
wrong answer into no answer, which is better and is not the claim.

### And then the ground stops being sent (S4)

`43:1` is the client saying it draws the ground itself, and the server sends it none.
Measured in the gate: **`ground sent 174 held 20`** — twenty ground meshes built and never
put on the wire, while a plain socket in the same session still received all of them.

⚠ **EARNED, NOT DECLARED.** The client sends `43:1` only after four `Q:` agreements with no
disagreement, and `43:0` the moment one fails — so a client that starts meshing wrongly gets
the server's ground back. The worst case is a byte cost, never a hole in the world.

⚠ **PER CLIENT, AND "EVERY CLIENT DERIVES" WAS THE WRONG TEST.** Suppressing only when no
client still needs the ground reads as the safe choice and makes the deletion *unreachable*:
the gate runner is a client and cannot derive anything, so the condition never fires under
the only circumstances anyone measures — `ground sent 154 held 0` is what that looked like.

⚠ **AND A CLIENT MUST BE TRACKED WHERE IT ARRIVES.** `clients` was populated by `2:<aspect>`,
which arrives some time after the connect — 400 ms for the gate runner. Harmless while the
ground was broadcast; the instant it became a per-client send, the whole opening stream went
to nobody and the `terrain` gate read **`n: 0`**. A default aspect is a guess that `2:`
corrects immediately; being absent from the list is not correctable, because the frames
missed are already gone. This is the third time this session that *a guard belongs where the
thing arrives* has been the answer.

⚠ **The oracle asks whether the chunk is KNOWN, not whether it holds ground.** A chunk
known to be empty is an answer: the mesher reads absent cells there and so does the
server, and the two agree.

---

## The ordering guarantees

These are the whole reason a gate can be written without a sleep. Each was established by
measurement, and the cost of not knowing it is named.

1. **The wire is ordered.** Any acknowledgement is a sequencing barrier for everything sent
   before it. This is what lets a read-back stand in for a missing ack — `import.mjs` needs no
   wait at all, because a `dressing` read-back cannot arrive before what the import emitted.
2. **`S:rebuilt N chunks` means the *picture* caught up**, not just the world. It is broadcast
   after the whole `Z:1` … `Z:0` transaction, and **only when `nrebuilt != 0`** — so it is a
   signal, not a heartbeat, and waiting for a rebuild that will not happen is a stall rather
   than a no-op.
3. **A command's ack arrives *before* the flush it triggered.** A placement marks its chunks
   dirty and acks in the same handler, so at the moment `placed` reaches the client the flush is
   necessarily still pending, and the next `rebuilt` is necessarily the one carrying it. **Order
   matters:** `road.mjs` waits for the rebuild *before* toggling road mode off, because after
   the toggle there may be nothing left to wait for.
4. **`T:` is sent only from inside `if moved`; `C:` is sent when the CAMERA changed.** A
   standing character produces no `T:`, so *waiting* for the next one times out. `2:<aspect>,`
   sets `moved`, which is how a fresh transform is **requested**. `occlude.mjs` and `climb.mjs`
   both depend on this.
   ⚠ **`C:` used to be in that block too, and it was a defect.** The boom EASES over the ticks
   *after* the character stops, deliberately — and none of those ticks published anything, so
   the client drew the matrix from the last tick the character happened to move on. Measured
   standing in a 5×4 house: the trace read `dist 1.87`, the room less its skin, while the eye
   the renderer used was **5.317 wu behind the character, outside the walls** — the full boom,
   exactly where the teleport had left it. `C:` now goes out when `cam_dist`, `cam_pitch` or
   `cam_slide` differ from what the last solve left, which is precisely *the drawn camera would
   differ*. It is still silent at rest, so it is a signal and not a heartbeat.
   ⚠ **Second instance of this exact fault in one loop:** `live_clients` was once counted off a
   broadcast inside `if moved`, and a client that sat still was never counted again. `if moved`
   reads like *"if anything changed"* and means *"if the CHARACTER changed"*; anything else that
   evolves per tick has to say so itself.
5. **The streamer's `Z:0` can precede the first `C:`.** So a client must ask *whether* the
   opening batch has closed, not wait for it to close — `terrain.mjs` reported `loaded: false`
   for exactly this reason.
6. **`5:` RAISE has no acknowledgement.** Serialise raises by awaiting `rebuilt` between them;
   two raises in one flush produce one `rebuilt`, and the second wait then hangs.
7. **A raise applies in full before the next message is read.** So when no mesh is being
   measured, the ordered wire is the entire barrier and no wait is needed at all — `stencil.mjs`
   sends eight raises back to back.

## The traps, each one paid for

- **A fixed sleep before a mesh read is a statement about the machine.** `field.mjs` read **0
  vertices on every run** once its guess stopped winning — not intermittently.
- **A tolerance that gates its own solve latches.** `cam_rested = dd < 0.001` also decided
  whether the solve ran, so the boom parked up to 0.001 short *forever*, wherever the ease
  happened to cross. Two runs of one build: `reach 5.324` and `reach 5.299`.
- **Sampling over a fixed window measures the window.** `collide`'s control leg ran to a 6000 ms
  cap, so `free.gone` was distance-in-six-seconds. End a walk for a **named reason** instead.
- **Concluding a reason from where a loop broke lets it lie.** Swapping a distance test for a
  tick budget reported `gone: 12` from a walk of 6.5 wu and stayed green. Derive the reason from
  the measurement.
- **Comparing two derived domains is a bug, not a flake.** `terrain.mjs` compared mesh maxima
  over *different loaded chunk sets* and failed **three runs in four**. Sleeping longer hides it;
  measuring over one domain fixes it.
- **`ack` polling granularity can hide a defect.** A 100 ms poll covers a ~16 ms tick, so a
  raise reading a once-per-tick cell looked correct. Only a probe sending two commands with
  nothing between them exposed it.
- ⚠ **An `ack` CONSUMES the message, and only sees what arrives after it is called.** Two acks
  for one acknowledgement means the second waits out its limit and returns `(no "…")`. This was
  introduced and caught the same hour in `prop.mjs`: an added `await ack('storey')` sat directly
  above the existing `const storey = await ack('storey')`, so `groundMoved` read false on every
  run. **Adding a barrier can break a gate as surely as removing one.**

## `27:` — where a message's time goes, on demand

`27:` carries four verbs, and two of them were added because the three the tick already had
could not see a gesture at all.

| | |
|---|---|
| `27:0` / `27:1` | the **tick's phases** — proxy, camera, rest — printed once a second while ticking |
| `27:2` | **arm** the per-message profile, and reset it. Replies `S:profile armed` |
| `27:3` | **report** it: `S:PROFILE <total>ms over <k> message kinds — id count us tau`, then one `S:PROFILE <id> <count> <us> <tau>` per id that was seen |

⚠ **The two are different instruments, not two settings of one.** The tick buckets answer *the
camera is eating the frame*, and they are blind to everything a gate or a script does: those send
messages and wait for acknowledgements, and most never tick at all.

⚠ **`tau` SITS BESIDE THE MICROSECONDS ON PURPOSE.** This tree's cost model is the edit clock — an
exact integer, the same on any box and on a world of any size — and a millisecond figure measures
the machine it ran on. Together they separate the two questions a slow gesture raises: *is it
doing too much work* (`tau`) or *is the work too expensive* (`us`). And the **count** is there
because a total cannot be read without it: `15:` at 900 ms is a catastrophe if it arrived twice
and unremarkable if it arrived four thousand times.

⚠ **REPORTING DOES NOT RESET.** Two consecutive reads would otherwise mean two different windows,
and a gate that asks twice wants the same answer twice. `27:2` is the only reset.

⚠ **AND IT WAS CHECKED IN BOTH DIRECTIONS BEFORE BEING BELIEVED**, which is what the rest of this
file is about. Armed, then sent exactly five `7:` and three `15:`, the report read `7 5 …` and
`15 3 …` — the counts it should find. Every `tau` read **0**, which is the right answer for a
place and a column read and is indistinguishable from a broken column, so a second check sent
three `5:` raises: `5 3 17326 273`. A profiler that has only ever printed zero in a column has
not demonstrated that column.

## Still clock-paced

**Every world gate now waits on the server.** The `world/` suite contains no fixed sleep outside
an `ack` poll loop. What remains is one different class and one file outside the suite:

| gate | why it still counts time | class |
|---|---|---|
| `character/hipskin.mjs`, `keyonly.mjs`, `walk.mjs` | they measure **how many frames arrived in a fixed window** — the counts move by ±1 by construction | **frame-window.** Claims have real headroom (`legRots >= 3` sitting at 38; `>= 3` sitting at 22). Not a wait-before-measuring defect |
| `wip/camera.mjs` | work in progress | not in the suite |

Fixed 2026-07-30, in the order done — the patterns to copy: `field`, `straight`, `import`,
`vegetation`, `persist`, `road`, `stencil`, `occlude`, `climb`, `collide`, `terrain`, then
`cart`, `doorstep`, `prop`, `trigger`, `storey`, `stream`, `level`.

Three of those needed more than an ack substitution, and they are the interesting ones:

- **`stream.mjs`** — a `setInterval` march plus a 4200 ms measurement window. The streamer
  announces *nothing* (it brackets in `Z:1`…`Z:0` but emits no status) and a 6 wu step need not
  cross a chunk boundary, so there is no per-step signal. The barrier is a `2:` request: the
  `C:` it is answered with proves every mesh the streamer emitted beforehand has arrived. Now
  exactly reproducible — `added 492 · dropped 216 · live 276 · peak 312 · liveChunks 46`.
- **`level.mjs`** — `S:placed` is *not* sufficient. Levelling drops its counter-peak from the
  per-tick hex-change block, which `placed` precedes; the `T:` broadcast sits after that block
  in the same tick, so a **fresh transform** is the only correct barrier. Releasing with `6:0`
  sends no status either — it recomputes `py` and sets `moved`, so again the barrier is `T:`.
- **`trigger.mjs`** — *"let the last rebuild settle"* was waiting for a message it could have
  awaited: `triggers_resolve` runs inside the dirty flush, so the `trigger N BROKEN` broadcast
  is the signal.

---

## See also

- [`HEX_STACK.md`](HEX_STACK.md) — the design that decides every fate in the tables above.
- [`../../tools/gates/README.md`](../../tools/gates/README.md) — what the two gate suites are
  allowed to break, and how to run them.
- `src/editor_server.loft` — the implementation. The `MSG_*` constants are at the top; the
  handlers are inline in `main()`.
