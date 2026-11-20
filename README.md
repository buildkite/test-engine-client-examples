# Buildkite Test Engine Client examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/test-engine-client-examples)

Examples for the [Test Engine Client (bktec)](https://buildkite.com/docs/pipelines/configure/tests/bktec/installing-and-using-the-client). Choose a runner, then a setup and feature. Each README links the configuration and steps to copy from [pipeline.yml](./.buildkite/pipeline.yml). See the [public pipeline](https://buildkite.com/buildkite/test-engine-client-examples) for results and logs.

## Choose an example

| Runner | Setup | Features |
| --- | --- | --- |
| RSpec | Ruby test collector with OpenTelemetry: [rspec](./rspec/README.md), [rspec-otel](./rspec-otel/README.md) | Parallel jobs and Test Scheduler pool exec in `rspec`; SDK setup variants in `rspec-otel` |
| Minitest | Ruby test collector: [ruby-minitest](./ruby-minitest/README.md) | Custom runner splits test files |
| Cucumber | Ruby test collector: [cucumber](./cucumber/README.md) | Parallel jobs |
| Jest | JavaScript test collector: [jest](./jest/README.md). OpenTelemetry: [jest-otel](./jest-otel/README.md) | Parallel jobs, retry demo, and Test Scheduler pool consume in `jest` |
| Playwright | JavaScript test collector: [playwright](./playwright/README.md). OpenTelemetry: [playwright-otel](./playwright-otel/README.md) | Parallel jobs and Test Scheduler pool consume in `playwright`; nested steps in `playwright-otel` |
| Cypress | JavaScript test collector: [cypress](./cypress/README.md) | Parallel jobs; Linux browser setup |
| Vitest | JavaScript test collector: [vitest](./vitest/README.md) (5), [vitest-4](./vitest-4/README.md) (4). OpenTelemetry: [vitest-otel](./vitest-otel/README.md) | `bktec run`; hook and HTTP spans in `vitest-otel` |
| pytest | Python test collector: [pytest](./pytest/README.md), [pytest-tag-filters](./pytest-tag-filters/README.md). OpenTelemetry: [pytest-otel](./pytest-otel/README.md) | xdist and Test Scheduler pool consume and exec in `pytest`; tag filters in `pytest-tag-filters`; SDK setup variants with xdist in `pytest-otel` |
| XCTest / XCUITest | Swift test collector: [swift-xctest](./swift-xctest/README.md). OpenTelemetry: [swift-xcuitest](./swift-xcuitest/README.md) | SwiftPM on Linux without bktec; Xcode build-once class splitting across Macs |
| Android JVM / JUnit | Android test collector: [android](./android/README.md) | Gradle class discovery and custom runner |
| Go test | Built-in bktec upload: [go](./go/README.md) | Parallel jobs with gotestsum |
| Rust / nextest | Built-in bktec upload: [rust](./rust/README.md) | Custom runner splits test binaries and tags JUnit selectors |

The separate [failure demo pipeline](https://buildkite.com/buildkite/test-engine-client-examples-failures) runs [failures.yml](./.buildkite/failures.yml). Its builds fail intentionally: the RSpec fixtures demonstrate bktec retries and Test Engine flaky detection. The examples pipeline should stay green.

## Result uploads

Use one result upload method per test run with the [Tests Buildkite plugin](https://buildkite.com/resources/plugins/buildkite-plugins/tests-buildkite-plugin/):

- Built-in bktec upload: keep the plugin's default upload enabled, as in Go and Rust. No test collector is required.
- Test collector with bktec: set `upload-results: false`, as in Ruby, JavaScript, Python, Android, and XCUITest. Keep the OTLP relay settings where configured for OpenTelemetry.
- Test collector without bktec: set `upload-results: false` and `install-client: false`, as in SwiftPM.

Do not enable both bktec and test collector result uploads for the same run: this creates duplicate test executions.

When copying a step, set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc), adjust paths, and remove the example's `cd` if tests live at the repository root. Keep Test Scheduler pool steps' token unsets: pools need job-identity claims absent from the plugin's token.

Copy the `bktec_version` anchor or replace `*bktec_version` with a client version in standalone steps.
