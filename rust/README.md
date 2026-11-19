# Split Rust tests by nextest binary

Use bktec's custom runner with stable Rust and cargo-nextest. Each selector is
one whole test binary, such as `rust-example` (library unit tests) or
`rust-example::arithmetic` (integration tests).

## Run locally without credentials

Use Python 3.8+, Rust via rustup (this directory pins 1.91.1), and
[cargo-nextest 0.9.152](https://github.com/nextest-rs/nextest/releases/tag/cargo-nextest-0.9.152)
on `PATH`. Use a prebuilt nextest release for your platform.

From the repository root, replay two example assignments:

```sh
cd rust
bin/discover
bin/test rust-example
bin/test rust-example::arithmetic
```

Expect two selectors and then one and two passing tests, respectively. Both
binaries contain a test named `tests::adds`; nextest keeps them distinct using
the JUnit `classname` (binary ID) and `name` (full test name). Each invocation
writes `target/nextest/ci/buildkite.xml` and replaces the previous report. Use
separate checkouts for concurrent shards. These commands don't contact Test Engine.

## Use in your Buildkite pipeline

Provision the same tools on the agents. Copy this step into your pipeline and
replace `your-rust-suite` with the slug of a Test Engine suite in your organization.
This repository's default pipeline does not run the step.

```yaml
steps:
  - label: "Rust / nextest"
    parallelism: 2
    commands:
      - cd rust
      - mkdir -p target
      - bin/discover > target/selectors.txt
      - bktec run
    env:
      BUILDKITE_TEST_ENGINE_SELECTOR_FILE: target/selectors.txt
    plugins:
      - tests#v1.1.0:
          suite-slug: your-rust-suite
          client-version: "3.5.0"
          test-runner: custom
          test-cmd: "bin/test {{testExamples}}"
          result-path: target/nextest/ci/buildkite.xml
          upload-results: true
```

Each job discovers the same binaries. bktec passes only that job's assigned
selectors to `bin/test`, which uses exact nextest binary filters. The script
adds a `buildkite.tag.test.selector.primary` property to each JUnit testcase,
with its binary ID as the value. bktec uploads the tagged JUnit file; do not also
upload the raw report or configure a collector for the same run. Once timing
history is available, Test Engine can use it to balance binaries instead of
using default durations.

## Limits

- Splitting is by binary, not by individual test. A large binary stays on one
  job. Do not add nextest's native `--partition` on top of bktec assignments.
  Discovery and compilation happen on every job. Run doctests separately.
- This is not a native Rust runner and does not cover Test Engine selection or
  skip. Manual Test Engine selection is not equivalent to an exact nextest
  binary filter: in particular, it can match more than intended for IDs with
  `::`. Rust's `#[ignore]` is independent of Test Engine skip.
- No Test Engine auto-retry or muting. The wrapper preserves nextest's test
  failure exit code (`100`); bktec's muted-only exit handling only suppresses
  exit code `1`.
