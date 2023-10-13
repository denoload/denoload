FROM docker.io/oven/bun:1.0.4-alpine

WORKDIR /denoload

COPY . .

RUN \
  --mount=type=cache,target=node_modules \
  bun install

WORKDIR /tests

ENV NODE_ENV="production"

ENTRYPOINT [ "bun", "run", "/denoload/src/main.ts"]

