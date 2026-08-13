# `B1b` — the boot switch that could not be asked for, and the line that replaced it

Two things live here. `ask.loft` is why `B1b.1` is not built the way the plan said; `auth.sh` is
the first half of what was built instead.

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

## `auth.sh` — does the panel say which authority it has? (`make probe-auth`)

Route 3 was taken: connect-or-local, **with the panel saying which**. The visible half comes
first, because an authority that can vary silently is the hazard route 2 was rejected for — so
`B1b.1a` is the line, and `B1b.1b` is the second authority.

**Three runs over one page build.** The file is emitted once and served three times; the only
difference is what answers the socket, so a difference in what the panel says is one the client
derived.

| | what answers `/ws` | what only this run can see |
|---|---|---|
| **A** | the real editor server | the **transition** — built before the socket, so `connecting` then `server` |
| **B** | nothing; the dial is refused | the **product claim** — with nothing there the page must never claim a connection, however long it is left open |
| **C** | a handshake, then silence | **who told the panel** — `panel_dirty` has exactly one possible writer here |

⚠ **RUN C EXISTS BECAUSE THE SABOTAGE PASSED.** Deleting the one write the step adds left run A
entirely green: the real server answers `1:` with `N:` and `H:` a frame or two later, and each of
those marks the panel for its own reasons. **A rebuild that happens anyway reads exactly like a
rebuild that was asked for.** In C not one message arrives — the probe prints the client's own
counters, all zero after 1200 frames, beside the verdict — so the only remaining explanation is
the write at the connect site.

⚠ **AND THE CONTROL FOR *WAS THERE A SOCKET* IS THE OTHER SIDE'S LOG.** The first version read the
client's own `connected` line, which is the claim under test, so `AUTH_SABOTAGE=assume` made the
control agree with the lie it existed to catch. `static.mjs` counts dials refused and dials
completed; the client's claim is checked *against* that, never trusted as it.

⚠ **AND THE STATUS IS READ OUT OF THE BUILT PANEL** — `p_status.ss_text`, post-`fit_text`, so a
string too long for its strip arrives carrying its own `..`. The check is exact equality against
the two whole strings; a substring test would call a truncation a pass.

```
AUTH_SABOTAGE=literal   the line as it was, a constant claiming the server → A1, B4
AUTH_SABOTAGE=nodirty   the fact moves and the panel is not told           → C4 alone
AUTH_SABOTAGE=assume    authority off the send, not off its succeeding     → B3, B4
```

⏭ **WHAT THIS DOES NOT CHECK IS THE WIRE.** `make probe-b1a` owns that — the same key sequence
must still send what it always sent, and this step must move nothing but a panel.
