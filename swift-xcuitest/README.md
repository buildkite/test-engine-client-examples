# Swift XCUITest example

This example reproduces the result loss that occurs when XCTest replaces an
XCUITest runner. Two tests finish before a third test terminates the runner.
Xcode continues the remaining tests in a replacement process and keeps all
five tests in the `.xcresult`, but `test-collector-swift` loses the completed
executions buffered by the terminated process. The final test also fails with
an execution tag, backtrace, and source location to exercise the richer native
collector metadata.

The verification script compares the `.xcresult` test count with the unique
test names logged when the collector uploads. It intentionally fails while
the counts differ. The Buildkite step is therefore soft-failed.

Run it with:

```sh
bin/test
```

The script selects the first available iPhone Simulator. Set
`XCUITEST_DESTINATION` to pass a different `xcodebuild` destination.
