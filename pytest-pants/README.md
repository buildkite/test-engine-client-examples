# pytest + Pants

An example of running a [Pants](https://www.pantsbuild.org/) Python codebase
with the Buildkite Test Engine Client (`bktec`) using the `pytest-pants` test
runner.

With this runner, Pants owns test discovery and execution: `bktec` runs a
`pants test` command and reads the merged results that the
[`buildkite-test-collector`](https://pypi.org/project/buildkite-test-collector/)
pytest plugin writes. Because Pants selects the targets, `bktec` does not split
test files across parallel jobs.

## Project layout

The codebase is split into several small Pants targets that exercise different
dependency relationships. Pants infers these edges automatically from the
`import` statements (no manual dependency lists in the `BUILD` files):

```diagram
  textutils        (independent — no internal dependencies)

  calc  ◀─────  geometry  ◀─────  report
  (leaf)        (1st level)       (2nd level, transitively needs calc)
```

| Module                 | Depends on            | Role                         |
| ---------------------- | --------------------- | ---------------------------- |
| `src/calc`             | —                     | Leaf / non-dependent target  |
| `src/geometry`         | `calc`                | First-level dependency       |
| `src/report`           | `geometry` (→ `calc`) | Second-level (transitive)    |
| `src/textutils`        | —                     | Independent target           |

Each module has a `BUILD` file declaring `python_sources()` and
`python_tests()`, source plus `*_test.py` tests, and is run by Pants as its own
pytest process.

## Running locally

Install Pants (once): https://www.pantsbuild.org/stable/docs/getting-started/installing-pants

```sh
# Run every test target
pants test ::

# Inspect the inferred dependency graph
pants dependencies --transitive src/report/summary.py

# Regenerate the lockfile after changing 3rdparty/python/pytest-requirements.txt
pants generate-lockfiles
```

## Running in CI

`bin/test` installs Pants and `bktec`, then runs:

```sh
export BUILDKITE_TEST_ENGINE_TEST_RUNNER=pytest-pants
export BUILDKITE_TEST_ENGINE_TEST_CMD='pants test :: -- --json={{resultPath}} --merge-json'
./bktec run
```
