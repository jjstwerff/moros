# gates — split by what they are allowed to break

Two groups, deliberately apart (user, 2026-07-25: *"make your instruments apart
for the character that walks … the walking is correct and would break many times
while we enhance it"*).

| | drives the character by | may break when |
|---|---|---|
| **`character/`** | **walking** — holding keys, real locomotion | locomotion changes. That is its job: it is the gate ON the character |
| **`world/`** | **placing** — `7:<x>,<z>,<yaw>`, no walking at all | the world model changes — terrain, streaming, levelling |

**Why this split, earned rather than tidy.** The world gates used to walk the
character into position. That made every one of them a hostage to walking speed,
stride and step timing — and when the speed doubled, `terrain` and `level` failed
**against working code**, because a fixed-millisecond walk carried the character
past the thing it was measuring. A gate for the ground should state where the
character *is*, not walk it there and hope.

The character gates keep walking, because walking is what they measure. They are
expected to churn as locomotion grows a step limit, a fall, collision.

## The protocol these drive

⚠ **Read [`doc/claude/WIRE_PROTOCOL.md`](../../doc/claude/WIRE_PROTOCOL.md) before writing or
changing a gate.** It lists all 28 message ids, every acknowledgement string, and the seven
ordering guarantees that let a gate wait on the server instead of on the clock — plus the traps,
each of which cost a real defect: a fixed sleep that read 0 vertices on every run, a tolerance
that latched, a control leg that measured its own timeout, and a comparison across two derived
domains that failed three runs in four.

**The rule, in one line: wait for what the server SAYS, never for a count of milliseconds.**
The one exception is the poll interval inside an `ack` helper, and even that has hidden a defect
once — a 100 ms poll covers a ~16 ms tick.

## Run

```sh
make gate-world       # terrain, streaming, levelling — fast, deterministic
make gate-character   # walk, climb, keyboard-only navigation
make gate             # both
```

Each restarts the server first: **server state persists between runs** —
position, yaw, peaks, the level flag — so back-to-back probes are not
independent and produced non-reproducible numbers until every run got a fresh
one.
