export MAKEFLAGS += --always-make

node_modules:
	if [ ! -d node_modules ]; then bun install --dev; fi

test: node_modules
	bun test

lint: node_modules
	bunx eslint src/ packages/metrics

lint/fix: node_modules
	bunx eslint --fix src/ packages/metrics

check: node_modules
	bunx tsc

docker/build:
	DOCKER_BUILDKIT=1 docker build . -t negrel/denoload:dev
	if [ "$${IMAGE_TAR:-/dev/null}" != '/dev/null' ]; then \
		docker save -o "$$IMAGE_TAR" negrel/denoload:dev; \
	fi

tag/%:
	echo "export const VERSION = '$*'" > src/version.ts
	git commit -m "version $*" src/version.ts
	git tag $*
