# Playwright

Playwright with parallel jobs and a Test Scheduler pool. Copy [playwright.config.js](./playwright.config.js) and the test collector dependency from [package.json](./package.json).

Use the `Playwright` or `Playwright (Test Scheduler pool)` steps in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector uploads results. Keep the JSON reporter for bktec's local result file.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, result, location prefix, and mise paths; remove `cd playwright` for tests at the repository root. Keep the pool's token unsets for job-identity claims.

Run locally in this directory with Node from `mise.toml`:

```sh
npm install
npx playwright install --with-deps chromium
npm test
```
