# Check recorded results

The daily `main` build checks Test Engine results. For release testing, set `VERIFY_RESULTS=true` in a new Buildkite API or UI build (and `BKTEST_VERSION` to test another bktest release), then read **Verify Test Engine results**. PR builds skip it.

The step uses a [Buildkite workload identity](https://buildkite.com/docs/apis/workload-identity-federation/buildkite-agents) scoped to the examples pipeline and suite, with `read_builds`, `read_suites`, and `read_build_logs`.

You can also check a finished build directly (Python 3.9+):

```sh
export BUILDKITE_API_TOKEN=...  # read_builds, read_suites, and read_build_logs
python3 .buildkite/verify-results.py 1349
```

| Line | Meaning |
| --- | --- |
| `OK` | Counts match for this example |
| `NOT RUN` | Expected step absent; fails the check |
| `FALLBACK` | A pool worker used a local split instead of Test Scheduler; fails the check |
| `MISSING` / `MISMATCH` | No results / too few results of an expected type |
| `DUPLICATE` | All expected results plus extras; fails the check |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| Other errors | Couldn't verify; exit 2 |

Review printed JSON against the fixtures before updating [expected-results.json](expected-results.json); don't raise counts to hide duplicates.
