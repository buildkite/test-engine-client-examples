# Check recorded results

Check Test Engine result counts after a finished release-harness or daily build, not a PR build. Requires Python 3.9+ with no extra packages.

```sh
export BUILDKITE_API_TOKEN=...  # read_builds and read_suites
python3 .buildkite/verify-results.py 1349
```

`--timeout` sets the polling budget in seconds (default 600); `--interval` sets the wait between checks (default 60). The final check can outlast the budget. Requests stay under 50/minute and retry HTTP 429.

## Output

| Line | Meaning |
| --- | --- |
| `OK` | Counts match for this example |
| `NOT RUN` | Step absent from this build; doesn't fail the check |
| `MISSING` / `MISMATCH` | No results / too few results of an expected type |
| `DUPLICATE` | All expected results plus extras; fails the check |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| Other errors | Couldn't verify; exit 2 |

Unstarted jobs, builds with no examples, and unknown steps are errors. Counts include test retries and combine parallel shards, but exclude superseded job attempts. This checks counts, not test names.

On failure, review the printed JSON against the fixtures before editing [expected-results.json](expected-results.json). Don't raise expectations to hide duplicates.
