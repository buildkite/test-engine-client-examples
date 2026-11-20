# Playwright

Split Playwright tests across parallel jobs with bktec. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Playwright` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). The `Playwright (Test Scheduler pool)` step runs batches from a pool shared by the step's jobs.

## Test collector

Add `buildkite-test-collector` and keep both reporters from [playwright.config.js](./playwright.config.js): the collector's reporter uploads results, and the JSON reporter writes the file bktec reads. See [Playwright](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-playwright).

## Run locally

Use Node from `mise.toml` in this directory:

```bash
npm install
npx playwright install --with-deps chromium
npm test
```
