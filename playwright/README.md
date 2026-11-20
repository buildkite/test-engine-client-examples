# Playwright

Run your Playwright tests across parallel jobs with bktec while the JavaScript test collector sends results to Test Engine.

## Pipeline

```yaml
steps:
  - label: ":playwright: Playwright"
    parallelism: 2
    commands:
      - npm install
      - npx playwright install --with-deps chromium
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: playwright
          result-path: tmp/playwright-results.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate.

See `Playwright` and `Playwright (Test Scheduler pool)` in [pipeline.yml](../.buildkite/pipeline.yml) for our CI steps. Keep the pool's token unsets: pools need job-identity claims that the plugin's token lacks.

## Test collector

Add `buildkite-test-collector` to your dependencies and copy the reporters from [playwright.config.js](./playwright.config.js). Keep both the test collector reporter for uploads and the JSON reporter for bktec to read. Set `testDir` to your test directory.

## Run locally

Use Node from `mise.toml` and run these commands in this directory:

```bash
npm install
npx playwright install --with-deps chromium
npm test
```
