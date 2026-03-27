# NUnit Spike

A minimal NUnit test suite for exploring test splitting, test selection, and related tooling.

## Structure

```
src/MyLib/            # Library under test
  Calculator.cs       # Basic arithmetic
  StringUtils.cs      # String helpers (reverse, palindrome, word count)
  Collections.cs      # Simple generic stack

tests/MyLib.Tests/    # NUnit test project
  CalculatorTests.cs  # 9 tests (incl. parameterized TestCase)
  StringUtilsTests.cs # 9 tests (incl. parameterized TestCase)
  SimpleStackTests.cs # 7 tests
```

25 tests total.

## Prerequisites

[mise](https://mise.jdx.dev/) manages the .NET SDK:

```sh
mise install
```

## Run tests

```sh
dotnet test
```

## Run tests with JUnit XML output

```sh
dotnet test --logger "junit;LogFilePath=test-results/results.xml"
```

Results are written to `tests/MyLib.Tests/test-results/results.xml`.
