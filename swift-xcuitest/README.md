# Swift XCUITest example

This example verifies OpenTelemetry execution delivery when XCTest replaces an
XCUITest runner. Two tests finish before a third test terminates the runner.
Xcode continues the remaining tests in a replacement process and keeps all
five tests in the `.xcresult`: four passes and the deliberately killed active
test. Each of the four tests that receives an XCTest completion callback is
handed to the bktec OTLP relay before its runner can exit.

The verification script asserts the expected runner crash and replacement,
then checks that all four completed tests were accepted over OTLP. The killed
test cannot be emitted by an in-process collector because `SIGKILL` prevents
XCTest's completion callback; recovering that execution would require durable
start-state reconciliation outside the runner.

The example uses the published `2.0.0-beta.2` collector from
[`buildkite/test-collector-swift`](https://github.com/buildkite/test-collector-swift).
Buildkite runs it through the bktec `3.4.1` OTLP relay. The verifier checks relay
acceptance, not final Test Engine ingestion; confirm all four completed tests
appear in Test Engine after the build. OTLP ingestion must be enabled for the
organization when exporting directly without the relay.

Run it with:

```sh
bin/test
```

The script selects the first available iPhone Simulator. Set
`XCUITEST_DESTINATION` to pass a different `xcodebuild` destination.
