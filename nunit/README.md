# NUnit

A .NET NUnit example demonstrating [Buildkite Test Engine](https://buildkite.com/docs/test-engine) test splitting using `bktec` with the built-in NUnit runner.

## Structure

```
bin/test              # Entry point: builds, then runs bktec configured by the tests plugin
bin/run-tests         # Legacy custom runner helper retained for reference
src/MyLib/            # Library under test
tests/MyLib.Tests/    # NUnit test project (25 tests across 3 files)
mise.toml             # .NET SDK managed by mise
NUnitSpike.slnx       # Solution file
```

## How it works

1. The Buildkite pipeline's `tests#v1.0.0` plugin installs `bktec`, authenticates with OIDC, and configures:
   - `BUILDKITE_TEST_ENGINE_TEST_RUNNER=nunit`
   - `BUILDKITE_TEST_ENGINE_TEST_FILE_PATTERN=tests/**/*Tests.cs`
   - `BUILDKITE_TEST_ENGINE_RESULT_PATH=test-results/results.xml`

2. `bin/test` builds the solution once with `dotnet build`, then runs `bktec run`.

3. `bktec` discovers test files matching the pattern, requests a split plan from the Test Engine API, and runs `dotnet test --no-build --filter {{testFilter}} --logger junit;LogFilePath={{resultPath}}` for the files assigned to this node.

## Pipeline

The Buildkite pipeline step uses `parallelism: 2`, the [Tests plugin](https://github.com/buildkite-plugins/tests-buildkite-plugin) to install/configure `bktec`, and the [mise plugin](https://github.com/buildkite-plugins/mise-buildkite-plugin) (instead of Docker) to install the .NET SDK. `bktec` uploads JUnit XML results to Test Engine directly.

## Local development

### Prerequisites

[mise](https://mise.jdx.dev/) manages the .NET SDK:

```sh
mise install
```

### Run tests

```sh
dotnet test
```

### Run tests with JUnit XML output

```sh
dotnet test --logger "junit;LogFilePath=test-results/results.xml"
```
