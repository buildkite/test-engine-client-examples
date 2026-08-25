# Swift XCUITest example

This example runs passing UI tests against a minimal iOS app and uploads the
results with [`test-collector-swift`](https://github.com/buildkite/test-collector-swift).
It uses a shared scheme, a lexical test plan, and an explicit `.xcresult`
bundle so the same command works locally and on a macOS Buildkite agent.

Run it with:

```sh
bin/test
```

The script selects the first available iPhone Simulator. Set
`XCUITEST_DESTINATION` to pass a different `xcodebuild` destination.
