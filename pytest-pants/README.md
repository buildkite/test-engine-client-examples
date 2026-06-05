# pytest + Pants

An example of running a [Pants](https://www.pantsbuild.org/) Python codebase and
reporting results to Buildkite Test Engine.

Pants owns test discovery and execution (`pants test ::`), and the
[`buildkite-test-collector`](https://pypi.org/project/buildkite-test-collector/)
pytest plugin uploads results to Test Engine. Pants runs each module's tests as
its own pytest process.

> [!NOTE]
> The Test Engine Client (`bktec`) has an experimental `pytest-pants` runner, but
> it is lightly used and requires job parallelism to be configured. This example
> instead drives Pants directly and uploads via the collector, which keeps the
> mandatory "tests run in CI" path simple while still reporting to Test Engine.

## Authentication (OIDC)

Result uploads authenticate with an ephemeral [OIDC token](https://buildkite.com/docs/test-engine/test-collection/oidc)
rather than a long-lived suite token. `bin/test` mints one with
`buildkite-agent oidc request-token` and exports it as `BUILDKITE_ANALYTICS_TOKEN`,
which the collector reads. This requires:

- an OIDC policy on the suite permitting this pipeline, and
- `mount-buildkite-agent: true` on the docker plugin (so `buildkite-agent` is
  available inside the container).

## Execution tags

[`src/conftest.py`](src/conftest.py) tags every test execution via
`pytest.mark.execution_tag(...)` so these uploads are identifiable in the shared
suite: `test.framework.name=pytest`, `test.framework.version=<version>`, and
`build.tool=pants`. Pants picks up `conftest.py` automatically through the
`python_test_utils()` target in [`src/BUILD`](src/BUILD).

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

`bin/test` installs Pants, mints an OIDC token for the suite, and runs
`pants test ::`. See [`bin/test`](bin/test) and the pipeline step in
[`.buildkite/pipeline.yml`](../.buildkite/pipeline.yml).
