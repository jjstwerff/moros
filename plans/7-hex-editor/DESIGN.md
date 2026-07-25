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
hides over-reach. Falsifying it is cheap now and expensive after S23.

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

### Phase B — the build service, and the first frame *(W0)*

⚠ **The browser is the primary target, not a port** *(user, 2026-07-25: "we have to have a good
build service; an OpenGL is in the works but a browser is easier to test for me. You are on a
laptop but I connect to it with ssh")*. **Measured on this box, 2026-07-25:**

| fact | measurement |
|---|---|
| `DISPLAY` / `WAYLAND_DISPLAY` | **both empty** — this is a headless SSH session (`SSH_CONNECTION` set) |
| a native OpenGL window | **cannot open here, and could not be seen if it did** — so a "native smoke run" is not a gate, it is a wish |
| `loft --html hello.html hello.loft` | ✅ **works** — one command, a 246 KB self-contained page (WASM 162 KB) |
| `chromium` · `chromium-browser` · `firefox` | ✅ present; loft's checker looks for exactly those names, so it **runs rather than skips** |
| `node` | ✅ v22.23.0 |
| the whole loop, end to end | ✅ **proven**: build → serve → `tools/html_render_check.mjs` → `{"ok":true,"eventCount":11}`, exit 0 |

**So `--html` is where every rung is verified, and native GL is a later concern** — D3's "one
source, four targets" still holds, but the *testable* target here is one. Any step whose gate needs
a window on this machine is unrunnable and must not be written.

**The build service, as three targets** — "good" means the user can see a change without asking me
to describe it:

```
make html     # loft --html html/editor.html src/editor.loft   → the artifact
make serve    # http.server on $(PORT), 127.0.0.1              → reachable over the ssh tunnel
make check    # node $(LOFT)/tools/html_render_check.mjs \
              #      http://127.0.0.1:$(PORT)/editor.html \
              #      --canvas '#gl' --canvas-min-colors N      → THE GATE
```

The user's path is an SSH forward — `ssh -L 8000:localhost:8000 …`, then `localhost:8000` in their
own browser — which works regardless of LAN or firewall, and is why `serve` binds **127.0.0.1**
rather than `0.0.0.0`.

⚠ **`make stop` is `killall python3` today, and that is a hazard on a shared box** — it kills every
Python on the machine, including another agent's. Replace it with a PID file in the same step that
adds `make check`.

**Reuse, do not rebuild:** `html_render_check.mjs` is loft's, and it already *is* the control this
plan invented — Layer 1 fails on any console error or exception; Layer 2 screenshots the canvas and
counts distinct RGB triples, catching *"a WebGL2 context that never gets drawn into stays in
clearColor and the screenshot is one uniform color."* That is S4's control, already written, already
upstream. Seam rule 5 applies: consume it.


| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S3** | a new **`lib/moros_app/`** package (in-tree per D2) + **`make html` / `serve` / `check`**, and a PID file replacing `killall python3` | `make check` is green on a page that clears to a colour. **Control:** break the clear → Layer 2's colour count goes red | a new package and three Makefile targets; nothing existing imports it |
| **S3b** | `make edit-test` — the editor suite, standalone, with its **own** door-house fixture | the suite passes with `../moros` renamed away. **Control:** have one test read a Moros path → it must go red | one Makefile target and one fixture; the moros suite is untouched |
| **S4** | draw one hex — `hex_field` centre + `hex_grid` corners, through the renderer | `make check --canvas-min-colors N` passes. **Control:** skip `upload_scene` → one uniform colour → red. *This is the check's own documented failure mode, so the control is known to fire before we write it* | additive; the app is not yet a dependency of anything |
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

### Phase D — what a hills editor needs *(thick, and deliberately not general)*

W0 is **thick and narrow**: fully functional for the very little it does. These steps build what
**hills** need — not a shell designed against nine unbuilt rungs. Whether a piece turns out to be
reusable shell or hills-specific is **W1's** finding, not W0's declaration.

⚠ **The failure to avoid in this phase is generalising early.** One tool, one view, one storey, no
selection, no palette of kinds, no second client. A `ToolDef` *table* is not built here — there is
one tool, so a table would be a boundary drawn against imagined cases.

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S11** | camera — orbit · pan · zoom · zoom-to-fit, on `moros_render`'s (cross-checked, then promoted) | ray → plane → hex round-trips to the picked cell. **Control:** perturb the projection → the round trip fails | promotion of tested math; the old camera stays until it is unused |
| **S12** | picking + hover: the hex under the cursor highlights, click selects | picked cell equals `hex_field::hex_at` over **both parities × both signs**, 0 disagreements. **Control:** perturb one side → it fires | S13's cross-check made concrete; the loser is deleted in its own step |
| **S13** | the panel: a toolbar with **one** button, a palette region, a status strip — `moros_ui`, promoted | the panel renders and routes a click to the height tool. **Control:** click the gap between widgets → routed to the world, not the tool. *(No tool table: one tool. The table is W1's, when a second case exists)* | `moros_ui` is already the best-tested module (46/46 with its lock) |
| **S14** | the status readout — `q · r · cy · h` under the cursor, live | it tracks the hover cell. **Control:** move the cursor off the map → it must read *nothing*, not stale | display only |
| **S15** | **undo granularity**: a drag is **one** journal entry, not forty | `batch_begin`/`batch_end` around a drag; one `Ctrl-Z` reverts the whole stroke. **Control:** omit the batch → undo takes forty presses, and the gate counts them | the journal already exists (S8); this is a bracket over it |
| **S16** | save / load to a file, driven from the shell | `save → load → save` byte-identical **through the UI path**, not just the API. **Control:** `doc_write` twice to one path → `L12`'s append bites, so a fresh path per write | S9's gate, now exercised the way a person exercises it |

**W1 is what turns this into a shell.** Roads bring the second tool, the first anchor kind and the
first doorstep — and *that* is when the boundary between "shell" and "hills-specific" gets drawn,
by two real cases. If W1 lands cheaply the guess fit; if W1 forces these steps to be reshaped, the
shell has been **earned**. Both are success; generalising here in advance is the only failure,
because it makes W1's change expensive and arguable instead of cheap and obvious.

### Phase E — W0's content: hills, thick

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S17** | the height op through `doc_apply`; click sets, drag paints | raise → see → save → reload → undo, byte-exact. **Control:** bypass the chokepoint → the census (S7) fails | the first real op |
| **S18** | brush sizes 1 / 7 / 19 (centre + rings) | brush 7 writes exactly 7 cells, and **one** journal entry. **Control:** a brush at a chunk boundary must still write 7, not 4 | one parameter over S17 |
| **S19** | absolute vs relative mode; scroll ±1, shift+scroll ±6 | relative adds to each cell's own height. **Control:** relative on a sloped patch must preserve the slope, absolute must flatten it | a mode flag over S17 |
| **S20** | terrain rendering with height shading, so the hills are legible | the S5 budget still holds at the stated size. **Control:** rebuild the whole scene per edit → the budget breaks | rendering only |
| **S21** | the height palette: value, step buttons, **gradient preview** against the map's range — **built for heights, not as a generic palette** | the preview's min/max track the visible cells. **Control:** raise a hill past the old max → the scale must move | display over S13 |
| **S22** | **W0 acceptance — use it.** Build a small landscape by hand, save, reload, undo through it | the frame budget holds *while editing*, undo returns byte-identically from any depth, and the file reloads exactly. **Control:** the session must be reproducible from its journal alone | no new mechanism; this is the rung's own proof |

**S22 is the rung, not a formality.** Thick means the acceptance is *use*, and the number that
comes out of it — ms/frame while editing a real landscape — is the budget every later rung is held
to.

### Phase F — the anchor layer's first kind, and W1: roads

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S23** | anchor storage + `resolve`/`refuse` for a **line endpoint**, routed to `hex_fit` | the offer equals `snap_run_d24`/`snap_run_p`; the residual equals `run_end_dist`; **0 false accepts** against `rebuild`. **Control:** author a length between admissible multiples → must refuse, not snap | one anchor kind only. The closed set arrives kind by kind, each with its own gate |
| **S24** | the doorstep **shown** — reason, offer, residual on screen; nominal vs ordinal distinguished | a material refusal offers **nothing** and says so (`X68`); a length refusal offers the nearest. **Control:** offer `255` for `256` → the gate must reject the offer as a category error | presentation over S14 |
| **S25** | **`re-derive-or-report` inside `doc_apply`** — §1's invariant gets its home | delete geometry under an anchor → it is **reported**. **Control:** let it silently reattach to the nearest surviving surface → red | the checker runs and reports before anything acts on the report |
| **S26** | roads on terrain; **measure** `hex_way`'s lattice anchoring | either it anchors, or the failure is **recorded as a restriction** and carried forward | measurement, then a written restriction — hexbody's own census rule |

### Phase G — W2: fences, and the walk

*(W1's steps are written when W1 starts, per §5's tail — and are expected to be **markedly fewer
than W0's**, because the shell is already paid for.)*

| # | change | gate · control | why it is safe |
|---|---|---|---|
| **S27** | fences as `EdgeSet` content via `hex_edge`; a fixture at **both row parities** | edges marked *along* the line form one chain (`I-ALONG`), not a comb. **Control:** the hand-built comb must fail | new content kind; no existing path changes |
| **S28** | `hex_walk` — the swept controller on `hex_edge::sweep_path` with a `hex_body` proxy | **no speed and no `dt` crosses a wall**, on a fixture that *has* walls, both parities, two storeys. **Control:** the old instantaneous test at 5× speed **must tunnel** | lands **beside** `player.loft`; the app switches over in this step, the deletion is S20 |
| **S29** | delete `moros_sim/player.loft` + `collide.loft`; replace `make_flat_map()` with a walled fixture | the suite stays green **with fewer lines**. **Control:** the new fixture must be able to fail — re-run S28's control against it | deletion only after S19 proved the replacement |

### Phase H onward — W3–W8, as a step template rather than invented detail

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
