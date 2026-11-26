# Playwright

Split Playwright tests across parallel jobs with bktest. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Playwright` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step).

For Test Scheduler, copy `Plan Playwright pool` and [pool-workers.yml](./pool-workers.yml), then [adapt the pair](../README.md#adapt-a-test-scheduler-pool). `bktest pool run` starts a fresh Playwright process for each batch.

## Test collector

Add `buildkite-test-collector` and keep both reporters from [playwright.config.js](./playwright.config.js): the collector's reporter uploads results, and the JSON reporter writes the file bktest reads. See [Playwright](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-playwright).

## Run locally

Use Node from `mise.toml` in this directory:

```bash
npm install
npx playwright install --with-deps chromium
npm test
```
