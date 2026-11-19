# Split XCTest and XCUITest across Macs

Build an Xcode project once and archive its test products and discovery output.
bktest uses class timing history from the collector to assign `Target/Class`
selectors to jobs. Each job runs those classes' enabled methods without rebuilding.
This XCUITest example also works for XCTest unit tests.

## Requirements

Use macOS agents with matching Xcode versions and simulator architectures,
bktest 3.6.0-rc.3 and jq. This example uses Xcode 26.2 and Swift collector 2.0.0-beta.5.

## Setup

Copy `bin/build`, `bin/test` and the two XCUITest [pipeline steps](../.buildkite/pipeline.yml).
Copy the [pinned bktest launcher](../.buildkite/run-bktest) to `.buildkite/run-bktest` at your checkout root.
Set your project or workspace, shared scheme, test plan, simulator, agent queue,
parallelism and suite slug. Link the Swift collector into each test target.
Keep the relay settings, `upload-results: false` and `TEST_RUNNER_` forwarding;
the collector sends results through bktest, not a second uploader.

```sh
bin/build
bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

Set `XCUITEST_DESTINATION` for both commands to use a simulator other than iPhone 17.

## Fastlane

Keep discovery and method filtering in the scripts. To replace the final
`xcodebuild`, run `scan` from the project directory with `xctestrun`,
`test_without_building: true`, `destination`, `only_testing` (method identifiers,
without `-only-testing:`) and `parallel_testing: false`. Do not add build flags
through `xcargs`.

## Limits

- Use one enabled test-plan configuration; remove disabled configurations too.
- Keep `PRODUCT_NAME` equal to the target name, so timing selectors match `Target/Class`.
- Test identifiers cannot contain whitespace, quotes or backslashes.
- XCTest only. Tests must not change between discovery and execution.
- First runs, new tests and history older than seven days may use default timings. Check `plan.json`.
- Relay delivery is best-effort: missing results can leave a job green; unfinished tests have no result.
- No bktest muting or retries. Xcode or scan retries are optional; each attempt is collected separately.
