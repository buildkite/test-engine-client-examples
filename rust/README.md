# Split Rust tests by nextest binary

Split whole nextest test binaries with bktec's custom runner. Copy [bin/discover](./bin/discover), [bin/test](./bin/test), and [.config/nextest.toml](./.config/nextest.toml) into your Cargo workspace.

Use `Rust / nextest` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin leaves built-in uploads enabled; bktec uploads the tagged JUnit report. Do not add a test collector for the same run.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust selector, result, artifact, and mise paths; remove `cd rust` for a workspace at the repository root. Replace `*bktec_version` with a version if you don't copy the pipeline's anchor.

Keep the JUnit selector tags added by `bin/test`. Splitting is by binary, not individual test; do not combine it with nextest's `--partition`. This custom runner does not configure bktec retries or muting. Run doctests separately.

Run locally in this directory with Python 3.8+ and Rust and nextest from `mise.toml`, without Test Engine credentials:

```sh
bin/discover
bin/test rust-example
bin/test rust-example::arithmetic
```

Each invocation replaces the report at `target/nextest/ci/buildkite.xml`; use separate checkouts for concurrent shards.
