.PHONY: serve

PORT ?= 8000
PY ?= python3

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

