# Vitest 4

Vitest 4 with the Test Engine Client (bktec). Copy [vitest.config.js](./vitest.config.js) and the dependencies from [package.json](./package.json).

Use the `Vitest 4` step in [pipeline.yml](../.buildkite/pipeline.yml), which uses `bktec run`. The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector uploads results. Keep the explicit `test-cmd` and `retry-cmd` so CLI reporter flags do not replace the test collector reporter.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result, location prefix, and mise paths; remove `cd vitest-4` for tests at the repository root.

Run locally in this directory with Node from `mise.toml`: `npm ci`, then `npm test`.
