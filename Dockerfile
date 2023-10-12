FROM docker.io/oven/bun:alpine

WORKDIR /denoload

COPY . .

RUN \
  --mount=type=cache,target=node_modules \
  bun install

WORKDIR /tests

ENV NODE_ENV="production"

ENTRYPOINT [ "bun", "run", "/denoload/src/main.ts"]

