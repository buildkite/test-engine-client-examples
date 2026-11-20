# SwiftPM XCTest

Run a Swift package's XCTest tests on Linux and send results to Test Engine with the Swift test collector.

## Pipeline

```yaml
steps:
  - label: ":swift: Swift: XCTest (test-collector-swift)"
    commands:
      - swift package resolve
      - swift test --disable-swift-testing
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          suite-slug: your-suite-slug
          upload-results: false
          install-client: false
      - docker#v5.14.0:
          image: "swift:6.0-noble"
          propagate-environment: true
          environment:
            - BUILDKITE_ANALYTICS_TOKEN
```

The Tests Buildkite plugin supplies credentials, but this step runs Swift directly: `install-client: false` skips bktec and `upload-results: false` leaves uploads to the test collector. Docker forwards the token to the tests. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our exact step is `Swift: XCTest (test-collector-swift)` in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add the Swift test collector package and link `BuildkiteTestCollector` into your test target, as in [Package.swift](./Package.swift). XCTest observation loads it automatically. Keep `--disable-swift-testing` to run only XCTest.

## Run locally

Use Swift 6.0 and run in this directory:

```bash
swift package resolve
swift test --disable-swift-testing
```
