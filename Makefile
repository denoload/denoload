export MAKEFLAGS += --always-make

test:
	bun test

lint:
	bunx eslint src/

lint/fix:
	bunx eslint --fix src/

check:
	bunx tsc

docker/build:
	DOCKER_BUILDKIT=1 docker build . -t negrel/denoload:dev
