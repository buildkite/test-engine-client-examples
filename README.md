# Buildkite Test Engine Client Examples

This repository contains examples for using the
[Buildkite Test Engine Client](https://github.com/buildkite/test-engine-client).

Each example directory contains application and test runner configuration. Some
directories contain multiple variants. The corresponding Buildkite pipeline
steps are in [`.buildkite/pipeline.yml`](./.buildkite/pipeline.yml). Read both
when adapting an example because the pipeline configuration determines how test
results are uploaded.

## Result uploads

Configure one method to upload results from each test run:

- **Built-in bktec upload:** The Tests Buildkite plugin enables built-in uploads
  by default. Do not configure a Buildkite Test Collector to upload the same
  results. The Go example uses this configuration.
- **Collector upload with bktec:** Let the collector upload results and set
  `upload-results: false`. bktec can still discover, split, run, and retry the
  tests. The Ruby, JavaScript, and Python examples use this configuration.
- **Collector upload without bktec:** Let the collector upload results, set
  `upload-results: false`, and set `install-client: false`. The Swift and Android
  examples use this configuration.

> [!IMPORTANT]
> If bktec and a Buildkite Test Collector both upload results from the same test
> run, Test Engine records duplicate test executions.

A Buildkite Test Collector is not a general prerequisite for using bktec. Some
examples also demonstrate OpenTelemetry collection. Check the matching pipeline
step for the complete configuration.
