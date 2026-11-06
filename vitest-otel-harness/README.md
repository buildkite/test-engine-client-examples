# Vitest OTel scale verification — draft only, never merge

TE-7948 production-scale replacement for dogfooding. Keep separate from the
small customer example in `vitest-otel/`. Based on closed draft #93's exact-head
packing, stock-export observation, proof IDs, byte caps and independent stored
result/trace verification. `collector.sha` is an exact collector source commit,
not an npm tag. JSON always uses the separately installed released **1.13.0**
alias, even after the OTel package is replaced by the packed commit.

## Workload and local checks

```sh
bash install-collector
HARNESS_MODE=json node local.mjs
HARNESS_MODE=direct node local.mjs
HARNESS_MODE=direct HARNESS_POOL=threads node local.mjs
```

Thirty generated files register 1,650 executed tests: 1,500 pass, 150 deliberate
large CJK failures. Another 30 tests are inside skipped suites: **1,680 total
stored executions**, separately accounting for skipped tests that never run.
Each file has an import-time manual tracer, manual `beforeEach`/body/`afterEach`
spans, named ESM `node:http` client → in-process server → handler spans, fetch,
and a concurrent manual child. Empty tests and `beforeAll` are negative controls.
For collector 1.14.0, the expected export is **1,680 roots + 570 children**:
420 rich/concurrent children plus one error callback phase per deliberate
failure. Each failing callback must have error status and one exception event
with the exact thrown type/message. Native phases are retained if they have a
child, error status or events; truly empty phases must still be absent. This is
270 retained phases, versus 120 before error/event-only retention. A local
receiver checks real HTTP request bytes, but does not prove production ingestion.

`run.mjs` checks exact names/statuses and execution proof lines, parent-only
exports, callback/root trace identity, every child ancestry, empty-phase absence,
no JSON fallback, actual 2xx responses and ≤750 KiB/1,000-span requests. It saves
all collector warnings verbatim before failing. A green wrapper does not make
intentional failures green in Test Engine. `relay.mjs` preserves the real Vitest
failure through bktec and succeeds only after verification and zero-drop stats.
No collector workaround or upload-cap override is permitted.

## Production and performance

The branch-only pipeline job packs the collector, then runs JSON, direct OTLP,
bktec **3.5.0** with batching, and performance **sequentially on one agent**.
Existing suite-scoped OIDC is used; no suite, secrets or pipeline settings need
changing. bktec's command omits CLI `--reporter` options, which would replace the
collector config. `run.mjs` invokes Vitest with only `run --outputFile`.

Performance runs three alternating-order JSON/OTel pairs for each pool and
workload size. Both sizes have 30 files and identical rich/concurrent children;
small is 330 executed + 30 skipped, large is 1,650 + 30. Error callback children
scale with deliberate failures: 30 small / 150 large, on top of 420 rich children.
The per-test estimate is
`(large OTel−JSON delta − small OTel−JSON delta) / 1320`; fixed is
`small delta − 330 × per-test`. This is a two-point estimate, not a profile:
failure serialization/upload grows with test count, and fixed includes the
constant rich children and file setup. Negative estimates indicate noise, not
negative work. Report raw rows/medians, including negative values, not only the
fit. No test-cost thresholds are imposed.

Metrics: `vitestMs` is Vitest's own default reporter Duration; `runnerWallMs`
includes process startup and shutdown/export drain; `jobSegmentWallMs` also
includes the verifier and proof logging. `HARNESS_JOB_WALL` measures the complete
measurement job excluding install. Buildkite started/finished timestamps are the
independent full job wall time including install. Installs are not misreported
as test overhead. All raw rows are in `tmp/performance.json`.

## Independent stored proof (required before acceptance)

Successful exports/HTTP 200 do not prove storage (#93 found silent downstream
loss this way). Using connected Buildkite read tools, enumerate
`list_tests_for_build` at 100/page with the exact build UUID and `harness.run`
tag. Follow every next link: each large mode needs 17 pages (16×100 + 80),
1,680 unique IDs/names, one execution each, 1,500 passed/150 failed/30 skipped,
no missing/unknown/duplicate names and matching statuses. Keep modes separate;
performance runs use distinct run keys and tags. Confirm each mode's Test Engine
run ID via build runs/failed executions. Never add read credentials to CI.

Sample execution IDs from `slowest_executions_for_build` and paged
`get_failed_executions`, then use `read_execution_trace` to compare proof IDs and
every returned span ID/parent/name/scope/kind. This API returns only ten slowest
spans, even when `span_count` is larger. Neither that endpoint nor the
slowest-100 execution list can establish exhaustive tree coverage. Check
failure traces too: release 1.14.0 requires two spans (root plus error callback),
not the earlier root-only tree. Stored display labels can have leading whitespace;
IDs and parents must still match exactly.

`audit.sql` audits all roots, per-test child counts against the verified export
contract, parents, orphans and empty phases for both exact build-1088 OTel run
IDs. Matt runs it read-only after checking the production schema with DESCRIBE;
production SQL has not run. Query behavior was validated with real local export
fixtures in ClickHouse and a missing-child negative control. No CI read secrets.

## Measured evidence

[Full counts, request sizes, sampled stored edges, performance and limitations](https://ampcode.com/artifacts/te-7948-vitest-scale-harness-evidence-2072ebd7-bbb8-4c60-8028-5c113290b2f3).
[Build 1088](https://buildkite.com/buildkite/test-engine-client-examples/builds/1088)
passed on the rebased `c604e8f1` collector. Direct and relay each stored the exact
1,680 executions across 17 pages. JSON's same exact results were independently
found through suite-wide tag/time pagination, but were not returned by the
build-scoped API query after ten minutes. Report this JSON-path association gap
separately; do not attribute it to OTel or invent missing results.

Safe JSON response metadata is recorded without enabling collector debug logs,
which contain Authorization headers. To repeat only one ingestion mode, set
`HARNESS_ONLY=json` (or `direct`/`relay`) on a new build; otherwise all modes and
paired timings run. Results on initial collector `18366b44` were rehearsals only.
Do not merge or mark this PR ready, publish packages or post in Slack.
