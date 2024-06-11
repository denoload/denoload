
denoload:
	bun ./server.ts & \
		pid=$$!; \
		bun run ../../src/main.ts run ./beta.ts; \
		echo "exited with code $$?"; \
		kill $$pid

k6:
	bun ./server.ts & \
		pid=$!; \
		k6 run ./beta_k6.js; \
		kill $pid

