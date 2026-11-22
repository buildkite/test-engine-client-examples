# Check recorded results

Check per-example Test Engine result counts after a finished release-harness or daily build, not a PR build (Python 3.9+).

```sh
export BUILDKITE_API_TOKEN=...  # read_builds and read_suites
python3 .buildkite/verify-results.py 1349
```

| Line | Meaning |
| --- | --- |
| `OK` | Counts match for this example |
| `NOT RUN` | Step absent from this build; doesn't fail the check |
| `MISSING` / `MISMATCH` | No results / too few results of an expected type |
| `DUPLICATE` | All expected results plus extras; fails the check |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| Other errors | Couldn't verify; exit 2 |

Review printed JSON against the fixtures before updating [expected-results.json](expected-results.json); don't raise counts to hide duplicates.
