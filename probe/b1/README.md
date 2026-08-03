<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# B1.1 / B1.3 — does text reach the canvas, and is the panel in the picture?

Plan [#18](https://github.com/jjstwerff/moros/issues/18), step `B1.1`. `make probe-text`.

**Answer: yes, on both targets — and the font you get is not the font you asked for.**

Until 2026-08-03 the `--html` text bridge was a no-op stub, so a HUD built on it would have
compiled, run and drawn nothing. `B1.1` exists because four steps (`B1.2`–`B1.6`) assume the
bridge works *in the browser specifically*, and the desktop cannot answer that: the two are
separate implementations of the same six builtins — fontdue on the desktop, a 2D-canvas
`fillText` in the browser.

## What it measured

| | desktop | browser (`--html`, headless Chrome) |
|---|---|---|
| `gl_load_font` | handle `0` — **needs a file path**, `"monospace"` returns null | handle `0` — **needs a CSS family**, resolved from the path's base name |
| ink, left half (text asked for) | **1127** | **1246** |
| ink, right half (nothing asked for) | **0** | **0** |
| advance @32px | 19.27 | **26.66** |
| line height | 38 | 36 |
| `MMMMMMMMMM` vs `iiiiiiiiii` | 192.66 vs 192.66 — **monospace** | 266.56 vs 71.09 — **proportional** |

## ⚠ The finding: the same font argument gives two different fonts

`gl_load_font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf")` gives DejaVu Sans Mono
on the desktop and **a proportional fallback** in the browser. The browser cannot load font
bytes synchronously, so it resolves the path's **base name** to a CSS family — and
`DejaVuSansMono` is not a family Chrome knows (the real name has spaces), so it falls back to
a generic proportional face.

Measured directly in the page:

```
monospace        M-run 192.66   i-run 192.66     <- fixed pitch
DejaVuSansMono   M-run 284.53   i-run  88.91     <- not resolved; proportional fallback
```

**This is exactly the `C0a` hazard, arriving before a line of `panel_render` was written.**
`C0a` wants `len × advance` to be *exact*, and that holds only for a fixed-pitch font. A
panel laid out on `len × advance` against a proportional fallback mis-lays every row, and
nothing reports it — the text still draws, it is simply in the wrong place.

Note the trap's shape: asking for `"monospace"` in the browser gives **192.66, identical to
the desktop's DejaVu**. So on this box the two targets *can* agree exactly — but only if each
is asked in its own dialect, and only because Chrome's default monospace happens to be the
same font. That coincidence is not a contract.

### What this changes for `B1.2`

1. **The font argument is per-target**, not one string. A path for the desktop, a CSS generic
   (or an `@font-face` family the page declares) for the browser.
2. **`Metrics` is filled at runtime from `gl_measure_text`** — which `C0a` already said, and
   this is what earns it rather than assuming it.
3. **Startup must VERIFY fixed pitch**, not assume it: `measure("MMMMMMMMMM") ==
   measure("iiiiiiiiii")`. Two same-length, opposite-width strings is the whole instrument. A
   width on its own cannot answer it — ten M's are ten M's in any font.
4. `font.loft`'s `text_width(s) = len(s) * 8` is wrong on **both** targets (19.27 and 26.66).

## The three instruments, and why three

No single one can see all three failure modes:

| | what it can see |
|---|---|
| `text_cpu.loft` | the rasteriser writes coverage at all — an exact **count**, no window needed |
| `text_gl.loft` | the GL route reaches the back buffer — desktop, via `gl_screenshot` |
| `browser_shot.mjs` | the same route reaches the **canvas** — the half that was broken |

Each carries **its control in the same frame**: text in the left half, nothing in the right.
A backend that filled the buffer, or cleared to a non-black colour, passes the subject and
fails the control. *"It drew something"* is not the claim; *"it drew something where asked"*
is.

⚠ **And the reader is checked before either verdict is believed** (`B1.1c`): `shot.mjs` must
FAIL on a blank frame, FAIL on an all-white one, and PASS on real text. A reader that accepts
everything and one that rejects everything look identical from a single green run.

## Two smaller things worth keeping

- **`gl_screenshot` is the one builtin `--html` does not provide**, and loft says so at
  compile time rather than at runtime. The probe expects that and lets the browser do its own
  capture. A clean, reported boundary.
- **`save_png` with a relative path silently returns `false`.** loft resolves it from the
  *script's* directory, not the working directory, so `probe/b1/x.png` became
  `probe/b1/probe/b1/x.png`. The first version of this probe reported **PASS while writing no
  file at all**, because it counted pixels and threw the boolean away. Paths here are
  absolute, and the return value is asserted.

## B1.3 — and the panel, in the client's own picture

`run.sh` gained a fifth stage: build the real client, photograph it in headless Chrome, and
**measure** the panel rather than look at it.

```
  ok    a column inside the strip is dark (lum 21 < 80)
  ok    just right of 240px is NOT panel (lum 142 >= 80)
  ok    the strip measures 240px, want 240
  ok    six toolbar bars of >=8px, counted 6 (runs: 32,32,32,32,32,32,2)
  ok    each bar is button-height (32px): 32,32,32,32,32,32
  ok    most of the frame is still world, not panel (76% light)
```

⚠ **The last row is the control the others cannot provide.** A renderer that filled the
whole canvas with panel colour passes *"the strip is dark"* perfectly.

⚠ **Counting lighter pixels reported SEVEN buttons.** The seventh was the 2px separator
hairline, which is also lighter than the background. The fix is not a threshold tuned
between 44 and 52 — it is that a button is a **32px bar** and a hairline is not, so the run
LENGTH is what tells them apart. A discriminator taken from the shape survives a restyle;
one taken from a luminance gap does not.

⚠ **And `[].every(…)` is `true`**, so *"each bar is button-height"* reported `ok` on a
picture with no panel in it at all — a vacuous pass sitting in a failing run, which is the
shape that teaches a reader to skim. The count is part of that claim now.

⚠ **The window must be bigger than the canvas.** At 900x400 against the editor's 1200x660
the shot came back with the right third and the bottom third black and everything at the
wrong scale: a canvas larger than the viewport is only partly composited, and
`captureBeyondViewport` does not undo it. It reads exactly like a broken renderer.

## Files

| | |
|---|---|
| `run.sh` | all five stages — `make probe-text` |
| `text_cpu.loft` | rasteriser coverage, exact count |
| `text_gl.loft` | the GL route + the fixed-pitch check, one source for both targets |
| `shot.mjs` | the ink reader — a minimal PNG decoder, split left/right |
| `browser_shot.mjs` | headless Chrome + CDP, clipped to the canvas; takes the page as an argument |
| `panel.mjs` | B1.3's reader — is the panel in the client's picture, and did it stay in its strip |
