# Customer-shaped Jest OTel harness

Draft [examples#93](https://github.com/buildkite/test-engine-client-examples/pull/93)
prepares the 1.13.0 stable production check. `collector.sha` pins the candidate
`d374d6052c97beb1ec12076ec501888679dae6ad`. `bash run` packs that exact Git
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

The split unit `nock.test.js` includes `plain.case.js` in the same runInBand
process. A sequencer puts them consecutively; proofs verify their order and
PID. The lifecycle split unit additionally runs `hook.case.js` separately,
requiring exit 1 and the exact expected hook failure. It still exports and
counts that failed root. It is not soft-failed, converted to a pass or exposed
to bktec's retry logic; unexpected failures fail the job.

## Automatic versus stored verification

`verify.js` observes successful callbacks from the real OTLP exporter without
changing its destination. It compares Jest's JSON attempt counts, root IDs,
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
