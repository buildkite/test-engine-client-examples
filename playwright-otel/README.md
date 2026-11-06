# Playwright OpenTelemetry example

This standalone example sends Playwright results with
`buildkite-test-collector/playwright/reporter` and `otelEnabled: true`. The
existing [`playwright`](../playwright) JSON example is unchanged.

Use the Node version in `mise.toml`, then run:

```sh
./bin/setup
npm test
```

Setup fetches bktest commit
[`2235305ea72ad569687de9e7ec1b1ebef6279a96`](https://github.com/buildkite/bktest/commit/2235305ea72ad569687de9e7ec1b1ebef6279a96)
(merged PR #103), packs its `test-collector-javascript` directory, and installs
it with the lockfile. It does not use a released collector or unmerged changes.
The optional OpenTelemetry SDK 2 and protobuf exporter dependencies are included.

Set `BUILDKITE_ANALYTICS_TOKEN` to a suite token, or
`BUILDKITE_TESTS_OTLP_TOKEN` to an OIDC token with the suite's `write_uploads`
permission. Credentials set in Playwright `globalSetup` also work. Without a
credential, the collector warns and uploads nothing. For a local OTLP/HTTP
receiver, set `BUILDKITE_ANALYTICS_OTLP_ENDPOINT` to its `/v1/traces` URL and use
a dummy token instead of a production credential. Set `BUILDKITE_ANALYTICS_KEY`
to group the results under a chosen run key.

The four browser-free tests produce five root `test.execution` spans: two passed,
two failed (including the first retry attempt), and one skipped. Retries have
distinct execution IDs and separate step trees. Child spans show nested
`calculate` → `add` / `multiply` steps, fixture setup/teardown, hooks, assertions,
and failed steps. The same `retry attempt` step fails once and passes on retry.
The deliberate failure keeps `npm test` exiting 1; the CI step soft-fails that
exit rather than hiding it.

This is Playwright reporter-side tracing, not worker or browser instrumentation.
It does not collect arbitrary manual spans or automatic HTTP/database spans.
Root timings enclose observed steps, so they can exceed Playwright's JSON duration.

The [pipeline](../.buildkite/pipeline.yml) runs this through bktec's OTLP relay
with built-in result uploads disabled. OTel configuration and upload failures
warn without changing Playwright's exit code or falling back to JSON. See the
[collector guide](https://github.com/buildkite/bktest/blob/2235305ea72ad569687de9e7ec1b1ebef6279a96/test-collector-javascript/docs/opentelemetry.md#playwright)
for supported settings.
