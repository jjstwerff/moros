.PHONY: client client-check client-console serve stop creator upload tests lib-test editor editor-stop stop-editor editor-check gate gate-world gate-character gate-hexworld play play-fast browser port-free

# `lib-test` pipes loft's output through grep, and a pipeline's status is the
# LAST command's — so without pipefail the gate would report grep's success and
# scroll straight past a failing package.
SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

PORT ?= 8000
PY ?= python3
LOFT ?= loft

# The loft packages under lib/, in dependency order.
LIB_PACKAGES = moros_map moros_editor moros_render moros_sim moros_ui

serve:
	$(PY) -m http.server $(PORT) --directory html &
stop:
	killall $(PY)
creator:
	firefox http://localhost:8000/character-creator.html
upload:
	rm data/pages.zip
	cd html ; zip -9 ../data/pages.zip *
# The JavaScript suite (html/logic.js, dm-logic.js, data.js) under mocha, with
# coverage from c8.
#
# ⚠ `sh: 1: nyc: not found` was TWO faults wearing one message, and fixing only the
# obvious one leaves the target broken on a fresh clone. The script still named `nyc`
# after the project moved to `c8` (which is the move `"type": "module"` forces — nyc
# cannot instrument ES modules), AND a clean checkout has no `node_modules` at all, so
# the runner was missing whatever it was called. Hence the prerequisite: the target
# installs what it needs rather than assuming someone did it by hand.
node_modules: package.json
	npm install
	@touch node_modules

tests: node_modules
	npm test

# Every loft package's own test suite.  `loft test` exits 1 on failure
# (verified), so the `||` makes one red package fail the whole target
# instead of scrolling past.
lib-test:
	@for p in $(LIB_PACKAGES); do \
		printf '\n=== %s ===\n' "$$p"; \
		( cd lib/$$p && $(LOFT) test 2>&1 | grep -viE '^  Warning' ) \
			|| { echo "FAILED: $$p"; exit 1; }; \
	done



# ── the editor (W0) — the build service ───────────────────────────────────
# One loft process serves the client page AND the model channel on one port,
# so an ssh tunnel needs exactly one forward:
#     ssh -L $(EDITOR_PORT):localhost:$(EDITOR_PORT) <this box>
# then open http://localhost:$(EDITOR_PORT)/ in your own browser.
#
# `editor` runs in the foreground (Ctrl-C stops it); `editor-bg` + `editor-stop`
# use a PID FILE rather than `killall`, which would take out every python/loft
# on a box that other agents share.
EDITOR_PORT ?= 18090
EDITOR_PID  := .editor.pid
LOFT_TOOLS  ?= ../loft/tools

# ── One command to try the editor: build, run, open a browser ────────────────
#
# `make play`      native build (fast at runtime, SLOW the first time — it compiles
#                  the whole graphics dependency tree; cached afterwards)
# `make play-fast` interpreted — starts in a second, for a quick look
#
# ⚠ THE BROWSER IS NOT OPENED OVER SSH, deliberately. On a headless session
# `xdg-open` either fails or opens a browser on the machine nobody is sitting at.
# The check is "is there a display", not "is this Linux": a local desktop session
# gets a browser, an SSH session gets the tunnel command it actually needs.
BROWSER_URL := http://127.0.0.1:$(EDITOR_PORT)/

# Free the port before starting. `editor-stop` only knows the PID file, so an
# editor started any other way — by hand, by a gate, by a previous run that was
# interrupted — keeps the port and the next start dies with "Address already in
# use". This looks the port up instead.
#
# ⚠ It kills ONLY a process it can identify as this editor, and BOTH forms have to
# be recognised: interpreted runs carry `editor_server.loft` on the command line,
# while a NATIVE run is a compiled binary called `loft_native_bin_<n>` and carries
# no source name at all. The first version matched only the source, so it refused
# to free the port after `make play` — correctly, since an unrecognised process is
# exactly what must not be killed.
#
# A bare `pkill -f editor_server.loft` is the wrong tool: it matches the shell
# running the command too, and has killed this session once already.
port-free:
	@pid=$$(ss -lptn 'sport = :$(EDITOR_PORT)' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1); \
	if [ -n "$$pid" ]; then \
	  cmd=$$(tr '\0' ' ' < /proc/$$pid/cmdline 2>/dev/null); \
	  if echo "$$cmd" | grep -qE 'editor_server\.loft|loft_native_bin_'; then \
	    kill $$pid 2>/dev/null; sleep 2; \
	  else \
	    echo "port $(EDITOR_PORT) held by pid $$pid, which is NOT the editor — leaving it alone"; \
	    exit 1; \
	  fi; \
	fi

