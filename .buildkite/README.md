# Checking recorded results

`verify-results.py` checks Test Engine results after a finished bktec or test collector release harness build, or the daily scheduled build. It's an internal check, not a pipeline step; don't run it on PR builds. Requires Python 3.9+ (stdlib only).

```sh
export BUILDKITE_API_TOKEN=...  # read_builds and read_suites
python3 .buildkite/verify-results.py 1349
```

It polls the suite Tests API with `tags=build.id:<uuid>`, `min_timestamp=<build created_at>` and `per_page=100`, summing `executions_count_by_result` across all pages (JSON arrays, `Link` pagination). No fixed upper bound is sent: uploads received after the build finished must remain visible. Expectations cover present steps, excluding superseded retries and discovery jobs. It checks counts, not names.

Once aggregate counts are sufficient, or polling times out, it reads each job using the same query plus `build.job_id`. Totals can include superseded attempts, so they only trigger this breakdown: examples with deficits are rechecked at `--interval` seconds (default 60) within the remaining `--timeout` budget (default 600). All shards of a deficient example are refreshed; other examples are not reread.

Calls are spaced at least 1.3 seconds apart (under 50/minute). HTTP 429 retries respect `Retry-After`, otherwise the reset delays of exhausted limiters (`*-Remaining: 0`), falling back to available resets or 60 seconds for incomplete headers. No new poll or deficit recheck starts after the deadline. In-flight pagination and the initial breakdown finish first; requests time out after 30 seconds. Rate-limit retries stop at the deadline (or the same timeout budget during build discovery).

| Line | Meaning |
| --- | --- |
| `OK` | Per-example counts matched |
| `NOT RUN` | Expected step has no job in the build; reported, not failed |
| `MISSING` / `MISMATCH` | No results / counts have a deficit (possibly also an excess) |
| `DUPLICATE` | All expected counts present, with extras; fails separately from a mismatch |
| `PASS` / `FAIL` | Exit 0 / exit 1 |
| `API ERROR`, `AUTH ERROR`, `CONFIG ERROR`, `BUILD NOT FINISHED`, `BUILD INCOMPLETE` | Couldn't check; exit 2 |

`CONFIG ERROR` means a step ran without an expectation in [`expected-results.json`](expected-results.json). Harness branches may omit examples, but present jobs that never started (including dependency-failed, canceled, expired or skipped jobs), or zero examples to check, are `BUILD INCOMPLETE`, not a pass. Data failures print recorded JSON; review against fixtures before updating entries (don't replace absent examples). Counts include test retries, so Jest records its first failure and passing retry; pytest's xfail is skipped. `%n` combines XCUITest shards.

`DUPLICATE` may be ingestion redelivery that collapses after ClickHouse merges; upload retries can leave permanent duplicates. Don't raise expectations just to hide it. New tests may initially read low until their Postgres records exist, which polling usually covers.
