# Split Xcode XCTest suites with bktec

This Xcode 26.2 example builds an iOS app and its XCUITests once, then runs
two parallel hosted macOS jobs with bktec's **custom** runner. bktec has no
built-in XCTest runner. The same build/enumerate/`-only-testing` approach works
for Xcode unit-test targets; this fixture prioritizes UI tests.

Copy the two XCUITest steps in [the pipeline](../.buildkite/pipeline.yml),
`bin/build`, `bin/test`, and the selector-tagging setup hook in
[`SplitUITestCase`](ExampleAppUITests/ExampleAppUITests.swift). Adapt the project,
scheme, test plan, target name and destination. Requires Xcode 16+ for
`-testProductsPath`, `jq`, bktec 3.5.0 and Swift collector **2.0.0-beta.3**.
No unreleased collector change is needed.

## Build once, run only assigned tests

`bin/build` uses `build-for-testing` and Xcode's native `-enumerate-tests`
JSON output. It derives class selectors such as `ExampleAppUITests/LaunchTests`
from enabled method identifiers, ignoring empty classes. It archives the
relocatable `.xctestproducts` bundle and newline-delimited `selectors.txt`.
Each shard downloads the same archive and runs `test-without-building` with
one `-only-testing:` argument per selector assigned by bktec. Empty assignments
run nothing. Compilation and package resolution happen only in the build job.
Use the same Xcode version and simulator architecture on all three agents.

Locally, from this directory:

```sh
bin/build
bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

The default destination is `platform=iOS Simulator,name=iPhone 17`. Override
`XCUITEST_DESTINATION` in both steps for another available simulator.

## Timing-aware class or method splits

Every test method tags its execution with `test.selector.primary` in a shared
setup hook. This is essential: the custom runner cannot infer selector tags,
and the Swift collector's class scope is **not** a selector. Test Engine sums
the methods' durations for each exact selector, so subsequent builds balance
the same classes using recorded timings instead of default estimates.
The first run (and newly added tests, or history older than seven days) can
use default durations. The deliberately slow class makes timing-based placement
visibly different from an even-count split.

For a suite dominated by one large class, set `TEST_SPLIT_BY: method` in
**both** pipeline steps. Discovery then keeps full identifiers such as
`ExampleAppUITests/ExampleAppUITests/test01AppLaunches()`, and the setup hook
tags that exact identifier instead. The parentheses are part of Xcode's output.
Changing granularity needs a fresh history-building run. Keep the setup hook
in any subclass overrides (call `super.setUpWithError()`). The target prefix
in the hook must match Xcode's enumerated test target, not a source filename.

## Relay, muting and retries

Keep `BUILDKITE_TESTS_OTLP_RELAY=true`,
`BUILDKITE_TESTS_OTLP_RELAY_BATCHING=true`, and `upload-results: false`.
The Swift collector synchronously hands completed tests to bktec, which
outlives XCTest runner restarts and uploads the results. `bin/test` forwards
the collector and relay variables through Xcode's `TEST_RUNNER_` prefix,
including **`BUILDKITE_TESTS_OTLP_TOKEN`**. Losing that token silently disables
the synchronous relay path. Do not replace the environment forwarding with
only an analytics upload token. A test that never finishes has no completed
result to preserve.

The custom runner has **no automatic retries**. To use XCTest's native retry
policy, add `-retry-tests-on-failure -test-iterations 3` to `bin/test`'s
`xcodebuild` invocation. Repeated attempts are separate collector executions.
No retries are enabled in this green fixture.

This example does **not** provide bktec muting: that requires a single Test
Engine JSON or JUnit XML result file, whereas xcodebuild writes `.xcresult`.
The retained result bundle is useful for diagnosis but is not a bktec result
file. No converter or second result uploader is included.
