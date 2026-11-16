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
../bin/use-unreleased-js-collector b5a03c3855c01c6912583fe30dd75aafb827ce68 sdk3
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
- `webServer: [{ env: { ...appTracingEnv() }, … }]` points the app's existing
  exporter at Test Engine (or bktec's relay) with the same run key and the child
  stream. Keep the array form: Playwright then omits the credential-bearing
  server config from its JSON report (`config.webServer` is null).
- The fixture adds W3C trace context. The app's HTTP spans continue each test's
  `test.execution`; Express handlers and pg queries descend from those requests.
- `parentbased_always_off` sampling suppresses unparented requests and schema
  setup. It records **any sampled remote parent**, not only these tests.
- `webServer.gracefulShutdown` sends SIGTERM; the app closes HTTP and database
  connections and awaits `sdk.shutdown()` so its last batch is not lost.

Browser headers are scoped to the app origin and document/fetch/XHR resources.
The API `request` fixture attaches context to all origins; use it for app API
requests rather than unrelated third-party calls. Browser routing disables the
HTTP cache. These three tests pass with and without tracing; that is not a claim
that tracing leaves cache-sensitive tests unchanged.

The example enables `enhancedDatabaseReporting` to show **synthetic** SQL
parameters. Do not enable parameter capture for sensitive customer data without
reviewing what will be exported. Child spans require Test Engine's OTel traces
feature and are billed by data ingested.

## Production verification

The [pipeline](../.buildkite/pipeline.yml) runs the same tests twice with separate
run keys: directly using an OIDC suite token, and under `bktec run` with its OTLP
relay. `upload-results: false` prevents duplicate result uploads. Both runs use
real PostgreSQL containers on Linux hosted agents, not an in-memory substitute.

The one-off production check found complete ancestry and zero orphaned app spans
**among the six retrieved execution traces**. It does not establish a
production-wide absence of orphan spans. The full REST view has no span
attributes, so exact project/title values are checked locally, not in production.

## Local trace gate and shutdown controls

A third CI step runs the same tests against a loopback OTLP/protobuf sink using
a dummy token, then checks actual exported spans. Run it from this directory
after installing the pinned collector and Chromium:

```sh
./with-postgres node verify/prove-app-traces.cjs
```

The gate checks app/test **transport** run-key equality, test and child streams,
complete ancestry, HTTP/Express/pg scopes, exact HTTP counts (design/API/finance:
8/2/5) and query counts (6/2/5), exact per-test project and INSERT title parameters,
and the finance-only query's 250 ms duration. Pool/connection spans are not
included in the stable query counts. A fresh proof ID sets independent expected
projects for each run; normal runs still use randomly generated project IDs.
Unparented startup and readiness spans must not appear in the local capture.

Six copies of the valid capture must be rejected: wrong app transport run key,
missing design INSERT, finance INSERT with the operations title, dangling app
parent, wrong app stream, and wrong test stream. The sink accepts only
`POST /v1/traces`; real HTTP controls verify the valid endpoint accepts an empty
protobuf export while the wrong path and wrong method are rejected.

Both shutdown runs set `OTEL_BSP_SCHEDULE_DELAY=60000` and must finish before
that delay expires. With graceful SIGTERM and the SDK hook, all expected spans
must arrive at or after the app's shutdown-start acknowledgement, followed by a
shutdown-complete acknowledgement. Without `gracefulShutdown`, Playwright's
default SIGKILL bypasses the hook: the same three tests must still pass, but no
app spans may arrive and the checker must reject the capture. This establishes
shutdown flushing causally on the local stack, not from production counts alone.

Sanitized captures and logs are written to `tmp/app-trace-proof/` and uploaded
as CI artifacts. They retain routing headers but never authentication headers.
Recheck a saved positive capture with
`node verify/check-spans.cjs tmp/app-trace-proof/graceful.json`.
