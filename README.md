# Buildkite Test Engine Client Examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/test-engine-client-examples)

This repository contains examples for using the
[Buildkite Test Engine Client](https://github.com/buildkite/test-engine-client).

Each example directory contains application and test runner configuration. Some
directories contain multiple variants. The corresponding Buildkite pipeline
steps are in [`.buildkite/pipeline.yml`](./.buildkite/pipeline.yml). Read both
when adapting an example because the pipeline configuration determines how test
results are uploaded. See the [public Buildkite pipeline](https://buildkite.com/buildkite/test-engine-client-examples)
for build results and job logs.

## Result uploads

Configure one method to upload results from each test run:

- **Built-in bktec upload:** The Tests Buildkite plugin enables built-in uploads
  by default. Do not configure a Buildkite Test Collector to upload the same
  results. The Go example uses this configuration.
- **Collector upload with bktec:** Let the collector upload results and set
  `upload-results: false`. bktec can still discover, split, run, and retry the
  tests (depending on runner support). The Ruby, JavaScript, Python, and
  [Android](./android/README.md) examples use this configuration.
- **Collector upload without bktec:** Let the collector upload results, set
  `upload-results: false`, and set `install-client: false`. The Vitest and SwiftPM
  examples use this configuration (Vitest OpenTelemetry uses bktec).

> [!IMPORTANT]
> If bktec and a Buildkite Test Collector both upload results from the same test
> run, Test Engine records duplicate test executions.

A Buildkite Test Collector is not a general prerequisite for using bktec. Some
examples also demonstrate OpenTelemetry collection. Check the matching pipeline
step for the complete configuration.

## Swift examples

- [`swift-xcuitest`](./swift-xcuitest): build an Xcode project once, discover
  native XCTest classes, and split UI tests across parallel hosted Macs with
  bktec's custom runner. Test Engine derives class selectors from collector
  metadata. The OTLP relay handles uploads across XCTest runner restarts.
- [`swift-xctest`](./swift-xctest): run a Swift package's XCTest suite on Linux.

The [versioned JavaScript OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md)
defines supported versions, instrumentation, delivery and limitations.

## Jest examples

- [`jest`](./jest): collector 1.16.0 with the default JSON uploads and bktec.
- [`jest-otel`](./jest-otel): collector 1.16.0 with OpenTelemetry test results,
  manual, local HTTP and fetch spans.

## Playwright examples

- [`playwright`](./playwright): JSON collection with bktec, including pool runs.
- [`playwright-otel`](./playwright-otel): collector 1.16.0 with OpenTelemetry test
  results, nested steps, browser actions and assertions.

## Vitest examples

- [`vitest-4`](./vitest-4): Vitest 4.
- [`vitest`](./vitest): the current Vitest major version (5).
- [`vitest-otel`](./vitest-otel): collector 1.16.0 with OpenTelemetry test results,
  hook, manual, local HTTP and fetch spans (Vitest 4/5).

The JSON examples run Vitest directly and upload results using the Buildkite Test
Collector. They have independent npm installs to keep their Vitest versions
isolated. Use the Node version in each example's `mise.toml`, run `npm ci` and
`npm test` in that directory, and set `BUILDKITE_ANALYTICS_TOKEN` to upload.
