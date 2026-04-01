# NUnit

A .NET NUnit example demonstrating [Buildkite Test Engine](https://buildkite.com/docs/test-engine) test splitting using `bktec` with a custom runner.

Since `bktec` doesn't have built-in NUnit support, this example uses `BUILDKITE_TEST_ENGINE_TEST_RUNNER=custom` to split test files across parallel agents and map them to `dotnet test --filter` expressions.

## Structure

```
bin/test              # Entry point: builds, installs bktec, configures custom runner
bin/run-tests         # Custom runner invoked by bktec with test file paths
src/MyLib/            # Library under test
tests/MyLib.Tests/    # NUnit test project (25 tests across 3 files)
mise.toml             # .NET SDK managed by mise
NUnitSpike.slnx       # Solution file
```

## How it works

1. `bin/test` builds the solution, installs `bktec`, and configures:
   - `BUILDKITE_TEST_ENGINE_TEST_RUNNER=custom`
   - `BUILDKITE_TEST_ENGINE_TEST_FILE_PATTERN=tests/**/*Tests.cs`
   - `BUILDKITE_TEST_ENGINE_TEST_CMD="bin/run-tests {{testExamples}}"`

2. `bktec` discovers test files matching the pattern, requests a split plan from the Test Engine API, and invokes `bin/run-tests` with the files assigned to this node.

3. `bin/run-tests` receives `.cs` file paths as arguments, extracts class names, and builds a `dotnet test --filter` expression to run only those test classes.

## Pipeline

The Buildkite pipeline step uses `parallelism: 2` and the [mise plugin](https://github.com/buildkite-plugins/mise-buildkite-plugin) (instead of Docker) to install the .NET SDK. The [test-collector plugin](https://github.com/buildkite-plugins/test-collector-buildkite-plugin) uploads JUnit XML results to Test Engine.

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
