# The loft debugger — how to drive it against the editor

Tested 2026-07-27 against the installed `loft`, with the editor server as the target.

> ## ✅ H13 is FIXED — the server IS debuggable, over `--rpc`
>
> Both limitations reported earlier are gone: `--lib` resolves, and a session survives
> `server::listen` and a live websocket. Verified end to end below — a breakpoint inside
> the terrain brush, hit by a browser client pressing a key, with locals readable and
> editable at the frame.
>
> **The interactive `(dbg)` prompt is the human's tool; agents should use `--rpc`**, which
> is what the `loft-debug` skill documents and what all of this was verified against.

## The recipe that works — a live websocket server

```sh
printf '%s\n' \
 '{"id":1,"req":"launch","file":"/abs/path/src/editor_server.loft"}' \
 '{"id":2,"req":"setBreakpoints","file":"editor_server.loft","breakpoints":[{"line":385}]}' \
 '{"id":3,"req":"run"}' \
| loft debug src/editor_server.loft --rpc --lib lib/
```

**Order matters:** `launch` loads without running, `setBreakpoints` goes between, `run`
starts it. Check `verified:true` in the `setBreakpoints` reply — `false` means the line has
no breakable code and the stop will never come.

Then connect a client and act. Program output arrives as events on the same pipe:

```json
{"event":"output","category":"stdout","text":"editor: client 0 connected"}
{"event":"stopped","reason":"breakpoint","frame":{"function":"brush","line":385,
  "locals":[{"name":"tq","value":"10"},{"name":"tr","value":"0"},
            {"name":"amp","value":"6"},{"name":"rad","value":"7"},
            {"name":"wld","value":"<&World>"},{"name":"dq#index","value":"<unset>"}]}}
```

That is the raise brush, paused mid-stroke, with the hex it is about to modify in view.

### Inspecting and editing at the frame

```json
{"id":4,"req":"eval","expr":"amp * rad"}          → {"ok":true,"value":42}
{"id":6,"req":"setValue","target":"amp","value":"99"}  → frame echoed, amp = 99
{"id":7,"req":"eval","expr":"amp"}                → {"ok":true,"value":99}
```

**`setValue` is the one worth remembering.** A hypothesis about the brush can be tested by
injecting a value into the running editor — no edit, no restart, no reconnecting a client.

### Reading the frame honestly

- `<&World>` — a reference, shown as its type rather than dumped.
- `<unset>` — in lexical scope but not yet assigned on this path (`dq#index`, the loop
  counter, before the loop runs). It is **not** a value; `eval` on it returns null.
- `__ref_N` — compiler temporaries, not yours.

⚠ **A `null` from `eval` is ambiguous** and the frame is what disambiguates it: out of
scope, `<unset>`, or genuinely null all read the same. Check the `stopped` frame before
concluding a field is empty.

## Residual: library calls inside `eval`

`eval` handles locals and operators. A call to a library function does not resolve:

```json
{"id":5,"req":"eval","expr":"hex_distance(tq, tr, 0, 0)"}  → {"ok":true,"value":null}
```

`hex_distance` is called on the very next line of the paused function, so it is available
to the program but not to `eval`. Minor — arithmetic over locals covers most questions —
but worth knowing before reading that `null` as an answer about the world.

## Historical: what was broken (H13, fixed)

Kept because the shape recurs. Before the fix, `--lib` was ignored in every position
(`Undefined type Mat4`, while `loft --interpret --lib lib/` ran the same file fine), and a
call reaching native code killed the session with an unnamed *"runtime error"* — bisected
to the call rather than the package or the import, since `time::from_ymd` was fine and
`random::rand_seed`, `web::sleep_ms` and `server::listen` were not.

## The interactive prompt (`loft debug <file>:<line>`)

```bash
loft debug <file>:<line>          # break at a line, then an interactive REPL
```

Argument order is fixed — `<file>:<line>` must follow `debug` immediately. Anything else
gives *"usage: loft debug &lt;file&gt;:&lt;line&gt; (missing `:<line>`)"*, including the
otherwise-natural `loft debug --lib lib/ file:12`, which reads as though the *line* were
missing when the real complaint is the argument order.

### Commands

| command | does |
|---|---|
| `:step` `:s` | into |
| `:next` `:n` | over |
| `:finish` `:o` | out |
| `:continue` `:c` | run to the next hit of the breakpoint |
| `:vars` | locals in the paused frame |
| `:watch <expr>` | watch an expression |
| `:undo` `:u` / `:redo` `:r` | step back and forward — it is a time-travelling debugger |
| `name = <expr>` | **edit a local**: scalar, text, enum, `pt.x`, `v[i]`, or a whole struct/vector |
| any expression | evaluated in the paused frame |
| `:quit` | leave |

