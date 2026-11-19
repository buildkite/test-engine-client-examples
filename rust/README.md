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

## Run in Buildkite

The Rust group in [the examples pipeline](../.buildkite/pipeline.yml) uses two
parallel jobs and the existing `test-engine-client-examples` suite. The mise
plugin installs Rust and nextest using `rust/mise.toml`; the agents also need
Python 3.8+. Each job saves its plan and tagged JUnit report as build artifacts.

To adapt the group for another repository, copy `bin/discover`, `bin/test`, and
`.config/nextest.toml` into your Cargo workspace (merge the config if you already
have one). Change the workspace paths and `suite-slug`, and either copy the tool
configuration or provision the tools on your agents. Replace `*bktec_version`
with a client version such as `"3.5.0"` if you don't copy the pipeline's version
anchor. Keep `$$` with normal `buildkite-agent pipeline upload` interpolation
so the client path resolves at job time; otherwise use a single `$`.

Each job discovers the same binaries: those with a non-ignored test that
matches the nextest `ci` profile's filter. After discovery, bktec requests fresh
OIDC credentials for planning and result uploads. The command uses the client
installed by the Tests plugin, even if another `bktec` is on `PATH`. bktec passes only that
job's assigned selectors to `bin/test`, which uses exact nextest binary filters.
The script adds a `buildkite.tag.test.selector.primary` property to each JUnit testcase,
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
