.PHONY: help names probe-names drift client client-force press client-check client-console serve stop creator upload tests lib-test editor editor-stop stop-editor editor-check gate gate-world gate-character gate-hexworld gate-one gate-rep check fast probe-text probe-split probe-p2 probe-p6 probe-b1a probe-auth probe-k3c probe-k3d probe-headless loft-state probe-t3 probe-t4 pages probe-a0p probe-a0p-exact probe-headings probe-a0q probe-h1 probe-l1 probe-b0p probe-b1p probe-b2p probe-b3p probe-b4x probe-b4y probe-b5 probe-b7 probe-b8 probe-b9 probe-c1 probe-c2 probe-wp probe-m1p probe-m2p probe-k1 probe-demo page-check plan-check plan-view probe-plan play play-fast browser port-free

# `lib-test` pipes loft's output through grep, and a pipeline's status is the
# LAST command's — so without pipefail the gate would report grep's success and
# scroll straight past a failing package.
SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

PORT ?= 8000
PY ?= python3
LOFT ?= loft
# One job per test FILE for `make fast`. 16 is the measured knee on a 24-core box:
# 8 jobs 22.9 s, 16 jobs 16.5 s, 24 jobs 15.9 s over 113 files. Below the knee the
# cores idle; above it the wall is the slowest single file and nothing else moves.
TEST_JOBS ?= 16

