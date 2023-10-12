export MAKEFLAGS += --always-make

test:
	bun test

lint:
	bunx eslint src/

lint/fix:
	bunx eslint --fix src/

docker/build:
	nix build .#docker
	docker load < result
	rm -f result
