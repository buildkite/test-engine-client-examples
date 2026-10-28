# Swift XCUITest example

This example uses the published `2.0.0-beta.2`
[`test-collector-swift`](https://github.com/buildkite/test-collector-swift) to
send XCUITest results directly to Test Engine, without bktec. The pipeline sets
`BUILDKITE_ANALYTICS_OTLP_ENDPOINT` to
`https://tests-otlp.buildkite.com/v1/traces`; the Tests plugin supplies the token
but does not install bktec or upload results. OTLP ingestion must be enabled for
the organization.

Two tests finish before a third test kills the runner. Xcode starts a replacement
runner and completes the remaining tests. The verifier requires five records in
the `.xcresult` (four passes and the runner crash), runner replacement, and four
completed executions accepted over OTLP. Confirm those four tests also appear
in Test Engine after the build: two from before the crash and two from after it.

The killed test has no XCTest completion callback, so the in-process collector
cannot export its result.

Run it with:

```sh
bin/test
```

The script selects the first available iPhone Simulator. Set
`XCUITEST_DESTINATION` to pass a different `xcodebuild` destination.
When running locally, set `BUILDKITE_ANALYTICS_TOKEN`,
`BUILDKITE_ANALYTICS_DEBUG_ENABLED=true`, and one `BUILDKITE_ANALYTICS_KEY`
(e.g. `BUILDKITE_ANALYTICS_KEY="$(uuidgen)" bin/test`). The shared key keeps both
runner processes in the same Test Engine run; debug logs let the verifier check
exports.
