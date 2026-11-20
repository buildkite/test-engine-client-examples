# Checking recorded results

This internal release check is deliberately **not a pipeline step**. After an
examples build finishes, run it with Python 3 and an existing
`BUILDKITE_API_TOKEN` in your environment. The token needs `read_builds` and
`read_suites`, with access to the `buildkite` organization, this pipeline, and
the `test-engine-client-examples` suite. The script creates or stores no credentials.

```sh
python3 .buildkite/verify-results.py 1303
python3 .buildkite/verify-results.py 1303 --timeout 900 --interval 60
```

No arguments prints usage. The default timeout is 600 seconds, including API
requests, with 60 seconds between polls. Uploads can take several minutes to
become queryable; slow ingestion can outlast even this timeout. An expired token
is an authentication error, not missing data.

The script maps build job IDs to example labels, then sums the Tests API's
`executions_count_by_result` filtered by `build.id` and `build.job_id`. It follows
pagination, combines parallel shards, and excludes superseded job retries.
It checks counts, not test identities or Test Engine run state. Framework tags
and location prefixes cannot distinguish all the variants in the shared suite.

`OK` means matched on the first poll; `LATE` means matched after polling.
At timeout, `MISSING` means no results (or no jobs) for an example, and `MISMATCH`
means some results arrived but the counts differ. `API ERROR`/`AUTH ERROR` means
the counts could not be checked. Exit status is 0 for all matched (including
late), 1 for missing/mismatched counts, and 2 for API/auth/configuration errors.
Elapsed time includes HTTP requests; it is not an ingestion-lag measurement.

Expected totals live in [`expected-results.json`](expected-results.json), keyed
by pipeline label (`%n` combines the XCUITest shards). Update them when changing
fixtures or labels, using test intent as well as recorded data. They were
cross-checked by job against main builds
[1303](https://buildkite.com/buildkite/test-engine-client-examples/builds/1303) and
[1297](https://buildkite.com/buildkite/test-engine-client-examples/builds/1297).
Counts include the Jest retry demo's first failure and successful retry,
Jest's pending retry demo in ordinary/pool runs, and pytest's xfail as skipped.
New unrecognized command steps cause a configuration error rather than silently
escaping verification. Only pipeline upload and the two discovery steps are ignored.
