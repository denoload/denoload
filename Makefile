export MAKEFLAGS += --always-make

test:
	bun test

lint:
	bunx eslint src/ packages/

lint/fix:
	bunx eslint --fix src/ packages/

check:
	bunx tsc

docker/build:
	DOCKER_BUILDKIT=1 docker build . -t negrel/denoload:dev
