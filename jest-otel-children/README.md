# Customer-shaped Jest OTel harness

Draft [examples#93](https://github.com/buildkite/test-engine-client-examples/pull/93)
prepares the 1.13.0 production check. `collector.sha` pins the candidate
`021e1c8a6a2a0c57a46e374f5bec68907d902d9e`. `bash run` packs that exact Git
commit, installs it without publishing or resolving npm tags, and runs the
selected control. Do not merge this verification pin as a released example.

## Execution and setup

The pipeline runs:

- Two parallel `bktec run` jobs, using the Tests plugin, file splitting,
  `upload-results: false`, and bktec 3.5.0's OTLP relay **with batching**.
  Both use `${BUILDKITE_BUILD_ID}-jest-otel-relay` as their run key.
- One complete direct-export OTel control, with no relay or bktec.
- One complete JSON-reporter control, with no OTel environment/runtime.
- A dependent verification step that downloads the job artifacts, checks
  split coverage/attempt counts and prints `OTEL_TIMING_COMPARISON`.

Only existing suite-scoped short-lived OIDC credentials are used. No read
credentials or new secrets are added. No bktec JSON upload duplicates OTel
executions. The JSON control uses its own run key.

The main Jest projects use their own plain environments: Node leaves Jest's
default unchanged, jsdom uses `jsdom`, and happy-dom uses
`@happy-dom/jest-environment`. OTel setup is only the collector reporter with
`otelEnabled: true` plus `runtime: 'buildkite-test-collector/jest/runtime'`.
There are no `extend()` adapters or collector-environment projects. The pg
file runs in the plain Node project, with unchanged counts and ancestry.
The JSON control disables OTel and uses plain environments in all projects.

The npm project declares SDK `sdk-trace-base@^2`, `context-async-hooks@^2`
and `exporter-trace-otlp-proto@<0.300`. npm installs their API peer dependency;
pnpm or Yarn projects should also declare `@opentelemetry/api@~1.9.0`.

## Cases and exact child expectations

There are 17 tests and 18 OTel attempt roots per complete run. The retry
exports one failed and one passed attempt. Children exclude `test.execution`:

| Case | Children per attempt | Parent paths |
| --- | ---: | --- |
| Direct Express | 5 | test → HTTP client → server → three Express operations |
| Mapped Express (`moduleNameMapper`) | 5 | Same, including all three Express operations |
| GraphQL async resolver | 4 | parse/validate/query under test; resolver under query |
| Redis connect/SET/GET | 3 | Three direct children of test |
| HTTP/manual round trip | 3 | test → manual → HTTP client → server |
| Native fetch round trip | 2 | test → undici client → HTTP server |
| pg connect/query | 2 | connect and SELECT query directly under test |
| Nock-intercepted request | 1 | Exactly one HTTP client under test |
| Plain file after nock | 2 | test → HTTP client → server |
| `test.each` (two rows) | 1 each | Manual operation under its own root |
| `jest.retryTimes` (two attempts) | 1 each | Manual operation under each distinct attempt root |
| `test.concurrent` (two cases) | 1 each | Manual operation under its own root |
| jsdom React Testing Library | 3 | test → manual → HTTP client → server |
| happy-dom React Testing Library | 3 | Same |
| Failing `beforeAll` | 0 | Failed root; test body never executes |

Total: **18 roots + 39 children = 57 spans** through the relay, and another
57 through the independent direct control. JSON stores final test results,
not OTel spans or intermediate retry attempts.

The Redis RESP and PostgreSQL wire peers are deterministic in-process
protocol servers, **not real database services**. They exercise real clients,
sockets, parsing and instrumentation. DOM tests use a React button, RTL,
`cross-fetch` and an in-process HTTP server. Browser rendering is not claimed;
the existing Node project separately exercises native fetch/undici.

The normal cases use `--maxWorkers=2`; proofs require at least two actual
worker PIDs, distinct from the uploading parent. The split unit `nock.test.js`
additionally runs `plain.case.js` in a separate, small `--runInBand` control.
A sequencer puts those files consecutively; proofs verify their order and
PID. Its JSON report is combined with the worker report for bktec.
The lifecycle split unit additionally runs `hook.case.js` separately,
requiring exit 1 and the exact expected hook failure. It still exports and
counts that failed root. It is not soft-failed, converted to a pass or exposed
to bktec's retry logic; unexpected failures fail the job.

## Automatic versus stored verification

`verify.js` preloads its observer in the parent Jest process and workers via
`NODE_OPTIONS`. It observes successful callbacks from the stock OTLP exporter
without changing its destination, records the exporter PID and requires every
upload to come from a parent reporter, never a worker. An Axios request guard
rejects any JSON result upload in OTel mode. It compares Jest's JSON attempt counts, root IDs,
result statuses and complete child operation/scope/kind/parent paths. Every
test root must report collector attribute and scope version `1.13.0`. Missing,
extra, duplicate or misparented children, duplicate roots, changed retry
counts, unexpected collector warnings and JSON upload errors fail the job.
Active-span proofs require the non-recording test-span wrapper; its IDs must
still match the exported test root. Exact ancestry checks are independent of
export order, including concurrent child/test flushes at teardown.
The hook never reaches a test body, so its root is identified in the export
and checked against the failed Jest assertion rather than an active-span log.
`OTEL_PROOF` and `OTEL_EXPORT_VERIFIED` contain no credentials.

`runRelay.js` requires bktec's zero-drop report and batching upload counts.
The aggregate step checks both nonempty shards cover the complete direct
control exactly once and use the same run key. Timings measure Jest plus
export/verification, excluding dependency setup; split wall time is the
maximum shard duration, not an equal-parallelism performance benchmark.

**Successful exports and a shared run key do not prove backend storage.**
After each production run, independently list executions and fetch every
stored trace using the connected Buildkite read tools. Require 18 executions
and 57 spans in one relay run, all matching the artifact proof roots and exact
ancestry; repeat for the direct control. Check both retry attempts and the
expected hook failure. CI does not have read credentials for those APIs.
Keep the stored results in the thread's evidence report, not inferred from a
green build. `tmp/<mode>-<shard>/` artifacts retain proofs, exports, reports,
relay logs and timings for that comparison.

With Node 24.19.0 from `mise.toml`, run `bash run` in this directory. Direct
OTel needs `BUILDKITE_TESTS_OTLP_TOKEN` and a run key. Relay mode
(`OTEL_PROOF_MODE=relay`) needs bktec and Buildkite's job/OIDC context; use the
pipeline for production planning, batching and storage verification.

## Large-batch ingestion controls

Two additional, unsplit jobs run the same separate `large-batch/` project:
`OTEL_PROOF_MODE=large-direct` exports directly to production, and
`large-relay` uses bktec 3.5.0 with relay batching and `upload-results: false`.
Each uses two real Jest workers, one file of 1,500 passing tests and one of
150 intentionally failing tests with large, repetitive CJK exception messages.
The original jobs, discovery patterns and assertions remain unchanged.

The parent preload observes each real stock exporter call, measures its
uncompressed protobuf using that exporter's serializer, and correlates actual
HTTP responses through async context. It requires at most 1,000 test spans
and 750 KiB per upload, at least one upload of 550 KiB or more, and only 2xx
responses. It checks all 1,650 distinct active roots against exports, statuses,
collector versions and parent/worker PIDs, retaining the existing JSON guard.
The 750 KiB cap can split even 1,000 passing spans when CI metadata makes them
too large; this fixture does not strip metadata or override the collector cap
to force a full 1,000-span upload.

Expected failures are not converted into passes or soft-failed: the direct
verifier requires precisely 1,500 passes and 150 named failures. The relay
wrapper additionally requires bktec to report those failures, the verifier's
success marker, batching and zero permanent/deadline/byte drops, with no
collector warnings or HTTP 413/429. Artifacts under `tmp/large-{direct,relay}/`
contain every exported ID, proof, upload size/response, actual failed Jest
report and relay log. Builds fail on any mismatch.

HTTP success does not prove ingestion: independently verify each production
run stores exactly 1,650 executions (1,500 passed, 150 failed), one execution
per distinct test. Use the job's `large-batch.build` and `large-batch.mode`
execution tags with the connected Test Engine read tools; keep read secrets
out of CI. The evidence report includes both stored run IDs and deferred
ClickHouse SQL, beginning with `DESCRIBE TABLE test_engine_otel.otel_spans`.
