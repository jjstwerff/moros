.PHONY: serve stop creator upload tests lib-test editor editor-stop editor-check gate gate-world gate-character

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
tests:
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

editor:
	$(LOFT) --interpret --lib lib/ src/editor_server.loft

editor-bg:
	@nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & echo $$! > $(EDITOR_PID)
	@until grep -q 'listening on port' .editor.log 2>/dev/null; do sleep 1; done
	@echo "editor on http://localhost:$(EDITOR_PORT)/  (pid $$(cat $(EDITOR_PID)))"

editor-stop:
	@[ -f $(EDITOR_PID) ] && kill $$(cat $(EDITOR_PID)) 2>/dev/null && rm -f $(EDITOR_PID) && echo stopped || echo "not running"

# THE GATE — loft's own headless check. Layer 1 fails on any console error;
# Layer 2 screenshots the canvas and counts distinct colours, which is what
# catches "compiles clean, blank canvas".  Control: break the draw and watch
# distinctColors collapse to 1.
editor-check:
	node $(LOFT_TOOLS)/html_render_check.mjs http://127.0.0.1:$(EDITOR_PORT)/ \
	  --wait-ms 8000 --canvas '#gl' --canvas-min-colors 12 --screenshot /tmp/w0.png

# ── the editor's gates, split by what they are allowed to break ───────────
# world/     — drive the character by PLACING it; measure terrain, streaming,
#              levelling. Must not depend on locomotion.
# character/ — drive it by WALKING; measure the character itself. Expected to
#              churn as locomotion grows a step limit, a fall, collision.
# Each probe gets a FRESH SERVER: state persists (position, yaw, peaks, the
# level flag), so back-to-back runs are not independent.
GATE_RESTART = $(MAKE) -s editor-stop >/dev/null 2>&1; sleep 1; \
  nohup $(LOFT) --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 & \
  until grep -q 'drag or A/D' .editor.log 2>/dev/null; do sleep 1; done

gate-world:
	@for g in tools/gates/world/*.mjs; do $(GATE_RESTART); \
	  printf '%-34s ' "$$g"; node $$g || exit 1; done

gate-character:
	@for g in tools/gates/character/*.mjs; do $(GATE_RESTART); \
	  printf '%-34s ' "$$g"; node $$g || exit 1; done

gate: gate-world gate-character
