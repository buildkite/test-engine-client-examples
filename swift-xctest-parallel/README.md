# Split Swift package XCTest suites with bktec

Copy the SwiftPM build and shard steps in [the pipeline](../.buildkite/pipeline.yml),
the two `bin/` scripts and the shared setup hook in
[`SplitTestCase`](Tests/PackageTests/ExampleTests.swift). This uses the custom
runner: bktec has no built-in XCTest runner. It needs Swift 6.0, bktec 3.5.0
and Swift collector **2.0.0-beta.3** (no companion collector release).
The original [`swift-xctest`](../swift-xctest) example separately demonstrates
passing, failing, flaky and skipped results without splitting.

## Build and discover once

`bin/build` uses `swift test list --disable-swift-testing` to build and discover
XCTest methods, then derives newline-delimited `Module.Class` selectors from
SwiftPM's native `Module.Class/method` identifiers. No source scanning or
hand-maintained class list. The build job archives `.build`, enabled methods
and selectors;
two shard jobs download that artifact and use ordinary
`swift test --skip-build --filter` invocations. All three jobs must use the
same Docker image, architecture and absolute checkout path (`/workdir` here):
SwiftPM's build state is not generally relocatable. Do not copy a Mac build
to Linux or mix Swift toolchains. The scripts log discovery and assignment.

From this directory, locally:

```sh
bin/build
bin/test PackageTests.ArithmeticTests PackageTests.StringTests
```

An empty assignment runs no tests. Shards expand assignments to exact enabled
methods, with anchored regexes, so one class cannot select a neighbor or broaden
the original selection. Inherited XCTest methods belong to each concrete class:
selecting a base class does not also run its subclasses.
`--disable-swift-testing` excludes Swift Testing, including nested `@Suite`
types, during both discovery and execution. This is an XCTest-only example.

For an existing `swift test --filter REGEX --skip REGEX` selection, set
`TEST_FILTER` and `TEST_SKIP` on the **build** step. For example:

```sh
TEST_FILTER='PackageTests.ArithmeticTests' TEST_SKIP='testAddition' bin/build
bin/test PackageTests.ArithmeticTests
```

Only `testSubtraction` is discovered and run. Swift 6.0's `swift test list`
ignores its `--filter`/`--skip` flags, so `bin/build` applies these expressions
to the native method inventory using Foundation's regex engine, like SwiftPM.
The selected method inventory travels with the artifact; shards cannot add
excluded methods back. Use `|` to combine alternative include or skip patterns.

## Matched durations, not default estimates

The setup hook calls the collector's existing `tagExecution` API for every
method, tagging `test.selector.primary` with the exact `Module.Class` selector
sent to bktec. Xcode's `Target/Class` spelling would **not** match SwiftPM's
selectors. Test Engine sums the methods' durations per class; once the planner's
history snapshot refreshes, matching history lets it balance these classes by
time. One class
is deliberately slow so a timing-aware split differs from a 2/2 count split.
New selectors and history older than seven days can use default estimates.
An immediate repeat can still hit cached missing history; check the plan's
historical-timing summary rather than assuming upload visibility is immediate.
Overrides of `setUpWithError` must call `super.setUpWithError()`.

For large classes, set `TEST_SPLIT_BY: method` in **both** pipeline steps.
Discovery, filters and execution tags then all use `Module.Class/method`
(no parentheses in SwiftPM's native output). Switching granularity requires
a fresh history-building run. Swift Testing is not covered by this example.

## Results, muting and retries

The Swift collector uploads directly; `upload-results: false` prevents bktec
from uploading a second copy. Keep its environment variables propagated into
Docker. Unlike XCUITest this fixture does not restart its test process or need
a relay. No custom-runner automatic retries are available. No bktec muting is
configured: it requires a single Test Engine JSON or JUnit XML result file;
the collector upload alone does not provide that file.
