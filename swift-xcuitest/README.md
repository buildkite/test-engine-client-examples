# Split Xcode XCTest suites with bktec

This Xcode 26.2 example builds an iOS app and its XCUITests once, then runs
two parallel hosted macOS jobs with bktec's **custom** runner. bktec has no
built-in XCTest runner. The same build/enumerate/`-only-testing` approach works
for Xcode unit-test targets; this fixture prioritizes UI tests.

Copy the two XCUITest steps in [the pipeline](../.buildkite/pipeline.yml),
`bin/build` and `bin/test`. Adapt the project, scheme, test plan and destination.
Tests remain ordinary `XCTestCase` subclasses: no tagging superclass, setup
override or `tagExecution` call is required. This fixture is verified on Xcode
26.2. The workflow needs Xcode 15+ for enumeration and the collector needs
Swift 5.10+ (Xcode 15.3+); original `.xctestrun` sharing adds no Xcode 16 minimum.
Older Xcode versions are not verified here. Also requires `jq` and bktec 3.5.0.

Automatic selector tagging needs the **next Swift collector release**, after
the already-published 2.0.0-beta.4. Until then, `bin/build` fetches a pinned
[collector source commit](https://github.com/buildkite/bktest/pull/130) and the
Xcode project uses its local package. Nothing is released by this example.
After that release, replace the local package with the released
`buildkite/test-collector-swift` dependency and remove the source-fetch block.

## Build once, run only assigned tests

`bin/build` uses `build-for-testing` and Xcode's native `-enumerate-tests`
JSON output. It derives class selectors such as `ExampleAppUITests/LaunchTests`
from enabled method identifiers, ignoring empty classes. It archives the
original `Products` directory and `.xctestrun`, enumeration JSON and newline-delimited
`selectors.txt`. Each shard intersects its assignments with the enumerated
enabled methods and passes those exact identifiers to `test-without-building`.
This matters even for class splits: `-only-testing:Target/Class` can override
a plan's `selectedTests` and re-enable methods the plan excluded. Empty
assignments run nothing. Compilation and package resolution happen only in
the build job.
Use the same Xcode version and simulator architecture on all three agents.

Locally, from this directory:

```sh
BUILDKITE_TEST_ENGINE_XCTEST_SPLIT_BY=class bin/build
BUILDKITE_TEST_ENGINE_XCTEST_SPLIT_BY=class bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

The default destination is `platform=iOS Simulator,name=iPhone 17`. Override
`XCUITEST_DESTINATION` in both steps for another available simulator.

## Timing-aware class or method splits

The pipeline opts in with `BUILDKITE_TEST_ENGINE_XCTEST_SPLIT_BY=class` in both
steps. With that setting the collector tags each execution with `test.selector.primary`,
using its own test bundle and concrete runtime class. This is essential: the
custom runner cannot infer selector tags, and a class scope is **not** a
selector. Test Engine sums
the methods' durations for each exact selector, so subsequent builds can balance
the same classes using recorded timings once the planner's history snapshot
refreshes.
The first run (and newly added tests, or history older than seven days) can
use default durations. An immediate repeat can still hit cached missing history;
check bktec's historical-timing summary rather than assuming the upload is
immediately visible.
The deliberately slow class makes timing-based placement
visibly different from an even-count split.

For a suite dominated by one large class, set
`BUILDKITE_TEST_ENGINE_XCTEST_SPLIT_BY: method` in
**both** pipeline steps. Discovery then keeps full identifiers such as
`ExampleAppUITests/ExampleAppUITests/test01AppLaunches()`, and the collector
tags that exact identifier instead. The parentheses are part of Xcode's output.
Objective-C-named and nested XCTest classes can instead have bare method names
and mangled class identifiers; the collector uses the runtime class name to
match them. `bin/test` forwards the same setting with Xcode's `TEST_RUNNER_`
prefix. Unset adds no selector tag, preserving existing file-based timing keys.
Switching from file selectors or changing granularity needs a fresh history-building run.
An explicit test-supplied selector tag overrides the automatic value; it must
still match the discovered selector if that execution is to contribute timings.

This is an **XCTest** example, not a mixed XCTest/Swift Testing runner. Xcode
26.2 rejects `import Testing` in UI-test targets. A base XCTest class and its
subclass are distinct runnable units: inherited methods run under each concrete
class's identifier and tag, not under the declaring class's tag.

## Test plans, targets and simulator workers

Discovery includes all enabled XCTest targets in the test plan. The target
prefix keeps classes in different targets disjoint. Link the collector into
every test target whose results should be uploaded.
Each test target's `PRODUCT_NAME` must equal its target name (Xcode's default); discovery fails loudly on a mismatch rather than silently losing timing matches.
Native identifiers must contain no whitespace, quotes or backslashes: bktec 3.5.0's custom command substitution cannot preserve them. Discovery rejects them instead of silently skipping assigned tests.

All enabled plan configurations run on the shard assigned their selector.
A test enabled in two configurations has two legitimate executions, not one;
its timing is their sum. Compare shards against an unfiltered control with
the same configuration set, retaining configuration multiplicity. This example
does not split configurations into separate selectors. Dynamically generated
tests whose inventory changes between enumeration and execution are out of scope.

By default Xcode's own parallel testing is disabled: Buildkite provides the
parallelism. Set `XCUITEST_PARALLEL_TESTING=YES` on shards to also use two Xcode
simulator workers per shard. The worker processes share that job's bktec relay,
so retain every forwarded collector/relay variable. More simulators also use
more memory; this example does not choose a worker count for an arbitrary app.

## Using fastlane scan

Keep the native enumeration and assignment-to-enabled-method intersection.
`scan` delegates test execution to xcodebuild; it does not discover or split
the suite for bktec. The equivalent options are:

| xcodebuild option | scan option |
| --- | --- |
| `-project`, `-scheme`, `-testPlan` | `project`, `scheme`, `testplan` |
| `build-for-testing` | `build_for_testing: true` |
| `test-without-building` | `test_without_building: true` |
| `-only-testing:Target/Class/method()` | `only_testing: ["Target/Class/method()"]` |
| `-xctestrun path` | `xctestrun: "path"` |
| `-testProductsPath path` | No direct option; use the original `.xctestrun` and products instead (see below) |
| `-derivedDataPath`, `-destination` | `derived_data_path`, `destination` |
| `-only-test-configuration Name` | `only_test_configurations: ["Name"]` |
| `-parallel-testing-enabled YES`, `-parallel-testing-worker-count 2` | `parallel_testing: true`, `concurrent_workers: 2` |
| `-retry-tests-on-failure -test-iterations 3` | `number_of_retries: 2` (two retries, three attempts) |

For example, after `bin/build`, run one enabled method from the built products:

```sh
fastlane run scan xctestrun:artifacts/Products/Tests.xctestrun \
  test_without_building:true destination:'platform=iOS Simulator,name=iPhone 17' \
  only_testing:'ExampleAppUITests/StatusTests/testStatus()' \
  result_bundle:true output_directory:artifacts/fastlane
```

For a bktec shard, replace only `bin/test`'s final xcodebuild invocation with
your `scan` lane, passing its already-expanded `only_testing` method array.
Keep the environment-forwarding loop, especially the OTLP token, unchanged.
Do not combine `xctestrun` with project/scheme or `testProductsPath`. Fastlane
2.232.2 adds project/scheme flags when using `xcargs: "-testProductsPath ..."`,
which Xcode rejects. Sharing the original `.xctestrun` and matching products
avoids that incompatibility without an adapter or a second build.

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
When the relay token is present, `bin/test` does not forward the real suite
analytics token into XCTest; bktec retains it for upstream uploads. This does
not isolate trusted tests from the agent or override credentials explicitly
configured in your own test plan or app launch environment.

The custom runner has **no automatic retries**. To use XCTest's native retry
policy, add `-retry-tests-on-failure -test-iterations 3` to `bin/test`'s
`xcodebuild` invocation. Repeated attempts are separate collector executions.
No retries are enabled in this green fixture.

This example does **not** provide bktec muting: that requires a single Test
Engine JSON or JUnit XML result file, whereas xcodebuild writes `.xcresult`.
The retained result bundle is useful for diagnosis but is not a bktec result
file. No converter or second result uploader is included.