browser:
	@if [ -z "$$DISPLAY" ] && [ -z "$$WAYLAND_DISPLAY" ] && [ "$$(uname -s)" = "Linux" ]; then 	  echo ""; 	  echo "  no display here — this looks like an ssh session, so run on YOUR machine:"; 	  echo "      ssh -L $(EDITOR_PORT):localhost:$(EDITOR_PORT) $$(whoami)@$$(hostname)"; 	  echo "  then open  $(BROWSER_URL)"; 	  echo ""; 	else 	  case "$$(uname -s)" in 	    Darwin)            open "$(BROWSER_URL)" ;; 	    Linux)             xdg-open "$(BROWSER_URL)" >/dev/null 2>&1 ;; 	    MINGW*|MSYS*|CYGWIN*) cmd.exe /c start "" "$(BROWSER_URL)" ;; 	    *)                 echo "  open $(BROWSER_URL) in a browser" ;; 	  esac; 	  echo "  opened $(BROWSER_URL)"; 	fi

play: port-free
	@echo "building natively (first run compiles the graphics tree — minutes)…"
	@nohup $(LOFT) --native --lib lib/ src/editor_server.loft > .editor.log 2>&1 & echo $$! > $(EDITOR_PID)
	@until grep -q 'drag or A/D' .editor.log 2>/dev/null; do 	  if ! kill -0 $$(cat $(EDITOR_PID)) 2>/dev/null; then 	    echo "editor exited — last lines:"; grep -vE '^warning|^ *\||^ *-->' .editor.log | tail -5; exit 1; fi; 	  sleep 2; done
	@echo "editor up (native) on port $(EDITOR_PORT)"
	@$(MAKE) -s browser

play-fast: port-free
	@nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & echo $$! > $(EDITOR_PID)
	@until grep -q 'drag or A/D' .editor.log 2>/dev/null; do 	  if ! kill -0 $$(cat $(EDITOR_PID)) 2>/dev/null; then 	    echo "editor exited — last lines:"; grep -vE '^warning|^ *\||^ *-->' .editor.log | tail -5; exit 1; fi; 	  sleep 1; done
	@echo "editor up (interpreted) on port $(EDITOR_PORT)"
	@$(MAKE) -s browser

# ── the client (plan #16, S1) ─────────────────────────────────────────────
# No `--lib` flag: `web` resolves from the registry (0.3.3), whose tarball carries
# the `wasm/` bridge `--html` needs.
#
# ⚠ If this ever fails again with `web_wasm` unresolved, the cause is a stale
# ~/.loft/lib/web SHADOWING the registry copy — `loft install <dir>` copies only
# loft.toml, src/*.loft, tests/ and native/, so a locally installed library loses
# its wasm bridge (loft-lang/loft#667). `rm -rf ~/.loft/lib/web` is the fix; the
# published package was never at fault.
client:
	$(LOFT) --html src/editor_client.loft
	@echo "wrote src/.loft/editor_client.html"

editor:
	$(LOFT) --interpret --lib lib/ src/editor_server.loft

editor-bg:
	@nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & echo $$! > $(EDITOR_PID)
	@until grep -q 'listening on port' .editor.log 2>/dev/null; do sleep 1; done
	@echo "editor on http://localhost:$(EDITOR_PORT)/  (pid $$(cat $(EDITOR_PID)))"

# ONE STOP, THREE PLATFORMS, TWO WAYS IN — see tools/editor-stop.sh for why each
# step is spelled differently on each, and why it kills only what it can identify.
# `editor-stop` is kept as an alias because muscle memory and older docs use it.
stop-editor editor-stop:
	@EDITOR_PORT=$(EDITOR_PORT) EDITOR_PID=$(EDITOR_PID) sh tools/editor-stop.sh

# THE GATE — loft's own headless check. Layer 1 fails on any console error;
# Layer 2 screenshots the canvas and counts distinct colours, which is what
# catches "compiles clean, blank canvas".  Control: break the draw and watch
# distinctColors collapse to 1.
editor-check:
	node $(LOFT_TOOLS)/html_render_check.mjs http://127.0.0.1:$(EDITOR_PORT)/ \
	  --wait-ms 8000 --canvas '#gl' --canvas-min-colors 12 --screenshot /tmp/w0.png

# The SAME check against the wasm client (plan #16, S1) — same server, same wire,
# same claim: it drew a world and not a flat sky. The canvas is `#c` because that is
# what loft's `--html` shell names its own, and the wait is longer because the page
# boots a 670 KB wasm before it dials.
#
# ⚠ THIS IS S1'S DONE-WHEN, and the pair is the point: `editor-check` and
# `client-check` measure one claim about two renderers, so a divergence shows up as
# one green and one red rather than as a picture somebody has to remember.
client-check:
	node $(LOFT_TOOLS)/html_render_check.mjs http://127.0.0.1:$(EDITOR_PORT)/client \
	  --wait-ms 20000 --canvas '#c' --canvas-min-colors 12 --screenshot /tmp/w0-client.png

# What the wasm client SAID, when it drew nothing and the check cannot say why.
client-console:
	node tools/page_console.mjs http://127.0.0.1:$(EDITOR_PORT)/client --wait-ms 15000

