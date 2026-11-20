# Checking recorded results

`verify-results.py` checks that Test Engine recorded the expected results for every example in a finished build. It's an internal release check, not a pipeline step.

```sh
export BUILDKITE_API_TOKEN=...  # read_builds and read_suites
python3 .buildkite/verify-results.py 1303
```

It counts each job's results through the Tests API, filtered by `build.id` and `build.job_id`, and compares them with [`expected-results.json`](expected-results.json). Results can take a few minutes to become queryable, so it checks every `--interval` seconds (default 60) for up to `--timeout` seconds (default 600). It checks counts, not test names.

| Line | Meaning |
| --- | --- |
| `OK` / `LATE` | Counts matched on the first check / a later check |
| `MISSING` / `MISMATCH` | At timeout, no results / different counts |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| `API ERROR`, `AUTH ERROR`, `CONFIG ERROR`, `BUILD NOT FINISHED` | Couldn't check; exit 2 |

`CONFIG ERROR` means the build's step labels don't match `expected-results.json`. When you add, rename, or change an example, update its entry from the test fixtures and confirm it against a build. Counts include every execution, so the Jest retry demo records its first failure and its passing retry, and pytest's xfail counts as skipped. `%n` combines the XCUITest shards.
