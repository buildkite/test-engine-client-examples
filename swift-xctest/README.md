# SwiftPM XCTest

SwiftPM XCTest without bktec. Link the Swift test collector into your test target as shown in [Package.swift](./Package.swift).

Use the `Swift: XCTest (test-collector-swift)` step in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false` and `install-client: false`; the test collector uploads results using the token forwarded into Docker.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust package paths and remove `cd swift-xctest` if the package is at the repository root. Keep Docker's token forwarding and `--disable-swift-testing` for this XCTest example.

Run locally in this directory with Swift 6.0: `swift package resolve`, then `swift test --disable-swift-testing`.
