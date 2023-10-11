export MAKEFLAGS += --always-make

docker/build:
	nix build .#docker
	docker load < result
	rm -f result
