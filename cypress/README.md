# Cypress

Cypress with parallel jobs. Copy [cypress.config.js](./cypress.config.js) and the test collector dependency from [package.json](./package.json).

Use the `Cypress` step in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, config, and mise paths; remove `cd cypress` for tests at the repository root. Adapt [bin/setup](./bin/setup)'s Linux packages to your agent image.

Run locally in this directory with Node from `mise.toml` and Cypress's system dependencies installed: `npm install`, `npx cypress install`, then `npm test`.
