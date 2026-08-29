# `B4z` — written before the probe ran

`B4x` recorded that its rotation-invariant cycle minimum **beat the shipped peel on no
fixture measured**, and gave the reason: the only closed chains it had were the 7 rectangles
greedy already described as four walls. `B4y` closed the corner, so **23 of 25 are loops
now**, and greedy gives 5, 6 or 7 on 17 of them. That claim has never been re-run against
the world it was a claim about.

| | expected |
|---|---|
| one closed chain, of 25 | **23** — `6 × 3` and `6 × 6` keep a two-edge break |
| greedy (`plan_svg`, the shipped peel) gives four | **8 of 25**, `B4y`'s own number |
| **the cycle minimum gives four** | **23 of 25** — every loop, uniquely |
| the two broken ones | 4 or more pieces, and **not unique** — `B4x` measured 5 optimal partitions for a 14×6 room and 16 for an L |
| marks left over | **0** everywhere, both rules |
| cost | the table is ~**2454** `run_edges` for a 50-mark room against ~**128** for greedy — call it 19× |

## What each outcome would mean

| if | then |
|---|---|
| the cycle gives 4 on all 23 | ⛔ `B4x`'s *beats the shipped peel on no fixture* is **stale**, and the cut has a measured answer waiting for a cost decision |
| the cycle gives more than 4 somewhere | the corner was not the only thing wrong with those rooms |
| greedy also gives 4 once the corner is closed | the whole cut question was the corner, and there is nothing left to build |

⚠ **AND `probe/b4x`'S OWN RECORDED NUMBERS ARE NOW STALE BY CONSTRUCTION** — its `rect()`
stamps through `wall_stamp`, which closes the corner since `B4y`. Its `fuse_sweep` said *7 of
25 are one closed chain* and *80 breaks*; re-running it today measures the fixed world. That
is the same trap `probe/b4y` had to be restructured to avoid, and it is worth recording
rather than quietly re-blessing.
