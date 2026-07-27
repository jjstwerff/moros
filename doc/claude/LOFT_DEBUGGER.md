# The loft debugger — what it does, and what it cannot do yet

Tested 2026-07-27 against the installed `loft`, with the editor server as the target.

**The short version: it is genuinely good on pure-loft code and cannot touch our server.**
Two independent limitations stop it, both reproduced below, both filed as `H13`.

## Using it

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

## ⚠ What it cannot do (yet)

### 1. It ignores `--lib`, in every position

```
loft debug src/editor_server.loft:385 --lib lib/   → Error: Undefined type Mat4 …
loft --lib lib/ debug src/editor_server.loft:385   → Error: Undefined type Mat4 …
loft debug src/editor_server.loft:385              → Error: Undefined type Mat4 …
```

**Control:** `loft --interpret --lib lib/ src/editor_server.loft` compiles and runs the same
file with zero errors. So the program is fine and the debugger's resolution differs.

Any project whose libraries live in a local `lib/` — which is every group in this tree — is
undebuggable by this route.

### 2. A CALL that reaches native code kills the session

Narrowed by bisection — it is neither "a registry package" nor "an import":

| | under `loft debug` |
|---|---|
| `use web;` with **no call** | ✅ runs |
| `use time;` + `from_ymd(2026, 7, 27)` — pure-loft arithmetic in a registry package | ✅ runs |
| `use random;` + `rand_seed(7)` / `rand(1, 10)` | ❌ dies |
| `use web;` + `sleep_ms(5)` | ❌ dies |
| `use server;` + `listen(port)` | ❌ dies |

```loft
use web;
fn main() { sleep_ms(5); x = 1 + 1; println("web ok {x}"); }
```

```
(dbg) runtime error in the paused run — debug session abandoned (session preserved)
loft>
```

So the boundary is **a call crossing into native code**, not the package it came from: the
same package is fine until you call the part of it that is native, and a registry package
whose functions are ordinary loft (`time`) is fine throughout. Everything above runs
correctly under `loft --interpret`.

**The error is never named** — no message, no location — and the prompt silently changes
from `(dbg)` to `loft>`, a post-mortem REPL where `:continue` reports *"unknown command"*.
The likeliest reading of that is a typo, not "the session ended".

### What that means for a websocket server

**A loft server with a live websocket cannot be debugged with `loft debug` today.** It needs
`server` and `web`, which is limitation 2, and ours also needs `--lib`, which is limitation
1. The breakpoint is never reached; the run fails before `listen`.

## What to use instead, until then

1. **`println` at the seam.** Crude and effective, and the editor's message loop is already
   instrumented this way.
2. **Lift the logic into a library and gate it.** `hex_world` is testable precisely because
   the world model has no server in it — the same split that makes the model portable makes
   it debuggable.
3. **A probe program.** `lib/hex_world/probe/sparsity.loft` runs the same assertions as a
   `main()`, which is also how row 2 was proven while `loft test` was crashing. A `main()`
   using only pure loft *is* debuggable, so a probe that reproduces a library fault can be
   stepped even when the server cannot.

## See also

- [LOFT_HANDOFF.md](LOFT_HANDOFF.md) — `H13` files both limitations upstream
- `loft/doc/claude/DEBUG.md` — debugging *loft itself*, a different subject
