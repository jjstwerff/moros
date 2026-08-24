# Moros Documentation

A tabletop RPG toolkit and campaign. New here? Read **[Quick Start](doc/claude/QUICK_START.md)** first.

> **Two projects share this tree.** **Moros** is the tabletop RPG — the rules, cards, NPCs,
> places and campaign under `doc/`. **lavition** is the universal hex-world editor those
> scene tools are being built for; it is its own product (`loft/doc/claude/LAVITION.md`) and
> Moros is one of its consumers. Everything under *Scene tools* below, and plans 7–15,
> belong to lavition. Its packages take descriptive `hex_*` names with **no brand prefix**.

## Working rules — read these every session

How this tree is worked. None of it is derivable from the code, and each line below was
learned by getting it wrong once.

**Ask in prose; never open a multiple-choice dialog.** The options are always the
least-informed part of the exchange, and a menu cannot be discussed — so it gets ignored.
When a call is needed, make it, state it in one line with the trade-off, and keep going;
the user redirects in words if they disagree. This holds even for a genuine design fork:
the merit of the question was never the issue, the medium is.

**Build to learn.** Nothing here is set in stone, and a design argued on paper cannot
settle what a prototype that runs will. Don't stop for approval on a reversible change —
prefer the version that makes the difference *testable*.

**Commit and push without being asked.** The remote is a **backup**, not a publication
step: these trees are worked by more than one agent, so local-only work is fragile. Stage
your own paths explicitly — `git add -A` is wrong here, because someone else's in-flight
work is routinely sitting in the tree. Put the *finding* in the commit message, not just
the change. What still warrants a word first: **a PR, a published package, a registry
entry.** Don't offer a PR unprompted — a pushed branch is already the deliverable.

⚠ **AND A SABOTAGE SWEEP MUST NOT RESTORE WITH `git checkout` — COMMIT FIRST.** The
subject of a sweep is the step you have just built, so it is *uncommitted by
definition*; `git checkout -- <file>` between rows deletes it, and the sweep then
reports **every row as a miss** — five clean catches read as *these tests cannot fail*.
⚠ **The control row cannot see it either**, because the tests were reverted with the
code. Copy the files aside and restore from the copies, **and assert the subject is
present before row 0** — a sweep over an absent feature answers *nothing went red* to
every question, which is the same sentence a useless test suite produces.

**Other people's trees.** `../crawler` is **read-only** — another agent works there, and an
edit it did not make destroys its ability to tell its own work from yours; raise findings
instead. ⚠ **`../loft` is READ plus FILE TICKETS, and nothing else** — no PRs, no closing or
merging, no cloning-and-building, no *running* its binaries, and never mutating its working
tree. Verify against the **installed** `/usr/local/bin/loft`, which is moros's own toolchain;
reaching for `../loft/target/release/loft` is already over the line. When a loft fix is needed
here, note the dependency and wait for their branch — a cherry-pick PR was opened once, closed
unmerged, and the maintainer landed it their own way, which is how it should go.
`loft-libs-*` is shared and consumed from the **working tree**, so a new public name can turn
a sibling's build red with no local edit — grep the sibling before adding one. Kill only processes you can identify as yours; this box runs other agents' work.

⚠ **And that rule is not only about siblings.** A loft struct name is global across a
*consumer's* whole dependency graph, so two packages in `lib/` may each define `Fit` and the
pair silently merges into one struct with whichever field types were declared last. **A package
suite cannot see this** — `hex_part` was 131 green while `hex_editor` would not build at all.
Grep `lib/`, `src/`, `../loft-libs-world/` and the registry **before** adding a public name, and
when a name is taken, take the collision seriously rather than routing around it: `hex_editor`'s
`Fit` had already settled the hard half of the question `hex_part` was re-deriving.
`Surface` was declared by both `hex_world` (now `hex_voxel`) and `moros_terrain` (now `hex_mesh`),
and in `editor_server.loft` the two had merged: writing the literal failed with five *"Unknown
field Surface.sf_r"* errors that never mention a collision, and spelling it
`moros_terrain::Surface` **still** resolved to the other struct — the return type accepted, the
constructor not. It went unnoticed for months because every caller reads `surface_at(i).sf_r` and
never names the type. ✅ **Fixed 2026-08-06** (plan 19 `L1`): `hex_voxel`'s is `SurfaceAt`.

⚠ **THE COMPILER HALF OF THAT IS FIXED, AND THIS RULE SAID OTHERWISE FOR MONTHS.** It read *"there
IS no routing around it — a qualified name does not disambiguate"*. **Measured 2026-08-11 and it
is no longer true**: `pkg_b::Thing { b_only: 7 }` compiles and takes B's struct with both packages
in the graph (control: distinguishable field names), and a *bare* ambiguous name is now refused
outright — ``error: `Chunk` is declared by more than one package here — write hex_voxel::Chunk or
hex_world::Chunk to say which``. **Grep first anyway**: a rename is still the one thing you cannot
do once a package is published, and a qualifier only helps the sites that were written knowing
they needed one.

