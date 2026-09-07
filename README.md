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
  `upload-results: false`, and set `install-client: false`. The Vitest, Swift,
  and Android examples use this configuration.

> [!IMPORTANT]
> If bktec and a Buildkite Test Collector both upload results from the same test
> run, Test Engine records duplicate test executions.

A Buildkite Test Collector is not a general prerequisite for using bktec. Some
examples also demonstrate OpenTelemetry collection. Check the matching pipeline
step for the complete configuration.

## Vitest compatibility examples

- [`vitest-4`](./vitest-4): Vitest **4.1.11**, pinned to the latest v4 release
  when added, with `buildkite-test-collector` **1.11.0**.
- [`vitest`](./vitest): Vitest **5.0.0**, the latest release when added, initially
  with collector **1.11.0** to reproduce
  [bktest#29](https://github.com/buildkite/bktest/issues/29).

These are standalone npm packages, deliberately outside the root workspaces.
Each has its own lockfile and `node_modules` so the collector cannot resolve
another example's Vitest version through npm hoisting. Use Node 24.19.0 (see
each example's `mise.toml`):

```sh
npm ci --prefix vitest-4
npm test --prefix vitest-4

vitest/bin/setup
npm test --prefix vitest
npm run test:collector --prefix vitest
```

The Vitest 5 checkpoint intentionally fails with `Failed to load custom Reporter`
because v5 removed `vitest/reporters`. Its CI step is not soft-failed. Vitest 4
should pass. Both examples configure the collector exactly as a consumer would;
they run Vitest directly to isolate collector compatibility from bktec.

The Vitest 5 `test:collector` integration check uses a local HTTP receiver and
a dummy token. It requires exactly one upload, checks nested passing, skipped,
todo and runtime-skipped results and source locations, and requires receipt of
the server's delayed acknowledgement before Vitest exits. This catches the
silent missing-upload bug as well as reporter-loading failures. It needs no
Buildkite credentials and never sends results to Test Engine.

The separate `npm test` invocation uploads to Test Engine when
`BUILDKITE_ANALYTICS_TOKEN` is set (provided by the Tests plugin in CI). Without
a token, the collector prints a warning and skips the upload.
