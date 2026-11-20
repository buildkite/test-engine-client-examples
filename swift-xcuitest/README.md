# Split XCTest and XCUITest across Macs

Build an Xcode project once, then split its XCTest and XCUITest classes across Macs with bktec's custom runner. The Swift test collector sends results to Test Engine through bktec's OTLP relay.

## Pipeline

Copy the `XCUITest build and discover` and `XCUITest shard %n` steps from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt them](../README.md#adapt-a-step), setting `queue` to your macOS agents. The build step archives the test products and the list of test classes. Each shard downloads the archive and runs only its classes, without rebuilding.

## Test collector

Copy [bin/build](./bin/build) and [bin/test](./bin/test), and set your project or workspace, shared scheme, test plan, and simulator. Link `test-collector-swift` 2.0.0-beta.5, a prerelease, into each test target. Keep the relay variables, and the `TEST_RUNNER_` forwarding in `bin/test` that passes the relay's endpoint, token, and build details to the tests. See the collector's [setup steps](https://github.com/buildkite/test-collector-swift/blob/v2.0.0-beta.5/README.md#step-3).

This collector sends results only as OpenTelemetry spans, so OTLP ingestion must be enabled for your Buildkite organization. Until it is, every upload is rejected and no results appear in Test Engine.

## Limits

- Use the same Xcode version and simulator architecture on every job, with jq installed.
- Use a test plan with exactly one configuration, enabled. Remove disabled configurations too.
- Keep `PRODUCT_NAME` equal to the target name, so timing selectors match `Target/Class`.
- Only XCTest, not Swift Testing. Tests must not change between discovery and execution, and test identifiers can't contain whitespace, quotes, or backslashes.
- New tests, first runs, and history older than seven days use default timings. Check `plan.json`.
- bktec doesn't read results from this step, so it can't retry or mute tests. Xcode and fastlane retries work, and each attempt is collected separately.
- Relay delivery is best effort: missing results can leave a job green, and unfinished tests have no result.

## Fastlane

Keep discovery and method filtering in the scripts. To replace the final `xcodebuild` in `bin/test`, run `scan` from the project directory with `xctestrun`, `test_without_building: true`, `destination`, `only_testing` (method identifiers, without `-only-testing:`), and `parallel_testing: false`. Don't add build flags through `xcargs`.

## Run locally

Use a Mac with Xcode 26.2 in this directory:

```bash
bin/build
bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

Set `XCUITEST_DESTINATION` for both commands to use a simulator other than iPhone 17. Local runs don't start the relay.
