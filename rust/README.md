# Split Rust tests by nextest binary

Split nextest test binaries across parallel jobs with bktec's custom runner, which uploads tagged JUnit results to Test Engine. You don't need a test collector.

## Pipeline

Copy the `Rust / nextest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Each job lists binaries with `bin/discover`, and bktec passes the job's binaries to `bin/test`.

- The step runs `$BUILDKITE_TEST_ENGINE_CLIENT_PATH`, the plugin's bktec, even if another `bktec` is on `PATH`.

## Configure your workspace

Copy [bin/discover](./bin/discover), [bin/test](./bin/test), and [.config/nextest.toml](./.config/nextest.toml) into your Cargo workspace, merging the config if you have one. `bin/test` tags each JUnit test case with its binary ID, which Test Engine uses for timings; keep those tags. Agents need Python 3.8 or later, Rust, and cargo-nextest.

## Limits

- Splits by binary, not by test, so a large binary stays on one job. Don't add nextest's `--partition`.
- Every job discovers and compiles. Run doctests separately.
- bktec can't retry tests. Muting has no effect: `bin/test` keeps nextest's failure exit code, `100`, and bktec only treats exit code `1` as muted failures.
- Manual test selection can match more binaries than intended, especially IDs with `::`.

## Run locally

Use Python 3.8 or later, and Rust and nextest from `mise.toml`, in this directory. These selectors belong to the example; run `bin/discover` to find yours:

```bash
bin/discover
bin/test rust-example
bin/test rust-example::arithmetic
```

Each run replaces `target/nextest/ci/buildkite.xml`, so use separate checkouts for concurrent shards.
