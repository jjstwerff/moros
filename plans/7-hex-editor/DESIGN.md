# DESIGN — the editor substrate, as one invariant and a sequence of small safe steps

In-flight design for [#7](README.md). Written **before the code**, per the design protocol: the
failure paths and the cross-boundary requirements are where the invariant becomes nameable, and
code-first would silently adopt the narrowest invariant I happened to see.

> **A design is a hypothesis, not a plan.** Everything below can be wrong. §3 is the set of probes
> that could prove it wrong, and they run **before** §5's steps — not after.

---

## 1. The one invariant

> **Every mutation of geometry passes through one apply, and that apply re-derives every anchor in
> the region it touched — moving it, or reporting it broken.**

That is the rule under which a case nobody tested behaves correctly for the same reason the tested
ones do: it does not matter *which* tool changed the geometry, *which* anchor kind was attached, or
whether anyone remembered — because the only path that can change geometry is the path that
re-derives.

**Why this one and not "no anchor silently dangles"** (invariant II in the plan): that states the
*property*; this states the **mechanism that makes it true everywhere at once**. A property has to
be re-asserted; a chokepoint asserts itself.

### The deliberate non-absorptions

The protocol's sharpest warning is that over-reach presents as *elegance*, so these are stated as
**refusals to unify**, each one a place the design could have been cleaner and would have been
wrong:

| not absorbed | why it is genuinely different |
|---|---|
| **a routine's binding** | it does not attach to geometry — it *names* something that does. It shares exactly one obligation (don't dangle) and none of the other four operations. Calling it a sixth anchor kind would buy symmetry and lose the distinction between *unresolved* and *broken* |
| **a connector's runtime pose** | a connector's frame is another part, so its frame *moving* is normal operation, not a threat. It is anchored to the **rig topology**, never to a posed position — `Ops` is an authoring-time set (`{flip, place, combine, damage, seat}`), and a pose is not in it. Absorbing pose into `Ops` would make every frame a re-derivation |
| **a canopy's extent** | a tree's anchor is its cell; the canopy that overflows it is *derived layer-2 geometry*, never stored and never anchored. Treating overflow as an anchor property would put a layer-2 concern in layer 1, which is `L3`'s violation condition verbatim |
| **`refuse` for a region** | ⚠ **unmeasured.** A `t` off an edge centre is refusable; it is not obvious a cell region has anything to refuse. hexbody hit this exactly — `level_fits` and terrain were *"measured to have nothing to refuse, which is a result, not a gap"*. **Probe P5 measures it; do not assume either way** |

---

## 2. The re-assertion count — and the chokepoint that collapses it

**Count first, before any code** (protocol step 2). How many independent sites must re-state the
invariant?

Every operation that can change geometry: paint material · set height · set wall · clear cell ·
stamp stencil · promote to model · seat on terrain · flip · combine · damage · load. **N ≈ 11 and
climbing with every tool** — and omitting the re-derivation at any one of them is **silent**: the
anchor simply points at geometry that is gone, and nothing errors. `N × silence` is the
brittleness, known now, before a line is written.

Both cures, applied together:

1. **Collapse N → 1.** There is exactly one function that writes geometry:

   ```
   doc_apply(doc, op) -> Outcome        // the ONLY writer
       1. fits?(op)      → refuse with (reason, offer, residual), change nothing
       2. mutate the field / model
       3. re-derive every anchor whose region intersects the touched extent
       4. append (op, anchor-outcomes) to the journal
   ```

   Tools do not mutate. Tools **produce an `op`** and hand it to `doc_apply`. So does the
   generator, so does a protocol client, so does load. One path, consulted by all.

2. **Make omission loud.** The field inside a `Doc` is **not reachable** except through
   `doc_apply` — a tool that reaches for `map_set_hex` directly does not compile against the
   editor's surface. Where the language cannot enforce it, **S7's census does**: a gate that scans
   for direct-mutation call sites outside the chokepoint and fails on any.

