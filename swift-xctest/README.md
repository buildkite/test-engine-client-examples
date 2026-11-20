# SwiftPM XCTest

Run a Swift package's XCTest tests on Linux. The Swift test collector sends results to Test Engine without bktec.

## Pipeline

Copy the `Swift: XCTest (test-collector-swift)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). The Tests Buildkite plugin only supplies a token: `install-client: false` skips bktec. Keep `BUILDKITE_ANALYTICS_TOKEN` in the Docker plugin's `environment` so the collector receives it.

## Test collector

Add the `test-collector-swift` package and link `BuildkiteTestCollector` into your test target, as in [Package.swift](./Package.swift). XCTest loads it automatically. The step's `--disable-swift-testing` runs only XCTest tests, which the collector records. Remove it if your package also has Swift Testing tests, which then run without being recorded. See [XCTest](https://buildkite.com/docs/pipelines/configure/tests/test-collection/swift-collectors#xctest).

## Run locally

Use Swift 6.0 in this directory:

```bash
swift package resolve
swift test --disable-swift-testing
```
