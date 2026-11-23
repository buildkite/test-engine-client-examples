# Check recorded results

The daily `main` build checks per-example Test Engine counts. For release testing, create a Buildkite API or UI build with `VERIFY_RESULTS=true` (and `BKTEST_VERSION` to test another bktest release). Read the **Verify Test Engine results** step. PR builds skip it.

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
