# Jest

Jest with parallel jobs, retries, and a Test Scheduler pool. Copy [jest.config.js](./jest.config.js) and the test collector dependency from [package.json](./package.json).

Use the `Jest`, `Jest (Retry Enabled)`, or `Jest (Test Scheduler pool)` steps in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result, location prefix, and mise paths; remove `cd jest` for tests at the repository root. Keep the pool's token unsets for job-identity claims.

The retry step's `JEST_RETRY_DEMO_MARKER` enables a test that fails once, then passes on retry. Omit the marker and its cleanup when copying into your own test suite.

Run locally in this directory with Node from `mise.toml`: `npm install`, then `npm test`.
