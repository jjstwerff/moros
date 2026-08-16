# `T4` — the headless runner builds the server's world, to the byte

Plan 22 `T4`, [WALK_TICK.md](../../doc/claude/WALK_TICK.md). `send 6:` LEVEL is a
performed message, so the pad `deck.keys` lays by **walking** can be laid with no server,
no socket, no browser and no clock. That is the acceptance the design has carried since
`T0`, and it is the whole `T` sequence's claim in one line.

## The numbers

    sh probe/t4/run.sh

| | headless, `GROUND=0` | the server, from [probe/t1](../t1/README.md) |
|---|---|---|
| `deck.keys` — a 90-tick walk with levelling ON | `cea971a07899e420b344c0054567f4e1` | **the same** |
| `cellar.keys` — four teleports with levelling ON | `c96b2ce7a569fa2dd88577a71a507f48` | **the same** |
| `deck.keys` at `step 45` | `5775ad1d45a35ef966bb22c60e016795` | **the same** |

⚠ **The third row was written as a blindness control and answers a second question
nobody asked.** It exists so that *does a shorter walk move the world at all* has an
answer — without it, row A is satisfied by any program hashing to a constant. It happens
to land on the number `probe/t1` recorded for the SERVER at that count, so **the two
drivers agree at two different tick counts**, and the equality is about the walk rather
than about one lucky plateau.

## What the controls are for

Rows A and B compare against constants a **native server** produced. A constant compared
against a program that writes nothing is satisfied the day the world stops being written,
so two more rows carry the weight:

| row | fixture | result |
|---|---|---|
| C | `step 90` → `step 45` | `5775ad1d…` — the fixture can see the walk |
| D | both `send 6:` lines removed | `89cf1a3b83ac997a440948ff17d4bf3b` — the pad is the levelling's |

⛔ **Row D is the control probe 4 earned.** `deck.keys` answers `cea971a0…` to three
different collision-proxy policies, because nothing in it blocks — so the one thing that
script CAN see is the stamp, and D is what proves the acceptance is measuring it rather
than the raise and the storey around it.

⚠ **`sh probe/t1/run.sh <script> <world>` is how the server's side is re-measured.** It
is not in `make fast` because it costs a native build and a live socket; if a row here
ever reds for a reason that turns out to be the server's, that is the command to run.

## ⛔ Row F exists because the sweep found three green rows over an untested clause

`level_off` does two things — it clears the mode **and** puts the feet back on the
ground. Dropping the second left **both acceptance worlds byte-identical and all five of
`cellar.keys`'s `feet` stations unmoved.** Two reasons, both about what levelling is:

- levelling brings the ground **to** the feet, so where a walk has just levelled, the
  ground already equals the frozen height and putting the feet back is a no-op;
- every `feet` in `cellar.keys` follows a **teleport**, and a teleport re-reads the
  ground itself — so the height is fixed before anything asks.

`release.keys` is the second instrument: freeze on the flat, teleport onto a hill
(levelling holds the feet at the frozen height across a teleport, by design), release.

    with level_off's second clause     feet 0.084   — the hill's surface
    without it                         feet 0       — standing inside the hill, calmly

⚠ **The defect that clause exists for is written at `tick.loft`** — *without this they
keep the frozen height until the next step, so you could stand in the air over a crevice
you had just cut and not know until you moved.* Nothing tested it until the sweep asked.

## ⚠ `feet` agrees with the server by VALUE and not by `diff`

`script.mjs` pads — `toFixed(3)` and `toFixed(2)` — so `cellar.keys`'s stations read
`feet 4.250 at 17.00,0.00` there and `feet 4.25 at 17,0` here. Measured against a native
server, **all five agree to every digit either side prints**: 4.25, 4.25, 3.25, 2.25,
1.25 at 17, 22.5, 20.8, 19, 17. A transcript is comparable by value, and the runner's
comment says so rather than claiming a match it does not have.

## What it cost elsewhere, and where those rows went

`deck.keys` and `cellar.keys` had exited **101** since `K3c` refused their `send 6:`.
Both run clean now — rc 0, zero complaints — and two probes had encoded that refusal:

- **`probe/k3c`'s `AUTHORS` list** loses its two `:6` entries. What remains is `47`
  WATER, `10` ROAD and four `44` PART, every one still genuinely beyond this driver.
- **`probe/t3` row D** flips from *2 complaints each* to *0*, and still asserts the
  COUNT rather than the exit code — a runner that stopped counting bad lines would exit
  0 for every script in the tree.

⚠ **Neither claim evaporated**; they moved here, into rows A, B and E, where the
assertion is strictly stronger than a refusal: not *this driver declines* but *this
driver builds the server's world*.

## ⏭ What is still refused, and the reason is worth knowing

`10:` ROAD and `47:` WATER. Not because the runner cannot walk — it can — but because
**their stamps hang off the SERVER's `7:` PLACE handler and are in no shared tick at
all**. They are the gestures still written once, in a driver, which is the same shape
`walk_tick` was built to close one layer up. WALK_TICK.md says so in *what this design
does NOT claim*, and this is where a script meets it.

## The files

| file | what it is |
|---|---|
| `run.sh` | rows A–E, in `make fast` as `make probe-t4` |
| `sabotage.sh` | four sabotages and a control — one of them aimed at the PROBE, because row D's subject is a fixture |