✅ **AND THE PAIR THAT USED TO SLIP THROUGH THE AMBIGUITY CHECK IS FIXED — measured 2026-08-15.**
A METHOD in one package against a same-named FREE FUNCTION in another, when the receiver structs
share a name: the method used to win, selected by the receiver struct's *name*, reported as
`Too many parameters for t_5World_world_save` — the `Surface` sentence again, one layer down.
[loft#850](https://github.com/loft-lang/loft/issues/850). **Re-measured against the installed
toolchain with a three-package repro** (`pa` with `World` + a `world_save` method, `pb` with
`World` + a 3-parameter `world_save` free function, a consumer calling both): **both resolve
correctly, on the interpreter and on `--native`.** ⚠ **The instrument was checked before the
absence was believed** — the consumer calls *both*, so a green that came from one package never
loading would have shown as the method's own test failing. It never miscompiled — the two types
never merge — so what this cost was diagnosis time, and that bill is now paid.

⚠ **AND EVERY LINE ABOVE SAYS "NAME" WHEN A FILENAME IS ENOUGH.** A module's **basename** is
global across the whole dependency graph, so adding `src/<x>.loft` to a package silently
shadows a *dependency's* `src/<x>.loft` — and the dependency's own internal calls stop
resolving, reported against **the dependency's source**, a file you did not edit. Ours was
`hex_mesh/src/catalogue.loft` against `hex_part`'s, reported as *"Unknown function
`part_list`"* — a function that is `pub`, in a package green on its own. Measured: **the
filename alone is the trigger** — the consumer need not `use` the module, and the two files
need not share one declared name; renaming to `choices.loft` fixes it with nothing else
changed. [loft#912](https://github.com/loft-lang/loft/issues/912). **So grep `lib/*/src/*.loft`
for the BASENAME too, not just for the names inside it** — and note that the same-name
diagnostic for *declarations* is excellent (both sites and the fix in one line), which is
exactly why the silence here reads as something else entirely.

⚠ **HALF FIXED, AND THE HALF YOU GET IS DECIDED BY LUCK — re-measured 2026-08-17 against the
toolchain installed 2026-08-16 23:08.** loft gained an `Advice[module-name-shadowed]` that names
both files, the `use` site and which one binds. **It fires when the collision is harmless and is
silent when it is fatal**, which is the case that costs a diagnosis:

| the shadowing file declares… | what you get |
|---|---|
| a function the dependency's call RESOLVES to | ✅ the advice, both filenames — **and the dependency's own answer silently changes**: 100 where its own module says 42 ([#949](https://github.com/loft-lang/loft/issues/949)) |
| anything else | ⛔ `Unknown function part_list` at **`dep/src/dep.loft`**, plus a spurious `missing argument … of OpAddInt`, and **no advice at all** ([#948](https://github.com/loft-lang/loft/issues/948)) |

Same on the interpreter and on `--native`; control green with the file absent. **So the rule below
does not relax**: the diagnostic you would rely on is the one that does not appear when the build
goes red. ⚠ And it is worth re-reading which way the pair went — the struct-name defect was fixed
outright while this one got a warning, so *a reader who saw one ✅ could reasonably assume the
other*.

⛔ **AND THERE IS A THIRD SHAPE, LIVE IN THIS TREE FOR MONTHS — measured 2026-08-18,
[loft#976](https://github.com/loft-lang/loft/issues/976).** Not a package and its dependency: **two
SIBLINGS that know nothing about each other**, `moros_sim` and `hex_part`, each holding
`src/skin.loft` with **no name in common** and each saying a bare `use skin;`. Both suites green
forever, because a package's own graph holds only itself. Then a consumer pulls both:

| the consumer says | what breaks |
|---|---|
| `use moros_sim; use hex_part;` | ⛔ `unknown type 'PartBox'`, `Unknown function skin_covers` |
| `use hex_part; use moros_sim;` | ⛔ `Unknown function skin_overlap` |

**The CONSUMER's `use` line order decides which library loses its module**, and neither author can
see it from their own tests. ⚠ **A qualified name does not help** — `hex_part::skin_covers` fails
exactly as the bare name does, because the module never loads and there is no second name to choose
between; that is what separates this from the struct collision fixed on 2026-08-11. ⚠ **What is
amputated is a published library's PUBLIC SURFACE**, decided by unrelated siblings in somebody
else's graph.

✅ **THE FIX IS ONE LINE PER PACKAGE AND IT IS THE COMPILER'S OWN SUGGESTION: `use self::skin;`** —
measured to work in both orders, with every answer matching what each package's tests assert. **Write
`use self::<x>;` for a module your package owns, always**, and treat the bare form as the special
case that wants a stranger's file. ✅ And `make fast` runs **`tools/basenames.sh`** now, which fails
when two packages each hold `src/<x>.loft` and each claim it with a bare `use` — checked against the
defect it was written for. ⚠ It does **not** flag `render.loft` (`lavition_ui` + `graphics`) or
`wall.loft` (`hex_part` + `hex_world`), because only one package claims each of those; the rule is
*two bare claims*, not *two files*. [probe/skin](probe/skin/README.md).

⚠ **AND IT HAD NOT BITTEN ONLY BY LUCK**: both `skin` modules are test-only, so no call ever crossed
the boundary. **The first production caller in either would have been the failure** — reported
against a file its author had not touched.

⚠ **AND THE CHECK THAT SHOULD HAVE CAUGHT IT WAS DISABLED BY A NAME.** `tools/layering.sh` skipped
every `moros_*` package, so a universal package wearing a Moros prefix was exempt from the one
check written to catch exactly that — `moros_ui` for months, then `moros_terrain`. Both are
renamed (`lavition_ui`, `hex_mesh`) and the skip is now an explicit `CONSUMERS` list: **a new
package is checked unless somebody names it on purpose.** When a guard has an exemption rule,
ask what the rule exempts *by accident*.

⛔ **THE ALGORITHMS ARE NEVER OURS. This is the ground rule, and it outranks the ones
below it.** lavition is a universal editor; the `hex_*` family is where geometry lives. The
editor **consumes** those algorithms and never re-derives one — not in `src/`, not in
`lib/hex_editor/`, not "just for a probe". A gap is a **library** gap: name it, build it
**there**, and call it from here. ⚠ **AND NEVER IN FLOATS**: the lattice is exact integer
arithmetic (`hex_field::lattice_k/corner_k`, `hex_form::head_step`), and a float fit is the
tell that an algorithm was invented rather than found.

⚠ **THIS RULE WAS EARNED TWICE IN ONE HOUR, THE SECOND TIME AFTER IT WAS STATED.** Plan 24
`A0p` needed a wall's line recovered from the hex edges it stamped. Attempt 1 fitted a
principal axis through edge midpoints — **19 of 24 headings, five wrong by 10.458° against a
15° quantiser.** Attempt 2 knew better and still lost: it copied `hex_draw::surface_of`'s
integer body into the probe, *"with the `Plan` taken out"*, and invented a fold to replace the
ordering the `Plan` was providing — **8 of 24, worse than the float fit it was correcting**,
with `surface_heading` answering `-1` on 22 of 24. ⚠ **Neither run is evidence about
`hex_draw`, because `hex_draw` was never called.** A due-east wall summed to `(-14, 0)`: the
edge vectors cancelled, because `surface_of` walks a side **in reading order** and a scan of
the store has no order at all.

⚠ **SO THE GAP IS NEVER WHERE THE FIRST GUESS PUTS IT.** It looked like *we need a line-fitting
algorithm*; the arithmetic already existed and was exact. What is actually missing is an entry
point that accepts what the STORE has — an unordered set of marked edges — and the ordered
chain-walk that turns it into what `surface_of` already consumes. **Find the library's entry
point first; the shape of the gap is the difference between what it takes and what you hold.**

⚠ **AND THE FORMAL DEFINITION EXISTED THE WHOLE TIME, IN A TREE NOBODY HAD OPENED.**
`../hexbody/ROUNDTRIP.md` is *"the settled formal core"* — §6.1 says **a wall surface is the
exact AVERAGE of its edges, never a fit**, with a gate (`X47`) whose control is *"the scatter a
least-squares fit would threshold is 0 east and 0.9167 north, so averaging vs fitting is
measured, not rhetorical."* §6 even names the trap by hand: *"using R2's machinery where R1
applies — fitting a line to a stencil whose description we hold throws away an exact answer."*
**Both attempts above are that sentence.** ⚠ And §2.4.3 already states plan 24's whole decision —
*"the canonical text is not a second editor representation, and must not become one — that is
exactly the second layer the editor is not allowed to have"*, with layer 2 *"derived on demand,
never persisted"* per chunk. **The editor was not proposing an architecture; it was paying a debt
against one already written down.** [FORMAL_CORE.md](doc/claude/FORMAL_CORE.md) is the binding
extract, and it is a **pointer, not an authority** — hexbody is read-only from here.

⚠ **SO OUR OWN 24 HEADINGS ARE AN INVENTED ALGORITHM ALREADY SHIPPED, AND MY CORRECTION OF IT WAS
WRONG TOO.** `hex_editor::HEADINGS = 24` with `WALL_SNAP = 2*pi/24` and an `atan2` asks for
directions that **do not exist** — `X31`: *no odd multiple of 15° is reachable at all*. But the
answer is **not** "use `hex_form`'s 12": `H₁₂` (stencil sides) and `D` (world linework, `|D| = 24`)
are **different sets for different domains**, and `D` is 12 exact + 12 carrying a **uniform**
`1.1021°` bias at vector `(7,-2)`, chosen by an exhaustive search over `N <= 400` (`X29`, `X56`).
⚠ **Guessing the replacement is the same error as guessing the algorithm** — a measured
enumeration of *"directions reachable in n edges"* looked like `D` and is not.

**A missing library capability is ours to build**, never an upstream ask — verification is
only possible where the consumer lives. Build it under `lib/<name>/`, gate it with tests
that have been seen red. Fixing and republishing a shared library is allowed too; the gate
is loft's unified `library-ci-reusable.yml`, which is where the requirements are defined.
[LOFT_HANDOFF.md](doc/claude/LOFT_HANDOFF.md) is for **loft language and tooling defects
only** — never for library gaps.

**Structural invariants belong in the library**, as pure loft functions with tests in
`lib/*/tests/` — not in a `.mjs` browser gate. A gate that restates a connection cannot
test it. Leave in the gate only what needs a running world, and measure what was actually
*emitted*, never a number the producer re-derives.

The division now has a home and a rule: **the store's rules are loft tests; the drawn result
and the sentences are gates.** Every gate says at its top which it is — thinned, kept as the
wire half, or *checked and left whole* — because without that the next reader thins the
honest ones by symmetry. ⚠ **Move before you remove**: three gates held claims no loft test
made, and dropping one is a coverage cut wearing a tidy-up's clothes.

**A step is as small as possible AND still validated — two bounds, not one.** *Upper:* the old
path and the new one must both run at once and be compared exactly; if the only way to see whether
it worked is to swap and look, it is too big and its failure mode is `git revert`. *Lower:* the
step must be able to go red **on its own, for a real reason**; if the only way to test it is to
also do the next step, they are one step. ⚠ **The lower bound is the "built and never called"
defect wearing a planning hat** — splitting *add the function* from *call it* manufactures that
state on purpose. And a self-test is not validation: a table checked against the table cannot be
surprised. [plans/README.md](plans/README.md) has both bounds and the two cases that earned them,
an hour apart and both `M`. ⚠ **It is a GATE, not a habit — `make plan-check P=<plan>`, run at the
one moment a plan stops being a design and starts being work.** Deliberately not in `make fast`:
**a design may be rough until then**, and a check that demanded cut steps of every idea is one
people route around.

**Check that what you built is called.** A function written, tested green and never wired
to a consumer — `op_depth` reached the library and the emitter still cut every opening
through; `boom_take` was tested and the camera still eased straight to the raw sweep. A
tested claim no consumer honours is a claim about nothing, and it passes CI.

⚠ **AND IT IS THE COMMONEST DEFECT IN THIS TREE, NOT AN OCCASIONAL ONE.** One audit of
plan 20 found **three more at once**, and one of them was an entire phase's deliverable:
`slope_settle` — *the* thing `A7` shipped — was called by five tests, three probes and no
gesture, so the editor's roads never had the limits it exists to give them.
`footprint_seat` was built for seating a pad and called by nobody, so every house on a
slope was buried by up to 22 units. Both had been green for weeks. **When a step lands,
grep for its callers before saying it is done.**

⚠ **AND A TEST THAT REPAIRS ITS OWN SUBJECT IS HOW THIS HIDES.** `A7`'s test laid a road
and then called `slope_settle` itself — proving the RULE and saying nothing about whether
any gesture used it. It went red on its own fixture guard the moment the gesture was
wired (*"the fixture did not violate anything — nothing is being tested"*), which is
exactly what a self-repairing test says once the subject repairs itself. **A test that
performs the fix cannot see that nothing else does.**

**Give a claim the instrument that can SEE it, and check that instrument against something it
should find before trusting it to report an absence.** Three times in session 8 the obvious
instrument was blind to the thing it was aimed at: a picture cannot see the wire (the camera's
eased solve was published on no tick while its own trace read correctly); a chromaticity
classifier cannot see LIGHT, by construction, so it cannot tell a head-lamp from a brighter
ambient — only the spread *within one surface* can; and a colour cannot see a COUNT, so a
deck's missing underside photographs identically to seeing the roof through it. When one
instrument cannot answer, the answer is a second instrument, not a looser threshold.

**What you cannot see must not occlude.** A camera that avoids a surface its own mode hides is
avoiding nothing, and it parks the eye under the object it just removed — measured, a fixed
14.14 boom collapsed to 1.57 against a roof CUTAWAY had already taken out of the picture.

**A guard belongs where the thing arrives, and a fence where the value is USED.** Both were got
wrong in one session while looking right: a re-send for "the arriving client" fired in the
handler *before* a client joins the list, and a pitch fence applied only at the input let a
mode change carry an out-of-fence value straight past it.

**A guard that works in ONE DIRECTION reads exactly like a guard.** Asked *is this cell too
high above its neighbour*, a rule is right when a road climbs and blind when it descends —
because descending, the high cell is the previous stroke's and sits outside the disc just
stamped. That is one bug and this tree has now written it twice, in `faced_between` and in
`stroke_over_limit`. ⚠ **And the direct test cannot see it**: asking the guard about a
finished road puts both ends inside the window, so a one-sided rule trips either way. Only
the INCREMENTAL shape — the one the gesture actually has — can. Ask a guard from both ends,
and test it in the shape it runs in.

**An instrument gets checked against something it SHOULD find before it is trusted to report
an absence.** Four separate instruments were wrong before the thing they measured this
session — a proxy counter reading the wrong channel (0 for a full set), two trace fields
carrying another variable's value, `readPixels` returning black without
`preserveDrawingBuffer`, and reading a picture by eye. A wrong number is worse than a guess,
because a number gets believed. When the picture and the numbers disagree, suspect both.

**The compiler's advice is a hypothesis, not an instruction — run the suite against it.** loft's
lint says to drop the `&` on any parameter whose binding is never reassigned, because *"field
mutation already propagates to the caller without it"*. For one day that was false for a
store-backed struct: acting on all 50 sites it flagged took `hex_voxel` (then `hex_world`) from 114 green to **96
failed** with `Delete on locked store`, and turned a scripted run that exits 0 into a SIGABRT.
⚠ `--native` passed all 114 on the same source, so a per-backend green said nothing. It was
*right* at some sites and wrong at others **in identical words** — of seven dropped one at a
time, four stayed green and three aborted, with nothing in the signature or at the call site to
separate them. Measured, filed as
[loft#760](https://github.com/loft-lang/loft/issues/760), fixed within hours, and the 50 `&`s
are now dropped. What outlives it: the check cost one suite run, and the report is what turned
a blocked cleanup into a landed one.

**A grep over a log is an instrument, and its default answer is "absent".** Three were blind in
one session, each reading as a clean result rather than a miss: `^advice:` found nothing
because `loft test` indents diagnostics as `  Advice:`; `test result: .*total` scored four
*passing* runs as "no result", because only the FAILED line carries a total; and `sort -u` on
the message text collapsed two distinct sites into one, because the text is identical at every
site and only the location line differs. Match a line you know is there before believing a
count of zero.

**Cost is measured in `w_tau`, not seconds.** hex_voxel's edit clock bumps once per write
that changed something, so a gesture's cost is an exact integer that is the same on any box
and on a world of any size — `lib/hex_editor/tests/cost.loft`. A wall clock measures the
machine. When something is slow, find the instrument first: the editor's own `27:` tracer
said the camera was 993 ms of every second, which no amount of reading would have.

**Filing a loft defect** ([loft-lang/loft](https://github.com/loft-lang/loft/issues)): file
it as an issue straight away — a closed ticket costs nothing here, so never hold a finding
back to hunt for duplicates. `gh issue create` bypasses the issue form, so **put every
label in the create call**; a label guard adds `needs:labels` otherwise. Choose the type
label first, and let it decide whether a severity applies:

| what the ticket says | labels, all in the `create` call |
|---|---|
| it misbehaves | `bug` + `sev:high\|medium\|low` + `wa:*` + `area:*` + `hit-by:moros` |
| it works as designed, and the **design** is wrong | `enhancement` + `needs-design` + `wa:*` + `area:*` + `hit-by:moros` — **no `sev:`**, that scale is for bugs |

⚠ Query the tracker as **`loft-lang/loft`**. The old `jjstwerff/loft` name still resolves,
but `gh issue list -R jjstwerff/loft --label <x>` returns **0 through the redirect,
silently** — it reads as "nothing has this label" when ten things do.

**Stop any server you start** — `make stop-editor`. A forgotten one is not idle; one sat at
76% of a core indefinitely. And when handing over the editor URL, remember the user is
**not on this box's LAN**: they reach it over an ssh tunnel of their own, so a direct
address (or the hostname `make browser` prints) cannot connect.

## Where to look

| Looking for... | Go to |
|---|---|
| What this project is, where the code lives, how to run it | [Quick Start](doc/claude/QUICK_START.md) |
| The world, its history, its strangeness | [Lore](doc/claude/LORE.md) → [Campaign](doc/claude/CAMPAIGN.md) |
| The named cast and their motivations | [doc/npcs/](doc/npcs/README.md) |
| The settings and their geography | [doc/places/](doc/places/README.md) → [Geography](doc/places/geography.md) |
| Game mechanics — stats, powers, items, scenarios | [Rules](doc/claude/RULES.md) |
| The card deck system | [Cards](doc/claude/CARDS.md) |
| Printable card art and PDFs | [Card Art Prompts](doc/claude/CARD_ART_PROMPTS.md) |
| The browser toolkit — character creator, DM tool, **world map** | [Quick Start § Source files](doc/claude/QUICK_START.md) |
| Open work | [Open Issues](doc/claude/OPEN_ISSUES.md) → [doc/Todo.txt](doc/Todo.txt) |

## Foundation

- [Quick Start](doc/claude/QUICK_START.md) — entry point; file/folder map; tests
- [Scene-first writing](doc/claude/SCENE_FIRST.md) — documentation goal: every page should describe a scene a DM can run
- [Lore](doc/claude/LORE.md) — world history: portal, first mage, animal-people, the rift, the current day
- [Campaign](doc/claude/CAMPAIGN.md) — the active campaign arc and its through-lines

## Rules and mechanics

- [Rules](doc/claude/RULES.md) — full rules: core mechanics, progression, races, backgrounds, contacts, crafting, weather
- [Statistics](doc/claude/STATISTICS.md) — all 8 stats, scenario uses, specializations
- [Powers](doc/claude/POWERS.md) — all 36 racial powers, scenario uses, overwhelmed states
- [Items](doc/claude/ITEMS.md) — items, materials, crafting effects
- [Scenarios](doc/claude/SCENARIOS.md) — the 8 scenario types and their tension rules
- [Situations](doc/claude/SITUATIONS.md) — situational modifiers and resolution
- [Survival](doc/claude/SURVIVAL.md) — camp and forage across biomes

## Cards

- [Cards](doc/claude/CARDS.md) — card system: types, layout, what goes on a card
- [Card Art Prompts](doc/claude/CARD_ART_PROMPTS.md) — Flux prompts for NPC and place card art
- [NPC reference cards](doc/npcs/cards.md) — player-facing NPC cards (rumour + standing)
- [Place reference cards](doc/places/cards.md) — player-facing location cards
- Generated PDFs: [data/moros_cards.pdf](data/moros_cards.pdf) (NPC + place deck), [data/moros_playcards.pdf](data/moros_playcards.pdf) (base + scenario + discovery deck), [data/moros_character_cards.pdf](data/moros_character_cards.pdf) (power + background + item template stock)
- Tools: [tools/generate_card_art.py](tools/generate_card_art.py) (Flux art), [tools/build_card_pdf.py](tools/build_card_pdf.py) (NPC/place PDF), [tools/build_play_card_pdf.py](tools/build_play_card_pdf.py) (play-deck PDF), [tools/build_character_cards_pdf.py](tools/build_character_cards_pdf.py) (character-pool PDF)
- [Developer Art](doc/claude/DEVELOPER_ART.md) — placeholder-art workflow and how to swap in final art

## NPCs

- Index: [doc/npcs/README.md](doc/npcs/README.md)
- [NPC goals](doc/npcs/goals.md) — what every NPC should contribute to a session, including the per-NPC character-sheet workflow
- [DM staging](doc/claude/DM_STAGING.md) — session-by-session NPC introduction order and reveal layers
- [Pre-rift pair](doc/claude/PRE_RIFT_PAIR.md) — the two ancient powers that pre-date the rift
- [Face audit TODO](doc/claude/FACE_AUDIT_TODO.md) — open per-NPC art / scene notes
- Roster CLI: [tools/character.js](tools/character.js) — apply specs, render markdown sheets into NPC pages, validate; data in [data/roster.json](data/roster.json)

## Creatures

- [Creatures](doc/claude/CREATURES.md) — stats, attacks, motivation, default behaviour
- [Creature companions](doc/claude/CREATURE_COMPANIONS.md) — bonded creatures and their rules
- [Domestic animals](doc/claude/DOMESTIC_ANIMALS.md) — beasts of burden, mounts, livestock

## Places

- Index: [doc/places/README.md](doc/places/README.md)
- [Relative geography](doc/places/geography.md) — constraint list of relative positions; foundation for the future map

## DM reference

- [DM guide](doc/claude/DM.md) — overall DM responsibilities
- [DM staging](doc/claude/DM_STAGING.md) — pacing the cast across sessions
- [Coordination roadmap](doc/claude/COORDINATION_ROADMAP.md) — cooperative setpieces across the campaign
- [Brumal resolutions](doc/claude/BRUMAL_RESOLUTIONS.md) — four endings and per-world influencers

## Stories

- [doc/stories/](doc/stories/) — long-form fiction and reference vignettes (Irna, John, the Rift, world-edge expulsion)

## Scene tools

- [State](doc/claude/STATE.md) — **read first after a break**: where the editor work stands,
  decisions taken, what is open. Short on purpose; the thirteen-session record is
  [Journal](doc/claude/JOURNAL.md), which nothing thins
- [Scripted editor](doc/claude/SCRIPTED_EDITOR.md) — **how the editor is driven and verified**: a script of key presses with ticks, every run recorded, a clock that can be stepped or sped up, and a PNG at every step. ⚠ Its §0 is the finding that reframes the structural work — `hex_draw` and friends already do what the editor hand-rolls
- [Catalogue](doc/claude/CATALOGUE.md) — **what you are working on, what it is called, and what is available**: the always-visible subject line, names as author-facing handles that are not identities, one list over parts and materials, and why every image is rendered rather than loaded. Plan 18, **every step built**
- [Editor UI](doc/claude/EDITOR_UI.md) — **the panel, and why it is not Moros's**: a UI package whose dependencies pointed at the headless half while its purpose belonged to the drawing half, and which `tools/layering.sh` waved through for months **because it was named `moros_*`**. The rename to `lavition_ui` is what put it back under the check. Plan 18 `B1.2b`, **built**
- [Parts](doc/claude/PARTS.md) — **a house drawn away from the world, and the things it is made of**: parts as small worlds, composition by SOCKET rather than coordinate, an instance as a reference whose cells are derived, and the order of work. Plan 17
- [Fittings](doc/claude/FITTINGS.md) — doors, windows, shutters as hinged assemblies. ⚠ Read its banner first: most of it is superseded by `hex_draw`
- [Hex stack](doc/claude/HEX_STACK.md) — **the general design, and the single authority**: the three
  invariants (the store is the only authority, everything else is derived, writes go in place), the
  static/dynamic split, serverless distribution, the package register, and the translation table
- [Wire protocol](doc/claude/WIRE_PROTOCOL.md) — the editor's socket **as it stands**: every message
  id, every acknowledgement string, the ordering guarantees, and each message's fate under the
  design. Read this before writing a gate or a client
- [Editor substrate](doc/claude/EDITOR_SUBSTRATE.md) — **the universal hex-world editor** and its libraries: package map, consumers and their configurations, seam rules, the document-format contract, **the ownership audit and the five target groups**
- [Editing modes](doc/claude/EDITING_MODES.md) — **what a key means depends on where you are and
  what you have chosen**, and those are **two axes**: WHERE decides which verbs exist (derived
  from the author's position, never set — *"a house in a cave switches to houses again"* is the
  proof), WHAT YOU CHOSE decides what they produce (the catalogue). ⚠ Flattening them is a
  shipped mistake: one opening gesture needs **six keys** today because the profile is encoded in
  the key, and `O`/`P` mean *round vs pointed* on the wire and *door vs window* in the runner.
  ⚠ And a third layer — **house types** bundle defaults and may add their own verbs — which makes
  the verb table **data**: *adding a type must touch no code*, or the system cannot grow.
  **The mechanism is two levels**: a KEY names a **verb** (declared, small, remappable — the part
  that belongs to the person), and *verb + mode + selection* binds to the gesture underneath. So
  `O P I U N M` collapse to one verb `opening`, and ⚠ **the WIRE carries the verb, never the key**
  — a remapped client and a server resolving the key themselves is the four-site divergence
  rebuilt. Designed, not built
- [Pages editor](doc/claude/PAGES_EDITOR.md) — **the editor as a static page: the quick start, and
  one client with two authorities**. ⚠ Not *the editor minus a server* — a server is coming back
  for **script compilation, multi-player and debugging**, so the page is the same client with the
  authority LOCAL instead of remote, and a **permanent** quick-start demo rather than a phase.
  Two renderer programs would be the `html/editor.html` fork again. Its other half: one invariant (*the page is the same editor with different I/O*), the five pieces of
  library work it needs, and the count that justifies them — **what a key means is re-asserted in
  FOUR places today**, two of which say so in their own source and one of which cites a file
  deleted on 2026-08-02. ⚠ Its **filesystem correction** is the part to read: loft already ships
  `VirtFS` + `LayeredFS` — an immutable base tree plus a localStorage delta, which is *both*
  halves of the ask — but **`--html` binds `gl` and no `fs_*`, while the wasm host binds `fs_*`
  and no graphics**, and a rendering editor needs both
  ([loft#851](https://github.com/loft-lang/loft/issues/851)). `P4` — can one `--html` program hold
  the renderer *and* the gestures — is **run and it holds**. Designed, not built
- [Lavition split](doc/claude/LAVITION_SPLIT.md) — **extracting the editor into its own project, and keeping the Moros name out of it**: the one invariant is *build, test **and gate** with the Moros tree absent*, the four blockers in the order the facts force them (a `Surface` collision that already merges, `moros_terrain` misnamed by the mechanism that hid `moros_ui`, 64 lattice calls, and two `hex_world` lineages), and the probe that could falsify the whole design in an afternoon. Plan 19, **designed not built**
- [Terrain edits](doc/claude/TERRAIN_EDITS.md) — **how the ground moves, and what moves with it**:
  a building rides rigidly and ends on its own pad, a road or a wall bends along its run within
  a limit that belongs to the SURFACE, and the ground it encloses comes with it. ⚠ Its last two
  sections are the ones to read before touching a gesture — the **order-divergence table**
  (hill-then-build is *not* build-then-hill, and exactly where), and the traps: a `Mesh` that
  copies, a test that measured the wrong thing and passed, a probe that sampled its own output
- [Walk tick](doc/claude/WALK_TICK.md) — **one step of the person, wherever the person is**: the
  tick body was written **twice** (server and client) while every primitive under it was shared, and the
  second copy was missing a clause — **`l` on the page flipped a flag, wrote nothing, and said it had.**
  **EVERY STEP IS BUILT, `T0`–`T4`**: `lib/hex_editor/src/tick.loft` is the body, and all three drivers
  call it — the server, the page, and `editor_run`, whose `step <n>` is n ticks and whose only clock is
  the script. ✅ **The acceptance holds: `deck.keys` headless is `cea971a0…`, the server's own world to
  the byte, with no server, no socket, no browser and no clock.**
  ⚠ Read its **probe 4** for the finding that outlives the steps: asked whether the collision proxy is a
  cache, `deck.keys` gives the SAME world for the cache, for rebuilding every tick and for never
  rebuilding at all — *a sabotage that leaves the world identical can mean the fixture cannot see it*,
  and three instruments were blind before one answered. ⛔ **`T3` is that same shape at the level of a
  PLAN**: the acceptance its own step table names — `deck.keys` == the server — **cannot be run at `T3`
  at all**, because `deck.keys` levels and levelling is `T4`. *A walk that does not level writes
  nothing*, so no step in this design could ever have been accepted the way that row said. ⛔ **Probe 5 —
  *a remote page must not tick* — is BUILT and BLOCKED** (`probe/t5`): the page cannot attach, because the
  `--html` build made by the loft installed 2026-08-16 23:08 traps on the thumbnail path
  ([loft#950](https://github.com/loft-lang/loft/issues/950)). ⚠ **Its red rows are NOT an answer** — they
  say *the page never attached*, which is a fact about the page. ⛔ **And the blocker is the better
  finding: nothing in `make fast` builds the page**, so a toolchain swap was cleared by a green re-check
  that could not see the browser editor at all — `make probe-demo` and `make probe-auth` are the only two
  checks that drive one, and both sit outside the fast loop. **When a green run is used to clear a change,
  ask what it does not run**. ⚠ **And read its bisect for the instrument lesson**: the trap is memory
  corruption, so a scalar field reads the wrong number *in silence* and only the next vector read dies —
  while the browser had printed a ten-frame wasm backtrace naming the failing function from the very
  first run. It could not be read, because an `--html` build carries **no name section**
  ([loft#954](https://github.com/loft-lang/loft/issues/954)). **A stack trace that is printed and
  unreadable reads exactly like no stack trace at all**, and the whole statement-by-statement bisect was
  the price of not checking
- [World model](doc/claude/WORLD_MODEL.md) — **the landscape, and its normative contract**: the voxel, columns, layers, windowed heights, fold-freedom and border alignment
- [Ground default](doc/claude/GROUND_DEFAULT.md) — ✅ **CLOSED, and now a closure record.** The
  rule it established is normative in [WORLD_MODEL § `E1γ`](doc/claude/WORLD_MODEL.md) — *a world
  is an infinite plane of its ground `γ`, and storage holds only what differs* — and the numbers
  are in [probe/perf](probe/perf/README.md). ⚠ **Closing it is what found that `E1` clause 3 of
  the normative contract had been FALSE since `G5` shipped**, with every suite green: a plan is
  not closed while its rule lives only in the plan. Read the record for what the steps cost —
  three hypotheses about the write path each refuted by their own probe, `G6` needing **no code**
  (the mesher already drew a defaulted chunk, measured rather than believed), and `G2` built
  after its own row said not to, returning **10–14× on the write, nothing on one suite and
  −12.9 % on the next**
- [Camera indoors](doc/claude/CAMERA_INDOORS.md) — **five camera settings over one query**: AUTO,
  FOLLOW, SNUG (claustrophobic), CUTAWAY (de-roofed, for editing) and EYES (first person) want
  opposite answers from the same facts, so the mode decides and `shelter_at` only observes.
  **All built and gated**; the doc records which of its own design sentences the measurements
  refuted, which is most of its value
- [Blueprint editor](doc/claude/BLUEPRINT.md) — **a plan you perfect, then EXTRUDE**, and the
  formal definition of the three wall types. ⛔ **Proposed, not settled — §2 is a ticket for
  hexbody**, which owns the formal core. Its load-bearing arithmetic: **45° is not a lattice
  direction at all** (`tan 45° = 1` ⇒ `m/k = √3`, irrational), so an octagonal face can never be
  a `D` wall — which is *why* it is its own material rather than another heading. ⚠ A **bay** is
  therefore a projecting **feature of its parent wall** (`X70`'s taxonomy extended from
  *perforates* to *projects*), recovered from the parent's feature list because **45° was never
  stored**; a **tower** has no parent and must be deduced from the field, which is `§6`'s R1/R2
  boundary and the one number this design lacks. ⚠ And a regular octagon **is not a `Form`** —
  eight 45° turns need 1.5 twelfths each, so law J refuses it and `rebuild` cannot return it
- [House rooms](doc/claude/HOUSE_ROOMS.md) — **a house is a floor plan of boxes**: rooms are the
  house we already have, placed again adjacent, and a stair adds a LEVEL. ⚠ Its two live findings:
  `place_house`'s `D2b` guard **refuses exactly this** (it asks *does the footprint overlap a
  filed plan* where it means *would two ROOFS cover one cell*), and `hex_place::combine_cut` —
  the exact, float-free, order-free primitive that does the whole job — has **zero callers in
  this tree**. ⚠ And one question not to guess: `X52` says two adjacent boxes **FUSE** into one
  space, so whether adding a box defaults to a hall or to a room is a decision for hexbody
- [Formal core](doc/claude/FORMAL_CORE.md) — ⛔ **the definitions lavition is built from, copied
  in, and NOT the authority.** `../hexbody/ROUNDTRIP.md` is *"the settled formal core"*; this is
  the binding extract. The lattice, the **three direction sets that are not interchangeable**
  (`O` placements, `H₁₂` stencil sides, `D` world linework with `|D| = 24`), the two domains —
  **a house is domain A and a road is domain B**, which is the whole 12-vs-24 question — and §6's
  two recovery regimes with the trap named in one line. ⚠ Read it **before** writing geometry:
  §6.1 (*a wall surface is the exact average of its edges, never a fit*) and §2.4.3 (*the
  canonical text must not become a second editor representation; layer 2 is derived per chunk and
  never persisted*) are plan 24's two conclusions, already normative and already gated
- [Editor defects](doc/claude/EDITOR_DEFECTS.md) — **five defects found by USING the editor on
  2026-08-21, none of which any gate went red on**: the whole neighbourhood re-meshes on every
  write, the page editor has **no character** (the figure is built and posed server-side only),
  a house floor is not flat on a slope, and ⚠ **every wall is drawn TWICE** — once round the hex
  edges from the cells, once straight from the `WallRun` — because the gesture writes both
  records and the mesher emits both. Its 4 and 5 are **one defect**: only the store is saved, so
  a reload deletes exactly one of the two copies. Read it for the pattern more than the list —
  the wall pair was landed by a step whose gate asked *is the world byte-identical* and got
  **yes**, which is what a change that only adds a second drawing of the same thing answers
- [Editor ladder](doc/claude/EDITOR_LADDER.md) — **the rungs, their plans, and [the order of work](doc/claude/EDITOR_LADDER.md#the-order-of-work)** with the checkpoints that need the user's eyes

⚠ **The four below are HISTORY, and this index called them reference for months.** Each was
written before the architecture it describes was settled, each is superseded by a document above,
and each now opens with a banner saying by what. **They are kept, and read for one thing each**:
- [Scene map](doc/claude/SCENE_MAP.md) — ⚠ **not the scene model.** Its format (`HexCell`,
  `Blueprint`, `cy` layers) appears in **zero** source files and was never built —
  [World model](doc/claude/WORLD_MODEL.md) is the model. Read it for the **marketplace and inn
  layouts**, the **stair geometry**, and the `NpcRoutine` sketch that plan 15 still wants
- [Scene map renderer](doc/claude/SCENE_MAP_RENDER.md) — pseudocode on the **wrong lattice**
  (flat-top axial, where the tree is pointy-top odd-r); its own banner says so. Read it for the
  wall/roof narrative behind `moros_render`, never for a coordinate
- [Scene editor](doc/claude/SCENE_EDITOR.md) — a UI design for a page that **was not built**.
  Read it for the layout thinking
- [Scene editor plan](doc/claude/SCENE_EDITOR_PLAN.md) — a roadmap for an architecture we did not
  take: **fourteen of the paths it names do not exist.** Read it for the *tool inventory* —
  which editing tools a building-scale editor needs, and in what order
- [Generator](doc/claude/GENERATOR.md) — random scenario/NPC generator

## The browser toolkit

Three pages over `localStorage`, no backend — the character creator, the DM tool, and the
**world map editor** (`html/hex-map-editor.html`): terrain, roads, rivers, landmarks, in
2D and 3D. Its hex geometry lives in ONE place, `html/hex-lattice.js`, because it did not
and the two copies disagreed — see [Open Issues § World map
editor](doc/claude/OPEN_ISSUES.md). File map and test list: [Quick
Start](doc/claude/QUICK_START.md).

⚠ **The world map is not the scene.** The map is the campaign's overland hex map in the
browser; the scene is lavition's voxel landscape under `src/` and `lib/`. They share a
lattice convention and nothing else.

## Data

- [Data](doc/claude/DATA.md) — all data structures and where they live
- [Loft libraries](doc/claude/LOFT_LIBRARIES.md) — third-party libs in use

## Process

- [Plans](plans/README.md) — plan conventions; a plan's identity is its `jjstwerff/moros` issue number
  (`gh issue list -R jjstwerff/moros --label plan --state all`)
- [Loft handoff](doc/claude/LOFT_HANDOFF.md) — upstream loft defects Moros surfaced, written ready to file
- [Loft debugger](doc/claude/LOFT_DEBUGGER.md) — what `loft debug` does, and why it cannot reach a running server yet
- [Open issues](doc/claude/OPEN_ISSUES.md) — known issues and decisions
- [doc/Todo.txt](doc/Todo.txt) — current open task list from the user
