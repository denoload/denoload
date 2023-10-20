export MAKEFLAGS += --always-make

test:
	bun test

lint:
	bunx eslint src/ packages/metrics

lint/fix:
	bunx eslint --fix src/ packages/metrics

check:
	bunx tsc

docker/build:
	DOCKER_BUILDKIT=1 docker build . -t negrel/denoload:dev

tag/%:
	echo "export const VERSION = '$*'" > src/version.ts
	git commit -m "version $*" src/version.ts
	git tag $*