### A worked session

```
$ printf ':vars\na + b\n:continue\n:vars\n:quit\n' | loft debug /tmp/dbg1.loft:2
⏸ paused in add | a = 0, b = 0
(dbg) ⏸ paused in add | a = 0, b = 0     ← :vars
(dbg) 0                                   ← evaluated `a + b` at the frame
(dbg) ⏸ paused in add | a = 0, b = 1     ← :continue, next loop iteration
```

The frame line names the function and prints every local, so a loop's progression is
readable without any instrumentation. Being able to **assign** to a local is the part worth
knowing: a hypothesis can be tested by editing the value rather than editing the source and
re-running.

## ⛔ AND THE OTHER INSTRUMENT IN THE SAME BOX: `LOFT_PROFILE=1`

**loft ships a sampling profiler, and this tree spent a session hand-rolling timing probes
without it.** Asked *where is the cost going* inside a 300-second test file, the reflex was
to read the source, form a suspect and write a staged timing harness. The project owner's
answer was one line: *use the loft profiler for this.* A hand-rolled probe measures what you
already suspect; the profiler measures what is there.

```
LOFT_PROFILE=1 loft test tests/aim.loft::test_aiming_and_tracing_disagree 2>&1 | tail -40
```

⚠ **THE REPORT GOES TO STDERR**, so `> out.txt` keeps the test results and silently drops
the profile — and an empty section reads as *no profile was produced*, which is a different
wrong conclusion reached the same way. Redirect **both**.

⚠ **AND IT RENDERS AT PROCESS EXIT**, so a program without a clean shutdown gives nothing.
`LOFT_PROFILE_EVERY=30` prints a growing report while running (each covers the run *so far*,
not the interval), and `kill -USR1 <pid>` dumps a **window** and keeps going — dump, drive
the load, dump again, read the difference. That is the way to profile `editor_server.loft`,
which otherwise dies to a `SIGTERM` with nothing to say.

✅ **AND FOR AN INTERPRETED RUN IT IS THE ONLY CORRECT INSTRUMENT, STRUCTURALLY.** A loft
call creates no machine frame, so `perf` walks the interpreter's own stack and returns
`_start → … → execute_argv → put_stack` for **every program ever run** — the wrong stack,
not a truncated one, and no sampling frequency fixes it. loft samples its own
`State::call_stack` instead and resolves to `(function, file:line)`. `loft test` always
interprets, so a suite is exactly the case this is for; samples are merged on labels rather
than on positions, because each test compiles its own bytecode and a `pc` means something
different in each.

⚠ **`LOFT_NET_PROFILE=1` (or `=trace`) is the third one**, and its metric is **margin**
rather than duration — an operation that completed but close enough to a deadline that a
slower box would have missed it, which is what makes a networked gate flake and what no
other instrument reports. Armed with nothing recorded it says so, rather than printing
nothing: a silent instrument and a broken one look identical from outside.

⛔ **AND `w_tau` DOES NOT REPLACE IT — THE TWO SEE DIFFERENT COSTS.** This tree's standing
rule is *cost is measured in `w_tau`, not seconds*, and it is right about what it covers: the
edit clock bumps once per write that **changed** something, so a gesture's write cost is an
exact integer, identical on any box and any world size. **It counts writes.** A gesture whose
bill is a flood that READS thousands of cells and writes none is `w_tau = 0` and minutes
long. Reach for `w_tau` to compare gestures, and for the profiler to find where a run went.

Upstream: `loft/doc/claude/PERFORMANCE.md § Profiling a run` is the how, and
`PROFILE_ORACLE.md` is what the instrument is itself checked against — a corpus of programs
whose hot spot is known **in advance**, including a negative control, written because *"every
trap this tooling has hit produced a plausible profile, not an obviously broken one."*

## Still worth reaching for instead, sometimes

A **probe program** — `lib/hex_voxel/probe/sparsity.loft` — runs library assertions as a
`main()`. It is how row 2 was proven while `loft test` was crashing, and it stays the
cheaper tool when the question is about the library rather than about the running editor:
no client to drive, no timing to arrange.

## See also

- [LOFT_HANDOFF.md](LOFT_HANDOFF.md) — `H13` files both limitations upstream
- `loft/doc/claude/DEBUG.md` — debugging *loft itself*, a different subject
