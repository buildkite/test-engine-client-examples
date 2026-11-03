# Swift XCUITest example

This example runs passing UI tests against a minimal iOS app and uploads the
results with [`test-collector-swift`](https://github.com/buildkite/test-collector-swift).
It uses a shared scheme, a lexical test plan, and an explicit `.xcresult`
bundle so the same command works locally and on a macOS Buildkite agent.

This example is tested on Xcode 26.2; Xcode 15.4 (Swift 5.10) cannot build beta.3's OpenTelemetry dependencies.

Run it with:

```sh
bin/test
```

The script selects the first available iPhone Simulator. Set
`XCUITEST_DESTINATION` to pass a different `xcodebuild` destination.

## Keeping results across runner restarts

XCTest can restart its runner mid-suite. With Swift collector `2.0.0-beta.3`,
each finished test is handed to the `bktec` OTLP relay, which runs outside the
XCTest runner and can keep uploading results after that runner exits.

The [Buildkite pipeline](../.buildkite/pipeline.yml) runs `bktec run` with
`BUILDKITE_TESTS_OTLP_RELAY=true` to enable the relay and
`BUILDKITE_TESTS_OTLP_RELAY_BATCHING=true` to batch its uploads to Test Engine.
The Tests plugin uses the `custom` runner with `test-cmd: swift-xcuitest/bin/test`
so `bktec` manages the relay while the script runs `xcodebuild`.

`xcodebuild` only passes `TEST_RUNNER_`-prefixed environment variables to the
test runner. `bin/test` re-exports the relay endpoint, authentication, protocol,
and resource variables with that prefix so the collector can reach the relay.

Without `bktec`, the collector uploads directly from the XCTest runner. If
that runner is killed, about one second of completed tests can be lost before
the collector's next flush. A test that never finishes has no completed result
for the collector to send in either mode.
