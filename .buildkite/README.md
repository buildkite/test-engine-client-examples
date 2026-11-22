# Checking recorded results

`verify-results.py` checks Test Engine results after a finished bktec or test collector release harness build, or the daily scheduled build. It's an internal check, not a pipeline step; don't run it on PR builds. Requires Python 3.9+ (stdlib only).

```sh
export BUILDKITE_API_TOKEN=...  # read_builds and read_suites
python3 .buildkite/verify-results.py 1349
```

It polls `/v2/analytics/organizations/buildkite/builds/{build_uuid}/tests?per_page=100`, summing `executions_count_by_result` across all pages (JSON arrays, `Link` pagination). Expectations are summed only for steps that started, excluding superseded retries and discovery jobs. Once every expected result count is present, or polling times out, it makes one per-job pass through the suite Tests API, filtered by `build.id` and `build.job_id`, for the per-example verdicts. It checks counts, not names.

Calls are spaced at least 1.3 seconds apart (under 50/minute). HTTP 429 retries respect `Retry-After` or the `RateLimit-User-Reset` / `RateLimit-Reset` delay. Polls wait `--interval` seconds (default 60); no new poll starts after `--timeout` (default 600). In-flight pagination and the final breakdown finish first, with a 30-second timeout per request; rate-limit retries stop at the polling deadline (or the same timeout budget during build discovery).

| Line | Meaning |
| --- | --- |
| `OK` | Per-example counts matched |
| `NOT RUN` | Expected step didn't start; reported, not failed |
| `MISSING` / `MISMATCH` | No results / counts have a deficit (possibly also an excess) |
| `DUPLICATE` | All expected counts present, with extras; fails separately from a mismatch |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| `API ERROR`, `AUTH ERROR`, `CONFIG ERROR`, `BUILD NOT FINISHED` | Couldn't check; exit 2 |

`CONFIG ERROR` means a step ran without an expectation in [`expected-results.json`](expected-results.json). Harness branches may omit examples. Data failures print recorded counts as pasteable JSON for the steps that ran; review it against fixtures before updating entries (don't replace absent examples). Counts include retries, so Jest records its first failure and passing retry; pytest's xfail is skipped. `%n` combines XCUITest shards.

`DUPLICATE` may be ingestion redelivery that collapses after ClickHouse merges; upload retries can leave permanent duplicates. Don't raise expectations just to hide it. New tests may initially read low until their Postgres records exist, which polling usually covers.
