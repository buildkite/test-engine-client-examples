# Buildkite Test Engine Client examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/test-engine-client-examples)

Examples of collecting test results and splitting tests with [Test Engine](https://buildkite.com/docs/test-engine) and the [Test Engine Client (bktec)](https://buildkite.com/docs/pipelines/configure/tests/bktec/installing-and-using-the-client). See [test collection](https://buildkite.com/docs/pipelines/configure/tests/test-collection) for setup and authentication.

## Choose an example

| Runner | Example | What it shows |
| --- | --- | --- |
| RSpec | [Test collector](./rspec/README.md) · [OpenTelemetry](./rspec-otel/README.md) | Parallel jobs and Test Scheduler pool exec; SDK setup variants |
| Minitest | [Test collector](./ruby-minitest/README.md) | Custom runner splits test files |
| Cucumber | [Test collector](./cucumber/README.md) | Parallel jobs |
| Jest | [Test collector](./jest/README.md) · [OpenTelemetry](./jest-otel/README.md) | Parallel jobs, retries, and Test Scheduler pool consume; manual and HTTP spans |
| Playwright | [Test collector](./playwright/README.md) · [OpenTelemetry](./playwright-otel/README.md) | Parallel jobs and Test Scheduler pool consume; nested spans |
| Cypress | [Test collector](./cypress/README.md) | Parallel jobs and Linux browser setup |
| Vitest | [Test collector (5)](./vitest/README.md) · [Test collector (4)](./vitest-4/README.md) · [OpenTelemetry](./vitest-otel/README.md) | bktec splitting with configured reporters; hook and HTTP spans |
| pytest | [Test collector](./pytest/README.md) · [OpenTelemetry](./pytest-otel/README.md) · [Tag filters](./pytest-tag-filters/README.md) | xdist, Test Scheduler pool consume and exec, tag filters, and SDK setup variants |
| XCTest / XCUITest | [SwiftPM test collector](./swift-xctest/README.md) · [Xcode OpenTelemetry](./swift-xcuitest/README.md) | SwiftPM on Linux without bktec; build-once class splitting across Macs |
| Android JVM / JUnit | [Test collector](./android/README.md) | Gradle class discovery and custom runner |
| Go test | [bktec upload](./go/README.md) | Parallel jobs with gotestsum |
| Rust / nextest | [bktec upload](./rust/README.md) | Custom runner splits test binaries and tags JUnit selectors |

## Result uploads

> [!IMPORTANT]
> Use one result upload method per test run. When a test collector uploads results, set `upload-results: false` in the [Tests Buildkite plugin](https://buildkite.com/resources/plugins/buildkite-plugins/tests-buildkite-plugin/) to avoid duplicate test executions. Go and Rust use bktec's built-in upload instead.

Each example has a step you can copy into your pipeline and commands to run locally. The snippets assume tests are at the repository root: set your test suite slug and OIDC policy, then adjust paths to match your project. [pipeline.yml](./.buildkite/pipeline.yml) contains the exact steps we run in the [public pipeline](https://buildkite.com/buildkite/test-engine-client-examples).

The separate [failure demo pipeline](https://buildkite.com/buildkite/test-engine-client-examples-failures) runs [failures.yml](./.buildkite/failures.yml). Its builds fail intentionally: the RSpec fixtures demonstrate bktec retries and Test Engine flaky detection. The examples pipeline should stay green.
