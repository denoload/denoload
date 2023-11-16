FROM docker.io/oven/bun:1.0.11-alpine

WORKDIR /denoload

COPY . .

RUN bun install

WORKDIR /tests

ENV NODE_ENV="production"

ENTRYPOINT [ "bun", "run", "/denoload/src/main.ts"]

