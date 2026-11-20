# Jest

Run Jest across parallel jobs with bktec and send results to Test Engine with the JavaScript test collector.

## Pipeline

```yaml
steps:
  - label: ":jest: Jest"
    parallelism: 2
    commands:
      - npm install
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: jest
          result-path: jest-result.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads results, so `upload-results: false` disables bktec's result upload. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite to allow your pipeline to authenticate.

See `Jest`, `Jest (Retry Enabled)`, and `Jest (Test Scheduler pool)` in [pipeline.yml](../.buildkite/pipeline.yml). Keep the pool's token unsets for job-identity claims. The retry demo's marker makes our fixture fail once; omit that marker and its cleanup from your own test suite.

## Test collector

Add `buildkite-test-collector` to your dependencies and keep the reporter and `testLocationInResults` setting from [jest.config.js](./jest.config.js). The reporter sends results; the location setting adds source links.

## Run locally

Use Node from `mise.toml` and run these commands in this directory:

```bash
npm install
npm test
```
