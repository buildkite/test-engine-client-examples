# Buildkite Test Engine examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/bktest-examples)

Examples of collecting test results and splitting tests with [Test Engine](https://buildkite.com/docs/test-engine) and the [Test Engine Client (bktest)](https://buildkite.com/docs/pipelines/configure/tests/bktec/installing-and-using-the-client). Every example runs in the [public pipeline](https://buildkite.com/buildkite/bktest-examples), and its steps are in [pipeline.yml](./.buildkite/pipeline.yml).

## Choose an example

| Runner | Example | What it shows |
| --- | --- | --- |
| RSpec | [Test collector](./rspec/README.md) · [OpenTelemetry](./rspec-otel/README.md) | Parallel jobs and `pool run` with a persistent runner; collector-configured OpenTelemetry with HTTP, Active Record, and Redis spans |
| Minitest | [Test collector](./ruby-minitest/README.md) | Custom runner that splits test files |
| Cucumber | [Test collector](./cucumber/README.md) | Parallel jobs |
| Jest | [Test collector](./jest/README.md) · [OpenTelemetry](./jest-otel/README.md) | Parallel jobs, retries, and `pool run` with a fresh process per batch; manual, HTTP, and fetch spans |
| Playwright | [Test collector](./playwright/README.md) · [OpenTelemetry](./playwright-otel/README.md) | Parallel jobs and `pool run` with a fresh process per batch; step, action, and assertion spans |
| Cypress | [Test collector](./cypress/README.md) | Parallel jobs and Linux browser setup |
| Mocha | [Test collector](./mocha/README.md) | Custom runner that splits test files |
| Vitest | [Test collector (5)](./vitest/README.md) · [Test collector (4)](./vitest-4/README.md) · [OpenTelemetry](./vitest-otel/README.md) | bktest with the collector's reporters; hook, manual, HTTP, and fetch spans |
| pytest | [Test collector](./pytest/README.md) · [OpenTelemetry](./pytest-otel/README.md) · [Tag filters](./pytest-tag-filters/README.md) | xdist, both `pool run` modes, and tag filters; collector-configured OpenTelemetry with SQLite and HTTP spans |
| XCTest / XCUITest | [SwiftPM test collector](./swift-xctest/README.md) · [Xcode OpenTelemetry](./swift-xcuitest/README.md) | SwiftPM on Linux without bktest; build once and split classes across Macs |
| Android JVM / JUnit | [Test collector](./android/README.md) | Gradle class discovery and a custom runner |
| Kotlin and Java / JUnit, Kotest | [Test collector](./gradle-jvm/README.md) | Kotlin DSL and Groovy DSL builds, Gradle class discovery, and a custom runner |
| Go test | [bktest upload](./go/README.md) | Parallel jobs with gotestsum |
| Rust / nextest | [bktest upload](./rust/README.md) | Custom runner that splits test binaries and tags JUnit selectors |

## Adapt a step

Copy the example's step from [pipeline.yml](./.buildkite/pipeline.yml), then:

1. Set `suite-slug` to your test suite, and add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) that allows your pipeline.
1. Replace `client-version: *bktest_version` with a bktest version, such as `"3.7.0"`.
1. Remove `cd <example>`, and remove the example directory from repository-relative paths such as `artifact_paths`.
1. Remove the `mise` plugin if your agents already have the language runtime. Otherwise, set its `dir:` to the directory where mise should run (for example, `.` for a root-level `mise.toml`).
1. Remove `BUILDKITE_ANALYTICS_LOCATION_PREFIX` if your tests run from the repository root. Otherwise, set it to their directory.
1. Remove any `export BUILDKITE_ANALYTICS_KEY=...` line. These examples share one test suite, so some steps give each job its own run. Your build ID is the right run key.
1. Check your organization's OIDC lifetime limit. The Tests Buildkite plugin defaults to a two-hour token issued before setup, matching Buildkite's default maximum. Set `oidc-lifetime` within your organization's limit if it is lower. The plugin does not refresh its token. If your collector uses that token, it must last through setup, tests, and uploads; uploads after expiry can fail without failing the job.

> [!IMPORTANT]
> Use one result upload method per test run. When a test collector uploads results, keep `upload-results: false` to avoid duplicate test executions. The Go and Rust examples use bktest's built-in upload instead.

### Adapt a Test Scheduler pool

Copy the planning step and its worker template, then [adapt both](#adapt-a-step). Set `suite-slug` in the planner only; keep `$BUILDKITE_TEST_ENGINE_SUITE_SLUG` in the template so it inherits the planner's suite at upload.

Use the same bktest version (3.7.0 or later) for both. In your pipeline, replace `*bktest_version` in the planner and `${BKTEST_VERSION:-3.7.0}` in the template with the same literal version, such as `"3.7.0"`. The template already defaults to `3.7.0` without `BKTEST_VERSION`; this repository uses that variable to test other releases across the whole pipeline.

Keep the planner's `--pipeline-upload` path relative to its working directory, and match discovery settings such as the test file pattern and location prefix in both jobs. Keep both the pool ID and the fallback flag in the template so workers can still run when planning falls back to a local split. Remove `--pool-lease-max-attempts 2` from the planner: the examples set a low cap to demonstrate multiple leases on tiny suites, but your pool can use the server default.

Keep `unset BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN` in the planner and workers. Scheduler requests need a token with job identity claims, which bktest requests but the plugin doesn't.

Keep the `BUILDKITE_ANALYTICS_TOKEN` unset in the fresh-process workers too. This lets bktest pass its own OIDC upload token to the collector instead of reusing the plugin's token.

## Failure demo

The [failure demo pipeline](https://buildkite.com/buildkite/bktest-examples-failures) runs [failures.yml](./.buildkite/failures.yml). Its builds fail on purpose: the RSpec fixtures demonstrate bktest retries and Test Engine flaky detection. The examples pipeline should stay green.
