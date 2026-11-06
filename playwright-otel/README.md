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
[`677e3839cf2b2cb3bb0fe4ba28a5ec339cba513b`](https://github.com/buildkite/bktest/commit/677e3839cf2b2cb3bb0fe4ba28a5ec339cba513b)
(merged PR #69), packs its `test-collector-javascript` directory, and installs
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
distinct execution IDs. There are no step, worker, or browser child spans in
this collector. The deliberate failure keeps `npm test` exiting 1; the CI step
soft-fails that exit rather than hiding it.

The [pipeline](../.buildkite/pipeline.yml) runs this through bktec's OTLP relay
with built-in result uploads disabled. OTel configuration and upload failures
warn without changing Playwright's exit code or falling back to JSON. See the
[collector guide](https://github.com/buildkite/bktest/blob/677e3839cf2b2cb3bb0fe4ba28a5ec339cba513b/test-collector-javascript/docs/opentelemetry.md#playwright)
for supported settings.
