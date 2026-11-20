# Split XCTest and XCUITest across Macs

Build your Xcode project once, then split XCTest and XCUITest classes across Macs. The Swift test collector sends results through bktec's OpenTelemetry relay.

## Pipeline

```yaml
steps:
  - label: ":swift: XCUITest build and discover"
    key: swift-xcuitest-build
    command: bin/build
    agents:
      queue: your-macos-queue
    artifact_paths: artifacts/tests.tar.gz
  - label: ":swift: XCUITest shard %n"
    depends_on: swift-xcuitest-build
    parallelism: 2
    commands:
      - buildkite-agent artifact download artifacts/tests.tar.gz . --step swift-xcuitest-build
      - tar -xzf artifacts/tests.tar.gz -C artifacts
      - bktec run --plan-out artifacts/plan.json
    agents:
      queue: your-macos-queue
    env:
      BUILDKITE_TEST_ENGINE_SELECTOR_FILE: artifacts/selectors.txt
      BUILDKITE_TESTS_OTLP_RELAY: "true"
      BUILDKITE_TESTS_OTLP_RELAY_BATCHING: "true"
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          test-cmd: bin/test {{testExamples}}
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

Set your macOS queue and add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite. `upload-results: false` leaves uploads to the test collector. Our `XCUITest build and discover` and `XCUITest shard %n` steps are in [pipeline.yml](../.buildkite/pipeline.yml); this snippet puts your project and scripts at the repository root.

## Test collector

Copy [bin/build](./bin/build) and [bin/test](./bin/test), update their project, scheme, test plan, and simulator, and link the Swift test collector into each test target. Use matching Xcode versions and simulator architectures on all jobs, with jq installed. Keep `TEST_RUNNER_` forwarding, method filtering, one enabled test-plan configuration, and `PRODUCT_NAME` equal to the target name. This custom runner does not configure bktec retries or muting.

## Run locally

Run in this directory on a Mac with Xcode 26.2:

```bash
bin/build
bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

Set `XCUITEST_DESTINATION` for both commands to use a simulator other than iPhone 17. Local commands run tests without starting the OTLP relay.