# ── looking at the world without being at the keyboard ────────────────────
# A PICTURE OF WHAT THE HUMAN IS LOOKING AT. This attaches a headless client and
# screenshots its canvas, so a description of an artefact can be checked instead
# of imagined.
#
# ⚠ It is PASSIVE — it sends no key and no `7:` placement, so the SHARED character
# does not move and a person already driving this server is undisturbed. That is
# the whole reason it is separate from the gates, which all drive.
#
#   make shot                            the wasm client, to shot.png
#   make shot PAGE=/ CANVAS='#gl'        the JavaScript one, for comparison
SHOT   ?= shot.png
PAGE   ?= /client
CANVAS ?= \#c
shot:
	@node $(LOFT_TOOLS)/html_render_check.mjs http://127.0.0.1:$(EDITOR_PORT)$(PAGE) \
	  --wait-ms 20000 --canvas '$(CANVAS)' --canvas-min-colors 2 --screenshot $(SHOT)
	@echo "wrote $(SHOT)"

# IS THE GROUND WATERTIGHT, AND IS IT SMOOTH? Two different questions that look
# identical on screen — a crack shows background through a gap, a facet is a real
# fold in the surface — and they have completely different fixes. Reads the drawn
# triangles off the wire; also passive.
seam:
	@node tools/seam.mjs $(EDITOR_PORT)

# THE SAME QUESTION, ASKED WHILE THE WORLD IS MOVING. The settled world is the one
# state in which a rebuild-order crack cannot appear, so `seam` alone will always
# call a transient artefact clean. Run this, then raise a hill while it watches.
WATCH ?= 20
seam-watch:
	@node tools/seam.mjs $(EDITOR_PORT) --watch $(WATCH)

# ── the editor's gates, split by what they are allowed to break ───────────
# world/     — drive the character by PLACING it; measure terrain, streaming,
#              levelling. Must not depend on locomotion.
# character/ — drive it by WALKING; measure the character itself. Expected to
#              churn as locomotion grows a step limit, a fall, collision.
# Each probe gets a FRESH SERVER: state persists (position, yaw, peaks, the
# level flag), so back-to-back runs are not independent.
# ⚠ TWO failures live here, both found by a suite that hung for forty minutes.
#
# 1. It called `editor-stop`, which knows only the PID FILE — so it was a no-op
#    against an editor started any other way (`play-fast`, a previous gate loop,
#    by hand). That editor kept the port, the gate's own server died on bind, and
#    the loop below waited for a readiness line that was never coming.
# 2. The readiness loop had NO failure path. A server that failed to start looked
#    exactly like a server still starting, forever. Silence is not success: the
#    wait must end in a ready line OR a named failure, never in neither.
#
# 3. It waited for the BANNER, which the editor prints BEFORE it binds. A server
#    that then died on "address already in use" had already written the line the
#    wait was watching for — so the wait went green, the gate connected to the
#    PREVIOUS server, and every gate after the first talked to a stale world. The
#    readiness signal has to be the thing that is only true once the socket is
#    actually listening.
#
# So: free the port by PORT (`port-free` identifies the process as this editor),
# wait for the LISTENING line rather than the banner, and bound the wait — 60s,
# then print the log and fail the gate run.
GATE_RESTART = $(MAKE) -s port-free >/dev/null 2>&1; sleep 1; \
  : > .editor.log; \
  nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & \
  for i in $$(seq 1 60); do \
    grep -q 'listening on port' .editor.log 2>/dev/null && break; \
    grep -qi 'cannot bind port' .editor.log 2>/dev/null && break; \
    sleep 1; \
  done; \
  if ! grep -q 'listening on port' .editor.log 2>/dev/null; then \
    echo "GATE HARNESS: the editor never listened — last 20 lines:"; \
    grep -vE '^warning|^ *\||^ *-->|^ *=' .editor.log | tail -20; exit 1; \
  fi

# hex_world's exact-size proofs run as a PROGRAM, not under `loft test`: several
# save-and-measure tests in one test file hang the harness (see
# lib/hex_world/probe/sparsity.loft). Same assertions, same exactness, a runner
# that works.
gate-hexworld:
	@printf '%-34s ' "hex_world/probe/sparsity"; \
	  $(LOFT) --lib lib/ lib/hex_world/probe/sparsity.loft | tail -1
	@printf '%-34s ' "hex_world/probe/edgehold"; \
	  $(LOFT) --lib lib/ lib/hex_world/probe/edgehold.loft | tail -1
	@printf '%-34s ' "moros_map/probe/slopeline"; \
	  $(LOFT) --lib lib/ lib/moros_map/probe/slopeline.loft | tail -1

gate-world:
	@for g in tools/gates/world/*.mjs; do $(GATE_RESTART); \
	  printf '%-34s ' "$$g"; node $$g || exit 1; done

gate-character:
	@for g in tools/gates/character/*.mjs; do $(GATE_RESTART); \
	  printf '%-34s ' "$$g"; node $$g || exit 1; done

# ⚠ THE SUITE STOPS WHAT IT STARTED. Each gate gets a fresh server and the last one
# used to be left running — for days, at 76% of a core once a client had connected
# and left. A suite that leaves a process behind on a shared box is not finished.
gate: gate-world gate-character
	@$(MAKE) -s stop-editor
