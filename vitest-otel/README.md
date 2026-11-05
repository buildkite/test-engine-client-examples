# Vitest OpenTelemetry

Small collector-owned example on Vitest 5.1.0 and Node 24. The existing
[`vitest/`](../vitest) and [`vitest-4/`](../vitest-4) examples keep JSON uploads.

The reporter enables OTel, and Vitest's native `experimental.openTelemetry`
loads the collector SDK. `sdkPath` must be a file path, not a package specifier;
`createRequire(import.meta.url).resolve(...)` resolves the installed SDK with
npm, pnpm and Yarn. The collector owns the provider: no suite SDK setup is needed.

The project declares its HTTP and undici instrumentations. They supply automatic
HTTP client/server and fetch spans; the collector is not an instrumentation
bundle. Dependencies stay on the supported OTel SDK 2.x line (undici 0.27.0,
not its newer SDK 3.x releases).

## Run

The collector is not released yet. `collector.sha` pins an exact bktest commit;
the installer packs that source without publishing a package or using an npm tag.
The baseline dependency in `package.json` is replaced locally by that tarball.

```sh
cd vitest-otel
bash install-collector
npm test
```

Set `BUILDKITE_ANALYTICS_TOKEN` to a suite token to upload locally. Without a
token, tests still run but the collector warns and skips uploads. OTel mode
does not fall back to JSON uploads.

The three tests use only ephemeral loopback servers, with no external service:

- Every test has `prepare_widget` under its Vitest `beforeEach` phase.
- The manual test has `parse_widget` under its callback phase.
- The HTTP test has client `GET` → server `GET` → `handle_health` under its callback.
- The fetch test has an undici child and an HTTP server child under its callback.

Empty phases, such as `afterEach`, should not appear in Test Engine.

## CI and production proof

The [CI step](../.buildkite/pipeline.yml) runs `bktec run` with its 3.5.0 batched
OTLP relay and `upload-results: false`, so only the collector uploads results.
The JSON reporter writes a local result file for bktec, not a second remote upload.
The step overrides bktec's default test command because CLI `--reporter` flags
would replace the configured collector reporter.

CI sets `OTEL_PROOF=true` to print each test's trace/root IDs from the active
Vitest hook's SDK `parentSpanContext`. These lines are proof-only; customer
configuration does not need them. Match those IDs against the stored
`test.execution` roots, then check all child names and parent IDs independently.
A successful export alone does not prove ingestion.

Child spans require a Test Engine plan that includes them and are billed by data
ingested. Review URLs and attributes before instrumenting a real application.
