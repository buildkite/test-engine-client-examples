# Jest

Split Jest tests across parallel jobs with bktest. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Jest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Two more examples build on it:

- `Jest (Retry Enabled)` retries failed tests with bktest. Remove `JEST_RETRY_DEMO_MARKER` and its `rm` line, which make a demo test fail once.
- For Test Scheduler, copy `Plan Jest pool` and [pool-workers.yml](./pool-workers.yml), then [adapt the pair](../README.md#adapt-a-test-scheduler-pool). `bktest pool run` starts a fresh Jest process for each batch.

## Test collector

Add `buildkite-test-collector` and keep the reporter and `testLocationInResults` from [jest.config.js](./jest.config.js). See [Jest](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-jest).

## Run locally

Use Node from `mise.toml` in this directory:

```bash
npm ci
npm test
```
