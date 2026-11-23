# Buildkite Test Engine Client examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/test-engine-client-examples)

Examples of collecting test results and splitting tests with [Test Engine](https://buildkite.com/docs/test-engine) and the [Test Engine Client (bktec)](https://buildkite.com/docs/pipelines/configure/tests/bktec/installing-and-using-the-client). Every example runs in the [public pipeline](https://buildkite.com/buildkite/test-engine-client-examples), and its steps are in [pipeline.yml](./.buildkite/pipeline.yml).

## Choose an example

| Runner | Example | What it shows |
| --- | --- | --- |
| RSpec | [Test collector](./rspec/README.md) · [OpenTelemetry](./rspec-otel/) | Parallel jobs and Test Scheduler pool exec, with collector-configured OpenTelemetry; HTTP, Active Record, and Redis spans |
| Minitest | [Test collector](./ruby-minitest/README.md) | Custom runner that splits test files |
| Cucumber | [Test collector](./cucumber/README.md) | Parallel jobs |
| Jest | [Test collector](./jest/README.md) · [OpenTelemetry](./jest-otel/README.md) | Parallel jobs, retries, and Test Scheduler pool consume; manual, HTTP, and fetch spans |
| Playwright | [Test collector](./playwright/README.md) · [OpenTelemetry](./playwright-otel/README.md) | Parallel jobs and Test Scheduler pool consume; step, action, and assertion spans |
| Cypress | [Test collector](./cypress/README.md) | Parallel jobs and Linux browser setup |
| Mocha | [Test collector](./mocha/README.md) | Custom runner that splits test files |
| Vitest | [Test collector (5)](./vitest/README.md) · [Test collector (4)](./vitest-4/README.md) · [OpenTelemetry](./vitest-otel/README.md) | bktec with the collector's reporters; hook, manual, HTTP, and fetch spans |
| pytest | [Test collector](./pytest/README.md) · [OpenTelemetry](./pytest-otel/) · [Tag filters](./pytest-tag-filters/README.md) | xdist, Test Scheduler pool consume and exec, and tag filters; collector-configured OpenTelemetry with SQLite and HTTP spans |
| XCTest / XCUITest | [SwiftPM test collector](./swift-xctest/README.md) · [Xcode OpenTelemetry](./swift-xcuitest/README.md) | SwiftPM on Linux without bktec; build once and split classes across Macs |
| Android JVM / JUnit | [Test collector](./android/README.md) | Gradle class discovery and a custom runner |
| Kotlin and Java / JUnit, Kotest | [Test collector](./gradle-jvm/README.md) | Kotlin DSL and Groovy DSL builds, Gradle class discovery, and a custom runner |
| Go test | [bktec upload](./go/README.md) | Parallel jobs with gotestsum |
| Rust / nextest | [bktec upload](./rust/README.md) | Custom runner that splits test binaries and tags JUnit selectors |

## Adapt a step

Copy the example's step from [pipeline.yml](./.buildkite/pipeline.yml), then:

1. Set `suite-slug` to your test suite, and add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) that allows your pipeline.
1. Replace `client-version: *bktec_version` with a bktec version, such as `"3.6.0"`.
1. Remove `cd <example>`, and remove the example directory from repository-relative paths such as `artifact_paths`.
1. Remove the `mise` plugin if your agents already have the language runtime.
1. Remove `BUILDKITE_ANALYTICS_LOCATION_PREFIX` if your tests run from the repository root. Otherwise, set it to their directory.
1. Remove any `export BUILDKITE_ANALYTICS_KEY=...` line. These examples share one test suite, so some steps give each job its own run. Your build ID is the right run key.
1. Check your organization's OIDC lifetime limit. The Tests Buildkite plugin defaults to a two-hour token issued before setup, matching Buildkite's default maximum. Set `oidc-lifetime` within your organization's limit if it is lower. Tokens are not refreshed, so their lifetime must cover setup, tests, and uploads; uploads after expiry can fail without failing the job.

Keep `unset BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN` in Test Scheduler pool steps. Pools need a token with job identity claims, which bktec requests but the plugin doesn't.

> [!IMPORTANT]
> Use one result upload method per test run. When a test collector uploads results, keep `upload-results: false` to avoid duplicate test executions. The Go and Rust examples use bktec's built-in upload instead.

## Failure demo

The [failure demo pipeline](https://buildkite.com/buildkite/test-engine-client-examples-failures) runs [failures.yml](./.buildkite/failures.yml). Its builds fail on purpose: the RSpec fixtures demonstrate bktec retries and Test Engine flaky detection. The examples pipeline should stay green.
