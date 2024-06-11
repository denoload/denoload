const port = 8000;

const server = Bun.serve({
  port,
  fetch(request) {
    return new Response("Welcome to Bun!");
  },
});

console.log(`Listening on localhost: ${server.port}`);
