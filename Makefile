export MAKEFLAGS += --always-make

check:
	deno check src/*.ts src/**/*.ts

lint:
	deno lint src/

deno/cache:
	deno cache src/main.ts

docker/build:
	nix build .#docker
	docker load < result
	rm -f result
