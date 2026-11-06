# Playwright OpenTelemetry example

This standalone example sends Playwright results with
`buildkite-test-collector/playwright/reporter` and `otelEnabled: true`. The
existing [`playwright`](../playwright) JSON example is unchanged.

Use the Node version in `mise.toml`, then run:

```sh
./bin/setup
npx playwright install --with-deps chromium
npm test
```

Setup fetches bktest commit
[`9827a7d786068e9c3b02fc9328553ba79a6dc227`](https://github.com/buildkite/bktest/commit/9827a7d786068e9c3b02fc9328553ba79a6dc227),
the collector 1.14.0 release candidate (bktest PR #106), packs its
`test-collector-javascript` directory, and installs it with the lockfile. Once
1.14.0 is on npm, this example will depend on it directly. The optional
OpenTelemetry SDK 2 and protobuf exporter dependencies are included.

Set `BUILDKITE_ANALYTICS_TOKEN` to a suite token, or
`BUILDKITE_TESTS_OTLP_TOKEN` to an OIDC token with the suite's `write_uploads`
permission. Credentials set in Playwright `globalSetup` also work. Without a
credential, the collector warns and uploads nothing. For a local OTLP/HTTP
receiver, set `BUILDKITE_ANALYTICS_OTLP_ENDPOINT` to its `/v1/traces` URL and use
a dummy token instead of a production credential. Set `BUILDKITE_ANALYTICS_KEY`
to group the results under a chosen run key.

The tests use Chromium against the public
[TodoMVC demo](https://demo.playwright.dev/todomvc/), also used by this
repository's existing Playwright examples. They add, edit, complete, filter,
reload, and clear tasks, verifying saved state and active-item counts. Each test
gets a fresh browser context; no demo-server data is changed. Running the example
requires network access to the demo.

Four tests produce five root `test.execution` spans: two passed, two failed
(including the first retry attempt), and one skipped. Nested workflow steps,
browser actions, fixtures, hooks, and assertions appear as child spans. The retry
case intercepts its first navigation with a local 503 response, then accesses the
real demo on retry; each attempt has its own trace. An intentionally wrong counter
assertion keeps `npm test` exiting 1; the CI step soft-fails that exit rather than
hiding it.

This is Playwright reporter-side tracing, not worker or browser instrumentation.
It does not collect arbitrary manual spans or automatic HTTP/database spans.
Root timings enclose observed steps, so they can exceed Playwright's JSON duration.

The [pipeline](../.buildkite/pipeline.yml) runs this through bktec's OTLP relay
with built-in result uploads disabled. OTel configuration and upload failures
warn without changing Playwright's exit code or falling back to JSON. See the
[collector guide](https://github.com/buildkite/bktest/blob/9827a7d786068e9c3b02fc9328553ba79a6dc227/test-collector-javascript/docs/opentelemetry.md#playwright)
for supported settings.

CI also sets `OTEL_PROOF=true`, which adds [`otel-proof.js`](./otel-proof.js).
After each attempt it prints the trace ID, root span ID and every span the
collector started, plus Playwright's own step count. Match these against the
stored traces in Test Engine. It patches the OpenTelemetry SDK to see the IDs,
so it is for verification only; customer configuration does not need it.
