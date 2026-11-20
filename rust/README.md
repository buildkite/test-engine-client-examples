# Split Rust tests by nextest binary

Split nextest test binaries across parallel jobs with bktec's custom runner and upload their JUnit results to Test Engine.

## Pipeline

```yaml
steps:
  - label: ":rust: Rust / nextest"
    parallelism: 2
    commands:
      - mkdir -p target
      - bin/discover > target/selectors.txt
      - '"$$BUILDKITE_TEST_ENGINE_CLIENT_PATH" run --plan-out target/plan.json'
    env:
      BUILDKITE_TEST_ENGINE_SELECTOR_FILE: target/selectors.txt
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          test-cmd: "bin/test {{testExamples}}"
          result-path: target/nextest/ci/buildkite.xml
          suite-slug: your-suite-slug
          client-version: "3.5.0"
          tags:
            - "language.name=rust"
            - "test.framework.name=nextest"
```

bktec uploads the tagged JUnit report; you don't need a test collector. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite. Our `Rust / nextest` step, including report artifacts, is in [pipeline.yml](../.buildkite/pipeline.yml).

## Configure your workspace

Copy [bin/discover](./bin/discover), [bin/test](./bin/test), and [.config/nextest.toml](./.config/nextest.toml) into your Cargo workspace. The snippet assumes that workspace is at the repository root. Keep the JUnit selector tags added by `bin/test` so results match the assigned binaries. Don't combine this with nextest's `--partition`; this custom runner does not configure bktec retries or muting. Run doctests separately.

## Run locally

Use Python 3.8+ and Rust and nextest from `mise.toml` in this directory. These selectors belong to the example; use `bin/discover` to find yours:

```bash
bin/discover
bin/test rust-example
bin/test rust-example::arithmetic
```

Each invocation replaces the report at `target/nextest/ci/buildkite.xml`; use separate checkouts for concurrent shards.
