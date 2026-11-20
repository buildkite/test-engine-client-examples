# Split XCTest and XCUITest across Macs

Build an Xcode project once, then split XCTest classes across Macs. Copy [bin/build](./bin/build) and [bin/test](./bin/test), and link the Swift test collector into each test target.

Use `XCUITest build and discover` and `XCUITest shard %n` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the test collector sends OpenTelemetry results through bktec's OTLP relay. Keep the relay settings and `TEST_RUNNER_` forwarding.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Change project, scheme, test plan, simulator, queue, and artifact paths. These steps run from the repository root: if you remove the `swift-xcuitest/` directory, update paths in both steps rather than adding a `cd`.

Use matching Xcode versions and simulator architectures on all jobs, with jq installed. Keep one enabled test-plan configuration, `PRODUCT_NAME` equal to the target name, and method filtering in `bin/test`. This custom runner does not configure bktec retries or muting.

Run locally in this directory on a Mac with Xcode 26.2:

```sh
bin/build
bin/test ExampleAppUITests/LaunchTests ExampleAppUITests/StatusTests
```

Set `XCUITEST_DESTINATION` for both commands to use a simulator other than iPhone 17. Local commands run tests without starting the OTLP relay.