> **The self-check this design must survive:** the plan's own words were *"one chokepoint, blind to
> its subject."* The protocol's example of a failed prediction is *"one chokepoint that 18 sites
> route through"* — a spray wearing the word. **S7 is the step that makes it real, and its census
> is the proof.** If the census cannot be written, the chokepoint does not exist.

---

## 3. The probes — run these first; expect to falsify

Cheapest tests that could prove a load-bearing claim **false**. None writes production code. All
land in `probes/`, are committed with their measured output, and are **throwaway**.

| # | claim under test | the probe | what falsifies it |
|---|---|---|---|
| **P1** | the R1/R2 regime split is detectable on real content | paint one cell into `builtin_house_door`'s footprint; run `rebuild` | it stays R1 with `ρ = 0` → the document design in D1 changes, because the regimes are decoration |
| **P2** | nothing currently notices a dangling anchor | put a door on a wall, delete the wall, ask the model what it holds | *something already reports it* → the invariant has a partial home and the design should extend it, not replace it |
| **P3** | an anchor survives `Ops` | flip the doored house; compare the door's `(side, t)` before and after | it re-snaps rather than transforming → `I2`'s affine claim does not hold through our path |
| **P4** | the current controller tunnels | a map **with a wall**; `player_step` at 5× walk speed, `dt = 1/10` | it does *not* tunnel → §10.7 is wrong and the replacement needs a different justification |
| **P5** | ⚠ **the cleanest claim** — every anchor kind has all five operations | for each kind, name what `refuse` rejects. Region? Waypoint? Connector? | a kind with a **vacuous** `refuse` → the unification is wider than the domain. *That is a result to record, not a gap to fill* |
| **P6** | one journal is undo **and** save **and** replay | one edit touching model and field; undo; compare digests; replay from empty | they need different information → three mechanisms, not one, and S8–S10 split |
| **P7** | a message needs no new semantics | write messages for `tool_apply`, `undo_pop`, `stencil_placed`, `pick_hex_under_cursor`, `editor_save` | any needs logic that is not already a method → that capability is in the wrong layer |

**P5 is the one to run most honestly.** The anchor unification is the design's most elegant claim,
it absorbed five different things in one afternoon, and elegance is exactly what the protocol says
hides over-reach. Falsifying it is cheap now and expensive after S14.

---

## 4. What "small and safe" means here

Every step below satisfies all four, or it is not a step:

- **small** — one sitting; one reviewable diff.
- **safe** — the tree is **green before and after**. No step leaves a package red, and no step
  requires the next one to compile.
- **reversible** — revert the single commit and nothing else breaks. New code lands beside old
  code; old code is deleted only in the step that proves the replacement.
- **gated** — a gate that names what it defends, and a **control seen to fire** before the step is
  called done.

**S3 arms the standing standalone gate** (D2): from the first editor package, `make edit-test`
runs the editor's suite **without the Moros tree present** — its own fixtures, its own corpus. A
declared dep on `moros_map` for the cell schema is fine; *reading a Moros path from a test* is what
turns it red. Armed at the first package, it can never silently grow — which is the whole
difference from discovering it at extraction.

And one standing constraint from **D2**: every package these steps create lives in `lib/` **here**
until milestone `X`, but is written to library boundaries from its first commit — no consumer
import, no metre, opaque integer ids. The **back-reference count** is the extraction bar (*the
gates pass with `../moros` absent*), so it is worth measuring from the first step rather than
discovering at the last.

---

## 5. The steps

### Phase A — make the ground true *(before any design lands)*

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S1** | add `moros_ui/loft.lock` | `make lib-test` green, 5/5 packages. **Control:** remove it again → red | one generated file; measured to take the suite 0 → 46 in that package |
| **S2** | run **P1–P7**; commit each probe with its measured output under `probes/` | each probe prints a number, not a verdict | no production code touched; probes are throwaway by construction |

**S2 gates everything after it.** If P1 or P5 falsifies, §1 changes before a line of S6 is written
— which is the whole point of doing it here.

