# Check recorded results

The daily `main` build checks per-example Test Engine counts. For release testing, create a Buildkite API or UI build with `VERIFY_RESULTS=true` (and `BKTEST_VERSION` to test another bktest release). Read the **Verify Test Engine results** step. It waits for the uploaded pool workers and checks their combined results, not the planners. PR builds skip it.

The step sets the verifier's [workload identity](https://buildkite.com/docs/apis/workload-identity-federation/buildkite-agents) Client ID and uses the Buildkite organization's default OIDC audience. Restrict the identity to the `verify-results` step on trusted branches of `bktest-examples`. Give it only `read_builds`, `read_suites`, and `read_build_logs` as its default and grantable scopes, with access limited to the examples pipeline and suite.

You can also check a finished build directly (Python 3.9+):

```sh
export BUILDKITE_API_TOKEN=...  # read_builds, read_suites, and read_build_logs
python3 .buildkite/verify-results.py 1394
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
