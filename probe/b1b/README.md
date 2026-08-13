# `B1b` — the boot switch that could not be asked for, and the two authorities that replaced it

Three things live here. `ask.loft` is why `B1b.1` is not built the way the plan said; `auth.sh` is
what was built instead, in two steps; `press.mjs` is the browser half that had to wait for a
sentence rather than for a clock.

## `ask.loft` — the measurement that blocked the boot switch

```
$ timeout 20 loft --lib lib/ probe/b1b/ask.loft
asking
$ echo $?
124
```

`host_output` then `host_input` **hangs** when no host is listening. `B1b.1`'s boot switch —
*the page asks which authority it is* — was designed on `P2`'s result that an unanswered
request comes back empty. ⚠ **`P2` measured a host that DECLINED one message, not an ABSENT
one**, and only the first of those terminates. Filed as
[loft#891](https://github.com/loft-lang/loft/issues/891).

`host_name` is not a way round it either: the symbol is in the binary, the function is not —
`error: Unknown function host_name`.

Run it before believing this is still true; a fix upstream turns it into a two-line pass.

## `auth.sh` — which authority is this, does it say so, and does the second one build the same world? (`make probe-auth`)

Route 3 was taken: connect-or-local, **with the panel saying which**. The visible half came
first, because an authority that can vary silently is the hazard route 2 was rejected for — so
`B1b.1a` is the line and `B1b.1b` is the second authority.

**Three runs over one page build.** The file is emitted once and served three times; the only
difference is what answers the socket, so a difference in what the panel says is one the client
derived.

| | what answers `/ws` | what only this run can see |
|---|---|---|
| **A** | the real editor server | the **transition** — built before the socket, so `connecting` then `server`. And that a live server is never given up on: it connects on **dial 4** |
| **B** | nothing; the dial is refused | the **second authority**. It stops dialling, says so, and then **writes what it is pressed** — into a world `editor_run` is held against |
| **C** | a handshake, then silence | **who told the panel**, and the bound's negative control: a socket that opens and then says nothing must not be read as no socket at all |

⚠ **RUN C EXISTS BECAUSE THE SABOTAGE PASSED.** Deleting the one write `B1b.1a` adds left run A
entirely green: the real server answers `1:` with `N:` and `H:` a frame or two later, and each of
those marks the panel for its own reasons. **A rebuild that happens anyway reads exactly like a
rebuild that was asked for.** In C not one message arrives — the probe prints the client's own
counters, all zero after 1200 frames, beside the verdict — so the only remaining explanation is
the write at the connect site. ⏭ At `B1b.1b` that run earned a second job for free: it is the one
situation where a page that inferred its authority from *silence* rather than from *a refused
dial* would swap under a server that is right there.

⚠ **AND THE CONTROL FOR *WAS THERE A SOCKET* IS THE OTHER SIDE'S LOG.** The first version read the
client's own `connected` line, which is the claim under test, so `AUTH_SABOTAGE=assume` made the
control agree with the lie it existed to catch. `static.mjs` counts dials refused and dials
completed; the client's claim is checked *against* that, never trusted as it.

⚠ **AND THE STATUS IS READ OUT OF THE BUILT PANEL** — `p_status.ss_text`, post-`fit_text`, so a
string too long for its strip arrives carrying its own `..`. The check is exact equality against
the three whole strings; a substring test would call a truncation a pass.

### The claim `B1b.1b` makes, and why it needs two instruments

The page presses `ArrowUp ArrowUp h f g ArrowDown` and `editor_run` runs
`probe/b1b/scripts/local.keys` — the same six verbs at the same author — and the two are compared
on **the world** and on **the session**:

```
the page:   world 32952:1545220309   session: … trunk true/5.196152422706632
the runner: world 32952:1545220309   session: … trunk true/5.196152422706632
```

- **`GROUND=0`**, because the runner seeds a 61×61 patch of `SURFACE_MAT` that the server never
  lays and local mode therefore must not either. Measured: the same six verbs leave **τ 4079**
  seeded and **τ 358** not. `E1γ` is why the empty world is legal — absence *is* the floor.
- **`hex_voxel::world_key`** is called by both sides. Two programs each spelling their own digest
  is `W1`'s two-encoders finding one layer out.
- **`hex_editor::session_digest`** likewise, and it is not optional: a ring writes its edges to
  the store and its **trunk** to the session, so `scratchsession` — press into a session nobody
  keeps — leaves a **byte-identical world** and a different scene. `V1`'s pair, one driver out.

⚠ **THE VERB COUNTS ARE BLIND TO WHERE THE AUTHOR STOOD.** A ring of the same radius writes 42
edges wherever it is laid, so `elsewhere` (the author one world-unit over) leaves every count and
every sentence in place. Only the world key moves.

⚠ **`place` IS REFUSED ON BOTH SIDES AND THE FIXTURE KEEPS IT.** At yaw 0 on the origin a
footprint has no mitred corners, which `B1a` found through the server. A refusal that reproduces
in both drivers is evidence; dropping it from the script would be choosing the fixture to suit
the answer.

### `press.mjs` — wait for a sentence, not for a clock

`probe/b1a/drive.mjs` presses as soon as the client has BOOTED, which is right when the subject is
what a key sends over the wire. Here the decision is `LOCAL_AFTER` frames later, so this driver
polls the page's console for the client's own line before pressing, and **reports the miss as a
miss**: pressing anyway would produce a transcript with no local lines in it, which is exactly
what a broken local mode produces.

### Nine sabotages, and where each one is red

| sabotage | red where | and nowhere else |
|---|---|---|
| `literal` — the status line as it was, a constant claiming the server | `A1` the panel's first word · `B4` · `B7` | |
| `nodirty` — the CONNECT fact moves and the panel is not told | `C4` **alone** | green in A and B, which is why C exists |
| `assume` — authority off the send, not off its succeeding | `B3`–`B11`, nine of them | invisible to A: with a server there, assuming is right |
| `nolocal` — it never gives up dialling | `B7` `B8`×5 `B9` `B10` `B11` | |
| `nolocaldirty` — it goes local and the panel is not told | `B7` **alone** | `nodirty`'s mirror, one authority over |
| `sendlocal` — local is announced and it sends anyway | `B8`×5 · `B10` · `B11` | ⚠ **the panel is GREEN** — a status line alone would call this a pass |
| `elsewhere` — the same six verbs, one world-unit over | `B10` **alone** | every count, every sentence AND the whole session unchanged |
| `scratchsession` — pressed into a session nobody keeps | `B11` **alone** | the world **byte-identical** |
| `eager` — one unanswered dial is enough to give up | `A2` `A3` **`A4`** · `B1` `B6` · `C2` `C4` **`C5`** | the two starred are the hazard: a live server given up on, and silence read as absence |


⏭ **WHAT THIS DOES NOT CHECK IS THE WIRE.** `make probe-b1a` owns that — the same key sequence
must still send what it always sent when a server IS there, and this step must move nothing about
attached mode at all.
