# Load testing of [GoTrue][gotrue]

This directory contains an example load test of [GoTrue][gotrue]. Follow the
instructions to run it locally.

## Getting started

Start the test environment:

```sh
docker compose -f ./docker-compose-env.yml up -d
```

Install dependencies
```sh
npm install
```

Open a new terminal showing CPU and memory usage of `gotrue` and `denoload`:
```
$TERM -e htop -F 'gotrue|denoload' &>/dev/null &
```

Start the denoload instance:
```sh
docker compose -f ./docker-compose-test.yml up
```

[gotrue]: https://github.com/supabase/gotrue
