# Buildkite Test Engine Client Examples

[![Build status](https://badge.buildkite.com/a8ccba369ce3e20a00a424e4989224fc5f45f0a4fc00db39e6.svg?branch=main)](https://buildkite.com/buildkite/test-engine-client-examples)

This repository contains examples for using the
[Buildkite Test Engine Client](https://github.com/buildkite/test-engine-client).

Start with your runner, then choose how to collect results. RSpec demonstrates
the reference layout: each directory contains a complete, copyable setup and
its own `pipeline.yml`. Other runners still use steps in
[`.buildkite/pipeline.yml`](./.buildkite/pipeline.yml) while they migrate.

| Runner | Quick start: plugin, built-in upload | Collector: direct bktec | OpenTelemetry | Features |
| --- | --- | --- | --- | --- |
| RSpec | [rspec](./rspec) | [rspec-collector](./rspec-collector) | [rspec-otel](./rspec-otel) | [Pool, preview](./rspec-collector/pipeline.yml) |

The quick start is the default for a new suite. Choose a collector for execution
tags, or OpenTelemetry for test traces. Use **one upload method per run**.
See the [public pipeline](https://buildkite.com/buildkite/test-engine-client-examples)
for build results. To see retries and flaky-test quarantine, run the separate
[failure-demo pipeline](./.buildkite/failures.yml): it is red on purpose and
does not change the passing example fixtures.

## Result uploads

Configure one method to upload results from each test run:

- **Built-in bktec upload:** The Tests Buildkite plugin enables built-in uploads
  by default. Do not configure a Buildkite Test Collector to upload the same
  results. The RSpec quick start and Go example use this configuration.
- **Collector upload with bktec:** Let the collector upload results and set
  `upload-results: false`. bktec can still discover, split, run, and retry the
  tests (depending on runner support). The legacy Ruby, JavaScript, Python, and
  [Android](./android/README.md) examples use this plugin configuration. The new
  RSpec collector and OpenTelemetry examples run bktec directly instead.
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

## Developing the examples

Customer configuration lives in example directories; release checks live in
`.buildkite/harness/`. With Bash, jq and the Buildkite agent installed, run
`.buildkite/harness/upload check` to lint migrated examples. CI uploads those
same pipelines and adds `verify`, which waits up to two minutes per suite for
Test Engine to record the expected counts, then compares scopes, names and files
with an earlier main build and between the quick start and collector. A new
suite explicitly bootstraps its main baseline on its first main build.

Set `BKTEC_VERSION=3.6.0-rc.2` on a build to override RSpec's bktec pins without
editing customer examples. `EXAMPLES=rspec,rspec-collector` selects migrated
directories; it does not filter legacy steps. Collector-version overrides are
not implemented yet.

To check an existing build locally, set `BUILDKITE_ORGANIZATION_SLUG` and a
`BUILDKITE_API_TOKEN` with `read_suites`, then run
`.buildkite/harness/verify <build-uuid> <suite-slug>...`. In CI, verification uses
short-lived suite-audience OIDC tokens. Exit 1 reports missing results or a
regression; exit 2 reports an unavailable API or authentication failure.

Use the [example README template](./.buildkite/README.example.md) and
[repository guidance](./AGENTS.md) when adding another runner.