### Phase B — the host, and the first frame *(W0)*

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S3** | a new **`lib/moros_app/`** package (in-tree per D2): `fn main`, window via `graphics::create_renderer`, clear to a colour | loft's headless browser check (WebGL2, zero console errors) + a native smoke run. **Control:** break the clear → the colour-count check goes red | a new package; nothing existing imports it |
| **S3b** | `make edit-test` — the editor suite, standalone, with its **own** door-house fixture | the suite passes with `../moros` renamed away. **Control:** have one test read a Moros path → it must go red | one Makefile target and one fixture; the moros suite is untouched |
| **S4** | draw one hex — `hex_field` centre + `hex_grid` corners, through the renderer | the frame contains ≥ N distinct colours. **Control:** skip `upload_scene` → red | additive; the app is not yet a dependency of anything |
| **S5** | the frame-budget harness: print ms/frame at a stated map size, and **record the number in the plan** | a budget exists as a figure, not an impression. **Control:** draw 4× the cells → the number must move | measurement only |

### Phase C — the document and the chokepoint *(the load-bearing part)*

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S6** | `Doc` = model text + field + anchor set + journal. **Constructors and readers only** — no mutation yet | a `Doc` round-trips empty. **Control:** perturb one byte → the digest moves | pure addition; no caller |
| **S7** | **`doc_apply` — the only writer**, plus the **census gate**: no direct field mutation outside it | the census passes over the whole editor surface. **Control:** plant a direct `map_set_hex` call in a test → the census must fail | `doc_apply` initially wraps existing calls; behaviour unchanged, path constrained |
| **S8** | the journal **is** undo | undo of depth N restores byte-identically. **Control:** drop one journal entry → the digest diverges | undo is new alongside `moros_editor`'s; neither is deleted yet |
| **S9** | the journal **is** save | `save → load → save` byte-identical. **Control:** reuse the write path twice — `doc_write` **appends** (`L12`), so a fresh path per write, measured by content not size | new format beside the old; the old writer still runs |
| **S10** | the journal **is** replay | replaying from empty reproduces the document exactly. **Control:** inject one frame-rate-dependent step → the runs diverge | read-only over an existing journal |

⚠ **S8–S10 are one mechanism only if P6 said so.** If P6 falsified, they are three, and that is a
domain axis the design did not see — record it, do not force it.

### Phase D — W0's content: hills

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S11** | the height op, through `doc_apply` | raise → see → save → reload → undo, all byte-exact. **Control:** bypass the chokepoint → the census fails | the first real op; the old height path still exists |
| **S12** | terrain rendering from `Heights` | the budget from S5 still holds at the stated size. **Control:** rebuild everything per edit → the budget breaks | rendering only |
| **S13** | picking: consume `hex_field::hex_at`; **cross-check** against `moros_render::world_to_hex` | 0 disagreements over **both parities × both signs**. **Control:** perturb one side → it must fire | a comparison first; the deletion of the loser is its own later step |

**W0 is done here** — and W0 done means a walkable-in-3-D, savable, undoable, budgeted hill editor.

### Phase E — the anchor layer's first kind, and W1: roads

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S14** | anchor storage + `resolve`/`refuse` for a **line endpoint**, routed to `hex_fit` | the offer equals `snap_run_d24`/`snap_run_p`; the residual equals `run_end_dist`; **0 false accepts** against `rebuild`. **Control:** author a length between admissible multiples → must refuse, not snap | one anchor kind only. The closed set arrives kind by kind, each with its own gate |
| **S15** | the doorstep **shown** — reason, offer, residual on screen; nominal vs ordinal distinguished | a material refusal offers **nothing** and says so (`X68`); a length refusal offers the nearest. **Control:** offer `255` for `256` → the gate must reject the offer as a category error | presentation over S14 |
| **S16** | **`re-derive-or-report` inside `doc_apply`** — §1's invariant gets its home | delete geometry under an anchor → it is **reported**. **Control:** let it silently reattach to the nearest surviving surface → red | the checker runs and reports before anything acts on the report |
| **S17** | roads on terrain; **measure** `hex_way`'s lattice anchoring | either it anchors, or the failure is **recorded as a restriction** and carried forward | measurement, then a written restriction — hexbody's own census rule |

