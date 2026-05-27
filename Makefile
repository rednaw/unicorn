# Day-to-day commands. Everything runs inside Docker - no host Node/pnpm needed.

DC      := docker compose
RUN     := $(DC) run --rm --service-ports dev
RUN_NP  := $(DC) run --rm dev

.PHONY: help build dev stop down install add add-dev sh shell pnpm clean nuke

help:
	@echo "make build        - build the dev image"
	@echo "make dev          - run vite dev server on http://localhost:5173"
	@echo "make stop         - stop the dev server"
	@echo "make down         - stop + remove containers"
	@echo "make install      - pnpm install"
	@echo "make add PKG=foo  - pnpm add foo"
	@echo "make add-dev PKG=foo - pnpm add -D foo"
	@echo "make pnpm ARGS='...' - run arbitrary pnpm command"
	@echo "make sh           - open a shell inside the container"
	@echo "make clean        - remove build artifacts (.svelte-kit, build)"
	@echo "make nuke         - clean + remove node_modules"

build:
	$(DC) build

dev:
	$(DC) up dev

stop:
	$(DC) stop

down:
	$(DC) down

install:
	$(RUN_NP) pnpm install

add:
	$(RUN_NP) pnpm add $(PKG)

add-dev:
	$(RUN_NP) pnpm add -D $(PKG)

pnpm:
	$(RUN_NP) pnpm $(ARGS)

sh shell:
	$(RUN) sh

clean:
	rm -rf .svelte-kit build

nuke: clean
	rm -rf node_modules
