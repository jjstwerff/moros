.PHONY: serve stop creator upload tests lib-test probe

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

# Standalone probes — checks that do not belong to a package suite.
probe:
	$(PY) tools/probes/neighbour_parity.py

