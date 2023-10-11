export MAKEFLAGS += --always-make

deno/cache:
	deno cache src/main.ts

docker/build:
	nix build .#docker
	docker load < result
	rm -f result
