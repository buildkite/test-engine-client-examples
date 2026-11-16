# Playwright: app spans (experimental)

A project board backed by Express and real PostgreSQL (`pg`). Playwright starts
the app with `webServer`. The app already has ordinary Node OpenTelemetry
instrumentation, preloaded with `node --require ./instrumentation.js`:
`@opentelemetry/sdk-node`, HTTP, Express and pg instrumentation. There are no
test-specific spans or tracing calls in the app's request handlers.

Three concurrent tests create/list tasks in isolated projects: a design-team UI
flow (including reload/persistence), an operations API flow using the `request`
fixture with relative paths, and a finance UI report with a deliberate 250 ms
`pg_sleep`. Project IDs and synthetic task titles make cross-test attribution
visible in the exported requests and SQL parameters.

## Run

This needs the **unreleased** collector from `buildkite/bktest`'s
`feat/playwright-app-traces` branch; collector 1.14.0 does not have the fixture.
Use Node 24 and Docker Compose, then from this directory:

```sh
../bin/use-unreleased-js-collector 263dc233f7a44540009d2655c9b372ea27b140a7 sdk3
npx playwright install --with-deps chromium
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
./with-postgres npx playwright test
```

`with-postgres` starts `postgres:17-alpine`, waits for readiness, exports
`DATABASE_URL` with its dynamically allocated loopback port, and removes the
container and its data afterwards. Both Docker Compose v2 and `docker-compose`
are supported. To use an existing PostgreSQL database instead, set `DATABASE_URL`
and run `npx playwright test` directly; the app creates its own `tasks` table.

## What connects the traces

- Tests import `test` and `expect` from
  `buildkite-test-collector/playwright/fixture`.
- The config enables the OTel reporter and sets `use.baseURL`.
- `webServer.env: appTracingEnv()` points the app's existing exporter at Test
  Engine (or bktec's relay) with the same run key and the child stream.
- The fixture adds W3C trace context. The app's HTTP spans continue each test's
  `test.execution`; Express handlers and pg queries descend from those requests.
- `parentbased_always_off` sampling excludes health checks, schema setup and
  requests not started by a test.
- `webServer.gracefulShutdown` sends SIGTERM; the app closes HTTP and database
  connections and awaits `sdk.shutdown()` so its last batch is not lost.

Browser headers are scoped to the app origin and document/fetch/XHR resources.
The API `request` fixture attaches context to all origins; use it for app API
requests rather than unrelated third-party calls.

The example enables `enhancedDatabaseReporting` to show **synthetic** SQL
parameters. Do not enable parameter capture for sensitive customer data without
reviewing what will be exported. Child spans require Test Engine's OTel traces
feature and are billed by data ingested.

## Production verification

The [pipeline](../.buildkite/pipeline.yml) runs the same tests twice with separate
run keys: directly using an OIDC suite token, and under `bktec run` with its OTLP
relay. `upload-results: false` prevents duplicate result uploads. Both runs use
real PostgreSQL containers on Linux hosted agents, not an in-memory substitute.