### Phase F — W2: fences, and the walk

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S18** | fences as `EdgeSet` content via `hex_edge`; a fixture at **both row parities** | edges marked *along* the line form one chain (`I-ALONG`), not a comb. **Control:** the hand-built comb must fail | new content kind; no existing path changes |
| **S19** | `hex_walk` — the swept controller on `hex_edge::sweep_path` with a `hex_body` proxy | **no speed and no `dt` crosses a wall**, on a fixture that *has* walls, both parities, two storeys. **Control:** the old instantaneous test at 5× speed **must tunnel** | lands **beside** `player.loft`; the app switches over in this step, the deletion is S20 |
| **S20** | delete `moros_sim/player.loft` + `collide.loft`; replace `make_flat_map()` with a walled fixture | the suite stays green **with fewer lines**. **Control:** the new fixture must be able to fail — re-run S19's control against it | deletion only after S19 proved the replacement |

### Phase G onward — W3–W8, as a step template rather than invented detail

**The design stops being decidable here, and saying so is the point.** Each remaining rung takes
the same five-step shape; the specifics are written when the rung starts, informed by what the rung
below it measured.

1. **the content kind** — its storage, through `doc_apply`, nothing else touched;
2. **its anchor kind** — `resolve` + `refuse` + the gate that shows `refuse` is not vacuous (P5's
   question, asked again per kind);
3. **`survive Ops`** — the kind through `{flip, place, combine, damage, seat}`, or a recorded
   restriction;
4. **the render path** — through `hex_scene`, consuming the library's emitter, never a second
   derivation;
5. **the budget** — the S5 number re-measured with the new content, and **written down**.

Per-rung, the one thing already known to be different:

- **W3 fields** — the one-outer-loop contract (`validate = 5` on a disconnected set). Step 3 is
  where the restriction gets stated.
- **W4 houses** — `write(rebuild(draw(read(T)))) = T` through the editor's own path. Step 1 is
  bigger here than anywhere else, and if it is *harder* than W0–W3 the ladder has found something.
- **W5 trees** — step 1 must persist **nothing** of the canopy; the gate is that the saved document
  is byte-identical with and without the canopy derived.
- **W6 props** — step 2 is the whole rung: `(side, t)` is the anchor, and sub-cell geometry has no
  slot (`OD-7`).
- **W7 vehicles** — blocked on two upstream answers (`G3`, and the missing `Rig`-to-`Rig`
  connector). **Raise both before designing step 1.**
- **W8 routines** — step 2 splits: the anchor *and* the binding list, with `unresolved ≠ broken` as
  its own gate.

---

## 6. What would falsify the whole design

Stated so it is checkable rather than defended:

- **The census cannot be written** (S7) — then `doc_apply` is not a chokepoint, it is a convention,
  and `N × silence` is unchanged. The design's core claim fails.
- **P5 finds two or more kinds with a vacuous `refuse`** — then "the same five operations" is
  wider than the domain, and the anchor layer is a family of two or three things wearing one name.
- **P6 falsifies** — undo, save and replay are three mechanisms; the journal's elegance was the
  over-reach.
- **The budget cannot hold at W0** — then incremental re-derivation is not a W-rung concern but a
  precondition, and Phase C is redesigned around it.

The residual the protocol names: **the axis no probe imagined.** For this design the likeliest one
is composition — an anchor kind that is fine alone and breaks when two are combined on the same
geometry — because that is precisely where hexbody's own census found its frontier (*"forms that
round-trip alone stop doing so together"*). It cannot be probed from the desk; the ladder's real
consumers are what will surface it, and the harvest belongs back in §3 as P8 when it does.
