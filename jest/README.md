# Jest

Split Jest tests across parallel jobs with bktec. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Jest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Two more steps build on it:

- `Jest (Retry Enabled)` retries failed tests with bktec. Remove `JEST_RETRY_DEMO_MARKER` and its `rm` line, which make a demo test fail once.
- `Jest (Test Scheduler pool)` runs batches from a pool shared by the step's jobs.

## Test collector

Add `buildkite-test-collector` and keep the reporter and `testLocationInResults` from [jest.config.js](./jest.config.js). See [Jest](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-jest).

## Run locally

Use Node from `mise.toml` in this directory:

```bash
npm install
npm test
```
