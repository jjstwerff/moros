# `WP` — the three probes of [WALL_PUSH](../../doc/claude/WALL_PUSH.md) §7, predicted first

## What each asks

1. **The quantum (`@WP-0c`).** §0 tabulates the parallel-lattice-line spacing — `0.866`,
   `0.5`, `0.1387` by class — and calls it a **lower bound**, because a run is anchored at a
   triangle-lattice **vertex** and the next parallel line need not carry one. The probe
   searches, per `d24`, for the shortest integer `(da, db)` whose world displacement is
   **perpendicular** to the heading and whose translated anchor is still `tri_is_vertex`
   with `wall_run_ok` true.

2. **The obstacle (`@WP-7`).** A transitively pushed structure must take the *same
   displacement vector*. That is possible for any structure exactly when the displacement is
   a **triangle-lattice vector**, because a lattice vector maps the lattice to itself. So
   probe 1's answer decides probe 2: if the quantum is a lattice vector, a rigid push is
   always available and refusal **R6** is unnecessary.

3. **The round trip (`@WP-16`).** Stamp a wall, translate the anchor by the quantum, stamp;
   translate back, stamp; compare the two fields edge for edge.

## The predictions

| | prediction |
|---|---|
| 1 | the shortest admissible translation is **strictly longer** than §0's line spacing for at least one class — a lattice line that carries no vertex cannot be an anchor |
| 1 | it exists for **all 24** headings; the lattice is symmetric enough that no direction is stuck |
| 2 | it **is** a lattice vector by construction, so a rigid transitive push is always available and **`@WP-7`'s worry — and refusal R6 — is refuted** |
| 3 | the round trip is **edge-for-edge identical**, and the control (one step along the wall instead of across it) is **not** |

⚠ **The second row of prediction 2 is the interesting one, because it contradicts the
document.** §0's incommensurability says no whole number of one class's *steps* equals a
whole number of another's — but a rigid translation does not ask each structure for its own
steps, it asks whether one vector serves all. Those are different questions and §7's probe 2
exists because I could not tell from the algebra which one `@WP-7` was really asking.

## The instrument check, before any absence is believed

- The exact integer perpendicularity test is derived from `tri_x`/`tri_y` by hand; it is
  checked against the **float** dot product on every pair before it is trusted.
- Probe 3's comparison is checked against a displacement it should REJECT — one step *along*
  the wall rather than across it — because a comparison that always says *identical* is what
  a probe that stamps nothing also says.