# The loft packages under lib/ — **every directory with a manifest, computed, never a
# list kept here.**
#
# ⛔ **IT WAS A HAND-WRITTEN LIST AND IT WAS SHORT AGAIN.** `hex_rig` — 6 files, 89
# tests — was missing, so `lib-test` (the BOTH-BACKENDS pre-commit proof) has never run
# it. `make fast` did, because `tools/run-tests.sh` globs `lib/*/tests/*.loft`, so it
# ran on one backend and the omission never showed as red. Measured 2026-08-29 while
# closing it: 89 pass interpreted **and** 89 native, so nothing was hiding — but nobody
# knew that, and a proof that skips a package silently is claiming something it did not
# check. ⚠ The list's own comment had warned about exactly this, naming `hex_voxel` and
# `glb_read` as *"66 tests that only ever passed because someone ran them by hand"*.
# **A warning written above a hand-maintained list does not maintain it.**
#
# ⚠ `tools/rdeps.sh` had already drawn this conclusion for the dependency map — *"a
# hand-written map is right the day it is written and wrong the first time somebody adds
# a dependency"* — and this line is the same lesson one row up.
#
# ⚠ **NOT in dependency order, and it never was** — measured 2026-08-18, four edges
# contradicted the claim. It costs nothing, because each `loft test` resolves its own
# dependencies, which is why the claim went unchallenged for so long. `tools/rdeps.sh`
# sorts topologically rather than trusting any order here; `$(sort)` here is
# alphabetical and says so.
LIB_PACKAGES = $(sort $(patsubst lib/%/loft.toml,%,$(wildcard lib/*/loft.toml)))

# ⛔ **BARE `make` STARTED A WEB SERVER, AND SO DID `make -p`.** `serve:` was the first
# target in this file, which is how GNU make picks its default goal — so a bare `make`,
# and any `make -p` reading the database without `-n`, left an `http.server` on port
# $(PORT) that nobody was tracking. Measured 2026-08-29 by tripping it. A default goal
# that starts a process is the *stop any server you start* rule losing before anybody
# has typed a target name.
.DEFAULT_GOAL := help

help:
	@echo 'moros / lavition — the targets you want first:'
	@echo '  make fast                 layering, basenames, citations, src/ compile,'
	@echo '                            180 test files, the probes — after EVERY step'
	@echo '  make fast P=hex_part      one package (or several, quoted)'
	@echo '  make check P=hex_part     one package the old way, interpreter only'
	@echo '  make lib-test             BOTH backends, every package — the pre-commit proof'
	@echo '  make gate                 the browser gates (starts servers, stops them)'
	@echo '  make page-check           the --html client: the only tier that drives a browser'
	@echo '  make editor / stop-editor the editor server, and how to stop it'
	@echo '  make serve / stop         the static html/ pages on port $(PORT)'
	@echo
	@echo 'doc/claude/QUICK_START.md is the map; CLAUDE.md holds the working rules.'

serve:
	@$(PY) -m http.server $(PORT) --directory html & \
	 echo "serve: http.server on port $(PORT), pid $$! — stop it with 'make stop'"

# ⛔ **THIS WAS `killall python3`, ON A BOX THAT RUNS OTHER AGENTS' WORK.** CLAUDE.md's
# rule is *kill only processes you can identify as yours*, and `killall` cannot: it would
# have taken out a sibling's tooling, a gate driver and this session's own helpers along
# with the one server meant. It does what `port-free` does below instead — find who holds
# the port, check the command line is ours, kill THAT pid, and leave a stranger alone out
# loud.
# ⚠ **AND THE COMMAND LINE ALONE IS NOT AN IDENTITY ON THIS BOX.** `http.server` is what
# every tree's static server says, so a sibling agent serving their own `html/` on this
# port would match a cmdline test exactly. The CWD is what separates them: `serve` above
# runs from this tree, so `/proc/<pid>/cwd` resolving here is the check, and a stranger
# is named and left alone.
stop:
	@pid=$$(ss -lptn 'sport = :$(PORT)' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1); \
	if [ -z "$$pid" ]; then echo "stop: nothing is listening on port $(PORT)"; exit 0; fi; \
	cmd=$$(tr '\0' ' ' < /proc/$$pid/cmdline 2>/dev/null); \
	cwd=$$(readlink -f /proc/$$pid/cwd 2>/dev/null); \
	if echo "$$cmd" | grep -qE 'http\.server' && [ "$$cwd" = "$(CURDIR)" ]; then \
	  kill $$pid 2>/dev/null && echo "stop: killed pid $$pid on port $(PORT)"; \
	else \
	  echo "port $(PORT) is held by pid $$pid, which is not this tree's http.server:"; \
	  echo "  cwd: $$cwd"; \
	  echo "  cmd: $$cmd"; echo "leaving it alone"; exit 1; \
	fi
creator:
	firefox http://localhost:8000/character-creator.html
upload:
	rm data/pages.zip
	cd html ; zip -9 ../data/pages.zip *
# The JavaScript suite (html/logic.js, dm-logic.js, data.js) under mocha, with
# coverage from c8.
#
# ⚠ THE `overrides` BLOCK IN package.json IS LOAD-BEARING — do not drop it to
# "simplify" the manifest. All six audit findings were transitive under mocha, and
# there is no released mocha that fixes them: `latest` IS the installed 11.7.6, and
# `npm audit fix` proposes 11.3.0, a DOWNGRADE below the declared floor. Upstream's
# real fix is mocha 12, still at rc. So the four are pinned by hand:
#     brace-expansion  ^5.0.8   the ONLY patched version — the advisory range is
#                               <=5.0.7, so the whole 2.x line mocha sits on is in it
#     minimatch        ^10.2.2  REQUIRED BY THE ABOVE, not optional: brace-expansion 5
#                               replaced `module.exports = expand` with a named
#                               export, and minimatch 9 calls the old shape
#     serialize-javascript ^7.0.7   mocha's parallel-mode worker serialisation
#     diff             ^8.0.4   mocha's assertion-failure formatter
#
# ⚠ AND `npm audit` REPORTED 0 VULNERABILITIES ON A BROKEN TREE. Overriding
# brace-expansion alone audits clean and passes the whole suite, while any brace in a
# glob throws `brace_expansion_1.default is not a function` — mocha's default spec
# has no braces, so nothing noticed. If you touch these versions, the check is not
# `npm audit` and not the test count; it is the four probes in STATE.md item 17,
# against the un-overridden tree as the control.
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
# ⚠ BOTH BACKENDS, because loft's Goal D says per-backend green is not enough:
# the interpreter and `--native` are two implementations of one language, and a
# library that passes on one and not the other is exactly the silent divergence
# that goal exists to catch. Every suite here reported "ran on the interpreter
# only" until this line existed.
# ⚠ THE RAW OUTPUT IS KEPT BEFORE ANYTHING FILTERS IT. A `loft test` run died with
# `SIGSEGV caught` once and the crash reporter's own diagnostic — the last opcode,
# the pc, the function — went out through this pipeline's `grep` with the warnings.
# One line survived, which is not enough to file with (loft#717). A signal
# handler's output is the one thing a build must not drop: every other line can be
# regenerated by running again, and that is exactly what the crashing run will not
# do. So `tee` first, filter second, and say where the whole thing is when it fails.
# ⚠ WHICH WAY THE ARROW POINTS, checked rather than remembered. lavition may not
# depend on Moros, and moving the gestures out of the server found that backwards
# twice in code that had compiled for months — see tools/layering.sh. It runs
# before the suites because it costs milliseconds and a violation makes the rest
# moot.
layering:
	@sh tools/layering.sh

# ⚠ **`P=` SCOPES IT, AND WITHOUT THAT IT WAS ALL-OR-NOTHING.** `run-tests.sh` has
# taken a `P` since it was written and this loop did not, so a change touching one
# package re-ran eleven — measured 2026-08-18: ten packages clear in ~60 s and
# `hex_editor` alone takes longer than all of them together (50 files, 596 tests, run
# twice because `--native` compiles Rust). A check that cannot be narrowed is a check
# people run wholesale or skip entirely, and skipping is the failure that matters.
#
# ⚠ **SCOPE IT BY THE REVERSE DEPENDENCIES, NEVER BY WHAT YOU EDITED.** Only three
# packages here read `hex_voxel` or `hex_editor` — `hex_editor`, `hex_mesh` and
# `hex_part` — so an editor change is `L=hex_editor`, while the other eight cannot see
# it. ⚠ Getting that set wrong is how a scoped run reports green about a package it
# never built, which is why `L=` DERIVES it and why the full sweep is still what runs
# before a push.
#
#     make lib-test                    # every package, both backends — pre-push
#     make lib-test L=hex_editor       # that library AND its dependents — inner loop
#     make lib-test P="a b"            # an explicit list, when you know better
# ⚠ **`L=` IS COMPUTED, NEVER A MAP KEPT HERE.** `tools/rdeps.sh` reads the manifests
# and sorts topologically, so adding a dependency widens the set the same day rather
# than the day somebody remembers — the failure `tools/layering.sh`'s stale skip list
# already cost this tree once. ⚠ An unknown name FAILS: a typo returning an empty set
# would test nothing and report success.
LIB_TEST_PACKAGES = $(if $(L),$(shell sh tools/rdeps.sh $(L)),$(if $(P),$(P),$(LIB_PACKAGES)))

# ── THE SUITE, ONE FILE PER PROCESS — `tools/suite.sh` ──────────────────────
#
# ⛔ `make lib-test` RUNS A WHOLE PACKAGE IN ONE `loft test`, AND `hex_editor` NO
# LONGER FITS. loft applies a 300-second deadline to the whole `run-interpret`
# phase; 775 tests exceed it, so `lib-test` on that package can only ever be RED —
# correctly, and for a reason that is not a defect in the code. Measured 2026-08-28:
# it stops inside `tests/opening.loft`, which passes 21 of 21 in 4.3 s on its own.
# ⚠ `lib-test` itself is sound — a planted failure AND a planted timeout both come
# back as exit 2, because `.SHELLFLAGS` carries `-o pipefail`. The problem is the
# wall, not the reporting.
#
# `make suite` runs one FILE per process, so the deadline bounds the slowest file
# instead of the sum, and a file that reports nothing at all is RED rather than
# absent. 62 files and 777 tests in `hex_editor`.
#
#   make suite                    every package
#   make suite P=hex_editor       one
#   make suite JOBS=6             in parallel
#   SUITE_NATIVE=1 make suite     the native backend too
suite:
	@SUITE_JOBS=$(if $(JOBS),$(JOBS),4) sh tools/suite.sh $(P)

lib-test: layering | .test-logs
	@if [ -z "$(strip $(LIB_TEST_PACKAGES))" ]; then \
		echo "lib-test: nothing selected — rdeps said nothing for L=$(L)"; exit 2; fi
	@printf 'lib-test: %s\n' "$(strip $(LIB_TEST_PACKAGES))"
	@for p in $(LIB_TEST_PACKAGES); do \
		printf '\n=== %s ===\n' "$$p"; \
		( cd lib/$$p && $(LOFT) test 2>&1 \
			| tee $(CURDIR)/.test-logs/$$p-interpret.log | grep -viE '^  Warning' ) \
			|| { echo "FAILED: $$p (interpreter) — raw output in .test-logs/$$p-interpret.log"; exit 1; }; \
		( cd lib/$$p && $(LOFT) test --native 2>&1 \
			| tee $(CURDIR)/.test-logs/$$p-native.log | grep -viE '^  Warning' ) \
			|| { echo "FAILED: $$p (native) — raw output in .test-logs/$$p-native.log"; exit 1; }; \
	done

.test-logs:
	@mkdir -p $@



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
#
# ⚠ AND IT WAITS FOR THE PORT, NOT FOR TWO SECONDS. Killing the process is not the
# same as freeing the address: a gate that closes its socket leaves the server side
# in CLOSE-WAIT, and once the server is gone that connection sits in TIME_WAIT with
# `sport = :18090` — so `bind` fails with "Address already in use" and the panic is
# fatal, because the server does not retry. Measured: the suite died on its THIRD
# gate twice running, at a bind, with two gates green before it; a three-restart
# probe around the same gate showed the lingering CLOSE-WAIT on two runs of three.
# That is the "wait for the server, not the clock" rule this repo enforces on every
# gate, turned on the harness that runs them.
port-free:
	@pid=$$(ss -lptn 'sport = :$(EDITOR_PORT)' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1); \
	if [ -n "$$pid" ]; then \
	  cmd=$$(tr '\0' ' ' < /proc/$$pid/cmdline 2>/dev/null); \
	  if echo "$$cmd" | grep -qE 'editor_server\.loft|loft_native_bin_'; then \
	    kill $$pid 2>/dev/null; \
	  else \
	    echo "port $(EDITOR_PORT) held by pid $$pid, which is NOT the editor — leaving it alone"; \
	    exit 1; \
	  fi; \
	fi; \
	for i in $$(seq 1 90); do \
	  ss -tan "sport = :$(EDITOR_PORT)" 2>/dev/null | grep -q ":$(EDITOR_PORT)" || exit 0; \
	  sleep 1; \
	done; \
	echo "port $(EDITOR_PORT) still held after 90s:"; ss -tan "sport = :$(EDITOR_PORT)"; exit 1

browser:
	@if [ -z "$$DISPLAY" ] && [ -z "$$WAYLAND_DISPLAY" ] && [ "$$(uname -s)" = "Linux" ]; then 	  echo ""; 	  echo "  no display here — this looks like an ssh session, so run on YOUR machine:"; 	  echo "      ssh -L $(EDITOR_PORT):localhost:$(EDITOR_PORT) $$(whoami)@$$(hostname)"; 	  echo "  then open  $(BROWSER_URL)"; 	  echo ""; 	else 	  case "$$(uname -s)" in 	    Darwin)            open "$(BROWSER_URL)" ;; 	    Linux)             xdg-open "$(BROWSER_URL)" >/dev/null 2>&1 ;; 	    MINGW*|MSYS*|CYGWIN*) cmd.exe /c start "" "$(BROWSER_URL)" ;; 	    *)                 echo "  open $(BROWSER_URL) in a browser" ;; 	  esac; 	  echo "  opened $(BROWSER_URL)"; 	fi

# ⚠ `client` FIRST, OR THE BROWSER GETS THE LAST BUILD SOMEBODY REMEMBERED TO MAKE.
# The server is compiled from source every run; the client is a FILE it serves, so an
# edit to `editor_client.loft` is invisible here until `make client` runs. It cost a
# full diagnosis in the gates — a change read as "never runs" through three
# instrumented runs while the code was simply not in the page — and the same trap sat
# in every human-facing target: `play`, `play-fast`, `editor`, `editor-bg`.
play: port-free client
	@echo "building natively (first run compiles the graphics tree — minutes)…"
	@nohup $(LOFT) --native --lib lib/ src/editor_server.loft > .editor.log 2>&1 & echo $$! > $(EDITOR_PID)
	@until grep -q 'drag or A/D' .editor.log 2>/dev/null; do 	  if ! kill -0 $$(cat $(EDITOR_PID)) 2>/dev/null; then 	    echo "editor exited — last lines:"; grep -vE '^warning|^ *\||^ *-->' .editor.log | tail -5; exit 1; fi; 	  sleep 2; done
	@echo "editor up (native) on port $(EDITOR_PORT)"
	@$(MAKE) -s browser

play-fast: port-free client
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
# ⚠ **DEPENDENCY-TRACKED, AND `page-check` STILL FORCES IT.** This recipe was
# unconditional, so `make client` paid a ~5-minute wasm compile even when not one
# byte had changed — and every `page-check` and every probe loop paid it again.
# `CLIENT_SRC` is every loft file the page is built from, so an unchanged tree is a
# no-op and a changed one rebuilds.
#
# ⚠ **THAT IS NOT THE STALENESS THE WARNING BELOW IS ABOUT.** `page-check`'s note
# says the client is rebuilt on purpose because *"the stale page left there is
# exactly what would hide the next one of these"* — and the case it guards is a
# TOOLCHAIN swap, which changes no source file and so is invisible to `make`. A
# dependency on the sources cannot see a new `/usr/local/bin/loft`. So `page-check`
# keeps a forced rebuild (`client-force`) and only the dev loop gets the cheap one.
CLIENT_SRC := $(wildcard src/*.loft) $(wildcard lib/*/src/*.loft)

client: src/.loft/editor_client.html

src/.loft/editor_client.html: $(CLIENT_SRC)
	$(LOFT) --html --lib lib/ src/editor_client.loft
	@echo "wrote src/.loft/editor_client.html"

client-force:
	$(LOFT) --html --lib lib/ src/editor_client.loft
	@echo "wrote src/.loft/editor_client.html (forced)"

# ⚠ ONE BOOT, NO BLOCKS — the fastest loop this tree has, and it was folklore until
# it was a target. `press.mjs` is what `probe/b2` drives the page with; this runs it
# directly, so a gesture can be tried without the sixteen browser boots a full
# `probe-demo` pays for. It ASSERTS NOTHING and says so: reading the output is the
# point, and a claim about the editor still needs `make probe-demo`.
#   make press K='#part'          click the first catalogue row
#   make press K='ArrowUp,w,w'    keys, in order
#   make press K='@raise'         click a verb slot · `~world` drags the world
press: client pages
	@test -n "$(K)" || { echo "usage: make press K='#part'   (keys, @verb, #kind, ~world)"; exit 2; }
	@node probe/b1b/press.mjs "file://$(PWD)/_site/index.html" "$(K)" \
	   --await 'no server answered' --wait-ms 90000 2>&1 | grep -E '^(client|canvas|click)'

editor: client
	$(LOFT) --interpret --lib lib/ src/editor_server.loft

editor-bg: client
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
# ⚠ IT WATCHED `#gl`, WHICH IS THE DELETED PAGE'S CANVAS. `html/editor.html` named its
# canvas `#gl`; loft's `--html` shell names its own `#c`, and `/` now serves the wasm
# client — so this check was looking for an element that no longer exists on any route.
# The two-renderers pair it belonged to is gone with it: `/` and `/client` are the same
# page. Kept as a route check — that `/` serves the client at all — because that is the
# one thing `client-check` does not cover.
editor-check:
	node $(LOFT_TOOLS)/html_render_check.mjs http://127.0.0.1:$(EDITOR_PORT)/ \
	  --wait-ms 20000 --canvas '#c' --canvas-min-colors 12 --screenshot /tmp/w0.png

# The SAME check against the wasm client (plan #16, S1) — same server, same wire,
# same claim: it drew a world and not a flat sky. The canvas is `#c` because that is
# what loft's `--html` shell names its own, and the wait is longer because the page
# boots a 670 KB wasm before it dials.
#
# ⚠ THIS WAS S1'S DONE-WHEN, and the pair it belonged to no longer exists: with
# `html/editor.html` deleted, `/` and `/client` serve the SAME page. The two checks now
# measure one renderer over two routes, which is worth keeping — a route that stops
# serving the client is a real failure — but it is no longer a comparison, and reading
# it as one would be reading agreement between a thing and itself.
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

# hex_voxel's exact-size proofs run as a PROGRAM, not under `loft test`: several
# save-and-measure tests in one test file hang the harness (see
# lib/hex_voxel/probe/sparsity.loft). Same assertions, same exactness, a runner
# that works.
gate-hexworld:
	@printf '%-34s ' "hex_voxel/probe/sparsity"; \
	  $(LOFT) --lib lib/ lib/hex_voxel/probe/sparsity.loft | tail -1
	@printf '%-34s ' "hex_voxel/probe/edgehold"; \
	  $(LOFT) --lib lib/ lib/hex_voxel/probe/edgehold.loft | tail -1
	@printf '%-34s ' "moros_map/probe/slopeline"; \
	  $(LOFT) --lib lib/ lib/moros_map/probe/slopeline.loft | tail -1

# ⚠ ONE SERVER PER GATE, ALL AT ONCE — see tools/run-gates.sh for the why. The
# serial version took 40+ MINUTES for 28 gates that need 87 seconds between them,
# and it held port 18090 throughout so nobody could touch the editor meanwhile.
# `GATE_JOBS` is how many at a time; each gets its own port from `GATE_PORT_BASE`.
GATE_JOBS ?= 10

gate-world:
	@GATE_JOBS=$(GATE_JOBS) sh tools/run-gates.sh tools/gates/world/*.mjs

gate-character:
	@GATE_JOBS=$(GATE_JOBS) sh tools/run-gates.sh tools/gates/character/*.mjs

# ── ⚠ THE FAST PATH — USE THIS WHILE ITERATING, NOT `make gate` ──────────────
#
# `make gate` is 44 gates and takes 10–20 minutes. It is the thing you run BEFORE
# YOU COMMIT, once. It is not an iteration tool, and using it as one is how a
# session spends an hour proving something a one-minute run already showed.
#
#   make gate-one G="cache"              one gate, ~1 min
#   make gate-one G="walk hipskin"       several, by bare name, either directory
#   make gate-rep G="cache" N=5          the SAME gate five times — the flake hunt
#   make check P=hex_part                layering + one package, interpreter only
#   make check P=hex_part G="part_bind"  …and the gates that cover it
#
# ⚠ `gate-rep` IS THE INSTRUMENT FOR A FLAKE, and it exists because the obvious
# alternative is wrong: a flake in ONE gate is not evidence you gather by running
# the other 43 again. Five runs of one gate is five minutes; five full suites is
# an hour and a half, and says no more about that gate.
gate-one:
	@test -n "$(G)" || { echo 'usage: make gate-one G="cache walk"'; exit 2; }
	@GATE_JOBS=$(GATE_JOBS) sh tools/run-gates.sh \
	  $(foreach g,$(G),$(wildcard tools/gates/*/$(g).mjs))
	@$(MAKE) -s stop-editor >/dev/null

gate-rep:
	@test -n "$(G)" || { echo 'usage: make gate-rep G="cache" N=5'; exit 2; }
	@n=$${N:-5}; i=1; bad=0; \
	  while [ $$i -le $$n ]; do \
	    printf 'run %s/%s ' "$$i" "$$n"; \
	    if GATE_JOBS=$(GATE_JOBS) sh tools/run-gates.sh \
	         $(foreach g,$(G),$(wildcard tools/gates/*/$(g).mjs)); \
	      then echo 'ok'; else echo 'FAILED'; bad=$$((bad+1)); fi; \
	    i=$$((i+1)); \
	  done; \
	  $(MAKE) -s stop-editor >/dev/null; \
	  echo "gate-rep: $$bad of $$n failed"; \
	  [ $$bad -eq 0 ]

# ── ⚠ THE HOT PATH — run this after every step; it starts NO servers ─────────
#
# `make fast` is layering plus every package's tests, one job per test FILE, on the
# interpreter. 113 files, and measured on this box: **16.5 s** at 16 jobs against
# ~140 s for the same tests serially, because the files are independent — `loft test`
# over `hex_part` and the sum of its sixteen files run one at a time agree at 35-39 s,
# so the parallelism costs nothing to buy.
#
# ⚠ NO GATES, DELIBERATELY, AND THAT IS THE POINT OF THE SPLIT. Every gate starts a
# server, waits for a port and drives a world; 44 of them are minutes. A check you run
# after each step must not do that, and a check that takes minutes is one you stop
# running. The gates are `make gate` and they belong to CI and to the moment before a
# commit — not to the loop.
#
# ⚠ AND NOT `--native`, ALSO DELIBERATELY. `make lib-test` is what runs both backends
# and it stays the pre-commit proof: the two are two implementations of one language,
# and loft#760 took `hex_voxel` from 114 green to 96 failed while `--native` passed all
# 114 on the same source. This is the fast loop, not the proof.
#
#   make fast                     the whole tree
#   make fast P=hex_part          one package (or several, quoted) — GUARDS ONLY, no probes
#   TEST_JOBS=8 make fast         fewer jobs, for a loaded box
#   TEST_VERBOSE=1 make fast      per-file seconds
#
# ⛔ **`P=` NARROWED THE TESTS AND NOTHING ELSE, WHICH MADE THE PER-PACKAGE LOOP THE
# SLOWEST THING IT COULD BE.** `$(P)` reached `run-tests.sh` alone, so
# `make fast P=hex_part` ran one package's files in under a second and then nine probes
# and six servers for ten minutes — a loop documented as *one package* and priced as the
# whole tree. STATE.md called it *"under a second"* the entire time. The probe tier is
# skipped under `P=` now, and the run SAYS SO at the end: a narrowed green that reads
# like a whole-tree green is this tree's most repeated defect, and it must not be the
# reward for narrowing.
FAST_PROBES = $(if $(P),:,$(MAKE) -s)
fast:
	@sh tools/layering.sh
# ⚠ **A SECOND STRUCTURAL GUARD, AND IT IS NOT WHAT `layering.sh` CHECKS.** That one
# reads the ARROWS — who may depend on whom. This reads the module FILE NAMES, which
# are global across the whole dependency graph (loft#912): two packages each holding
# `src/skin.loft` and each saying a bare `use skin;` means only one of them gets its
# own file, and **the consumer's `use` line order decides which**. Measured on
# `moros_sim` + `hex_part`, 2026-08-18 — see `probe/skin/README.md`.
	@sh tools/basenames.sh
# ⚠ **AND THE THIRD NAME QUESTION: WHO ELSE DECLARES THIS PUBLIC NAME.** `layering.sh`
# reads the arrows and `basenames.sh` the module file names; this reads the exported
# names — across a program's whole import graph (LIVE) and against the registry a
# lavition package will publish into (LATENT). ⛔ It was run by NOTHING until today and
# was red. Advisory against `tools/names.txt`, so a NEW collision shows and the ten
# recorded ones do not reprint every loop; `make names` is the gate. ~1 s.
	@NAMES_ADVISORY=1 sh tools/names.sh
# ⚠ **AND THE CLAIM THE CHECK ABOVE RESTS ON, RE-MEASURED EVERY LOOP — 2 s.**
# `tools/names.sh` was built because a colliding bare name bound SILENTLY by import order
# (loft#788); that is fixed, and this tree carried the old sentence in the tool's head for
# three weeks. `probe/names/run.sh` is the claim as a command, with a control, so it
# cannot rot in either direction: the day the silence returns, row A goes red here.
	@sh probe/names/run.sh > /dev/null
# ⚠ THE CITATIONS INTO THE FORMAL CORE, WHICH LIVES IN ANOTHER REPO. 98 sites here
# cite `X<n>` rows in `../hexbody/ROUNDTRIP.md`, and a citation rots SILENTLY — the
# prose goes on reading correctly while the number names something else. ⚠ It SKIPS
# when the sibling tree is absent: this is a consistency check, not a capability the
# build depends on, and a clone without hexbody must not go red.
	@python3 tools/citations.py check
# ⚠ **AND THE OTHER HALF OF THE SAME QUESTION: WHO ELSE CLAIMS THIS RULE.** `dups` lists
# every tag two or more PRODUCTION files claim, and `--check` fails when one of them has
# no verdict in `tools/dups.tsv`. The point is not that duplication is forbidden — most
# rows are one CONSTRAINT binding many sites, and two of them are two halves of a split
# the rule itself describes — it is that a second file claiming a rule gets LOOKED AT
# once, by somebody, with the argument written down. ⚠ The file count is part of each
# verdict, so a third claimant re-opens a row that was settled at two.
	@python3 tools/citations.py dups --check > /dev/null
# ⚠ **AND WHAT WE BUILD AGAINST IS NOT WHAT THE SIBLING TESTS.** Three manifests here
# said the registry was *byte-identical to the checkout (diffed, not assumed)*; measured
# 2026-08-18, all fourteen `hex_*` differ and **three differ in CODE** — including a
# `track_offset` fix in `hex_way` that the published 0.1.0 does not carry. It is a
# BASELINE rather than a threshold, because the drift is not this tree's to close: it
# fires when the sibling moves further OR when a republish lands. `probe/way/README.md`.
	@DRIFT_ADVISORY=1 sh probe/way/drift.sh
	@sh tools/walk-exact.sh
# ⚠ **THE CONSUMERS UNDER `src/`, WHICH THE PACKAGE SUITES NEVER COMPILE.** `loft test`
# builds `lib/` and stops there, so a library change can break a program under `src/`
# with 180 test files green — measured 2026-08-29, when a `hex_fit` dependency put a
# second `HEIGHT_SCALE` into the server's graph and it did not compile for a session.
# ⚠ **THE LOOP DID GO RED; IT SAID THE WRONG WORDS.** `probe-k1` starts the server, so
# it saw this — and printed `the server never listened`, verbatim the shape CLAUDE.md
# documents for the sibling emptying `~/.loft/build-cache`, so it was read as that flake
# and waited out. This says *it did not compile*, with loft's own diagnostic under it,
# 18-24 s in and not at minute four. Sweep: `probe/srcb/sweep.sh`, every row as predicted.
	@sh tools/src-build.sh
	@TEST_JOBS=$(TEST_JOBS) sh tools/run-tests.sh $(P)
	@$(FAST_PROBES) probe-k3c
	@$(FAST_PROBES) probe-t3
	@$(FAST_PROBES) probe-t4
# ⚠ **IN THE LOOP BECAUSE A TARGET ALONE FIXES NOTHING.** `probe/k1` had no target at
# all and was red for four days: `T1d` changed how an unknown verb travels and row E
# read the server's refusal as the server ACTING. A check nobody runs drifts red in
# silence, and this tree has now found that three times — k1, four `k3d` scripts whose
# baselines blessed a crash, and `K3f`'s five camera scripts. 42s, against the 100s
# `headless-same` already costs here.
	@$(FAST_PROBES) probe-k1
	@$(FAST_PROBES) probe-k3d
	@$(FAST_PROBES) probe-headless
# ⚠ THE AUTHOR ON THE PLAN — plan 26 `B3`. It runs one script and compares the picture
# against the walker at three stations, which is the only check in the tree that the
# plan view draws the person the TICK moved rather than a pose it made up.
	@$(FAST_PROBES) probe-plan
# ⚠ **THE FIRST HOUR, AND IT IS THE ONLY GATE ON DoD CLAUSE 8.** `probe/adopt` is the twelve
# lines a stranger writes before reading anything, and writing it by hand on 2026-08-28 found
# two live defects that 775 library tests and 58 gates had never asked about — a refused house
# that half-built itself, and a refusal whose advice could not be followed. ⛔ It had a target
# and no caller until 2026-08-29, which is exactly the *a check nobody runs drifts red in
# silence* this tree has now found four times (probe/k1, four `k3d` baselines blessing a crash,
# `K3f`'s five camera scripts, and this). ~30s.
	@$(FAST_PROBES) probe-adopt
# ⛔ **THIS SAID IT WAS THE ONLY THING IN `fast` THAT COMPILES A PROGRAM UNDER `src/`,
# AND IT HAD NOT BEEN SINCE 2026-08-24.** `probe-k1` joined the loop that day and starts
# the server too; `tools/src-build.sh` compiles all five non-client programs above. The
# claim was true when written and nothing re-read it — which is the same shape as the
# `probe-k1` note above one level up, a tier table going stale in a comment.
# ⚠ **WHAT IT RECORDS IS STILL WHY IT RUNS A SERVER**: a name collision in
# `editor_server.loft` presented as a thirty-minute HANG, with the compiler's own
# two-line diagnostic sitting in `.editor.log`, and nothing in this tier noticed
# because nothing in this tier built it. It also carries `probe-s2c`, so the fast loop
# now sees a divergence between the two drivers instead of only the library's own view
# of itself. ⚠ It starts FIVE servers, each stopped: one for the house sentence and one
# per `probe-s2c` script, of which `S=` names four. **It said FOUR while naming both
# halves of five** — written when `S` had three scripts, and `tower` made it four below
# without this line moving. `probe-k1` starts a sixth earlier in the loop. Measured — the sentence half alone was 11.8 s, and `make fast`
# end to end is 5m04 with the pair in it.
# ⚠ **`tower` IS THE FOURTH — plan 26 `B4g`.** `59:` is a brand-new wire message, and
# the runner's line and the server's handler print sentences that differ by nothing a
# gate reads; only the saved world can say the two rimmed the same circle. It is in the
# fast loop for the reason the `probe-k1` note above gives — *a check nobody runs drifts
# red in silence* — and a new message is exactly when that costs most.
#
# ⚠ **`walltype` IS THE THIRD SCRIPT AND IT EARNED ITS SEAT ON ITS FIRST RUN — plan 26
# `B4e`.** The wall-type selection reaches `editor_run` as a line and the server as
# `58:`; the server chose correctly and then stamped byte 1 anyway, because
# `tools/script.mjs` sent `25:1` and a material on the wire outranked the choice behind
# it. Runner 0 wall bytes against served 12 — and **both drivers printed the identical
# sentence**, so nothing but the saved world could have said so.
	@$(FAST_PROBES) headless-same
	@echo "fast: ⚠ NOT run here — the browser. Nothing above builds or drives the"
	@echo "      --html page; \`make page-check\` is the tier that does. A green fast"
	@echo "      loop cleared a toolchain swap on 2026-08-16 while the browser editor"
	@echo "      was broken the whole time (loft#950)."
# ⚠ A SHELL `if`, NOT `$(if …)`: make splits that on the FIRST COMMA, and this text has
# three — measured, the recipe died with *unexpected EOF while looking for matching `"`*.
	@if [ -n "$(P)" ]; then \
	  echo "fast: ⚠ P=$(P) — THE PROBE TIER WAS SKIPPED. This green is one"; \
	  echo "      package's test files plus the guards, and says NOTHING about the"; \
	  echo "      server, the drivers or the scripts. Run a bare \`make fast\` before"; \
	  echo "      you commit."; \
	fi

# ── THE TWO CHECKS THAT DRIVE A BROWSER ─────────────────────────────────────
#
# The only checks in this tree that build the `--html` client and put keys into it.
# `probe-demo` opens `_site/index.html` off a disk with no server anywhere;
# `probe-auth` serves the same bytes three ways and watches which authority the page
# claims.
#
# ⚠ **IT IS OUT OF `make fast` BECAUSE IT IS SLOW, AND THAT IS A COST, NOT A
# DECISION.** A client build is minutes; the fast loop is seconds and is meant to stay
# that way. What the split cost, once: `/usr/local/bin/loft` was replaced on
# 2026-08-16 23:08 and the re-check that signed it off — 157 test files, `layering.sh`,
# `walk-exact.sh`, `probe-k3c`, `probe-t3`, `probe-t4`, every one green — **does not
# touch a browser**. The `--html` page had stopped working entirely
# (`RuntimeError: unreachable`, loft#950) and nothing said so for a day.
#
# ⚠ **SO RUN THIS AFTER A TOOLCHAIN CHANGE, BEFORE SIGNING ONE OFF.** It rebuilds the
# client on purpose rather than reusing whatever is in `src/.loft/` — the stale page
# left there is exactly what would hide the next one of these.
page-check: client-force pages
	@$(MAKE) -s probe-demo
	@$(MAKE) -s probe-auth

check:
	@sh tools/layering.sh
	@test -n "$(P)" || { echo 'usage: make check P=hex_part [G="part_bind"]'; exit 2; }
	@printf '=== %s ===\n' "$(P)"
	@cd lib/$(P) && $(LOFT) test 2>&1 | grep -viE '^  (Warning|Advice)'
	@if [ -n "$(G)" ]; then $(MAKE) -s gate-one G="$(G)"; fi

# ⚠ THE SUITE STOPS WHAT IT STARTED. Each gate gets a fresh server and the last one
# used to be left running — for days, at 76% of a core once a client had connected
# and left. A suite that leaves a process behind on a shared box is not finished.
# ⚠ ONE POOL, NOT TWO BATCHES. Split into world-then-character, the suite pays the
# slowest gate of each half in series; as one pool it pays the slowest gate once.
# Measured: 2m33 split, 1m30 pooled, for the same 28 gates and the same verdicts.
# ⚠ S7'S CLAIM, CHECKED: the same script builds the same scene with and without a
# server. `editor_run` drives `hex_editor`'s gestures directly and the socket path
# drives them through the editor, so the two agree only if the gestures really are
# the one implementation — which is the whole reason they moved out of the message
# loop. It compares the ACK, because that is the editor's own reckoning of what it
# built, and a divergence in cells, edges or ridge names which one moved.
# ⚠ THE FRAME ITSELF, AS NUMBERS — and it IS in `make gate` now, as
# `tools/gates/world/camera_indoors.mjs`. This target is the same script by hand,
# for when the pictures are what you want rather than the verdict. Every wrong turn
# in the camera work came from reading a picture by eye; this counts the pixels
# instead, classifying by chromaticity so a lit surface and a shadowed one land in
# the same bucket.
#
# Three rows now, and the middle one is the direct test of what was actually broken:
#
#   cam <lo> <hi>       where the EYE is, off the `C:` matrix the renderer used
#   frame <sub> <max>   the subject at least 0.5% of the frame, no surface over 60%
#
# What it read on the way, and every line of it was measured:
#
#   before          outside 1.54%/grass 53%   floor 0.09%/masonry 78%   corner 10.6%/78%
#   camera on wire  outside unchanged         floor 10.6%/masonry 50%   corner 2.7%/61%
#   floor drawn     outside unchanged         floor 10.6%/masonry 71%   corner 2.7%/77%
#   floor separable outside unchanged         floor 10.6%/masonry 47%   corner 2.7%/48%
#
# ⚠ THE THIRD ROW IS THE ONE TO READ. Drawing the missing floor made the gate REDDER,
# because `masonry` was wall AND floor in one bucket — the fix was owed to the
# instrument before the threshold over it could mean anything.
camera-frame:
	@$(MAKE) -s port-free >/dev/null 2>&1; : > .editor.log
	@nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & \
	 until grep -q 'listening on port' .editor.log; do sleep 0.3; done; \
	 node tools/script.mjs tools/scripts/indoors.keys --shots; rc=$$?; \
	 $(MAKE) -s stop-editor >/dev/null; exit $$rc

# Plan 17 `A2.1` — BUILD THE AUTHORED PARTS FROM THE PROCEDURAL GESTURES.
#
# `src/part_build.loft` runs `stencil_place` once, cuts the result with
# `part_from_region` and writes `data/parts/house/cottage.hxw`. ⚠ It VERIFIES what
# it wrote — reloads the file, compares through `part_diff`, reads `PART` and
# `ANCH` back — and asserts rather than printing, so a broken part stops here
# instead of reaching whatever opens it next.
#
# The output is COMMITTED. A part is content, not a build artifact: #18 `B5` lists
# what is in `data/parts/`, and a catalogue that is empty until somebody runs a
# make target is a catalogue that is empty. ⚠ Committing it is only sane because
# the build is DETERMINISTIC — same bytes, same md5, every run, since `τ` counts
# the gestures rather than the seconds. A file that changed each run would put a
# 64 KB diff in every commit that happened to touch it.
#
# ⚠ STDERR IS FILTERED, NOT DISCARDED. `2>/dev/null` hid the loft advice AND the
# assertion message, so a mutant that broke the part failed the build with nothing
# said — which is a gate you cannot act on. The refusal is printed and only the
# advice is dropped.
# ⚠ AND `src/prop_build.loft` IS THE SECOND HALF, plan 17 `A6.2`: a statue, a
# plinth and the shrine that puts one on the other — §P5's OTHER kind of part, in
# the same library and in the same sockets. It writes a `.glb` as well as three
# `.hxw`, all four committed and all four rebuilt byte-identically, and its gate is
# a `part_expand` rather than a re-read: three files that load are not a statue on
# a plinth. ⚠ `PROP_OUT` redirects it, the way `PART_OUT` redirects the cottage.
parts:
	@$(LOFT) --interpret --lib lib/ src/part_build.loft 2>.parts.err \
	  || { echo "PARTS: the part it built is not the part it wrote"; \
	       grep -A6 '^error:' .parts.err | head -20; \
	       rm -f .parts.err; exit 1; }
	@$(LOFT) --interpret --lib lib/ src/prop_build.loft 2>.parts.err \
	  || { echo "PARTS: the statue is not on the plinth"; \
	       grep -A6 '^error:' .parts.err | head -20; \
	       rm -f .parts.err; exit 1; }
	@rm -f .parts.err

# ⛔ **THE WAIT IS BOUNDED, AND IT IS BOUNDED BECAUSE IT WAS NOT — plan 22 `D1`.** A
# name added to `hex_editor` collided with a private one in `src/editor_server.loft`
# (*"Cannot redefine 'mode_name'"*), so the server never reached `listening on port` —
# and this loop spun for **thirty minutes** until an outer timeout killed it, with the
# compiler's own two-line diagnostic sitting in `.editor.log` the whole time. ⚠ **A
# build failure that presents as a hang is not a build failure anyone reads**, and it
# was the only check in the tree that noticed at all: `make fast`, `make lib-test`,
# `make parts` and `probe/k3d` compile neither program under `src/`.
#
# ⚠ THE BOUND IS GENEROUS ON PURPOSE — this box carries other agents' work and a cold
# server build has been minutes. What matters is that it ENDS and says what it saw.
#
# ⚠ AND THE FAST PATH IS THE PID, NOT THE CLOCK: a build failure kills the process in
# seconds, so waiting out the timeout would still bury the diagnostic under ten minutes
# of nothing. ✅ **Checked against the failure it was written for** — the collision put
# back deliberately, this target now reports loft's own two lines in **3.2 s**.
headless-same:
	@SCRIPT=tools/scripts/house.keys WORLD=headless $(LOFT) --lib lib/ src/editor_run.loft 2>/dev/null \
	  | grep -oE 'house placed [0-9]+ cells, [0-9]+ wall edges, ridge at [0-9]+' > .headless.txt || true
	@$(MAKE) -s port-free >/dev/null 2>&1; : > .editor.log
	@nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & \
	 srv=$$!; waited=0; \
	 until grep -q 'listening on port' .editor.log; do \
	   sleep 0.3; waited=$$((waited + 1)); \
	   if ! kill -0 $$srv 2>/dev/null; then \
	     echo "HEADLESS: the server EXITED without listening — it did not build:"; \
	     grep -E '^error' -A4 .editor.log | head -12; exit 1; \
	   fi; \
	   if [ "$$waited" -gt 2000 ]; then \
	     echo "HEADLESS: the server is alive and never said 'listening on port' in 600s:"; \
	     tail -6 .editor.log; \
	     $(MAKE) -s stop-editor >/dev/null; exit 1; \
	   fi; \
	 done; \
	 node tools/script.mjs tools/scripts/house.keys >/dev/null 2>&1; \
	 grep -oE 'house [0-9]+ cells' .editor.log | head -1 > /dev/null; \
	 grep -oE 'house placed [0-9]+ cells, [0-9]+ wall edges, ridge at [0-9]+' .editor.log \
	   | head -1 > .served.txt || true
	@$(MAKE) -s stop-editor >/dev/null
	@if [ ! -s .headless.txt ]; then echo "HEADLESS: the runner placed no house"; exit 1; fi
	@if ! diff -q .headless.txt .served.txt >/dev/null 2>&1; then \
	  echo "HEADLESS: the same script built different scenes"; \
	  echo "  headless: $$(cat .headless.txt)"; \
	  echo "  served:   $$(cat .served.txt)"; exit 1; fi
	@rm -f .headless.txt .served.txt
	@$(MAKE) -s probe-s2c S="niche embrasure walltype tower"

# S2c (plan 22) — THE SAME SCRIPT BUILDS THE SAME WORLD, WITH AND WITHOUT A SERVER,
# **on the openings**. The target above compares one SENTENCE and that sentence is
# `verb place`'s; this compares the saved worlds BYTE FOR BYTE.
#
# ⛔ **IT WAS FALSE FOR FIVE OF THE EIGHT SCRIPTS THAT CUT AN OPENING**, because the
# server's `36:` handler was a second body of `hex_editor::session_open_kind` with
# `D1a.2`'s defect still in it — `niche` opened 6 edges headless and 3 served,
# `embrasure` 2 and **3**. See `probe/s2c/README.md`; the table and both controls are
# there.
#
# ⚠ `S=` NARROWS IT, and `headless-same` above passes the two rows that diverged in
# OPPOSITE directions — one where the server opened fewer edges and one where it opened
# more. A bare `make probe-s2c` runs all eight, which is what a change to the opening
# family should do.
#
# ⚠ THREE OF THE EIGHT AGREED EVEN BEFORE THE FIX, so a shorter default list is not a
# cheaper version of this check — it is a version that reports the defect as absent.
probe-s2c:
	@GROUND=0 sh probe/s2c/run.sh $(S)

# SHOW THE GUARDS, AND CHECK THEM. Every S3 probe, each printing its own verdict, and
# the ones that draw a map draw it here — the guard's decisions as a picture rather than
# a count. `probe/s3/README.md` says why that distinction earned its own target.
guards:
	@sh probe/s3/run.sh

# B1.1 (plan 18) — does the text bridge reach the canvas, on BOTH targets?
# ⚠ Spawns headless Chrome and an xvfb display; both are cleaned up by the script.
probe-text:
	@sh probe/b1/run.sh

# THE GATING FORM OF THE DRIFT CHECK, for the moment somebody is about to trust a
# `hex_*` answer. `fast` runs it ADVISORY instead.
#
# ⛔ **AND THIS TARGET WAS BRIEFLY DECLARED IN THE MIDDLE OF `fast`'s RECIPE, WHICH
# TRUNCATED IT — 2026-08-19.** A target declaration ends the recipe above it, so
# `walk-exact`, `run-tests`, four probes and `headless-same` silently became part of
# THIS target, and `make fast` went green **in 0.367 seconds** having run three checks
# out of ten. ⚠ It was caught by the CLOCK, not by the exit code: rc 0 is what a tier
# that runs nothing reports. *When a green run is used to clear a change, ask what it
# does not run* — written in this file already, and walked into anyway while using
# `fast` to clear a new toolchain.
drift:
	@sh probe/way/drift.sh

# THE GATING FORM OF THE NAME CHECK, `drift`'s shape for the same reason. `fast` runs it
# ADVISORY against `tools/names.txt`; this prints every row and fails on any of them.
#
# ⛔ **IT HAD NO TARGET AT ALL UNTIL 2026-08-29 AND WAS RED.** Nothing ran `tools/names.sh`
# — not `fast`, not `gate`, not a probe — and its one LIVE row and ten LATENT ones had been
# sitting unread. Its own list was short by two packages, and adding them found a row
# nobody had ever seen (`hex_rig::seg_len`, taken twice in the registry). ⚠ Advisory rather
# than gating because the latent rows are **naming decisions about a public surface**, not a
# build failure to clear this afternoon — see LAVITION_SPLIT.md. Blessing them into `KNOWN`
# for a green would be silencing the check, which its own head tells you not to do.
names:
	@sh tools/names.sh

# THE TOOLCHAIN CLAIM UNDER `names`, printed rather than swallowed. `fast` runs it quiet.
probe-names:
	@sh probe/names/run.sh

# NAMES_BLESS=1 sh tools/names.sh re-records the baseline the advisory line compares to.

# THE PRE-FLIGHT FOR STARTING A PLAN — are its steps small AND validated?
#   make plan-check P=22-pages-client
# ⚠ DELIBERATELY NOT IN `make fast`. It is run at ONE moment — when a plan stops
# being a design and starts being work. A design may be rough until then, and a
# gate that demanded cut steps of every idea is one people route around.
plan-check:
	@sh tools/plans.sh $(P)

# THE PLAN VIEW — plan 26 `B0`. A saved world, drawn flat, as SVG you open.
#
#   make plan-view                      # worlds/headless.hxw -> worlds/headless.svg
#   make plan-view WORLD=deck Q0=-8 Q1=9 R0=-8 R1=9 REF=2.0
#   make plan-view WORLD=deck REFS=2.0,5.0        # two floors, side by side
#
# ⚠ IT READS THE `.hxw` AND NOTHING ELSE, which is the boundary `B0` stops at: the
# store is the authority a save carries, and the authored run is not in it at all
# (EDITOR_DEFECTS 5). A picture that quietly mixed the two would be answering
# neither question. `B1` adds the description and has to say where it got it.
#
# ⚠ NOT IN `make fast`, and not because it is slow. What it produces is a PICTURE,
# and a picture is not a gate — the claims about it are `lib/hex_mesh/tests/planview.loft`,
# which compares the emitted text against the store. This target is for a person.
# B3 (plan 26) — DOES THE PLAN DRAW THE PERSON THE TICK MOVED? `editor_run`'s `plan`
# command emits the view at the current tick and prints the marker READ BACK OUT of the
# SVG; `feet` prints the walker. Three stations, compared — with a control that the
# three are not the same point, because a marker nailed to one place would otherwise
# pass every row.
# B4k (plan 26) — IS A BAY A FEATURE OF ITS WALL? BLUEPRINT §2.4 proposes a bay as a
# span on its parent wall's surface, recovered from the parent's feature list. Measured:
# a parent's feature cannot reach a projecting face at ANY span, because `apply_features`
# re-materialises edges already on that surface and never places geometry. The bay is a
# SURFACE; what it lacks is the association. See probe/b4k/README.md.
probe-b4k:
	@$(LOFT) --interpret --lib lib/ probe/b4k/b4k.loft 2>/dev/null

probe-plan:
	@sh probe/plan/run.sh

plan-view:
	@WORLD=$(if $(WORLD),$(WORLD),headless) \
	 $(if $(Q0),Q0=$(Q0),) $(if $(Q1),Q1=$(Q1),) \
	 $(if $(R0),R0=$(R0),) $(if $(R1),R1=$(R1),) $(if $(REF),REF=$(REF),) \
	 $(if $(REFS),REFS=$(REFS),) \
	 $(LOFT) --interpret --lib lib/ src/plan_view.loft 2>/dev/null \
	  | grep -E '^plan_view:' || { echo "plan-view: the run said nothing — re-run without 2>/dev/null"; exit 1; }

# P2 (plan 22) — can OUR javascript talk to loft inside a `--html` page?
# The interim storage bridge (`W5`) rests entirely on this. Spawns headless Chrome
# and cleans it up; reads the verdict out of the PAGE's own `<pre>`, not out of a
# value this side computed.
probe-p2:
	@sh probe/p2/run.sh

# P6 (plan 22) — DOES A `--html` PAGE HAVE A FILESYSTEM, AND DOES A WORLD SAVED IN
# IT SURVIVE A RELOAD? The design measured `--html` binding 0 of 20 `fs_*` names and
# wrote `W5`, an interim shim, on that premise. loft#851 landed; this is what says
# so about the INSTALLED toolchain rather than about a changelog, and it retires
# `W5`. Drives the page twice over http AND from `file://`, with the interpreter as
# the oracle. `P6_SABOTAGE=persist` is the control.
probe-p6:
	@sh probe/p6/run.sh

# B1a (plan 22) — DOES THE CLIENT SEND WHAT IT ALWAYS SENT, now that its keys name
# VERBS instead of wire messages? ⚠ NOTHING ELSE CHECKS THIS: `make gate` drives the
# server through script.mjs and `make client-check` counts colours in a picture, so
# neither presses a key in the client at all. The instrument is two things, because
# each is blind on its own — the server's println stream cannot tell a fence from a
# wall, and the saved world cannot tell one opening profile from another.
# `B1A_BASELINE=1` rewrites the committed baseline; `B1A_SOURCE=<file>` builds a
# different client, which is how the sabotages run.
probe-b1a:
	@sh probe/b1a/run.sh

# B2 (plan 22) — ASSEMBLE `_site/`, THE QUICK-START DEMO. It is a COPY of the client
# engine build and asserts it arrived verbatim: the design's rule is that the demo and
# the page the server serves are one artifact, because two would have to be kept in
# step. Refuses an engine older than its own sources rather than shipping last week's
# editor behind a build step.
# A0p (plan 24) — IS A STRAIGHT WALL RECOVERABLE FROM ITS OWN EDGE STAMP? The whole
# of plan 24 rests on the `WallRun` record being redundant, so this stamps a run at
# each of the 24 headings, reads the marked edges back out of the STORE and tries to
# recover the line. ⚠ IT REFUTED ITS OWN PREDICTION — 19 of 24, five wrong by 10.46°
# against a 15° quantiser — and its control 1 is why that reads as *the method is
# wrong* rather than *five edge cases to polish*: a deliberate one-step rotation left
# 4 of 24 still matching, so the fit's error is the size of the step it resolves.
# probe/a0p/README.md has what `A1` must do instead.
probe-a0p:
	@loft --interpret --lib lib/ probe/a0p/a0p.loft 2>/dev/null | sed -n '/^A0p/,$$p'

# A0p, attempt 2 — AND IT SCORED WORSE, WHICH IS THE POINT. It copied
# `hex_draw::surface_of`'s exact integer body into the probe "with the `Plan` taken
# out", then invented a fold to replace the ordering the `Plan` had been providing:
# 8 of 24 against the float fit's 19, and `surface_heading` = -1 on 22 of 24. ⚠ A
# due-east wall sums to (-14, 0) — the edge vectors CANCEL, because `surface_of`
# walks a side in reading order and a scan of the store has no order at all.
# Kept as the record of the ground rule being broken: the algorithms are never ours.
probe-a0p-exact:
	@loft --interpret --lib lib/ probe/a0p/exact.loft 2>/dev/null | sed -n '/^A0p2/,$$p'

# H1 (plan 24) — WHICH DIRECTIONS CAN A RUN OF n EDGES POINT IN? ⚠ NOT a measurement
# of `D`: the 24 linework directions are DEFINED and gated in hexbody (12 exact + 12
# at a uniform 1.1021 deg bias, vector (7,-2)) — see doc/claude/FORMAL_CORE.md. What
# this measures is the run-length law, which is what DERIVES the house/world split
# from the lattice: a side of 1-2 edges can only point 12 ways, so a short-walled
# house is a 12-heading object by construction.
probe-headings:
	@python3 probe/headings/enumerate.py

# A0q (plan 24) — CALL `hex_draw` ON INPUT IT ACCEPTS: the control `A0p` never ran.
# 48 of 48 side-runs exact over 12 orientations, and the clean least-squares scatter
# comes out 0.9166666666666679 — `X47`'s own gated control number, to the digit, from
# a different tree. ⚠ Its finding is that `surface_heading` TELESCOPES to the chord and
# is blind to a notch by construction; straightness is `surface_lsq_residual`.
probe-a0q:
	@loft --interpret --lib lib/ probe/a0q/a0q.loft 2>/dev/null | sed -n '/^A0q/,$$p'

# H1 (plan 24) — `D`, THE 24 LINEWORK DIRECTIONS, PRINTED FROM `hex_shape` RATHER
# THAN DERIVED: 12 exact + 12 at a uniform 1.1021137519860 deg bias (`X29`, to 13
# significant figures). ⚠ Its §3 is the one that moved the plan: a run written with
# `wall_write` and read back with `wall_read_run` round-trips 24 of 24, so `L1` is a
# CALL and not the upstream library change the plan had it as.
probe-h1:
	@loft --interpret --lib lib/ probe/h1/h1.loft 2>/dev/null | sed -n '/^H1 —/,$$p'

# B0p (BLUEPRINT §2.5) — AT WHAT SIZE IS AN OCTAGON UNIQUELY DEDUCIBLE? ⛔ It never
# is: `rebuild_construct` returns a SIX-sided form with rho=0 for a field drawn as an
# octagon, or refuses. And distinguishability is not monotonic, so "large enough"
# cannot be a rule. ✅ The question was malformed — `@HB-X12` stores the body in the
# PALETTE, so a tower is stored rather than deduced.
probe-b0p:
	@loft --interpret --lib lib/ probe/b0p/b0p.loft 2>/dev/null | sed -n '/^B0p/,$$p'

# B1p (BLUEPRINT §1) — WHAT SURVIVES A WALL'S ROUND TRIP? Cells, edges and the
# PALETTE all do; the run record does not. ⚠ Its finding was a COMPILE ERROR:
# `world_to_bytes(w, palette, owner)` takes a palette, which the design had assumed
# did not exist — so a wall's body and thickness have a home after all.
probe-b1p:
	@loft --interpret --lib lib/ probe/b1p/b1p.loft 2>/dev/null | sed -n '/^B1p/,$$p'

# B2p (BLUEPRINT §2.3) — CAN `cut_arb` PLACE A 45° FACE AT ALL? ✅ Yes: the bay's 13
# boundary edges go 5/4/4 to the two cants and the front, and NOT ONE to the parent
# wall. ⚠ Read its first-version note — measuring ALL the room's edges reported a
# stray of 8.2 that was a fact about the three walls the fixture never declared.
probe-b2p:
	@loft --interpret --lib lib/ probe/b2p/b2p.loft 2>/dev/null | sed -n '/^B2p/,$$p'

# B4x (plan 26) — A WALL THAT TURNS. `hex_shape::wall_chain_walk` orders the marks into a
# chain; this cuts it into runs, and is that entry point's consumer check. ✅ 1 / 2 / 3 / 4
# pieces with NOTHING left over, where the shipped peel loses 12 of a zigzag's 18 marks and
# all 50 of a closed room's. ⛔ Its own first version had ONE seed per fixture and drew
# conclusions about cut rules from it; a loop can be walked from any of its vertices, so the
# sweep over every seed is the control that separates the rule from the starting point.
# ⚠ Takes minutes. Not in `make fast`; it ships nothing, and its subject is a design
# decision rather than a guard.
probe-b4x:
	@loft --interpret --lib lib/ probe/b4x/b4x.loft 2>/dev/null | sed -n '/^B4x/,$$p'

# B4y (plan 26) — WHICH END OWES THE CORNER? The cross-tabulation `B4x` and `probe/pc`
# never made between them: over the same 25 rectangles, a LEAK is a GAP corner (7 of 7, and
# 0 of 18 leak without one) and an OVER-DESCRIPTION is a FORK corner (17 of 17). ⛔ The fork
# is one edge two runs BOTH generate — `twice-claimed` equals `spurs` in every row — so
# `@HB-X36`'s *claimed exactly once* is broken in both directions and the fix is the STAMP.
# ⛔ And half the obvious repair is refuted here: dropping the doubly-claimed edge closes the
# topology and makes the walls unrecoverable, because no run generates a field with an edge
# taken out of it. ✅ The ADD alone takes 7 leaks to 0 and 7 closed chains to 23.
# ⚠ Takes minutes. Not in `make fast`; its subject is a design decision.
probe-b4y:
	@loft --interpret --lib lib/ probe/b4y/b4y.loft 2>/dev/null | sed -n '/^B4y/,$$p'

# B5 (plan 26) — THE ROOM FROM ITS CELLS. The project owner's algorithm, which turned out to
# be `@HB-X45` and already built: flood the space, hand the region to
# `hex_recover::rebuild_construct`, which proposes a form from the hull and VERIFIES it by
# re-drawing. ✅ 25 of 25 rooms answer R1 with rho 0 and ZERO `run_edges`, where the best
# mark-side cut is exact on 14 of 25 at 363..4834 calls each. ⚠ The control is `place_house`'s
# own floor, which the Box reader accepts and which refuses all 25 rooms — so the run is not a
# reader saying yes to everything. Seconds.
probe-b5:
	@loft --interpret --lib lib/ probe/b5/b5.loft 2>/dev/null | sed -n '/^B5/,$$p'

# B7 (plan 26) — OUR DOORSTEPS AGAINST `hex_fit`'S, measured before any was replaced, because
# a doorstep that refuses more than the field distinguishes is worse than none (`@HB-X66`).
# ✅ The shell PREDICATES agree on 200 of 201 — the one difference is this gesture's own
# minimum. ⛔ The shell OFFERS differed on 89 of 192, and upstream's rule won: `fit_shell`
# offered the shell BELOW where `@HB-X65` and `fit_ordinal`'s own contract both say NEAREST.
# ⛔ The height doorstep cannot be adopted: `hex_fit::HEIGHT_SCALE` is a constant 0.25 and this
# tree's scale is per world — 40 and 30 disagreements at the two other units it uses. Seconds.
probe-b7:
	@loft --interpret --lib lib/ probe/b7/b7.loft 2>/dev/null | sed -n '/^B7/,$$p'

# B8 (plan 26) — THE ROOF THIS EDITOR DRAWS, READ BACK. Twelve `roof_*` functions here draw a
# roof and none recovered one. ✅ `hex_roof::roof_match` returns ROOF_RIDGE at residual 0 —
# peak 7.75, slope 2/3, on the true ridge line spanning the footprint — so no tolerance is
# needed at all, against a control (one column raised) at 0.649. ⛔ The adoption was the
# instrument: it found three separate bugs in `hex_roof`'s ridge fit, none visible from inside
# the library, because every hand-built fixture attains its maximum exactly and spans its own
# footprint. Seconds.
probe-b8:
	@loft --interpret --lib lib/ probe/b8/b8.loft 2>/dev/null | sed -n '/^B8/,$$p'

# B9 (plan 26) — IS OUR `∂` THE LIBRARY'S? WALL_PUSH says the definition stays
# `hex_draw::draw_walls`' and is "compared against, never copied", and three sites here copied
# it. ✅ Identical edge for edge on a placed house's floor, three discs, a RING (where `∂` is
# two loops) and both degenerate cases — so `claim_region` and the region reader's residual now
# ask the library. ⛔ One site is left with its reason: the house reader's region is a `Box`,
# not a `HexSet`. Seconds.
probe-b9:
	@loft --interpret --lib lib/ probe/b9/b9.loft 2>/dev/null | sed -n '/^B9/,$$p'

# C1 (plan 26) — WHY `hex_place::combine_cut` HAS NO CALLER. Not because we copy it, the way
# `draw_walls` was copied, but because the CAPABILITY is missing: nothing here adds a
# same-level box to a structure, and the gesture refuses a second house whose footprint
# overlaps ZERO cells. ✅ The primitive agrees with our stamping when nothing is shared (76
# edges both ways) and fuses the seam when something is — 18 edges against our 18-edge seam.
# ⛔ Wiring it today would answer hexbody's hall-vs-room question as "fuse". Seconds.
probe-c1:
	@loft --interpret --lib lib/ probe/c1/c1.loft 2>/dev/null | sed -n '/^C1/,$$p'

# C2 (plan 26) — A ROOM IS THE HOUSE AGAIN, ADJACENT. The union cut ONCE by
# `hex_place::combine_cut`, with the seam the structure already had CLEARED — `shared_marked`
# 0 and `leak_count` 0 on every adjacency, against a non-touching control where
# `set_connected` says false. ⛔ Its sweep found a hole in its own tests: with the boundary
# never written every row passed, because `leak_count` floods the CELL set and says nothing
# about walls. Seconds.
probe-c2:
	@loft --interpret --lib lib/ probe/c2/c2.loft 2>/dev/null | sed -n '/^C2/,$$p'

# WP (WALL_PUSH) — the four probes of the wall-push design. ⛔ Two of the first draft's rules
# are REFUTED: a diagonal wall moves 3.6x FURTHER per step, not 6.25x less (the line spacing
# was a lower bound by 2x / 26x), and the obstacle refusal was unfounded — 576 of 576 heading
# pairs admit the displacement. ✅ Probe 4 measures the model that replaced it: a wall is
# where inside meets outside, and transferring a cell with k inside neighbours changes the
# wall-edge count by exactly 6-2k. Pure arithmetic, no world, seconds.
probe-wp:
	@loft --interpret probe/wp/wp.loft 2>/dev/null | sed -n '/^WP —/,$$p'
	@loft --interpret probe/wp/wp4.loft 2>/dev/null | sed -n '/^WP probe 4/,$$p'

# B3p (BLUEPRINT §3.1) — DOES THE WALKER MOVE WITH NO COLLISION `EdgeSet`? ✅ The
# LIBRARY can: `walk_to` with an empty set covers 42.67773189849706, the no-fence
# control to the last digit. ⛔ But `walk_tick` cannot be asked for it — the proxy is
# unconditional, and `reach = 0` still blocks. §3.1's "absence of a call" is a
# property the API does NOT have today.
probe-b3p:
	@loft --interpret --lib lib/ probe/b3p/b3p.loft 2>/dev/null | sed -n '/^B3p/,$$p'

# M1p (AUTHORING_MAP §5.2) — THE DIRECTION QUANTISER'S CELLS. They are NOT 15 deg:
# 13.898 / 15 / 16.102 with period 4, exactly twice `@HB-X29`'s 1.1021 bias. The
# authoring resolution is 6.949 deg. ⛔ And the deleted uniform `WALL_SNAP` grid picks
# a DIFFERENT d24 on 3.70% of headings — so `H1e` changed results, it did not tidy.
probe-m1p:
	@loft --interpret --lib lib/ probe/m1p/m1p.loft 2>/dev/null | sed -n '/^M1p/,$$p'

# M2p (AUTHORING_MAP §4) — DOES AIMING A RUN AGREE WITH TRACING IT? ⛔ No: 77.7%,
# control 11.6%. They minimise different things ON PURPOSE, so `X108` is rewritten from
# "they agree" to "pick one per gesture". ✅ The `--lib` into the loft-libs-world
# checkout came OFF when hex_shape 0.1.1 published (2026-08-24) — this now measures the
# same registry copy the editor builds against, which is what makes it evidence.
probe-m2p:
	@loft --interpret --lib lib/ probe/m2p/m2p.loft 2>/dev/null | sed -n '/^M2p/,$$p'

# L1 (plan 24) — CAN THE LIBRARY READ BACK A WALL *OUR* STAMP LAID? Control: the
# library's own `wall_write` through our world→EdgeSet bridge, 24 of 24. Ours:
# `hex_editor::wall_stamp`, 0 of 24, every one refused — and still 0 with admissible
# endpoints. ⚠ So `L1` is blocked on OUR STAMP, not on the library, and the phase is
# now "replace `wall_stamp` with `wall_write`" rather than "add a call".
probe-l1:
	@loft --interpret --lib lib/ probe/l1/l1.loft 2>/dev/null | sed -n '/^L1 —/,$$p'

pages:
	@node tools/build-pages.mjs

# B2/B3/B2b/B1c.1/B4 (plan 22) — DOES THE DEMO OPEN FROM A DISK, CAN YOU BUILD IN IT,
# AND IS IT STILL THERE TOMORROW? `_site/index.html` over `file://` with no listener at
# either end: it boots, decides it is on its own, draws its own world, a key WRITES into
# it (D), a TURN unblocks a house where `place` was refused (F), the keyboard survives a
# reload (N), the WORLD survives one (O), and it attaches to a server it is told about
# (E). ⚠ The first check here that needs no port at all.
#   DEMO_SABOTAGE=emptypage   `B3`'s own warning made runnable — a page with the right
#                             elements and no editor. Red on all seven D checks.
#   DEMO_SABOTAGE=deadkey     press a key with no verb, so a check crediting the
#                             passage of time with a gesture stays green.
#   DEMO_SABOTAGE=noturn      the same house attempts with nothing turning between
#                             them. Red on F2b ALONE — F2a still counts 213 steps,
#                             which is why the clock and the keys are two checks.
#   DEMO_SABOTAGE=deadclock   a client built with a `ticks()` that never advances.
#                             ⚠ Compose it with nothing: the guard it checks needs
#                             keys HELD, and `noturn` removes the presses.
probe-demo: pages
	@sh probe/b2/run.sh

# B1b.1a (plan 22) — DOES THE PANEL SAY WHICH AUTHORITY IT HAS? The status line was
# a literal reading `connected`, set at panel construction before any socket existed,
# and it went on saying so with the server down. Two runs over the SAME page bytes:
# one against the real server, which sees the panel MOVE when the socket opens, and
# one against a static server with no `/ws`, which sees a client that never claims a
# connection it does not have. ⚠ Neither run can make the other's claim.
# `AUTH_SABOTAGE=literal|nodirty|assume` runs the three controls.
probe-auth:
	@sh probe/b1b/auth.sh

# L6.3 (plan 19) — HOW MUCH OF THE SPLIT IS LEFT, as a compile rather than an opinion.
# Stages a lavition-only `lib/` and `--check`s all five programs against it. Answers
# in ~30 s, which is why it is a target of its own and not part of `make fast`:
# `tools/layering.sh` carries the same claim as a cheap import ratchet on every run,
# and this is the decisive backstop that proves the ratchet matches what compiles.
probe-split:
	@sh probe/l6/run.sh

# ADOPT — THE FIRST HOUR. What a stranger writes before reading anything: twelve
# lines against the public API, no editor and no browser. It is the only standing
# answer to EDITOR_SUBSTRATE's DoD clause 8 (*picking it up is fun*), and writing it
# by hand on 2026-08-28 found two live defects that 775 library tests and 58 gates
# had never asked about — because our own fixtures always face a placeable way and
# always place on open ground. probe/adopt/README.md has the four rows.
# ⛔ **NOT `| tee /dev/stderr`, WHICH TRUNCATES A REDIRECTED LOG.** When the build's output
# goes to a file (`make fast > log 2>&1`), `/dev/stderr` IS that file, and `tee` opens it with
# O_TRUNC — so every earlier result vanishes and what is left is a green tail over an empty
# history. Measured 2026-08-29, the first time this target ran inside `make fast`: an 18-line
# log where the tests, k3c, t3, t4, k1, k3d, headless and plan had all reported. Capture, print,
# then grep the capture.
probe-adopt:
	@out=$$($(LOFT) --interpret --lib lib/ probe/adopt/adopt.loft 2>/dev/null); \
	 printf '%s\n' "$$out"; \
	 printf '%s\n' "$$out" | grep -q '^probe/adopt: the first hour holds' \
	 || { echo "probe-adopt: FAILED"; exit 1; }

# K1 (plan 22) — CAN ANYTHING HERE SEE A WRONG PROFILE, and does a word neither
# driver knows FAIL the run? ⛔ It asked *does `verb` build what `key` built* until
# `K3b` deleted the key spelling; what survives is the half that was never about two
# spellings — the session read-back checked against a mis-chosen kind it SHOULD find,
# because the obvious instrument (diff the world) is blind to exactly that.
# `K1_WIRE=0` skips the server half and needs no port.
probe-verbs:
	@sh probe/k1/run.sh

# K3C (plan 22) — IS A `send` STILL ONE WORD TO `editor_run`, OR IS IT WHATEVER IT
# CARRIES? An authoring id must FAIL the run rather than go on the floor, a quiet one
# must not, an id nobody classified must be refused, and `ground` — the one authoring
# message this runner can honestly perform — must build the floor it names.
# ⚠ IN `make fast` ON PURPOSE, and its runs are pooled to make that affordable: 38 s
# in series, 7 s at `K3C_JOBS=6`, almost all of it loft starting up. A probe outside
# `make fast` is an instrument nobody reads, and this tree has paid for that twice.
probe-k3c:
	@sh probe/k3c/run.sh

probe-t3:
	@sh probe/t3/run.sh

probe-t4:
	@sh probe/t4/run.sh

# K3D (plan 22) — WHAT DOES EVERY LIVE SCRIPT BUILD, and would anything say if it
# stopped? `K3b` deleted the `key <K>` spelling and took `probe/k2` with it — and
# `probe/k2` existed because ten of these scripts are driven by NOBODY automatically.
# Measured: fourteen of the thirty are named by no check in this tree at all.
#
# One record per script at `GROUND=0` — rc, the saved world's md5, τ, chunks, the
# session digest, the standing selection, every sentence a gesture printed, every line
# the runner refused — diffed against a committed baseline.
#
# ⛔ THE WORLD ALONE WOULD HAVE BEEN BLIND: `slab.keys`, whose subject is a floor with
# a thickness, keys the world a bare `verb raise` keys, because a slab is a SESSION
# record like a prop. Deleting `verb hole` from it leaves the saved bytes identical.
# ⚠ IN `make fast`, pooled: 30 runs in 17 s at `K3D_JOBS=6`.
#
#   K3D_BLESS=1 sh probe/k3d/run.sh   re-record on purpose, diff shown first
#   sh probe/k3d/sabotage.sh          seven sabotages, a declared blind spot, a control
# ⚠ SEVEN OF `probe/b2`'s BLOCKS WITH NO BROWSER — H, F, Q, G, R, B, L — and every
# one of those blocks STAYS. Move before you remove: the browser keeps the claim no
# script can make, that pressing a KEY reaches a verb, because `editor_run` speaks
# verbs and held-key bits and skips the keymap layer by design. What moved is what
# never needed a browser: cells written, worlds keyed, refusals worded, feet, landings.
# ⚠ WHICH LOFT AM I ON — two cells, three states. Run it after any `make install-user`,
# because `loft --version` says `2026.8.0` for every build on this box and cannot tell them
# apart. Deliberately NOT in `make fast`: it reports on somebody else's binary, and a red
# there would be the wrong signal in our own loop.
loft-state:
	@sh probe/loftstate/run.sh

probe-headless:
	@sh probe/headless/run.sh

# K1 (plan 22) — A SCRIPT SAYS A VERB, and neither driver survives a typo. Runs the
# twin pair through BOTH drivers, and reads a session difference the world cannot show
# (`wrong.keys` builds a byte-identical world with a different profile chosen).
#
# ⛔ **IT HAD NO TARGET UNTIL 2026-08-24 AND WAS RED FOR FOUR DAYS.** `T1d` made an
# unknown verb travel on `55:` for the server to resolve — deliberate, so a house type
# can declare verbs no compiler saw — and the server's refusal `no gesture for hoist`
# landed in a capture row E read as *the server acted*. Nothing ran it, so nothing said
# so. That is the finding the target exists for, not the row.
probe-k1:
	@sh probe/k1/run.sh

probe-k3d:
	@sh probe/k3d/run.sh

gate:
	@GATE_JOBS=$(GATE_JOBS) sh tools/run-gates.sh \
	  tools/gates/world/*.mjs tools/gates/character/*.mjs
	@$(MAKE) -s stop-editor >/dev/null
